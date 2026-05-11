import { Shoe } from '../data/shoes';
import { Run } from '../types/run';
import { deriveShoeTag, ShoeTag } from './shoeTags';
import { detectFoamType } from './shoeFatigue';

// ─── v2 Sub-score breakdown (6 dimensions) ────────────────────────────────────

export interface RotationBreakdown {
  total: number;              // 0–100
  // v2 scores
  variety: number;            // 0–30 (was 40)
  terrainMix: number;         // 0–20 (was 30)
  foamVariance: number;       // 0–15 (new)
  geometryDiversity: number;  // 0–15 (new)
  tagCoverage: number;        // 0–10 (new)
  mileageBalance: number;     // 0–10 (was 30)
  // Display detail strings
  suggestion: string;
  varietyDetail: string;
  terrainDetail: string;
  balanceDetail: string;
  foamDetail: string;
  tagDetail: string;
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

// ── v2: Foam variance ─────────────────────────────────────────────────────────
function calcFoamVariance(shoes: Shoe[], runs: Run[]): { score: number; detail: string } {
  const recent30d = getRecentRuns(runs, 4);
  const usedIds = new Set(recent30d.map(r => r.shoeId).filter(Boolean));
  const activeShoes = shoes.filter(s => usedIds.has(s.id));
  if (activeShoes.length === 0) return { score: 0, detail: 'NO ACTIVE SHOES' };

  const foamTypes = new Set(activeShoes.map(s => detectFoamType(s.tech)));
  const count = foamTypes.size;
  const score = count >= 3 ? 15 : count === 2 ? 10 : count === 1 ? 5 : 0;
  const typeList = [...foamTypes].join(', ').toUpperCase().replace(/_/g, ' ');
  return { score, detail: count === 1 ? `ALL ${typeList}` : `${count} FOAM TYPES` };
}

// ── v2: Geometry diversity ────────────────────────────────────────────────────
function calcGeometryDiversity(shoes: Shoe[], runs: Run[]): { score: number; detail: string } {
  const recent30d = getRecentRuns(runs, 4);
  const usedIds = new Set(recent30d.map(r => r.shoeId).filter(Boolean));
  const active = shoes.filter(s => usedIds.has(s.id));
  if (active.length < 2) return { score: 0, detail: 'NEED 2+ ACTIVE SHOES' };

  const drops   = active.map(s => s.specs.drop_mm);
  const stacks  = active.map(s => s.specs.stack_heel_mm);
  const rockers = active.map(s => s.biomech.rocker);

  const dropRange   = Math.max(...drops)   - Math.min(...drops);
  const stackRange  = Math.max(...stacks)  - Math.min(...stacks);
  const rockerRange = Math.max(...rockers) - Math.min(...rockers);

  const full = dropRange >= 4 && stackRange >= 8 && rockerRange >= 3;
  const partial = dropRange >= 2 || stackRange >= 5 || rockerRange >= 2;
  const score = full ? 15 : partial ? 8 : 0;
  const detail = full ? 'GOOD GEOMETRY SPREAD' : partial ? 'PARTIAL SPREAD' : 'SIMILAR GEOMETRY';
  return { score, detail };
}

// ── v2: Tag coverage ─────────────────────────────────────────────────────────
function calcTagCoverage(shoes: Shoe[], runs: Run[]): { score: number; detail: string; tags: ShoeTag[] } {
  const recent30d = getRecentRuns(runs, 4);
  const usedIds = new Set(recent30d.map(r => r.shoeId).filter(Boolean));
  const active = shoes.filter(s => usedIds.has(s.id));
  const tags = [...new Set(active.map(s => deriveShoeTag(s).tag))];
  const score = tags.length >= 3 ? 10 : tags.length === 2 ? 6 : tags.length === 1 ? 3 : 0;
  const detail = tags.length === 0 ? 'NO DATA' : tags.join(', ');
  return { score, detail, tags };
}

export function getDetailedRotationScore(shoes: Shoe[], runs: Run[]): RotationBreakdown {
  const v = calcVariety(runs);
  const t = calcTerrainMix(runs);
  const b = calcMileageBalance(runs, shoes);
  const f = calcFoamVariance(shoes, runs);
  const g = calcGeometryDiversity(shoes, runs);
  const tc = calcTagCoverage(shoes, runs);

  // v2 weights: 30+20+15+15+10+10 = 100
  const vScore = Math.round((v.score / 40) * 30);  // rescale from old /40 to /30
  const tScore = Math.round((t.score / 30) * 20);  // rescale from old /30 to /20
  const bScore = Math.round((b.score / 30) * 10);  // rescale from old /30 to /10
  const total  = vScore + tScore + f.score + g.score + tc.score + bScore;

  // ── Gap detection: ONE suggestion in priority order ───────────────────────
  let suggestion = 'ROTATION LOOKS BALANCED THIS WEEK.';

  const hasAggressiveTag = tc.tags.some(tag => tag === 'AGGRESSIVE' || tag === 'EXPLOSIVE');
  const speedPurposes = runs.filter(r => ['tempo', 'speed', 'race'].includes(r.purpose ?? '')).length;

  if (!hasAggressiveTag && tc.score < 5 && speedPurposes > 0) {
    suggestion = 'YOUR ROTATION LACKS AN AGGRESSIVE TEMPO OPTION. CONSIDER A SUPER TRAINER OR LIGHTWEIGHT DAILY.';
  } else if (t.terrains.length === 1 && t.terrains[0] === 'road' && tScore < 12) {
    suggestion = 'ADD A TRAIL RUN. YOUR LAST 30 DAYS ARE 100% ROAD.';
  } else if (b.dominantPct && b.dominantPct > 60 && b.dominantShoe) {
    suggestion = `${b.dominantShoe} HAS ${b.dominantPct}% OF YOUR MILES. ROTATE ONE OF YOUR OTHERS THIS WEEK.`;
  } else if (f.score < 10) {
    suggestion = 'YOUR ROTATION USES ONE FOAM TYPE. DIFFERENT MIDSOLES LOAD TISSUES DIFFERENTLY.';
  } else if (v.shoesUsed === 0) {
    suggestion = 'LOG A RUN TO START YOUR ROTATION SCORE.';
  } else if (vScore < 15) {
    suggestion = `YOU USED ${v.shoesUsed} SHOE${v.shoesUsed > 1 ? 'S' : ''} THIS MONTH. ROTATION HEALTH PEAKS AT 4.`;
  }

  return {
    total,
    variety: vScore,
    terrainMix: tScore,
    foamVariance: f.score,
    geometryDiversity: g.score,
    tagCoverage: tc.score,
    mileageBalance: bScore,
    suggestion,
    varietyDetail: v.detail,
    terrainDetail: t.detail,
    balanceDetail: b.detail,
    foamDetail: f.detail,
    tagDetail: tc.detail,
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
