/**
 * MECHANICS ENGINE — surface, role, weather, preference, pain-context,
 * transition and (v2.1) elevation scoring. All scores are 0-100.
 *
 * v2.1 strengthening:
 *   - weatherScore penalizes heavy shoes in heat and rewards grip in snow
 *   - elevationScore: hilly runs weight torsional stability + grip
 */
import { EngineInput, ShoeProfile } from '../types';
import { clamp, similarity } from '../math';

export function surfaceScore(p: ShoeProfile, input: EngineInput) {
  const s = input.plannedRun.surface;
  if (p.surfaces.includes(s)) return 100;
  if (s === 'mixed' && p.surfaces.some(x => ['road', 'groomed_trail'].includes(x))) return 75;
  if (s === 'technical_trail') return p.mechanics.lugDepthMm && p.mechanics.lugDepthMm >= 4 ? 70 : 0;
  if (s === 'road' && p.surfaces.includes('groomed_trail')) return 55;
  return 35;
}

export function roleScore(p: ShoeProfile, input: EngineInput) {
  const i = input.plannedRun.intent;
  const map: Record<string, string[]> = {
    recovery: ['recovery', 'daily'],
    easy: ['daily', 'recovery'],
    long: ['long_run', 'daily'],
    steady: ['daily', 'tempo'],
    tempo: ['tempo', 'race'],
    intervals: ['tempo', 'race'],
    race: ['race', 'tempo'],
    walk: ['walking', 'daily'],
  };
  return p.roles.some(r => map[i]!.includes(r)) ? 100
    : p.roles.some(r => ['daily', 'long_run'].includes(r)) ? 55
    : 20;
}

export function weatherScore(p: ShoeProfile, input: EngineInput) {
  let x = 75;
  if (input.plannedRun.weather.includes('rain')) x = p.mechanics.wetGrip ?? p.mechanics.outsoleGrip;
  if (input.plannedRun.weather.includes('ice')) x = 5;
  if (input.plannedRun.weather.includes('snow')) x = Math.min(100, p.mechanics.outsoleGrip + (p.mechanics.lugDepthMm ?? 0) * 5);
  // v2.1: heat punishes heavy, hot-running shoes
  if (input.plannedRun.weather.includes('hot') && (p.mechanics.massGrams ?? 260) > 295) x -= 12;
  return clamp(x);
}

/** v2.1: big climbing days reward stability and grip; flat days are neutral. */
export function elevationScore(p: ShoeProfile, input: EngineInput) {
  const gain = input.plannedRun.elevationGainM ?? 0;
  const km = Math.max(1, input.plannedRun.distanceKm);
  const gainPerKm = gain / km;
  if (gainPerKm < 15) return 60; // flat — neutral
  const capability = p.mechanics.torsionalStability * 0.5 + p.mechanics.outsoleGrip * 0.5;
  const demand = Math.min(1, (gainPerKm - 15) / 35); // 15→50 m/km ramps demand
  return clamp(60 + (capability - 60) * demand);
}

export function preferenceScore(p: ShoeProfile, input: EngineInput) {
  const q = input.runner.preferences;
  return Math.round((
    similarity(p.mechanics.softness, q.softness, 45) +
    similarity(p.mechanics.dropMm, q.dropMm, 12) +
    similarity(p.mechanics.rocker, q.rocker, 50) +
    similarity(p.mechanics.longitudinalStiffness, q.stiffness, 55) +
    similarity(p.mechanics.toeBoxVolume, q.toeBoxVolume, 50)
  ) / 5);
}

export function transitionRisk(p: ShoeProfile, input: EngineInput) {
  const q = input.runner.preferences;
  let r = 0;
  if (q.dropMm != null) r += Math.min(35, Math.abs(p.mechanics.dropMm - q.dropMm) * 5);
  if (q.rocker != null) r += Math.min(20, Math.abs(p.mechanics.rocker - q.rocker) * 0.3);
  if (q.stiffness != null) r += Math.min(20, Math.abs(p.mechanics.longitudinalStiffness - q.stiffness) * 0.3);
  if (p.mechanics.plate === 'carbon' && input.runner.experience === 'new') r += 20;
  return clamp(r);
}

export function painContextScore(p: ShoeProfile, input: EngineInput) {
  let x = 60;
  const pain = input.runner.currentPain;
  if ((pain.achilles_calf ?? 0) >= 4) {
    if (p.mechanics.dropMm <= 2) x -= 25;
    if (p.mechanics.dropMm >= 8) x += 8;
  }
  if ((pain.heel_arch ?? 0) >= 4 && p.mechanics.rocker >= 60) x += 7;
  if ((pain.foot ?? 0) >= 4 && p.mechanics.toeBoxVolume < 40) x -= 18;
  if ((pain.knee ?? 0) >= 4 && p.mechanics.longitudinalStiffness > 88) x -= 10;
  return clamp(x);
}
