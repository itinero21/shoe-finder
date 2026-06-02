/**
 * SHOE INTELLIGENCE — The core decision engine.
 *
 * "Which shoe should I wear today?" answered better than any human
 * coach, running store employee, Garmin, Strava, Runna, or shoe website.
 *
 * Systems:
 * 1. Shoe Readiness Score (0-100% per shoe for today)
 * 2. Shoe Confidence Score (historical feel tracking)
 * 3. Bad Purchase Detection (abandoned shoes)
 * 4. Shoe Chemistry (rotation pair compatibility)
 * 5. Regret Engine (shoes retired too late)
 * 6. Running Life Timeline (year-by-year story)
 * 7. Shoe Passport (full lifecycle data)
 */

import { Shoe } from '../data/shoes';
import { Run } from '../types/run';
import { LivingShoe, ShoeMemorial } from '../types/character';
import { TodaysWeather } from '../services/weatherService';

// ─── 1. SHOE READINESS SCORE ────────────────────────────────────────────────
// Per-shoe percentage: how ready is this shoe for a run TODAY?

export interface ShoeReadiness {
  shoeId: string;
  shoeName: string;
  score: number;         // 0-100
  label: string;         // "Perfect for today" / "Save for tomorrow" / etc.
  factors: string[];     // why this score
}

