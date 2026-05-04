import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'stride_graveyard_v1';

export interface ShoeObituary {
  shoe_id: string;
  brand: string;
  model: string;
  retired_date: string;
  total_miles: number;
  days_in_service: number;
  added_date: string;
  memorable_run: string;
  best_moment: string;
  rating: 1 | 2 | 3 | 4 | 5;
  would_buy_again: boolean;
  epitaph: string;
}

export async function getGraveyard(): Promise<ShoeObituary[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addToGraveyard(obit: ShoeObituary): Promise<void> {
  const existing = await getGraveyard();
  const updated = [obit, ...existing.filter(o => o.shoe_id !== obit.shoe_id)];
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
}

export async function removeFromGraveyard(shoe_id: string): Promise<void> {
  const existing = await getGraveyard();
  await AsyncStorage.setItem(KEY, JSON.stringify(existing.filter(o => o.shoe_id !== shoe_id)));
}

export function getGraveyardStats(graveyard: ShoeObituary[]): {
  totalShoes: number;
  total_miles: number;
  avg_lifespan: number;
  highest_miles: ShoeObituary | null;
  buyAgainCount: number;
} {
  if (graveyard.length === 0) return { totalShoes: 0, total_miles: 0, avg_lifespan: 0, highest_miles: null, buyAgainCount: 0 };
  const total_miles = graveyard.reduce((sum, o) => sum + o.total_miles, 0);
  const avg_lifespan = Math.round(total_miles / graveyard.length);
  const highest_miles = graveyard.reduce((best, o) => o.total_miles > best.total_miles ? o : best, graveyard[0]);
  const buyAgainCount = graveyard.filter(o => o.would_buy_again).length;
  return { totalShoes: graveyard.length, total_miles: Math.round(total_miles), avg_lifespan, highest_miles, buyAgainCount };
}
