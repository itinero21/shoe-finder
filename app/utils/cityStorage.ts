/**
 * cityStorage — AsyncStorage CRUD for City records
 * DRIFT Phase 1
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { City } from '../types/territory';

const CITIES_KEY = 'drift_cities_v1';
const HOME_CITY_KEY = 'drift_home_city_id_v1';

export async function getAllCities(): Promise<City[]> {
  try {
    const raw = await AsyncStorage.getItem(CITIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getCityById(id: string): Promise<City | null> {
  const cities = await getAllCities();
  return cities.find(c => c.id === id) ?? null;
}

export async function saveCity(city: City): Promise<void> {
  const cities = await getAllCities();
  const idx = cities.findIndex(c => c.id === city.id);
  if (idx >= 0) cities[idx] = city;
  else cities.push(city);
  await AsyncStorage.setItem(CITIES_KEY, JSON.stringify(cities));
}

export async function deleteCity(id: string): Promise<void> {
  const cities = await getAllCities();
  await AsyncStorage.setItem(CITIES_KEY, JSON.stringify(cities.filter(c => c.id !== id)));
}

export async function getHomeCity(): Promise<City | null> {
  try {
    const id = await AsyncStorage.getItem(HOME_CITY_KEY);
    if (!id) return null;
    return getCityById(id);
  } catch {
    return null;
  }
}

export async function setHomeCity(cityId: string): Promise<void> {
  await AsyncStorage.setItem(HOME_CITY_KEY, cityId);
}

/**
 * Find cities that contain a given coordinate (lat, lng).
 * Uses simple bounding circle check.
 */
export async function findCitiesForCoordinate(lat: number, lng: number): Promise<City[]> {
  const cities = await getAllCities();
  return cities.filter(city => {
    const dx = city.lat - lat;
    const dy = city.lng - lng;
    // rough degree-to-km: 1 deg ≈ 111 km
    const distKm = Math.sqrt(dx * dx + dy * dy) * 111;
    return distKm <= city.radius_km;
  });
}

/** Increment active_runner_count for a city */
export async function incrementRunnerCount(cityId: string): Promise<void> {
  const city = await getCityById(cityId);
  if (!city) return;
  city.active_runner_count += 1;
  await saveCity(city);
}
