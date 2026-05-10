/**
 * LiveRunModal — Real-time GPS run tracker.
 *
 * Flow:
 *   IDLE → tap START → RUNNING (timer + GPS live) → tap PAUSE → PAUSED
 *   PAUSED → RESUME → RUNNING
 *   RUNNING/PAUSED → STOP → SUMMARY (shoe + terrain + purpose) → SAVE → done
 *
 * GPS: uses locationService.startRunTracking / stopRunTracking
 * Distance: haversine sum of Coordinate[] trace (recalculated every 5s)
 * DRIFT: calls updateTerritoryAfterRun() on save if trace has ≥5 points
 * XP: attributed at save time via addXP + addMiles
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Easing, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  startRunTracking,
  stopRunTracking,
  traceDistanceKm,
  getLocationPermStatus,
  requestLocationPermission,
} from '../app/services/locationService';
import { saveRun } from '../app/utils/runStorage';
import { addMiles, addXP } from '../app/utils/userProfile';
import { updateTerritoryAfterRun } from '../app/utils/driftEngine';
import { getFavorites } from '../app/utils/storage';
import { SHOES } from '../app/data/shoes';
import { Run, RunTerrain, RunPurpose } from '../app/types/run';
import { Coordinate } from '../app/types/territory';

const INK   = '#0A0A0A';
const PAPER = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME  = '#D4FF00';
const MONO  = 'SpaceMono';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatPace(km: number, secs: number): string {
  if (km < 0.05) return '--:--';
  const secsPerKm = secs / km;
  const secsPerMile = secsPerKm * 1.60934;
  const m = Math.floor(secsPerMile / 60);
  const s = Math.round(secsPerMile % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function kmToMi(km: number): string {
  return (km * 0.621371).toFixed(2);
}

// ─── Pulsing ring animation ───────────────────────────────────────────────────

function PulseRing({ active }: { active: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!active) { scale.setValue(1); opacity.setValue(0); return; }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1.4, duration: 1000, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
          Animated.timing(opacity, { toValue: 0,   duration: 1000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [active]);

  return (
    <View style={pr.wrap}>
      <Animated.View style={[pr.ring, { transform: [{ scale }], opacity }]} />
    </View>
  );
}

const pr = StyleSheet.create({
  wrap: { position: 'absolute', width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  ring: { width: 200, height: 200, borderRadius: 100, borderWidth: 2, borderColor: ACCENT },
});

// ─── Split row ────────────────────────────────────────────────────────────────

function SplitRow({ mile, time, pace }: { mile: number; time: string; pace: string }) {
  return (
    <View style={sp.row}>
      <Text style={sp.mile}>MILE {mile}</Text>
      <Text style={sp.time}>{time}</Text>
      <Text style={sp.pace}>{pace} /mi</Text>
    </View>
  );
}

const sp = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(244,241,234,0.1)' },
  mile: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.4)', letterSpacing: 1.5, width: 60 },
  time: { flex: 1, fontFamily: MONO, fontSize: 11, color: PAPER, letterSpacing: 0.5 },
  pace: { fontFamily: MONO, fontSize: 11, color: LIME, letterSpacing: 0.5 },
});

// ─── Types ────────────────────────────────────────────────────────────────────

type RunState = 'idle' | 'running' | 'paused' | 'summary';

interface Split {
  mile:  number;
  time:  string; // cumulative time at this mile
  pace:  string; // pace for this mile
  secs:  number; // cumulative seconds at this mile
}

interface Props {
  visible:  boolean;
  onClose:  () => void;
  onSaved?: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LiveRunModal({ visible, onClose, onSaved }: Props) {
  const [runState, setRunState]         = useState<RunState>('idle');
  const [elapsed, setElapsed]           = useState(0);       // total seconds (excl. paused time)
  const [distanceKm, setDistanceKm]     = useState(0);
  const [trace, setTrace]               = useState<Coordinate[]>([]);
  const [splits, setSplits]             = useState<Split[]>([]);
  const [splitMilesTracked, setSplitMilesTracked] = useState(0); // last mile split recorded

  // Summary form
  const [selectedShoe, setSelectedShoe] = useState<string>('');
  const [terrain, setTerrain]           = useState<RunTerrain>('road');
  const [purpose, setPurpose]           = useState<RunPurpose>('easy');
  const [arsenalIds, setArsenalIds]     = useState<string[]>([]);
  const [saving, setSaving]             = useState(false);

  // Refs for interval + split tracking
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef   = useRef(0);
  const prevMilesRef = useRef(0);
  const prevSecsRef  = useRef(0);

  // ── Load arsenal on open ───────────────────────────────────────────────────

  useEffect(() => {
    if (visible) {
      getFavorites().then(ids => {
        setArsenalIds(ids);
        if (ids.length > 0) setSelectedShoe(ids[0]);
      });
    } else {
      resetAll();
    }
  }, [visible]);

  // ── Timer ──────────────────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(async () => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);

      // Update distance every 5 seconds
      if (elapsedRef.current % 5 === 0) {
        const currentTrace = await stopRunTracking();
        // Restart immediately (stopRunTracking just flushes buffer, not subscription)
        await startRunTracking();
        setTrace(prev => {
          const merged = [...prev, ...currentTrace];
          const km = traceDistanceKm(merged);
          setDistanceKm(km);

          // Mile split detection
          const miles = km * 0.621371;
          const newMile = Math.floor(miles);
          if (newMile > prevMilesRef.current) {
            const splitSecs  = elapsedRef.current - prevSecsRef.current;
            const splitPace  = formatPace(1 / 0.621371, splitSecs); // 1 mile in km
            const cumulative = formatTime(elapsedRef.current);
            setSplits(s => [...s, {
              mile:  newMile,
              time:  cumulative,
              pace:  splitPace,
              secs:  elapsedRef.current,
            }]);
            prevMilesRef.current = newMile;
            prevSecsRef.current  = elapsedRef.current;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          return merged;
        });
      }
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // ── Controls ───────────────────────────────────────────────────────────────

  const handleStart = async () => {
    // Check GPS permission
    const perm = await getLocationPermStatus();
    if (perm !== 'granted') {
      const result = await requestLocationPermission();
      if (result !== 'granted') {
        Alert.alert('GPS Required', 'Enable location access to track your run distance and route.');
        return;
      }
    }

    const started = await startRunTracking();
    if (!started) {
      Alert.alert('GPS unavailable', 'Could not start GPS tracking. Check location permissions in Settings.');
      return;
    }

    elapsedRef.current   = 0;
    prevMilesRef.current = 0;
    prevSecsRef.current  = 0;
    setElapsed(0);
    setDistanceKm(0);
    setTrace([]);
    setSplits([]);
    setSplitMilesTracked(0);
    setRunState('running');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    startTimer();
  };

  const handlePause = async () => {
    stopTimer();
    const chunk = await stopRunTracking();
    setTrace(prev => [...prev, ...chunk]);
    setRunState('paused');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleResume = async () => {
    const started = await startRunTracking();
    if (!started) { Alert.alert('GPS error', 'Could not resume tracking.'); return; }
    setRunState('running');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    startTimer();
  };

  const handleStop = async () => {
    stopTimer();
    const chunk = await stopRunTracking();
    const finalTrace = [...trace, ...chunk];
    const finalKm = traceDistanceKm(finalTrace);
    setTrace(finalTrace);
    setDistanceKm(finalKm);
    setRunState('summary');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (distanceKm < 0.1) {
      Alert.alert('Too short', 'Run at least 0.1 km before saving.');
      return;
    }
    setSaving(true);
    try {
      const xpEarned = Math.round(Math.min(distanceKm, 20) * 10);
      const run: Run = {
        id:              `run_live_${Date.now()}`,
        shoeId:          selectedShoe,
        distanceKm,
        date:            new Date().toISOString(),
        terrain,
        purpose,
        durationMinutes: Math.round(elapsed / 60),
        match_quality:   'neutral',
        xp_earned:       xpEarned,
        source:          'manual',
        coordinates:     trace.length >= 5 ? trace : undefined,
      };

      await saveRun(run);
      await addMiles(distanceKm * 0.621371);
      await addXP(xpEarned);

      if (trace.length >= 5) {
        updateTerritoryAfterRun(run).catch(() => {});
      }

      onSaved?.();
      onClose();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Save failed', 'Could not save the run. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    Alert.alert('Discard run?', 'This run will not be saved.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => { resetAll(); onClose(); } },
    ]);
  };

  const resetAll = () => {
    stopTimer();
    stopRunTracking().catch(() => {});
    setRunState('idle');
    setElapsed(0);
    setDistanceKm(0);
    setTrace([]);
    setSplits([]);
    elapsedRef.current   = 0;
    prevMilesRef.current = 0;
    prevSecsRef.current  = 0;
  };

  const currentPace  = formatPace(distanceKm, elapsed);
  const milesDisplay = kmToMi(distanceKm);
  const arsenalShoes = SHOES.filter(s => arsenalIds.includes(s.id));

  // ── SUMMARY SCREEN ─────────────────────────────────────────────────────────
  if (runState === 'summary') {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={[s.root, { backgroundColor: INK }]}>
          <View style={s.summaryHeader}>
            <Text style={s.summaryEyebrow}>// RUN COMPLETE</Text>
            <Text style={s.summaryTitle}>NICE WORK.</Text>
          </View>

          <ScrollView contentContainerStyle={s.summaryCnt} showsVerticalScrollIndicator={false}>
            {/* Stats */}
            <View style={s.statRow}>
              <View style={s.statBox}>
                <Text style={s.statVal}>{milesDisplay}</Text>
                <Text style={s.statLbl}>MILES</Text>
              </View>
              <View style={s.statBox}>
                <Text style={s.statVal}>{formatTime(elapsed)}</Text>
                <Text style={s.statLbl}>TIME</Text>
              </View>
              <View style={s.statBox}>
                <Text style={s.statVal}>{currentPace}</Text>
                <Text style={s.statLbl}>AVG PACE</Text>
              </View>
            </View>

            {/* Splits */}
            {splits.length > 0 && (
              <View style={s.splitsBox}>
                <Text style={s.splitsTitle}>MILE SPLITS</Text>
                {splits.map(sp => (
                  <SplitRow key={sp.mile} mile={sp.mile} time={sp.time} pace={sp.pace} />
                ))}
              </View>
            )}

            {/* Shoe picker */}
            <Text style={s.sectionLbl}>SHOE USED</Text>
            {arsenalShoes.length === 0 ? (
              <Text style={s.emptyShoe}>No shoes in your Arsenal — add shoes first to attribute mileage.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.shoeScroll}>
                {arsenalShoes.map(shoe => (
                  <TouchableOpacity
                    key={shoe.id}
                    onPress={() => setSelectedShoe(shoe.id)}
                    style={[s.shoeChip, selectedShoe === shoe.id && s.shoeChipActive]}
                  >
                    <Text style={[s.shoeChipText, selectedShoe === shoe.id && s.shoeChipTextActive]} numberOfLines={1}>
                      {shoe.brand} {shoe.model}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Terrain */}
            <Text style={s.sectionLbl}>TERRAIN</Text>
            <View style={s.chipRow}>
              {(['road', 'trail', 'track', 'treadmill'] as RunTerrain[]).map(t => (
                <TouchableOpacity key={t} onPress={() => setTerrain(t)} style={[s.chip, terrain === t && s.chipActive]}>
                  <Text style={[s.chipTxt, terrain === t && s.chipTxtActive]}>{t.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Purpose */}
            <Text style={s.sectionLbl}>PURPOSE</Text>
            <View style={s.chipRow}>
              {(['easy', 'tempo', 'long', 'race', 'walk'] as RunPurpose[]).map(p => (
                <TouchableOpacity key={p} onPress={() => setPurpose(p)} style={[s.chip, purpose === p && s.chipActive]}>
                  <Text style={[s.chipTxt, purpose === p && s.chipTxtActive]}>{p.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* XP preview */}
            <View style={s.xpPreview}>
              <Text style={s.xpPreviewTxt}>+{Math.round(Math.min(distanceKm, 20) * 10)} XP</Text>
              <Text style={s.xpPreviewSub}>will be credited on save</Text>
            </View>

            {/* Save / Discard */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={[s.saveBtn, saving && { opacity: 0.6 }]}
            >
              <Text style={s.saveBtnTxt}>{saving ? 'SAVING...' : 'SAVE RUN'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDiscard} style={s.discardBtn}>
              <Text style={s.discardTxt}>DISCARD RUN</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }

  // ── ACTIVE RUN SCREEN ──────────────────────────────────────────────────────
  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <SafeAreaView style={[s.root, { backgroundColor: INK }]}>

        {/* Header */}
        <View style={s.runHeader}>
          <Text style={s.runEyebrow}>// STRIDE PROTOCOL</Text>
          {runState !== 'idle' && (
            <TouchableOpacity onPress={handleDiscard} style={s.runDiscard}>
              <Text style={s.runDiscardTxt}>DISCARD</Text>
            </TouchableOpacity>
          )}
          {runState === 'idle' && (
            <TouchableOpacity onPress={onClose} style={s.runDiscard}>
              <Ionicons name="close" size={20} color="rgba(244,241,234,0.4)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Status indicator */}
        <View style={s.statusRow}>
          <View style={[s.statusDot, {
            backgroundColor: runState === 'running' ? ACCENT
              : runState === 'paused' ? '#F59E0B' : 'rgba(244,241,234,0.2)'
          }]} />
          <Text style={s.statusTxt}>
            {runState === 'running' ? 'TRACKING' : runState === 'paused' ? 'PAUSED' : 'READY'}
          </Text>
        </View>

        {/* Central display */}
        <View style={s.centerArea}>
          {runState !== 'idle' && <PulseRing active={runState === 'running'} />}

          {/* Distance */}
          <View style={s.distanceBlock}>
            <Text style={s.distanceMi}>{milesDisplay}</Text>
            <Text style={s.distanceLbl}>MILES</Text>
          </View>

          {/* Time + Pace row */}
          {runState !== 'idle' && (
            <View style={s.metricsRow}>
              <View style={s.metricBox}>
                <Text style={s.metricVal}>{formatTime(elapsed)}</Text>
                <Text style={s.metricLbl}>TIME</Text>
              </View>
              <View style={s.metricDivider} />
              <View style={s.metricBox}>
                <Text style={s.metricVal}>{currentPace}</Text>
                <Text style={s.metricLbl}>PACE /mi</Text>
              </View>
            </View>
          )}

          {/* Live splits ticker */}
          {splits.length > 0 && (
            <View style={s.splitTicker}>
              <Text style={s.splitTickerTxt}>
                MILE {splits[splits.length - 1].mile} — {splits[splits.length - 1].pace} /mi
              </Text>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={s.controls}>
          {runState === 'idle' && (
            <TouchableOpacity onPress={handleStart} style={s.startBtn} activeOpacity={0.85}>
              <Ionicons name="play" size={28} color={INK} />
              <Text style={s.startBtnTxt}>START RUN</Text>
            </TouchableOpacity>
          )}

          {runState === 'running' && (
            <View style={s.activeControls}>
              <TouchableOpacity onPress={handlePause} style={s.pauseBtn} activeOpacity={0.85}>
                <Ionicons name="pause" size={24} color={PAPER} />
                <Text style={s.ctrlTxt}>PAUSE</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleStop} style={s.stopBtn} activeOpacity={0.85}>
                <Ionicons name="stop" size={24} color={INK} />
                <Text style={[s.ctrlTxt, { color: INK }]}>FINISH</Text>
              </TouchableOpacity>
            </View>
          )}

          {runState === 'paused' && (
            <View style={s.activeControls}>
              <TouchableOpacity onPress={handleResume} style={s.resumeBtn} activeOpacity={0.85}>
                <Ionicons name="play" size={24} color={INK} />
                <Text style={[s.ctrlTxt, { color: INK }]}>RESUME</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleStop} style={s.stopBtn} activeOpacity={0.85}>
                <Ionicons name="stop" size={24} color={INK} />
                <Text style={[s.ctrlTxt, { color: INK }]}>FINISH</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Info note */}
        {runState === 'idle' && (
          <Text style={s.gpsNote}>
            GPS will track your route and distance. Keep screen on for best accuracy.
          </Text>
        )}

      </SafeAreaView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: INK },

  // Run screen
  runHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4,
  },
  runEyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2 },
  runDiscard: { padding: 4 },
  runDiscardTxt: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.35)', letterSpacing: 1 },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusTxt: { fontFamily: MONO, fontSize: 10, color: 'rgba(244,241,234,0.5)', letterSpacing: 2 },

  centerArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  distanceBlock: { alignItems: 'center', zIndex: 1 },
  distanceMi: { fontSize: 88, fontWeight: '900', color: PAPER, letterSpacing: -4, lineHeight: 92 },
  distanceLbl: { fontFamily: MONO, fontSize: 11, color: 'rgba(244,241,234,0.4)', letterSpacing: 3, marginTop: 2 },

  metricsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 32, gap: 0 },
  metricBox: { alignItems: 'center', paddingHorizontal: 28 },
  metricVal: { fontFamily: MONO, fontSize: 22, fontWeight: '700', color: LIME, letterSpacing: 0 },
  metricLbl: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.35)', letterSpacing: 2, marginTop: 4 },
  metricDivider: { width: 1, height: 36, backgroundColor: 'rgba(244,241,234,0.1)' },

  splitTicker: {
    marginTop: 20, paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: 'rgba(212,255,0,0.1)', borderRadius: 2, borderWidth: 1, borderColor: 'rgba(212,255,0,0.3)',
  },
  splitTickerTxt: { fontFamily: MONO, fontSize: 10, color: LIME, letterSpacing: 1.5 },

  controls: { paddingHorizontal: 24, paddingBottom: 16, gap: 12 },

  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: ACCENT, paddingVertical: 20, borderRadius: 4,
  },
  startBtnTxt: { fontFamily: MONO, fontSize: 16, fontWeight: '900', color: INK, letterSpacing: 2 },

  activeControls: { flexDirection: 'row', gap: 12 },
  pauseBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 2, borderColor: PAPER, paddingVertical: 16, borderRadius: 4,
  },
  resumeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: LIME, paddingVertical: 16, borderRadius: 4,
  },
  stopBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: LIME, paddingVertical: 16, borderRadius: 4,
  },
  ctrlTxt: { fontFamily: MONO, fontSize: 12, fontWeight: '700', color: PAPER, letterSpacing: 1.5 },

  gpsNote: {
    fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.25)', textAlign: 'center',
    paddingHorizontal: 32, paddingBottom: 20, lineHeight: 16,
  },

  // Summary screen
  summaryHeader: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(244,241,234,0.1)' },
  summaryEyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 4 },
  summaryTitle: { fontSize: 36, fontWeight: '900', color: PAPER, letterSpacing: -1 },
  summaryCnt: { padding: 24, paddingBottom: 60, gap: 4 },

  statRow: { flexDirection: 'row', gap: 0, marginBottom: 24 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRightWidth: 1, borderRightColor: 'rgba(244,241,234,0.1)' },
  statVal: { fontFamily: MONO, fontSize: 22, fontWeight: '700', color: LIME, letterSpacing: -0.5 },
  statLbl: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.4)', letterSpacing: 2, marginTop: 4 },

  splitsBox: { backgroundColor: 'rgba(244,241,234,0.04)', borderRadius: 2, padding: 14, marginBottom: 20 },
  splitsTitle: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.3)', letterSpacing: 2, marginBottom: 10 },

  sectionLbl: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.4)', letterSpacing: 2, marginTop: 16, marginBottom: 10 },
  emptyShoe: { fontFamily: MONO, fontSize: 10, color: 'rgba(244,241,234,0.4)', lineHeight: 17 },

  shoeScroll: { maxHeight: 48, marginBottom: 8 },
  shoeChip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(244,241,234,0.2)', borderRadius: 2, marginRight: 8, maxWidth: 150 },
  shoeChipActive: { borderColor: LIME, backgroundColor: 'rgba(212,255,0,0.1)' },
  shoeChipText: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.6)' },
  shoeChipTextActive: { color: LIME },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(244,241,234,0.2)', borderRadius: 2 },
  chipActive: { borderColor: LIME, backgroundColor: 'rgba(212,255,0,0.1)' },
  chipTxt: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.5)', letterSpacing: 1 },
  chipTxtActive: { color: LIME },

  xpPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(212,255,0,0.08)', borderRadius: 2, padding: 14, marginTop: 20, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(212,255,0,0.25)',
  },
  xpPreviewTxt: { fontFamily: MONO, fontSize: 18, fontWeight: '700', color: LIME },
  xpPreviewSub: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.4)' },

  saveBtn: { backgroundColor: ACCENT, paddingVertical: 18, borderRadius: 2, alignItems: 'center', marginTop: 16 },
  saveBtnTxt: { fontFamily: MONO, fontSize: 14, fontWeight: '900', color: PAPER, letterSpacing: 2 },
  discardBtn: { paddingVertical: 14, alignItems: 'center' },
  discardTxt: { fontFamily: MONO, fontSize: 10, color: 'rgba(244,241,234,0.3)', letterSpacing: 1 },
});
