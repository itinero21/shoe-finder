/**
 * BRIDGE — feeds STRIDE's app data into the Intelligence Engine v2.1 and
 * returns the exact shapes the closet UI already renders.
 *
 * This is the replacement for the old intelligence layer:
 *   dailyShoeAdvisor.getShoeOfTheDay      → getShoeOfTheDay (engine-backed)
 *   dailyShoeAdvisor.getRotationAnalysis  → getRotationAnalysis
 *   shoeIntelligence.computeShoeReadiness → getReadinessScores
 *   shoeLifeIntelligence health reports   → generateAllHealthReports
 *   painPatternDetector.detectPainPatterns→ detectPainPatterns
 *
 * The engine works in km and RPE; the bridge converts the app's miles,
 * run purposes and 3-point "feel" ratings, learns the runner's Shoe DNA
 * from their own comfort history, and wires foam decompression state
 * into every daily decision.
 */
// Owned shoes may be legacy or preordered models, so the engine's catalog is
// the full trackable set — decisions only ever run over shoes the user owns.
import { ALL_TRACKABLE_SHOES as SHOES, CURRENT_SHOES, Shoe } from '../data/shoes';
import { Run } from '../types/run';
import { LivingShoe, ShoeMemorial } from '../types/character';
import { UserProfile } from '../utils/userProfile';
import { TodaysWeather } from '../services/weatherService';
import { getDecompressionState } from '../utils/shoeFundEngine';

import {
  EngineInput, OwnedShoe, PainArea, PlannedRun, RunIntent, RunRecord, RunnerProfile, ShoeDecision, Surface,
} from './types';
import { adaptCatalog, milesToKm } from './adapter';
import { clamp } from './math';
import { recommendReplacements } from './engines/replacement';
import { buildRunningGenome, describeShoeDNA, GenomeInsight } from './genome';
import { recommendShoeForToday } from './engines/recommendation';
import { calculateLoadState } from './engines/load';
import { assessLifecycle } from './engines/lifecycle';
import { learnPreferences } from './engines/personalization';
import { detectPainPatterns as enginePainPatterns } from './engines/painPatterns';

// ── UI-facing shapes (kept identical to the old modules) ────────────────────

export interface ShoeRecommendation {
  shoeId: string;
  shoeName: string;
  reason: string;
  score: number;
  warnings: string[];
  /** 0-100 — how much history and verified data back this pick */
  confidence: number;
}

export interface ShoeReadiness {
  shoeId: string;
  shoeName: string;
  score: number;
  label: string;
  factors: string[];
}

export interface ShoeHealthReport {
  shoeId: string;
  shoeName: string;
  totalMiles: number;
  lifePct: number;
  health: number;
  estimatedMilesRemaining: number;
  estimatedRunsRemaining: number;
  wearRisk: 'low' | 'moderate' | 'high' | 'critical';
  retireWarning: string | null;
  restrictions: string[];
  loadWarning: string | null;
  costPerMile: number | null;
}

export interface PainPattern {
  pattern: string;
  confidence: 'low' | 'medium' | 'high';
  shoeId?: string;
  shoeName?: string;
  metric?: string;
}

// ── App data → engine input ─────────────────────────────────────────────────

const SURFACE_MAP: Record<string, Surface> = {
  road: 'road', trail: 'groomed_trail', track: 'track', treadmill: 'treadmill',
};

const INTENT_MAP: Record<string, RunIntent> = {
  easy: 'easy', tempo: 'tempo', long: 'long', race: 'race',
  recovery: 'recovery', speed: 'intervals', walk: 'walk',
};

const RPE_MAP: Record<string, number> = {
  race: 9, speed: 8, tempo: 7, long: 6, easy: 4, recovery: 3, walk: 2,
};

/** Learning Engine: issue chips carry real pain locations into the engine */
const ISSUE_PAIN_MAP: Partial<Record<string, { area: PainArea; severity: number }>> = {
  pain:         { area: 'other',     severity: 5 },
  hot_spots:    { area: 'foot',      severity: 3 },
  blisters:     { area: 'foot',      severity: 4 },
  heel_slip:    { area: 'heel_arch', severity: 3 },
  toe_pressure: { area: 'foot',      severity: 4 },
};

