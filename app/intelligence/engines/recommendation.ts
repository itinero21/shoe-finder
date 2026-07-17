/**
 * RECOMMENDATION ENGINE — the daily decision and explanation engine.
 *
 * Pipeline: runner state → planned run → load state → shoe mechanics →
 * lifecycle → personal evidence → rotation → decision + confidence.
 *
 * v2.1 strengthening over the drop:
 *   - Foam decompression: a shoe still recovering from its last run is
 *     penalized in proportion to how compressed it still is, and hard
 *     sessions on flat foam draw an explicit caution.
 *   - Race protection: race shoes with limited life left are saved for
 *     race day; goal races boost race-role shoes.
 *   - Elevation joins the component stack.
 *   - walking_only shoes are still allowed when today's intent is a walk.
 *   - Confidence is capped at 95 — the engine never claims certainty.
 */
import {
  DailyRecommendation, EngineInput, OwnedShoe, ScoreComponent, ShoeDecision, ShoeProfile,
} from '../types';
import { clamp } from '../math';
import { calculateLoadState } from './load';
import { assessLifecycle } from './lifecycle';
import { evidenceForShoe } from './personalization';
import {
  elevationScore, painContextScore, preferenceScore, roleScore, surfaceScore, transitionRisk, weatherScore,
} from './mechanics';

const c = (key: string, value: number, weight: number, explanation: string): ScoreComponent =>
  ({ key, score: ((value - 50) / 50) * weight, explanation });

/** Underused shoes get a small nudge to keep the rotation balanced. */
function rotation(shoe: OwnedShoe, input: EngineInput) {
  const recent = input.recentRuns.filter(r => r.shoeId);
  const total = recent.reduce((s, r) => s + r.distanceKm, 0);
  const own = recent.filter(r => r.shoeId === shoe.id).reduce((s, r) => s + r.distanceKm, 0);
  return total ? clamp(100 - (own / total) * 80) : 70;
}

function decision(shoe: OwnedShoe, p: ShoeProfile, input: EngineInput): ShoeDecision {
  const life = assessLifecycle(p, shoe, input.recentRuns, input.runner);
  const ev = evidenceForShoe(shoe.id, input.recentRuns, input.today);
  const load = calculateLoadState(input.recentRuns, input.today);
  const intent = input.plannedRun.intent;
  const hardSession = ['race', 'tempo', 'intervals'].includes(intent);

  const parts: ScoreComponent[] = [
    c('surface', surfaceScore(p, input), 28, 'Surface suitability'),
    c('purpose', roleScore(p, input), 23, 'Run-purpose suitability'),
    c('personal', ev.comfortMean ?? 50, 22,
      ev.sampleSize ? `Personal comfort from ${ev.sampleSize} runs` : 'No personal history yet'),
    c('lifecycle', life.health, 18, 'Shoe health'),
    c('preferences', preferenceScore(p, input), 13, 'Runner Shoe DNA match'),
    c('pain', painContextScore(p, input), 12, 'Current symptom context'),
    c('weather', weatherScore(p, input), 10, 'Weather and grip'),
    c('elevation', elevationScore(p, input), 8, 'Terrain profile match'),
    c('rotation', rotation(shoe, input), 8, 'Rotation balance'),
    { key: 'transition', score: -transitionRisk(p, input) * 0.12, explanation: 'Adaptation cost' },
  ];

  if (load.fatigue >= 70 && hardSession) {
    parts.push({ key: 'fatigue', score: -16, explanation: 'High fatigue conflicts with a demanding session' });
  }

  // v2.1: foam decompression — compressed foam runs flat
  const recovery = shoe.recoveryPct ?? 100;
  if (recovery < 100) {
    const deficit = (100 - recovery) / 100;
    parts.push({
      key: 'decompression',
      score: -deficit * (hardSession ? 22 : 12),
      explanation: `Foam is ${Math.round(recovery)}% recovered from the last run`,
    });
  }

  // v2.1: race-day logic — boost racers for goal races, save dying racers
  const isRacer = p.roles.includes('race');
  const importance = input.plannedRun.raceImportance ?? 'none';
  if (isRacer && intent === 'race' && (importance === 'goal_race' || importance === 'important')) {
    parts.push({ key: 'race_day', score: 10, explanation: 'Built for exactly this race' });
  }
  if (isRacer && ['recovery', 'easy', 'walk'].includes(intent) && life.remainingKm[1] < 150) {
    parts.push({ key: 'save_racer', score: -14, explanation: 'Limited race-day life left — save it for when it counts' });
  }

  const raw = 55 + parts.reduce((s, x) => s + x.score, 0);
  const severe = Object.values(input.runner.currentPain).some(v => (v ?? 0) >= 7);
  const walkingOk = life.state === 'walking_only' && intent === 'walk';
  const blocked =
    !!shoe.retiredAt ||
    life.state === 'retire_now' ||
    (life.state === 'walking_only' && !walkingOk) ||
    surfaceScore(p, input) === 0 ||
    input.plannedRun.weather.includes('ice') ||
    severe;

  // Foam recovery scales readiness multiplicatively so the penalty is never
  // swallowed by the 0-100 clamp on high-scoring shoes.
  const recoveryFactor = recovery < 100 ? 0.72 + 0.28 * (recovery / 100) : 1;
  const readiness = Math.round(clamp(raw - load.fatigue * 0.12) * recoveryFactor);
  const confidence = Math.round(clamp(
    Math.min(95, p.dataConfidence * 45 + ev.confidence * 0.45 + Math.min(10, input.recentRuns.length)),
  ));

  return {
    shoeId: shoe.id,
    profileId: p.id,
    allowed: !blocked,
    score: Math.round(clamp(raw)),
    readiness,
    confidence,
    health: life.health,
    remainingKm: life.remainingKm,
    components: parts,
    reasons: parts.filter(x => x.score >= 5).sort((a, b) => b.score - a.score).slice(0, 4).map(x => x.explanation),
    cautions: [
      ...life.reasons.filter(x => /pain|declined/i.test(x)),
      ...parts.filter(x => x.score <= -7).map(x => x.explanation),
    ].slice(0, 5),
  };
}

export function recommendShoeForToday(input: EngineInput): DailyRecommendation {
  const profiles = new Map(input.catalog.map(x => [x.id, x]));
  const xs = input.ownedShoes
    .map(s => {
      const p = profiles.get(s.profileId);
      return p ? decision(s, p, input) : undefined;
    })
    .filter((x): x is ShoeDecision => !!x)
    .sort((a, b) =>
      Number(b.allowed) - Number(a.allowed) || b.readiness - a.readiness || b.confidence - a.confidence);

  const good = xs.filter(x => x.allowed);
  const recommended = good[0];
  const load = calculateLoadState(input.recentRuns, input.today);
  const severe = Object.values(input.runner.currentPain).some(v => (v ?? 0) >= 7);

  return {
    ...(recommended ? { recommended } : {}),
    alternatives: good.slice(1, 4),
    avoid: xs.filter(x => !x.allowed || x.readiness < 35),
    load,
    message: recommended
      ? `Use ${profiles.get(recommended.profileId)?.model}. ${recommended.reasons[0] ?? 'It has the strongest overall match for today.'}`
      : 'No owned shoe clears today’s safety and surface checks.',
    ...(severe
      ? { safetyNotice: 'Severe pain was reported. STRIDE should pause normal run recommendations and advise professional assessment.' }
      : {}),
  };
}
