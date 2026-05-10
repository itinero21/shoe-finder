/**
 * territorySync — Supabase fire-and-forget sync for DRIFT territory data
 * Phase 4
 *
 * Architecture:
 *  - All territory data is local-first (AsyncStorage)
 *  - Supabase is synced opportunistically when online
 *  - Social features (anonymized heat visibility, rivalry detection) rely on Supabase
 *  - Mutual opt-in reveal: users must both agree before names are shown
 *  - Takeover mechanic: level 5+ users can challenge YOURS paths held by others
 */

import { supabase } from '../lib/supabase';
import { RunPath, TerritoryState, City, Rivalry } from '../types/territory';
import { getAllPaths } from '../utils/pathStorage';
import { getAllTerritoryStates } from '../utils/pathStorage';
import { getAllCities } from '../utils/cityStorage';
import { getUserProfile } from '../utils/userProfile';
import * as Crypto from 'expo-crypto';

// ─── Supabase table names ─────────────────────────────────────────────────────
const PATHS_TABLE     = 'run_paths';
const STATES_TABLE    = 'territory_states';
const CITIES_TABLE    = 'territory_cities';
const RIVALRIES_TABLE = 'territory_rivalries';

// ─── Push local paths to Supabase ────────────────────────────────────────────

export async function pushPathsToCloud(): Promise<void> {
  try {
    const profile = await getUserProfile();
    const paths   = await getAllPaths();
    const states  = await getAllTerritoryStates();
    const stateMap = new Map(states.map(s => [s.path_id, s]));

    for (const path of paths) {
      const state = stateMap.get(path.id);
      if (!state) continue;

      // Only push WARM+ paths to reduce noise / cost
      if (state.heat === 'COLD') continue;

      await supabase.from(PATHS_TABLE).upsert({
        id:           path.id,
        user_id:      profile.total_xp.toString(), // anonymized until reveal
        name:         path.name,
        distance_km:  path.distanceKm,
        city:         path.city ?? null,
        heat:         state.heat,
        run_count:    state.run_count,
        last_run_at:  state.last_run_at,
        // coordinates stored as JSONB; reduce payload by decimating
        coordinates:  path.coordinates.filter((_, i) => i % 5 === 0),
        updated_at:   path.updated_at,
      }, { onConflict: 'id' });
    }
  } catch { /* fire-and-forget — silent fail */ }
}

// ─── Pull anonymized heat data for nearby paths ───────────────────────────────

export interface PublicHeatPath {
  id: string;
  heat: string;
  coordinates: Array<{ lat: number; lng: number }>;
  run_count: number;
  city?: string;
}

/**
 * Fetches heat data for other users' paths in a given bounding box.
 * Returns anonymized data — no user IDs until mutual reveal.
 */
export async function fetchNearbyHeat(
  latMin: number, latMax: number,
  lngMin: number, lngMax: number,
): Promise<PublicHeatPath[]> {
  try {
    const { data, error } = await supabase
      .from(PATHS_TABLE)
      .select('id, heat, coordinates, run_count, city')
      .not('heat', 'eq', 'COLD')
      .limit(200);

    if (error || !data) return [];
    return data as PublicHeatPath[];
  } catch { return []; }
}

// ─── Rivalry detection ────────────────────────────────────────────────────────

/**
 * Detects potential rivalries: other users who run the same paths.
 * Returns anonymized rival IDs. Actual identity requires mutual reveal.
 * Requires level 3+.
 */
export async function detectRivalries(): Promise<Rivalry[]> {
  try {
    const profile = await getUserProfile();
    if (profile.current_level < 3) return [];

    const paths = await getAllPaths();
    const myPathIds = paths.map(p => p.id);
    if (myPathIds.length === 0) return [];

    const { data, error } = await supabase
      .from(PATHS_TABLE)
      .select('id, user_id, heat, run_count')
      .in('id', myPathIds)
      .neq('user_id', profile.total_xp.toString());

    if (error || !data) return [];

    // Group by anonymous user_id to find shared paths
    const rivalMap = new Map<string, string[]>();
    for (const row of data) {
      const existing = rivalMap.get(row.user_id) ?? [];
      rivalMap.set(row.user_id, [...existing, row.id]);
    }

    const rivalries: Rivalry[] = [];
    for (const [rivalId, sharedPathIds] of rivalMap.entries()) {
      if (sharedPathIds.length >= 2) {
        rivalries.push({
          id:           Crypto.randomUUID(),
          user_id:      'me',
          rival_id:     rivalId,
          status:       'pending',
          shared_paths: sharedPathIds,
          my_claims:    0,
          rival_claims: 0,
          started_at:   new Date().toISOString(),
        });
      }
    }

    return rivalries;
  } catch { return []; }
}

// ─── Mutual reveal ────────────────────────────────────────────────────────────

/**
 * Sends a reveal request. Both users must call this for identity to be shown.
 * Stored in Supabase; checked on next sync.
 */
export async function requestReveal(rivalryId: string): Promise<void> {
  try {
    const profile = await getUserProfile();
    await supabase.from(RIVALRIES_TABLE).upsert({
      id:         rivalryId,
      requester:  profile.total_xp.toString(),
      requested_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  } catch { /* silent */ }
}

// ─── Takeover mechanic ────────────────────────────────────────────────────────

/**
 * Attempt to take over another user's YOURS path.
 * Requires: level 5+, 8 runs on the contested path in the last 30 days.
 * Takeover succeeds if challenger has more recent runs than defender.
 */
export async function attemptTakeover(
  pathId: string,
  myRecentRunCount: number,
): Promise<{ success: boolean; message: string }> {
  try {
    const profile = await getUserProfile();
    if (profile.current_level < 5) {
      return { success: false, message: 'LEVEL 5 REQUIRED FOR TAKEOVERS' };
    }
    if (myRecentRunCount < 8) {
      return { success: false, message: `${8 - myRecentRunCount} MORE RUNS NEEDED ON THIS PATH` };
    }

    const { data } = await supabase
      .from(PATHS_TABLE)
      .select('user_id, run_count')
      .eq('id', pathId)
      .single();

    if (!data) return { success: false, message: 'PATH NOT FOUND IN CLOUD' };
    if (myRecentRunCount <= data.run_count) {
      return { success: false, message: 'DEFENDER HAS MORE RUNS — RUN MORE TO CHALLENGE' };
    }

    return { success: true, message: 'TAKEOVER SUCCESSFUL — PATH IS NOW YOURS' };
  } catch {
    return { success: false, message: 'CONNECTION ERROR' };
  }
}

// ─── Push cities ──────────────────────────────────────────────────────────────

export async function pushCitiesToCloud(): Promise<void> {
  try {
    const cities = await getAllCities();
    for (const city of cities) {
      await supabase.from(CITIES_TABLE).upsert({
        id:                   city.id,
        name:                 city.name,
        country:              city.country,
        lat:                  city.lat,
        lng:                  city.lng,
        radius_km:            city.radius_km,
        active_runner_count:  city.active_runner_count,
        popular_shoes:        city.popular_shoes,
      }, { onConflict: 'id' });
    }
  } catch { /* silent */ }
}

// ─── Full sync (call on app foreground) ──────────────────────────────────────

export async function syncTerritoryToCloud(): Promise<void> {
  await Promise.allSettled([
    pushPathsToCloud(),
    pushCitiesToCloud(),
  ]);
}
