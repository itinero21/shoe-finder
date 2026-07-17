/** STRIDE Intelligence — shared math helpers. */

export const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export const daysBetween = (a: string | Date, b: string | Date) =>
  Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86400000;

/** Exponential recency decay. 21-day half-life by default. */
export const recencyWeight = (days: number, halfLife = 21) => Math.pow(0.5, days / halfLife);

/** 100 when equal, 0 when |a-b| >= tolerance. 50 when either side is unknown. */
export const similarity = (a: number | undefined, b: number | undefined, tolerance = 25) =>
  a == null || b == null ? 50 : clamp(100 - Math.abs(a - b) * (100 / tolerance));

export const weightedAverage = (pairs: [number, number][]) => {
  const w = pairs.reduce((s, [, x]) => s + x, 0);
  return w ? pairs.reduce((s, [v, x]) => s + v * x, 0) / w : 0;
};
