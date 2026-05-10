/**
 * locationService — GPS permission + live tracking for DRIFT territory
 *
 * Permission flow (runs once on first app open):
 *   requestLocationPermission() → shows native "Allow while using app" popup
 *
 * Run tracking:
 *   startRunTracking()  → begins foreground location updates
 *   stopRunTracking()   → stops updates, returns full Coordinate[] trace
 *
 * City detection:
 *   detectCurrentCity() → reverse-geocodes current location to city/country
 */

import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coordinate } from '../types/territory';

const PERM_KEY          = 'stride_location_perm_v1';
const PERM_ASKED_KEY    = 'stride_location_asked_v1';

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
 * Asks for "when in use" (foreground only — no always-on tracking).
 * Safe to call multiple times — only shows popup once.
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

// ─── Current position ─────────────────────────────────────────────────────────

/** Get single current coordinate. Returns null if permission denied. */
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

// ─── Live run tracking ────────────────────────────────────────────────────────

let _trackingSubscription: Location.LocationSubscription | null = null;
let _trackingBuffer: Coordinate[] = [];

/**
 * Begin recording GPS coordinates.
 * Call at start of a run — coordinates accumulate in memory.
 * Returns false if permission not granted.
 */
export async function startRunTracking(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return false;

    _trackingBuffer = [];
    _trackingSubscription = await Location.watchPositionAsync(
      {
        accuracy:            Location.Accuracy.BestForNavigation,
        timeInterval:        5000,   // every 5 seconds
        distanceInterval:    10,     // or every 10 metres — whichever first
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
 * Call at end of a run.
 */
export async function stopRunTracking(): Promise<Coordinate[]> {
  _trackingSubscription?.remove();
  _trackingSubscription = null;
  const trace = [..._trackingBuffer];
  _trackingBuffer = [];
  return trace;
}

/** True if a tracking session is active */
export function isTracking(): boolean {
  return _trackingSubscription !== null;
}

// ─── City detection ───────────────────────────────────────────────────────────

export interface DetectedCity {
  name: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
}

/**
 * Reverse-geocode the current GPS position into a city name.
 * Uses expo-location's built-in geocoder — no API key required.
 */
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

// ─── Distance utils ───────────────────────────────────────────────────────────

/** Calculate total distance of a GPS trace in km */
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
