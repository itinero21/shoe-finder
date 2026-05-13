import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  Alert,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Quiz } from '../../components/Quiz';
import { WhyNotModal } from '../../components/WhyNotModal';
import { SHOES } from '../data/shoes';
import { Shoe } from '../data/shoes';
import { QuizAnswers, getRecommendations, ScoredShoe } from '../utils/scoring';
import { addToFavorites } from '../utils/storage';
import { getUserProfile } from '../utils/userProfile';

export const QUIZ_ANSWERS_KEY = 'stride_quiz_answers_v1';

const INK   = '#0A0A0A';
const PAPER = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME  = '#D4FF00';
const MONO  = 'SpaceMono';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const { width: SCREEN_W } = Dimensions.get('window');

type Mode = 'splash' | 'results' | 'detail';

// ─── Main Screen ──────────────────────────────────────────
export default function ScanScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('splash');
  const [showQuiz, setShowQuiz] = useState(false);
  const [recs, setRecs] = useState<ScoredShoe[]>([]);
  const [answers, setAnswers] = useState<QuizAnswers | null>(null);
  const [selectedShoe, setSelectedShoe] = useState<ScoredShoe | null>(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const [whyNotShoe, setWhyNotShoe] = useState<ScoredShoe | null>(null);
  const [isBeginnerMode, setIsBeginnerMode] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    getUserProfile().then(p => setIsBeginnerMode(p.is_beginner_mode));
  }, []);

  const handleQuizComplete = async (quizAnswers: QuizAnswers) => {
    const results = getRecommendations(quizAnswers, SHOES);
    setRecs(results);
    setAnswers(quizAnswers);
    setShowQuiz(false);
    setMode('results');
    setVisibleCount(3);
    await AsyncStorage.setItem(QUIZ_ANSWERS_KEY, JSON.stringify(quizAnswers));
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

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      carbon_racer: 'CARBON RACER', motion_control: 'MOTION CTRL',
      max_cushion: 'MAX CUSHION', lightweight_speed: 'SPEED',
      neutral: 'NEUTRAL', stability: 'STABILITY', trail: 'TRAIL',
    };
    return map[cat] || cat.replace(/_/g, ' ').toUpperCase();
  };

  // ── Quiz ────────────────────────────────────────────────
  if (showQuiz) {
    return (
      <Quiz
        onComplete={handleQuizComplete}
        onBack={() => setShowQuiz(false)}
        beginnerMode={isBeginnerMode}
      />
    );
  }

  // ── Detail ──────────────────────────────────────────────
  if (mode === 'detail' && selectedShoe) {
    const shoe = selectedShoe;
    return (
      <View style={[s.fill, { backgroundColor: PAPER }]}>
        <View style={[s.navBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => setMode('results')} style={s.navBackBtn}>
            <Ionicons name="arrow-back" size={20} color={INK} />
            <Text style={s.navLabel}>RESULTS</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
          {/* Hero */}
          <View style={s.detailHero}>
            <Text style={s.detailBrand}>{shoe.brand.toUpperCase()}</Text>
            <Text style={s.detailModel}>{shoe.model}</Text>
            <Text style={s.detailTagline}>{shoe.summary}</Text>
          </View>

          {/* Spec grid */}
          <View style={s.specSection}>
            <Text style={s.sectionLabel}>SPECIFICATIONS</Text>
            <View style={s.specGrid}>
              {[
                { val: `${shoe.specs.weight_oz}`, unit: 'oz', label: 'WEIGHT' },
                { val: `${shoe.specs.stack_heel_mm}`, unit: 'mm', label: 'STACK' },
                { val: `${shoe.specs.drop_mm}`, unit: 'mm', label: 'DROP' },
                { val: getCategoryLabel(shoe.category), unit: '', label: 'TYPE' },
              ].map((item, i) => (
                <View key={i} style={[s.specCell, i < 3 && s.specCellBorder]}>
                  <View style={s.specValRow}>
                    <Text style={s.specVal}>{item.val}</Text>
                    {item.unit ? <Text style={s.specUnit}>{item.unit}</Text> : null}
                  </View>
                  <Text style={s.specLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Technologies */}
          {shoe.tech.length > 0 && (
            <View style={s.featSection}>
              <Text style={s.sectionLabel}>KEY TECHNOLOGIES</Text>
              {shoe.tech.map((f, i) => (
                <View key={i} style={s.featItem}>
                  <View style={s.featDot} />
                  <Text style={s.featText}>{f}</Text>
                </View>
              ))}
            </View>
          )}

          {/* CTA */}
          <View style={s.detailCta}>
            <Pressable
              onPress={() => handleAddToRotation(shoe.id)}
              style={({ pressed }) => [s.ctaBtn, pressed && { opacity: 0.85 }]}
            >
              <View style={s.ctaBtnShadow} />
              <View style={s.ctaBtnInner}>
                <Text style={s.ctaBtnText}>ADD TO ARSENAL</Text>
              </View>
            </Pressable>
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

    return (
      <View style={[s.fill, { backgroundColor: PAPER }]}>
        <View style={[s.navBar, { paddingTop: insets.top + 8 }]}>
          <Text style={s.navBrand}>STRIDE // SCOUT</Text>
          <Pressable onPress={handleReset}>
            <Text style={s.navReset}>RESTART</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
          {/* Header */}
          <View style={s.resultsHeader}>
            <Text style={s.sectionLabel}>MATCH REPORT</Text>
            <Text style={s.resultsTitle}>YOUR{'\n'}PROTOCOL.</Text>

            {/* Answer tags */}
            <View style={s.tagRow}>
              {answers?.comfort_pref && (
                <View style={s.tagInk}><Text style={s.tagText}>/{answers.comfort_pref.toUpperCase()}/</Text></View>
              )}
              {answers?.goal && (
                <View style={s.tagAccent}><Text style={s.tagText}>/{answers.goal.replace('_', ' ').toUpperCase()}/</Text></View>
              )}
              {answers?.arch_type && (
                <View style={s.tagInk}><Text style={s.tagText}>/{answers.arch_type.toUpperCase()} ARCH/</Text></View>
              )}
            </View>
          </View>

          {/* Primary match card */}
          <View style={s.primarySection}>
            <View style={s.primaryCard}>
              <View style={s.primaryContent}>
                <Text style={s.primaryMatchLabel}>{compat}% COMPATIBILITY</Text>
                <Text style={s.primaryBrand}>{primary.brand.toUpperCase()}</Text>
                <Text style={s.primaryModel}>{primary.model}</Text>
                <Text style={s.primaryTagline}>{primary.summary}</Text>

                <View style={s.statsGrid}>
                  {[
                    { val: `${primary.specs.weight_oz}oz`, label: 'WEIGHT' },
                    { val: `${primary.specs.drop_mm}mm`, label: 'DROP' },
                    { val: `${primary.specs.stack_heel_mm}mm`, label: 'STACK' },
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
                  style={({ pressed }) => [s.inspectBtn, pressed && { opacity: 0.85 }]}
                >
                  <View style={s.inspectBtnShadow} />
                  <View style={s.inspectBtnInner}>
                    <Text style={s.inspectBtnText}>INSPECT MODEL</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => { setWhyNotShoe(primary); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={s.whyNotBtn}
                >
                  <Text style={s.whyNotBtnText}>WHY NOT THIS SHOE?</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Secondary matches */}
          {secondary.length > 0 && (
            <View style={s.secondarySection}>
              <Text style={s.secondaryTitle}>MORE MATCHES</Text>

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
                        <Text style={s.secRankText}>#{i + 2}</Text>
                      </View>
                      <View style={s.secCatBadge}>
                        <Text style={s.secCatText}>{getCategoryLabel(shoe.category)}</Text>
                      </View>
                    </View>
                    <Text style={s.secBrand}>{shoe.brand.toUpperCase()}</Text>
                    <Text style={s.secModel}>{shoe.model}</Text>
                    <View style={s.secCardBottom}>
                      <Text style={s.secInspect}>TAP TO INSPECT</Text>
                      <Pressable
                        onPress={(e) => { e.stopPropagation(); setWhyNotShoe(shoe); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                        style={s.secWhyNot}
                      >
                        <Text style={s.secWhyNotText}>WHY NOT?</Text>
                      </Pressable>
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
                onPress={() => { setVisibleCount(v => v + 3); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                style={({ pressed }) => [s.showMoreWrap, pressed && { opacity: 0.85 }]}
              >
                <View style={s.showMoreShadow} />
                <View style={s.showMoreBtn}>
                  <Text style={s.showMoreText}>SHOW 3 MORE</Text>
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
                  <Text style={s.restartSmallText}>RESTART</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>

        <WhyNotModal
          visible={!!whyNotShoe}
          shoe={whyNotShoe}
          answers={answers}
          onClose={() => setWhyNotShoe(null)}
        />
      </View>
    );
  }

  // ── Splash ──────────────────────────────────────────────
  return (
    <View style={[s.fill, { backgroundColor: INK }]}>
      <View style={[s.splashSafe, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}>
        <View style={s.splashTop}>
          <Text style={s.splashEyebrow}>// SHOE SCOUT</Text>
          <Text style={s.splashTitle}>FIND YOUR{'\n'}SHOE.</Text>
          <Text style={s.splashSub}>Four questions. Your gait decoded. One recommendation.</Text>
        </View>

        <View style={s.splashActions}>
          <Pressable
            onPress={() => { setShowQuiz(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
            style={({ pressed }) => [pressed && { opacity: 0.85 }]}
          >
            <View style={s.ctaShadow} />
            <View style={s.ctaInner}>
              <Text style={s.ctaText}>BEGIN SCOUT</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/discover' as any); }}
            style={({ pressed }) => [s.browseBtn, pressed && { opacity: 0.75 }]}
          >
            <Text style={s.browseBtnText}>BROWSE ALL SHOES</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────
const s = StyleSheet.create({
  fill: { flex: 1 },

  // Nav
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 2, borderBottomColor: INK,
    backgroundColor: PAPER,
  },
  navBrand: { fontFamily: MONO, fontSize: 11, letterSpacing: 2, fontWeight: '700', color: INK },
  navReset: { fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: ACCENT },
  navBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  navLabel: { fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: INK },

  // Splash
  splashSafe: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  splashTop: { flex: 1, justifyContent: 'center' },
  splashEyebrow: { fontFamily: MONO, fontSize: 10, color: ACCENT, letterSpacing: 3, marginBottom: 16 },
  splashTitle: {
    fontWeight: '900',
    fontSize: SCREEN_W < 380 ? 60 : 72,
    lineHeight: SCREEN_W < 380 ? 56 : 68,
    letterSpacing: -3,
    color: PAPER,
    marginBottom: 20,
  },
  splashSub: {
    fontFamily: MONO, fontSize: 12, color: 'rgba(244,241,234,0.5)',
    lineHeight: 20, maxWidth: 280,
  },
  splashActions: { gap: 12 },
  ctaShadow: { position: 'absolute', top: 5, left: 5, right: -5, bottom: -5, backgroundColor: PAPER },
  ctaInner: {
    backgroundColor: ACCENT, paddingHorizontal: 32, paddingVertical: 18,
    borderWidth: 2, borderColor: PAPER, alignItems: 'center',
  },
  ctaText: { fontFamily: MONO, fontSize: 14, fontWeight: '700', letterSpacing: 2, color: PAPER },
  browseBtn: { paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(244,241,234,0.2)' },
  browseBtnText: { fontFamily: MONO, fontSize: 10, color: 'rgba(244,241,234,0.5)', letterSpacing: 2 },

  // Results
  resultsHeader: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
  sectionLabel: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 3, marginBottom: 12 },
  resultsTitle: {
    fontWeight: '900',
    fontSize: SCREEN_W < 380 ? 52 : 64,
    lineHeight: SCREEN_W < 380 ? 48 : 60,
    letterSpacing: -3, color: INK, marginBottom: 16,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagInk: { backgroundColor: INK, paddingHorizontal: 10, paddingVertical: 5 },
  tagAccent: { backgroundColor: ACCENT, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontFamily: MONO, fontSize: 9, color: PAPER, letterSpacing: 1.5 },

  // Primary card
  primarySection: { padding: 16 },
  primaryCard: { backgroundColor: INK, borderWidth: 2, borderColor: INK, overflow: 'hidden' },
  primaryContent: { padding: 20 },
  primaryMatchLabel: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 12 },
  primaryBrand: { fontFamily: MONO, fontSize: 11, color: 'rgba(244,241,234,0.5)', letterSpacing: 3, marginBottom: 4 },
  primaryModel: {
    fontWeight: '900',
    fontSize: SCREEN_W < 380 ? 36 : 44,
    lineHeight: SCREEN_W < 380 ? 34 : 42,
    letterSpacing: -2, color: ACCENT, marginBottom: 12,
  },
  primaryTagline: {
    fontFamily: SERIF, fontSize: 15, color: 'rgba(244,241,234,0.75)',
    fontStyle: 'italic', lineHeight: 22, marginBottom: 20,
  },
  statsGrid: { flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(244,241,234,0.15)', marginBottom: 20 },
  statCell: { flex: 1, padding: 12, alignItems: 'center' },
  statCellBorder: { borderRightWidth: 1, borderRightColor: 'rgba(244,241,234,0.15)' },
  statVal: { fontFamily: MONO, fontSize: 14, fontWeight: '700', color: PAPER, marginBottom: 4 },
  statLabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.45)', letterSpacing: 1 },

  inspectBtn: { alignSelf: 'stretch' },
  inspectBtnShadow: { position: 'absolute', top: 4, left: 4, right: -4, bottom: -4, backgroundColor: PAPER },
  inspectBtnInner: {
    backgroundColor: ACCENT, paddingHorizontal: 24, paddingVertical: 14,
    borderWidth: 2, borderColor: PAPER, alignItems: 'center',
  },
  inspectBtnText: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: PAPER, letterSpacing: 2 },
  whyNotBtn: {
    marginTop: 12, paddingVertical: 12,
    borderWidth: 2, borderColor: 'rgba(244,241,234,0.25)', alignItems: 'center',
  },
  whyNotBtnText: { fontFamily: MONO, fontSize: 10, color: 'rgba(244,241,234,0.55)', letterSpacing: 1.5 },

  // Secondary
  secondarySection: { paddingHorizontal: 16, paddingBottom: 8 },
  secondaryTitle: { fontWeight: '900', fontSize: 24, letterSpacing: -1, color: INK, marginBottom: 16 },
  secCardWrap: { position: 'relative', marginBottom: 16 },
  secCardShadow: { position: 'absolute', top: 5, left: 5, right: -5, bottom: -5, backgroundColor: INK },
  secCard: { backgroundColor: PAPER, borderWidth: 2, borderColor: INK, padding: 16 },
  secCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  secRankBadge: { backgroundColor: INK, paddingHorizontal: 8, paddingVertical: 4 },
  secRankText: { fontFamily: MONO, fontSize: 9, color: PAPER, letterSpacing: 1 },
  secCatBadge: { backgroundColor: 'rgba(10,10,10,0.08)', paddingHorizontal: 8, paddingVertical: 4 },
  secCatText: { fontFamily: MONO, fontSize: 8, color: INK, letterSpacing: 1 },
  secBrand: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 2 },
  secModel: { fontWeight: '900', fontSize: 24, letterSpacing: -1, color: INK, lineHeight: 26, marginBottom: 12 },
  secCardBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: 'rgba(10,10,10,0.1)', paddingTop: 10,
  },
  secInspect: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 1 },
  secWhyNot: { paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: ACCENT },
  secWhyNotText: { fontFamily: MONO, fontSize: 8, color: ACCENT, letterSpacing: 1 },

  // Show more
  showMoreSection: { paddingHorizontal: 16, paddingVertical: 16 },
  showMoreWrap: { position: 'relative' },
  showMoreShadow: { position: 'absolute', top: 5, left: 5, right: -5, bottom: -5, backgroundColor: INK },
  showMoreBtn: {
    backgroundColor: PAPER, borderWidth: 2, borderColor: INK,
    paddingVertical: 16, alignItems: 'center',
  },
  showMoreText: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: INK, letterSpacing: 1.5 },
  exhaustedCard: {
    borderWidth: 2, borderColor: 'rgba(10,10,10,0.15)',
    padding: 24, alignItems: 'center',
  },
  exhaustedTitle: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: INK, letterSpacing: 2, marginBottom: 8 },
  exhaustedSub: {
    fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.5)',
    textAlign: 'center', lineHeight: 17, marginBottom: 16,
  },
  restartSmall: { paddingHorizontal: 16, paddingVertical: 8, borderWidth: 2, borderColor: INK },
  restartSmallText: { fontFamily: MONO, fontSize: 10, color: INK, fontWeight: '700', letterSpacing: 1.5 },

  // Detail
  detailHero: { backgroundColor: INK, padding: 24, paddingBottom: 32 },
  detailBrand: { fontFamily: MONO, fontSize: 11, color: 'rgba(244,241,234,0.5)', letterSpacing: 3, marginBottom: 6 },
  detailModel: {
    fontWeight: '900',
    fontSize: SCREEN_W < 380 ? 44 : 56,
    lineHeight: SCREEN_W < 380 ? 40 : 52,
    letterSpacing: -3, color: PAPER, marginBottom: 12,
  },
  detailTagline: {
    fontFamily: SERIF, fontSize: 15, color: 'rgba(244,241,234,0.7)',
    fontStyle: 'italic', lineHeight: 22,
  },

  specSection: { padding: 20, borderBottomWidth: 2, borderBottomColor: INK },
  specGrid: { flexDirection: 'row', borderWidth: 2, borderColor: INK, overflow: 'hidden' },
  specCell: { flex: 1, padding: 14 },
  specCellBorder: { borderRightWidth: 2, borderRightColor: INK },
  specValRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  specVal: { fontFamily: MONO, fontWeight: '700', fontSize: 22, color: INK, lineHeight: 26 },
  specUnit: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.45)' },
  specLabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.45)', letterSpacing: 1, marginTop: 6 },

  featSection: { padding: 20, borderTopWidth: 2, borderTopColor: INK },
  featItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  featDot: { width: 6, height: 6, backgroundColor: ACCENT, marginTop: 6 },
  featText: { fontFamily: SERIF, fontSize: 15, color: INK, flex: 1, lineHeight: 22 },

  detailCta: { padding: 24, backgroundColor: INK },
  ctaBtn: { alignSelf: 'stretch' },
  ctaBtnShadow: { position: 'absolute', top: 5, left: 5, right: -5, bottom: -5, backgroundColor: PAPER },
  ctaBtnInner: {
    backgroundColor: ACCENT, paddingVertical: 18,
    borderWidth: 2, borderColor: PAPER, alignItems: 'center',
  },
  ctaBtnText: { fontFamily: MONO, fontSize: 13, fontWeight: '700', color: PAPER, letterSpacing: 2 },
});
