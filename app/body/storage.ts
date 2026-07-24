import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyBiometrics } from './types';

const DAILY_KEY = 'stride_daily_biometrics_v1';

export async function getDailyBiometrics(): Promise<DailyBiometrics[]> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DailyBiometrics[];
    return parsed.sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

export async function upsertDailyBiometrics(days: DailyBiometrics[]): Promise<void> {
  const existing = await getDailyBiometrics();
  const byDate = new Map(existing.map(day => [day.date.slice(0, 10), day]));

  for (const incoming of days) {
    const key = incoming.date.slice(0, 10);
    const current = byDate.get(key);
    byDate.set(key, {
      ...current,
      ...incoming,
      date: key,
      sleep: { ...current?.sleep, ...incoming.sleep },
      cardiovascular: { ...current?.cardiovascular, ...incoming.cardiovascular },
      activity: { ...current?.activity, ...incoming.activity },
      recovery: { ...current?.recovery, ...incoming.recovery },
      sources: [...new Set([...(current?.sources ?? []), ...incoming.sources])],
      observedAt: incoming.observedAt ?? new Date().toISOString(),
    });
  }

  const trimmed = [...byDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-120);
  await AsyncStorage.setItem(DAILY_KEY, JSON.stringify(trimmed));
}

export async function clearDailyBiometrics(): Promise<void> {
  await AsyncStorage.removeItem(DAILY_KEY);
}
