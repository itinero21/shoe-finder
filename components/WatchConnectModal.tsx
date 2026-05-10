/**
 * WatchConnectModal — Dedicated Apple Watch + Garmin connection screen.
 *
 * Apple Watch: real HealthKit status + auto-sync.
 * Garmin:      interactive 3-step checklist with deep links + persistent progress.
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, Modal, StyleSheet, ScrollView,
  TouchableOpacity, Animated, Platform, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  WatchStatus,
  WatchSyncResult,
  getWatchStatus,
  syncAppleWatch,
  syncGarmin,
  syncAllWatches,
  setGarminStep,
  openGarminConnect,
  openStravaApp,
  relativeSyncTime,
} from '../app/services/watchService';
import { requestHealthPermission } from '../app/services/healthService';
import { connectStrava } from '../app/services/stravaService';

const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME   = '#D4FF00';
const MONO   = 'SpaceMono';
const APPLE_RED  = '#FF2D55';
const GARMIN_BLUE = '#007CC3';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type SyncState = 'idle' | 'syncing' | 'done' | 'error';

// ─── Pulse animation ──────────────────────────────────────────────────────────

function PulseDot({ color, size = 10 }: { color: string; size?: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1.6, duration: 900, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
          Animated.timing(opacity, { toValue: 0,   duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={{ width: size + 8, height: size + 8, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute',
        width: size + 8, height: size + 8, borderRadius: (size + 8) / 2,
        backgroundColor: color, transform: [{ scale }], opacity,
      }} />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

// ─── Garmin step row ──────────────────────────────────────────────────────────

interface GarminStepProps {
  index:    0 | 1 | 2;
  label:    string;
  sublabel: string;
  done:     boolean;
  locked:   boolean;
  onToggle: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

function GarminStep({ index, label, sublabel, done, locked, onToggle, onAction, actionLabel }: GarminStepProps) {
  return (
    <View style={[gs.stepRow, locked && gs.stepLocked]}>
      <TouchableOpacity
        onPress={locked ? undefined : onToggle}
        style={[gs.stepCheck, done && gs.stepCheckDone]}
        disabled={locked}
      >
        {done
          ? <Ionicons name="checkmark" size={14} color={PAPER} />
          : <Text style={gs.stepNum}>{index + 1}</Text>
        }
      </TouchableOpacity>

      <View style={gs.stepBody}>
        <Text style={[gs.stepLabel, locked && gs.stepLabelLocked]}>{label}</Text>
        <Text style={[gs.stepSub, locked && gs.stepSubLocked]}>{sublabel}</Text>
      </View>

      {onAction && !locked && (
        <TouchableOpacity onPress={onAction} style={gs.stepAction}>
          <Text style={gs.stepActionText}>{actionLabel ?? 'OPEN'}</Text>
          <Ionicons name="arrow-forward" size={10} color={GARMIN_BLUE} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function WatchConnectModal({ visible, onClose }: Props) {
  const [status, setStatus] = useState<WatchStatus | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncResult, setSyncResult] = useState<WatchSyncResult | null>(null);
  const [awSyncState, setAwSyncState] = useState<SyncState>('idle');
  const [garminSyncState, setGarminSyncState] = useState<SyncState>('idle');
  const [connectingStrava, setConnectingStrava] = useState(false);

  useEffect(() => {
    if (visible) loadStatus();
  }, [visible]);

  const loadStatus = async () => {
    const s = await getWatchStatus();
    setStatus(s);
  };

  // ── Apple Watch ────────────────────────────────────────────────────────────

  const handleAppleWatchConnect = async () => {
    const perm = await requestHealthPermission();
    if (perm === 'authorized') {
      await loadStatus();
    }
  };

  const handleAppleWatchSync = async () => {
    setAwSyncState('syncing');
    const result = await syncAppleWatch();
    if (result.error && result.imported === 0) {
      setAwSyncState('error');
    } else {
      setAwSyncState('done');
    }
    await loadStatus();
    setTimeout(() => setAwSyncState('idle'), 4000);
  };

  // ── Garmin ─────────────────────────────────────────────────────────────────

  const handleStravaConnect = async () => {
    setConnectingStrava(true);
    const tokens = await connectStrava();
    setConnectingStrava(false);
    if (tokens) {
      await setGarminStep(0, true);
      await loadStatus();
    }
  };

  const handleGarminStepToggle = async (i: 0 | 1 | 2) => {
    if (!status) return;
    const current = status.garminSteps[i];
    await setGarminStep(i, !current);
    await loadStatus();
  };

  const handleGarminOpenApp = async () => {
    await setGarminStep(1, true);
    await openGarminConnect();
    await loadStatus();
  };

  const handleGarminSync = async () => {
    setGarminSyncState('syncing');
    const result = await syncGarmin();
    setGarminSyncState(result.error ? 'error' : 'done');
    await loadStatus();
    setTimeout(() => setGarminSyncState('idle'), 4000);
  };

  // ── Sync all ───────────────────────────────────────────────────────────────

  const handleSyncAll = async () => {
    setSyncState('syncing');
    const result = await syncAllWatches();
    setSyncResult(result);
    setSyncState(result.error && result.totalImported === 0 ? 'error' : 'done');
    await loadStatus();
    setTimeout(() => { setSyncState('idle'); setSyncResult(null); }, 5000);
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const garminReady = status?.garminSteps.every(Boolean) ?? false;
  const garminPartial = status ? status.garminSteps.filter(Boolean).length : 0;
  const totalConnected = (status?.healthAuthorized ? 1 : 0) + (status?.garminViaStrava ? 1 : 0);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.root}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.eyebrow}>// STRIDE · WEARABLES</Text>
            <Text style={s.title}>YOUR WATCHES.</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={22} color={INK} />
          </TouchableOpacity>
        </View>

        {/* Connection summary bar */}
        <View style={[s.summaryBar, totalConnected > 0 && s.summaryBarActive]}>
          <View style={s.summaryLeft}>
            {totalConnected > 0
              ? <PulseDot color="#16A34A" size={8} />
              : <View style={s.dotOff} />
            }
            <Text style={[s.summaryText, totalConnected > 0 && s.summaryTextActive]}>
              {totalConnected === 0
                ? 'NO WATCHES CONNECTED'
                : totalConnected === 1
                  ? '1 WATCH CONNECTED'
                  : '2 WATCHES CONNECTED'
              }
            </Text>
          </View>
          {status?.lastSyncDate && (
            <Text style={s.summarySync}>{relativeSyncTime(status.lastSyncDate)}</Text>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* ── Apple Watch ──────────────────────────────────────────────────── */}
          {Platform.OS === 'ios' && (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <View style={[s.watchIconBox, { backgroundColor: '#1C1C1E' }]}>
                  <Text style={s.watchIcon}>⌚</Text>
                </View>
                <View style={s.cardMeta}>
                  <Text style={s.cardTitle}>APPLE WATCH</Text>
                  <Text style={s.cardSub}>
                    {status?.appleWatchDetected
                      ? `${status.appleWatchRunCount} run${status.appleWatchRunCount !== 1 ? 's' : ''} imported`
                      : 'Syncs via Apple Health'}
                  </Text>
                </View>
                <View style={s.statusArea}>
                  {status?.healthAuthorized
                    ? <PulseDot color="#16A34A" size={9} />
                    : <View style={s.dotOff} />
                  }
                </View>
              </View>

              {status?.healthAuthorized ? (
                <>
                  {/* Status card */}
                  <View style={s.statusCard}>
                    <View style={s.statusRow}>
                      <Ionicons name="heart" size={14} color={APPLE_RED} />
                      <Text style={s.statusLabel}>HEALTH AUTHORIZED</Text>
                    </View>
                    {status.appleWatchDetected ? (
                      <View style={[s.statusRow, { marginTop: 6 }]}>
                        <Text style={s.statusValue}>⌚ Apple Watch workouts detected</Text>
                      </View>
                    ) : (
                      <View style={[s.statusRow, { marginTop: 6 }]}>
                        <Text style={s.statusHint}>
                          Start a workout on your Apple Watch — it'll appear here after syncing.
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* How it works */}
                  <View style={s.howItWorks}>
                    <Text style={s.howTitle}>HOW IT WORKS</Text>
                    {[
                      { icon: 'watch-outline' as const, text: 'Start Outdoor Run, Indoor Run, or Trail Run on your Watch' },
                      { icon: 'phone-portrait-outline' as const, text: 'Watch auto-syncs to iPhone Apple Health when in range' },
                      { icon: 'sync-outline' as const, text: 'Tap Sync to pull into Stride — mileage + XP credited instantly' },
                    ].map((item, i) => (
                      <View key={i} style={s.howRow}>
                        <View style={s.howIconBox}>
                          <Ionicons name={item.icon} size={14} color={INK} />
                        </View>
                        <Text style={s.howText}>{item.text}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    onPress={handleAppleWatchSync}
                    disabled={awSyncState === 'syncing'}
                    style={[s.syncBtn, { backgroundColor: '#1C1C1E' }, awSyncState === 'syncing' && s.btnDisabled]}
                  >
                    {awSyncState === 'syncing'
                      ? <Text style={[s.syncBtnText, { color: PAPER }]}>SYNCING...</Text>
                      : awSyncState === 'done'
                        ? <><Ionicons name="checkmark-circle" size={14} color={LIME} /><Text style={[s.syncBtnText, { color: LIME, marginLeft: 6 }]}>SYNCED</Text></>
                        : awSyncState === 'error'
                          ? <Text style={[s.syncBtnText, { color: ACCENT }]}>ERROR — TRY AGAIN</Text>
                          : <><Ionicons name="sync-outline" size={14} color={PAPER} /><Text style={[s.syncBtnText, { color: PAPER, marginLeft: 6 }]}>SYNC APPLE WATCH</Text></>
                    }
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={s.connectDesc}>
                    Allow Stride to read your Apple Health workouts. Your Apple Watch runs will sync automatically — no Watch app needed.
                  </Text>
                  <TouchableOpacity onPress={handleAppleWatchConnect} style={[s.connectBtn, { borderColor: APPLE_RED }]}>
                    <Ionicons name="heart-outline" size={16} color={APPLE_RED} />
                    <Text style={[s.connectBtnText, { color: APPLE_RED }]}>CONNECT APPLE HEALTH</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* ── Garmin ───────────────────────────────────────────────────────── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={[s.watchIconBox, { backgroundColor: GARMIN_BLUE }]}>
                <Text style={[s.watchIcon, { fontSize: 18, fontWeight: '900' }]}>G</Text>
              </View>
              <View style={s.cardMeta}>
                <Text style={s.cardTitle}>GARMIN</Text>
                <Text style={s.cardSub}>
                  {garminReady
                    ? `${status?.garminRunCount ?? 0} run${(status?.garminRunCount ?? 0) !== 1 ? 's' : ''} via Strava`
                    : `${garminPartial}/3 steps complete`}
                </Text>
              </View>
              <View style={s.statusArea}>
                {garminReady
                  ? <PulseDot color="#16A34A" size={9} />
                  : status?.garminViaStrava
                    ? <PulseDot color="#F59E0B" size={9} />
                    : <View style={s.dotOff} />
                }
              </View>
            </View>

            {garminReady && (
              <View style={s.statusCard}>
                <View style={s.statusRow}>
                  <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                  <Text style={s.statusLabel}>GARMIN SETUP COMPLETE</Text>
                </View>
                <Text style={[s.statusHint, { marginTop: 6 }]}>
                  Every Garmin run auto-uploads to Strava and syncs to Stride.
                </Text>
              </View>
            )}

            {/* 3-step setup */}
            <View style={s.stepsContainer}>
              <Text style={s.stepsTitle}>SETUP · 3 STEPS</Text>

              {status && (
                <>
                  <GarminStep
                    index={0}
                    label="Connect Strava"
                    sublabel="Required — Strava is the bridge between Garmin and Stride"
                    done={status.garminSteps[0]}
                    locked={false}
                    onToggle={() => {}}
                    onAction={status.garminViaStrava ? undefined : handleStravaConnect}
                    actionLabel={connectingStrava ? '...' : 'CONNECT'}
                  />

                  <GarminStep
                    index={1}
                    label="Open Garmin Connect app"
                    sublabel="Go to Menu → Settings → Partner Apps → Strava → tap Connect"
                    done={status.garminSteps[1]}
                    locked={!status.garminSteps[0]}
                    onToggle={() => handleGarminStepToggle(1)}
                    onAction={status.garminSteps[0] ? handleGarminOpenApp : undefined}
                    actionLabel="OPEN APP"
                  />

                  <GarminStep
                    index={2}
                    label='Enable "Auto Upload"'
                    sublabel="In the Strava partner settings — every run auto-uploads from now on"
                    done={status.garminSteps[2]}
                    locked={!status.garminSteps[1]}
                    onToggle={() => handleGarminStepToggle(2)}
                  />
                </>
              )}
            </View>

            {/* Progress bar */}
            {status && (
              <View style={s.progressBar}>
                <View style={[s.progressFill, { width: `${(garminPartial / 3) * 100}%` as any }]} />
              </View>
            )}

            {/* Sync button — only shows when Strava is connected */}
            {status?.garminViaStrava && (
              <TouchableOpacity
                onPress={handleGarminSync}
                disabled={garminSyncState === 'syncing'}
                style={[s.syncBtn, { backgroundColor: GARMIN_BLUE }, garminSyncState === 'syncing' && s.btnDisabled]}
              >
                {garminSyncState === 'syncing'
                  ? <Text style={[s.syncBtnText, { color: PAPER }]}>SYNCING...</Text>
                  : garminSyncState === 'done'
                    ? <><Ionicons name="checkmark-circle" size={14} color={LIME} /><Text style={[s.syncBtnText, { color: LIME, marginLeft: 6 }]}>SYNCED</Text></>
                    : <><Ionicons name="sync-outline" size={14} color={PAPER} /><Text style={[s.syncBtnText, { color: PAPER, marginLeft: 6 }]}>SYNC GARMIN RUNS</Text></>
                }
              </TouchableOpacity>
            )}
          </View>

          {/* ── Sync All ─────────────────────────────────────────────────────── */}
          {totalConnected > 0 && (
            <View style={s.syncAllContainer}>
              <TouchableOpacity
                onPress={handleSyncAll}
                disabled={syncState === 'syncing'}
                style={[s.syncAllBtn, syncState === 'syncing' && s.btnDisabled]}
              >
                {syncState === 'syncing' ? (
                  <Text style={s.syncAllText}>SYNCING ALL WATCHES...</Text>
                ) : syncState === 'done' && syncResult ? (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color={LIME} />
                    <Text style={[s.syncAllText, { color: LIME, marginLeft: 8 }]}>
                      {syncResult.totalImported} RUNS IMPORTED
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="sync-circle-outline" size={18} color={PAPER} />
                    <Text style={[s.syncAllText, { marginLeft: 8 }]}>SYNC ALL WATCHES</Text>
                  </>
                )}
              </TouchableOpacity>
              {syncResult && syncResult.totalImported > 0 && (
                <Text style={s.syncBreakdown}>
                  {syncResult.appleImported > 0 ? `⌚ ${syncResult.appleImported} from Apple Watch` : ''}
                  {syncResult.appleImported > 0 && syncResult.garminImported > 0 ? '  ·  ' : ''}
                  {syncResult.garminImported > 0 ? `G ${syncResult.garminImported} from Garmin` : ''}
                </Text>
              )}
            </View>
          )}

          {/* ── Manual note ──────────────────────────────────────────────────── */}
          <View style={s.manualNote}>
            <Ionicons name="information-circle-outline" size={14} color="rgba(10,10,10,0.4)" />
            <Text style={s.manualNoteText}>
              No watch? Tap "+ LOG RUN" on any shoe in your Arsenal to record runs manually.
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAPER },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 2, borderBottomColor: INK,
  },
  eyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 4 },
  title:   { fontSize: 28, fontWeight: '900', color: INK, letterSpacing: -1 },
  closeBtn: { padding: 4 },

  summaryBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: 'rgba(10,10,10,0.04)', borderBottomWidth: 1, borderBottomColor: 'rgba(10,10,10,0.08)',
  },
  summaryBarActive: { backgroundColor: 'rgba(22,163,74,0.08)' },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.4)', letterSpacing: 1 },
  summaryTextActive: { color: '#16A34A' },
  summarySync: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.35)' },
  dotOff: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(10,10,10,0.15)', margin: 4 },

  scroll: { padding: 20, paddingBottom: 60, gap: 16 },

  card: {
    backgroundColor: '#fff', borderRadius: 4, padding: 20,
    borderWidth: 2, borderColor: INK,
    shadowColor: INK, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.08, shadowRadius: 0,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  watchIconBox: {
    width: 48, height: 48, borderRadius: 4, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: INK,
  },
  watchIcon: { fontSize: 22, color: '#fff' },
  cardMeta: { flex: 1 },
  cardTitle: { fontFamily: MONO, fontSize: 13, fontWeight: '700', color: INK, letterSpacing: 1 },
  cardSub:   { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.4)', marginTop: 3 },
  statusArea: { alignItems: 'center', justifyContent: 'center', width: 24 },

  statusCard: {
    backgroundColor: 'rgba(10,10,10,0.03)', borderRadius: 2, padding: 12,
    borderWidth: 1, borderColor: 'rgba(10,10,10,0.08)', marginBottom: 14,
  },
  statusRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusLabel: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: '#16A34A', letterSpacing: 1 },
  statusValue: { fontFamily: MONO, fontSize: 10, color: INK },
  statusHint:  { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.5)', lineHeight: 17 },

  howItWorks: { gap: 10, marginBottom: 16 },
  howTitle:   { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.35)', letterSpacing: 2, marginBottom: 4 },
  howRow:     { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  howIconBox: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(10,10,10,0.06)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  howText: { fontFamily: MONO, fontSize: 10, color: INK, flex: 1, lineHeight: 17, paddingTop: 5 },

  connectDesc: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.6)', lineHeight: 18, marginBottom: 14 },
  connectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 2, borderWidth: 2, marginBottom: 4,
  },
  connectBtnText: { fontFamily: MONO, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },

  syncBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, borderRadius: 2, marginTop: 4,
  },
  syncBtnText: { fontFamily: MONO, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  btnDisabled: { opacity: 0.55 },

  // Garmin steps
  stepsContainer: { marginBottom: 12 },
  stepsTitle: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.35)', letterSpacing: 2, marginBottom: 12 },

  progressBar: {
    height: 3, backgroundColor: 'rgba(10,10,10,0.08)', borderRadius: 2, marginBottom: 14, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: GARMIN_BLUE, borderRadius: 2 },

  syncAllContainer: { gap: 8 },
  syncAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: INK, paddingVertical: 16, borderRadius: 2, gap: 2,
  },
  syncAllText: { fontFamily: MONO, fontSize: 12, fontWeight: '700', color: PAPER, letterSpacing: 1.5 },
  syncBreakdown: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.5)', textAlign: 'center', letterSpacing: 0.5 },

  manualNote: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: 'rgba(10,10,10,0.04)', padding: 14, borderRadius: 2,
  },
  manualNoteText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.45)', flex: 1, lineHeight: 17 },
});

// ─── Garmin step styles ───────────────────────────────────────────────────────

const gs = StyleSheet.create({
  stepRow: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(10,10,10,0.06)',
  },
  stepLocked: { opacity: 0.35 },
  stepCheck: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: INK,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  stepCheckDone: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  stepNum:  { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: INK },
  stepBody: { flex: 1 },
  stepLabel: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: INK, lineHeight: 17 },
  stepLabelLocked: { color: 'rgba(10,10,10,0.4)' },
  stepSub:   { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.45)', marginTop: 3, lineHeight: 15 },
  stepSubLocked: { color: 'rgba(10,10,10,0.25)' },
  stepAction: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 5,
    borderWidth: 1, borderColor: GARMIN_BLUE, borderRadius: 2, flexShrink: 0,
  },
  stepActionText: { fontFamily: MONO, fontSize: 8, color: GARMIN_BLUE, fontWeight: '700', letterSpacing: 1 },
});
