/**
 * Achievement definitions and unlock engine.
 * Call checkAndUnlockAchievements() after every run save and shoe event.
 */
import { getUserProfile, saveUserProfile, UserProfile } from './userProfile';
import { getRuns } from './runStorage';
import { getGraveyard, getGraveyardStats } from './obituaryStorage';

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
  xp_reward: number;
  category: 'mileage' | 'rotation' | 'streaks' | 'quiz' | 'explorer' | 'graveyard' | 'match';
  secret?: boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Mileage ────────────────────────────────────────────────────────────────
  { id: 'first_mile',       title: 'First Step',        icon: '👟', desc: 'Log your first run.',                    xp_reward: 25,  category: 'mileage' },
  { id: 'miles_50',         title: 'Half Century',       icon: '5️⃣0️⃣', desc: 'Accumulate 50 lifetime miles.',       xp_reward: 100, category: 'mileage' },
  { id: 'miles_100',        title: 'Century Mark',       icon: '💯', desc: 'Hit 100 lifetime miles.',                xp_reward: 200, category: 'mileage' },
  { id: 'miles_500',        title: 'Road Warrior',       icon: '⚡', desc: 'Grind out 500 lifetime miles.',         xp_reward: 500, category: 'mileage' },
  { id: 'miles_1000',       title: 'Four Figure Club',   icon: '🏆', desc: '1,000 miles. Hall of fame territory.',   xp_reward: 1000, category: 'mileage' },
  { id: 'single_run_20k',   title: 'Long Hauler',        icon: '🗺️', desc: 'Log a single run of 20km or more.',    xp_reward: 75,  category: 'mileage' },
  { id: 'single_run_42k',   title: 'The Distance',       icon: '🎽', desc: 'Log a marathon-length run (42km+).',   xp_reward: 200, category: 'mileage' },

  // ── Match quality ───────────────────────────────────────────────────────────
  { id: 'first_perfect',    title: 'Perfect Pairing',    icon: '🎯', desc: 'Get a PERFECT match quality on a run.',  xp_reward: 50,  category: 'match' },
  { id: 'ten_perfect',      title: 'Precision Protocol', icon: '🎯', desc: 'Log 10 perfect-match runs.',             xp_reward: 150, category: 'match' },
  { id: 'no_abuse',         title: 'Shoe Whisperer',     icon: '🤫', desc: 'Never log an ABUSE run (20+ runs).',     xp_reward: 100, category: 'match', secret: true },
  { id: 'race_day_racer',   title: 'Race Day Protocol',  icon: '🏁', desc: 'Log a race run in a carbon plate shoe.', xp_reward: 100, category: 'match' },

  // ── Rotation ─────────────────────────────────────────────────────────────────
  { id: 'three_shoe_rot',   title: 'Rotation Started',   icon: '🔄', desc: 'Have 3 active shoes in your Arsenal.',   xp_reward: 50,  category: 'rotation' },
  { id: 'five_shoe_rot',    title: 'Full Rotation',       icon: '🔄', desc: 'Build an Arsenal of 5+ shoes.',          xp_reward: 100, category: 'rotation' },
  { id: 'first_funeral',    title: 'First Goodbye',       icon: '✝️', desc: 'Retire your first shoe.',                xp_reward: 75,  category: 'graveyard' },
  { id: 'graveyard_five',   title: 'Serial Retiree',      icon: '🪦', desc: 'Retire 5 shoes. The cycle continues.',   xp_reward: 150, category: 'graveyard' },
  { id: 'buyagain_streak',  title: 'Brand Loyal',         icon: '❤️', desc: 'Mark 3 retired shoes as "buy again".',   xp_reward: 75,  category: 'graveyard' },

  // ── Explorer ─────────────────────────────────────────────────────────────────
  { id: 'trail_run',        title: 'Off Road',            icon: '🌲', desc: 'Log your first trail run.',              xp_reward: 40,  category: 'explorer' },
  { id: 'all_terrains',     title: 'Terrain Master',      icon: '🗺️', desc: 'Log runs on all 4 terrains.',            xp_reward: 100, category: 'explorer' },
  { id: 'all_purposes',     title: 'Jack of All Paces',   icon: '🎭', desc: 'Log all 7 run types.',                   xp_reward: 100, category: 'explorer' },
  { id: 'tried_five_brands',title: 'Brand Agnostic',      icon: '🌐', desc: 'Run in shoes from 5 different brands.',  xp_reward: 75,  category: 'explorer' },

  // ── Quiz ─────────────────────────────────────────────────────────────────────
  { id: 'quiz_complete',    title: 'Scout Activated',     icon: '🔍', desc: 'Complete the shoe quiz.',                xp_reward: 25,  category: 'quiz' },
  { id: 'graduated',        title: 'No Longer a Rookie',  icon: '🎓', desc: 'Graduate from Beginner Mode.',           xp_reward: 150, category: 'quiz' },

  // ── Streaks ──────────────────────────────────────────────────────────────────
  { id: 'streak_4w',        title: 'Creature of Habit',   icon: '🔥', desc: 'Keep any streak going for 4 weeks.',     xp_reward: 75,  category: 'streaks' },
  { id: 'streak_8w',        title: 'Locked In',           icon: '🔒', desc: 'Keep any streak going for 8 weeks.',     xp_reward: 150, category: 'streaks' },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDef> =
  Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));

