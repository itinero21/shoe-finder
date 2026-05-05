/**
 * Per-run XP modifiers — applied on top of the base match-quality XP.
 *
 * Penalty:
 *   Same shoe 5+ consecutive calendar days → ×0.5 multiplier (rotation signal)
 *   Beginners are immune to all penalties.
 *
 * Bonuses:
 *   First run in a new brand   → +25 XP  (discovery reward)
 *   First run in a new shoe    → +15 XP  (discovery reward)
 */

import { Run } from '../types/run';
import { SHOES } from '../data/shoes';

const SAME_SHOE_THRESHOLD = 5; // consecutive calendar days
const BRAND_BONUS_XP      = 25;
const NEW_SHOE_BONUS_XP   = 15;

export interface RunBonusResult {
  /** Multiplier applied to base XP before adding bonuses. 1.0 = no penalty. */
  penaltyMultiplier: number;
  /** Flat XP added after penalties. */
  bonusXP: number;
  /** Human-readable strings for display. */
  bonusReasons: string[];
  /** Human-readable penalty explanation, or null. */
  penaltyReason: string | null;
}

/**
 * Calculate penalty + bonuses for a run about to be saved.
 *
 * @param shoeId   The shoe being used for THIS run.
 * @param allRuns  All PREVIOUS runs (not including the current one).
 * @param isBeginnerMode  Beginners are immune to penalties.
 */
export function calcRunBonuses(
  shoeId: string,
  allRuns: Run[],
  isBeginnerMode: boolean
): RunBonusResult {
  const shoe  = SHOES.find(s => s.id === shoeId);
  const brand = shoe?.brand ?? null;

  let penaltyMultiplier = 1.0;
  let penaltyReason: string | null = null;
  let bonusXP = 0;
  const bonusReasons: string[] = [];

  // ── Same-shoe rotation penalty ─────────────────────────────────────────────
  if (!isBeginnerMode) {
    const today = new Date();
    let sameDaysBack = 0;

    for (let d = 1; d <= SAME_SHOE_THRESHOLD; d++) {
      const target = new Date(today);
      target.setDate(today.getDate() - d);
      const targetStr = target.toISOString().slice(0, 10);

      const woreThatDay = allRuns.some(
        r => r.shoeId === shoeId && r.date.slice(0, 10) === targetStr
      );
      if (woreThatDay) {
        sameDaysBack++;
      } else {
        break; // gap in consecutive days — stop counting
      }
    }

    if (sameDaysBack >= SAME_SHOE_THRESHOLD) {
      penaltyMultiplier = 0.5;
      penaltyReason =
        `${sameDaysBack + 1} days in a row in the same shoe — rotate your kicks for full XP.`;
    }
  }

  // ── New brand bonus ────────────────────────────────────────────────────────
  if (brand) {
    const brandsUsed = new Set(
      allRuns
        .map(r => SHOES.find(s => s.id === r.shoeId)?.brand)
        .filter((b): b is string => Boolean(b))
    );
    if (!brandsUsed.has(brand)) {
      bonusXP += BRAND_BONUS_XP;
      bonusReasons.push(`First ${brand} run  +${BRAND_BONUS_XP} XP`);
    }
  }

  // ── New shoe bonus ─────────────────────────────────────────────────────────
  const hasRunThisShoe = allRuns.some(r => r.shoeId === shoeId);
  if (!hasRunThisShoe && shoe) {
    bonusXP += NEW_SHOE_BONUS_XP;
    bonusReasons.push(`First run in ${shoe.model}  +${NEW_SHOE_BONUS_XP} XP`);
  }

  return { penaltyMultiplier, bonusXP, bonusReasons, penaltyReason };
}

/**
 * Apply penalty + bonuses to the base XP from match quality.
 * Returns the final XP value to store on the run.
 */
export function applyRunBonuses(
  baseXP: number,
  bonusResult: RunBonusResult
): number {
  return Math.max(0, Math.round(baseXP * bonusResult.penaltyMultiplier) + bonusResult.bonusXP);
}
