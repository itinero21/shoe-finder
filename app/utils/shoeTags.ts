/**
 * DERIVED SHOE TAGS — Deterministic, one-per-shoe, computed from biomech only.
 * No editorializing. No vibes. Each tag has a formula and an explanation.
 *
 * Priority order matters — first matching rule wins.
 *
 * Phase C of v8 intelligence spec.
 */

import { Shoe } from '../data/shoes';

export type ShoeTag =
  | 'EXPLOSIVE'
  | 'AGGRESSIVE'
  | 'TANK'
  | 'SMOOTH'
  | 'CRUISER'
  | 'FORGIVING'
  | 'PRECISE'
  | 'STEADY';

export interface TagResult {
  tag: ShoeTag;
  description: string;
  reasonCopy: string; // explains WHICH biomech values earned this tag
}

const STABILITY_GUIDANCE = new Set(['neutral', 'guidance', 'mild_support']);

export function deriveShoeTag(shoe: Shoe): TagResult {
  const b = shoe.biomech;
  const s = shoe.specs;

  // 1. EXPLOSIVE — light + bouncy + aggressive geometry
  if (
    b.energy_return >= 9 &&
    s.weight_oz <= 8.0 &&
    b.rocker >= 8
  ) {
    return {
      tag: 'EXPLOSIVE',
      description: 'Light, bouncy, aggressive geometry. Race-day or short fast efforts.',
      reasonCopy: `ENERGY RETURN ${b.energy_return}/10 · WEIGHT ${s.weight_oz}oz · ROCKER ${b.rocker}/10`,
    };
  }

  // 2. AGGRESSIVE — snappy and propulsive but not necessarily race-weight
  if (
    b.energy_return >= 9 &&
    b.cushioning_firmness >= 6 &&
    b.rocker >= 7
  ) {
    return {
      tag: 'AGGRESSIVE',
      description: 'Snappy, propulsive, firm. Tempo and threshold work.',
      reasonCopy: `ENERGY RETURN ${b.energy_return}/10 · FIRMNESS ${b.cushioning_firmness}/10 · ROCKER ${b.rocker}/10`,
    };
  }

  // 3. TANK — maximum support, built heavy, long-haul
  if (
    b.torsional_rigidity >= 9 &&
    b.cushioning_level >= 7 &&
    s.weight_oz >= 11
  ) {
    return {
      tag: 'TANK',
      description: 'Maximum support, heavy duty, built to last. Heavy runners and long days.',
      reasonCopy: `TORSIONAL RIGIDITY ${b.torsional_rigidity}/10 · CUSHION ${b.cushioning_level}/10 · WEIGHT ${s.weight_oz}oz`,
    };
  }

  // 4. SMOOTH — balanced cushion + well-tuned rocker
  if (
    b.cushioning_level >= 8 &&
    b.cushioning_firmness >= 4 && b.cushioning_firmness <= 6 &&
    b.rocker >= 6
  ) {
    return {
      tag: 'SMOOTH',
      description: 'Balanced cushion, well-tuned rocker. Daily versatility.',
      reasonCopy: `CUSHION ${b.cushioning_level}/10 · FIRMNESS ${b.cushioning_firmness}/10 · ROCKER ${b.rocker}/10`,
    };
  }

  // 5. CRUISER — soft and steady, no return, long easy miles
  if (
    b.cushioning_level >= 8 &&
    b.cushioning_firmness <= 5 &&
    b.energy_return < 8
  ) {
    return {
      tag: 'CRUISER',
      description: 'Soft and steady. Long easy miles.',
      reasonCopy: `CUSHION ${b.cushioning_level}/10 · FIRMNESS ${b.cushioning_firmness}/10 · ENERGY RETURN ${b.energy_return}/10`,
    };
  }

  // 6. FORGIVING — high forgiveness, neutral geometry
  if (
    b.cushioning_level >= 8 &&
    b.cushioning_firmness <= 5 &&
    STABILITY_GUIDANCE.has(b.stability_level)
  ) {
    return {
      tag: 'FORGIVING',
      description: 'High forgiveness for tired legs and form breakdown.',
      reasonCopy: `CUSHION ${b.cushioning_level}/10 · FIRMNESS ${b.cushioning_firmness}/10 · STABILITY: ${b.stability_level.toUpperCase()}`,
    };
  }

  // 7. PRECISE — structured, locked-down, responsive
  if (
    b.torsional_rigidity >= 7 &&
    b.midsole_flexibility <= 5 &&
    b.cushioning_firmness >= 6
  ) {
    return {
      tag: 'PRECISE',
      description: 'Structured, responsive, locked-down feel.',
      reasonCopy: `TORSIONAL RIGIDITY ${b.torsional_rigidity}/10 · MIDSOLE FLEX ${b.midsole_flexibility}/10 · FIRMNESS ${b.cushioning_firmness}/10`,
    };
  }

  // 8. STEADY — default: reliable daily trainer
  return {
    tag: 'STEADY',
    description: 'Reliable daily trainer. No standout characteristics.',
    reasonCopy: `BALANCED BIOMECH PROFILE — NO THRESHOLD MET FOR A SPECIALISED TAG`,
  };
}

/** Tag color for display (subtle, not game-tier colors) */
export const TAG_COLORS: Record<ShoeTag, string> = {
  EXPLOSIVE:  '#FF3D00',
  AGGRESSIVE: '#D97706',
  TANK:       '#374151',
  SMOOTH:     '#2563EB',
  CRUISER:    '#7C3AED',
  FORGIVING:  '#16A34A',
  PRECISE:    '#0891B2',
  STEADY:     '#6B7280',
};
