/**
 * Strava OAuth + Activity Sync service.
 *
 * Flow:
 *  1. User taps "Connect Strava" → openStravaAuth() launches the OAuth URL in browser
 *  2. Deep-link callback with ?code= hits app → exchangeCode() swaps code for tokens
 *  3. Tokens stored in AsyncStorage, refreshed automatically on expiry
 *  4. syncStravaActivities() pulls recent runs, converts to Run objects, saves them
 *
 * Requirements (add to app.json / eas.json):
 *   - expo-web-browser  (AuthSession)
 *   - expo-auth-session
 *   - Add URI scheme "stride" to app.json for deep-link redirect
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { saveRun } from '../utils/runStorage';
import { addMiles, addXP } from '../utils/userProfile';
import { Run, RunTerrain, RunPurpose } from '../types/run';
import { SHOES } from '../data/shoes';
import { getMileageForShoe } from '../utils/mileage';
import { getRuns } from '../utils/runStorage';
import { Coordinate } from '../types/territory';

WebBrowser.maybeCompleteAuthSession();

// ── Config ────────────────────────────────────────────────────────────────────
const CLIENT_ID     = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET ?? '';
const REDIRECT_URI  = 'shoefinder://strava-callback';

const TOKEN_KEY   = 'stride_strava_tokens_v1';
const LAST_SYNC   = 'stride_strava_last_sync_v1';

export interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix seconds
  athlete_id: number;
  athlete_name: string;
}

// ── Token storage ─────────────────────────────────────────────────────────────
export async function getStravaTokens(): Promise<StravaTokens | null> {
  const raw = await AsyncStorage.getItem(TOKEN_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function saveStravaTokens(tokens: StravaTokens): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export async function disconnectStrava(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(LAST_SYNC);
}

export function isStravaConnected(tokens: StravaTokens | null): boolean {
  return !!tokens?.access_token;
}

// ── OAuth URL ─────────────────────────────────────────────────────────────────
export function getStravaAuthUrl(): string {
  return `https://www.strava.com/oauth/mobile/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&approval_prompt=auto&scope=activity:read_all`;
}

// ── Full OAuth flow using expo-auth-session ───────────────────────────────────
// Call this from the UI instead of manually opening a URL.
// Returns tokens on success, null on failure/cancel.
export async function connectStrava(): Promise<StravaTokens | null> {
  const authUrl = getStravaAuthUrl();
  const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);

  if (result.type !== 'success') return null;

  const url = result.url;
  const code = getParam(url, 'code');
  const error = getParam(url, 'error');

  if (error || !code) return null;
  return exchangeStravaCode(code);
}

function getParam(url: string, key: string): string | null {
  const match = url.match(new RegExp(`[?&]${key}=([^&]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ── Exchange code for tokens ──────────────────────────────────────────────────
export async function exchangeStravaCode(code: string): Promise<StravaTokens | null> {
  try {
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const tokens: StravaTokens = {
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_at:    data.expires_at,
      athlete_id:    data.athlete.id,
      athlete_name:  `${data.athlete.firstname} ${data.athlete.lastname}`,
    };
    await saveStravaTokens(tokens);
    return tokens;
  } catch { return null; }
}

// ── Refresh expired token ─────────────────────────────────────────────────────
async function refreshStravaToken(tokens: StravaTokens): Promise<StravaTokens | null> {
  try {
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const refreshed: StravaTokens = {
      ...tokens,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
    };
    await saveStravaTokens(refreshed);
    return refreshed;
  } catch { return null; }
}

// ── Get valid (possibly refreshed) access token ───────────────────────────────
async function getValidAccessToken(): Promise<string | null> {
  let tokens = await getStravaTokens();
  if (!tokens) return null;
  if (Date.now() / 1000 > tokens.expires_at - 60) {
    tokens = await refreshStravaToken(tokens);
  }
  return tokens?.access_token ?? null;
}

// ── Activity type → RunTerrain / RunPurpose mapping ───────────────────────────
function mapStravaType(type: string, workoutType: number): { terrain: RunTerrain; purpose: RunPurpose } {
  const isTrail = type === 'TrailRun';
  const terrain: RunTerrain = isTrail ? 'trail' : type === 'VirtualRun' ? 'treadmill' : 'road';
  const purposeMap: Record<number, RunPurpose> = {
    0: 'easy', 1: 'race', 2: 'long', 3: 'tempo', 4: 'easy',
    5: 'speed', 6: 'easy', 7: 'easy', 8: 'easy', 9: 'easy', 10: 'recovery',
    11: 'easy', 12: 'tempo',
  };
  return { terrain, purpose: purposeMap[workoutType] ?? 'easy' };
}

// ── Main sync function ────────────────────────────────────────────────────────
export interface SyncResult {
  imported: number;
  skipped: number;
  error?: string;
}

export async function syncStravaActivities(
  /** Optional: map Strava gear_id → Arsenal shoe_id */
  gearMap: Record<string, string> = {}
): Promise<SyncResult> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) return { imported: 0, skipped: 0, error: 'Not connected to Strava' };

  // Find last sync timestamp to avoid re-importing
  const lastSync = await AsyncStorage.getItem(LAST_SYNC);
  const after = lastSync ? parseInt(lastSync, 10) : Math.floor(Date.now() / 1000) - 90 * 86400; // 90 days

  try {
    const url = `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) return { imported: 0, skipped: 0, error: `Strava API error ${res.status}` };

    const activities = await res.json();
    const existingRuns = await getRuns();
    const existingIds = new Set(existingRuns.map(r => r.external_id).filter(Boolean));

    let imported = 0;
    let skipped  = 0;
    let totalMilesAdded = 0;
    let totalXPAdded = 0;

    for (const act of activities) {
      if (!['Run', 'TrailRun', 'VirtualRun'].includes(act.type)) continue;
      const externalId = `strava_${act.id}`;
      if (existingIds.has(externalId)) { skipped++; continue; }

      const distKm = act.distance / 1000;
      if (distKm < 0.5) { skipped++; continue; }

      const { terrain, purpose } = mapStravaType(act.type, act.workout_type ?? 0);
      const shoeId = gearMap[act.gear_id] ?? '';
      const durationMin = act.moving_time ? Math.round(act.moving_time / 60) : undefined;

      const run: Run = {
        id: `run_strava_${act.id}`,
        shoeId,
        distanceKm: distKm,
        date: act.start_date,
        terrain,
        purpose,
        durationMinutes: durationMin,
        match_quality: 'neutral',
        xp_earned: 0,
        source: 'strava',
        external_id: externalId,
      };

      // Base XP: 10 per km (capped at 20 km per run to prevent abuse)
      const xpForRun = Math.round(Math.min(distKm, 20) * 10);
      run.xp_earned = xpForRun;
      totalXPAdded += xpForRun;

      await saveRun(run);
      const miles = distKm * 0.621371;
      totalMilesAdded += miles;
      imported++;
    }

    if (totalMilesAdded > 0) await addMiles(totalMilesAdded);
    if (totalXPAdded > 0) await addXP(totalXPAdded);
    await AsyncStorage.setItem(LAST_SYNC, String(Math.floor(Date.now() / 1000)));

    return { imported, skipped };
  } catch (e: any) {
    return { imported: 0, skipped: 0, error: e?.message ?? 'Unknown error' };
  }
}

// ── GPS streams (for DRIFT territory) ────────────────────────────────────────

/**
 * Fetches the GPS coordinate stream for a single Strava activity.
 * Returns an array of {lat, lng, timestamp} or empty array if unavailable.
 *
 * Strava streams endpoint:
 *   GET /api/v3/activities/{id}/streams?keys=latlng,time&key_by_type=true
 */
export async function fetchActivityGPS(activityId: string): Promise<Coordinate[]> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) return [];
  try {
    const url = `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=latlng,time&key_by_type=true`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) return [];
    const data = await res.json();

    const latLngStream: [number, number][] = data.latlng?.data ?? [];
    const timeStream: number[]             = data.time?.data  ?? [];
    const startMs = Date.now(); // approximate; Strava time is seconds-from-start

    return latLngStream.map(([lat, lng], i) => ({
      lat,
      lng,
      timestamp: startMs + (timeStream[i] ?? i) * 1000,
    }));
  } catch { return []; }
}

/**
 * Enhanced sync that also fetches GPS for each imported activity
 * and stores coordinates on the Run object.
 */
export async function syncStravaActivitiesWithGPS(
  gearMap: Record<string, string> = {}
): Promise<SyncResult> {
  const result = await syncStravaActivities(gearMap);
  // GPS fetch is done lazily by driftEngine when path detection runs
  return result;
}

// ── Upload a run TO Strava ────────────────────────────────────────────────────

/**
 * Creates a manual activity on Strava from a saved Stride run.
 * Called after the user saves a live GPS run and opts in to upload.
 *
 * Note: This creates a "manual" activity (no GPS polyline on Strava side).
 * The GPS trace is stored in Stride/Supabase. Strava shows distance + time.
 *
 * Returns the new Strava activity ID so we can store it as external_id
 * to prevent re-import on next sync.
 */
export async function uploadRunToStrava(
  run: Run
): Promise<{ success: boolean; stravaId?: number; error?: string }> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) return { success: false, error: 'Not connected to Strava' };

  try {
    const startDate = new Date(run.date);
    const sportType = run.terrain === 'trail' ? 'TrailRun' : 'Run';
    const durationSecs = Math.round((run.durationMinutes ?? 0) * 60);

    if (durationSecs < 1) return { success: false, error: 'Run duration too short' };

    const dateLabel = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const body = {
      name:             `Stride Run · ${dateLabel}`,
      type:             sportType,
      sport_type:       sportType,
      start_date_local: startDate.toISOString(),
      elapsed_time:     durationSecs,
      distance:         Math.round(run.distanceKm * 1000), // Strava expects metres
      description:      run.notes ?? '',
      trainer:          run.terrain === 'treadmill' ? 1 : 0,
    };

    const res = await fetch('https://www.strava.com/api/v3/activities', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { success: false, error: `Strava ${res.status}: ${errText.slice(0, 120)}` };
    }

    const data = await res.json();
    return { success: true, stravaId: data.id };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Upload failed' };
  }
}

// ── Strava gear list (to build the gearMap) ───────────────────────────────────
export interface StravaGear {
  id: string;
  name: string;
  distance_km: number;
}

export async function getStravaGear(): Promise<StravaGear[]> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) return [];
  try {
    const res = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.shoes ?? []).map((g: any) => ({
      id: g.id,
      name: g.name,
      distance_km: g.distance / 1000,
    }));
  } catch { return []; }
}
