/**
 * Apple Health / Google Fit integration service.
 *
 * Uses react-native-health (iOS) and react-native-google-fit (Android).
 * Install:
 *   npx expo install react-native-health        (iOS only — needs bare workflow)
 *   npx expo install @kingstinct/react-native-healthkit  (Expo-compatible alternative)
 *
 * For managed Expo workflow, use expo-health (limited) or switch to bare.
 * This file provides the full integration logic, stubbed where native modules
 * are not yet installed — swap the stub blocks for real imports.
 *
 * Capabilities:
 *  - Request running workout permission
 *  - Pull workouts from last N days
 *  - Auto-attribute mileage to the correct Arsenal shoe by date
 *  - Sync to runStorage + userProfile
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { saveRun } from '../utils/runStorage';
import { getRuns } from '../utils/runStorage';
import { addMiles, addXP, getUserProfile } from '../utils/userProfile';
import { Run, RunTerrain, RunPurpose } from '../types/run';

const HEALTH_LAST_SYNC = 'stride_health_last_sync_v1';
const HEALTH_ENABLED   = 'stride_health_enabled_v1';

// ── Permission status ─────────────────────────────────────────────────────────
export type HealthPermStatus = 'not_requested' | 'authorized' | 'denied' | 'unavailable';

export async function getHealthPermStatus(): Promise<HealthPermStatus> {
  if (Platform.OS !== 'ios') return 'unavailable';
  const val = await AsyncStorage.getItem(HEALTH_ENABLED);
  if (val === 'authorized') return 'authorized';
  if (val === 'denied') return 'denied';
  return 'not_requested';
}

/**
 * Request HealthKit workout read permission.
 * In production: replace stub with AppleHealthKit.initHealthKit() call.
 */
export async function requestHealthPermission(): Promise<HealthPermStatus> {
  if (Platform.OS !== 'ios') return 'unavailable';

  // ── Production: uncomment when react-native-health is installed ─────────────
  // const AppleHealthKit = require('react-native-health').default;
  // const permissions = { permissions: { read: [AppleHealthKit.Constants.Permissions.Workout] } };
  // return new Promise((resolve) => {
  //   AppleHealthKit.initHealthKit(permissions, (err: any) => {
  //     if (err) { AsyncStorage.setItem(HEALTH_ENABLED, 'denied'); resolve('denied'); }
  //     else     { AsyncStorage.setItem(HEALTH_ENABLED, 'authorized'); resolve('authorized'); }
  //   });
  // });
  // ────────────────────────────────────────────────────────────────────────────

  // Stub: simulate grant (remove when real SDK is in)
  await AsyncStorage.setItem(HEALTH_ENABLED, 'authorized');
  return 'authorized';
}

// ── Workout data shape (normalised from HealthKit) ────────────────────────────
interface HealthWorkout {
  id: string;
  startDate: string;
  distanceMeters: number;
  durationSeconds: number;
  activityType: 'running' | 'walking' | 'hiking' | 'cycling';
}

/**
 * Pull recent running workouts from HealthKit.
 * In production: replace stub with AppleHealthKit.getSamples() call.
 */
async function fetchHealthWorkouts(afterDate: Date): Promise<HealthWorkout[]> {
  if (Platform.OS !== 'ios') return [];

  // ── Production: uncomment when react-native-health is installed ─────────────
  // const AppleHealthKit = require('react-native-health').default;
  // const HKWorkoutActivityType = AppleHealthKit.Constants.Activities;
  // return new Promise((resolve) => {
  //   const opts = { startDate: afterDate.toISOString(), limit: 200, ascending: false };
  //   AppleHealthKit.getSamples({ ...opts, type: 'Workout' }, (err: any, results: any[]) => {
  //     if (err) { resolve([]); return; }
  //     resolve(results
  //       .filter(r => [HKWorkoutActivityType.Running, HKWorkoutActivityType.Walking].includes(r.activityType))
  //       .map(r => ({
  //         id: r.id,
  //         startDate: r.startDate,
  //         distanceMeters: r.distance * 1000,
  //         durationSeconds: r.duration,
  //         activityType: r.activityType === HKWorkoutActivityType.Running ? 'running' : 'walking',
  //       }))
  //     );
  //   });
  // });
  // ────────────────────────────────────────────────────────────────────────────

  // Stub: return empty (remove when real SDK is in)
  return [];
}

