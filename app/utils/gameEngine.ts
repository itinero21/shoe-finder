/**
 * STRIDE//PROTOCOL — Shoe Wars Game Engine
 * Deterministic stat derivation from biomech scores.
 * Every shoe in the database becomes a game character. No editorial work required.
 */

import { Shoe } from '../data/shoes';

export type StatTier = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface ShoeGameStats {
  speed: number;        // 1-10
  endurance: number;    // 1-10
  grip: number;         // 1-10
  comfort: number;      // 1-10
  tier: StatTier;
  overall: number;      // 1-10 average
}

export interface UserLevel {
  level: number;
  name: string;
  xp_required: number;
  next_xp?: number;
  unlocks?: string;
}

export const LEVELS: UserLevel[] = [
  { level: 1, name: 'RECRUIT',     xp_required: 0,     next_xp: 250 },
  { level: 2, name: 'ROOKIE',      xp_required: 250,   next_xp: 750 },
  { level: 3, name: 'REGULAR',     xp_required: 750,   next_xp: 1500 },
  { level: 4, name: 'GRINDER',     xp_required: 1500,  next_xp: 3000 },
  { level: 5, name: 'VETERAN',     xp_required: 3000,  next_xp: 5500, unlocks: 'Full game scoring — beginner protections lifted' },
  { level: 6, name: 'TACTICIAN',   xp_required: 5500,  next_xp: 9000 },
  { level: 7, name: 'STRATEGIST',  xp_required: 9000,  next_xp: 14000 },
  { level: 8, name: 'MASTER',      xp_required: 14000, next_xp: 21000 },
  { level: 9, name: 'GRANDMASTER', xp_required: 21000, next_xp: 30000 },
  { level: 10, name: 'LEGEND',     xp_required: 30000, unlocks: 'Profile flair, custom title, contribute to glossary' },
];

const GRIP_BY_CATEGORY: Record<string, number> = {
  trail_technical:   10,
  trail_max_cushion: 9,
  trail_neutral:     8,
  trail_road_to_trail: 7,
  trail_carbon_racer: 8,
  motion_control:    6,
  // all road categories default to 5
};

const cap = (n: number): number => Math.max(1, Math.min(10, Math.round(n)));

export function deriveShoeStats(shoe: Shoe): ShoeGameStats {
  const b = shoe.biomech;
  const s = shoe.specs;

  // SPEED: bouncy foam + lighter weight + firm (responsive) midsole
  const speed = cap(
    (b.energy_return * 0.4) +
    ((10 - b.cushioning_firmness) * 0.2) +
    ((10 - Math.max(0, s.weight_oz - 6)) * 0.4)
  );

  // ENDURANCE: cushion level + heel support + stack height
  const endurance = cap(
    (b.cushioning_level * 0.5) +
    (b.heel_counter_rigidity * 0.2) +
    (s.stack_heel_mm / 5)
  );

  // GRIP: derived from category (outsole data not in biomech scores)
  const grip = cap(GRIP_BY_CATEGORY[shoe.category] ?? 5);

  // COMFORT: wide toe box + soft upper + soft foam
  const upperSoftness = b.upper_softness ?? 6;
  const comfort = cap((b.toe_box_width + upperSoftness + (10 - b.cushioning_firmness)) / 3);

  const overall = cap((speed + endurance + grip + comfort) / 4);

  return { speed, endurance, grip, comfort, tier: getTier(overall), overall };
}

export function getTier(stat: number): StatTier {
  if (stat >= 10) return 'Legendary';
  if (stat >= 8)  return 'Epic';
  if (stat >= 6)  return 'Rare';
  if (stat >= 4)  return 'Uncommon';
  return 'Common';
}

export const TIER_COLORS: Record<StatTier, string> = {
  Common:     '#6B7280',
  Uncommon:   '#16A34A',
  Rare:       '#2563EB',
  Epic:       '#7C3AED',
  Legendary:  '#FF3D00',
};

export function getExpectedLifespan(shoe: Shoe, weightKg?: number): number {
  const BASE: Record<string, number> = {
    carbon_plate_racing: 300,
    super_trainer:       350,
    max_cushion_premium: 400,
    premium_neutral:     400,
    lightweight_daily:   450,
    neutral_daily:       500,
    stability_daily:     500,
    max_cushion_neutral: 550,
    motion_control:      600,
    max_stability:       600,
    trail_neutral:       400,
    trail_max_cushion:   400,
    trail_technical:     380,
    trail_carbon_racer:  300,
  };

  const base = BASE[shoe.category] ?? 500;
  let modifier = 1.0;
  if (weightKg) {
    if (weightKg > 90) modifier = 0.8;
    else if (weightKg > 72) modifier = 0.9;
  }
  return Math.round(base * modifier);
}

export function getLifecycleStatus(miles: number, lifespan: number): {
  label: string;
  color: string;
  pct: number;
  alert: string | null;
} {
  const pct = miles / lifespan;
  if (pct >= 1.2) return { label: 'OVERDUE', color: '#FF3D00', pct: Math.min(pct, 1), alert: `Past lifespan by ${Math.round((pct - 1) * lifespan)} mi — injury risk elevated.` };
  if (pct >= 1.0) return { label: 'RETIRE', color: '#FF3D00', pct: 1, alert: `${shoe_name_placeholder} has run its last mile. Time to retire it.` };
  if (pct >= 0.87) return { label: 'AGING', color: '#D97706', pct, alert: `At ${Math.round(pct * 100)}% lifespan. ~${Math.round((1 - pct) * lifespan)} miles left.` };
  if (pct >= 0.70) return { label: 'WARMED', color: '#2563EB', pct, alert: null };
  return { label: 'FRESH', color: '#16A34A', pct, alert: null };
}

// placeholder gets overridden at call site
const shoe_name_placeholder = 'This shoe';

export function getUserLevel(totalXP: number): { current: UserLevel; progress: number } {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (totalXP >= level.xp_required) current = level;
  }
  const next = LEVELS.find(l => l.level === current.level + 1);
  const progress = next
    ? (totalXP - current.xp_required) / (next.xp_required - current.xp_required)
    : 1;
  return { current, progress };
}

// XP from a run
export function calcRunXP(
  miles: number,
  matchQuality: 'perfect' | 'good' | 'neutral' | 'poor' | 'abuse',
  isBeginnerMode: boolean
): number {
  const MULTIPLIERS = { perfect: 2.0, good: 1.5, neutral: 1.0, poor: 0.5, abuse: 0.25 };
  const cappedMiles = Math.min(miles, 30);
  const base = cappedMiles * 2;
  const multi = MULTIPLIERS[matchQuality];
  const xp = Math.round(base * multi);
  const cap = isBeginnerMode ? 120 : 60;
  return Math.min(xp, cap);
}
