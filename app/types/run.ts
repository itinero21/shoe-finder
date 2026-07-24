import { Coordinate } from './territory';

export type RunTerrain = 'road' | 'trail' | 'track' | 'treadmill';
export type RunPurpose = 'easy' | 'tempo' | 'long' | 'race' | 'recovery' | 'speed' | 'walk';
export type MatchQuality = 'perfect' | 'good' | 'neutral' | 'poor' | 'abuse';
export type RunSource = 'manual' | 'strava' | 'apple_health' | 'garmin';

/** Learning Engine — optional one-tap issue reports after a run */
export type RunIssue =
  | 'pain'
  | 'hot_spots'
  | 'blisters'
  | 'too_soft'
  | 'too_firm'
  | 'heel_slip'
  | 'toe_pressure';

export type Run = {
  id: string;
  shoeId: string;
  distanceKm: number;
  date: string;
  notes?: string;
  feel?: 1 | 2 | 3; // legacy 3-point scale, kept for old runs
  // Learning Engine (v3): 5-point shoe feel + optional issues
  feel5?: 1 | 2 | 3 | 4 | 5; // 1 = awful, 5 = perfect
  issues?: RunIssue[];
  // v2 fields
  terrain?: RunTerrain;
  purpose?: RunPurpose;
  durationMinutes?: number;
  match_quality?: MatchQuality;
  source?: RunSource;
  external_id?: string;         // Strava activity ID etc
  external_ids?: string[];      // merged provider IDs for one physical run
  strava_gear_id?: string;      // Strava gear (shoe) ID linked to this run
  coordinates?: Coordinate[];   // GPS trace from live/Strava/Garmin runs
  avgHr?: number;
  maxHr?: number;
  biomechanics?: {
    cadence?: number;
    strideLengthM?: number;
    groundContactTimeMs?: number;
    verticalOscillationCm?: number;
    powerWatts?: number;
    elevationGainM?: number;
    temperatureC?: number;
  };
};

export type ShoeStats = {
  shoeId: string;
  totalMileage: number;
  runCount: number;
  avgDistance: number;
  lastRunDate?: string;
  averageFeel?: number;
};
