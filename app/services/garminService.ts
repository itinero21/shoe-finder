/**
 * garminService — Garmin Connect integration stub
 * Phase 6 / DRIFT territory
 *
 * STATUS: STUB — Garmin does not offer a public OAuth API for third-party apps.
 *
 * Integration paths available today:
 *
 *   PATH A — Strava relay (recommended, works now):
 *     User connects Garmin → Strava (in Garmin Connect app settings).
 *     Strava receives the GPS activity automatically.
 *     stravaService.syncStravaActivities() then pulls it like any Strava run.
 *     GPS coordinates are available via fetchActivityGPS(activityId).
 *
 *   PATH B — Garmin Health API (enterprise/approved partners only):
 *     Apply at https://developer.garmin.com/gc-developer-program/overview/
 *     Requires Garmin partner approval. Not available for indie devs.
 *     API: https://healthapi.garmin.com/wellness-api/rest/activities
 *     Returns GPS track as FIT file (binary) — needs fit-parser npm package.
 *
 *   PATH C — Garmin Connect IQ (watch-side SDK):
 *     Build a CIQ app that writes GPS data to a custom data field.
 *     Push to device via Connect IQ Store.
 *     Not practical for general users.
 *
 *   PATH D — Manual GPX import (future feature):
 *     User exports .gpx from Garmin Connect website.
 *     App imports the file via expo-document-picker.
 *     GPX parser converts to Coordinate[] for DRIFT.
 *
 * For now: Garmin users should connect Strava as the bridge (PATH A).
 * This file is a placeholder for future direct integration.
 */

import { Coordinate } from '../types/territory';

export interface GarminActivity {
  id: string;
  name: string;
  startTime: string;
  distanceMeters: number;
  durationSeconds: number;
  activityType: string;
}

/**
 * Stub — not yet implemented.
 * Future: use Garmin Health API (partner approval required).
 */
export async function connectGarmin(): Promise<null> {
  console.warn('[GarminService] Direct Garmin API not yet available. Use Strava relay instead.');
  return null;
}

/**
 * Stub — not yet implemented.
 * Future: fetch activity list from Garmin Health API.
 */
export async function getGarminActivities(): Promise<GarminActivity[]> {
  return [];
}

/**
 * Stub — not yet implemented.
 * Future: parse FIT file GPS track from Garmin activity.
 */
export async function getGarminActivityGPS(activityId: string): Promise<Coordinate[]> {
  return [];
}

/**
 * Parse a GPX string (exported from Garmin Connect website) into Coordinate[].
 * This is the one path that works today without API access.
 *
 * GPX format:
 *   <trkpt lat="37.3382" lon="-121.8863">
 *     <time>2024-01-15T08:30:00Z</time>
 *   </trkpt>
 */
export function parseGPXToCoordinates(gpxString: string): Coordinate[] {
  const coords: Coordinate[] = [];
  const trkptRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>(?:[\s\S]*?<time>([^<]+)<\/time>)?/g;
  let match: RegExpExecArray | null;
  while ((match = trkptRegex.exec(gpxString)) !== null) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    const timestamp = match[3] ? new Date(match[3]).getTime() : undefined;
    if (!isNaN(lat) && !isNaN(lng)) {
      coords.push({ lat, lng, timestamp });
    }
  }
  return coords;
}

export const GARMIN_STATUS = {
  available:    false,
  reason:       'Garmin Health API requires partner approval. Use Strava relay.',
  workaround:   'Connect Garmin → Strava in Garmin Connect app settings.',
  gpxImport:    true,  // GPX manual import works today
} as const;
