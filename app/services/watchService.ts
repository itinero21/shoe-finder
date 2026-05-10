/**
 * watchService — Unified Apple Watch + Garmin status and sync
 *
 * Apple Watch path:
 *   Watch records workout → syncs to iPhone HealthKit → Stride reads via healthService
 *   Detection: we tag imported workouts with source='apple_health' and scan sourceName
 *
 * Garmin path:
 *   No public Garmin API for indie apps. Bridge = Garmin Connect → Strava → Stride.
 *   We guide users through 3 setup steps and persist which steps they've completed.
 *   Once Strava is connected, every Garmin run auto-appears.
 *
 * Deep links:
 *   iOS Garmin Connect: itms-apps://apps.apple.com/app/id583446403 (App Store)
 *   Android:           market://details?id=com.garmin.android.apps.connectmobile
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
import {
  getHealthPermStatus,
  requestHealthPermission,
  syncHealthWorkouts,
} from './healthService';
import { getStravaTokens, syncStravaActivities } from './stravaService';
import { getRuns } from '../utils/runStorage';

const GARMIN_STEPS_KEY          = 'stride_garmin_steps_v2';
const APPLE_WATCH_DETECTED_KEY  = 'stride_aw_detected_v1';
const WATCH_LAST_SYNC_KEY       = 'stride_watch_sync_ts_v1';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WatchStatus {
  // Apple Watch
  healthAuthorized:     boolean;
  appleWatchDetected:   boolean;  // saw "Apple Watch" as HealthKit source
  appleWatchRunCount:   number;   // runs imported from Apple Health
  // Garmin
  garminSteps:          [boolean, boolean, boolean]; // [stravaLinked, garminConnectOpened, autoUploadOn]
  garminViaStrava:      boolean;  // Strava token present
  garminRunCount:       number;   // runs whose shoeId came via Strava
  // Combined
  lastSyncDate:         string | null;
  totalWatchRuns:       number;
}

export interface WatchSyncResult {
  appleImported:   number;
  garminImported:  number;
  totalImported:   number;
  error?:          string;
}

// ─── Apple Watch detection ─────────────────────────────────────────────────

/**
 * Returns true if we've ever seen a HealthKit workout from "Apple Watch" source.
 * Persists the positive result so we don't re-scan every time.
 */
export async function detectAppleWatchSource(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;

  const cached = await AsyncStorage.getItem(APPLE_WATCH_DETECTED_KEY);
  if (cached === 'true') return true;

  const allRuns = await getRuns();
  const fromWatch = allRuns.some(r =>
    r.source === 'apple_health' && r.external_id?.startsWith('healthkit_')
  );
  if (fromWatch) {
    await AsyncStorage.setItem(APPLE_WATCH_DETECTED_KEY, 'true');
  }
  return fromWatch;
}

/** Force-clear the Apple Watch detected flag (e.g. after disconnect) */
export async function clearAppleWatchDetected(): Promise<void> {
  await AsyncStorage.removeItem(APPLE_WATCH_DETECTED_KEY);
}

// ─── Garmin setup steps ────────────────────────────────────────────────────

/**
 * 3-step Garmin setup progress.
 * Steps: 0=Connect Strava, 1=Open Garmin Connect app, 2=Enable Auto-Upload
 */
export async function getGarminSteps(): Promise<[boolean, boolean, boolean]> {
  try {
    const raw = await AsyncStorage.getItem(GARMIN_STEPS_KEY);
    if (!raw) return [false, false, false];
    const arr = JSON.parse(raw) as boolean[];
    return [arr[0] ?? false, arr[1] ?? false, arr[2] ?? false];
  } catch {
    return [false, false, false];
  }
}

export async function setGarminStep(index: 0 | 1 | 2, done: boolean): Promise<void> {
  const steps = await getGarminSteps();
  steps[index] = done;
  await AsyncStorage.setItem(GARMIN_STEPS_KEY, JSON.stringify(steps));
}

export async function resetGarminSteps(): Promise<void> {
  await AsyncStorage.removeItem(GARMIN_STEPS_KEY);
}

// ─── Deep links ───────────────────────────────────────────────────────────

/** Open Garmin Connect app, or fall back to the App Store / Play Store */
export async function openGarminConnect(): Promise<void> {
  // Try the Garmin Connect URL scheme first
  const appScheme = 'garmin://';
  const canOpen = await Linking.canOpenURL(appScheme).catch(() => false);

  if (canOpen) {
    await Linking.openURL(appScheme).catch(() => {});
    return;
  }

  // Fallback: App Store / Play Store
  const storeUrl = Platform.OS === 'ios'
    ? 'itms-apps://apps.apple.com/app/id583446403'
    : 'market://details?id=com.garmin.android.apps.connectmobile';

  const canOpenStore = await Linking.canOpenURL(storeUrl).catch(() => false);
  if (canOpenStore) {
    await Linking.openURL(storeUrl).catch(() => {});
  } else {
    // Last resort: https
    await Linking.openURL(
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/app/id583446403'
        : 'https://play.google.com/store/apps/details?id=com.garmin.android.apps.connectmobile'
    ).catch(() => {});
  }
}

