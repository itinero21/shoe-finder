/**
 * STRAVA GEAR SYNC — turn the athlete's Strava shoes into closet shoes.
 *
 * When a Strava gear entry is imported or linked:
 *   - the catalog shoe joins the closet (favorites)
 *   - the gear's lifetime distance becomes importedBaselineMiles on the
 *     LivingShoe, so life %, health, and cost-per-mile start from reality
 *     instead of zero
 *   - the gear map entry makes future activity syncs attribute runs to
 *     this shoe automatically, and run uploads tag the right gear on Strava
 */
import { ALL_TRACKABLE_SHOES, Shoe } from '../data/shoes';
import { StravaGear, getGearMap, saveGearMap } from './stravaService';
import { addToFavorites } from '../utils/storage';
import { getLivingShoe, saveLivingShoe } from '../utils/characterStorage';
import { createLivingShoe } from '../utils/characterEngine';
import { getUserProfile } from '../utils/userProfile';
import { getRunsForShoe } from '../utils/runStorage';

const KM_TO_MI = 0.621371;

/**
 * Import (or link) a Strava gear entry as the given catalog shoe.
 * Safe to call for shoes already in the closet — it links and backfills
 * mileage without double-counting runs already logged in STRIDE.
 */
export async function importStravaGear(gear: StravaGear, catalogShoe: Shoe): Promise<void> {
  const profile = await getUserProfile();

  // Ensure the LivingShoe exists before anything else touches it
  let char = await getLivingShoe(catalogShoe.id);
  if (!char) {
    char = createLivingShoe(catalogShoe, profile.weight_lbs ?? 160);
  }

  // Credit Strava lifetime distance, minus miles STRIDE already logged
  const loggedMiles = (await getRunsForShoe(catalogShoe.id))
    .reduce((s, r) => s + r.distanceKm * KM_TO_MI, 0);
  const gearMiles = gear.distance_km * KM_TO_MI;
  char.importedBaselineMiles = Math.max(0, gearMiles - loggedMiles);
  await saveLivingShoe(char);

  // Into the closet + gear map (Strava gear ID → closet shoe ID)
  await addToFavorites(catalogShoe.id);
  const map = await getGearMap();
  map[gear.id] = catalogShoe.id;
  await saveGearMap(map);
}

/** Resolve a gear map entry back to a shoe name for display. */
export function closetShoeNameFor(shoeId: string): string | null {
  const shoe = ALL_TRACKABLE_SHOES.find(s => s.id === shoeId);
  return shoe ? `${shoe.brand} ${shoe.model}` : null;
}
