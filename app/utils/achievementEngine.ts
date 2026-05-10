/**
 * Achievement definitions and unlock engine.
 * Call checkAndUnlockAchievements() after every run save and shoe event.
 */
import { getUserProfile, saveUserProfile, UserProfile } from './userProfile';
import { getRuns } from './runStorage';
import { getGraveyard, getGraveyardStats, ShoeObituary } from './obituaryStorage';
import { SHOES } from '../data/shoes';
import { Run } from '../types/run';

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
  xp_reward: number;
  category: 'mileage' | 'rotation' | 'streaks' | 'quiz' | 'explorer' | 'graveyard' | 'match' | 'territory';
  secret?: boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Mileage ────────────────────────────────────────────────────────────────
  { id: 'first_mile',       title: 'First Step',        icon: 'MI', desc: 'Log your first run.',                    xp_reward: 25,  category: 'mileage' },
  { id: 'miles_50',         title: 'Half Century',      icon: '50', desc: 'Accumulate 50 lifetime miles.',          xp_reward: 100, category: 'mileage' },
  { id: 'miles_100',        title: 'Century Mark',      icon: '1C', desc: 'Hit 100 lifetime miles.',                xp_reward: 200, category: 'mileage' },
  { id: 'miles_500',        title: 'Road Warrior',      icon: '5C', desc: 'Grind out 500 lifetime miles.',          xp_reward: 500, category: 'mileage' },
  { id: 'miles_1000',       title: 'Four Figure Club',  icon: '1K', desc: '1,000 miles. Hall of fame territory.',   xp_reward: 1000, category: 'mileage' },
  { id: 'single_run_20k',   title: 'Long Hauler',       icon: '20', desc: 'Log a single run of 20km or more.',     xp_reward: 75,  category: 'mileage' },
  { id: 'single_run_42k',   title: 'The Distance',      icon: '42', desc: 'Log a marathon-length run (42km+).',    xp_reward: 200, category: 'mileage' },

  // ── Match quality ───────────────────────────────────────────────────────────
  { id: 'first_perfect',    title: 'Perfect Pairing',   icon: 'PF', desc: 'Get a PERFECT match quality on a run.',  xp_reward: 50,  category: 'match' },
  { id: 'ten_perfect',      title: 'Precision Protocol',icon: 'P0', desc: 'Log 10 perfect-match runs.',             xp_reward: 150, category: 'match' },
  { id: 'no_abuse',         title: 'Shoe Whisperer',    icon: 'NA', desc: 'Never log an ABUSE run (20+ runs).',     xp_reward: 100, category: 'match', secret: true },
  { id: 'race_day_racer',   title: 'Race Day Protocol', icon: 'RC', desc: 'Log a race run in a carbon plate shoe.', xp_reward: 100, category: 'match' },

  // ── Rotation ─────────────────────────────────────────────────────────────────
  { id: 'three_shoe_rot',   title: 'Rotation Started',  icon: 'R3', desc: 'Have 3 active shoes in your Arsenal.',   xp_reward: 50,  category: 'rotation' },
  { id: 'five_shoe_rot',    title: 'Full Rotation',     icon: 'R5', desc: 'Build an Arsenal of 5+ shoes.',          xp_reward: 100, category: 'rotation' },
  { id: 'first_funeral',    title: 'First Goodbye',     icon: 'GV', desc: 'Retire your first shoe.',                xp_reward: 75,  category: 'graveyard' },
  { id: 'graveyard_five',   title: 'Serial Retiree',    icon: 'G5', desc: 'Retire 5 shoes. The cycle continues.',   xp_reward: 150, category: 'graveyard' },
  { id: 'buyagain_streak',  title: 'Brand Loyal',       icon: 'BA', desc: 'Mark 3 retired shoes as buy-again.',     xp_reward: 75,  category: 'graveyard' },

  // ── Explorer ─────────────────────────────────────────────────────────────────
  { id: 'trail_run',        title: 'Off Road',          icon: 'TR', desc: 'Log your first trail run.',              xp_reward: 40,  category: 'explorer' },
  { id: 'all_terrains',     title: 'Terrain Master',    icon: 'AT', desc: 'Log runs on all 4 terrains.',            xp_reward: 100, category: 'explorer' },
  { id: 'all_purposes',     title: 'All Paces',         icon: 'AP', desc: 'Log all 7 run types.',                   xp_reward: 100, category: 'explorer' },
  { id: 'tried_five_brands',title: 'Brand Agnostic',    icon: 'B5', desc: 'Run in shoes from 5 different brands.',  xp_reward: 75,  category: 'explorer' },

  // ── Quiz ─────────────────────────────────────────────────────────────────────
  { id: 'quiz_complete',    title: 'Scout Activated',   icon: 'SC', desc: 'Complete the shoe quiz.',                xp_reward: 25,  category: 'quiz' },
  { id: 'graduated',        title: 'No Longer a Rookie',icon: 'GD', desc: 'Graduate from Beginner Mode.',           xp_reward: 150, category: 'quiz' },

  // ── Streaks ──────────────────────────────────────────────────────────────────
  { id: 'streak_4w',        title: 'Creature of Habit', icon: 'S4', desc: 'Keep any streak going for 4 weeks.',     xp_reward: 75,  category: 'streaks' },
  { id: 'streak_8w',        title: 'Locked In',         icon: 'S8', desc: 'Keep any streak going for 8 weeks.',     xp_reward: 150, category: 'streaks' },

  // ── DRIFT Territory ───────────────────────────────────────────────────────────
  { id: 'drifter',          title: 'Drifter',           icon: 'DR', desc: 'Log your first GPS-tracked territory run.',         xp_reward: 30,   category: 'territory' },
  { id: 'warmth',           title: 'Warmth',            icon: 'WM', desc: 'Heat a path to WARM for the first time.',           xp_reward: 50,   category: 'territory' },
  { id: 'heat',             title: 'Heat',              icon: 'HT', desc: 'Heat a path to HOT.',                               xp_reward: 100,  category: 'territory' },
  { id: 'first_claim',      title: 'The First Claim',   icon: 'FC', desc: 'Own a path — 10 runs on the same route.',           xp_reward: 200,  category: 'territory' },
  { id: 'engraved',         title: 'Engraved',          icon: 'EN', desc: 'Reach LEGENDARY status on a path (25 runs).',       xp_reward: 500,  category: 'territory' },
  { id: 'the_engraver',     title: 'The Engraver',      icon: 'EV', desc: 'Hold 3 LEGENDARY paths simultaneously.',           xp_reward: 1000, category: 'territory', secret: true },
  { id: 'city_pioneer',     title: 'City Pioneer',      icon: 'CP', desc: 'Log a run in a city you\'ve added to the map.',     xp_reward: 75,   category: 'territory' },
  { id: 'territory_10',     title: 'Territory Lord',    icon: 'T0', desc: 'Own 10+ paths (YOURS or LEGENDARY).',               xp_reward: 300,  category: 'territory' },
  { id: 'territory_25',     title: 'Domain',            icon: 'T5', desc: 'Own 25+ paths — your city knows your name.',        xp_reward: 750,  category: 'territory', secret: true },
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

  const brandsUsed = new Set(
    runs.map(r => SHOES.find(s => s.id === r.shoeId)?.brand).filter(Boolean)
  );
  if (brandsUsed.size >= 5) tryUnlock('tried_five_brands');

  // ── Quiz ────────────────────────────────────
  if (profile.quiz_completed_at) tryUnlock('quiz_complete');

  // ── Graduation ──────────────────────────────
  if (!profile.is_beginner_mode && profile.graduated_at) tryUnlock('graduated');

  // ── Graveyard ───────────────────────────────
  if (graveyardStats.totalShoes >= 1) tryUnlock('first_funeral');
  if (graveyardStats.totalShoes >= 5) tryUnlock('graveyard_five');
  if (graveyardStats.buyAgainCount >= 3) tryUnlock('buyagain_streak');

  // ── Streaks ─────────────────────────────────
  const streakVals = Object.values(profile.streak_states).map(s => s.best_weeks);
  const maxStreak = streakVals.length > 0 ? Math.max(0, ...streakVals) : 0;
  if (maxStreak >= 4) tryUnlock('streak_4w');
  if (maxStreak >= 8) tryUnlock('streak_8w');

  // ── DRIFT Territory ──────────────────────────────────────────────────────────
  const t = profile.territory;
  const gpsRuns = runs.filter(r => r.path_id);
  if (gpsRuns.length >= 1)                                                    tryUnlock('drifter');
  if (t.warm_count + t.hot_count + t.yours_count + t.legendary_count >= 1)   tryUnlock('warmth');
  if (t.hot_count + t.yours_count + t.legendary_count >= 1)                   tryUnlock('heat');
  if (t.yours_count + t.legendary_count >= 1)                                 tryUnlock('first_claim');
  if (t.legendary_count >= 1)                                                  tryUnlock('engraved');
  if (t.legendary_count >= 3)                                                  tryUnlock('the_engraver');
  if (t.cities_visited.length >= 1)                                            tryUnlock('city_pioneer');
  if (t.yours_count + t.legendary_count >= 10)                                tryUnlock('territory_10');
  if (t.yours_count + t.legendary_count >= 25)                                tryUnlock('territory_25');

  if (newlyUnlocked.length > 0) {
    await saveUserProfile(profile);
  }

  return newlyUnlocked;
}

