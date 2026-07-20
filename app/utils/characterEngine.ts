/**
 * CHARACTER ENGINE — The Living Shoe
 *
 * Computes archetype, mood, life stage, nicknames, and relationships.
 * The shoe is the character. The runner does not level up.
 */

import { Shoe } from '../data/shoes';
import { Run } from '../types/run';
import { computeDecompressionHours } from './shoeFundEngine';
import {
  ShoeArchetype, LifeStage, ShoeMood, EarnedNickname,
  LivingShoe, ShoeMoment, ShoeRelationship,
} from '../types/character';

// ── Birth Seed: archetype from biomechanics ─────────────────────────────────

export function seedArchetype(shoe: Shoe): ShoeArchetype {
  const { energy_return, cushioning_level, stability_level } = shoe.biomech;
  const isTrail = shoe.use_cases.some(u => u.startsWith('trail'));
  const isRacer = shoe.category === 'carbon_racer' || shoe.category === 'super_trainer';
  const isMaxCushion = shoe.category.startsWith('max_cushion');
  const isLightweight = shoe.category === 'lightweight_speed';

  if (isRacer) return 'sprinter';
  if (isTrail) return 'wildcard';
  if (isMaxCushion || cushioning_level >= 8) return 'guardian';
  if (isLightweight || energy_return >= 7) return 'closer';
  return 'veteran'; // daily trainers, stability shoes, workhorse types
}

// ── Personality Drift: archetype shifts from actual usage ───────────────────

export function computeArchetypeDrift(
  runs: Run[]
): Partial<Record<ShoeArchetype, number>> {
  if (runs.length < 5) return {};

  let speedRuns = 0, easyRuns = 0, trailRuns = 0, longRuns = 0, raceRuns = 0;
  for (const r of runs) {
    if (r.purpose === 'speed' || r.purpose === 'tempo') speedRuns++;
    if (r.purpose === 'easy' || r.purpose === 'recovery') easyRuns++;
    if (r.terrain === 'trail') trailRuns++;
    if (r.purpose === 'long') longRuns++;
    if (r.purpose === 'race') raceRuns++;
  }

  const total = runs.length;
  const drift: Partial<Record<ShoeArchetype, number>> = {};

  if (speedRuns / total > 0.4) drift.sprinter = speedRuns / total;
  if (easyRuns / total > 0.4) drift.guardian = easyRuns / total;
  if (trailRuns / total > 0.3) drift.wildcard = trailRuns / total;
  if (longRuns / total > 0.3) drift.veteran = longRuns / total;
  if (raceRuns / total > 0.2) drift.closer = raceRuns / total;

  return drift;
}

/** Get the effective archetype after drift */
export function effectiveArchetype(shoe: LivingShoe): ShoeArchetype {
  const drift = shoe.archetypeDrift;
  if (!drift || Object.keys(drift).length === 0) return shoe.archetype;

  let best = shoe.archetype;
  let bestWeight = 0.5; // base archetype needs to be beaten
  for (const [arch, weight] of Object.entries(drift)) {
    if ((weight ?? 0) > bestWeight) {
      best = arch as ShoeArchetype;
      bestWeight = weight ?? 0;
    }
  }
  return best;
}

// ── Life Stage: from fatigue/wear percentage ────────────────────────────────

export function computeLifeStage(lifePct: number, retired: boolean): LifeStage {
  if (retired) return 'departed';
  if (lifePct <= 15) return 'fresh';
  if (lifePct <= 50) return 'prime';
  if (lifePct <= 80) return 'veteran';
  return 'twilight';
}

// ── Mood: dynamic state from usage patterns ─────────────────────────────────

export function computeMood(
  lifePct: number,
  daysSinceLastRun: number,
  recentMatchQuality: string | null,
  runCount: number,
  lifeStage: LifeStage,
): ShoeMood {
  // Twilight shoes are always reflective
  if (lifeStage === 'twilight') return 'reflective';

  // Neglected
  if (daysSinceLastRun > 14) return 'anxious';
  if (daysSinceLastRun > 7) return 'wistful';

  // High wear
  if (lifePct > 85) return 'weary';

  // Recent abuse
  if (recentMatchQuality === 'abuse' || recentMatchQuality === 'poor') return 'hurt';

  // Recent great run
  if (recentMatchQuality === 'perfect') return 'proud';

  // Heavily used recently
  if (daysSinceLastRun <= 1 && runCount > 3) return 'tired';

  // Fresh shoe with few runs
  if (runCount < 3) return 'eager';

  return 'content';
}

