import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { LogRunModal } from '../../components/LogRunModal';
import { GameStatBars } from '../../components/GameStatBars';
import { SHOES, Shoe } from '../data/shoes';
import { getFavorites, removeFromFavorites } from '../utils/storage';
import { getMileageForShoe } from '../utils/mileage';
import { getRuns } from '../utils/runStorage';
import { Run } from '../types/run';
import { deriveShoeStats, getExpectedLifespan, getLifecycleStatus, getUserLevel, TIER_COLORS } from '../utils/gameEngine';
import { getUserProfile, UserProfile, addXP } from '../utils/userProfile';
import { getGraveyard, addToGraveyard, getGraveyardStats, ShoeObituary } from '../utils/obituaryStorage';

const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME   = '#D4FF00';
const MONO   = 'SpaceMono';

type Tab = 'active' | 'graveyard' | 'roster';

// ─── Obituary form ────────────────────────────────────────────────────────────
interface ObituaryFormProps {
  shoe: Shoe;
  miles: number;
  addedDate: string;
  onSubmit: (obit: Partial<ShoeObituary>) => void;
  onCancel: () => void;
}

const OBITUARY_PROMPTS = [
  'What\'s one run you\'ll remember in these?',
  'Did these get you through anything hard?',
  'What was your longest run in these?',
  'First impression vs. final impression?',
];

const ObituaryForm: React.FC<ObituaryFormProps> = ({ shoe, miles, addedDate, onSubmit, onCancel }) => {
  const [memorable, setMemorable] = useState('');
  const [epitaph, setEpitaph] = useState('');
  const [rating, setRating] = useState<1|2|3|4|5>(4);
  const [buyAgain, setBuyAgain] = useState(true);

  const days = Math.max(1, Math.round((Date.now() - new Date(addedDate).getTime()) / 86400000));
  const prompt = OBITUARY_PROMPTS[Math.floor(Math.random() * OBITUARY_PROMPTS.length)];

  return (
    <View style={of.container}>
      <View style={of.header}>
        <Text style={of.eyebrow}>// RETIREMENT CEREMONY</Text>
        <Text style={of.title}>{shoe.brand} {shoe.model}</Text>
        <Text style={of.meta}>{miles.toFixed(0)} miles · {days} days in service</Text>
      </View>

      <ScrollView style={of.scroll} showsVerticalScrollIndicator={false}>
        <Text style={of.promptLabel}>{prompt}</Text>
        <TextInput
          style={of.textInput}
          value={memorable}
          onChangeText={setMemorable}
          placeholder="Your story here..."
          placeholderTextColor="rgba(10,10,10,0.3)"
          multiline
          maxLength={280}
        />

        <Text style={of.epitaphLabel}>EPITAPH — 80 chars max</Text>
        <TextInput
          style={of.epitaphInput}
          value={epitaph}
          onChangeText={setEpitaph}
          placeholder="They never quit..."
          placeholderTextColor="rgba(10,10,10,0.3)"
          maxLength={80}
        />

        <Text style={of.ratingLabel}>RATING</Text>
        <View style={of.ratingRow}>
          {([1, 2, 3, 4, 5] as const).map(n => (
            <TouchableOpacity key={n} onPress={() => setRating(n)} style={[of.star, rating >= n && of.starActive]}>
              <Text style={[of.starText, rating >= n && of.starTextActive]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={of.ratingLabel}>WOULD YOU BUY AGAIN?</Text>
        <View style={of.buyRow}>
          <TouchableOpacity onPress={() => setBuyAgain(true)} style={[of.buyBtn, buyAgain && of.buyBtnActive]}>
            <Text style={[of.buyBtnText, buyAgain && of.buyBtnTextActive]}>YES</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setBuyAgain(false)} style={[of.buyBtn, !buyAgain && of.buyBtnActive]}>
            <Text style={[of.buyBtnText, !buyAgain && of.buyBtnTextActive]}>NO</Text>
          </TouchableOpacity>
        </View>

        <View style={of.btnRow}>
          <TouchableOpacity onPress={onCancel} style={of.cancelBtn}>
            <Text style={of.cancelBtnText}>CANCEL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSubmit({ memorable_run: memorable, epitaph, rating, would_buy_again: buyAgain })}
            style={of.submitBtn}
          >
            <Text style={of.submitBtnText}>REST IN PEACE →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const of = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER, padding: 20 },
  header: { marginBottom: 24 },
  eyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '900', color: INK, letterSpacing: -0.5 },
  meta: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.4)', marginTop: 4 },
  scroll: { flex: 1 },
  promptLabel: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.5)', letterSpacing: 0.5, marginBottom: 8 },
  textInput: { borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 12, fontSize: 13, color: INK, fontFamily: MONO, minHeight: 80, marginBottom: 20, textAlignVertical: 'top' },
  epitaphLabel: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 8 },
  epitaphInput: { borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 12, fontSize: 13, color: INK, fontFamily: MONO, marginBottom: 20 },
  ratingLabel: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  star: { padding: 4 },
  starActive: {},
  starText: { fontSize: 24, color: 'rgba(10,10,10,0.2)' },
  starTextActive: { color: '#D97706' },
  buyRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  buyBtn: { flex: 1, paddingVertical: 12, borderWidth: 2, borderColor: INK, borderRadius: 2, alignItems: 'center' },
  buyBtnActive: { backgroundColor: INK },
  buyBtnText: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: INK, letterSpacing: 1 },
  buyBtnTextActive: { color: PAPER },
  btnRow: { flexDirection: 'row', gap: 10, paddingBottom: 40 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderWidth: 2, borderColor: INK, borderRadius: 2, alignItems: 'center' },
  cancelBtnText: { fontFamily: MONO, fontSize: 11, color: INK, letterSpacing: 1 },
  submitBtn: { flex: 2, paddingVertical: 14, backgroundColor: INK, borderRadius: 2, alignItems: 'center' },
  submitBtnText: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: PAPER, letterSpacing: 1.5 },
});

