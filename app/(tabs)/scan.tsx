import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  Alert,
  StyleSheet,
  Dimensions,
  TextInput,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Quiz } from '../../components/Quiz';
import { ShoeVisual } from '../../components/ShoeVisual';
import { RunnerLoop } from '../../components/RunnerLoop';
import { WhyNotModal } from '../../components/WhyNotModal';
import { SHOES , Shoe } from '../data/shoes';
import { QuizAnswers, getRecommendations, ScoredShoe } from '../utils/scoring';
import { addToFavorites } from '../utils/storage';
import { getUserProfile } from '../utils/userProfile';

export const QUIZ_ANSWERS_KEY = 'stride_quiz_answers_v1';

const INK   = '#0A0A0A';
const PAPER = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME  = '#D4FF00';
const MONO  = 'SpaceMono';

const { width: SCREEN_W } = Dimensions.get('window');

type Mode = 'splash' | 'results' | 'detail' | 'browse';

// ─── Main Screen ──────────────────────────────────────────
export default function ScanScreen() {
  const [mode, setMode] = useState<Mode>('splash');
  const [showQuiz, setShowQuiz] = useState(false);
  const [recs, setRecs] = useState<ScoredShoe[]>([]);
  const [answers, setAnswers] = useState<QuizAnswers | null>(null);
  const [selectedShoe, setSelectedShoe] = useState<ScoredShoe | null>(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const [whyNotShoe, setWhyNotShoe] = useState<ScoredShoe | null>(null);
  const [isBeginnerMode, setIsBeginnerMode] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    getUserProfile().then(p => setIsBeginnerMode(p.is_beginner_mode));
  }, []);

  const PRICE_RANGE_DEFAULTS: Record<string, string> = {
    budget: '85',
    mid: '130',
    premium: '175',
    ultra: '',
    no_pref: '',
  };

  const handleQuizComplete = async (quizAnswers: QuizAnswers) => {
    const results = getRecommendations(quizAnswers, SHOES);
    setRecs(results);
    setAnswers(quizAnswers);
    setShowQuiz(false);
    setMode('results');
    setVisibleCount(3);
    // Pre-seed the price input with the midpoint of the chosen budget range
    if (quizAnswers.price_range) {
      setPurchasePrice(PRICE_RANGE_DEFAULTS[quizAnswers.price_range] ?? '');
    }
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
      const price = parseFloat(purchasePrice);
      if (!isNaN(price) && price > 0) {
        await AsyncStorage.setItem(`stride_shoe_price_${shoeId}`, price.toString());
      }
      setPurchasePrice('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Welcome to the Closet', 'This shoe is alive now. Go meet it in THE CLOSET.');
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

  const browsedShoes = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [...SHOES].sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));
    return SHOES.filter(s =>
      s.brand.toLowerCase().includes(q) ||
      s.model.toLowerCase().includes(q) ||
      getCategoryLabel(s.category).toLowerCase().includes(q)
    ).sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));
  }, [searchQuery]);

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
    const fromBrowse = recs.length === 0;
    return (
      <View style={[s.fill, { backgroundColor: PAPER }]}>
        <View style={[s.navBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => setMode(fromBrowse ? 'browse' : 'results')} style={s.navBackBtn}>
            <Ionicons name="arrow-back" size={20} color={INK} />
            <Text style={s.navLabel}>{fromBrowse ? 'BROWSE' : 'RESULTS'}</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
          {/* Hero */}
          <View style={s.detailHero}>
            <Text style={s.detailBrand}>{shoe.brand.toUpperCase()}</Text>
            <Text style={s.detailModel} numberOfLines={1} adjustsFontSizeToFit>{shoe.model}</Text>
            <View style={s.detailVisual}>
              <ShoeVisual shoe={shoe} wearPct={0} width={SCREEN_W - 80} />
            </View>
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
                    <Text style={s.specVal} numberOfLines={1} adjustsFontSizeToFit>{item.val}</Text>
                    {item.unit ? <Text style={s.specUnit}>{item.unit}</Text> : null}
                  </View>
                  <Text style={s.specLabel} numberOfLines={1}>{item.label}</Text>
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
            <Text style={s.priceLabel}>WHAT DID YOU PAY?</Text>
            <Text style={s.priceSub}>Used to track cost-per-mile and build your Shoe Fund</Text>
            <View style={s.priceRow}>
              <Text style={s.priceSign}>$</Text>
              <TextInput
                style={s.priceInput}
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                placeholder="0.00"
                placeholderTextColor="rgba(244,241,234,0.25)"
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
            <Pressable
              onPress={() => handleAddToRotation(shoe.id)}
              style={({ pressed }) => [s.ctaBtn, pressed && { opacity: 0.85 }]}
            >
              <View style={s.ctaBtnShadow} />
              <View style={s.ctaBtnInner}>
                <Text style={s.ctaBtnText}>ADD TO CLOSET</Text>
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
              {answers?.price_range && answers.price_range !== 'no_pref' && (
                <View style={[s.tagInk, { backgroundColor: LIME }]}>
                  <Text style={[s.tagText, { color: INK }]}>
                    /{answers.price_range === 'budget' ? 'UNDER $100' : answers.price_range === 'mid' ? '$100–$160' : answers.price_range === 'premium' ? '$160–$220' : '$220+'}/
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Primary match card */}
          <View style={s.primarySection}>
            <View style={s.primaryCard}>
              <View style={s.primaryContent}>
                <Text style={s.primaryMatchLabel}>{compat}% COMPATIBILITY</Text>
                <Text style={s.primaryBrand}>{primary.brand.toUpperCase()}</Text>
                <Text style={s.primaryModel} numberOfLines={1} adjustsFontSizeToFit>{primary.model}</Text>
                <View style={s.primaryVisual}>
                  <ShoeVisual shoe={primary} wearPct={0} width={SCREEN_W - 110} />
                </View>
                <Text style={s.primaryTagline}>{primary.summary}</Text>

                <View style={s.statsGrid}>
                  {[
                    { val: `${primary.specs.weight_oz}oz`, label: 'WEIGHT' },
                    { val: `${primary.specs.drop_mm}mm`, label: 'DROP' },
                    { val: `${primary.specs.stack_heel_mm}mm`, label: 'STACK' },
                    { val: primary.biomech.stability_level.toUpperCase(), label: 'STABILITY' },
                  ].map((stat, i) => (
                    <View key={i} style={[s.statCell, i < 3 && s.statCellBorder]}>
                      <Text style={s.statVal} numberOfLines={1} adjustsFontSizeToFit>{stat.val}</Text>
                      <Text style={s.statLabel} numberOfLines={1}>{stat.label}</Text>
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
                {/* WHY NOT only on secondary matches, not the #1 pick */}
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

  // ── Browse ──────────────────────────────────────────────
  if (mode === 'browse') {
    return (
      <View style={[s.fill, s.browseContainer]}>
        <View style={[s.browseNav, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={() => setMode('splash')}>
            <Text style={s.browseBack}>← ADD</Text>
          </Pressable>
          <TextInput
            style={s.browseSearchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="SEARCH SHOES..."
            placeholderTextColor="rgba(10,10,10,0.3)"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>
        <FlatList
          data={browsedShoes}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          renderItem={({ item: shoe }) => (
            <Pressable
              onPress={() => {
                setSelectedShoe({ ...shoe, score: 0, reasons: [] } as ScoredShoe);
                setMode('detail');
              }}
              style={({ pressed }) => [s.browseRow, pressed && { opacity: 0.8 }]}
            >
              <ShoeVisual shoe={shoe} wearPct={0} width={72} />
              <View style={s.browseRowLeft}>
                <Text style={s.browseBrand}>{shoe.brand.toUpperCase()}</Text>
                <Text style={s.browseModel}>{shoe.model}</Text>
                <View style={s.browseCatBadge}>
                  <Text style={s.browseCatText}>{getCategoryLabel(shoe.category)}</Text>
                </View>
              </View>
              <View style={s.browseAddBtn}>
                <Text style={s.browseAddText}>+</Text>
              </View>
            </Pressable>
          )}
        />
      </View>
    );
  }

  // ── Splash ──────────────────────────────────────────────
  return (
    <View style={[s.fill, { backgroundColor: PAPER }]}>
      <View style={[s.splashSafe, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}>
        <View style={s.splashTop}>
          <Text style={s.splashEyebrow}>// ADD / SHOE SCOUT</Text>
          <Text style={s.splashTitle} numberOfLines={1} adjustsFontSizeToFit>ADD A CHARACTER.</Text>
          <Text style={s.splashSub}>Answer the fit protocol. Choose the shoe. Let the story begin.</Text>
          <View style={s.splashRunner}>
            <RunnerLoop freshness={100} shoeColor={ACCENT} size={130} />
          </View>
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
            onPress={() => { setMode('browse'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={({ pressed }) => [s.browseBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={s.browseBtnText}>BROWSE ALL SHOES</Text>
            <Text style={[s.browseBtnText, { marginTop: 4, fontSize: 9 }]}>Browse and add any shoe from our database</Text>
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
  splashRunner: { alignItems: 'center', marginTop: 24 },
  splashEyebrow: { fontFamily: MONO, fontSize: 10, color: ACCENT, letterSpacing: 3, marginBottom: 16 },
  splashTitle: {
    fontWeight: '900',
    fontSize: SCREEN_W < 380 ? 60 : 72,
    lineHeight: SCREEN_W < 380 ? 56 : 68,
    fontFamily: MONO,
    letterSpacing: 0,
    color: INK,
    marginBottom: 20,
  },
  splashSub: {
    fontFamily: MONO, fontSize: 11, color: 'rgba(10,10,10,0.5)',
    lineHeight: 20, maxWidth: 280,
  },
  splashActions: { gap: 12 },
  ctaShadow: { position: 'absolute', top: 5, left: 5, right: -5, bottom: -5, backgroundColor: INK },
  ctaInner: {
    backgroundColor: ACCENT, paddingHorizontal: 32, paddingVertical: 18,
    borderWidth: 2, borderColor: INK, alignItems: 'center',
  },
  ctaText: { fontFamily: MONO, fontSize: 14, fontWeight: '700', letterSpacing: 2, color: PAPER },
  browseBtn: { paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(10,10,10,0.15)' },
  browseBtnText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.5)', letterSpacing: 2 },

  // Browse screen
  browseContainer: { flex: 1, backgroundColor: PAPER },
  browseNav: {
    flexDirection: 'row', padding: 16, borderBottomWidth: 2, borderBottomColor: INK,
    backgroundColor: PAPER, gap: 12, alignItems: 'center',
  },
  browseBack: { fontFamily: MONO, fontSize: 10, color: INK, letterSpacing: 2 },
  browseSearchInput: {
    flex: 1, fontFamily: MONO, fontSize: 12, color: INK,
    borderWidth: 2, borderColor: INK, paddingHorizontal: 12, paddingVertical: 8,
  },
  browseRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(10,10,10,0.08)', gap: 12,
  },
  browseRowLeft: { flex: 1 },
  browseBrand: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 2 },
  browseModel: { fontFamily: MONO, fontSize: 14, fontWeight: '700', color: INK, letterSpacing: 0 },
  browseCatBadge: { backgroundColor: INK, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4, alignSelf: 'flex-start' },
  browseCatText: { fontFamily: MONO, fontSize: 8, color: PAPER, letterSpacing: 1 },
  browsePrice: { fontFamily: MONO, fontSize: 11, color: 'rgba(10,10,10,0.45)', marginTop: 2 },
  browseAddBtn: { width: 36, height: 36, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  browseAddText: { fontFamily: MONO, fontSize: 18, color: PAPER, fontWeight: '900', lineHeight: 20 },

  // Results
  resultsHeader: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
  sectionLabel: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 3, marginBottom: 12 },
  resultsTitle: {
    fontWeight: '900',
    fontSize: SCREEN_W < 380 ? 52 : 64,
    lineHeight: SCREEN_W < 380 ? 48 : 60,
    fontFamily: MONO,
    letterSpacing: 0, color: INK, marginBottom: 16,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagInk: { backgroundColor: INK, paddingHorizontal: 10, paddingVertical: 5 },
  tagAccent: { backgroundColor: ACCENT, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontFamily: MONO, fontSize: 9, color: PAPER, letterSpacing: 1.5 },

  // Primary card
  primarySection: { padding: 16 },
  primaryCard: { backgroundColor: INK, borderWidth: 2, borderColor: INK, overflow: 'hidden', borderRadius: 2 },
  primaryContent: { padding: 20 },
  primaryMatchLabel: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 12 },
  primaryBrand: { fontFamily: MONO, fontSize: 11, color: 'rgba(244,241,234,0.5)', letterSpacing: 3, marginBottom: 4 },
  primaryModel: {
    fontWeight: '900',
    fontSize: SCREEN_W < 380 ? 36 : 44,
    lineHeight: SCREEN_W < 380 ? 34 : 42,
    fontFamily: MONO,
    letterSpacing: 0, color: ACCENT, marginBottom: 12,
  },
  primaryTagline: {
    fontFamily: MONO, fontSize: 11, color: 'rgba(244,241,234,0.75)',
    lineHeight: 19, marginBottom: 20,
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
  secondaryTitle: { fontFamily: MONO, fontWeight: '900', fontSize: 20, letterSpacing: 0, color: INK, marginBottom: 16 },
  secCardWrap: { position: 'relative', marginBottom: 16 },
  secCardShadow: { position: 'absolute', top: 5, left: 5, right: -5, bottom: -5, backgroundColor: INK },
  secCard: { backgroundColor: PAPER, borderWidth: 2, borderColor: INK, padding: 16 },
  secCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  secRankBadge: { backgroundColor: INK, paddingHorizontal: 8, paddingVertical: 4 },
  secRankText: { fontFamily: MONO, fontSize: 9, color: PAPER, letterSpacing: 1 },
  secCatBadge: { backgroundColor: 'rgba(10,10,10,0.08)', paddingHorizontal: 8, paddingVertical: 4 },
  secCatText: { fontFamily: MONO, fontSize: 8, color: INK, letterSpacing: 1 },
  secBrand: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 2 },
  secModel: { fontFamily: MONO, fontWeight: '900', fontSize: 19, letterSpacing: 0, color: INK, lineHeight: 25, marginBottom: 12 },
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
  detailVisual: { alignItems: 'center', marginVertical: 8 },
  primaryVisual: { alignItems: 'center', marginVertical: 4 },
  detailBrand: { fontFamily: MONO, fontSize: 11, color: 'rgba(244,241,234,0.5)', letterSpacing: 3, marginBottom: 6 },
  detailModel: {
    fontFamily: MONO,
    fontWeight: '900',
    fontSize: SCREEN_W < 380 ? 44 : 56,
    lineHeight: SCREEN_W < 380 ? 40 : 52,
    letterSpacing: 0, color: PAPER, marginBottom: 12,
  },
  detailTagline: {
    fontFamily: MONO, fontSize: 11, color: 'rgba(244,241,234,0.7)',
    lineHeight: 19,
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
  featText: { fontFamily: MONO, fontSize: 11, color: INK, flex: 1, lineHeight: 18 },

  detailCta: { padding: 24, backgroundColor: INK },
  priceLabel: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.5)', letterSpacing: 2, marginBottom: 4 },
  priceSub: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.3)', lineHeight: 14, marginBottom: 14 },
  priceRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(244,241,234,0.2)', borderRadius: 2, marginBottom: 20, paddingHorizontal: 16 },
  priceSign: { fontFamily: MONO, fontSize: 22, fontWeight: '900', color: LIME, marginRight: 6 },
  priceInput: { flex: 1, fontFamily: MONO, fontSize: 22, fontWeight: '900', color: PAPER, paddingVertical: 14, letterSpacing: 0 },
  ctaBtn: { alignSelf: 'stretch' },
  ctaBtnShadow: { position: 'absolute', top: 5, left: 5, right: -5, bottom: -5, backgroundColor: PAPER },
  ctaBtnInner: {
    backgroundColor: ACCENT, paddingVertical: 18,
    borderWidth: 2, borderColor: PAPER, alignItems: 'center',
  },
  ctaBtnText: { fontFamily: MONO, fontSize: 13, fontWeight: '700', color: PAPER, letterSpacing: 2 },
});
