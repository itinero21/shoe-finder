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
import { LeaderboardModal } from '../../components/LeaderboardModal';
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

function getISOWeek(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function daysUntilSunday(): number {
  const day = new Date().getDay(); // 0=Sun
  return day === 0 ? 0 : 7 - day;
}

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

type Tab = 'guide' | 'roster' | 'characters' | 'battle_log';

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
  const [tab, setTab] = useState<Tab>('guide');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

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
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowLeaderboard(true); }}
            style={s.leaderboardBtn}
          >
            <Ionicons name="trophy-outline" size={13} color={LIME} />
            <Text style={s.leaderboardBtnTxt}>LEADERBOARD</Text>
          </TouchableOpacity>
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
      </View>

      {/* Beginner mode banner */}
      {isBeginnerMode && (
        <View style={s.beginnerBanner}>
          <Text style={s.beginnerText}>BEGINNER MODE — No penalties // Double XP cap on achievements // Protected leaderboard bracket</Text>
        </View>
      )}

      <LeaderboardModal visible={showLeaderboard} onClose={() => setShowLeaderboard(false)} />

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <View style={s.tabBar}>
        {([
          { key: 'guide',      label: 'HOW TO PLAY' },
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

      {/* ── GUIDE TAB ───────────────────────────────────────────────────── */}
      {tab === 'guide' && (
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Intro */}
          <View style={g.introCard}>
            <Text style={g.introEyebrow}>// SHOE WARS</Text>
            <Text style={g.introTitle}>Your shoes are{'\n'}characters.</Text>
            <Text style={g.introBody}>
              Every shoe in your Arsenal has stats derived from its real biomechanics. Log runs. Earn XP. Level up. The better you match shoe to run, the more XP you earn.
            </Text>
          </View>

          {/* Step 1 — Build Arsenal */}
          <View style={g.stepCard}>
            <View style={g.stepHeader}>
              <View style={g.stepNum}><Text style={g.stepNumText}>01</Text></View>
              <Text style={g.stepTitle}>BUILD YOUR ARSENAL</Text>
            </View>
            <Text style={g.stepBody}>
              Go to the SCOUT tab, answer the diagnostic, and save shoes to your Arsenal. Each saved shoe becomes a playable character with four stats.
            </Text>
            <View style={g.callout}>
              <Text style={g.calloutText}>SCOUT tab — add shoes — they appear in CHARACTERS</Text>
            </View>
          </View>

          {/* Step 2 — Stats */}
          <View style={g.stepCard}>
            <View style={g.stepHeader}>
              <View style={g.stepNum}><Text style={g.stepNumText}>02</Text></View>
              <Text style={g.stepTitle}>UNDERSTAND THE STATS</Text>
            </View>
            <Text style={g.stepBody}>Stats are calculated from the shoe's real specs — not made up. A carbon racer will always have high SPEED. A max-cushion shoe will always have high COMFORT.</Text>
            <View style={g.statTable}>
              {[
                { stat: 'SPEED',     color: ACCENT,    desc: 'Energy return + low weight + carbon plate. High on racers and speed trainers.' },
                { stat: 'ENDURANCE', color: '#2563EB', desc: 'Cushioning level + stack height. High on max-cushion and long-run shoes.' },
                { stat: 'GRIP',      color: '#16A34A', desc: 'Traction + trail use cases. High on trail shoes and stability platforms.' },
                { stat: 'COMFORT',   color: '#7C3AED', desc: 'Upper softness + rocker + wide base. High on daily trainers and walking shoes.' },
              ].map(({ stat, color, desc }) => (
                <View key={stat} style={g.statRow}>
                  <View style={[g.statTag, { backgroundColor: color }]}>
                    <Text style={g.statTagText}>{stat}</Text>
                  </View>
                  <Text style={g.statDesc}>{desc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Step 3 — Tiers */}
          <View style={g.stepCard}>
            <View style={g.stepHeader}>
              <View style={g.stepNum}><Text style={g.stepNumText}>03</Text></View>
              <Text style={g.stepTitle}>TIERS EXPLAINED</Text>
            </View>
            <Text style={g.stepBody}>Every shoe is ranked by its overall score (average of all 4 stats). Higher tier = rarer and more powerful character.</Text>
            <View style={g.tierTable}>
              {[
                { tier: 'COMMON',    color: '#6B7280', range: '0–4',  desc: 'Entry-level trainers. Forgiving and reliable.' },
                { tier: 'UNCOMMON',  color: '#16A34A', range: '5',    desc: 'Solid daily shoes. Good all-round stats.' },
                { tier: 'RARE',      color: '#2563EB', range: '6–7',  desc: 'Performance trainers. Specialist stats.' },
                { tier: 'EPIC',      color: '#7C3AED', range: '8',    desc: 'Super trainers and max-cushion kings.' },
                { tier: 'LEGENDARY', color: ACCENT,    range: '9–10', desc: 'Carbon racers. High SPEED, low ENDURANCE.' },
              ].map(({ tier, color, range, desc }) => (
                <View key={tier} style={g.tierRow}>
                  <View style={[g.tierBadge, { backgroundColor: color }]}>
                    <Text style={g.tierBadgeText}>{tier}</Text>
                  </View>
                  <View style={g.tierRight}>
                    <Text style={g.tierRange}>OVERALL {range}/10</Text>
                    <Text style={g.tierDesc}>{desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Step 4 — Roster */}
          <View style={g.stepCard}>
            <View style={g.stepHeader}>
              <View style={g.stepNum}><Text style={g.stepNumText}>04</Text></View>
              <Text style={g.stepTitle}>SET YOUR WEEKLY ROSTER</Text>
            </View>
            <Text style={g.stepBody}>
              Each week, pick up to 3 shoes as your active roster from the ARSENAL tab. Only runs logged with a roster shoe earn full XP. Roster resets every Monday.
            </Text>
            <View style={g.ruleList}>
              <View style={g.ruleItem}><Text style={g.ruleDot}>—</Text><Text style={g.ruleText}>Max 3 shoes in the active roster at once</Text></View>
              <View style={g.ruleItem}><Text style={g.ruleDot}>—</Text><Text style={g.ruleText}>Roster refreshes every Monday at midnight</Text></View>
              <View style={g.ruleItem}><Text style={g.ruleDot}>—</Text><Text style={g.ruleText}>Non-roster shoes still earn XP, just less</Text></View>
            </View>
          </View>

          {/* Step 5 — Match Quality + XP */}
          <View style={g.stepCard}>
            <View style={g.stepHeader}>
              <View style={g.stepNum}><Text style={g.stepNumText}>05</Text></View>
              <Text style={g.stepTitle}>MATCH QUALITY + XP</Text>
            </View>
            <Text style={g.stepBody}>
              When you log a run, the engine checks how well your shoe matched the terrain, distance, and purpose. Better match = higher XP multiplier. Base XP is 2 points per mile.
            </Text>
            <View style={g.mqTable}>
              {[
                { mq: 'PERFECT',  color: '#16A34A', mult: '×2.0', example: 'Carbon racer on a race day road run' },
                { mq: 'GOOD',     color: '#2563EB', mult: '×1.5', example: 'Daily trainer on an easy trail' },
                { mq: 'NEUTRAL',  color: '#6B7280', mult: '×1.0', example: 'Stability shoe on a tempo run' },
                { mq: 'POOR',     color: '#D97706', mult: '×0.5', example: 'Trail shoe used on a track session' },
                { mq: 'ABUSE',    color: ACCENT,    mult: '×0.25', example: 'Racing flat used for a recovery jog' },
              ].map(({ mq, color, mult, example }) => (
                <View key={mq} style={g.mqRow}>
                  <View style={[g.mqBadge, { borderColor: color }]}>
                    <Text style={[g.mqBadgeText, { color }]}>{mq}</Text>
                  </View>
                  <View style={g.mqRight}>
                    <Text style={[g.mqMult, { color }]}>{mult} XP</Text>
                    <Text style={g.mqExample}>{example}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={g.callout}>
              <Text style={g.calloutText}>Log runs via ARSENAL tab — select shoe, terrain, and purpose to get the right multiplier</Text>
            </View>
          </View>

          {/* Step 6 — Levels */}
          <View style={g.stepCard}>
            <View style={g.stepHeader}>
              <View style={g.stepNum}><Text style={g.stepNumText}>06</Text></View>
              <Text style={g.stepTitle}>LEVELS + UNLOCKS</Text>
            </View>
            <Text style={g.stepBody}>
              Total XP determines your runner level. Each level unlocks one concrete capability — not just a badge.
            </Text>
            <View style={g.levelTable}>
              {([
                { lv: 1,  name: 'RECRUIT',     xp: '0',      unlock: 'All basics available.' },
                { lv: 2,  name: 'ROOKIE',      xp: '250',    unlock: 'STREAK FREEZE — pause any streak once per quarter for travel or illness.' },
                { lv: 3,  name: 'REGULAR',     xp: '750',    unlock: 'CUSTOM ROUTE NAMES — label your routes instead of GPS hashes.' },
                { lv: 4,  name: 'GRINDER',     xp: '1,500',  unlock: 'COMPARE MODE — side-by-side stats for any 2 shoes in your Arsenal.' },
                { lv: 5,  name: 'VETERAN',     xp: '3,000',  unlock: 'TERRITORY — claim paths on the city map. Beginner mode lifted.' },
                { lv: 6,  name: 'TACTICIAN',   xp: '5,500',  unlock: 'RIVAL MODE — auto-pair anonymous rivals on routes you both run.' },
                { lv: 7,  name: 'STRATEGIST',  xp: '9,000',  unlock: 'TERRITORY STEAL — overtake another runner\'s WARM route.' },
                { lv: 8,  name: 'MASTER',      xp: '14,000', unlock: 'CITY HOSTING — your territory shows prominently in a hosted city.' },
                { lv: 9,  name: 'GRANDMASTER', xp: '21,000', unlock: 'CUSTOM SHARE CARD TEMPLATES.' },
                { lv: 10, name: 'LEGEND',      xp: '30,000', unlock: 'GLOSSARY EDITS + gold profile flair. Permanent record.' },
              ] as { lv: number; name: string; xp: string; unlock: string }[]).map(({ lv, name, xp, unlock }) => (
                <View key={lv} style={g.levelRow}>
                  <View style={g.levelLeft}>
                    <Text style={g.levelNum}>LV.{lv}</Text>
                    <Text style={g.levelName}>{name}</Text>
                  </View>
                  <View style={g.levelRight}>
                    <Text style={g.levelXP}>{xp} XP</Text>
                    <Text style={g.levelUnlock}>{unlock}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Footer CTA */}
          <View style={g.ctaCard}>
            <Text style={g.ctaTitle}>READY TO PLAY</Text>
            <Text style={g.ctaBody}>Go to SCOUT, save shoes to your Arsenal, then come back here and set your roster.</Text>
            <TouchableOpacity onPress={() => setTab('roster')} style={g.ctaBtn} activeOpacity={0.85}>
              <Text style={g.ctaBtnText}>GO TO ROSTER</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      )}

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
          {/* Weekly season banner */}
          <View style={s.seasonBanner}>
            <Text style={s.seasonLabel}>
              {`WEEK ${getISOWeek()} SEASON  //  ENDS SUNDAY 11:59PM`}
            </Text>
            <Text style={s.seasonSub}>
              {`${daysUntilSunday()} DAYS REMAINING`}
            </Text>
          </View>
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

  leaderboardBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: INK, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 2, borderWidth: 1, borderColor: LIME },
  leaderboardBtnTxt: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: LIME, letterSpacing: 1.5 },
  beginnerBanner: { backgroundColor: LIME, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: INK },
  beginnerText: { fontFamily: MONO, fontSize: 9, color: INK, letterSpacing: 0.3, lineHeight: 14 },

  tabBar: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: INK },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(10,10,10,0.15)' },
  tabBtnActive: { backgroundColor: INK },
  tabText: { fontFamily: MONO, fontSize: 7.5, color: 'rgba(10,10,10,0.4)', letterSpacing: 0.5 },
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

  seasonBanner: { marginHorizontal: 16, marginTop: 16, marginBottom: 4, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 14, backgroundColor: INK },
  seasonLabel: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: LIME, letterSpacing: 1.5, marginBottom: 4 },
  seasonSub: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.5)', letterSpacing: 1 },
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

const g = StyleSheet.create({
  introCard: { marginHorizontal: 16, marginBottom: 20, backgroundColor: INK, padding: 20, borderRadius: 2 },
  introEyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 8 },
  introTitle: { fontSize: 28, fontWeight: '900', color: PAPER, letterSpacing: -1, lineHeight: 30, marginBottom: 12 },
  introBody: { fontFamily: MONO, fontSize: 11, color: 'rgba(244,241,234,0.65)', lineHeight: 19 },

  stepCard: { marginHorizontal: 16, marginBottom: 16, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 18 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  stepNum: { width: 32, height: 32, backgroundColor: INK, borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: LIME },
  stepTitle: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: INK, letterSpacing: 1, flex: 1 },
  stepBody: { fontSize: 13, color: 'rgba(10,10,10,0.7)', lineHeight: 21, marginBottom: 14 },

  callout: { backgroundColor: 'rgba(10,10,10,0.06)', padding: 12, borderRadius: 2, borderLeftWidth: 3, borderLeftColor: ACCENT },
  calloutText: { fontFamily: MONO, fontSize: 9, color: INK, lineHeight: 15, letterSpacing: 0.3 },

  statTable: { gap: 10 },
  statRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  statTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2, minWidth: 80, alignItems: 'center' },
  statTagText: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: PAPER, letterSpacing: 1.5 },
  statDesc: { flex: 1, fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.6)', lineHeight: 15 },

  tierTable: { gap: 10 },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2, minWidth: 80, alignItems: 'center' },
  tierBadgeText: { fontFamily: MONO, fontSize: 7, fontWeight: '700', color: PAPER, letterSpacing: 1.5 },
  tierRight: { flex: 1 },
  tierRange: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 1, marginBottom: 2 },
  tierDesc: { fontFamily: MONO, fontSize: 9, color: INK, lineHeight: 14 },

  ruleList: { gap: 8 },
  ruleItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  ruleDot: { fontFamily: MONO, fontSize: 11, color: 'rgba(10,10,10,0.35)', marginTop: 1 },
  ruleText: { flex: 1, fontFamily: MONO, fontSize: 10, color: INK, lineHeight: 16 },

  mqTable: { gap: 10, marginBottom: 14 },
  mqRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mqBadge: { borderWidth: 1.5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2, minWidth: 68, alignItems: 'center' },
  mqBadgeText: { fontFamily: MONO, fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  mqRight: { flex: 1 },
  mqMult: { fontFamily: MONO, fontSize: 11, fontWeight: '700', marginBottom: 2 },
  mqExample: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.5)', lineHeight: 14 },

  levelTable: { gap: 0, borderWidth: 2, borderColor: INK, borderRadius: 2, overflow: 'hidden' },
  levelRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(10,10,10,0.08)' },
  levelLeft: { width: 68, gap: 1 },
  levelNum: { fontFamily: MONO, fontSize: 9, color: ACCENT, fontWeight: '700', letterSpacing: 1 },
  levelName: { fontFamily: MONO, fontSize: 8, color: INK, fontWeight: '700', letterSpacing: 1 },
  levelRight: { flex: 1, gap: 2 },
  levelXP: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 0.5 },
  levelUnlock: { fontFamily: MONO, fontSize: 9, color: INK, lineHeight: 14 },
  ctaCard: { marginHorizontal: 16, marginBottom: 20, backgroundColor: ACCENT, padding: 20, borderRadius: 2 },
  ctaTitle: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: PAPER, letterSpacing: 2, marginBottom: 8 },
  ctaBody: { fontFamily: MONO, fontSize: 10, color: 'rgba(244,241,234,0.75)', lineHeight: 17, marginBottom: 16 },
  ctaBtn: { backgroundColor: PAPER, paddingVertical: 14, alignItems: 'center', borderRadius: 2 },
  ctaBtnText: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: ACCENT, letterSpacing: 2 },
});
