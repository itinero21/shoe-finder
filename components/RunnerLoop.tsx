/**
 * RUNNER LOOP — Minimal clay-3D running character.
 *
 * A stylized runner in a perpetual run cycle whose gait physically responds
 * to the foam under their feet:
 *
 *   FRESH FOAM (freshness ~100)
 *     - high flight phase, springy bounce
 *     - quick foam rebound at footstrike
 *     - fast cadence
 *
 *   SPENT FOAM (freshness ~0)
 *     - flat, heavy shuffle — almost no air time
 *     - foam bottoms out at footstrike and barely recovers
 *     - slow cadence
 *
 * Built entirely with native-driver Animated transforms — 60fps, no SVG
 * re-renders. Clay aesthetic: soft ivory body, ink shorts, the shoe pops
 * in the brand color.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, StyleSheet } from 'react-native';

// ── Brand colors (used to paint the runner's shoes) ─────────────────────────
const BRAND_COLORS: Record<string, string> = {
  'Brooks': '#2E5FDB', 'HOKA': '#F26B3A', 'ASICS': '#2B4FA8', 'Saucony': '#1E8A6E',
  'New Balance': '#6E7480', 'On': '#E8E5DE', 'Mizuno': '#1C6FB8', 'Altra': '#0F8B8D',
  'Topo': '#77803C', 'PUMA': '#1A1A1A', 'Salomon': '#232830',
};

/** Primary brand color — paints the runner's shoe */
export function getBrandColor(brand: string): string {
  return BRAND_COLORS[brand] ?? '#FF3D00';
}

const CLAY       = '#EAE3D5';
const CLAY_BACK  = '#CFC6B3';  // back limbs, pushed back in depth
const CLAY_DARK  = '#B8AE99';
const INK        = '#0A0A0A';

export interface RunnerLoopProps {
  /** 0 = foam is spent, 100 = foam is brand new */
  freshness?: number;
  /** shoe color (brand color) */
  shoeColor?: string;
  /** total height in px */
  size?: number;
  /** 'w' adds a ponytail */
  variant?: 'm' | 'w';
}

const KEYS = [0, 0.25, 0.5, 0.75, 1];

