/**
 * Character Storage — persist Living Shoes to AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LivingShoe, ShoeMemorial } from '../types/character';

const CHARACTERS_KEY = 'stride_living_shoes_v1';
const MEMORIALS_KEY = 'stride_memorials_v1';

// ── Living Shoes ────────────────────────────────────────────────────────────

export async function getLivingShoes(): Promise<LivingShoe[]> {
  try {
    const raw = await AsyncStorage.getItem(CHARACTERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveLivingShoes(shoes: LivingShoe[]): Promise<void> {
  await AsyncStorage.setItem(CHARACTERS_KEY, JSON.stringify(shoes));
}

export async function getLivingShoe(shoeId: string): Promise<LivingShoe | null> {
  const all = await getLivingShoes();
  return all.find(s => s.shoeId === shoeId) ?? null;
}

export async function saveLivingShoe(shoe: LivingShoe): Promise<void> {
  const all = await getLivingShoes();
  const idx = all.findIndex(s => s.shoeId === shoe.shoeId);
  if (idx >= 0) {
    all[idx] = shoe;
  } else {
    all.push(shoe);
  }
  await saveLivingShoes(all);
}

export async function removeLivingShoe(shoeId: string): Promise<void> {
  const all = await getLivingShoes();
  await saveLivingShoes(all.filter(s => s.shoeId !== shoeId));
}

// ── Memorials (Departed Shoes) ──────────────────────────────────────────────

export async function getMemorials(): Promise<ShoeMemorial[]> {
  try {
    const raw = await AsyncStorage.getItem(MEMORIALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addMemorial(memorial: ShoeMemorial): Promise<void> {
  const all = await getMemorials();
  const filtered = all.filter(m => m.shoeId !== memorial.shoeId);
  await AsyncStorage.setItem(MEMORIALS_KEY, JSON.stringify([memorial, ...filtered]));
}