function toRunRecord(r: Run): RunRecord {
  const intent = r.purpose ? INTENT_MAP[r.purpose] : undefined;

  // Comfort: prefer the 5-point Learning Engine scale, fall back to legacy 3-point
  const comfort: (1 | 2 | 3 | 4 | 5) | undefined =
    r.feel5 ?? (r.feel != null ? ((r.feel === 1 ? 2 : r.feel === 2 ? 3 : 5) as 1 | 2 | 3 | 4 | 5) : undefined);

  // Pain: real issue reports first; legacy "dead" feel as a weak proxy
  const pain = (r.issues ?? [])
    .map(i => ISSUE_PAIN_MAP[i])
    .filter((x): x is { area: PainArea; severity: number } => !!x)
    .map(x => ({ area: x.area, severity: x.severity, timing: 'during' as const }));
  if (pain.length === 0 && r.feel5 == null && r.feel === 1) {
    pain.push({ area: 'other', severity: 4, timing: 'during' });
  }

  return {
    id: r.id,
    occurredAt: r.date,
    distanceKm: r.distanceKm,
    ...(r.durationMinutes != null ? { durationMinutes: r.durationMinutes } : {}),
    effortRpe: RPE_MAP[r.purpose ?? ''] ?? 5,
    surface: SURFACE_MAP[r.terrain ?? 'road'] ?? 'road',
    ...(intent ? { intent } : {}),
    shoeId: r.shoeId,
    ...(comfort != null ? { comfort } : {}),
    ...(pain.length ? { pain } : {}),
  };
}

function toOwnedShoe(char: LivingShoe): OwnedShoe {
  const decomp = getDecompressionState(char);
  return {
    id: char.shoeId,
    profileId: char.shoeId,
    distanceKm: milesToKm(char.totalMiles),
    runs: char.runCount,
    ...(char.lastRunDate ? { lastUsedAt: char.lastRunDate } : {}),
    ...(char.purchasePrice != null ? { purchasePrice: char.purchasePrice } : {}),
    ...(char.lifeStage === 'departed' ? { retiredAt: new Date().toISOString() } : {}),
    recoveryPct: decomp.pctRecovered,
  };
}

const INJURY_AREA_PATTERNS: [RegExp, PainArea][] = [
  [/knee|patell|runner'?s knee/i, 'knee'],
  [/shin|tibial/i, 'shin'],
  [/plantar|heel|arch/i, 'heel_arch'],
  [/achilles|calf/i, 'achilles_calf'],
  [/it.?band|hip|glute/i, 'it_band_hip'],
  [/back/i, 'back'],
  [/stress|metatars|foot|toe|bunion/i, 'foot'],
];

function buildRunner(runs: RunRecord[], catalog: ReturnType<typeof adaptCatalog>, profile?: UserProfile | null): RunnerProfile {
  const currentPain: Partial<Record<PainArea, number>> = {};
  if (profile?.active_injury) {
    const inj = profile.active_injury;
    const area = INJURY_AREA_PATTERNS.find(([re]) => re.test(inj.injury_type))?.[1] ?? 'other';
    const latest = inj.severity_history[inj.severity_history.length - 1]?.score ?? 5;
    currentPain[area] = latest;
  }

  const km28 = runs
    .filter(r => (Date.now() - new Date(r.occurredAt).getTime()) / 86400000 <= 28)
    .reduce((s, r) => s + r.distanceKm, 0);

  const total = runs.length;
  const experience = total < 10 ? 'new' : total < 40 ? 'recreational' : total < 120 ? 'trained' : 'competitive';

  // Learn Shoe DNA from the runner's own comfort history (shoeId == profileId here)
  const ownedMap = new Map(runs.filter(r => r.shoeId).map(r => [r.shoeId!, r.shoeId!]));
  const preferences = learnPreferences(runs, catalog, ownedMap);

  return {
    id: 'stride-user',
    experience,
    ...(profile?.weight_lbs ? { bodyMassKg: Math.round(profile.weight_lbs * 0.4536) } : {}),
    averageWeeklyKm: +(km28 / 4).toFixed(1),
    currentPain,
    recentInjuryAreas: [],
    comfortPriority: 70,
    preferences,
  };
}

function buildPlannedRun(runs: RunRecord[], weather: TodaysWeather | null): PlannedRun {
  // Distance: median of the last 10 runs, defaulting to 5 km
  const recent = runs.slice().sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 10);
  const sorted = recent.map(r => r.distanceKm).sort((a, b) => a - b);
  const distanceKm = sorted.length ? sorted[Math.floor(sorted.length / 2)]! : 5;

  // Surface: most common recent surface
  const counts: Partial<Record<Surface, number>> = {};
  for (const r of recent) counts[r.surface] = (counts[r.surface] ?? 0) + 1;
  const surface = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'road') as Surface;

  // Intent: if yesterday was a hard effort, today is a recovery day
  const yesterday = recent.find(r => (Date.now() - new Date(r.occurredAt).getTime()) / 86400000 <= 1.5);
  const intent: RunIntent = yesterday && yesterday.effortRpe >= 7 ? 'recovery' : 'easy';

  const wx: PlannedRun['weather'] = [];
  if (weather) {
    if (weather.isRaining) wx.push('rain');
    if (weather.isSnowing) wx.push('snow');
    if (weather.isHot) wx.push('hot');
    if (weather.isCold) wx.push('cold');
    if (weather.isWindy) wx.push('windy');
    if (weather.humidity > 80 && !weather.isCold) wx.push('humid');
  }
  if (wx.length === 0) wx.push('dry');

  return { date: new Date().toISOString(), intent, distanceKm, surface, weather: wx };
}

