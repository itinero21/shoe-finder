/**
 * SHOE WARS — The Game.
 * Weekly roster · Character cards · Battle log · XP system
 * Beginner protections: no penalties, double XP cap, mileage-bracketed display.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { SHOES, Shoe } from '../data/shoes';
import { getFavorites } from '../utils/storage';
import { getRuns } from '../utils/runStorage';
import { getUserProfile, UserProfile } from '../utils/userProfile';
import {
  deriveShoeStats, getUserLevel, TIER_COLORS,
  ShoeGameStats, LEVELS,
} from '../utils/gameEngine';
import { GameStatBars } from '../../components/GameStatBars';
import { Run } from '../types/run';

const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME   = '#D4FF00';
const MONO   = 'SpaceMono';

const MQ_COLORS: Record<string, string> = {
  perfect: '#16A34A',
  good:    '#2563EB',
  neutral: '#6B7280',
  poor:    '#D97706',
  abuse:   '#FF3D00',
};

const MQ_MULT: Record<string, string> = {
  perfect: '×2.0',
  good:    '×1.5',
  neutral: '×1.0',
  poor:    '×0.5',
  abuse:   '×0.25',
};

function getMonday(): Date {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekRuns(runs: Run[]): Run[] {
  const monday = getMonday();
  return runs.filter(r => new Date(r.date) >= monday);
}

function kmToMi(km: number) { return (km * 0.621371).toFixed(1); }

type Tab = 'roster' | 'characters' | 'battle_log';

// ─── Character Card ────────────────────────────────────────────────────────────
const CharacterCard: React.FC<{
  shoe: Shoe;
  inRoster?: boolean;
  weekXP?: number;
  index: number;
}> = ({ shoe, inRoster, weekXP, index }) => {
  const stats = deriveShoeStats(shoe);
  const tierColor = TIER_COLORS[stats.tier];

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).springify()}>
      <View style={cc.wrap}>
        <View style={[cc.shadow, { backgroundColor: tierColor }]} />
        <View style={cc.card}>
          {/* Header */}
          <View style={cc.cardHeader}>
            <View style={[cc.tierBadge, { backgroundColor: tierColor }]}>
              <Text style={cc.tierText}>{stats.tier.toUpperCase()}</Text>
            </View>
            {inRoster && (
              <View style={cc.rosterBadge}>
                <Text style={cc.rosterBadgeText}>ACTIVE</Text>
              </View>
            )}
            <Text style={cc.overall}>{stats.overall}/10</Text>
          </View>

          <Text style={cc.brand}>{shoe.brand.toUpperCase()}</Text>
          <Text style={cc.model}>{shoe.model}</Text>

          {/* Big stat grid */}
          <View style={cc.statGrid}>
            {[
              { label: 'SPEED',     val: stats.speed,     color: '#FF3D00' },
              { label: 'ENDURANCE', val: stats.endurance, color: '#2563EB' },
              { label: 'GRIP',      val: stats.grip,      color: '#16A34A' },
              { label: 'COMFORT',   val: stats.comfort,   color: '#7C3AED' },
            ].map(({ label, val, color }) => (
              <View key={label} style={cc.statCell}>
                <Text style={[cc.statNum, { color }]}>{val}</Text>
                <Text style={cc.statLabel}>{label}</Text>
                <View style={cc.miniBar}>
                  <View style={[cc.miniBarFill, { width: `${val * 10}%` as any, backgroundColor: color }]} />
                </View>
              </View>
            ))}
          </View>

          {weekXP !== undefined && weekXP > 0 && (
            <View style={cc.weekXP}>
              <Text style={cc.weekXPText}>+{weekXP} XP THIS WEEK</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const cc = StyleSheet.create({
  wrap: { position: 'relative', marginBottom: 20, marginHorizontal: 16 },
  shadow: { position: 'absolute', top: 5, left: 5, right: -5, bottom: -5, borderRadius: 2 },
  card: { backgroundColor: PAPER, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 18 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2 },
  tierText: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: PAPER, letterSpacing: 1.5 },
  rosterBadge: { paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1.5, borderColor: LIME, borderRadius: 2 },
  rosterBadgeText: { fontFamily: MONO, fontSize: 8, color: INK, letterSpacing: 1 },
  overall: { marginLeft: 'auto', fontFamily: MONO, fontSize: 13, fontWeight: '700', color: INK },
  brand: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 2 },
  model: { fontSize: 20, fontWeight: '900', color: INK, letterSpacing: -0.5, marginBottom: 16 },
  statGrid: { flexDirection: 'row', gap: 8 },
  statCell: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontFamily: MONO, fontSize: 7, color: 'rgba(10,10,10,0.4)', letterSpacing: 1 },
  miniBar: { width: '100%', height: 4, backgroundColor: 'rgba(10,10,10,0.08)', borderRadius: 1, overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: 1 },
  weekXP: { marginTop: 14, backgroundColor: LIME, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 2, alignSelf: 'flex-start' },
  weekXPText: { fontFamily: MONO, fontSize: 9, fontWeight: '700', color: INK, letterSpacing: 1.5 },
});

