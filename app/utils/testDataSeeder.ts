/**
 * Test data seeder — injects realistic fake runs as if synced from
 * Strava / Apple Health. Use the "Seed Test Data" button in Integrations.
 *
 * Covers every terrain, purpose, match quality tier, and feel rating
 * so you can see the full app experience without a real watch.
 */
import { saveRun, getRuns } from './runStorage';
import { addMiles, addXP } from './userProfile';
import { checkAndUnlockAchievements } from './achievementEngine';
import { updateStreaksAfterRun } from './streakEngine';
import { Run, RunTerrain, RunPurpose } from '../types/run';
import { SHOES } from '../data/shoes';
import { getFavorites } from './storage';
import { calcMatchQuality, calcXP } from './matchQuality';

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export interface SeedOptions {
  source: 'strava' | 'apple_health';
  count: number; // 5 | 10 | 20
}

export async function seedTestRuns(options: SeedOptions = { source: 'strava', count: 10 }): Promise<{ imported: number; xpEarned: number; milesAdded: number }> {
  const favIds = await getFavorites();

  // Use favorited shoes; fall back to first 3 from DB
  const shoePool = favIds.length > 0
    ? SHOES.filter(s => favIds.includes(s.id))
    : SHOES.slice(0, 3);

  if (shoePool.length === 0) return { imported: 0, xpEarned: 0, milesAdded: 0 };

  const SCENARIOS: Array<{
    distanceKm: number;
    terrain: RunTerrain;
    purpose: RunPurpose;
    durationMinutes: number;
    feel: 1 | 2 | 3;
    label: string;
  }> = [
    { distanceKm: 5.2,  terrain: 'road',      purpose: 'easy',     durationMinutes: 32,  feel: 3, label: 'Morning easy' },
    { distanceKm: 10.1, terrain: 'road',      purpose: 'tempo',    durationMinutes: 51,  feel: 2, label: 'Tempo Tuesday' },
    { distanceKm: 21.3, terrain: 'road',      purpose: 'long',     durationMinutes: 130, feel: 2, label: 'Long Sunday' },
    { distanceKm: 3.0,  terrain: 'track',     purpose: 'speed',    durationMinutes: 22,  feel: 1, label: 'Track intervals' },
    { distanceKm: 8.5,  terrain: 'trail',     purpose: 'easy',     durationMinutes: 62,  feel: 3, label: 'Trail adventure' },
    { distanceKm: 4.2,  terrain: 'road',      purpose: 'recovery', durationMinutes: 30,  feel: 3, label: 'Recovery jog' },
    { distanceKm: 42.2, terrain: 'road',      purpose: 'race',     durationMinutes: 238, feel: 1, label: 'Marathon race' },
    { distanceKm: 12.0, terrain: 'trail',     purpose: 'long',     durationMinutes: 95,  feel: 2, label: 'Trail long run' },
    { distanceKm: 6.1,  terrain: 'treadmill', purpose: 'easy',     durationMinutes: 38,  feel: 2, label: 'Treadmill easy' },
    { distanceKm: 5.0,  terrain: 'road',      purpose: 'race',     durationMinutes: 23,  feel: 3, label: '5K race' },
    { distanceKm: 16.0, terrain: 'road',      purpose: 'long',     durationMinutes: 98,  feel: 2, label: 'Medium long' },
    { distanceKm: 3.5,  terrain: 'road',      purpose: 'easy',     durationMinutes: 24,  feel: 3, label: 'Shakeout' },
    { distanceKm: 9.0,  terrain: 'trail',     purpose: 'tempo',    durationMinutes: 65,  feel: 2, label: 'Trail tempo' },
    { distanceKm: 7.5,  terrain: 'road',      purpose: 'easy',     durationMinutes: 46,  feel: 3, label: 'Easy evening' },
    { distanceKm: 2.5,  terrain: 'road',      purpose: 'walk',     durationMinutes: 30,  feel: 3, label: 'Active recovery walk' },
    { distanceKm: 10.0, terrain: 'road',      purpose: 'race',     durationMinutes: 46,  feel: 2, label: '10K race' },
    { distanceKm: 6.0,  terrain: 'track',     purpose: 'speed',    durationMinutes: 38,  feel: 1, label: 'Speed session' },
    { distanceKm: 30.0, terrain: 'road',      purpose: 'long',     durationMinutes: 185, feel: 2, label: 'Marathon prep long' },
    { distanceKm: 4.0,  terrain: 'treadmill', purpose: 'recovery', durationMinutes: 28,  feel: 3, label: 'Hotel treadmill' },
    { distanceKm: 21.1, terrain: 'road',      purpose: 'race',     durationMinutes: 105, feel: 2, label: 'Half marathon' },
  ];

  const selected = SCENARIOS.slice(0, Math.min(options.count, SCENARIOS.length));
  let totalMiles = 0;
  let totalXP    = 0;
  let imported   = 0;

  for (let i = 0; i < selected.length; i++) {
    const sc   = selected[i];
    const shoe = randomFrom(shoePool);
    const match = calcMatchQuality(shoe, sc.terrain, sc.purpose, sc.distanceKm);
    const xp    = calcXP(sc.distanceKm, match, false);
    const miles = sc.distanceKm * 0.621371;

    const run: Run = {
      id:              `run_seed_${Date.now()}_${i}`,
      shoeId:          shoe.id,
      distanceKm:      sc.distanceKm,
      date:            daysAgo(selected.length - i),
      terrain:         sc.terrain,
      purpose:         sc.purpose,
      durationMinutes: sc.durationMinutes,
      feel:            sc.feel,
      match_quality:   match,
      xp_earned:       xp,
      source:          options.source,
      notes:           sc.label,
    };

    await saveRun(run);
    totalMiles += miles;
    totalXP    += xp;
    imported++;
  }

  if (totalMiles > 0) await addMiles(totalMiles);
  if (totalXP    > 0) await addXP(totalXP);
  const allRuns = await getRuns();
  const { seasonBonusXP } = await updateStreaksAfterRun(allRuns);
  if (seasonBonusXP > 0) await addXP(seasonBonusXP);
  await checkAndUnlockAchievements();

  return { imported, xpEarned: Math.round(totalXP), milesAdded: Math.round(totalMiles * 10) / 10 };
}

export async function clearSeededRuns(): Promise<void> {
  const { getRuns, saveRuns } = await import('./runStorage');
  const all = await getRuns();
  const real = all.filter(r => !r.id.startsWith('run_seed_'));
  await saveRuns(real);
}
