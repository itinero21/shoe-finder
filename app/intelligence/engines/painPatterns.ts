/**
 * PAIN PATTERN ENGINE — conservative pattern detection from repeated reports.
 * Language must say "associated with" or "appears after", never "caused by".
 */
import { PainArea, PainPattern, RunRecord, ShoeProfile } from '../types';
import { clamp, mean } from '../math';

export function detectPainPatterns(
  runs: RunRecord[],
  catalog: ShoeProfile[],
  ownedMap: Map<string, string>,
): PainPattern[] {
  const areas: PainArea[] = ['foot', 'heel_arch', 'achilles_calf', 'shin', 'knee', 'it_band_hip', 'back', 'other'];
  const byId = new Map(catalog.map(x => [x.id, x]));
  const out: PainPattern[] = [];

  for (const area of areas) {
    const painful = runs.filter(r => (r.pain ?? []).some(p => p.area === area && p.severity >= 4));
    if (painful.length < 3) continue;

    const shoeIds = [...new Set(painful.map(r => r.shoeId).filter((x): x is string => !!x))];
    const dist = mean(painful.map(r => r.distanceKm));
    const firmness = painful
      .map(r => {
        const p = byId.get(ownedMap.get(r.shoeId ?? '') ?? '');
        return p ? 100 - p.mechanics.softness : undefined;
      })
      .filter((x): x is number => x != null);
    const support = painful.length / runs.length;

    out.push({
      area,
      support: +support.toFixed(2),
      shoeIds,
      minDistanceKm: Math.round(dist),
      ...(firmness.length
        ? { firmnessBand: [Math.round(Math.min(...firmness)), Math.round(Math.max(...firmness))] as [number, number] }
        : {}),
      statement: `${area.replace('_', ' ')} discomfort appears repeatedly, often around ${Math.round(dist)} km or later.`,
      confidence: Math.round(clamp((painful.length / 8) * 100)),
    });
  }
  return out.sort((a, b) => b.confidence - a.confidence);
}
