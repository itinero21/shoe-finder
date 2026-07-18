/**
 * THE CLOSET — Your cast of living shoes.
 * The default tab. Where you check in daily.
 * Each shoe is a character with personality, mood, life stage, and voice.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

// Ownership lookups use the full trackable catalog (current + upcoming + legacy)
// so users who own an older model never lose tracking. Recommendation pools
// (draft picks) stay on CURRENT_SHOES — only buyable shoes get suggested.
import { ALL_TRACKABLE_SHOES as SHOES, CURRENT_SHOES, Shoe } from '../data/shoes';
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
import {
  getShoeOfTheDay, getRotationAnalysis, ShoeRecommendation,
  generateAllHealthReports, ShoeHealthReport,
  detectPainPatterns, PainPattern,
  getReadinessScores, ShoeReadiness,
  getDailyDecision, DailyDecision,
  getRunningGenome,
  getNextShoeAdvice, NextShoePick,
} from '../intelligence/bridge';
import { GenomeInsight } from '../intelligence/genome';
import {
  detectBadPurchases, BadPurchase,
  analyzeRotationChemistry, ShoeChemistry,
} from '../utils/shoeIntelligence';
import {
  buildShoeStoryProfile,
  buildYearEndShoeAwards,
  computeStoryMoodOverride,
  ShoeAward,
} from '../utils/shoeStoryEngine';
import {
  computeCostPerMile,
  cpmTier,
  computeFreshnessScore,
  freshnessTier,
  getDecompressionState,
} from '../utils/shoeFundEngine';
import { setShoeFundGoal } from '../utils/userProfile';
import { ShoeVisual, getBrandColor } from '../../components/ShoeVisual';
import { RunnerLoop } from '../../components/RunnerLoop';
import { RetirementCeremony } from '../../components/RetirementCeremony';
import { HallOfFame } from '../../components/HallOfFame';
import { FamilyTree } from '../../components/FamilyTree';
import { Onboarding } from '../../components/Onboarding';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME   = '#D4FF00';
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
  const [readinessScores, setReadinessScores] = useState<ShoeReadiness[]>([]);
  const [badPurchases, setBadPurchases] = useState<BadPurchase[]>([]);
  const [chemistry, setChemistry] = useState<ShoeChemistry[]>([]);
  const [shoeAwards, setShoeAwards] = useState<ShoeAward[]>([]);
  const [shoeFund, setShoeFund] = useState<{ balance: number; targetPrice: number | null; targetName: string | null; targetShoeId: string | null }>({ balance: 0, targetPrice: null, targetName: null, targetShoeId: null });
  const [retireShoe, setRetireShoe] = useState<Shoe | null>(null);
  const [retireChar, setRetireChar] = useState<LivingShoe | null>(null);
  const [showHallOfFame, setShowHallOfFame] = useState(false);
  const [showFamilyTree, setShowFamilyTree] = useState(false);
  const [, setMinuteTick] = useState(0);
  const [lastContribution, setLastContribution] = useState<number | null>(null);
  const [dailyDecision, setDailyDecision] = useState<DailyDecision | null>(null);
  const [genome, setGenome] = useState<GenomeInsight[]>([]);
  const [nextShoe, setNextShoe] = useState<{ retiringName: string | null; picks: NextShoePick[] }>({ retiringName: null, picks: [] });

  // Force re-render every 60s so foam decompression countdowns stay current
  useEffect(() => {
    const id = setInterval(() => setMinuteTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

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

      // Load Shoe Fund state
      setShoeFund({
        balance: profile.shoeFundBalance ?? 0,
        targetPrice: profile.shoeFundTargetPrice ?? null,
        targetName: profile.shoeFundTargetName ?? null,
        targetShoeId: profile.shoeFundTargetShoeId ?? null,
      });

      // Post-run fund reveal: show badge if a contribution was made in the last 5 min
      const contributionRaw = await AsyncStorage.getItem('stride_fund_last_contribution');
      if (contributionRaw) {
        try {
          const { amount, timestamp } = JSON.parse(contributionRaw) as { amount: number; timestamp: number };
          if (Date.now() - timestamp < 5 * 60_000) {
            setLastContribution(amount);
          } else {
            setLastContribution(null);
          }
          await AsyncStorage.removeItem('stride_fund_last_contribution');
        } catch { /* ignore */ }
      } else {
        setLastContribution(null);
      }

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

      // Apply stored purchase prices (captured at add-to-closet time)
      for (const c of updated) {
        if (!c.purchasePrice) {
          const stored = await AsyncStorage.getItem(`stride_shoe_price_${c.shoeId}`);
          if (stored) {
            c.purchasePrice = parseFloat(stored);
            needsSave = true;
          }
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

      // Weather + Shoe of the Day + Decision Center (Engine 3)
      getTodaysWeather().then(w => {
        setWeather(w);
        setShoeOfDay(getShoeOfTheDay(updated, shoeDataMap, allRuns, w, profile));
        setDailyDecision(allRuns.length >= 3 ? getDailyDecision(allRuns, w) : null);
      }).catch(() => {
        setDailyDecision(allRuns.length >= 3 ? getDailyDecision(allRuns, null) : null);
      });

      // Running Genome (Engine 1) + Next Shoe marketplace (Engine 6)
      setGenome(getRunningGenome(updated, allRuns, memos));
      setNextShoe(getNextShoeAdvice(updated, allRuns, profile));

      // Health reports
      const reports = generateAllHealthReports(updated, shoeDataMap, allRuns);
      setHealthReports(reports);

      // Pain patterns
      const patterns = detectPainPatterns(allRuns, shoeDataMap);
      setPainPatterns(patterns);

      // Rotation analysis
      const rotation = getRotationAnalysis(updated, shoeDataMap, allRuns);
      setRotationAdvice(rotation.advice);

      // Shoe readiness scores (Intelligence Engine v2.1, weather-aware)
      getTodaysWeather().then(w => {
        setReadinessScores(getReadinessScores(updated, shoeDataMap, allRuns, w, profile));
      }).catch(() => {
        setReadinessScores(getReadinessScores(updated, shoeDataMap, allRuns, null, profile));
      });

      // Bad purchases + chemistry
      setBadPurchases(detectBadPurchases(updated, shoeDataMap, allRuns));
      setChemistry(analyzeRotationChemistry(updated, shoeDataMap));
      setShoeAwards(buildYearEndShoeAwards(updated, memos, allRuns, shoeDataMap));

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
          <Text style={s.eyebrow}>YOUR CLOSET</Text>
          <Text style={s.title}>YOUR{'\n'}ROTATION.</Text>
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
            <Ionicons name={showGraveyard ? 'shirt-outline' : 'archive-outline'} size={16} color={showGraveyard ? ACCENT : INK} />
            <Text style={[s.graveyardBtnText, showGraveyard && { color: ACCENT }]}>
              {showGraveyard ? 'ACTIVE' : `RETIRED (${memorials.length})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Daily Brief */}
      {dailyLine && !showGraveyard && (
        <View style={s.briefCard}>
          <Text style={s.briefSpeaker}>{dailySpeaker?.toUpperCase() ?? 'YOUR CLOSET'}</Text>
          <Text style={s.briefLine}>"{dailyLine}"</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── SHOE OF THE DAY ───────────────────────────────────── */}
        {!showGraveyard && shoeOfDay && (
          <View style={s.advisorCard}>
            <View style={s.advisorHeader}>
              <Text style={s.advisorLabel}>TODAY'S PICK</Text>
              <Text style={s.advisorConfidence}>CONFIDENCE {shoeOfDay.confidence}%</Text>
            </View>
            <Text style={s.advisorText}>{shoeOfDay.reason}</Text>
            {weather && <Text style={s.advisorWeather}>{weather.summary}</Text>}
            {shoeOfDay.warnings.map((w, i) => (
              <Text key={i} style={s.advisorWarning}>⚠ {w}</Text>
            ))}

            {/* Decision Center — Today's Body / Risk / Opportunity */}
            {dailyDecision && (
              <View style={s.decisionBlock}>
                <View style={s.decisionRow}>
                  <Text style={s.decisionKey}>BODY</Text>
                  <Text style={s.decisionVal}>{dailyDecision.body.label}</Text>
                  <Text style={s.decisionDetail} numberOfLines={2}>{dailyDecision.body.detail}</Text>
                </View>
                <View style={s.decisionRow}>
                  <Text style={s.decisionKey}>RISK</Text>
                  <Text style={[s.decisionVal, dailyDecision.risk.elevated && { color: ACCENT }]}>
                    {dailyDecision.risk.label}
                  </Text>
                  <Text style={s.decisionDetail} numberOfLines={2}>{dailyDecision.risk.detail}</Text>
                </View>
                <View style={[s.decisionRow, { borderBottomWidth: 0 }]}>
                  <Text style={s.decisionKey}>TODAY</Text>
                  <Text style={[s.decisionDetail, { flex: 1, color: LIME }]} numberOfLines={3}>
                    {dailyDecision.opportunity}
                  </Text>
                </View>
              </View>
            )}
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
                const story = buildShoeStoryProfile(char, shoe, runs, livingShoes, CURRENT_SHOES);
                const nextLockedAchievement = story.achievements.find(a => !a.unlocked);
                const displayMood = computeStoryMoodOverride(char.mood, story.streak);
                const freshness = computeFreshnessScore(char.lifePct);
                const freshTier = freshnessTier(freshness);

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
                          <Text style={s.moodText}>{MOOD_LABELS[displayMood]}</Text>
                        </View>
                        <View style={s.freshnessBlock}>
                          <Text style={[s.freshnessScore, { color: freshTier.color }]}>{freshness}%</Text>
                          <Text style={[s.freshnessLabel, { color: freshTier.color }]}>{freshTier.label}</Text>
                        </View>
                      </View>

                      {/* Generative shoe render — ages with real wear */}
                      <View style={s.shoeVisualWrap}>
                        <ShoeVisual shoe={shoe} wearPct={char.lifePct} width={250} />
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
                              ? `USED LESS THAN ${otherShoe.model.toUpperCase()} RECENTLY`
                              : `PAIRS WELL WITH ${otherShoe.model.toUpperCase()}`}
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

                      {/* Foam Decompression — live runner shows the gait on this foam */}
                      {(() => {
                        const decomp = getDecompressionState(char);
                        if (!decomp.recovering) return null;
                        // Foam feel right now = long-term wear AND short-term compression
                        const foamNow = Math.round(freshness * (decomp.pctRecovered / 100));
                        return (
                          <View style={s.decompSection}>
                            <View style={s.decompHeader}>
                              <Text style={s.decompLabel}>FOAM RECOVERING</Text>
                              <Text style={s.decompTime}>{decomp.hoursRemaining}H LEFT</Text>
                            </View>
                            <View style={s.decompRunnerRow}>
                              <RunnerLoop
                                freshness={foamNow}
                                shoeColor={getBrandColor(shoe.brand)}
                                size={92}
                                variant={char.personalitySeed > 0.5 ? 'w' : 'm'}
                              />
                              <View style={s.decompRunnerInfo}>
                                <Text style={s.decompRunnerText}>
                                  {foamNow >= 70
                                    ? 'FOAM IS BOUNCING BACK. STRIDE LOOKS SPRINGY.'
                                    : foamNow >= 40
                                    ? 'MIDSOLE STILL COMPRESSED. STRIDE IS FLATTER.'
                                    : 'FOAM IS BOTTOMED OUT. EVERY STEP LANDS HEAVY.'}
                                </Text>
                                <Text style={s.decompRunnerPct}>{decomp.pctRecovered}% RECOVERED</Text>
                              </View>
                            </View>
                            <View style={s.decompBar}>
                              <View style={[s.decompBarFill, { width: `${decomp.pctRecovered}%` as any }]} />
                            </View>
                          </View>
                        );
                      })()}

                      {/* Cost Per Mile */}
                      {(() => {
                        if (char.totalMiles < 30) return null;
                        const cpm = computeCostPerMile(char, shoe);
                        if (!cpm) return null;
                        const tier = cpmTier(cpm);
                        return (
                          <View style={s.cpmRow}>
                            <Text style={[s.cpmValue, { color: tier.color }]}>${cpm.toFixed(2)}/mi</Text>
                            <Text style={[s.cpmTier, { color: tier.color }]}>{tier.label}</Text>
                          </View>
                        );
                      })()}

                      {/* Per-mile savings rate (forward-looking) */}
                      {(() => {
                        const price = char.purchasePrice;
                        if (!price || price <= 0 || char.lifespanMiles <= 0) return null;
                        const ratePerMile = price / char.lifespanMiles;
                        return (
                          <View style={s.savingsRateRow}>
                            <Text style={s.savingsRateLabel}>BUILDS FUND</Text>
                            <Text style={s.savingsRateValue}>${ratePerMile.toFixed(3)}/mi</Text>
                          </View>
                        );
                      })()}

                      {/* Story signals */}
                      {(story.streak.line || story.season || story.unexpectedMoment || story.earnedPersonality) && (
                        <View style={s.storyPulse}>
                          {story.earnedPersonality && (
                            <Text style={s.storyPulseTitle}>{story.earnedPersonality.toUpperCase()}</Text>
                          )}
                          {story.streak.line && <Text style={s.storyPulseText}>{story.streak.line}</Text>}
                          {story.season && <Text style={s.storyPulseText}>{story.season.line}</Text>}
                          {story.unexpectedMoment && <Text style={s.storyPulseText}>{story.unexpectedMoment}</Text>}
                        </View>
                      )}

                      {story.rivalry && (
                        <View style={s.rivalryCard}>
                          <Text style={s.rivalryLabel}>RIVAL SHOE</Text>
                          <Text style={s.rivalryText}>{story.rivalry.line}</Text>
                        </View>
                      )}

                      {story.unlockedAchievements.length > 0 && (
                        <View style={s.achievementRow}>
                          {story.unlockedAchievements.slice(0, 3).map(a => (
                            <View key={a.id} style={s.achievementChip}>
                              <Text style={s.achievementTitle}>{a.title.toUpperCase()}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {nextLockedAchievement && char.runCount >= 3 && (
                        <Text style={s.nextAchievement}>
                          NEXT HIDDEN AWARD: {nextLockedAchievement.title.toUpperCase()} / {nextLockedAchievement.detail}
                        </Text>
                      )}

                      {story.memories.length > 0 && (
                        <View style={s.storyMemoryCard}>
                          <Text style={s.storyMemoryLabel}>{story.memories[0].title.toUpperCase()}</Text>
                          <Text style={s.storyMemoryText}>{story.memories[0].text}</Text>
                        </View>
                      )}

                      {story.soundtrack.beats.length > 0 && char.runCount >= 3 && (
                        <View style={s.soundtrackCard}>
                          <Text style={s.soundtrackTitle}>CAREER SOUNDTRACK</Text>
                          <View style={s.soundtrackGrid}>
                            {story.soundtrack.beats.slice(0, 6).map(beat => (
                              <Text key={beat} style={s.soundtrackBeat}>{beat}</Text>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Moments timeline */}
                      {story.scrapbook.greatestMoments.length > 0 && (
                        <View style={s.momentsSection}>
                          <Text style={s.momentsTitle}>
                            SHOE SCRAPBOOK
                          </Text>
                          {story.scrapbook.greatestMoments.slice(0, 4).map((m, mi) => (
                            <View key={`${m.title}-${mi}`} style={s.momentRow}>
                              <View style={s.momentDot} />
                              <View style={s.momentContent}>
                                <Text style={s.momentCaption}>{m.title}: {m.text}</Text>
                                {m.date && <Text style={s.momentDate}>{m.date.slice(0, 10)}</Text>}
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {story.draftPicks.length > 0 && (
                        <View style={s.draftCard}>
                          <Text style={s.draftTitle}>DRAFT NIGHT</Text>
                          {story.draftPicks.slice(0, 2).map(pick => {
                            const pickShoe = SHOES.find(sh => sh.id === pick.shoeId);
                            const isGoal = shoeFund.targetShoeId === pick.shoeId;
                            return (
                              <View key={pick.shoeId} style={s.draftPick}>
                                <Text style={s.draftRole}>{pick.role.toUpperCase()}</Text>
                                <View style={s.draftPickRow}>
                                  <Text style={s.draftName}>{pick.shoeName}</Text>
                                  {pickShoe && (
                                    <TouchableOpacity
                                      onPress={() => {
                                        const price = pickShoe.price_usd ?? 150;
                                        const name = `${pickShoe.brand} ${pickShoe.model}`;
                                        setShoeFundGoal(price, name, pick.shoeId).then(() => {
                                          setShoeFund(prev => ({ ...prev, targetPrice: price, targetName: name, targetShoeId: pick.shoeId }));
                                        }).catch(() => {});
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                      }}
                                      style={[s.setGoalBtn, isGoal && s.setGoalBtnActive]}
                                    >
                                      <Text style={[s.setGoalText, isGoal && s.setGoalTextActive]}>
                                        {isGoal ? 'GOAL SET' : 'SET GOAL'}
                                      </Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                                <Text style={s.draftReason}>{pick.reason}</Text>
                              </View>
                            );
                          })}
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

        {/* ── SHOE FUND ─────────────────────────────────────────── */}
        {!showGraveyard && activeShoes.length > 0 && (
          <View style={s.fundSection}>
            <Text style={s.fundTitle}>SHOE FUND</Text>
            <View style={s.fundCard}>
              {lastContribution !== null && (
                <View style={s.fundContribBadge}>
                  <Text style={s.fundContribText}>+${lastContribution.toFixed(3)} JUST ADDED FROM YOUR RUN</Text>
                </View>
              )}
              <View style={s.fundTopRow}>
                <View>
                  <Text style={s.fundBalance}>${shoeFund.balance.toFixed(2)}</Text>
                  <Text style={s.fundBalanceLabel}>SAVED</Text>
                </View>
                {shoeFund.targetName && shoeFund.targetPrice && (
                  <View style={s.fundGoalBadge}>
                    <Text style={s.fundGoalBadgeLabel}>GOAL</Text>
                    <Text style={s.fundGoalBadgeName} numberOfLines={1}>{shoeFund.targetName.toUpperCase()}</Text>
                    <Text style={s.fundGoalBadgePrice}>${shoeFund.targetPrice}</Text>
                  </View>
                )}
              </View>
              {shoeFund.targetPrice && shoeFund.targetPrice > 0 && (
                <>
                  <View style={s.fundBar}>
                    <View style={[s.fundBarFill, { width: `${Math.min(100, (shoeFund.balance / shoeFund.targetPrice) * 100)}%` as any }]} />
                  </View>
                  <Text style={s.fundProgress}>
                    {Math.round(Math.min(100, (shoeFund.balance / shoeFund.targetPrice) * 100))}% FUNDED · ${Math.max(0, shoeFund.targetPrice - shoeFund.balance).toFixed(2)} TO GO
                  </Text>
                </>
              )}
              {!shoeFund.targetName && (
                <Text style={s.fundHint}>Every mile you run builds this fund. Set a goal from DRAFT NIGHT on any twilight shoe.</Text>
              )}
            </View>
          </View>
        )}

        {/* ── NEXT SHOE — Marketplace Engine ─────────────────────── */}
        {!showGraveyard && nextShoe.picks.length > 0 && (
          <View style={s.marketSection}>
            <Text style={s.marketTitle}>NEXT SHOE</Text>
            {nextShoe.retiringName && (
              <Text style={s.marketSub}>
                {nextShoe.retiringName.toUpperCase()} IS PAST MIDLIFE. THREE SUCCESSORS, ARGUED HONESTLY:
              </Text>
            )}
            {nextShoe.picks.map(pick => {
              const pickShoe = SHOES.find(sh => sh.id === pick.shoeId);
              const isGoal = shoeFund.targetShoeId === pick.shoeId;
              return (
                <View key={pick.shoeId} style={s.marketCard}>
                  {pickShoe && <ShoeVisual shoe={pickShoe} wearPct={0} width={84} />}
                  <View style={s.marketInfo}>
                    <Text style={s.marketBrand}>{pick.brand.toUpperCase()}</Text>
                    <Text style={s.marketModel}>{pick.model}</Text>
                    <Text style={s.marketReason} numberOfLines={2}>{pick.reason}</Text>
                    <View style={s.marketStatsRow}>
                      <Text style={s.marketStat}>${pick.price}</Text>
                      <Text style={s.marketStatDim}>~{pick.expectedMiles} MI LIFE</Text>
                      {pick.estYearlyCost != null && (
                        <Text style={s.marketStatDim}>${pick.estYearlyCost}/YR</Text>
                      )}
                      <Text style={s.marketConfidence}>{pick.confidence}% CONF</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setShoeFundGoal(pick.price, `${pick.brand} ${pick.model}`, pick.shoeId).then(() => {
                        setShoeFund(prev => ({ ...prev, targetPrice: pick.price, targetName: `${pick.brand} ${pick.model}`, targetShoeId: pick.shoeId }));
                      }).catch(() => {});
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }}
                    style={[s.marketGoalBtn, isGoal && s.marketGoalBtnActive]}
                  >
                    <Text style={[s.marketGoalText, isGoal && s.marketGoalTextActive]}>
                      {isGoal ? 'GOAL' : 'FUND'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* ── RUNNING GENOME — Engine 1 ──────────────────────────── */}
        {!showGraveyard && genome.length > 0 && (
          <View style={s.genomeSection}>
            <Text style={s.genomeTitle}>RUNNING GENOME</Text>
            <Text style={s.genomeSub}>LEARNED FROM YOUR RUNS. NEVER ASKED.</Text>
            {genome.slice(0, 7).map((g, i) => (
              <View key={`${g.label}-${i}`} style={s.genomeRow}>
                <View style={s.genomeLeft}>
                  <Text style={s.genomeDim}>{g.dimension.toUpperCase()} DNA</Text>
                  <Text style={s.genomeLabel}>{g.label}</Text>
                </View>
                <View style={s.genomeRight}>
                  <Text style={s.genomeValue}>{g.value}</Text>
                  <Text style={s.genomeDetail}>{g.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── SHOE READINESS ──────────────────────────────────────── */}
        {!showGraveyard && readinessScores.length > 0 && (
          <View style={s.readinessSection}>
            <Text style={s.readinessTitle}>READINESS</Text>
            {readinessScores.map(r => (
              <View key={r.shoeId} style={s.readinessRow}>
                <View style={s.readinessLeft}>
                  <Text style={s.readinessName}>{r.shoeName}</Text>
                  <Text style={s.readinessLabel}>{r.label}</Text>
                </View>
                <View style={s.readinessRight}>
                  <Text style={[s.readinessScore, {
                    color: r.score >= 75 ? '#16A34A' : r.score >= 50 ? '#D97706' : ACCENT,
                  }]}>{r.score}%</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── SHOE CHEMISTRY ────────────────────────────────────── */}
        {!showGraveyard && chemistry.length > 0 && (
          <View style={s.chemistrySection}>
            <Text style={s.chemistryTitle}>ROTATION</Text>
            {chemistry.slice(0, 3).map((c, i) => (
              <View key={i} style={[s.chemistryRow, {
                borderLeftColor: c.compatibility === 'excellent' ? '#16A34A' : c.compatibility === 'good' ? '#2563EB' : ACCENT,
              }]}>
                <Text style={s.chemistryPair}>{c.shoe1} + {c.shoe2}</Text>
                <Text style={[s.chemistryLabel, {
                  color: c.compatibility === 'excellent' ? '#16A34A' : c.compatibility === 'good' ? '#2563EB' : ACCENT,
                }]}>{c.compatibility.toUpperCase()}</Text>
                <Text style={s.chemistryReason}>{c.reason}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── HEALTH ALERTS ─────────────────────────────────────── */}
        {!showGraveyard && healthReports.filter(r => r.retireWarning || r.loadWarning).map(r => (
          <View key={r.shoeId} style={s.healthAlert}>
            {r.retireWarning && <Text style={s.healthAlertText}>{r.retireWarning}</Text>}
            {r.loadWarning && <Text style={s.healthAlertText}>{r.loadWarning}</Text>}
            {r.restrictions.length > 0 && (
              <Text style={s.healthRestriction}>{r.restrictions[0]}</Text>
            )}
            {r.costPerMile != null && r.totalMiles > 50 && (
              <Text style={s.costPerMile}>${r.costPerMile.toFixed(2)}/mi</Text>
            )}
          </View>
        ))}

        {/* ── ROTATION ADVICE ───────────────────────────────────── */}
        {!showGraveyard && rotationAdvice.length > 0 && (
          <View style={s.rotationCard}>
            <Text style={s.rotationText}>{rotationAdvice}</Text>
          </View>
        )}

        {/* ── PAIN PATTERNS ─────────────────────────────────────── */}
        {!showGraveyard && painPatterns.length > 0 && (
          <View style={s.painCard}>
            <Text style={s.painLabel}>PATTERN DETECTED</Text>
            {painPatterns.slice(0, 2).map((p, i) => (
              <Text key={i} style={s.painText}>{p.pattern}</Text>
            ))}
          </View>
        )}

        {/* ── SHOE AWARDS ───────────────────────────────────────── */}
        {!showGraveyard && shoeAwards.length > 0 && (
          <View style={s.awardsSection}>
            <Text style={s.awardsTitle}>YEAR IN REVIEW</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.awardsScroll}>
              {shoeAwards.map(a => (
                <View key={a.id} style={s.awardCard}>
                  <Text style={s.awardTitle}>{a.title.toUpperCase()}</Text>
                  <Text style={s.awardShoe}>{a.shoeName}</Text>
                  <Text style={s.awardDetail}>{a.detail}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── BAD PURCHASES ─────────────────────────────────────── */}
        {!showGraveyard && badPurchases.length > 0 && (
          <View style={s.badPurchaseSection}>
            <Text style={s.badPurchaseTitle}>PURCHASE REVIEW</Text>
            {badPurchases.map(b => (
              <View key={b.shoeId} style={s.badPurchaseCard}>
                <Text style={s.badPurchaseName}>{b.shoeName}</Text>
                <Text style={s.badPurchaseReason}>{b.reason}</Text>
              </View>
            ))}
          </View>
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
  advisorLabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.5)', letterSpacing: 2 },
  advisorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  advisorConfidence: { fontFamily: MONO, fontSize: 8, color: LIME, letterSpacing: 1.5 },

  // Decision Center (Engine 3)
  decisionBlock: { marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' },
  decisionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  decisionKey: { fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, width: 42, marginTop: 1 },
  decisionVal: { fontFamily: MONO, fontSize: 10, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1, width: 74 },
  decisionDetail: { fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.55)', lineHeight: 13, flex: 1 },

  // Next Shoe — Marketplace (Engine 6)
  marketSection: { marginBottom: 24 },
  marketTitle: { fontFamily: MONO, fontSize: 11, fontWeight: '900', color: INK, letterSpacing: 2, marginBottom: 4 },
  marketSub: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.45)', letterSpacing: 0.8, lineHeight: 13, marginBottom: 10 },
  marketCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 10, marginBottom: 10, backgroundColor: '#FFFFFF' },
  marketInfo: { flex: 1 },
  marketBrand: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 1.5 },
  marketModel: { fontFamily: MONO, fontSize: 13, fontWeight: '900', color: INK, marginBottom: 3 },
  marketReason: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.55)', lineHeight: 12, marginBottom: 5 },
  marketStatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  marketStat: { fontFamily: MONO, fontSize: 10, fontWeight: '900', color: INK },
  marketStatDim: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.45)', letterSpacing: 0.5 },
  marketConfidence: { fontFamily: MONO, fontSize: 8, color: '#2563EB', letterSpacing: 0.5 },
  marketGoalBtn: { borderWidth: 2, borderColor: INK, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 2 },
  marketGoalBtnActive: { backgroundColor: LIME, borderColor: LIME },
  marketGoalText: { fontFamily: MONO, fontSize: 8, fontWeight: '900', color: INK, letterSpacing: 1 },
  marketGoalTextActive: { color: INK },

  // Running Genome (Engine 1)
  genomeSection: { marginBottom: 24, backgroundColor: INK, borderRadius: 2, padding: 14 },
  genomeTitle: { fontFamily: MONO, fontSize: 11, fontWeight: '900', color: PAPER, letterSpacing: 2 },
  genomeSub: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.4)', letterSpacing: 1, marginBottom: 10, marginTop: 2 },
  genomeRow: { flexDirection: 'row', gap: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(244,241,234,0.1)' },
  genomeLeft: { width: 110 },
  genomeDim: { fontFamily: MONO, fontSize: 7, color: ACCENT, letterSpacing: 1.2, marginBottom: 2 },
  genomeLabel: { fontFamily: MONO, fontSize: 9, fontWeight: '700', color: PAPER, letterSpacing: 0.5, lineHeight: 13 },
  genomeRight: { flex: 1 },
  genomeValue: { fontFamily: MONO, fontSize: 11, fontWeight: '900', color: LIME, letterSpacing: 0.5, marginBottom: 2 },
  genomeDetail: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.5)', lineHeight: 12 },
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

  // Readiness
  readinessSection: { marginHorizontal: 16, marginTop: 16 },
  readinessTitle: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.35)', letterSpacing: 2, marginBottom: 10 },
  readinessRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(10,10,10,0.08)' },
  readinessLeft: { flex: 1, gap: 2 },
  readinessName: { fontSize: 14, fontWeight: '700', color: INK },
  readinessLabel: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)' },
  readinessRight: { alignItems: 'flex-end' },
  readinessScore: { fontSize: 22, fontWeight: '900' },

  // Chemistry
  chemistrySection: { marginHorizontal: 16, marginTop: 16 },
  chemistryTitle: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.35)', letterSpacing: 2, marginBottom: 10 },
  chemistryRow: { borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 8, marginBottom: 8 },
  chemistryPair: { fontFamily: MONO, fontSize: 10, color: INK, fontWeight: '700', marginBottom: 2 },
  chemistryLabel: { fontFamily: MONO, fontSize: 8, letterSpacing: 1.5, marginBottom: 2 },
  chemistryReason: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.45)', lineHeight: 14 },

  // Awards
  awardsSection: { marginTop: 16 },
  awardsTitle: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.35)', letterSpacing: 2, marginHorizontal: 16, marginBottom: 10 },
  awardsScroll: { paddingHorizontal: 16, gap: 10 },
  awardCard: { width: 170, backgroundColor: INK, padding: 14, borderRadius: 2, borderWidth: 2, borderColor: INK },
  awardTitle: { fontFamily: MONO, fontSize: 8, color: LIME, letterSpacing: 1.5, marginBottom: 8 },
  awardShoe: { fontFamily: MONO, fontSize: 12, color: PAPER, fontWeight: '900', lineHeight: 17, marginBottom: 6 },
  awardDetail: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.55)', lineHeight: 14 },

  // Bad purchases
  badPurchaseSection: { marginHorizontal: 16, marginTop: 16 },
  badPurchaseTitle: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.35)', letterSpacing: 2, marginBottom: 10 },
  badPurchaseCard: { backgroundColor: 'rgba(10,10,10,0.04)', padding: 12, borderRadius: 2, borderLeftWidth: 3, borderLeftColor: '#6B7280', marginBottom: 8 },
  badPurchaseName: { fontFamily: MONO, fontSize: 10, color: INK, fontWeight: '700', marginBottom: 4 },
  badPurchaseReason: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.5)', lineHeight: 14 },

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
  freshnessBlock: { marginLeft: 'auto', alignItems: 'flex-end' },
  freshnessScore: { fontFamily: MONO, fontSize: 13, fontWeight: '900', lineHeight: 16 },
  freshnessLabel: { fontFamily: MONO, fontSize: 7, letterSpacing: 1.2, lineHeight: 10 },

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

  storyPulse: { backgroundColor: 'rgba(212,255,0,0.22)', borderLeftWidth: 3, borderLeftColor: LIME, padding: 12, borderRadius: 2, marginBottom: 10 },
  storyPulseTitle: { fontFamily: MONO, fontSize: 9, color: INK, fontWeight: '900', letterSpacing: 1.5, marginBottom: 5 },
  storyPulseText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.62)', lineHeight: 16, marginBottom: 2 },
  rivalryCard: { backgroundColor: 'rgba(255,61,0,0.08)', borderLeftWidth: 3, borderLeftColor: ACCENT, padding: 12, borderRadius: 2, marginBottom: 10 },
  rivalryLabel: { fontFamily: MONO, fontSize: 8, color: ACCENT, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 },
  rivalryText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.62)', lineHeight: 16 },
  achievementRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  achievementChip: { backgroundColor: INK, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 2 },
  achievementTitle: { fontFamily: MONO, fontSize: 7, color: PAPER, fontWeight: '900', letterSpacing: 1 },
  nextAchievement: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.35)', lineHeight: 13, marginBottom: 10, letterSpacing: 0.7 },
  storyMemoryCard: { backgroundColor: 'rgba(37,99,235,0.08)', borderLeftWidth: 3, borderLeftColor: '#2563EB', padding: 12, borderRadius: 2, marginBottom: 10 },
  storyMemoryLabel: { fontFamily: MONO, fontSize: 8, color: '#2563EB', fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 },
  storyMemoryText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.62)', lineHeight: 16 },
  soundtrackCard: { borderWidth: 1.5, borderColor: 'rgba(10,10,10,0.12)', borderRadius: 2, padding: 10, marginBottom: 10 },
  soundtrackTitle: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.35)', letterSpacing: 1.5, marginBottom: 8 },
  soundtrackGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  soundtrackBeat: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.55)', backgroundColor: 'rgba(10,10,10,0.05)', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 2 },

  // Foam Decompression
  shoeVisualWrap: { alignItems: 'center', marginBottom: 4, marginTop: -6 },

  decompSection: { marginBottom: 10, backgroundColor: 'rgba(6,182,212,0.06)', borderRadius: 10, padding: 10 },
  decompRunnerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  decompRunnerInfo: { flex: 1 },
  decompRunnerText: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.55)', letterSpacing: 0.8, lineHeight: 13, marginBottom: 4 },
  decompRunnerPct: { fontFamily: MONO, fontSize: 10, color: '#06B6D4', fontWeight: '900', letterSpacing: 1 },
  decompHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  decompLabel: { fontFamily: MONO, fontSize: 8, color: '#06B6D4', letterSpacing: 1.5 },
  decompTime: { fontFamily: MONO, fontSize: 8, color: '#06B6D4', fontWeight: '700' },
  decompBar: { height: 4, backgroundColor: 'rgba(6,182,212,0.15)', borderRadius: 2, overflow: 'hidden' },
  decompBarFill: { height: '100%', backgroundColor: '#06B6D4', borderRadius: 2 },

  // CPM
  cpmRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  cpmValue: { fontFamily: MONO, fontSize: 13, fontWeight: '900', letterSpacing: 0 },
  cpmTier: { fontFamily: MONO, fontSize: 8, letterSpacing: 1.5 },
  savingsRateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  savingsRateLabel: { fontFamily: MONO, fontSize: 8, color: LIME, letterSpacing: 1.5 },
  savingsRateValue: { fontFamily: MONO, fontSize: 11, color: LIME, fontWeight: '700', letterSpacing: 0 },

  // Shoe Fund
  fundSection: { marginHorizontal: 16, marginTop: 16 },
  fundTitle: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.35)', letterSpacing: 2, marginBottom: 10 },
  fundCard: { backgroundColor: INK, padding: 16, borderRadius: 2, borderWidth: 2, borderColor: INK },
  fundContribBadge: { backgroundColor: LIME, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 12, alignSelf: 'flex-start' },
  fundContribText: { fontFamily: MONO, fontSize: 9, color: INK, fontWeight: '900', letterSpacing: 1 },
  fundTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  fundBalance: { fontFamily: MONO, fontSize: 32, fontWeight: '900', color: LIME, letterSpacing: 0, lineHeight: 36 },
  fundBalanceLabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.4)', letterSpacing: 2, marginTop: 2 },
  fundGoalBadge: { alignItems: 'flex-end' },
  fundGoalBadgeLabel: { fontFamily: MONO, fontSize: 7, color: 'rgba(244,241,234,0.35)', letterSpacing: 2 },
  fundGoalBadgeName: { fontFamily: MONO, fontSize: 10, fontWeight: '900', color: PAPER, maxWidth: 140, textAlign: 'right' },
  fundGoalBadgePrice: { fontFamily: MONO, fontSize: 12, color: LIME, fontWeight: '700' },
  fundBar: { height: 6, backgroundColor: 'rgba(244,241,234,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  fundBarFill: { height: '100%', backgroundColor: LIME, borderRadius: 3 },
  fundProgress: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.45)', letterSpacing: 1 },
  fundHint: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.35)', lineHeight: 15 },

  // Draft Night
  draftPickRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  setGoalBtn: { paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1.5, borderColor: '#7C3AED', borderRadius: 2 },
  setGoalBtnActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  setGoalText: { fontFamily: MONO, fontSize: 7, color: '#7C3AED', letterSpacing: 1, fontWeight: '900' },
  setGoalTextActive: { color: PAPER },

  momentsSection: { marginBottom: 10 },
  momentsTitle: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.35)', letterSpacing: 1, marginBottom: 8 },
  momentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  momentDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT, marginTop: 5 },
  momentContent: { flex: 1 },
  momentCaption: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.55)', lineHeight: 15 },
  momentDate: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.25)', letterSpacing: 1, marginTop: 1 },
  draftCard: { backgroundColor: 'rgba(124,58,237,0.08)', borderLeftWidth: 3, borderLeftColor: '#7C3AED', padding: 12, borderRadius: 2, marginBottom: 10 },
  draftTitle: { fontFamily: MONO, fontSize: 8, color: '#7C3AED', fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
  draftPick: { marginBottom: 8 },
  draftRole: { fontFamily: MONO, fontSize: 7, color: 'rgba(10,10,10,0.35)', letterSpacing: 1.2, marginBottom: 2 },
  draftName: { fontFamily: MONO, fontSize: 10, color: INK, fontWeight: '900', marginBottom: 2 },
  draftReason: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.52)', lineHeight: 14 },

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
