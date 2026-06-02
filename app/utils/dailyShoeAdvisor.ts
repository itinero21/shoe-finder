/**
 * DAILY SHOE ADVISOR — "Which shoe should I run in today, and why?"
 *
 * Inputs: weather, planned distance, recent fatigue, shoe mileage,
 * injury risk, terrain, rotation balance.
 *
 * Output: a ranked recommendation with a reason in the shoe's voice.
 */

import { Shoe } from '../data/shoes';
import { Run } from '../types/run';
import { LivingShoe } from '../types/character';
import { TodaysWeather } from '../services/weatherService';

export interface ShoeRecommendation {
  shoeId: string;
  shoeName: string;
  reason: string;
  score: number;
  warnings: string[];
}

export function getShoeOfTheDay(
  livingShoes: LivingShoe[],
  shoeData: Record<string, Shoe>,
  runs: Run[],
  weather: TodaysWeather | null,
): ShoeRecommendation | null {
  const active = livingShoes.filter(c => c.lifeStage !== 'departed');
  if (active.length === 0) return null;

  const now = Date.now();
  const last7Days = runs.filter(r => now - new Date(r.date).getTime() < 7 * 86400000);
  const last3Days = runs.filter(r => now - new Date(r.date).getTime() < 3 * 86400000);

  // Usage counts in last 7 days per shoe
  const usageLast7: Record<string, number> = {};
  for (const r of last7Days) usageLast7[r.shoeId] = (usageLast7[r.shoeId] ?? 0) + 1;

  // Recent load: total km in last 3 days
  const recentLoadKm = last3Days.reduce((s, r) => s + r.distanceKm, 0);
  const isHighLoad = recentLoadKm > 25;

  const scored: ShoeRecommendation[] = [];

  for (const char of active) {
    const shoe = shoeData[char.shoeId];
    if (!shoe) continue;

    let score = 50; // base
    const warnings: string[] = [];
    const reasons: string[] = [];

    // ── Life remaining ──────────────────────────────────────
    const lifeRemaining = 100 - char.lifePct;
    if (lifeRemaining <= 10) {
      score -= 30;
      warnings.push(`Only ${Math.round(lifeRemaining)}% life left — retire soon`);
    } else if (lifeRemaining <= 20) {
      score -= 15;
      warnings.push(`${Math.round(lifeRemaining)}% life remaining`);
    } else if (lifeRemaining <= 40) {
      score -= 5;
    }

    // ── Rotation balance — favor least-recently-used ────────
    const usageCount = usageLast7[char.shoeId] ?? 0;
    if (usageCount === 0) {
      score += 15;
      reasons.push("hasn't been out in a while");
    } else if (usageCount >= 3) {
      score -= 10;
      reasons.push('used a lot this week');
    }

    // Days since last run — fresher shoes get a boost
    if (char.daysSinceLastRun >= 5) {
      score += 10;
    } else if (char.daysSinceLastRun <= 1) {
      score -= 8;
    }

    // ── High load → cushioned shoe ─────────────────────────
    if (isHighLoad) {
      if (shoe.biomech.cushioning_level >= 8) {
        score += 12;
        reasons.push('extra cushion for your heavy week');
      }
      if (shoe.category === 'carbon_racer' || shoe.category === 'super_trainer') {
        score -= 10;
        warnings.push('your legs are tired — save the fast shoes');
      }
    }

    // ── Weather adjustments ─────────────────────────────────
    if (weather) {
      if (weather.isRaining || weather.isSnowing) {
        const isTrail = shoe.use_cases.some(u => u.startsWith('trail'));
        if (isTrail || shoe.biomech.torsional_rigidity >= 7) {
          score += 8;
          reasons.push('good grip for wet conditions');
        }
        if (shoe.category === 'carbon_racer') {
          score -= 12;
          warnings.push('not worth risking in the rain');
        }
        // Don't send near-retired shoes into rain
        if (lifeRemaining <= 30) score -= 5;
      }

      if (weather.isHot) {
        if (shoe.specs.weight_oz <= 9) {
          score += 5;
          reasons.push('light for the heat');
        }
        if (shoe.specs.weight_oz > 11) score -= 5;
      }

      if (weather.isCold) {
        if (shoe.biomech.cushioning_level >= 7) {
          score += 4;
          reasons.push('cushion handles cold ground better');
        }
      }

      if (weather.isWindy) {
        if (shoe.biomech.wide_base) {
          score += 4;
          reasons.push('stable platform for windy day');
        }
      }
    }

    // ── Build the recommendation reason ─────────────────────
    const shoeName = `${shoe.brand} ${shoe.model}`;
    const mainReason = reasons.length > 0
      ? `Use ${shoe.model} today — ${reasons.slice(0, 2).join(', ')}.`
      : `${shoe.model} is a solid choice today.`;

    scored.push({
      shoeId: char.shoeId,
      shoeName,
      reason: mainReason,
      score,
      warnings,
    });
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  return scored[0] ?? null;
}

/**
 * Get rotation analysis — detect overuse
 */
export function getRotationAnalysis(
  livingShoes: LivingShoe[],
  shoeData: Record<string, Shoe>,
  runs: Run[],
): { overusedShoe: string | null; overusePct: number; advice: string } {
  const last30 = runs.filter(r => Date.now() - new Date(r.date).getTime() < 30 * 86400000);
  if (last30.length < 5) return { overusedShoe: null, overusePct: 0, advice: '' };

  const counts: Record<string, number> = {};
  for (const r of last30) counts[r.shoeId] = (counts[r.shoeId] ?? 0) + 1;

  let maxId = '';
  let maxCount = 0;
  for (const [id, count] of Object.entries(counts)) {
    if (count > maxCount) { maxId = id; maxCount = count; }
  }

  const pct = Math.round((maxCount / last30.length) * 100);
  if (pct < 60) return { overusedShoe: null, overusePct: pct, advice: '' };

  const shoe = shoeData[maxId];
  const name = shoe ? shoe.model : 'one shoe';

  return {
    overusedShoe: maxId,
    overusePct: pct,
    advice: `You used ${name} for ${pct}% of runs this month. Rotate in a different shoe to reduce repeated load.`,
  };
}
