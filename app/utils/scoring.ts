import { Shoe } from '../data/shoes';

/**
 * STRIDE//PROTOCOL — Fit Engine v10 (Production)
 *
 * Why v6 was returning bad recommendations:
 *
 *   1. Terrain was a -8 penalty, not a HARD filter. Trail shoes leaked into
 *      road searches and vice versa.
 *   2. No pronation question existed. Severe overpronators had no path to
 *      max-stability shoes — engine inferred from arch_type alone (~60%
 *      accurate at best for self-administered wet tests).
 *   3. Purpose-to-category was too coarse. A tempo runner got carbon_racer +2
 *      + speed_shoe +5 = same score as the ideal super_trainer. No tiers.
 *   4. mustAvoidStability() never enforced. High-arch supinators could get
 *      Beast GTS (which is actually injurious for that profile).
 *   5. No market-mainstream bonus. RunRepeat / Solereview / Doctors of Running
 *      / iRunFar 2026 top picks (Novablast 5, Nimbus 28, 1080v15, Triumph 23,
 *      Kayano 32, Adrenaline GTS 25, Bondi 9, Clifton 10, Speedgoat 7,
 *      Peregrine 16, Endorphin Speed 5, Superblast 3) had no weight beyond
 *      raw stat match — niche shoes beat household-name picks. This is the #1
 *      reason recommendations felt "off."
 *   6. Intermediate runners could still get carbon racers (-3 was too soft).
 *   7. Drop preference unsupported (no quiz question, no engine handling).
 *   8. Width matching string list included dead values ('2E','4E','W','XW')
 *      that never appear in the database.
 *   9. No tiebreaker logic — at the edges, results were essentially arbitrary.
 *
 * Market validation (2026):
 *   RunRepeat best daily: Novablast 5
 *   RunRepeat best stability: Kayano 32
 *   RunRepeat best PF: Triumph 23
 *   RunRepeat best supertrainer: Superblast 3
 *   RunRepeat best overpronation: Adrenaline GTS 25, Hurricane 25 (shock abs)
 *   iRunFar best trail cushion: Speedgoat 7
 *   iRunFar best all-around trail: Cascadia 19/20
 *   CNN/podiatrists PF: Clifton 10, Adrenaline GTS, Bondi 9, NB 860
 *   Outdoor Gear Lab daily: Novablast 5, 1080v15, Ride 19
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type InjuryCurrent =
  | 'none' | 'knee' | 'plantar' | 'achilles' | 'shin' | 'itband'
  | 'metatarsalgia' | 'bunions' | 'morton_neuroma' | 'other';

export type InjuryHistory =
  | 'none' | 'knee' | 'plantar' | 'achilles' | 'shin' | 'itband'
  | 'stress_fracture' | 'other';

export type Pronation = 'overpronate_severe' | 'overpronate_mild' | 'neutral' | 'supinate' | 'unsure';

export type DropPref = 'low' | 'medium' | 'high' | 'no_pref';

export interface QuizAnswers {
  // TIER 1 — strong predictors (research-backed)
  terrain: 'road' | 'trail_groomed' | 'trail_technical' | 'track';
  comfort_pref: 'soft' | 'medium' | 'firm';
  body_weight: 'light' | 'medium' | 'heavy' | 'very_heavy';
  pronation: Pronation;
  injury_current: InjuryCurrent[];
  injury_history: InjuryHistory[];

  // TIER 2 — moderate predictors
  goal: 'easy_base' | 'tempo' | 'race' | 'walking';
  experience: 'beginner' | 'intermediate' | 'experienced' | 'advanced';
  foot_width: 'narrow' | 'regular' | 'wide' | 'extra_wide';

  // TIER 3 — supplementary
  arch_type: 'flat' | 'normal' | 'high' | 'unsure';
  drop_pref?: DropPref;

  // Flags
  wears_orthotics?: boolean;
  has_bunions?: boolean;

  // Brand filter — empty = any
  brand_pref: string[];
}

export interface ScoredShoe extends Shoe {
  score: number;
  reasons: string[];
}

// ─── Mainstream / market-validated picks (2026 expert consensus) ────────────
// These are 2026 expert top picks from RunRepeat, Outdoor Gear Lab,
// iRunFar, CNN Underscored podiatrists, Marathon Sports, Run United,
// Doctors of Running, Outside, Switchback Travel, Trail and Kale, NBC Select.
// Earning a small +3 bonus when otherwise eligible breaks ties toward the
// shoes runners will actually recognize and the shoes experts repeatedly cite.
// This is intentionally NOT a brand bonus — every shoe here must independently
// fit the profile via base scoring. The bonus is a tiebreaker so that, e.g.,
// when a neutral daily user has 12 shoes scoring 25–30, the Novablast 5 / 1080
// v15 / Nimbus 28 surface ahead of equally-stat-matched but obscure picks.
const MARKET_MAINSTREAM: Set<string> = new Set([
  // Daily / max-cushion neutral
  'asics_novablast_5',
  'asics_gel_nimbus_28',
  'asics_gel_cumulus_28',
  'nb_1080_v15',
  'nb_880_v15',
  'brooks_ghost_18',
  'brooks_glycerin_23',
  'brooks_ghost_max_3',
  'saucony_ride_19',
  'saucony_triumph_23',
  'saucony_endorphin_azura',
  'hoka_clifton_10',
  'hoka_bondi_9',
  'hoka_mach_7',
  'hoka_skyflow',
  'mizuno_wave_rider_29',
  'puma_velocity_nitro_4',
  // Stability / overpronation
  'asics_gel_kayano_32',
  'asics_gel_kayano_33',
  'asics_gt_2000_14',
  'brooks_adrenaline_gts_25',
  'brooks_glycerin_gts_23',
  'hoka_arahi_8',
  'hoka_gaviota_6',
  'saucony_guide_19',
  'saucony_hurricane_25',
  'saucony_tempus_2',
  'nb_860_v15',
  'mizuno_wave_inspire_22',
  'puma_foreverrun_nitro_2',
  // Max stability / motion control
  'brooks_beast_gts_26',
  'brooks_ariel',
  'nb_1540_v4',
  'mizuno_wave_horizon_8',
  // Super trainers
  'asics_superblast_3',
  'asics_megablast',
  'hoka_mach_x_3',
  'mizuno_neo_vista_2',
  'saucony_endorphin_speed_5',
  'nb_supercomp_trainer_v3',
  // Carbon racers
  'asics_metaspeed_sky_tokyo',
  'asics_metaspeed_edge_tokyo',
  'saucony_endorphin_pro_5',
  'hoka_cielo_x1_3',
  'hoka_rocket_x_3',
  'nb_supercomp_elite_v5',
  'puma_deviate_nitro_elite_4',
  // Trail
  'hoka_speedgoat_7',
  'saucony_peregrine_16',
  'brooks_cascadia_20',
  'altra_lone_peak_9',
  'salomon_speedcross_6',
  'hoka_challenger_8',
  'asics_gel_trabuco_13',
  // Zero-drop / Altra mainstream
  'altra_torin_9',
  'altra_via_olympus_2',
  'altra_experience_flow_3',
]);

// ─── Category predicates ────────────────────────────────────────────────────

function isTrailShoe(shoe: Shoe): boolean {
  return shoe.use_cases.some(u => u.startsWith('trail')) || shoe.category.startsWith('trail');
}

function isTrailRacer(shoe: Shoe): boolean {
  return shoe.category === 'trail_carbon_racer';
}

function isCarbonRacer(shoe: Shoe): boolean {
  return shoe.category === 'carbon_racer' || shoe.category === 'trail_carbon_racer';
}

function isSuperTrainer(shoe: Shoe): boolean {
  return shoe.category === 'super_trainer';
}

function isRacingShoe(shoe: Shoe): boolean {
  return ['carbon_racer', 'trail_carbon_racer'].includes(shoe.category)
    || shoe.use_cases.some(u => u.startsWith('race'));
}

function isTempoShoe(shoe: Shoe): boolean {
  return ['super_trainer', 'lightweight_daily', 'stability_lightweight'].includes(shoe.category)
    || shoe.use_cases.some(u => ['tempo', 'intervals'].includes(u));
}

function isDailyTrainer(shoe: Shoe): boolean {
  return ['neutral_daily', 'stability_daily', 'premium_neutral',
    'max_cushion_neutral', 'max_cushion_premium', 'stability_premium'].includes(shoe.category);
}

function isMaxStability(shoe: Shoe): boolean {
  return shoe.biomech.stability_level === 'max_stability'
    || shoe.category === 'motion_control';
}

function isStabilityShoe(shoe: Shoe): boolean {
  return ['stability_daily', 'stability_premium', 'stability_lightweight',
    'max_stability', 'motion_control'].includes(shoe.category)
    || ['guidance', 'stability', 'max_stability'].includes(shoe.biomech.stability_level);
}

function isNeutralShoe(shoe: Shoe): boolean {
  return shoe.biomech.stability_level === 'neutral';
}

// ─── Injury condition mapping ───────────────────────────────────────────────

const INJURY_COND_MAP: Record<string, string[]> = {
  knee: ['knee_pain'],
  plantar: ['plantar_fasciitis'],
  achilles: ['achilles_tendinitis'],
  shin: ['shin_splints'],
  metatarsalgia: ['metatarsalgia'],
  bunions: ['bunions'],
  morton_neuroma: ['morton_neuroma'],
};

function buildTargetConditions(answers: QuizAnswers): string[] {
  const conds: string[] = [];

  // Arch — only contribute if user is sure
  if (answers.arch_type === 'flat') {
    conds.push('flat_feet_flexible');
    if (answers.pronation === 'overpronate_severe') conds.push('flat_feet_rigid', 'overpronation_severe');
    if (answers.pronation === 'overpronate_mild') conds.push('overpronation_mild');
  } else if (answers.arch_type === 'normal') {
    conds.push('neutral_arch');
  } else if (answers.arch_type === 'high') {
    conds.push('high_arches');
    if (answers.pronation === 'supinate') conds.push('underpronation');
  }

  // Pronation — direct signal (more reliable than arch self-assessment)
  if (answers.pronation === 'overpronate_severe') {
    conds.push('overpronation_severe', 'flat_feet_flexible');
  } else if (answers.pronation === 'overpronate_mild') {
    conds.push('overpronation_mild');
  } else if (answers.pronation === 'supinate') {
    conds.push('underpronation');
  } else if (answers.pronation === 'neutral') {
    conds.push('neutral_arch');
  }

  // Current injuries
  for (const inj of answers.injury_current) {
    if (inj !== 'none' && INJURY_COND_MAP[inj]) conds.push(...INJURY_COND_MAP[inj]);
  }
  // History injuries
  for (const inj of answers.injury_history) {
    if (inj !== 'none' && INJURY_COND_MAP[inj as string]) conds.push(...INJURY_COND_MAP[inj as string]);
  }
  if (answers.injury_history.includes('stress_fracture')) {
    conds.push('stress_fracture_history');
  }

  // Body weight
  if (answers.body_weight === 'heavy' || answers.body_weight === 'very_heavy') {
    conds.push('heavy_runner');
  }

  // Width
  if (answers.foot_width === 'wide' || answers.foot_width === 'extra_wide') {
    conds.push('wide_feet');
  } else if (answers.foot_width === 'narrow') {
    conds.push('narrow_feet');
  }

  // Flags
  if (answers.wears_orthotics) conds.push('orthotic_user');
  if (answers.has_bunions && !conds.includes('bunions')) conds.push('bunions');

  return [...new Set(conds)];
}

// ─── Predicates over user profile ───────────────────────────────────────────

function hasCurrent(answers: QuizAnswers, key: InjuryCurrent): boolean {
  return answers.injury_current.includes(key);
}

function hasHistory(answers: QuizAnswers, key: InjuryHistory): boolean {
  return answers.injury_history.includes(key);
}

function hasAnyCurrentInjury(answers: QuizAnswers): boolean {
  return answers.injury_current.length > 0 && !answers.injury_current.every(i => i === 'none');
}

function hasBunionsProfile(answers: QuizAnswers): boolean {
  return !!answers.has_bunions || hasCurrent(answers, 'bunions');
}

// Stability requirement derivation — combines pronation, arch, weight,
// and injury history to determine the *true* support needed, rather than
// trusting any single self-reported field.
function needsMaxStability(answers: QuizAnswers): boolean {
  if (answers.pronation === 'overpronate_severe') return true;
  if (answers.arch_type === 'flat' && answers.body_weight === 'very_heavy') return true;
  if (answers.arch_type === 'flat' && hasCurrent(answers, 'plantar') && answers.body_weight === 'heavy') return true;
  return false;
}

function needsStability(answers: QuizAnswers): boolean {
  if (needsMaxStability(answers)) return true;
  if (answers.pronation === 'overpronate_mild') return true;
  if (answers.arch_type === 'flat' && answers.pronation !== 'supinate') return true;
  if (hasCurrent(answers, 'shin') || hasHistory(answers, 'shin')) return true;
  return false;
}

function mustAvoidStability(answers: QuizAnswers): boolean {
  // Supinators and high-arch neutral runners should NEVER get stability shoes
  // — medial post or guidance frames actually cause lateral knee/IT-band
  // problems for these profiles.
  if (answers.pronation === 'supinate') return true;
  if (answers.arch_type === 'high' && answers.pronation === 'neutral') return true;
  if (answers.arch_type === 'high' && answers.pronation === 'unsure') return true;
  return false;
}

// ─── Hard terrain filter (v10 fix #1) ───────────────────────────────────────

function passesTerrainFilter(shoe: Shoe, answers: QuizAnswers): boolean {
  const trail = isTrailShoe(shoe);
  const userTrail = answers.terrain === 'trail_groomed' || answers.terrain === 'trail_technical';
  if (userTrail && !trail) return false;
  if (!userTrail && trail) return false;
  return true;
}

// ─── Hard avoid filter ──────────────────────────────────────────────────────

function shouldHardAvoid(shoe: Shoe, answers: QuizAnswers): boolean {
  const userConds = buildTargetConditions(answers);
  const avoidFor = shoe.avoid_for_conditions ?? [];
  if (avoidFor.some(c => userConds.includes(c))) return true;

  // Carbon racer hard-blocks
  if (isCarbonRacer(shoe)) {
    if (answers.experience === 'beginner') return true;
    if (answers.goal === 'easy_base' || answers.goal === 'walking') return true;
    if (hasAnyCurrentInjury(answers)) return true;
  }

  // Stability avoidance for high-arch supinators
  if (mustAvoidStability(answers) && isMaxStability(shoe)) return true;
  if (mustAvoidStability(answers) && shoe.category === 'motion_control') return true;

  // Zero-drop for current Achilles issues
  if (hasCurrent(answers, 'achilles') && shoe.specs.drop_mm <= 2) return true;

  // Orthotic users need removable insole
  if (answers.wears_orthotics && shoe.biomech.removable_insole === false) return true;

  return false;
}

// ─── Core scoring ───────────────────────────────────────────────────────────

export const scoreShoe = (shoe: Shoe, answers: QuizAnswers): { score: number; reasons: string[] } => {
  let score = 0;
  const reasons: string[] = [];

  const trail = isTrailShoe(shoe);
  const userTrail = answers.terrain === 'trail_groomed' || answers.terrain === 'trail_technical';
  const firmness = shoe.biomech.cushioning_firmness;
  const cushLevel = shoe.biomech.cushioning_level;
  const energyReturn = shoe.biomech.energy_return;

  // ─── 1. PURPOSE/CATEGORY — primary, good, bad tiers ─────────────────────

  const goal = answers.goal;
  const cat = shoe.category;

  // PRIMARY MATCHES — biggest bonus
  if (goal === 'race') {
    if (cat === 'carbon_racer' || cat === 'trail_carbon_racer') { score += 10; reasons.push('Built for race-day performance'); }
    else if (isSuperTrainer(shoe)) { score += 7; reasons.push('Race-capable super trainer'); }
    else if (cat === 'lightweight_daily') { score += 5; reasons.push('Light and fast for shorter races'); }
    else if (isDailyTrainer(shoe)) score -= 3;
  } else if (goal === 'tempo') {
    if (isSuperTrainer(shoe)) { score += 10; reasons.push('Designed for speed and tempo runs'); }
    else if (cat === 'lightweight_daily' || cat === 'stability_lightweight') { score += 7; reasons.push('Light and quick for tempo work'); }
    else if (isCarbonRacer(shoe) && answers.experience !== 'beginner') score += 4;
    else if (cat === 'max_cushion_premium' || cat === 'motion_control') score -= 3;
  } else if (goal === 'easy_base') {
    if (cat === 'neutral_daily' || cat === 'stability_daily') { score += 10; reasons.push('Ideal for easy daily mileage'); }
    else if (cat === 'max_cushion_neutral' || cat === 'max_cushion_premium') {
      // Soft-pref users gravitate to max-cushion; firm-pref users don't
      const bonus = answers.comfort_pref === 'soft' ? 11 : answers.comfort_pref === 'medium' ? 9 : 6;
      score += bonus; reasons.push('Plush cushioning for recovery miles');
    }
    else if (cat === 'premium_neutral' || cat === 'stability_premium') {
      score += answers.comfort_pref === 'soft' ? 10 : 8;
      reasons.push('Premium daily comfort');
    }
    else if (isCarbonRacer(shoe)) score -= 8;
    else if (isSuperTrainer(shoe)) score -= 1;
  } else if (goal === 'walking') {
    // Max-cushion is the dominant signal for walking
    if (cat === 'max_cushion_neutral' || cat === 'max_cushion_premium') { score += 10; reasons.push('Maximum cushioning for all-day walking comfort'); }
    else if (cat === 'premium_neutral') { score += 7; reasons.push('Premium cushioning for walking comfort'); }
    else if (cat === 'neutral_daily') score += 3;
    if (cushLevel >= 9) score += 4;
    else if (cushLevel >= 7) score += 2;
    if (shoe.biomech.rocker >= 7) { score += 4; reasons.push('Rocker geometry smooths walking stride'); }
    else if (shoe.biomech.rocker >= 5) score += 2;
    if (isCarbonRacer(shoe)) score -= 12;
    if (isSuperTrainer(shoe)) score -= 5;
    if (cat === 'lightweight_daily') score -= 3;
  }

  // Terrain specificity for trails
  if (userTrail && trail) {
    score += 6;
    if (answers.terrain === 'trail_technical' && shoe.use_cases.includes('trail_technical')) {
      score += 4; reasons.push('Purpose-built for technical trails');
    } else if (answers.terrain === 'trail_groomed' && (cat === 'trail_road_to_trail' || cat === 'trail_neutral')) {
      score += 3; reasons.push('Versatile light-trail design');
    }
  } else if (!userTrail && !trail) {
    score += 3;
  }
  if (answers.terrain === 'track' && (isSuperTrainer(shoe) || isCarbonRacer(shoe) || cat === 'lightweight_daily')) {
    score += 4;
  }

  // ─── 2. COMFORT PREFERENCE — #1 predictor (Nigg 2015) ───────────────────

  if (answers.comfort_pref === 'soft') {
    if (firmness <= 3) { score += 8; reasons.push('Soft, plush cushioning matches your preference'); }
    else if (firmness <= 5) score += 4;
    else if (firmness >= 7) score -= 5;
  } else if (answers.comfort_pref === 'medium') {
    if (firmness >= 4 && firmness <= 6) { score += 6; reasons.push('Balanced cushion feel matches your preference'); }
    else if (firmness >= 3 && firmness <= 7) score += 3;
    else score -= 2;
  } else if (answers.comfort_pref === 'firm') {
    if (firmness >= 7) { score += 8; reasons.push('Firm, responsive feel matches your preference'); }
    else if (firmness >= 5) score += 3;
    else if (firmness <= 3) score -= 5;
  }

  // ─── 3. PRONATION → STABILITY MATCH (v10 NEW — was missing in v6) ───────

  const stabilityLevel = shoe.biomech.stability_level;

  if (answers.pronation === 'overpronate_severe') {
    if (stabilityLevel === 'max_stability') { score += 9; reasons.push('Maximum stability for severe overpronation'); }
    else if (stabilityLevel === 'stability') { score += 6; reasons.push('Stability frame supports overpronation'); }
    else if (stabilityLevel === 'guidance') score += 3;
    else if (stabilityLevel === 'neutral') score -= 6;
  } else if (answers.pronation === 'overpronate_mild') {
    if (stabilityLevel === 'guidance') { score += 7; reasons.push('Guidance support for mild overpronation'); }
    else if (stabilityLevel === 'stability') { score += 6; reasons.push('Stability for overpronation'); }
    else if (stabilityLevel === 'max_stability') score += 2;
    else if (stabilityLevel === 'neutral') score -= 3;
  } else if (answers.pronation === 'neutral') {
    if (stabilityLevel === 'neutral') { score += 5; reasons.push('Neutral construction matches your gait'); }
    else if (stabilityLevel === 'guidance') score += 1;
    else if (isMaxStability(shoe)) score -= 6;
  } else if (answers.pronation === 'supinate') {
    if (stabilityLevel === 'neutral') { score += 6; reasons.push('Neutral, flexible construction suits supinators'); }
    if (isStabilityShoe(shoe)) score -= 8;
    if (cushLevel >= 7) score += 2;
  }

  // ─── 4. BODY WEIGHT × CUSHIONING (Malisoux RCT — 848 runners) ──────────

  if (answers.body_weight === 'very_heavy') {
    if (shoe.biomech.wide_base) { score += 5; reasons.push('Wide base provides extra stability'); }
    if (firmness >= 6) score += 3;
    if (cushLevel >= 7) score += 3;
    if (firmness <= 3 && cushLevel >= 9) score -= 3;
    if (shoe.good_for_conditions.includes('heavy_runner')) { score += 8; reasons.push('Rated for heavier runners'); }
    if (isMaxStability(shoe)) score += 5;
    if (cat === 'max_stability' || cat === 'motion_control') score += 4;
  } else if (answers.body_weight === 'heavy') {
    if (shoe.biomech.wide_base) score += 3;
    if (firmness >= 5) score += 2;
    if (cushLevel >= 6) score += 2;
    if (shoe.good_for_conditions.includes('heavy_runner')) { score += 5; reasons.push('Rated for heavier runners'); }
    if (isMaxStability(shoe) && needsStability(answers)) score += 3;
  } else if (answers.body_weight === 'light') {
    if (cushLevel >= 7 && firmness <= 5) score += 2;
    if (cat === 'lightweight_daily') score += 2;
  }

  // ─── 5. CURRENT INJURIES ─────────────────────────────────────────────────

  if (hasAnyCurrentInjury(answers)) {
    if (isCarbonRacer(shoe)) score -= 15; // shouldn't reach this due to hard filter, but defense in depth

    if (hasCurrent(answers, 'plantar')) {
      if (shoe.good_for_conditions.includes('plantar_fasciitis')) {
        score += 12; reasons.push('Clinically suited for plantar fasciitis');
      }
      score += Math.round(shoe.biomech.rocker * 0.8);
      score += Math.round(shoe.biomech.heel_counter_rigidity * 0.5);
      if (shoe.specs.drop_mm >= 10) score += 5;
      else if (shoe.specs.drop_mm >= 8) score += 4;
      else if (shoe.specs.drop_mm <= 4) score -= 5;
      if (shoe.biomech.midsole_flexibility >= 7) score -= 3; // too flexible aggravates PF
      if (shoe.biomech.torsional_rigidity >= 7) score += 2;
      // Max cushion is independently a PF positive
      if (cushLevel >= 9) score += 3;
    }

    if (hasCurrent(answers, 'achilles')) {
      if (shoe.good_for_conditions.includes('achilles_tendinitis')) {
        score += 6; reasons.push('Suited for Achilles recovery');
      }
      if (shoe.specs.drop_mm >= 10) { score += 5; reasons.push('High heel drop reduces Achilles strain'); }
      else if (shoe.specs.drop_mm >= 8) score += 3;
      else if (shoe.specs.drop_mm >= 6) score += 0;
      else if (shoe.specs.drop_mm >= 4) score -= 4;
      else score -= 10;
    }

    if (hasCurrent(answers, 'knee')) {
      if (shoe.good_for_conditions.includes('knee_pain')) {
        score += 6; reasons.push('Cushioning reduces knee impact stress');
      }
      if (cushLevel >= 7) score += 3;
      if (stabilityLevel === 'neutral' || stabilityLevel === 'guidance') score += 2;
    }

    if (hasCurrent(answers, 'shin')) {
      if (shoe.good_for_conditions.includes('shin_splints')) {
        score += 6; reasons.push('Stability helps manage shin splints');
      }
      if (stabilityLevel === 'guidance' || stabilityLevel === 'stability') score += 4;
      if (cushLevel >= 6) score += 2;
    }

    if (hasCurrent(answers, 'itband')) {
      if (stabilityLevel === 'neutral') score += 3;
      if (stabilityLevel === 'motion_control' || isMaxStability(shoe)) score -= 5;
      if (cushLevel >= 6) score += 2;
    }

    if (hasCurrent(answers, 'metatarsalgia')) {
      if (shoe.biomech.rocker >= 7) {
        score += 6; reasons.push('Rocker geometry offloads the metatarsals');
      }
      if (shoe.specs.stack_heel_mm >= 30) score += 3;
      if (shoe.biomech.toe_box_width >= 7) score += 2;
      if (shoe.good_for_conditions.includes('metatarsalgia')) score += 5;
    }

    if (hasCurrent(answers, 'bunions') || answers.has_bunions) {
      if (shoe.biomech.toe_box_width >= 9) { score += 10; reasons.push('Anatomical toe box accommodates bunions'); }
      else if (shoe.biomech.toe_box_width >= 7) score += 6;
      else if (shoe.biomech.toe_box_width <= 4) score -= 6;
      if (shoe.good_for_conditions.includes('bunions')) score += 7;
    }

    if (hasCurrent(answers, 'morton_neuroma')) {
      if (shoe.biomech.rocker >= 6) score += 4;
      if (cushLevel >= 8) score += 3;
      if (shoe.good_for_conditions.includes('morton_neuroma')) { score += 6; reasons.push("Suited for Morton's neuroma relief"); }
      if (shoe.biomech.toe_box_width <= 4) score -= 4;
    }
  }

  // ─── 6. INJURY HISTORY — prevention weighting ────────────────────────────

  if (hasHistory(answers, 'plantar')) {
    if (shoe.good_for_conditions.includes('plantar_fasciitis')) {
      score += 4; reasons.push('Designed to prevent plantar fasciitis recurrence');
    }
    if (shoe.biomech.rocker >= 5) score += 2;
    if (shoe.specs.drop_mm <= 2) score -= 4;
  }
  if (hasHistory(answers, 'achilles')) {
    if (shoe.specs.drop_mm <= 4) score -= 5;
    if (shoe.specs.drop_mm >= 8) score += 3;
  }
  if (hasHistory(answers, 'stress_fracture')) {
    if (cushLevel >= 8) { score += 5; reasons.push('Max cushioning for impact protection'); }
    if (isCarbonRacer(shoe)) score -= 8;
    if (shoe.good_for_conditions.includes('stress_fracture_history')) score += 6;
  }
  if (hasHistory(answers, 'itband') && isMaxStability(shoe)) score -= 4;
  if (hasHistory(answers, 'shin') && (stabilityLevel === 'guidance' || stabilityLevel === 'stability')) score += 3;
  if (hasHistory(answers, 'knee') && cushLevel >= 6) score += 2;

  // ─── 7. EXPERIENCE SAFETY GATE ───────────────────────────────────────────

  if (answers.experience === 'beginner') {
    if (isCarbonRacer(shoe)) score -= 20; // belt+suspenders (hard filter already blocks)
    if (isSuperTrainer(shoe)) score -= 3;
    if (shoe.specs.drop_mm <= 2) score -= 8;
    if (shoe.specs.drop_mm <= 4 && shoe.specs.drop_mm > 2) score -= 4;
    if (cat === 'neutral_daily' || cat === 'stability_daily' || cat === 'max_cushion_neutral') {
      score += 5; reasons.push('Forgiving trainer perfect for new runners');
    }
    if (cat === 'max_cushion_premium' || cat === 'premium_neutral') score += 3;
  } else if (answers.experience === 'intermediate') {
    if (isCarbonRacer(shoe) && answers.goal !== 'race') score -= 7;
    if (shoe.specs.drop_mm <= 2 && answers.goal !== 'tempo') score -= 3;
  } else if (answers.experience === 'advanced') {
    if (isCarbonRacer(shoe) && (answers.goal === 'race' || answers.goal === 'tempo')) score += 2;
  }

  // ─── 8. FOOT WIDTH ───────────────────────────────────────────────────────

  const shoeWidths = shoe.specs.widths ?? [];
  if (answers.foot_width === 'extra_wide') {
    if (shoeWidths.includes('extra_wide')) { score += 6; reasons.push('Extra-wide width available'); }
    else if (shoeWidths.includes('wide')) score += 2;
    else score -= 5;
    if (shoe.biomech.toe_box_width >= 8) score += 3;
    if (shoe.good_for_conditions.includes('wide_feet')) score += 3;
  } else if (answers.foot_width === 'wide') {
    if (shoeWidths.includes('wide') || shoeWidths.includes('extra_wide')) {
      score += 5; reasons.push('Wide width available for your foot');
    } else score -= 4;
    if (shoe.biomech.toe_box_width >= 7) score += 2;
    if (shoe.good_for_conditions.includes('wide_feet')) score += 3;
  } else if (answers.foot_width === 'narrow') {
    if (shoeWidths.includes('narrow')) { score += 4; reasons.push('Narrow width available'); }
    if (shoe.good_for_conditions.includes('narrow_feet')) score += 3;
    if (shoe.biomech.toe_box_width <= 5) score += 1;
  }

  // ─── 9. ORTHOTIC USER ────────────────────────────────────────────────────

  if (answers.wears_orthotics) {
    if (shoe.biomech.removable_insole === false) score -= 15; // belt+suspenders
    if (shoe.good_for_conditions.includes('orthotic_user')) { score += 5; reasons.push('Orthotic-friendly design'); }
    if (shoe.biomech.wide_base) score += 2;
    if (shoe.biomech.toe_box_width >= 6) score += 1;
  }

  // ─── 10. ARCH TYPE (demoted — supplementary only) ────────────────────────

  if (answers.arch_type === 'flat' && answers.pronation === 'unsure') {
    // Only when pronation unknown — let arch infer
    if (isStabilityShoe(shoe)) { score += 4; reasons.push('Stability support for flat arches'); }
    if (stabilityLevel === 'neutral') score -= 1;
  } else if (answers.arch_type === 'high' && answers.pronation === 'unsure') {
    if (cat === 'max_cushion_neutral' || cat === 'max_cushion_premium') {
      score += 4; reasons.push('Maximum cushioning suits high-arched feet');
    } else if (stabilityLevel === 'neutral') score += 2;
    if (isMaxStability(shoe)) score -= 5;
    if (shoe.biomech.midsole_flexibility >= 6) score += 1;
  } else if (answers.arch_type === 'normal') {
    if (shoe.good_for_conditions.includes('neutral_arch')) score += 2;
  }

  // ─── 11. DROP PREFERENCE ─────────────────────────────────────────────────

  if (answers.drop_pref && answers.drop_pref !== 'no_pref') {
    if (answers.drop_pref === 'low') {
      if (shoe.specs.drop_mm <= 4) score += 4;
      else if (shoe.specs.drop_mm <= 6) score += 1;
      else if (shoe.specs.drop_mm >= 10) score -= 3;
    } else if (answers.drop_pref === 'medium') {
      if (shoe.specs.drop_mm >= 5 && shoe.specs.drop_mm <= 8) score += 3;
      else if (shoe.specs.drop_mm <= 4 || shoe.specs.drop_mm >= 11) score -= 2;
    } else if (answers.drop_pref === 'high') {
      if (shoe.specs.drop_mm >= 9) score += 3;
      else if (shoe.specs.drop_mm <= 5) score -= 3;
    }
  }

  // ─── 12. CONDITION MATCHING — supplementary sweep ────────────────────────

  const targetConds = buildTargetConditions(answers);
  const goodFor = shoe.good_for_conditions ?? [];
  const avoidFor = shoe.avoid_for_conditions ?? [];
  const matched = goodFor.filter(c => targetConds.includes(c));
  score += matched.length * 2;
  const avoided = avoidFor.filter(c => targetConds.includes(c));
  score -= avoided.length * 5;

  // ─── 13. MARKET-MAINSTREAM TIEBREAKER (v10 NEW) ─────────────────────────

  if (MARKET_MAINSTREAM.has(shoe.id) && score > 10) {
    score += 3;
    // Don't push a reason — this is a tiebreaker not a feature
  }

  // ─── 14. CATEGORY-FIT TIEBREAKER (light) ─────────────────────────────────

  // Tiny bonus for category aligning with derived stability needs
  if (needsMaxStability(answers) && isMaxStability(shoe)) score += 2;
  if (needsStability(answers) && !needsMaxStability(answers) && stabilityLevel === 'guidance') score += 1;

  return { score: Math.max(0, score), reasons: reasons.slice(0, 4) };
};

// ─── Public entry point ─────────────────────────────────────────────────────

export const getRecommendations = (answers: QuizAnswers, shoes: Shoe[]): ScoredShoe[] => {
  // PASS 1: Hard terrain filter
  const terrainPool = shoes.filter(s => passesTerrainFilter(s, answers));

  // PASS 2: Hard avoid filter
  const eligible = terrainPool.filter(s => !shouldHardAvoid(s, answers));

  // If filters leave < 5 shoes, relax avoid filter but keep terrain
  const pool = eligible.length >= 5 ? eligible : terrainPool;
  const inFallback = pool === terrainPool && eligible.length < 5;

  const scored = pool.map(shoe => {
    const { score, reasons } = scoreShoe(shoe, answers);
    let finalScore = score;
    if (inFallback) {
      // Apply soft penalty in fallback
      const userConds = buildTargetConditions(answers);
      const avoidFor = shoe.avoid_for_conditions ?? [];
      const penalty = avoidFor.filter(c => userConds.includes(c)).length;
      finalScore = Math.max(0, finalScore - penalty * 8);
    }
    return { ...shoe, score: finalScore, reasons };
  });

  // Filter zero scores + brand preference
  const filtered = scored.filter(shoe => {
    if (shoe.score <= 0) return false;
    if (answers.brand_pref.length > 0) return answers.brand_pref.includes(shoe.brand);
    return true;
  });

  // Sort: score desc, then good_for matches desc (tiebreaker), then weight asc
  return filtered
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const targetConds = buildTargetConditions(answers);
      const aMatches = (a.good_for_conditions ?? []).filter(c => targetConds.includes(c)).length;
      const bMatches = (b.good_for_conditions ?? []).filter(c => targetConds.includes(c)).length;
      if (bMatches !== aMatches) return bMatches - aMatches;
      return a.specs.weight_oz - b.specs.weight_oz;
    })
    .slice(0, 18);
};

export const getAllBrands = (shoes: Shoe[]): string[] => {
  return [...new Set(shoes.map(s => s.brand))].sort();
};
