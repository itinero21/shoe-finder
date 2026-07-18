import { Shoe } from '../data/shoes';

/**
 * STRIDE//PROTOCOL — Fit Engine v12 (Prescription + Shoe DNA)
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

export type WeeklyMileage = 'low' | 'moderate' | 'high' | 'very_high';
export type AvgPace = 'slow' | 'easy' | 'steady' | 'fast' | 'elite' | 'unknown';
export type RunnerPriority = 'comfort' | 'injury_prevention' | 'one_shoe' | 'speed' | 'max_cushion' | 'natural' | 'value';
export type CurrentShoeFeel =
  | 'none' | 'ghost' | 'clifton' | 'bondi' | 'nimbus' | 'novablast' | 'kayano'
  | 'adrenaline' | '1080' | 'ride' | 'triumph' | 'speedgoat' | 'lone_peak'
  | 'endorphin_speed' | 'superblast' | 'pegasus';

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

  // v12 — real fitter signals. Optional so old saved quizzes do not break.
  weekly_mileage?: WeeklyMileage;
  avg_pace?: AvgPace;
  priority?: RunnerPriority;
  current_shoe_feel?: CurrentShoeFeel;

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

// ─── v11 Safety / intent helpers ───────────────────────────────────────────
// Keep these conservative. They reduce the last 10% of "technically high score,
// obviously wrong shoe" cases without changing the database shape.

function safeArray<T>(value: T[] | undefined | null, fallback: T[] = []): T[] {
  return Array.isArray(value) ? value : fallback;
}

function normalizeAnswers(answers: QuizAnswers): QuizAnswers {
  return {
    ...answers,
    injury_current: safeArray(answers.injury_current, ['none' as InjuryCurrent]),
    injury_history: safeArray(answers.injury_history, ['none' as InjuryHistory]),
    brand_pref: safeArray(answers.brand_pref, []),
    goal: answers.goal ?? 'easy_base',
    experience: answers.experience ?? 'intermediate',
    foot_width: answers.foot_width ?? 'regular',
    arch_type: answers.arch_type ?? 'unsure',
    drop_pref: answers.drop_pref ?? 'no_pref',
    weekly_mileage: answers.weekly_mileage ?? 'moderate',
    avg_pace: answers.avg_pace ?? 'unknown',
    priority: answers.priority ?? derivePriorityFromGoal(answers),
    current_shoe_feel: answers.current_shoe_feel ?? 'none',
    wears_orthotics: !!answers.wears_orthotics,
  };
}

function isLowDropZeroShoe(shoe: Shoe): boolean {
  return shoe.specs.drop_mm <= 2;
}

function isVeryUnstableForSevereOverpronation(shoe: Shoe): boolean {
  return isNeutralShoe(shoe)
    && !shoe.biomech.wide_base
    && shoe.biomech.torsional_rigidity <= 6
    && shoe.biomech.heel_counter_rigidity <= 7;
}

function isRoadToTrailShoe(shoe: Shoe): boolean {
  return shoe.category === 'trail_road_to_trail';
}

function isTechnicalTrailShoe(shoe: Shoe): boolean {
  return shoe.use_cases.includes('trail_technical')
    || shoe.category === 'trail_technical'
    || shoe.category === 'trail_carbon_racer';
}

function isUltraTrailShoe(shoe: Shoe): boolean {
  return shoe.use_cases.includes('trail_ultra') || shoe.category === 'trail_max_cushion';
}

function hasWideFit(shoe: Shoe): boolean {
  const widths = shoe.specs.widths ?? [];
  return widths.includes('wide') || widths.includes('extra_wide') || shoe.biomech.toe_box_width >= 7;
}

function hasExtraWideFit(shoe: Shoe): boolean {
  const widths = shoe.specs.widths ?? [];
  return widths.includes('extra_wide') || shoe.biomech.toe_box_width >= 9;
}


function derivePriorityFromGoal(answers: Partial<QuizAnswers>): RunnerPriority {
  if (answers.goal === 'tempo' || answers.goal === 'race') return 'speed';
  if (answers.goal === 'walking') return 'comfort';
  return 'one_shoe';
}

type ShoePrescription =
  | 'motion_control'
  | 'stability_daily'
  | 'neutral_daily'
  | 'max_cushion'
  | 'tempo_trainer'
  | 'race_tool'
  | 'trail_daily'
  | 'trail_technical'
  | 'walking_comfort';

function prescribeShoeClass(answers: QuizAnswers): ShoePrescription {
  if (answers.terrain === 'trail_technical') return 'trail_technical';
  if (answers.terrain === 'trail_groomed') return 'trail_daily';
  if (answers.goal === 'walking') return 'walking_comfort';
  if (needsMaxStability(answers)) return 'motion_control';
  if (needsStability(answers)) return 'stability_daily';
  if (answers.goal === 'race' && answers.experience !== 'beginner' && !hasAnyCurrentInjury(answers)) return 'race_tool';
  if (answers.goal === 'tempo') return 'tempo_trainer';
  if (answers.priority === 'max_cushion' || answers.comfort_pref === 'soft' || hasHistory(answers, 'stress_fracture')) return 'max_cushion';
  return 'neutral_daily';
}

function prescriptionScore(shoe: Shoe, answers: QuizAnswers): number {
  const rx = prescribeShoeClass(answers);
  const cat = shoe.category;
  switch (rx) {
    case 'motion_control':
      if (cat === 'motion_control' || isMaxStability(shoe)) return 16;
      if (isStabilityShoe(shoe) && shoe.biomech.wide_base) return 8;
      return -18;
    case 'stability_daily':
      if (['stability_daily', 'stability_premium'].includes(cat)) return 14;
      if (isStabilityShoe(shoe)) return 10;
      if (isMaxStability(shoe)) return answers.body_weight === 'very_heavy' ? 4 : -6;
      return -10;
    case 'neutral_daily':
      if (['neutral_daily', 'premium_neutral', 'max_cushion_neutral'].includes(cat)) return 12;
      if (cat === 'max_cushion_premium') return 8;
      if (isSuperTrainer(shoe)) return -2;
      if (isCarbonRacer(shoe) || isMaxStability(shoe)) return -12;
      return 0;
    case 'max_cushion':
      if (['max_cushion_neutral', 'max_cushion_premium', 'premium_neutral'].includes(cat)) return 15;
      if (['stability_premium'].includes(cat)) return 11;
      if (shoe.biomech.cushioning_level >= 8) return 6;
      if (isCarbonRacer(shoe)) return -12;
      return -2;
    case 'tempo_trainer':
      if (isSuperTrainer(shoe)) return 15;
      if (['lightweight_daily', 'stability_lightweight'].includes(cat)) return 11;
      if (isCarbonRacer(shoe) && answers.experience === 'advanced') return 6;
      if (isMaxStability(shoe)) return -12;
      return -2;
    case 'race_tool':
      if (isCarbonRacer(shoe)) return 16;
      if (isSuperTrainer(shoe)) return 10;
      if (['lightweight_daily', 'stability_lightweight'].includes(cat)) return 5;
      return -6;
    case 'trail_daily':
      if (['trail_neutral', 'trail_road_to_trail', 'trail_max_cushion'].includes(cat)) return 14;
      if (isTrailShoe(shoe)) return 8;
      return -20;
    case 'trail_technical':
      if (['trail_neutral', 'trail_performance', 'trail_max_cushion', 'trail_carbon_racer'].includes(cat) && !isRoadToTrailShoe(shoe)) return 15;
      if (isRoadToTrailShoe(shoe)) return -12;
      return -20;
    case 'walking_comfort':
      if (['max_cushion_neutral', 'max_cushion_premium', 'premium_neutral', 'stability_premium', 'motion_control'].includes(cat)) return 14;
      if (shoe.biomech.cushioning_level >= 8 && shoe.biomech.rocker >= 6) return 8;
      if (isCarbonRacer(shoe) || isSuperTrainer(shoe)) return -20;
      return -2;
  }
}

function shoeName(shoe: Shoe): string {
  return `${shoe.brand} ${shoe.model}`.toLowerCase();
}

function matchesCurrentShoeFamily(shoe: Shoe, feel: CurrentShoeFeel): boolean {
  if (!feel || feel === 'none') return false;
  const n = shoeName(shoe);
  const family: Record<CurrentShoeFeel, string[]> = {
    none: [],
    ghost: ['ghost', 'ride', '880', 'wave rider'],
    clifton: ['clifton', 'ghost max', 'skyflow', '880'],
    bondi: ['bondi', 'glycerin max', 'more', 'via olympus'],
    nimbus: ['nimbus', '1080', 'glycerin', 'triumph'],
    novablast: ['novablast', 'mach', 'velocity nitro', 'rebel'],
    kayano: ['kayano', 'glycerin gts', 'hurricane', 'gaviota'],
    adrenaline: ['adrenaline', 'gt-2000', '860', 'guide', 'inspire'],
    '1080': ['1080', 'nimbus', 'glycerin', 'triumph'],
    ride: ['ride', 'ghost', '880', 'wave rider'],
    triumph: ['triumph', 'glycerin', 'nimbus', '1080'],
    speedgoat: ['speedgoat', 'caldera', 'hierro', 'trabuco'],
    lone_peak: ['lone peak', 'experience wild', 'olympus'],
    endorphin_speed: ['endorphin speed', 'mach x', 'hyperion max', 'supercomp trainer'],
    superblast: ['superblast', 'megablast', 'hyperion max', 'neo vista'],
    pegasus: ['pegasus', 'ghost', 'ride', '880'],
  };
  return family[feel].some(token => n.includes(token));
}

function currentShoeBridgeScore(shoe: Shoe, answers: QuizAnswers): number {
  const feel = answers.current_shoe_feel ?? 'none';
  if (feel === 'none') return 0;
  if (matchesCurrentShoeFamily(shoe, feel)) return 8;

  // Safe bridges when the exact family is not in the selected brand set.
  const cat = shoe.category;
  if (['ghost', 'ride', 'pegasus'].includes(feel) && ['neutral_daily', 'premium_neutral'].includes(cat)) return 3;
  if (['bondi', 'nimbus', 'triumph', '1080', 'clifton'].includes(feel) && shoe.biomech.cushioning_level >= 8) return 4;
  if (['kayano', 'adrenaline'].includes(feel) && isStabilityShoe(shoe)) return 5;
  if (['speedgoat', 'lone_peak'].includes(feel) && isTrailShoe(shoe)) return 4;
  if (['endorphin_speed', 'superblast', 'novablast'].includes(feel) && (isSuperTrainer(shoe) || shoe.biomech.energy_return >= 8)) return 4;
  return 0;
}

function priorityScore(shoe: Shoe, answers: QuizAnswers): number {
  switch (answers.priority) {
    case 'comfort':
      return (shoe.biomech.cushioning_level >= 8 ? 5 : 0) + (shoe.biomech.upper_softness && shoe.biomech.upper_softness >= 7 ? 2 : 0) - (isCarbonRacer(shoe) ? 8 : 0);
    case 'injury_prevention':
      return (shoe.biomech.wide_base ? 4 : 0) + (shoe.biomech.rocker >= 6 ? 3 : 0) + (shoe.biomech.heel_counter_rigidity >= 7 ? 2 : 0) - (isCarbonRacer(shoe) ? 10 : 0);
    case 'one_shoe':
      return (isDailyTrainer(shoe) ? 6 : 0) + (shoe.use_cases.includes('daily_versatile') ? 3 : 0) - (isCarbonRacer(shoe) ? 8 : 0);
    case 'speed':
      return (shoe.biomech.energy_return >= 8 ? 5 : 0) + (shoe.specs.weight_oz <= 8.8 ? 3 : 0) + (isSuperTrainer(shoe) ? 4 : 0);
    case 'max_cushion':
      return (shoe.biomech.cushioning_level >= 9 ? 7 : shoe.biomech.cushioning_level >= 8 ? 4 : -3);
    case 'natural':
      return (shoe.specs.drop_mm <= 6 ? 4 : -2) + (shoe.biomech.midsole_flexibility >= 6 ? 3 : 0) + (shoe.biomech.toe_box_width >= 7 ? 3 : 0) - (isMaxStability(shoe) ? 8 : 0);
    case 'value':
      return (shoe.price_usd <= 120 ? 5 : shoe.price_usd <= 150 ? 2 : -2) + (isDailyTrainer(shoe) ? 2 : 0);
    default:
      return 0;
  }
}

function mileagePaceScore(shoe: Shoe, answers: QuizAnswers): number {
  let score = 0;
  if (answers.weekly_mileage === 'high' || answers.weekly_mileage === 'very_high') {
    if (shoe.biomech.cushioning_level >= 8) score += 4;
    if (shoe.biomech.wide_base) score += 2;
    if (isCarbonRacer(shoe) && answers.goal !== 'race') score -= 7;
    if (shoe.category === 'lightweight_daily' && answers.weekly_mileage === 'very_high' && answers.goal === 'easy_base') score -= 5;
  }
  if (answers.weekly_mileage === 'low') {
    if (shoe.price_usd <= 150 && isDailyTrainer(shoe)) score += 3;
    if (isCarbonRacer(shoe)) score -= 6;
  }
  if (answers.avg_pace === 'slow' || answers.avg_pace === 'easy') {
    if (shoe.biomech.rocker >= 6) score += 3;
    if (isCarbonRacer(shoe)) score -= 8;
  }
  if (answers.avg_pace === 'fast' || answers.avg_pace === 'elite') {
    if (shoe.biomech.energy_return >= 8) score += 4;
    if (shoe.specs.weight_oz <= 8.5) score += 3;
  }
  return score;
}

function categoryIntentScore(shoe: Shoe, answers: QuizAnswers): number {
  const goal = answers.goal;
  const cat = shoe.category;

  if (goal === 'easy_base') {
    if (['neutral_daily', 'stability_daily', 'premium_neutral', 'stability_premium', 'max_cushion_neutral', 'max_cushion_premium'].includes(cat)) return 3;
    if (isSuperTrainer(shoe)) return -2;
    if (isCarbonRacer(shoe)) return -6;
  }

  if (goal === 'walking') {
    if (['max_cushion_neutral', 'max_cushion_premium', 'premium_neutral', 'stability_premium', 'motion_control'].includes(cat)) return 4;
    if (isSuperTrainer(shoe)) return -4;
    if (isCarbonRacer(shoe)) return -8;
  }

  if (goal === 'tempo') {
    if (isSuperTrainer(shoe)) return 4;
    if (cat === 'lightweight_daily' || cat === 'stability_lightweight') return 3;
    if (cat === 'max_cushion_premium' || cat === 'motion_control') return -3;
  }

  if (goal === 'race') {
    if (isCarbonRacer(shoe)) return 4;
    if (isSuperTrainer(shoe)) return 2;
    if (cat === 'motion_control') return -5;
  }

  return 0;
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

  if (answers.terrain === 'road' || answers.terrain === 'track') {
    return !trail;
  }

  if (answers.terrain === 'trail_groomed') {
    // Groomed trails can use true trail or road-to-trail shoes.
    return trail;
  }

  if (answers.terrain === 'trail_technical') {
    // Do not let light road-to-trail shoes win technical trail profiles.
    return trail && !isRoadToTrailShoe(shoe) && (isTechnicalTrailShoe(shoe) || isUltraTrailShoe(shoe));
  }

  return true;
}

// ─── Hard avoid filter ──────────────────────────────────────────────────────

function shouldHardAvoid(shoe: Shoe, answers: QuizAnswers): boolean {
  const userConds = buildTargetConditions(answers);
  const avoidFor = shoe.avoid_for_conditions ?? [];
  if (avoidFor.some(c => userConds.includes(c))) return true;

  // Brand-new / injured / casual runners should not be pushed into race tools.
  if (isCarbonRacer(shoe)) {
    if (answers.experience === 'beginner') return true;
    if (answers.goal === 'easy_base' || answers.goal === 'walking') return true;
    if (hasAnyCurrentInjury(answers)) return true;
  }

  // Severe support needs: do not recommend flexible neutral shoes that lack a wide,
  // controlled platform. This is the most common "why did it recommend that?" miss.
  if (needsMaxStability(answers)) {
    if (isVeryUnstableForSevereOverpronation(shoe)) return true;
    if (isCarbonRacer(shoe) || isSuperTrainer(shoe)) return true;
  }

  // Supinators/high arches should avoid max-stability and motion-control shoes.
  // Guidance shoes are allowed only if they are not aggressive max support.
  if (mustAvoidStability(answers) && (isMaxStability(shoe) || shoe.category === 'motion_control')) return true;

  // Current Achilles issues: block true zero-drop / near-zero-drop.
  if (hasCurrent(answers, 'achilles') && isLowDropZeroShoe(shoe)) return true;

  // Orthotic users need removable insoles.
  if (answers.wears_orthotics && shoe.biomech.removable_insole === false) return true;

  // Width safety: don't show narrow-only/regular-only shoes to extra-wide users unless
  // the toe box is genuinely anatomical. Bad fit is a top reason recs feel wrong.
  if (answers.foot_width === 'extra_wide' && !hasExtraWideFit(shoe)) return true;

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

  // ─── 13. v12 PRESCRIPTION / REAL-FITTER SIGNALS ────────────────────────

  const rxBonus = prescriptionScore(shoe, answers);
  score += rxBonus;
  if (rxBonus >= 12) reasons.push('Best match for your prescribed shoe category');

  const currentBonus = currentShoeBridgeScore(shoe, answers);
  score += currentBonus;
  if (currentBonus >= 8) reasons.push('Matches the feel of shoes you already know');

  const priBonus = priorityScore(shoe, answers);
  score += priBonus;
  if (priBonus >= 6) reasons.push('Strong fit for your main priority');

  score += mileagePaceScore(shoe, answers);

  // ─── 14. MARKET-MAINSTREAM TIEBREAKER (v10 NEW) ─────────────────────────

  if (MARKET_MAINSTREAM.has(shoe.id) && score > 10) {
    score += 3;
    // Don't push a reason — this is a tiebreaker not a feature
  }

  // ─── 15. CATEGORY-FIT TIEBREAKER (light) ─────────────────────────────────

  // Tiny bonus for category aligning with derived stability needs
  if (needsMaxStability(answers) && isMaxStability(shoe)) score += 2;
  if (needsStability(answers) && !needsMaxStability(answers) && stabilityLevel === 'guidance') score += 1;


  return { score: Math.max(0, score), reasons: reasons.slice(0, 4) };
};

// ─── Public entry point ─────────────────────────────────────────────────────

export const getRecommendations = (rawAnswers: QuizAnswers, shoes: Shoe[]): ScoredShoe[] => {
  const answers = normalizeAnswers(rawAnswers);

  // PASS 1: hard terrain filter.
  const terrainPool = shoes.filter(s => passesTerrainFilter(s, answers));

  // PASS 2: safety filter. v11 change: never relax this. Fewer safe shoes is
  // better than filling the list with harmful or obviously wrong options.
  const safePool = terrainPool.filter(s => !shouldHardAvoid(s, answers));

  const scored = safePool.map(shoe => {
    const { score, reasons } = scoreShoe(shoe, answers);
    return {
      ...shoe,
      score: Math.max(0, score + categoryIntentScore(shoe, answers)),
      reasons,
    };
  });

  // Brand preference should be a preference, not a safety override.
  const brandFiltered = scored.filter(shoe => {
    if (shoe.score <= 0) return false;
    if (answers.brand_pref.length > 0) return answers.brand_pref.includes(shoe.brand);
    return true;
  });

  // If the chosen brands produce too few options, return them anyway instead of
  // mixing in unchosen brands. The UI can show "only 3 safe matches from HOKA".
  const filtered = brandFiltered;

  const targetConds = buildTargetConditions(answers);
  return filtered
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const aRx = prescriptionScore(a, answers);
      const bRx = prescriptionScore(b, answers);
      if (bRx !== aRx) return bRx - aRx;

      const aCurrent = currentShoeBridgeScore(a, answers);
      const bCurrent = currentShoeBridgeScore(b, answers);
      if (bCurrent !== aCurrent) return bCurrent - aCurrent;

      const aMatches = (a.good_for_conditions ?? []).filter(c => targetConds.includes(c)).length;
      const bMatches = (b.good_for_conditions ?? []).filter(c => targetConds.includes(c)).length;
      if (bMatches !== aMatches) return bMatches - aMatches;

      const aIntent = categoryIntentScore(a, answers);
      const bIntent = categoryIntentScore(b, answers);
      if (bIntent !== aIntent) return bIntent - aIntent;

      // For easy/walking users, stable comfortable geometry beats low weight.
      if (answers.goal === 'easy_base' || answers.goal === 'walking') {
        const aComfort = a.biomech.cushioning_level + a.biomech.rocker + (a.biomech.wide_base ? 2 : 0);
        const bComfort = b.biomech.cushioning_level + b.biomech.rocker + (b.biomech.wide_base ? 2 : 0);
        if (bComfort !== aComfort) return bComfort - aComfort;
      }

      // For speed/race users, lighter wins the final tie.
      return a.specs.weight_oz - b.specs.weight_oz;
    })
    .slice(0, 18);
};

export const getAllBrands = (shoes: Shoe[]): string[] => {
  return [...new Set(shoes.map(s => s.brand))].sort();
};