export function buildEngineInput(
  livingShoes: LivingShoe[],
  runs: Run[],
  weather: TodaysWeather | null,
  profile?: UserProfile | null,
): EngineInput {
  const catalog = adaptCatalog(SHOES);
  const runRecords = runs.map(toRunRecord);

  const runner = buildRunner(runRecords, catalog, profile);
  // Learning Engine: explicit firmness complaints outweigh inferred preference
  const tooFirm = runs.filter(r => r.issues?.includes('too_firm')).length;
  const tooSoft = runs.filter(r => r.issues?.includes('too_soft')).length;
  if (runner.preferences.softness != null) {
    runner.preferences.softness = clamp(runner.preferences.softness + (tooFirm - tooSoft) * 4);
  } else if (tooFirm - tooSoft >= 2) {
    runner.preferences.softness = 70;
  } else if (tooSoft - tooFirm >= 2) {
    runner.preferences.softness = 40;
  }

  return {
    runner,
    plannedRun: buildPlannedRun(runRecords, weather),
    recentRuns: runRecords,
    ownedShoes: livingShoes.filter(c => c.lifeStage !== 'departed').map(toOwnedShoe),
    catalog,
    today: new Date().toISOString(),
  };
}

// ── Drop-in replacements for the old intelligence layer ────────────────────

export function getShoeOfTheDay(
  livingShoes: LivingShoe[],
  shoeData: Record<string, Shoe>,
  runs: Run[],
  weather: TodaysWeather | null,
  profile?: UserProfile | null,
): ShoeRecommendation | null {
  const input = buildEngineInput(livingShoes, runs, weather, profile);
  if (input.ownedShoes.length === 0) return null;
  const result = recommendShoeForToday(input);
  if (!result.recommended) return null;

  const rec = result.recommended;
  const shoe = shoeData[rec.profileId];
  return {
    shoeId: rec.shoeId,
    shoeName: shoe ? `${shoe.brand} ${shoe.model}` : rec.profileId,
    reason: result.message,
    score: rec.readiness,
    warnings: [
      ...(result.safetyNotice ? [result.safetyNotice] : []),
      ...rec.cautions,
    ].slice(0, 3),
    confidence: rec.confidence,
  };
}

export function getRotationAnalysis(
  livingShoes: LivingShoe[],
  shoeData: Record<string, Shoe>,
  runs: Run[],
): { advice: string } {
  const load = calculateLoadState(runs.map(toRunRecord));
  const parts: string[] = [];

  if (load.acuteChronicRatio != null) {
    if (load.acuteChronicRatio > 1.5) {
      parts.push(`Your last 7 days (${load.acuteKm7d} km) are well above your usual weekly load (${load.chronicWeeklyKm} km). Ease off before something complains.`);
    } else if (load.acuteChronicRatio < 0.6 && load.chronicWeeklyKm > 5) {
      parts.push('You are running well under your usual volume this week — a good window for a longer effort.');
    }
  }
  if (load.hardRuns7d >= 3) parts.push(`${load.hardRuns7d} hard sessions in 7 days — protect tomorrow as an easy day.`);
  if (load.consecutiveDays >= 5) parts.push(`${load.consecutiveDays} straight days on your feet. Your shoes noticed. So did your legs.`);
  if (load.painFlag) parts.push('A recent run felt rough — keep the next few relaxed and watch how it responds.');

  const active = livingShoes.filter(c => c.lifeStage !== 'departed');
  if (parts.length === 0 && active.length >= 2) {
    parts.push('Load looks balanced. Keep rotating — alternating shoes gives each midsole time to decompress.');
  }
  return { advice: parts[0] ?? '' };
}

