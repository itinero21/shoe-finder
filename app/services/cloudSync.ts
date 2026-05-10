/**
 * Cloud sync service — all Supabase DB read/write operations.
 *
 * Strategy: LOCAL FIRST, CLOUD SECOND.
 *   - Every write goes to AsyncStorage first (instant, offline-safe).
 *   - Then an async Supabase upsert runs in the background.
 *   - On app launch, if signed in, we pull the cloud state and merge
 *     (cloud wins for profile/arsenal, local wins for runs to avoid duplicates).
 *
 * This means the app works fully offline and syncs when connectivity returns.
 */

import { supabase } from '../lib/supabase';
import { Run } from '../types/run';
import { UserProfile } from '../utils/userProfile';

// ── helpers ───────────────────────────────────────────────────────────────────

async function uid(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ── Profile ───────────────────────────────────────────────────────────────────

export async function pushProfile(profile: UserProfile): Promise<void> {
  const userId = await uid();
  if (!userId) return;
  await supabase.from('user_profiles').upsert({
    id:                    userId,
    lifetime_miles:        profile.lifetime_miles,
    total_xp:              profile.total_xp,
    current_level:         profile.current_level,
    is_beginner_mode:      profile.is_beginner_mode,
    graduated_at:          profile.graduated_at,
    quiz_completed_at:     profile.quiz_completed_at,
    streak_states:         profile.streak_states,
    active_injury:         profile.active_injury,
    injury_history:        profile.injury_history,
    achievements_unlocked: profile.achievements_unlocked,
    weekly_roster:         profile.weekly_roster,
    weekly_roster_locked:  profile.weekly_roster_locked,
    week_starting:         profile.week_starting,
    graveyard_count:       profile.graveyard_count,
  }, { onConflict: 'id' });
}

export async function pullProfile(): Promise<Partial<UserProfile> | null> {
  const userId = await uid();
  if (!userId) return null;
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return {
    lifetime_miles:        data.lifetime_miles,
    total_xp:              data.total_xp,
    current_level:         data.current_level,
    is_beginner_mode:      data.is_beginner_mode,
    graduated_at:          data.graduated_at,
    quiz_completed_at:     data.quiz_completed_at,
    streak_states:         data.streak_states,
    active_injury:         data.active_injury,
    injury_history:        data.injury_history ?? [],
    achievements_unlocked: data.achievements_unlocked ?? [],
    weekly_roster:         data.weekly_roster ?? [],
    weekly_roster_locked:  data.weekly_roster_locked,
    week_starting:         data.week_starting,
    graveyard_count:       data.graveyard_count ?? 0,
    created_at:            data.created_at,
  };
}

// ── Arsenal (favorites) ───────────────────────────────────────────────────────

export async function pushArsenal(shoeIds: string[]): Promise<void> {
  const userId = await uid();
  if (!userId) return;

  // Delete all then re-insert (simpler than diffing for small sets)
  await supabase.from('arsenal').delete().eq('user_id', userId);
  if (shoeIds.length === 0) return;
  await supabase.from('arsenal').insert(
    shoeIds.map(shoe_id => ({ user_id: userId, shoe_id }))
  );
}

export async function pullArsenal(): Promise<string[]> {
  const userId = await uid();
  if (!userId) return [];
  const { data } = await supabase
    .from('arsenal')
    .select('shoe_id')
    .eq('user_id', userId);
  return (data ?? []).map((r: any) => r.shoe_id);
}

// ── Runs ──────────────────────────────────────────────────────────────────────

export async function pushRun(run: Run): Promise<void> {
  const userId = await uid();
  if (!userId) return;
  await supabase.from('runs').upsert({
    id:               run.id,
    user_id:          userId,
    shoe_id:          run.shoeId,
    distance_km:      run.distanceKm,
    date:             run.date,
    terrain:          run.terrain,
    purpose:          run.purpose,
    duration_minutes: run.durationMinutes,
    feel:             run.feel,
    notes:            run.notes,
    match_quality:    run.match_quality,
    xp_earned:        run.xp_earned ?? 0,
    source:           run.source ?? 'manual',
    external_id:      run.external_id,
    route_hash:       run.route_hash,
  }, { onConflict: 'id' });
}

export async function pullRuns(): Promise<Run[]> {
  const userId = await uid();
  if (!userId) return [];
  const { data } = await supabase
    .from('runs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(500);
  if (!data) return [];
  return data.map((r: any): Run => ({
    id:              r.id,
    shoeId:          r.shoe_id,
    distanceKm:      r.distance_km,
    date:            r.date,
    terrain:         r.terrain,
    purpose:         r.purpose,
    durationMinutes: r.duration_minutes,
    feel:            r.feel,
    notes:           r.notes,
    match_quality:   r.match_quality,
    xp_earned:       r.xp_earned,
    source:          r.source,
    external_id:     r.external_id,
    route_hash:      r.route_hash,
  }));
}

export async function deleteRunCloud(runId: string): Promise<void> {
  const userId = await uid();
  if (!userId) return;
  await supabase.from('runs').delete().eq('id', runId).eq('user_id', userId);
}

// ── Shoe mileage ──────────────────────────────────────────────────────────────

export async function pushMileage(shoeId: string, totalKm: number, runCount: number): Promise<void> {
  const userId = await uid();
  if (!userId) return;
  await supabase.from('shoe_mileage').upsert({
    user_id:   userId,
    shoe_id:   shoeId,
    total_km:  totalKm,
    run_count: runCount,
  }, { onConflict: 'user_id,shoe_id' });
}

// ── Full initial sync (call once after login) ─────────────────────────────────
/**
 * Merges cloud data into local storage after sign-in.
 * Cloud profile + arsenal overwrite local (cloud is source of truth for settings).
 * Cloud runs are merged with local runs by ID (no duplicates).
 */
export async function initialSync(): Promise<void> {
  const userId = await uid();
  if (!userId) return;

  const [cloudProfile, cloudArsenal, cloudRuns] = await Promise.all([
    pullProfile(),
    pullArsenal(),
    pullRuns(),
  ]);

  const { getUserProfile, saveUserProfile } = await import('../utils/userProfile');
  const { getFavorites, addToFavorites }    = await import('../utils/storage');
  const { getRuns, saveRun }               = await import('../utils/runStorage');

  // Merge profile — cloud wins
  if (cloudProfile) {
    const local = await getUserProfile();
    await saveUserProfile({ ...local, ...cloudProfile });
  }

  // Merge arsenal — cloud wins (add any cloud shoe not already local)
  if (cloudArsenal.length > 0) {
    const localArsenal = await getFavorites();
    const toAdd = cloudArsenal.filter(id => !localArsenal.includes(id));
    for (const id of toAdd) await addToFavorites(id);
  }

  // Merge runs — union by ID (cloud may have more from Strava sync on another device)
  if (cloudRuns.length > 0) {
    const localRuns = await getRuns();
    const localIds  = new Set(localRuns.map(r => r.id));
    for (const run of cloudRuns) {
      if (!localIds.has(run.id)) await saveRun(run);
    }
  }
}
