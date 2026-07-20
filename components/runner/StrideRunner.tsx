/**
 * STRIDE RUNNER — public component.
 *
 * A small handcrafted clay runner for the STRIDE interface.
 *
 *   <StrideRunner state="running" speed={0.6} size="large" ponytail />
 *
 * - states: idle | running | warmup | celebration (transitions are internal
 *   cross-fades — never clip switches)
 * - speed interpolates cadence, stride length, knee drive, arm swing
 * - honors the system reduced-motion setting (breathing idle only)
 * - pauses when the app backgrounds or `paused` is set
 * - if anything inside the new renderer throws, the previous shape-based
 *   runner (RunnerLoop) takes over — never an empty box
 */
import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { RunnerLoop } from '../RunnerLoop';
import { RunnerFigure } from './RunnerFigure';
import { useRunnerMotion } from './useRunnerMotion';
import { StrideRunnerProps } from './types';

const SIZES = { small: 92, medium: 132, large: 184 } as const;

function resolveSize(size: StrideRunnerProps['size']): number {
  if (typeof size === 'number') return size;
  return SIZES[size ?? 'medium'];
}

function RunnerInner({
  state = 'running',
  speed = 0.6,
  size = 'medium',
  ponytail = false,
  accent = '#FF3D00',
  seed = 3,
  paused = false,
}: StrideRunnerProps) {
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(v => { if (mounted) setReducedMotion(v); }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { mounted = false; sub.remove(); };
  }, []);

  const height = resolveSize(size);
  const { pose } = useRunnerMotion(state, speed, seed, paused, reducedMotion);

  return <RunnerFigure pose={pose} height={height} ponytail={ponytail} accent={accent} />;
}

interface BoundaryState { failed: boolean }

export class StrideRunner extends React.Component<StrideRunnerProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.warn('[StrideRunner] falling back to legacy runner:', error?.message);
  }

  render() {
    if (this.state.failed) {
      // Legacy shape runner — always works, never an empty space.
      return (
        <RunnerLoop
          freshness={100}
          shoeColor={this.props.accent ?? '#FF3D00'}
          size={resolveSize(this.props.size)}
          variant={this.props.ponytail ? 'w' : 'm'}
        />
      );
    }
    return <RunnerInner {...this.props} />;
  }
}

export default StrideRunner;
