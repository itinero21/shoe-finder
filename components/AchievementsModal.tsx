import React, { useState } from 'react';
import {
  View, Text, Modal, StyleSheet, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ACHIEVEMENTS, AchievementDef } from '../app/utils/achievementEngine';

const INK   = '#0A0A0A';
const PAPER = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME  = '#D4FF00';
const MONO  = 'SpaceMono';

const CATEGORY_LABELS: Record<string, string> = {
  mileage: 'MILEAGE',
  match: 'MATCH QUALITY',
  rotation: 'ROTATION',
  explorer: 'EXPLORER',
  quiz: 'SCOUT',
  graveyard: 'GRAVEYARD',
  streaks: 'STREAKS',
};

interface AchievementsModalProps {
  visible: boolean;
  unlockedIds: string[];
  onClose: () => void;
}

export function AchievementsModal({ visible, unlockedIds, onClose }: AchievementsModalProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = [...new Set(ACHIEVEMENTS.map(a => a.category))];
  const displayed = ACHIEVEMENTS.filter(a =>
    !a.secret || unlockedIds.includes(a.id)
  );
  const filtered = activeCategory
    ? displayed.filter(a => a.category === activeCategory)
    : displayed;

  const unlockedCount = ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id)).length;
  const totalVisible = displayed.length;

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

        {/* Progress bar */}
        <View style={s.progressSection}>
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>{unlockedCount} / {totalVisible} UNLOCKED</Text>
            <Text style={s.progressPct}>{Math.round((unlockedCount / totalVisible) * 100)}%</Text>
          </View>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${(unlockedCount / totalVisible) * 100}%` as any }]} />
          </View>
        </View>

        {/* Category filter */}
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
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(activeCategory === cat ? null : cat)}
              style={[s.catChip, activeCategory === cat && s.catChipActive]}
            >
              <Text style={[s.catChipText, activeCategory === cat && s.catChipTextActive]}>
                {CATEGORY_LABELS[cat] ?? cat.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView showsVerticalScrollIndicator={false} style={s.scroll} contentContainerStyle={s.scrollContent}>
          {filtered.map((a, i) => {
            const unlocked = unlockedIds.includes(a.id);
            return (
              <Animated.View key={a.id} entering={FadeInDown.delay(i * 30).springify()}>
                <View style={[s.card, unlocked && s.cardUnlocked]}>
                  <View style={[s.iconBox, unlocked && s.iconBoxUnlocked]}>
                    <Text style={s.iconText}>{unlocked ? a.icon : '🔒'}</Text>
                  </View>
                  <View style={s.cardBody}>
                    <View style={s.cardTop}>
                      <Text style={[s.cardTitle, !unlocked && s.cardTitleLocked]}>
                        {unlocked ? a.title.toUpperCase() : '???'}
                      </Text>
                      <View style={[s.xpBadge, !unlocked && s.xpBadgeLocked]}>
                        <Text style={[s.xpText, !unlocked && s.xpTextLocked]}>+{a.xp_reward} XP</Text>
                      </View>
                    </View>
                    <Text style={[s.cardDesc, !unlocked && s.cardDescLocked]}>
                      {unlocked ? a.desc : 'Keep playing to unlock this achievement.'}
                    </Text>
                    <Text style={s.cardCategory}>{CATEGORY_LABELS[a.category] ?? a.category}</Text>
                  </View>
                  {unlocked && <View style={s.unlockedDot} />}
                </View>
                <View style={s.cardDivider} />
              </Animated.View>
            );
          })}
          <View style={s.footer}>
            <Text style={s.footerText}>
              {ACHIEVEMENTS.filter(a => a.secret).length} hidden achievements await.
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
  progressTrack: { height: 4, backgroundColor: 'rgba(10,10,10,0.1)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: LIME, borderRadius: 2 },

  categoryScroll: { maxHeight: 52, borderBottomWidth: 1, borderBottomColor: 'rgba(10,10,10,0.1)' },
  categoryRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 2, borderColor: 'rgba(10,10,10,0.2)', borderRadius: 2 },
  catChipActive: { borderColor: INK, backgroundColor: INK },
  catChipText: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.6)', letterSpacing: 1 },
  catChipTextActive: { color: PAPER },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 60 },

  card: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14,
    opacity: 0.5,
  },
  cardUnlocked: { opacity: 1 },
  iconBox: {
    width: 48, height: 48, borderRadius: 2,
    borderWidth: 2, borderColor: 'rgba(10,10,10,0.2)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(10,10,10,0.04)',
  },
  iconBoxUnlocked: { borderColor: INK, backgroundColor: LIME },
  iconText: { fontSize: 22 },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: INK, letterSpacing: 0.5, flex: 1 },
  cardTitleLocked: { color: 'rgba(10,10,10,0.4)' },
  xpBadge: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: LIME, borderRadius: 2 },
  xpBadgeLocked: { backgroundColor: 'rgba(10,10,10,0.06)' },
  xpText: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: INK, letterSpacing: 1 },
  xpTextLocked: { color: 'rgba(10,10,10,0.3)' },
  cardDesc: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.6)', lineHeight: 14 },
  cardDescLocked: { color: 'rgba(10,10,10,0.3)' },
  cardCategory: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.3)', marginTop: 4, letterSpacing: 1 },
  unlockedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: LIME, borderWidth: 2, borderColor: INK },
  cardDivider: { height: 1, backgroundColor: 'rgba(10,10,10,0.08)' },

  footer: { paddingTop: 24, alignItems: 'center' },
  footerText: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.3)', letterSpacing: 1 },
});