export function getReadinessScores(
  livingShoes: LivingShoe[],
  shoeData: Record<string, Shoe>,
  runs: Run[],
  weather: TodaysWeather | null,
  profile?: UserProfile | null,
): ShoeReadiness[] {
  const input = buildEngineInput(livingShoes, runs, weather, profile);
  if (input.ownedShoes.length === 0) return [];
  const result = recommendShoeForToday(input);

  const label = (d: ShoeDecision, isTop: boolean): string => {
    if (!d.allowed) return d.health < 12 ? 'Past its running life' : 'Sitting this one out';
    if (isTop) return 'Perfect for today';
    if (d.readiness >= 75) return 'Ready to go';
    if (d.readiness >= 50) return 'Solid option';
    return 'Save for another day';
  };

  const all = [
    ...(result.recommended ? [result.recommended] : []),
    ...result.alternatives,
    ...result.avoid,
  ];
  const seen = new Set<string>();
  const topId = result.recommended?.shoeId;

  return all
    .filter(d => (seen.has(d.shoeId) ? false : (seen.add(d.shoeId), true)))
    .map(d => ({
      decision: d,
      shoeId: d.shoeId,
      shoeName: shoeData[d.profileId] ? `${shoeData[d.profileId]!.brand} ${shoeData[d.profileId]!.model}` : d.profileId,
      score: d.readiness,
      label: label(d, d.shoeId === topId),
      factors: d.reasons.slice(0, 3),
    }))
    // Usable shoes always rank above blocked ones, whatever their raw score
    .sort((a, b) => Number(b.decision.allowed) - Number(a.decision.allowed) || b.score - a.score)
    .map(({ decision: _d, ...rest }) => rest);
}

export function generateAllHealthReports(
  livingShoes: LivingShoe[],
  shoeData: Record<string, Shoe>,
  runs: Run[],
): ShoeHealthReport[] {
  const catalog = adaptCatalog(SHOES);
  const byId = new Map(catalog.map(p => [p.id, p]));
  const runRecords = runs.map(toRunRecord);
  const runner = buildRunner(runRecords, catalog, null);

  return livingShoes
    .filter(c => c.lifeStage !== 'departed')
    .map(char => {
      const p = byId.get(char.shoeId);
      const shoe = shoeData[char.shoeId];
      if (!p || !shoe) return null;

      const owned = toOwnedShoe(char);
      const life = assessLifecycle(p, owned, runRecords, runner);
      const remainingMiles = Math.round(((life.remainingKm[0] + life.remainingKm[1]) / 2) / 1.60934);
      const shoeRuns = runs.filter(r => r.shoeId === char.shoeId);
      const avgMiles = shoeRuns.length
        ? shoeRuns.reduce((s, r) => s + r.distanceKm, 0) / 1.60934 / shoeRuns.length
        : 4;

      const wearRisk: ShoeHealthReport['wearRisk'] =
        life.state === 'healthy' ? 'low'
        : life.state === 'monitor' ? 'moderate'
        : life.state === 'retire_soon' ? 'high'
        : 'critical';

      const restrictions: string[] = [];
      if (life.state === 'walking_only') restrictions.push('Walking only — its running miles are done');
      else if (life.state === 'retire_soon') restrictions.push('Easy runs only — no speed work on spent foam');

      const painReason = life.reasons.find(r => /pain/i.test(r)) ?? null;

      return {
        shoeId: char.shoeId,
        shoeName: `${shoe.brand} ${shoe.model}`,
        totalMiles: Math.round(char.totalMiles),
        lifePct: Math.round(char.lifePct),
        health: Math.round(life.health),
        estimatedMilesRemaining: remainingMiles,
        estimatedRunsRemaining: Math.max(0, Math.round(remainingMiles / Math.max(1, avgMiles))),
        wearRisk,
        retireWarning:
          life.state === 'retire_now' ? `${shoe.model} has nothing left. Time for the retirement ceremony.`
          : life.state === 'walking_only' ? `${shoe.model} is done running — walking miles only from here.`
          : life.state === 'retire_soon' ? `${shoe.model} is near the end: roughly ${remainingMiles} miles left.`
          : null,
        restrictions,
        loadWarning: painReason,
        costPerMile:
          char.purchasePrice && char.totalMiles >= 1
            ? +(char.purchasePrice / char.totalMiles).toFixed(2)
            : null,
      };
    })
    .filter((x): x is ShoeHealthReport => x !== null);
}