// ── Earned Nickname: emerges from real usage patterns ───────────────────────

export function computeNickname(
  runs: Run[],
  totalMiles: number,
): EarnedNickname {
  if (runs.length < 10) return null;

  const rainRuns = runs.filter(r => /\brain|rainy|rained|storm|wet|drizzle|pouring\b/i.test(r.notes ?? '')).length;
  const raceRuns = runs.filter(r => r.purpose === 'race').length;
  const nightRuns = runs.filter(r => new Date(r.date).getHours() >= 20).length;
  const longRuns = runs.filter(r => r.distanceKm > 15).length;
  const recoveryRuns = runs.filter(r => r.purpose === 'recovery' || r.purpose === 'easy').length;
  const speedRuns = runs.filter(r => r.purpose === 'speed' || r.purpose === 'tempo').length;
  const comebackRuns = runs.filter(r => /\bcomeback|return|back after|injury|rehab\b/i.test(r.notes ?? '')).length;

  // Check for marathon distance
  if (runs.some(r => r.distanceKm >= 42)) return 'The Marathoner';

  // Rain warrior — lots of bad weather
  if (rainRuns >= 5) return 'The Rain Warrior';

  // Comeback — user explicitly recorded return/injury context
  if (comebackRuns > 0) return 'The Comeback Kid';

  // Night runner — earned from repeated late runs
  if (nightRuns >= 10) return 'The Night Runner';

  // Speed demon — mostly fast runs
  if (speedRuns / runs.length > 0.5) return 'The Speed Demon';

  // Iron horse — high total mileage
  if (totalMiles > 800) return 'The Iron Horse';

  // Workhorse — lots of runs, balanced
  if (runs.length > 50) return 'The Workhorse';

  // Faithful — used very consistently
  if (recoveryRuns / runs.length > 0.4 && runs.length > 20) return 'The Faithful';

  // Survivor — came back from a long gap
  const dates = runs.map(r => new Date(r.date).getTime()).sort();
  for (let i = 1; i < dates.length; i++) {
    if ((dates[i] - dates[i - 1]) > 30 * 86400000) return 'The Comeback Kid';
  }

  return null;
}

// ── Life Span Estimation ────────────────────────────────────────────────────

export function estimateLifespanMiles(shoe: Shoe, weightLbs: number): number {
  // Base lifespan from shoe category + tech
  const tech = shoe.tech.join(' ').toLowerCase();
  const isRacer = shoe.category === 'carbon_racer' || shoe.category === 'super_trainer';
  let baseMiles = 400; // default

  if (isRacer || tech.includes('peba') || tech.includes('carbon')) baseMiles = 250;
  else if (tech.includes('react') || tech.includes('zoom')) baseMiles = 350;
  else if (tech.includes('fresh foam') || tech.includes('nitro')) baseMiles = 400;
  else if (tech.includes('dna') || tech.includes('gel')) baseMiles = 450;
  else if (tech.includes('boost')) baseMiles = 400;

  // Heavier runners wear shoes faster
  const weightFactor = weightLbs > 180 ? 0.85 : weightLbs < 140 ? 1.15 : 1.0;

  return Math.round(baseMiles * weightFactor);
}

// ── Moments: auto-detect milestones from run history ────────────────────────

