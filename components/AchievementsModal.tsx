import React, { useState, useMemo } from 'react';
import {
  View, Text, Modal, StyleSheet, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import {
  ACHIEVEMENTS, AchievementDef, AchievementProgress,
} from '../app/utils/achievementEngine';

const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME   = '#D4FF00';
const MONO   = 'SpaceMono';

const CATEGORY_LABELS: Record<string, string> = {
  mileage:   'MILEAGE',
  match:     'MATCH QUALITY',
  rotation:  'ROTATION',
  explorer:  'EXPLORER',
  quiz:      'SCOUT',
  graveyard: 'GRAVEYARD',
  streaks:   'STREAKS',
};

interface AchievementsModalProps {
  visible: boolean;
  unlockedIds: string[];
  progressData?: Record<string, AchievementProgress>;
  onClose: () => void;
}

export function AchievementsModal({
  visible, unlockedIds, progressData = {}, onClose,
}: AchievementsModalProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = [...new Set(ACHIEVEMENTS.map(a => a.category))];

  // Count unlocked per category
  const unlockedByCategory = useMemo<Record<string, { unlocked: number; total: number }>>(() => {
    const map: Record<string, { unlocked: number; total: number }> = {};
    for (const a of ACHIEVEMENTS) {
      if (a.secret && !unlockedIds.includes(a.id)) continue;
      if (!map[a.category]) map[a.category] = { unlocked: 0, total: 0 };
      map[a.category].total++;
      if (unlockedIds.includes(a.id)) map[a.category].unlocked++;
    }
    return map;
  }, [unlockedIds]);

  const displayed = ACHIEVEMENTS.filter(a => !a.secret || unlockedIds.includes(a.id));

  // Sort: unlocked first, then by progress desc (near-unlock first), then rest
  const sorted = useMemo(() => {
    const inCategory = activeCategory
      ? displayed.filter(a => a.category === activeCategory)
      : displayed;

    return [...inCategory].sort((a, b) => {
      const aUnlocked = unlockedIds.includes(a.id);
      const bUnlocked = unlockedIds.includes(b.id);
      if (aUnlocked && !bUnlocked) return -1;
      if (!aUnlocked && bUnlocked) return 1;
      if (aUnlocked && bUnlocked) return 0;
      // Both locked — sort by progress desc
      const aPct = progressData[a.id]?.pct ?? 0;
      const bPct = progressData[b.id]?.pct ?? 0;
      return bPct - aPct;
    });
  }, [activeCategory, displayed, unlockedIds, progressData]);

  const unlockedCount = ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id)).length;
  const totalVisible  = displayed.length;

  // How many are 80%+ progress but not unlocked
  const nearUnlockCount = displayed.filter(
    a => !unlockedIds.includes(a.id) && (progressData[a.id]?.pct ?? 0) >= 0.8
  ).length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.eyebrow}>// STRIDE PROTOCOL</Text>
            <Text style={s.title}>ACHIEVEMENTS.</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={22} color={INK} />
          </TouchableOpacity>
        </View>

        {/* Overall progress */}
        <View style={s.progressSection}>
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>{unlockedCount} / {totalVisible} UNLOCKED</Text>
            <Text style={s.progressPct}>{Math.round((unlockedCount / Math.max(totalVisible, 1)) * 100)}%</Text>
          </View>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${(unlockedCount / Math.max(totalVisible, 1)) * 100}%` as any }]} />
          </View>
          {nearUnlockCount > 0 && (
            <Text style={s.nearUnlockHint}>{nearUnlockCount} CLOSE TO UNLOCK</Text>
          )}
        </View>

        {/* Category filter with counts */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.categoryScroll}
          contentContainerStyle={s.categoryRow}
        >
          <TouchableOpacity
            onPress={() => setActiveCategory(null)}
            style={[s.catChip, !activeCategory && s.catChipActive]}
          >
            <Text style={[s.catChipText, !activeCategory && s.catChipTextActive]}>ALL</Text>
            <Text style={[s.catCount, !activeCategory && s.catCountActive]}>
              {unlockedCount}/{totalVisible}
            </Text>
          </TouchableOpacity>
          {categories.map(cat => {
            const counts = unlockedByCategory[cat] ?? { unlocked: 0, total: 0 };
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(activeCategory === cat ? null : cat)}
                style={[s.catChip, activeCategory === cat && s.catChipActive]}
              >
                <Text style={[s.catChipText, activeCategory === cat && s.catChipTextActive]}>
                  {CATEGORY_LABELS[cat] ?? cat.toUpperCase()}
                </Text>
                <Text style={[s.catCount, activeCategory === cat && s.catCountActive]}>
                  {counts.unlocked}/{counts.total}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView showsVerticalScrollIndicator={false} style={s.scroll} contentContainerStyle={s.scrollContent}>
          {sorted.map((a, i) => {
            const unlocked = unlockedIds.includes(a.id);
            const prog     = progressData[a.id];
            const showProg = !unlocked && prog && prog.pct > 0;

            return (
              <Animated.View key={a.id} entering={FadeInDown.delay(i * 25).springify()}>
                <View style={[s.card, unlocked && s.cardUnlocked]}>
                  <View style={[s.iconBox, unlocked && s.iconBoxUnlocked]}>
                    <Text style={s.iconText}>{unlocked ? a.icon : '--'}</Text>
                  </View>
                  <View style={s.cardBody}>
                    <View style={s.cardTop}>
                      <Text style={[s.cardTitle, !unlocked && s.cardTitleLocked]}>
                        {unlocked ? a.title.toUpperCase() : a.title.toUpperCase()}
                      </Text>
                      <View style={[s.xpBadge, !unlocked && s.xpBadgeLocked]}>
                        <Text style={[s.xpText, !unlocked && s.xpTextLocked]}>+{a.xp_reward} XP</Text>
                      </View>
                    </View>
                    <Text style={[s.cardDesc, !unlocked && s.cardDescLocked]}>
                      {a.desc}
                    </Text>

                    {/* Progress bar for locked achievements */}
                    {showProg && (
                      <View style={s.progContainer}>
                        <View style={s.progTrack}>
                          <View style={[s.progFill, { width: `${Math.round(prog!.pct * 100)}%` as any }]} />
                        </View>
                        <Text style={s.progLabel}>{prog!.label}</Text>
                      </View>
                    )}

                    <Text style={s.cardCategory}>{CATEGORY_LABELS[a.category] ?? a.category}</Text>
                  </View>
                  {unlocked && <View style={s.unlockedDot} />}
                  {!unlocked && showProg && prog!.pct >= 0.8 && (
                    <View style={s.nearTag}><Text style={s.nearTagText}>CLOSE</Text></View>
                  )}
                </View>
                <View style={s.cardDivider} />
              </Animated.View>
            );
          })}
          <View style={s.footer}>
            <Text style={s.footerText}>
              {ACHIEVEMENTS.filter(a => a.secret).length} HIDDEN ACHIEVEMENTS AWAIT.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 2, borderBottomColor: INK,
  },
  eyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '900', color: INK, letterSpacing: -1 },
  closeBtn: { padding: 4 },

  progressSection: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(10,10,10,0.1)' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.5)', letterSpacing: 1 },
  progressPct: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: INK },
  progressTrack: { height: 4, backgroundColor: 'rgba(10,10,10,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: LIME, borderRadius: 2 },
  nearUnlockHint: { fontFamily: MONO, fontSize: 8, color: ACCENT, letterSpacing: 1.5 },

  categoryScroll: { maxHeight: 52, borderBottomWidth: 1, borderBottomColor: 'rgba(10,10,10,0.1)' },
  categoryRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: 'row', alignItems: 'center' },
  catChip: { paddingHorizontal: 10, paddingVertical: 5, borderWidth: 2, borderColor: 'rgba(10,10,10,0.2)', borderRadius: 2, alignItems: 'center', gap: 2 },
  catChipActive: { borderColor: INK, backgroundColor: INK },
  catChipText: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.6)', letterSpacing: 1 },
  catChipTextActive: { color: PAPER },
  catCount: { fontFamily: MONO, fontSize: 7, color: 'rgba(10,10,10,0.35)', letterSpacing: 0.5 },
  catCountActive: { color: 'rgba(244,241,234,0.55)' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 60 },

  card: {
    flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, gap: 14,
    opacity: 0.55,
  },
  cardUnlocked: { opacity: 1 },
  iconBox: {
    width: 48, height: 48, borderRadius: 2,
    borderWidth: 2, borderColor: 'rgba(10,10,10,0.2)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(10,10,10,0.04)',
    flexShrink: 0,
  },
  iconBoxUnlocked: { borderColor: INK, backgroundColor: LIME },
  iconText: { fontSize: 11, fontFamily: MONO, fontWeight: '700', color: INK, letterSpacing: 0.5 },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: INK, letterSpacing: 0.5, flex: 1 },
  cardTitleLocked: { color: 'rgba(10,10,10,0.5)' },
  xpBadge: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: LIME, borderRadius: 2, flexShrink: 0 },
  xpBadgeLocked: { backgroundColor: 'rgba(10,10,10,0.06)' },
  xpText: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: INK, letterSpacing: 1 },
  xpTextLocked: { color: 'rgba(10,10,10,0.3)' },
  cardDesc: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.6)', lineHeight: 14 },
  cardDescLocked: { color: 'rgba(10,10,10,0.35)' },

  progContainer: { marginTop: 6, gap: 4 },
  progTrack: { height: 3, backgroundColor: 'rgba(10,10,10,0.1)', borderRadius: 1, overflow: 'hidden' },
  progFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 1 },
  progLabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 0.5 },

  cardCategory: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.3)', marginTop: 4, letterSpacing: 1 },
  unlockedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: LIME, borderWidth: 2, borderColor: INK, flexShrink: 0, marginTop: 4 },
  nearTag: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: ACCENT, borderRadius: 2, flexShrink: 0, marginTop: 4 },
  nearTagText: { fontFamily: MONO, fontSize: 6, fontWeight: '700', color: PAPER, letterSpacing: 1 },
  cardDivider: { height: 1, backgroundColor: 'rgba(10,10,10,0.08)' },

  footer: { paddingTop: 24, alignItems: 'center' },
  footerText: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.3)', letterSpacing: 1 },
});
