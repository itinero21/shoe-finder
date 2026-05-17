/**
 * DRIFT MAP — Phase 4
 * GPS location, interactive territory pins with owner callouts, city geocoding.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Alert, TextInput, ActivityIndicator,
  Dimensions,
} from 'react-native';
import MapView, { Polyline, Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { RunPath, TerritoryState, City, HeatLevel, HEAT_COLOR, HEAT_RANK } from '../types/territory';
import { getAllPaths, getAllTerritoryStates, renamePath } from '../utils/pathStorage';
import { getAllCities, saveCity, setHomeCity, getHomeCity } from '../utils/cityStorage';
import { getTerritorySnapshot } from '../utils/driftEngine';
import { getUserProfile } from '../utils/userProfile';
import * as Crypto from 'expo-crypto';

const { width: SW } = Dimensions.get('window');

// ─── Map style (clean light) ──────────────────────────────────────────────────
const LIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#F4F1EA' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#0A0A0A' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#F4F1EA' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#E8E4DC' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#D8D4CC' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#CCCCCC' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#C8D8E8' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#E0DDD6' }] },
];

type Tab = 'PATHS' | 'MAP' | 'CITIES';

// ─── Territory pin type ───────────────────────────────────────────────────────
type TerritoryPin = {
  id: string;
  lat: number;
  lng: number;
  ownerName: string;
  ownerEmoji: string;
  heat: HeatLevel;
  runCount: number;
  pathName: string;
  isYours: boolean;
};

// Heat → emoji for owner pins
function heatEmoji(heat: HeatLevel): string {
  if (heat === 'LEGENDARY') return '👑';
  if (heat === 'YOURS') return '⚡️';
  if (heat === 'HOT') return '🔥';
  if (heat === 'WARM') return '🏃';
  return '👟';
}

// Seeded deterministic int from a string — for stable rival names/offsets
function seedInt(seed: string, max: number): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(h, 33) ^ seed.charCodeAt(i)) | 0;
  return Math.abs(h) % max;
}

const RIVAL_NAMES = [
  'PACER_7842', 'RUNNER_3391', 'GHOST_5519', 'APEX_2204',
  'STRIDER_8801', 'VOLT_4420', 'FLUX_1133', 'NOVA_6677',
];
const RIVAL_EMOJIS = ['🦅', '🐺', '🦊', '🐉', '🦁', '🦎', '🐯', '🦂'];

// Build territory pins from paths + states
function buildPins(paths: RunPath[], states: Map<string, TerritoryState>): TerritoryPin[] {
  const pins: TerritoryPin[] = [];

  for (const path of paths) {
    if (path.coordinates.length < 2) continue;
    const midIdx = Math.floor(path.coordinates.length / 2);
    const mid = path.coordinates[midIdx];
    const st = states.get(path.id);
    const heat: HeatLevel = st?.heat ?? 'COLD';

    // Your pin
    pins.push({
      id: `yours_${path.id}`,
      lat: mid.lat,
      lng: mid.lng,
      ownerName: 'YOU',
      ownerEmoji: heatEmoji(heat),
      heat,
      runCount: st?.run_count ?? 0,
      pathName: path.name,
      isYours: true,
    });

    // One rival pin per path, seeded so it's consistent across renders
    const ri = seedInt(path.id, RIVAL_NAMES.length);
    const latOffset = (seedInt(path.id + 'lat', 100) - 50) * 0.0001;
    const lngOffset = (seedInt(path.id + 'lng', 100) - 50) * 0.0001;
    const rivalHeat: HeatLevel = (['COLD', 'WARM', 'HOT'] as HeatLevel[])[seedInt(path.id + 'heat', 3)];
    pins.push({
      id: `rival_${path.id}`,
      lat: mid.lat + latOffset,
      lng: mid.lng + lngOffset,
      ownerName: RIVAL_NAMES[ri],
      ownerEmoji: RIVAL_EMOJIS[ri],
      heat: rivalHeat,
      runCount: seedInt(path.id + 'runs', 12) + 1,
      pathName: path.name,
      isYours: false,
    });
  }

  return pins;
}

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
function PathRow({ path, state, onPress }: { path: RunPath; state: TerritoryState | null; onPress: () => void }) {
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
  const [userLat, setUserLat] = useState(0);
  const [userLng, setUserLng] = useState(0);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLat(loc.coords.latitude);
        setUserLng(loc.coords.longitude);
      }
    })();
  }, []);

  const handleAdd = () => {
    if (!name.trim()) return;
    const city: City = {
      id: Crypto.randomUUID(),
      name: name.trim(),
      country: country.trim() || 'Unknown',
      lat: userLat,
      lng: userLng,
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
          placeholderTextColor="rgba(10,10,10,0.35)"
          value={name}
          onChangeText={setName}
          autoFocus
        />
        <TextInput
          style={s.input}
          placeholder="COUNTRY"
          placeholderTextColor="rgba(10,10,10,0.35)"
          value={country}
          onChangeText={setCountry}
        />
        {userLat !== 0 && (
          <Text style={s.gpsHint}>📍 Using your current location</Text>
        )}
        <View style={s.modalActions}>
          <TouchableOpacity style={s.modalBtn} onPress={onClose}>
            <Text style={s.modalBtnText}>CANCEL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.modalBtn, s.modalBtnAccent]} onPress={handleAdd}>
            <Text style={[s.modalBtnText, { color: '#FFFFFF' }]}>ADD</Text>
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
            <Text style={[s.modalBtnText, { color: '#FFFFFF' }]}>SAVE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function MapScreen() {
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
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pins, setPins] = useState<TerritoryPin[]>([]);

  // Request GPS on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    })();
  }, []);

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
    const stateMap = new Map<string, TerritoryState>(allStates.map((st: TerritoryState) => [st.path_id, st]));
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
    setPins(buildPins(sorted, stateMap));
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handlePathPress = (path: RunPath) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPath(path);
    if (tab !== 'MAP') setTab('MAP');
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
    // Fly to the city if it has real coordinates
    if (city.lat !== 0 && city.lng !== 0 && mapRef.current) {
      setTab('MAP');
      setTimeout(() => {
        mapRef.current?.animateToRegion({
          latitude: city.lat,
          longitude: city.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 800);
      }, 300);
    }
  };

  const handleSetHome = async (cityId: string) => {
    await setHomeCity(cityId);
    await load();
  };

  // ── PATHS tab ──────────────────────────────────────────────────────────────
  const renderPaths = () => (
    <ScrollView style={s.scrollArea} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.chipRow}>
        {([
          { h: 'LEGENDARY' as HeatLevel, count: snapshot.legendary },
          { h: 'YOURS'     as HeatLevel, count: snapshot.yours },
          { h: 'HOT'       as HeatLevel, count: snapshot.hot },
          { h: 'WARM'      as HeatLevel, count: snapshot.warm },
          { h: 'COLD'      as HeatLevel, count: snapshot.cold },
        ]).map(({ h, count }) => (
          <View key={h} style={[s.chip, { borderColor: HEAT_COLOR[h] }]}>
            <Text style={[s.chipCount, { color: HEAT_COLOR[h] }]}>{count}</Text>
            <Text style={[s.chipLabel, { color: HEAT_COLOR[h] }]}>{h}</Text>
          </View>
        ))}
      </View>

      {paths.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>NO ROUTES YET</Text>
          <Text style={s.emptyBody}>
            Connect Strava on the home screen to import your GPS runs. Every route you run gets detected and tracked here.
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

  // ── MAP tab ────────────────────────────────────────────────────────────────
  const renderMap = () => {
    const initRegion = userLocation
      ? { latitude: userLocation.lat, longitude: userLocation.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }
      : { latitude: 37.78, longitude: -122.43, latitudeDelta: 0.1, longitudeDelta: 0.1 };

    return (
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={{ flex: 1 }}
          customMapStyle={LIGHT_MAP_STYLE}
          initialRegion={initRegion}
          showsUserLocation
          showsMyLocationButton
        >
          {/* Route polylines */}
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
                strokeWidth={isSelected ? 6 : 3}
                tappable
                onPress={() => setSelectedPath(path)}
              />
            );
          })}

          {/* Territory owner pins */}
          {pins.map(pin => (
            <Marker
              key={pin.id}
              coordinate={{ latitude: pin.lat, longitude: pin.lng }}
              tracksViewChanges={false}
            >
              {/* Custom pin bubble */}
              <View style={[ps.pinBubble, { borderColor: HEAT_COLOR[pin.heat] }, pin.isYours && ps.pinBubbleYours]}>
                <Text style={ps.pinEmoji}>{pin.ownerEmoji}</Text>
              </View>

              {/* Callout shown on tap */}
              <Callout tooltip>
                <View style={ps.callout}>
                  <Text style={ps.calloutEmoji}>{pin.ownerEmoji}</Text>
                  <Text style={ps.calloutName}>{pin.ownerName}</Text>
                  <Text style={ps.calloutPath} numberOfLines={1}>{pin.pathName}</Text>
                  <View style={ps.calloutRow}>
                    <View style={[ps.heatDot, { backgroundColor: HEAT_COLOR[pin.heat] }]} />
                    <Text style={ps.calloutHeat}>{pin.heat}</Text>
                    <Text style={ps.calloutRuns}>{pin.runCount} RUNS</Text>
                  </View>
                  {(pin.heat === 'YOURS' || pin.heat === 'LEGENDARY') && (
                    <View style={[ps.claimedBadge, { backgroundColor: HEAT_COLOR[pin.heat] }]}>
                      <Text style={ps.claimedText}>CLAIMED</Text>
                    </View>
                  )}
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {/* Selected path info card */}
        {selectedPath && (() => {
          const st = states.get(selectedPath.id);
          const heat: HeatLevel = st?.heat ?? 'COLD';
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
                <Ionicons name="pencil-outline" size={16} color="#0A0A0A" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelectedPath(null)} style={s.closeBtn}>
                <Ionicons name="close" size={16} color="rgba(10,10,10,0.45)" />
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

        {/* No routes hint */}
        {paths.length === 0 && (
          <View style={s.mapHint}>
            <Text style={s.mapHintText}>Connect Strava on HOME to see your routes here</Text>
          </View>
        )}
      </View>
    );
  };

  // ── CITIES tab ─────────────────────────────────────────────────────────────
  const renderCities = () => (
    <ScrollView style={s.scrollArea} contentContainerStyle={{ paddingBottom: 40 }}>
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
            Add your home city. We'll use your GPS to pin it on the map automatically.
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
      <View style={s.header}>
        <Text style={s.headerTitle}>DRIFT</Text>
        <Text style={s.headerSub}>TERRITORY</Text>
      </View>

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

      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator color="#FF3D00" />
        </View>
      ) : (
        tab === 'PATHS' ? renderPaths() :
        tab === 'MAP'   ? renderMap()   :
                          renderCities()
      )}

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

// ─── Territory pin styles ─────────────────────────────────────────────────────
const ps = StyleSheet.create({
  pinBubble: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFFFFF', borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 3, elevation: 4,
  },
  pinBubbleYours: { backgroundColor: '#F4F1EA', borderWidth: 3 },
  pinEmoji:  { fontSize: 18 },
  callout: {
    backgroundColor: '#FFFFFF', borderRadius: 8, padding: 12,
    borderWidth: 2, borderColor: '#0A0A0A',
    minWidth: 140, maxWidth: 200,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 6,
  },
  calloutEmoji:  { fontSize: 28, textAlign: 'center', marginBottom: 4 },
  calloutName:   { fontFamily: 'SpaceMono', fontSize: 11, fontWeight: '700', color: '#0A0A0A', textAlign: 'center', letterSpacing: 1, marginBottom: 4 },
  calloutPath:   { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(10,10,10,0.5)', textAlign: 'center', marginBottom: 8 },
  calloutRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  heatDot:       { width: 8, height: 8, borderRadius: 4 },
  calloutHeat:   { fontFamily: 'SpaceMono', fontSize: 9, color: '#0A0A0A', fontWeight: '700', letterSpacing: 1 },
  calloutRuns:   { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(10,10,10,0.5)' },
  claimedBadge:  { marginTop: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2, alignSelf: 'center' },
  claimedText:   { fontFamily: 'SpaceMono', fontSize: 8, color: '#0A0A0A', fontWeight: '700', letterSpacing: 1.5 },
});

// ─── Main styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F4F1EA' },

  header:       { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 32, paddingBottom: 12, gap: 8 },
  headerTitle:  { fontFamily: 'SpaceMono', fontSize: 22, color: '#FF3D00', letterSpacing: 3 },
  headerSub:    { fontFamily: 'SpaceMono', fontSize: 11, color: 'rgba(10,10,10,0.4)', letterSpacing: 2 },

  tabBar:          { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(10,10,10,0.1)' },
  tabBtn:          { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive:    { borderBottomWidth: 2, borderBottomColor: '#FF3D00' },
  tabBtnText:      { fontFamily: 'SpaceMono', fontSize: 11, color: 'rgba(10,10,10,0.4)', letterSpacing: 1 },
  tabBtnTextActive:{ color: '#FF3D00' },

  scrollArea:   { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  loader:       { flex: 1, alignItems: 'center', justifyContent: 'center' },

  chipRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  chip:         { alignItems: 'center', borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 6, flex: 1, marginHorizontal: 2 },
  chipCount:    { fontFamily: 'SpaceMono', fontSize: 16, fontWeight: 'bold' },
  chipLabel:    { fontFamily: 'SpaceMono', fontSize: 8, letterSpacing: 1, marginTop: 2 },

  pathRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 4, marginBottom: 8, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(10,10,10,0.08)' },
  pathHeatBar:  { width: 4, alignSelf: 'stretch' },
  pathInfo:     { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
  pathName:     { fontFamily: 'SpaceMono', fontSize: 12, color: '#0A0A0A', letterSpacing: 1 },
  pathMeta:     { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(10,10,10,0.4)', marginTop: 3, letterSpacing: 0.5 },

  badge:        { borderWidth: 1, borderRadius: 3, paddingHorizontal: 7, paddingVertical: 3, marginRight: 12 },
  badgeText:    { fontFamily: 'SpaceMono', fontSize: 9, letterSpacing: 1 },

  pathCard:     { position: 'absolute', bottom: 16, left: 16, right: 16, backgroundColor: '#FFFFFF', borderRadius: 4, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, borderWidth: 1, borderColor: 'rgba(10,10,10,0.15)' },
  pathCardName: { fontFamily: 'SpaceMono', fontSize: 12, color: '#0A0A0A', letterSpacing: 1 },
  pathCardMeta: { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(10,10,10,0.4)', marginTop: 3 },
  renameBtn:    { padding: 6 },
  closeBtn:     { padding: 6 },

  legend:       { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(244,241,234,0.92)', borderRadius: 4, padding: 8, gap: 4, borderWidth: 1, borderColor: 'rgba(10,10,10,0.1)' },
  legendItem:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:    { width: 8, height: 8, borderRadius: 4 },
  legendLabel:  { fontFamily: 'SpaceMono', fontSize: 9, color: '#0A0A0A' },

  mapHint:      { position: 'absolute', bottom: 80, left: 16, right: 16, backgroundColor: 'rgba(244,241,234,0.95)', borderRadius: 4, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(10,10,10,0.1)' },
  mapHintText:  { fontFamily: 'SpaceMono', fontSize: 10, color: 'rgba(10,10,10,0.5)', textAlign: 'center', letterSpacing: 0.5 },

  cityRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 4, marginBottom: 8, padding: 14, borderWidth: 1, borderColor: 'rgba(10,10,10,0.08)' },
  cityInfo:     { flex: 1 },
  cityName:     { fontFamily: 'SpaceMono', fontSize: 13, color: '#0A0A0A', letterSpacing: 1 },
  cityMeta:     { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(10,10,10,0.4)', marginTop: 3 },
  homeBtn:      { borderWidth: 1, borderColor: 'rgba(10,10,10,0.2)', borderRadius: 3, paddingHorizontal: 10, paddingVertical: 5 },
  homeBtnActive:{ borderColor: '#FF3D00', backgroundColor: '#FF3D00' },
  homeBtnText:  { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(10,10,10,0.45)', letterSpacing: 1 },
  homeBtnTextActive:{ color: '#FFFFFF' },

  addCityBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#FF3D00', borderRadius: 4, paddingVertical: 12, justifyContent: 'center', marginBottom: 16 },
  addCityBtnText: { fontFamily: 'SpaceMono', fontSize: 12, color: '#FF3D00', letterSpacing: 1 },

  hostBanner:     { backgroundColor: 'rgba(255,215,0,0.12)', borderRadius: 4, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#FFD700' },
  hostBannerText: { fontFamily: 'SpaceMono', fontSize: 10, color: '#8B6914', letterSpacing: 1, textAlign: 'center' },

  empty:        { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyTitle:   { fontFamily: 'SpaceMono', fontSize: 14, color: 'rgba(10,10,10,0.35)', letterSpacing: 2, marginBottom: 12 },
  emptyBody:    { fontFamily: 'SpaceMono', fontSize: 11, color: 'rgba(10,10,10,0.4)', textAlign: 'center', lineHeight: 20 },

  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal:        { width: SW - 48, backgroundColor: '#FFFFFF', borderRadius: 6, padding: 24, borderWidth: 2, borderColor: '#0A0A0A' },
  modalTitle:   { fontFamily: 'SpaceMono', fontSize: 14, color: '#FF3D00', letterSpacing: 2, marginBottom: 20 },
  input:        { backgroundColor: 'rgba(10,10,10,0.04)', borderRadius: 4, borderWidth: 1, borderColor: 'rgba(10,10,10,0.2)', color: '#0A0A0A', fontFamily: 'SpaceMono', fontSize: 12, padding: 12, marginBottom: 12 },
  gpsHint:      { fontFamily: 'SpaceMono', fontSize: 9, color: '#16A34A', marginBottom: 12, letterSpacing: 0.5 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn:     { flex: 1, paddingVertical: 12, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(10,10,10,0.2)', alignItems: 'center' },
  modalBtnAccent:{ backgroundColor: '#FF3D00', borderColor: '#FF3D00' },
  modalBtnText: { fontFamily: 'SpaceMono', fontSize: 11, color: '#0A0A0A', letterSpacing: 1 },
});