export function computeShoeReadiness(
  char: LivingShoe,
  shoe: Shoe,
  allRuns: Run[],
  weather: TodaysWeather | null,
  allChars: LivingShoe[],
): ShoeReadiness {
  let score = 75; // base
  const factors: string[] = [];
  const name = `${shoe.brand} ${shoe.model}`;
  const now = Date.now();

  const shoeRuns = allRuns.filter(r => r.shoeId === char.shoeId);
  const last7 = allRuns.filter(r => now - new Date(r.date).getTime() < 7 * 86400000);
  const shoeRunsLast7 = last7.filter(r => r.shoeId === char.shoeId);
  const recentLoadKm = allRuns
    .filter(r => now - new Date(r.date).getTime() < 3 * 86400000)
    .reduce((s, r) => s + r.distanceKm, 0);

  // Life remaining
  const lifeRemaining = 100 - char.lifePct;
  if (lifeRemaining <= 10) { score -= 40; factors.push('Almost dead — retire soon'); }
  else if (lifeRemaining <= 20) { score -= 20; factors.push('Low life remaining'); }
  else if (lifeRemaining <= 40) { score -= 8; factors.push('Past prime'); }
  else if (lifeRemaining >= 80) { score += 5; factors.push('Lots of life left'); }

  // Rotation freshness — least recently used gets boosted
  if (char.daysSinceLastRun >= 7) { score += 15; factors.push('Fresh — rested for a week'); }
  else if (char.daysSinceLastRun >= 3) { score += 8; factors.push('Well rested'); }
  else if (char.daysSinceLastRun === 0) { score -= 12; factors.push('Used today already'); }
  else if (char.daysSinceLastRun === 1) { score -= 5; factors.push('Used yesterday'); }

  // Overuse penalty
  if (shoeRunsLast7.length >= 4) { score -= 15; factors.push('Overused this week'); }
  else if (shoeRunsLast7.length >= 3) { score -= 8; factors.push('Heavy rotation this week'); }

  // High recent load → favor cushioned shoes
  if (recentLoadKm > 30) {
    if (shoe.biomech.cushioning_level >= 8) { score += 10; factors.push('Cushion for heavy week'); }
    if (shoe.category === 'carbon_racer') { score -= 15; factors.push('Legs are tired — save the racer'); }
  }

  // Weather
  if (weather) {
    if (weather.isRaining || weather.isSnowing) {
      const isTrail = shoe.use_cases.some(u => u.startsWith('trail'));
      if (isTrail || shoe.biomech.torsional_rigidity >= 7) { score += 8; factors.push('Good grip for wet'); }
      if (shoe.category === 'carbon_racer') { score -= 12; factors.push("Don't risk in rain"); }
      if (lifeRemaining <= 30) { score -= 5; factors.push("Don't send a dying shoe into rain"); }
    }
    if (weather.isHot) {
      if (shoe.specs.weight_oz <= 9) { score += 5; factors.push('Light for the heat'); }
      if (shoe.specs.weight_oz > 11) { score -= 5; factors.push('Heavy for hot weather'); }
    }
    if (weather.isCold && shoe.biomech.cushioning_level >= 7) {
      score += 3; factors.push('Cushion handles cold ground');
    }
    if (weather.isWindy && shoe.biomech.wide_base) {
      score += 3; factors.push('Stable in wind');
    }
  }

  // Confidence: shoes that usually produce good runs
  const goodRuns = shoeRuns.filter(r => r.feel === 3).length;
  const badRuns = shoeRuns.filter(r => r.feel === 1).length;
  if (shoeRuns.length >= 5) {
    const confidencePct = goodRuns / shoeRuns.length;
    if (confidencePct > 0.7) { score += 8; factors.push('High confidence shoe'); }
    if (badRuns / shoeRuns.length > 0.3) { score -= 10; factors.push('Often causes discomfort'); }
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  let label = 'Ready';
  if (score >= 85) label = 'Perfect for today';
  else if (score >= 70) label = 'Good choice';
  else if (score >= 50) label = 'Save for another day';
  else if (score >= 30) label = 'Not recommended today';
  else label = 'Retire this shoe';

  return { shoeId: char.shoeId, shoeName: name, score, label, factors };
}

// ─── 2. SHOE CONFIDENCE SCORE ───────────────────────────────────────────────

export interface ShoeConfidence {
  shoeId: string;
  shoeName: string;
  confidencePct: number;  // 0-100
  totalRated: number;
  goodRuns: number;
  badRuns: number;
  trend: 'improving' | 'declining' | 'stable';
}

export function computeShoeConfidence(
  char: LivingShoe, shoe: Shoe, runs: Run[],
): ShoeConfidence {
  const shoeRuns = runs.filter(r => r.shoeId === char.shoeId && r.feel != null);
  const good = shoeRuns.filter(r => r.feel === 3).length;
  const bad = shoeRuns.filter(r => r.feel === 1).length;
  const total = shoeRuns.length;
  const pct = total > 0 ? Math.round((good / total) * 100) : 50;

  // Trend: compare last 5 vs previous 5
  let trend: ShoeConfidence['trend'] = 'stable';
  if (total >= 10) {
    const recent5 = shoeRuns.slice(-5);
    const prev5 = shoeRuns.slice(-10, -5);
    const recentGood = recent5.filter(r => r.feel === 3).length;
    const prevGood = prev5.filter(r => r.feel === 3).length;
    if (recentGood > prevGood + 1) trend = 'improving';
    else if (recentGood < prevGood - 1) trend = 'declining';
  }

  return {
    shoeId: char.shoeId,
    shoeName: `${shoe.brand} ${shoe.model}`,
    confidencePct: pct,
    totalRated: total,
    goodRuns: good,
    badRuns: bad,
    trend,
  };
}

// ─── 3. BAD PURCHASE DETECTION ──────────────────────────────────────────────

export interface BadPurchase {
  shoeId: string;
  shoeName: string;
  totalRuns: number;
  totalMiles: number;
  daysSinceAdded: number;
  confidencePct: number;
  reason: string;
}

export function detectBadPurchases(
  chars: LivingShoe[], shoeData: Record<string, Shoe>, runs: Run[],
): BadPurchase[] {
  const bads: BadPurchase[] = [];

  for (const char of chars) {
    if (char.lifeStage === 'departed') continue;
    const shoe = shoeData[char.shoeId];
    if (!shoe) continue;

    const daysSinceAdded = Math.floor((Date.now() - new Date(char.addedDate).getTime()) / 86400000);
    if (daysSinceAdded < 30) continue; // give it a month

    const shoeRuns = runs.filter(r => r.shoeId === char.shoeId);
    const confidence = computeShoeConfidence(char, shoe, runs);

    // Low usage: added 30+ days ago but < 3 runs
    if (shoeRuns.length < 3 && daysSinceAdded >= 30) {
      bads.push({
        shoeId: char.shoeId,
        shoeName: `${shoe.brand} ${shoe.model}`,
        totalRuns: char.runCount,
        totalMiles: char.totalMiles,
        daysSinceAdded,
        confidencePct: confidence.confidencePct,
        reason: `Added ${daysSinceAdded} days ago but only ${char.runCount} runs. You consistently choose other shoes.`,
      });
    }
    // Low confidence: used but bad feel
    else if (confidence.totalRated >= 5 && confidence.confidencePct < 40) {
      bads.push({
        shoeId: char.shoeId,
        shoeName: `${shoe.brand} ${shoe.model}`,
        totalRuns: char.runCount,
        totalMiles: char.totalMiles,
        daysSinceAdded,
        confidencePct: confidence.confidencePct,
        reason: `Only ${confidence.confidencePct}% confidence. Consider replacing — this shoe isn't working for you.`,
      });
    }
  }

  return bads;
}

// ─── 4. SHOE CHEMISTRY ─────────────────────────────────────────────────────

export interface ShoeChemistry {
  shoe1: string;
  shoe2: string;
  compatibility: 'excellent' | 'good' | 'poor';
  reason: string;
}

export function analyzeRotationChemistry(
  chars: LivingShoe[], shoeData: Record<string, Shoe>,
): ShoeChemistry[] {
  const active = chars.filter(c => c.lifeStage !== 'departed');
  const results: ShoeChemistry[] = [];

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i], b = active[j];
      const shoeA = shoeData[a.shoeId], shoeB = shoeData[b.shoeId];
      if (!shoeA || !shoeB) continue;

      const nameA = `${shoeA.brand} ${shoeA.model}`;
      const nameB = `${shoeB.brand} ${shoeB.model}`;

      // Same category = redundant
      if (shoeA.category === shoeB.category) {
        results.push({
          shoe1: nameA, shoe2: nameB,
          compatibility: 'poor',
          reason: 'Both serve the same role. Your rotation lacks variety.',
        });
        continue;
      }

      // Different load patterns = excellent
      const firmDiff = Math.abs(shoeA.biomech.cushioning_firmness - shoeB.biomech.cushioning_firmness);
      const dropDiff = Math.abs(shoeA.specs.drop_mm - shoeB.specs.drop_mm);
      const catDiff = shoeA.category !== shoeB.category;

      if (catDiff && firmDiff >= 3) {
        results.push({
          shoe1: nameA, shoe2: nameB,
          compatibility: 'excellent',
          reason: 'Different load patterns, foam types, and training purposes.',
        });
      } else if (catDiff) {
        results.push({
          shoe1: nameA, shoe2: nameB,
          compatibility: 'good',
          reason: 'Different roles — decent rotation variety.',
        });
      }
    }
  }

  return results;
}

