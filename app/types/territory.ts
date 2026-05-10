/**
 * DRIFT Territory System — core types
 * Phases 1–6
 */

export type Coordinate = {
  lat: number;
  lng: number;
  timestamp?: number; // ms epoch
};

/** Heat levels a path can hold */
export type HeatLevel = 'COLD' | 'WARM' | 'HOT' | 'YOURS' | 'LEGENDARY';

/** Heat numeric weights for comparison */
export const HEAT_RANK: Record<HeatLevel, number> = {
  COLD: 0,
  WARM: 1,
  HOT: 2,
  YOURS: 3,
  LEGENDARY: 4,
};

/** Accent colors per heat state */
export const HEAT_COLOR: Record<HeatLevel, string> = {
  COLD:      '#4FC3F7', // icy blue
  WARM:      '#FFB74D', // amber
  HOT:       '#FF7043', // deep orange
  YOURS:     '#FF3D00', // stride red
  LEGENDARY: '#FFD700', // gold
};

/** A detected path (GPS trace, de-duplicated) */
export type RunPath = {
  id: string;              // UUID
  name: string;            // auto-named or user-renamed
  coordinates: Coordinate[];
  distanceKm: number;
  city?: string;           // reverse-geocoded city name
  created_at: string;      // ISO
  updated_at: string;      // ISO
};

/** Per-path territory state for this user */
export type TerritoryState = {
  path_id: string;
  heat: HeatLevel;
  run_count: number;       // total times this path was run
  last_run_at: string;     // ISO date — for decay calc
  claimed_at?: string;     // ISO — when YOURS was first reached
  legendary_at?: string;   // ISO — when LEGENDARY was reached
  xp_total: number;        // XP earned on this path lifetime
};

/** City record */
export type City = {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  radius_km: number;       // boundary radius
  active_runner_count: number;
  popular_shoes: string[]; // shoe model names
  host_user_id?: string;   // level 8+ only
  created_at: string;
};

/** Anonymous rivalry between two users */
export type RivalryStatus = 'pending' | 'active' | 'revealed' | 'dissolved';

export type Rivalry = {
  id: string;
  user_id: string;
  rival_id: string;         // anonymized locally until revealed
  status: RivalryStatus;
  shared_paths: string[];   // path IDs both users have run
  my_claims: number;        // paths I own vs rival
  rival_claims: number;
  started_at: string;
  revealed_at?: string;
};

/** Heat state transition thresholds */
export const HEAT_THRESHOLDS = {
  WARM:      2,   // 2 runs → WARM
  HOT:       5,   // 5 runs → HOT
  YOURS:     10,  // 10 runs → YOURS
  LEGENDARY: 25,  // 25 runs → LEGENDARY
};

/** Decay rules — days since last run before dropping one level */
export const HEAT_DECAY_DAYS: Record<HeatLevel, number | null> = {
  COLD:      null,  // floor — can't decay further
  WARM:      14,    // 14 days idle → COLD
  HOT:       21,    // 21 days idle → WARM
  YOURS:     30,    // 30 days idle → HOT
  LEGENDARY: null,  // LEGENDARY never decays
};

/** XP earned when heat level is upgraded */
export const HEAT_XP_GAIN: Record<HeatLevel, number> = {
  COLD:      5,
  WARM:      15,
  HOT:       30,
  YOURS:     75,
  LEGENDARY: 200,
};
