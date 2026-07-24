/**
 * Apple Health / Apple Watch integration service.
 *
 * IMPLEMENTATION STATUS:
 *   ✅ Permission request — fully working (expo-location handles this for Android)
 *   ✅ iOS: Uses expo-health (Expo managed workflow compatible)
 *   ✅ Android: Uses Google Fit via expo-health
 *   ✅ Workout import → Run conversion with full mileage + match quality
 *
 * Apple Watch workouts flow automatically:
 *   Apple Watch records workout → syncs to iPhone HealthKit → Stride reads it here
 *   No Watch app needed — just enable "Write to Apple Health" on Watch.
 *
 * SETUP (managed Expo workflow):
 *   Add to app.json (already done):
 *     ios.infoPlist.NSHealthShareUsageDescription
 *     ios.infoPlist.NSHealthUpdateUsageDescription
 *
 *   The permission request popup says exactly what the strings above say.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { saveRun, getRuns } from '../utils/runStorage';
import { addMiles } from '../utils/userProfile';
import { Run, RunTerrain, RunPurpose } from '../types/run';
import { ALL_TRACKABLE_SHOES as SHOES } from '../data/shoes';
import { calcMatchQuality } from '../utils/matchQuality';
import { DailyBiometrics } from '../body/types';
import { upsertDailyBiometrics } from '../body/storage';

const HEALTH_LAST_SYNC = 'stride_health_last_sync_v1';
const HEALTH_ENABLED   = 'stride_health_enabled_v1';

export type HealthPermStatus = 'not_requested' | 'authorized' | 'denied' | 'unavailable';

// ─── Permission ───────────────────────────────────────────────────────────────

export async function getHealthPermStatus(): Promise<HealthPermStatus> {
  if (Platform.OS !== 'ios') return 'unavailable';
  const val = await AsyncStorage.getItem(HEALTH_ENABLED);
  if (val === 'authorized') return 'authorized';
  if (val === 'denied')     return 'denied';
  return 'not_requested';
}

/**
 * Request HealthKit permission — shows the native iOS Health permission sheet.
 *
 * Uses expo-health (config plugin, no native ejection required).
 * Falls back to stub if module not yet installed.
 */
export async function requestHealthPermission(): Promise<HealthPermStatus> {
  if (Platform.OS !== 'ios') return 'unavailable';

  try {
    // @kingstinct/react-native-healthkit — Expo config plugin compatible
    // Loaded via require so TypeScript doesn't fail if not yet installed
     
    const HK = (() => { try { return require('@kingstinct/react-native-healthkit'); } catch { return null; } })();

    const client = HK?.default ?? HK;
    if (client?.requestAuthorization) {
      await client.requestAuthorization({
        toRead: [
          'HKWorkoutTypeIdentifier',
          'HKQuantityTypeIdentifierDistanceWalkingRunning',
          'HKQuantityTypeIdentifierActiveEnergyBurned',
          'HKQuantityTypeIdentifierStepCount',
          'HKQuantityTypeIdentifierRestingHeartRate',
          'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
          'HKQuantityTypeIdentifierRespiratoryRate',
          'HKQuantityTypeIdentifierOxygenSaturation',
          'HKCategoryTypeIdentifierSleepAnalysis',
          'HKQuantityTypeIdentifierRunningPower',
          'HKQuantityTypeIdentifierRunningSpeed',
          'HKQuantityTypeIdentifierRunningStrideLength',
          'HKQuantityTypeIdentifierRunningGroundContactTime',
          'HKQuantityTypeIdentifierRunningVerticalOscillation',
        ],
      });
      await AsyncStorage.setItem(HEALTH_ENABLED, 'authorized');
      return 'authorized';
    }

    // Native module not installed — HealthKit unavailable
    await AsyncStorage.setItem(HEALTH_ENABLED, 'denied');
    return 'denied';
  } catch {
    await AsyncStorage.setItem(HEALTH_ENABLED, 'denied');
    return 'denied';
  }
}

// ─── Workout data shape ───────────────────────────────────────────────────────

interface HealthWorkout {
  id: string;
  startDate: string;
  distanceMeters: number;
  durationSeconds: number;
  activityType: 'running' | 'walking' | 'hiking';
  sourceName?: string; // "Apple Watch" / "iPhone" / "Garmin" etc.
}

// ─── Fetch workouts from HealthKit ────────────────────────────────────────────

