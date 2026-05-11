/**
 * HOME — The daily dashboard.
 * Surfaces XP, streaks, recent run, rotation score, and quick actions.
 * Users should get everything they need at a glance without digging.
 */
import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { getUserProfile, UserProfile } from '../utils/userProfile';
import { getRuns } from '../utils/runStorage';
import { getFavorites } from '../utils/storage';
import { SHOES } from '../data/shoes';
import { getUserLevel, getLifecycleStatus, getExpectedLifespan, TIER_COLORS } from '../utils/gameEngine';
import { getMileageForShoe } from '../utils/mileage';
import { getDetailedRotationScore } from '../utils/rotationScore';
import { Run } from '../types/run';
import { getTerritorySnapshot } from '../utils/driftEngine';
import { HEAT_COLOR, HeatLevel } from '../types/territory';
import { getStravaTokens } from '../services/stravaService';
import { getHealthPermStatus } from '../services/healthService';
import { getWatchStatus, WatchStatus } from '../services/watchService';
import { IntegrationsModal } from '../../components/IntegrationsModal';
import { WatchConnectModal } from '../../components/WatchConnectModal';
import { LiveRunModal } from '../../components/LiveRunModal';
import { Onboarding } from '../../components/Onboarding';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME   = '#D4FF00';
const MONO   = 'SpaceMono';

function kmToMi(km: number) { return (km * 0.621371).toFixed(1); }

function dayGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'MORNING.';
  if (h < 17) return 'AFTERNOON.';
  return 'EVENING.';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [runs, setRuns] = React.useState<Run[]>([]);
  const [favoriteIds, setFavoriteIds] = React.useState<string[]>([]);
  const [territory, setTerritory] = React.useState<{ total: number; legendary: number; yours: number; hot: number; warm: number; cold: number } | null>(null);
  const [stravaConnected, setStravaConnected] = React.useState(false);
  const [healthConnected, setHealthConnected] = React.useState(false);
  const [watchStatus, setWatchStatus] = React.useState<WatchStatus | null>(null);
  const [showIntegrations, setShowIntegrations] = React.useState(false);
  const [showWatches, setShowWatches] = React.useState(false);
  const [showLiveRun, setShowLiveRun] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  // Check first launch on mount (not on every focus — only once)
  React.useEffect(() => {
    AsyncStorage.getItem('stride_onboarding_done').then(val => {
      if (!val) setShowOnboarding(true);
    });
  }, []);

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem('stride_onboarding_done', '1');
    setShowOnboarding(false);
    // Reload favorites in case user added shoes during onboarding
    const favs = await getFavorites();
    setFavoriteIds(favs);
  };

  useFocusEffect(useCallback(() => {
    (async () => {
      const [prof, allRuns, favs, snap, stravaTokens, healthStatus, ws] = await Promise.all([
        getUserProfile(),
        getRuns(),
        getFavorites(),
        getTerritorySnapshot(),
        getStravaTokens(),
        getHealthPermStatus(),
        getWatchStatus(),
      ]);
      setProfile(prof);
      setRuns(allRuns);
      setFavoriteIds(favs);
      setTerritory(snap);
      setStravaConnected(!!stravaTokens?.access_token);
      setHealthConnected(healthStatus === 'authorized');
      setWatchStatus(ws);
    })();
  }, []));

  const favoriteShoes = SHOES.filter(s => favoriteIds.includes(s.id));
  const levelInfo = profile ? getUserLevel(profile.total_xp) : null;
  const recentRun = runs.length > 0
    ? [...runs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;
  const recentShoe = recentRun ? SHOES.find(s => s.id === recentRun.shoeId) : null;

  const rotation = favoriteShoes.length > 0
    ? getDetailedRotationScore(favoriteShoes, runs)
    : null;

  // Streaks
  const streaks = profile?.streak_states;
  const activeStreaks = [
    { key: 'variety',         label: 'VARIETY',     weeks: streaks?.variety?.weeks_active ?? 0 },
    { key: 'consistency',     label: 'CONSISTENCY', weeks: streaks?.consistency?.weeks_active ?? 0 },
    { key: 'recovery',        label: 'RECOVERY',    weeks: streaks?.recovery?.weeks_active ?? 0 },
    { key: 'rotation_health', label: 'ROTATION',    weeks: streaks?.rotation_health?.weeks_active ?? 0 },
  ].filter(s => s.weeks > 0);

  // Shoes that need attention (aging/overdue)
  const alertShoes = favoriteShoes.filter(shoe => {
    const miles = getMileageForShoe(shoe.id, runs);
    const lifespan = getExpectedLifespan(shoe);
    return getLifecycleStatus(miles, lifespan).pct >= 0.87;
  });

  const navigate = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(300)} style={s.header}>
          <View>
            <Text style={s.greeting}>{dayGreeting()}</Text>
            <Text style={s.brand}>// STRIDE PROTOCOL</Text>
          </View>
          {levelInfo && (
            <View style={s.levelPill}>
              <Text style={s.levelPillText}>LV.{levelInfo.current.level} {levelInfo.current.name}</Text>
            </View>
          )}
        </Animated.View>

        {/* ── XP Progress bar ─────────────────────────────────────────── */}
        {levelInfo && profile && (
          <Animated.View entering={FadeInDown.delay(50).duration(300)} style={s.xpCard}>
            <View style={s.xpRow}>
              <Text style={s.xpLabel}>XP PROGRESS</Text>
              <Text style={s.xpVal}>{profile.total_xp.toLocaleString()} XP</Text>
            </View>
            <View style={s.xpTrack}>
              <View style={[s.xpFill, { width: `${Math.round(levelInfo.progress * 100)}%` as any }]} />
            </View>
            {levelInfo.current.level < 10 && (
              <Text style={s.xpNext}>
                {(levelInfo.current.next_xp! - profile.total_xp).toLocaleString()} XP TO {LEVEL_NAMES[levelInfo.current.level + 1] ?? 'NEXT'}
              </Text>
            )}
          </Animated.View>
        )}

        {/* ── Quick actions ────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <Text style={s.sectionTitle}>QUICK ACTIONS</Text>

          {/* START RUN — full-width hero button */}
          <TouchableOpacity
            style={s.startRunBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setShowLiveRun(true); }}
            activeOpacity={0.85}
          >
            <Ionicons name="play-circle" size={22} color={INK} />
            <Text style={s.startRunTxt}>START RUN</Text>
            <Text style={s.startRunSub}>GPS · live pace · DRIFT</Text>
          </TouchableOpacity>

          <View style={s.quickRow}>
            <TouchableOpacity style={s.quickCard} onPress={() => navigate('/(tabs)/rotation')} activeOpacity={0.85}>
              <Ionicons name="layers-outline" size={24} color={INK} />
              <Text style={s.quickLabel}>MY SHOES</Text>
              <Text style={s.quickSub}>{favoriteShoes.length} in arsenal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.quickCard, s.quickCardAccent]} onPress={() => navigate('/(tabs)/scan')} activeOpacity={0.85}>
              <Ionicons name="search-outline" size={24} color={PAPER} />
              <Text style={[s.quickLabel, { color: PAPER }]}>FIND SHOES</Text>
              <Text style={[s.quickSub, { color: 'rgba(244,241,234,0.55)' }]}>run the scout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickCard} onPress={() => navigate('/(tabs)/wars')} activeOpacity={0.85}>
              <Ionicons name="flash-outline" size={24} color={INK} />
              <Text style={s.quickLabel}>GAMES</Text>
              <Text style={s.quickSub}>wars + XP</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Watch connect card ───────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(110).duration(300)}>
          <TouchableOpacity
            style={[s.syncCard, (!stravaConnected && !healthConnected) && s.syncCardCTA]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowWatches(true); }}
            activeOpacity={0.85}
          >
            <View style={s.syncCardLeft}>
              {(!stravaConnected && !healthConnected) ? (
                <>
                  <Text style={s.syncCardTitle}>CONNECT YOUR WATCHES</Text>
                  <Text style={s.syncCardSub}>Apple Watch · Garmin · Strava — auto-import every run</Text>
                </>
              ) : (
                <>
                  <Text style={[s.syncCardTitle, { color: INK }]}>YOUR WATCHES</Text>
                  <View style={s.syncDots}>
                    {healthConnected && (
                      <View style={s.syncDot}>
                        <View style={[s.syncDotDot, { backgroundColor: watchStatus?.appleWatchDetected ? '#1C1C1E' : '#FF2D55' }]} />
                        <Text style={s.syncDotLabel}>{watchStatus?.appleWatchDetected ? '⌚ WATCH' : 'HEALTH'}</Text>
                      </View>
                    )}
                    {stravaConnected && (
                      <View style={s.syncDot}>
                        <View style={[s.syncDotDot, { backgroundColor: watchStatus?.garminViaStrava ? '#007CC3' : '#FC4C02' }]} />
                        <Text style={s.syncDotLabel}>{watchStatus?.garminSteps.every(Boolean) ? 'GARMIN' : 'STRAVA'}</Text>
                      </View>
                    )}
                    {(watchStatus?.totalWatchRuns ?? 0) > 0 && (
                      <View style={s.syncDot}>
                        <View style={[s.syncDotDot, { backgroundColor: '#16A34A' }]} />
                        <Text style={s.syncDotLabel}>{watchStatus!.totalWatchRuns} RUNS</Text>
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>
            <Ionicons
              name={(!stravaConnected && !healthConnected) ? 'watch-outline' : 'sync-outline'}
              size={22}
              color={(!stravaConnected && !healthConnected) ? PAPER : INK}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Alert: shoes needing attention ──────────────────────────── */}
        {alertShoes.length > 0 && (
          <Animated.View entering={FadeInDown.delay(130).duration(300)}>
            <Text style={s.sectionTitle}>NEEDS ATTENTION</Text>
            {alertShoes.map(shoe => {
              const miles = getMileageForShoe(shoe.id, runs);
              const lifecycle = getLifecycleStatus(miles, getExpectedLifespan(shoe));
              return (
                <TouchableOpacity
                  key={shoe.id}
                  style={s.alertCard}
                  onPress={() => navigate('/(tabs)/rotation')}
                  activeOpacity={0.85}
                >
                  <View style={[s.alertDot, { backgroundColor: lifecycle.color }]} />
                  <View style={s.alertBody}>
                    <Text style={s.alertShoe}>{shoe.brand} {shoe.model}</Text>
                    <Text style={[s.alertStatus, { color: lifecycle.color }]}>{lifecycle.label} — {miles.toFixed(0)} mi</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(10,10,10,0.3)" />
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        )}

        {/* ── Recent run ───────────────────────────────────────────────── */}
        {recentRun && (
          <Animated.View entering={FadeInDown.delay(150).duration(300)}>
            <Text style={s.sectionTitle}>LAST RUN</Text>
            <TouchableOpacity
              style={s.recentCard}
              onPress={() => navigate('/(tabs)/wars')}
              activeOpacity={0.85}
            >
              <View style={s.recentTop}>
                <Text style={s.recentDate}>{formatDate(recentRun.date)}</Text>
                <View style={[s.mqBadge, { borderColor: MQ_COLORS[recentRun.match_quality ?? 'neutral'] }]}>
                  <Text style={[s.mqText, { color: MQ_COLORS[recentRun.match_quality ?? 'neutral'] }]}>
                    {(recentRun.match_quality ?? 'neutral').toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={s.recentMiles}>{kmToMi(recentRun.distanceKm)} mi</Text>
              <View style={s.recentMeta}>
                {recentShoe && <Text style={s.recentShoe}>{recentShoe.brand} {recentShoe.model}</Text>}
                <Text style={s.recentTerrain}>{recentRun.terrain}  ·  {recentRun.purpose}</Text>
              </View>
              {(recentRun.xp_earned ?? 0) > 0 && (
                <View style={s.xpEarned}>
                  <Text style={s.xpEarnedText}>+{recentRun.xp_earned} XP EARNED</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Rotation score ───────────────────────────────────────────── */}
        {rotation && (
          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <Text style={s.sectionTitle}>ROTATION SCORE</Text>
            <TouchableOpacity
              style={s.rotationCard}
              onPress={() => navigate('/(tabs)/rotation')}
              activeOpacity={0.85}
            >
              <View style={s.rotationHeader}>
                <Text style={s.rotationTotal}>{rotation.total}</Text>
                <Text style={s.rotationTotalLabel}>/100</Text>
                <View style={s.rotationBars}>
                  {[
                    { label: 'VARIETY',  val: rotation.variety,        max: 40, color: '#7C3AED' },
                    { label: 'TERRAIN',  val: rotation.terrainMix,     max: 30, color: '#2563EB' },
                    { label: 'BALANCE',  val: rotation.mileageBalance, max: 30, color: '#16A34A' },
                  ].map(({ label, val, max, color }) => (
                    <View key={label} style={s.rotationBarRow}>
                      <Text style={s.rotationBarLabel}>{label}</Text>
                      <View style={s.rotationBarTrack}>
                        <View style={[s.rotationBarFill, { width: `${(val / max) * 100}%` as any, backgroundColor: color }]} />
                      </View>
                      <Text style={s.rotationBarVal}>{val}/{max}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={s.suggestionRow}>
                <Text style={s.suggestionText}>{rotation.suggestion}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── DRIFT territory card ─────────────────────────────────────── */}
        {territory && territory.total > 0 && (
          <Animated.View entering={FadeInDown.delay(220).duration(300)}>
            <Text style={s.sectionTitle}>DRIFT TERRITORY</Text>
            <TouchableOpacity
              style={s.driftCard}
              onPress={() => navigate('/(tabs)/map')}
              activeOpacity={0.85}
            >
              <View style={s.driftHeader}>
                <Text style={s.driftTotal}>{territory.total}</Text>
                <Text style={s.driftTotalLabel}>ROUTES MAPPED</Text>
              </View>
              <View style={s.driftTiers}>
                {([
                  { h: 'LEGENDARY', val: territory.legendary },
                  { h: 'YOURS',     val: territory.yours },
                  { h: 'HOT',       val: territory.hot },
                  { h: 'WARM',      val: territory.warm },
                  { h: 'COLD',      val: territory.cold },
                ] as { h: HeatLevel; val: number }[]).filter(t => t.val > 0).map(({ h, val }) => (
                  <View key={h} style={[s.driftTier, { borderColor: HEAT_COLOR[h] }]}>
                    <Text style={[s.driftTierCount, { color: HEAT_COLOR[h] }]}>{val}</Text>
                    <Text style={[s.driftTierLabel, { color: HEAT_COLOR[h] }]}>{h}</Text>
                  </View>
                ))}
              </View>
              <Text style={s.driftCta}>TAP TO VIEW MAP →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Active streaks ───────────────────────────────────────────── */}
        {activeStreaks.length > 0 && (
          <Animated.View entering={FadeInDown.delay(240).duration(300)}>
            <Text style={s.sectionTitle}>ACTIVE STREAKS</Text>
            <View style={s.streaksRow}>
              {activeStreaks.map(st => (
                <View key={st.key} style={s.streakChip}>
                  <Text style={s.streakWeeks}>{st.weeks}W</Text>
                  <Text style={s.streakLabel}>{st.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── Empty state — no arsenal yet ────────────────────────────── */}
        {favoriteShoes.length === 0 && (
          <Animated.View entering={FadeInDown.delay(160).duration(300)} style={s.emptyCard}>
            <Text style={s.emptyTitle}>START HERE.</Text>
            <Text style={s.emptyBody}>
              Run the SCOUT diagnostic to get personalized shoe recommendations. Takes 2 minutes.
            </Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigate('/(tabs)/scan')}>
              <Text style={s.emptyBtnText}>OPEN SCOUT</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Navigation guide ─────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(280).duration(300)}>
          <Text style={s.sectionTitle}>WHAT'S WHERE</Text>
          <View style={s.guideList}>
            {[
              { icon: 'layers-outline',  tab: 'MY SHOES', desc: 'Mileage tracking, log runs, retire shoes, roster' },
              { icon: 'search-outline',  tab: 'FIND',     desc: 'Scout quiz for recommendations + browse all shoes' },
              { icon: 'map-outline',     tab: 'DRIFT',    desc: 'Territory map — own routes, build heat, claim paths' },
              { icon: 'flash-outline',   tab: 'GAMES',    desc: 'Shoe Wars, character cards, battle log, XP' },
              { icon: 'pulse-outline',   tab: 'COACH',    desc: 'Training plans, race calendar, coaching tips' },
            ].map(({ icon, tab, desc }) => (
              <View key={tab} style={s.guideRow}>
                <Ionicons name={icon as any} size={18} color={ACCENT} style={s.guideIcon} />
                <View style={s.guideText}>
                  <Text style={s.guideTab}>{tab}</Text>
                  <Text style={s.guideDesc}>{desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals outside ScrollView — cover full screen correctly */}
      <WatchConnectModal visible={showWatches} onClose={() => setShowWatches(false)} />
      <IntegrationsModal visible={showIntegrations} onClose={() => setShowIntegrations(false)} />
      <LiveRunModal visible={showLiveRun} onClose={() => setShowLiveRun(false)} onSaved={() => {
        (async () => {
          const allRuns = await (await import('../utils/runStorage')).getRuns();
          setRuns(allRuns);
        })();
      }} />
      {showOnboarding && (
        <View style={StyleSheet.absoluteFillObject}>
          <Onboarding onComplete={handleOnboardingComplete} />
        </View>
      )}
    </SafeAreaView>
  );
}

const MQ_COLORS: Record<string, string> = {
  perfect: '#16A34A', good: '#2563EB', neutral: '#6B7280', poor: '#D97706', abuse: '#FF3D00',
};

const LEVEL_NAMES: Record<number, string> = {
  2: 'ROOKIE', 3: 'REGULAR', 4: 'GRINDER', 5: 'VETERAN',
  6: 'TACTICIAN', 7: 'STRATEGIST', 8: 'MASTER', 9: 'GRANDMASTER', 10: 'LEGEND',
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  scroll: { paddingTop: 20, paddingHorizontal: 16, paddingBottom: 80 },

  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  greeting: { fontSize: 32, fontWeight: '900', color: INK, letterSpacing: -1 },
  brand: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.35)', letterSpacing: 2, marginTop: 2 },
  levelPill: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: INK, borderRadius: 2, marginTop: 4 },
  levelPillText: { fontFamily: MONO, fontSize: 8, color: LIME, fontWeight: '700', letterSpacing: 1.5 },

  xpCard: { backgroundColor: INK, borderRadius: 2, padding: 16, marginBottom: 20 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpLabel: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.45)', letterSpacing: 2 },
  xpVal: { fontFamily: MONO, fontSize: 10, color: PAPER, fontWeight: '700' },
  xpTrack: { height: 4, backgroundColor: 'rgba(244,241,234,0.15)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  xpFill: { height: '100%', backgroundColor: LIME, borderRadius: 2 },
  xpNext: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.4)', letterSpacing: 1 },

  sectionTitle: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.35)', letterSpacing: 2, marginBottom: 10, marginTop: 4 },

  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickCard: { flex: 1, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 14, gap: 6, backgroundColor: PAPER },
  quickCardAccent: { backgroundColor: INK, borderColor: INK },
  quickLabel: { fontFamily: MONO, fontSize: 9, fontWeight: '700', color: INK, letterSpacing: 1 },
  quickSub: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)' },

  alertCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 14, marginBottom: 8, backgroundColor: PAPER },
  alertDot: { width: 10, height: 10, borderRadius: 5 },
  alertBody: { flex: 1 },
  alertShoe: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: INK },
  alertStatus: { fontFamily: MONO, fontSize: 8, marginTop: 2 },

  recentCard: { borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 16, marginBottom: 20, backgroundColor: PAPER },
  recentTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  recentDate: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 1 },
  mqBadge: { borderWidth: 1.5, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 2 },
  mqText: { fontFamily: MONO, fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  recentMiles: { fontSize: 36, fontWeight: '900', color: INK, letterSpacing: -1, marginBottom: 6 },
  recentMeta: { gap: 2 },
  recentShoe: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: INK },
  recentTerrain: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)' },
  xpEarned: { marginTop: 10, backgroundColor: LIME, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 2 },
  xpEarnedText: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: INK, letterSpacing: 1.5 },

  rotationCard: { borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 16, marginBottom: 20, backgroundColor: PAPER },
  rotationHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  rotationTotal: { fontSize: 44, fontWeight: '900', color: INK, letterSpacing: -2 },
  rotationTotalLabel: { fontFamily: MONO, fontSize: 12, color: 'rgba(10,10,10,0.35)', marginTop: 8 },
  rotationBars: { flex: 1, gap: 6 },
  rotationBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rotationBarLabel: { fontFamily: MONO, fontSize: 7, color: 'rgba(10,10,10,0.45)', letterSpacing: 1, width: 50 },
  rotationBarTrack: { flex: 1, height: 4, backgroundColor: 'rgba(10,10,10,0.08)', borderRadius: 1, overflow: 'hidden' },
  rotationBarFill: { height: '100%', borderRadius: 1 },
  rotationBarVal: { fontFamily: MONO, fontSize: 7, color: 'rgba(10,10,10,0.4)', width: 28, textAlign: 'right' },
  suggestionRow: { borderTopWidth: 1, borderTopColor: 'rgba(10,10,10,0.08)', paddingTop: 10 },
  suggestionText: { fontFamily: MONO, fontSize: 9, color: INK, lineHeight: 14 },

  streaksRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
  streakChip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 2, borderColor: INK, borderRadius: 2, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(212,255,0,0.15)' },
  streakWeeks: { fontFamily: MONO, fontSize: 12, fontWeight: '700', color: INK },
  streakLabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.5)', letterSpacing: 1 },

  emptyCard: { borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 20, marginBottom: 20, backgroundColor: INK },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: LIME, letterSpacing: -1, marginBottom: 8 },
  emptyBody: { fontFamily: MONO, fontSize: 10, color: 'rgba(244,241,234,0.6)', lineHeight: 17, marginBottom: 16 },
  emptyBtn: { backgroundColor: LIME, paddingVertical: 14, borderRadius: 2, alignItems: 'center' },
  emptyBtnText: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: INK, letterSpacing: 2 },

  driftCard: { borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 16, marginBottom: 20, backgroundColor: INK },
  driftHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 14 },
  driftTotal: { fontSize: 40, fontWeight: '900', color: '#FF3D00', letterSpacing: -2 },
  driftTotalLabel: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.4)', letterSpacing: 2 },
  driftTiers: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  driftTier: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', minWidth: 56 },
  driftTierCount: { fontFamily: MONO, fontSize: 16, fontWeight: '700' },
  driftTierLabel: { fontFamily: MONO, fontSize: 7, letterSpacing: 1, marginTop: 2 },
  driftCta: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.3)', letterSpacing: 1 },

  syncCard:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 14, marginBottom: 20, backgroundColor: PAPER },
  syncCardCTA:     { backgroundColor: INK },
  syncCardLeft:    { flex: 1, marginRight: 12 },
  syncCardTitle:   { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: PAPER, letterSpacing: 1.5, marginBottom: 4 },
  syncCardSub:     { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.5)', lineHeight: 14 },
  syncDots:        { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  syncDot:         { flexDirection: 'row', alignItems: 'center', gap: 5 },
  syncDotDot:      { width: 8, height: 8, borderRadius: 4 },
  syncDotLabel:    { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.5)', letterSpacing: 0.5 },

  guideList: { gap: 0, borderWidth: 2, borderColor: INK, borderRadius: 2, overflow: 'hidden', marginBottom: 20 },
  guideRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(10,10,10,0.08)' },
  guideIcon: { width: 24 },
  guideText: { flex: 1 },
  guideTab: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: INK, letterSpacing: 1, marginBottom: 2 },
  guideDesc: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.45)', lineHeight: 14 },

  startRunBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: ACCENT, borderRadius: 2, paddingVertical: 16, paddingHorizontal: 20,
    marginBottom: 12,
  },
  startRunTxt: { fontFamily: MONO, fontSize: 14, fontWeight: '900', color: INK, letterSpacing: 2, flex: 1 },
  startRunSub: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.55)', letterSpacing: 1 },
});