// ─── 5. REGRET ENGINE ───────────────────────────────────────────────────────

export interface ShoeRegret {
  shoeId: string;
  shoeName: string;
  retiredAt: number;       // miles
  shouldHaveRetiredAt: number;
  overuseMiles: number;
  risk: string;
}

export function detectRegrets(
  memorials: ShoeMemorial[], shoeData: Record<string, Shoe>,
): ShoeRegret[] {
  const regrets: ShoeRegret[] = [];

  for (const m of memorials) {
    const shoe = shoeData[m.shoeId];
    if (!shoe) continue;

    // Estimate ideal retirement mileage from shoe type
    const isRacer = shoe.category === 'carbon_racer';
    const idealMiles = isRacer ? 200 : 400;

    if (m.totalMiles > idealMiles * 1.3) {
      regrets.push({
        shoeId: m.shoeId,
        shoeName: `${m.brand} ${m.model}`,
        retiredAt: Math.round(m.totalMiles),
        shouldHaveRetiredAt: idealMiles,
        overuseMiles: Math.round(m.totalMiles - idealMiles),
        risk: `Retired ${Math.round(m.totalMiles - idealMiles)} miles past recommended. Injury risk was elevated.`,
      });
    }
  }

  return regrets;
}

// ─── 6. RUNNING LIFE TIMELINE ───────────────────────────────────────────────

