/**
 * THE CLOSET REMEMBERS — Memory resurfacing engine
 *
 * Surfaces "on this day" moments from run + shoe history.
 * Creates emotional lock-in: deleting the app feels like erasing the shoes.
 */

import { Run } from '../types/run';
import { LivingShoe, ShoeMemorial } from '../types/character';
import { Shoe } from '../data/shoes';

export interface ClosetMemory {
  type: 'anniversary' | 'on_this_day' | 'milestone_anniversary' | 'first_run_anniversary';
  shoeId: string;
  shoeName: string;
  text: string;
  originalDate: string;
  yearsAgo: number;
  isDeparted: boolean;
}

/**
 * Find memories worth resurfacing today.
 * Called once per day from the CLOSET screen.
 */
export function findTodaysMemories(
  runs: Run[],
  livingShoes: LivingShoe[],
  memorials: ShoeMemorial[],
  shoeDataMap: Record<string, Shoe>,
): ClosetMemory[] {
  const today = new Date();
  const todayMD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const memories: ClosetMemory[] = [];

  // Check all runs for "on this day" matches
  for (const run of runs) {
    const runDate = new Date(run.date);
    const runMD = `${String(runDate.getMonth() + 1).padStart(2, '0')}-${String(runDate.getDate()).padStart(2, '0')}`;
    const yearsAgo = today.getFullYear() - runDate.getFullYear();

    if (runMD === todayMD && yearsAgo >= 1) {
      const shoe = shoeDataMap[run.shoeId];
      const shoeName = shoe ? `${shoe.brand} ${shoe.model}` : 'Unknown shoe';
      const isDeparted = memorials.some(m => m.shoeId === run.shoeId);
      const miles = (run.distanceKm * 0.621371).toFixed(1);

      memories.push({
        type: 'on_this_day',
        shoeId: run.shoeId,
        shoeName,
        text: isDeparted
          ? `${yearsAgo} year${yearsAgo > 1 ? 's' : ''} ago today, ${shoeName} carried you ${miles} miles. They're resting now, but the road remembers.`
          : `${yearsAgo} year${yearsAgo > 1 ? 's' : ''} ago today, you ran ${miles} miles in ${shoeName}.`,
        originalDate: run.date,
        yearsAgo,
        isDeparted,
      });
    }
  }

  // Check shoe add-dates for anniversaries
  for (const char of livingShoes) {
    const addDate = new Date(char.addedDate);
    const addMD = `${String(addDate.getMonth() + 1).padStart(2, '0')}-${String(addDate.getDate()).padStart(2, '0')}`;
    const yearsAgo = today.getFullYear() - addDate.getFullYear();

    if (addMD === todayMD && yearsAgo >= 1) {
      const shoe = shoeDataMap[char.shoeId];
      const shoeName = shoe ? `${shoe.brand} ${shoe.model}` : 'Unknown';

      memories.push({
        type: 'anniversary',
        shoeId: char.shoeId,
        shoeName,
        text: `${yearsAgo} year${yearsAgo > 1 ? 's' : ''} ago today, ${shoeName} joined the closet. ${Math.round(char.totalMiles)} miles since.`,
        originalDate: char.addedDate,
        yearsAgo,
        isDeparted: false,
      });
    }
  }

  // Check memorial dates
  for (const m of memorials) {
    const deathDate = new Date(m.deathDate);
    const deathMD = `${String(deathDate.getMonth() + 1).padStart(2, '0')}-${String(deathDate.getDate()).padStart(2, '0')}`;
    const yearsAgo = today.getFullYear() - deathDate.getFullYear();

    if (deathMD === todayMD && yearsAgo >= 1) {
      memories.push({
        type: 'anniversary',
        shoeId: m.shoeId,
        shoeName: `${m.brand} ${m.model}`,
        text: `${yearsAgo} year${yearsAgo > 1 ? 's' : ''} ago today, ${m.brand} ${m.model} ran their last mile. ${Math.round(m.totalMiles)} miles. Never forgotten.`,
        originalDate: m.deathDate,
        yearsAgo,
        isDeparted: true,
      });
    }
  }

  // Deduplicate by shoeId (keep most interesting)
  const seen = new Set<string>();
  return memories.filter(m => {
    const key = `${m.shoeId}-${m.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 3); // max 3 memories per day
}