export function detectPainPatterns(
  runs: Run[],
  shoeData: Record<string, Shoe>,
): PainPattern[] {
  const catalog = adaptCatalog(SHOES);
  const runRecords = runs.map(toRunRecord);
  const ownedMap = new Map(runRecords.filter(r => r.shoeId).map(r => [r.shoeId!, r.shoeId!]));
  const patterns = enginePainPatterns(runRecords, catalog, ownedMap);

  return patterns.map(p => {
    const firstShoe = p.shoeIds[0] ? shoeData[p.shoeIds[0]] : undefined;
    const names = p.shoeIds
      .map(id => shoeData[id]?.model)
      .filter((x): x is string => !!x)
      .slice(0, 2);
    // 'other' collects general pain reports and legacy low-feel runs
    const pattern =
      p.area === 'other'
        ? `Pain or rough-feeling runs cluster${names.length ? ` in ${names.join(' and ')}` : ''}, usually around ${p.minDistanceKm ?? '?'} km or later.`
        : `${p.statement}${names.length ? ` Mostly in ${names.join(' and ')}.` : ''}`;

    return {
      pattern,
      confidence: p.confidence >= 70 ? 'high' as const : p.confidence >= 40 ? 'medium' as const : 'low' as const,
      ...(p.shoeIds[0] ? { shoeId: p.shoeIds[0] } : {}),
      ...(firstShoe ? { shoeName: `${firstShoe.brand} ${firstShoe.model}` } : {}),
      ...(p.minDistanceKm != null ? { metric: `distance ≥ ${p.minDistanceKm} km` } : {}),
    };
  });
}

// ── ENGINE 3: DECISION CENTER — Today's Body / Risk / Opportunity ───────────

export interface DailyDecision {
  body: { label: string; detail: string };
  risk: { label: string; detail: string; elevated: boolean };
  opportunity: string;
}

export function getDailyDecision(
  runs: Run[],
  weather: TodaysWeather | null,
): DailyDecision {
  const load = calculateLoadState(runs.map(toRunRecord));

  const body =
    load.fatigue < 30
      ? { label: 'FRESH', detail: 'Recovery is complete. Legs are ready for anything.' }
      : load.fatigue < 60
      ? { label: 'WORKING', detail: `Moderate load — ${load.acuteKm7d} km in the last 7 days.` }
      : { label: 'LOADED', detail: `High fatigue: ${load.hardRuns7d} hard runs and ${load.consecutiveDays} straight days.` };

  const acr = load.acuteChronicRatio;
  const risk = load.painFlag
    ? { label: 'ELEVATED', detail: 'A recent run reported issues. Keep the next few easy.', elevated: true }
    : acr != null && acr > 1.5
    ? { label: 'ELEVATED', detail: `This week is ${Math.round((acr - 1) * 100)}% above your usual load.`, elevated: true }
    : { label: 'LOW', detail: 'Training load is inside your normal range.', elevated: false };

  let opportunity: string;
  const niceWeather = weather ? !weather.isRaining && !weather.isSnowing && !weather.isHot : true;
  if (load.fatigue < 35 && load.hardRuns7d === 0 && runs.length >= 5) {
    opportunity = 'Recovery is complete and no hard runs this week — a great day for speed.';
  } else if (acr != null && acr < 0.8 && niceWeather && load.chronicWeeklyKm > 5) {
    opportunity = 'You are under your usual volume and the weather is on your side — a long-run window.';
  } else if (load.consecutiveDays >= 5) {
    opportunity = `${load.consecutiveDays} straight days on your feet — an easy run keeps the streak honest.`;
  } else if (weather?.isRaining) {
    opportunity = 'Rainy miles build the toughest memories. Grip matters today.';
  } else {
    opportunity = 'Steady day. Bank easy miles and let the foam do the work.';
  }

  return { body, risk, opportunity };
}

