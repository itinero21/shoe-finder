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

import { SHOES, Shoe } from '../data/shoes';
import { getFavorites } from '../utils/storage';
import { getRuns } from '../utils/runStorage';
import { Run } from '../types/run';
import { getStravaTokens, syncStravaActivities } from '../services/stravaService';
import { LiveRunModal } from '../../components/LiveRunModal';
import { LogRunModal } from '../../components/LogRunModal';
import { getLivingShoes } from '../utils/characterStorage';
import { LivingShoe } from '../types/character';
import { generateDialogue } from '../utils/dialogueEngine';

const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const MONO   = 'SpaceMono';

export default function RunScreen() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [livingShoes, setLivingShoes] = useState<LivingShoe[]>([]);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Modals
  const [showLiveRun, setShowLiveRun] = useState(false);
  const [showLogRun, setShowLogRun] = useState(false);
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

  const handleSync = async () => {
    setSyncing(true);
    await syncStravaActivities({}).catch(() => {});
    const allRuns = await getRuns();
    setRuns(allRuns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setSyncing(false);
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.eyebrow}>// STRIDE</Text>
        <Text style={s.title}>RUN.</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Start a live GPS run */}
        <TouchableOpacity
          style={s.bigBtn}
          onPress={() => { setShowLiveRun(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }}
          activeOpacity={0.85}
        >
          <View style={s.bigBtnShadow} />
          <View style={s.bigBtnInner}>
            <Ionicons name="navigate-outline" size={28} color={PAPER} />
            <Text style={s.bigBtnText}>START GPS RUN</Text>
            <Text style={s.bigBtnSub}>Track your route live</Text>
          </View>
        </TouchableOpacity>

        {/* Log a manual run */}
        {favoriteShoes.length > 0 && (
          <>
            <Text style={s.sectionLabel}>// LOG A RUN</Text>
            <Text style={s.sectionSub}>Pick the shoe you wore</Text>
            {favoriteShoes.map(shoe => {
              const char = livingShoes.find(c => c.shoeId === shoe.id);
              return (
                <TouchableOpacity
                  key={shoe.id}
                  style={s.shoeRow}
                  onPress={() => {
                    setLogRunShoe(shoe);
                    setShowLogRun(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={s.shoeRowLeft}>
                    <Text style={s.shoeRowBrand}>{shoe.brand.toUpperCase()}</Text>
                    <Text style={s.shoeRowModel}>{shoe.model}</Text>
                    {char && (
                      <Text style={s.shoeRowStage}>
                        {char.lifeStage.toUpperCase()} · {Math.round(char.totalMiles)} MI
                      </Text>
                    )}
                  </View>
                  <Ionicons name="add-circle-outline" size={24} color={ACCENT} />
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Sync Strava */}
        {stravaConnected && (
          <TouchableOpacity
            style={s.syncBtn}
            onPress={handleSync}
            activeOpacity={0.85}
          >
            <Ionicons name="sync-outline" size={16} color={syncing ? 'rgba(10,10,10,0.3)' : INK} />
            <Text style={s.syncBtnText}>{syncing ? 'SYNCING...' : 'SYNC STRAVA'}</Text>
          </TouchableOpacity>
        )}

        {/* Last run reaction */}
        {postRunLine && recentShoe && (
          <View style={s.reactionCard}>
            <Text style={s.reactionLabel}>// LAST RUN — {recentShoe.brand} {recentShoe.model}</Text>
            <Text style={s.reactionLine}>"{postRunLine.text}"</Text>
            <Text style={s.reactionMeta}>
              {(recentRun!.distanceKm * 0.621371).toFixed(1)} mi · {recentRun!.date.slice(0, 10)}
            </Text>
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
      <LiveRunModal visible={showLiveRun} onClose={() => setShowLiveRun(false)} onSaved={async () => {
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: INK },
  eyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 36, fontWeight: '900', color: INK, letterSpacing: -1 },
  scroll: { paddingVertical: 20, paddingBottom: 80 },

  bigBtn: { marginHorizontal: 16, marginBottom: 24, position: 'relative' },
  bigBtnShadow: { position: 'absolute', top: 6, left: 6, right: -6, bottom: -6, backgroundColor: INK, borderRadius: 2 },
  bigBtnInner: { backgroundColor: ACCENT, padding: 28, borderRadius: 2, borderWidth: 2, borderColor: INK, alignItems: 'center', gap: 8 },
  bigBtnText: { fontFamily: MONO, fontSize: 16, fontWeight: '700', color: PAPER, letterSpacing: 3 },
  bigBtnSub: { fontFamily: MONO, fontSize: 10, color: 'rgba(244,241,234,0.6)', letterSpacing: 1 },

  sectionLabel: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginHorizontal: 16, marginBottom: 4 },
  sectionSub: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.3)', marginHorizontal: 16, marginBottom: 12 },

  shoeRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 14, backgroundColor: PAPER },
  shoeRowLeft: { flex: 1, gap: 2 },
  shoeRowBrand: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 2 },
  shoeRowModel: { fontSize: 16, fontWeight: '800', color: INK },
  shoeRowStage: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 1 },

  syncBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 8, marginBottom: 20, paddingVertical: 12, borderWidth: 2, borderColor: 'rgba(10,10,10,0.15)', borderRadius: 2 },
  syncBtnText: { fontFamily: MONO, fontSize: 10, color: INK, letterSpacing: 1.5 },

  reactionCard: { marginHorizontal: 16, marginTop: 8, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 16, backgroundColor: INK },
  reactionLabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.4)', letterSpacing: 2, marginBottom: 10 },
  reactionLine: { fontSize: 16, fontWeight: '700', color: PAPER, lineHeight: 22, fontStyle: 'italic', marginBottom: 10 },
  reactionMeta: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.4)', letterSpacing: 1 },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: INK, marginBottom: 8 },
  emptySub: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.4)', textAlign: 'center', lineHeight: 17 },
});
