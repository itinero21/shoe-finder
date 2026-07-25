import test from 'node:test';
import assert from 'node:assert/strict';
import { baselineStage, buildBaseline, calculateBodyState } from '../app/body/engine';
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

test('TRAINING DATA is fully populated from a Strava-only connection (no biometrics)', () => {
  const runs: Run[] = [
    {
      id: 'strava-easy',
      shoeId: 'shoe',
      distanceKm: 8.4,
      durationMinutes: 46,
      date: '2026-07-24T07:00:00Z',
      purpose: 'easy',
      terrain: 'road',
      source: 'strava',
      avgHr: 148,
    },
    {
      id: 'strava-long',
      shoeId: 'shoe',
      distanceKm: 16,
      durationMinutes: 92,
      date: '2026-07-21T07:00:00Z',
      purpose: 'long',
      terrain: 'road',
      source: 'strava',
    },
  ];
  const state = calculateBodyState([], runs, '2026-07-24');

  // No biometric source connected at all — recovery genuinely cannot be scored
  assert.equal(state.recovery, undefined);
  assert.equal(state.recoveryDataConnected, false);

  // But the screen is never empty: training data, load, readiness and legLoad
  // all come from Run[] alone and must be fully present.
  assert.equal(state.training.connected, true);
  assert.equal(state.training.sourceLabel, 'Strava');
  assert.equal(state.training.lastRun?.distanceKm, 8.4);
  assert.equal(state.training.runsLast7Days, 2);
  assert.ok(state.overallLoad > 0);
  assert.ok(state.readiness.easy > 0);
  assert.ok(Object.values(state.legLoad).every(v => v >= 0));

  // The recommendation reason must not claim the recovery system is
  // "learning" when no recovery source was ever connected.
  assert.match(state.recommendation.reason, /training load|connect a recovery/i);
});

test('baseline maturity is progressive, not a hard 7-day cliff', () => {
  assert.equal(baselineStage(0), 'learning');
  assert.equal(baselineStage(6), 'learning');
  assert.equal(baselineStage(7), 'early');
  assert.equal(baselineStage(13), 'early');
  assert.equal(baselineStage(14), 'improving');
  assert.equal(baselineStage(27), 'improving');
  assert.equal(baselineStage(28), 'established');
});

test('recoveryDataConnected is true even while recovery is still learning', () => {
  const state = calculateBodyState([normalDay(22), normalDay(23), normalDay(24)], [], '2026-07-24');
  assert.equal(state.recovery, undefined);
  assert.equal(state.recoveryDataConnected, true);
  assert.equal(state.baselineStage, 'learning');
});
