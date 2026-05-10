/**
 * DRIFT MAP — Phase 3
 * Three-tab screen: PATHS list, MAP visual, CITIES
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Alert, TextInput, FlatList, ActivityIndicator,
  Dimensions,
} from 'react-native';
import MapView, { Polyline, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { RunPath, TerritoryState, City, HeatLevel, HEAT_COLOR, HEAT_RANK } from '../../types/territory';
import { getAllPaths, getAllTerritoryStates, renamePath, getTerritoryState } from '../../utils/pathStorage';
import { getAllCities, saveCity, setHomeCity, getHomeCity } from '../../utils/cityStorage';
import { getTerritorySnapshot } from '../../utils/driftEngine';
import { getUserProfile } from '../../utils/userProfile';
import * as Crypto from 'expo-crypto';

const { width: SW } = Dimensions.get('window');

// ─── Map custom style (brutalist dark) ────────────────────────────────────────
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0A0A0A' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#F4F1EA' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0A0A0A' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1A1A1A' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#222' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2A2A2A' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0D1B2A' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1C1C1C' }] },
];

type Tab = 'PATHS' | 'MAP' | 'CITIES';

// ─── Heat badge ───────────────────────────────────────────────────────────────
function HeatBadge({ heat }: { heat: HeatLevel }) {
  const color = HEAT_COLOR[heat];
  return (
    <View style={[s.badge, { borderColor: color }]}>
      <Text style={[s.badgeText, { color }]}>{heat}</Text>
    </View>
  );
}

// ─── Path row ─────────────────────────────────────────────────────────────────
function PathRow({
  path, state, onPress,
}: { path: RunPath; state: TerritoryState | null; onPress: () => void }) {
  const heat: HeatLevel = state?.heat ?? 'COLD';
  const color = HEAT_COLOR[heat];
  return (
    <TouchableOpacity style={s.pathRow} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.pathHeatBar, { backgroundColor: color }]} />
      <View style={s.pathInfo}>
        <Text style={s.pathName} numberOfLines={1}>{path.name}</Text>
        <Text style={s.pathMeta}>
          {path.distanceKm.toFixed(1)} KM
          {path.city ? `  ·  ${path.city}` : ''}
          {state ? `  ·  ${state.run_count} RUNS` : ''}
        </Text>
      </View>
      <HeatBadge heat={heat} />
    </TouchableOpacity>
  );
}

// ─── City row ─────────────────────────────────────────────────────────────────
function CityRow({ city, isHome, onSetHome }: { city: City; isHome: boolean; onSetHome: () => void }) {
  return (
    <View style={s.cityRow}>
      <View style={s.cityInfo}>
        <Text style={s.cityName}>{city.name.toUpperCase()}</Text>
        <Text style={s.cityMeta}>{city.country}  ·  {city.active_runner_count} RUNNERS</Text>
      </View>
      <TouchableOpacity style={[s.homeBtn, isHome && s.homeBtnActive]} onPress={onSetHome}>
        <Text style={[s.homeBtnText, isHome && s.homeBtnTextActive]}>
          {isHome ? 'HOME' : 'SET HOME'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Add city modal ───────────────────────────────────────────────────────────
function AddCityModal({ onAdd, onClose }: { onAdd: (city: City) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    const city: City = {
      id: Crypto.randomUUID(),
      name: name.trim(),
      country: country.trim() || 'Unknown',
      lat: 0,
      lng: 0,
      radius_km: 15,
      active_runner_count: 1,
      popular_shoes: [],
      created_at: new Date().toISOString(),
    };
    onAdd(city);
  };

  return (
    <View style={s.modalOverlay}>
      <View style={s.modal}>
        <Text style={s.modalTitle}>ADD CITY</Text>
        <TextInput
          style={s.input}
          placeholder="CITY NAME"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
          autoFocus
        />
        <TextInput
          style={s.input}
          placeholder="COUNTRY"
          placeholderTextColor="#666"
          value={country}
          onChangeText={setCountry}
        />
        <View style={s.modalActions}>
          <TouchableOpacity style={s.modalBtn} onPress={onClose}>
            <Text style={s.modalBtnText}>CANCEL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.modalBtn, s.modalBtnAccent]} onPress={handleAdd}>
            <Text style={[s.modalBtnText, { color: '#0A0A0A' }]}>ADD</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Rename modal ─────────────────────────────────────────────────────────────
function RenameModal({ path, onSave, onClose }: { path: RunPath; onSave: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState(path.name);
  return (
    <View style={s.modalOverlay}>
      <View style={s.modal}>
        <Text style={s.modalTitle}>RENAME ROUTE</Text>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          autoFocus
          selectTextOnFocus
        />
        <View style={s.modalActions}>
          <TouchableOpacity style={s.modalBtn} onPress={onClose}>
            <Text style={s.modalBtnText}>CANCEL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.modalBtn, s.modalBtnAccent]} onPress={() => onSave(name)}>
            <Text style={[s.modalBtnText, { color: '#0A0A0A' }]}>SAVE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [tab, setTab] = useState<Tab>('PATHS');
  const [paths, setPaths] = useState<RunPath[]>([]);
  const [states, setStates] = useState<Map<string, TerritoryState>>(new Map());
  const [cities, setCities] = useState<City[]>([]);
  const [homeCity, setHomeCityState] = useState<City | null>(null);
  const [snapshot, setSnapshot] = useState({ total: 0, legendary: 0, yours: 0, hot: 0, warm: 0, cold: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<RunPath | null>(null);
  const [renamingPath, setRenamingPath] = useState<RunPath | null>(null);
  const [addingCity, setAddingCity] = useState(false);
  const [userLevel, setUserLevel] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const [allPaths, allStates, allCities, hc, snap, profile] = await Promise.all([
      getAllPaths(),
      getAllTerritoryStates(),
      getAllCities(),
      getHomeCity(),
      getTerritorySnapshot(),
      getUserProfile(),
    ]);
    const stateMap = new Map(allStates.map(st => [st.path_id, st]));
    // Sort paths by heat rank descending, then run_count
    const sorted = [...allPaths].sort((a, b) => {
      const ha = HEAT_RANK[stateMap.get(a.id)?.heat ?? 'COLD'];
      const hb = HEAT_RANK[stateMap.get(b.id)?.heat ?? 'COLD'];
      if (hb !== ha) return hb - ha;
      return (stateMap.get(b.id)?.run_count ?? 0) - (stateMap.get(a.id)?.run_count ?? 0);
    });
    setPaths(sorted);
    setStates(stateMap);
    setCities(allCities);
    setHomeCityState(hc);
    setSnapshot(snap);
    setUserLevel(profile.current_level);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handlePathPress = (path: RunPath) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPath(path);
    if (tab !== 'MAP') setTab('MAP');
    // Zoom to path
    if (path.coordinates.length > 0 && mapRef.current) {
      const lats = path.coordinates.map(c => c.lat);
      const lngs = path.coordinates.map(c => c.lng);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
      mapRef.current.animateToRegion({
        latitude:      (minLat + maxLat) / 2,
        longitude:     (minLng + maxLng) / 2,
        latitudeDelta: (maxLat - minLat) * 1.5 || 0.01,
        longitudeDelta:(maxLng - minLng) * 1.5 || 0.01,
      }, 600);
    }
  };

  const handleRename = async (name: string) => {
    if (!renamingPath) return;
    await renamePath(renamingPath.id, name);
    setRenamingPath(null);
    await load();
  };

  const handleAddCity = async (city: City) => {
    await saveCity(city);
    setAddingCity(false);
    await load();
  };

  const handleSetHome = async (cityId: string) => {
    await setHomeCity(cityId);
    await load();
  };

  // ── Render PATHS tab ───────────────────────────────────────────────────────
  const renderPaths = () => (
    <ScrollView style={s.scrollArea} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Summary chips */}
      <View style={s.chipRow}>
        {(['LEGENDARY', 'YOURS', 'HOT', 'WARM', 'COLD'] as HeatLevel[]).map(h => (
          <View key={h} style={[s.chip, { borderColor: HEAT_COLOR[h] }]}>
            <Text style={[s.chipCount, { color: HEAT_COLOR[h] }]}>{(snapshot as any)[h.toLowerCase()]}</Text>
            <Text style={[s.chipLabel, { color: HEAT_COLOR[h] }]}>{h}</Text>
          </View>
        ))}
      </View>

      {paths.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>NO ROUTES YET</Text>
          <Text style={s.emptyBody}>
            Connect Strava or log GPS runs to start building territory. Every route you run gets detected and tracked here.
          </Text>
        </View>
      ) : (
        paths.map(path => (
          <PathRow
            key={path.id}
            path={path}
            state={states.get(path.id) ?? null}
            onPress={() => handlePathPress(path)}
          />
        ))
      )}
    </ScrollView>
  );

  // ── Render MAP tab ─────────────────────────────────────────────────────────
  const renderMap = () => (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        customMapStyle={DARK_MAP_STYLE}
        initialRegion={{
          latitude: 37.78,
          longitude: -122.43,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {paths.map(path => {
          if (path.coordinates.length < 2) return null;
          const heat: HeatLevel = states.get(path.id)?.heat ?? 'COLD';
          const color = HEAT_COLOR[heat];
          const isSelected = selectedPath?.id === path.id;
          return (
            <Polyline
              key={path.id}
              coordinates={path.coordinates.map(c => ({ latitude: c.lat, longitude: c.lng }))}
              strokeColor={color}
              strokeWidth={isSelected ? 5 : 2}
              tappable
              onPress={() => setSelectedPath(path)}
            />
          );
        })}
      </MapView>

      {/* Selected path info card */}
      {selectedPath && (() => {
        const st = states.get(selectedPath.id);
        const heat: HeatLevel = st?.heat ?? 'COLD';
        const color = HEAT_COLOR[heat];
        return (
          <View style={s.pathCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.pathCardName} numberOfLines={1}>{selectedPath.name}</Text>
              <Text style={s.pathCardMeta}>
                {selectedPath.distanceKm.toFixed(1)} KM  ·  {st?.run_count ?? 0} RUNS
              </Text>
            </View>
            <HeatBadge heat={heat} />
            <TouchableOpacity onPress={() => setRenamingPath(selectedPath)} style={s.renameBtn}>
              <Ionicons name="pencil-outline" size={16} color="#F4F1EA" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedPath(null)} style={s.closeBtn}>
              <Ionicons name="close" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        );
      })()}

      {/* Heat legend */}
      <View style={s.legend}>
        {(['LEGENDARY', 'YOURS', 'HOT', 'WARM', 'COLD'] as HeatLevel[]).map(h => (
          <View key={h} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: HEAT_COLOR[h] }]} />
            <Text style={s.legendLabel}>{h[0]}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  // ── Render CITIES tab ──────────────────────────────────────────────────────
  const renderCities = () => (
    <ScrollView style={s.scrollArea} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Only level 8+ can host, but anyone can add cities */}
      <TouchableOpacity style={s.addCityBtn} onPress={() => setAddingCity(true)} activeOpacity={0.8}>
        <Ionicons name="add-circle-outline" size={18} color="#FF3D00" />
        <Text style={s.addCityBtnText}>ADD CITY</Text>
      </TouchableOpacity>

      {userLevel >= 8 && (
        <View style={s.hostBanner}>
          <Text style={s.hostBannerText}>LEVEL {userLevel} — YOU CAN HOST A CITY</Text>
        </View>
      )}

      {cities.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>NO CITIES ADDED</Text>
          <Text style={s.emptyBody}>
            Add your home city to see who else is running your routes. Cities connect territory across users.
          </Text>
        </View>
      ) : (
        cities.map(city => (
          <CityRow
            key={city.id}
            city={city}
            isHome={homeCity?.id === city.id}
            onSetHome={() => handleSetHome(city.id)}
          />
        ))
      )}
    </ScrollView>
  );

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>DRIFT</Text>
        <Text style={s.headerSub}>TERRITORY</Text>
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {(['PATHS', 'MAP', 'CITIES'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[s.tabBtn, tab === t && s.tabBtnActive]}
            onPress={() => { Haptics.selectionAsync(); setTab(t); }}
          >
            <Text style={[s.tabBtnText, tab === t && s.tabBtnTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator color="#FF3D00" />
        </View>
      ) : (
        tab === 'PATHS' ? renderPaths() :
        tab === 'MAP'   ? renderMap()   :
                          renderCities()
      )}

      {/* Modals */}
      {renamingPath && (
        <RenameModal
          path={renamingPath}
          onSave={handleRename}
          onClose={() => setRenamingPath(null)}
        />
      )}
      {addingCity && (
        <AddCityModal
          onAdd={handleAddCity}
          onClose={() => setAddingCity(false)}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0A0A0A' },

  header:         { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 32, paddingBottom: 12, gap: 8 },
  headerTitle:    { fontFamily: 'SpaceMono', fontSize: 22, color: '#FF3D00', letterSpacing: 3 },
  headerSub:      { fontFamily: 'SpaceMono', fontSize: 11, color: 'rgba(244,241,234,0.4)', letterSpacing: 2 },

  tabBar:         { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  tabBtn:         { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive:   { borderBottomWidth: 2, borderBottomColor: '#FF3D00' },
  tabBtnText:     { fontFamily: 'SpaceMono', fontSize: 11, color: 'rgba(244,241,234,0.4)', letterSpacing: 1 },
  tabBtnTextActive:{ color: '#FF3D00' },

  scrollArea:     { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  loader:         { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Chip row
  chipRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  chip:           { alignItems: 'center', borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 6, flex: 1, marginHorizontal: 2 },
  chipCount:      { fontFamily: 'SpaceMono', fontSize: 16, fontWeight: 'bold' },
  chipLabel:      { fontFamily: 'SpaceMono', fontSize: 8, letterSpacing: 1, marginTop: 2 },

  // Path row
  pathRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 4, marginBottom: 8, overflow: 'hidden' },
  pathHeatBar:    { width: 4, alignSelf: 'stretch' },
  pathInfo:       { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
  pathName:       { fontFamily: 'SpaceMono', fontSize: 12, color: '#F4F1EA', letterSpacing: 1 },
  pathMeta:       { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(244,241,234,0.4)', marginTop: 3, letterSpacing: 0.5 },

  // Heat badge
  badge:          { borderWidth: 1, borderRadius: 3, paddingHorizontal: 7, paddingVertical: 3, marginRight: 12 },
  badgeText:      { fontFamily: 'SpaceMono', fontSize: 9, letterSpacing: 1 },

  // Map path card
  pathCard:       { position: 'absolute', bottom: 16, left: 16, right: 16, backgroundColor: '#111', borderRadius: 4, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, borderWidth: 1, borderColor: '#222' },
  pathCardName:   { fontFamily: 'SpaceMono', fontSize: 12, color: '#F4F1EA', letterSpacing: 1 },
  pathCardMeta:   { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(244,241,234,0.4)', marginTop: 3 },
  renameBtn:      { padding: 6 },
  closeBtn:       { padding: 6 },

  // Map legend
  legend:         { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(10,10,10,0.85)', borderRadius: 4, padding: 8, gap: 4 },
  legendItem:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:      { width: 8, height: 8, borderRadius: 4 },
  legendLabel:    { fontFamily: 'SpaceMono', fontSize: 9, color: '#F4F1EA' },

  // Cities
  cityRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 4, marginBottom: 8, padding: 14 },
  cityInfo:       { flex: 1 },
  cityName:       { fontFamily: 'SpaceMono', fontSize: 13, color: '#F4F1EA', letterSpacing: 1 },
  cityMeta:       { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(244,241,234,0.4)', marginTop: 3 },
  homeBtn:        { borderWidth: 1, borderColor: '#444', borderRadius: 3, paddingHorizontal: 10, paddingVertical: 5 },
  homeBtnActive:  { borderColor: '#FF3D00', backgroundColor: '#FF3D00' },
  homeBtnText:    { fontFamily: 'SpaceMono', fontSize: 9, color: '#666', letterSpacing: 1 },
  homeBtnTextActive:{ color: '#0A0A0A' },

  addCityBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#FF3D00', borderRadius: 4, paddingVertical: 12, justifyContent: 'center', marginBottom: 16 },
  addCityBtnText: { fontFamily: 'SpaceMono', fontSize: 12, color: '#FF3D00', letterSpacing: 1 },

  hostBanner:     { backgroundColor: '#1A1A1A', borderRadius: 4, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#FFD700' },
  hostBannerText: { fontFamily: 'SpaceMono', fontSize: 10, color: '#FFD700', letterSpacing: 1, textAlign: 'center' },

  // Empty state
  empty:          { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyTitle:     { fontFamily: 'SpaceMono', fontSize: 14, color: 'rgba(244,241,234,0.3)', letterSpacing: 2, marginBottom: 12 },
  emptyBody:      { fontFamily: 'SpaceMono', fontSize: 11, color: 'rgba(244,241,234,0.2)', textAlign: 'center', lineHeight: 20 },

  // Modal
  modalOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal:          { width: SW - 48, backgroundColor: '#111', borderRadius: 6, padding: 24, borderWidth: 1, borderColor: '#222' },
  modalTitle:     { fontFamily: 'SpaceMono', fontSize: 14, color: '#FF3D00', letterSpacing: 2, marginBottom: 20 },
  input:          { backgroundColor: '#1A1A1A', borderRadius: 4, borderWidth: 1, borderColor: '#333', color: '#F4F1EA', fontFamily: 'SpaceMono', fontSize: 12, padding: 12, marginBottom: 12 },
  modalActions:   { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn:       { flex: 1, paddingVertical: 12, borderRadius: 4, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  modalBtnAccent: { backgroundColor: '#FF3D00', borderColor: '#FF3D00' },
  modalBtnText:   { fontFamily: 'SpaceMono', fontSize: 11, color: '#F4F1EA', letterSpacing: 1 },
});
