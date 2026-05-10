import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Modal, StyleSheet,
  TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { SlideInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { saveRun, getRuns } from '../app/utils/runStorage';
import { Run, RunTerrain, RunPurpose, MatchQuality } from '../app/types/run';
import { calcMatchQuality, calcXP, MATCH_LABELS } from '../app/utils/matchQuality';
import { addXP, addMiles, getUserProfile } from '../app/utils/userProfile';
import { checkAndUnlockAchievements } from '../app/utils/achievementEngine';
import { calcRunBonuses, applyRunBonuses, RunBonusResult } from '../app/utils/runBonuses';
import { updateStreaksAfterRun } from '../app/utils/streakEngine';
import { SHOES, Shoe } from '../app/data/shoes';
import { getLocationPermStatus, getCurrentCoordinate, requestLocationPermission } from '../app/services/locationService';
import { updateTerritoryAfterRun } from '../app/utils/driftEngine';
import { Coordinate } from '../app/types/territory';

const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME   = '#D4FF00';
const MONO   = 'SpaceMono';

interface LogRunModalProps {
  visible: boolean;
  shoeId: string;
  shoeName: string;
  onClose: () => void;
  onSaved: () => void;
}

const TERRAIN_OPTIONS: { value: RunTerrain; label: string }[] = [
  { value: 'road',      label: 'Road' },
  { value: 'trail',     label: 'Trail' },
  { value: 'track',     label: 'Track' },
  { value: 'treadmill', label: 'Treadmill' },
];

const PURPOSE_OPTIONS: { value: RunPurpose; label: string; sublabel: string }[] = [
  { value: 'easy',     label: 'Easy',     sublabel: 'Recovery / base miles' },
  { value: 'long',     label: 'Long',     sublabel: '90+ min endurance' },
  { value: 'tempo',    label: 'Tempo',    sublabel: 'Comfortably hard' },
  { value: 'speed',    label: 'Speed',    sublabel: 'Intervals / reps' },
  { value: 'race',     label: 'Race',     sublabel: 'Full effort, event' },
  { value: 'recovery', label: 'Recovery', sublabel: 'Very easy, after hard day' },
  { value: 'walk',     label: 'Walk',     sublabel: 'Walking / hiking' },
];

const FEEL_OPTIONS = [
  { value: 1 as const, label: 'DEAD',  color: ACCENT },
  { value: 2 as const, label: 'OKAY',  color: '#D97706' },
  { value: 3 as const, label: 'FRESH', color: '#16A34A' },
];

export function LogRunModal({ visible, shoeId, shoeName, onClose, onSaved }: LogRunModalProps) {
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [terrain, setTerrain] = useState<RunTerrain>('road');
  const [purpose, setPurpose] = useState<RunPurpose>('easy');
  const [feel, setFeel] = useState<1 | 2 | 3 | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isBeginnerMode, setIsBeginnerMode] = useState(true);
  const [previousRuns, setPreviousRuns] = useState<Run[]>([]);
  const [bonusResult, setBonusResult] = useState<RunBonusResult | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'checking' | 'ready' | 'off' | 'denied'>('checking');
  const [capturedCoord, setCapturedCoord] = useState<Coordinate | null>(null);

  useEffect(() => {
    if (visible) {
      getUserProfile().then(p => setIsBeginnerMode(p.is_beginner_mode));
      getRuns().then(r => setPreviousRuns(r));
      // Check GPS and capture current position
      (async () => {
        setGpsStatus('checking');
        const status = await getLocationPermStatus();
        if (status === 'not_asked') {
          // Ask for permission if not yet asked
          const granted = await requestLocationPermission();
          if (granted !== 'granted') { setGpsStatus('denied'); return; }
        } else if (status === 'denied') {
          setGpsStatus('denied');
          return;
        }
        const coord = await getCurrentCoordinate();
        if (coord) {
          setCapturedCoord(coord);
          setGpsStatus('ready');
        } else {
          setGpsStatus('off');
        }
      })();
    }
  }, [visible]);

  const shoe = SHOES.find(s => s.id === shoeId);
  const distNum = parseFloat(distance) || 0;

  const matchQuality: MatchQuality | null = shoe && distNum > 0
    ? calcMatchQuality(shoe, terrain, purpose, distNum)
    : null;

  const baseXP = matchQuality ? calcXP(distNum, matchQuality, isBeginnerMode) : 0;

  // Recalculate bonuses whenever shoe or distance changes
  useEffect(() => {
    if (!shoeId || previousRuns.length === 0 && baseXP === 0) return;
    setBonusResult(calcRunBonuses(shoeId, previousRuns, isBeginnerMode));
  }, [shoeId, isBeginnerMode, previousRuns]);

  const xpPreview = bonusResult && baseXP > 0
    ? applyRunBonuses(baseXP, bonusResult)
    : baseXP;

  const matchInfo = matchQuality ? MATCH_LABELS[matchQuality] : null;

  const handleSave = async () => {
    if (!distNum || distNum <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Distance required', 'Enter how far you ran.');
      return;
    }

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const run: Run = {
      id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      shoeId,
      distanceKm: distNum,
      date: new Date().toISOString(),
      notes: notes.trim() || undefined,
      feel,
      terrain,
      purpose,
      durationMinutes: parseFloat(duration) || undefined,
      match_quality: matchQuality ?? 'neutral',
      xp_earned: xpPreview,
      source: 'manual',
      // Attach current GPS position if available
      coordinates: capturedCoord ? [capturedCoord] : undefined,
    };

    try {
      await saveRun(run);
      const miles = distNum * 0.621371;
      await addMiles(miles);
      if (xpPreview > 0) await addXP(xpPreview);
      // Streak recalc + season bonus XP
      const allRuns = await getRuns();
      const { seasonBonusXP } = await updateStreaksAfterRun(allRuns);
      if (seasonBonusXP > 0) await addXP(seasonBonusXP);
      await checkAndUnlockAchievements();
      // DRIFT territory — only fires when GPS trace has enough points (Strava runs)
      // For manual logs, single coord is stored but path detection skipped gracefully
      updateTerritoryAfterRun(run).catch(() => {});

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setDistance('');
      setDuration('');
      setTerrain('road');
      setPurpose('easy');
      setFeel(undefined);
      setNotes('');

      onSaved();
      onClose();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.eyebrow}>// LOG RUN</Text>
            <Text style={s.headerShoe}>{shoeName}</Text>
          </View>
          <View style={s.headerRight}>
            {/* GPS status pill */}
            <View style={[s.gpsPill, gpsStatus === 'ready' && s.gpsPillReady, gpsStatus === 'denied' && s.gpsPillDenied]}>
              <View style={[s.gpsDot,
                gpsStatus === 'ready'    ? s.gpsDotReady :
                gpsStatus === 'denied'   ? s.gpsDotDenied :
                gpsStatus === 'checking' ? s.gpsDotChecking : s.gpsDotOff
              ]} />
              <Text style={[s.gpsLabel,
                gpsStatus === 'ready'  ? { color: '#16A34A' } :
                gpsStatus === 'denied' ? { color: '#EF4444' } : {}
              ]}>
                {gpsStatus === 'ready'    ? 'GPS READY' :
                 gpsStatus === 'denied'   ? 'NO GPS' :
                 gpsStatus === 'checking' ? 'GPS...' : 'GPS OFF'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Ionicons name="close" size={22} color={INK} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Distance + Duration row */}
          <View style={s.row}>
            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>DISTANCE (KM)</Text>
              <TextInput
                style={s.input}
                value={distance}
                onChangeText={setDistance}
                placeholder="5.0"
                placeholderTextColor="rgba(10,10,10,0.3)"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>DURATION (MIN)</Text>
              <TextInput
                style={s.input}
                value={duration}
                onChangeText={setDuration}
                placeholder="30"
                placeholderTextColor="rgba(10,10,10,0.3)"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Terrain */}
          <Text style={s.sectionLabel}>SURFACE</Text>
          <View style={s.terrainRow}>
            {TERRAIN_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => { setTerrain(opt.value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[s.terrainChip, terrain === opt.value && s.terrainChipActive]}
              >
                <Text style={[s.terrainLabel, terrain === opt.value && s.terrainLabelActive]}>
                  {opt.label.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Purpose */}
          <Text style={s.sectionLabel}>RUN TYPE</Text>
          <View style={s.purposeGrid}>
            {PURPOSE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => { setPurpose(opt.value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[s.purposeChip, purpose === opt.value && s.purposeChipActive]}
              >
                <Text style={[s.purposeLabel, purpose === opt.value && s.purposeLabelActive]}>
                  {opt.label.toUpperCase()}
                </Text>
                <Text style={[s.purposeSublabel, purpose === opt.value && s.purposeSublabelActive]}>
                  {opt.sublabel}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Match quality preview */}
          {matchInfo && distNum > 0 && (
            <View style={[s.matchCard, { borderColor: matchInfo.color }]}>
              <View style={[s.matchDot, { backgroundColor: matchInfo.color }]} />
              <View style={s.matchText}>
                <Text style={[s.matchLabel, { color: matchInfo.color }]}>{matchInfo.label}</Text>
                <Text style={s.matchDesc}>{matchInfo.desc}</Text>
              </View>
              <View style={[s.xpBadge, { backgroundColor: matchInfo.color }]}>
                <Text style={s.xpBadgeText}>+{xpPreview} XP</Text>
              </View>
            </View>
          )}

          {/* Rotation penalty */}
          {bonusResult?.penaltyReason && (
            <View style={s.penaltyCard}>
              <Text style={s.penaltyText}>{bonusResult.penaltyReason}</Text>
            </View>
          )}

          {/* Discovery bonuses */}
          {bonusResult?.bonusReasons && bonusResult.bonusReasons.length > 0 && (
            <View style={s.bonusCard}>
              {bonusResult.bonusReasons.map((r, i) => (
                <View key={i} style={s.bonusRow}>
                  <Text style={s.bonusStar}>★</Text>
                  <Text style={s.bonusText}>{r}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Feel */}
          <Text style={s.sectionLabel}>HOW DID THE SHOE FEEL?</Text>
          <View style={s.feelRow}>
            {FEEL_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => { setFeel(feel === opt.value ? undefined : opt.value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[s.feelChip, feel === opt.value && { borderColor: opt.color, backgroundColor: opt.color + '15' }]}
              >
                <Text style={[s.feelLabel, feel === opt.value && { color: opt.color }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes */}
          <Text style={s.sectionLabel}>NOTES (OPTIONAL)</Text>
          <TextInput
            style={s.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="How was the run?"
            placeholderTextColor="rgba(10,10,10,0.3)"
            multiline
            numberOfLines={3}
          />

          {/* Save */}
          <View style={s.saveBtnWrap}>
            <View style={s.saveBtnShadow} />
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={[s.saveBtn, isSaving && { opacity: 0.6 }]}
            >
              <Text style={s.saveBtnText}>
                {isSaving ? 'SAVING...' : xpPreview > 0 ? `SAVE RUN — +${xpPreview} XP` : 'SAVE RUN'}
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 2, borderBottomColor: INK,
  },
  headerRight:      { alignItems: 'flex-end', gap: 8 },
  gpsPill:          { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(10,10,10,0.15)', backgroundColor: 'rgba(10,10,10,0.04)' },
  gpsPillReady:     { borderColor: '#16A34A', backgroundColor: 'rgba(22,163,74,0.07)' },
  gpsPillDenied:    { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.07)' },
  gpsDot:           { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(10,10,10,0.25)' },
  gpsDotReady:      { backgroundColor: '#16A34A' },
  gpsDotDenied:     { backgroundColor: '#EF4444' },
  gpsDotChecking:   { backgroundColor: '#F59E0B' },
  gpsDotOff:        { backgroundColor: 'rgba(10,10,10,0.2)' },
  gpsLabel:         { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 0.8 },
  eyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 4 },
  headerShoe: { fontSize: 18, fontWeight: '900', color: INK, letterSpacing: -0.3 },
  closeBtn: { padding: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  inputWrap: { flex: 1 },
  inputLabel: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 8 },
  input: { borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 14, fontSize: 18, fontWeight: '800', color: INK, textAlign: 'center' },
  sectionLabel: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 10 },
  terrainRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  terrainChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderWidth: 2, borderColor: 'rgba(10,10,10,0.2)', borderRadius: 2 },
  terrainChipActive: { borderColor: INK, backgroundColor: INK },
  terrainLabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.5)', letterSpacing: 1 },
  terrainLabelActive: { color: PAPER },
  purposeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  purposeChip: { paddingHorizontal: 12, paddingVertical: 10, borderWidth: 2, borderColor: 'rgba(10,10,10,0.2)', borderRadius: 2 },
  purposeChipActive: { borderColor: INK, backgroundColor: INK },
  purposeLabel: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: INK, letterSpacing: 0.5 },
  purposeLabelActive: { color: PAPER },
  purposeSublabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', marginTop: 2 },
  purposeSublabelActive: { color: 'rgba(244,241,234,0.5)' },
  matchCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: 2, padding: 12, marginBottom: 20, gap: 10 },
  matchDot: { width: 10, height: 10, borderRadius: 5 },
  matchText: { flex: 1 },
  matchLabel: { fontFamily: MONO, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  matchDesc: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.5)', marginTop: 2 },
  xpBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 2 },
  xpBadgeText: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: PAPER, letterSpacing: 1 },
  penaltyCard: { borderWidth: 2, borderColor: '#D97706', borderRadius: 2, padding: 10, marginBottom: 12, backgroundColor: 'rgba(217,119,6,0.06)' },
  penaltyText: { fontFamily: MONO, fontSize: 9, color: '#D97706', lineHeight: 15 },
  bonusCard: { borderWidth: 2, borderColor: LIME, borderRadius: 2, padding: 10, marginBottom: 12, backgroundColor: 'rgba(212,255,0,0.08)', gap: 4 },
  bonusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bonusStar: { fontSize: 10, color: INK },
  bonusText: { fontFamily: MONO, fontSize: 9, color: INK, flex: 1 },
  feelRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  feelChip: { flex: 1, alignItems: 'center', paddingVertical: 12, borderWidth: 2, borderColor: 'rgba(10,10,10,0.2)', borderRadius: 2 },
  feelLabel: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.5)', letterSpacing: 1 },
  notesInput: { borderWidth: 2, borderColor: 'rgba(10,10,10,0.2)', borderRadius: 2, padding: 14, fontSize: 13, color: INK, fontFamily: MONO, minHeight: 80, textAlignVertical: 'top', marginBottom: 24 },
  saveBtnWrap: { position: 'relative' },
  saveBtnShadow: { position: 'absolute', top: 5, left: 5, right: -5, bottom: -5, backgroundColor: INK, borderRadius: 2 },
  saveBtn: { backgroundColor: INK, paddingVertical: 18, borderRadius: 2, alignItems: 'center' },
  saveBtnText: { fontFamily: MONO, fontSize: 12, fontWeight: '700', color: PAPER, letterSpacing: 1.5 },
});
