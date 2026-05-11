/**
 * ABUSE DETECTOR — Event-driven mismatch detection after every logged run.
 * One verdict per run. Highest severity wins. Positive verdict shown if no negatives.
 *
 * Phase D of v8 intelligence spec.
 */

import { Shoe } from '../data/shoes';
import { Run } from '../types/run';
import { deriveShoeTag, ShoeTag } from './shoeTags';
import { computeShoeHealth } from './shoeFatigue';

export type AbuseVerdict = {
  type: 'category_mismatch' | 'distance_overload' | 'consecutive' | 'worn_shoe' | 'wrong_terrain' | 'perfect_match';
  severity: 'high' | 'moderate' | 'low' | 'positive';
  headline: string;
  detail: string;
};

// ── Max distance recommendations by category (miles) ─────────────────────────
const MAX_DISTANCE: Record<string, number> = {
  carbon_racer:         26.5,
  trail_carbon_racer:   26.5,
  super_trainer:        20,
  lightweight_daily:    16,
  neutral_daily:        20,
  max_cushion_neutral:  26.5,
  premium_neutral:      20,
  stability_daily:      20,
  stability_premium:    20,
  motion_control:       26.5,
  trail_neutral:        20,
  trail_max_cushion:    26.5,
  trail_technical:      15,
};

// ── Easy purposes that should NOT be done in race shoes ──────────────────────
const EASY_PURPOSES = new Set(['easy', 'recovery', 'walk']);
const RACE_TAGS: Set<ShoeTag> = new Set(['EXPLOSIVE', 'AGGRESSIVE']);
const RECOVERY_TAGS: Set<ShoeTag> = new Set(['CRUISER', 'FORGIVING']);