/**
 * Check all achievements against current profile state.
 * Returns array of newly unlocked achievement IDs.
 */
export async function checkAndUnlockAchievements(): Promise<string[]> {
  const profile = await getUserProfile();
  const runs = await getRuns();
  const graveyard = await getGraveyard();
  const graveyardStats = getGraveyardStats(graveyard);

  const newlyUnlocked: string[] = [];

  const tryUnlock = (id: string) => {
    if (!profile.achievements_unlocked.includes(id)) {
      profile.achievements_unlocked.push(id);
      const def = ACHIEVEMENT_MAP[id];
      if (def) profile.total_xp += def.xp_reward;
      newlyUnlocked.push(id);
    }
  };

  const milesTotal = profile.lifetime_miles;
  const runCount = runs.length;

  // ── Mileage ────────────────────────────────
  if (runCount >= 1) tryUnlock('first_mile');
  if (milesTotal >= 50) tryUnlock('miles_50');
  if (milesTotal >= 100) tryUnlock('miles_100');
  if (milesTotal >= 500) tryUnlock('miles_500');
  if (milesTotal >= 1000) tryUnlock('miles_1000');
  if (runs.some(r => r.distanceKm >= 20)) tryUnlock('single_run_20k');
  if (runs.some(r => r.distanceKm >= 42)) tryUnlock('single_run_42k');

  // ── Match quality ───────────────────────────
  const perfectRuns = runs.filter(r => r.match_quality === 'perfect');
  if (perfectRuns.length >= 1) tryUnlock('first_perfect');
  if (perfectRuns.length >= 10) tryUnlock('ten_perfect');
  if (runCount >= 20 && !runs.some(r => r.match_quality === 'abuse')) tryUnlock('no_abuse');
  if (runs.some(r => r.match_quality === 'perfect' && r.purpose === 'race')) tryUnlock('race_day_racer');

  // ── Explorer ────────────────────────────────
  const terrains = new Set(runs.map(r => r.terrain).filter(Boolean));
  const purposes = new Set(runs.map(r => r.purpose).filter(Boolean));
  if (terrains.has('trail')) tryUnlock('trail_run');
  if (terrains.size >= 4) tryUnlock('all_terrains');
  if (purposes.size >= 7) tryUnlock('all_purposes');

  // ── Graduation ──────────────────────────────
  if (!profile.is_beginner_mode && profile.graduated_at) tryUnlock('graduated');

  // ── Graveyard ───────────────────────────────
  if (graveyardStats.totalShoes >= 1) tryUnlock('first_funeral');
  if (graveyardStats.totalShoes >= 5) tryUnlock('graveyard_five');
  if (graveyardStats.buyAgainCount >= 3) tryUnlock('buyagain_streak');

  // ── Streaks ─────────────────────────────────
  const maxStreak = Math.max(
    ...Object.values(profile.streak_states).map(s => s.best_weeks)
  );
  if (maxStreak >= 4) tryUnlock('streak_4w');
  if (maxStreak >= 8) tryUnlock('streak_8w');

  if (newlyUnlocked.length > 0) {
    await saveUserProfile(profile);
  }

  return newlyUnlocked;
}