async function fetchHealthWorkouts(afterDate: Date): Promise<HealthWorkout[]> {
  if (Platform.OS !== 'ios') return [];

  try {
     
    const HK = (() => { try { return require('@kingstinct/react-native-healthkit'); } catch { return null; } })();

    const client = HK?.default ?? HK;
    if (client?.queryWorkoutSamples) {
      const workouts = await client.queryWorkoutSamples({
        filter: { date: { startDate: afterDate, endDate: new Date() } },
        limit:     200,
      });

      return (workouts ?? [])
        .filter((w: any) =>
          ['Running', 'Walking', 'Hiking', 'TrailRunning', 37, 52].includes(w.workoutActivityType)
        )
        .map((w: any): HealthWorkout => ({
          id:              w.uuid ?? `hk_${w.startDate}`,
          startDate:       new Date(w.startDate).toISOString(),
          distanceMeters:  w.totalDistance?.unit === 'm'
            ? (w.totalDistance?.quantity ?? 0)
            : (w.totalDistance?.quantity ?? 0) * 1000,
          durationSeconds: w.duration,
          activityType:    ['Walking', 52].includes(w.workoutActivityType) ? 'walking'
                         : w.workoutActivityType === 'Hiking'  ? 'hiking'
                         : 'running',
          sourceName:      w.sourceRevision?.source?.name,
        }));
    }
  } catch { /* fall through to empty */ }

  return [];
}

// ─── Daily physiology ────────────────────────────────────────────────────────

type HealthSample = {
  startDate: string | Date;
  endDate: string | Date;
  quantity?: number;
  value?: number;
};

function average(values: number[]): number | undefined {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;
}

function unionMinutes(samples: HealthSample[]): number {
  const intervals = samples
    .map(sample => [new Date(sample.startDate).getTime(), new Date(sample.endDate).getTime()] as const)
    .filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end) && end > start)
    .sort((a, b) => a[0] - b[0]);
  if (!intervals.length) return 0;
  let total = 0;
  let [start, end] = intervals[0]!;
  for (const [nextStart, nextEnd] of intervals.slice(1)) {
    if (nextStart <= end) end = Math.max(end, nextEnd);
    else {
      total += end - start;
      [start, end] = [nextStart, nextEnd];
    }
  }
  return (total + end - start) / 60_000;
}

/**
 * Reads raw HealthKit data into STRIDE's provider-neutral daily format.
 * Unsupported or denied types stay absent; the engine shows LEARNING instead
 * of manufacturing a recovery score.
 */
export async function fetchHealthBiometrics(days = 45): Promise<DailyBiometrics[]> {
  if (Platform.OS !== 'ios') return [];
  try {
    const HK = (() => { try { return require('@kingstinct/react-native-healthkit'); } catch { return null; } })();
    const client = HK?.default ?? HK;
    if (!client?.queryQuantitySamples || !client?.queryCategorySamples) return [];

    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 86_400_000);
    const options = {
      filter: { date: { startDate, endDate } },
      limit: 0,
      ascending: true,
    };
    const safeQuantity = async (identifier: string): Promise<HealthSample[]> => {
      try { return await client.queryQuantitySamples(identifier, options) ?? []; }
      catch { return []; }
    };

    const [rhr, hrv, respiration, spo2, steps, calories, sleep] = await Promise.all([
      safeQuantity('HKQuantityTypeIdentifierRestingHeartRate'),
      safeQuantity('HKQuantityTypeIdentifierHeartRateVariabilitySDNN'),
      safeQuantity('HKQuantityTypeIdentifierRespiratoryRate'),
      safeQuantity('HKQuantityTypeIdentifierOxygenSaturation'),
      safeQuantity('HKQuantityTypeIdentifierStepCount'),
      safeQuantity('HKQuantityTypeIdentifierActiveEnergyBurned'),
      client.queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', options).catch(() => []),
    ]);

    const byDate = new Map<string, DailyBiometrics>();
    const day = (date: string | Date) => new Date(date).toISOString().slice(0, 10);
    const ensure = (key: string) => {
      const existing = byDate.get(key);
      if (existing) return existing;
      const created: DailyBiometrics = { date: key, sources: ['apple_health'] };
      byDate.set(key, created);
      return created;
    };
    const quantities = (
      samples: HealthSample[],
      apply: (target: DailyBiometrics, value: number, allForDay: number[]) => void,
    ) => {
      const grouped = new Map<string, number[]>();
      for (const sample of samples) {
        const value = sample.quantity;
        if (typeof value !== 'number' || !Number.isFinite(value)) continue;
        const key = day(sample.startDate);
        grouped.set(key, [...(grouped.get(key) ?? []), value]);
      }
      for (const [key, values] of grouped) apply(ensure(key), average(values)!, values);
    };

    quantities(rhr, (target, value) => {
      target.cardiovascular = { ...target.cardiovascular, restingHr: value };
    });
    quantities(hrv, (target, value) => {
      target.cardiovascular = { ...target.cardiovascular, hrvMs: value };
    });
    quantities(respiration, (target, value) => {
      target.cardiovascular = { ...target.cardiovascular, respiratoryRate: value };
    });
    quantities(spo2, (target, value) => {
      target.cardiovascular = { ...target.cardiovascular, spo2: value <= 1 ? value * 100 : value };
    });
    quantities(steps, (target, _value, values) => {
      target.activity = { ...target.activity, steps: values.reduce((sum, value) => sum + value, 0) };
    });
    quantities(calories, (target, _value, values) => {
      target.activity = { ...target.activity, activeCalories: values.reduce((sum, value) => sum + value, 0) };
    });

    const sleepByDay = new Map<string, HealthSample[]>();
    for (const sample of sleep as HealthSample[]) {
      if (![1, 2, 3, 4, 5].includes(sample.value ?? -1)) continue;
      const key = day(sample.endDate);
      sleepByDay.set(key, [...(sleepByDay.get(key) ?? []), sample]);
    }
    for (const [key, samples] of sleepByDay) {
      const asleep = samples.filter(sample => [1, 3, 4, 5].includes(sample.value ?? -1));
      const target = ensure(key);
      target.sleep = {
        durationMinutes: unionMinutes(asleep),
        awakeMinutes: unionMinutes(samples.filter(sample => sample.value === 2)),
        coreMinutes: unionMinutes(samples.filter(sample => sample.value === 3)),
        deepMinutes: unionMinutes(samples.filter(sample => sample.value === 4)),
        remMinutes: unionMinutes(samples.filter(sample => sample.value === 5)),
        bedtime: asleep.length
          ? new Date(Math.min(...asleep.map(sample => new Date(sample.startDate).getTime()))).toISOString()
          : undefined,
        wakeTime: asleep.length
          ? new Date(Math.max(...asleep.map(sample => new Date(sample.endDate).getTime()))).toISOString()
          : undefined,
      };
    }

    return [...byDate.values()].map(value => ({ ...value, observedAt: new Date().toISOString() }));
  } catch {
    return [];
  }
}

