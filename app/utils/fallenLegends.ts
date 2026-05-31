/**
 * FALLEN LEGENDS — The single social feature.
 * Opt-in public gallery of retired shoes.
 * "Infinitely more interesting than 'John completed 5 km.'"
 */

import { supabase } from '../lib/supabase';
import { ShoeMemorial } from '../types/character';

export interface FallenLegend {
  id: string;
  brand: string;
  model: string;
  nickname: string | null;
  totalMiles: number;
  runCount: number;
  lifespanDays: number;
  epitaph: string;
  rating: number;
  sharedAt: string;
}

/** Share a retired shoe to the public Fallen Legends gallery */
export async function shareFallenLegend(memorial: ShoeMemorial): Promise<boolean> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return false;

    await supabase.from('fallen_legends').upsert({
      user_id: userData.user.id,
      shoe_id: memorial.shoeId,
      brand: memorial.brand,
      model: memorial.model,
      nickname: memorial.nickname,
      total_miles: Math.round(memorial.totalMiles),
      run_count: memorial.runCount,
      lifespan_days: memorial.lifespanDays,
      epitaph: memorial.epitaph || memorial.lastWords,
      rating: memorial.rating,
      shared_at: new Date().toISOString(),
    }, { onConflict: 'user_id,shoe_id' });

    return true;
  } catch {
    return false;
  }
}

/** Fetch the public Fallen Legends gallery */
export async function getFallenLegends(limit = 20): Promise<FallenLegend[]> {
  try {
    const { data } = await supabase
      .from('fallen_legends')
      .select('*')
      .order('shared_at', { ascending: false })
      .limit(limit);

    if (!data) return [];
    return data.map((r: any) => ({
      id: r.id ?? r.shoe_id,
      brand: r.brand,
      model: r.model,
      nickname: r.nickname,
      totalMiles: r.total_miles,
      runCount: r.run_count,
      lifespanDays: r.lifespan_days,
      epitaph: r.epitaph,
      rating: r.rating,
      sharedAt: r.shared_at,
    }));
  } catch {
    return [];
  }
}
