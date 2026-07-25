/**
 * STRIDE Physiology Engine
 *
 * Pure and deterministic: verified inputs become scores; an LLM is never
 * allowed to calculate health or readiness. Every comparison is personal.
 *
 * Two independent data domains feed this engine:
 *
 *   TRAINING DATA (Run[])         RECOVERY DATA (DailyBiometrics[])
 *   Strava, manual logging,   ×   Apple Health, Health Connect,
 *   STRIDE live run                Garmin direct, COROS direct
 *         │                              │
 *         └──────────────┬───────────────┘
 *                    BODY ENGINE
 *          baseline · recovery · run readiness ·
 *          training load · trends · pattern detection
 *
 * TRAINING DATA alone is enough to produce a full, non-empty BodyState —
 * overallLoad, readiness and legLoad are derived purely from Run[]. RECOVERY
 * DATA only sharpens `recovery`/`sleep`/the daily signal list; its absence
 * never blanks the screen, it just leaves those fields undefined and the
 * recommendation falls back to the conservative default (see below).
 *
 * Strava is intentionally never a RECOVERY DATA source: its API doesn't
 * expose overnight physiology, and Strava's 2026 API policy prohibits using
 * Strava data to power AI/analytics features or combining it with other
 * customer data for that purpose. Strava-derived Run[] rows feed only the
 * TRAINING DATA branch below.
 */
import { Run } from '../types/run';
import {
  BaselineStage,
  BodyState,
  ConfidenceLevel,
  DailyBiometrics,
  EstimatedLegLoad,
  RunnerBaseline,
  ScoredSignal,
  TrainingSummary,
} from './types';

const DAY = 86_400_000;
const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
const stdDev = (values: number[], average: number) =>
  Math.sqrt(mean(values.map(value => Math.pow(value - average, 2))));
const dateKey = (value: string) => value.slice(0, 10);
const ageDays = (today: string, value: string) =>
  Math.max(0, (new Date(`${dateKey(today)}T12:00:00`).getTime() - new Date(`${dateKey(value)}T12:00:00`).getTime()) / DAY);

type BaselineKey = RunnerBaseline['key'];

function metricValue(day: DailyBiometrics, key: BaselineKey): number | undefined {
  if (key === 'sleep') return day.sleep?.durationMinutes;
  if (key === 'hrv') return day.cardiovascular?.hrvMs;
  if (key === 'resting_hr') return day.cardiovascular?.restingHr;
  return day.cardiovascular?.respiratoryRate;
}

export function buildBaseline(
  history: DailyBiometrics[],
  key: BaselineKey,
  today = new Date().toISOString(),
): RunnerBaseline | undefined {
  const values = history
    .filter(day => dateKey(day.date) !== dateKey(today) && ageDays(today, day.date) <= 42)
    .map(day => metricValue(day, key))
    .filter((value): value is number => value != null && Number.isFinite(value) && value > 0)
    .slice(-28);
  if (!values.length) return undefined;

  const average = mean(values);
  const spread = Math.max(stdDev(values, average), average * 0.04);
  return {
    key,
    mean: +average.toFixed(1),
    lower: +(average - spread).toFixed(1),
    upper: +(average + spread).toFixed(1),
    sampleCount: values.length,
    confidence: clamp(values.length / 21, 0, 1),
  };
}

/** Progressive baseline maturity. Garmin's own health-baseline calibration
 * takes roughly 3-4 weeks, so a hard "ready after 7 days" claim overstates
 * confidence — these stages say what's actually true at each point. */
export function baselineStage(sampleCount: number): BaselineStage {
  if (sampleCount < 7) return 'learning';
  if (sampleCount < 14) return 'early';
  if (sampleCount < 28) return 'improving';
  return 'established';
}

const STAGE_LABEL: Record<BaselineStage, string> = {
  learning: 'LEARNING',
  early: 'EARLY BASELINE',
  improving: 'BASELINE IMPROVING',
  established: 'ESTABLISHED BASELINE',
};

export function baselineStageLabel(stage: BaselineStage): string {
  return STAGE_LABEL[stage];
}

function signalScore(
  key: BaselineKey,
  label: string,
  value: number | undefined,
  baseline: RunnerBaseline | undefined,
  unit: string,
): ScoredSignal {
  if (value == null) {
    return { key, label, unit, status: 'missing', explanation: 'No verified reading available today.' };
  }
  if (!baseline || baseline.sampleCount < 3) {
    const stage = baselineStage(baseline?.sampleCount ?? 0);
    return {
      key, label, value, unit, status: 'missing',
      explanation: `${STAGE_LABEL[stage]} · ${baseline?.sampleCount ?? 0} verified days so far`,
    };
  }

  const deviationPct = ((value - baseline.mean) / baseline.mean) * 100;
  const positiveIsHigher = key === 'sleep' || key === 'hrv';
  const beneficialDeviation = positiveIsHigher ? deviationPct : -deviationPct;
  const score = clamp(75 + beneficialDeviation * 2.2);
  const status = beneficialDeviation >= -5 ? (beneficialDeviation >= 5 ? 'positive' : 'normal') : 'watch';
  return {
    key,
    label,
    value: +value.toFixed(1),
    unit,
    score: Math.round(score),
    deviationPct: +deviationPct.toFixed(1),
    status,
    explanation: `${value.toFixed(key === 'sleep' ? 0 : 1)}${unit} today · your normal ${baseline.lower}–${baseline.upper}${unit}`,
  };
}

