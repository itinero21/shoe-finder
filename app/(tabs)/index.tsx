/**
 * THE CLOSET — Your cast of living shoes.
 * The default tab. Where you check in daily.
 * Each shoe is a character with personality, mood, life stage, and voice.
 */
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { SHOES, Shoe } from '../data/shoes';
import { getFavorites } from '../utils/storage';
import { getRuns } from '../utils/runStorage';
import { Run } from '../types/run';
import { getUserProfile } from '../utils/userProfile';
import { getLivingShoes, saveLivingShoes, getMemorials } from '../utils/characterStorage';
import { LivingShoe, ShoeMemorial, LifeStage, ShoeMood } from '../types/character';
import { createLivingShoe, updateShoeAfterRun, computeLifeStage } from '../utils/characterEngine';
import { generateDialogue, generateDailyBrief } from '../utils/dialogueEngine';
import { findTodaysMemories, ClosetMemory } from '../utils/closetRemembers';
import { addMemorial, removeLivingShoe } from '../utils/characterStorage';
import { removeFromFavorites } from '../utils/storage';
import { RetirementCeremony } from '../../components/RetirementCeremony';
import { Onboarding } from '../../components/Onboarding';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const MONO   = 'SpaceMono';

// ── Life stage colors ───────────────────────────────────────────────────────
const STAGE_COLORS: Record<LifeStage, string> = {
  fresh:    '#16A34A',
  prime:    '#2563EB',
  veteran:  '#D97706',
  twilight: '#FF3D00',
  departed: '#6B7280',
};

const STAGE_LABELS: Record<LifeStage, string> = {
  fresh:    'FRESH',
  prime:    'PRIME',
  veteran:  'VETERAN',
  twilight: 'TWILIGHT',
  departed: 'DEPARTED',
};

const MOOD_EMOJI: Record<ShoeMood, string> = {
  eager:      '✨',
  content:    '😌',
  proud:      '🔥',
  tired:      '😮‍💨',
  wistful:    '🌙',
  anxious:    '😟',
  hurt:       '💔',
  weary:      '🫠',
  reflective: '🪞',
};

