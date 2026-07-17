/**
 * PERSONALIZATION ENGINE — per-shoe evidence and learned Shoe DNA.
 * Generic mechanics are a prior; the runner's own comfort history
 * gradually becomes the stronger signal.
 */
import { PersonalEvidence, RunRecord, RunnerPreferences, ShoeProfile } from '../types';
import { clamp, recencyWeight, weightedAverage } from '../math';

export function evidenceForShoe(
  shoeId: string,
  runs: RunRecord[],
  today = new Date().toISOString(),
): PersonalEvidence {
  const xs = runs.filter(r => r.shoeId === shoeId);
  const comfort = xs.filter(r => r.comfort != null);
  const c = comfort.length
    ? weightedAverage(comfort.map(r => [
        (r.comfort ?? 3) * 20,
        recencyWeight(Math.abs(new Date(today).getTime() - new Date(r.occurredAt).getTime()) / 86400000),
      ]))
    : undefined;
  const pain = xs.filter(r => (r.pain ?? []).some(p => p.severity >= 4)).length;
  return {
    sampleSize: xs.length,
    ...(c != null ? { comfortMean: +c.toFixed(1) } : {}),
    painRate: xs.length ? pain / xs.length : 0,
    completionRate: 1,
    confidence: clamp((xs.length / 12) * 100),
  };
}

/** Learn what mechanics this runner actually rates as comfortable. */
export function learnPreferences(
  runs: RunRecord[],
  catalog: ShoeProfile[],
  ownedMap: Map<string, string>,
): RunnerPreferences {
  const byId = new Map(catalog.map(s => [s.id, s]));
  const rated = runs.filter(r => r.comfort != null && r.shoeId);

  const values = (key: keyof ShoeProfile['mechanics']) =>
    rated
      .map(r => {
        const p = byId.get(ownedMap.get(r.shoeId!) ?? '');
        const v = p?.mechanics[key];
        return typeof v === 'number' ? ([v, r.comfort ?? 3] as [number, number]) : undefined;
      })
      .filter((x): x is [number, number] => !!x);

  const pref = (key: keyof ShoeProfile['mechanics']) => {
    const x = values(key);
    return x.length ? weightedAverage(x.map(([v, c]) => [v, Math.max(0.2, c - 2)])) : undefined;
  };

  const out: RunnerPreferences = {};
  const entries: [keyof RunnerPreferences, number | undefined][] = [
    ['softness', pref('softness')],
    ['dropMm', pref('dropMm')],
    ['rocker', pref('rocker')],
    ['stiffness', pref('longitudinalStiffness')],
    ['toeBoxVolume', pref('toeBoxVolume')],
    ['platformWidth', pref('platformWidth')],
  ];
  for (const [k, v] of entries) if (v != null) out[k] = v;
  return out;
}
