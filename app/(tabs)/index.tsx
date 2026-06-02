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
import { getFavorites, removeFromFavorites } from '../utils/storage';
import { getRuns } from '../utils/runStorage';
import { Run } from '../types/run';
import { getUserProfile } from '../utils/userProfile';
import {
  addMemorial,
  getLivingShoes,
  getMemorials,
  removeLivingShoe,
  saveLivingShoes,
} from '../utils/characterStorage';
import { LivingShoe, ShoeMemorial, LifeStage, ShoeMood } from '../types/character';
import { createLivingShoe, updateShoeAfterRun, computeLifeStage } from '../utils/characterEngine';
import { generateDialogue, generateDailyBrief } from '../utils/dialogueEngine';
import { findTodaysMemories, ClosetMemory } from '../utils/closetRemembers';
import { getTodaysWeather, TodaysWeather } from '../services/weatherService';
import { getShoeOfTheDay, getRotationAnalysis, ShoeRecommendation } from '../utils/dailyShoeAdvisor';
import { generateAllHealthReports, ShoeHealthReport } from '../utils/shoeLifeIntelligence';
import { detectPainPatterns, PainPattern } from '../utils/painPatternDetector';
import { RetirementCeremony } from '../../components/RetirementCeremony';
import { HallOfFame } from '../../components/HallOfFame';
import { FamilyTree } from '../../components/FamilyTree';
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

