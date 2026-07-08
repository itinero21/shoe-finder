/**
 * User profile — persisted locally with AsyncStorage.
 * User settings and long-lived health context.
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

export interface UserProfile {
  lifetime_miles: number;
  is_beginner_mode: boolean;
  graduated_at: string | null;
  created_at: string;
  quiz_completed_at: string | null;
  active_injury: ActiveInjury | null;
  injury_history: ActiveInjury[];
  week_starting: string; // ISO date Sunday
  graveyard_count: number;
  // Runner profile (used by fatigue model)
  weight_lbs: number;      // default 160; used by shoe fatigue model
  arch_type: 'flat' | 'normal' | 'high' | null;
  // Shoe Fund (micro-savings engine)
  shoeFundBalance: number;
  shoeFundTargetPrice: number | null;
  shoeFundTargetName: string | null;
  shoeFundTargetShoeId: string | null;
}

const DEFAULT_PROFILE: UserProfile = {
  lifetime_miles: 0,
  is_beginner_mode: true,
  graduated_at: null,
  created_at: new Date().toISOString(),
  quiz_completed_at: null,
  weight_lbs: 160,
  arch_type: null,
  active_injury: null,
  injury_history: [],
  week_starting: getThisSunday(),
  graveyard_count: 0,
  shoeFundBalance: 0,
  shoeFundTargetPrice: null,
  shoeFundTargetName: null,
  shoeFundTargetShoeId: null,
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

export async function addToShoeFund(amount: number): Promise<void> {
  if (amount <= 0) return;
  const profile = await getUserProfile();
  profile.shoeFundBalance = (profile.shoeFundBalance ?? 0) + amount;
  await saveUserProfile(profile);
}

export async function setShoeFundGoal(price: number, name: string, shoeId: string): Promise<void> {
  const profile = await getUserProfile();
  profile.shoeFundTargetPrice = price;
  profile.shoeFundTargetName = name;
  profile.shoeFundTargetShoeId = shoeId;
  await saveUserProfile(profile);
}
