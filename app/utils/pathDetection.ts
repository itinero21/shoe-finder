/**
 * pathDetection — GPS trace matching for DRIFT territory system
 * Phase 2
 *
 * Two traces are the "same path" if:
 *   - 80%+ of sampled points are within 50 m of the other trace
 *   - Start AND end points are within 200 m of each other
 */

import { Coordinate } from '../types/territory';

// ─── Haversine distance (metres) ─────────────────────────────────────────────

export function haversineMetres(a: Coordinate, b: Coordinate): number {
  const R = 6371000; // Earth radius in metres
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function haversineKm(a: Coordinate, b: Coordinate): number {
  return haversineMetres(a, b) / 1000;
}

// ─── Decimate (down-sample) a trace to at most maxPoints ─────────────────────

export function decimateCoords(coords: Coordinate[], maxPoints = 100): Coordinate[] {
  if (coords.length <= maxPoints) return coords;
  const step = (coords.length - 1) / (maxPoints - 1);
  const out: Coordinate[] = [];
  for (let i = 0; i < maxPoints; i++) {
    out.push(coords[Math.round(i * step)]);
  }
  return out;
}

// ─── Nearest-point distance from a coord to a trace ──────────────────────────

function minDistToTrace(point: Coordinate, trace: Coordinate[]): number {
  let min = Infinity;
  for (const p of trace) {
    const d = haversineMetres(point, p);
    if (d < min) min = d;
  }
  return min;
}

// ─── Core match function ──────────────────────────────────────────────────────

export interface MatchResult {
  matched: boolean;
  overlapPct: number;  // 0–1 fraction of new trace that was "close" to existing
  startDist: number;   // metres between start points
  endDist: number;     // metres between end points
}

/**
 * Checks whether `newTrace` matches `existingTrace`.
 * Both traces are decimated to 80 points before comparison.
 */
export function matchPath(
  newTrace: Coordinate[],
  existingTrace: Coordinate[],
  proximityM = 50,
  minOverlap = 0.8,
  endpointM  = 200,
): MatchResult {
  if (newTrace.length < 2 || existingTrace.length < 2) {
    return { matched: false, overlapPct: 0, startDist: Infinity, endDist: Infinity };
  }

  const sampledNew = decimateCoords(newTrace, 80);
  const sampledRef = decimateCoords(existingTrace, 80);

  const startDist = haversineMetres(sampledNew[0], sampledRef[0]);
  const endDist   = haversineMetres(sampledNew[sampledNew.length - 1], sampledRef[sampledRef.length - 1]);

  if (startDist > endpointM || endDist > endpointM) {
    return { matched: false, overlapPct: 0, startDist, endDist };
  }

  let closeCount = 0;
  for (const pt of sampledNew) {
    if (minDistToTrace(pt, sampledRef) <= proximityM) closeCount++;
  }

  const overlapPct = closeCount / sampledNew.length;
  return {
    matched: overlapPct >= minOverlap,
    overlapPct,
    startDist,
    endDist,
  };
}

// ─── Auto-name a path from its coordinates ───────────────────────────────────

/**
 * Generates a deterministic human-friendly name for a path.
 * Uses the start lat/lng rounded to 2 dp to create a grid code,
 * then a direction descriptor from start → end bearing.
 *
 * Example: "ROUTE N37-E122" or "LOOP W118-N34"
 */
export function autoNamePath(coords: Coordinate[]): string {
  if (coords.length < 2) return 'UNNAMED ROUTE';

  const start = coords[0];
  const end   = coords[coords.length - 1];

  const latCode = (Math.abs(start.lat) | 0).toString().padStart(2, '0');
  const lngCode = (Math.abs(start.lng) | 0).toString().padStart(3, '0');
  const latDir  = start.lat >= 0 ? 'N' : 'S';
  const lngDir  = start.lng >= 0 ? 'E' : 'W';

  // Bearing start→end
  const dLat = end.lat - start.lat;
  const dLng = end.lng - start.lng;
  const dist  = haversineMetres(start, end);
  const isLoop = dist < 300; // endpoints very close → loop

  if (isLoop) return `LOOP ${latDir}${latCode}-${lngDir}${lngCode}`;

  const bearing = (Math.atan2(dLng, dLat) * 180) / Math.PI;
  const direction =
    bearing > -22.5 && bearing <= 22.5 ? 'NORTH' :
    bearing > 22.5  && bearing <= 67.5 ? 'NE' :
    bearing > 67.5  && bearing <= 112.5? 'EAST' :
    bearing > 112.5 && bearing <= 157.5? 'SE' :
    bearing > 157.5 || bearing <= -157.5? 'SOUTH' :
    bearing > -157.5 && bearing <= -112.5? 'SW' :
    bearing > -112.5 && bearing <= -67.5 ? 'WEST' : 'NW';

  return `ROUTE ${latDir}${latCode}-${lngDir}${lngCode} ${direction}`;
}

// ─── Compute path distance in km ─────────────────────────────────────────────

export function pathDistanceKm(coords: Coordinate[]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversineKm(coords[i - 1], coords[i]);
  }
  return total;
}
