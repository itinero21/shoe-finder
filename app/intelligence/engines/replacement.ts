/**
 * REPLACEMENT ENGINE — buying advisor for successor shoes.
 * Ranks catalog shoes by ride-character similarity to the retiring shoe,
 * role continuity, width availability and official-successor status.
 *
 * v2.1: energy-return similarity joins the ride-character blend, and
 * budget-friendly picks earn an explicit value reason.
 */
import { OwnedShoe, ReplacementRecommendation, RunRecord, RunnerProfile, ShoeProfile } from '../types';
import { clamp, similarity } from '../math';

export function recommendReplacements(
  retiring: OwnedShoe,
  catalog: ShoeProfile[],
  owned: OwnedShoe[],
  runs: RunRecord[],
  runner: RunnerProfile,
  budget?: number,
): ReplacementRecommendation[] {
  const old = catalog.find(x => x.id === retiring.profileId);
  if (!old) return [];
  const ownedIds = new Set(owned.map(x => x.profileId));

  return catalog
    .filter(x => x.id !== old.id && !ownedIds.has(x.id) && (!budget || !x.price || x.price <= budget))
    .map(p => {
      const mech = (
        similarity(p.mechanics.softness, old.mechanics.softness, 40) +
        similarity(p.mechanics.dropMm, old.mechanics.dropMm, 10) +
        similarity(p.mechanics.rocker, old.mechanics.rocker, 45) +
        similarity(p.mechanics.toeBoxVolume, old.mechanics.toeBoxVolume, 45) +
        similarity(p.mechanics.energyReturn, old.mechanics.energyReturn, 45)
      ) / 5;
      const role = p.roles.some(r => old.roles.includes(r)) ? 100 : 45;
      const width = runner.preferredWidth ? (p.widths.includes(runner.preferredWidth) ? 100 : 20) : 70;
      const successor = (old.successorIds ?? []).includes(p.id) ? 18 : 0;
      const score = clamp(mech * 0.55 + role * 0.25 + width * 0.15 + p.dataConfidence * 5 + successor);
      const cheaper = p.price != null && old.price != null && p.price <= old.price * 0.85;

      return {
        profileId: p.id,
        score: Math.round(score),
        confidence: Math.round(clamp(p.dataConfidence * 60 + 40)),
        reasons: [
          `${Math.round(mech)}% ride-character similarity.`,
          role === 100 ? 'Matches the retiring shoe’s role.' : 'Provides a different rotation role.',
          width === 100 ? 'Available in the runner’s preferred width.' : 'Width compatibility should be verified.',
          ...(cheaper ? ['Meaningfully cheaper than the shoe it replaces.'] : []),
        ],
        tradeoffs: [
          p.mechanics.softness > old.mechanics.softness + 15 ? 'Noticeably softer ride.' : '',
          p.mechanics.dropMm < old.mechanics.dropMm - 3 ? 'Lower-drop transition required.' : '',
          p.mechanics.plate !== old.mechanics.plate ? 'Different plate/flex behavior.' : '',
        ].filter(Boolean),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
