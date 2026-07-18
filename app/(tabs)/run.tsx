/**
 * RUN TAB — Track a live run, log/sync, pick shoe, see consequence.
 * Minimal screen: pick a shoe, start running, see the shoe react.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { ALL_TRACKABLE_SHOES as SHOES, Shoe } from '../data/shoes';
import { getFavorites } from '../utils/storage';
import { getRuns, updateRun } from '../utils/runStorage';
import { Run } from '../types/run';
import { connectStrava, getStravaTokens, syncStravaActivities } from '../services/stravaService';
import { LiveRunModal } from '../../components/LiveRunModal';
import { LogRunModal } from '../../components/LogRunModal';
import { WatchConnectModal } from '../../components/WatchConnectModal';
import { StravaMark, AppleHealthMark, GarminMark, Wordmark } from '../../components/BrandMarks';
import { getLivingShoes } from '../utils/characterStorage';
import { LivingShoe } from '../types/character';
import { generateDialogue } from '../utils/dialogueEngine';
import { getTodaysWeather } from '../services/weatherService';
import { getUserProfile } from '../utils/userProfile';
import { getShoeOfTheDay, ShoeRecommendation } from '../intelligence/bridge';

const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME   = '#D4FF00';
const MONO   = 'SpaceMono';
const BLUE   = '#2563EB';
const GREEN  = '#16A34A';
const AMBER  = '#D97706';
const GREY   = '#6B7280';

const STAGE_COLORS: Record<string, string> = {
  fresh: GREEN,
  prime: BLUE,
  veteran: AMBER,
  twilight: ACCENT,
  departed: GREY,
};

export default function RunScreen() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [livingShoes, setLivingShoes] = useState<LivingShoe[]>([]);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [justRated, setJustRated] = useState(false);
  const [recommended, setRecommended] = useState<ShoeRecommendation | null>(null);

  // Modals
  const [showLiveRun, setShowLiveRun] = useState(false);
  const [showLogRun, setShowLogRun] = useState(false);
  const [showWatches, setShowWatches] = useState(false);
  const [logRunShoe, setLogRunShoe] = useState<Shoe | null>(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [favs, allRuns, chars, stravaTokens] = await Promise.all([
        getFavorites(),
        getRuns(),
        getLivingShoes(),
        getStravaTokens(),
      ]);
      setFavoriteIds(favs);
      setRuns(allRuns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLivingShoes(chars);
      setStravaConnected(!!stravaTokens?.access_token);
      const shoeData = Object.fromEntries(SHOES.map(shoe => [shoe.id, shoe]));
      const [weather, profile] = await Promise.all([
        getTodaysWeather().catch(() => null),
        getUserProfile(),
      ]);
      setRecommended(getShoeOfTheDay(chars, shoeData, allRuns, weather, profile));
    })();
  }, []));

  const favoriteShoes = SHOES.filter(s => favoriteIds.includes(s.id));
  const recentRun = runs[0];
  const recentShoe = recentRun ? SHOES.find(s => s.id === recentRun.shoeId) : null;
  const recentChar = recentRun ? livingShoes.find(c => c.shoeId === recentRun.shoeId) : null;

  // Post-run reaction from the shoe
  const postRunLine = recentChar && recentShoe
    ? generateDialogue(recentChar, recentShoe, 'post_run', {
        miles: Math.round(recentRun!.distanceKm * 0.621371),
      })
    : null;

  // Learning Engine: ask "how did the shoe feel?" for any recent unrated run —
  // including runs imported from Strava / Apple Health that never got a prompt
  const unratedRun = !justRated && recentRun && recentRun.feel5 == null &&
    Date.now() - new Date(recentRun.date).getTime() < 48 * 3600000
    ? recentRun : null;

  const handleQuickRate = async (f5: 1 | 2 | 3 | 4 | 5) => {
    if (!unratedRun) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const legacy = (f5 >= 4 ? 3 : f5 === 3 ? 2 : 1) as 1 | 2 | 3;
    await updateRun(unratedRun.id, { feel5: f5, feel: legacy }).catch(() => {});
    setJustRated(true);
    const allRuns = await getRuns();
    setRuns(allRuns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleSync = async () => {
    setSyncing(true);
    await syncStravaActivities({}).catch(() => {});
    const allRuns = await getRuns();
    setRuns(allRuns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setSyncing(false);
  };

  const handleConnectStrava = async () => {
    setSyncing(true);
    const tokens = await connectStrava().catch(() => null);
    setStravaConnected(!!tokens?.access_token);
    setSyncing(false);
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>RUN CONTROL</Text>
          <Text style={s.title}>RUN.</Text>
        </View>
        <View style={s.headerStat}>
          <Text style={s.headerStatValue}>{runs.length}</Text>
          <Text style={s.headerStatLabel}>LOGGED</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Learning Engine: one-tap rating for the latest unrated run */}
        {unratedRun && recentShoe && (
          <View style={s.rateCard}>
            <Text style={s.rateLabel}>HOW DID THE {recentShoe.model.toUpperCase()} FEEL?</Text>
            <Text style={s.rateSub}>
              {unratedRun.distanceKm.toFixed(1)} KM · {unratedRun.source === 'strava' ? 'FROM STRAVA' : unratedRun.source === 'apple_health' ? 'FROM APPLE HEALTH' : 'RECENT RUN'} — ONE TAP TRAINS YOUR SHOE DNA
            </Text>
            <View style={s.rateRow}>
              {([
                { v: 1, l: 'AWFUL' }, { v: 2, l: 'POOR' }, { v: 3, l: 'AVG' },
                { v: 4, l: 'GOOD' }, { v: 5, l: 'PERFECT' },
              ] as { v: 1|2|3|4|5; l: string }[]).map(o => (
                <TouchableOpacity key={o.v} onPress={() => handleQuickRate(o.v)} style={s.rateChip}>
                  <Text style={s.rateChipText}>{o.l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {recommended && (
          <View style={s.recommendedCard}>
            <View style={s.recommendedTop}>
              <Text style={s.recommendedLabel}>RECOMMENDED TODAY</Text>
              <Text style={s.recommendedScore}>{recommended.score}% READY</Text>
            </View>
            <Text style={s.recommendedName}>{recommended.shoeName.toUpperCase()}</Text>
            <Text style={s.recommendedReason}>{recommended.reason}</Text>
            <TouchableOpacity
              style={s.recommendedBtn}
              onPress={() => { setShowLiveRun(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }}
            >
              <Text style={s.recommendedBtnText}>USE THIS SHOE</Text>
              <Ionicons name="arrow-forward" size={17} color={INK} />
            </TouchableOpacity>
          </View>
        )}

        {/* Start a live GPS run */}
        <TouchableOpacity
          style={s.heroWrap}
          onPress={() => { setShowLiveRun(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }}
          activeOpacity={0.85}
        >
          <View style={s.heroShadow} />
          <View style={s.heroCard}>
            <View style={s.heroTop}>
              <View style={s.heroIconBox}>
                <Ionicons name="navigate-outline" size={26} color={PAPER} />
              </View>
              <View style={s.heroMeta}>
                <Text style={s.heroLabel}>GPS SESSION</Text>
                <Text style={s.heroTitle}>START LIVE RUN</Text>
              </View>
              <Ionicons name="arrow-forward" size={22} color={PAPER} />
            </View>
            <View style={s.heroRule} />
            <View style={s.heroStats}>
              <View style={s.heroStat}>
                <Text style={s.heroStatValue}>ROUTE</Text>
                <Text style={s.heroStatLabel}>GPS TRACE</Text>
              </View>
              <View style={s.heroStatDivider} />
              <View style={s.heroStat}>
                <Text style={s.heroStatValue}>SHOE</Text>
                <Text style={s.heroStatLabel}>REACTION</Text>
              </View>
              <View style={s.heroStatDivider} />
              <View style={s.heroStat}>
                <Text style={s.heroStatValue}>SYNC</Text>
                <Text style={s.heroStatLabel}>OPTIONAL</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Log a manual run */}
        {favoriteShoes.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHead}>
              <Text style={s.sectionLabel}>MANUAL LOG</Text>
              <Text style={s.sectionSub}>PICK THE SHOE YOU WORE</Text>
            </View>
            {favoriteShoes.map(shoe => {
              const char = livingShoes.find(c => c.shoeId === shoe.id);
              const stageColor = STAGE_COLORS[char?.lifeStage ?? 'fresh'] ?? ACCENT;
              return (
                <TouchableOpacity
                  key={shoe.id}
                  style={s.shoeRowWrap}
                  onPress={() => {
                    setLogRunShoe(shoe);
                    setShowLogRun(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={[s.shoeRowShadow, { backgroundColor: stageColor }]} />
                  <View style={s.shoeRow}>
                    <View style={s.shoeRowLeft}>
                      <Text style={s.shoeRowBrand}>{shoe.brand.toUpperCase()}</Text>
                      <Text style={s.shoeRowModel}>{shoe.model}</Text>
                      {char && (
                        <View style={s.shoeMetaRow}>
                          <View style={[s.stageDot, { backgroundColor: stageColor }]} />
                          <Text style={s.shoeRowStage}>
                            {char.lifeStage.toUpperCase()} / {Math.round(char.totalMiles)} MI / {char.runCount} RUNS
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={s.addRunBox}>
                      <Ionicons name="add" size={20} color={INK} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionLabel}>IMPORT &amp; SYNC</Text>
            <Text style={s.sectionSub}>BRING IN RUNS FROM YOUR OTHER APPS</Text>
          </View>

          <TouchableOpacity
            style={s.integrationWrap}
            onPress={stravaConnected ? handleSync : handleConnectStrava}
            activeOpacity={0.85}
          >
            <View style={s.integrationShadow} />
            <View style={s.integrationCard}>
              <StravaMark size="md" />
              <View style={s.integrationBody}>
                <Wordmark brand="strava" />
                <Text style={s.integrationSub}>
                  {stravaConnected ? 'CONNECTED / PULL LATEST RUNS' : 'CONNECT TO IMPORT ACTIVITIES'}
                </Text>
              </View>
              <View style={[s.integrationStatus, stravaConnected && s.integrationStatusOn]}>
                <Text style={[s.integrationStatusText, stravaConnected && s.integrationStatusTextOn]}>
                  {syncing ? '...' : stravaConnected ? 'SYNC' : 'LINK'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.integrationWrap}
            onPress={() => { setShowWatches(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            activeOpacity={0.85}
          >
            <View style={[s.integrationShadow, { backgroundColor: BLUE }]} />
            <View style={s.integrationCard}>
              <View style={s.dualMarks}>
                <AppleHealthMark size="sm" />
                <GarminMark size="sm" />
              </View>
              <View style={s.integrationBody}>
                <Text style={s.integrationTitle}>WATCHES</Text>
                <Text style={s.integrationSub}>APPLE HEALTH / GARMIN BRIDGE</Text>
              </View>
              <View style={s.integrationStatus}>
                <Text style={s.integrationStatusText}>OPEN</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Last run reaction */}
        {postRunLine && recentShoe && (
          <View style={s.reactionWrap}>
            <View style={s.reactionShadow} />
            <View style={s.reactionCard}>
              <Text style={s.reactionLabel}>LAST RUN — {recentShoe.brand.toUpperCase()} {recentShoe.model.toUpperCase()}</Text>
              <Text style={s.reactionLine}>"{postRunLine.text}"</Text>
              <Text style={s.reactionMeta}>
                {(recentRun!.distanceKm * 0.621371).toFixed(1)} MI / {recentRun!.date.slice(0, 10)}
              </Text>
            </View>
          </View>
        )}

        {/* Empty state */}
        {favoriteShoes.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>NO SHOES YET</Text>
            <Text style={s.emptySub}>Add shoes in the ADD tab to start logging runs.</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <LiveRunModal visible={showLiveRun} initialShoeId={recommended?.shoeId} onClose={() => setShowLiveRun(false)} onSaved={async () => {
        const allRuns = await getRuns();
        setRuns(allRuns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }} />

      {logRunShoe && (
        <LogRunModal
          visible={showLogRun}
          shoeId={logRunShoe.id}
          shoeName={`${logRunShoe.brand} ${logRunShoe.model}`}
          onClose={() => { setShowLogRun(false); setLogRunShoe(null); }}
          onSaved={async () => {
            const allRuns = await getRuns();
            setRuns(allRuns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          }}
        />
      )}

      <WatchConnectModal visible={showWatches} onClose={() => setShowWatches(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: INK },
  eyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 4 },
  title: { fontFamily: MONO, fontSize: 36, fontWeight: '900', color: INK, letterSpacing: 0 },
  headerStat: { borderWidth: 2, borderColor: INK, minWidth: 70, alignItems: 'center', paddingVertical: 7, borderRadius: 2 },
  headerStatValue: { fontFamily: MONO, fontSize: 16, fontWeight: '900', color: INK, letterSpacing: 0 },
  headerStatLabel: { fontFamily: MONO, fontSize: 7, fontWeight: '700', color: 'rgba(10,10,10,0.45)', letterSpacing: 1.5 },
  scroll: { paddingVertical: 20, paddingBottom: 80 },

  recommendedCard: { marginHorizontal: 16, marginBottom: 22, padding: 16, backgroundColor: INK, borderLeftWidth: 5, borderLeftColor: LIME },
  recommendedTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  recommendedLabel: { fontFamily: MONO, fontSize: 8, fontWeight: '900', color: 'rgba(244,241,234,0.5)', letterSpacing: 2 },
  recommendedScore: { fontFamily: MONO, fontSize: 9, fontWeight: '900', color: LIME, letterSpacing: 1 },
  recommendedName: { fontFamily: MONO, fontSize: 18, fontWeight: '900', color: PAPER, lineHeight: 24, marginBottom: 7 },
  recommendedReason: { fontFamily: MONO, fontSize: 10, color: 'rgba(244,241,234,0.65)', lineHeight: 16, marginBottom: 13 },
  recommendedBtn: { backgroundColor: LIME, borderWidth: 2, borderColor: PAPER, paddingVertical: 11, paddingHorizontal: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recommendedBtnText: { fontFamily: MONO, fontSize: 10, fontWeight: '900', color: INK, letterSpacing: 1.5 },

  heroWrap: { marginHorizontal: 16, marginBottom: 26, position: 'relative' },
  heroShadow: { position: 'absolute', top: 6, left: 6, right: -6, bottom: -6, backgroundColor: INK, borderRadius: 2 },
  heroCard: { backgroundColor: ACCENT, padding: 18, borderRadius: 2, borderWidth: 2, borderColor: INK },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIconBox: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: PAPER, borderRadius: 2 },
  heroMeta: { flex: 1 },
  heroLabel: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: 'rgba(244,241,234,0.65)', letterSpacing: 2, marginBottom: 3 },
  heroTitle: { fontFamily: MONO, fontSize: 17, fontWeight: '900', color: PAPER, letterSpacing: 1.5 },
  heroRule: { height: 2, backgroundColor: INK, marginVertical: 16, opacity: 0.5 },
  heroStats: { flexDirection: 'row', borderWidth: 2, borderColor: PAPER },
  heroStat: { flex: 1, alignItems: 'center', paddingVertical: 9 },
  heroStatDivider: { width: 2, backgroundColor: PAPER },
  heroStatValue: { fontFamily: MONO, fontSize: 10, fontWeight: '900', color: PAPER, letterSpacing: 1 },
  heroStatLabel: { fontFamily: MONO, fontSize: 7, fontWeight: '700', color: 'rgba(244,241,234,0.6)', letterSpacing: 1 },

  section: { marginBottom: 24 },
  sectionHead: { paddingHorizontal: 16, marginBottom: 12 },
  sectionLabel: { fontFamily: MONO, fontSize: 9, fontWeight: '700', color: ACCENT, letterSpacing: 2, marginBottom: 4 },
  sectionSub: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 1.5 },

  shoeRowWrap: { position: 'relative', marginHorizontal: 16, marginBottom: 14 },
  shoeRowShadow: { position: 'absolute', top: 5, left: 5, right: -5, bottom: -5, borderRadius: 2 },
  shoeRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 14, backgroundColor: PAPER },
  shoeRowLeft: { flex: 1, gap: 2 },
  shoeRowBrand: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 2 },
  shoeRowModel: { fontFamily: MONO, fontSize: 15, fontWeight: '900', color: INK, letterSpacing: 0 },
  shoeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  stageDot: { width: 7, height: 7, borderRadius: 4 },
  shoeRowStage: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.45)', letterSpacing: 1 },
  addRunBox: { width: 32, height: 32, borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center', borderRadius: 2 },

  integrationWrap: { position: 'relative', marginHorizontal: 16, marginBottom: 14 },
  integrationShadow: { position: 'absolute', top: 5, left: 5, right: -5, bottom: -5, backgroundColor: INK, borderRadius: 2 },
  integrationCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderColor: INK, backgroundColor: PAPER, padding: 12, borderRadius: 2 },
  dualMarks: { flexDirection: 'row', gap: 6 },
  integrationBody: { flex: 1 },
  integrationTitle: { fontFamily: MONO, fontSize: 11, fontWeight: '900', color: INK, letterSpacing: 2 },
  integrationSub: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.45)', letterSpacing: 1, marginTop: 4 },
  integrationStatus: { minWidth: 54, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(10,10,10,0.2)', paddingVertical: 7, paddingHorizontal: 8, borderRadius: 2 },
  integrationStatusOn: { borderColor: ACCENT, backgroundColor: ACCENT },
  integrationStatusText: { fontFamily: MONO, fontSize: 8, fontWeight: '900', color: 'rgba(10,10,10,0.45)', letterSpacing: 1 },
  integrationStatusTextOn: { color: PAPER },

  reactionWrap: { position: 'relative', marginHorizontal: 16, marginTop: 2, marginBottom: 18 },
  reactionShadow: { position: 'absolute', top: 6, left: 6, right: -6, bottom: -6, backgroundColor: ACCENT, borderRadius: 2 },
  reactionCard: { borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 16, backgroundColor: INK },
  reactionLabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.45)', letterSpacing: 2, marginBottom: 10 },
  reactionLine: { fontFamily: MONO, fontSize: 14, fontWeight: '700', color: PAPER, lineHeight: 22, marginBottom: 10 },
  reactionMeta: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.45)', letterSpacing: 1 },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontFamily: MONO, fontSize: 18, fontWeight: '900', color: INK, marginBottom: 8, letterSpacing: 0 },
  emptySub: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.4)', textAlign: 'center', lineHeight: 17 },
  rateCard: { borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 14, marginBottom: 16, backgroundColor: '#FFFFFF' },
  rateLabel: { fontFamily: MONO, fontSize: 11, fontWeight: '900', color: INK, letterSpacing: 1, marginBottom: 4 },
  rateSub: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.45)', letterSpacing: 0.5, marginBottom: 10, lineHeight: 12 },
  rateRow: { flexDirection: 'row', gap: 6 },
  rateChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderWidth: 2, borderColor: 'rgba(10,10,10,0.25)', borderRadius: 2 },
  rateChipText: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: INK, letterSpacing: 0.5 },
});