// ─── Battle log row ────────────────────────────────────────────────────────────
const BattleRow: React.FC<{ run: Run; shoe: Shoe | undefined; index: number }> = ({ run, shoe, index }) => {
  const mq = run.match_quality ?? 'neutral';
  const mqColor = MQ_COLORS[mq] ?? '#6B7280';
  const miles = kmToMi(run.distanceKm);

  return (
    <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
      <View style={bl.row}>
        {/* Left: date + shoe */}
        <View style={bl.left}>
          <Text style={bl.date}>{run.date.slice(0, 10)}</Text>
          <Text style={bl.shoeName} numberOfLines={1}>
            {shoe ? `${shoe.brand} ${shoe.model}` : 'Unknown shoe'}
          </Text>
          <View style={bl.tags}>
            <Text style={bl.tag}>{run.terrain}</Text>
            <Text style={bl.tag}>{run.purpose}</Text>
            <Text style={bl.tag}>{miles} mi</Text>
          </View>
        </View>
        {/* Right: MQ + XP */}
        <View style={bl.right}>
          <View style={[bl.mqBadge, { borderColor: mqColor }]}>
            <Text style={[bl.mqText, { color: mqColor }]}>{mq.toUpperCase()}</Text>
          </View>
          <Text style={bl.mult}>{MQ_MULT[mq] ?? '×1.0'}</Text>
          <Text style={bl.xp}>+{run.xp_earned ?? 0} XP</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const bl = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(10,10,10,0.07)' },
  left: { flex: 1, gap: 3 },
  date: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.35)', letterSpacing: 1 },
  shoeName: { fontSize: 13, fontWeight: '800', color: INK },
  tags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  tag: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.45)', letterSpacing: 0.5 },
  right: { alignItems: 'flex-end', gap: 4 },
  mqBadge: { paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1.5, borderRadius: 2 },
  mqText: { fontFamily: MONO, fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  mult: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)' },
  xp: { fontFamily: MONO, fontSize: 12, fontWeight: '700', color: INK },
});

