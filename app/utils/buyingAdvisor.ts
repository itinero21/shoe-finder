/**
 * BUYING ADVISOR — "Your Ghost has 90km left. Based on your history, buy one of these 3."
 *
 * Not random recommendations. Based on:
 * - shoes they loved (rating, would_buy_again)
 * - shoes they abandoned (low mileage)
 * - injury history
 * - terrain, width, budget
 * - current market shoes
 * - what the scoring engine says for their profile
 */

import { Shoe, SHOES } from '../data/shoes';
import { LivingShoe, ShoeMemorial } from '../types/character';
import { QuizAnswers, getRecommendations, ScoredShoe } from './scoring';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUIZ_KEY = 'stride_quiz_answers_v1';

export interface BuyingRecommendation {
  shoe: ScoredShoe;
  reason: string;
  basedOn: string; // "similar to Ghost 18 which you loved" etc.
}

/**
 * When a shoe is dying, recommend replacements based on the user's full history.
 */
export async function getReplacementRecommendations(
  dyingShoe: LivingShoe,
  dyingShoeData: Shoe,
  memorials: ShoeMemorial[],
  livingShoes: LivingShoe[],
): Promise<BuyingRecommendation[]> {
  // Load saved quiz answers
  let quizAnswers: QuizAnswers | null = null;
  try {
    const raw = await AsyncStorage.getItem(QUIZ_KEY);
    if (raw) quizAnswers = JSON.parse(raw);
  } catch { /* no answers */ }

  // If no quiz answers, build a profile from the dying shoe's characteristics
  if (!quizAnswers) {
    quizAnswers = inferProfileFromShoe(dyingShoeData);
  }

  // Get scored recommendations from the engine
  const recs = getRecommendations(quizAnswers, SHOES);

  // Filter out shoes already in the closet
  const closetIds = new Set(livingShoes.map(c => c.shoeId));
  const filtered = recs.filter(r => !closetIds.has(r.id));

  // Boost shoes similar to ones the user loved
  const lovedBrands = new Set<string>();
  const lovedCategories = new Set<string>();
  for (const m of memorials) {
    if (m.rating >= 4 && m.wouldBuyAgain) {
      const shoe = SHOES.find(s => s.id === m.shoeId);
      if (shoe) {
        lovedBrands.add(shoe.brand);
        lovedCategories.add(shoe.category);
      }
    }
  }

  // Score and rank
  const recommendations: BuyingRecommendation[] = filtered.slice(0, 8).map(shoe => {
    let basedOn = '';

    // Same brand as dying shoe
    if (shoe.brand === dyingShoeData.brand) {
      basedOn = `Same brand as your ${dyingShoeData.model}`;
    }
    // Same category
    else if (shoe.category === dyingShoeData.category) {
      basedOn = `Similar category to your ${dyingShoeData.model}`;
    }
    // Brand the user loved before
    else if (lovedBrands.has(shoe.brand)) {
      const loved = memorials.find(m => {
        const s = SHOES.find(s2 => s2.id === m.shoeId);
        return s?.brand === shoe.brand && m.rating >= 4;
      });
      basedOn = loved ? `You loved the ${loved.brand} ${loved.model}` : `Brand you've rated highly`;
    }
    // Category the user loved
    else if (lovedCategories.has(shoe.category)) {
      basedOn = 'Similar style to shoes you rated highly';
    }
    else {
      basedOn = `Top match for your running profile`;
    }

    return {
      shoe,
      reason: shoe.reasons[0] ?? 'Strong match for your profile',
      basedOn,
    };
  });

  return recommendations.slice(0, 3);
}

/**
 * Infer a basic quiz profile from a shoe's characteristics
 * (used when no quiz answers are saved)
 */
function inferProfileFromShoe(shoe: Shoe): QuizAnswers {
  const isTrail = shoe.use_cases.some(u => u.startsWith('trail'));
  const isStability = ['stability_daily', 'stability_premium', 'motion_control'].includes(shoe.category);

  return {
    terrain: isTrail ? 'trail_groomed' : 'road',
    comfort_pref: shoe.biomech.cushioning_firmness <= 4 ? 'soft' : shoe.biomech.cushioning_firmness >= 7 ? 'firm' : 'medium',
    body_weight: 'medium',
    pronation: isStability ? 'overpronate_mild' : 'neutral',
    injury_current: ['none'],
    injury_history: ['none'],
    goal: shoe.category.includes('racer') ? 'race' : shoe.category.includes('super') ? 'tempo' : 'easy_base',
    experience: 'intermediate',
    foot_width: 'regular',
    arch_type: 'unsure',
    drop_pref: 'no_pref',
    wears_orthotics: false,
    brand_pref: [],
  };
}
