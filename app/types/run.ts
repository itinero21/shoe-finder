export type RunTerrain = 'road' | 'trail' | 'track' | 'treadmill';
export type RunPurpose = 'easy' | 'tempo' | 'long' | 'race' | 'recovery' | 'speed' | 'walk';
export type MatchQuality = 'perfect' | 'good' | 'neutral' | 'poor' | 'abuse';
export type RunSource = 'manual' | 'strava' | 'apple_health' | 'garmin';

export type Run = {
  id: string;
  shoeId: string;
  distanceKm: number;
  date: string;
  notes?: string;
  feel?: 1 | 2 | 3; // 1 = dead, 2 = okay, 3 = fresh
  // v2 fields
  terrain?: RunTerrain;
  purpose?: RunPurpose;
  durationMinutes?: number;
  match_quality?: MatchQuality;
  xp_earned?: number;
  source?: RunSource;
  route_hash?: string; // for exploration tracking
  external_id?: string; // Strava activity ID etc
};

export type ShoeStats = {
  shoeId: string;
  totalMileage: number;
  runCount: number;
  avgDistance: number;
  lastRunDate?: string;
  averageFeel?: number;
};
