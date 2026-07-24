import { Run } from '../types/run';

const SOURCE_RANK: Record<string, number> = {
  manual: 0,
  strava: 1,
  apple_health: 2,
  garmin: 3,
};

/**
 * Provider-independent identity for the same physical activity. Garmin and
 * Apple runs frequently arrive again through Strava, so IDs alone are not
 * sufficient. The tolerances are intentionally tight to avoid merging two
 * genuinely separate sessions.
 */
export function isSamePhysicalRun(a: Run, b: Run): boolean {
  if (a.external_id && (
    a.external_id === b.external_id ||
    b.external_ids?.includes(a.external_id) ||
    a.external_ids?.includes(b.external_id ?? '')
  )) return true;
  if (a.source === 'manual' || b.source === 'manual') return false;

  const startGapMinutes = Math.abs(new Date(a.date).getTime() - new Date(b.date).getTime()) / 60_000;
  const distanceGap = Math.abs(a.distanceKm - b.distanceKm) / Math.max(a.distanceKm, b.distanceKm, 0.1);
  const durationGap = a.durationMinutes != null && b.durationMinutes != null
    ? Math.abs(a.durationMinutes - b.durationMinutes) / Math.max(a.durationMinutes, b.durationMinutes, 1)
    : 0;
  return startGapMinutes <= 5 && distanceGap <= 0.025 && durationGap <= 0.06;
}

export function mergePhysicalRuns(existing: Run, incoming: Run): Run {
  const preferIncoming = (SOURCE_RANK[incoming.source ?? 'manual'] ?? 0) >
    (SOURCE_RANK[existing.source ?? 'manual'] ?? 0);
  const primary = preferIncoming ? incoming : existing;
  const secondary = preferIncoming ? existing : incoming;
  return {
    ...secondary,
    ...primary,
    id: existing.id,
    shoeId: existing.shoeId || incoming.shoeId,
    notes: existing.notes || incoming.notes,
    feel: existing.feel ?? incoming.feel,
    feel5: existing.feel5 ?? incoming.feel5,
    issues: existing.issues ?? incoming.issues,
    coordinates: primary.coordinates?.length ? primary.coordinates : secondary.coordinates,
    biomechanics: { ...secondary.biomechanics, ...primary.biomechanics },
    external_id: primary.external_id ?? secondary.external_id,
    external_ids: [...new Set([
      ...(existing.external_ids ?? []),
      ...(incoming.external_ids ?? []),
      ...(existing.external_id ? [existing.external_id] : []),
      ...(incoming.external_id ? [incoming.external_id] : []),
    ])],
  };
}