function purposeRpe(run: Run): number {
  const values: Record<string, number> = {
    walk: 2, recovery: 3, easy: 4, long: 6, tempo: 7, speed: 8, race: 9,
  };
  return values[run.purpose ?? ''] ?? 5;
}

function calculateTrainingLoad(runs: Run[], today: string) {
  const inDays = (days: number) => runs.filter(run => ageDays(today, run.date) <= days);
  const load = (run: Run) => {
    const minutes = run.durationMinutes ?? run.distanceKm * 6;
    const hrModifier = run.avgHr && run.maxHr && run.maxHr > run.avgHr
      ? clamp(run.avgHr / run.maxHr, 0.55, 0.95)
      : purposeRpe(run) / 10;
    return minutes * (0.55 * purposeRpe(run) / 10 + 0.45 * hrModifier);
  };
  const acute = inDays(7).reduce((sum, run) => sum + load(run), 0);
  const chronic = inDays(28).reduce((sum, run) => sum + load(run), 0) / 4;
  const ratio = chronic > 10 ? acute / chronic : 1;
  const hardRuns = inDays(7).filter(run => purposeRpe(run) >= 7).length;
  const elevation = inDays(7).reduce((sum, run) => sum + (run.biomechanics?.elevationGainM ?? 0), 0);
  const distance = inDays(7).reduce((sum, run) => sum + run.distanceKm, 0);
  return {
    cardiovascular: Math.round(clamp(42 + (ratio - 1) * 34 + hardRuns * 9)),
    musculoskeletal: Math.round(clamp(30 + (ratio - 1) * 30 + distance * 0.65 + elevation / 120)),
    ratio,
    hardRuns,
    distance,
    elevation,
  };
}

function estimateLegLoad(load: ReturnType<typeof calculateTrainingLoad>, runs: Run[], today: string): EstimatedLegLoad {
  const recent = runs.filter(run => ageDays(today, run.date) <= 7);
  const trailKm = recent.filter(run => run.terrain === 'trail').reduce((sum, run) => sum + run.distanceKm, 0);
  const speedKm = recent.filter(run => ['speed', 'tempo', 'race'].includes(run.purpose ?? '')).reduce((sum, run) => sum + run.distanceKm, 0);
  const lowCadence = recent.some(run => (run.biomechanics?.cadence ?? 180) < 165);
  return {
    calves: Math.round(clamp(load.musculoskeletal + speedKm * 1.2)),
    achilles: Math.round(clamp(load.musculoskeletal * 0.72 + speedKm * 1.5)),
    quads: Math.round(clamp(load.musculoskeletal * 0.82 + load.elevation / 55 + trailKm)),
    feet: Math.round(clamp(load.musculoskeletal * 0.78 + trailKm * 1.3 + (lowCadence ? 7 : 0))),
  };
}

function level(confidence: number): ConfidenceLevel {
  if (confidence < 0.34) return 'learning';
  if (confidence < 0.55) return 'low';
  if (confidence < 0.8) return 'moderate';
  return 'high';
}

const SOURCE_LABEL: Record<string, string> = {
  strava: 'Strava',
  manual: 'Manual logging',
  apple_health: 'Apple Health',
  garmin: 'Garmin',
};

/** TRAINING DATA branch — works from Run[] alone, always populated. */
function buildTrainingSummary(runs: Run[], today: string): TrainingSummary {
  const sorted = [...runs].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];
  const recent = runs.filter(run => ageDays(today, run.date) <= 7);
  const sourceCounts = new Map<string, number>();
  for (const run of runs) {
    const src = run.source ?? 'manual';
    sourceCounts.set(src, (sourceCounts.get(src) ?? 0) + 1);
  }
  const topSource = [...sourceCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    connected: runs.length > 0,
    sourceLabel: topSource ? (SOURCE_LABEL[topSource] ?? 'Connected') : null,
    lastRun: latest ? {
      distanceKm: +latest.distanceKm.toFixed(1),
      paceSecPerKm: latest.durationMinutes && latest.distanceKm
        ? Math.round((latest.durationMinutes * 60) / latest.distanceKm)
        : undefined,
      avgHr: latest.avgHr,
      date: latest.date,
    } : undefined,
    runsLast7Days: recent.length,
    kmLast7Days: +recent.reduce((sum, run) => sum + run.distanceKm, 0).toFixed(1),
  };
}

