/**
 * Run Log — hidden from tab bar (href: null), accessible as a sub-screen.
 * Replaces old quiz history screen with real run data.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getRuns } from '../utils/runStorage';
import { SHOES } from '../data/shoes';
import { Run } from '../types/run';
import { MATCH_LABELS } from '../utils/matchQuality';

const INK   = '#0A0A0A';
const PAPER = '#F4F1EA';
const ACCENT = '#FF3D00';
const MONO  = 'SpaceMono';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HistoryScreen() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const data = await getRuns();
    setRuns(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const totalKm = runs.reduce((sum, r) => sum + r.distanceKm, 0);
  const totalMiles = totalKm * 0.621371;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.eyebrow}>// STRIDE PROTOCOL</Text>
        <Text style={s.title}>RUN LOG.</Text>
        <Text style={s.subtitle}>{runs.length} runs · {totalMiles.toFixed(1)} mi lifetime</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        {runs.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>NO RUNS YET</Text>
            <Text style={s.emptyDesc}>Log runs from the Arsenal tab to track your history.</Text>
          </View>
        ) : (
          runs.map((run, i) => {
            const shoe = SHOES.find(sh => sh.id === run.shoeId);
            const matchInfo = run.match_quality ? MATCH_LABELS[run.match_quality] : null;
            return (
              <Animated.View key={run.id} entering={FadeInDown.delay(i * 30).springify()}>
                <View style={s.card}>
                  {/* Top row */}
                  <View style={s.cardTop}>
                    <View style={s.cardLeft}>
                      <Text style={s.cardDate}>{formatDate(run.date)}</Text>
                      <Text style={s.cardShoe}>{shoe ? `${shoe.brand} ${shoe.model}` : run.shoeId}</Text>
                    </View>
                    <View style={s.distBadge}>
                      <Text style={s.distVal}>{(run.distanceKm * 0.621371).toFixed(1)}</Text>
                      <Text style={s.distUnit}>MI</Text>
                    </View>
                  </View>

                  {/* Tags row */}
                  <View style={s.tagsRow}>
                    {run.terrain && (
                      <View style={s.tag}><Text style={s.tagText}>{run.terrain.toUpperCase()}</Text></View>
                    )}
                    {run.purpose && (
                      <View style={s.tag}><Text style={s.tagText}>{run.purpose.toUpperCase()}</Text></View>
                    )}
                    {run.durationMinutes && (
                      <View style={s.tag}><Text style={s.tagText}>{run.durationMinutes}MIN</Text></View>
                    )}
                    {run.feel && (
                      <View style={s.tag}>
                        <Text style={s.tagText}>{run.feel === 3 ? 'FRESH' : run.feel === 2 ? 'OKAY' : 'DEAD'}</Text>
                      </View>
                    )}
                  </View>

                  {/* Match quality */}
                  {matchInfo && (
                    <View style={[s.matchRow, { borderLeftColor: matchInfo.color }]}>
                      <Text style={[s.matchLabel, { color: matchInfo.color }]}>{matchInfo.label}</Text>
                      {run.xp_earned && run.xp_earned > 0 && (
                        <View style={[s.xpBadge, { backgroundColor: matchInfo.color }]}>
                          <Text style={s.xpText}>+{run.xp_earned} XP</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Source */}
                  {run.source && run.source !== 'manual' && (
                    <Text style={s.source}>via {run.source.replace('_', ' ')}</Text>
                  )}

                  {run.notes && <Text style={s.notes}>{run.notes}</Text>}
                </View>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  header: {
    paddingTop: 20, paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 2, borderBottomColor: INK,
  },
  eyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 32, fontWeight: '900', color: INK, letterSpacing: -1, marginBottom: 4 },
  subtitle: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.5)', letterSpacing: 0.5 },
  content: { padding: 16, paddingBottom: 60 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontFamily: MONO, fontSize: 14, fontWeight: '700', color: INK, marginBottom: 8, letterSpacing: 1 },
  emptyDesc: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.5)', textAlign: 'center', lineHeight: 18 },
  card: {
    backgroundColor: PAPER, borderWidth: 2, borderColor: INK, borderRadius: 2,
    padding: 14, marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardLeft: { flex: 1 },
  cardDate: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 1, marginBottom: 4 },
  cardShoe: { fontSize: 15, fontWeight: '800', color: INK, letterSpacing: -0.2 },
  distBadge: { alignItems: 'center', backgroundColor: INK, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 2 },
  distVal: { fontSize: 18, fontWeight: '900', color: PAPER, letterSpacing: -0.5 },
  distUnit: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.6)', letterSpacing: 1 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(10,10,10,0.2)', borderRadius: 2 },
  tagText: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.5)', letterSpacing: 0.5 },
  matchRow: { flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, paddingLeft: 8, gap: 8, marginBottom: 6 },
  matchLabel: { fontFamily: MONO, fontSize: 9, fontWeight: '700', letterSpacing: 0.5, flex: 1 },
  xpBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2 },
  xpText: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: PAPER, letterSpacing: 1 },
  source: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.3)', letterSpacing: 1, marginTop: 2 },
  notes: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.6)', marginTop: 6, fontStyle: 'italic' },
});
