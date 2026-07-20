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
 *   - Add URI scheme "shoefinder" to app.json for deep-link redirect
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { saveRun , getRuns } from '../utils/runStorage';
import { addMiles } from '../utils/userProfile';
import { Run, RunTerrain, RunPurpose } from '../types/run';
import { ALL_TRACKABLE_SHOES as SHOES } from '../data/shoes';
import { Coordinate } from '../types/territory';
import { calcMatchQuality } from '../utils/matchQuality';

WebBrowser.maybeCompleteAuthSession();

// ── Config ────────────────────────────────────────────────────────────────────
const CLIENT_ID     = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET ?? '';
const REDIRECT_URI  = 'shoefinder://strava-callback';

const TOKEN_KEY    = 'stride_strava_tokens_v1';
const LAST_SYNC    = 'stride_strava_last_sync_v1';
const GEAR_MAP_KEY = 'stride_strava_gear_map_v1'; // { stravaGearId: arsenalShoeId }

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
  await AsyncStorage.removeItem(GEAR_MAP_KEY);
}

// ── Gear map (Strava gear ID ↔ Closet shoe ID) ────────────────────────────────
export async function saveGearMap(map: Record<string, string>): Promise<void> {
  await AsyncStorage.setItem(GEAR_MAP_KEY, JSON.stringify(map));
}

export async function getGearMap(): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(GEAR_MAP_KEY);
  return raw ? JSON.parse(raw) : {};
}

/**
 * Given a Closet shoe ID, returns the Strava gear ID it maps to (if any).
 * Used when uploading a run to attach the right shoe on Strava.
 */
export async function getStravaGearIdForShoe(shoeId: string): Promise<string | undefined> {
  const map = await getGearMap();
  // map is { stravaGearId: arsenalShoeId } — we need the reverse
  return Object.keys(map).find(gearId => map[gearId] === shoeId);
}

export function isStravaConnected(tokens: StravaTokens | null): boolean {
  return !!tokens?.access_token;
}

// ── OAuth URL ─────────────────────────────────────────────────────────────────
export function getStravaAuthUrl(): string {
  // On Android, use web authorize (not mobile/authorize) because
  // mobile/authorize routes through the Strava app which can't handle
  // custom scheme redirects and shows "Request Failed"
  const endpoint = Platform.OS === 'android'
    ? 'https://www.strava.com/oauth/authorize'
    : 'https://www.strava.com/oauth/mobile/authorize';

  const url = endpoint
    + `?client_id=${CLIENT_ID}`
    + `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
    + `&response_type=code`
    + `&approval_prompt=auto`
    // profile:read_all is required to read the athlete's gear (shoes + mileage)
    + `&scope=read,profile:read_all,activity:read_all,activity:write`;
  console.log('[Strava] Platform:', Platform.OS);
  console.log('[Strava] Auth URL:', url);
  return url;
}

// ── Full OAuth flow ──────────────────────────────────────────────────────────
// Opens Strava auth page. After user authorizes, Strava redirects to
// shoefinder://strava-callback?code=XXX which is caught by _layout.tsx
// deep link handler and exchanged there.
//
// On iOS: openAuthSessionAsync may catch the redirect directly.
// On Android: the deep link handler in _layout.tsx always handles it.
export async function connectStrava(): Promise<StravaTokens | null> {
  try {
    const authUrl = getStravaAuthUrl();

    const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);
    console.log('[Strava] WebBrowser result type:', result.type);

    // iOS typically returns 'success' with the callback URL
    if (result.type === 'success' && result.url) {
      console.log('[Strava] Got callback URL from WebBrowser:', result.url.slice(0, 60));
      const code = getParam(result.url, 'code');
      const error = getParam(result.url, 'error');
      if (error || !code) return null;
      return exchangeStravaCode(code);
    }

    // Android: browser returns 'cancel' or 'dismiss' — this is NORMAL.
    // The deep link handler in _layout.tsx will catch the callback URL
    // and call exchangeStravaCode + show success alert.
    // Return 'pending' signal — don't show error.
    if (result.type === 'cancel' || result.type === 'dismiss') {
      console.log('[Strava] Browser closed — waiting for deep link handler');
      // Wait briefly then check if tokens were saved by the deep link handler
      await new Promise(r => setTimeout(r, 4000));
      const tokens = await getStravaTokens();
      if (tokens?.access_token) {
        console.log('[Strava] Tokens found after deep link handler processed');
        return tokens;
      }
    }

    return null;
  } catch (e: any) {
    console.error('[Strava] Connect error:', e?.message);
    return null;
  }
}

function getParam(url: string, key: string): string | null {
  const match = url.match(new RegExp(`[?&]${key}=([^&]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ── Exchange code for tokens ──────────────────────────────────────────────────
export async function exchangeStravaCode(code: string): Promise<StravaTokens | null> {
  try {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('[Strava] Missing CLIENT_ID or CLIENT_SECRET env vars');
      return null;
    }
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
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[Strava] Token exchange failed:', res.status, errText.slice(0, 200));
      return null;
    }
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
    if (!CLIENT_SECRET) return null;
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
  /** Optional: map Strava gear_id → Closet shoe_id */
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
    for (const act of activities) {
      if (!['Run', 'TrailRun', 'VirtualRun'].includes(act.type)) continue;
      const externalId = `strava_${act.id}`;
      if (existingIds.has(externalId)) { skipped++; continue; }

      const distKm = act.distance / 1000;
      if (distKm < 0.5) { skipped++; continue; }

      const { terrain, purpose } = mapStravaType(act.type, act.workout_type ?? 0);
      const shoeId = gearMap[act.gear_id] ?? '';
      const durationMin = act.moving_time ? Math.round(act.moving_time / 60) : undefined;

      // Compute real match quality if shoe is in the Closet
      const shoe = shoeId ? SHOES.find(s => s.id === shoeId) : undefined;
      const mq = shoe ? calcMatchQuality(shoe, terrain, purpose, distKm) : 'neutral';

      // Fetch GPS coordinates for route history.
      let coordinates: Coordinate[] | undefined;
      try {
        const gps = await fetchActivityGPS(String(act.id));
        if (gps.length >= 5) coordinates = gps;
      } catch { /* non-fatal — run saved without GPS */ }

      const run: Run = {
        id: `run_strava_${act.id}`,
        shoeId,
        distanceKm: distKm,
        date: act.start_date_local ?? act.start_date,
        terrain,
        purpose,
        durationMinutes: durationMin,
        match_quality: mq,
        source: 'strava',
        external_id: externalId,
        strava_gear_id: act.gear_id ?? undefined,
        coordinates,
      };

      await saveRun(run);

      const miles = distKm * 0.621371;
      totalMilesAdded += miles;
      imported++;
    }

    if (totalMilesAdded > 0) await addMiles(totalMilesAdded);
    await AsyncStorage.setItem(LAST_SYNC, String(Math.floor(Date.now() / 1000)));

    return { imported, skipped };
  } catch (e: any) {
    return { imported: 0, skipped: 0, error: e?.message ?? 'Unknown error' };
  }
}

