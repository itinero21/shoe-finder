/**
 * LiveRunModal — Real-time GPS run tracker with full data integration.
 *
 * Features:
 *   - Live GPS map with route polyline (react-native-maps)
 *   - Connection status bar: GPS · Apple Watch · Strava · Garmin
 *   - Mile splits with haptic feedback
 *   - Summary: shoe, terrain, purpose, feel, run notes/comment
 *   - Upload to Strava after save (if connected)
 *   - All data saved locally (AsyncStorage) + Supabase (cloud)
 *
 * Flow:
 *   IDLE → START → RUNNING (live map + metrics) → PAUSE/RESUME → FINISH
 *   FINISH → SUMMARY (form + notes + Strava upload) → SAVE → done
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Easing, Alert, Platform, TextInput,
  KeyboardAvoidingView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps';

import {
  startRunTracking, stopRunTracking, traceDistanceKm,
  getLocationPermStatus, requestLocationPermission, getCurrentCoordinate,
} from '../app/services/locationService';
import { saveRun } from '../app/utils/runStorage';
import { addMiles, addXP } from '../app/utils/userProfile';
import { updateTerritoryAfterRun } from '../app/utils/driftEngine';
import { getFavorites } from '../app/utils/storage';
import { getStravaTokens, uploadRunToStrava, StravaTokens } from '../app/services/stravaService';
import { getHealthPermStatus } from '../app/services/healthService';
import { getWatchStatus } from '../app/services/watchService';
import { SHOES } from '../app/data/shoes';
import { Run, RunTerrain, RunPurpose } from '../app/types/run';
import { Coordinate } from '../app/types/territory';

// ─── Constants ────────────────────────────────────────────────────────────────

const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME   = '#D4FF00';
const MONO   = 'SpaceMono';
const GREEN  = '#16A34A';
const AMBER  = '#F59E0B';

// Dark map style for running screen
const DARK_MAP_STYLE = [
  { elementType: 'geometry',                  stylers: [{ color: '#0a0a1a' }] },
  { elementType: 'labels.text.fill',          stylers: [{ color: '#4a5568' }] },
  { elementType: 'labels.text.stroke',        stylers: [{ color: '#0a0a1a' }] },
  { featureType: 'road',       elementType: 'geometry',        stylers: [{ color: '#1a1a3e' }] },
  { featureType: 'road',       elementType: 'geometry.stroke', stylers: [{ color: '#0a0a2a' }] },
  { featureType: 'road',       elementType: 'labels.text.fill',stylers: [{ color: '#6b7280' }] },
  { featureType: 'road.highway', elementType: 'geometry',      stylers: [{ color: '#2d2d5e' }] },
  { featureType: 'water',      elementType: 'geometry',        stylers: [{ color: '#070714' }] },
  { featureType: 'landscape',  elementType: 'geometry',        stylers: [{ color: '#0d0d1f' }] },
  { featureType: 'poi',        elementType: 'geometry',        stylers: [{ color: '#111124' }] },
  { featureType: 'transit',    elementType: 'geometry',        stylers: [{ color: '#0a0a1a' }] },
];

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
  const secsPerMile = (secs / km) * 1.60934;
  const m = Math.floor(secsPerMile / 60);
  const s = Math.round(secsPerMile % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function kmToMi(km: number): string { return (km * 0.621371).toFixed(2); }

function getBoundingRegion(trace: Coordinate[]) {
  if (trace.length === 0) return null;
  const lats = trace.map(c => c.lat);
  const lngs = trace.map(c => c.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const padLat = Math.max((maxLat - minLat) * 0.3, 0.004);
  const padLng = Math.max((maxLng - minLng) * 0.3, 0.004);
  return {
    latitude:       (minLat + maxLat) / 2,
    longitude:      (minLng + maxLng) / 2,
    latitudeDelta:  (maxLat - minLat) + padLat,
    longitudeDelta: (maxLng - minLng) + padLng,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PulseRing({ active }: { active: boolean }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!active) { scale.setValue(1); opacity.setValue(0); return; }
    const anim = Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(scale,   { toValue: 1.5, duration: 1200, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.timing(opacity, { toValue: 0,   duration: 1200, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(scale,   { toValue: 1,   duration: 0, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
      ]),
    ]));
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
  wrap: { position: 'absolute', width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  ring: { width: 160, height: 160, borderRadius: 80, borderWidth: 2, borderColor: ACCENT },
});

function SplitRow({ mile, time, pace }: { mile: number; time: string; pace: string }) {
  return (
    <View style={sp.row}>
      <Text style={sp.mile}>MI {mile}</Text>
      <Text style={sp.time}>{time}</Text>
      <Text style={sp.pace}>{pace} /mi</Text>
    </View>
  );
}

const sp = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(244,241,234,0.08)' },
  mile: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.4)', letterSpacing: 1.5, width: 40 },
  time: { flex: 1, fontFamily: MONO, fontSize: 11, color: PAPER, letterSpacing: 0.5 },
  pace: { fontFamily: MONO, fontSize: 11, color: LIME, letterSpacing: 0.5 },
});

/** Badge showing connection status of a single data source */
function ConnBadge({
  icon, label, status,
}: {
  icon: React.ReactNode;
  label: string;
  status: 'connected' | 'partial' | 'off';
}) {
  const dotColor = status === 'connected' ? GREEN : status === 'partial' ? AMBER : 'rgba(244,241,234,0.2)';
  return (
    <View style={cb.badge}>
      <View style={[cb.dot, { backgroundColor: dotColor }]} />
      {icon}
      <Text style={cb.label}>{label}</Text>
    </View>
  );
}