// ── ENGINE 1: RUNNING GENOME — the living runner profile ────────────────────

export function getRunningGenome(
  livingShoes: LivingShoe[],
  runs: Run[],
  memorials: ShoeMemorial[],
): GenomeInsight[] {
  const insights = buildRunningGenome(runs, livingShoes, memorials);

  // Shoe DNA: learned mechanical preferences, readable
  const input = buildEngineInput(livingShoes, runs, null, null);
  const dna = describeShoeDNA(input.runner.preferences);
  if (dna.length >= 2 && runs.filter(r => r.feel5 != null || r.feel != null).length >= 5) {
    for (const d of dna.slice(0, 3)) {
      insights.push({
        dimension: 'shoe',
        label: `PREFERS ${d.label}`,
        value: d.value,
        detail: 'Learned from how you rate your own runs — not from a quiz.',
      });
    }
  }
  return insights;
}

// ── ENGINE 6: MARKETPLACE — the next shoe, argued honestly ──────────────────

export interface NextShoePick {
  shoeId: string;
  brand: string;
  model: string;
  price: number;
  score: number;
  confidence: number;
  reason: string;
  expectedMiles: number;
  estYearlyCost: number | null;
}

export function getNextShoeAdvice(
  livingShoes: LivingShoe[],
  runs: Run[],
  profile?: UserProfile | null,
  /** Max price from the runner's stated budget range (quiz); undefined = no cap */
  budget?: number,
): { retiringName: string | null; picks: NextShoePick[] } {
  const active = livingShoes.filter(c => c.lifeStage !== 'departed');
  if (active.length === 0) return { retiringName: null, picks: [] };

  // Whose successor are we shopping for? The most-worn active shoe past midlife.
  const retiring = [...active].sort((a, b) => b.lifePct - a.lifePct)[0]!;
  if (retiring.lifePct < 50) return { retiringName: null, picks: [] };

  const input = buildEngineInput(livingShoes, runs, null, profile ?? null);
  // Buyable pool only — never recommend legacy or unreleased shoes
  const buyable = adaptCatalog(SHOES).filter(p => {
    const src = CURRENT_SHOES.find(s => s.id === p.id);
    return !!src && (src.market_status ?? 'available') === 'available';
  });
  const owned = input.ownedShoes;
  const retiringOwned = owned.find(o => o.id === retiring.shoeId);
  if (!retiringOwned) return { retiringName: null, picks: [] };

  const recs = recommendReplacements(retiringOwned, buyable, owned, input.recentRuns, input.runner, budget);

  // Annualized mileage for yearly-cost estimates
  const yearAgo = Date.now() - 365 * 86400000;
  const yearRuns = runs.filter(r => new Date(r.date).getTime() >= yearAgo);
  const spanDays = yearRuns.length >= 2
    ? Math.max(30, (Date.now() - Math.min(...yearRuns.map(r => new Date(r.date).getTime()))) / 86400000)
    : 0;
  const annualMiles = spanDays > 0
    ? (yearRuns.reduce((s, r) => s + r.distanceKm, 0) / 1.60934) * (365 / spanDays)
    : 0;

  const retiringShoe = SHOES.find(s => s.id === retiring.shoeId);

  const picks = recs.slice(0, 3).map(r => {
    const shoe = CURRENT_SHOES.find(s => s.id === r.profileId)!;
    const p = buyable.find(x => x.id === r.profileId)!;
    const expectedMiles = Math.round(p.durabilityBaselineKm / 1.60934);
    return {
      shoeId: shoe.id,
      brand: shoe.brand,
      model: shoe.model,
      price: shoe.price_usd,
      score: r.score,
      confidence: r.confidence,
      reason: r.reasons[0] ?? 'Strong overall match.',
      expectedMiles,
      estYearlyCost: annualMiles > 20
        ? Math.round((shoe.price_usd / expectedMiles) * annualMiles)
        : null,
    };
  });

  return {
    retiringName: retiringShoe ? `${retiringShoe.brand} ${retiringShoe.model}` : null,
    picks,
  };
}
