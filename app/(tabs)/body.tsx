import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { calculateBodyState } from '../body/engine';
import { BodyState } from '../body/types';
import { getDailyBiometrics } from '../body/storage';
import { getRuns } from '../utils/runStorage';
import { getLivingShoes } from '../utils/characterStorage';
import { getUserProfile } from '../utils/userProfile';
import { getTodaysWeather } from '../services/weatherService';
import { getHealthPermStatus, syncHealthBiometrics } from '../services/healthService';
import { getShoeOfTheDay, ShoeRecommendation } from '../intelligence/bridge';
import { ALL_TRACKABLE_SHOES as SHOES } from '../data/shoes';

const INK = '#0A0A0A';
const PAPER = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME = '#D4FF00';
const GREEN = '#16A34A';
const AMBER = '#D97706';
const MONO = 'SpaceMono';

const loadLabel = (value: number) => value >= 75 ? 'HIGH' : value >= 50 ? 'MODERATE' : 'LOW';
const loadColor = (value: number) => value >= 75 ? ACCENT : value >= 50 ? AMBER : GREEN;

function MetricBar({ label, value, inverse = false }: { label: string; value: number; inverse?: boolean }) {
  const color = inverse ? loadColor(value) : value >= 75 ? GREEN : value >= 55 ? AMBER : ACCENT;
  return (
    <View style={s.metric}>
      <View style={s.metricTop}>
        <Text style={s.metricLabel}>{label}</Text>
        <Text style={[s.metricValue, { color }]}>{value}</Text>
      </View>
      <View style={s.track}>
        <View style={[s.fill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function BodyScreen() {
  const router = useRouter();
  const [state, setState] = useState<BodyState | null>(null);
  const [shoe, setShoe] = useState<ShoeRecommendation | null>(null);
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async (refreshHealth = false) => {
    if (refreshHealth) await syncHealthBiometrics().catch(() => 0);
    const [biometrics, runs, living, profile, weather, health] = await Promise.all([
      getDailyBiometrics(),
      getRuns(),
      getLivingShoes(),
      getUserProfile(),
      getTodaysWeather().catch(() => null),
      getHealthPermStatus(),
    ]);
    setState(calculateBodyState(biometrics, runs));
    setConnected(health === 'authorized');
    const catalog = Object.fromEntries(SHOES.map(item => [item.id, item]));
    setShoe(getShoeOfTheDay(living, catalog, runs, weather, profile));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSync = async () => {
    setSyncing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await load(true);
    setSyncing(false);
  };

  if (!state) {
    return <SafeAreaView style={s.loading}><ActivityIndicator color={ACCENT} /></SafeAreaView>;
  }

  const learning = state.recovery == null;
  const nextBaseline = Math.max(0, 7 - state.baselineDays);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>STRIDE BODY INTELLIGENCE</Text>
          <Text style={s.title}>BODY.</Text>
        </View>
        <TouchableOpacity style={s.syncButton} onPress={handleSync} disabled={syncing || !connected}>
          {syncing
            ? <ActivityIndicator size="small" color={INK} />
            : <Ionicons name={connected ? 'sync' : 'watch-outline'} size={20} color={INK} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.heroWrap}>
          <View style={s.heroShadow} />
          <View style={s.hero}>
            <View style={s.heroTop}>
              <View>
                <Text style={s.heroLabel}>RECOVERY</Text>
                {learning ? (
                  <>
                    <Text style={s.learning}>LEARNING</Text>
                    <Text style={s.heroNote}>{nextBaseline || 1} MORE VERIFIED DAYS TO YOUR BASELINE</Text>
                  </>
                ) : (
                  <>
                    <Text style={s.heroScore}>{state.recovery}<Text style={s.heroOutOf}> / 100</Text></Text>
                    <Text style={s.heroNote}>{state.confidenceLevel.toUpperCase()} CONFIDENCE</Text>
                  </>
                )}
              </View>
              <View style={[s.statusStamp, { backgroundColor: learning ? PAPER : LIME }]}>
                <Text style={s.statusStampText}>{learning ? `${state.baselineDays}/7` : state.recovery! >= 70 ? 'READY' : 'EASY'}</Text>
              </View>
            </View>
            <View style={s.rule} />
            <Text style={s.heroReason}>{state.recommendation.reason}</Text>
          </View>
        </View>

        <View style={s.decisionWrap}>
          <View style={s.decisionShadow} />
          <View style={s.decisionCard}>
            <Text style={s.darkEyebrow}>STRIDE DECISION</Text>
            <Text style={s.decisionTitle}>{state.recommendation.headline}</Text>
            <Text style={s.distance}>
              {state.recommendation.distanceKm[0]}–{state.recommendation.distanceKm[1]} KM
            </Text>
            {shoe && (
              <View style={s.shoePick}>
                <View style={s.shoeIcon}><Ionicons name="footsteps" size={19} color={INK} /></View>
                <View style={s.shoeCopy}>
                  <Text style={s.shoeLabel}>USE TODAY</Text>
                  <Text style={s.shoeName}>{shoe.shoeName.toUpperCase()}</Text>
                  <Text style={s.shoeReason}>{shoe.score}% MATCH · {shoe.reason}</Text>
                </View>
              </View>
            )}
            <TouchableOpacity style={s.startButton} onPress={() => router.push('/(tabs)/run')}>
              <Text style={s.startText}>GO TO RUN CONTROL</Text>
              <Ionicons name="arrow-forward" size={17} color={INK} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>RUN READINESS</Text>
            <Text style={s.sectionMeta}>PERSONAL · TODAY</Text>
          </View>
          <View style={s.panel}>
            <MetricBar label="EASY RUN" value={state.readiness.easy} />
            <MetricBar label="LONG RUN" value={state.readiness.long} />
            <MetricBar label="SPEED" value={state.readiness.speed} />
            <MetricBar label="HILLS" value={state.readiness.hills} />
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>ACCUMULATED LOAD</Text>
            <Text style={[s.sectionMeta, { color: loadColor(state.overallLoad) }]}>
              {loadLabel(state.overallLoad)}
            </Text>
          </View>
          <View style={s.loadRow}>
            <View style={s.loadCard}>
              <Text style={s.loadValue}>{state.cardiovascularLoad}</Text>
              <Text style={s.loadName}>CARDIO</Text>
              <Text style={s.loadHint}>HEART + INTENSITY</Text>
            </View>
            <View style={s.loadCard}>
              <Text style={s.loadValue}>{state.musculoskeletalLoad}</Text>
              <Text style={s.loadName}>LEGS</Text>
              <Text style={s.loadHint}>DISTANCE + TERRAIN</Text>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>ESTIMATED LEG LOAD</Text>
            <Text style={s.sectionMeta}>MODELLED</Text>
          </View>
          <View style={s.legGrid}>
            {Object.entries(state.legLoad).map(([key, value]) => (
              <View style={s.legCell} key={key}>
                <Text style={s.legName}>{key.toUpperCase()}</Text>
                <Text style={[s.legLevel, { color: loadColor(value) }]}>{loadLabel(value)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>TODAY&apos;S SIGNALS</Text>
            <Text style={s.sectionMeta}>{connected ? 'APPLE HEALTH' : 'NO BODY SOURCE'}</Text>
          </View>
          <View style={s.signalList}>
            {state.signals.map(signal => (
              <View style={s.signal} key={signal.key}>
                <View style={[s.signalDot, {
                  backgroundColor: signal.status === 'positive' ? GREEN
                    : signal.status === 'watch' ? ACCENT
                    : signal.status === 'normal' ? LIME : 'rgba(10,10,10,0.15)',
                }]} />
                <View style={s.signalCopy}>
                  <Text style={s.signalName}>{signal.label}</Text>
                  <Text style={s.signalExplain}>{signal.explanation}</Text>
                </View>
                <Text style={s.signalScore}>{signal.score ?? '—'}</Text>
              </View>
            ))}
          </View>
        </View>

        {!connected && (
          <TouchableOpacity style={s.connectCard} onPress={() => router.push('/(tabs)/run')}>
            <Ionicons name="watch-outline" size={28} color={PAPER} />
            <View style={s.connectCopy}>
              <Text style={s.connectTitle}>CONNECT APPLE WATCH</Text>
              <Text style={s.connectText}>Open Run Control → Watches to begin building your personal baseline.</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={PAPER} />
          </TouchableOpacity>
        )}

        <Text style={s.disclaimer}>{state.disclaimer}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  loading: { flex: 1, backgroundColor: PAPER, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 2, borderBottomColor: INK,
  },
  eyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 4 },
  title: { fontFamily: MONO, fontSize: 24, fontWeight: '900', color: INK, letterSpacing: 0, lineHeight: 30 },
  syncButton: { width: 38, height: 38, borderWidth: 2, borderColor: INK, borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 },

  // Hero + decision cards use the app-wide offset drop-shadow card
  heroWrap: { position: 'relative', marginBottom: 12 },
  heroShadow: { position: 'absolute', top: 6, left: 6, right: -6, bottom: -6, borderRadius: 2, backgroundColor: INK },
  hero: { backgroundColor: ACCENT, padding: 18, borderWidth: 2, borderColor: INK, borderRadius: 2 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLabel: { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 2, color: PAPER, marginBottom: 7 },
  heroScore: { fontFamily: MONO, fontSize: 40, fontWeight: '900', lineHeight: 44, color: PAPER },
  heroOutOf: { fontSize: 13, fontWeight: '700' },
  learning: { fontFamily: MONO, fontSize: 28, fontWeight: '900', lineHeight: 34, color: PAPER },
  heroNote: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: PAPER, letterSpacing: 1, opacity: 0.85, marginTop: 2 },
  statusStamp: { paddingHorizontal: 10, paddingVertical: 8, borderWidth: 2, borderColor: INK, borderRadius: 2 },
  statusStampText: { fontFamily: MONO, fontSize: 10, fontWeight: '900', color: INK, letterSpacing: 0.5 },
  rule: { height: 1, backgroundColor: PAPER, opacity: 0.3, marginVertical: 14 },
  heroReason: { fontFamily: MONO, fontSize: 10, lineHeight: 16, color: PAPER },

  decisionWrap: { position: 'relative', marginBottom: 22 },
  decisionShadow: { position: 'absolute', top: 6, left: 6, right: -6, bottom: -6, borderRadius: 2, backgroundColor: 'rgba(10,10,10,0.35)' },
  decisionCard: { backgroundColor: INK, padding: 18, borderRadius: 2, borderWidth: 2, borderColor: INK },
  darkEyebrow: { fontFamily: MONO, color: LIME, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  decisionTitle: { fontFamily: MONO, color: PAPER, fontWeight: '900', fontSize: 22, lineHeight: 27 },
  distance: { fontFamily: MONO, color: PAPER, fontSize: 10, fontWeight: '700', letterSpacing: 1.3, marginTop: 5, opacity: 0.65 },
  shoePick: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(244,241,234,0.2)', flexDirection: 'row' },
  shoeIcon: { width: 34, height: 34, backgroundColor: LIME, borderRadius: 2, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  shoeCopy: { flex: 1 },
  shoeLabel: { fontFamily: MONO, fontSize: 8, fontWeight: '900', color: LIME, letterSpacing: 1.5 },
  shoeName: { fontFamily: MONO, color: PAPER, fontWeight: '900', fontSize: 14, marginTop: 3 },
  shoeReason: { fontFamily: MONO, color: PAPER, opacity: 0.6, fontSize: 8, lineHeight: 12, marginTop: 4 },
  startButton: {
    backgroundColor: LIME, borderRadius: 2, paddingVertical: 13, paddingHorizontal: 14, marginTop: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  startText: { fontFamily: MONO, color: INK, fontWeight: '900', fontSize: 10, letterSpacing: 1.5 },

  section: { marginBottom: 22 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  sectionTitle: { fontFamily: MONO, fontSize: 11, fontWeight: '900', color: INK, letterSpacing: 2 },
  sectionMeta: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: 'rgba(10,10,10,0.4)', letterSpacing: 0.7 },
  panel: { borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 15, backgroundColor: PAPER },
  metric: { marginBottom: 13 },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  metricLabel: { fontFamily: MONO, fontSize: 9, fontWeight: '700', color: INK, letterSpacing: 0.5 },
  metricValue: { fontFamily: MONO, fontSize: 11, fontWeight: '900' },
  track: { height: 6, backgroundColor: 'rgba(10,10,10,0.1)', borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },

  loadRow: { flexDirection: 'row', gap: 10 },
  loadCard: { flex: 1, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 15, backgroundColor: PAPER },
  loadValue: { fontFamily: MONO, fontSize: 28, fontWeight: '900', color: INK },
  loadName: { fontFamily: MONO, fontSize: 9, fontWeight: '900', color: INK, letterSpacing: 1, marginTop: 3 },
  loadHint: { fontFamily: MONO, fontSize: 7, color: 'rgba(10,10,10,0.45)', letterSpacing: 0.4, marginTop: 6 },

  legGrid: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 2, borderLeftWidth: 2, borderColor: INK, borderRadius: 2, overflow: 'hidden' },
  legCell: { width: '50%', padding: 14, borderRightWidth: 2, borderBottomWidth: 2, borderColor: INK, backgroundColor: PAPER },
  legName: { fontFamily: MONO, fontSize: 8, fontWeight: '900', color: INK, letterSpacing: 1 },
  legLevel: { fontFamily: MONO, fontSize: 11, fontWeight: '900', marginTop: 4 },

  signalList: { borderWidth: 2, borderColor: INK, borderRadius: 2, backgroundColor: PAPER, overflow: 'hidden' },
  signal: { minHeight: 62, flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(10,10,10,0.1)' },
  signalDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(10,10,10,0.15)', marginRight: 10 },
  signalCopy: { flex: 1, paddingRight: 8 },
  signalName: { fontFamily: MONO, color: INK, fontWeight: '900', fontSize: 9, letterSpacing: 0.5 },
  signalExplain: { fontFamily: MONO, color: 'rgba(10,10,10,0.5)', fontSize: 7, lineHeight: 11, marginTop: 4 },
  signalScore: { fontFamily: MONO, fontSize: 16, fontWeight: '900', color: INK },

  connectCard: { backgroundColor: INK, borderRadius: 2, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  connectCopy: { flex: 1, marginHorizontal: 13 },
  connectTitle: { fontFamily: MONO, fontSize: 10, fontWeight: '900', color: LIME, letterSpacing: 1 },
  connectText: { fontFamily: MONO, fontSize: 8, lineHeight: 13, color: PAPER, opacity: 0.7, marginTop: 4 },

  disclaimer: { fontFamily: MONO, fontSize: 7, lineHeight: 12, color: 'rgba(10,10,10,0.4)', textAlign: 'center', paddingHorizontal: 16, letterSpacing: 0.3 },
});
