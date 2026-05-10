/**
 * pathStorage — AsyncStorage CRUD for RunPath and TerritoryState
 * DRIFT Phase 1
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RunPath, TerritoryState } from '../types/territory';

const PATHS_KEY   = 'drift_run_paths_v1';
const STATES_KEY  = 'drift_territory_states_v1';

// ─── RunPath ────────────────────────────────────────────────────────────────

export async function getAllPaths(): Promise<RunPath[]> {
  try {
    const raw = await AsyncStorage.getItem(PATHS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getPathById(id: string): Promise<RunPath | null> {
  const paths = await getAllPaths();
  return paths.find(p => p.id === id) ?? null;
}

export async function savePath(path: RunPath): Promise<void> {
  const paths = await getAllPaths();
  const idx = paths.findIndex(p => p.id === path.id);
  if (idx >= 0) paths[idx] = path;
  else paths.push(path);
  await AsyncStorage.setItem(PATHS_KEY, JSON.stringify(paths));
}

export async function deletePath(id: string): Promise<void> {
  const paths = await getAllPaths();
  await AsyncStorage.setItem(PATHS_KEY, JSON.stringify(paths.filter(p => p.id !== id)));
}

export async function renamePath(id: string, name: string): Promise<void> {
  const path = await getPathById(id);
  if (!path) return;
  path.name = name;
  path.updated_at = new Date().toISOString();
  await savePath(path);
}

// ─── TerritoryState ─────────────────────────────────────────────────────────

export async function getAllTerritoryStates(): Promise<TerritoryState[]> {
  try {
    const raw = await AsyncStorage.getItem(STATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getTerritoryState(path_id: string): Promise<TerritoryState | null> {
  const states = await getAllTerritoryStates();
  return states.find(s => s.path_id === path_id) ?? null;
}

export async function saveTerritoryState(state: TerritoryState): Promise<void> {
  const states = await getAllTerritoryStates();
  const idx = states.findIndex(s => s.path_id === state.path_id);
  if (idx >= 0) states[idx] = state;
  else states.push(state);
  await AsyncStorage.setItem(STATES_KEY, JSON.stringify(states));
}

export async function deleteAllTerritoryData(): Promise<void> {
  await AsyncStorage.multiRemove([PATHS_KEY, STATES_KEY]);
}

/** Returns all states filtered by heat level */
export async function getStatesByHeat(heat: TerritoryState['heat']): Promise<TerritoryState[]> {
  const states = await getAllTerritoryStates();
  return states.filter(s => s.heat === heat);
}

/** Counts per heat tier */
export async function getTerritoryTotals(): Promise<Record<string, number>> {
  const states = await getAllTerritoryStates();
  const totals: Record<string, number> = { COLD: 0, WARM: 0, HOT: 0, YOURS: 0, LEGENDARY: 0 };
  for (const s of states) totals[s.heat] = (totals[s.heat] ?? 0) + 1;
  return totals;
}
