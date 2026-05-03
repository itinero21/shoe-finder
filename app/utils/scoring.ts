import { Shoe } from '../data/shoes';

export type InjuryCurrent = 'none' | 'knee' | 'plantar' | 'achilles' | 'shin' | 'itband' | 'metatarsalgia' | 'other';
export type InjuryHistory = 'none' | 'knee' | 'plantar' | 'achilles' | 'shin' | 'itband' | 'stress_fracture' | 'other';

export interface QuizAnswers {
  // Tier 1 — high evidence weight (research-backed)
  terrain: 'road' | 'trail_groomed' | 'trail_technical' | 'track';
  comfort_pref: 'soft' | 'medium' | 'firm';
  body_weight: 'light' | 'medium' | 'heavy' | 'very_heavy';
  injury_current: InjuryCurrent[];   // multi-select
  injury_history: InjuryHistory[];   // multi-select

  // Tier 2 — moderate evidence weight
  goal: 'easy_base' | 'tempo' | 'race' | 'walking';
  experience: 'beginner' | 'intermediate' | 'experienced' | 'advanced';
  foot_width: 'narrow' | 'regular' | 'wide' | 'extra_wide';

  // Tier 3 — lower evidence weight (kept but demoted)
  arch_type: 'flat' | 'normal' | 'high';

  // Brand preference — empty = any brand
  brand_pref: string[];
}

export interface ScoredShoe extends Shoe {
  score: number;
  reasons: string[];
}

function isTrailShoe(shoe: Shoe): boolean {
  return shoe.use_cases.some(u => u.startsWith('trail'));
}

function isRacingShoe(shoe: Shoe): boolean {
  return ['carbon_plate_racing', 'super_trainer'].includes(shoe.category)
    || shoe.use_cases.some(u => u.startsWith('race'));
}

function isSpeedShoe(shoe: Shoe): boolean {
  return ['carbon_plate_racing', 'super_trainer', 'lightweight_daily'].includes(shoe.category)
    || shoe.use_cases.some(u => ['tempo', 'intervals', 'race_5k_10k'].includes(u));
}

const INJURY_COND_MAP: Record<string, string[]> = {
  knee: ['knee_pain'],
  plantar: ['plantar_fasciitis'],
  achilles: ['achilles_tendinopathy'],
  shin: ['shin_splints'],
  itband: ['it_band'],
  metatarsalgia: ['metatarsalgia'],
};

// Build the target condition keys for good_for/avoid_for matching
function buildTargetConditions(answers: QuizAnswers): string[] {
  const conds: string[] = [];

  if (answers.arch_type === 'flat') {
    conds.push('flat_feet_flexible', 'flat_feet_rigid', 'overpronation_mild', 'overpronation_severe');
  } else if (answers.arch_type === 'normal') {
    conds.push('neutral_arch');
  } else if (answers.arch_type === 'high') {
    conds.push('high_arches', 'underpronation');
  }

  for (const inj of answers.injury_current) {
    if (inj !== 'none' && INJURY_COND_MAP[inj]) conds.push(...INJURY_COND_MAP[inj]);
  }
  for (const inj of answers.injury_history) {
    if (inj !== 'none' && inj !== 'stress_fracture' && INJURY_COND_MAP[inj]) conds.push(...INJURY_COND_MAP[inj]);
  }

  if (answers.terrain === 'trail_groomed' || answers.terrain === 'trail_technical') {
    conds.push('trail_easy', 'trail_technical');
  }

  return [...new Set(conds)];
}

function hasCurrentInjury(answers: QuizAnswers, key: InjuryCurrent): boolean {
  return answers.injury_current.includes(key);
}

function hasHistoryInjury(answers: QuizAnswers, key: InjuryHistory): boolean {
  return answers.injury_history.includes(key);
}

function hasAnyCurrentInjury(answers: QuizAnswers): boolean {
  return answers.injury_current.length > 0 && !answers.injury_current.every(i => i === 'none');
}

