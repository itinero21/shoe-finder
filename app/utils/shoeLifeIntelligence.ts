/**
 * SHOE LIFE INTELLIGENCE — the best shoe-health system on earth.
 *
 * Per-shoe analysis: estimated km remaining, wear risk, retire warnings,
 * usage restrictions, load warnings.
 */

import { Shoe } from '../data/shoes';
import { Run } from '../types/run';
import { LivingShoe } from '../types/character';

export interface ShoeHealthReport {
  shoeId: string;
  shoeName: string;
  totalMiles: number;
  lifePct: number;
  estimatedMilesRemaining: number;
  estimatedRunsRemaining: number;
  wearRisk: 'low' | 'moderate' | 'high' | 'critical';
  retireWarning: string | null;
  restrictions: string[];      // "easy runs only", "avoid speed work", etc.
  loadWarning: string | null;  // "this shoe is causing too much load"
  costPerMile: number | null;  // if price is known
}

export function generateShoeHealthReport(
  char: LivingShoe,
  shoe: Shoe,
  allRuns: Run[],
): ShoeHealthReport {
  const shoeRuns = allRuns.filter(r => r.shoeId === char.shoeId);
  const totalMiles = char.totalMiles;
  const lifePct = char.lifePct;
  const milesRemaining = Math.max(0, char.lifespanMiles - totalMiles);
  const avgMilesPerRun = shoeRuns.length > 0 ? totalMiles / shoeRuns.length : 3;
  const runsRemaining = avgMilesPerRun > 0 ? Math.round(milesRemaining / avgMilesPerRun) : 0;
  const shoeName = `${shoe.brand} ${shoe.model}`;

  // Wear risk
  let wearRisk: ShoeHealthReport['wearRisk'] = 'low';
  if (lifePct >= 90) wearRisk = 'critical';
  else if (lifePct >= 75) wearRisk = 'high';
  else if (lifePct >= 50) wearRisk = 'moderate';

  // Retire warning
  let retireWarning: string | null = null;
  if (lifePct >= 95) retireWarning = `${shoe.model} has almost no life left. Retire this shoe.`;
  else if (lifePct >= 85) retireWarning = `${shoe.model} is in twilight. Plan a replacement.`;
  else if (lifePct >= 75) retireWarning = `${shoe.model} is past peak. Consider a backup.`;

  // Restrictions based on wear
  const restrictions: string[] = [];
  if (lifePct >= 80) {
    restrictions.push('Easy runs only — cushion is depleted');
    restrictions.push('Avoid speed work in this shoe');
  } else if (lifePct >= 60) {
    restrictions.push('Move to walking only if you feel less bounce');
  }

  // Check if shoe is taking too much load
  const last14 = allRuns.filter(r => Date.now() - new Date(r.date).getTime() < 14 * 86400000);
  const shoeRunsLast14 = last14.filter(r => r.shoeId === char.shoeId);
  const pctOfRecent = last14.length > 0 ? shoeRunsLast14.length / last14.length : 0;
  let loadWarning: string | null = null;
  if (pctOfRecent > 0.7 && last14.length >= 4) {
    loadWarning = `${shoe.model} is handling ${Math.round(pctOfRecent * 100)}% of your recent runs. Spread the load.`;
  }

  // Cost per mile
  const costPerMile = totalMiles > 0 ? shoe.price_usd / totalMiles : null;

  return {
    shoeId: char.shoeId,
    shoeName,
    totalMiles,
    lifePct,
    estimatedMilesRemaining: Math.round(milesRemaining),
    estimatedRunsRemaining: runsRemaining,
    wearRisk,
    retireWarning,
    restrictions,
    loadWarning,
    costPerMile,
  };
}

/**
 * Generate reports for all active shoes, sorted by urgency
 */
export function generateAllHealthReports(
  livingShoes: LivingShoe[],
  shoeData: Record<string, Shoe>,
  allRuns: Run[],
): ShoeHealthReport[] {
  return livingShoes
    .filter(c => c.lifeStage !== 'departed')
    .map(c => {
      const shoe = shoeData[c.shoeId];
      if (!shoe) return null;
      return generateShoeHealthReport(c, shoe, allRuns);
    })
    .filter(Boolean)
    .sort((a, b) => b!.lifePct - a!.lifePct) as ShoeHealthReport[];
}