export function RunnerLoop({
  freshness = 100,
  shoeColor = '#FF3D00',
  size = 150,
  variant = 'm',
}: RunnerLoopProps) {
  const fresh = Math.max(0, Math.min(100, freshness)) / 100;

  // ── Physics derived from foam freshness ────────────────────────────────
  const flight   = 1.5 + 5.0 * fresh;          // upward bounce (px)
  const sink     = 7.5 - 4.5 * fresh;          // downward sink at stance (px)
  const squash   = 0.55 + 0.33 * fresh;        // foam scaleY at footstrike
  const rebound  = fresh > 0.5 ? 1 : 0.85;     // spent foam doesn't fully return
  const cycleMs  = 950 - 280 * fresh;          // cadence

  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    t.setValue(0);
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: cycleMs,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [t, cycleMs]);

  // ── Run-cycle keyframes ────────────────────────────────────────────────
  // Front leg strikes at t=0.25, back leg at t=0.75
  const thighFront = t.interpolate({ inputRange: KEYS, outputRange: ['-42deg', '-4deg', '32deg', '2deg', '-42deg'] });
  const thighBack  = t.interpolate({ inputRange: KEYS, outputRange: ['32deg', '2deg', '-42deg', '-4deg', '32deg'] });
  const kneeFront  = t.interpolate({ inputRange: KEYS, outputRange: ['22deg', '14deg', '34deg', '104deg', '22deg'] });
  const kneeBack   = t.interpolate({ inputRange: KEYS, outputRange: ['34deg', '104deg', '22deg', '14deg', '34deg'] });
  const armFront   = t.interpolate({ inputRange: KEYS, outputRange: ['34deg', '4deg', '-36deg', '-2deg', '34deg'] });
  const armBack    = t.interpolate({ inputRange: KEYS, outputRange: ['-36deg', '-2deg', '34deg', '4deg', '-36deg'] });

  // The foot needs its own joint. Without this counter-rotation the shoe
  // inherits thigh + knee rotation and can turn more than 100° in recovery.
  // These angles keep the shoe close to level at contact while allowing a
  // natural toe-up recovery position in flight.
  const ankleFront = t.interpolate({
    inputRange: KEYS,
    outputRange: ['12deg', '-8deg', '-52deg', '-124deg', '12deg'],
  });
  const ankleBack = t.interpolate({
    inputRange: KEYS,
    outputRange: ['-52deg', '-124deg', '12deg', '-8deg', '-52deg'],
  });

  // Vertical bob — flight at 0/0.5, sink at footstrikes 0.25/0.75
  const bob = t.interpolate({
    inputRange: KEYS,
    outputRange: [-flight, sink, -flight, sink, -flight],
  });

  // Foam squash at each foot's contact moment
  const footSquashFront = t.interpolate({
    inputRange: [0, 0.15, 0.25, 0.38, 1],
    outputRange: [rebound, 1, squash, rebound, rebound],
  });
  const footSquashBack = t.interpolate({
    inputRange: [0, 0.65, 0.75, 0.88, 1],
    outputRange: [rebound, rebound, squash, rebound, rebound],
  });

  // Ground shadow breathes opposite to the bounce
  const shadowScale = t.interpolate({
    inputRange: KEYS,
    outputRange: [0.82, 1.12, 0.82, 1.12, 0.82],
  });

  const scale = size / 150;

  return (
    <View style={{ width: 150 * scale, height: 150 * scale, overflow: 'visible' }}>
      <View style={{ width: 150, height: 150, transform: [{ scale }], transformOrigin: 'top left' }}>

        {/* Ground shadow */}
        <Animated.View
          style={[st.shadow, { transform: [{ scaleX: shadowScale }] }]}
        />

        {/* Body group — bobs with each stride */}
        <Animated.View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, transform: [{ translateY: bob }] }}>

          {/* BACK ARM */}
          <Animated.View style={[st.armPivot, st.backArmPivot, { transform: [{ rotate: armBack }] }]}>
            <View style={[st.upperArm, { backgroundColor: CLAY_BACK }]} />
            <View style={[st.forearm, { backgroundColor: CLAY_BACK }]} />
          </Animated.View>

          {/* BACK LEG */}
          <Animated.View style={[st.thighPivot, st.backLegPivot, { transform: [{ rotate: thighBack }] }]}>
            <View style={[st.thigh, { backgroundColor: CLAY_BACK }]} />
            <Animated.View style={[st.kneePivot, { transform: [{ rotate: kneeBack }] }]}>
              <View style={[st.kneeCap, { backgroundColor: CLAY_BACK }]} />
              <View style={[st.shin, { backgroundColor: CLAY_BACK }]} />
              {/* Shoe: upper + foam that squashes on impact */}
              <Animated.View style={[st.footGroup, { transform: [{ rotate: ankleBack }] }]}>
                <View style={[st.shoeUpper, { backgroundColor: shoeColor, opacity: 0.75 }]} />
                <Animated.View style={[st.foam, { transform: [{ scaleY: footSquashBack }] }]} />
                <View style={st.outsole} />
              </Animated.View>
            </Animated.View>
          </Animated.View>

          {/* TORSO */}
          <View style={st.torso} />
          {/* Shorts */}
          <View style={st.shorts} />
          {/* HEAD */}
          <View style={st.head} />
          <View style={st.ear} />
          <View style={st.nose} />
          {variant === 'w' && <View style={st.ponytail} />}

          {/* FRONT LEG */}
          <Animated.View style={[st.thighPivot, st.frontLegPivot, { transform: [{ rotate: thighFront }] }]}>
            <View style={[st.thigh, { backgroundColor: CLAY }]} />
            <Animated.View style={[st.kneePivot, { transform: [{ rotate: kneeFront }] }]}>
              <View style={[st.kneeCap, { backgroundColor: CLAY }]} />
              <View style={[st.shin, { backgroundColor: CLAY }]} />
              <Animated.View style={[st.footGroup, { transform: [{ rotate: ankleFront }] }]}>
                <View style={[st.shoeUpper, { backgroundColor: shoeColor }]} />
                <Animated.View style={[st.foam, { transform: [{ scaleY: footSquashFront }] }]} />
                <View style={st.outsole} />
              </Animated.View>
            </Animated.View>
          </Animated.View>

          {/* FRONT ARM */}
          <Animated.View style={[st.armPivot, st.frontArmPivot, { transform: [{ rotate: armFront }] }]}>
            <View style={[st.upperArm, { backgroundColor: CLAY }]} />
            <View style={[st.forearm, { backgroundColor: CLAY }]} />
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  shadow: {
    position: 'absolute',
    bottom: 6,
    left: 45,
    width: 60,
    height: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(10,10,10,0.14)',
  },

  // Torso leans slightly forward — runner posture
  torso: {
    position: 'absolute',
    left: 66,
    top: 42,
    width: 17,
    height: 40,
    borderRadius: 9,
    backgroundColor: CLAY,
    transform: [{ rotate: '10deg' }],
  },
  shorts: {
    position: 'absolute',
    left: 64,
    top: 72,
    width: 20,
    height: 16,
    borderRadius: 8,
    backgroundColor: INK,
    transform: [{ rotate: '8deg' }],
  },
  head: {
    position: 'absolute',
    left: 70,
    top: 22,
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: CLAY,
  },
  ear: {
    position: 'absolute',
    left: 68,
    top: 30,
    width: 6,
    height: 7,
    borderRadius: 4,
    backgroundColor: CLAY_DARK,
  },
  nose: {
    position: 'absolute',
    left: 88,
    top: 30,
    width: 6,
    height: 7,
    borderRadius: 4,
    backgroundColor: CLAY,
  },
  ponytail: {
    position: 'absolute',
    left: 60,
    top: 26,
    width: 16,
    height: 8,
    borderRadius: 5,
    backgroundColor: CLAY_DARK,
    transform: [{ rotate: '-24deg' }],
  },

  // ── Legs — pivot at the hip, knee pivot nested inside ──────────────────
  thighPivot: {
    position: 'absolute',
    left: 68,
    top: 80,
    width: 12,
    height: 30,
    transformOrigin: 'top center',
  },
  backLegPivot: { left: 66 },
  frontLegPivot: { left: 70 },
  thigh: {
    width: 12,
    height: 32,
    borderRadius: 6,
  },
  kneePivot: {
    position: 'absolute',
    left: 1,
    top: 28,
    width: 10,
    height: 28,
    transformOrigin: 'top center',
  },
  kneeCap: {
    position: 'absolute',
    left: -1,
    top: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  shin: {
    width: 10,
    height: 30,
    borderRadius: 5,
  },
  footGroup: {
    position: 'absolute',
    left: 3,
    top: 26,
    width: 24,
    height: 14,
    transformOrigin: 'left center',
  },
  shoeUpper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 24,
    height: 7,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 2,
  },
  foam: {
    position: 'absolute',
    top: 6,
    left: 0,
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F4F1EA',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10,10,10,0.25)',
    transformOrigin: 'bottom center',
  },
  outsole: {
    position: 'absolute',
    left: 1,
    top: 11,
    width: 23,
    height: 2,
    borderRadius: 1,
    backgroundColor: INK,
    opacity: 0.75,
  },

  // ── Arms — pivot at the shoulder, forearm fixed at a runner's bend ─────
  armPivot: {
    position: 'absolute',
    left: 70,
    top: 46,
    width: 10,
    height: 22,
    transformOrigin: 'top center',
  },
  backArmPivot: { left: 67 },
  frontArmPivot: { left: 72 },
  upperArm: {
    width: 10,
    height: 24,
    borderRadius: 5,
  },
  forearm: {
    position: 'absolute',
    left: 3,
    top: 20,
    width: 9,
    height: 20,
    borderRadius: 5,
    transform: [{ rotate: '-74deg' }],
    transformOrigin: 'top center',
  },
});

export default RunnerLoop;
