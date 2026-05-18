/**
 * locationService — GPS permission + live tracking for DRIFT territory
 *
 * Permission flow:
 *   requestLocationPermission() → foreground permission
 *   requestBackgroundPermission() → "Always" permission (needed for screen-off tracking)
 *
 * Run tracking uses TaskManager + startLocationUpdatesAsync so GPS
 * continues recording when the phone is locked / screen is off.
 *
 * Fallback: if background permission is denied, uses foreground-only
 * watchPositionAsync (original behavior — less accurate when locked).
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coordinate } from '../types/territory';

const PERM_KEY          = 'stride_location_perm_v1';
const PERM_ASKED_KEY    = 'stride_location_asked_v1';
const BG_TASK_NAME      = 'STRIDE_BG_LOCATION_TASK';
const BG_BUFFER_KEY     = 'stride_bg_location_buffer_v1';

export type LocationPermStatus = 'granted' | 'denied' | 'not_asked';

// ─── Permission ───────────────────────────────────────────────────────────────

export async function getLocationPermStatus(): Promise<LocationPermStatus> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') return 'granted';
    const asked = await AsyncStorage.getItem(PERM_ASKED_KEY);
    return asked ? 'denied' : 'not_asked';
  } catch {
    return 'not_asked';
  }
}

/**
 * Shows the native OS location permission popup.
 * Asks for "when in use" (foreground only).
 */
export async function requestLocationPermission(): Promise<LocationPermStatus> {
  try {
    await AsyncStorage.setItem(PERM_ASKED_KEY, '1');
    const { status } = await Location.requestForegroundPermissionsAsync();
    const result: LocationPermStatus = status === 'granted' ? 'granted' : 'denied';
    await AsyncStorage.setItem(PERM_KEY, result);
    return result;
  } catch {
    return 'denied';
  }
}

/**
 * Request "Always" (background) permission — needed for screen-off tracking.
 * Must call requestLocationPermission() first (foreground is a prerequisite).
 * Returns true if background permission was granted.
 */
export async function requestBackgroundPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/** Check if background location is currently granted */
export async function hasBackgroundPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getBackgroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ─── Current position ─────────────────────────────────────────────────────────

export async function getCurrentCoordinate(): Promise<Coordinate | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      timestamp: pos.timestamp,
    };
  } catch {
    return null;
  }
}

// ─── Background task definition ──────────────────────────────────────────────
// This runs even when the app is backgrounded / screen is off.
// It appends coordinates to AsyncStorage so they persist across JS suspensions.

TaskManager.defineTask(BG_TASK_NAME, async ({ data, error }: any) => {
  if (error) return;
  if (data?.locations) {
    const newCoords: Coordinate[] = data.locations.map((loc: Location.LocationObject) => ({
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      timestamp: loc.timestamp,
    }));

    // Append to in-memory buffer AND AsyncStorage (belt + suspenders)
    _trackingBuffer.push(...newCoords);

    // Also persist to AsyncStorage in case JS context gets killed
    try {
      const raw = await AsyncStorage.getItem(BG_BUFFER_KEY);
      const existing: Coordinate[] = raw ? JSON.parse(raw) : [];
      existing.push(...newCoords);
      await AsyncStorage.setItem(BG_BUFFER_KEY, JSON.stringify(existing));
    } catch {
      // non-fatal — in-memory buffer is the primary source
    }
  }
});

// ─── Live run tracking ───────────────────────────────────────────────────────

let _trackingSubscription: Location.LocationSubscription | null = null;
let _trackingBuffer: Coordinate[] = [];
let _usingBackgroundTask = false;

/**
 * Begin recording GPS coordinates.
 * Tries background tracking first (works when screen is off).
 * Falls back to foreground-only watchPositionAsync.
 */
