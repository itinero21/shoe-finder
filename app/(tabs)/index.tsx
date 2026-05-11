/**
 * DAILY FEED — The app's daily open screen.
 * Shows what is TRUE today. Not what we want you to do today.
 * Phase G of v8 intelligence spec.
 */
import React, { useCallback, useState } from 'react';
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
import { getUserLevel } from '../utils/gameEngine';
import { getDetailedRotationScore } from '../utils/rotationScore';
import { Run } from '../types/run';
import { getStravaTokens } from '../services/stravaService';
import { getHealthPermStatus } from '../services/healthService';
import { computeShoeHealth } from '../utils/shoeFatigue';
import { deriveShoeTag } from '../utils/shoeTags';
import { computeLoadSignals, LoadSignal, dismissSignal } from '../utils/loadSignals';
import { getUnseenVerdict, StoredVerdict, markVerdictSeen } from '../utils/abuseDetector';
import { loadRunnerDNA, RunnerDNA } from '../utils/runnerDNA';
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
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const MQ_COLORS: Record<string, string> = {
  perfect: '#16A34A', good: '#2563EB', neutral: '#6B7280', poor: '#D97706', abuse: '#FF3D00',
};

const LEVEL_NAMES: Record<number, string> = {
  2: 'ROOKIE', 3: 'REGULAR', 4: 'GRINDER', 5: 'VETERAN',
  6: 'TACTICIAN', 7: 'STRATEGIST', 8: 'MASTER', 9: 'GRANDMASTER', 10: 'LEGEND',
};

// ── Readiness estimation (no HRV — pace-derived fallback) ─────────────────────
function estimateReadiness(runs: Run[], profile: UserProfile): { score: number; reason: string } {
  const now = Date.now();
  const daysSinceRun = runs.length > 0
    ? (now - new Date(runs[0].date).getTime()) / 86400000
    : 99;

  const recentMiles = runs
    .filter(r => new Date(r.date).getTime() >= now - 7 * 86400000)
    .reduce((s, r) => s + r.distanceKm * 0.621371, 0);

  let score = 7;

  // Rest bonus
  if (daysSinceRun >= 1 && daysSinceRun < 2) score += 1;
  if (daysSinceRun >= 2) score += 2;

  // High volume this week reduces readiness
  if (recentMiles > 40) score -= 3;
  else if (recentMiles > 25) score -= 1;

  // Recovery discipline
  const runDays = new Set(
    runs.filter(r => new Date(r.date).getTime() >= now - 28 * 86400000)
      .map(r => r.date.slice(0, 10))
  ).size;
  const restPerWeek = (28 - runDays) / 4;
  if (restPerWeek < 1) score -= 1;

  score = Math.max(1, Math.min(10, Math.round(score)));

  let reason = 'BASED ON RECENT LOAD AND REST PATTERNS';
  if (daysSinceRun < 1) reason = 'YOU RAN TODAY';
  else if (daysSinceRun >= 2 && recentMiles < 20) reason = 'WELL-RESTED AND LOW VOLUME THIS WEEK';
  else if (recentMiles > 35) reason = 'HIGH VOLUME WEEK — BODY MAY NEED MORE RECOVERY';

  return { score, reason };
}

