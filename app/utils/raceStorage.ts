import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'stride_races_v1';

export type RaceDistance =
  | '5k' | '10k' | 'half' | 'marathon' | 'ultra_50k' | 'ultra_100k' | 'other';

export interface Race {
  id: string;
  name: string;
  date: string;          // ISO date string
  distance: RaceDistance;
  terrain: 'road' | 'trail' | 'track';
  goal_time?: string;    // e.g. "3:45:00"
  notes?: string;
  shoe_id?: string;      // selected Arsenal shoe for this race
  completed: boolean;
  finish_time?: string;
}

export const DISTANCE_LABELS: Record<RaceDistance, string> = {
  '5k':        '5K',
  '10k':       '10K',
  'half':      'Half Marathon',
  'marathon':  'Marathon',
  'ultra_50k': 'Ultra 50K',
  'ultra_100k':'Ultra 100K',
  'other':     'Other',
};

export const DISTANCE_KM: Record<RaceDistance, number> = {
  '5k': 5, '10k': 10, 'half': 21.1, 'marathon': 42.2,
  'ultra_50k': 50, 'ultra_100k': 100, 'other': 0,
};

export async function getRaces(): Promise<Race[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveRace(race: Race): Promise<void> {
  const races = await getRaces();
  const idx = races.findIndex(r => r.id === race.id);
  if (idx >= 0) races[idx] = race;
  else races.push(race);
  await AsyncStorage.setItem(KEY, JSON.stringify(races));
}

export async function deleteRace(id: string): Promise<void> {
  const races = await getRaces();
  await AsyncStorage.setItem(KEY, JSON.stringify(races.filter(r => r.id !== id)));
}

export async function completeRace(id: string, finishTime?: string): Promise<void> {
  const races = await getRaces();
  const race = races.find(r => r.id === id);
  if (race) {
    race.completed = true;
    if (finishTime) race.finish_time = finishTime;
    await AsyncStorage.setItem(KEY, JSON.stringify(races));
  }
}

/** Returns days until the race (negative if past) */
export function daysUntil(isoDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const race = new Date(isoDate);
  race.setHours(0, 0, 0, 0);
  return Math.round((race.getTime() - now.getTime()) / 86400000);
}