export const scoreShoe = (shoe: Shoe, answers: QuizAnswers): { score: number; reasons: string[] } => {
  let score = 0;
  const reasons: string[] = [];

  const trail = isTrailShoe(shoe);
  const needsTrail = answers.terrain === 'trail_groomed' || answers.terrain === 'trail_technical';
  const firmness = shoe.biomech.cushioning_firmness;     // 1-10
  const cushLevel = shoe.biomech.cushioning_level;       // 1-10
  const energyReturn = shoe.biomech.energy_return;       // 0-10

  // ─── 1. TERRAIN ─────────────────────────────────────────────────────────────
  if (needsTrail && trail) {
    score += 4;
    reasons.push('Purpose-built for trail running');
    if (answers.terrain === 'trail_technical' && shoe.use_cases.includes('trail_technical')) {
      score += 2;
    }
  } else if (!needsTrail && !trail) {
    score += 2;
  } else if (needsTrail && !trail) {
    score -= 5; // road shoe on trail = traction/ankle risk
  } else if (!needsTrail && trail) {
    score -= 3;
  }
  if (answers.terrain === 'track') {
    if (isSpeedShoe(shoe) || shoe.use_cases.includes('track')) score += 2;
  }

  // ─── 2. CUSHIONING PREFERENCE — #1 predictor (Nigg 2015 comfort filter) ────
  if (answers.comfort_pref === 'soft') {
    if (firmness <= 3) { score += 6; reasons.push('Soft, plush cushioning matches your preference'); }
    else if (firmness <= 5) score += 3;
    else if (firmness >= 8) score -= 4;
  } else if (answers.comfort_pref === 'medium') {
    if (firmness >= 4 && firmness <= 6) { score += 5; reasons.push('Balanced cushion feel matches your preference'); }
    else if (firmness >= 3 && firmness <= 7) score += 2;
  } else if (answers.comfort_pref === 'firm') {
    if (firmness >= 7) { score += 6; reasons.push('Firm, responsive feel matches your preference'); }
    else if (firmness >= 5) score += 2;
    else if (firmness <= 3) score -= 4;
  }

  // ─── 3. BODY WEIGHT × CUSHIONING (Malisoux RCT — 848 runners) ───────────
  if (answers.body_weight === 'very_heavy') {
    if (shoe.biomech.wide_base) { score += 4; reasons.push('Wide base provides extra stability'); }
    if (firmness >= 6) score += 3;
    if (cushLevel >= 7) score += 2;
    if (firmness <= 3 && cushLevel >= 9) score -= 4; // mushy max-stack collapses under weight
  } else if (answers.body_weight === 'heavy') {
    if (shoe.biomech.wide_base) score += 3;
    if (firmness >= 5) score += 2;
    if (cushLevel >= 6) score += 2;
  } else if (answers.body_weight === 'light') {
    if (cushLevel >= 7 && firmness <= 5) score += 2;
    if (shoe.category === 'lightweight_daily') score += 1;
  }

  // ─── 4. GOAL × ENERGY RETURN ──────────────────────────────────────────────
  if (answers.goal === 'race') {
    if (isRacingShoe(shoe)) { score += 6; reasons.push('Built for race-day performance'); }
    if (shoe.category === 'carbon_plate_racing') score += 2;
    score += Math.round(energyReturn * 0.5);
  } else if (answers.goal === 'tempo') {
    if (isSpeedShoe(shoe)) { score += 5; reasons.push('Designed for speed and tempo runs'); }
    score += Math.round(energyReturn * 0.3);
    if (isRacingShoe(shoe) && answers.experience !== 'beginner') score += 2;
  } else if (answers.goal === 'easy_base') {
    if (['neutral_daily', 'stability_daily', 'max_cushion_neutral', 'premium_neutral', 'motion_control'].includes(shoe.category)) {
      score += 4;
      reasons.push('Ideal for easy daily mileage');
    }
    if (isRacingShoe(shoe)) score -= 4;
  } else if (answers.goal === 'walking') {
    if (cushLevel >= 7) score += 3;
    if (shoe.biomech.rocker >= 5) { score += 2; reasons.push('Rocker geometry smooths walking stride'); }
    if (isRacingShoe(shoe)) score -= 5;
  }

  // ─── 5. CURRENT INJURY — biomechanical targeting (multi-select) ──────────
  if (hasAnyCurrentInjury(answers)) {
    if (isRacingShoe(shoe)) score -= 5; // no racing shoes while injured

    if (hasCurrentInjury(answers, 'plantar')) {
      if (shoe.good_for_conditions.includes('plantar_fasciitis')) {
        score += 6; reasons.push('Clinically suited for plantar fasciitis');
      }
      score += Math.round(shoe.biomech.rocker * 0.6);
      score += Math.round(shoe.biomech.heel_counter_rigidity * 0.4);
      if (shoe.specs.drop_mm >= 8) score += 3;
      if (shoe.specs.drop_mm <= 4) score -= 4;
    }

    if (hasCurrentInjury(answers, 'achilles')) {
      if (shoe.good_for_conditions.includes('achilles_tendinopathy')) {
        score += 5; reasons.push('Suited for Achilles recovery');
      }
      if (shoe.specs.drop_mm >= 10) { score += 4; reasons.push('High heel drop reduces Achilles strain'); }
      if (shoe.specs.drop_mm <= 4) score -= 6;
    }

    if (hasCurrentInjury(answers, 'knee')) {
      if (shoe.good_for_conditions.includes('knee_pain')) {
        score += 5; reasons.push('Cushioning reduces knee impact stress');
      }
      if (cushLevel >= 7) score += 3;
      if (shoe.biomech.stability_level === 'neutral' || shoe.biomech.stability_level === 'guidance') score += 2;
    }

    if (hasCurrentInjury(answers, 'shin')) {
      if (shoe.good_for_conditions.includes('shin_splints')) {
        score += 5; reasons.push('Stability helps manage shin splints');
      }
      if (shoe.biomech.stability_level === 'guidance' || shoe.biomech.stability_level === 'stability') score += 3;
      if (cushLevel >= 6) score += 2;
    }

    if (hasCurrentInjury(answers, 'itband')) {
      if (shoe.good_for_conditions.includes('it_band')) {
        score += 5; reasons.push('Neutral platform supports IT band recovery');
      }
      if (shoe.biomech.stability_level === 'neutral') score += 3;
      if (shoe.biomech.stability_level === 'motion_control') score -= 4;
      if (cushLevel >= 6) score += 2;
    }

    if (hasCurrentInjury(answers, 'metatarsalgia')) {
      if (shoe.biomech.rocker >= 7) {
        score += 5; reasons.push('Rocker geometry offloads the metatarsals');
      }
      if (shoe.specs.stack_heel_mm >= 30) score += 3;
      if (shoe.biomech.toe_box_width >= 7) score += 2;
    }
  }

  // ─── 6. INJURY HISTORY — previous 12 months (prevention weighting) ────────
  if (hasHistoryInjury(answers, 'plantar')) {
    if (shoe.good_for_conditions.includes('plantar_fasciitis')) {
      score += 3; reasons.push('Designed to prevent plantar fasciitis recurrence');
    }
    if (shoe.biomech.rocker >= 5) score += 2;
    if (shoe.specs.drop_mm <= 2) score -= 3;
  }
  if (hasHistoryInjury(answers, 'achilles')) {
    if (shoe.specs.drop_mm <= 4) score -= 4;
    if (shoe.specs.drop_mm >= 8) score += 2;
  }
  if (hasHistoryInjury(answers, 'stress_fracture')) {
    if (cushLevel >= 8) { score += 4; reasons.push('Max cushioning for impact protection'); }
    if (shoe.category === 'carbon_plate_racing') score -= 6;
  }
  if (hasHistoryInjury(answers, 'itband')) {
    if (shoe.biomech.stability_level === 'motion_control') score -= 3;
  }
  if (hasHistoryInjury(answers, 'shin')) {
    if (shoe.biomech.stability_level === 'guidance' || shoe.biomech.stability_level === 'stability') score += 2;
  }
  if (hasHistoryInjury(answers, 'knee')) {
    if (cushLevel >= 6) score += 2;
  }

  // ─── 7. EXPERIENCE SAFETY GATE ───────────────────────────────────────────
  if (answers.experience === 'beginner') {
    if (shoe.category === 'carbon_plate_racing') score -= 10; // hard block
    if (shoe.specs.drop_mm <= 2) score -= 7; // zero-drop requires tendon adaptation
    if (shoe.specs.drop_mm <= 4) score -= 3;
    if (['neutral_daily', 'stability_daily', 'max_cushion_neutral'].includes(shoe.category)) {
      score += 3;
      reasons.push('Forgiving trainer perfect for new runners');
    }
  } else if (answers.experience === 'intermediate') {
    if (shoe.category === 'carbon_plate_racing') score -= 3;
    if (shoe.specs.drop_mm <= 2) score -= 2;
  }

  // ─── 8. FOOT WIDTH (95% of experts rate as critical for comfort) ──────────
  const wideWidths = ['wide', 'extra_wide', '2E', '4E', 'W', 'XW'];
  const narrowWidths = ['narrow', '2A', 'B', 'N'];
  const shoeWidths = shoe.specs.widths ?? [];

  if (answers.foot_width === 'wide' || answers.foot_width === 'extra_wide') {
    if (shoeWidths.some(w => wideWidths.includes(w))) {
      score += 4;
      reasons.push('Wide width available for your foot shape');
    } else {
      score -= 4; // no wide option = blister / black toenail risk
    }
    if (shoe.biomech.toe_box_width >= 7) score += 2;
    if (shoe.biomech.toe_box_width <= 4) score -= 2;
  } else if (answers.foot_width === 'narrow') {
    if (shoeWidths.some(w => narrowWidths.includes(w))) score += 2;
  }

  // ─── 9. ARCH TYPE (demoted to last — weakest standalone predictor) ─────────
  if (answers.arch_type === 'flat') {
    if (['motion_control', 'max_stability'].includes(shoe.category)) {
      score += 4;
      reasons.push('Motion control provides maximum support for flat feet');
    } else if (shoe.biomech.stability_level === 'stability' || shoe.biomech.stability_level === 'guidance') {
      score += 3;
      reasons.push('Stability frame supports flat arches');
    } else if (shoe.biomech.stability_level === 'neutral') {
      score -= 1;
    }
    score += Math.round(shoe.biomech.torsional_rigidity * 0.3);
  } else if (answers.arch_type === 'high') {
    if (['max_cushion_neutral', 'max_cushion_premium'].includes(shoe.category)) {
      score += 4;
      reasons.push('Maximum cushioning suits high-arched feet');
    } else if (shoe.biomech.stability_level === 'neutral') {
      score += 3;
      reasons.push('Flexible neutral construction suits high arches');
    }
    if (shoe.category === 'motion_control') score -= 3;
    if (shoe.biomech.midsole_flexibility >= 6) score += 1;
  } else if (answers.arch_type === 'normal') {
    if (shoe.good_for_conditions.includes('neutral_arch')) score += 2;
    if (shoe.category === 'motion_control') score -= 1;
  }

  // ─── 10. CONDITION MATCHING (supplementary sweep) ───────────────────────
  const targetConds = buildTargetConditions(answers);
  const goodFor = shoe.good_for_conditions ?? [];
  const avoidFor = shoe.avoid_for_conditions ?? [];
  const matched = goodFor.filter(c => targetConds.includes(c));
  score += matched.length * 2;
  const avoided = avoidFor.filter(c => targetConds.includes(c));
  score -= avoided.length * 4;

  return { score: Math.max(0, score), reasons: reasons.slice(0, 3) };
};

export const getRecommendations = (answers: QuizAnswers, shoes: Shoe[]): ScoredShoe[] => {
  const scored = shoes.map(shoe => ({ ...shoe, ...scoreShoe(shoe, answers) }));

  const filtered = scored.filter(shoe => {
    if (shoe.score <= 0) return false;
    if (answers.brand_pref.length > 0) {
      return answers.brand_pref.includes(shoe.brand);
    }
    return true;
  });

  return filtered
    .sort((a, b) => b.score - a.score)
    .slice(0, 18); // return up to 18 so "show more" always has stock
};

export const getAllBrands = (shoes: Shoe[]): string[] => {
  return [...new Set(shoes.map(s => s.brand))].sort();
};