export function detectMoments(
  shoeId: string,
  runs: Run[],
  existingMoments: ShoeMoment[],
): ShoeMoment[] {
  const shoeRuns = runs
    .filter(r => r.shoeId === shoeId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (shoeRuns.length === 0) return existingMoments;

  const existing = new Set(existingMoments.map(m => m.type));
  const newMoments: ShoeMoment[] = [...existingMoments];

  // First run
  if (!existing.has('first_run') && shoeRuns.length >= 1) {
    const r = shoeRuns[0];
    newMoments.push({
      type: 'first_run',
      date: r.date,
      distanceKm: r.distanceKm,
      caption: 'First memory created.',
      runId: r.id,
    });
  }

  // First rain run from notes
  if (!existing.has('first_rain')) {
    const rain = shoeRuns.find(r => /\brain|rainy|rained|storm|wet|drizzle|pouring\b/i.test(r.notes ?? ''));
    if (rain) {
      newMoments.push({
        type: 'first_rain',
        date: rain.date,
        distanceKm: rain.distanceKm,
        caption: 'First rain memory unlocked.',
        runId: rain.id,
      });
    }
  }

  // First trail run
  if (!existing.has('first_trail')) {
    const trail = shoeRuns.find(r => r.terrain === 'trail');
    if (trail) {
      newMoments.push({
        type: 'first_trail',
        date: trail.date,
        distanceKm: trail.distanceKm,
        caption: 'First time off-road.',
        runId: trail.id,
      });
    }
  }

  // First race
  if (!existing.has('first_race')) {
    const race = shoeRuns.find(r => r.purpose === 'race');
    if (race) {
      newMoments.push({
        type: 'first_race',
        date: race.date,
        distanceKm: race.distanceKm,
        caption: 'First race day together.',
        runId: race.id,
      });
    }
  }

  // Fastest 5K / 10K equivalents when duration is available.
  const timed = shoeRuns.filter(r => r.durationMinutes && r.distanceKm > 0);
  if (!existing.has('fastest_5k')) {
    const fiveK = timed
      .filter(r => r.distanceKm >= 5)
      .sort((a, b) => (a.durationMinutes! / a.distanceKm) - (b.durationMinutes! / b.distanceKm))[0];
    if (fiveK) {
      newMoments.push({
        type: 'fastest_5k',
        date: fiveK.date,
        distanceKm: fiveK.distanceKm,
        caption: `Fastest 5K-or-longer effort together: ${(fiveK.durationMinutes! / fiveK.distanceKm).toFixed(1)} min/km.`,
        runId: fiveK.id,
      });
    }
  }
  if (!existing.has('fastest_10k')) {
    const tenK = timed
      .filter(r => r.distanceKm >= 10)
      .sort((a, b) => (a.durationMinutes! / a.distanceKm) - (b.durationMinutes! / b.distanceKm))[0];
    if (tenK) {
      newMoments.push({
        type: 'fastest_10k',
        date: tenK.date,
        distanceKm: tenK.distanceKm,
        caption: `Fastest 10K-or-longer effort together: ${(tenK.durationMinutes! / tenK.distanceKm).toFixed(1)} min/km.`,
        runId: tenK.id,
      });
    }
  }

  // Longest run
  if (!existing.has('longest_run') && shoeRuns.length >= 5) {
    const longest = shoeRuns.reduce((best, r) => r.distanceKm > best.distanceKm ? r : best);
    if (longest.distanceKm > 10) {
      newMoments.push({
        type: 'longest_run',
        date: longest.date,
        distanceKm: longest.distanceKm,
        caption: `Longest run together: ${(longest.distanceKm * 0.621371).toFixed(1)} miles.`,
        runId: longest.id,
      });
    }
  }

  // Comeback story from notes
  if (!existing.has('comeback')) {
    const comeback = shoeRuns.find(r => /\bcomeback|return|back after|injury|rehab\b/i.test(r.notes ?? ''));
    if (comeback) {
      newMoments.push({
        type: 'comeback',
        date: comeback.date,
        distanceKm: comeback.distanceKm,
        caption: 'Comeback run remembered.',
        runId: comeback.id,
      });
    }
  }

  // Mileage milestones
  const totalMiles = shoeRuns.reduce((s, r) => s + r.distanceKm * 0.621371, 0);
  for (const milestone of [100, 200, 500] as const) {
    const type = `milestone_${milestone}` as ShoeMoment['type'];
    if (!existing.has(type) && totalMiles >= milestone) {
      // Find the run that crossed the milestone
      let cumulative = 0;
      for (const r of shoeRuns) {
        cumulative += r.distanceKm * 0.621371;
        if (cumulative >= milestone) {
          newMoments.push({
            type,
            date: r.date,
            distanceKm: r.distanceKm,
            caption: `${milestone} miles. Still going.`,
            runId: r.id,
          });
          break;
        }
      }
    }
  }

  return newMoments;
}

// ── Inter-shoe Relationships ────────────────────────────────────────────────

export function updateRelationships(
  shoe: LivingShoe,
  allShoes: LivingShoe[],
  recentRuns: Run[],
): ShoeRelationship[] {
  const relationships: ShoeRelationship[] = [...(shoe.relationships || [])];
  const last7Days = Date.now() - 7 * 86400000;
  const recentShoeIds = new Set(
    recentRuns
      .filter(r => new Date(r.date).getTime() > last7Days)
      .map(r => r.shoeId)
  );

  for (const other of allShoes) {
    if (other.shoeId === shoe.shoeId) continue;

    let rel = relationships.find(r => r.otherShoeId === other.shoeId);
    if (!rel) {
      rel = { otherShoeId: other.shoeId, sentiment: 0, lastUpdated: new Date().toISOString() };
      relationships.push(rel);
    }

    // If this shoe was ignored but the other was used, resentment grows
    if (!recentShoeIds.has(shoe.shoeId) && recentShoeIds.has(other.shoeId)) {
      rel.sentiment = Math.max(-1, rel.sentiment - 0.1);
    }
    // If both used, sentiment improves (teammates)
    else if (recentShoeIds.has(shoe.shoeId) && recentShoeIds.has(other.shoeId)) {
      rel.sentiment = Math.min(1, rel.sentiment + 0.05);
    }

    rel.lastUpdated = new Date().toISOString();
  }

  return relationships;
}

// ── Create a new Living Shoe from a data shoe ───────────────────────────────

export function createLivingShoe(shoe: Shoe, weightLbs: number): LivingShoe {
  return {
    shoeId: shoe.id,
    addedDate: new Date().toISOString(),
    archetype: seedArchetype(shoe),
    personalitySeed: Math.random(),
    archetypeDrift: {},
    nickname: null,
    mood: 'eager',
    lifeStage: 'fresh',
    lifePct: 0,
    lifespanMiles: estimateLifespanMiles(shoe, weightLbs),
    totalMiles: 0,
    runCount: 0,
    lastRunDate: null,
    daysSinceLastRun: 0,
    relationships: [],
    moments: [],
    ancestorId: null,
    inheritedTrait: null,
    inheritedMemory: null,
    heirId: null,
    lastMoodUpdate: new Date().toISOString(),
    lastDialogueTrigger: null,
    purchasePrice: null,
    decompressionHours: 0,
  };
}

// ── Update a Living Shoe after a run ────────────────────────────────────────

export function updateShoeAfterRun(
  shoe: LivingShoe,
  shoeData: Shoe,
  allRuns: Run[],
  allShoes: LivingShoe[],
  weightLbs: number,
): LivingShoe {
  const shoeRuns = allRuns.filter(r => r.shoeId === shoe.shoeId);
  const totalMiles = shoeRuns.reduce((s, r) => s + r.distanceKm * 0.621371, 0)
    + (shoe.importedBaselineMiles ?? 0);
  const lifePct = Math.min(100, (totalMiles / shoe.lifespanMiles) * 100);
  const lastRun = shoeRuns.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];
  const daysSinceLastRun = lastRun
    ? Math.floor((Date.now() - new Date(lastRun.date).getTime()) / 86400000)
    : 999;

  const lifeStage = computeLifeStage(lifePct, false);
  const mood = computeMood(
    lifePct, daysSinceLastRun,
    lastRun?.match_quality ?? null,
    shoeRuns.length, lifeStage,
  );

  return {
    ...shoe,
    totalMiles,
    runCount: shoeRuns.length,
    lastRunDate: lastRun?.date ?? null,
    daysSinceLastRun,
    lifePct,
    lifeStage,
    mood,
    archetypeDrift: computeArchetypeDrift(shoeRuns),
    nickname: computeNickname(shoeRuns, totalMiles),
    moments: detectMoments(shoe.shoeId, allRuns, shoe.moments),
    relationships: updateRelationships(shoe, allShoes, allRuns),
    lastMoodUpdate: new Date().toISOString(),
    decompressionHours: computeDecompressionHours(lastRun),
  };
}
