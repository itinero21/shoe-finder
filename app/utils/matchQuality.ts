/**
 * Match quality engine — determines how well a shoe matches a run.
 * Used for XP multipliers in Shoe Wars.
 */
import { Shoe } from '../data/shoes';
import { RunTerrain, RunPurpose, MatchQuality } from '../types/run';

const TERRAIN_TRAIL: RunTerrain[] = ['trail'];
const TERRAIN_ROAD: RunTerrain[] = ['road', 'track', 'treadmill'];

export function calcMatchQuality(shoe: Shoe, terrain: RunTerrain, purpose: RunPurpose, distanceKm: number): MatchQuality {
  const isTrailShoe = shoe.use_cases.some(u => u.startsWith('trail'));
  const isRacer = shoe.category === 'carbon_racer';
  const isSuperTrainer = shoe.category === 'super_trainer';
  const isMaxCushion = shoe.category.startsWith('max_cushion');
  const isDaily = ['neutral_daily', 'stability_daily', 'premium_neutral', 'max_cushion_neutral'].includes(shoe.category);

  // ── Abuse cases ──────────────────────────────────────────────────────
  // Marathon distance (>35km) in a 5K racer
  if (distanceKm > 35 && isRacer && !shoe.use_cases.some(u => ['race_marathon', 'race_half'].includes(u))) {
    return 'abuse';
  }
  // Racing shoe on trail
  if (terrain === 'trail' && isRacer && !isTrailShoe) return 'abuse';

  // ── Terrain mismatch ─────────────────────────────────────────────────
  if (terrain === 'trail' && !isTrailShoe) return 'poor';
  if (TERRAIN_ROAD.includes(terrain) && isTrailShoe) return 'poor';

  // ── Perfect matches ──────────────────────────────────────────────────
  if (purpose === 'race' && isRacer) return 'perfect';
  if (purpose === 'easy' && isDaily && terrain === 'road') return 'perfect';
  if (purpose === 'long' && (isMaxCushion || isDaily) && terrain === 'road') return 'perfect';
  if (purpose === 'tempo' && (isSuperTrainer || shoe.biomech.energy_return >= 7) && terrain === 'road') return 'perfect';
  if (terrain === 'trail' && isTrailShoe && ['easy', 'long', 'race'].includes(purpose)) return 'perfect';
  if (purpose === 'walk' && isMaxCushion) return 'perfect';
  if (purpose === 'recovery' && shoe.biomech.cushioning_level >= 7 && isDaily) return 'perfect';

  // ── Good matches ─────────────────────────────────────────────────────
  if (purpose === 'race' && isSuperTrainer) return 'good';
  if (purpose === 'tempo' && isRacer) return 'good';
  if (['easy', 'recovery', 'long'].includes(purpose) && isDaily) return 'good';
  if (purpose === 'speed' && shoe.biomech.energy_return >= 6) return 'good';

  // ── Poor matches ─────────────────────────────────────────────────────
  if (purpose === 'race' && isMaxCushion) return 'poor';
  if (purpose === 'easy' && isRacer) return 'poor';

  return 'neutral';
}

export function calcXP(
  distanceKm: number,
  quality: MatchQuality,
  isBeginnerMode: boolean
): number {
  const miles = distanceKm * 0.621371;
  const MULTI: Record<MatchQuality, number> = { perfect: 2.0, good: 1.5, neutral: 1.0, poor: 0.5, abuse: 0.25 };
  const capped = Math.min(miles, 30);
  const raw = Math.round(capped * 2 * MULTI[quality]);
  const cap = isBeginnerMode ? 120 : 60;
  return Math.min(raw, cap);
}

export const MATCH_LABELS: Record<MatchQuality, { label: string; color: string; desc: string }> = {
  perfect: { label: 'PERFECT MATCH', color: '#16A34A', desc: 'Ideal shoe for this run type — 2× XP' },
  good:    { label: 'GOOD MATCH',    color: '#2563EB', desc: 'Suitable for this run — 1.5× XP' },
  neutral: { label: 'NEUTRAL',       color: '#6B7280', desc: 'Acceptable — 1× XP' },
  poor:    { label: 'POOR MATCH',    color: '#D97706', desc: 'Not ideal for this run — 0.5× XP' },
  abuse:   { label: 'ABUSE',         color: '#FF3D00', desc: 'Wrong shoe entirely — 0.25× XP, lifespan risk' },
};
