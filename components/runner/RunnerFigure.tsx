/**
 * STRIDE Runner — clay figure renderer.
 *
 * Renders the solved skeleton as gradient-shaded capsules. Every segment is
 * a fixed-size view whose transform (midpoint + rotation) comes from an
 * animated style reading the shared pose — no layout work, no React state,
 * 60fps on the UI thread.
 *
 * "Studio lighting" is baked into the material: a key light from the upper
 * left (light → shadow gradient across each capsule), darker material on
 * rear limbs for real depth separation, and a soft dynamic contact shadow.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { BONES, DESIGN_H, DESIGN_W, GROUND_Y } from './motion';
import { RunnerPose, Vec2 } from './types';

// ── Clay material (key light upper-left, matte, slight warmth) ──────────────
const CLAY_FRONT = ['#F3EDDD', '#E7DEC8', '#D3C8AC'] as const;
const CLAY_REAR = ['#DED5BF', '#CEC3A8', '#B9AD90'] as const;
const INK_MAT = ['#23211E', '#121110', '#0A0A0A'] as const;

interface SegSpec {
  key: string;
  sel: (p: RunnerPose) => [Vec2, Vec2];
  w: number;
  len: number;
  colors: readonly [string, string, string];
  /** square the top end (used by shorts cuffs so they fuse with the block) */
  flatTop?: boolean;
}

// Selectors are module-scope worklets so animated styles can call them.
const selRearThigh = (p: RunnerPose): [Vec2, Vec2] => { 'worklet'; return [p.legs[0].hip, p.legs[0].knee]; };
const selRearShin = (p: RunnerPose): [Vec2, Vec2] => { 'worklet'; return [p.legs[0].knee, p.legs[0].ankle]; };
const selRearFoot = (p: RunnerPose): [Vec2, Vec2] => { 'worklet'; return [p.legs[0].heel, p.legs[0].toe]; };
const selFrontThigh = (p: RunnerPose): [Vec2, Vec2] => { 'worklet'; return [p.legs[1].hip, p.legs[1].knee]; };
const selFrontShin = (p: RunnerPose): [Vec2, Vec2] => { 'worklet'; return [p.legs[1].knee, p.legs[1].ankle]; };
const selFrontFoot = (p: RunnerPose): [Vec2, Vec2] => { 'worklet'; return [p.legs[1].heel, p.legs[1].toe]; };
const selRearUpperArm = (p: RunnerPose): [Vec2, Vec2] => { 'worklet'; return [p.arms[0].shoulder, p.arms[0].elbow]; };
const selRearForearm = (p: RunnerPose): [Vec2, Vec2] => { 'worklet'; return [p.arms[0].elbow, p.arms[0].wrist]; };
const selFrontUpperArm = (p: RunnerPose): [Vec2, Vec2] => { 'worklet'; return [p.arms[1].shoulder, p.arms[1].elbow]; };
const selFrontForearm = (p: RunnerPose): [Vec2, Vec2] => { 'worklet'; return [p.arms[1].elbow, p.arms[1].wrist]; };
const selTorso = (p: RunnerPose): [Vec2, Vec2] => { 'worklet'; return [p.pelvis, p.chest]; };
const selNeck = (p: RunnerPose): [Vec2, Vec2] => { 'worklet'; return [p.chest, p.head]; };
const selRearCuff = (p: RunnerPose): [Vec2, Vec2] => {
  'worklet';
  const { hip, knee } = p.legs[0];
  return [hip, { x: hip.x + (knee.x - hip.x) * 0.42, y: hip.y + (knee.y - hip.y) * 0.42 }];
};
const selFrontCuff = (p: RunnerPose): [Vec2, Vec2] => {
  'worklet';
  const { hip, knee } = p.legs[1];
  return [hip, { x: hip.x + (knee.x - hip.x) * 0.42, y: hip.y + (knee.y - hip.y) * 0.42 }];
};

