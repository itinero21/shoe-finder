import { Shoe } from '../data/shoes';
import { Run } from '../types/run';

// ─── Sub-score breakdown ──────────────────────────────────────────────────────

export interface RotationBreakdown {
  total: number;           // 0–100
  variety: number;         // 0–40
  terrainMix: number;      // 0–30
  mileageBalance: number;  // 0–30
  suggestion: string;      // single actionable improvement
  varietyDetail: string;   // e.g. "3 SHOES USED"
  terrainDetail: string;   // e.g. "ROAD ONLY"
  balanceDetail: string;   // e.g. "CLIFTON DOMINATES 72%"
}

function getRecentRuns(runs: Run[], weeks = 4): Run[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeks * 7);
  return runs.filter(r => new Date(r.date) >= cutoff);
}

function calcVariety(runs: Run[]): { score: number; shoesUsed: number; detail: string } {
  const recent = getRecentRuns(runs);
  const shoesUsed = new Set(recent.map(r => r.shoeId).filter(Boolean)).size;
  const score = Math.min(40, shoesUsed * 10);
  const detail = shoesUsed === 0 ? 'NO RUNS LOGGED' : `${shoesUsed} SHOE${shoesUsed > 1 ? 'S' : ''} USED`;
  return { score, shoesUsed, detail };
}

function calcTerrainMix(runs: Run[]): { score: number; terrains: string[]; detail: string } {
  const recent = getRecentRuns(runs);
  const terrains = [...new Set(recent.map(r => r.terrain).filter(Boolean))] as string[];
  const score = Math.min(30, terrains.length * 10);
  const detail = terrains.length === 0
    ? 'NO RUNS'
    : terrains.length === 1
    ? `${terrains[0].toUpperCase()} ONLY`
    : `${terrains.map(t => t.toUpperCase()).join(', ')}`;
  return { score, terrains, detail };
}

function calcMileageBalance(runs: Run[], shoes: Shoe[]): {
  score: number;
  dominantShoe?: string;
  dominantPct?: number;
  detail: string;
} {
  const recent = getRecentRuns(runs);
  const milesByShoe: Record<string, number> = {};
  for (const r of recent) {
    if (r.shoeId) milesByShoe[r.shoeId] = (milesByShoe[r.shoeId] ?? 0) + r.distanceKm;
  }

  const total = Object.values(milesByShoe).reduce((s, m) => s + m, 0);
  if (total === 0) return { score: 0, detail: 'NO MILES LOGGED' };
  if (Object.keys(milesByShoe).length <= 1) {
    const dominantId = Object.keys(milesByShoe)[0];
    const dominantShoe = shoes.find(s => s.id === dominantId);
    const name = dominantShoe ? dominantShoe.model.toUpperCase() : 'ONE SHOE';
    return { score: 10, dominantShoe: name, dominantPct: 100, detail: `${name} HAS ALL MILES` };
  }

  const maxMiles = Math.max(...Object.values(milesByShoe));
  const dominantId = Object.entries(milesByShoe).find(([, m]) => m === maxMiles)?.[0];
  const dominantPct = Math.round((maxMiles / total) * 100);
  const dominantShoe = shoes.find(s => s.id === dominantId);
  const name = dominantShoe ? dominantShoe.model.toUpperCase() : 'ONE SHOE';

  let score = 30;
  if (dominantPct > 70) score = 10;
  else if (dominantPct > 50) score = 20;

  const detail = dominantPct > 50 ? `${name} DOMINATES ${dominantPct}%` : 'WELL BALANCED';
  return { score, dominantShoe: name, dominantPct, detail };
}