export default function DailyFeedScreen() {
  const router = useRouter();
  const [profile, setProfile]               = useState<UserProfile | null>(null);
  const [runs, setRuns]                     = useState<Run[]>([]);
  const [favoriteIds, setFavoriteIds]       = useState<string[]>([]);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [healthConnected, setHealthConnected] = useState(false);
  const [signals, setSignals]               = useState<LoadSignal[]>([]);
  const [unseenVerdict, setUnseenVerdict]   = useState<StoredVerdict | null>(null);
  const [dna, setDna]                       = useState<RunnerDNA | null>(null);

  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showWatches, setShowWatches]           = useState(false);
  const [showLiveRun, setShowLiveRun]           = useState(false);
  const [showOnboarding, setShowOnboarding]     = useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem('stride_onboarding_done').then(val => {
      if (!val) setShowOnboarding(true);
    });
  }, []);

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem('stride_onboarding_done', '1');
    setShowOnboarding(false);
    const favs = await getFavorites();
    setFavoriteIds(favs);
  };

  useFocusEffect(useCallback(() => {
    (async () => {
      const [prof, allRuns, favs, stravaTokens, healthStatus, dnaSnap] = await Promise.all([
        getUserProfile(),
        getRuns(),
        getFavorites(),
        getStravaTokens(),
        getHealthPermStatus(),
        loadRunnerDNA(),
      ]);

      // Sort runs newest first
      const sorted = [...allRuns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setProfile(prof);
      setRuns(sorted);
      setFavoriteIds(favs);
      setStravaConnected(!!stravaTokens?.access_token);
      setHealthConnected(healthStatus === 'authorized');
      setDna(dnaSnap);

      // Load signals
      const injHistory = (prof.injury_history ?? []).map(i => ({
        injury_type: i.injury_type,
        started_date: i.started_date,
      }));
      const loadSigs = await computeLoadSignals(sorted, injHistory, 0);
      setSignals(loadSigs);

      // Unseen abuse verdict
      const verdict = await getUnseenVerdict();
      setUnseenVerdict(verdict);
    })();
  }, []));

  const favoriteShoes = SHOES.filter(s => favoriteIds.includes(s.id));
  const levelInfo = profile ? getUserLevel(profile.total_xp) : null;
  const recentRun = runs[0] ?? null;
  const recentShoe = recentRun ? SHOES.find(s => s.id === recentRun.shoeId) : null;
  const rotation = favoriteShoes.length > 0 ? getDetailedRotationScore(favoriteShoes, runs) : null;
  const weightLbs = profile?.weight_lbs ?? 160;

  // Readiness
  const readiness = profile && runs.length > 0 ? estimateReadiness(runs, profile) : null;

  // Today's shoe recommendation (simplest heuristic: least recently used active shoe with >20% health)
  const todaysShoe = (() => {
    if (favoriteShoes.length < 2) return null;
    const shoeLastRun: Record<string, number> = {};
    for (const r of runs) {
      if (r.shoeId && !shoeLastRun[r.shoeId]) {
        shoeLastRun[r.shoeId] = new Date(r.date).getTime();
      }
    }
    const healthyShoes = favoriteShoes.filter(s => {
      const h = computeShoeHealth(s, runs, weightLbs);
      return h.healthPct > 20;
    });
    if (!healthyShoes.length) return null;
    return healthyShoes.sort((a, b) =>
      (shoeLastRun[a.id] ?? 0) - (shoeLastRun[b.id] ?? 0)
    )[0];
  })();

  // Shoes at lifecycle threshold
  const lifecycleAlerts = favoriteShoes.filter(s => {
    const h = computeShoeHealth(s, runs, weightLbs);
    return h.healthPct <= 25;
  });

  const isAdvanced = (profile?.current_level ?? 1) >= 5;

  const navigate = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  };

  // ── Card count limits ──────────────────────────────────────────────────────
  // Beginner: max 3 cards. Intermediate+: max 5.
  const isBeginner = profile?.is_beginner_mode ?? true;
  const maxCards = isBeginner ? 3 : 5;

  // Build ordered card visibility list
  type CardKey = 'readiness' | 'todaysShoe' | 'loadSignal' | 'abuseVerdict' | 'lifecycle' | 'rotation' | 'dnaUpdate' | 'lastRun' | 'streaks' | 'territory';
  const cardOrder: CardKey[] = ['readiness', 'todaysShoe', 'loadSignal', 'abuseVerdict', 'lifecycle', 'rotation', 'dnaUpdate', 'lastRun', 'streaks', 'territory'];
  const cardVisible: Record<CardKey, boolean> = {
    readiness:    !!readiness && runs.length >= 5,
    todaysShoe:   !!todaysShoe,
    loadSignal:   !isBeginner && signals.length > 0,
    abuseVerdict: !isBeginner && !!unseenVerdict,
    lifecycle:    lifecycleAlerts.length > 0,
    rotation:     !isBeginner && !!rotation,
    dnaUpdate:    !isBeginner && !!dna,
    lastRun:      !!recentRun,
    streaks:      false, // surfaced via streak chips below
    territory:    false, // surfaced in DRIFT tab
  };

  let visibleCount = 0;
  const shown: Record<CardKey, boolean> = {} as any;
  for (const key of cardOrder) {
    if (cardVisible[key] && visibleCount < maxCards) {
      shown[key] = true;
      visibleCount++;
    } else {
      shown[key] = false;
    }
  }

  const noCards = visibleCount === 0;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

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

        {/* ── XP Bar ──────────────────────────────────────────────────── */}
        {levelInfo && profile && (
          <Animated.View entering={FadeInDown.delay(40).duration(300)} style={s.xpCard}>
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

        {/* ── START RUN ────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(60).duration(300)}>
          <TouchableOpacity
            style={s.startRunBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setShowLiveRun(true); }}
            activeOpacity={0.85}
          >
            <Ionicons name="play-circle" size={22} color={INK} />
            <Text style={s.startRunTxt}>START RUN</Text>
            <Text style={s.startRunSub}>GPS · live pace · DRIFT</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Quick actions ────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(80).duration(300)} style={s.quickRow}>
          <TouchableOpacity style={s.quickCard} onPress={() => navigate('/(tabs)/rotation')} activeOpacity={0.85}>
            <Ionicons name="layers-outline" size={22} color={INK} />
            <Text style={s.quickLabel}>MY SHOES</Text>
            <Text style={s.quickSub}>{favoriteShoes.length} in arsenal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.quickCard, s.quickCardAccent]} onPress={() => navigate('/(tabs)/scan')} activeOpacity={0.85}>
            <Ionicons name="search-outline" size={22} color={PAPER} />
            <Text style={[s.quickLabel, { color: PAPER }]}>FIND SHOES</Text>
            <Text style={[s.quickSub, { color: 'rgba(244,241,234,0.5)' }]}>run the scout</Text>
          </TouchableOpacity>
          {isAdvanced && (
            <TouchableOpacity style={s.quickCard} onPress={() => navigate('/(tabs)/wars')} activeOpacity={0.85}>
              <Ionicons name="flash-outline" size={22} color={INK} />
              <Text style={s.quickLabel}>GAMES</Text>
              <Text style={s.quickSub}>wars + XP</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* ── Watch connect card ───────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <TouchableOpacity
            style={[s.syncCard, (!stravaConnected && !healthConnected) && s.syncCardCTA]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowWatches(true); }}
            activeOpacity={0.85}
          >
            <View style={s.syncCardLeft}>
              {(!stravaConnected && !healthConnected) ? (
                <>
                  <Text style={s.syncCardTitle}>CONNECT YOUR WATCHES</Text>
                  <Text style={s.syncCardSub}>Apple Watch · Garmin · Strava</Text>
                </>
              ) : (
                <>
                  <Text style={[s.syncCardTitle, { color: INK }]}>YOUR WATCHES</Text>
                  <View style={s.syncDots}>
                    {healthConnected && (
                      <View style={s.syncDot}>
                        <View style={[s.syncDotDot, { backgroundColor: '#FF2D55' }]} />
                        <Text style={s.syncDotLabel}>HEALTH</Text>
                      </View>
                    )}
                    {stravaConnected && (
                      <View style={s.syncDot}>
                        <View style={[s.syncDotDot, { backgroundColor: '#FC4C02' }]} />
                        <Text style={s.syncDotLabel}>STRAVA</Text>
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>
            <Ionicons name={(!stravaConnected && !healthConnected) ? 'watch-outline' : 'sync-outline'} size={20} color={(!stravaConnected && !healthConnected) ? PAPER : INK} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── FEED DIVIDER ─────────────────────────────────────────────── */}
        <Text style={s.feedLabel}>TODAY</Text>

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {noCards && (
          <Animated.View entering={FadeInDown.delay(120).duration(300)} style={s.emptyFeed}>
            <Text style={s.emptyFeedTitle}>NOTHING URGENT TODAY.</Text>
            <Text style={s.emptyFeedSub}>GO RUN OR REST.</Text>
          </Animated.View>
        )}

        {/* ── Card 1: READINESS ────────────────────────────────────────── */}
        {shown.readiness && readiness && (
          <Animated.View entering={FadeInDown.delay(120).duration(300)} style={s.feedCard}>
            <Text style={s.feedCardLabel}>READINESS</Text>
            <View style={s.readinessRow}>
              <Text style={s.readinessScore}>{readiness.score}</Text>
              <Text style={s.readinessDenom}>/10</Text>
            </View>
            <Text style={s.feedCardSub}>{readiness.reason}</Text>
            <Text style={s.honesty}>PACE-DERIVED. CONNECT APPLE HEALTH FOR MORE ACCURATE READINESS.</Text>
          </Animated.View>
        )}

        {/* ── Card 2: TODAY'S SHOE ─────────────────────────────────────── */}
        {shown.todaysShoe && todaysShoe && (
          <Animated.View entering={FadeInDown.delay(140).duration(300)}>
            <TouchableOpacity style={s.feedCard} onPress={() => navigate('/(tabs)/rotation')} activeOpacity={0.9}>
              <Text style={s.feedCardLabel}>TODAY</Text>
              <View style={s.todaysShoeRow}>
                <View style={[s.tagChip, { backgroundColor: INK }]}>
                  <Text style={[s.tagChipText, { color: PAPER }]}>{deriveShoeTag(todaysShoe).tag}</Text>
                </View>
                <Text style={s.todaysShoeName}>{todaysShoe.brand} {todaysShoe.model}</Text>
              </View>
              <Text style={s.feedCardSub}>LEAST RECENTLY USED · {computeShoeHealth(todaysShoe, runs, weightLbs).healthPct}% HEALTH</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Card 3: LOAD SIGNAL ──────────────────────────────────────── */}
        {shown.loadSignal && signals[0] && (
          <Animated.View entering={FadeInDown.delay(160).duration(300)} style={s.feedCard}>
            <Text style={s.feedCardLabel}>{signals[0].label}</Text>
            <Text style={s.feedCardBody}>{signals[0].copy}</Text>
            <TouchableOpacity onPress={() => { dismissSignal(signals[0].type); setSignals(sigs => sigs.slice(1)); }}>
              <Text style={s.rationaleLink}>SEE WHY  ·  DISMISS</Text>
            </TouchableOpacity>
            <Text style={s.honesty}>{signals[0].footer}</Text>
          </Animated.View>
        )}

        {/* ── Card 4: ABUSE VERDICT ────────────────────────────────────── */}
        {shown.abuseVerdict && unseenVerdict && (
          <Animated.View entering={FadeInDown.delay(170).duration(300)}>
            <TouchableOpacity
              style={[s.feedCard, unseenVerdict.verdict.severity === 'positive' && s.feedCardPositive]}
              onPress={() => { markVerdictSeen(unseenVerdict.runId); setUnseenVerdict(null); }}
              activeOpacity={0.9}
            >
              <Text style={s.feedCardLabel}>LAST RUN</Text>
              <Text style={s.feedCardBody}>{unseenVerdict.verdict.headline}</Text>
              <Text style={s.feedCardSub}>{unseenVerdict.verdict.detail}</Text>
              <Text style={s.rationaleLink}>TAP TO DISMISS</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Card 5: LIFECYCLE ALERT ──────────────────────────────────── */}
        {shown.lifecycle && lifecycleAlerts.map((shoe, i) => {
          const h = computeShoeHealth(shoe, runs, weightLbs);
          return (
            <Animated.View key={shoe.id} entering={FadeInDown.delay(180 + i * 10).duration(300)}>
              <TouchableOpacity style={s.feedCard} onPress={() => navigate('/(tabs)/rotation')} activeOpacity={0.9}>
                <Text style={s.feedCardLabel}>SHOE HEALTH</Text>
                <Text style={s.feedCardBody}>{shoe.model.toUpperCase()}: {h.label}</Text>
                <Text style={s.feedCardSub}>
                  {h.healthPct <= 0
                    ? 'PAST WEAR LIMIT. CUSHIONING IS DEGRADED.'
                    : `${h.healthPct}% REMAINING${h.estimatedRunsRemaining != null ? ` · ~${h.estimatedRunsRemaining} RUNS LEFT` : ''}`}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* ── Card 6: ROTATION SUGGESTION ──────────────────────────────── */}
        {shown.rotation && rotation && (
          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <TouchableOpacity style={s.feedCard} onPress={() => navigate('/(tabs)/rotation')} activeOpacity={0.9}>
              <Text style={s.feedCardLabel}>ROTATION SCORE</Text>
              <View style={s.rotationRow}>
                <Text style={s.rotationScore}>{rotation.total}</Text>
                <Text style={s.rotationDenom}>/100</Text>
              </View>
              <Text style={s.feedCardSub}>{rotation.suggestion}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Card 7: DNA SNAPSHOT ─────────────────────────────────────── */}
        {shown.dnaUpdate && dna && (
          <Animated.View entering={FadeInDown.delay(210).duration(300)}>
            <TouchableOpacity style={s.feedCard} onPress={() => navigate('/(tabs)/rotation')} activeOpacity={0.9}>
              <Text style={s.feedCardLabel}>RUNNER DNA</Text>
              <View style={s.dnaRow}>
                <View style={s.dnaCol}>
                  <Text style={s.dnaKey}>TERRAIN</Text>
                  <Text style={s.dnaVal}>{dna.terrain_road_pct}% ROAD</Text>
                </View>
                <View style={s.dnaCol}>
                  <Text style={s.dnaKey}>RECOVERY</Text>
                  <Text style={s.dnaVal}>{dna.recovery_discipline.toUpperCase()}</Text>
                </View>
                <View style={s.dnaCol}>
                  <Text style={s.dnaKey}>SPEED PREF</Text>
                  <Text style={s.dnaVal}>{dna.speed_preference.replace(/_/g, ' ').split(' ')[0].toUpperCase()}</Text>
                </View>
              </View>
              <Text style={s.rationaleLink}>VIEW FULL DNA PROFILE</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Card 8: LAST RUN ─────────────────────────────────────────── */}
        {shown.lastRun && recentRun && (
          <Animated.View entering={FadeInDown.delay(220).duration(300)}>
            <TouchableOpacity style={s.feedCard} onPress={() => navigate('/(tabs)/wars')} activeOpacity={0.9}>
              <Text style={s.feedCardLabel}>LAST RUN</Text>
              <View style={s.lastRunRow}>
                <Text style={s.lastRunMiles}>{kmToMi(recentRun.distanceKm)} mi</Text>
                <View style={[s.mqBadge, { borderColor: MQ_COLORS[recentRun.match_quality ?? 'neutral'] }]}>
                  <Text style={[s.mqText, { color: MQ_COLORS[recentRun.match_quality ?? 'neutral'] }]}>
                    {(recentRun.match_quality ?? 'neutral').toUpperCase()}
                  </Text>
                </View>
              </View>
              {recentShoe && <Text style={s.feedCardSub}>{recentShoe.brand} {recentShoe.model} · {formatDate(recentRun.date)}</Text>}
              {(recentRun.xp_earned ?? 0) > 0 && (
                <View style={s.xpEarned}>
                  <Text style={s.xpEarnedText}>+{recentRun.xp_earned} XP</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Beginner graduation nudge ─────────────────────────────────── */}
        {isBeginner && (profile?.lifetime_miles ?? 0) < 50 && (
          <Animated.View entering={FadeInDown.delay(240).duration(300)} style={s.progressCard}>
            <Text style={s.progressLabel}>BEGINNER MODE</Text>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${Math.min(100, ((profile?.lifetime_miles ?? 0) / 50) * 100)}%` as any }]} />
            </View>
            <Text style={s.progressSub}>{(profile?.lifetime_miles ?? 0).toFixed(0)} / 50 MILES — FULL APP UNLOCKS AT 50 MILES</Text>
          </Animated.View>
        )}

        {/* ── Empty arsenal CTA ────────────────────────────────────────── */}
        {favoriteShoes.length === 0 && (
          <Animated.View entering={FadeInDown.delay(260).duration(300)} style={s.emptyCard}>
            <Text style={s.emptyTitle}>START HERE.</Text>
            <Text style={s.emptyBody}>Run the SCOUT to get shoe recommendations. Takes 2 minutes.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigate('/(tabs)/scan')}>
              <Text style={s.emptyBtnText}>OPEN SCOUT</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals outside ScrollView */}
      <WatchConnectModal visible={showWatches} onClose={() => setShowWatches(false)} />
      <IntegrationsModal visible={showIntegrations} onClose={() => setShowIntegrations(false)} />
      <LiveRunModal visible={showLiveRun} onClose={() => setShowLiveRun(false)} onSaved={async () => {
        const allRuns = await (await import('../utils/runStorage')).getRuns();
        setRuns([...allRuns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }} />
      {showOnboarding && (
        <View style={StyleSheet.absoluteFillObject}>
          <Onboarding onComplete={handleOnboardingComplete} />
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  scroll:    { paddingTop: 20, paddingHorizontal: 16, paddingBottom: 80 },

  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  greeting: { fontSize: 32, fontWeight: '900', color: INK, letterSpacing: -1 },
  brand: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.35)', letterSpacing: 2, marginTop: 2 },
  levelPill: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: INK, borderRadius: 2, marginTop: 4 },
  levelPillText: { fontFamily: MONO, fontSize: 8, color: LIME, fontWeight: '700', letterSpacing: 1.5 },

  xpCard: { backgroundColor: INK, borderRadius: 2, padding: 16, marginBottom: 16 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpLabel: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.45)', letterSpacing: 2 },
  xpVal: { fontFamily: MONO, fontSize: 10, color: PAPER, fontWeight: '700' },
  xpTrack: { height: 4, backgroundColor: 'rgba(244,241,234,0.15)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  xpFill: { height: '100%', backgroundColor: LIME, borderRadius: 2 },
  xpNext: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.4)', letterSpacing: 1 },

  startRunBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: ACCENT, borderRadius: 2, paddingVertical: 16, paddingHorizontal: 20,
    marginBottom: 12,
  },
  startRunTxt: { fontFamily: MONO, fontSize: 14, fontWeight: '900', color: INK, letterSpacing: 2, flex: 1 },
  startRunSub: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.55)', letterSpacing: 1 },

  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  quickCard: { flex: 1, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 12, gap: 5, backgroundColor: PAPER },
  quickCardAccent: { backgroundColor: INK, borderColor: INK },
  quickLabel: { fontFamily: MONO, fontSize: 9, fontWeight: '700', color: INK, letterSpacing: 1 },
  quickSub: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)' },

  syncCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 14, marginBottom: 20, backgroundColor: PAPER },
  syncCardCTA: { backgroundColor: INK },
  syncCardLeft: { flex: 1, marginRight: 12 },
  syncCardTitle: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: PAPER, letterSpacing: 1.5, marginBottom: 4 },
  syncCardSub: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.5)', lineHeight: 14 },
  syncDots: { flexDirection: 'row', gap: 12 },
  syncDot: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  syncDotDot: { width: 8, height: 8, borderRadius: 4 },
  syncDotLabel: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.5)', letterSpacing: 0.5 },

  feedLabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.35)', letterSpacing: 3, marginBottom: 12 },

  emptyFeed: { borderWidth: 2, borderColor: 'rgba(10,10,10,0.1)', borderRadius: 2, padding: 24, marginBottom: 16, alignItems: 'center' },
  emptyFeedTitle: { fontFamily: MONO, fontSize: 14, fontWeight: '900', color: INK, letterSpacing: -0.5, marginBottom: 6 },
  emptyFeedSub: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.4)' },

  feedCard: { borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 16, marginBottom: 12, backgroundColor: PAPER },
  feedCardPositive: { borderColor: '#16A34A', backgroundColor: 'rgba(22,163,74,0.05)' },
  feedCardLabel: { fontFamily: MONO, fontSize: 8, color: ACCENT, letterSpacing: 2, marginBottom: 8 },
  feedCardBody: { fontSize: 15, fontWeight: '800', color: INK, letterSpacing: -0.3, marginBottom: 6, lineHeight: 22 },
  feedCardSub: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.5)', lineHeight: 15, marginBottom: 4 },
  honesty: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.3)', marginTop: 8, lineHeight: 13 },
  rationaleLink: { fontFamily: MONO, fontSize: 8, color: ACCENT, letterSpacing: 1, marginTop: 8 },

  readinessRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 6 },
  readinessScore: { fontSize: 48, fontWeight: '900', color: INK, letterSpacing: -2 },
  readinessDenom: { fontFamily: MONO, fontSize: 16, color: 'rgba(10,10,10,0.3)', marginBottom: 4 },

  todaysShoeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  todaysShoeName: { fontSize: 15, fontWeight: '800', color: INK, flex: 1 },
  tagChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2 },
  tagChipText: { fontFamily: MONO, fontSize: 8, fontWeight: '700', letterSpacing: 1 },

  lastRunRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  lastRunMiles: { fontSize: 32, fontWeight: '900', color: INK, letterSpacing: -1 },
  mqBadge: { borderWidth: 1.5, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 2 },
  mqText: { fontFamily: MONO, fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  xpEarned: { marginTop: 8, backgroundColor: LIME, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 2 },
  xpEarnedText: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: INK, letterSpacing: 1.5 },

  rotationRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 6 },
  rotationScore: { fontSize: 48, fontWeight: '900', color: INK, letterSpacing: -2 },
  rotationDenom: { fontFamily: MONO, fontSize: 14, color: 'rgba(10,10,10,0.3)', marginBottom: 4 },

  dnaRow: { flexDirection: 'row', gap: 0, marginBottom: 10 },
  dnaCol: { flex: 1 },
  dnaKey: { fontFamily: MONO, fontSize: 7, color: 'rgba(10,10,10,0.4)', letterSpacing: 1.5, marginBottom: 3 },
  dnaVal: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: INK },

  progressCard: { borderWidth: 2, borderColor: 'rgba(10,10,10,0.15)', borderRadius: 2, padding: 14, marginBottom: 16 },
  progressLabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 10 },
  progressTrack: { height: 4, backgroundColor: 'rgba(10,10,10,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: LIME, borderRadius: 2 },
  progressSub: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', lineHeight: 14 },

  emptyCard: { borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 20, marginBottom: 20, backgroundColor: INK },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: LIME, letterSpacing: -1, marginBottom: 8 },
  emptyBody: { fontFamily: MONO, fontSize: 10, color: 'rgba(244,241,234,0.6)', lineHeight: 17, marginBottom: 16 },
  emptyBtn: { backgroundColor: LIME, paddingVertical: 14, borderRadius: 2, alignItems: 'center' },
  emptyBtnText: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: INK, letterSpacing: 2 },
});
