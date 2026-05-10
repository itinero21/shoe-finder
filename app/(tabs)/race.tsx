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

import {
  Race, RaceDistance, DISTANCE_LABELS, DISTANCE_KM,
  getRaces, saveRace, deleteRace, completeRace, daysUntil,
} from '../utils/raceStorage';
import { getFavorites } from '../utils/storage';
import { SHOES, Shoe } from '../data/shoes';

const INK   = '#0A0A0A';
const PAPER = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME  = '#D4FF00';
const MONO  = 'SpaceMono';

// ── Shoe recommendation for a given race ─────────────────────────────────────
function recommendShoeForRace(race: Race, arsenalIds: string[]): Shoe | null {
  const candidates = SHOES.filter(s => arsenalIds.includes(s.id));
  if (candidates.length === 0) return null;

  const km = DISTANCE_KM[race.distance];
  const isTrail = race.terrain === 'trail';
  const isLong  = km >= 21;
  const isRace  = km >= 5;

  const scored = candidates.map(shoe => {
    let score = 0;
    if (isTrail && shoe.use_cases.some(u => u.startsWith('trail'))) score += 4;
    if (!isTrail && !shoe.use_cases.some(u => u.startsWith('trail'))) score += 2;
    if (isRace && shoe.category === 'carbon_racer') score += 3;
    if (isRace && shoe.category === 'super_trainer') score += 2;
    if (isLong && (shoe.category.startsWith('max_cushion') || shoe.category.startsWith('neutral'))) score += 1;
    if (km <= 10 && shoe.category === 'lightweight_speed') score += 2;
    score += shoe.biomech.energy_return * 0.2;
    return { shoe, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.shoe ?? null;
}

// ── Add/Edit Race Modal ───────────────────────────────────────────────────────
interface RaceFormProps {
  race?: Race;
  arsenalShoes: Shoe[];
  onSave: (race: Race) => void;
  onCancel: () => void;
}

const DISTANCES: RaceDistance[] = ['5k','10k','half','marathon','ultra_50k','ultra_100k','other'];

const RaceForm: React.FC<RaceFormProps> = ({ race, arsenalShoes, onSave, onCancel }) => {
  const [name, setName] = useState(race?.name ?? '');
  const [date, setDate] = useState(race?.date ?? '');
  const [distance, setDistance] = useState<RaceDistance>(race?.distance ?? 'half');
  const [terrain, setTerrain] = useState<'road'|'trail'|'track'>(race?.terrain ?? 'road');
  const [goalTime, setGoalTime] = useState(race?.goal_time ?? '');
  const [shoeId, setShoeId] = useState(race?.shoe_id ?? '');
  const [notes, setNotes] = useState(race?.notes ?? '');

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Race name required'); return; }
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Invalid date', 'Use format YYYY-MM-DD'); return;
    }
    onSave({
      id: race?.id ?? `race_${Date.now()}`,
      name: name.trim(),
      date,
      distance,
      terrain,
      goal_time: goalTime.trim() || undefined,
      shoe_id: shoeId || undefined,
      notes: notes.trim() || undefined,
      completed: race?.completed ?? false,
      finish_time: race?.finish_time,
    });
  };

  return (
    <ScrollView style={rf.scroll} contentContainerStyle={rf.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={rf.label}>RACE NAME</Text>
      <TextInput style={rf.input} value={name} onChangeText={setName} placeholder="e.g. Chicago Marathon" placeholderTextColor="rgba(10,10,10,0.3)" />

      <Text style={rf.label}>DATE (YYYY-MM-DD)</Text>
      <TextInput style={rf.input} value={date} onChangeText={setDate} placeholder="2026-10-11" placeholderTextColor="rgba(10,10,10,0.3)" keyboardType="numbers-and-punctuation" />

      <Text style={rf.label}>DISTANCE</Text>
      <View style={rf.chipGrid}>
        {DISTANCES.map(d => (
          <TouchableOpacity key={d} onPress={() => setDistance(d)} style={[rf.chip, distance === d && rf.chipActive]}>
            <Text style={[rf.chipText, distance === d && rf.chipTextActive]}>{DISTANCE_LABELS[d]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={rf.label}>TERRAIN</Text>
      <View style={rf.row}>
        {(['road','trail','track'] as const).map(t => (
          <TouchableOpacity key={t} onPress={() => setTerrain(t)} style={[rf.chip, rf.chipWide, terrain === t && rf.chipActive]}>
            <Text style={[rf.chipText, terrain === t && rf.chipTextActive]}>{t.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={rf.label}>GOAL TIME (OPTIONAL)</Text>
      <TextInput style={rf.input} value={goalTime} onChangeText={setGoalTime} placeholder="3:45:00" placeholderTextColor="rgba(10,10,10,0.3)" />

      {arsenalShoes.length > 0 && (
        <>
          <Text style={rf.label}>RACE SHOE (FROM YOUR ARSENAL)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={rf.shoeScroll}>
            <TouchableOpacity
              onPress={() => setShoeId('')}
              style={[rf.shoeChip, !shoeId && rf.shoeChipActive]}
            >
              <Text style={[rf.shoeChipText, !shoeId && rf.shoeChipTextActive]}>AUTO</Text>
            </TouchableOpacity>
            {arsenalShoes.map(shoe => (
              <TouchableOpacity
                key={shoe.id}
                onPress={() => setShoeId(shoe.id)}
                style={[rf.shoeChip, shoeId === shoe.id && rf.shoeChipActive]}
              >
                <Text style={[rf.shoeChipText, shoeId === shoe.id && rf.shoeChipTextActive]} numberOfLines={1}>
                  {shoe.model}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      <Text style={rf.label}>NOTES (OPTIONAL)</Text>
      <TextInput style={[rf.input, rf.inputMultiline]} value={notes} onChangeText={setNotes} placeholder="Course details, goals, etc." placeholderTextColor="rgba(10,10,10,0.3)" multiline />

      <View style={rf.actions}>
        <TouchableOpacity onPress={onCancel} style={rf.cancelBtn}>
          <Text style={rf.cancelText}>CANCEL</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={rf.saveBtn}>
          <Text style={rf.saveText}>SAVE RACE</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function RaceScreen() {
  const [races, setRaces] = useState<Race[]>([]);
  const [arsenalIds, setArsenalIds] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editRace, setEditRace] = useState<Race | undefined>(undefined);
  const [tab, setTab] = useState<'upcoming'|'completed'>('upcoming');

  const load = async () => {
    const [r, favs] = await Promise.all([getRaces(), getFavorites()]);
    setRaces(r);
    setArsenalIds(favs);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const arsenalShoes = SHOES.filter(s => arsenalIds.includes(s.id));
  const upcoming  = races.filter(r => !r.completed).sort((a, b) => a.date.localeCompare(b.date));
  const completed = races.filter(r => r.completed).sort((a, b) => b.date.localeCompare(a.date));
  const displayed = tab === 'upcoming' ? upcoming : completed;

  const handleSave = async (race: Race) => {
    await saveRace(race);
    setShowForm(false);
    setEditRace(undefined);
    await load();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(`Delete "${name}"?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteRace(id); await load(); } },
    ]);
  };

  const handleComplete = async (race: Race) => {
    Alert.alert(`Mark "${race.name}" as done?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Complete', onPress: async () => {
          await completeRace(race.id);
          await load();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      },
    ]);
  };

  const getDaysLabel = (days: number, completed: boolean): { text: string; color: string } => {
    if (completed) return { text: 'DONE', color: '#16A34A' };
    if (days < 0) return { text: `${Math.abs(days)}D AGO`, color: 'rgba(10,10,10,0.3)' };
    if (days === 0) return { text: 'TODAY', color: ACCENT };
    if (days <= 7) return { text: `${days}D`, color: ACCENT };
    if (days <= 30) return { text: `${days}D`, color: '#D97706' };
    return { text: `${days}D`, color: 'rgba(10,10,10,0.5)' };
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.eyebrow}>// STRIDE PROTOCOL</Text>
            <Text style={s.title}>RACE CAL.</Text>
          </View>
          <TouchableOpacity
            onPress={() => { setEditRace(undefined); setShowForm(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
            style={s.addBtn}
          >
            <Ionicons name="add" size={20} color={PAPER} />
            <Text style={s.addBtnText}>ADD RACE</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.subtitle}>
          {upcoming.length} upcoming · {completed.length} completed
        </Text>
      </View>

      {/* Tabs */}
      <View style={s.tabBar}>
        {(['upcoming','completed'] as const).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => { setTab(t); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={[s.tabBtn, tab === t && s.tabBtnActive]}
          >
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === 'upcoming' ? `UPCOMING (${upcoming.length})` : `COMPLETED (${completed.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {displayed.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>
              {tab === 'upcoming' ? 'NO UPCOMING RACES' : 'NO COMPLETED RACES'}
            </Text>
            <Text style={s.emptyDesc}>
              {tab === 'upcoming'
                ? 'Add a race to start planning your training block.'
                : 'Completed races will appear here.'}
            </Text>
            {tab === 'upcoming' && (
              <TouchableOpacity
                onPress={() => { setEditRace(undefined); setShowForm(true); }}
                style={s.emptyBtn}
              >
                <Text style={s.emptyBtnText}>+ ADD RACE</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          displayed.map((race, i) => {
            const days = daysUntil(race.date);
            const dayLabel = getDaysLabel(days, race.completed);
            const raceShoe = race.shoe_id
              ? SHOES.find(sh => sh.id === race.shoe_id)
              : recommendShoeForRace(race, arsenalIds);
            const isRecommended = !race.shoe_id && !!raceShoe;

            return (
              <Animated.View key={race.id} entering={FadeInDown.delay(i * 60).springify()}>
                <View style={[s.card, race.completed && s.cardDone]}>
                  {/* Header row */}
                  <View style={s.cardHeader}>
                    <View style={s.cardHeaderLeft}>
                      <Text style={s.cardName}>{race.name}</Text>
                      <Text style={s.cardMeta}>
                        {DISTANCE_LABELS[race.distance]} · {race.terrain.toUpperCase()} · {race.date}
                      </Text>
                    </View>
                    <View style={[s.daysBadge, { borderColor: dayLabel.color }]}>
                      <Text style={[s.daysText, { color: dayLabel.color }]}>{dayLabel.text}</Text>
                    </View>
                  </View>

                  {/* Goal time */}
                  {race.goal_time && (
                    <View style={s.goalRow}>
                      <Text style={s.goalLabel}>GOAL</Text>
                      <Text style={s.goalTime}>{race.goal_time}</Text>
                      {race.finish_time && (
                        <>
                          <Text style={s.goalLabel}>ACTUAL</Text>
                          <Text style={[s.goalTime, { color: '#16A34A' }]}>{race.finish_time}</Text>
                        </>
                      )}
                    </View>
                  )}

                  {/* Shoe recommendation */}
                  {raceShoe && (
                    <View style={[s.shoeRec, isRecommended && s.shoeRecAuto]}>
                      <View style={s.shoeRecLeft}>
                        <Text style={s.shoeRecLabel}>
                          {isRecommended ? 'RECOMMENDED' : 'RACE SHOE'}
                        </Text>
                        <Text style={s.shoeRecName}>{raceShoe.brand} {raceShoe.model}</Text>
                      </View>
                      <Text style={s.shoeRecCat}>{raceShoe.category.replace(/_/g, ' ').toUpperCase()}</Text>
                    </View>
                  )}

                  {race.notes && <Text style={s.cardNotes}>{race.notes}</Text>}

                  {/* Actions */}
                  <View style={s.cardActions}>
                    {!race.completed && (
                      <TouchableOpacity onPress={() => handleComplete(race)} style={s.actionBtn}>
                        <Text style={s.actionBtnText}>DONE</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => { setEditRace(race); setShowForm(true); }}
                      style={[s.actionBtn, s.actionBtnEdit]}
                    >
                      <Text style={s.actionBtnEditText}>EDIT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(race.id, race.name)}
                      style={[s.actionBtn, s.actionBtnDelete]}
                    >
                      <Ionicons name="trash-outline" size={14} color={ACCENT} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: PAPER }}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editRace ? 'EDIT RACE' : 'NEW RACE'}</Text>
            <TouchableOpacity onPress={() => { setShowForm(false); setEditRace(undefined); }}>
              <Ionicons name="close" size={22} color={INK} />
            </TouchableOpacity>
          </View>
          <RaceForm
            race={editRace}
            arsenalShoes={arsenalShoes}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditRace(undefined); }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  header: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: INK },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 32, fontWeight: '900', color: INK, letterSpacing: -1 },
  subtitle: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.5)', marginTop: 6 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: INK, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 2, marginTop: 4 },
  addBtnText: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: PAPER, letterSpacing: 1 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: INK },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(10,10,10,0.2)' },
  tabBtnActive: { backgroundColor: INK },
  tabText: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 1 },
  tabTextActive: { color: PAPER, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 60 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontFamily: MONO, fontSize: 12, fontWeight: '700', color: INK, marginBottom: 8, letterSpacing: 1 },
  emptyDesc: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.5)', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  emptyBtn: { borderWidth: 2, borderColor: INK, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: INK, letterSpacing: 1.5 },
  card: { borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 14, marginBottom: 14 },
  cardDone: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardHeaderLeft: { flex: 1, marginRight: 10 },
  cardName: { fontSize: 17, fontWeight: '900', color: INK, letterSpacing: -0.3, marginBottom: 4 },
  cardMeta: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.5)', letterSpacing: 0.5 },
  daysBadge: { borderWidth: 2, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 2, minWidth: 56, alignItems: 'center' },
  daysText: { fontFamily: MONO, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' },
  goalLabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 1.5 },
  goalTime: { fontFamily: MONO, fontSize: 13, fontWeight: '700', color: INK },
  shoeRec: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 2, borderColor: 'rgba(10,10,10,0.2)', borderRadius: 2, padding: 10, marginBottom: 10 },
  shoeRecAuto: { borderColor: LIME, backgroundColor: 'rgba(212,255,0,0.08)' },
  shoeRecLeft: {},
  shoeRecLabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 1.5, marginBottom: 3 },
  shoeRecName: { fontSize: 13, fontWeight: '800', color: INK },
  shoeRecCat: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.3)', letterSpacing: 1 },
  cardNotes: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.5)', marginBottom: 10, lineHeight: 15 },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: INK, borderRadius: 2 },
  actionBtnText: { fontFamily: MONO, fontSize: 9, fontWeight: '700', color: PAPER, letterSpacing: 1 },
  actionBtnEdit: { backgroundColor: 'transparent', borderWidth: 2, borderColor: INK },
  actionBtnEditText: { fontFamily: MONO, fontSize: 9, fontWeight: '700', color: INK, letterSpacing: 1 },
  actionBtnDelete: { backgroundColor: 'transparent', borderWidth: 2, borderColor: ACCENT, paddingHorizontal: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 2, borderBottomColor: INK },
  modalTitle: { fontFamily: MONO, fontSize: 13, fontWeight: '700', color: INK, letterSpacing: 1.5 },
});

const rf = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  label: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 12, fontSize: 15, color: INK, fontFamily: MONO },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 2, borderColor: 'rgba(10,10,10,0.2)', borderRadius: 2 },
  chipWide: { flex: 1, alignItems: 'center' },
  chipActive: { backgroundColor: INK, borderColor: INK },
  chipText: { fontFamily: MONO, fontSize: 10, color: INK, letterSpacing: 0.5 },
  chipTextActive: { color: PAPER },
  shoeScroll: { marginBottom: 4 },
  shoeChip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 2, borderColor: 'rgba(10,10,10,0.2)', borderRadius: 2, marginRight: 8, maxWidth: 140 },
  shoeChipActive: { backgroundColor: INK, borderColor: INK },
  shoeChipText: { fontFamily: MONO, fontSize: 9, color: INK },
  shoeChipTextActive: { color: PAPER },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderWidth: 2, borderColor: 'rgba(10,10,10,0.3)', borderRadius: 2, alignItems: 'center' },
  cancelText: { fontFamily: MONO, fontSize: 11, color: 'rgba(10,10,10,0.5)', letterSpacing: 1 },
  saveBtn: { flex: 2, paddingVertical: 14, backgroundColor: INK, borderRadius: 2, alignItems: 'center' },
  saveText: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: PAPER, letterSpacing: 1.5 },
});