export function getDetailedRotationScore(shoes: Shoe[], runs: Run[]): RotationBreakdown {
  const v = calcVariety(runs);
  const t = calcTerrainMix(runs);
  const b = calcMileageBalance(runs, shoes);

  const total = v.score + t.score + b.score;

  // Single highest-impact suggestion
  let suggestion = 'ROTATION LOOKS BALANCED THIS WEEK.';

  const vPct = v.shoesUsed === 0 ? 0 : v.score / 40;
  const tPct = t.terrains.length === 0 ? 0 : t.score / 30;
  const bPct = b.score / 30;

  if (v.shoesUsed === 0) {
    suggestion = 'LOG A RUN TO START YOUR ROTATION SCORE.';
  } else if (vPct <= Math.min(tPct, bPct)) {
    if (v.shoesUsed === 1) suggestion = 'RUN IN A 2ND SHOE. ONE SHOE HAS ALL YOUR MILES.';
    else suggestion = `RUN IN A ${v.shoesUsed + 1}TH SHOE. VARIETY MAXES AT 4.`;
  } else if (tPct <= Math.min(vPct, bPct)) {
    const hasTrail = t.terrains.includes('trail');
    const hasRoad  = t.terrains.includes('road');
    if (!hasTrail) suggestion = 'ADD A TRAIL RUN. YOUR TERRAIN MIX NEEDS MORE VARIETY.';
    else if (!hasRoad) suggestion = 'LOG A ROAD RUN. TERRAIN MIX IS TRAIL-ONLY.';
    else suggestion = 'MIX UP YOUR TERRAINS. TRY A TREADMILL OR TRACK SESSION.';
  } else if (b.score < 30 && b.dominantShoe) {
    suggestion = `USE A DIFFERENT SHOE. ${b.dominantShoe} HAS ${b.dominantPct}% OF YOUR MILES.`;
  }

  return {
    total,
    variety: v.score,
    terrainMix: t.score,
    mileageBalance: b.score,
    suggestion,
    varietyDetail: v.detail,
    terrainDetail: t.detail,
    balanceDetail: b.detail,
  };
}

// ── Legacy compatibility ───────────────────────────────────────────────────────

function getCategoryRoles(category: string) {
  switch (category) {
    case 'carbon_racer':      return { easy: 1, long: 5, speed: 9, race: 10 };
    case 'lightweight_speed': return { easy: 4, long: 5, speed: 9, race: 7 };
    case 'max_cushion':       return { easy: 9, long: 10, speed: 3, race: 2 };
    case 'stability':         return { easy: 8, long: 8, speed: 4, race: 2 };
    case 'motion_control':    return { easy: 7, long: 7, speed: 2, race: 1 };
    case 'trail':             return { easy: 7, long: 7, speed: 5, race: 5 };
    case 'neutral':
    default:                  return { easy: 8, long: 8, speed: 5, race: 3 };
  }
}

export function getRotationProfile(shoes: Shoe[]) {
  const profile = { easy: 0, long: 0, speed: 0, race: 0 };
  shoes.forEach(shoe => {
    const roles = getCategoryRoles(shoe.category);
    profile.easy  += roles.easy;
    profile.long  += roles.long;
    profile.speed += roles.speed;
    profile.race  += roles.race;
  });
  return profile;
}

export function getRotationInsights(profile: Record<string, number>) {
  const insights: string[] = [];
  if (profile.speed < 5)  insights.push('Consider adding a speed/tempo shoe');
  if (profile.race < 5)   insights.push('Add a race day shoe for PRs');
  if (profile.easy > 25)  insights.push('You may have too many easy-day shoes');
  if (profile.long < 6)   insights.push('Need a dedicated long-run shoe');
  if (profile.easy < 8)   insights.push('Add more easy/recovery shoes to your rotation');
  if (insights.length === 0) insights.push('Well-balanced rotation for all run types!');
  return insights;
}

export function getRotationHealthScore(profile: Record<string, number>): number {
  let score = 100;
  if (profile.easy  < 7)  score -= 20;
  if (profile.long  < 6)  score -= 15;
  if (profile.speed < 5)  score -= 15;
  if (profile.race  < 4)  score -= 10;
  if (profile.easy  > 25) score -= 10;
  return Math.max(0, score);
}