export async function startRunTracking(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return false;

    _trackingBuffer = [];
    _usingBackgroundTask = false;

    // Clear any persisted buffer from a previous run
    await AsyncStorage.removeItem(BG_BUFFER_KEY);

    // Try background tracking first
    const hasBg = await hasBackgroundPermission();
    if (hasBg) {
      // Stop any leftover task from a previous crashed run
      const isRunning = await Location.hasStartedLocationUpdatesAsync(BG_TASK_NAME).catch(() => false);
      if (isRunning) {
        await Location.stopLocationUpdatesAsync(BG_TASK_NAME);
      }

      await Location.startLocationUpdatesAsync(BG_TASK_NAME, {
        accuracy:            Location.Accuracy.BestForNavigation,
        timeInterval:        4000,    // every 4 seconds
        distanceInterval:    8,       // or every 8 metres
        showsBackgroundLocationIndicator: true,  // iOS blue bar
        foregroundService: {
          notificationTitle: 'Stride is tracking your run',
          notificationBody:  'GPS recording active — your route is being mapped.',
          notificationColor: '#FF3D00',
        },
        pausesUpdatesAutomatically: false,
        activityType: Location.ActivityType.Fitness,
      });
      _usingBackgroundTask = true;
      return true;
    }

    // Fallback: foreground-only (original behavior)
    _trackingSubscription = await Location.watchPositionAsync(
      {
        accuracy:            Location.Accuracy.BestForNavigation,
        timeInterval:        5000,
        distanceInterval:    10,
      },
      (pos) => {
        _trackingBuffer.push({
          lat:       pos.coords.latitude,
          lng:       pos.coords.longitude,
          timestamp: pos.timestamp,
        });
      }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Stop recording and return the full GPS trace.
 * Merges in-memory buffer with AsyncStorage buffer (for background task).
 */
export async function stopRunTracking(): Promise<Coordinate[]> {
  if (_usingBackgroundTask) {
    // Stop the background task
    const isRunning = await Location.hasStartedLocationUpdatesAsync(BG_TASK_NAME).catch(() => false);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(BG_TASK_NAME);
    }

    // Merge in-memory + persisted buffer (dedup by timestamp)
    let persisted: Coordinate[] = [];
    try {
      const raw = await AsyncStorage.getItem(BG_BUFFER_KEY);
      persisted = raw ? JSON.parse(raw) : [];
    } catch { /* ignore */ }

    // Merge: use a Set of timestamps to deduplicate
    const seen = new Set<number>();
    const merged: Coordinate[] = [];
    for (const coord of [..._trackingBuffer, ...persisted]) {
      const ts = coord.timestamp ?? 0;
      if (!seen.has(ts)) {
        seen.add(ts);
        merged.push(coord);
      }
    }
    // Sort by timestamp
    merged.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

    await AsyncStorage.removeItem(BG_BUFFER_KEY);
    _trackingBuffer = [];
    _usingBackgroundTask = false;
    return merged;
  }

  // Foreground-only fallback
  _trackingSubscription?.remove();
  _trackingSubscription = null;
  const trace = [..._trackingBuffer];
  _trackingBuffer = [];
  return trace;
}

/** True if a tracking session is active */
export function isTracking(): boolean {
  return _usingBackgroundTask || _trackingSubscription !== null;
}

/**
 * Get a snapshot of all coordinates recorded so far WITHOUT stopping tracking.
 * Used by the timer to update the map/distance in real time.
 * For background task mode, also merges in the AsyncStorage buffer.
 */
export async function getTrackingSnapshot(): Promise<Coordinate[]> {
  if (_usingBackgroundTask) {
    let persisted: Coordinate[] = [];
    try {
      const raw = await AsyncStorage.getItem(BG_BUFFER_KEY);
      persisted = raw ? JSON.parse(raw) : [];
    } catch { /* ignore */ }

    const seen = new Set<number>();
    const merged: Coordinate[] = [];
    for (const coord of [..._trackingBuffer, ...persisted]) {
      const ts = coord.timestamp ?? 0;
      if (!seen.has(ts)) {
        seen.add(ts);
        merged.push(coord);
      }
    }
    merged.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    return merged;
  }
  return [..._trackingBuffer];
}

// ─── City detection ──────────────────────────────────────────────────────────

export interface DetectedCity {
  name: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
}

export async function detectCurrentCity(): Promise<DetectedCity | null> {
  try {
    const coord = await getCurrentCoordinate();
    if (!coord) return null;

    const results = await Location.reverseGeocodeAsync({
      latitude:  coord.lat,
      longitude: coord.lng,
    });

    if (!results || results.length === 0) return null;

    const r = results[0];
    return {
      name:    r.city ?? r.subregion ?? r.region ?? 'Unknown',
      country: r.country ?? 'Unknown',
      region:  r.region ?? '',
      lat:     coord.lat,
      lng:     coord.lng,
    };
  } catch {
    return null;
  }
}

// ─── Distance utils ──────────────────────────────────────────────────────────

export function traceDistanceKm(coords: Coordinate[]): number {
  if (coords.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const R    = 6371;
    const dLat = ((curr.lat - prev.lat) * Math.PI) / 180;
    const dLng = ((curr.lng - prev.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((prev.lat * Math.PI) / 180) *
      Math.cos((curr.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    total += 2 * R * Math.asin(Math.sqrt(a));
  }
  return total;
}
