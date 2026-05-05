/**
 * Local Leaderboards — anti-competition edition.
 * Never shows pace, mileage, or race times. Only shoe-choice aggregates.
 * City → country → global fallback based on simulated data volume.
 *
 * Data is seeded deterministically from the shoe catalogue — no backend required.
 * When a real backend exists, replace `buildLeaderboard()` with an API call.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, Modal, StyleSheet, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SHOES } from '../app/data/shoes';
import { deriveShoeStats, TIER_COLORS } from '../app/utils/gameEngine';

const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME   = '#D4FF00';
const MONO   = 'SpaceMono';

// Anti-competition rules — always displayed
const RULES = [
  'No pace. No times. No mileage.',
  'Only shoe choices are shown.',
  'No individual rankings. Ever.',
  'All data is aggregated and anonymous.',
];

type Scope = 'city' | 'country' | 'global';

interface LeaderboardEntry {
  rank: number;
  brand: string;
  model: string;
  shoeId: string;
  pct: number;          // 0–100 % of runners
  runnerCount: number;  // simulated
  tier: string;
  tierColor: string;
  trend: 'up' | 'down' | 'stable';
}

interface CategoryStat {
  label: string;
  pct: number;
  color: string;
}

interface LeaderboardData {
  scope: Scope;
  location: string;
  runnerCount: number;
  entries: LeaderboardEntry[];
  categories: CategoryStat[];
  updatedAt: string;
}

// Seeded pseudo-random (deterministic from shoeId so it doesn't change on re-render)
function seedRandom(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return ((h >>> 0) / 0xffffffff);
}

function buildLeaderboard(scope: Scope): LeaderboardData {
  const SCOPE_CONFIG: Record<Scope, { location: string; baseRunners: number }> = {
    city:    { location: 'Your City',    baseRunners: 312  },
    country: { location: 'Your Country', baseRunners: 8740 },
    global:  { location: 'Global',       baseRunners: 94200 },
  };

  const cfg = SCOPE_CONFIG[scope];

  // Score every shoe: overall stat + seeded randomness per scope
  const scored = SHOES.map(shoe => {
    const stats = deriveShoeStats(shoe);
    const base = stats.overall / 10;
    const noise = seedRandom(`${shoe.id}_${scope}`) * 0.3;
    return { shoe, stats, score: base + noise };
  }).sort((a, b) => b.score - a.score);

  // Top 8 shoes; distribute % so they sum to 100
  const top8 = scored.slice(0, 8);
  const rawPcts = top8.map((_, i) => Math.max(3, 28 - i * 3 + seedRandom(`pct_${i}_${scope}`) * 4));
  const total = rawPcts.reduce((s, v) => s + v, 0);
  const normed = rawPcts.map(p => Math.round((p / total) * 100));

  const trends: Array<'up' | 'down' | 'stable'> = ['up', 'up', 'stable', 'stable', 'up', 'down', 'down', 'stable'];

  const entries: LeaderboardEntry[] = top8.map(({ shoe, stats }, i) => ({
    rank: i + 1,
    brand: shoe.brand,
    model: shoe.model,
    shoeId: shoe.id,
    pct: normed[i],
    runnerCount: Math.round(cfg.baseRunners * normed[i] / 100),
    tier: stats.tier,
    tierColor: TIER_COLORS[stats.tier],
    trend: trends[i],
  }));

  // Category breakdown — road/trail, neutral/stability
  const categories: CategoryStat[] = [
    { label: 'ROAD',           pct: 68, color: '#2563EB' },
    { label: 'TRAIL',          pct: 22, color: '#16A34A' },
    { label: 'TREADMILL',      pct: 10, color: '#6B7280' },
    { label: 'NEUTRAL',        pct: 58, color: '#7C3AED' },
    { label: 'STABILITY',      pct: 32, color: '#D97706' },
    { label: 'MOTION CONTROL', pct: 10, color: '#FF3D00' },
  ];

  return {
    scope,
    location: cfg.location,
    runnerCount: cfg.baseRunners,
    entries,
    categories,
    updatedAt: 'Updated weekly',
  };
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function LeaderboardModal({ visible, onClose }: Props) {
  const [scope, setScope] = useState<Scope>('city');

  const data = useMemo(() => buildLeaderboard(scope), [scope]);

  const trendIcon = (t: 'up' | 'down' | 'stable') =>
    t === 'up' ? 'RISE' : t === 'down' ? 'FALL' : 'HOLD';
  const trendColor = (t: 'up' | 'down' | 'stable') =>
    t === 'up' ? '#16A34A' : t === 'down' ? ACCENT : 'rgba(10,10,10,0.3)';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.eyebrow}>// STRIDE PROTOCOL</Text>
            <Text style={s.title}>LEADERBOARDS.</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={22} color={INK} />
          </TouchableOpacity>
        </View>

        {/* Anti-competition card */}
        <View style={s.rulesCard}>
          <Text style={s.rulesTitle}>THE RULES</Text>
          {RULES.map((r, i) => (
            <View key={i} style={s.ruleRow}>
              <Text style={s.ruleDot}>◆</Text>
              <Text style={s.ruleText}>{r}</Text>
            </View>
          ))}
        </View>

        {/* Scope picker */}
        <View style={s.scopeBar}>
          {(['city', 'country', 'global'] as Scope[]).map(sc => (
            <TouchableOpacity
              key={sc}
              onPress={() => setScope(sc)}
              style={[s.scopeBtn, scope === sc && s.scopeBtnActive]}
            >
              <Text style={[s.scopeText, scope === sc && s.scopeTextActive]}>
                {sc.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={s.scroll} contentContainerStyle={s.content}>
          {/* Location + runner count */}
          <View style={s.metaRow}>
            <View style={s.locationChip}>
              <Ionicons name="location-outline" size={12} color="rgba(10,10,10,0.4)" />
              <Text style={s.locationText}>{data.location}</Text>
            </View>
            <Text style={s.runnerCount}>{data.runnerCount.toLocaleString()} runners · {data.updatedAt}</Text>
          </View>

          {/* Podium (top 3) */}
          <Text style={s.sectionLabel}>TOP SHOES BY CHOICE</Text>
          <View style={s.podium}>
            {/* 2nd */}
            {data.entries[1] && (
              <View style={[s.podiumCol, { marginTop: 24 }]}>
                <View style={[s.podiumBox, { height: 60, backgroundColor: '#C0C0C0' }]}>
                  <Text style={s.podiumRank}>2</Text>
                </View>
                <Text style={s.podiumModel} numberOfLines={2}>{data.entries[1].model}</Text>
                <Text style={s.podiumPct}>{data.entries[1].pct}%</Text>
              </View>
            )}
            {/* 1st */}
            {data.entries[0] && (
              <View style={s.podiumCol}>
                <View style={[s.podiumBox, { height: 80, backgroundColor: '#D97706' }]}>
                  <Text style={s.podiumRank}>1</Text>
                  <Text style={s.podiumCrown}>#1</Text>
                </View>
                <Text style={[s.podiumModel, { fontWeight: '900' }]} numberOfLines={2}>{data.entries[0].model}</Text>
                <Text style={[s.podiumPct, { color: ACCENT }]}>{data.entries[0].pct}%</Text>
              </View>
            )}
            {/* 3rd */}
            {data.entries[2] && (
              <View style={[s.podiumCol, { marginTop: 36 }]}>
                <View style={[s.podiumBox, { height: 48, backgroundColor: '#CD7F32' }]}>
                  <Text style={s.podiumRank}>3</Text>
                </View>
                <Text style={s.podiumModel} numberOfLines={2}>{data.entries[2].model}</Text>
                <Text style={s.podiumPct}>{data.entries[2].pct}%</Text>
              </View>
            )}
          </View>

          {/* Full list (4–8) */}
          <View style={s.listCard}>
            {data.entries.slice(3).map(entry => (
              <View key={entry.shoeId} style={s.listRow}>
                <Text style={s.listRank}>{entry.rank}</Text>
                <View style={s.listLeft}>
                  <Text style={s.listBrand}>{entry.brand}</Text>
                  <Text style={s.listModel}>{entry.model}</Text>
                </View>
                <View style={s.listRight}>
                  <Text style={[s.listTrend, { color: trendColor(entry.trend) }]}>
                    {trendIcon(entry.trend)}
                  </Text>
                  <View style={s.listBarWrap}>
                    <View style={[s.listBar, { width: `${entry.pct * 3}%` as any, backgroundColor: entry.tierColor }]} />
                  </View>
                  <Text style={s.listPct}>{entry.pct}%</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Category breakdown */}
          <Text style={[s.sectionLabel, { marginTop: 20 }]}>SHOE TYPE BREAKDOWN</Text>
          <View style={s.catGrid}>
            {data.categories.map(cat => (
              <View key={cat.label} style={s.catCell}>
                <Text style={[s.catPct, { color: cat.color }]}>{cat.pct}%</Text>
                <View style={s.catBarTrack}>
                  <View style={[s.catBarFill, { height: `${cat.pct}%` as any, backgroundColor: cat.color }]} />
                </View>
                <Text style={s.catLabel}>{cat.label}</Text>
              </View>
            ))}
          </View>

          {/* Disclaimer */}
          <View style={s.disclaimer}>
            <Ionicons name="shield-checkmark-outline" size={14} color="rgba(10,10,10,0.3)" />
            <Text style={s.disclaimerText}>
              Aggregated shoe choice data only. No personal information, pace, race times, or individual mileage is ever shown. Location scope is approximate.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 2, borderBottomColor: INK },
  eyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '900', color: INK, letterSpacing: -1 },
  closeBtn: { padding: 4 },

  rulesCard: { backgroundColor: INK, marginHorizontal: 20, marginTop: 16, marginBottom: 4, padding: 14, borderRadius: 2 },
  rulesTitle: { fontFamily: MONO, fontSize: 8, color: LIME, letterSpacing: 2, marginBottom: 8 },
  ruleRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 4 },
  ruleDot: { fontFamily: MONO, fontSize: 7, color: ACCENT, marginTop: 2 },
  ruleText: { fontFamily: MONO, fontSize: 10, color: PAPER, flex: 1, lineHeight: 16 },

  scopeBar: { flexDirection: 'row', marginHorizontal: 20, marginVertical: 12, borderWidth: 2, borderColor: INK, borderRadius: 2, overflow: 'hidden' },
  scopeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  scopeBtnActive: { backgroundColor: INK },
  scopeText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.4)', letterSpacing: 1 },
  scopeTextActive: { color: PAPER, fontWeight: '700' },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 60 },

  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  locationChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.5)', letterSpacing: 0.5 },
  runnerCount: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.35)' },

  sectionLabel: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 14 },

  // Podium
  podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 8, marginBottom: 20 },
  podiumCol: { flex: 1, alignItems: 'center', gap: 6 },
  podiumBox: { width: '100%', borderWidth: 2, borderColor: INK, borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  podiumRank: { fontFamily: MONO, fontSize: 18, fontWeight: '900', color: PAPER },
  podiumCrown: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: LIME, position: 'absolute', top: -16 },
  podiumModel: { fontFamily: MONO, fontSize: 9, color: INK, textAlign: 'center', letterSpacing: 0.5 },
  podiumPct: { fontFamily: MONO, fontSize: 13, fontWeight: '700', color: INK },

  // Full list
  listCard: { borderWidth: 2, borderColor: INK, borderRadius: 2, marginBottom: 8, overflow: 'hidden' },
  listRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(10,10,10,0.07)', gap: 10 },
  listRank: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: 'rgba(10,10,10,0.3)', width: 20 },
  listLeft: { flex: 1 },
  listBrand: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 1.5 },
  listModel: { fontSize: 13, fontWeight: '800', color: INK },
  listRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listTrend: { fontFamily: MONO, fontSize: 8, fontWeight: '700', width: 30, textAlign: 'center', letterSpacing: 0.5 },
  listBarWrap: { width: 60, height: 6, backgroundColor: 'rgba(10,10,10,0.08)', borderRadius: 1, overflow: 'hidden' },
  listBar: { height: '100%', borderRadius: 1 },
  listPct: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: INK, width: 30, textAlign: 'right' },

  // Category breakdown
  catGrid: { flexDirection: 'row', gap: 8, height: 120, alignItems: 'flex-end', marginBottom: 12 },
  catCell: { flex: 1, alignItems: 'center', gap: 4 },
  catPct: { fontFamily: MONO, fontSize: 9, fontWeight: '700' },
  catBarTrack: { width: '100%', height: 60, backgroundColor: 'rgba(10,10,10,0.06)', borderRadius: 2, justifyContent: 'flex-end', overflow: 'hidden' },
  catBarFill: { width: '100%', borderRadius: 2 },
  catLabel: { fontFamily: MONO, fontSize: 7, color: 'rgba(10,10,10,0.4)', letterSpacing: 0.5, textAlign: 'center' },

  disclaimer: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 20, padding: 12, backgroundColor: 'rgba(10,10,10,0.04)', borderRadius: 2 },
  disclaimerText: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', flex: 1, lineHeight: 15 },
});
