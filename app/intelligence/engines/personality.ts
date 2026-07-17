/**
 * PERSONALITY ENGINE — real-use personalities for funerals and memorials.
 * Every personality is earned from logged runs, never assigned at random.
 */
import { OwnedShoe, RunRecord, ShoePersonality } from '../types';

export function deriveShoePersonalities(shoe: OwnedShoe, runs: RunRecord[]): ShoePersonality[] {
  const xs = runs.filter(r => r.shoeId === shoe.id);
  const out: ShoePersonality[] = [];
  const rain = xs.filter(r => r.rain).length;
  const hard = xs.filter(r => r.effortRpe >= 8 || r.intent === 'race').length;
  const painFree = xs.filter(r => !(r.pain ?? []).some(p => p.severity >= 4)).length;

  if (xs.length >= 50) out.push({ key: 'workhorse', label: 'Workhorse', reason: `Carried ${xs.length} runs.` });
  if (hard >= 8) out.push({ key: 'racer', label: 'Racer', reason: `Handled ${hard} hard efforts or races.` });
  if (rain >= 15) out.push({ key: 'rain_warrior', label: 'Rain Warrior', reason: `Completed ${rain} wet runs.` });
  if (shoe.distanceKm >= 700) out.push({ key: 'survivor', label: 'Survivor', reason: `Passed ${Math.round(shoe.distanceKm)} km.` });
  if (xs.length >= 20 && painFree / xs.length >= 0.9) {
    out.push({
      key: 'trusted_companion',
      label: 'Trusted Companion',
      reason: `${Math.round((painFree / xs.length) * 100)}% of logged runs were pain-free.`,
    });
  }
  return out;
}