const MOOD_LABELS: Record<ShoeMood, string> = {
  eager:      'EAGER',
  content:    'CONTENT',
  proud:      'PROUD',
  tired:      'TIRED',
  wistful:    'WISTFUL',
  anxious:    'ANXIOUS',
  hurt:       'HURT',
  weary:      'WEARY',
  reflective: 'REFLECTIVE',
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
  const [weather, setWeather] = useState<TodaysWeather | null>(null);
  const [shoeOfDay, setShoeOfDay] = useState<ShoeRecommendation | null>(null);
  const [healthReports, setHealthReports] = useState<ShoeHealthReport[]>([]);
  const [painPatterns, setPainPatterns] = useState<PainPattern[]>([]);
  const [rotationAdvice, setRotationAdvice] = useState<string>('');
  const [retireShoe, setRetireShoe] = useState<Shoe | null>(null);
  const [retireChar, setRetireChar] = useState<LivingShoe | null>(null);
  const [showHallOfFame, setShowHallOfFame] = useState(false);
  const [showFamilyTree, setShowFamilyTree] = useState(false);

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

      // Weather + Shoe of the Day
      getTodaysWeather().then(w => {
        setWeather(w);
        const rec = getShoeOfTheDay(updated, shoeDataMap, allRuns, w);
        setShoeOfDay(rec);
      }).catch(() => {});

      // Health reports
      const reports = generateAllHealthReports(updated, shoeDataMap, allRuns);
      setHealthReports(reports);

      // Pain patterns
      const patterns = detectPainPatterns(allRuns, shoeDataMap);
      setPainPatterns(patterns);

      // Rotation analysis
      const rotation = getRotationAnalysis(updated, shoeDataMap, allRuns);
      setRotationAdvice(rotation.advice);

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
          <View style={s.headerBtns}>
            <TouchableOpacity
              onPress={() => { setShowHallOfFame(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={s.headerSmallBtn}
            >
              <Ionicons name="trophy-outline" size={14} color={INK} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setShowFamilyTree(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={s.headerSmallBtn}
            >
              <Ionicons name="git-branch-outline" size={14} color={INK} />
            </TouchableOpacity>
          </View>
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

        {/* ── SHOE OF THE DAY ───────────────────────────────────── */}
        {!showGraveyard && shoeOfDay && (
          <View style={s.advisorCard}>
            <Text style={s.advisorLabel}>// TODAY'S PICK</Text>
            <Text style={s.advisorText}>{shoeOfDay.reason}</Text>
            {weather && <Text style={s.advisorWeather}>{weather.summary}</Text>}
            {shoeOfDay.warnings.map((w, i) => (
              <Text key={i} style={s.advisorWarning}>⚠ {w}</Text>
            ))}
          </View>
        )}

        {/* ── ROTATION ADVICE ───────────────────────────────────── */}
        {!showGraveyard && rotationAdvice.length > 0 && (
          <View style={s.rotationCard}>
            <Text style={s.rotationText}>{rotationAdvice}</Text>
          </View>
        )}

        {/* ── HEALTH ALERTS ─────────────────────────────────────── */}
        {!showGraveyard && healthReports.filter(r => r.retireWarning || r.loadWarning).map(r => (
          <View key={r.shoeId} style={s.healthAlert}>
            {r.retireWarning && <Text style={s.healthAlertText}>🪦 {r.retireWarning}</Text>}
            {r.loadWarning && <Text style={s.healthAlertText}>⚡ {r.loadWarning}</Text>}
            {r.restrictions.length > 0 && (
              <Text style={s.healthRestriction}>{r.restrictions[0]}</Text>
            )}
            {r.costPerMile != null && r.totalMiles > 50 && (
              <Text style={s.costPerMile}>${r.costPerMile.toFixed(2)}/mi</Text>
            )}
          </View>
        ))}

        {/* ── PAIN PATTERNS ─────────────────────────────────────── */}
        {!showGraveyard && painPatterns.length > 0 && (
          <View style={s.painCard}>
            <Text style={s.painLabel}>// PATTERN DETECTED</Text>
            {painPatterns.slice(0, 2).map((p, i) => (
              <Text key={i} style={s.painText}>{p.pattern}</Text>
            ))}
          </View>
        )}

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
                        <View style={s.moodPill}>
                          <Text style={s.moodText}>{MOOD_LABELS[char.mood]}</Text>
                        </View>
                        <Text style={[s.lifePct, { color: stageColor }]}>
                          {Math.round(100 - char.lifePct)}% LIFE
                        </Text>
                      </View>

                      {/* Brand + model */}
                      <View style={s.identityBlock}>
                        <Text style={s.brand}>{shoe.brand.toUpperCase()}</Text>
                        <Text style={s.model}>{shoe.model}</Text>
                      </View>

                      {/* Nickname if earned */}
                      {char.nickname && (
                        <Text style={s.nickname}>"{char.nickname}"</Text>
                      )}

                      {/* Inherited lineage */}
                      {char.inheritedMemory && (
                        <Text style={s.lineageText}>{char.inheritedMemory}</Text>
                      )}

                      {/* Inter-shoe relationship */}
                      {(() => {
                        const jealous = char.relationships?.find(r => r.sentiment < -0.3);
                        const admires = char.relationships?.find(r => r.sentiment > 0.3);
                        const otherShoe = jealous
                          ? SHOES.find(sh => sh.id === jealous.otherShoeId)
                          : admires ? SHOES.find(sh => sh.id === admires.otherShoeId) : null;
                        if (!otherShoe) return null;
                        return (
                        <Text style={s.relationshipText}>
                            {jealous
                              ? `JEALOUS OF ${otherShoe.model.toUpperCase()} GETTING MORE RUNS LATELY`
                              : `GOOD TEAMMATES WITH ${otherShoe.model.toUpperCase()}`}
                          </Text>
                        );
                      })()}

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

                      {/* Moments timeline */}
                      {char.moments.length > 0 && (
                        <View style={s.momentsSection}>
                          <Text style={s.momentsTitle}>
                            {char.moments.length} {char.moments.length === 1 ? 'MEMORY' : 'MEMORIES'}
                          </Text>
                          {char.moments.slice(0, 4).map((m, mi) => (
                            <View key={m.type} style={s.momentRow}>
                              <View style={s.momentDot} />
                              <View style={s.momentContent}>
                                <Text style={s.momentCaption}>{m.caption}</Text>
                                <Text style={s.momentDate}>{m.date.slice(0, 10)}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* A line from the shoe */}
                      {char.runCount === 0 && (
                        <View style={s.welcomeCard}>
                          <Text style={s.welcomeLine}>
                            "WELCOME, {shoe.model.toUpperCase()}. NO MEMORIES YET. LET'S SEE WHERE THIS STORY GOES."
                          </Text>
                        </View>
                      )}
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

      {/* Hall of Fame */}
      <HallOfFame
        visible={showHallOfFame}
        onClose={() => setShowHallOfFame(false)}
        livingShoes={livingShoes}
        memorials={memorials}
        shoeDataMap={(() => { const m: Record<string, Shoe> = {}; SHOES.forEach(s => m[s.id] = s); return m; })()}
        totalRuns={runs.length}
      />

      {/* Family Tree */}
      <FamilyTree
        visible={showFamilyTree}
        onClose={() => setShowFamilyTree(false)}
        livingShoes={livingShoes}
        memorials={memorials}
        shoeDataMap={(() => { const m: Record<string, Shoe> = {}; SHOES.forEach(s => m[s.id] = s); return m; })()}
      />

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
  title: { fontFamily: MONO, fontSize: 24, fontWeight: '900', color: INK, letterSpacing: 0, lineHeight: 30 },
  headerRight: { paddingTop: 4, gap: 8 },
  headerBtns: { flexDirection: 'row', gap: 6, justifyContent: 'flex-end' },
  headerSmallBtn: { borderWidth: 1.5, borderColor: 'rgba(10,10,10,0.2)', padding: 6, borderRadius: 2 },
  graveyardBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 2, borderColor: INK, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 2 },
  graveyardBtnText: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: INK, letterSpacing: 1 },

  // Intelligence cards
  advisorCard: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#16A34A', padding: 16, borderRadius: 2 },
  advisorLabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, marginBottom: 8 },
  advisorText: { fontSize: 15, fontWeight: '700', color: '#fff', lineHeight: 22, marginBottom: 6 },
  advisorWeather: { fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  advisorWarning: { fontFamily: MONO, fontSize: 10, color: '#FBBF24', marginTop: 4 },
  rotationCard: { marginHorizontal: 16, marginTop: 10, backgroundColor: 'rgba(37,99,235,0.08)', borderLeftWidth: 3, borderLeftColor: '#2563EB', padding: 12, borderRadius: 2 },
  rotationText: { fontFamily: MONO, fontSize: 10, color: '#2563EB', lineHeight: 16 },
  healthAlert: { marginHorizontal: 16, marginTop: 10, backgroundColor: 'rgba(255,61,0,0.06)', borderLeftWidth: 3, borderLeftColor: ACCENT, padding: 12, borderRadius: 2 },
  healthAlertText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.7)', lineHeight: 16, marginBottom: 4 },
  healthRestriction: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', fontStyle: 'italic' },
  costPerMile: { fontFamily: MONO, fontSize: 9, color: ACCENT, fontWeight: '700', marginTop: 4 },
  painCard: { marginHorizontal: 16, marginTop: 10, backgroundColor: 'rgba(217,119,6,0.08)', borderLeftWidth: 3, borderLeftColor: '#D97706', padding: 12, borderRadius: 2 },
  painLabel: { fontFamily: MONO, fontSize: 8, color: '#D97706', letterSpacing: 2, marginBottom: 6 },
  painText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.7)', lineHeight: 16, marginBottom: 4 },

  briefCard: { marginHorizontal: 16, marginTop: 16, backgroundColor: INK, padding: 16, borderRadius: 2, borderWidth: 2, borderColor: INK },
  briefSpeaker: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.4)', letterSpacing: 2, marginBottom: 8 },
  briefLine: { fontFamily: MONO, fontSize: 13, fontWeight: '700', color: PAPER, lineHeight: 22 },

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
  moodPill: { borderWidth: 2, borderColor: 'rgba(10,10,10,0.18)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2 },
  moodText: { fontFamily: MONO, fontSize: 8, fontWeight: '900', color: 'rgba(10,10,10,0.5)', letterSpacing: 1.2 },
  lifePct: { marginLeft: 'auto', fontFamily: MONO, fontSize: 11, fontWeight: '700' },

  identityBlock: { borderTopWidth: 2, borderBottomWidth: 2, borderColor: INK, paddingVertical: 12, marginBottom: 12 },
  brand: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 2 },
  model: { fontFamily: MONO, fontSize: 20, fontWeight: '900', color: INK, letterSpacing: 0, marginBottom: 4 },
  nickname: { fontFamily: MONO, fontSize: 10, color: ACCENT, marginBottom: 8, letterSpacing: 1 },
  lineageText: { fontFamily: MONO, fontSize: 9, color: '#7C3AED', marginBottom: 6, lineHeight: 14, letterSpacing: 0.5 },
  relationshipText: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.45)', marginBottom: 10, lineHeight: 14, letterSpacing: 0.8 },

  lifeBar: { height: 6, backgroundColor: 'rgba(10,10,10,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 14 },
  lifeBarFill: { height: '100%', borderRadius: 3 },

  statsRow: { flexDirection: 'row', borderWidth: 2, borderColor: INK, borderRadius: 2, marginBottom: 12, overflow: 'hidden' },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  statDivider: { width: 2, backgroundColor: INK },
  statVal: { fontFamily: MONO, fontSize: 16, fontWeight: '900', color: INK, marginBottom: 2, letterSpacing: 0 },
  statLabel: { fontFamily: MONO, fontSize: 7, color: 'rgba(10,10,10,0.4)', letterSpacing: 1 },

  momentsSection: { marginBottom: 10 },
  momentsTitle: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.35)', letterSpacing: 1, marginBottom: 8 },
  momentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  momentDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT, marginTop: 5 },
  momentContent: { flex: 1 },
  momentCaption: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.55)', lineHeight: 15 },
  momentDate: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.25)', letterSpacing: 1, marginTop: 1 },

  welcomeCard: { backgroundColor: 'rgba(10,10,10,0.04)', padding: 12, borderRadius: 2, borderLeftWidth: 3, borderLeftColor: '#7C3AED', marginBottom: 10 },
  welcomeLine: { fontFamily: MONO, fontSize: 10, color: '#7C3AED', lineHeight: 17, letterSpacing: 0.5 },
  voiceCard: { backgroundColor: 'rgba(10,10,10,0.04)', padding: 12, borderRadius: 2, borderLeftWidth: 3, borderLeftColor: ACCENT },
  voiceLine: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.62)', lineHeight: 17, letterSpacing: 0.3 },

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
