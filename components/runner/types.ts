/** STRIDE Runner — public types. */

export type RunnerState = 'idle' | 'running' | 'warmup' | 'celebration';

export type RunnerSize = 'small' | 'medium' | 'large' | number;

export interface StrideRunnerProps {
  /** Behavior state. Transitions (start/stop) are handled internally. */
  state?: RunnerState;
  /** 0 = standstill, 1 = fast running. Interpolates cadence, stride, knee drive. */
  speed?: number;
  /** Named tier or explicit pixel height. */
  size?: RunnerSize;
  /** Ponytail variant with secondary motion. */
  ponytail?: boolean;
  /** Small accent color for the feet. Defaults to STRIDE safety orange. */
  accent?: string;
  /** Deterministic micro-variation seed (same seed → same motion). */
  seed?: number;
  /** Hard-pause the animation loop (e.g. when scrolled far off-screen). */
  paused?: boolean;
}

export interface Vec2 { x: number; y: number }

export interface LegPose {
  hip: Vec2;
  knee: Vec2;
  ankle: Vec2;
  heel: Vec2;
  toe: Vec2;
}

export interface ArmPose {
  shoulder: Vec2;
  elbow: Vec2;
  wrist: Vec2;
}

/** A full skeleton pose in design space (see DESIGN_W/H in motion.ts). */
export interface RunnerPose {
  pelvis: Vec2;
  chest: Vec2;
  head: Vec2;
  /** radians, clockwise from vertical — torso lean */
  torsoAngle: number;
  headAngle: number;
  ponytailAngle: number;
  /** [rear, front] */
  legs: [LegPose, LegPose];
  /** [rear, front] */
  arms: [ArmPose, ArmPose];
  /** 0..1 — chest breathing scale driver */
  breath: number;
  shadow: { scaleX: number; opacity: number };
}
