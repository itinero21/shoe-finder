import { RunPurpose, RunSource } from '../types/run';

export type BiometricSource = 'apple_health' | 'garmin' | 'strava' | 'manual';
export type ConfidenceLevel = 'learning' | 'low' | 'moderate' | 'high';

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
  baselineDays: number;
  signals: ScoredSignal[];
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
