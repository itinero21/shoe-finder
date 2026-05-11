/**
 * LOAD MANAGEMENT SIGNALS — Pattern-based training insights.
 * Renamed from "Predictive Injury Engine" per values filter:
 * STRIDE does not predict injuries. We surface patterns. Nothing more.
 *
 * Voice rules:
 *  - Never: "injury", "risk", "danger", "warning", "diagnosed"
 *  - Always: "load", "volume", "pattern", "consider", "recovery capacity"
 *  - No red colors. No alarm icons. Calm voice.
 *  - Every signal expands to show WHY (research-grounded, one sentence).
 *  - Footer: "PATTERN-BASED. NOT MEDICAL ADVICE."
 *
 * Phase E of v8 intelligence spec.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Run } from '../types/run';

const DISMISSED_KEY = 'stride_load_signals_dismissed_v1';
const SILENCED_KEY  = 'stride_load_signals_silenced_v1';

export type SignalType =
  | 'volume_spike'
  | 'cadence_decline'
  | 'pace_fade'
  | 'repeat_mismatch'
  | 'rest_deficit'
  | 'past_pattern';

export interface LoadSignal {
  type: SignalType;
  label: string;
  copy: string;
  rationale: string;
  footer: 'PATTERN-BASED. NOT MEDICAL ADVICE.';
}

// ── Helper: miles in date range ───────────────────────────────────────────────
function milesInWindow(runs: Run[], daysBack: number, from = 0): number {
  const now = Date.now();
  const start = now - (from + daysBack) * 86400000;
  const end   = now - from * 86400000;
  return runs
    .filter(r => {
      const t = new Date(r.date).getTime();
      return t >= start && t <= end;
    })
    .reduce((s, r) => s + r.distanceKm * 0.621371, 0);
}

function runsInDays(runs: Run[], daysBack: number): Run[] {
  const cutoff = Date.now() - daysBack * 86400000;
  return runs.filter(r => new Date(r.date).getTime() >= cutoff);
}

// ── Signal 1: Weekly volume spike ────────────────────────────────────────────
function checkVolumeSpike(runs: Run[]): LoadSignal | null {
  const thisWeek  = milesInWindow(runs, 7);
  const priorAvg  = (
    milesInWindow(runs, 7, 7) +
    milesInWindow(runs, 7, 14) +
    milesInWindow(runs, 7, 21) +
    milesInWindow(runs, 7, 28)
  ) / 4;

  if (priorAvg < 5) return null; // not enough history
  const spike = (thisWeek - priorAvg) / priorAvg;
  if (spike < 0.20) return null;

  const pct = Math.round(spike * 100);
  return {
    type: 'volume_spike',
    label: 'VOLUME SPIKE',
    copy: `THIS WEEK IS ${pct}% HIGHER THAN YOUR 4-WEEK AVERAGE. CONSIDER AN EASIER WEEK NEXT.`,
    rationale: 'JUMPS BIGGER THAN 10% ARE LINKED TO HIGHER OVERUSE RATES (NIELSEN 2012). PROGRESSIVE LOADING REDUCES THIS.',
    footer: 'PATTERN-BASED. NOT MEDICAL ADVICE.',
  };
}

// ── Signal 2: Rest day deficit ────────────────────────────────────────────────
function checkRestDeficit(runs: Run[]): LoadSignal | null {
  const thisWeekRuns = runsInDays(runs, 7);
  const runDays = new Set(thisWeekRuns.map(r => r.date.slice(0, 10))).size;
  const miles = thisWeekRuns.reduce((s, r) => s + r.distanceKm * 0.621371, 0);
  if (runDays < 7 || miles < 25) return null;

  return {
    type: 'rest_deficit',
    label: 'REST DEFICIT',
    copy: `${miles.toFixed(0)} MILES AND 0 REST DAYS THIS WEEK. ADAPTATION HAPPENS ON REST DAYS, NOT DURING RUNS.`,
    rationale: 'MUSCLE AND CONNECTIVE TISSUE REBUILDS DURING REST. RUNNING 7 CONSECUTIVE DAYS WITHOUT RECOVERY REDUCES THE ADAPTATION RETURN FROM EACH RUN.',
    footer: 'PATTERN-BASED. NOT MEDICAL ADVICE.',
  };
}

// ── Signal 3: Pace fade increasing ───────────────────────────────────────────
function checkPaceFade(runs: Run[]): LoadSignal | null {
  // Only runs with duration AND distance (can derive avg pace)
  const longRuns = runs
    .filter(r => r.distanceKm >= 12.8 && r.durationMinutes && r.durationMinutes > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (longRuns.length < 4) return null;

  const recent2Avg = (
    longRuns[0].durationMinutes! / longRuns[0].distanceKm +
    longRuns[1].durationMinutes! / longRuns[1].distanceKm
  ) / 2;

  const older2Avg = (
    longRuns[2].durationMinutes! / longRuns[2].distanceKm +
    longRuns[3].durationMinutes! / longRuns[3].distanceKm
  ) / 2;

  if (older2Avg === 0) return null;
  const fade = (recent2Avg - older2Avg) / older2Avg;
  if (fade < 0.03) return null; // less than 3% slower — ignore

  return {
    type: 'pace_fade',
    label: 'PACE FADE',
    copy: `YOUR LONG RUNS ARE RUNNING SLOWER THAN THEY WERE LAST MONTH. RECOVERY CAPACITY MAY BE LOWER.`,
    rationale: 'PROGRESSIVE PACE FADE ON LONG RUNS OFTEN PRECEDES OVERTRAINING. TAKING AN EASIER WEEK CAN RESET THIS.',
    footer: 'PATTERN-BASED. NOT MEDICAL ADVICE.',
  };
}

// ── Signal 4: Repeat mismatch ─────────────────────────────────────────────────
export async function checkRepeatMismatch(mismatchCount: number): Promise<LoadSignal | null> {
  if (mismatchCount < 3) return null;
  return {
    type: 'repeat_mismatch',
    label: 'REPEAT MISMATCH',
    copy: `${mismatchCount} SHOE MISMATCHES IN 2 WEEKS. REVIEW YOUR ROTATION TO MATCH SHOES TO RUN PURPOSE.`,
    rationale: 'MATCHING SHOE TO RUN PURPOSE REDUCES TISSUE-SPECIFIC OVERLOAD AND EXTENDS SHOE LIFE.',
    footer: 'PATTERN-BASED. NOT MEDICAL ADVICE.',
  };
}

// ── Signal 5: Past pattern (injury history) ───────────────────────────────────
function checkPastPattern(runs: Run[], injuryHistory: { injury_type: string; started_date: string }[]): LoadSignal | null {
  if (injuryHistory.length === 0) return null;

  const lastInjury = injuryHistory[0];
  const injuryDate = new Date(lastInjury.started_date).getTime();
  const now = Date.now();

  // Get volume 2 weeks before last injury
  const preInjuryMiles = runs
    .filter(r => {
      const t = new Date(r.date).getTime();
      return t >= injuryDate - 14 * 86400000 && t < injuryDate;
    })
    .reduce((s, r) => s + r.distanceKm * 0.621371, 0);

  // Get current 2-week volume
  const currentMiles = milesInWindow(runs, 14);

  if (preInjuryMiles < 5 || currentMiles < 5) return null;
  const similarity = Math.abs(currentMiles - preInjuryMiles) / preInjuryMiles;

  // If within 15% of pre-injury volume, surface the pattern
  if (similarity > 0.15) return null;

  const injType = lastInjury.injury_type.replace(/_/g, ' ').toUpperCase();
  return {
    type: 'past_pattern',
    label: 'PAST PATTERN',
    copy: `YOUR VOLUME LOOKS LIKE THE 2 WEEKS BEFORE YOUR LAST ${injType}. CONSIDER AN EASIER WEEK.`,
    rationale: 'RUNNERS WITH A PRIOR OVERUSE EPISODE ARE 3-5X MORE LIKELY TO REPEAT IT. PRIOR PATTERNS ARE THE MOST RELIABLE SIGNAL.',
    footer: 'PATTERN-BASED. NOT MEDICAL ADVICE.',
  };
}

// ── Dismissal storage ─────────────────────────────────────────────────────────
export async function getDismissed(): Promise<Record<SignalType, number>> {
  const raw = await AsyncStorage.getItem(DISMISSED_KEY);
  return raw ? JSON.parse(raw) : {} as Record<SignalType, number>;
}

export async function dismissSignal(type: SignalType): Promise<void> {
  const dismissed = await getDismissed();
  dismissed[type] = Date.now();
  await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
}

export async function getSilenced(): Promise<SignalType[]> {
  const raw = await AsyncStorage.getItem(SILENCED_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function silenceSignal(type: SignalType): Promise<void> {
  const silenced = await getSilenced();
  if (!silenced.includes(type)) {
    silenced.push(type);
    await AsyncStorage.setItem(SILENCED_KEY, JSON.stringify(silenced));
  }
}

// ── Main: compute all active signals ─────────────────────────────────────────
export async function computeLoadSignals(
  runs: Run[],
  injuryHistory: { injury_type: string; started_date: string }[],
  recentMismatchCount: number
): Promise<LoadSignal[]> {
  const dismissed = await getDismissed();
  const silenced  = await getSilenced();
  const now = Date.now();
  const DISMISS_WINDOW = 7 * 86400000; // 7 days

  const candidates: (LoadSignal | null)[] = [
    checkVolumeSpike(runs),
    checkRestDeficit(runs),
    checkPaceFade(runs),
    await checkRepeatMismatch(recentMismatchCount),
    checkPastPattern(runs, injuryHistory),
  ];

  return candidates.filter((s): s is LoadSignal => {
    if (!s) return false;
    if (silenced.includes(s.type)) return false;
    const dismissedAt = dismissed[s.type];
    if (dismissedAt && now - dismissedAt < DISMISS_WINDOW) return false;
    return true;
  });
}