/** Open Strava in app or App Store */
export async function openStravaApp(): Promise<void> {
  const scheme = 'strava://';
  const canOpen = await Linking.canOpenURL(scheme).catch(() => false);
  if (canOpen) {
    await Linking.openURL(scheme).catch(() => {});
    return;
  }
  const storeUrl = Platform.OS === 'ios'
    ? 'itms-apps://apps.apple.com/app/id426826309'
    : 'market://details?id=com.strava';
  const canStore = await Linking.canOpenURL(storeUrl).catch(() => false);
  await Linking.openURL(
    canStore ? storeUrl
    : Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/id426826309'
      : 'https://play.google.com/store/apps/details?id=com.strava'
  ).catch(() => {});
}

// ─── Combined status ──────────────────────────────────────────────────────

export async function getWatchStatus(): Promise<WatchStatus> {
  const [
    healthPerm,
    awDetected,
    stravaTokens,
    garminSteps,
    allRuns,
  ] = await Promise.all([
    getHealthPermStatus(),
    detectAppleWatchSource(),
    getStravaTokens(),
    getGarminSteps(),
    getRuns(),
  ]);

  const lastSyncRaw  = await AsyncStorage.getItem(WATCH_LAST_SYNC_KEY);
  const lastSyncDate = lastSyncRaw ? new Date(parseInt(lastSyncRaw, 10)).toISOString() : null;

  const appleRuns  = allRuns.filter(r => r.source === 'apple_health').length;
  const stravaRuns = allRuns.filter(r => r.source === 'strava').length;
  const garminVia  = !!stravaTokens?.access_token;

  // Step 0 (Strava connected) auto-updates from live token
  const effectiveSteps: [boolean, boolean, boolean] = [
    garminVia,
    garminSteps[1],
    garminSteps[2],
  ];

  return {
    healthAuthorized:   healthPerm === 'authorized',
    appleWatchDetected: awDetected,
    appleWatchRunCount: appleRuns,
    garminSteps:        effectiveSteps,
    garminViaStrava:    garminVia,
    garminRunCount:     stravaRuns,
    lastSyncDate,
    totalWatchRuns:     appleRuns + stravaRuns,
  };
}

// ─── Sync ─────────────────────────────────────────────────────────────────

/** Sync Apple Watch (via HealthKit) */
export async function syncAppleWatch(): Promise<{ imported: number; skipped: number; error?: string }> {
  if (Platform.OS !== 'ios') return { imported: 0, skipped: 0, error: 'iOS only' };

  const perm = await getHealthPermStatus();
  if (perm !== 'authorized') {
    const newPerm = await requestHealthPermission();
    if (newPerm !== 'authorized') return { imported: 0, skipped: 0, error: 'HealthKit permission denied' };
  }

  const result = await syncHealthWorkouts();

  // Update last sync timestamp
  await AsyncStorage.setItem(WATCH_LAST_SYNC_KEY, String(Date.now()));

  // Re-detect Apple Watch source after sync
  await clearAppleWatchDetected();
  await detectAppleWatchSource();

  return result;
}

/** Sync Garmin (via Strava bridge) */
export async function syncGarmin(): Promise<{ imported: number; skipped: number; error?: string }> {
  const tokens = await getStravaTokens();
  if (!tokens) return { imported: 0, skipped: 0, error: 'Strava not connected' };

  const result = await syncStravaActivities();
  if (!result.error) {
    await AsyncStorage.setItem(WATCH_LAST_SYNC_KEY, String(Date.now()));
  }
  return result;
}

/** Sync both Apple Watch + Garmin in parallel */
export async function syncAllWatches(): Promise<WatchSyncResult> {
  const [aw, garmin] = await Promise.all([
    Platform.OS === 'ios' ? syncAppleWatch() : Promise.resolve({ imported: 0, skipped: 0, error: undefined }),
    syncGarmin(),
  ]);

  const errors = [aw.error, garmin.error].filter(Boolean);
  return {
    appleImported:  aw.imported,
    garminImported: garmin.imported,
    totalImported:  aw.imported + garmin.imported,
    error:          errors.length > 0 ? errors.join(' · ') : undefined,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Human-readable relative time, e.g. "2 min ago", "yesterday", "3 days ago" */
export function relativeSyncTime(isoDate: string | null): string {
  if (!isoDate) return 'Never synced';
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  1) return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  === 1) return 'Yesterday';
  return `${days} days ago`;
}
