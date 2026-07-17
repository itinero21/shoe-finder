import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendShoeForToday } from '../app/intelligence/engines/recommendation';
import { recommendReplacements } from '../app/intelligence/engines/replacement';
import { detectPainPatterns } from '../app/intelligence/engines/painPatterns';
import { deriveShoePersonalities } from '../app/intelligence/engines/personality';
import { ShoeProfile, EngineInput } from '../app/intelligence/types';

const base = (id: string, model: string, softness: number, roles: any[], surfaces: any[]): ShoeProfile => ({
  id, brand: 'Test', model, roles, surfaces, widths: ['standard', 'wide'],
  mechanics: { dropMm: 8, cushioning: 70, softness, energyReturn: 60, rocker: 55, longitudinalStiffness: 50, torsionalStability: 60, heelCounter: 60, platformWidth: 65, toeBoxVolume: 65, outsoleGrip: 70, wetGrip: 70, plate: 'none', stabilityClass: 'neutral' },
  durabilityBaselineKm: 700, dataConfidence: 0.9,
});
const catalog = [
  base('soft', 'Cloud Soft', 80, ['recovery', 'daily'], ['road']),
  base('fast', 'Fast Plate', 45, ['tempo', 'race'], ['road']),
  base('trail', 'Trail Claw', 55, ['trail'], ['technical_trail']),
];
const input: EngineInput = {
  today: '2026-07-16',
  runner: { id: 'r', experience: 'recreational', averageWeeklyKm: 30, currentPain: { achilles_calf: 4 }, recentInjuryAreas: [], comfortPriority: 80, preferences: { softness: 75, dropMm: 8, rocker: 55, stiffness: 50, toeBoxVolume: 65, platformWidth: 65 } },
  plannedRun: { date: '2026-07-16', intent: 'recovery', distanceKm: 6, surface: 'road', weather: ['rain'] },
  catalog,
  ownedShoes: [
    { id: 'o1', profileId: 'soft', distanceKm: 300, runs: 30, purchasePrice: 180 },
    { id: 'o2', profileId: 'fast', distanceKm: 80, runs: 7 },
  ],
  recentRuns: [
    { id: '1', occurredAt: '2026-07-14', distanceKm: 8, effortRpe: 8, surface: 'road', shoeId: 'o2', comfort: 3 },
    { id: '2', occurredAt: '2026-07-15', distanceKm: 5, effortRpe: 6, surface: 'road', shoeId: 'o2', comfort: 3 },
  ],
};

test('recovery shoe wins a fatigued recovery day', () => {
  const r = recommendShoeForToday(input);
  assert.equal(r.recommended?.profileId, 'soft');
  assert.ok((r.recommended?.confidence ?? 0) > 40);
});

test('trail shoe does not win on the road', () => {
  const r = recommendShoeForToday({ ...input, ownedShoes: [...input.ownedShoes, { id: 'o3', profileId: 'trail', distanceKm: 20, runs: 2 }] });
  assert.notEqual(r.recommended?.profileId, 'trail');
});

test('replacement advisor ranks compatible shoes', () => {
  const r = recommendReplacements(input.ownedShoes[0]!, catalog, input.ownedShoes, input.recentRuns, input.runner, 300);
  assert.ok(Array.isArray(r) && r.length > 0);
});

test('pain patterns require repeated support', () => {
  const runs = [1, 2, 3].map(i => ({ id: String(i), occurredAt: `2026-07-0${i}`, distanceKm: 10, effortRpe: 5, surface: 'road' as const, shoeId: 'o1', pain: [{ area: 'knee' as const, severity: 5, timing: 'after' as const }] }));
  assert.equal(detectPainPatterns(runs, catalog, new Map([['o1', 'soft']]))[0]?.area, 'knee');
});

test('shoe personality is earned from use', () => {
  const shoe = { id: 'o1', profileId: 'soft', distanceKm: 750, runs: 60 };
  const runs = Array.from({ length: 60 }, (_, i) => ({ id: String(i), occurredAt: '2026-01-01', distanceKm: 10, effortRpe: 5, surface: 'road' as const, shoeId: 'o1' }));
  const p = deriveShoePersonalities(shoe, runs);
  assert.ok(p.some(x => x.key === 'workhorse'));
  assert.ok(p.some(x => x.key === 'survivor'));
});

// ── v2.1 strengthening ──────────────────────────────────────────────

test('v2.1: compressed foam lowers readiness', () => {
  const fresh = recommendShoeForToday(input);
  const compressed = recommendShoeForToday({
    ...input,
    ownedShoes: [{ ...input.ownedShoes[0]!, recoveryPct: 20 }, input.ownedShoes[1]!],
  });
  const freshSoft = fresh.recommended?.profileId === 'soft' ? fresh.recommended : fresh.alternatives.find(x => x.profileId === 'soft');
  const compSoft = compressed.recommended?.profileId === 'soft' ? compressed.recommended : [...compressed.alternatives, ...compressed.avoid].find(x => x.profileId === 'soft');
  assert.ok((compSoft?.readiness ?? 100) < (freshSoft?.readiness ?? 0), `expected ${compSoft?.readiness} < ${freshSoft?.readiness}`);
});

test('v2.1: dying race shoe is discouraged on easy days', () => {
  const dying = recommendShoeForToday({
    ...input,
    plannedRun: { ...input.plannedRun, intent: 'easy' },
    ownedShoes: [input.ownedShoes[0]!, { id: 'o2', profileId: 'fast', distanceKm: 620, runs: 60 }],
  });
  const fastD = [...(dying.recommended ? [dying.recommended] : []), ...dying.alternatives, ...dying.avoid].find(x => x.profileId === 'fast');
  assert.ok(fastD!.components.some(c => c.key === 'save_racer'));
});

test('v2.1: goal race boosts the racer', () => {
  const r = recommendShoeForToday({
    ...input,
    runner: { ...input.runner, currentPain: {} },
    plannedRun: { date: '2026-07-16', intent: 'race', distanceKm: 21, surface: 'road', weather: ['dry'], raceImportance: 'goal_race' },
  });
  assert.equal(r.recommended?.profileId, 'fast');
  assert.ok(r.recommended!.components.some(c => c.key === 'race_day'));
});

test('v2.1: severe pain blocks and produces a safety notice', () => {
  const r = recommendShoeForToday({ ...input, runner: { ...input.runner, currentPain: { knee: 8 } } });
  assert.ok(r.safetyNotice);
  assert.equal(r.recommended, undefined);
});
