/**
 * Group Gait Check — "find runners like you."
 * Clusters by arch + pronation + weight + use_case + experience.
 * Progressively drops dimensions until ≥50 simulated matches.
 * Falls back to Editor's Pick when data is too sparse.
 *
 * The cluster size is simulated deterministically from quiz answers.
 * When a real backend exists, replace `buildCluster()` with an API call.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal, StyleSheet, ScrollView,
  TouchableOpacity, Animated as RNAnimated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { SHOES, Shoe } from '../app/data/shoes';
import { QuizAnswers, scoreShoes } from '../app/utils/scoring';
import { deriveShoeStats, TIER_COLORS } from '../app/utils/gameEngine';

const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME   = '#D4FF00';
const MONO   = 'SpaceMono';

const MIN_CLUSTER = 50; // drop dimensions below this

// ── Cluster logic ─────────────────────────────────────────────────────────────

interface ClusterResult {
  matchCount: number;
  dimensions: string[];   // which dimensions were matched
  dropped: string[];      // dimensions dropped to reach threshold
  topShoes: Shoe[];       // shoes popular in this cluster
  isEditorsPick: boolean;
  clusterLabel: string;
}

function seedInt(seed: string, max: number): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(h, 33) ^ seed.charCodeAt(i)) | 0;
  return Math.abs(h) % max;
}

function buildCluster(answers: QuizAnswers | null): ClusterResult {
  if (!answers) {
    // No quiz taken — pure Editor's Pick
    const ranked = [...SHOES]
      .sort((a, b) => deriveShoeStats(b).overall - deriveShoeStats(a).overall)
      .slice(0, 3);
    return {
      matchCount: 0,
      dimensions: [],
      dropped: [],
      topShoes: ranked,
      isEditorsPick: true,
      clusterLabel: 'All runners (no profile)',
    };
  }

  // Define all possible dimensions
  type Dim = { key: string; label: string; value: string };
  const allDims: Dim[] = [
    { key: 'arch',       label: 'Arch type',        value: answers.arch_type ?? '' },
    { key: 'pronation',  label: 'Pronation',         value: answers.pronation ?? '' },
    { key: 'weight',     label: 'Body weight range', value: answers.body_weight ?? '' },
    { key: 'use_case',   label: 'Use case',          value: (answers.use_case as string) ?? '' },
    { key: 'experience', label: 'Experience',        value: answers.running_experience ?? '' },
  ].filter(d => d.value !== '');

  // Simulate cluster size by hashing the active dimensions' values
  // Start with all dims, progressively drop until ≥ MIN_CLUSTER
  let activeDims = [...allDims];
  const dropped: string[] = [];

  let matchCount = 0;
  while (activeDims.length > 0) {
    const hashInput = activeDims.map(d => `${d.key}:${d.value}`).join('|');
    // Simulate: more dimensions = fewer matches
    const base = 8 + seedInt(hashInput, 40);
    matchCount = base * Math.pow(2, 4 - Math.min(activeDims.length, 4));
    if (matchCount >= MIN_CLUSTER || activeDims.length === 1) break;
    const droppedDim = activeDims.pop()!;
    dropped.push(droppedDim.label);
  }

  const isEditorsPick = matchCount < MIN_CLUSTER;

  // Determine top shoes: score shoes against answers then pick top 3
  const scored = scoreShoes(answers, SHOES);
  const topShoes = scored.slice(0, 3).map(r => r.shoe);

  // Cluster label from active dimensions
  const parts: string[] = [];
  const archMap: Record<string, string> = {
    high_arch: 'high-arch', neutral_arch: 'neutral', low_arch: 'low-arch',
    flat: 'flat-footed',
  };
  const pronMap: Record<string, string> = {
    neutral: 'neutral stride', overpronation: 'overpronator', supination: 'supinator',
    mild_overpronation: 'slight overpronator',
  };
  if (answers.arch_type && activeDims.find(d => d.key === 'arch')) parts.push(archMap[answers.arch_type] ?? answers.arch_type);
  if (answers.pronation  && activeDims.find(d => d.key === 'pronation')) parts.push(pronMap[answers.pronation] ?? answers.pronation);
  if (answers.use_case   && activeDims.find(d => d.key === 'use_case')) parts.push(`${answers.use_case} runner`);

  const clusterLabel = parts.length > 0
    ? parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' · ')
    : 'Runners like you';

  return {
    matchCount: Math.round(matchCount),
    dimensions: activeDims.map(d => d.label),
    dropped,
    topShoes,
    isEditorsPick,
    clusterLabel,
  };
}

// ── Shoe cluster card ─────────────────────────────────────────────────────────
const ClusterShoeCard: React.FC<{ shoe: Shoe; rank: number; isEditorsPick: boolean }> = ({
  shoe, rank, isEditorsPick,
}) => {
  const stats = deriveShoeStats(shoe);
  const tierColor = TIER_COLORS[stats.tier];

  // Simulated "popularity" in cluster
  const pcts = [47, 31, 22];
  const pct = pcts[rank - 1] ?? 10;

  return (
    <View style={cs.wrap}>
      <View style={[cs.shadow, { backgroundColor: tierColor }]} />
      <View style={cs.card}>
        <View style={cs.cardTop}>
          <View style={[cs.rankBadge, rank === 1 && { backgroundColor: INK }]}>
            <Text style={[cs.rankText, rank === 1 && { color: LIME }]}>
              {isEditorsPick ? '★' : `#${rank}`}
            </Text>
          </View>
          <View style={[cs.tierTag, { backgroundColor: tierColor }]}>
            <Text style={cs.tierText}>{stats.tier.toUpperCase()}</Text>
          </View>
          <Text style={cs.overall}>{stats.overall}/10</Text>
        </View>
        <Text style={cs.brand}>{shoe.brand.toUpperCase()}</Text>
        <Text style={cs.model}>{shoe.model}</Text>
        {!isEditorsPick && (
          <View style={cs.popularityRow}>
            <View style={cs.popularityBarTrack}>
              <View style={[cs.popularityBarFill, { width: `${pct}%` as any, backgroundColor: tierColor }]} />
            </View>
            <Text style={cs.popularityPct}>{pct}% of cluster</Text>
          </View>
        )}
        {/* Key stats inline */}
        <View style={cs.statRow}>
          {[
            { l: 'SPD', v: stats.speed,     c: ACCENT     },
            { l: 'END', v: stats.endurance, c: '#2563EB'  },
            { l: 'GRP', v: stats.grip,      c: '#16A34A'  },
            { l: 'CMF', v: stats.comfort,   c: '#7C3AED'  },
          ].map(({ l, v, c }) => (
            <View key={l} style={cs.statCell}>
              <Text style={cs.statLabel}>{l}</Text>
              <Text style={[cs.statVal, { color: c }]}>{v}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const cs = StyleSheet.create({
  wrap: { position: 'relative', marginBottom: 16 },
  shadow: { position: 'absolute', top: 4, left: 4, right: -4, bottom: -4, borderRadius: 2 },
  card: { backgroundColor: PAPER, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  rankBadge: { width: 28, height: 28, borderWidth: 2, borderColor: INK, borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: INK },
  tierTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2 },
  tierText: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: PAPER, letterSpacing: 1.5 },
  overall: { marginLeft: 'auto', fontFamily: MONO, fontSize: 12, fontWeight: '700', color: INK },
  brand: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 2 },
  model: { fontSize: 17, fontWeight: '900', color: INK, letterSpacing: -0.3, marginBottom: 10 },
  popularityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  popularityBarTrack: { flex: 1, height: 6, backgroundColor: 'rgba(10,10,10,0.08)', borderRadius: 1, overflow: 'hidden' },
  popularityBarFill: { height: '100%', borderRadius: 1 },
  popularityPct: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', width: 90 },
  statRow: { flexDirection: 'row', gap: 8 },
  statCell: { flex: 1, alignItems: 'center' },
  statLabel: { fontFamily: MONO, fontSize: 7, color: 'rgba(10,10,10,0.35)', letterSpacing: 1 },
  statVal: { fontFamily: MONO, fontSize: 13, fontWeight: '900' },
});

// ── Main modal ────────────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  answers: QuizAnswers | null;
  onClose: () => void;
}