export default function ClosetScreen() {
  const router = useRouter();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [livingShoes, setLivingShoes] = useState<LivingShoe[]>([]);
  const [memorials, setMemorials] = useState<ShoeMemorial[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [showGraveyard, setShowGraveyard] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dailyLine, setDailyLine] = useState<string | null>(null);
  const [dailySpeaker, setDailySpeaker] = useState<string | null>(null);
  const [memories, setMemories] = useState<ClosetMemory[]>([]);
  const [retireShoe, setRetireShoe] = useState<Shoe | null>(null);
  const [retireChar, setRetireChar] = useState<LivingShoe | null>(null);

  React.useEffect(() => {
    AsyncStorage.getItem('stride_onboarding_done').then(val => {
      if (!val) setShowOnboarding(true);
    });
  }, []);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [favs, allRuns, chars, memos, profile] = await Promise.all([
        getFavorites(),
        getRuns(),
        getLivingShoes(),
        getMemorials(),
        getUserProfile(),
      ]);

      setFavoriteIds(favs);
      setRuns(allRuns);
      setMemorials(memos);

      // Ensure every favorite shoe has a LivingShoe character
      const weightLbs = profile.weight_lbs ?? 160;
      let updated = [...chars];
      let needsSave = false;

      for (const id of favs) {
        const shoe = SHOES.find(s => s.id === id);
        if (!shoe) continue;
        if (!updated.find(c => c.shoeId === id)) {
          updated.push(createLivingShoe(shoe, weightLbs));
          needsSave = true;
        }
      }

      // Update all living shoes with latest run data
      updated = updated.map(c => {
        const shoe = SHOES.find(s => s.id === c.shoeId);
        if (!shoe) return c;
        return updateShoeAfterRun(c, shoe, allRuns, updated, weightLbs);
      });

      setLivingShoes(updated);
      if (needsSave || allRuns.length > 0) {
        await saveLivingShoes(updated);
      }

      // Generate daily brief
      const shoeDataMap: Record<string, Shoe> = {};
      for (const s of SHOES) shoeDataMap[s.id] = s;
      const brief = generateDailyBrief(
        updated.filter(c => c.lifeStage !== 'departed'),
        shoeDataMap,
      );
      if (brief) {
        const speaker = SHOES.find(s => s.id === brief.shoeId);
        setDailyLine(brief.text);
        setDailySpeaker(speaker ? `${speaker.brand} ${speaker.model}` : null);
      }

      // Closet Remembers — surface old memories
      const todaysMemories = findTodaysMemories(allRuns, updated, memos, shoeDataMap);
      setMemories(todaysMemories);

      // Auto-sync watches
      import('../services/watchService').then(({ syncAllWatches }) =>
        syncAllWatches().catch(() => {})
      );
    })();
  }, []));

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem('stride_onboarding_done', '1');
    setShowOnboarding(false);
  };

  const activeShoes = livingShoes.filter(c =>
    favoriteIds.includes(c.shoeId) && c.lifeStage !== 'departed'
  );

  return (
    <SafeAreaView style={s.container}>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>// THE CLOSET</Text>
          <Text style={s.title}>YOUR SHOES{'\n'}ARE ALIVE.</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity
            onPress={() => { setShowGraveyard(!showGraveyard); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={s.graveyardBtn}
          >
            <Ionicons name={showGraveyard ? 'shirt-outline' : 'skull-outline'} size={16} color={showGraveyard ? ACCENT : INK} />
            <Text style={[s.graveyardBtnText, showGraveyard && { color: ACCENT }]}>
              {showGraveyard ? 'LIVING' : `GRAVEYARD (${memorials.length})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Daily Brief */}
      {dailyLine && !showGraveyard && (
        <View style={s.briefCard}>
          <Text style={s.briefSpeaker}>{dailySpeaker ?? 'A SHOE'} SAYS:</Text>
          <Text style={s.briefLine}>"{dailyLine}"</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── LIVING SHOES ──────────────────────────────────────────── */}
        {!showGraveyard && (
          <>
            {activeShoes.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="walk-outline" size={48} color="rgba(10,10,10,0.15)" />
                <Text style={s.emptyTitle}>YOUR CLOSET IS EMPTY</Text>
                <Text style={s.emptySub}>Every shoe has a story. Add one to begin.</Text>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/scan' as any)}
                  style={s.emptyBtn}
                >
                  <Text style={s.emptyBtnText}>+ ADD YOUR FIRST SHOE</Text>
                </TouchableOpacity>
              </View>
            ) : (
              activeShoes.map(char => {
                const shoe = SHOES.find(s => s.id === char.shoeId);
                if (!shoe) return null;
                const stageColor = STAGE_COLORS[char.lifeStage];

                return (
                  <View key={char.shoeId} style={s.cardWrap}>
                    <View style={[s.cardShadow, { backgroundColor: stageColor }]} />
                    <View style={s.card}>
                      {/* Top: stage + mood + life % */}
                      <View style={s.cardTop}>
                        <View style={[s.stageBadge, { backgroundColor: stageColor }]}>
                          <Text style={s.stageBadgeText}>{STAGE_LABELS[char.lifeStage]}</Text>
                        </View>
                        <Text style={s.moodEmoji}>{MOOD_EMOJI[char.mood]}</Text>
                        <Text style={[s.lifePct, { color: stageColor }]}>
                          {Math.round(100 - char.lifePct)}% LIFE
                        </Text>
                      </View>

                      {/* Brand + model */}
                      <Text style={s.brand}>{shoe.brand.toUpperCase()}</Text>
                      <Text style={s.model}>{shoe.model}</Text>

                      {/* Nickname if earned */}
                      {char.nickname && (
                        <Text style={s.nickname}>"{char.nickname}"</Text>
                      )}

                      {/* Life bar */}
                      <View style={s.lifeBar}>
                        <View style={[s.lifeBarFill, {
                          width: `${Math.max(0, Math.min(100 - char.lifePct, 100))}%` as any,
                          backgroundColor: stageColor,
                        }]} />
                      </View>

                      {/* Stats row */}
                      <View style={s.statsRow}>
                        <View style={s.statCell}>
                          <Text style={s.statVal}>{Math.round(char.totalMiles)}</Text>
                          <Text style={s.statLabel}>MILES</Text>
                        </View>
                        <View style={s.statDivider} />
                        <View style={s.statCell}>
                          <Text style={s.statVal}>{char.runCount}</Text>
                          <Text style={s.statLabel}>RUNS</Text>
                        </View>
                        <View style={s.statDivider} />
                        <View style={s.statCell}>
                          <Text style={s.statVal}>{char.daysSinceLastRun}</Text>
                          <Text style={s.statLabel}>DAYS AGO</Text>
                        </View>
                      </View>

                      {/* Moments count */}
                      {char.moments.length > 0 && (
                        <Text style={s.momentsCount}>
                          {char.moments.length} {char.moments.length === 1 ? 'MEMORY' : 'MEMORIES'}
                        </Text>
                      )}

                      {/* A line from the shoe */}
                      {char.runCount > 0 && (
                        <View style={s.voiceCard}>
                          <Text style={s.voiceLine}>
                            "{generateDialogue(char, shoe,
                              char.daysSinceLastRun > 7 ? 'neglect' : 'daily_brief',
                              { days: char.daysSinceLastRun, miles: Math.round(char.totalMiles) },
                            ).text}"
                          </Text>
                        </View>
                      )}

                      {/* Retire button — visible when in twilight or veteran stage */}
                      {(char.lifeStage === 'twilight' || char.lifeStage === 'veteran') && (
                        <TouchableOpacity
                          onPress={() => {
                            setRetireShoe(shoe);
                            setRetireChar(char);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                          }}
                          style={s.retireBtn}
                        >
                          <Text style={s.retireBtnText}>RETIRE</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ── GRAVEYARD ─────────────────────────────────────────────── */}
        {showGraveyard && (
          <>
            {memorials.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="skull-outline" size={48} color="rgba(10,10,10,0.15)" />
                <Text style={s.emptyTitle}>NO DEPARTED SHOES</Text>
                <Text style={s.emptySub}>When a shoe runs its last mile, it rests here. With honor.</Text>
              </View>
            ) : (
              memorials.map(m => (
                <View key={m.shoeId} style={s.tombWrap}>
                  <View style={s.tombShadow} />
                  <View style={s.tomb}>
                    <Text style={s.tombRip}>REST IN PEACE</Text>
                    <Text style={s.tombBrand}>{m.brand.toUpperCase()}</Text>
                    <Text style={s.tombModel}>{m.model}</Text>
                    {m.nickname && <Text style={s.tombNickname}>"{m.nickname}"</Text>}
                    <View style={s.tombDivider} />
                    <Text style={s.tombStats}>
                      {Math.round(m.totalMiles)} miles · {m.runCount} runs · {m.lifespanDays} days
                    </Text>
                    {m.lastWords && (
                      <Text style={s.tombLastWords}>"{m.lastWords}"</Text>
                    )}
                    <Text style={s.tombDates}>
                      {m.birthDate.slice(0, 10)} — {m.deathDate.slice(0, 10)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* ── CLOSET REMEMBERS ────────────────────────────────── */}
        {!showGraveyard && memories.length > 0 && (
          <View style={s.memoriesSection}>
            <Text style={s.memoriesTitle}>// THE CLOSET REMEMBERS</Text>
            {memories.map((m, i) => (
              <View key={`${m.shoeId}-${i}`} style={[s.memoryCard, m.isDeparted && s.memoryCardDeparted]}>
                <Text style={s.memoryText}>{m.text}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Retirement Ceremony */}
      {retireShoe && retireChar && (
        <RetirementCeremony
          visible={!!retireShoe}
          shoe={retireShoe}
          character={retireChar}
          runs={runs}
          availableHeirs={SHOES.filter(s =>
            favoriteIds.includes(s.id) && s.id !== retireShoe.id
          )}
          onCancel={() => { setRetireShoe(null); setRetireChar(null); }}
          onComplete={async (memorial, heirId) => {
            await addMemorial(memorial);
            await removeLivingShoe(memorial.shoeId);
            await removeFromFavorites(memorial.shoeId);

            // Apply lineage: update heir with inherited trait + memory
            if (heirId && retireChar) {
              const { getLivingShoe, saveLivingShoe } = await import('../utils/characterStorage');
              const heir = await getLivingShoe(heirId);
              if (heir) {
                heir.ancestorId = memorial.shoeId;
                heir.inheritedTrait = retireChar.archetype;
                heir.inheritedMemory = `Inherited the spirit of ${memorial.brand} ${memorial.model}${memorial.nickname ? ` "${memorial.nickname}"` : ''} — ${Math.round(memorial.totalMiles)} miles of legacy.`;
                await saveLivingShoe(heir);
                // Update local state
                setLivingShoes(prev => prev.map(c => c.shoeId === heirId ? heir : c));
              }
            }

            setRetireShoe(null);
            setRetireChar(null);
            setMemorials(prev => [memorial, ...prev]);
            setFavoriteIds(prev => prev.filter(id => id !== memorial.shoeId));
            setLivingShoes(prev => prev.filter(c => c.shoeId !== memorial.shoeId));
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: INK },
  eyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '900', color: INK, letterSpacing: -1, lineHeight: 30 },
  headerRight: { paddingTop: 4 },
  graveyardBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 2, borderColor: INK, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 2 },
  graveyardBtnText: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: INK, letterSpacing: 1 },

  briefCard: { marginHorizontal: 16, marginTop: 16, backgroundColor: INK, padding: 16, borderRadius: 2 },
  briefSpeaker: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.4)', letterSpacing: 2, marginBottom: 8 },
  briefLine: { fontSize: 15, fontWeight: '700', color: PAPER, fontStyle: 'italic', lineHeight: 22 },

  scroll: { paddingVertical: 20, paddingBottom: 80 },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: INK, marginTop: 12, marginBottom: 8 },
  emptySub: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.4)', textAlign: 'center', lineHeight: 17, marginBottom: 20 },
  emptyBtn: { backgroundColor: INK, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 2 },
  emptyBtnText: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: PAPER, letterSpacing: 2 },

  // ── Living Shoe Card ──────────────────────────────────────────────────
  cardWrap: { position: 'relative', marginHorizontal: 16, marginBottom: 20 },
  cardShadow: { position: 'absolute', top: 6, left: 6, right: -6, bottom: -6, borderRadius: 2 },
  card: { backgroundColor: PAPER, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 18 },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  stageBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2 },
  stageBadgeText: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: PAPER, letterSpacing: 1.5 },
  moodEmoji: { fontSize: 16 },
  lifePct: { marginLeft: 'auto', fontFamily: MONO, fontSize: 11, fontWeight: '700' },

  brand: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 2 },
  model: { fontSize: 22, fontWeight: '900', color: INK, letterSpacing: -0.5, marginBottom: 4 },
  nickname: { fontFamily: MONO, fontSize: 10, color: ACCENT, fontStyle: 'italic', marginBottom: 8 },

  lifeBar: { height: 6, backgroundColor: 'rgba(10,10,10,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 14 },
  lifeBarFill: { height: '100%', borderRadius: 3 },

  statsRow: { flexDirection: 'row', borderWidth: 2, borderColor: INK, borderRadius: 2, marginBottom: 12, overflow: 'hidden' },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  statDivider: { width: 2, backgroundColor: INK },
  statVal: { fontSize: 16, fontWeight: '800', color: INK, marginBottom: 2 },
  statLabel: { fontFamily: MONO, fontSize: 7, color: 'rgba(10,10,10,0.4)', letterSpacing: 1 },

  momentsCount: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.35)', letterSpacing: 1, marginBottom: 10 },

  voiceCard: { backgroundColor: 'rgba(10,10,10,0.04)', padding: 12, borderRadius: 2, borderLeftWidth: 3, borderLeftColor: ACCENT },
  voiceLine: { fontFamily: MONO, fontSize: 11, color: 'rgba(10,10,10,0.6)', fontStyle: 'italic', lineHeight: 17 },

  retireBtn: { marginTop: 12, borderWidth: 2, borderColor: 'rgba(10,10,10,0.2)', paddingVertical: 10, alignItems: 'center', borderRadius: 2 },
  retireBtnText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.35)', letterSpacing: 1.5 },

  // Memories
  memoriesSection: { marginHorizontal: 16, marginTop: 20 },
  memoriesTitle: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.35)', letterSpacing: 2, marginBottom: 12 },
  memoryCard: { backgroundColor: 'rgba(10,10,10,0.04)', padding: 14, borderRadius: 2, borderLeftWidth: 3, borderLeftColor: '#2563EB', marginBottom: 10 },
  memoryCardDeparted: { borderLeftColor: ACCENT },
  memoryText: { fontFamily: MONO, fontSize: 11, color: 'rgba(10,10,10,0.6)', fontStyle: 'italic', lineHeight: 17 },

  // ── Tombstone ─────────────────────────────────────────────────────────
  tombWrap: { position: 'relative', marginHorizontal: 16, marginBottom: 20 },
  tombShadow: { position: 'absolute', top: 6, left: 6, right: -6, bottom: -6, backgroundColor: INK, borderRadius: 2 },
  tomb: { backgroundColor: PAPER, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 20, alignItems: 'center' },
  tombRip: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.2)', letterSpacing: 3, marginBottom: 10 },
  tombBrand: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.4)', letterSpacing: 2 },
  tombModel: { fontSize: 20, fontWeight: '900', color: INK, textAlign: 'center', marginTop: 2, marginBottom: 4 },
  tombNickname: { fontFamily: MONO, fontSize: 10, color: ACCENT, fontStyle: 'italic', marginBottom: 8 },
  tombDivider: { height: 2, width: '100%', backgroundColor: INK, marginVertical: 12 },
  tombStats: { fontFamily: MONO, fontSize: 10, color: INK, fontWeight: '700', marginBottom: 8 },
  tombLastWords: { fontFamily: MONO, fontSize: 11, color: 'rgba(10,10,10,0.55)', fontStyle: 'italic', textAlign: 'center', lineHeight: 18, marginBottom: 10, paddingHorizontal: 8 },
  tombDates: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.3)', letterSpacing: 1.5 },
});