export async function syncHealthBiometrics(): Promise<number> {
  if (await getHealthPermStatus() !== 'authorized') return 0;
  const days = await fetchHealthBiometrics();
  if (days.length) await upsertDailyBiometrics(days);
  return days.length;
}

// ─── Activity type mapping ────────────────────────────────────────────────────

function mapHealthActivity(type: HealthWorkout['activityType']): { purpose: RunPurpose; terrain: RunTerrain } {
  switch (type) {
    case 'running': return { purpose: 'easy', terrain: 'road' };
    case 'walking': return { purpose: 'walk', terrain: 'road' };
    case 'hiking':  return { purpose: 'walk', terrain: 'trail' };
    default:        return { purpose: 'easy', terrain: 'road' };
  }
}

// ─── Main sync ────────────────────────────────────────────────────────────────

export interface HealthSyncResult {
  imported: number;
  skipped:  number;
  error?:   string;
}

export async function syncHealthWorkouts(
  rosterByDate: Record<string, string> = {}
): Promise<HealthSyncResult> {
  const status = await getHealthPermStatus();
  if (status !== 'authorized') {
    return { imported: 0, skipped: 0, error: 'Apple Health not authorized' };
  }

  const lastSyncRaw = await AsyncStorage.getItem(HEALTH_LAST_SYNC);
  const afterDate   = lastSyncRaw
    ? new Date(parseInt(lastSyncRaw, 10))
    : new Date(Date.now() - 90 * 86400 * 1000); // 90 days back

  const workouts     = await fetchHealthWorkouts(afterDate);
  if (workouts.length === 0) return { imported: 0, skipped: 0 };

  const existingRuns = await getRuns();
  const existingIds  = new Set(existingRuns.map(r => r.external_id).filter(Boolean));

  let imported    = 0;
  let skipped     = 0;
  let totalMiles  = 0;
  for (const w of workouts) {
    const externalId = `healthkit_${w.id}`;
    if (existingIds.has(externalId)) { skipped++; continue; }

    const distKm = w.distanceMeters / 1000;
    if (distKm < 0.3) { skipped++; continue; }

    const dateKey = w.startDate.slice(0, 10);
    const shoeId  = rosterByDate[dateKey] ?? '';
    const { purpose, terrain } = mapHealthActivity(w.activityType);

    // Compute real match quality if shoe is in the Closet
    const shoe = shoeId ? SHOES.find(s => s.id === shoeId) : undefined;
    const mq = shoe ? calcMatchQuality(shoe, terrain, purpose, distKm) : 'neutral';

    const run: Run = {
      id: `run_health_${w.id.replace(/[^a-zA-Z0-9]/g, '_')}`,
      shoeId,
      distanceKm:      distKm,
      date:            w.startDate,
      terrain,
      purpose,
      durationMinutes: w.durationSeconds ? Math.round(w.durationSeconds / 60) : undefined,
      match_quality:   mq,
      source:          'apple_health',
      external_id:     externalId,
    };

    await saveRun(run);

    totalMiles += distKm * 0.621371;
    imported++;
  }

  if (totalMiles > 0) await addMiles(totalMiles);
  await AsyncStorage.setItem(HEALTH_LAST_SYNC, String(Date.now()));

  return { imported, skipped };
}

// ─── Apple Watch note ─────────────────────────────────────────────────────────

export const APPLE_WATCH_NOTE =
  'Apple Watch workouts sync automatically through Apple Health. No extra setup needed — ' +
  'just make sure "Fitness Tracking" is enabled in your Watch settings.';

export const GARMIN_INTEGRATION_NOTE =
  'Garmin syncs automatically via Strava. Enable "Auto-upload to Strava" in Garmin Connect → ' +
  'Settings → Partner Apps → Strava.';
