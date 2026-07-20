/**
 * STRIDE Runner — motion core.
 *
 * Pure math, no React, no React Native. Every function carries a 'worklet'
 * directive so the whole gait solver runs on the Reanimated UI thread, and
 * the same code runs under Node for tests.
 *
 * The rig is solved per frame, not keyframed:
 *   - legs are two-bone IK chains driven by a foot-target model with a hard
 *     stance phase (foot planted, traveling backward at ground speed — this
 *     is what makes contact read as weight instead of sliding)
 *   - arms swing in opposition with a fixed forward elbow fold
 *   - pelvis, torso lean, shoulder counter-rotation and head follow-through
 *     are layered on top
 *   - states (idle / warmup / running / celebration) are separate pose
 *     generators blended continuously — transitions are cross-fades of
 *     solved poses, never clip switches
 */
import { ArmPose, LegPose, RunnerPose, Vec2 } from './types';

// ── Design space ────────────────────────────────────────────────────────────
export const DESIGN_W = 220;
export const DESIGN_H = 250;
export const GROUND_Y = 218;

// Skeleton proportions (design units)
export const BONES = {
  thigh: 34,
  shin: 32,
  footLen: 17,
  ankleHeight: 6,
  torso: 46,          // pelvis → chest
  neck: 10,           // chest → head center
  upperArm: 24,
  forearm: 22,
  hipHalf: 5,         // pelvis half-width along depth axis
  shoulderHalf: 7,
} as const;

const PELVIS_X = 104;
const PELVIS_BASE_Y = GROUND_Y - BONES.ankleHeight - 61; // legs slightly bent at stand

const TAU = Math.PI * 2;

// ── Small helpers ───────────────────────────────────────────────────────────

export function lerp(a: number, b: number, t: number): number {
  'worklet';
  return a + (b - a) * t;
}