// ─── Tombstone card ───────────────────────────────────────────────────────────
const TombstoneCard: React.FC<{ obit: ShoeObituary }> = ({ obit }) => (
  <View style={tc.wrap}>
    <View style={tc.shadow} />
    <View style={tc.card}>
      <Text style={tc.cross}>✝</Text>
      <Text style={tc.brand}>{obit.brand.toUpperCase()}</Text>
      <Text style={tc.model}>{obit.model}</Text>
      {obit.epitaph ? (
        <Text style={tc.epitaph}>"{obit.epitaph}"</Text>
      ) : null}
      <View style={tc.divider} />
      <View style={tc.stats}>
        <Text style={tc.statVal}>{obit.total_miles.toFixed(0)} mi</Text>
        <Text style={tc.statSep}>·</Text>
        <Text style={tc.statVal}>{obit.days_in_service} days</Text>
        <Text style={tc.statSep}>·</Text>
        <View style={tc.stars}>
          {Array.from({ length: obit.rating }).map((_, i) => (
            <Text key={i} style={tc.star}>★</Text>
          ))}
        </View>
      </View>
      <Text style={tc.retired}>RETIRED {obit.retired_date}</Text>
      <TouchableOpacity style={tc.pourBtn}>
        <Text style={tc.pourText}>🥃 POUR ONE OUT</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const tc = StyleSheet.create({
  wrap: { position: 'relative', marginBottom: 20, marginHorizontal: 16 },
  shadow: { position: 'absolute', top: 6, left: 6, right: -6, bottom: -6, backgroundColor: INK, borderRadius: 2 },
  card: { backgroundColor: PAPER, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 20, alignItems: 'center' },
  cross: { fontSize: 28, color: 'rgba(10,10,10,0.2)', marginBottom: 8 },
  brand: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.4)', letterSpacing: 2 },
  model: { fontSize: 20, fontWeight: '900', color: INK, letterSpacing: -0.5, textAlign: 'center', marginTop: 2, marginBottom: 8 },
  epitaph: { fontFamily: MONO, fontSize: 11, color: 'rgba(10,10,10,0.55)', textAlign: 'center', lineHeight: 18, fontStyle: 'italic', marginBottom: 10, paddingHorizontal: 8 },
  divider: { height: 2, backgroundColor: INK, width: '100%', marginVertical: 12 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  statVal: { fontFamily: MONO, fontSize: 11, color: INK, fontWeight: '700' },
  statSep: { fontFamily: MONO, fontSize: 11, color: 'rgba(10,10,10,0.3)' },
  stars: { flexDirection: 'row' },
  star: { color: '#D97706', fontSize: 12 },
  retired: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.3)', letterSpacing: 1.5, marginBottom: 12 },
  pourBtn: { paddingHorizontal: 16, paddingVertical: 8, borderWidth: 2, borderColor: INK, borderRadius: 2 },
  pourText: { fontFamily: MONO, fontSize: 10, color: INK, letterSpacing: 1 },
});

