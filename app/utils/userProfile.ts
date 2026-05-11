/**
 * User profile — persisted locally with AsyncStorage.
 * XP, level, beginner mode, streaks, injury state.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'stride_user_profile_v1';

export type InjuryPhase = 'acute' | 'subacute' | 'return' | 'maintenance';

export interface ActiveInjury {
  injury_type: string;
  started_date: string;
  phase: InjuryPhase;
  phase_start_date: string;
  severity_history: { date: string; score: number }[];
  shoes_to_avoid: string[];
  shoes_recommended: string[];
}

export interface StreakState {
  variety: { weeks_active: number; best_weeks: number };
  exploration: { weeks_active: number; best_weeks: number };
  consistency: { weeks_active: number; best_weeks: number };
  recovery: { weeks_active: number; best_weeks: number };
  rotation_health: { weeks_active: number; best_weeks: number };
}

export interface TerritoryStats {
  total_paths: number;       // unique paths ever detected
  legendary_count: number;   // LEGENDARY-tier paths
  yours_count: number;       // YOURS-tier paths (excludes legendary)
  hot_count: number;
  warm_count: number;
  cities_visited: string[];  // city IDs
  home_city_id?: string;
}

export interface UserProfile {
  lifetime_miles: number;
  total_xp: number;
  current_level: number;
  is_beginner_mode: boolean;
  graduated_at: string | null;
  created_at: string;
  quiz_completed_at: string | null;
  streak_states: StreakState;
  active_injury: ActiveInjury | null;
  injury_history: ActiveInjury[];
  achievements_unlocked: string[];
  weekly_roster: string[]; // 3 shoe IDs
  weekly_roster_locked: boolean;
  week_starting: string; // ISO date Sunday
  graveyard_count: number;
  // Runner profile (used by fatigue model + DNA)
  weight_lbs: number;      // default 160; used by shoe fatigue model
  arch_type: 'flat' | 'normal' | 'high' | null;
  // DRIFT territory stats
  territory: TerritoryStats;
}

const DEFAULT_TERRITORY: TerritoryStats = {
  total_paths: 0,
  legendary_count: 0,
  yours_count: 0,
  hot_count: 0,
  warm_count: 0,
  cities_visited: [],
  home_city_id: undefined,
};

const DEFAULT_PROFILE: UserProfile = {
  lifetime_miles: 0,
  total_xp: 0,
  current_level: 1,
  is_beginner_mode: true,
  graduated_at: null,
  created_at: new Date().toISOString(),
  quiz_completed_at: null,
  weight_lbs: 160,
  arch_type: null,
  streak_states: {
    variety:         { weeks_active: 0, best_weeks: 0 },
    exploration:     { weeks_active: 0, best_weeks: 0 },
    consistency:     { weeks_active: 0, best_weeks: 0 },
    recovery:        { weeks_active: 0, best_weeks: 0 },
    rotation_health: { weeks_active: 0, best_weeks: 0 },
  },
  active_injury: null,
  injury_history: [],
  achievements_unlocked: [],
  weekly_roster: [],
  weekly_roster_locked: false,
  week_starting: getThisSunday(),
  graveyard_count: 0,
  territory: { ...DEFAULT_TERRITORY },
};

/**
 * Returns true if a beginner profile should graduate.
 * Conditions: 50+ lifetime miles OR 28+ days since account creation.
 */
function shouldGraduate(profile: UserProfile): boolean {
  if (!profile.is_beginner_mode || profile.graduated_at) return false;
  if (profile.lifetime_miles >= 50) return true;
  const daysSince = (Date.now() - new Date(profile.created_at).getTime()) / 86400000;
  return daysSince >= 28;
}

function graduate(profile: UserProfile): void {
  profile.is_beginner_mode = false;
  profile.graduated_at = new Date().toISOString();
}

function getThisSunday(): string {
  const now = new Date();
  const day = now.getDay();
  now.setDate(now.getDate() - day);
  return now.toISOString().slice(0, 10);
}

export async function getUserProfile(): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      territory: { ...DEFAULT_TERRITORY, ...(parsed.territory ?? {}) },
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(profile));
  // Fire-and-forget cloud push — works offline, syncs when connected
  import('../services/cloudSync').then(({ pushProfile }) => pushProfile(profile)).catch(() => {});
}

export async function addXP(amount: number): Promise<UserProfile> {
  const profile = await getUserProfile();
  profile.total_xp += amount;

  // Level up check
  const { getUserLevel } = await import('./gameEngine');
  const { current } = getUserLevel(profile.total_xp);
  profile.current_level = current.level;

  // Beginner mode graduation (50 miles OR 28 days)
  if (shouldGraduate(profile)) graduate(profile);

  await saveUserProfile(profile);
  return profile;
}

export async function addMiles(miles: number): Promise<UserProfile> {
  const profile = await getUserProfile();
  profile.lifetime_miles += miles;
  if (shouldGraduate(profile)) graduate(profile);
  await saveUserProfile(profile);
  return profile;
}

export async function setQuizCompleted(): Promise<void> {
  const profile = await getUserProfile();
  if (!profile.quiz_completed_at) {
    profile.quiz_completed_at = new Date().toISOString();
    await saveUserProfile(profile);
  }
}

export async function setActiveInjury(injury: ActiveInjury): Promise<void> {
  const profile = await getUserProfile();
  profile.active_injury = injury;
  await saveUserProfile(profile);
}

export async function clearActiveInjury(): Promise<void> {
  const profile = await getUserProfile();
  if (profile.active_injury) {
    profile.injury_history = [profile.active_injury, ...profile.injury_history];
  }
  profile.active_injury = null;
  await saveUserProfile(profile);
}

export async function advanceInjuryPhase(): Promise<void> {
  const profile = await getUserProfile();
  if (!profile.active_injury) return;
  const phases: InjuryPhase[] = ['acute', 'subacute', 'return', 'maintenance'];
  const idx = phases.indexOf(profile.active_injury.phase);
  if (idx < phases.length - 1) {
    profile.active_injury.phase = phases[idx + 1];
    profile.active_injury.phase_start_date = new Date().toISOString();
  }
  await saveUserProfile(profile);
}

export async function unlockAchievement(id: string): Promise<boolean> {
  const profile = await getUserProfile();
  if (profile.achievements_unlocked.includes(id)) return false;
  profile.achievements_unlocked.push(id);
  await saveUserProfile(profile);
  return true;
}

export async function setWeeklyRoster(shoeIds: string[]): Promise<void> {
  const profile = await getUserProfile();
  // Check if new week
  const thisSunday = getThisSunday();
  if (profile.week_starting !== thisSunday) {
    profile.week_starting = thisSunday;
    profile.weekly_roster_locked = false;
  }
  if (!profile.weekly_roster_locked) {
    profile.weekly_roster = shoeIds.slice(0, 3);
    await saveUserProfile(profile);
  }
}
