/**
 * LIFECYCLE ENGINE — health, remaining-life range, retirement state, cost/km.
 * A mileage threshold alone never determines retirement: manual condition,
 * recent comfort and pain frequency all feed the estimate.
 */
import { LifecycleAssessment, OwnedShoe, RunRecord, RunnerProfile, ShoeProfile } from '../types';
import { clamp, mean } from '../math';

export function assessLifecycle(
  profile: ShoeProfile,
  shoe: OwnedShoe,
  runs: RunRecord[],
  runner: RunnerProfile,
): LifecycleAssessment {
  const shoeRuns = runs.filter(r => r.shoeId === shoe.id);
  const recent = shoeRuns.slice().sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 8);
  const comfort = recent.map(r => r.comfort).filter((x): x is 1 | 2 | 3 | 4 | 5 => x != null);
  const painRate = recent.length
    ? recent.filter(r => (r.pain ?? []).some(p => p.severity >= 4)).length / recent.length
    : 0;

  const life = profile.durabilityBaselineKm * (runner.bodyMassKg && runner.bodyMassKg > 90 ? 0.9 : 1);
  const mileageHealth = clamp(100 - (shoe.distanceKm / life) * 78);
  const condition = shoe.manualCondition ? shoe.manualCondition * 20 : 70;
  const comfortHealth = comfort.length ? mean(comfort) * 20 : 70;
  const health = Math.round(clamp(
    mileageHealth * 0.55 + condition * 0.2 + comfortHealth * 0.15 + (1 - painRate) * 100 * 0.1,
  ));

  const remaining = Math.max(0, life - shoe.distanceKm);
  const low = Math.round(remaining * 0.65);
  const high = Math.round(remaining * 1.15);

  let state: LifecycleAssessment['state'] = 'healthy';
  if (shoe.retiredAt || health < 12) state = 'retire_now';
  else if (health < 28 || painRate >= 0.5) state = 'walking_only';
  else if (health < 45 || remaining < 100) state = 'retire_soon';
  else if (health < 65) state = 'monitor';

  const reasons = [
    `Estimated health ${health}%.`,
    `Approximate remaining life ${low}-${high} km.`,
  ];
  if (painRate >= 0.35) reasons.push('Recent pain reports are unusually frequent in this shoe.');
  if (comfort.length && mean(comfort) < 3) reasons.push('Recent comfort ratings have declined.');

  return {
    state,
    health,
    remainingKm: [low, high],
    reasons,
    ...(shoe.purchasePrice && shoe.distanceKm > 0
      ? { costPerKm: +(shoe.purchasePrice / shoe.distanceKm).toFixed(2) }
      : {}),
  };
}
