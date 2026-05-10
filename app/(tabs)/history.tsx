/**
 * Run Log — accessible from MY SHOES screen (href: null in tab bar).
 * Shows lifetime stats, weekly mileage, pace data, and full run list.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { getRuns } from '../utils/runStorage';
import { SHOES } from '../data/shoes';
import { Run } from '../types/run';
import { MATCH_LABELS } from '../utils/matchQuality';

const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME   = '#D4FF00';
const MONO   = 'SpaceMono';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatPace(km: number, mins: number): string {
  if (km < 0.05 || !mins) return '--:--';
  const secsPerMile = (mins * 60) / (km * 0.621371);
  const m = Math.floor(secsPerMile / 60);
  const s = Math.round(secsPerMile % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Weekly bar ───────────────────────────────────────────────────────────────

function WeekBar({ label, miles, maxMiles }: { label: string; miles: number; maxMiles: number }) {
  const pct = maxMiles > 0 ? miles / maxMiles : 0;
  return (
    <View style={wb.row}>
      <Text style={wb.label}>{label}</Text>
      <View style={wb.track}>
        <View style={[wb.fill, { width: `${pct * 100}%` as any }]} />
      </View>
      <Text style={wb.val}>{miles.toFixed(1)}</Text>
    </View>
  );
}

const wb = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  label: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', width: 32, letterSpacing: 0.5 },
  track: { flex: 1, height: 6, backgroundColor: 'rgba(10,10,10,0.08)', borderRadius: 1, overflow: 'hidden' },
  fill:  { height: '100%', backgroundColor: ACCENT, borderRadius: 1 },
  val:   { fontFamily: MONO, fontSize: 9, color: INK, width: 30, textAlign: 'right' },
});

// ─── Source badge ─────────────────────────────────────────────────────────────

const SOURCE_LABEL: Record<string, string> = {
  manual:       'MANUAL',
  strava:       'STRAVA',
  apple_health: '⌚ HEALTH',
};

const SOURCE_COLOR: Record<string, string> = {
  manual:       'rgba(10,10,10,0.25)',
  strava:       '#FC4C02',
  apple_health: '#FF2D55',
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const [runs, setRuns]         = useState<Run[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab]           = useState<'all' | 'stats'>('stats');

  const load = async () => {
    const data = await getRuns();
    setRuns(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // ── Stats ────────────────────────────────────────────────────────────────

  const totalKm    = runs.reduce((s, r) => s + r.distanceKm, 0);
  const totalMiles = totalKm * 0.621371;
  const totalRuns  = runs.length;

  // Best single run
  const bestRun = runs.length > 0
    ? [...runs].sort((a, b) => b.distanceKm - a.distanceKm)[0]
    : null;

  // Average pace (only runs with duration)
  const pacedRuns   = runs.filter(r => r.durationMinutes && r.durationMinutes > 0 && r.distanceKm > 0.3);
  const avgPaceStr  = pacedRuns.length > 0
    ? formatPace(
        pacedRuns.reduce((s, r) => s + r.distanceKm, 0),
        pacedRuns.reduce((s, r) => s + (r.durationMinutes ?? 0), 0)
      )
    : '--:--';

  // This week's miles
  const thisWeek = getISOWeek(new Date());
  const thisWeekMiles = runs
    .filter(r => getISOWeek(new Date(r.date)) === thisWeek)
    .reduce((s, r) => s + r.distanceKm * 0.621371, 0);

  // Last 8 weeks bar chart
  const weeklyData: { label: string; miles: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const wk = getISOWeek(d);
    const miles = runs
      .filter(r => getISOWeek(new Date(r.date)) === wk)
      .reduce((s, r) => s + r.distanceKm * 0.621371, 0);
    const weekLabel = `W${d.getDate()}`;
    weeklyData.push({ label: weekLabel, miles });
  }
  const maxWeekMiles = Math.max(...weeklyData.map(w => w.miles), 0.1);

  // Monthly breakdown (last 3)
  const monthMap: Record<string, number> = {};
  runs.forEach(r => {
    const mk = getMonthKey(new Date(r.date));
    monthMap[mk] = (monthMap[mk] ?? 0) + r.distanceKm * 0.621371;
  });
  const recentMonths = Object.entries(monthMap)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 3)
    .map(([key, miles]) => {
      const [year, month] = key.split('-');
      const label = new Date(parseInt(year), parseInt(month) - 1, 1)
        .toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      return { label, miles };
    });

  // Terrain breakdown
  const terrainMap: Record<string, number> = {};
  runs.forEach(r => {
    const t = r.terrain ?? 'unknown';
    terrainMap[t] = (terrainMap[t] ?? 0) + 1;
  });
  const terrainEntries = Object.entries(terrainMap).sort((a, b) => b[1] - a[1]);

  // Source breakdown
  const sourceMap: Record<string, number> = {};
  runs.forEach(r => {
    const src = r.source ?? 'manual';
    sourceMap[src] = (sourceMap[src] ?? 0) + 1;
  });

  return (
    <SafeAreaView style={s.container}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>// STRIDE PROTOCOL</Text>
          <Text style={s.title}>RUN LOG.</Text>
        </View>
        <View style={s.headerRight}>
          <Text style={s.totalMi}>{totalMiles.toFixed(0)}</Text>
          <Text style={s.totalMiLbl}>MI TOTAL</Text>
        </View>
      </View>

      {/* Tab switcher */}
      <View style={s.tabRow}>
        {(['stats', 'all'] as const).map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[s.tabBtn, tab === t && s.tabBtnActive]}>
            <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>
              {t === 'stats' ? 'STATS' : `ALL RUNS (${totalRuns})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >

        {/* ── STATS TAB ──────────────────────────────────────────────────── */}
        {tab === 'stats' && (
          <>
            {/* Big 4 stats */}
            <Animated.View entering={FadeInDown.duration(300)}>
              <View style={s.bigStatRow}>
                <View style={[s.bigStat, { backgroundColor: INK }]}>
                  <Text style={[s.bigStatVal, { color: LIME }]}>{totalMiles.toFixed(1)}</Text>
                  <Text style={[s.bigStatLbl, { color: 'rgba(244,241,234,0.4)' }]}>TOTAL MI</Text>
                </View>
                <View style={s.bigStat}>
                  <Text style={s.bigStatVal}>{totalRuns}</Text>
                  <Text style={s.bigStatLbl}>RUNS</Text>
                </View>
              </View>
              <View style={s.bigStatRow}>
                <View style={s.bigStat}>
                  <Text style={s.bigStatVal}>{avgPaceStr}</Text>
                  <Text style={s.bigStatLbl}>AVG PACE</Text>
                </View>
                <View style={[s.bigStat, { backgroundColor: '#FF2D55' }]}>
                  <Text style={[s.bigStatVal, { color: PAPER }]}>{thisWeekMiles.toFixed(1)}</Text>
                  <Text style={[s.bigStatLbl, { color: 'rgba(244,241,234,0.6)' }]}>THIS WEEK</Text>
                </View>
              </View>
            </Animated.View>

            {/* Weekly chart */}
            {runs.length > 0 && (
              <Animated.View entering={FadeInDown.delay(80).duration(300)} style={s.section}>
                <Text style={s.sectionTitle}>WEEKLY MILEAGE</Text>
                {weeklyData.map((w, i) => (
                  <WeekBar key={i} label={w.label} miles={w.miles} maxMiles={maxWeekMiles} />
                ))}
              </Animated.View>
            )}

            {/* Monthly breakdown */}
            {recentMonths.length > 0 && (
              <Animated.View entering={FadeInDown.delay(140).duration(300)} style={s.section}>
                <Text style={s.sectionTitle}>MONTHLY MILES</Text>
                <View style={s.monthRow}>
                  {recentMonths.map(m => (
                    <View key={m.label} style={s.monthCard}>
                      <Text style={s.monthVal}>{m.miles.toFixed(0)}</Text>
                      <Text style={s.monthLbl}>{m.label.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Best run */}
            {bestRun && (
              <Animated.View entering={FadeInDown.delay(180).duration(300)} style={s.section}>
                <Text style={s.sectionTitle}>BEST RUN</Text>
                <View style={s.bestCard}>
                  <Text style={s.bestDist}>{(bestRun.distanceKm * 0.621371).toFixed(2)} mi</Text>
                  <View style={s.bestMeta}>
                    <Text style={s.bestDate}>{formatDate(bestRun.date)}</Text>
                    {bestRun.durationMinutes && (
                      <Text style={s.bestPace}>{formatPace(bestRun.distanceKm, bestRun.durationMinutes)} /mi</Text>
                    )}
                  </View>
                  {SHOES.find(sh => sh.id === bestRun.shoeId) && (
                    <Text style={s.bestShoe}>
                      {(() => { const sh = SHOES.find(s => s.id === bestRun.shoeId)!; return `${sh.brand} ${sh.model}`; })()}
                    </Text>
                  )}
                </View>
              </Animated.View>
            )}

            {/* Terrain breakdown */}
            {terrainEntries.length > 0 && (
              <Animated.View entering={FadeInDown.delay(200).duration(300)} style={s.section}>
                <Text style={s.sectionTitle}>TERRAIN MIX</Text>
                <View style={s.chipWrap}>
                  {terrainEntries.map(([terrain, count]) => (
                    <View key={terrain} style={s.terrainChip}>
                      <Text style={s.terrainName}>{terrain.toUpperCase()}</Text>
                      <Text style={s.terrainCount}>{count} runs</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Source breakdown */}
            {Object.keys(sourceMap).length > 0 && (
              <Animated.View entering={FadeInDown.delay(220).duration(300)} style={s.section}>
                <Text style={s.sectionTitle}>RUN SOURCES</Text>
                <View style={s.chipWrap}>
                  {Object.entries(sourceMap).map(([src, count]) => (
                    <View key={src} style={[s.sourceChip, { borderColor: SOURCE_COLOR[src] ?? 'rgba(10,10,10,0.2)' }]}>
                      <Text style={[s.sourceName, { color: SOURCE_COLOR[src] ?? INK }]}>
                        {SOURCE_LABEL[src] ?? src.toUpperCase()}
                      </Text>
                      <Text style={s.sourceCount}>{count}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {runs.length === 0 && (
              <View style={s.empty}>
                <Text style={s.emptyTitle}>NO RUNS YET</Text>
                <Text style={s.emptyDesc}>Log runs from the Arsenal tab or use the live tracker to build your history.</Text>
              </View>
            )}
          </>
        )}

        {/* ── ALL RUNS TAB ───────────────────────────────────────────────── */}
        {tab === 'all' && (
          <>
            {runs.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyTitle}>NO RUNS YET</Text>
                <Text style={s.emptyDesc}>Log runs from the Arsenal tab to track your history.</Text>
              </View>
            ) : (
              runs.map((run, i) => {
                const shoe      = SHOES.find(sh => sh.id === run.shoeId);
                const matchInfo = run.match_quality ? MATCH_LABELS[run.match_quality] : null;
                const srcColor  = SOURCE_COLOR[run.source ?? 'manual'] ?? 'rgba(10,10,10,0.25)';
                const srcLabel  = SOURCE_LABEL[run.source ?? 'manual'] ?? (run.source ?? 'MANUAL').toUpperCase();
                return (
                  <Animated.View key={run.id} entering={FadeInDown.delay(i * 20).springify()}>
                    <View style={s.card}>
                      <View style={s.cardTop}>
                        <View style={s.cardLeft}>
                          <View style={s.cardTopRow}>
                            <Text style={s.cardDate}>{formatDate(run.date)}</Text>
                            <View style={[s.srcTag, { borderColor: srcColor }]}>
                              <Text style={[s.srcTagTxt, { color: srcColor }]}>{srcLabel}</Text>
                            </View>
                          </View>
                          <Text style={s.cardShoe}>
                            {shoe ? `${shoe.brand} ${shoe.model}` : '—'}
                          </Text>
                        </View>
                        <View style={s.distBadge}>
                          <Text style={s.distVal}>{(run.distanceKm * 0.621371).toFixed(1)}</Text>
                          <Text style={s.distUnit}>MI</Text>
                        </View>
                      </View>

                      <View style={s.tagsRow}>
                        {run.terrain && <View style={s.tag}><Text style={s.tagText}>{run.terrain.toUpperCase()}</Text></View>}
                        {run.purpose && <View style={s.tag}><Text style={s.tagText}>{run.purpose.toUpperCase()}</Text></View>}
                        {run.durationMinutes && run.durationMinutes > 0 && (
                          <View style={s.tag}>
                            <Text style={s.tagText}>
                              {run.durationMinutes}MIN
                              {run.distanceKm > 0 ? `  ·  ${formatPace(run.distanceKm, run.durationMinutes)}/mi` : ''}
                            </Text>
                          </View>
                        )}
                      </View>

                      {matchInfo && (
                        <View style={[s.matchRow, { borderLeftColor: matchInfo.color }]}>
                          <Text style={[s.matchLabel, { color: matchInfo.color }]}>{matchInfo.label}</Text>
                          {(run.xp_earned ?? 0) > 0 && (
                            <View style={[s.xpBadge, { backgroundColor: matchInfo.color }]}>
                              <Text style={s.xpText}>+{run.xp_earned} XP</Text>
                            </View>
                          )}
                        </View>
                      )}

                      {run.notes && <Text style={s.notes}>{run.notes}</Text>}
                    </View>
                  </Animated.View>
                );
              })
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },

  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingTop: 16, paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 2, borderBottomColor: INK,
  },
  eyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 32, fontWeight: '900', color: INK, letterSpacing: -1 },
  headerRight: { alignItems: 'flex-end', paddingBottom: 4 },
  totalMi: { fontSize: 28, fontWeight: '900', color: INK, letterSpacing: -1 },
  totalMiLbl: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 1.5 },

  tabRow: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(10,10,10,0.1)',
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: ACCENT },
  tabTxt: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 1.5 },
  tabTxtActive: { color: INK, fontWeight: '700' },

  content: { padding: 16, paddingBottom: 80 },

  bigStatRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  bigStat: {
    flex: 1, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 16,
    backgroundColor: PAPER,
  },
  bigStatVal: { fontSize: 28, fontWeight: '900', color: INK, letterSpacing: -1, marginBottom: 4 },
  bigStatLbl: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 2 },

  section: { marginTop: 20 },
  sectionTitle: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.35)', letterSpacing: 2, marginBottom: 10 },

  monthRow: { flexDirection: 'row', gap: 10 },
  monthCard: {
    flex: 1, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 14, alignItems: 'center',
  },
  monthVal: { fontSize: 24, fontWeight: '900', color: INK, letterSpacing: -1 },
  monthLbl: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', marginTop: 4, letterSpacing: 1 },

  bestCard: { borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 16, backgroundColor: INK },
  bestDist: { fontSize: 36, fontWeight: '900', color: LIME, letterSpacing: -1, marginBottom: 8 },
  bestMeta: { flexDirection: 'row', gap: 16, marginBottom: 6 },
  bestDate: { fontFamily: MONO, fontSize: 10, color: 'rgba(244,241,234,0.5)' },
  bestPace: { fontFamily: MONO, fontSize: 10, color: LIME },
  bestShoe: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: PAPER },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  terrainChip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 2, borderColor: INK, borderRadius: 2 },
  terrainName: { fontFamily: MONO, fontSize: 9, fontWeight: '700', color: INK, letterSpacing: 1 },
  terrainCount: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', marginTop: 2 },
  sourceChip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1.5, borderRadius: 2 },
  sourceName: { fontFamily: MONO, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  sourceCount: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', marginTop: 2 },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontFamily: MONO, fontSize: 14, fontWeight: '700', color: INK, marginBottom: 8, letterSpacing: 1 },
  emptyDesc: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.5)', textAlign: 'center', lineHeight: 18 },

  card: { backgroundColor: PAPER, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardLeft: { flex: 1, marginRight: 10 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardDate: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 1 },
  cardShoe: { fontSize: 15, fontWeight: '800', color: INK, letterSpacing: -0.2 },
  srcTag: { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderRadius: 2 },
  srcTagTxt: { fontFamily: MONO, fontSize: 7, fontWeight: '700', letterSpacing: 0.5 },
  distBadge: { alignItems: 'center', backgroundColor: INK, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 2, minWidth: 52 },
  distVal: { fontSize: 18, fontWeight: '900', color: PAPER, letterSpacing: -0.5 },
  distUnit: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.6)', letterSpacing: 1 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(10,10,10,0.2)', borderRadius: 2 },
  tagText: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.5)', letterSpacing: 0.5 },
  matchRow: { flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, paddingLeft: 8, gap: 8, marginBottom: 6 },
  matchLabel: { fontFamily: MONO, fontSize: 9, fontWeight: '700', letterSpacing: 0.5, flex: 1 },
  xpBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2 },
  xpText: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: PAPER, letterSpacing: 1 },
  notes: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.6)', marginTop: 6, fontStyle: 'italic' },
});
