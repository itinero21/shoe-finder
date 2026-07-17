/**
 * LOAD ENGINE — seven-day / 28-day load, hard-run count, streak, fatigue.
 * The acute:chronic ratio is the core overtraining signal.
 */
import { LoadState, RunRecord } from '../types';
import { clamp, daysBetween } from '../math';

export function calculateLoadState(runs: RunRecord[], today = new Date().toISOString()): LoadState {
  const recent = (d: number) => runs.filter(r => daysBetween(today, r.occurredAt) <= d);

  const km7 = recent(7).reduce((s, r) => s + r.distanceKm, 0);
  const km28 = recent(28).reduce((s, r) => s + r.distanceKm, 0) / 4;
  const hard = recent(7).filter(r => r.effortRpe >= 7 || ['tempo', 'intervals', 'race'].includes(r.intent ?? '')).length;

  const dates = [...new Set(runs.map(r => r.occurredAt.slice(0, 10)))].sort().reverse();
  let streak = 0;
  for (let i = 0; i < dates.length; i++) {
    if (daysBetween(today, dates[i]!) <= i + 1.25) streak++;
    else break;
  }

  const ratio = km28 > 0 ? km7 / km28 : undefined;
  const pain = recent(14).some(r => (r.pain ?? []).some(p => p.severity >= 4));
  const fatigue = clamp((ratio ?? 1) * 28 + hard * 10 + Math.max(0, streak - 2) * 6 + (pain ? 15 : 0));

  return {
    acuteKm7d: +km7.toFixed(1),
    chronicWeeklyKm: +km28.toFixed(1),
    ...(ratio ? { acuteChronicRatio: +ratio.toFixed(2) } : {}),
    hardRuns7d: hard,
    consecutiveDays: streak,
    fatigue: Math.round(fatigue),
    painFlag: pain,
  };
}
