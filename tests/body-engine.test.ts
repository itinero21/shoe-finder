import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBaseline, calculateBodyState } from '../app/body/engine';
import { DailyBiometrics } from '../app/body/types';
import { Run } from '../app/types/run';
import { isSamePhysicalRun, mergePhysicalRuns } from '../app/utils/runDeduplication';

const date = (day: number) => `2026-07-${String(day).padStart(2, '0')}`;
const normalDay = (day: number): DailyBiometrics => ({
  date: date(day),
  sleep: { durationMinutes: 450 + (day % 3) * 5 },
  cardiovascular: {
    hrvMs: 58 + (day % 4),
    restingHr: 53 + (day % 2),
    respiratoryRate: 14.2 + (day % 3) * 0.1,
  },
  sources: ['apple_health'],
});

test('BODY does not publish recovery from sparse biometric history', () => {
  const state = calculateBodyState([
    normalDay(22),
    normalDay(23),
    normalDay(24),
  ], [], '2026-07-24');
  assert.equal(state.recovery, undefined);
  assert.equal(state.confidenceLevel, 'learning');
});

test('personal baseline excludes today and becomes ready from history', () => {
  const history = Array.from({ length: 14 }, (_, index) => normalDay(index + 10));
  const baseline = buildBaseline(history, 'hrv', '2026-07-24');
  assert.equal(baseline?.sampleCount, 14);
  assert.ok((baseline?.mean ?? 0) > 55);
});

test('poor personal deviations lower recovery without population thresholds', () => {
  const history = Array.from({ length: 14 }, (_, index) => normalDay(index + 10));
  const normal = calculateBodyState(
    [...history, normalDay(24)],
    [],
    '2026-07-24',
  );
  const changed: DailyBiometrics = {
    ...normalDay(24),
    sleep: { durationMinutes: 340 },
    cardiovascular: { hrvMs: 42, restingHr: 63, respiratoryRate: 16.5 },
  };
  const low = calculateBodyState([...history, changed], [], '2026-07-24');
  assert.ok(normal.recovery != null && low.recovery != null);
  assert.ok(low.recovery < normal.recovery);
});

test('recent hard work suppresses speed readiness more than easy readiness', () => {
  const history = Array.from({ length: 14 }, (_, index) => normalDay(index + 10));
  const runs: Run[] = [
    {
      id: 'intervals',
      shoeId: 'test',
      distanceKm: 10,
      durationMinutes: 48,
      date: '2026-07-23T07:00:00Z',
      purpose: 'speed',
      terrain: 'track',
      source: 'strava',
      avgHr: 170,
      maxHr: 185,
    },
    {
      id: 'tempo',
      shoeId: 'test',
      distanceKm: 8,
      durationMinutes: 41,
      date: '2026-07-21T07:00:00Z',
      purpose: 'tempo',
      terrain: 'road',
      source: 'strava',
    },
  ];
  const state = calculateBodyState([...history, normalDay(24)], runs, '2026-07-24');
  assert.ok(state.readiness.easy > state.readiness.speed);
  assert.equal(state.recommendation.intent, 'easy');
});

test('the same Garmin run relayed through Strava is merged, not double-counted', () => {
  const garmin: Run = {
    id: 'garmin-run',
    shoeId: 'shoe',
    distanceKm: 10,
    durationMinutes: 50,
    date: '2026-07-24T06:00:00Z',
    source: 'garmin',
    external_id: 'garmin_1',
    avgHr: 151,
  };
  const strava: Run = {
    id: 'strava-run',
    shoeId: '',
    distanceKm: 10.08,
    durationMinutes: 51,
    date: '2026-07-24T06:02:00Z',
    source: 'strava',
    external_id: 'strava_99',
    coordinates: [{ lat: 1, lng: 2 }],
  };
  assert.equal(isSamePhysicalRun(garmin, strava), true);
  const merged = mergePhysicalRuns(strava, garmin);
  assert.equal(merged.source, 'garmin');
  assert.equal(merged.shoeId, 'shoe');
  assert.equal(merged.external_ids?.length, 2);
});