// ─── MAIN SCREEN ───────────────────────────────────────────────────────────────
export default function ShoeWarsScreen() {
  const [tab, setTab] = useState<Tab>('roster');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [favs, allRuns, prof] = await Promise.all([
        getFavorites(),
        getRuns(),
        getUserProfile(),
      ]);
      setFavoriteIds(favs);
      setRuns(allRuns);
      setProfile(prof);
    })();
  }, []));

  const favoriteShoes = SHOES.filter(s => favoriteIds.includes(s.id));
  const weekRuns = getWeekRuns(runs);
  const rosterIds = profile?.weekly_roster ?? [];
  const rosterShoes = rosterIds.map(id => SHOES.find(s => s.id === id)).filter(Boolean) as Shoe[];

  // XP earned per shoe this week
  const weekXPByShoe: Record<string, number> = {};
  for (const r of weekRuns) {
    weekXPByShoe[r.shoeId] = (weekXPByShoe[r.shoeId] ?? 0) + (r.xp_earned ?? 0);
  }

  const weekTotalXP = weekRuns.reduce((s, r) => s + (r.xp_earned ?? 0), 0);
  const weekTotalMiles = weekRuns.reduce((s, r) => s + r.distanceKm * 0.621371, 0);

  const levelInfo = profile ? getUserLevel(profile.total_xp) : null;
  const isBeginnerMode = profile?.is_beginner_mode ?? false;

  // Characters tab: all arsenal shoes sorted by overall desc
  const characterShoes = [...favoriteShoes].sort((a, b) =>
    deriveShoeStats(b).overall - deriveShoeStats(a).overall
  );

  return (
    <SafeAreaView style={s.container}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.eyebrow}>// STRIDE PROTOCOL</Text>
          <Text style={s.title}>SHOE WARS.</Text>
        </View>
        {levelInfo && (
          <View style={s.levelBox}>
            <Text style={s.levelNum}>LV.{levelInfo.current.level}</Text>
            <Text style={s.levelName}>{levelInfo.current.name}</Text>
            <View style={s.xpBarTrack}>
              <View style={[s.xpBarFill, { width: `${Math.round(levelInfo.progress * 100)}%` as any }]} />
            </View>
            <Text style={s.totalXP}>{profile!.total_xp.toLocaleString()} XP</Text>
          </View>
        )}
      </View>

      {/* Beginner mode banner */}
      {isBeginnerMode && (
        <View style={s.beginnerBanner}>
          <Text style={s.beginnerText}>BEGINNER MODE — No penalties // Double XP cap on achievements // Protected leaderboard bracket</Text>
        </View>
      )}

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <View style={s.tabBar}>
        {([
          { key: 'roster',     label: 'ROSTER' },
          { key: 'characters', label: 'CHARACTERS' },
          { key: 'battle_log', label: 'BATTLE LOG' },
        ] as { key: Tab; label: string }[]).map(t => (
          <TouchableOpacity
            key={t.key}
            onPress={() => { setTab(t.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={[s.tabBtn, tab === t.key && s.tabBtnActive]}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── ROSTER TAB ──────────────────────────────────────────────────── */}
      {tab === 'roster' && (
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* This week summary */}
          {weekRuns.length > 0 && (
            <View style={s.weekSummary}>
              <Text style={s.weekSummaryTitle}>// THIS WEEK</Text>
              <View style={s.weekSummaryGrid}>
                <View style={s.weekCell}>
                  <Text style={s.weekVal}>{weekRuns.length}</Text>
                  <Text style={s.weekLabel}>RUNS</Text>
                </View>
                <View style={s.weekCell}>
                  <Text style={s.weekVal}>{weekTotalMiles.toFixed(1)}</Text>
                  <Text style={s.weekLabel}>MILES</Text>
                </View>
                <View style={s.weekCell}>
                  <Text style={[s.weekVal, { color: ACCENT }]}>+{weekTotalXP}</Text>
                  <Text style={s.weekLabel}>XP EARNED</Text>
                </View>
              </View>
            </View>
          )}

          {rosterShoes.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>NO ROSTER SET</Text>
              <Text style={s.emptySub}>
                Go to Arsenal // ROSTER tab to pick 3 shoes for this week's game. Roster locks Friday night.
              </Text>
            </View>
          ) : (
            <>
              <Text style={s.sectionLabel}>THIS WEEK'S ACTIVE ROSTER</Text>
              {rosterShoes.map((shoe, i) => (
                <CharacterCard
                  key={shoe.id}
                  shoe={shoe}
                  inRoster
                  weekXP={weekXPByShoe[shoe.id]}
                  index={i}
                />
              ))}
            </>
          )}

          {/* XP multiplier legend */}
          <View style={s.legendCard}>
            <Text style={s.legendTitle}>XP MULTIPLIERS</Text>
            {Object.entries(MQ_MULT).map(([mq, mult]) => (
              <View key={mq} style={s.legendRow}>
                <View style={[s.legendDot, { backgroundColor: MQ_COLORS[mq] }]} />
                <Text style={s.legendMQ}>{mq.toUpperCase()}</Text>
                <Text style={[s.legendMult, { color: MQ_COLORS[mq] }]}>{mult}</Text>
                <Text style={s.legendDesc}>
                  {mq === 'perfect' ? 'Right shoe, right terrain, right distance' :
                   mq === 'good'    ? 'Close match — minor sub-optimal factor' :
                   mq === 'neutral' ? 'Acceptable but not ideal' :
                   mq === 'poor'    ? 'Wrong shoe for this run type' :
                                     'Racing flat for recovery jog — that\'s abuse'}
                </Text>
              </View>
            ))}
            {isBeginnerMode && (
              <View style={s.beginnerNote}>
                <Text style={s.beginnerNoteText}>BEGINNER MODE: Poor and Abuse runs earn neutral XP instead</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* ── CHARACTERS TAB ──────────────────────────────────────────────── */}
      {tab === 'characters' && (
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {characterShoes.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>NO CHARACTERS YET</Text>
              <Text style={s.emptySub}>Add shoes to your Arsenal in the SCOUT tab to unlock character cards.</Text>
            </View>
          ) : (
            characterShoes.map((shoe, i) => (
              <CharacterCard
                key={shoe.id}
                shoe={shoe}
                inRoster={rosterIds.includes(shoe.id)}
                weekXP={weekXPByShoe[shoe.id]}
                index={i}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* ── BATTLE LOG TAB ──────────────────────────────────────────────── */}
      {tab === 'battle_log' && (
        <ScrollView contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
          {/* Week summary header */}
          <View style={s.weekSummary}>
            <Text style={s.weekSummaryTitle}>// THIS WEEK'S BATTLE LOG</Text>
            <View style={s.weekSummaryGrid}>
              <View style={s.weekCell}>
                <Text style={s.weekVal}>{weekRuns.length}</Text>
                <Text style={s.weekLabel}>BATTLES</Text>
              </View>
              <View style={s.weekCell}>
                <Text style={[s.weekVal, { color: ACCENT }]}>+{weekTotalXP}</Text>
                <Text style={s.weekLabel}>XP EARNED</Text>
              </View>
              <View style={s.weekCell}>
                <Text style={s.weekVal}>
                  {weekRuns.filter(r => r.match_quality === 'perfect').length}
                </Text>
                <Text style={s.weekLabel}>PERFECT</Text>
              </View>
            </View>
          </View>

          {weekRuns.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>NO RUNS THIS WEEK</Text>
              <Text style={s.emptySub}>Log a run or seed test data in Integrations to see the battle log.</Text>
            </View>
          ) : (
            weekRuns
              .slice()
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((run, i) => (
                <BattleRow
                  key={run.id}
                  run={run}
                  shoe={SHOES.find(s => s.id === run.shoeId)}
                  index={i}
                />
              ))
          )}

          {/* All-time stats */}
          {runs.length > 0 && (
            <View style={[s.weekSummary, { marginTop: 24 }]}>
              <Text style={s.weekSummaryTitle}>// ALL-TIME</Text>
              <View style={s.weekSummaryGrid}>
                <View style={s.weekCell}>
                  <Text style={s.weekVal}>{runs.length}</Text>
                  <Text style={s.weekLabel}>TOTAL RUNS</Text>
                </View>
                <View style={s.weekCell}>
                  <Text style={s.weekVal}>{runs.reduce((s, r) => s + (r.xp_earned ?? 0), 0).toLocaleString()}</Text>
                  <Text style={s.weekLabel}>TOTAL XP</Text>
                </View>
                <View style={s.weekCell}>
                  <Text style={s.weekVal}>
                    {runs.filter(r => r.match_quality === 'perfect').length}
                  </Text>
                  <Text style={s.weekLabel}>PERFECTS</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },

  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: INK },
  headerLeft: {},
  eyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 32, fontWeight: '900', color: INK, letterSpacing: -1 },

  levelBox: { alignItems: 'flex-end', gap: 3 },
  levelNum: { fontFamily: MONO, fontSize: 10, color: ACCENT, fontWeight: '700', letterSpacing: 1 },
  levelName: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: INK, letterSpacing: 1.5 },
  xpBarTrack: { width: 80, height: 4, backgroundColor: 'rgba(10,10,10,0.1)', borderRadius: 2, overflow: 'hidden' },
  xpBarFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 2 },
  totalXP: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.35)' },

  beginnerBanner: { backgroundColor: LIME, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: INK },
  beginnerText: { fontFamily: MONO, fontSize: 9, color: INK, letterSpacing: 0.3, lineHeight: 14 },

  tabBar: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: INK },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(10,10,10,0.15)' },
  tabBtnActive: { backgroundColor: INK },
  tabText: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 0.8 },
  tabTextActive: { color: PAPER, fontWeight: '700' },

  scrollContent: { paddingVertical: 20, paddingBottom: 80 },

  sectionLabel: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginHorizontal: 16, marginBottom: 12 },

  weekSummary: { marginHorizontal: 16, marginBottom: 20, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 16 },
  weekSummaryTitle: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 12 },
  weekSummaryGrid: { flexDirection: 'row' },
  weekCell: { flex: 1, alignItems: 'center' },
  weekVal: { fontSize: 22, fontWeight: '900', color: INK, letterSpacing: -0.5 },
  weekLabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 1.5, marginTop: 2 },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: INK, letterSpacing: -0.5, marginBottom: 8 },
  emptySub: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.4)', textAlign: 'center', lineHeight: 17 },

  legendCard: { marginHorizontal: 16, marginTop: 8, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 16 },
  legendTitle: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 14 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendMQ: { fontFamily: MONO, fontSize: 9, fontWeight: '700', color: INK, width: 55, letterSpacing: 0.5 },
  legendMult: { fontFamily: MONO, fontSize: 10, fontWeight: '700', width: 40 },
  legendDesc: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.45)', flex: 1, lineHeight: 14 },
  beginnerNote: { marginTop: 10, backgroundColor: 'rgba(212,255,0,0.2)', padding: 10, borderRadius: 2 },
  beginnerNoteText: { fontFamily: MONO, fontSize: 9, color: INK, lineHeight: 14 },
});