// ── Map Health workout to Stride run type ──────────────────────────────────────
function mapHealthActivity(type: HealthWorkout['activityType']): { purpose: RunPurpose; terrain: RunTerrain } {
  switch (type) {
    case 'running': return { purpose: 'easy', terrain: 'road' };
    case 'walking': return { purpose: 'walk', terrain: 'road' };
    case 'hiking':  return { purpose: 'walk', terrain: 'trail' };
    default:        return { purpose: 'easy', terrain: 'road' };
  }
}

// ── Main sync ─────────────────────────────────────────────────────────────────
export interface HealthSyncResult {
  imported: number;
  skipped: number;
  error?: string;
}

export async function syncHealthWorkouts(
  /** Map date string (YYYY-MM-DD) → Arsenal shoe_id for auto-attribution */
  rosterByDate: Record<string, string> = {}
): Promise<HealthSyncResult> {
  const status = await getHealthPermStatus();
  if (status !== 'authorized') return { imported: 0, skipped: 0, error: 'HealthKit not authorized' };

  const lastSyncRaw = await AsyncStorage.getItem(HEALTH_LAST_SYNC);
  const afterDate = lastSyncRaw
    ? new Date(parseInt(lastSyncRaw, 10))
    : new Date(Date.now() - 90 * 86400 * 1000);

  const workouts = await fetchHealthWorkouts(afterDate);
  if (workouts.length === 0) return { imported: 0, skipped: 0 };

  const existingRuns = await getRuns();
  const existingIds = new Set(existingRuns.map(r => r.external_id).filter(Boolean));

  let imported = 0;
  let skipped  = 0;
  let totalMiles = 0;

  for (const w of workouts) {
    const externalId = `healthkit_${w.id}`;
    if (existingIds.has(externalId)) { skipped++; continue; }

    const distKm = w.distanceMeters / 1000;
    if (distKm < 0.3) { skipped++; continue; }

    const dateKey = w.startDate.slice(0, 10);
    const shoeId  = rosterByDate[dateKey] ?? '';
    const { purpose, terrain } = mapHealthActivity(w.activityType);

    const run: Run = {
      id: `run_health_${w.id}`,
      shoeId,
      distanceKm: distKm,
      date: w.startDate,
      terrain,
      purpose,
      durationMinutes: Math.round(w.durationSeconds / 60),
      match_quality: 'neutral',
      xp_earned: 0,
      source: 'apple_health',
      external_id: externalId,
    };

    await saveRun(run);
    totalMiles += distKm * 0.621371;
    imported++;
  }

  if (totalMiles > 0) await addMiles(totalMiles);
  await AsyncStorage.setItem(HEALTH_LAST_SYNC, String(Date.now()));

  return { imported, skipped };
}

// ── Garmin note ───────────────────────────────────────────────────────────────
/**
 * Garmin Connect does not have a public REST API for third-party apps.
 * The supported integration path is:
 *   1. User connects Garmin → Strava sync (Garmin has native Strava export)
 *   2. Stride pulls from Strava — Garmin activities appear automatically
 *
 * A direct Garmin SDK exists (Garmin Connect IQ) but only runs on-watch.
 * For a full Garmin integration, use the Garmin Health API (enterprise only).
 *
 * Recommended: prompt user to enable the Garmin → Strava auto-sync,
 * then pull via stravaService.syncStravaActivities().
 */
export const GARMIN_INTEGRATION_NOTE =
  'Garmin syncs automatically via Strava. Enable "Auto-upload to Strava" in Garmin Connect → Settings → Partner Apps.';
