/**
 * Cloud sync service — all Supabase DB read/write operations.
 *
 * Strategy: LOCAL FIRST, CLOUD SECOND.
 *   - Every write goes to AsyncStorage first (instant, offline-safe).
 *   - Then an async Supabase upsert runs in the background.
 *   - On app launch, if signed in, we pull the cloud state and merge
 *     (cloud wins for profile/closet, local wins for runs to avoid duplicates).
 *
 * This means the app works fully offline and syncs when connectivity returns.
 */

import { supabase } from '../lib/supabase';
import { Run } from '../types/run';
import { UserProfile } from '../utils/userProfile';
import { ShoeObituary } from '../utils/obituaryStorage';

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
    is_beginner_mode:      profile.is_beginner_mode,
    graduated_at:          profile.graduated_at,
    quiz_completed_at:     profile.quiz_completed_at,
    active_injury:         profile.active_injury,
    injury_history:        profile.injury_history,
    week_starting:         profile.week_starting,
    graveyard_count:       profile.graveyard_count,
    weight_lbs:            profile.weight_lbs,
    arch_type:             profile.arch_type,
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
    is_beginner_mode:      data.is_beginner_mode,
    graduated_at:          data.graduated_at,
    quiz_completed_at:     data.quiz_completed_at,
    active_injury:         data.active_injury,
    injury_history:        data.injury_history ?? [],
    week_starting:         data.week_starting,
    graveyard_count:       data.graveyard_count ?? 0,
    created_at:            data.created_at,
    weight_lbs:            data.weight_lbs ?? 160,
    arch_type:             data.arch_type ?? null,
  };
}

// ── Closet shoes (favorites) ──────────────────────────────────────────────────

export async function pushCloset(shoeIds: string[]): Promise<void> {
  const userId = await uid();
  if (!userId) return;

  // Delete all then re-insert (simpler than diffing for small sets)
  await supabase.from('arsenal').delete().eq('user_id', userId);
  if (shoeIds.length === 0) return;
  await supabase.from('arsenal').insert(
    shoeIds.map(shoe_id => ({ user_id: userId, shoe_id }))
  );
}

export async function pullCloset(): Promise<string[]> {
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
    source:           run.source ?? 'manual',
    external_id:      run.external_id,
    strava_gear_id:   run.strava_gear_id,
    coordinates:      run.coordinates,
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
    source:          r.source,
    external_id:     r.external_id,
    strava_gear_id:  r.strava_gear_id,
    coordinates:     r.coordinates,
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

// ── Graveyard (retired shoes) ────────────────────────────────────────────────

export async function pushObituary(obit: ShoeObituary): Promise<void> {
  const userId = await uid();
  if (!userId) return;
  await supabase.from('obituaries').upsert({
    user_id:          userId,
    shoe_id:          obit.shoe_id,
    brand:            obit.brand,
    model:            obit.model,
    total_miles:      obit.total_miles,
    days_in_service:  obit.days_in_service,
    added_date:       obit.added_date,
    retired_at:       obit.retired_date,
    memorable_run:    obit.memorable_run,
    best_moment:      obit.best_moment,
    rating:           obit.rating,
    would_buy_again:  obit.would_buy_again,
    epitaph:          obit.epitaph,
  }, { onConflict: 'user_id,shoe_id' });
}

export async function pullObituaries(): Promise<ShoeObituary[]> {
  const userId = await uid();
  if (!userId) return [];
  const { data } = await supabase
    .from('obituaries')
    .select('*')
    .eq('user_id', userId)
    .order('retired_at', { ascending: false });
  if (!data) return [];
  return data.map((r: any): ShoeObituary => ({
    shoe_id:         r.shoe_id,
    brand:           r.brand ?? '',
    model:           r.model ?? '',
    retired_date:    r.retired_at ? new Date(r.retired_at).toISOString().slice(0, 10) : '',
    total_miles:     r.total_miles ?? 0,
    days_in_service: r.days_in_service ?? 0,
    added_date:      r.added_date ?? '',
    memorable_run:   r.memorable_run ?? '',
    best_moment:     r.best_moment ?? '',
    rating:          r.rating ?? 4,
    would_buy_again: r.would_buy_again ?? true,
    epitaph:         r.epitaph ?? '',
  }));
}

// ── Full initial sync (call once after login) ─────────────────────────────────
/**
 * Merges cloud data into local storage after sign-in.
 * Cloud profile + closet overwrite local (cloud is source of truth for settings).
 * Cloud runs are merged with local runs by ID (no duplicates).
 */
export async function initialSync(): Promise<void> {
  const userId = await uid();
  if (!userId) return;

  const [cloudProfile, cloudCloset, cloudRuns, cloudObituaries] = await Promise.all([
    pullProfile(),
    pullCloset(),
    pullRuns(),
    pullObituaries(),
  ]);

  const { getUserProfile, saveUserProfile } = await import('../utils/userProfile');
  const { getFavorites, addToFavorites }    = await import('../utils/storage');
  const { getRuns, saveRun }               = await import('../utils/runStorage');
  const { getGraveyard, addToGraveyard }   = await import('../utils/obituaryStorage');

  // Merge profile — cloud wins for settings, max wins for additive counters
  if (cloudProfile) {
    const local = await getUserProfile();
    const merged = { ...local, ...cloudProfile };
    merged.lifetime_miles = Math.max(local.lifetime_miles, cloudProfile.lifetime_miles ?? 0);
    merged.graveyard_count = Math.max(local.graveyard_count, cloudProfile.graveyard_count ?? 0);
    await saveUserProfile(merged);
  }

  // Merge closet — cloud wins (add any cloud shoe not already local)
  if (cloudCloset.length > 0) {
    const localCloset = await getFavorites();
    const toAdd = cloudCloset.filter(id => !localCloset.includes(id));
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

  // Merge graveyard — union by shoe_id
  if (cloudObituaries.length > 0) {
    const localGraveyard = await getGraveyard();
    const localIds = new Set(localGraveyard.map(o => o.shoe_id));
    for (const obit of cloudObituaries) {
      if (!localIds.has(obit.shoe_id)) await addToGraveyard(obit);
    }
  }
}