export interface TimelineYear {
  year: number;
  events: TimelineEvent[];
}

export interface TimelineEvent {
  date: string;
  type: 'shoe_added' | 'shoe_retired' | 'first_race' | 'milestone' | 'pr';
  title: string;
  detail: string;
}

export function buildRunningLifeTimeline(
  chars: LivingShoe[],
  memorials: ShoeMemorial[],
  shoeData: Record<string, Shoe>,
  runs: Run[],
): TimelineYear[] {
  const events: TimelineEvent[] = [];

  // Shoe additions
  for (const c of chars) {
    const shoe = shoeData[c.shoeId];
    if (!shoe) continue;
    events.push({
      date: c.addedDate,
      type: 'shoe_added',
      title: `Added ${shoe.brand} ${shoe.model}`,
      detail: `Joined the closet`,
    });
  }

  // Retirements
  for (const m of memorials) {
    events.push({
      date: m.deathDate,
      type: 'shoe_retired',
      title: `Retired ${m.brand} ${m.model}`,
      detail: `${Math.round(m.totalMiles)} miles · ${m.runCount} runs`,
    });
  }

  // First race
  const raceRuns = runs.filter(r => r.purpose === 'race').sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  if (raceRuns.length > 0) {
    const first = raceRuns[0];
    const shoe = shoeData[first.shoeId];
    events.push({
      date: first.date,
      type: 'first_race',
      title: 'First Race',
      detail: shoe ? `In ${shoe.brand} ${shoe.model}` : '',
    });
  }

  // Mileage milestones
  let cumulative = 0;
  const sortedRuns = [...runs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const milestones = [100, 500, 1000, 2000, 5000, 10000];
  const hit = new Set<number>();
  for (const r of sortedRuns) {
    cumulative += r.distanceKm * 0.621371;
    for (const m of milestones) {
      if (cumulative >= m && !hit.has(m)) {
        hit.add(m);
        events.push({
          date: r.date,
          type: 'milestone',
          title: `${m.toLocaleString()} Lifetime Miles`,
          detail: '',
        });
      }
    }
  }

  // Sort all events by date
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Group by year
  const byYear: Record<number, TimelineEvent[]> = {};
  for (const e of events) {
    const year = new Date(e.date).getFullYear();
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(e);
  }

  return Object.entries(byYear)
    .map(([year, evts]) => ({ year: Number(year), events: evts }))
    .sort((a, b) => b.year - a.year);
}

// ─── 7. SHOE PASSPORT ──────────────────────────────────────────────────────

export interface ShoePassport {
  shoeId: string;
  brand: string;
  model: string;
  addedDate: string;
  price: number;
  currentMileage: number;
  costPerMile: number;
  remainingLife: number;
  bestRun: { date: string; distanceKm: number } | null;
  totalRuns: number;
  confidencePct: number;
  lifeStage: string;
  nickname: string | null;
}

export function buildShoePassport(
  char: LivingShoe, shoe: Shoe, runs: Run[],
): ShoePassport {
  const shoeRuns = runs.filter(r => r.shoeId === char.shoeId);
  const bestRun = shoeRuns.length > 0
    ? shoeRuns.reduce((best, r) => r.distanceKm > best.distanceKm ? r : best)
    : null;

  const good = shoeRuns.filter(r => r.feel === 3).length;
  const rated = shoeRuns.filter(r => r.feel != null).length;

  return {
    shoeId: char.shoeId,
    brand: shoe.brand,
    model: shoe.model,
    addedDate: char.addedDate,
    price: shoe.price_usd,
    currentMileage: Math.round(char.totalMiles),
    costPerMile: char.totalMiles > 0 ? shoe.price_usd / char.totalMiles : 0,
    remainingLife: Math.max(0, Math.round(char.lifespanMiles - char.totalMiles)),
    bestRun: bestRun ? { date: bestRun.date, distanceKm: bestRun.distanceKm } : null,
    totalRuns: char.runCount,
    confidencePct: rated > 0 ? Math.round((good / rated) * 100) : 50,
    lifeStage: char.lifeStage,
    nickname: char.nickname,
  };
}
