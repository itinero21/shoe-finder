/**
 * Integrations settings modal — Strava, Apple Health, Garmin.
 * Mount this anywhere; typically opened from Coach or Arsenal.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getStravaTokens, disconnectStrava, syncStravaActivities,
  connectStrava, getStravaGear, getGearMap, saveGearMap,
  StravaGear, StravaTokens,
} from '../app/services/stravaService';
import {
  getHealthPermStatus, requestHealthPermission,
  syncHealthWorkouts, HealthPermStatus,
  GARMIN_INTEGRATION_NOTE, APPLE_WATCH_NOTE,
} from '../app/services/healthService';
import { getFavorites } from '../app/utils/storage';
import { SHOES } from '../app/data/shoes';
import { seedTestRuns, clearSeededRuns } from '../app/utils/testDataSeeder';
import { WatchConnectModal } from './WatchConnectModal';
import { StravaLogo, AppleHealthLogo, AppleWatchLogo, GarminLogo } from './BrandLogos';

const INK   = '#0A0A0A';
const PAPER = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME  = '#D4FF00';
const MONO  = 'SpaceMono';

interface IntegrationsModalProps {
  visible: boolean;
  onClose: () => void;
}

type SyncState = 'idle' | 'syncing' | 'done' | 'error';

export function IntegrationsModal({ visible, onClose }: IntegrationsModalProps) {
  const [stravaTokens, setStravaTokens] = useState<StravaTokens | null>(null);
  const [stravaGear, setStravaGear] = useState<StravaGear[]>([]);
  const [gearMap, setGearMap] = useState<Record<string, string>>({});
  const [stravaSync, setStravaSync] = useState<SyncState>('idle');
  const [stravaSyncResult, setStravaSyncResult] = useState<string>('');

  const [healthStatus, setHealthStatus] = useState<HealthPermStatus>('not_requested');
  const [healthSync, setHealthSync] = useState<SyncState>('idle');
  const [healthSyncResult, setHealthSyncResult] = useState<string>('');

  const [arsenalIds, setArsenalIds] = useState<string[]>([]);
  const [showWatches, setShowWatches] = useState(false);

  // ── Test mode ─────────────────────────────────────────────────────────────
  const [seedSource, setSeedSource] = useState<'strava' | 'apple_health'>('strava');
  const [seedCount, setSeedCount]   = useState<5 | 10 | 20>(10);
  const [seedState, setSeedState]   = useState<SyncState>('idle');
  const [seedResult, setSeedResult] = useState<string>('');

  useEffect(() => {
    if (!visible) return;
    load();
  }, [visible]);

  const load = async () => {
    const [tokens, status, favs, savedMap] = await Promise.all([
      getStravaTokens(),
      getHealthPermStatus(),
      getFavorites(),
      getGearMap(),
    ]);
    setStravaTokens(tokens);
    setHealthStatus(status);
    setArsenalIds(favs);
    setGearMap(savedMap);
    if (tokens) {
      const gear = await getStravaGear();
      setStravaGear(gear);
    }
  };

  // ── Strava ────────────────────────────────────────────────────────────────
  const handleStravaConnect = async () => {
    const tokens = await connectStrava();
    if (tokens) {
      setStravaTokens(tokens);
      const gear = await getStravaGear();
      setStravaGear(gear);
      Alert.alert('Strava connected', `Welcome, ${tokens.athlete_name}!`);
    } else {
      Alert.alert('Connection failed', 'Could not connect to Strava. Please try again.');
    }
  };

  const handleStravaDisconnect = () => {
    Alert.alert('Disconnect Strava?', 'Your synced runs will remain. No new runs will be imported.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect', style: 'destructive', onPress: async () => {
          await disconnectStrava();
          setStravaTokens(null);
          setStravaGear([]);
        }
      },
    ]);
  };

  const handleStravaSync = async () => {
    setStravaSync('syncing');
    const result = await syncStravaActivities(gearMap); // gearMap is already loaded from storage
    if (result.error) {
      setStravaSync('error');
      setStravaSyncResult(result.error);
    } else {
      setStravaSync('done');
      setStravaSyncResult(`${result.imported} imported, ${result.skipped} skipped`);
    }
    setTimeout(() => setStravaSync('idle'), 4000);
  };

  const handleGearMap = (stravaGearId: string, shoeId: string) => {
    const updated = { ...gearMap, [stravaGearId]: shoeId };
    setGearMap(updated);
    saveGearMap(updated); // persist so uploadRunToStrava can read it
  };

  // ── Apple Health ──────────────────────────────────────────────────────────
  const handleHealthConnect = async () => {
    const status = await requestHealthPermission();
    setHealthStatus(status);
    if (status === 'denied') Alert.alert('Permission denied', 'Enable Health access in Settings → Privacy → Health → Stride.');
  };

  const handleHealthSync = async () => {
    setHealthSync('syncing');
    const result = await syncHealthWorkouts();
    if (result.error) {
      setHealthSync('error');
      setHealthSyncResult(result.error);
    } else {
      setHealthSync('done');
      setHealthSyncResult(`${result.imported} imported, ${result.skipped} skipped`);
    }
    setTimeout(() => setHealthSync('idle'), 4000);
  };

  const handleSeedRuns = async () => {
    setSeedState('syncing');
    setSeedResult('');
    try {
      const res = await seedTestRuns({ source: seedSource, count: seedCount });
      setSeedState('done');
      setSeedResult(`${res.imported} runs · +${res.xpEarned} XP · ${res.milesAdded} mi`);
    } catch (e: any) {
      setSeedState('error');
      setSeedResult(e?.message ?? 'Seed failed');
    }
    setTimeout(() => setSeedState('idle'), 5000);
  };

  const handleClearSeeded = () => {
    Alert.alert('Clear seeded runs?', 'All test runs (run_seed_*) will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: async () => {
          await clearSeededRuns();
          setSeedResult('');
          Alert.alert('Done', 'Test runs removed.');
        }
      },
    ]);
  };

  const arsenalShoes = SHOES.filter(s => arsenalIds.includes(s.id));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <View>
            <Text style={s.eyebrow}>// STRIDE PROTOCOL</Text>
            <Text style={s.title}>INTEGRATIONS.</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={22} color={INK} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={s.scroll} contentContainerStyle={s.content}>

          {/* ── Watches shortcut ───────────────────────────────────────────── */}
          <TouchableOpacity style={s.watchShortcut} onPress={() => setShowWatches(true)} activeOpacity={0.85}>
            <View style={s.watchShortcutLeft}>
              <Text style={s.watchShortcutIcon}>⌚</Text>
              <View>
                <Text style={s.watchShortcutTitle}>APPLE WATCH & GARMIN</Text>
                <Text style={s.watchShortcutSub}>Set up your watches here</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={18} color={PAPER} />
          </TouchableOpacity>

          <View style={s.divider} />

          {/* ── Strava ─────────────────────────────────────────────────────── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <StravaLogo size={40} />
              <View style={s.sectionMeta}>
                <Text style={s.sectionTitle}>STRAVA</Text>
                <Text style={s.sectionSub}>Run tracking & social fitness</Text>
              </View>
              <View style={[s.statusDot, { backgroundColor: stravaTokens ? '#16A34A' : 'rgba(10,10,10,0.15)' }]} />
            </View>

            {stravaTokens ? (
              <>
                <View style={s.connectedCard}>
                  <Text style={s.connectedLabel}>CONNECTED AS</Text>
                  <Text style={s.connectedName}>{stravaTokens.athlete_name}</Text>
                </View>

                {/* Gear → Shoe mapping */}
                {stravaGear.length > 0 && (
                  <View style={s.gearSection}>
                    <Text style={s.gearLabel}>MAP STRAVA GEAR // ARSENAL SHOE</Text>
                    {stravaGear.map(gear => (
                      <View key={gear.id} style={s.gearRow}>
                        <View style={s.gearLeft}>
                          <Text style={s.gearName}>{gear.name}</Text>
                          <Text style={s.gearDist}>{gear.distance_km.toFixed(0)}km logged</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.gearShoeScroll}>
                          <TouchableOpacity
                            onPress={() => handleGearMap(gear.id, '')}
                            style={[s.gearShoeChip, !gearMap[gear.id] && s.gearShoeChipActive]}
                          >
                            <Text style={[s.gearShoeText, !gearMap[gear.id] && s.gearShoeTextActive]}>SKIP</Text>
                          </TouchableOpacity>
                          {arsenalShoes.map(shoe => (
                            <TouchableOpacity
                              key={shoe.id}
                              onPress={() => handleGearMap(gear.id, shoe.id)}
                              style={[s.gearShoeChip, gearMap[gear.id] === shoe.id && s.gearShoeChipActive]}
                            >
                              <Text style={[s.gearShoeText, gearMap[gear.id] === shoe.id && s.gearShoeTextActive]} numberOfLines={1}>
                                {shoe.model}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    ))}
                  </View>
                )}

                <View style={s.btnRow}>
                  <TouchableOpacity
                    onPress={handleStravaSync}
                    disabled={stravaSync === 'syncing'}
                    style={[s.syncBtn, stravaSync === 'syncing' && { opacity: 0.6 }]}
                  >
                    <Text style={s.syncBtnText}>
                      {stravaSync === 'syncing' ? 'SYNCING...' : stravaSync === 'done' ? `DONE: ${stravaSyncResult}` : stravaSync === 'error' ? `ERR: ${stravaSyncResult}` : 'SYNC NOW'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleStravaDisconnect} style={s.disconnectBtn}>
                    <Text style={s.disconnectText}>DISCONNECT</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={s.integrationDesc}>
                  Connect Strava to automatically import every run and attribute mileage to your Arsenal shoes.
                </Text>
                <TouchableOpacity onPress={handleStravaConnect} style={[s.connectBtn, { backgroundColor: '#FC4C02' }]}>
                  <StravaLogo size={22} />
                  <Text style={s.connectBtnText}>CONNECT WITH STRAVA</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={s.divider} />

          {/* ── Apple Health ───────────────────────────────────────────────── */}
          {Platform.OS === 'ios' && (
            <>
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <AppleHealthLogo size={40} />
                  <View style={s.sectionMeta}>
                    <Text style={s.sectionTitle}>APPLE HEALTH</Text>
                    <Text style={s.sectionSub}>Import workouts from Health app</Text>
                  </View>
                  <View style={[s.statusDot, { backgroundColor: healthStatus === 'authorized' ? '#16A34A' : 'rgba(10,10,10,0.15)' }]} />
                </View>

                {healthStatus === 'authorized' ? (
                  <>
                    <View style={s.connectedCard}>
                      <Text style={s.connectedLabel}>STATUS</Text>
                      <Text style={s.connectedName}>HealthKit Authorized</Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleHealthSync}
                      disabled={healthSync === 'syncing'}
                      style={[s.syncBtn, healthSync === 'syncing' && { opacity: 0.6 }]}
                    >
                      <Text style={s.syncBtnText}>
                        {healthSync === 'syncing' ? 'SYNCING...' : healthSync === 'done' ? `DONE: ${healthSyncResult}` : healthSync === 'error' ? `ERR: ${healthSyncResult}` : 'SYNC NOW'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={s.integrationDesc}>
                      Pull running workouts directly from your Apple Health data. Runs are matched to your weekly roster shoes automatically.
                    </Text>
                    <TouchableOpacity onPress={handleHealthConnect} style={[s.connectBtn, { backgroundColor: '#FF2D55' }]}>
                      <AppleHealthLogo size={22} />
                      <Text style={s.connectBtnText}>ENABLE APPLE HEALTH</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <View style={s.divider} />
            </>
          )}

          {/* ── Apple Watch ────────────────────────────────────────────────── */}
          {Platform.OS === 'ios' && (
            <>
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <AppleWatchLogo size={40} />
                  <View style={s.sectionMeta}>
                    <Text style={s.sectionTitle}>APPLE WATCH</Text>
                    <Text style={s.sectionSub}>Auto-syncs via Apple Health</Text>
                  </View>
                  <View style={[s.statusDot, { backgroundColor: healthStatus === 'authorized' ? '#16A34A' : 'rgba(10,10,10,0.15)' }]} />
                </View>

                <View style={s.wizardCard}>
                  <Text style={s.wizardTitle}>HOW IT WORKS</Text>
                  {[
                    { n: '1', text: 'Start a workout on your Apple Watch (Outdoor Run, Indoor Run, or Trail Run)' },
                    { n: '2', text: 'Workout saves automatically to iPhone Apple Health when watches sync' },
                    { n: '3', text: 'Tap "Sync Apple Health" above to pull it into Stride' },
                  ].map(step => (
                    <View key={step.n} style={s.wizardStep}>
                      <View style={s.wizardNum}><Text style={s.wizardNumText}>{step.n}</Text></View>
                      <Text style={s.wizardText}>{step.text}</Text>
                    </View>
                  ))}
                  <View style={s.garminNote}>
                    <Ionicons name="checkmark-circle-outline" size={14} color="#16A34A" />
                    <Text style={[s.garminNoteText, { color: '#16A34A' }]}>{APPLE_WATCH_NOTE}</Text>
                  </View>
                </View>
              </View>
              <View style={s.divider} />
            </>
          )}

          {/* ── Garmin ─────────────────────────────────────────────────────── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <GarminLogo size={40} />
              <View style={s.sectionMeta}>
                <Text style={s.sectionTitle}>GARMIN</Text>
                <Text style={s.sectionSub}>Connect via Strava in 3 steps</Text>
              </View>
              <View style={[s.statusDot, { backgroundColor: stravaTokens ? '#16A34A' : 'rgba(10,10,10,0.15)' }]} />
            </View>

            <View style={s.wizardCard}>
              <Text style={s.wizardTitle}>GARMIN SETUP (ONE TIME)</Text>
              {[
                { n: '1', text: 'Connect Strava above (if not already done)' },
                { n: '2', text: 'Open Garmin Connect app → ☰ Menu → Settings → Partner Apps → find Strava → tap Connect' },
                { n: '3', text: 'Turn on "Auto Upload" — every Garmin run will now auto-appear in Strava and Stride' },
              ].map(step => (
                <View key={step.n} style={s.wizardStep}>
                  <View style={[s.wizardNum, !stravaTokens && step.n === '1' && s.wizardNumActive]}>
                    <Text style={s.wizardNumText}>{step.n}</Text>
                  </View>
                  <Text style={[s.wizardText, !stravaTokens && step.n !== '1' && s.wizardTextMuted]}>
                    {step.text}
                  </Text>
                </View>
              ))}
              {stravaTokens ? (
                <View style={s.garminNote}>
                  <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                  <Text style={[s.garminNoteText, { color: '#16A34A' }]}>
                    Strava connected — complete step 2 and 3 in Garmin Connect to finish setup.
                  </Text>
                </View>
              ) : (
                <View style={s.garminNote}>
                  <Ionicons name="alert-circle-outline" size={14} color="#F59E0B" />
                  <Text style={[s.garminNoteText, { color: '#F59E0B' }]}>
                    Connect Strava first (step 1), then complete the Garmin setup.
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={s.divider} />

          {/* ── Manual import note ─────────────────────────────────────────── */}
          <View style={s.manualNote}>
            <Text style={s.manualNoteTitle}>MANUAL LOG</Text>
            <Text style={s.manualNoteText}>
              Always available — tap "+ LOG RUN" on any shoe in your Arsenal to record a run manually with full terrain, purpose, and match-quality tracking.
            </Text>
          </View>

          <View style={s.divider} />

          {/* ── Test mode ───────────────────────────────────────────────────── */}
          <View style={s.testSection}>
            <View style={s.testHeader}>
              <View style={[s.iconBox, { backgroundColor: '#6D28D9' }]}>
                <Text style={s.iconText}>T</Text>
              </View>
              <View style={s.sectionMeta}>
                <Text style={s.sectionTitle}>TEST MODE</Text>
                <Text style={s.sectionSub}>Simulate synced runs without a real watch</Text>
              </View>
            </View>

            <Text style={s.integrationDesc}>
              No Strava account? No watch? Seed realistic fake runs as if synced from Strava or Apple Health — all terrain types, run purposes, and distances covered.
            </Text>

            {/* Source picker */}
            <Text style={s.seedLabel}>SIMULATE SOURCE</Text>
            <View style={s.chipRow}>
              {(['strava', 'apple_health'] as const).map(src => (
                <TouchableOpacity
                  key={src}
                  onPress={() => setSeedSource(src)}
                  style={[s.chip, seedSource === src && s.chipActive]}
                >
                  <Text style={[s.chipText, seedSource === src && s.chipTextActive]}>
                    {src === 'strava' ? 'STRAVA' : 'APPLE HEALTH'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Count picker */}
            <Text style={[s.seedLabel, { marginTop: 12 }]}>NUMBER OF RUNS</Text>
            <View style={s.chipRow}>
              {([5, 10, 20] as const).map(n => (
                <TouchableOpacity
                  key={n}
                  onPress={() => setSeedCount(n)}
                  style={[s.chip, seedCount === n && s.chipActive]}
                >
                  <Text style={[s.chipText, seedCount === n && s.chipTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Seed result */}
            {seedState === 'done' && seedResult !== '' && (
              <View style={s.seedResult}>
                <Text style={s.seedResultText}>DONE: {seedResult}</Text>
              </View>
            )}
            {seedState === 'error' && seedResult !== '' && (
              <View style={[s.seedResult, { borderColor: ACCENT }]}>
                <Text style={[s.seedResultText, { color: ACCENT }]}>ERR: {seedResult}</Text>
              </View>
            )}

            {/* Buttons */}
            <View style={s.btnRow}>
              <TouchableOpacity
                onPress={handleSeedRuns}
                disabled={seedState === 'syncing'}
                style={[s.seedBtn, seedState === 'syncing' && { opacity: 0.6 }]}
              >
                <Text style={s.seedBtnText}>
                  {seedState === 'syncing' ? 'SEEDING...' : 'SEED TEST DATA'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClearSeeded} style={s.clearBtn}>
                <Text style={s.clearBtnText}>CLEAR</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>

      <WatchConnectModal visible={showWatches} onClose={() => setShowWatches(false)} />
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 2, borderBottomColor: INK,
  },
  eyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '900', color: INK, letterSpacing: -1 },
  closeBtn: { padding: 4 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },

  section: { paddingVertical: 4 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 2, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: INK },
  iconText: { fontSize: 18, fontWeight: '900', color: '#fff' },
  sectionMeta: { flex: 1 },
  sectionTitle: { fontFamily: MONO, fontSize: 12, fontWeight: '700', color: INK, letterSpacing: 1.5 },
  sectionSub: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  connectedCard: { backgroundColor: 'rgba(10,10,10,0.05)', padding: 12, borderRadius: 2, borderWidth: 1, borderColor: 'rgba(10,10,10,0.1)', marginBottom: 12 },
  connectedLabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 4 },
  connectedName: { fontSize: 15, fontWeight: '800', color: INK },

  integrationDesc: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.6)', lineHeight: 18, marginBottom: 14 },

  connectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: INK, paddingVertical: 14, borderRadius: 2, marginBottom: 4,
  },
  connectBtnText: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: PAPER, letterSpacing: 1.5 },

  btnRow: { flexDirection: 'row', gap: 10 },
  syncBtn: { flex: 2, backgroundColor: INK, paddingVertical: 12, borderRadius: 2, alignItems: 'center' },
  syncBtnText: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: PAPER, letterSpacing: 1 },
  disconnectBtn: { flex: 1, paddingVertical: 12, borderWidth: 2, borderColor: ACCENT, borderRadius: 2, alignItems: 'center' },
  disconnectText: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 1 },

  gearSection: { marginBottom: 14 },
  gearLabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 10 },
  gearRow: { marginBottom: 10 },
  gearLeft: { marginBottom: 6 },
  gearName: { fontSize: 13, fontWeight: '700', color: INK },
  gearDist: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)' },
  gearShoeScroll: { maxHeight: 40 },
  gearShoeChip: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 2, borderColor: 'rgba(10,10,10,0.2)', borderRadius: 2, marginRight: 8, maxWidth: 120 },
  gearShoeChipActive: { borderColor: INK, backgroundColor: INK },
  gearShoeText: { fontFamily: MONO, fontSize: 9, color: INK },
  gearShoeTextActive: { color: PAPER },

  garminNote: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: 'rgba(10,10,10,0.04)', padding: 12, borderRadius: 2, marginTop: 8 },
  garminNoteText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.6)', flex: 1, lineHeight: 18 },

  wizardCard:      { backgroundColor: 'rgba(10,10,10,0.04)', borderRadius: 2, padding: 14, gap: 10, borderWidth: 1, borderColor: 'rgba(10,10,10,0.08)' },
  wizardTitle:     { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 4 },
  wizardStep:      { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  wizardNum:       { width: 22, height: 22, borderRadius: 11, backgroundColor: INK, alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  wizardNumActive: { backgroundColor: ACCENT },
  wizardNumText:   { fontFamily: MONO, fontSize: 9, fontWeight: '700', color: PAPER },
  wizardText:      { fontFamily: MONO, fontSize: 10, color: INK, flex: 1, lineHeight: 17 },
  wizardTextMuted: { color: 'rgba(10,10,10,0.35)' },

  divider: { height: 2, backgroundColor: 'rgba(10,10,10,0.06)', marginVertical: 20 },

  manualNote: { backgroundColor: LIME, padding: 16, borderRadius: 2, borderWidth: 2, borderColor: INK },
  manualNoteTitle: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: INK, letterSpacing: 1.5, marginBottom: 6 },
  manualNoteText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.7)', lineHeight: 18 },

  watchShortcut: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: INK, borderRadius: 2, padding: 16,
  },
  watchShortcutLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  watchShortcutIcon: { fontSize: 24 },
  watchShortcutTitle: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: PAPER, letterSpacing: 1 },
  watchShortcutSub:   { fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.45)', marginTop: 2 },

  // test mode
  testSection: { paddingVertical: 4 },
  testHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  seedLabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderWidth: 2, borderColor: 'rgba(10,10,10,0.2)', borderRadius: 2 },
  chipActive: { borderColor: INK, backgroundColor: INK },
  chipText: { fontFamily: MONO, fontSize: 9, color: INK, letterSpacing: 1 },
  chipTextActive: { color: PAPER },
  seedResult: { borderWidth: 1, borderColor: '#16A34A', borderRadius: 2, padding: 10, marginTop: 12 },
  seedResultText: { fontFamily: MONO, fontSize: 10, color: '#16A34A', letterSpacing: 0.5 },
  seedBtn: { flex: 2, backgroundColor: '#6D28D9', paddingVertical: 12, borderRadius: 2, alignItems: 'center' },
  seedBtnText: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  clearBtn: { flex: 1, paddingVertical: 12, borderWidth: 2, borderColor: 'rgba(10,10,10,0.3)', borderRadius: 2, alignItems: 'center' },
  clearBtnText: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.5)', letterSpacing: 1 },
});
