/**
 * STRIDE Runner — motion-core tests.
 * The gait solver is pure math, so we can pin down its physical guarantees:
 * planted feet, preserved bone lengths, speed-scaled cadence, sane blending.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BONES, GROUND_Y, gaitParamsFor, idlePose, runningPose, warmupPose,
  celebrationPose, mixPose, solveLegIK,
} from '../components/runner/motion';
import { RunnerPose, Vec2 } from '../components/runner/types';

const dist = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.y - b.y);

function everyJoint(p: RunnerPose): Vec2[] {
  return [
    p.pelvis, p.chest, p.head,
    ...p.legs.flatMap(l => [l.hip, l.knee, l.ankle, l.heel, l.toe]),
    ...p.arms.flatMap(a => [a.shoulder, a.elbow, a.wrist]),
  ];
}

test('running poses are finite at every phase and speed', () => {
  for (let s = 0; s <= 1.0001; s += 0.25) {
    for (let ph = 0; ph < 1; ph += 0.05) {
      const p = runningPose(ph, s, 1.23, 3);
      for (const j of everyJoint(p)) {
        assert.ok(Number.isFinite(j.x) && Number.isFinite(j.y), `NaN at s=${s} ph=${ph}`);
      }
    }
  }
});

test('stance foot stays planted on the ground (no floating, no penetration)', () => {
  const params = gaitParamsFor(0.6);
  for (let ph = 0.02; ph < params.stanceFrac * 0.6; ph += 0.03) {
    const p = runningPose(ph, 0.6, 2, 3);
    const front = p.legs[1];
    // Early stance: ankle sits at ankle-height above the ground
    assert.ok(Math.abs(front.ankle.y - (GROUND_Y - BONES.ankleHeight)) < 1.5,
      `stance ankle off ground at ph=${ph}: ${front.ankle.y}`);
    assert.ok(front.heel.y <= GROUND_Y + 1.5, 'heel below ground');
  }
});

test('bone lengths are preserved by the IK solve', () => {
  for (let ph = 0; ph < 1; ph += 0.1) {
    const p = runningPose(ph, 0.8, 3, 3);
    for (const leg of p.legs) {
      assert.ok(Math.abs(dist(leg.hip, leg.knee) - BONES.thigh) < 1, 'thigh length drifted');
      assert.ok(Math.abs(dist(leg.knee, leg.ankle) - BONES.shin) < 1, 'shin length drifted');
    }
    for (const arm of p.arms) {
      assert.ok(Math.abs(dist(arm.shoulder, arm.elbow) - BONES.upperArm) < 0.5, 'upper arm drifted');
      assert.ok(Math.abs(dist(arm.elbow, arm.wrist) - BONES.forearm) < 0.5, 'forearm drifted');
    }
  }
});

test('knees bend forward, never backward', () => {
  for (let ph = 0; ph < 1; ph += 0.04) {
    const p = runningPose(ph, 0.7, 1.5, 3);
    for (const leg of p.legs) {
      // Knee x must never sit meaningfully behind the hip-ankle line
      const t = (leg.knee.y - leg.hip.y) / Math.max(1e-6, leg.ankle.y - leg.hip.y);
      const lineX = leg.hip.x + (leg.ankle.x - leg.hip.x) * Math.max(0, Math.min(1, t));
      assert.ok(leg.knee.x >= lineX - 1.5, `knee hyperextended at ph=${ph}`);
    }
  }
});

test('cadence and stride scale with speed', () => {
  const slow = gaitParamsFor(0.1);
  const fast = gaitParamsFor(1);
  assert.ok(fast.frequency > slow.frequency, 'cadence should rise with speed');
  assert.ok(fast.strideHalf > slow.strideHalf, 'stride should lengthen with speed');
  assert.ok(fast.lean > slow.lean, 'lean should increase with speed');
  assert.ok(fast.stanceFrac < slow.stanceFrac, 'stance fraction should shrink with speed');
});

test('arms and legs move in opposition', () => {
  // At contact (front foot forward), the front wrist should be behind the shoulder.
  const p = runningPose(0.01, 0.7, 1, 3);
  const frontArm = p.arms[1];
  assert.ok(frontArm.wrist.x < frontArm.shoulder.x + 2, 'front arm should swing back at front-foot contact');
});

test('idle stands nearly straight with both feet on the ground', () => {
  const p = idlePose(1, 3);
  for (const leg of p.legs) {
    assert.ok(Math.abs(leg.heel.y - GROUND_Y) < 1.5, 'idle heel not grounded');
    const legExt = dist(leg.hip, leg.ankle) / (BONES.thigh + BONES.shin);
    assert.ok(legExt > 0.9, `idle legs too bent: ${legExt}`);
  }
});

test('warmup and celebration stay finite and grounded in reason', () => {
  for (let t = 0; t < 3; t += 0.21) {
    for (const j of everyJoint(warmupPose(t, 3))) assert.ok(Number.isFinite(j.x + j.y));
    for (const j of everyJoint(celebrationPose(t, 3, (t / 3) % 1))) assert.ok(Number.isFinite(j.x + j.y));
  }
  // Celebration peak: front wrist raised above the head
  const peak = celebrationPose(1, 3, 0.5);
  assert.ok(peak.arms[1].wrist.y < peak.head.y, 'celebration fist should rise above the head');
});

test('mixPose blends and clamps', () => {
  const a = idlePose(1, 3);
  const b = runningPose(0.3, 0.8, 1, 3);
  const half = mixPose(a, b, 0.5);
  assert.ok(half.pelvis.y > Math.min(a.pelvis.y, b.pelvis.y) - 0.01);
  assert.ok(half.pelvis.y < Math.max(a.pelvis.y, b.pelvis.y) + 0.01);
  const over = mixPose(a, b, 1.7);
  assert.equal(over.pelvis.x, b.pelvis.x);
});

test('IK clamps unreachable targets instead of exploding', () => {
  const hip = { x: 0, y: 0 };
  const { knee, ankle } = solveLegIK(hip, { x: 0, y: 500 }, BONES.thigh, BONES.shin);
  assert.ok(Number.isFinite(knee.x) && Number.isFinite(knee.y));
  assert.ok(Math.abs(dist(hip, knee) - BONES.thigh) < 0.5);
  assert.ok(Math.abs(dist(knee, ankle) - BONES.shin) < 0.5);
});