// ─── Weekly Roster Picker ─────────────────────────────────────────────────────
const RosterPicker: React.FC<{
  favoriteShoes: Shoe[];
  roster: string[];
  locked: boolean;
  onSave: (ids: string[]) => void;
}> = ({ favoriteShoes, roster, locked, onSave }) => {
  const [selected, setSelected] = useState<string[]>(roster);

  const toggle = (id: string) => {
    if (locked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : prev.length < 3 ? [...prev, id] : prev
    );
  };

  return (
    <View style={rp.container}>
      <Text style={rp.title}>WEEKLY ROSTER</Text>
      <Text style={rp.sub}>Pick 3 shoes for this week's game. Locked Friday night.</Text>
      {locked && <View style={rp.lockedBanner}><Text style={rp.lockedText}>🔒 ROSTER LOCKED UNTIL SUNDAY</Text></View>}

      {favoriteShoes.map(shoe => {
        const stats = deriveShoeStats(shoe);
        const isSelected = selected.includes(shoe.id);
        return (
          <TouchableOpacity key={shoe.id} onPress={() => toggle(shoe.id)} style={[rp.row, isSelected && rp.rowSelected]}>
            <View style={rp.rowLeft}>
              <Text style={[rp.rowBrand, isSelected && rp.lightText]}>{shoe.brand}</Text>
              <Text style={[rp.rowModel, isSelected && rp.lightText]}>{shoe.model}</Text>
            </View>
            <View style={rp.rowRight}>
              <Text style={[rp.tierBadge, { color: TIER_COLORS[stats.tier] }]}>{stats.tier}</Text>
              <Text style={[rp.overall, isSelected && rp.lightText]}>{stats.overall}/10</Text>
            </View>
            {isSelected && <Text style={rp.check}>✓</Text>}
          </TouchableOpacity>
        );
      })}

      {!locked && (
        <TouchableOpacity onPress={() => onSave(selected)} style={rp.saveBtn} disabled={selected.length === 0}>
          <Text style={rp.saveBtnText}>
            {selected.length === 3 ? 'LOCK IN ROSTER →' : `SELECT ${3 - selected.length} MORE`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const rp = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: '900', color: INK, letterSpacing: -0.5, marginBottom: 4 },
  sub: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.4)', marginBottom: 16, lineHeight: 16 },
  lockedBanner: { backgroundColor: INK, padding: 10, borderRadius: 2, marginBottom: 16 },
  lockedText: { fontFamily: MONO, fontSize: 10, color: LIME, letterSpacing: 1.5, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 14, marginBottom: 10, backgroundColor: PAPER },
  rowSelected: { backgroundColor: INK },
  rowLeft: { flex: 1 },
  rowRight: { alignItems: 'flex-end', gap: 2 },
  rowBrand: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 1.5 },
  rowModel: { fontSize: 15, fontWeight: '800', color: INK },
  lightText: { color: PAPER },
  tierBadge: { fontFamily: MONO, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  overall: { fontFamily: MONO, fontSize: 12, fontWeight: '700', color: INK },
  check: { fontSize: 18, color: LIME, marginLeft: 10, fontWeight: '700' },
  saveBtn: { backgroundColor: INK, padding: 16, borderRadius: 2, alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontFamily: MONO, fontSize: 12, fontWeight: '700', color: PAPER, letterSpacing: 1.5 },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function ArsenalScreen() {
  const [tab, setTab] = useState<Tab>('active');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [graveyard, setGraveyard] = useState<ShoeObituary[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showLogRun, setShowLogRun] = useState(false);
  const [logRunShoe, setLogRunShoe] = useState<Shoe | null>(null);
  const [showObituaryForm, setShowObituaryForm] = useState(false);
  const [obituaryShoe, setObituaryShoe] = useState<Shoe | null>(null);
  const [obituaryAddedDate, setObituaryAddedDate] = useState('');

  const load = async () => {
    const [favs, allRuns, grave, prof] = await Promise.all([
      getFavorites(),
      getRuns(),
      getGraveyard(),
      getUserProfile(),
    ]);
    setFavoriteIds(favs);
    setRuns(allRuns);
    setGraveyard(grave);
    setProfile(prof);
    setIsLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const favoriteShoes = SHOES.filter(s => favoriteIds.includes(s.id));
  const graveyardStats = getGraveyardStats(graveyard);

  const handleRetire = (shoe: Shoe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setObituaryShoe(shoe);
    setObituaryAddedDate(new Date(Date.now() - 60 * 24 * 3600000).toISOString()); // estimate
    setShowObituaryForm(true);
  };

  const handleObituarySubmit = async (partial: Partial<ShoeObituary>) => {
    if (!obituaryShoe) return;
    const miles = getMileageForShoe(obituaryShoe.id, runs);
    const days = Math.max(1, Math.round((Date.now() - new Date(obituaryAddedDate).getTime()) / 86400000));

    const obit: ShoeObituary = {
      shoe_id: obituaryShoe.id,
      brand: obituaryShoe.brand,
      model: obituaryShoe.model,
      retired_date: new Date().toISOString().slice(0, 10),
      total_miles: miles,
      days_in_service: days,
      added_date: obituaryAddedDate,
      memorable_run: partial.memorable_run ?? '',
      best_moment: '',
      rating: partial.rating ?? 4,
      would_buy_again: partial.would_buy_again ?? true,
      epitaph: partial.epitaph ?? '',
    };

    await addToGraveyard(obit);
    await removeFromFavorites(obituaryShoe.id);
    await addXP(100); // FIRST GOODBYE achievement bonus

    setGraveyard(prev => [obit, ...prev]);
    setFavoriteIds(prev => prev.filter(id => id !== obituaryShoe.id));
    setShowObituaryForm(false);
    setObituaryShoe(null);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Retired', `${obituaryShoe.brand} ${obituaryShoe.model} has been laid to rest. +100 XP`);
  };

  const handleSaveRoster = async (ids: string[]) => {
    const { setWeeklyRoster } = await import('../utils/userProfile');
    await setWeeklyRoster(ids);
    await load();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ── Level bar ─────────────────────────────────────────────────────────────
  const renderLevelBar = () => {
    if (!profile) return null;
    const { current, progress } = getUserLevel(profile.total_xp);
    const next = current.level < 10 ? `${(current.next_xp! - profile.total_xp).toLocaleString()} XP to ${LEVELS_MAP[current.level + 1]}` : 'MAX LEVEL';
    return (
      <View style={ls.container}>
        <View style={ls.row}>
          <View style={ls.nameRow}>
            <Text style={ls.level}>LV.{current.level}</Text>
            <Text style={ls.name}>{current.name}</Text>
            {profile.is_beginner_mode && <View style={ls.beginnerTag}><Text style={ls.beginnerText}>BEGINNER MODE</Text></View>}
          </View>
          <Text style={ls.xp}>{profile.total_xp.toLocaleString()} XP</Text>
        </View>
        <View style={ls.barTrack}>
          <View style={[ls.barFill, { width: `${Math.round(progress * 100)}%` as any }]} />
        </View>
        <Text style={ls.next}>{next}</Text>
      </View>
    );
  };

  const LEVELS_MAP: Record<number, string> = { 2: 'ROOKIE', 3: 'REGULAR', 4: 'GRINDER', 5: 'VETERAN', 6: 'TACTICIAN', 7: 'STRATEGIST', 8: 'MASTER', 9: 'GRANDMASTER', 10: 'LEGEND' };

  if (isLoading) {
    return (
      <SafeAreaView style={s.container}>
        <Text style={s.loading}>LOADING ARSENAL...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.eyebrow}>// STRIDE PROTOCOL</Text>
        <Text style={s.title}>ARSENAL.</Text>
        {renderLevelBar()}
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {(['active', 'roster', 'graveyard'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => { setTab(t); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={[s.tabBtn, tab === t && s.tabBtnActive]}
          >
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === 'active' ? `ACTIVE (${favoriteShoes.length})` : t === 'graveyard' ? `GRAVEYARD (${graveyard.length})` : 'ROSTER'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── ACTIVE TAB ────────────────────────────────────────────── */}
      {tab === 'active' && (
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {favoriteShoes.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="layers-outline" size={48} color="rgba(10,10,10,0.2)" />
              <Text style={s.emptyTitle}>ARSENAL EMPTY</Text>
              <Text style={s.emptySub}>Run the Scout diagnostic and add shoes to your arsenal.</Text>
            </View>
          ) : (
            favoriteShoes.map((shoe, index) => {
              const miles = getMileageForShoe(shoe.id, runs);
              const stats = deriveShoeStats(shoe);
              const lifespan = getExpectedLifespan(shoe);
              const lifecycle = getLifecycleStatus(miles, lifespan);
              const tierColor = TIER_COLORS[stats.tier];

              return (
                <Animated.View key={shoe.id} entering={FadeInDown.delay(index * 80).springify()}>
                  <View style={s.shoeCard}>
                    <View style={s.shoeShadow} />
                    <View style={s.shoeInner}>
                      {/* Top row */}
                      <View style={s.cardTopRow}>
                        <View style={[s.tierTag, { backgroundColor: tierColor }]}>
                          <Text style={s.tierTagText}>{stats.tier.toUpperCase()}</Text>
                        </View>
                        <Text style={[s.lifecycleTag, { color: lifecycle.color }]}>{lifecycle.label}</Text>
                      </View>

                      {/* Brand + model */}
                      <Text style={s.brand}>{shoe.brand.toUpperCase()}</Text>
                      <Text style={s.model}>{shoe.model}</Text>

                      {/* Game stats */}
                      <GameStatBars stats={stats} />

                      {/* Lifecycle bar */}
                      <View style={s.lifebar}>
                        <View style={s.lifebarHeader}>
                          <Text style={s.lifebarLabel}>MILEAGE</Text>
                          <Text style={[s.lifebarVal, { color: lifecycle.color }]}>
                            {miles.toFixed(0)} / {lifespan} mi
                          </Text>
                        </View>
                        <View style={s.lifebarTrack}>
                          <View style={[s.lifebarFill, {
                            width: `${Math.min(lifecycle.pct, 1) * 100}%` as any,
                            backgroundColor: lifecycle.color,
                          }]} />
                        </View>
                        {lifecycle.alert && (
                          <Text style={[s.lifeAlert, { color: lifecycle.color }]}>{lifecycle.alert}</Text>
                        )}
                      </View>

                      {/* Spec row */}
                      <View style={s.specRow}>
                        {[
                          { val: `${shoe.specs.drop_mm}mm`, label: 'DROP' },
                          { val: `${shoe.specs.stack_heel_mm}mm`, label: 'STACK' },
                          { val: `${shoe.specs.weight_oz}oz`, label: 'WEIGHT' },
                        ].map((spec, i) => (
                          <View key={i} style={[s.specCell, i < 2 && s.specCellBorder]}>
                            <Text style={s.specVal}>{spec.val}</Text>
                            <Text style={s.specLabel}>/{spec.label}/</Text>
                          </View>
                        ))}
                      </View>

                      {/* Actions */}
                      <View style={s.actions}>
                        <TouchableOpacity
                          onPress={() => { setLogRunShoe(shoe); setShowLogRun(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                          style={s.actionPrimary}
                        >
                          <Text style={s.actionPrimaryText}>+ LOG RUN</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRetire(shoe)}
                          style={s.actionRetire}
                        >
                          <Text style={s.actionRetireText}>RETIRE ✝</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── ROSTER TAB ────────────────────────────────────────────── */}
      {tab === 'roster' && (
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <RosterPicker
            favoriteShoes={favoriteShoes}
            roster={profile?.weekly_roster ?? []}
            locked={profile?.weekly_roster_locked ?? false}
            onSave={handleSaveRoster}
          />
        </ScrollView>
      )}

      {/* ── GRAVEYARD TAB ─────────────────────────────────────────── */}
      {tab === 'graveyard' && (
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {graveyard.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.graveyardEmoji}>🪦</Text>
              <Text style={s.emptyTitle}>GRAVEYARD EMPTY</Text>
              <Text style={s.emptySub}>When a shoe runs its last mile, retire it here with a ceremony it deserves.</Text>
            </View>
          ) : (
            <>
              {/* Aggregate stats */}
              <View style={s.graveyardStats}>
                <Text style={s.graveyardStatsTitle}>// HALL OF RECORD</Text>
                <View style={s.graveyardStatsGrid}>
                  <View style={s.graveyardStatCell}>
                    <Text style={s.graveyardStatVal}>{graveyardStats.total_shoes}</Text>
                    <Text style={s.graveyardStatLabel}>RETIRED</Text>
                  </View>
                  <View style={s.graveyardStatCell}>
                    <Text style={s.graveyardStatVal}>{graveyardStats.total_miles.toLocaleString()}</Text>
                    <Text style={s.graveyardStatLabel}>TOTAL MI</Text>
                  </View>
                  <View style={s.graveyardStatCell}>
                    <Text style={s.graveyardStatVal}>{graveyardStats.avg_lifespan}</Text>
                    <Text style={s.graveyardStatLabel}>AVG MI</Text>
                  </View>
                </View>
                {graveyardStats.highest_miles && (
                  <Text style={s.graveyardHero}>
                    Legend: {graveyardStats.highest_miles.brand} {graveyardStats.highest_miles.model} · {graveyardStats.highest_miles.total_miles.toFixed(0)} mi
                  </Text>
                )}
              </View>

              {graveyard.map(obit => (
                <TombstoneCard key={obit.shoe_id} obit={obit} />
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* ── Log run modal ─────────────────────────────────────────── */}
      {logRunShoe && (
        <LogRunModal
          visible={showLogRun}
          shoeId={logRunShoe.id}
          shoeName={`${logRunShoe.brand} ${logRunShoe.model}`}
          onClose={() => { setShowLogRun(false); setLogRunShoe(null); }}
          onSaved={async () => {
            const allRuns = await getRuns();
            setRuns(allRuns);
            await addXP(10);
          }}
        />
      )}

      {/* ── Obituary form modal ───────────────────────────────────── */}
      <Modal visible={showObituaryForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: PAPER }}>
          {obituaryShoe && (
            <ObituaryForm
              shoe={obituaryShoe}
              miles={getMileageForShoe(obituaryShoe.id, runs)}
              addedDate={obituaryAddedDate}
              onSubmit={handleObituarySubmit}
              onCancel={() => { setShowObituaryForm(false); setObituaryShoe(null); }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const ls = StyleSheet.create({
  container: { marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  level: { fontFamily: MONO, fontSize: 10, color: ACCENT, fontWeight: '700', letterSpacing: 1 },
  name: { fontFamily: MONO, fontSize: 10, color: INK, fontWeight: '700', letterSpacing: 1.5 },
  beginnerTag: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: LIME, borderRadius: 2 },
  beginnerText: { fontFamily: MONO, fontSize: 7, color: INK, fontWeight: '700', letterSpacing: 1 },
  xp: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.4)' },
  barTrack: { height: 4, backgroundColor: 'rgba(10,10,10,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  barFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 2 },
  next: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.35)', letterSpacing: 0.5 },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  loading: { fontFamily: MONO, fontSize: 11, color: 'rgba(10,10,10,0.4)', textAlign: 'center', marginTop: 60, letterSpacing: 2 },
  header: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: INK },
  eyebrow: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 36, fontWeight: '900', color: INK, letterSpacing: -1 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: INK },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(10,10,10,0.2)' },
  tabBtnActive: { backgroundColor: INK },
  tabText: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 1 },
  tabTextActive: { color: PAPER, fontWeight: '700' },
  scrollContent: { paddingVertical: 20, paddingBottom: 80 },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  graveyardEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: INK, letterSpacing: -0.5, marginTop: 12, marginBottom: 6 },
  emptySub: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.4)', textAlign: 'center', lineHeight: 17 },

  shoeCard: { position: 'relative', marginBottom: 20, marginHorizontal: 16 },
  shoeShadow: { position: 'absolute', top: 6, left: 6, right: -6, bottom: -6, backgroundColor: INK, borderRadius: 2 },
  shoeInner: { backgroundColor: PAPER, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 18 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  tierTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 2 },
  tierTagText: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: PAPER, letterSpacing: 1.5 },
  lifecycleTag: { fontFamily: MONO, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  brand: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 2 },
  model: { fontSize: 20, fontWeight: '900', color: INK, letterSpacing: -0.5, marginBottom: 14 },

  lifebar: { marginBottom: 14 },
  lifebarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  lifebarLabel: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 1.5 },
  lifebarVal: { fontFamily: MONO, fontSize: 10, fontWeight: '700' },
  lifebarTrack: { height: 6, backgroundColor: 'rgba(10,10,10,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  lifebarFill: { height: '100%', borderRadius: 2 },
  lifeAlert: { fontFamily: MONO, fontSize: 9, lineHeight: 14, letterSpacing: 0.3 },

  specRow: { flexDirection: 'row', borderWidth: 2, borderColor: INK, borderRadius: 2, marginBottom: 14, overflow: 'hidden' },
  specCell: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  specCellBorder: { borderRightWidth: 2, borderRightColor: INK },
  specVal: { fontSize: 13, fontWeight: '800', color: INK },
  specLabel: { fontFamily: MONO, fontSize: 7, color: 'rgba(10,10,10,0.4)', letterSpacing: 1, marginTop: 1 },

  actions: { flexDirection: 'row', gap: 10 },
  actionPrimary: { flex: 2, backgroundColor: INK, paddingVertical: 12, borderRadius: 2, alignItems: 'center' },
  actionPrimaryText: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: PAPER, letterSpacing: 1.5 },
  actionRetire: { flex: 1, borderWidth: 2, borderColor: 'rgba(10,10,10,0.3)', paddingVertical: 12, borderRadius: 2, alignItems: 'center' },
  actionRetireText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.4)', letterSpacing: 1 },

  graveyardStats: { marginHorizontal: 16, marginBottom: 20, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 16 },
  graveyardStatsTitle: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 12 },
  graveyardStatsGrid: { flexDirection: 'row' },
  graveyardStatCell: { flex: 1, alignItems: 'center' },
  graveyardStatVal: { fontSize: 22, fontWeight: '900', color: INK, letterSpacing: -0.5 },
  graveyardStatLabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 1.5, marginTop: 2 },
  graveyardHero: { fontFamily: MONO, fontSize: 9, color: ACCENT, marginTop: 12, letterSpacing: 0.5, textAlign: 'center' },
});
