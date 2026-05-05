/**
 * Streak calculation engine.
 *
 * 5 streak types, each evaluated per complete ISO week:
 *   variety         — 2+ different shoes used in a week
 *   exploration     — 2+ different terrains in a week
 *   consistency     — 2+ runs logged in a week
 *   recovery        — at least 1 recovery/walk run in a week
 *   rotation_health — rotation health score ≥ 60 for week's shoe mix
 *
 * Season reset: when a streak hits 8 consecutive weeks it "completes a season",
 * resets to 0, and awards 200 bonus XP. Prevents streak anxiety.
 *
 * Injury freeze: active injury → no changes to any streak (neither advance nor reset).
 */

import { Run } from '../types/run';
import { SHOES } from '../data/shoes';
import { StreakState } from './userProfile';
import { getRotationProfile, getRotationHealthScore } from './rotationScore';

const SEASON_LENGTH = 8; // weeks

// ── Date helpers ──────────────────────────────────────────────────────────────

/** Returns YYYY-MM-DD string for the Monday of the ISO week containing `date`. */
function weekMonday(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sun
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0, 10);
}

/**
 * Returns an array of ISO-week Monday strings for the last `n` *complete* weeks
 * (most recent first). "Complete" means Sunday has already passed.
 */
function lastCompleteWeeks(n: number): string[] {
  const result: string[] = [];
  const now = new Date();

  // Start from last week (offset 1) so we never include the current incomplete week
  for (let weekOffset = 1; weekOffset <= n + 4; weekOffset++) {
    const d = new Date(now);
    d.setDate(d.getDate() - weekOffset * 7);
    const monday = weekMonday(d);
    if (!result.includes(monday)) result.push(monday);
    if (result.length >= n) break;
  }
  return result;
}

// ── Per-week condition evaluators ─────────────────────────────────────────────

function evalVariety(runs: Run[]): boolean {
  const shoes = new Set(runs.map(r => r.shoeId).filter(Boolean));
  return shoes.size >= 2;
}

function evalExploration(runs: Run[]): boolean {
  const terrains = new Set(runs.map(r => r.terrain).filter(Boolean));
  return terrains.size >= 2;
}

function evalConsistency(runs: Run[]): boolean {
  return runs.length >= 2;
}

function evalRecovery(runs: Run[]): boolean {
  return runs.some(r => r.purpose === 'recovery' || r.purpose === 'walk');
}

function evalRotationHealth(runs: Run[]): boolean {
  const shoeIds = [...new Set(runs.map(r => r.shoeId).filter(Boolean))];
  const shoes = shoeIds
    .map(id => SHOES.find(s => s.id === id))
    .filter((s): s is typeof SHOES[0] => Boolean(s));
  if (shoes.length === 0) return false;
  return getRotationHealthScore(getRotationProfile(shoes)) >= 60;
}

const EVALUATORS: Record<keyof StreakState, (runs: Run[]) => boolean> = {
  variety:         evalVariety,
  exploration:     evalExploration,
  consistency:     evalConsistency,
  recovery:        evalRecovery,
  rotation_health: evalRotationHealth,
};

export const STREAK_META: Record<keyof StreakState, { label: string; icon: string; desc: string }> = {
  variety:         { label: 'VARIETY',        icon: '🔀', desc: 'Use 2+ shoes per week' },
  exploration:     { label: 'EXPLORATION',    icon: '🗺️', desc: 'Run on 2+ terrains per week' },
  consistency:     { label: 'CONSISTENCY',    icon: '📅', desc: 'Log 2+ runs per week' },
  recovery:        { label: 'RECOVERY',       icon: '💤', desc: 'Include a recovery/walk run each week' },
  rotation_health: { label: 'ROTATION',       icon: '🔄', desc: 'Maintain healthy rotation health score' },
};

// ── Main recalc ───────────────────────────────────────────────────────────────

export interface SeasonBonus {
  key: keyof StreakState;
  label: string;
  xp: number;
}

export interface StreakRecalcResult {
  streaks: StreakState;
  seasonBonuses: SeasonBonus[];
}

export function recalcStreaks(
  allRuns: Run[],
  current: StreakState,
  injuryActive: boolean
): StreakRecalcResult {
  // Freeze all streaks during active injury — neither advance nor reset
  if (injuryActive) {
    return { streaks: { ...current }, seasonBonuses: [] };
  }

  // Index runs by week Monday
  const byWeek: Record<string, Run[]> = {};
  for (const run of allRuns) {
    const key = weekMonday(new Date(run.date));
    if (!byWeek[key]) byWeek[key] = [];
    byWeek[key].push(run);
  }

  // Evaluate over the last 9 complete weeks (more than a season, catches resets)
  const weeks = lastCompleteWeeks(9);

  const seasonBonuses: SeasonBonus[] = [];
  const newStreaks: StreakState = {
    variety:         { ...current.variety },
    exploration:     { ...current.exploration },
    consistency:     { ...current.consistency },
    recovery:        { ...current.recovery },
    rotation_health: { ...current.rotation_health },
  };

  for (const key of Object.keys(EVALUATORS) as (keyof StreakState)[]) {
    const eval_ = EVALUATORS[key];
    let consecutive = 0;

    // Count consecutive complete weeks from most recent backwards
    for (const monday of weeks) {
      const weekRuns = byWeek[monday] ?? [];
      if (eval_(weekRuns)) {
        consecutive++;
      } else {
        break;
      }
    }

    const best = Math.max(current[key].best_weeks, consecutive);

    if (consecutive >= SEASON_LENGTH) {
      // Season complete → reset and award XP
      seasonBonuses.push({
        key,
        label: STREAK_META[key].label,
        xp: 200,
      });
      newStreaks[key] = { weeks_active: 0, best_weeks: best };
    } else {
      newStreaks[key] = { weeks_active: consecutive, best_weeks: best };
    }
  }

  return { streaks: newStreaks, seasonBonuses };
}

/**
 * Convenience: recalc streaks, save them to the profile, and return
 * the total bonus XP earned from season completions.
 */
export async function updateStreaksAfterRun(
  allRuns: Run[]
): Promise<{ seasonBonusXP: number }> {
  const { getUserProfile, saveUserProfile } = await import('./userProfile');
  const profile = await getUserProfile();

  const { streaks, seasonBonuses } = recalcStreaks(
    allRuns,
    profile.streak_states,
    profile.active_injury !== null
  );

  profile.streak_states = streaks;

  let seasonBonusXP = 0;
  for (const bonus of seasonBonuses) {
    seasonBonusXP += bonus.xp;
    profile.total_xp += bonus.xp;
  }

  await saveUserProfile(profile);
  return { seasonBonusXP };
}
