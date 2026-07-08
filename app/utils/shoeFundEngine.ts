/**
 * SHOE FUND ENGINE — Economic intelligence layer.
 *
 * Tracks cost-per-mile, micro-savings contributions, and foam decompression
 * physics. Every mile run chips away at the cost of the shoe and builds
 * toward the next one.
 */

import { Shoe } from '../data/shoes';
import { Run } from '../types/run';
import { LivingShoe } from '../types/character';
import { addToShoeFund } from './userProfile';

const MI_PER_KM = 0.621371;

// ── Logarithmic Foam Freshness ───────────────────────────────────────────────

/**
 * Computes perceived foam freshness using a logarithmic utility curve:
 *   U = 5 · ln(x)  where x = % life remaining (1–100)
 *
 * This mirrors real foam physics: cushion stays highly responsive for most
 * of its life, then drops sharply in the final stretch. A 50%-worn shoe
 * still feels ~85% fresh. A 90%-worn shoe drops to ~50%.
 *
 * Returns 0–100 normalized score.
 */
export function computeFreshnessScore(lifePct: number): number {
  const remaining = Math.max(1, 100 - lifePct); // 1–100
  const U = 5 * Math.log(remaining);
  const Umax = 5 * Math.log(100); // ≈ 23.03
  return Math.round(Math.max(0, (U / Umax) * 100));
}

export function freshnessTier(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'LIKE NEW',    color: '#16A34A' };
  if (score >= 75) return { label: 'RESPONSIVE',  color: '#2563EB' };
  if (score >= 55) return { label: 'BREAKING IN', color: '#D97706' };
  if (score >= 35) return { label: 'WORN',        color: '#EA580C' };
  return               { label: 'SPENT',        color: '#FF3D00' };
}

// ── Cost-Per-Mile ────────────────────────────────────────────────────────────

/**
 * Returns cost per mile for a shoe, or null if not enough data.
 * Uses the user's actual purchase price if captured, otherwise falls back
 * to the database list price.
 */
export function computeCostPerMile(
  char: LivingShoe,
  shoe: Shoe,
): number | null {
  const price = char.purchasePrice ?? shoe.price_usd;
  if (!price || price <= 0 || char.totalMiles < 1) return null;
  return price / char.totalMiles;
}

/**
 * Describes a CPM value as a value tier.
 */
export function cpmTier(cpm: number): { label: string; color: string } {
  if (cpm < 0.35) return { label: 'GREAT VALUE',  color: '#16A34A' };
  if (cpm < 0.65) return { label: 'SOLID VALUE',  color: '#2563EB' };
  if (cpm < 1.00) return { label: 'MODERATE',     color: '#D97706' };
  return               { label: 'HIGH COST',     color: '#FF3D00' };
}

// ── Micro-Savings Contribution ───────────────────────────────────────────────

/**
 * How much gets added to the Shoe Fund for a given run.
 * Derived from: (shoe price / estimated lifespan) × miles run.
 * Each mile "depreciates" the shoe by this amount — and that depreciation
 * is re-routed into the replacement fund.
 */
export function computeRunContribution(
  distanceKm: number,
  purchasePrice: number,
  lifespanMiles: number,
): number {
  if (lifespanMiles <= 0 || purchasePrice <= 0) return 0;
  const distanceMiles = distanceKm * MI_PER_KM;
  return (purchasePrice / lifespanMiles) * distanceMiles;
}

/**
 * Called after every run save. Computes the contribution and adds it to the
 * user's global Shoe Fund balance.
 * Returns the dollar amount added (for display purposes).
 */
export async function addRunToFund(
  char: LivingShoe,
  shoe: Shoe,
  distanceKm: number,
): Promise<number> {
  const price = char.purchasePrice ?? shoe.price_usd;
  if (!price || price <= 0) return 0;
  const contribution = computeRunContribution(distanceKm, price, char.lifespanMiles);
  if (contribution > 0) await addToShoeFund(contribution);
  return contribution;
}

// ── Foam Decompression Physics ───────────────────────────────────────────────

/**
 * How many hours a shoe needs to recover based on the effort of the last run.
 * Models PEBAX/EVA foam compression physics:
 * - Race / ultra distance → 72h
 * - Long / speed / tempo  → 48h
 * - Easy / recovery       → 24h
 */
export function computeDecompressionHours(lastRun: Run | undefined): number {
  if (!lastRun) return 0;
  const { purpose, distanceKm } = lastRun;
  if (purpose === 'race' || distanceKm >= 42) return 72;
  if (purpose === 'long' || purpose === 'speed' || purpose === 'tempo' || distanceKm >= 16) return 48;
  return 24;
}

export interface DecompressionState {
  recovering: boolean;
  pctRecovered: number;    // 0–100
  hoursRemaining: number;  // rounded up
}

/**
 * Returns the current foam recovery state for a shoe, computed from
 * lastRunDate + decompressionHours.
 */
export function getDecompressionState(char: LivingShoe): DecompressionState {
  if (!char.lastRunDate || char.decompressionHours <= 0) {
    return { recovering: false, pctRecovered: 100, hoursRemaining: 0 };
  }
  const hoursSince = (Date.now() - new Date(char.lastRunDate).getTime()) / 3_600_000;
  const pctRecovered = Math.min(100, (hoursSince / char.decompressionHours) * 100);
  return {
    recovering: pctRecovered < 100,
    pctRecovered: Math.round(pctRecovered),
    hoursRemaining: Math.ceil(Math.max(0, char.decompressionHours - hoursSince)),
  };
}
