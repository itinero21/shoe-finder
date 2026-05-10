/**
 * driftEngine — DRIFT territory heat state machine
 * Phase 2
 *
 * Called after every run (manual or Strava sync) that has GPS coordinates.
 * Handles: path detection, heat upgrades, decay, XP award.
 */

import * as Crypto from 'expo-crypto';
import {
  Coordinate,
  HeatLevel,
  RunPath,
  TerritoryState,
  HEAT_THRESHOLDS,
  HEAT_DECAY_DAYS,
  HEAT_XP_GAIN,
} from '../types/territory';
import { Run } from '../types/run';
import { getAllPaths, savePath, getAllTerritoryStates, saveTerritoryState, getTerritoryState } from './pathStorage';
import { matchPath, autoNamePath, pathDistanceKm } from './pathDetection';
import { addXP, getUserProfile, saveUserProfile } from './userProfile';
import { saveRun } from './runStorage';
import { findCitiesForCoordinate } from './cityStorage';

// ─── Heat state machine ───────────────────────────────────────────────────────

function heatForRunCount(count: number): HeatLevel {
  if (count >= HEAT_THRESHOLDS.LEGENDARY) return 'LEGENDARY';
  if (count >= HEAT_THRESHOLDS.YOURS)     return 'YOURS';
  if (count >= HEAT_THRESHOLDS.HOT)       return 'HOT';
  if (count >= HEAT_THRESHOLDS.WARM)      return 'WARM';
  return 'COLD';
}

function applyDecay(state: TerritoryState): TerritoryState {
  if (state.heat === 'COLD' || state.heat === 'LEGENDARY') return state;

  const decayDays = HEAT_DECAY_DAYS[state.heat];
  if (decayDays === null) return state;

  const daysSince = (Date.now() - new Date(state.last_run_at).getTime()) / 86400000;
  if (daysSince < decayDays) return state;

  // Drop one heat level
  const order: HeatLevel[] = ['COLD', 'WARM', 'HOT', 'YOURS', 'LEGENDARY'];
  const currentIdx = order.indexOf(state.heat);
  const newHeat = order[Math.max(0, currentIdx - 1)];
  return { ...state, heat: newHeat };
}

// ─── Main entry point ────────────────────────────────────────────────────────

export interface DriftResult {
  path_id: string;
  path_name: string;
  previous_heat: HeatLevel;
  new_heat: HeatLevel;
  upgraded: boolean;
  xp_awarded: number;
  is_new_path: boolean;
}

/**
 * Called after a run with GPS coordinates.
 * Detects or creates a matching RunPath, updates TerritoryState, awards XP.
 */
export async function updateTerritoryAfterRun(run: Run): Promise<DriftResult | null> {
  if (!run.coordinates || run.coordinates.length < 5) return null;

  const existingPaths = await getAllPaths();
  let matchedPath: RunPath | null = null;
  let isNewPath = false;

  // Try to match against existing paths
  for (const path of existingPaths) {
    const result = matchPath(run.coordinates, path.coordinates);
    if (result.matched) {
      matchedPath = path;
      break;
    }
  }

  const now = new Date().toISOString();

  // Create new path if no match found
  if (!matchedPath) {
    isNewPath = true;
    matchedPath = {
      id: Crypto.randomUUID(),
      name: autoNamePath(run.coordinates),
      coordinates: run.coordinates,
      distanceKm: pathDistanceKm(run.coordinates),
      created_at: now,
      updated_at: now,
    };

    // Try to attach a city
    const startCoord = run.coordinates[0];
    const nearCities = await findCitiesForCoordinate(startCoord.lat, startCoord.lng);
    if (nearCities.length > 0) matchedPath.city = nearCities[0].name;

    await savePath(matchedPath);
  }

  // Load existing territory state (or create default)
  let state = await getTerritoryState(matchedPath.id);
  const previousHeat: HeatLevel = state?.heat ?? 'COLD';

  if (!state) {
    state = {
      path_id: matchedPath.id,
      heat: 'COLD',
      run_count: 0,
      last_run_at: now,
      xp_total: 0,
    };
  }

  // Apply decay before counting this run
  state = applyDecay(state);

  // Increment run count and update last run date
  state.run_count += 1;
  state.last_run_at = run.date ?? now;

  // Determine new heat
  const newHeat = heatForRunCount(state.run_count);
  const upgraded = newHeat !== previousHeat;

  let xpAwarded = 5; // base XP for any territory run
  if (upgraded) {
    xpAwarded += HEAT_XP_GAIN[newHeat];
    state.heat = newHeat;
    if (newHeat === 'YOURS' && !state.claimed_at)   state.claimed_at   = now;
    if (newHeat === 'LEGENDARY' && !state.legendary_at) state.legendary_at = now;
  }

  state.xp_total += xpAwarded;
  await saveTerritoryState(state);

  // Award XP to user
  await addXP(xpAwarded);

  // Link run to path
  run.path_id = matchedPath.id;
  await saveRun(run);

  // Update user territory stats
  const profile = await getUserProfile();
  if (isNewPath) profile.territory.total_paths += 1;
  profile.territory.legendary_count = (await getAllTerritoryStates()).filter(s => s.heat === 'LEGENDARY').length;
  profile.territory.yours_count     = (await getAllTerritoryStates()).filter(s => s.heat === 'YOURS').length;
  profile.territory.hot_count       = (await getAllTerritoryStates()).filter(s => s.heat === 'HOT').length;
  profile.territory.warm_count      = (await getAllTerritoryStates()).filter(s => s.heat === 'WARM').length;
  await saveUserProfile(profile);

  return {
    path_id:       matchedPath.id,
    path_name:     matchedPath.name,
    previous_heat: previousHeat,
    new_heat:      newHeat,
    upgraded,
    xp_awarded:    xpAwarded,
    is_new_path:   isNewPath,
  };
}

/**
 * Run decay check on all territory states.
 * Call this once on app launch.
 */
export async function runDecayCheck(): Promise<void> {
  const states = await getAllTerritoryStates();
  for (const state of states) {
    const decayed = applyDecay(state);
    if (decayed.heat !== state.heat) {
      await saveTerritoryState(decayed);
    }
  }
}

/**
 * Returns summary counts for display on the home screen.
 */
export async function getTerritorySnapshot(): Promise<{
  total: number;
  legendary: number;
  yours: number;
  hot: number;
  warm: number;
  cold: number;
}> {
  const states = await getAllTerritoryStates();
  return {
    total:     states.length,
    legendary: states.filter(s => s.heat === 'LEGENDARY').length,
    yours:     states.filter(s => s.heat === 'YOURS').length,
    hot:       states.filter(s => s.heat === 'HOT').length,
    warm:      states.filter(s => s.heat === 'WARM').length,
    cold:      states.filter(s => s.heat === 'COLD').length,
  };
}
