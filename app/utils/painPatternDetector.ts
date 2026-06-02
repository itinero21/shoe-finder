/**
 * PAIN PATTERN DETECTOR — correlate pain with shoe, distance, terrain.
 *
 * "Knee pain appears after runs over 8km in firm shoes."
 * "Achilles pain is 3x more common in your low-drop shoes."
 */

import { Run } from '../types/run';
import { Shoe } from '../data/shoes';

export interface PainPattern {
  pattern: string;        // human-readable finding
  confidence: 'low' | 'medium' | 'high';
  shoeId?: string;
  shoeName?: string;
  metric?: string;        // e.g. "distance > 8km", "drop < 6mm"
}

/**
 * Analyze runs with pain (feel === 1) vs runs without pain.
 * Returns detected patterns.
 */
export function detectPainPatterns(
  runs: Run[],
  shoeData: Record<string, Shoe>,
): PainPattern[] {
  const patterns: PainPattern[] = [];
  if (runs.length < 10) return patterns;

  const painRuns = runs.filter(r => r.feel === 1);
  const goodRuns = runs.filter(r => r.feel === 3);

  if (painRuns.length < 3) return patterns;

  // ── Pain by shoe ──────────────────────────────────────────
  const painByShoe: Record<string, number> = {};
  const totalByShoe: Record<string, number> = {};

  for (const r of runs) {
    totalByShoe[r.shoeId] = (totalByShoe[r.shoeId] ?? 0) + 1;
    if (r.feel === 1) painByShoe[r.shoeId] = (painByShoe[r.shoeId] ?? 0) + 1;
  }

  for (const [shoeId, painCount] of Object.entries(painByShoe)) {
    const total = totalByShoe[shoeId] ?? 0;
    if (total < 5) continue;
    const painRate = painCount / total;
    if (painRate > 0.3) {
      const shoe = shoeData[shoeId];
      const name = shoe ? `${shoe.brand} ${shoe.model}` : 'Unknown shoe';
      patterns.push({
        pattern: `Pain reported in ${Math.round(painRate * 100)}% of runs in ${name}.`,
        confidence: painRate > 0.5 ? 'high' : 'medium',
        shoeId,
        shoeName: name,
      });
    }
  }

  // ── Pain by distance ──────────────────────────────────────
  const painDistances = painRuns.map(r => r.distanceKm);
  const goodDistances = goodRuns.map(r => r.distanceKm);

  if (painDistances.length >= 3 && goodDistances.length >= 3) {
    const avgPainDist = painDistances.reduce((s, d) => s + d, 0) / painDistances.length;
    const avgGoodDist = goodDistances.reduce((s, d) => s + d, 0) / goodDistances.length;

    if (avgPainDist > avgGoodDist * 1.3) {
      const threshold = Math.round(avgPainDist * 0.621371);
      patterns.push({
        pattern: `Pain tends to appear on runs longer than ${threshold} miles.`,
        confidence: 'medium',
        metric: `distance > ${threshold}mi`,
      });
    }
  }

  // ── Pain by shoe firmness ─────────────────────────────────
  const painFirmness: number[] = [];
  const goodFirmness: number[] = [];

  for (const r of painRuns) {
    const shoe = shoeData[r.shoeId];
    if (shoe) painFirmness.push(shoe.biomech.cushioning_firmness);
  }
  for (const r of goodRuns) {
    const shoe = shoeData[r.shoeId];
    if (shoe) goodFirmness.push(shoe.biomech.cushioning_firmness);
  }

  if (painFirmness.length >= 3 && goodFirmness.length >= 3) {
    const avgPainFirm = painFirmness.reduce((s, f) => s + f, 0) / painFirmness.length;
    const avgGoodFirm = goodFirmness.reduce((s, f) => s + f, 0) / goodFirmness.length;

    if (avgPainFirm > avgGoodFirm + 1.5) {
      patterns.push({
        pattern: 'Pain is more common in firmer shoes. Consider softer cushioning.',
        confidence: 'medium',
        metric: 'firmness correlation',
      });
    } else if (avgPainFirm < avgGoodFirm - 1.5) {
      patterns.push({
        pattern: 'Pain is more common in softer shoes. Consider firmer support.',
        confidence: 'medium',
        metric: 'firmness correlation',
      });
    }
  }

  // ── Pain by drop ──────────────────────────────────────────
  const painDrops: number[] = [];
  const goodDrops: number[] = [];

  for (const r of painRuns) {
    const shoe = shoeData[r.shoeId];
    if (shoe) painDrops.push(shoe.specs.drop_mm);
  }
  for (const r of goodRuns) {
    const shoe = shoeData[r.shoeId];
    if (shoe) goodDrops.push(shoe.specs.drop_mm);
  }

  if (painDrops.length >= 3 && goodDrops.length >= 3) {
    const avgPainDrop = painDrops.reduce((s, d) => s + d, 0) / painDrops.length;
    const avgGoodDrop = goodDrops.reduce((s, d) => s + d, 0) / goodDrops.length;

    if (avgPainDrop < avgGoodDrop - 2) {
      patterns.push({
        pattern: 'Pain correlates with low-drop shoes. Your body may prefer higher drop.',
        confidence: 'medium',
        metric: `avg pain drop: ${avgPainDrop.toFixed(0)}mm vs good: ${avgGoodDrop.toFixed(0)}mm`,
      });
    }
  }

  // ── Pain by terrain ───────────────────────────────────────
  const painTrail = painRuns.filter(r => r.terrain === 'trail').length;
  const painRoad = painRuns.filter(r => r.terrain === 'road').length;
  const totalTrail = runs.filter(r => r.terrain === 'trail').length;
  const totalRoad = runs.filter(r => r.terrain === 'road').length;

  if (totalTrail >= 5 && totalRoad >= 5) {
    const trailPainRate = painTrail / totalTrail;
    const roadPainRate = painRoad / totalRoad;

    if (trailPainRate > roadPainRate * 2 && trailPainRate > 0.2) {
      patterns.push({
        pattern: 'Pain is more frequent on trail runs. Check your trail shoe support.',
        confidence: 'medium',
      });
    }
  }

  return patterns.slice(0, 5);
}
