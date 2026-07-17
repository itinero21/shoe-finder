/**
 * STRIDE INTELLIGENCE ENGINE v2.1 — Types
 *
 * Ported from Trial/stride-intelligence-v2 and strengthened.
 * Universal decision engine: which owned shoe today, how healthy is each
 * shoe, and what should replace a dying one.
 *
 * v2.1 additions over the drop:
 *   - OwnedShoe.recoveryPct — foam decompression state feeds the decision
 *   - PlannedRun.raceImportance drives race-shoe protection logic
 */

export type Surface = 'road' | 'track' | 'treadmill' | 'groomed_trail' | 'technical_trail' | 'mixed';
export type RunIntent = 'recovery' | 'easy' | 'long' | 'steady' | 'tempo' | 'intervals' | 'race' | 'walk';
export type PainArea = 'foot' | 'heel_arch' | 'achilles_calf' | 'shin' | 'knee' | 'it_band_hip' | 'back' | 'other';
export type Width = 'narrow' | 'standard' | 'wide' | 'extra_wide';
export type PlateType = 'none' | 'nylon' | 'composite' | 'carbon';
export type StabilityClass = 'neutral' | 'stable_neutral' | 'stability' | 'motion_control';
export type ShoeRole = 'recovery' | 'daily' | 'long_run' | 'tempo' | 'race' | 'trail' | 'walking';
export type LifecycleState = 'healthy' | 'monitor' | 'retire_soon' | 'walking_only' | 'retire_now';

export interface ShoeMechanics {
  dropMm: number;
  heelStackMm?: number;
  forefootStackMm?: number;
  cushioning: number;            // 0-100
  softness: number;              // 0-100 (100 = plush)
  energyReturn: number;          // 0-100
  rocker: number;                // 0-100
  longitudinalStiffness: number; // 0-100
  torsionalStability: number;    // 0-100
  heelCounter: number;           // 0-100
  platformWidth: number;         // 0-100
  toeBoxVolume: number;          // 0-100
  outsoleGrip: number;           // 0-100
  wetGrip?: number;
  lugDepthMm?: number;
  plate: PlateType;
  stabilityClass: StabilityClass;
  massGrams?: number;
}

export interface ShoeProfile {
  id: string;
  brand: string;
  model: string;
  version?: string;
  roles: ShoeRole[];
  surfaces: Surface[];
  widths: Width[];
  mechanics: ShoeMechanics;
  durabilityBaselineKm: number;
  price?: number;
  currency?: string;
  dataConfidence: number;        // 0-1
  familyId?: string;
  successorIds?: string[];
  sourceTags?: string[];
}

export interface OwnedShoe {
  id: string;
  profileId: string;
  nickname?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  distanceKm: number;
  walkingKm?: number;
  runs: number;
  lastUsedAt?: string;
  retiredAt?: string;
  manualCondition?: 1 | 2 | 3 | 4 | 5;
  /** v2.1: foam decompression recovery, 0-100. <100 = still compressed from the last run. */
  recoveryPct?: number;
}

export interface PainReport {
  area: PainArea;
  severity: number;              // 0-10
  timing: 'during' | 'after' | 'next_day';
  notes?: string;
}

export interface RunRecord {
  id: string;
  occurredAt: string;
  distanceKm: number;
  durationMinutes?: number;
  effortRpe: number;             // 1-10
  surface: Surface;
  intent?: RunIntent;
  shoeId?: string;
  elevationGainM?: number;
  temperatureC?: number;
  rain?: boolean;
  comfort?: 1 | 2 | 3 | 4 | 5;
  pain?: PainReport[];
}

export interface RunnerPreferences {
  softness?: number;
  dropMm?: number;
  rocker?: number;
  stiffness?: number;
  toeBoxVolume?: number;
  platformWidth?: number;
  weightSensitivity?: number;
}

export interface RunnerProfile {
  id: string;
  experience: 'new' | 'recreational' | 'trained' | 'competitive';
  bodyMassKg?: number;
  averageWeeklyKm: number;
  preferredWidth?: Width;
  orthotics?: boolean;
  currentPain: Partial<Record<PainArea, number>>;
  recentInjuryAreas: PainArea[];
  comfortPriority: number;       // 0-100
  preferences: RunnerPreferences;
}

export interface PlannedRun {
  date: string;
  intent: RunIntent;
  distanceKm: number;
  surface: Surface;
  elevationGainM?: number;
  weather: ('dry' | 'rain' | 'snow' | 'ice' | 'hot' | 'cold' | 'humid' | 'windy')[];
  raceImportance?: 'none' | 'low' | 'important' | 'goal_race';
}

export interface EngineInput {
  runner: RunnerProfile;
  plannedRun: PlannedRun;
  recentRuns: RunRecord[];
  ownedShoes: OwnedShoe[];
  catalog: ShoeProfile[];
  today?: string;
}

export interface LoadState {
  acuteKm7d: number;
  chronicWeeklyKm: number;
  acuteChronicRatio?: number;
  hardRuns7d: number;
  consecutiveDays: number;
  fatigue: number;               // 0-100
  painFlag: boolean;
}

export interface PersonalEvidence {
  sampleSize: number;
  comfortMean?: number;
  painRate: number;
  completionRate: number;
  confidence: number;            // 0-100
}

export interface LifecycleAssessment {
  state: LifecycleState;
  health: number;                // 0-100
  remainingKm: [number, number];
  reasons: string[];
  costPerKm?: number;
}

export interface ScoreComponent {
  key: string;
  score: number;
  explanation: string;
}

export interface ShoeDecision {
  shoeId: string;
  profileId: string;
  allowed: boolean;
  score: number;                 // 0-100
  readiness: number;             // 0-100, fatigue-adjusted
  confidence: number;            // 0-100
  health: number;
  remainingKm: [number, number];
  components: ScoreComponent[];
  reasons: string[];
  cautions: string[];
}

export interface DailyRecommendation {
  recommended?: ShoeDecision;
  alternatives: ShoeDecision[];
  avoid: ShoeDecision[];
  load: LoadState;
  message: string;
  safetyNotice?: string;
}

export interface ReplacementRecommendation {
  profileId: string;
  score: number;
  confidence: number;
  reasons: string[];
  tradeoffs: string[];
}

export interface PainPattern {
  area: PainArea;
  support: number;
  shoeIds: string[];
  minDistanceKm?: number;
  firmnessBand?: [number, number];
  statement: string;
  confidence: number;
}

export interface ShoePersonality {
  key: 'workhorse' | 'racer' | 'rain_warrior' | 'survivor' | 'comeback_shoe' | 'trusted_companion';
  label: string;
  reason: string;
}
