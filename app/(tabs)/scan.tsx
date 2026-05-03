import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  Alert,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { Quiz } from '../../components/Quiz';
import { SHOES } from '../data/shoes';
import { Shoe } from '../data/shoes';
import { QuizAnswers, getRecommendations, ScoredShoe } from '../utils/scoring';
import { addToFavorites } from '../utils/storage';

// ─── Design tokens ────────────────────────────────────────
const INK = '#0A0A0A';
const PAPER = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME = '#D4FF00';
const MONO = 'SpaceMono';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const { width: SCREEN_W } = Dimensions.get('window');

type Mode = 'splash' | 'results' | 'detail';

// ─── Marquee ──────────────────────────────────────────────
interface MarqueeProps {
  text: string;
  textColor: string;
  bgColor: string;
  bordered?: boolean;
  fast?: boolean;
}

const Marquee: React.FC<MarqueeProps> = ({ text, textColor, bgColor, bordered = true, fast = false }) => {
  const animX = useRef(new Animated.Value(0)).current;
  const unitWidthRef = useRef(0);
  const startedRef = useRef(false);

  const startAnim = useCallback(() => {
    if (startedRef.current || unitWidthRef.current === 0) return;
    startedRef.current = true;
    Animated.loop(
      Animated.timing(animX, {
        toValue: -unitWidthRef.current,
        duration: fast ? 14000 : 30000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [animX, fast]);

  useEffect(() => () => animX.stopAnimation(), [animX]);

  const segment = `${text}   ✦   `;

  return (
    <View style={[
      s.marqueeWrap,
      { backgroundColor: bgColor },
      bordered && { borderTopWidth: 2, borderBottomWidth: 2, borderColor: textColor },
    ]}>
      <Animated.View style={[s.marqueeRow, { transform: [{ translateX: animX }] }]}>
        {Array.from({ length: 12 }, (_, i) => (
          <Text
            key={i}
            onLayout={i === 0 ? (e) => {
              if (unitWidthRef.current === 0) {
                unitWidthRef.current = e.nativeEvent.layout.width;
                startAnim();
              }
            } : undefined}
            style={[s.marqueeText, { color: textColor }]}
          >
            {segment}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
};

// ─── PulseDot ─────────────────────────────────────────────
const PulseDot: React.FC = () => {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.5, duration: 500, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, [scale]);
  return (
    <Animated.View style={[s.pulseDot, { transform: [{ scale }] }]} />
  );
};

// ─── Hard shadow card ─────────────────────────────────────
const HardShadow: React.FC<{
  children: React.ReactNode;
  shadowColor?: string;
  style?: any;
}> = ({ children, shadowColor = INK, style }) => (
  <View style={s.hardShadowWrap}>
    <View style={[s.hardShadowBg, { backgroundColor: shadowColor }]} />
    <View style={[s.hardShadowFg, style]}>
      {children}
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────
export default function ScanScreen() {
  const [mode, setMode] = useState<Mode>('splash');
  const [showQuiz, setShowQuiz] = useState(false);
  const [recs, setRecs] = useState<ScoredShoe[]>([]);
  const [answers, setAnswers] = useState<QuizAnswers | null>(null);
  const [selectedShoe, setSelectedShoe] = useState<ScoredShoe | null>(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const insets = useSafeAreaInsets();

  const handleQuizComplete = (quizAnswers: QuizAnswers) => {
    const results = getRecommendations(quizAnswers, SHOES);
    setRecs(results);
    setAnswers(quizAnswers);
    setShowQuiz(false);
    setMode('results');
    setVisibleCount(3);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleReset = () => {
    setMode('splash');
    setRecs([]);
    setAnswers(null);
    setSelectedShoe(null);
    setVisibleCount(3);
  };

  const handleAddToRotation = async (shoeId: string) => {
    try {
      await addToFavorites(shoeId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Added to Arsenal', 'Shoe saved to My Rotation.');
    } catch {
      /* ignore */
    }
  };

  // ── Quiz ────────────────────────────────────────────────
  if (showQuiz) {
    return (
      <Quiz
        onComplete={handleQuizComplete}
        onBack={() => setShowQuiz(false)}
      />
    );
  }

  // ── Detail ──────────────────────────────────────────────
  if (mode === 'detail' && selectedShoe) {
    const shoe = selectedShoe;
    return (
      <View style={[s.fill, { backgroundColor: PAPER }]}>
        {/* Sticky nav */}
        <View style={[s.navBar, { paddingTop: insets.top + 8, backgroundColor: PAPER }]}>
          <Pressable onPress={() => setMode('results')} style={s.navBackBtn}>
            <Ionicons name="arrow-back" size={20} color={INK} />
            <Text style={[s.navLabel, { color: INK }]}>PROTOCOL</Text>
          </Pressable>
          <PulseDot />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
          {/* Hero */}
          <View style={[s.detailHero, { paddingTop: 24 }]}>
            <Text style={s.detailRef}>
              /MODEL_REF/ {shoe.id.toUpperCase()}-2026
            </Text>
            <View style={s.detailBrandRow}>
              <Text style={s.detailBrand}>{shoe.brand}</Text>
              <Text style={[s.detailCatTag]}>{shoe.category.replace(/_/g, ' ').toUpperCase()}</Text>
            </View>
            <Text style={s.detailModel}>{shoe.model}</Text>
            <Text style={s.detailTagline}>{shoe.summary}</Text>
          </View>

          {/* Spec grid */}
          <View style={s.specSection}>
            <Text style={s.sectionLabel}>▎ SPECIFICATIONS</Text>
            <View style={s.specGrid}>
              {[
                { val: `${shoe.specs.weight_oz}`, unit: 'OZ', label: 'WEIGHT' },
                { val: `${shoe.specs.stack_heel_mm}`, unit: 'MM', label: 'STACK' },
                { val: `${shoe.specs.drop_mm}`, unit: 'MM', label: 'DROP' },
                { val: shoe.category.replace(/_/g, ' ').split(' ')[0].toUpperCase(), unit: '', label: 'TYPE' },
              ].map((item, i) => (
                <View key={i} style={[s.specCell, i < 3 && s.specCellBorder]}>
                  <View style={s.specValRow}>
                    <Text style={s.specVal}>{item.val}</Text>
                    {item.unit ? <Text style={s.specUnit}>{item.unit}</Text> : null}
                  </View>
                  <Text style={s.specLabel}>/{item.label}/</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Pros / Cons */}
          <View style={s.pcSection}>
            {/* Pros */}
            <View style={s.pcCol}>
              <View style={s.pcHeader}>
                <Text style={[s.pcSymbol, { color: ACCENT }]}>+</Text>
                <Text style={s.pcTitle}>EDGE</Text>
              </View>
              {shoe.tech.map((pro, i) => (
                <View key={i} style={s.pcItem}>
                  <Text style={[s.pcIndex, { color: ACCENT }]}>/{String(i + 1).padStart(2, '0')}/</Text>
                  <Text style={s.pcText}>{pro}</Text>
                </View>
              ))}
            </View>

            {/* Divider */}
            <View style={s.pcDivider} />

            {/* Cons */}
            <View style={s.pcCol}>
              <View style={s.pcHeader}>
                <Text style={[s.pcSymbol, { color: INK }]}>−</Text>
                <Text style={s.pcTitle}>FRICTION</Text>
              </View>
              {shoe.good_for_conditions.slice(0, 4).map((con, i) => (
                <View key={i} style={s.pcItem}>
                  <Text style={s.pcIndex}>/{String(i + 1).padStart(2, '0')}/</Text>
                  <Text style={[s.pcText, { opacity: 0.6 }]}>{con.replace(/_/g, ' ')}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Key features */}
          {shoe.tech.length > 0 && (
            <View style={s.featSection}>
              <Text style={s.sectionLabel}>▎ KEY TECHNOLOGIES</Text>
              {shoe.tech.map((f, i) => (
                <View key={i} style={s.featItem}>
                  <View style={s.featDot} />
                  <Text style={s.featText}>{f}</Text>
                </View>
              ))}
            </View>
          )}

          <Marquee
            text={`ADD TO ARSENAL · ${shoe.brand} ${shoe.model}`}
            textColor={PAPER}
            bgColor={ACCENT}
          />

          {/* CTA */}
          <View style={[s.detailCta, { paddingBottom: 16 }]}>
            <Text style={s.detailCtaQuote}>
              "Ready to commit? This shoe was selected for your specific gait and conditions."
            </Text>
            <Pressable
              onPress={() => handleAddToRotation(shoe.id)}
              style={({ pressed }) => [s.ctaBtn, pressed && { transform: [{ scale: 0.97 }] }]}
            >
              <View style={s.ctaBtnShadow} />
              <View style={s.ctaBtnInner}>
                <Text style={s.ctaBtnText}>ADD TO ARSENAL →</Text>
              </View>
            </Pressable>
            <Text style={s.footerMeta}>END_OF_SPEC_SHEET</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Results ─────────────────────────────────────────────
  if (mode === 'results' && recs.length > 0) {
    const visibleRecs = recs.slice(0, visibleCount);
    const primary = visibleRecs[0];
    const secondary = visibleRecs.slice(1);
    const hasMore = visibleCount < recs.length;
    const compat = Math.min(98, 72 + Math.round(primary.score * 1.2));

    const getCategoryLabel = (cat: string) => {
      const map: Record<string, string> = {
        carbon_plate_racing: 'CARBON RACER',
        motion_control: 'MOTION CTRL',
        max_cushion: 'MAX CUSHION',
        lightweight_speed: 'SPEED',
        neutral: 'NEUTRAL',
        stability: 'STABILITY',
        trail: 'TRAIL',
      };
      return map[cat] || cat.toUpperCase();
    };

    return (
      <View style={[s.fill, { backgroundColor: PAPER }]}>
        {/* Sticky nav */}
        <View style={[s.navBar, { paddingTop: insets.top + 8, backgroundColor: PAPER }]}>
          <Text style={[s.navBrand, { color: INK }]}>STRIDE//PROTOCOL</Text>
          <Pressable onPress={handleReset}>
            <Text style={[s.navReset, { color: ACCENT }]}>RESTART ↺</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
          {/* Header */}
          <View style={[s.resultsHeader, { paddingTop: 20 }]}>
            <Text style={s.sectionLabel}>
              ▎ MATCH REPORT / {new Date().toISOString().slice(0, 10).replace(/-/g, '.')}
            </Text>
            <Text style={s.resultsTitle}>YOUR{'\n'}PROTOCOL.</Text>

            {/* Answer tags */}
            <View style={s.tagRow}>
              {answers?.comfort_pref && (
                <View style={s.tagInk}>
                  <Text style={s.tagTextLight}>/{answers.comfort_pref.toUpperCase()}/</Text>
                </View>
              )}
              {answers?.goal && (
                <View style={s.tagAccent}>
                  <Text style={s.tagTextLight}>/{answers.goal.replace('_', ' ').toUpperCase()}/</Text>
                </View>
              )}
              {answers?.arch_type && (
                <View style={s.tagInk}>
                  <Text style={s.tagTextLight}>/{answers.arch_type.toUpperCase()}-ARCH/</Text>
                </View>
              )}
              {answers?.injury_current && answers.injury_current.length > 0 && !answers.injury_current.includes('none') && (
                <View style={[s.tagInk, { backgroundColor: '#FF3D00', borderColor: '#FF3D00' }]}>
                  <Text style={s.tagTextLight}>/{answers.injury_current.length} INJUR{answers.injury_current.length > 1 ? 'IES' : 'Y'}/</Text>
                </View>
              )}
              {answers?.brand_pref && answers.brand_pref.length > 0 && (
                <View style={s.tagInk}>
                  <Text style={s.tagTextLight}>/{answers.brand_pref.join(' · ')}/</Text>
                </View>
              )}
            </View>
          </View>

          {/* Marquee */}
          <Marquee
            text={`PRIMARY MATCH · ${compat}% COMPATIBILITY`}
            textColor={INK}
            bgColor={LIME}
            fast
          />

          {/* Primary match card */}
          <View style={s.primarySection}>
            <View style={s.primaryCard}>
              {/* Watermark */}
              <Text style={s.primaryWatermark} numberOfLines={1}>{primary.brand}</Text>

              <View style={s.primaryContent}>
                <Text style={s.primaryMatchLabel}>
                  ◆ PRIMARY MATCH / {compat}% COMPATIBILITY
                </Text>
                <Text style={s.primaryCode}>/{primary.id.toUpperCase()}/</Text>
                <Text style={s.primaryBrand}>{primary.brand}</Text>
                <Text style={[s.primaryModel, { color: ACCENT }]}>{primary.model}</Text>

                <Text style={s.primaryTagline}>{primary.summary}</Text>

                {/* Stats */}
                <View style={s.statsGrid}>
                  {[
                    { val: `${primary.specs.weight_oz}OZ`, label: 'WEIGHT' },
                    { val: `${primary.specs.drop_mm}MM`, label: 'DROP' },
                    { val: `${primary.specs.stack_heel_mm}MM`, label: 'STACK' },
                    { val: primary.biomech.stability_level.toUpperCase(), label: 'STABILITY' },
                  ].map((stat, i) => (
                    <View key={i} style={[s.statCell, i < 3 && s.statCellBorder]}>
                      <Text style={s.statVal}>{stat.val}</Text>
                      <Text style={s.statLabel}>{stat.label}</Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  onPress={() => { setSelectedShoe(primary); setMode('detail'); }}
                  style={({ pressed }) => [s.inspectBtn, pressed && s.btnPressed]}
                >
                  <View style={s.inspectBtnShadow} />
                  <View style={s.inspectBtnInner}>
                    <Text style={s.inspectBtnText}>INSPECT MODEL →</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Secondary matches */}
          {secondary.length > 0 && (
            <View style={s.secondarySection}>
              <View style={s.secondaryHeader}>
                <Text style={s.secondaryTitle}>MORE MATCHES</Text>
                <Text style={s.secondaryMeta}>{String(2).padStart(2, '0')} — {String(visibleCount).padStart(2, '0')} / RANKED</Text>
              </View>

              {secondary.map((shoe, i) => (
                <Pressable
                  key={shoe.id}
                  onPress={() => { setSelectedShoe(shoe); setMode('detail'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={({ pressed }) => [s.secCardWrap, pressed && { opacity: 0.9 }]}
                >
                  <View style={s.secCardShadow} />
                  <View style={s.secCard}>
                    <View style={s.secCardTop}>
                      <View style={s.secRankBadge}>
                        <Text style={s.secRankText}>/{String(i + 2).padStart(2, '0')}/</Text>
                      </View>
                      <Text style={s.secCode}>{shoe.id.toUpperCase().slice(0, 12)}</Text>
                    </View>
                    <Text style={s.secBrand}>{shoe.brand}</Text>
                    <Text style={s.secModel}>{shoe.model}</Text>
                    <View style={s.secCardBottom}>
                      <View style={s.secCatBadge}>
                        <Text style={s.secCatText}>{getCategoryLabel(shoe.category)}</Text>
                      </View>
                      <Text style={s.secInspect}>INSPECT →</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Show more / exhausted */}
          <View style={s.showMoreSection}>
            {hasMore ? (
              <Pressable
                onPress={() => {
                  setVisibleCount(v => v + 3);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
                style={({ pressed }) => [s.showMoreWrap, pressed && { opacity: 0.85 }]}
              >
                <View style={s.showMoreShadow} />
                <View style={s.showMoreBtn}>
                  <Text style={s.showMoreText}>NOT HAPPY? SHOW 3 MORE →</Text>
                </View>
              </Pressable>
            ) : (
              <View style={s.exhaustedCard}>
                <Text style={s.exhaustedTitle}>ALL MATCHES SHOWN</Text>
                <Text style={s.exhaustedSub}>
                  {answers?.brand_pref && answers.brand_pref.length > 0
                    ? 'Try opening to more brands for wider results.'
                    : 'Showing all compatible shoes from the database.'}
                </Text>
                <Pressable onPress={handleReset} style={s.restartSmall}>
                  <Text style={s.restartSmallText}>RESTART PROTOCOL ↺</Text>
                </Pressable>
              </View>
            )}
          </View>

          <Marquee
            text="ENGINEERED FOR YOUR GAIT"
            textColor={PAPER}
            bgColor={INK}
          />

          {/* Footer */}
          <View style={s.resultsFooter}>
            <Text style={s.footerQuote}>
              "The right shoe is the one you forget you're wearing — until the miles tell you otherwise."
            </Text>
            <Text style={s.footerMeta}>END_OF_PROTOCOL_001</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Splash ──────────────────────────────────────────────
  return <SplashView onBegin={() => { setShowQuiz(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }} />;
}

// ─── Splash Screen (separate component for clean unmount) ─
const SplashView: React.FC<{ onBegin: () => void }> = ({ onBegin }) => {
  const insets = useSafeAreaInsets();
  const letters = 'STRIDE'.split('');

  // Letter drop animations
  const letterAnims = useRef(letters.map(() => ({
    y: new Animated.Value(-80),
    op: new Animated.Value(0),
  }))).current;

  // Button fade
  const btnAnim = useRef(new Animated.Value(0)).current;
  const subAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    letters.forEach((_, i) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(letterAnims[i].y, { toValue: 0, useNativeDriver: true, tension: 100, friction: 8 }),
          Animated.timing(letterAnims[i].op, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
      }, i * 80);
    });

    setTimeout(() => {
      Animated.timing(subAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, 600);

    setTimeout(() => {
      Animated.timing(btnAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, 900);
  }, []);

  return (
    <View style={[s.splashBg, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Corner meta */}
      <View style={[s.cornerTL]}>
        <Text style={s.cornerText}>V.1.0.0 / 2026</Text>
      </View>
      <View style={[s.cornerTR]}>
        <PulseDot />
      </View>
      <View style={[s.cornerBL]}>
        <Text style={s.cornerText}>EST. ANYWHERE</Text>
      </View>
      <View style={[s.cornerBR]}>
        <Text style={s.cornerText}>PROTOCOL_001</Text>
      </View>

      <View style={s.splashCenter}>
        {/* Label */}
        <Text style={s.splashLabel}>◆ A RUNNING SHOE PROTOCOL ◆</Text>

        {/* Animated STRIDE letters */}
        <View style={s.letterRow}>
          {letters.map((letter, i) => (
            <Animated.Text
              key={i}
              style={[
                s.letterChar,
                {
                  transform: [{ translateY: letterAnims[i].y }],
                  opacity: letterAnims[i].op,
                  marginTop: i % 2 === 0 ? -8 : 8,
                },
              ]}
            >
              {letter}
            </Animated.Text>
          ))}
        </View>

        {/* // PROTOCOL subline */}
        <Animated.View style={[s.sublineRow, { opacity: subAnim }]}>
          <View style={s.sublineDash} />
          <Text style={s.sublineText}>// PROTOCOL</Text>
          <View style={s.sublineDash} />
        </Animated.View>

        {/* Editorial text */}
        <Animated.Text style={[s.splashQuote, { opacity: subAnim }]}>
          Find the shoe your feet deserve. Your gait, decoded. Your miles, mapped.
        </Animated.Text>

        {/* CTA button */}
        <Animated.View style={[s.btnWrap, { opacity: btnAnim }]}>
          <Pressable
            onPress={onBegin}
            style={({ pressed }) => [pressed && { opacity: 0.9 }]}
          >
            <View style={s.ctaShadowLight} />
            <View style={s.ctaInnerDark}>
              <Text style={s.ctaTextLight}>BEGIN PROTOCOL</Text>
              <Text style={s.ctaArrow}>→</Text>
            </View>
          </Pressable>
        </Animated.View>

        <Animated.Text style={[s.splashMeta, { opacity: btnAnim }]}>
          FOUR_QUESTIONS · TWO_MINUTES · ONE_PERFECT_SHOE
        </Animated.Text>
      </View>

      {/* Bottom marquee */}
      <View style={s.splashMarqueeWrap}>
        <Marquee
          text="NEXT FOOT FORWARD"
          textColor={LIME}
          bgColor={INK}
        />
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────
const s = StyleSheet.create({
  fill: { flex: 1 },

  // Marquee
  marqueeWrap: { paddingVertical: 10, overflow: 'hidden' },
  marqueeRow: { flexDirection: 'row' },
  marqueeText: {
    fontFamily: 'SpaceMono',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  // Pulse dot
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT,
  },

  // Hard shadow
  hardShadowWrap: { position: 'relative' },
  hardShadowBg: {
    position: 'absolute',
    top: 5, left: 5, right: -5, bottom: -5,
  },
  hardShadowFg: {
    borderWidth: 2,
    borderColor: INK,
    backgroundColor: PAPER,
  },

  // Splash
  splashBg: {
    flex: 1,
    backgroundColor: INK,
  },
  cornerTL: { position: 'absolute', top: 48, left: 16, zIndex: 10 },
  cornerTR: { position: 'absolute', top: 48, right: 16, zIndex: 10 },
  cornerBL: { position: 'absolute', bottom: 80, left: 16, zIndex: 10 },
  cornerBR: { position: 'absolute', bottom: 80, right: 16, zIndex: 10 },
  cornerText: { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(244,241,234,0.4)', letterSpacing: 2 },
  splashCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginBottom: 60,
  },
  splashLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    letterSpacing: 4,
    color: ACCENT,
    marginBottom: 28,
  },
  letterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  letterChar: {
    color: PAPER,
    fontWeight: '900',
    fontSize: SCREEN_W < 380 ? 72 : 88,
    lineHeight: SCREEN_W < 380 ? 68 : 84,
    letterSpacing: -3,
  },
  sublineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    marginBottom: 24,
  },
  sublineDash: { width: 40, height: 2, backgroundColor: ACCENT },
  sublineText: {
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 4,
    color: ACCENT,
  },
  splashQuote: {
    fontFamily: SERIF,
    fontSize: 16,
    color: 'rgba(244,241,234,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
    maxWidth: 300,
    marginBottom: 40,
  },
  btnWrap: { alignItems: 'center', marginBottom: 16 },
  ctaShadowLight: {
    position: 'absolute',
    top: 5, left: 5, right: -5, bottom: -5,
    backgroundColor: PAPER,
  },
  ctaInnerDark: {
    backgroundColor: ACCENT,
    paddingHorizontal: 32,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: PAPER,
  },
  ctaTextLight: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    color: PAPER,
  },
  ctaArrow: { fontSize: 20, color: PAPER },
  splashMeta: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    letterSpacing: 2,
    color: 'rgba(244,241,234,0.4)',
    textAlign: 'center',
  },
  splashMarqueeWrap: { position: 'absolute', bottom: 0, left: 0, right: 0 },

  // Nav bar
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: INK,
    zIndex: 30,
  },
  navBrand: { fontFamily: 'SpaceMono', fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  navReset: { fontFamily: 'SpaceMono', fontSize: 10, letterSpacing: 2 },
  navBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  navLabel: { fontFamily: 'SpaceMono', fontSize: 10, letterSpacing: 2 },

  // Results header
  resultsHeader: { paddingHorizontal: 20, paddingBottom: 20 },
  resultsTitle: {
    fontWeight: '900',
    fontSize: SCREEN_W < 380 ? 56 : 72,
    lineHeight: SCREEN_W < 380 ? 52 : 68,
    letterSpacing: -3,
    color: INK,
    marginVertical: 12,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tagInk: { backgroundColor: INK, paddingHorizontal: 10, paddingVertical: 5 },
  tagAccent: { backgroundColor: ACCENT, paddingHorizontal: 10, paddingVertical: 5 },
  tagTextLight: { fontFamily: 'SpaceMono', fontSize: 9, color: PAPER, letterSpacing: 2 },

  // Primary card
  primarySection: { padding: 16 },
  primaryCard: {
    backgroundColor: INK,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: INK,
  },
  primaryWatermark: {
    position: 'absolute',
    right: -20,
    top: 0,
    fontWeight: '900',
    fontSize: SCREEN_W < 380 ? 80 : 100,
    color: 'rgba(244,241,234,0.07)',
    letterSpacing: -4,
  },
  primaryContent: { padding: 20 },
  primaryMatchLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: ACCENT,
    letterSpacing: 2,
    marginBottom: 8,
  },
  primaryCode: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: 'rgba(244,241,234,0.5)',
    letterSpacing: 2,
    marginBottom: 8,
  },
  primaryBrand: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: 'rgba(244,241,234,0.5)',
    letterSpacing: 3,
    marginBottom: 4,
  },
  primaryModel: {
    fontWeight: '900',
    fontSize: SCREEN_W < 380 ? 36 : 44,
    lineHeight: SCREEN_W < 380 ? 34 : 42,
    letterSpacing: -2,
  },
  primaryTagline: {
    fontFamily: SERIF,
    fontSize: 15,
    color: 'rgba(244,241,234,0.8)',
    fontStyle: 'italic',
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 20,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(244,241,234,0.2)',
    marginBottom: 20,
  },
  statCell: { flex: 1, padding: 12, alignItems: 'center' },
  statCellBorder: { borderRightWidth: 1, borderRightColor: 'rgba(244,241,234,0.2)' },
  statVal: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    fontWeight: '700',
    color: PAPER,
    marginBottom: 4,
  },
  statLabel: { fontFamily: 'SpaceMono', fontSize: 8, color: 'rgba(244,241,234,0.5)', letterSpacing: 1 },

  // Inspect button
  inspectBtn: { alignSelf: 'flex-start' },
  btnPressed: { opacity: 0.85 },
  inspectBtnShadow: {
    position: 'absolute',
    top: 4, left: 4, right: -4, bottom: -4,
    backgroundColor: PAPER,
  },
  inspectBtnInner: {
    backgroundColor: ACCENT,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: PAPER,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inspectBtnText: { fontFamily: 'SpaceMono', fontSize: 11, fontWeight: '700', color: PAPER, letterSpacing: 2 },

  // Secondary
  secondarySection: { padding: 16 },
  secondaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 },
  secondaryTitle: {
    fontWeight: '900',
    fontSize: 28,
    letterSpacing: -1,
    color: INK,
  },
  secondaryMeta: { fontFamily: 'SpaceMono', fontSize: 9, color: INK + '60', letterSpacing: 1 },
  secCardWrap: { position: 'relative', marginBottom: 16 },
  secCardShadow: {
    position: 'absolute',
    top: 5, left: 5, right: -5, bottom: -5,
    backgroundColor: INK,
  },
  secCard: {
    backgroundColor: PAPER,
    borderWidth: 2,
    borderColor: INK,
    padding: 20,
  },
  secCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  secRankBadge: { backgroundColor: INK, paddingHorizontal: 8, paddingVertical: 4 },
  secRankText: { fontFamily: 'SpaceMono', fontSize: 9, color: PAPER, letterSpacing: 1 },
  secCode: { fontFamily: 'SpaceMono', fontSize: 9, color: INK + '40', letterSpacing: 1 },
  secBrand: { fontFamily: 'SpaceMono', fontSize: 10, color: INK + '60', letterSpacing: 2, marginBottom: 4 },
  secModel: {
    fontWeight: '900',
    fontSize: 28,
    letterSpacing: -1,
    color: INK,
    lineHeight: 28,
    marginBottom: 16,
  },
  secCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 2,
    borderTopColor: INK,
    paddingTop: 12,
  },
  secPriceLabel: { fontFamily: 'SpaceMono', fontSize: 8, color: INK + '60', letterSpacing: 1, marginBottom: 2 },
  secPrice: { fontFamily: 'SpaceMono', fontSize: 22, fontWeight: '700', color: INK },
  secCatBadge: { backgroundColor: INK, paddingHorizontal: 8, paddingVertical: 4 },
  secCatText: { fontFamily: 'SpaceMono', fontSize: 8, color: PAPER, letterSpacing: 1 },
  secInspect: { fontFamily: 'SpaceMono', fontSize: 10, color: ACCENT, letterSpacing: 1 },

  // Show more / exhausted
  showMoreSection: { paddingHorizontal: 20, paddingVertical: 20 },
  showMoreWrap: { position: 'relative' },
  showMoreShadow: {
    position: 'absolute',
    top: 5, left: 5, right: -5, bottom: -5,
    backgroundColor: INK,
    borderRadius: 2,
  },
  showMoreBtn: {
    backgroundColor: PAPER,
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 2,
    paddingVertical: 16,
    alignItems: 'center',
  },
  showMoreText: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: '700',
    color: INK,
    letterSpacing: 1.5,
  },
  exhaustedCard: {
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 2,
    padding: 24,
    alignItems: 'center',
    backgroundColor: PAPER,
  },
  exhaustedTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '700',
    color: INK,
    letterSpacing: 2,
    marginBottom: 8,
  },
  exhaustedSub: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: INK + '80',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 16,
  },
  restartSmall: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: ACCENT,
    borderRadius: 2,
  },
  restartSmallText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: ACCENT,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  // Footer
  resultsFooter: { alignItems: 'center', padding: 32 },
  footerQuote: {
    fontFamily: SERIF,
    fontSize: 14,
    color: INK + '80',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
    marginBottom: 16,
  },
  footerMeta: { fontFamily: 'SpaceMono', fontSize: 8, color: INK + '40', letterSpacing: 2, marginTop: 8 },

  // Detail - hero
  detailHero: {
    backgroundColor: INK,
    padding: 24,
    paddingBottom: 32,
  },
  detailRef: { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(244,241,234,0.5)', letterSpacing: 2, marginBottom: 12 },
  detailBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  detailBrand: { fontWeight: '900', fontSize: 18, letterSpacing: 4, color: ACCENT },
  detailCatTag: { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(244,241,234,0.5)', letterSpacing: 2 },
  detailModel: {
    fontWeight: '900',
    fontSize: SCREEN_W < 380 ? 48 : 60,
    lineHeight: SCREEN_W < 380 ? 44 : 56,
    letterSpacing: -3,
    color: PAPER,
    marginBottom: 12,
  },
  detailTagline: {
    fontFamily: SERIF,
    fontSize: 16,
    color: 'rgba(244,241,234,0.8)',
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 16,
  },
  detailPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 8 },
  detailPrice: { fontFamily: 'SpaceMono', fontSize: 52, fontWeight: '700', lineHeight: 52 },
  detailPriceUnit: { fontFamily: 'SpaceMono', fontSize: 12, color: 'rgba(244,241,234,0.4)', letterSpacing: 2 },

  // Detail - specs
  specSection: { padding: 20, borderBottomWidth: 2, borderBottomColor: INK },
  sectionLabel: { fontFamily: 'SpaceMono', fontSize: 9, color: ACCENT, letterSpacing: 3, marginBottom: 16 },
  specGrid: { flexDirection: 'row', borderWidth: 2, borderColor: INK, overflow: 'hidden' },
  specCell: { flex: 1, padding: 14 },
  specCellBorder: { borderRightWidth: 2, borderRightColor: INK },
  specValRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  specVal: { fontFamily: 'SpaceMono', fontWeight: '700', fontSize: 26, color: INK, lineHeight: 28 },
  specUnit: { fontFamily: 'SpaceMono', fontSize: 10, color: INK + '60' },
  specLabel: { fontFamily: 'SpaceMono', fontSize: 8, color: INK + '60', letterSpacing: 1, marginTop: 6 },

  // Pros / Cons
  pcSection: { padding: 20, gap: 24 },
  pcDivider: { height: 2, backgroundColor: INK, marginVertical: 8 },
  pcCol: {},
  pcHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 16 },
  pcSymbol: { fontWeight: '900', fontSize: 48, lineHeight: 44 },
  pcTitle: { fontWeight: '900', fontSize: 18, letterSpacing: 4, color: INK },
  pcItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 10 },
  pcIndex: { fontFamily: 'SpaceMono', fontSize: 9, color: INK + '60', marginTop: 4, letterSpacing: 1 },
  pcText: { fontFamily: SERIF, fontSize: 16, color: INK, flex: 1, lineHeight: 24 },

  // Features
  featSection: { padding: 20, borderTopWidth: 2, borderTopColor: INK },
  featItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  featDot: { width: 6, height: 6, backgroundColor: ACCENT, borderRadius: 3 },
  featText: { fontFamily: SERIF, fontSize: 15, color: INK, flex: 1 },

  // Detail CTA
  detailCta: { backgroundColor: INK, padding: 32, alignItems: 'center' },
  detailCtaQuote: {
    fontFamily: SERIF,
    fontSize: 14,
    color: 'rgba(244,241,234,0.6)',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
    marginBottom: 24,
  },
  ctaBtn: { alignSelf: 'center', marginBottom: 24 },
  ctaBtnShadow: {
    position: 'absolute',
    top: 5, left: 5, right: -5, bottom: -5,
    backgroundColor: PAPER,
  },
  ctaBtnInner: {
    backgroundColor: ACCENT,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: PAPER,
  },
  ctaBtnText: { fontFamily: 'SpaceMono', fontSize: 13, fontWeight: '700', color: PAPER, letterSpacing: 2 },
});