function makeSegs(accent: string, accentDark: string): SegSpec[] {
  const ACCENT_MAT = [accent, accent, accentDark] as const;
  return [
    // Paint order = depth order: rear limbs → body → front limbs.
    { key: 'ra1', sel: selRearUpperArm, w: 9, len: BONES.upperArm, colors: CLAY_REAR },
    { key: 'ra2', sel: selRearForearm, w: 8, len: BONES.forearm, colors: CLAY_REAR },
    { key: 'rl1', sel: selRearThigh, w: 12.5, len: BONES.thigh, colors: CLAY_REAR },
    { key: 'rl2', sel: selRearShin, w: 10, len: BONES.shin, colors: CLAY_REAR },
    { key: 'rlf', sel: selRearFoot, w: 9.5, len: BONES.footLen, colors: [accentDark, accentDark, '#7A2A12'] },
    { key: 'rcuff', sel: selRearCuff, w: 13, len: BONES.thigh * 0.4, colors: INK_MAT, flatTop: true },
    { key: 'torso', sel: selTorso, w: 17, len: BONES.torso, colors: CLAY_FRONT },
    { key: 'neck', sel: selNeck, w: 7.5, len: BONES.neck + 4, colors: CLAY_FRONT },
    { key: 'fl1', sel: selFrontThigh, w: 12.5, len: BONES.thigh, colors: CLAY_FRONT },
    { key: 'fl2', sel: selFrontShin, w: 10, len: BONES.shin, colors: CLAY_FRONT },
    { key: 'flf', sel: selFrontFoot, w: 9.5, len: BONES.footLen, colors: ACCENT_MAT },
    { key: 'fcuff', sel: selFrontCuff, w: 13, len: BONES.thigh * 0.4, colors: INK_MAT, flatTop: true },
    { key: 'fa1', sel: selFrontUpperArm, w: 9, len: BONES.upperArm, colors: CLAY_FRONT },
    { key: 'fa2', sel: selFrontForearm, w: 8, len: BONES.forearm, colors: CLAY_FRONT },
  ];
}

// ── One capsule segment ─────────────────────────────────────────────────────

function Capsule({ pose, spec }: { pose: SharedValue<RunnerPose>; spec: SegSpec }) {
  const { sel, w, len } = spec;
  const style = useAnimatedStyle(() => {
    const [a, b] = sel(pose.value);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const angle = Math.atan2(b.x - a.x, b.y - a.y);
    return {
      transform: [
        { translateX: mx - w / 2 },
        { translateY: my - len / 2 },
        { rotate: `${angle}rad` },
      ],
    };
  });
  return (
    <Animated.View style={[st.seg, { width: w, height: len }, style]} pointerEvents="none">
      <LinearGradient
        colors={[...spec.colors]}
        start={{ x: 0, y: 0.1 }}
        end={{ x: 1, y: 0.9 }}
        style={[st.fill, spec.flatTop
          ? { borderBottomLeftRadius: w / 2, borderBottomRightRadius: w / 2, borderTopLeftRadius: 2, borderTopRightRadius: 2 }
          : { borderRadius: w / 2 }]}
      />
    </Animated.View>
  );
}

// ── Full figure ─────────────────────────────────────────────────────────────

export interface RunnerFigureProps {
  pose: SharedValue<RunnerPose>;
  height: number;
  ponytail?: boolean;
  accent?: string;
}

const HEAD_R = 12;

