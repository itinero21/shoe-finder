/**
 * STRIDE Runner — motion hook.
 *
 * One Reanimated frame callback on the UI thread integrates the whole
 * character: gait phase, state cross-fades, start/stop behavior, the
 * celebration one-shot, and the ponytail spring. React never re-renders
 * during animation — the solved pose lives in a shared value the figure
 * reads from.
 */
import { useEffect } from 'react';
import { AppState } from 'react-native';
import {
  useFrameCallback, useSharedValue, SharedValue,
} from 'react-native-reanimated';
import {
  celebrationPose, clamp01, gaitParamsFor, idlePose, lerp, mixPose, runningPose, warmupPose,
} from './motion';
import { RunnerPose, RunnerState } from './types';

export interface RunnerMotion {
  pose: SharedValue<RunnerPose>;
}

export function useRunnerMotion(
  state: RunnerState,
  speed: number,
  seed: number,
  paused: boolean,
  reducedMotion: boolean,
): RunnerMotion {
  const pose = useSharedValue<RunnerPose>(idlePose(0, seed));

  // Inputs mirrored into shared values so the worklet sees changes live
  const targetRun = useSharedValue(state === 'running' ? 1 : 0);
  const targetWarm = useSharedValue(state === 'warmup' ? 1 : 0);
  const celebT = useSharedValue(1.01);            // >1 = inactive
  const speedTarget = useSharedValue(clamp01(speed));
  const reduced = useSharedValue(reducedMotion ? 1 : 0);

  // Integrator state
  const time = useSharedValue(0);
  const phase = useSharedValue(0);
  const runW = useSharedValue(state === 'running' ? 1 : 0);
  const warmW = useSharedValue(state === 'warmup' ? 1 : 0);
  const spd = useSharedValue(clamp01(speed));
  const ponyAngle = useSharedValue(0);
  const ponyVel = useSharedValue(0);
  const prevHeadX = useSharedValue(0);

  useEffect(() => {
    targetRun.value = state === 'running' ? 1 : 0;
    targetWarm.value = state === 'warmup' ? 1 : 0;
    if (state === 'celebration' && celebT.value > 1) celebT.value = 0;
  }, [state, targetRun, targetWarm, celebT]);

  useEffect(() => { speedTarget.value = clamp01(speed); }, [speed, speedTarget]);
  useEffect(() => { reduced.value = reducedMotion ? 1 : 0; }, [reducedMotion, reduced]);

  const frame = useFrameCallback((info) => {
    'worklet';
    const dt = Math.min(0.05, (info.timeSincePreviousFrame ?? 16) / 1000);
    time.value += dt;
    const t = time.value;

    if (reduced.value === 1) {
      // Reduced motion: breathing idle only.
      pose.value = idlePose(t * 0.6, 3);
      return;
    }

    // Smooth speed changes
    spd.value += (speedTarget.value - spd.value) * Math.min(1, dt * 3.5);

    // State weights: exponential approach ≈ 450ms start, 550ms stop.
    const runGoal = targetRun.value;
    const runRate = runGoal > runW.value ? dt / 0.45 : dt / 0.55;
    runW.value = clamp01(runW.value + (runGoal - runW.value > 0 ? 1 : -1) * Math.min(Math.abs(runGoal - runW.value), runRate));
    warmW.value = clamp01(warmW.value + (targetWarm.value - warmW.value) * Math.min(1, dt * 5));

    // Gait phase integrates slower while starting/stopping — the first and
    // last steps are longer, which is what sells the transition.
    const w = runW.value;
    if (w > 0.01) {
      const freq = gaitParamsFor(spd.value).frequency;
      phase.value = (phase.value + dt * freq * (0.35 + 0.65 * w)) % 1;
    } else {
      phase.value = 0;
    }

    // Base pose: idle ↔ running with an eased blend (adds the lean-in).
    const eased = w * w * (3 - 2 * w);
    let out = mixPose(idlePose(t, 3), runningPose(phase.value, spd.value, t, 3), eased);

    if (warmW.value > 0.01) {
      out = mixPose(out, warmupPose(t, 3), warmW.value);
    }

    // Celebration one-shot rides on top, then hands control back.
    if (celebT.value <= 1) {
      const c = celebT.value;
      const inOut = Math.min(1, c / 0.12, (1.02 - c) / 0.18);
      out = mixPose(out, celebrationPose(t, 3, c), clamp01(inOut));
      celebT.value = c + dt / 1.5;
    }

    // Ponytail: damped spring chasing head motion + torso lean.
    const headVelX = (out.head.x - prevHeadX.value) / Math.max(dt, 1 / 240);
    prevHeadX.value = out.head.x;
    const target = -out.torsoAngle * 1.15 - headVelX * 0.012;
    const springK = 42;
    const springC = 8.5;
    const acc = springK * (target - ponyAngle.value) - springC * ponyVel.value;
    ponyVel.value += acc * dt;
    ponyAngle.value += ponyVel.value * dt;

    out.ponytailAngle = ponyAngle.value;
    pose.value = out;
  }, true);

  // Pause when asked, and whenever the app leaves the foreground.
  useEffect(() => {
    frame.setActive(!paused);
    const sub = AppState.addEventListener('change', s => {
      frame.setActive(s === 'active' && !paused);
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  return { pose };
}

export { lerp };