export function detectAbuse(
  run: Run,
  shoe: Shoe,
  allRuns: Run[],
  weightLbs = 160
): AbuseVerdict | null {
  const miles = run.distanceKm * 0.621371;
  const tag = deriveShoeTag(shoe);
  const health = computeShoeHealth(shoe, allRuns, weightLbs);

  const checks: AbuseVerdict[] = [];

  // ── Check 1: Worn shoe in use ─────────────────────────────────────────────
  if (health.healthPct <= 0) {
    checks.push({
      type: 'worn_shoe',
      severity: 'high',
      headline: `${shoe.model.toUpperCase()} IS PAST ITS WEAR LIMIT`,
      detail: `CUSHIONING IS DEGRADED. WORN FOAM IS WELL-DOCUMENTED AS A SOURCE OF ADDITIONAL LOAD ON JOINTS. RETIRE IT.`,
    });
  }

  // ── Check 2: Distance overload ────────────────────────────────────────────
  const maxDist = MAX_DISTANCE[shoe.category];
  if (maxDist && miles > maxDist * 1.1) {
    checks.push({
      type: 'distance_overload',
      severity: 'high',
      headline: `${shoe.model.toUpperCase()} IS RATED FOR UP TO ${maxDist} MILES`,
      detail: `TODAY YOU RAN ${miles.toFixed(1)} MILES. THIS CATEGORY OF SHOE TAKES AN ACCELERATED FOAM HIT AT THIS DISTANCE.`,
    });
  }

  // ── Check 3: Category/purpose mismatch ───────────────────────────────────
  if (RACE_TAGS.has(tag.tag) && EASY_PURPOSES.has(run.purpose ?? '')) {
    const appropriateUse = tag.tag === 'EXPLOSIVE' ? 'RACES AND SHORT TEMPO EFFORTS' : 'TEMPO AND THRESHOLD RUNS';
    checks.push({
      type: 'category_mismatch',
      severity: 'moderate',
      headline: `${shoe.model.toUpperCase()} IS ${tag.tag}`,
      detail: `EASY RECOVERY RUNS BURN ITS LIFESPAN FAST. SAVE IT FOR ${appropriateUse}.`,
    });
  }

  // ── Check 4: Wrong terrain ────────────────────────────────────────────────
  const isTrailShoe = shoe.category.startsWith('trail');
  const onTrail = run.terrain === 'trail';
  const onRoad  = run.terrain === 'road' || run.terrain === 'track';

  if (!isTrailShoe && onTrail && miles > 2) {
    checks.push({
      type: 'wrong_terrain',
      severity: 'moderate',
      headline: `${shoe.model.toUpperCase()} IS A ROAD SHOE`,
      detail: `TODAY YOU RAN ${miles.toFixed(1)} MILES ON TRAIL. ROAD OUTSOLES WEAR FASTER ON ROUGH TERRAIN AND OFFER LESS GRIP.`,
    });
  } else if (isTrailShoe && onRoad && miles > 5) {
    checks.push({
      type: 'wrong_terrain',
      severity: 'low',
      headline: `${shoe.model.toUpperCase()} IS A TRAIL SHOE`,
      detail: `TODAY YOU RAN ${miles.toFixed(1)} MILES ON ROAD. AGGRESSIVE LUG OUTSOLES WEAR FASTER ON HARD SURFACES.`,
    });
  }

  // ── Check 5: Consecutive days same shoe ──────────────────────────────────
  const pastRuns = allRuns
    .filter(r => r.shoeId === shoe.id && r.id !== run.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let consecutive = 0;
  for (const pr of pastRuns) {
    const daysBetween = (new Date(run.date).getTime() - new Date(pr.date).getTime()) / 86400000;
    if (daysBetween > 0 && daysBetween <= consecutive + 2) {
      consecutive++;
      if (consecutive >= 4) break;
    } else {
      break;
    }
  }
  if (consecutive >= 4) {
    checks.push({
      type: 'consecutive',
      severity: 'low',
      headline: `${shoe.model.toUpperCase()}: ${consecutive + 1} RUNS IN A ROW`,
      detail: `ROTATING SHOES GIVES FOAM TIME TO REBOUND AND LOADS DIFFERENT MUSCLE GROUPS.`,
    });
  }

  // ── Severity priority: high > moderate > low ──────────────────────────────
  const highCheck = checks.find(c => c.severity === 'high');
  if (highCheck) return highCheck;
  const modCheck = checks.find(c => c.severity === 'moderate');
  if (modCheck) return modCheck;
  const lowCheck = checks.find(c => c.severity === 'low');
  if (lowCheck) return lowCheck;

  // ── Perfect match (positive verdict) ─────────────────────────────────────
  const isPerfect =
    (shoe.use_cases ?? []).some(uc => uc.includes(run.purpose ?? '')) &&
    health.healthPct > 40 &&
    (
      (!onTrail && !isTrailShoe) ||
      (onTrail && isTrailShoe)
    );

  if (isPerfect) {
    return {
      type: 'perfect_match',
      severity: 'positive',
      headline: 'PERFECT MATCH',
      detail: `${shoe.model.toUpperCase()} IS BUILT FOR EXACTLY THIS.`,
    };
  }

  return null;
}

// ── Verdict storage ───────────────────────────────────────────────────────────
import AsyncStorage from '@react-native-async-storage/async-storage';

const VERDICTS_KEY = 'stride_abuse_verdicts_v1';

export interface StoredVerdict {
  runId: string;
  verdict: AbuseVerdict;
  seenAt: string | null; // null = unseen
}

export async function loadVerdicts(): Promise<StoredVerdict[]> {
  const raw = await AsyncStorage.getItem(VERDICTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveVerdict(runId: string, verdict: AbuseVerdict): Promise<void> {
  const all = await loadVerdicts();
  const existing = all.findIndex(v => v.runId === runId);
  const entry: StoredVerdict = { runId, verdict, seenAt: null };
  if (existing >= 0) all[existing] = entry;
  else all.unshift(entry);
  // Keep last 50
  await AsyncStorage.setItem(VERDICTS_KEY, JSON.stringify(all.slice(0, 50)));
}

export async function markVerdictSeen(runId: string): Promise<void> {
  const all = await loadVerdicts();
  const v = all.find(v => v.runId === runId);
  if (v) {
    v.seenAt = new Date().toISOString();
    await AsyncStorage.setItem(VERDICTS_KEY, JSON.stringify(all));
  }
}

export async function getUnseenVerdict(): Promise<StoredVerdict | null> {
  const all = await loadVerdicts();
  return all.find(v => v.seenAt === null) ?? null;
}
