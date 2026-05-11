/**
 * SHOE FATIGUE MODEL — Weighted impact-load replaces simple mileage counting.
 * "Battery health for running shoes."
 *
 * Formula per run:
 *   wear_load = miles × weight_factor × pace_factor × terrain_factor × foam_decay_factor
 *
 * Phase B of v8 intelligence spec.
 */

import { Shoe } from '../data/shoes';
import { Run } from '../types/run';

// ── Expected lifespan by category (in wear-load units, not raw miles) ─────────
const LIFESPAN_LOAD: Record<string, number> = {
  carbon_racer:         250,
  super_trainer:        350,
  max_cushion_premium:  450,
  premium_neutral:      450,
  max_cushion_neutral:  500,
  lightweight_daily:    400,
  neutral_daily:        500,
  stability_daily:      500,
  stability_premium:    500,
  stability_lightweight:400,
  motion_control:       600,
  max_stability:        550,
  trail_neutral:        400,
  trail_max_cushion:    450,
  trail_road_to_trail:  450,
  trail_technical:      400,
  trail_carbon_racer:   300,
  trail_performance:    400,
};

// ── Foam type detection from tech string array ─────────────────────────────────
export type FoamType = 'peba' | 'supercritical_eva' | 'tpu' | 'standard_eva';

const PEBA_KEYWORDS      = ['peba', 'pebax', 'zoomx', 'lightstrike pro', 'pwrrun pb', 'superfoam', 'profly+', 'carbonx', 'carbon x'];
const SUPERCRIT_KEYWORDS = ['nitrogen', 'supercritical', 'pceva', 'react ', 'dna loft', 'dna flash', 'fresh foam x', 'hyperion foam', 'pwrrun+'];
const TPU_KEYWORDS       = ['boost', 'tpu ', 'thermoplastic'];

export function detectFoamType(techArray: string[]): FoamType {
  const combined = techArray.join(' ').toLowerCase();
  if (PEBA_KEYWORDS.some(k => combined.includes(k)))      return 'peba';
  if (SUPERCRIT_KEYWORDS.some(k => combined.includes(k))) return 'supercritical_eva';
  if (TPU_KEYWORDS.some(k => combined.includes(k)))       return 'tpu';
  return 'standard_eva';
}

export function foamDecayFactor(foam: FoamType): number {
  switch (foam) {
    case 'peba':             return 1.4; // degrades faster, 200-300 mi in lab
    case 'supercritical_eva':return 1.2;
    case 'tpu':              return 0.9; // Boost-style holds up well
    case 'standard_eva':
    default:                 return 1.0;
  }
}

export function foamLabel(foam: FoamType): string {
  switch (foam) {
    case 'peba':              return 'PEBA';
    case 'supercritical_eva': return 'SUPERCRITICAL EVA';
    case 'tpu':               return 'TPU';
    default:                  return 'STANDARD EVA';
  }
}

// ── Per-run factors ────────────────────────────────────────────────────────────
function weightFactor(weightLbs: number): number {
  return Math.min(2.0, Math.max(1.0, weightLbs / 160));
}

function paceFactor(purpose: string | undefined): number {
  switch (purpose) {
    case 'walk':     return 0.9;
    case 'easy':
    case 'recovery': return 1.0;
    case 'long':     return 1.0;
    case 'tempo':    return 1.15;
    case 'speed':    return 1.3;
    case 'race':     return 1.3;
    default:         return 1.0;
  }
}

function terrainFactor(terrain: string | undefined): number {
  switch (terrain) {
    case 'trail':    return 0.85; // softer surface, less foam compression
    case 'treadmill':return 0.80;
    case 'track':    return 1.05;
    case 'road':
    default:         return 1.0;
  }
}

// ── Per-run wear load ─────────────────────────────────────────────────────────
export function computeRunWearLoad(
  run: Run,
  shoe: Shoe,
  weightLbs = 160
): number {
  const miles = run.distanceKm * 0.621371;
  const foam  = detectFoamType(shoe.tech);
  return (
    miles
    * weightFactor(weightLbs)
    * paceFactor(run.purpose)
    * terrainFactor(run.terrain)
    * foamDecayFactor(foam)
  );
}

// ── Cumulative wear load for a shoe ──────────────────────────────────────────
export function computeTotalWearLoad(
  shoe: Shoe,
  runs: Run[],
  weightLbs = 160
): number {
  return runs
    .filter(r => r.shoeId === shoe.id)
    .reduce((sum, r) => sum + computeRunWearLoad(r, shoe, weightLbs), 0);
}

// ── Health score and lifecycle ────────────────────────────────────────────────
export interface FatigueHealth {
  healthPct: number;           // 0-100 (can go negative = PAST LIFE)
  label: string;
  labelColor: string;
  wearLoad: number;
  lifespanLoad: number;
  rawMiles: number;
  foamType: FoamType;
  foamLabel: string;
  estimatedRunsRemaining: number | null;
  disclosureCopy: string;
}

export function computeShoeHealth(
  shoe: Shoe,
  runs: Run[],
  weightLbs = 160
): FatigueHealth {
  const shoeRuns = runs.filter(r => r.shoeId === shoe.id);
  const rawMiles = shoeRuns.reduce((s, r) => s + r.distanceKm * 0.621371, 0);
  const wearLoad = computeTotalWearLoad(shoe, runs, weightLbs);
  const lifespan = LIFESPAN_LOAD[shoe.category] ?? 500;
  const healthPct = Math.round(100 * (1 - wearLoad / lifespan));
  const foam = detectFoamType(shoe.tech);

  // Estimated runs remaining
  let estimatedRunsRemaining: number | null = null;
  if (shoeRuns.length >= 3) {
    const recentLoads = shoeRuns
      .slice(-10)
      .map(r => computeRunWearLoad(r, shoe, weightLbs));
    const avgLoad = recentLoads.reduce((s, l) => s + l, 0) / recentLoads.length;
    const remainingLoad = lifespan - wearLoad;
    if (remainingLoad > 0 && avgLoad > 0) {
      estimatedRunsRemaining = Math.max(0, Math.round(remainingLoad / avgLoad / 5) * 5);
    } else if (remainingLoad <= 0) {
      estimatedRunsRemaining = 0;
    }
  }

  let label: string;
  let labelColor: string;
  if (healthPct > 85)      { label = 'FRESH';      labelColor = '#16A34A'; }
  else if (healthPct > 60) { label = 'BROKEN IN';  labelColor = '#2563EB'; }
  else if (healthPct > 35) { label = 'AGING';       labelColor = '#0A0A0A'; }
  else if (healthPct > 15) { label = 'WORN';        labelColor = '#D97706'; }
  else if (healthPct > 0)  { label = 'RETIRE';      labelColor = '#FF3D00'; }
  else                     { label = 'PAST LIFE';   labelColor = '#FF3D00'; }

  return {
    healthPct: Math.min(100, healthPct),
    label,
    labelColor,
    wearLoad: Math.round(wearLoad * 10) / 10,
    lifespanLoad: lifespan,
    rawMiles: Math.round(rawMiles * 10) / 10,
    foamType: foam,
    foamLabel: foamLabel(foam),
    estimatedRunsRemaining,
    disclosureCopy: 'SHOE HEALTH IS AN ESTIMATE. IT WEIGHTS YOUR MILES BY PACE, TERRAIN, AND FOAM TYPE. MORE ACCURATE THAN PLAIN MILEAGE — NOT A MEASUREMENT.',
  };
}
