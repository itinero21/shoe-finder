/**
 * RUNNER DNA — Dynamic running identity model.
 * Computed from run history + user profile. Updated after every run.
 * Everything is rolling-window so one run can't flip your DNA overnight.
 *
 * Phase A of v8 intelligence spec.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Run, RunPurpose } from '../types/run';

const DNA_KEY = 'stride_runner_dna_v1';

export type StrikeBias    = 'forefoot' | 'midfoot' | 'heel' | 'unknown';
export type FatigueSens   = 'low' | 'moderate' | 'high' | 'unknown';
export type StabilityDep  = 'low' | 'moderate' | 'high';
export type RecoveryDisc  = 'poor' | 'moderate' | 'strong';
export type SpeedPref     = 'easy_only' | 'easy_with_occasional_tempo' | 'balanced' | 'speed_focused';
export type CushionTol    = 'low' | 'moderate' | 'max';
export type DiversityLabel = 'HIGH' | 'MODERATE' | 'LOW';

export interface RunnerDNA {
  /** Rolling avg SPM over last 10 runs. null if no cadence data available. */
  cadence_spm: number | null;
  cadence_source: 'measured' | 'unavailable';

  /** Inferred from cadence + typical drop. Always marked INFERRED. */
  strike_bias: StrikeBias;
  strike_source: 'inferred';

  /** Last 90 days terrain distribution */
  terrain_road_pct: number;
  terrain_trail_pct: number;
  terrain_track_pct: number;
  terrain_treadmill_pct: number;

  /** Derived from pace fade in long runs. Marked PACE-DERIVED unless HRV available. */
  fatigue_sensitivity: FatigueSens;
  fatigue_source: 'pace-derived' | 'hrv';

  /** Composite from quiz + injury history + weight */
  stability_dependency: StabilityDep;

  /** Rest days / total days in last 4 weeks */
  recovery_discipline: RecoveryDisc;

  /** Distribution of run purposes last 8 weeks */
  speed_preference: SpeedPref;

  /** From quiz + profile */
  cushion_tolerance: CushionTol;

  /** Top shoe share % last 8 weeks */
  rotation_top_shoe_pct: number;
  rotation_diversity: DiversityLabel;

  /** When this snapshot was computed */
  computed_at: string;
}

// ── Helper: runs within N days ─────────────────────────────────────────────────
function inDays(runs: Run[], days: number): Run[] {
  const cutoff = Date.now() - days * 86400000;
  return runs.filter(r => new Date(r.date).getTime() >= cutoff);
}

// ── Terrain distribution ───────────────────────────────────────────────────────
function computeTerrainBias(runs: Run[]): {
  road_pct: number; trail_pct: number; track_pct: number; treadmill_pct: number;
} {
  const recent = inDays(runs, 90);
  const totalKm = recent.reduce((s, r) => s + r.distanceKm, 0);
  if (totalKm === 0) return { road_pct: 0, trail_pct: 0, track_pct: 0, treadmill_pct: 0 };

  const byTerrain: Record<string, number> = {};
  for (const r of recent) {
    const t = r.terrain ?? 'road';
    byTerrain[t] = (byTerrain[t] ?? 0) + r.distanceKm;
  }
  const pct = (k: string) => Math.round(((byTerrain[k] ?? 0) / totalKm) * 100);
  return {
    road_pct: pct('road'),
    trail_pct: pct('trail'),
    track_pct: pct('track'),
    treadmill_pct: pct('treadmill'),
  };
}

// ── Recovery discipline ────────────────────────────────────────────────────────
function computeRecovery(runs: Run[]): RecoveryDisc {
  const recent = inDays(runs, 28);
  // Count unique run days
  const runDays = new Set(recent.map(r => r.date.slice(0, 10))).size;
  const restDays = 28 - runDays;
  const restPerWeek = restDays / 4;
  if (restPerWeek >= 2) return 'strong';
  if (restPerWeek >= 1) return 'moderate';
  return 'poor';
}

// ── Speed preference ───────────────────────────────────────────────────────────
const EASY_PURPOSES = new Set<RunPurpose>(['easy', 'recovery', 'walk']);
const SPEED_PURPOSES = new Set<RunPurpose>(['tempo', 'speed', 'race']);