// ── GPS streams ──────────────────────────────────────────────────────────────

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
  // GPS fetch is done lazily so normal activity sync stays quick.
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

    // Look up the Strava gear ID for the shoe used in this run
    const stravaGearId = run.strava_gear_id
      ?? (run.shoeId ? await getStravaGearIdForShoe(run.shoeId) : undefined);

    const dateLabel = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const body: Record<string, unknown> = {
      name:             `Stride Run · ${dateLabel}`,
      type:             sportType,
      sport_type:       sportType,
      start_date_local: startDate.toISOString(),
      elapsed_time:     durationSecs,
      distance:         Math.round(run.distanceKm * 1000), // Strava expects metres
      description:      run.notes ?? '',
      trainer:          run.terrain === 'treadmill' ? 1 : 0,
    };

    // Include gear_id so Strava attributes mileage to the correct shoe
    if (stravaGearId) body.gear_id = stravaGearId;

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

// ── Background auto-sync ──────────────────────────────────────────────────────
// Once connected, Strava stays connected (refresh tokens) and STRIDE keeps
// itself current without the user pressing SYNC: at most once per hour, on
// app-surface focus, new activities are pulled with the gear map applied.

const LAST_AUTOSYNC = 'stride_strava_last_autosync';
const AUTOSYNC_MIN_INTERVAL_MS = 60 * 60 * 1000;

export async function autoSyncStrava(): Promise<SyncResult | null> {
  const tokens = await getStravaTokens();
  if (!tokens?.access_token) return null;
  const last = await AsyncStorage.getItem(LAST_AUTOSYNC);
  if (last && Date.now() - parseInt(last, 10) < AUTOSYNC_MIN_INTERVAL_MS) return null;
  await AsyncStorage.setItem(LAST_AUTOSYNC, String(Date.now()));
  const gearMap = await getGearMap();
  return syncStravaActivities(gearMap).catch(() => null);
}

// ── Strava gear list (athlete's shoes + lifetime mileage) ─────────────────────
export interface StravaGear {
  id: string;
  name: string;
  distance_km: number;
  primary: boolean;
  retired: boolean;
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
      name: g.nickname || g.name,
      distance_km: (g.distance ?? 0) / 1000,
      primary: !!g.primary,
      retired: !!g.retired,
    }));
  } catch { return []; }
}

// ── Match Strava gear names to the STRIDE catalog ─────────────────────────────

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Best catalog match for a Strava gear name like "Nike Pegasus 41" or
 * "HOKA Clifton 10". Requires the brand plus at least one meaningful model
 * token to appear in the gear name — a weak match returns null rather than
 * guessing wrong.
 */
export function matchGearToCatalog<T extends { id: string; brand: string; model: string }>(
  gearName: string,
  catalog: T[],
): T | null {
  const g = ` ${norm(gearName)} `;
  let best: T | null = null;
  let bestScore = 0;

  for (const shoe of catalog) {
    const brand = norm(shoe.brand);
    const brandHit = g.includes(` ${brand} `) || (brand === 'new balance' && / nb /.test(g));
    const modelTokens = norm(shoe.model).split(' ').filter(t => t.length > 1 || /\d/.test(t));
    const hits = modelTokens.filter(t => g.includes(` ${t} `)).length;
    if (hits === 0) continue;

    const allModelTokens = hits === modelTokens.length;
    let score = hits * 2 + (brandHit ? 3 : 0) + (allModelTokens ? 4 : 0);
    // A model match without brand needs to be complete to count
    if (!brandHit && !allModelTokens) score = 0;
    if (score > bestScore) { bestScore = score; best = shoe; }
  }
  return bestScore >= 5 ? best : null;
}
