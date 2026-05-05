import { Shoe } from '../data/shoes';

export type InjuryCurrent = 'none' | 'knee' | 'plantar' | 'achilles' | 'shin' | 'itband' | 'metatarsalgia' | 'bunions' | 'morton_neuroma' | 'other';
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

  // v6 additions — optional, default to false/undefined
  wears_orthotics?: boolean;
  has_bunions?: boolean;

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
  // v6 fix #1: carbon_plate_racing → carbon_racer
  return ['carbon_racer', 'super_trainer'].includes(shoe.category)
    || shoe.use_cases.some(u => u.startsWith('race'));
}

function isCarbonRacer(shoe: Shoe): boolean {
  return shoe.category === 'carbon_racer';
}

function isSpeedShoe(shoe: Shoe): boolean {
  // v6 fix #1: carbon_plate_racing → carbon_racer; v6 fix #5: stability_lightweight as tempo-valid
  return ['carbon_racer', 'super_trainer', 'lightweight_daily', 'stability_lightweight'].includes(shoe.category)
    || shoe.use_cases.some(u => ['tempo', 'intervals', 'race_5k_10k'].includes(u));
}

// v6 fix #2: achilles_tendinopathy → achilles_tendinitis
// v6 fix #3: remove it_band (no database entries; handle via general principles)
const INJURY_COND_MAP: Record<string, string[]> = {
  knee: ['knee_pain'],
  plantar: ['plantar_fasciitis'],
  achilles: ['achilles_tendinitis'],
  shin: ['shin_splints'],
  metatarsalgia: ['metatarsalgia'],
  bunions: ['bunions'],
  morton_neuroma: ['morton_neuroma'],
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
    if (inj !== 'none' && INJURY_COND_MAP[inj as string]) conds.push(...INJURY_COND_MAP[inj as string]);
  }

  // v6 fix #4: removed trail_easy/trail_technical — these are use_cases, not conditions

  // v6: body weight conditions
  if (answers.body_weight === 'heavy' || answers.body_weight === 'very_heavy') {
    conds.push('heavy_runner');
  }

  // v6: foot width conditions
  if (answers.foot_width === 'wide' || answers.foot_width === 'extra_wide') {
    conds.push('wide_feet');
  } else if (answers.foot_width === 'narrow') {
    conds.push('narrow_feet');
  }

  // v6: orthotic user
  if (answers.wears_orthotics) {
    conds.push('orthotic_user');
  }

  // v6: bunions / morton neuroma (also reachable via injury_current, but add from has_bunions too)
  if (answers.has_bunions) {
    if (!conds.includes('bunions')) conds.push('bunions');
  }

  // stress fracture history
  if (answers.injury_history.includes('stress_fracture')) {
    conds.push('stress_fracture_history');
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

function hasBunions(answers: QuizAnswers): boolean {
  return !!answers.has_bunions || hasCurrentInjury(answers, 'bunions');
}

// v6 Rule 1: Hard avoid filter — runs before scoring
// Returns true if this shoe should be eliminated for this profile
function shouldHardAvoid(shoe: Shoe, answers: QuizAnswers): boolean {
  const userConds = buildTargetConditions(answers);
  const avoidFor = shoe.avoid_for_conditions ?? [];
  return avoidFor.some(c => userConds.includes(c));
}

export const scoreShoe = (shoe: Shoe, answers: QuizAnswers): { score: number; reasons: string[] } => {
  let score = 0;
  const reasons: string[] = [];

  const trail = isTrailShoe(shoe);
  const needsTrail = answers.terrain === 'trail_groomed' || answers.terrain === 'trail_technical';
  const firmness = shoe.biomech.cushioning_firmness;     // 1-10
  const cushLevel = shoe.biomech.cushioning_level;       // 1-10
  const energyReturn = shoe.biomech.energy_return;       // 0-10

  // ─── 1. TERRAIN — v6: increased penalties ───────────────────────────────────
  if (needsTrail && trail) {
    score += 4;
    reasons.push('Purpose-built for trail running');
    if (answers.terrain === 'trail_technical' && shoe.use_cases.includes('trail_technical')) {
      score += 3; // v6: was +2
    }
  } else if (!needsTrail && !trail) {
    score += 4; // v6: was +2
  } else if (needsTrail && !trail) {
    score -= 8; // v6: was -5
  } else if (!needsTrail && trail) {
    score -= 8; // v6: was -3
  }
  if (answers.terrain === 'track') {
    if (isSpeedShoe(shoe) || shoe.use_cases.includes('track')) score += 2;
  }

  // ─── 2. CUSHIONING PREFERENCE — #1 predictor (Nigg 2015 comfort filter) ────
  if (answers.comfort_pref === 'soft') {
    if (firmness <= 3) { score += 6; reasons.push('Soft, plush cushioning matches your preference'); }
    else if (firmness <= 5) score += 3;
    else if (firmness >= 8) score -= 5; // v6: was -4
  } else if (answers.comfort_pref === 'medium') {
    if (firmness >= 4 && firmness <= 6) { score += 5; reasons.push('Balanced cushion feel matches your preference'); }
    else if (firmness >= 3 && firmness <= 7) score += 2;
  } else if (answers.comfort_pref === 'firm') {
    if (firmness >= 7) { score += 6; reasons.push('Firm, responsive feel matches your preference'); }
    else if (firmness >= 5) score += 2;
    else if (firmness <= 3) score -= 5; // v6: was -4
  }

  // ─── 3. BODY WEIGHT × CUSHIONING (Malisoux RCT — 848 runners) ───────────
  if (answers.body_weight === 'very_heavy') {
    if (shoe.biomech.wide_base) { score += 4; reasons.push('Wide base provides extra stability'); }
    if (firmness >= 6) score += 3;
    if (cushLevel >= 7) score += 2;
    if (firmness <= 3 && cushLevel >= 9) score -= 4;
    // v6: heavy_runner condition bonus
    if (shoe.good_for_conditions.includes('heavy_runner')) { score += 5; reasons.push('Rated for heavier runners'); }
    if (['motion_control', 'max_stability'].includes(shoe.category)) score += 3;
  } else if (answers.body_weight === 'heavy') {
    if (shoe.biomech.wide_base) score += 3;
    if (firmness >= 5) score += 2;
    if (cushLevel >= 6) score += 2;
    // v6: heavy_runner condition bonus
    if (shoe.good_for_conditions.includes('heavy_runner')) { score += 3; reasons.push('Rated for heavier runners'); }
  } else if (answers.body_weight === 'light') {
    if (cushLevel >= 7 && firmness <= 5) score += 2;
    if (shoe.category === 'lightweight_daily') score += 1;
  }

  // ─── 4. GOAL × ENERGY RETURN ──────────────────────────────────────────────
  if (answers.goal === 'race') {
    if (isRacingShoe(shoe)) { score += 6; reasons.push('Built for race-day performance'); }
    // v6 fix #1: carbon_racer (was carbon_plate_racing)
    if (isCarbonRacer(shoe)) {
      score += 2;
      if (answers.experience === 'beginner') score -= 10; // v6: hard block beginners from carbon
    }
    score += Math.round(energyReturn * 0.5);
  } else if (answers.goal === 'tempo') {
    if (isSpeedShoe(shoe)) { score += 5; reasons.push('Designed for speed and tempo runs'); }
    score += Math.round(energyReturn * 0.3);
    if (isRacingShoe(shoe) && answers.experience !== 'beginner') score += 2;
  } else if (answers.goal === 'easy_base') {
    // v6: added max_cushion_premium to easy_base list
    if (['neutral_daily', 'stability_daily', 'max_cushion_neutral', 'premium_neutral', 'max_cushion_premium', 'motion_control'].includes(shoe.category)) {
      score += 4;
      reasons.push('Ideal for easy daily mileage');
    }
    // v6 fix #5: stability_lightweight treated same as stability_daily for easy_base
    if (shoe.category === 'stability_lightweight') score += 4;
    if (isRacingShoe(shoe)) score -= 4;
  } else if (answers.goal === 'walking') {
    if (cushLevel >= 7) score += 3;
    if (shoe.biomech.rocker >= 5) { score += 2; reasons.push('Rocker geometry smooths walking stride'); }
    if (isCarbonRacer(shoe)) score -= 6;
  }

  // ─── 5. CURRENT INJURY — biomechanical targeting (multi-select) ──────────
  if (hasAnyCurrentInjury(answers)) {
    if (isCarbonRacer(shoe)) score -= 8; // v6: increased from -5, carbon racers while injured

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
      // v6 fix #2: achilles_tendinitis (was achilles_tendinopathy)
      if (shoe.good_for_conditions.includes('achilles_tendinitis')) {
        score += 5; reasons.push('Suited for Achilles recovery');
      }
      if (shoe.specs.drop_mm >= 10) { score += 4; reasons.push('High heel drop reduces Achilles strain'); }
      else if (shoe.specs.drop_mm >= 8) score += 2; // v6: 8-9mm also helpful
      else if (shoe.specs.drop_mm >= 5) score -= 2; // v6: 5-7mm mild penalty
      else score -= 6; // v6: <=4mm hard penalty
    }

    if (hasCurrentInjury(answers, 'knee')) {
      if (shoe.good_for_conditions.includes('knee_pain')) {
        score += 5; reasons.push('Cushioning reduces knee impact stress');
      }
      if (cushLevel >= 7) score += 3;
      if (shoe.biomech.stability_level === 'neutral' || shoe.biomech.stability_level === 'guidance') score += 2;
      if (shoe.biomech.stability_level === 'motion_control') score -= 2;
    }

    if (hasCurrentInjury(answers, 'shin')) {
      if (shoe.good_for_conditions.includes('shin_splints')) {
        score += 5; reasons.push('Stability helps manage shin splints');
      }
      if (shoe.biomech.stability_level === 'guidance' || shoe.biomech.stability_level === 'stability') score += 3;
      if (cushLevel >= 6) score += 2;
    }

    // v6 fix #3: itband handled via general principles (no database entries)
    if (hasCurrentInjury(answers, 'itband')) {
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
      // v6: additional good_for_conditions bonus
      if (shoe.good_for_conditions.includes('metatarsalgia')) score += 4;
    }

    // v6: bunions handler
    if (hasCurrentInjury(answers, 'bunions') || answers.has_bunions) {
      if (shoe.biomech.toe_box_width >= 9) { score += 8; reasons.push('Anatomical toe box accommodates bunions'); }
      else if (shoe.biomech.toe_box_width >= 7) score += 5;
      else if (shoe.biomech.toe_box_width <= 4) score -= 4;
      if (shoe.good_for_conditions.includes('bunions')) score += 6;
    }

    // v6: morton neuroma handler
    if (hasCurrentInjury(answers, 'morton_neuroma')) {
      if (shoe.biomech.rocker >= 6) score += 3;
      if (cushLevel >= 8) score += 3;
      if (shoe.good_for_conditions.includes('morton_neuroma')) { score += 5; reasons.push('Suited for Morton\'s neuroma relief'); }
      if (shoe.biomech.toe_box_width <= 4) score -= 3;
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
    if (isCarbonRacer(shoe)) score -= 6; // v6 fix #1
    // v6: good_for_conditions bonus + general max_cushion bonus
    if (shoe.good_for_conditions.includes('stress_fracture_history')) score += 5;
    if (cushLevel >= 9) score += 3;
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
    if (isCarbonRacer(shoe)) score -= 10; // v6 fix #1: hard block
    if (shoe.specs.drop_mm <= 2) score -= 7;
    if (shoe.specs.drop_mm <= 4 && shoe.specs.drop_mm > 2) score -= 3;
    if (['neutral_daily', 'stability_daily', 'max_cushion_neutral'].includes(shoe.category)) {
      score += 3;
      reasons.push('Forgiving trainer perfect for new runners');
    }
    if (shoe.category === 'max_cushion_premium') score += 2;
  } else if (answers.experience === 'intermediate') {
    if (isCarbonRacer(shoe)) score -= 3; // v6 fix #1
    if (shoe.specs.drop_mm <= 2) score -= 2;
  }

  // ─── 8. FOOT WIDTH ───────────────────────────────────────────────────────
  const wideWidths = ['wide', 'extra_wide', '2E', '4E', 'W', 'XW'];
  const narrowWidths = ['narrow', '2A', 'B', 'N'];
  const shoeWidths = shoe.specs.widths ?? [];

  if (answers.foot_width === 'wide' || answers.foot_width === 'extra_wide') {
    if (shoeWidths.some(w => wideWidths.includes(w))) {
      score += 4;
      reasons.push('Wide width available for your foot shape');
    } else {
      score -= 4;
    }
    if (shoe.biomech.toe_box_width >= 7) score += 2;
    if (shoe.biomech.toe_box_width <= 4) score -= 2;
    // v6: wide_feet condition bonus
    if (shoe.good_for_conditions.includes('wide_feet')) score += 3;
  } else if (answers.foot_width === 'narrow') {
    if (shoeWidths.some(w => narrowWidths.includes(w))) score += 2;
    // v6: narrow_feet condition bonus
    if (shoe.good_for_conditions.includes('narrow_feet')) score += 3;
  }

  // ─── 9. ORTHOTIC USER (v6 new rule) ──────────────────────────────────────
  if (answers.wears_orthotics) {
    if (shoe.biomech.removable_insole === false) {
      score -= 8; // hard penalty: non-removable insole is functionally incompatible
    }
    if (shoe.good_for_conditions.includes('orthotic_user')) { score += 4; reasons.push('Roomy fit works well with orthotics'); }
    if (shoe.biomech.wide_base) score += 2;
    if (shoe.biomech.toe_box_width >= 6) score += 1;
  }

  // ─── 10. BUNIONS — ADDITIONAL PATH (via has_bunions flag, not injury_current) ─
  // Already handled above in current injury block; this covers the non-injured bunion user
  if (answers.has_bunions && !hasCurrentInjury(answers, 'bunions')) {
    if (shoe.biomech.toe_box_width >= 9) { score += 8; reasons.push('Anatomical toe box accommodates bunions'); }
    else if (shoe.biomech.toe_box_width >= 7) score += 5;
    else if (shoe.biomech.toe_box_width <= 4) score -= 4;
    if (shoe.good_for_conditions.includes('bunions')) score += 6;
  }

  // ─── 11. ARCH TYPE (demoted to last — weakest standalone predictor) ─────────
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

  // ─── 12. CONDITION MATCHING — supplementary sweep (v6 rule 13) ──────────
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
  // v6 Rule 1: Hard avoid filter — eliminate shoes before scoring
  const targetConds = buildTargetConditions(answers);
  const afterHardAvoid = shoes.filter(shoe => {
    const avoidFor = shoe.avoid_for_conditions ?? [];
    return !avoidFor.some(c => targetConds.includes(c));
  });

  // If hard filter leaves fewer than 5, fall back to penalty scoring on full set
  const pool = afterHardAvoid.length >= 5 ? afterHardAvoid : shoes;

  const scored = pool.map(shoe => {
    const { score, reasons } = scoreShoe(shoe, answers);
    // If shoe was in avoid set and we're using the full pool fallback, apply -10 penalty
    if (pool === shoes && afterHardAvoid.length < 5) {
      const avoidFor = shoe.avoid_for_conditions ?? [];
      const penaltyCount = avoidFor.filter(c => targetConds.includes(c)).length;
      return { ...shoe, score: Math.max(0, score - penaltyCount * 10), reasons };
    }
    return { ...shoe, score, reasons };
  });

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