export function RunnerFigure({ pose, height, ponytail = false, accent = '#FF3D00' }: RunnerFigureProps) {
  const scale = height / DESIGN_H;
  const accentDark = '#B33110';
  const segs = React.useMemo(() => makeSegs(accent, accentDark), [accent]);

  // Hands — small clay spheres at the wrists
  const rearHand = useAnimatedStyle(() => ({
    transform: [
      { translateX: pose.value.arms[0].wrist.x - 4.5 },
      { translateY: pose.value.arms[0].wrist.y - 4.5 },
    ],
  }));
  const frontHand = useAnimatedStyle(() => ({
    transform: [
      { translateX: pose.value.arms[1].wrist.x - 4.5 },
      { translateY: pose.value.arms[1].wrist.y - 4.5 },
    ],
  }));

  // Head — stable circle with a baked key-light highlight
  const head = useAnimatedStyle(() => ({
    transform: [
      { translateX: pose.value.head.x - HEAD_R },
      { translateY: pose.value.head.y - HEAD_R - 1 },
      { rotate: `${pose.value.headAngle}rad` },
    ],
  }));

  // Ponytail — spring angle from the frame loop
  const pony = useAnimatedStyle(() => {
    const p = pose.value;
    const baseAngle = 2.35 + p.ponytailAngle; // hangs back-down from the head
    return {
      transform: [
        { translateX: p.head.x - 4 },
        { translateY: p.head.y - 10 },
        { rotate: `${baseAngle}rad` },
      ],
    };
  });

  // Shorts block rotates with the torso
  const shorts = useAnimatedStyle(() => ({
    transform: [
      { translateX: pose.value.pelvis.x - 12.5 },
      { translateY: pose.value.pelvis.y - 9 },
      { rotate: `${pose.value.torsoAngle}rad` },
    ],
  }));

  // Chest mass breathes very slightly
  const chest = useAnimatedStyle(() => {
    const p = pose.value;
    const mx = p.chest.x;
    const my = p.chest.y + 3;
    return {
      transform: [
        { translateX: mx - 10.5 },
        { translateY: my - 11 },
        { rotate: `${p.torsoAngle}rad` },
        { scale: 1 + p.breath * 0.02 },
      ],
    };
  });

  // Soft dynamic contact shadow
  const shadowOuter = useAnimatedStyle(() => ({
    opacity: pose.value.shadow.opacity * 0.32,
    transform: [
      { translateX: pose.value.pelvis.x - 37 },
      { translateY: GROUND_Y + 3 },
      { scaleX: pose.value.shadow.scaleX * 1.15 },
    ],
  }));
  const shadowInner = useAnimatedStyle(() => ({
    opacity: pose.value.shadow.opacity * 0.75,
    transform: [
      { translateX: pose.value.pelvis.x - 24 },
      { translateY: GROUND_Y + 4 },
      { scaleX: pose.value.shadow.scaleX },
    ],
  }));

  return (
    <View style={{ width: DESIGN_W * scale, height, overflow: 'visible' }} pointerEvents="none">
      <View style={{ width: DESIGN_W, height: DESIGN_H, transform: [{ scale }], transformOrigin: 'top left' }}>
        <Animated.View style={[st.shadowOuter, shadowOuter]} />
        <Animated.View style={[st.shadowInner, shadowInner]} />

        <Animated.View style={[st.hand, { backgroundColor: CLAY_REAR[1] }, rearHand]} />
        {segs.slice(0, 6).map(sp => <Capsule key={sp.key} pose={pose} spec={sp} />)}
        {segs.slice(6, 12).map(sp => <Capsule key={sp.key} pose={pose} spec={sp} />)}

        {/* Shorts block paints over both cuff tops so the unit reads as one */}
        <Animated.View style={[st.shorts, shorts]}>
          <LinearGradient colors={[...INK_MAT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[st.fill, { borderRadius: 7 }]} />
        </Animated.View>

        {segs.slice(12).map(sp => <Capsule key={sp.key} pose={pose} spec={sp} />)}

        {/* Chest mass */}
        <Animated.View style={[st.chest, chest]}>
          <LinearGradient colors={[...CLAY_FRONT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[st.fill, { borderRadius: 10.5 }]} />
        </Animated.View>

        {ponytail && (
          <Animated.View style={[st.pony, pony]}>
            <LinearGradient colors={[...CLAY_REAR]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[st.fill, { borderRadius: 4.5 }]} />
          </Animated.View>
        )}

        <Animated.View style={[st.head, head]}>
          <LinearGradient
            colors={['#F6F0E1', '#E9E0CA', '#D2C7AB']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.95, y: 1 }}
            style={[st.fill, { borderRadius: HEAD_R }]}
          />
          {/* key-light catch */}
          <View style={st.headHighlight} />
        </Animated.View>

        <Animated.View style={[st.hand, { backgroundColor: CLAY_FRONT[1] }, frontHand]} />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  seg: { position: 'absolute', left: 0, top: 0 },
  fill: { flex: 1 },
  hand: { position: 'absolute', left: 0, top: 0, width: 9, height: 9, borderRadius: 4.5 },
  head: { position: 'absolute', left: 0, top: 0, width: HEAD_R * 2, height: HEAD_R * 2 },
  headHighlight: {
    position: 'absolute', left: 4, top: 3, width: 7, height: 5,
    borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)',
  },
  pony: { position: 'absolute', left: 0, top: 0, width: 9, height: 16 },
  shorts: { position: 'absolute', left: 0, top: 0, width: 25, height: 15 },
  chest: { position: 'absolute', left: 0, top: 0, width: 21, height: 22 },
  shadowOuter: {
    position: 'absolute', left: 0, top: 0, width: 74, height: 9,
    borderRadius: 5, backgroundColor: '#0A0A0A',
  },
  shadowInner: {
    position: 'absolute', left: 0, top: 0, width: 48, height: 6,
    borderRadius: 3.5, backgroundColor: '#0A0A0A',
  },
});