const cb = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:   { width: 6, height: 6, borderRadius: 3 },
  label: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.5)', letterSpacing: 0.5 },
});

// ─── Types ────────────────────────────────────────────────────────────────────

type RunState = 'idle' | 'running' | 'paused' | 'summary';

interface Split {
  mile:  number;
  time:  string;
  pace:  string;
  secs:  number;
}

interface Props {
  visible:  boolean;
  onClose:  () => void;
  onSaved?: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LiveRunModal({ visible, onClose, onSaved }: Props) {
  // ── Run state ────────────────────────────────────────────────────────────────
  const [runState, setRunState]     = useState<RunState>('idle');
  const [elapsed, setElapsed]       = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [trace, setTrace]           = useState<Coordinate[]>([]);
  const [splits, setSplits]         = useState<Split[]>([]);
  const [mapCenter, setMapCenter]   = useState<{ latitude: number; longitude: number } | null>(null);

  // ── Summary form ─────────────────────────────────────────────────────────────
  const [selectedShoe, setSelectedShoe] = useState('');
  const [terrain, setTerrain]           = useState<RunTerrain>('road');
  const [purpose, setPurpose]           = useState<RunPurpose>('easy');
  const [feel, setFeel]                 = useState<1|2|3>(2);
  const [notes, setNotes]               = useState('');
  const [arsenalIds, setArsenalIds]     = useState<string[]>([]);

  // ── Integrations ─────────────────────────────────────────────────────────────
  const [gpsGranted, setGpsGranted]       = useState(false);
  const [stravaTokens, setStravaTokens]   = useState<StravaTokens | null>(null);
  const [watchConnected, setWatchConnected] = useState(false);
  const [uploadToStrava, setUploadToStrava] = useState(false);

  // ── Save state ───────────────────────────────────────────────────────────────
  const [saving, setSaving]                   = useState(false);
  const [stravaUploading, setStravaUploading] = useState(false);
  const [stravaUploadDone, setStravaUploadDone] = useState<boolean | null>(null); // null=not done, true=ok, false=fail

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef    = useRef(0);
  const prevMilesRef  = useRef(0);
  const prevSecsRef   = useRef(0);
  const mapRef        = useRef<MapView>(null);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const polylineCoords = useMemo(
    () => trace.map(c => ({ latitude: c.lat, longitude: c.lng })),
    [trace]
  );
  const currentPace    = formatPace(distanceKm, elapsed);
  const milesDisplay   = kmToMi(distanceKm);
  const arsenalShoes   = SHOES.filter(s => arsenalIds.includes(s.id));
  const summaryRegion  = useMemo(() => getBoundingRegion(trace), [trace]);

  // ── Load connections + arsenal when modal opens ───────────────────────────────

  useEffect(() => {
    if (!visible) { resetAll(); return; }

    (async () => {
      const [favs, perm, tokens, healthPerm, watchStatus] = await Promise.all([
        getFavorites(),
        getLocationPermStatus(),
        getStravaTokens(),
        getHealthPermStatus(),
        getWatchStatus(),
      ]);

      setArsenalIds(favs);
      if (favs.length > 0) setSelectedShoe(favs[0]);
      setGpsGranted(perm === 'granted');
      setStravaTokens(tokens);
      if (tokens) setUploadToStrava(true); // default ON if connected

      const watchOk = watchStatus.appleWatchDetected || watchStatus.garminViaStrava;
      setWatchConnected(watchOk);
    })();
  }, [visible]);

  // ── Animate map to latest GPS point ─────────────────────────────────────────

  useEffect(() => {
    if (trace.length === 0 || runState !== 'running') return;
    const last = trace[trace.length - 1];
    mapRef.current?.animateToRegion({
      latitude:       last.lat,
      longitude:      last.lng,
      latitudeDelta:  0.005,
      longitudeDelta: 0.005,
    }, 800);
  }, [trace]);

  // ── Timer ─────────────────────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(async () => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);

      // Flush GPS buffer every 5 seconds
      if (elapsedRef.current % 5 === 0) {
        const chunk = await stopRunTracking();
        await startRunTracking();

        setTrace(prev => {
          const merged = [...prev, ...chunk];
          const km = traceDistanceKm(merged);
          setDistanceKm(km);

          // Mile split detection
          const miles  = km * 0.621371;
          const newMile = Math.floor(miles);
          if (newMile > prevMilesRef.current && newMile > 0) {
            const splitSecs = elapsedRef.current - prevSecsRef.current;
            const cumTime   = formatTime(elapsedRef.current);
            const splitPace = formatPace(1 / 0.621371, splitSecs);
            setSplits(s => [...s, { mile: newMile, time: cumTime, pace: splitPace, secs: elapsedRef.current }]);
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

  // ── Controls ─────────────────────────────────────────────────────────────────

  const handleStart = async () => {
    let perm = await getLocationPermStatus();
    if (perm !== 'granted') {
      perm = await requestLocationPermission();
      if (perm !== 'granted') {
        Alert.alert('GPS Required', 'Enable Location access to track your route and distance.');
        return;
      }
      setGpsGranted(true);
    }

    // Get starting location for map center
    const pos = await getCurrentCoordinate();
    if (pos) {
      setMapCenter({ latitude: pos.lat, longitude: pos.lng });
    }

    const started = await startRunTracking();
    if (!started) {
      Alert.alert('GPS unavailable', 'Could not start GPS. Check Location permissions in Settings.');
      return;
    }

    elapsedRef.current   = 0;
    prevMilesRef.current = 0;
    prevSecsRef.current  = 0;
    setElapsed(0);
    setDistanceKm(0);
    setTrace([]);
    setSplits([]);
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
    setTrace(finalTrace);
    setDistanceKm(traceDistanceKm(finalTrace));
    setRunState('summary');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  // ── Save + Strava upload ──────────────────────────────────────────────────────

  const handleSave = async () => {
    if (distanceKm < 0.1) {
      Alert.alert('Too short', 'Run at least 0.1 km before saving.');
      return;
    }
    setSaving(true);

    try {
      const xpEarned   = Math.round(Math.min(distanceKm, 20) * 10);
      const runId      = `run_live_${Date.now()}`;
      const run: Run = {
        id:              runId,
        shoeId:          selectedShoe,
        distanceKm,
        date:            new Date().toISOString(),
        terrain,
        purpose,
        feel,
        notes:           notes.trim() || undefined,
        durationMinutes: Math.round(elapsed / 60),
        match_quality:   'neutral',
        xp_earned:       xpEarned,
        source:          'manual',
        coordinates:     trace.length >= 5 ? trace : undefined,
      };

      // 1. Save locally + to Supabase
      await saveRun(run);
      await addMiles(distanceKm * 0.621371);
      await addXP(xpEarned);

      // 2. DRIFT territory update (fire-and-forget)
      if (trace.length >= 5) {
        updateTerritoryAfterRun(run).catch(() => {});
      }

      setSaving(false);

      // 3. Strava upload (if opted in)
      if (uploadToStrava && stravaTokens) {
        setStravaUploading(true);
        const result = await uploadRunToStrava(run);
        setStravaUploading(false);
        setStravaUploadDone(result.success);

        if (!result.success) {
          Alert.alert(
            'Strava upload failed',
            result.error ?? 'Could not upload to Strava. Run is still saved in Stride.',
            [{ text: 'OK' }]
          );
        }

        // Small delay so user sees the Strava result badge
        await new Promise(r => setTimeout(r, 1200));
      }

      onSaved?.();
      onClose();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setSaving(false);
      Alert.alert('Save failed', 'Could not save the run. Try again.');
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
    setNotes('');
    setFeel(2);
    setStravaUploadDone(null);
    setStravaUploading(false);
    elapsedRef.current   = 0;
    prevMilesRef.current = 0;
    prevSecsRef.current  = 0;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SUMMARY SCREEN
  // ─────────────────────────────────────────────────────────────────────────────

  if (runState === 'summary') {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={[s.root, { backgroundColor: INK }]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Header */}
            <View style={s.summaryHeader}>
              <View>
                <Text style={s.summaryEyebrow}>// RUN COMPLETE</Text>
                <Text style={s.summaryTitle}>NICE WORK.</Text>
              </View>
              {stravaUploading && (
                <View style={s.stravaUploadBadge}>
                  <Text style={s.stravaUploadBadgeTxt}>UPLOADING TO STRAVA…</Text>
                </View>
              )}
              {stravaUploadDone === true && (
                <View style={[s.stravaUploadBadge, { borderColor: GREEN }]}>
                  <Ionicons name="checkmark-circle" size={12} color={GREEN} />
                  <Text style={[s.stravaUploadBadgeTxt, { color: GREEN }]}>ON STRAVA</Text>
                </View>
              )}
              {stravaUploadDone === false && (
                <View style={[s.stravaUploadBadge, { borderColor: ACCENT }]}>
                  <Ionicons name="alert-circle" size={12} color={ACCENT} />
                  <Text style={[s.stravaUploadBadgeTxt, { color: ACCENT }]}>STRAVA FAILED</Text>
                </View>
              )}
            </View>

            <ScrollView
              contentContainerStyle={s.summaryCnt}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
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

              {/* Route map (if GPS trace available) */}
              {trace.length >= 5 && summaryRegion && (
                <View style={s.summaryMapWrap}>
                  <Text style={s.sectionLbl}>YOUR ROUTE</Text>
                  <MapView
                    style={s.summaryMap}
                    provider={PROVIDER_DEFAULT}
                    initialRegion={summaryRegion}
                    customMapStyle={DARK_MAP_STYLE}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    pitchEnabled={false}
                    rotateEnabled={false}
                    userInterfaceStyle="dark"
                  >
                    <Polyline
                      coordinates={polylineCoords}
                      strokeColor={ACCENT}
                      strokeWidth={3}
                    />
                  </MapView>
                  <View style={s.summaryMapOverlay}>
                    <Text style={s.summaryMapStat}>{trace.length} GPS pts</Text>
                  </View>
                </View>
              )}

              {/* Mile splits */}
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
                <Text style={s.emptyShoe}>Add shoes to your Arsenal to attribute mileage.</Text>
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
                {(['easy', 'tempo', 'long', 'race', 'recovery'] as RunPurpose[]).map(p => (
                  <TouchableOpacity key={p} onPress={() => setPurpose(p)} style={[s.chip, purpose === p && s.chipActive]}>
                    <Text style={[s.chipTxt, purpose === p && s.chipTxtActive]}>{p.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Feel */}
              <Text style={s.sectionLbl}>HOW DID IT FEEL?</Text>
              <View style={s.feelRow}>
                {([
                  { val: 1, label: '💀 DEAD',   desc: 'Struggled' },
                  { val: 2, label: '😐 OKAY',   desc: 'Got through it' },
                  { val: 3, label: '⚡ FRESH',  desc: 'Could do more' },
                ] as { val: 1|2|3; label: string; desc: string }[]).map(f => (
                  <TouchableOpacity
                    key={f.val}
                    onPress={() => { Haptics.selectionAsync(); setFeel(f.val); }}
                    style={[s.feelCard, feel === f.val && s.feelCardActive]}
                  >
                    <Text style={[s.feelLabel, feel === f.val && { color: LIME }]}>{f.label}</Text>
                    <Text style={s.feelDesc}>{f.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Notes */}
              <Text style={s.sectionLbl}>RUN NOTES</Text>
              <TextInput
                style={s.notesInput}
                placeholder="How was the run? Legs feeling good? Weather? Anything to remember…"
                placeholderTextColor="rgba(244,241,234,0.2)"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
              {notes.length > 0 && (
                <Text style={s.notesCount}>{500 - notes.length} chars left</Text>
              )}

              {/* Watch data notice */}
              {watchConnected && (
                <View style={s.watchNotice}>
                  <Ionicons name="watch-outline" size={14} color={LIME} />
                  <Text style={s.watchNoticeTxt}>
                    Apple Watch / Garmin data will sync automatically on next watch sync.
                  </Text>
                </View>
              )}

              {/* Strava upload toggle */}
              {stravaTokens && (
                <View style={s.stravaToggle}>
                  <View style={s.stravaToggleLeft}>
                    <View style={s.stravaLogoBox}>
                      <Text style={s.stravaLogoTxt}>S</Text>
                    </View>
                    <View>
                      <Text style={s.stravaToggleTitle}>UPLOAD TO STRAVA</Text>
                      <Text style={s.stravaToggleSub}>Post this run to your Strava profile</Text>
                    </View>
                  </View>
                  <Switch
                    value={uploadToStrava}
                    onValueChange={setUploadToStrava}
                    trackColor={{ false: 'rgba(244,241,234,0.1)', true: ACCENT }}
                    thumbColor={uploadToStrava ? PAPER : 'rgba(244,241,234,0.4)'}
                  />
                </View>
              )}

              {/* XP preview */}
              <View style={s.xpPreview}>
                <Text style={s.xpPreviewTxt}>+{Math.round(Math.min(distanceKm, 20) * 10)} XP</Text>
                <Text style={s.xpPreviewSub}>credited on save</Text>
              </View>

              {/* Save button */}
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving || stravaUploading}
                style={[s.saveBtn, (saving || stravaUploading) && { opacity: 0.6 }]}
              >
                <Text style={s.saveBtnTxt}>
                  {stravaUploading ? 'UPLOADING TO STRAVA…' : saving ? 'SAVING…' : 'SAVE RUN'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleDiscard} style={s.discardBtn}>
                <Text style={s.discardTxt}>DISCARD RUN</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ACTIVE RUN SCREEN (idle / running / paused)
  // ─────────────────────────────────────────────────────────────────────────────

  const hasMap = mapCenter !== null && runState !== 'idle';

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <View style={s.root}>
        {/* ── MAP BACKGROUND (running/paused only) ─────────────────────── */}
        {hasMap ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              ...mapCenter,
              latitudeDelta:  0.006,
              longitudeDelta: 0.006,
            }}
            customMapStyle={DARK_MAP_STYLE}
            showsUserLocation
            followsUserLocation={runState === 'running'}
            showsMyLocationButton={false}
            userInterfaceStyle="dark"
          >
            {polylineCoords.length > 1 && (
              <Polyline
                coordinates={polylineCoords}
                strokeColor={ACCENT}
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
              />
            )}
          </MapView>
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: INK }]} />
        )}

        {/* Semi-transparent gradient overlay behind UI elements */}
        {hasMap && <View style={s.mapTopOverlay} />}
        {hasMap && <View style={s.mapBottomOverlay} />}

        {/* ── SAFE AREA CONTENT ────────────────────────────────────────── */}
        <SafeAreaView style={s.safeOverlay}>
          {/* Header */}
          <View style={s.runHeader}>
            <Text style={s.runEyebrow}>// STRIDE PROTOCOL</Text>
            {runState !== 'idle' ? (
              <TouchableOpacity onPress={handleDiscard} style={s.runDiscard}>
                <Text style={s.runDiscardTxt}>DISCARD</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={onClose} style={s.runDiscard}>
                <Ionicons name="close" size={20} color="rgba(244,241,234,0.4)" />
              </TouchableOpacity>
            )}
          </View>

          {/* Status row */}
          <View style={s.statusRow}>
            <View style={[s.statusDot, {
              backgroundColor: runState === 'running' ? ACCENT
                : runState === 'paused' ? AMBER : 'rgba(244,241,234,0.2)',
            }]} />
            <Text style={s.statusTxt}>
              {runState === 'running' ? 'TRACKING' : runState === 'paused' ? 'PAUSED' : 'READY'}
            </Text>
          </View>

          {/* ── IDLE: connection status + start ──────────────────────── */}
          {runState === 'idle' && (
            <>
              {/* Connection status bar */}
              <View style={s.connBar}>
                <ConnBadge
                  icon={<Ionicons name="navigate-outline" size={12} color="rgba(244,241,234,0.5)" />}
                  label="GPS"
                  status={gpsGranted ? 'connected' : 'partial'}
                />
                <View style={s.connDivider} />
                <ConnBadge
                  icon={<Ionicons name="watch-outline" size={12} color="rgba(244,241,234,0.5)" />}
                  label={Platform.OS === 'ios' ? 'APPLE WATCH' : 'GARMIN'}
                  status={watchConnected ? 'connected' : 'off'}
                />
                <View style={s.connDivider} />
                <ConnBadge
                  icon={<Text style={{ fontSize: 10, color: 'rgba(244,241,234,0.5)', fontWeight: '700' }}>S</Text>}
                  label="STRAVA"
                  status={stravaTokens ? 'connected' : 'off'}
                />
              </View>

              {/* Integration tips */}
              {(!stravaTokens || !watchConnected) && (
                <View style={s.connTips}>
                  {!gpsGranted && (
                    <Text style={s.connTip}>⚠ GPS not enabled — grant Location in Settings for route tracking</Text>
                  )}
                  {!stravaTokens && (
                    <Text style={s.connTip}>+ Connect Strava to auto-upload runs and sync your gear</Text>
                  )}
                  {!watchConnected && Platform.OS === 'ios' && (
                    <Text style={s.connTip}>+ Connect Apple Watch via Integrations for automatic data merge</Text>
                  )}
                </View>
              )}

              {/* Center idle display */}
              <View style={s.centerArea}>
                <View style={s.distanceBlock}>
                  <Text style={s.distanceMi}>0.00</Text>
                  <Text style={s.distanceLbl}>MILES</Text>
                </View>
              </View>
            </>
          )}

          {/* ── RUNNING / PAUSED: live metrics ───────────────────────── */}
          {runState !== 'idle' && (
            <View style={s.liveMetrics}>
              {!hasMap && <PulseRing active={runState === 'running'} />}

              {/* Distance — centered, big */}
              <View style={s.distanceBlock}>
                <Text style={[s.distanceMi, hasMap && { textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 }]}>
                  {milesDisplay}
                </Text>
                <Text style={s.distanceLbl}>MILES</Text>
              </View>

              {/* Time + Pace */}
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

              {/* Latest split ticker */}
              {splits.length > 0 && (
                <View style={s.splitTicker}>
                  <Text style={s.splitTickerTxt}>
                    MI {splits[splits.length - 1].mile} — {splits[splits.length - 1].pace} /mi
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── CONTROLS ────────────────────────────────────────────── */}
          <View style={s.controls}>
            {runState === 'idle' && (
              <TouchableOpacity onPress={handleStart} style={s.startBtn} activeOpacity={0.85}>
                <Ionicons name="play" size={26} color={INK} />
                <Text style={s.startBtnTxt}>START RUN</Text>
              </TouchableOpacity>
            )}

            {runState === 'running' && (
              <View style={s.activeControls}>
                <TouchableOpacity onPress={handlePause} style={s.pauseBtn} activeOpacity={0.85}>
                  <Ionicons name="pause" size={22} color={PAPER} />
                  <Text style={s.ctrlTxt}>PAUSE</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleStop} style={s.stopBtn} activeOpacity={0.85}>
                  <Ionicons name="stop" size={22} color={INK} />
                  <Text style={[s.ctrlTxt, { color: INK }]}>FINISH</Text>
                </TouchableOpacity>
              </View>
            )}

            {runState === 'paused' && (
              <View style={s.activeControls}>
                <TouchableOpacity onPress={handleResume} style={s.resumeBtn} activeOpacity={0.85}>
                  <Ionicons name="play" size={22} color={INK} />
                  <Text style={[s.ctrlTxt, { color: INK }]}>RESUME</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleStop} style={s.stopBtn} activeOpacity={0.85}>
                  <Ionicons name="stop" size={22} color={INK} />
                  <Text style={[s.ctrlTxt, { color: INK }]}>FINISH</Text>
                </TouchableOpacity>
              </View>
            )}

            {runState === 'idle' && (
              <Text style={s.gpsNote}>
                GPS tracks your exact route. Keep screen on for best accuracy.{'\n'}
                {watchConnected ? '⌚ Watch data will merge after run.' : ''}
              </Text>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: INK },
  safeOverlay: { flex: 1 },

  // Map overlays (gradient fade for legibility)
  mapTopOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 160,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  mapBottomOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 260,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  runHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 4, paddingBottom: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  runEyebrow:    { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2 },
  runDiscard:    { padding: 4 },
  runDiscardTxt: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.35)', letterSpacing: 1 },

  statusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusTxt: { fontFamily: MONO, fontSize: 10, color: 'rgba(244,241,234,0.5)', letterSpacing: 2 },

  // ── Connection bar ────────────────────────────────────────────────────────
  connBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(244,241,234,0.06)',
  },
  connDivider: { width: 1, height: 16, backgroundColor: 'rgba(244,241,234,0.1)' },

  connTips: { paddingHorizontal: 20, paddingTop: 8, gap: 4 },
  connTip:  { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.3)', lineHeight: 15 },

  // ── Center area (idle + running) ──────────────────────────────────────────
  centerArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  liveMetrics: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 20,
  },

  distanceBlock: { alignItems: 'center', zIndex: 1 },
  distanceMi:    { fontSize: 80, fontWeight: '900', color: PAPER, letterSpacing: -4, lineHeight: 84 },
  distanceLbl:   { fontFamily: MONO, fontSize: 11, color: 'rgba(244,241,234,0.4)', letterSpacing: 3, marginTop: 4 },

  metricsRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
  metricBox:    { alignItems: 'center', paddingHorizontal: 24 },
  metricVal:    { fontFamily: MONO, fontSize: 20, fontWeight: '700', color: LIME },
  metricLbl:    { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.35)', letterSpacing: 2, marginTop: 4 },
  metricDivider: { width: 1, height: 32, backgroundColor: 'rgba(244,241,234,0.1)' },

  splitTicker: {
    marginTop: 18, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: 'rgba(212,255,0,0.1)', borderRadius: 2,
    borderWidth: 1, borderColor: 'rgba(212,255,0,0.3)',
  },
  splitTickerTxt: { fontFamily: MONO, fontSize: 10, color: LIME, letterSpacing: 1.5 },

  // ── Controls ──────────────────────────────────────────────────────────────
  controls: { paddingHorizontal: 20, paddingBottom: 12, gap: 10 },

  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: ACCENT, paddingVertical: 18, borderRadius: 4,
  },
  startBtnTxt: { fontFamily: MONO, fontSize: 15, fontWeight: '900', color: INK, letterSpacing: 2 },

  activeControls: { flexDirection: 'row', gap: 12 },
  pauseBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 2, borderColor: 'rgba(244,241,234,0.6)', paddingVertical: 15, borderRadius: 4,
  },
  resumeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: LIME, paddingVertical: 15, borderRadius: 4,
  },
  stopBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: LIME, paddingVertical: 15, borderRadius: 4,
  },
  ctrlTxt: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: PAPER, letterSpacing: 1.5 },

  gpsNote: {
    fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.22)',
    textAlign: 'center', paddingHorizontal: 20, paddingBottom: 4, lineHeight: 16,
  },

  // ── Summary ───────────────────────────────────────────────────────────────
  summaryHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(244,241,234,0.1)',
  },
  summaryEyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 4 },
  summaryTitle:   { fontSize: 34, fontWeight: '900', color: PAPER, letterSpacing: -1 },
  summaryCnt:     { padding: 20, paddingBottom: 60, gap: 4 },

  stravaUploadBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(244,241,234,0.2)', borderRadius: 2, alignSelf: 'flex-start',
  },
  stravaUploadBadgeTxt: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.5)', letterSpacing: 1 },

  statRow: { flexDirection: 'row', marginBottom: 20 },
  statBox: {
    flex: 1, alignItems: 'center', paddingVertical: 16,
    borderRightWidth: 1, borderRightColor: 'rgba(244,241,234,0.08)',
  },
  statVal: { fontFamily: MONO, fontSize: 20, fontWeight: '700', color: LIME, letterSpacing: -0.5 },
  statLbl: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.4)', letterSpacing: 2, marginTop: 4 },

  // Mini route map in summary
  summaryMapWrap:    { marginBottom: 20 },
  summaryMap:        { width: '100%', height: 180, borderRadius: 2, overflow: 'hidden' },
  summaryMapOverlay: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2,
  },
  summaryMapStat: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.5)' },

  splitsBox:   { backgroundColor: 'rgba(244,241,234,0.04)', borderRadius: 2, padding: 14, marginBottom: 16 },
  splitsTitle: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.3)', letterSpacing: 2, marginBottom: 10 },

  sectionLbl: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.4)', letterSpacing: 2, marginTop: 16, marginBottom: 10 },
  emptyShoe:  { fontFamily: MONO, fontSize: 10, color: 'rgba(244,241,234,0.4)', lineHeight: 17 },

  shoeScroll:      { maxHeight: 48, marginBottom: 8 },
  shoeChip:        { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(244,241,234,0.2)', borderRadius: 2, marginRight: 8, maxWidth: 160 },
  shoeChipActive:  { borderColor: LIME, backgroundColor: 'rgba(212,255,0,0.1)' },
  shoeChipText:    { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.6)' },
  shoeChipTextActive: { color: LIME },

  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip:        { paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(244,241,234,0.2)', borderRadius: 2 },
  chipActive:  { borderColor: LIME, backgroundColor: 'rgba(212,255,0,0.1)' },
  chipTxt:     { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.5)', letterSpacing: 1 },
  chipTxtActive: { color: LIME },

  // Feel picker
  feelRow:       { flexDirection: 'row', gap: 8, marginBottom: 4 },
  feelCard: {
    flex: 1, padding: 10, borderWidth: 1, borderColor: 'rgba(244,241,234,0.12)',
    borderRadius: 2, alignItems: 'center', gap: 4,
  },
  feelCardActive: { borderColor: LIME, backgroundColor: 'rgba(212,255,0,0.08)' },
  feelLabel:     { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: 'rgba(244,241,234,0.55)', textAlign: 'center' },
  feelDesc:      { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.3)', textAlign: 'center' },

  // Notes input
  notesInput: {
    borderWidth: 1, borderColor: 'rgba(244,241,234,0.15)', borderRadius: 2,
    padding: 12, color: PAPER, fontFamily: MONO, fontSize: 11, lineHeight: 18,
    minHeight: 80, textAlignVertical: 'top',
  },
  notesCount: { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.25)', textAlign: 'right', marginTop: 4 },

  // Watch notice
  watchNotice: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14,
    padding: 10, backgroundColor: 'rgba(212,255,0,0.06)',
    borderRadius: 2, borderWidth: 1, borderColor: 'rgba(212,255,0,0.15)',
  },
  watchNoticeTxt: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.5)', flex: 1, lineHeight: 15 },

  // Strava upload toggle
  stravaToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14, padding: 14, backgroundColor: 'rgba(252,76,2,0.08)',
    borderRadius: 2, borderWidth: 1, borderColor: 'rgba(252,76,2,0.2)',
  },
  stravaToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  stravaLogoBox: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#FC4C02',
    alignItems: 'center', justifyContent: 'center',
  },
  stravaLogoTxt:      { color: PAPER, fontWeight: '900', fontSize: 13 },
  stravaToggleTitle:  { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: PAPER, letterSpacing: 1 },
  stravaToggleSub:    { fontFamily: MONO, fontSize: 8, color: 'rgba(244,241,234,0.4)', marginTop: 2 },

  xpPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(212,255,0,0.08)', borderRadius: 2, padding: 14,
    marginTop: 20, borderWidth: 1, borderColor: 'rgba(212,255,0,0.2)',
  },
  xpPreviewTxt: { fontFamily: MONO, fontSize: 18, fontWeight: '700', color: LIME },
  xpPreviewSub: { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.4)' },

  saveBtn:     { backgroundColor: ACCENT, paddingVertical: 18, borderRadius: 2, alignItems: 'center', marginTop: 16 },
  saveBtnTxt:  { fontFamily: MONO, fontSize: 13, fontWeight: '900', color: PAPER, letterSpacing: 2 },
  discardBtn:  { paddingVertical: 14, alignItems: 'center' },
  discardTxt:  { fontFamily: MONO, fontSize: 10, color: 'rgba(244,241,234,0.3)', letterSpacing: 1 },
});