// ── Achievement progress for UI progress bars ─────────────────────────────────

export interface AchievementProgress {
  current: number;
  max: number;
  pct: number;   // 0–1
  label: string; // e.g. "47 / 100 MI"
}

/**
 * Returns progress toward each locked achievement.
 * Call once per screen load — safe to call with empty arrays.
 */
export function computeAchievementProgress(
  profile: UserProfile,
  runs: Run[],
  graveyard: ShoeObituary[],
  arsenalSize: number,
): Record<string, AchievementProgress> {
  const miles = profile.lifetime_miles;
  const perfectRuns = runs.filter(r => r.match_quality === 'perfect');
  const terrains = new Set(runs.map(r => r.terrain).filter(Boolean));
  const purposes = new Set(runs.map(r => r.purpose).filter(Boolean));
  const brands = new Set(
    runs.map(r => SHOES.find(s => s.id === r.shoeId)?.brand).filter(Boolean)
  );
  const maxRun = runs.length > 0 ? Math.max(...runs.map(r => r.distanceKm)) : 0;
  const graveyardStats = getGraveyardStats(graveyard);
  const buyAgainCount = graveyardStats.buyAgainCount;
  const maxStreakWeeks = Object.values(profile.streak_states).length > 0
    ? Math.max(...Object.values(profile.streak_states).map(s => s.weeks_active ?? 0))
    : 0;

  const make = (current: number, max: number, unit: string): AchievementProgress => {
    const capped = Math.min(current, max);
    return {
      current: capped,
      max,
      pct: max > 0 ? capped / max : 0,
      label: `${capped} / ${max} ${unit}`,
    };
  };

  return {
    first_mile:       make(Math.min(runs.length, 1), 1, 'RUN'),
    miles_50:         make(Math.round(miles), 50, 'MI'),
    miles_100:        make(Math.round(miles), 100, 'MI'),
    miles_500:        make(Math.round(miles), 500, 'MI'),
    miles_1000:       make(Math.round(miles), 1000, 'MI'),
    single_run_20k:   make(Math.round(maxRun * 10) / 10, 20, 'KM'),
    single_run_42k:   make(Math.round(maxRun * 10) / 10, 42, 'KM'),
    first_perfect:    make(Math.min(perfectRuns.length, 1), 1, 'PERFECT'),
    ten_perfect:      make(perfectRuns.length, 10, 'PERFECT'),
    no_abuse:         make(runs.filter(r => r.match_quality !== 'abuse').length, 20, 'CLEAN RUNS'),
    race_day_racer:   make(0, 1, 'RACE+CARBON'),   // binary, hard to compute without shoe lookup
    three_shoe_rot:   make(arsenalSize, 3, 'SHOES'),
    five_shoe_rot:    make(arsenalSize, 5, 'SHOES'),
    first_funeral:    make(graveyardStats.totalShoes, 1, 'RETIRED'),
    graveyard_five:   make(graveyardStats.totalShoes, 5, 'RETIRED'),
    buyagain_streak:  make(buyAgainCount, 3, 'BUY-AGAIN'),
    trail_run:        make(terrains.has('trail') ? 1 : 0, 1, 'TRAIL RUN'),
    all_terrains:     make(terrains.size, 4, 'TERRAINS'),
    all_purposes:     make(purposes.size, 7, 'RUN TYPES'),
    tried_five_brands:make(brands.size, 5, 'BRANDS'),
    quiz_complete:    make(profile.quiz_completed_at ? 1 : 0, 1, 'QUIZ'),
    graduated:        make(profile.graduated_at ? 1 : 0, 1, 'GRADUATE'),
    streak_4w:        make(maxStreakWeeks, 4, 'WEEKS'),
    streak_8w:        make(maxStreakWeeks, 8, 'WEEKS'),
    // Territory
    drifter:          make(runs.filter(r => r.path_id).length >= 1 ? 1 : 0, 1, 'GPS RUN'),
    warmth:           make(Math.min((profile.territory?.warm_count ?? 0) + (profile.territory?.hot_count ?? 0) + (profile.territory?.yours_count ?? 0) + (profile.territory?.legendary_count ?? 0), 1), 1, 'WARM PATH'),
    heat:             make(Math.min((profile.territory?.hot_count ?? 0) + (profile.territory?.yours_count ?? 0) + (profile.territory?.legendary_count ?? 0), 1), 1, 'HOT PATH'),
    first_claim:      make(Math.min((profile.territory?.yours_count ?? 0) + (profile.territory?.legendary_count ?? 0), 1), 1, 'OWNED'),
    engraved:         make(Math.min(profile.territory?.legendary_count ?? 0, 1), 1, 'LEGENDARY'),
    the_engraver:     make(profile.territory?.legendary_count ?? 0, 3, 'LEGENDARY'),
    city_pioneer:     make(Math.min((profile.territory?.cities_visited?.length ?? 0), 1), 1, 'CITY'),
    territory_10:     make((profile.territory?.yours_count ?? 0) + (profile.territory?.legendary_count ?? 0), 10, 'OWNED'),
    territory_25:     make((profile.territory?.yours_count ?? 0) + (profile.territory?.legendary_count ?? 0), 25, 'OWNED'),
  };
}