export function GaitCheckModal({ visible, answers, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ClusterResult | null>(null);
  const dotAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setResult(null);

    // Animate loading dots
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        RNAnimated.timing(dotAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    // Simulate "finding cluster" delay
    const t = setTimeout(() => {
      setResult(buildCluster(answers));
      setLoading(false);
    }, 1200);

    return () => clearTimeout(t);
  }, [visible, answers]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.eyebrow}>// STRIDE PROTOCOL</Text>
            <Text style={s.title}>GAIT CHECK.</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={22} color={INK} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={s.loadingView}>
            <RNAnimated.Text style={[s.loadingDots, { opacity: dotAnim }]}>. . .</RNAnimated.Text>
            <Text style={s.loadingText}>FINDING YOUR TRIBE...</Text>
            <Text style={s.loadingSub}>Matching arch · pronation · weight · use case</Text>
          </View>
        ) : result ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

            {/* Cluster identity card */}
            <View style={result.isEditorsPick ? s.editorCard : s.clusterCard}>
              {result.isEditorsPick ? (
                <>
                  <Text style={s.editorEyebrow}>EDITOR'S PICK</Text>
                  <Text style={s.editorTitle}>Not enough data yet.</Text>
                  <Text style={s.editorSub}>
                    {result.matchCount === 0
                      ? "Run the Scout diagnostic first to get a personalised cluster match."
                      : `Only ${result.matchCount} runners matched your full profile — showing top picks for your gait type instead.`
                    }
                  </Text>
                </>
              ) : (
                <>
                  <View style={s.clusterHeader}>
                    <Text style={s.clusterEyebrow}>YOUR CLUSTER</Text>
                    <View style={s.clusterCount}>
                      <Text style={s.clusterCountNum}>{result.matchCount.toLocaleString()}</Text>
                      <Text style={s.clusterCountLabel}>runners like you</Text>
                    </View>
                  </View>
                  <Text style={s.clusterLabel}>{result.clusterLabel}</Text>

                  {/* Active dimensions */}
                  <View style={s.dimRow}>
                    {result.dimensions.map(d => (
                      <View key={d} style={s.dimChip}>
                        <Text style={s.dimChipText}>{d}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Dropped dimensions note */}
                  {result.dropped.length > 0 && (
                    <View style={s.droppedNote}>
                      <Ionicons name="information-circle-outline" size={12} color="rgba(10,10,10,0.4)" />
                      <Text style={s.droppedText}>
                        Dropped {result.dropped.join(', ')} to reach {MIN_CLUSTER}+ runners.
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Top shoes */}
            <Text style={s.sectionLabel}>
              {result.isEditorsPick ? 'RECOMMENDED FOR YOUR GAIT TYPE' : 'MOST POPULAR IN YOUR CLUSTER'}
            </Text>
            {result.topShoes.map((shoe, i) => (
              <ClusterShoeCard
                key={shoe.id}
                shoe={shoe}
                rank={i + 1}
                isEditorsPick={result.isEditorsPick}
              />
            ))}

            {/* Privacy note */}
            <View style={s.privacyNote}>
              <Ionicons name="shield-checkmark-outline" size={14} color="rgba(10,10,10,0.3)" />
              <Text style={s.privacyText}>
                Cluster matching uses only your gait profile stored on this device. No account or location data is shared.
              </Text>
            </View>

          </ScrollView>
        ) : null}
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

  loadingView: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingDots: { fontFamily: MONO, fontSize: 18, fontWeight: '700', color: ACCENT, letterSpacing: 8 },
  loadingText: { fontFamily: MONO, fontSize: 14, fontWeight: '700', color: INK, letterSpacing: 2 },
  loadingSub: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.4)', letterSpacing: 0.5 },

  content: { padding: 20, paddingBottom: 60 },

  // Cluster card (has data)
  clusterCard: { borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 16, marginBottom: 24, backgroundColor: INK },
  clusterHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  clusterEyebrow: { fontFamily: MONO, fontSize: 9, color: LIME, letterSpacing: 2 },
  clusterCount: { alignItems: 'flex-end' },
  clusterCountNum: { fontSize: 28, fontWeight: '900', color: LIME, letterSpacing: -1 },
  clusterCountLabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(212,255,0,0.6)', letterSpacing: 1 },
  clusterLabel: { fontSize: 18, fontWeight: '900', color: PAPER, letterSpacing: -0.3, marginBottom: 12 },
  dimRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  dimChip: { paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(212,255,0,0.4)', borderRadius: 2 },
  dimChipText: { fontFamily: MONO, fontSize: 8, color: 'rgba(212,255,0,0.8)', letterSpacing: 1 },
  droppedNote: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  droppedText: { fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.4)', flex: 1, lineHeight: 14 },

  // Editor's pick card
  editorCard: { borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 16, marginBottom: 24, backgroundColor: 'rgba(10,10,10,0.04)' },
  editorEyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 6 },
  editorTitle: { fontSize: 18, fontWeight: '900', color: INK, letterSpacing: -0.3, marginBottom: 6 },
  editorSub: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.55)', lineHeight: 18 },

  sectionLabel: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 14 },

  privacyNote: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 20, padding: 12, backgroundColor: 'rgba(10,10,10,0.04)', borderRadius: 2 },
  privacyText: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', flex: 1, lineHeight: 15 },
});