export function calculateBodyState(
  biometrics: DailyBiometrics[],
  runs: Run[],
  today = new Date().toISOString(),
): BodyState {
  const todayData = biometrics.find(day => dateKey(day.date) === dateKey(today));
  const baselines = {
    sleep: buildBaseline(biometrics, 'sleep', today),
    hrv: buildBaseline(biometrics, 'hrv', today),
    resting_hr: buildBaseline(biometrics, 'resting_hr', today),
    respiration: buildBaseline(biometrics, 'respiration', today),
  };
  const signals = [
    signalScore('sleep', 'SLEEP', todayData?.sleep?.durationMinutes, baselines.sleep, ' min'),
    signalScore('hrv', 'HRV', todayData?.cardiovascular?.hrvMs, baselines.hrv, ' ms'),
    signalScore('resting_hr', 'RESTING HR', todayData?.cardiovascular?.restingHr, baselines.resting_hr, ' bpm'),
    signalScore('respiration', 'RESPIRATION', todayData?.cardiovascular?.respiratoryRate, baselines.respiration, '/min'),
  ];
  const scored = signals.filter(signal => signal.score != null);
  const baselineConfidence = mean(Object.values(baselines).filter(Boolean).map(item => item!.confidence));
  const coverage = scored.length / signals.length;
  const confidence = clamp(baselineConfidence * 0.65 + coverage * 0.35, 0, 1);
  const recovery = confidence >= 0.34 && scored.length >= 2
    ? Math.round(mean(scored.map(signal => signal.score!)))
    : undefined;
  const sleepSignal = signals[0];
  const sleep = sleepSignal?.score != null && (baselines.sleep?.sampleCount ?? 0) >= 3
    ? sleepSignal.score
    : undefined;
  const recoveryDataConnected = biometrics.some(day => day.sources.length > 0);
  const trainingSummary = buildTrainingSummary(runs, today);

  const training = calculateTrainingLoad(runs, today);
  const overallLoad = Math.round(training.cardiovascular * 0.45 + training.musculoskeletal * 0.55);
  const recoveryForPlanning = recovery ?? 68;
  const hardPenalty = training.hardRuns * 6;
  const readiness = {
    easy: Math.round(clamp(recoveryForPlanning * 0.65 + (100 - overallLoad) * 0.35 + 15)),
    long: Math.round(clamp(recoveryForPlanning * 0.6 + (100 - training.musculoskeletal) * 0.4 - 4)),
    speed: Math.round(clamp(recoveryForPlanning * 0.55 + (100 - overallLoad) * 0.45 - hardPenalty)),
    hills: Math.round(clamp(recoveryForPlanning * 0.5 + (100 - training.musculoskeletal) * 0.5 - training.elevation / 80)),
  };

  const bestHard = Math.max(readiness.speed, readiness.hills);
  const recommendation = recovery != null && recovery < 45 || readiness.easy < 50
    ? {
        intent: 'rest' as const,
        distanceKm: [0, 3] as [number, number],
        headline: 'REST OR WALK',
        reason: 'Your verified recovery and recent load do not support another run today.',
      }
    : bestHard >= 78 && training.hardRuns < 2
      ? {
          intent: 'tempo' as const,
          distanceKm: [5, 9] as [number, number],
          headline: 'TEMPO READY',
          reason: 'Recovery and accumulated load leave room for controlled quality work.',
        }
      : {
          intent: 'easy' as const,
          distanceKm: [5, 8] as [number, number],
          headline: 'EASY / STEADY',
          reason: recovery == null
            ? recoveryDataConnected
              ? 'Recovery is still learning your normal range, so the conservative choice is an aerobic run.'
              : 'Training load alone supports an aerobic run — connect a recovery source to fine-tune this.'
            : 'Easy running best matches today’s recovery and leg-load signals.',
        };

  const baselineDays = Math.max(0, ...Object.values(baselines).map(item => item?.sampleCount ?? 0));

  return {
    date: dateKey(today),
    recovery,
    sleep,
    cardiovascularLoad: training.cardiovascular,
    musculoskeletalLoad: training.musculoskeletal,
    overallLoad,
    readiness,
    legLoad: estimateLegLoad(training, runs, today),
    confidence,
    confidenceLevel: level(confidence),
    baselineStage: baselineStage(baselineDays),
    baselineDays,
    recoveryDataConnected,
    signals,
    training: trainingSummary,
    recommendation,
    disclaimer: 'Estimated readiness and tissue load are training guidance, not medical measurements or a diagnosis.',
  };
}