export function clamp01(v: number): number {
  'worklet';
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smooth(t: number): number {
  'worklet';
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

/** Direction from a clockwise-from-vertical-down angle. */
function dir(angle: number): Vec2 {
  'worklet';
  return { x: Math.sin(angle), y: Math.cos(angle) };
}

// ── Two-bone IK (hip → knee → ankle), knee bends forward ────────────────────

export function solveLegIK(
  hip: Vec2, target: Vec2, l1: number, l2: number,
): { knee: Vec2; ankle: Vec2 } {
  'worklet';
  let dx = target.x - hip.x;
  let dy = target.y - hip.y;
  let d = Math.sqrt(dx * dx + dy * dy);
  const maxD = l1 + l2 - 0.5;
  const minD = Math.abs(l1 - l2) + 0.5;
  if (d > maxD) { dx *= maxD / d; dy *= maxD / d; d = maxD; }
  if (d < minD) { dx *= minD / d; dy *= minD / d; d = minD; }
  // The ankle the chain can actually reach (bone lengths stay exact)
  const ankle: Vec2 = { x: hip.x + dx, y: hip.y + dy };
  const a = Math.atan2(dx, dy); // from vertical-down
  const cosOff = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const off = Math.acos(cosOff > 1 ? 1 : cosOff < -1 ? -1 : cosOff);
  // knee forward (+x) of the hip-ankle line: rotate toward +x → a + off
  const kneeAngle = a + off;
  return {
    knee: { x: hip.x + l1 * Math.sin(kneeAngle), y: hip.y + l1 * Math.cos(kneeAngle) },
    ankle,
  };
}

// ── Gait parameters interpolated by speed ───────────────────────────────────

export interface GaitParams {
  /** full gait cycles per second (two steps per cycle) */
  frequency: number;
  strideHalf: number;
  swingHeight: number;
  bounce: number;
  lean: number;        // radians forward
  armAmp: number;      // radians
  stanceFrac: number;
  kneeDrive: number;   // extra swing-knee lift 0..1
}

export function gaitParamsFor(speed: number): GaitParams {
  'worklet';
  const s = clamp01(speed);
  return {
    frequency: lerp(0.95, 1.55, s),
    strideHalf: lerp(12, 26, s),
    swingHeight: lerp(11, 24, s),
    bounce: lerp(2.2, 5.5, s),
    lean: lerp(0.07, 0.17, s),
    armAmp: lerp(0.36, 0.6, s),
    stanceFrac: lerp(0.42, 0.31, s),
    kneeDrive: s,
  };
}

// ── Foot target model (this is where "no sliding" lives) ────────────────────

interface FootSample { x: number; y: number; footAngle: number; contact: number }

function footTarget(phase: number, p: GaitParams, ground: number): FootSample {
  'worklet';
  const st = p.stanceFrac;
  if (phase < st) {
    // STANCE — planted, traveling backward under the body at constant speed.
    const q = phase / st;
    const x = lerp(p.strideHalf, -p.strideHalf, q);
    // Heel-to-toe roll: flat through midstance, heel rises for push-off
    const push = q > 0.62 ? smooth((q - 0.62) / 0.38) : 0;
    return { x, y: ground, footAngle: -push * 0.75, contact: 1 - push * 0.35 };
  }
  // SWING — recover behind, drive the knee through, reach for next contact.
  const q = (phase - st) / (1 - st);
  const reach = smooth(q);
  const x = lerp(-p.strideHalf * 1.08, p.strideHalf, reach);
  // Lift peaks early (heel recovery), settles before contact
  const lift = Math.sin(Math.min(1, q * 1.15) * Math.PI);
  const y = ground - p.swingHeight * lift * (0.7 + 0.5 * p.kneeDrive);
  // Toe hangs slightly down mid-swing, levels for landing
  const footAngle = 0.35 * Math.sin(q * Math.PI) * (1 - reach * 0.6);
  return { x, y, footAngle, contact: 0 };
}

// ── Pose generators ─────────────────────────────────────────────────────────

function buildLeg(hip: Vec2, foot: FootSample, pelvisX: number): LegPose {
  'worklet';
  const targetAnkle: Vec2 = { x: pelvisX + foot.x, y: foot.y - BONES.ankleHeight };
  const { knee, ankle } = solveLegIK(hip, targetAnkle, BONES.thigh, BONES.shin);
  const heel: Vec2 = {
    x: ankle.x - 4 * Math.cos(foot.footAngle),
    y: ankle.y + BONES.ankleHeight - 4 * Math.sin(-foot.footAngle),
  };
  const toe: Vec2 = {
    x: heel.x + BONES.footLen * Math.cos(foot.footAngle),
    y: heel.y + BONES.footLen * Math.sin(foot.footAngle),
  };
  return { hip, knee, ankle, heel, toe };
}

function buildArm(shoulder: Vec2, swing: number, foldBase: number): ArmPose {
  'worklet';
  // Angle convention: 0 = hanging straight down, +x is forward.
  // The upper arm swings from the shoulder; the forearm keeps a forward
  // fold that tightens slightly as the arm swings forward.
  const upper = swing;
  const elbow: Vec2 = {
    x: shoulder.x + BONES.upperArm * Math.sin(upper),
    y: shoulder.y + BONES.upperArm * Math.cos(upper),
  };
  const fold = foldBase + swing * 0.15;
  const fore = upper + fold; // fold forward (+x)
  const wrist: Vec2 = {
    x: elbow.x + BONES.forearm * Math.sin(fore),
    y: elbow.y + BONES.forearm * Math.cos(fore),
  };
  return { shoulder, elbow, wrist };
}

export interface MicroVariation { stride: number; arm: number; head: number; torso: number }

export function microVariation(time: number, seed: number): MicroVariation {
  'worklet';
  // Incommensurate slow sinusoids — deterministic, near-subconscious.
  const s = seed * 0.7 + 1.3;
  return {
    stride: 1 + 0.03 * Math.sin(time * 0.41 * TAU + s),
    arm: 1 + 0.045 * Math.sin(time * 0.29 * TAU + s * 2.1),
    head: 0.8 * Math.sin(time * 0.23 * TAU + s * 3.7),
    torso: 0.02 * Math.sin(time * 0.19 * TAU + s * 1.9),
  };
}

/**
 * Full running pose at cycle phase φ ∈ [0,1).
 * Subtle stop-motion character: the phase is gently pulled toward 24 poses
 * per cycle (15% weight) — smooth, but with a handmade cadence.
 */
export function runningPose(phase: number, speed: number, time: number, seed: number): RunnerPose {
  'worklet';
  const p = gaitParamsFor(speed);
  const mv = microVariation(time, seed);
  const stepped = Math.floor(phase * 24) / 24;
  const ph = (phase * 0.85 + stepped * 0.15) % 1;

  const strideHalf = p.strideHalf * mv.stride;
  const params: GaitParams = { ...p, strideHalf };

  // Pelvis: two footstrikes per cycle. Lowest just after each contact.
  const bounceWave = -Math.cos((ph - 0.06) * 2 * TAU);
  const pelvisY = PELVIS_BASE_Y - p.bounce * 0.5 - p.bounce * 0.5 * bounceWave;
  const sway = 1.6 * Math.sin(ph * TAU); // lateral weight transfer (depth axis)
  const pelvis: Vec2 = { x: PELVIS_X + sway * 0.4, y: pelvisY };

  // Legs — front leg leads, rear leg offset half a cycle. Depth separation.
  const rearFoot = footTarget((ph + 0.5) % 1, params, GROUND_Y);
  const frontFoot = footTarget(ph, params, GROUND_Y);
  const rearHip: Vec2 = { x: pelvis.x + BONES.hipHalf * 0.6, y: pelvis.y - 1 };
  const frontHip: Vec2 = { x: pelvis.x - BONES.hipHalf * 0.4, y: pelvis.y + 1 };
  const legs: [LegPose, LegPose] = [
    buildLeg(rearHip, rearFoot, pelvis.x + 2),
    buildLeg(frontHip, frontFoot, pelvis.x),
  ];

  // Torso: forward lean + counter-rotation against the pelvis.
  const lean = p.lean + mv.torso;
  const counter = 0.05 * Math.sin(ph * TAU + Math.PI);
  const chest: Vec2 = {
    x: pelvis.x + BONES.torso * Math.sin(lean),
    y: pelvis.y - BONES.torso * Math.cos(lean),
  };

  // Shoulders counter-rotate: rear shoulder forward when rear hip is back.
  const shoulderSwing = 3.2 * Math.sin(ph * TAU + Math.PI);
  const rearShoulder: Vec2 = { x: chest.x + BONES.shoulderHalf * 0.7 + shoulderSwing, y: chest.y + 2 };
  const frontShoulder: Vec2 = { x: chest.x - BONES.shoulderHalf * 0.5 - shoulderSwing, y: chest.y + 3 };

  // Arms oppose legs. The front foot reaches forward at φ≈0 (contact),
  // so the front arm is fully back at φ≈0: swing = -A·cos(φ·2π).
  const armWave = Math.cos(ph * TAU);
  const arms: [ArmPose, ArmPose] = [
    buildArm(rearShoulder, p.armAmp * mv.arm * armWave, 1.12),
    buildArm(frontShoulder, -p.armAmp * mv.arm * armWave, 1.08),
  ];

  // Head: stable, slightly delayed bob, tiny rotation.
  const head: Vec2 = {
    x: chest.x + BONES.neck * Math.sin(lean * 0.6) + mv.head * 0.5,
    y: chest.y - BONES.neck - 1.2 * Math.sin((ph - 0.09) * 2 * TAU),
  };

  // Flight vs stance drives the contact shadow.
  const contact = Math.max(rearFoot.contact, frontFoot.contact);
  const airborne = 1 - contact;

  return {
    pelvis,
    chest,
    head,
    torsoAngle: lean + counter * 0.4,
    headAngle: lean * 0.35 + mv.head * 0.02,
    ponytailAngle: 0, // spring-integrated by the frame loop
    legs,
    arms,
    breath: 0.5 + 0.5 * Math.sin(time * 1.1 * TAU),
    shadow: {
      scaleX: lerp(0.86, 1.08, contact),
      opacity: lerp(0.10, 0.2, contact) * (1 - airborne * 0.25),
    },
  };
}

/** Standing idle: breathing, slow weight shifts, arms hanging softly. */
export function idlePose(time: number, seed: number): RunnerPose {
  'worklet';
  const breathe = Math.sin(time * 0.27 * TAU + seed);
  const shift = Math.sin(time * 0.11 * TAU + seed * 2);
  const standY = GROUND_Y - BONES.ankleHeight - 63; // legs ~96% extended
  const pelvis: Vec2 = { x: PELVIS_X + shift * 1.6, y: standY - breathe * 0.5 };

  const stand = (offset: number, hipDx: number): LegPose => {
    const hip: Vec2 = { x: pelvis.x + hipDx, y: pelvis.y };
    const target: Vec2 = { x: pelvis.x + offset - shift * 1.1, y: GROUND_Y - BONES.ankleHeight };
    const { knee, ankle } = solveLegIK(hip, target, BONES.thigh, BONES.shin);
    const heel: Vec2 = { x: ankle.x - 4, y: GROUND_Y };
    return { hip, knee, ankle, heel, toe: { x: heel.x + BONES.footLen, y: GROUND_Y } };
  };

  const lean = 0.015 + breathe * 0.006;
  const chest: Vec2 = {
    x: pelvis.x + BONES.torso * Math.sin(lean),
    y: pelvis.y - BONES.torso * Math.cos(lean) - breathe * 0.7,
  };
  const armSway = 0.045 * Math.sin(time * 0.17 * TAU + seed);
  const rearShoulder: Vec2 = { x: chest.x + BONES.shoulderHalf * 0.7, y: chest.y + 2 };
  const frontShoulder: Vec2 = { x: chest.x - BONES.shoulderHalf * 0.5, y: chest.y + 3 };

  return {
    pelvis,
    chest,
    head: { x: chest.x + BONES.neck * Math.sin(lean), y: chest.y - BONES.neck - breathe * 0.4 },
    torsoAngle: lean,
    headAngle: 0.01 * Math.sin(time * 0.13 * TAU),
    ponytailAngle: 0,
    legs: [stand(4.5, BONES.hipHalf * 0.6), stand(-3.5, -BONES.hipHalf * 0.4)],
    arms: [
      buildArm(rearShoulder, 0.14 + armSway, 0.34),
      buildArm(frontShoulder, -0.1 - armSway, 0.3),
    ],
    breath: 0.5 + 0.5 * breathe,
    shadow: { scaleX: 1.0, opacity: 0.16 },
  };
}

/** Warm-up: light two-footed bounce with loose arms and heel pops. */
export function warmupPose(time: number, seed: number): RunnerPose {
  'worklet';
  const hop = Math.abs(Math.sin(time * 1.9 * Math.PI + seed));
  const base = idlePose(time, seed);
  const rise = hop * 5;

  const lift = (leg: LegPose, heelPop: number): LegPose => {
    const target = { x: leg.ankle.x, y: leg.ankle.y - rise * 0.4 - heelPop };
    const { knee, ankle } = solveLegIK(leg.hip, target, BONES.thigh, BONES.shin);
    const ang = -(heelPop + rise * 0.4) * 0.05;
    const heel = { x: ankle.x - 4, y: ankle.y + BONES.ankleHeight - (heelPop + rise * 0.4) * 0.5 };
    return { ...leg, knee, ankle, heel, toe: { x: heel.x + BONES.footLen * Math.cos(ang), y: heel.y + BONES.footLen * Math.sin(ang) + (heelPop > 0.5 ? 1 : 0) } };
  };

  const alt = Math.sin(time * 0.95 * Math.PI + seed) > 0 ? 1 : 0;
  const pelvis = { x: base.pelvis.x, y: base.pelvis.y - rise };
  const dy = base.pelvis.y - pelvis.y;

  return {
    ...base,
    pelvis,
    chest: { x: base.chest.x, y: base.chest.y - dy },
    head: { x: base.head.x, y: base.head.y - dy },
    legs: [
      lift({ ...base.legs[0], hip: { x: base.legs[0].hip.x, y: base.legs[0].hip.y - dy } }, alt ? 2.5 : 0),
      lift({ ...base.legs[1], hip: { x: base.legs[1].hip.x, y: base.legs[1].hip.y - dy } }, alt ? 0 : 2.5),
    ],
    arms: [
      buildArm({ x: base.arms[0].shoulder.x, y: base.arms[0].shoulder.y - dy }, 0.12 * Math.sin(time * 1.9 * Math.PI), 0.6),
      buildArm({ x: base.arms[1].shoulder.x, y: base.arms[1].shoulder.y - dy }, -0.12 * Math.sin(time * 1.9 * Math.PI), 0.58),
    ],
    shadow: { scaleX: lerp(1.05, 0.9, hop), opacity: lerp(0.18, 0.11, hop) },
  };
}

/**
 * Celebration overlay: one restrained fist raise + settle, c ∈ [0,1].
 * Applied on top of an idle base.
 */
export function celebrationPose(time: number, seed: number, c: number): RunnerPose {
  'worklet';
  const base = idlePose(time, seed);
  // Envelope: raise (0→0.3), hold (0.3→0.7), settle (0.7→1)
  const up = c < 0.3 ? smooth(c / 0.3) : c < 0.7 ? 1 : 1 - smooth((c - 0.7) / 0.3);
  const hop = c < 0.45 ? Math.sin(clamp01((c - 0.05) / 0.4) * Math.PI) * 4 : 0;

  const pelvis = { x: base.pelvis.x, y: base.pelvis.y - hop };
  const dy = base.pelvis.y - pelvis.y;
  const chest = { x: base.chest.x, y: base.chest.y - dy };
  const frontShoulder = { x: chest.x - BONES.shoulderHalf * 0.5, y: chest.y + 3 };
  const rearShoulder = { x: chest.x + BONES.shoulderHalf * 0.7, y: chest.y + 2 };

  // Front arm punches up-forward; rear hand settles toward the hip.
  const punchSwing = lerp(-0.1, 2.25, up); // diagonal up-forward, clear of the head
  const frontArm = buildArm(frontShoulder, punchSwing, lerp(0.3, 0.22, up));
  const rearArm = buildArm(rearShoulder, lerp(0.02, -0.25, up), lerp(0.32, 1.2, up));

  return {
    ...base,
    pelvis,
    chest,
    head: { x: base.head.x, y: base.head.y - dy - up * 0.8 },
    legs: [
      { ...base.legs[0], hip: { x: base.legs[0].hip.x, y: base.legs[0].hip.y - dy } },
      { ...base.legs[1], hip: { x: base.legs[1].hip.x, y: base.legs[1].hip.y - dy } },
    ],
    arms: [rearArm, frontArm],
    shadow: { scaleX: lerp(1, 0.92, hop / 4), opacity: lerp(0.16, 0.12, hop / 4) },
  };
}

// ── Pose blending (transitions are cross-fades of solved poses) ─────────────

function mixVec(a: Vec2, b: Vec2, t: number): Vec2 {
  'worklet';
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function mixLeg(a: LegPose, b: LegPose, t: number): LegPose {
  'worklet';
  return {
    hip: mixVec(a.hip, b.hip, t),
    knee: mixVec(a.knee, b.knee, t),
    ankle: mixVec(a.ankle, b.ankle, t),
    heel: mixVec(a.heel, b.heel, t),
    toe: mixVec(a.toe, b.toe, t),
  };
}

function mixArm(a: ArmPose, b: ArmPose, t: number): ArmPose {
  'worklet';
  return {
    shoulder: mixVec(a.shoulder, b.shoulder, t),
    elbow: mixVec(a.elbow, b.elbow, t),
    wrist: mixVec(a.wrist, b.wrist, t),
  };
}

export function mixPose(a: RunnerPose, b: RunnerPose, tRaw: number): RunnerPose {
  'worklet';
  const t = clamp01(tRaw);
  return {
    pelvis: mixVec(a.pelvis, b.pelvis, t),
    chest: mixVec(a.chest, b.chest, t),
    head: mixVec(a.head, b.head, t),
    torsoAngle: lerp(a.torsoAngle, b.torsoAngle, t),
    headAngle: lerp(a.headAngle, b.headAngle, t),
    ponytailAngle: lerp(a.ponytailAngle, b.ponytailAngle, t),
    legs: [mixLeg(a.legs[0], b.legs[0], t), mixLeg(a.legs[1], b.legs[1], t)],
    arms: [mixArm(a.arms[0], b.arms[0], t), mixArm(a.arms[1], b.arms[1], t)],
    breath: lerp(a.breath, b.breath, t),
    shadow: {
      scaleX: lerp(a.shadow.scaleX, b.shadow.scaleX, t),
      opacity: lerp(a.shadow.opacity, b.shadow.opacity, t),
    },
  };
}