function computeSpeedPref(runs: Run[]): SpeedPref {
  const recent = inDays(runs, 56); // 8 weeks
  if (recent.length === 0) return 'easy_only';
  const easyPct = recent.filter(r => EASY_PURPOSES.has(r.purpose as RunPurpose)).length / recent.length;
  if (easyPct >= 0.9)  return 'easy_only';
  if (easyPct >= 0.7)  return 'easy_with_occasional_tempo';
  if (easyPct >= 0.5)  return 'balanced';
  return 'speed_focused';
}

// ── Fatigue sensitivity from pace fade ────────────────────────────────────────
function computeFatigueSens(runs: Run[]): FatigueSens {
  // Long runs = > 8 miles (12.8 km). Look at recent 12 weeks.
  const longRuns = inDays(runs, 84).filter(r => r.distanceKm >= 12.8 && r.durationMinutes);
  if (longRuns.length < 3) return 'unknown';

  // We don't have split-pace data per run, so we use overall duration consistency.
  // Proxy: if pace (min/km) variance across long runs is high, sensitivity is high.
  const paces = longRuns.map(r => (r.durationMinutes! / r.distanceKm));
  const avg = paces.reduce((s, p) => s + p, 0) / paces.length;
  const variance = paces.reduce((s, p) => s + Math.pow(p - avg, 2), 0) / paces.length;
  const cv = Math.sqrt(variance) / avg; // coefficient of variation

  if (cv < 0.05) return 'low';
  if (cv < 0.12) return 'moderate';
  return 'high';
}

// ── Strike bias (inferred) ────────────────────────────────────────────────────
// Without cadence data we can only return 'unknown'.
// If cadence is available: >180 → forefoot, <165 → heel, else midfoot.
function computeStrikeBias(cadence: number | null): StrikeBias {
  if (cadence === null) return 'unknown';
  if (cadence > 180) return 'forefoot';
  if (cadence < 165) return 'heel';
  return 'midfoot';
}

// ── Rotation diversity ────────────────────────────────────────────────────────
function computeRotationDiversity(runs: Run[]): { pct: number; label: DiversityLabel } {
  const recent = inDays(runs, 56); // 8 weeks
  const totalKm = recent.reduce((s, r) => s + r.distanceKm, 0);
  if (totalKm === 0) return { pct: 0, label: 'LOW' };

  const byShoe: Record<string, number> = {};
  for (const r of recent) {
    if (r.shoeId) byShoe[r.shoeId] = (byShoe[r.shoeId] ?? 0) + r.distanceKm;
  }
  const topKm = Math.max(0, ...Object.values(byShoe));
  const pct = Math.round((topKm / totalKm) * 100);
  const label: DiversityLabel = pct < 50 ? 'HIGH' : pct <= 70 ? 'MODERATE' : 'LOW';
  return { pct, label };
}

// ── Stability dependency ──────────────────────────────────────────────────────
// Derived from stored quiz answers + injury history. Passed in as inputs.
function computeStabilityDep(
  archType: 'flat' | 'normal' | 'high' | null,
  hasOverpronationInjury: boolean,
  weightLbs: number
): StabilityDep {
  let score = 0;
  if (archType === 'flat')       score += 2;
  else if (archType === 'normal') score += 1;
  if (hasOverpronationInjury)    score += 1;
  if (weightLbs > 185)           score += 1;
  if (score >= 3) return 'high';
  if (score >= 2) return 'moderate';
  return 'low';
}

// ── Cushion tolerance ────────────────────────────────────────────────────────
function computeCushionTol(
  archType: 'flat' | 'normal' | 'high' | null,
  hasKneePain: boolean,
  weightLbs: number
): CushionTol {
  if (weightLbs > 200 || hasKneePain) return 'max';
  if (archType === 'flat' || weightLbs > 160) return 'moderate';
  return 'low';
}

// ── Main computation ──────────────────────────────────────────────────────────
export interface DNAInputs {
  runs: Run[];
  archType?: 'flat' | 'normal' | 'high' | null;
  injuryHistory?: string[]; // injury types e.g. ['plantar', 'knee']
  weightLbs?: number;
}

