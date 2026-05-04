/**
 * Integrations settings modal — Strava, Apple Health, Garmin.
 * Mount this anywhere; typically opened from Coach or Arsenal.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getStravaTokens, disconnectStrava, syncStravaActivities,
  getStravaAuthUrl, getStravaGear, StravaGear, StravaTokens,
} from '../app/services/stravaService';
import {
  getHealthPermStatus, requestHealthPermission,
  syncHealthWorkouts, HealthPermStatus, GARMIN_INTEGRATION_NOTE,
} from '../app/services/healthService';
import { getFavorites } from '../app/utils/storage';
import { SHOES } from '../app/data/shoes';

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

  useEffect(() => {
    if (!visible) return;
    load();
  }, [visible]);

  const load = async () => {
    const [tokens, status, favs] = await Promise.all([
      getStravaTokens(),
      getHealthPermStatus(),
      getFavorites(),
    ]);
    setStravaTokens(tokens);
    setHealthStatus(status);
    setArsenalIds(favs);
    if (tokens) {
      const gear = await getStravaGear();
      setStravaGear(gear);
    }
  };

  // ── Strava ────────────────────────────────────────────────────────────────
  const handleStravaConnect = async () => {
    const url = getStravaAuthUrl();
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Cannot open Strava', 'Make sure Strava is installed or use Safari.');
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
    const result = await syncStravaActivities(gearMap);
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
    setGearMap(prev => ({ ...prev, [stravaGearId]: shoeId }));
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

          {/* ── Strava ─────────────────────────────────────────────────────── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={[s.iconBox, { backgroundColor: '#FC4C02' }]}>
                <Text style={s.iconText}>S</Text>
              </View>
              <View style={s.sectionMeta}>
                <Text style={s.sectionTitle}>STRAVA</Text>
                <Text style={s.sectionSub}>Auto-import runs · Sync gear mileage</Text>
              </View>
              <View style={[s.statusDot, { backgroundColor: stravaTokens ? '#16A34A' : 'rgba(10,10,10,0.2)' }]} />
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
                    <Text style={s.gearLabel}>MAP STRAVA GEAR → ARSENAL SHOE</Text>
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
                      {stravaSync === 'syncing' ? 'SYNCING...' : stravaSync === 'done' ? `✓ ${stravaSyncResult}` : stravaSync === 'error' ? `✕ ${stravaSyncResult}` : 'SYNC NOW →'}
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
                <TouchableOpacity onPress={handleStravaConnect} style={s.connectBtn}>
                  <Text style={s.connectBtnText}>CONNECT STRAVA →</Text>
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
                  <View style={[s.iconBox, { backgroundColor: '#FF2D55' }]}>
                    <Text style={s.iconText}>♥</Text>
                  </View>
                  <View style={s.sectionMeta}>
                    <Text style={s.sectionTitle}>APPLE HEALTH</Text>
                    <Text style={s.sectionSub}>Import workouts from Health app</Text>
                  </View>
                  <View style={[s.statusDot, { backgroundColor: healthStatus === 'authorized' ? '#16A34A' : 'rgba(10,10,10,0.2)' }]} />
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
                        {healthSync === 'syncing' ? 'SYNCING...' : healthSync === 'done' ? `✓ ${healthSyncResult}` : healthSync === 'error' ? `✕ ${healthSyncResult}` : 'SYNC NOW →'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={s.integrationDesc}>
                      Pull running workouts directly from your Apple Health data. Runs are matched to your weekly roster shoes automatically.
                    </Text>
                    <TouchableOpacity onPress={handleHealthConnect} style={s.connectBtn}>
                      <Text style={s.connectBtnText}>CONNECT APPLE HEALTH →</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <View style={s.divider} />
            </>
          )}

          {/* ── Garmin ─────────────────────────────────────────────────────── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={[s.iconBox, { backgroundColor: '#007CC3' }]}>
                <Text style={s.iconText}>G</Text>
              </View>
              <View style={s.sectionMeta}>
                <Text style={s.sectionTitle}>GARMIN</Text>
                <Text style={s.sectionSub}>Via Strava auto-sync</Text>
              </View>
              <View style={[s.statusDot, { backgroundColor: stravaTokens ? '#16A34A' : 'rgba(10,10,10,0.2)' }]} />
            </View>
            <View style={s.garminNote}>
              <Ionicons name="information-circle-outline" size={16} color="rgba(10,10,10,0.4)" />
              <Text style={s.garminNoteText}>{GARMIN_INTEGRATION_NOTE}</Text>
            </View>
          </View>

          <View style={s.divider} />

          {/* ── Manual import note ─────────────────────────────────────────��─ */}
          <View style={s.manualNote}>
            <Text style={s.manualNoteTitle}>MANUAL LOG</Text>
            <Text style={s.manualNoteText}>
              Always available — tap "+ LOG RUN" on any shoe in your Arsenal to record a run manually with full terrain, purpose, and match-quality tracking.
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
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

  connectBtn: { backgroundColor: INK, paddingVertical: 14, borderRadius: 2, alignItems: 'center', marginBottom: 4 },
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

  garminNote: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: 'rgba(10,10,10,0.04)', padding: 12, borderRadius: 2 },
  garminNoteText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.6)', flex: 1, lineHeight: 18 },

  divider: { height: 2, backgroundColor: 'rgba(10,10,10,0.06)', marginVertical: 20 },

  manualNote: { backgroundColor: LIME, padding: 16, borderRadius: 2, borderWidth: 2, borderColor: INK },
  manualNoteTitle: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: INK, letterSpacing: 1.5, marginBottom: 6 },
  manualNoteText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.7)', lineHeight: 18 },
});
