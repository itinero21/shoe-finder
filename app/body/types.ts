import { RunPurpose, RunSource } from '../types/run';

/**
 * Recovery-data sources only. Strava is deliberately excluded here — Strava's
 * API policy (2026) prohibits using Strava data to power AI/analytics
 * features or combining it with other customer data for that purpose, and
 * Strava's activity API does not expose overnight physiology (sleep, HRV,
 * resting HR) in the first place. Strava stays a pure TRAINING DATA source
 * (see ActivityIdentity / Run) and never reaches the recovery engine below.
 */
export type BiometricSource = 'apple_health' | 'health_connect' | 'garmin' | 'coros' | 'manual';
export type ConfidenceLevel = 'learning' | 'low' | 'moderate' | 'high';
export type BaselineStage = 'learning' | 'early' | 'improving' | 'established';

export interface DailyBiometrics {
  date: string;
  sleep?: {
    durationMinutes?: number;
    awakeMinutes?: number;
    deepMinutes?: number;
    remMinutes?: number;
    coreMinutes?: number;
    bedtime?: string;
    wakeTime?: string;
  };
  cardiovascular?: {
    restingHr?: number;
    hrvMs?: number;
    respiratoryRate?: number;
    spo2?: number;
  };
  activity?: {
    steps?: number;
    activeCalories?: number;
    intensityMinutes?: number;
  };
  recovery?: {
    sourceRecoveryScore?: number;
    sourceStressScore?: number;
    sourceBodyBattery?: number;
  };
  sources: BiometricSource[];
  observedAt?: string;
}

export interface RunningBiomechanics {
  cadence?: number;
  strideLengthM?: number;
  groundContactTimeMs?: number;
  verticalOscillationCm?: number;
  powerWatts?: number;
  paceSecondsPerKm?: number;
  avgHr?: number;
  maxHr?: number;
  elevationGainM?: number;
}

export interface RunnerBaseline {
  key: 'sleep' | 'hrv' | 'resting_hr' | 'respiration';
  mean: number;
  lower: number;
  upper: number;
  sampleCount: number;
  confidence: number;
}

export interface ScoredSignal {
  key: string;
  label: string;
  value?: number;
  unit?: string;
  score?: number;
  deviationPct?: number;
  status: 'normal' | 'positive' | 'watch' | 'missing';
  explanation: string;
}

export interface ReadinessScores {
  easy: number;
  long: number;
  speed: number;
  hills: number;
}

export interface EstimatedLegLoad {
  calves: number;
  achilles: number;
  quads: number;
  feet: number;
}

/**
 * TRAINING DATA — the branch of the engine that works from Run[] alone.
 * Populated for every runner regardless of whether a recovery data source
 * (Apple Health, Garmin direct, COROS direct, Health Connect) is connected.
 * A Strava-only connection is enough to fill this in completely.
 */
export interface TrainingSummary {
  connected: boolean;
  sourceLabel: string | null;
  lastRun?: {
    distanceKm: number;
    paceSecPerKm?: number;
    avgHr?: number;
    date: string;
  };
  runsLast7Days: number;
  kmLast7Days: number;
}

export interface BodyState {
  date: string;
  recovery?: number;
  sleep?: number;
  cardiovascularLoad: number;
  musculoskeletalLoad: number;
  overallLoad: number;
  readiness: ReadinessScores;
  legLoad: EstimatedLegLoad;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  /** Progressive baseline maturity — replaces a hard "7 days" cutoff. */
  baselineStage: BaselineStage;
  baselineDays: number;
  /** True once at least one recovery data source has ever supplied a reading. */
  recoveryDataConnected: boolean;
  signals: ScoredSignal[];
  training: TrainingSummary;
  recommendation: {
    intent: RunPurpose | 'rest';
    distanceKm: [number, number];
    headline: string;
    reason: string;
  };
  disclaimer: string;
}

export interface ActivityIdentity {
  source: RunSource;
  externalId?: string;
  startTime: string;
  durationMinutes?: number;
  distanceKm: number;
}