export function computeRunnerDNA(inputs: DNAInputs): RunnerDNA {
  const { runs, archType = null, injuryHistory = [], weightLbs = 160 } = inputs;

  const terrain = computeTerrainBias(runs);
  const recovery = computeRecovery(runs);
  const speedPref = computeSpeedPref(runs);
  const fatigueSens = computeFatigueSens(runs);
  const rotDiv = computeRotationDiversity(runs);

  const hasOverpronation = injuryHistory.some(i =>
    ['overpronation', 'plantar', 'shin', 'knee'].includes(i)
  );
  const hasKneePain = injuryHistory.includes('knee');

  const stabilityDep = computeStabilityDep(archType, hasOverpronation, weightLbs);
  const cushionTol = computeCushionTol(archType, hasKneePain, weightLbs);

  // Cadence — placeholder; LiveRunModal can store it on Run in future
  const cadence: number | null = null;

  return {
    cadence_spm: cadence,
    cadence_source: 'unavailable',
    strike_bias: computeStrikeBias(cadence),
    strike_source: 'inferred',
    terrain_road_pct: terrain.road_pct,
    terrain_trail_pct: terrain.trail_pct,
    terrain_track_pct: terrain.track_pct,
    terrain_treadmill_pct: terrain.treadmill_pct,
    fatigue_sensitivity: fatigueSens,
    fatigue_source: 'pace-derived',
    stability_dependency: stabilityDep,
    recovery_discipline: recovery,
    speed_preference: speedPref,
    cushion_tolerance: cushionTol,
    rotation_top_shoe_pct: rotDiv.pct,
    rotation_diversity: rotDiv.label,
    computed_at: new Date().toISOString(),
  };
}

// ── Persistence ───────────────────────────────────────────────────────────────
export async function loadRunnerDNA(): Promise<RunnerDNA | null> {
  const raw = await AsyncStorage.getItem(DNA_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function saveRunnerDNA(dna: RunnerDNA): Promise<void> {
  await AsyncStorage.setItem(DNA_KEY, JSON.stringify(dna));
}

/** Compute + save DNA. Call this after every run is logged. */
export async function refreshRunnerDNA(inputs: DNAInputs): Promise<RunnerDNA> {
  const dna = computeRunnerDNA(inputs);
  await saveRunnerDNA(dna);
  return dna;
}

// ── Display helpers ───────────────────────────────────────────────────────────
export const DNA_LABELS: Record<keyof RunnerDNA, string> = {
  cadence_spm:            'CADENCE',
  cadence_source:         '',
  strike_bias:            'STRIKE',
  strike_source:          '',
  terrain_road_pct:       'ROAD',
  terrain_trail_pct:      'TRAIL',
  terrain_track_pct:      'TRACK',
  terrain_treadmill_pct:  'TREADMILL',
  fatigue_sensitivity:    'FATIGUE SENSITIVITY',
  fatigue_source:         '',
  stability_dependency:   'STABILITY NEED',
  recovery_discipline:    'RECOVERY',
  speed_preference:       'SPEED PREF',
  cushion_tolerance:      'CUSHION TOLERANCE',
  rotation_top_shoe_pct:  'TOP SHOE SHARE',
  rotation_diversity:     'ROTATION DIVERSITY',
  computed_at:            '',
};

export function formatDNAValue(dna: RunnerDNA, attr: keyof RunnerDNA): string {
  switch (attr) {
    case 'cadence_spm':
      return dna.cadence_spm !== null ? `${dna.cadence_spm} SPM` : 'NO DATA';
    case 'strike_bias':
      return `${dna.strike_bias.toUpperCase()} (INFERRED)`;
    case 'terrain_road_pct':
      return `${dna.terrain_road_pct}% ROAD / ${dna.terrain_trail_pct}% TRAIL`;
    case 'fatigue_sensitivity':
      return `${dna.fatigue_sensitivity.toUpperCase()} (PACE-DERIVED)`;
    case 'stability_dependency':
      return dna.stability_dependency.toUpperCase();
    case 'recovery_discipline':
      return dna.recovery_discipline.toUpperCase();
    case 'speed_preference':
      return dna.speed_preference.replace(/_/g, ' ').toUpperCase();
    case 'cushion_tolerance':
      return dna.cushion_tolerance.toUpperCase();
    case 'rotation_top_shoe_pct':
      return `${dna.rotation_diversity} (${dna.rotation_top_shoe_pct}% IN TOP SHOE)`;
    default:
      return '';
  }
}

export const DNA_DISPLAY_ATTRS: (keyof RunnerDNA)[] = [
  'cadence_spm',
  'strike_bias',
  'terrain_road_pct',
  'fatigue_sensitivity',
  'stability_dependency',
  'recovery_discipline',
  'speed_preference',
  'cushion_tolerance',
  'rotation_top_shoe_pct',
];
