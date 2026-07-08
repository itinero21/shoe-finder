import { Shoe } from '../data/shoes';
import { Run } from '../types/run';
import { LivingShoe, ShoeMoment, ShoeMood } from '../types/character';

const MI_PER_KM = 0.621371;
const DAY_MS = 86400000;

export type StorySignalKind =
  | 'streak'
  | 'achievement'
  | 'memory'
  | 'rivalry'
  | 'season'
  | 'moment'
  | 'lineage'
  | 'draft';

export interface ShoeStreak {
  current: number;
  longest: number;
  lastUsedDaysAgo: number | null;
  line: string | null;
}

export interface HiddenShoeAchievement {
  id: string;
  title: string;
  detail: string;
  unlocked: boolean;
}

export interface ShoeStoryMemory {
  title: string;
  text: string;
  date?: string;
}

export interface ShoeRivalry {
  rivalShoeId: string;
  rivalName: string;
  line: string;
  intensity: 'teasing' | 'sharp';
}

export interface ShoeSeason {
  label: string;
  count: number;
  line: string;
}

export interface ShoeSoundtrack {
  careerLine: string;
  beats: string[];
}

export interface ShoeAward {
  id: string;
  title: string;
  shoeId: string;
  shoeName: string;
  detail: string;
}

export interface ShoeDraftPick {
  shoeId: string;
  shoeName: string;
  role: string;
  projectedLifespanMiles: number;
  reason: string;
}

export interface ShoeScrapbook {
  firstRun?: Run;
  fastestRun?: Run;
  longestRun?: Run;
  rainiestRun?: Run;
  latestStory?: Run;
  greatestMoments: ShoeStoryMemory[];
}

export interface ShoeStoryProfile {
  streak: ShoeStreak;
  achievements: HiddenShoeAchievement[];
  unlockedAchievements: HiddenShoeAchievement[];
  memories: ShoeStoryMemory[];
  rivalry: ShoeRivalry | null;
  season: ShoeSeason | null;
  unexpectedMoment: string | null;
  soundtrack: ShoeSoundtrack;
  earnedPersonality: string | null;
  scrapbook: ShoeScrapbook;
  draftPicks: ShoeDraftPick[];
}

function byDateAsc(a: Run, b: Run) {
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

function byDateDesc(a: Run, b: Run) {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

function shoeName(shoe: Shoe | undefined): string {
  return shoe ? `${shoe.brand} ${shoe.model}` : 'Unknown shoe';
}

function miles(run: Run): number {
  return run.distanceKm * MI_PER_KM;
}

function totalMiles(runs: Run[]): number {
  return runs.reduce((sum, run) => sum + miles(run), 0);
}

function paceMinPerKm(run: Run): number | null {
  if (!run.durationMinutes || run.distanceKm <= 0) return null;
  return run.durationMinutes / run.distanceKm;
}

function hasRain(run: Run): boolean {
  const n = run.notes?.toLowerCase() ?? '';
  return /\brain|rained|rainy|storm|wet|pouring|drizzle\b/.test(n);
}

function hasComeback(run: Run): boolean {
  const n = run.notes?.toLowerCase() ?? '';
  return /\bcomeback|return|back after|injury|rehab|recovery\b/.test(n);
}

function hasStoryNote(run: Run): boolean {
  const note = run.notes?.trim();
  if (!note || note.length < 12) return false;
  return !/^(good|ok|okay|fine|tired|easy|hard)$/i.test(note);
}

function seasonFor(date: Date): string {
  const month = date.getMonth();
  if (month <= 1 || month === 11) return 'Winter';
  if (month <= 4) return 'Spring';
  if (month <= 7) return 'Summer';
  return 'Fall';
}

function computeCurrentSeason(shoeRuns: Run[]): ShoeSeason | null {
  if (shoeRuns.length === 0) return null;
  const now = new Date();
  const season = seasonFor(now);
  const years = new Set(
    shoeRuns
      .filter(run => seasonFor(new Date(run.date)) === season)
      .map(run => new Date(run.date).getFullYear())
  );
  const count = years.size;
  if (count === 0) return null;
  return {
    label: `${season} Shoe`,
    count,
    line: count === 1
      ? `First ${season.toLowerCase()} together.`
      : `This is ${season.toLowerCase()} number ${count} together.`,
  };
}

function computeStreak(shoeId: string, allRuns: Run[]): ShoeStreak {
  const sorted = [...allRuns].sort(byDateDesc).filter(run => run.shoeId);
  let current = 0;
  for (const run of sorted) {
    if (run.shoeId === shoeId) current++;
    else break;
  }

  let longest = 0;
  let active = 0;
  for (const run of [...allRuns].sort(byDateAsc)) {
    if (run.shoeId === shoeId) {
      active++;
      longest = Math.max(longest, active);
    } else {
      active = 0;
    }
  }

  const lastRun = sorted.find(run => run.shoeId === shoeId);
  const lastUsedDaysAgo = lastRun
    ? Math.max(0, Math.floor((Date.now() - new Date(lastRun.date).getTime()) / DAY_MS))
    : null;

  let line: string | null = null;
  if (current >= 3) line = `Current shoe streak: ${current} straight runs.`;
  else if (lastUsedDaysAgo != null && lastUsedDaysAgo >= 14) line = `Benched for ${lastUsedDaysAgo} days.`;
  else if (longest >= 10) line = `Longest streak together: ${longest} runs.`;

  return { current, longest, lastUsedDaysAgo, line };
}

function computeAchievements(shoeRuns: Run[], char: LivingShoe): HiddenShoeAchievement[] {
  const rainRuns = shoeRuns.filter(hasRain).length;
  const raceRuns = shoeRuns.filter(run => run.purpose === 'race').length;
  const dawnRuns = shoeRuns.filter(run => new Date(run.date).getHours() < 7).length;
  const nightRuns = shoeRuns.filter(run => new Date(run.date).getHours() >= 20).length;
  const marathonRuns = shoeRuns.filter(run => run.distanceKm >= 42).length;
  const comebackRuns = shoeRuns.filter(hasComeback).length;
  const milesRun = Math.round(totalMiles(shoeRuns));

  return [
    {
      id: 'rain_warrior',
      title: 'Rain Warrior',
      detail: `${rainRuns}/20 rain runs`,
      unlocked: rainRuns >= 20,
    },
    {
      id: 'marathon_survivor',
      title: 'Marathon Survivor',
      detail: marathonRuns > 0 ? 'Completed marathon distance' : 'Needs one marathon-distance run',
      unlocked: marathonRuns > 0,
    },
    {
      id: 'dawn_patrol',
      title: 'Dawn Patrol',
      detail: `${dawnRuns}/20 runs before 7am`,
      unlocked: dawnRuns >= 20,
    },
    {
      id: 'night_runner',
      title: 'Night Runner',
      detail: `${nightRuns}/25 night runs`,
      unlocked: nightRuns >= 25,
    },
    {
      id: 'race_memory',
      title: 'Race Memory',
      detail: `${raceRuns} race${raceRuns === 1 ? '' : 's'} together`,
      unlocked: raceRuns > 0,
    },
    {
      id: 'survivor',
      title: 'Past Expected Lifespan',
      detail: `${Math.round(char.lifePct)}% of expected life used`,
      unlocked: char.lifePct >= 100 || milesRun > char.lifespanMiles,
    },
    {
      id: 'comeback_shoe',
      title: 'Comeback Shoe',
      detail: comebackRuns > 0 ? 'Used during a return run' : 'Waiting for a comeback story',
      unlocked: comebackRuns > 0,
    },
  ];
}

function computeMemories(shoe: Shoe, shoeRuns: Run[], moments: ShoeMoment[]): ShoeStoryMemory[] {
  const memories: ShoeStoryMemory[] = [];
  const sorted = [...shoeRuns].sort(byDateAsc);
  if (sorted.length === 0) return memories;

  // Highest crossed run-count milestone (not exact, so it always shows once earned)
  const hitMilestone = [200, 100, 50].find(m => sorted.length >= m);
  if (hitMilestone) {
    memories.push({
      title: `${hitMilestone} Runs`,
      text: `Run ${hitMilestone} with ${shoe.model}.`,
      date: sorted[hitMilestone - 1].date,
    });
  }

  // Most recent unlocked moment from the character engine
  const newestMoment = [...moments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  if (newestMoment) {
    memories.push({ title: 'Unlocked', text: newestMoment.caption, date: newestMoment.date });
  }

  // Story note — fallback when nothing else earned yet
  if (memories.length === 0) {
    const storyRun = sorted.filter(hasStoryNote).slice(-1)[0];
    if (storyRun) {
      memories.push({ title: 'Story Note', text: storyRun.notes!.trim(), date: storyRun.date });
    }
  }

  return memories.slice(0, 3);
}

function computeRivalry(shoeId: string, shoeRuns: Run[], allRuns: Run[], shoeDataMap: Record<string, Shoe>): ShoeRivalry | null {
  const last21 = allRuns
    .filter(run => Date.now() - new Date(run.date).getTime() <= 21 * DAY_MS)
    .filter(run => run.shoeId);
  if (last21.length < 5) return null;

  const thisCount = last21.filter(run => run.shoeId === shoeId).length;
  const counts: Record<string, number> = {};
  for (const run of last21) {
    if (run.shoeId === shoeId) continue;
    counts[run.shoeId] = (counts[run.shoeId] ?? 0) + 1;
  }

  const rivalId = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  if (!rivalId || counts[rivalId] < 3 || thisCount > 1) return null;

  const rival = shoeDataMap[rivalId];
  return {
    rivalShoeId: rivalId,
    rivalName: shoeName(rival),
    line: shoeRuns.length === 0
      ? `${rival?.model ?? 'Another shoe'} is getting all the first memories.`
      : `${rival?.model ?? 'Another shoe'} got ${counts[rivalId]} of the last ${last21.length} runs.`,
    intensity: counts[rivalId] >= 6 ? 'sharp' : 'teasing',
  };
}

function computeUnexpectedMoment(char: LivingShoe, shoeRuns: Run[]): string | null {
  if (shoeRuns.length === 0) return null;
  const sorted = [...shoeRuns].sort(byDateAsc);
  const last = sorted[sorted.length - 1];
  const milesRun = Math.round(totalMiles(shoeRuns));

  const milestoneMiles = [1000, 750, 500, 400, 300, 200, 100].find(m => milesRun >= m && milesRun < m + 5);
  if (milestoneMiles) return `${milestoneMiles} miles together.`;
  if (char.lifePct >= 50 && char.lifePct < 55) {
    return 'Halfway to retirement.';
  }
  if (last.purpose === 'race') {
    return 'Race memory unlocked.';
  }
  const previousLongest = sorted.slice(0, -1).reduce((max, run) => Math.max(max, run.distanceKm), 0);
  if (last.distanceKm > previousLongest && sorted.length > 1) {
    return 'New longest run together.';
  }
  return null;
}

function computeSoundtrack(shoeRuns: Run[]): ShoeSoundtrack {
  const runCount = shoeRuns.length;
  const rainRuns = shoeRuns.filter(hasRain).length;
  const raceRuns = shoeRuns.filter(run => run.purpose === 'race').length;
  const storyRuns = shoeRuns.filter(hasStoryNote).length;
  const pbRuns = shoeRuns.filter(run => run.match_quality === 'perfect').length;
  const milesRun = Math.round(totalMiles(shoeRuns));

  const beats = [
    `${runCount} run${runCount === 1 ? '' : 's'}`,
    `${milesRun} miles`,
    `${rainRuns} rain run${rainRuns === 1 ? '' : 's'}`,
    `${raceRuns} race${raceRuns === 1 ? '' : 's'}`,
    `${pbRuns} standout fit${pbRuns === 1 ? '' : 's'}`,
  ];
  if (storyRuns > 0) beats.push(`${storyRuns} real-life note${storyRuns === 1 ? '' : 's'}`);

  return {
    careerLine: runCount === 0 ? 'No soundtrack yet.' : 'Career soundtrack',
    beats,
  };
}

function computeEarnedPersonality(shoeRuns: Run[], char: LivingShoe): string | null {
  if (shoeRuns.length < 5) return null;
  const total = shoeRuns.length;
  const race = shoeRuns.filter(run => run.purpose === 'race').length;
  const speed = shoeRuns.filter(run => run.purpose === 'speed' || run.purpose === 'tempo').length;
  const rain = shoeRuns.filter(hasRain).length;
  const recovery = shoeRuns.filter(run => run.purpose === 'recovery' || run.purpose === 'easy').length;

  if (char.lifePct >= 100) return 'The Survivor';
  if (race >= 2) return 'The Racer';
  if (rain >= 5) return 'The Rain Warrior';
  if (speed / total >= 0.45) return 'The Spark';
  if (recovery / total >= 0.6 || total >= 20) return 'The Workhorse';
  if (shoeRuns.some(hasComeback)) return 'The Comeback Shoe';
  return null;
}

function computeScrapbook(shoeRuns: Run[], moments: ShoeMoment[]): ShoeScrapbook {
  const sorted = [...shoeRuns].sort(byDateAsc);
  const firstRun = sorted[0];
  const fastestRun = sorted
    .filter(run => paceMinPerKm(run) != null)
    .sort((a, b) => (paceMinPerKm(a) ?? 999) - (paceMinPerKm(b) ?? 999))[0];
  const longestRun = [...sorted].sort((a, b) => b.distanceKm - a.distanceKm)[0];
  const rainiestRun = sorted.find(hasRain);
  const latestStory = [...sorted].sort(byDateDesc).find(hasStoryNote);

  const greatestMoments: ShoeStoryMemory[] = [];
  if (firstRun) greatestMoments.push({ title: 'First Run', text: `${miles(firstRun).toFixed(1)} miles to begin the story.`, date: firstRun.date });
  if (longestRun && longestRun !== firstRun) greatestMoments.push({ title: 'Longest Run', text: `${miles(longestRun).toFixed(1)} miles together.`, date: longestRun.date });
  if (fastestRun && fastestRun !== firstRun && fastestRun !== longestRun) greatestMoments.push({ title: 'Fastest Feeling', text: `${paceMinPerKm(fastestRun)!.toFixed(1)} min/km average.`, date: fastestRun.date });
  if (latestStory?.notes && latestStory !== firstRun && latestStory !== longestRun && latestStory !== fastestRun) greatestMoments.push({ title: 'Real Life', text: latestStory.notes.trim(), date: latestStory.date });
  for (const moment of moments.slice(-2)) {
    greatestMoments.push({ title: 'Unlocked', text: moment.caption, date: moment.date });
  }

  return {
    firstRun,
    fastestRun,
    longestRun,
    rainiestRun,
    latestStory,
    greatestMoments: greatestMoments.slice(0, 5),
  };
}

function estimateDraftLife(shoe: Shoe): number {
  const isRacer = shoe.category.includes('racer') || shoe.category === 'super_trainer';
  const isTrail = shoe.category.startsWith('trail');
  if (isRacer) return 250;
  if (isTrail) return 450;
  if (shoe.biomech.cushioning_level >= 8) return 425;
  return 400;
}

function computeDraftPicks(current: Shoe, closetIds: string[], allShoes: Shoe[]): ShoeDraftPick[] {
  const isTrail = current.category.startsWith('trail');
  const candidates = allShoes
    .filter(shoe => shoe.id !== current.id && !closetIds.includes(shoe.id))
    .map(shoe => {
      let score = 0;
      if (shoe.brand === current.brand) score += 3;
      if (shoe.category === current.category) score += 5;
      if (isTrail === shoe.category.startsWith('trail')) score += 4;
      score -= Math.abs(shoe.specs.drop_mm - current.specs.drop_mm) * 0.25;
      score -= Math.abs(shoe.biomech.cushioning_level - current.biomech.cushioning_level) * 0.4;
      if (shoe.price_usd <= current.price_usd + 30) score += 1;
      return { shoe, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return candidates.map(({ shoe }, index) => ({
    shoeId: shoe.id,
    shoeName: shoeName(shoe),
    role: index === 0 ? 'Heir Apparent' : index === 1 ? 'Alternate Future' : 'Wildcard Pick',
    projectedLifespanMiles: estimateDraftLife(shoe),
    reason: shoe.category === current.category
      ? `Same role as ${current.model}, with a fresh lifespan.`
      : `Keeps the rotation balanced while replacing ${current.model}'s job.`,
  }));
}

export function buildShoeStoryProfile(
  char: LivingShoe,
  shoe: Shoe,
  allRuns: Run[],
  allLivingShoes: LivingShoe[],
  allShoes: Shoe[],
): ShoeStoryProfile {
  const shoeDataMap = Object.fromEntries(allShoes.map(s => [s.id, s]));
  const shoeRuns = allRuns.filter(run => run.shoeId === char.shoeId).sort(byDateAsc);
  const closetIds = allLivingShoes.map(s => s.shoeId);
  const streak = computeStreak(char.shoeId, allRuns);
  const achievements = computeAchievements(shoeRuns, char);

  return {
    streak,
    achievements,
    unlockedAchievements: achievements.filter(a => a.unlocked),
    memories: computeMemories(shoe, shoeRuns, char.moments),
    rivalry: computeRivalry(char.shoeId, shoeRuns, allRuns, shoeDataMap),
    season: computeCurrentSeason(shoeRuns),
    unexpectedMoment: computeUnexpectedMoment(char, shoeRuns),
    soundtrack: computeSoundtrack(shoeRuns),
    earnedPersonality: computeEarnedPersonality(shoeRuns, char),
    scrapbook: computeScrapbook(shoeRuns, char.moments),
    draftPicks: char.lifeStage === 'twilight' || char.lifePct >= 75
      ? computeDraftPicks(shoe, closetIds, allShoes)
      : [],
  };
}

export function computeStoryMoodOverride(
  mood: ShoeMood,
  streak: ShoeStreak,
): ShoeMood {
  if (streak.current >= 5) return 'proud';
  if ((streak.lastUsedDaysAgo ?? 0) >= 14) return 'anxious';
  return mood;
}

export function buildYearEndShoeAwards(
  livingShoes: LivingShoe[],
  memorials: { shoeId: string; brand: string; model: string; totalMiles: number; runCount: number }[],
  allRuns: Run[],
  shoeDataMap: Record<string, Shoe>,
  year = new Date().getFullYear(),
): ShoeAward[] {
  const yearRuns = allRuns.filter(run => new Date(run.date).getFullYear() === year && run.shoeId);
  const shoeIds = [...new Set([
    ...livingShoes.map(shoe => shoe.shoeId),
    ...memorials.map(shoe => shoe.shoeId),
    ...yearRuns.map(run => run.shoeId).filter(id => id),
  ])];

  const stats = shoeIds.map(shoeId => {
    const runs = yearRuns.filter(run => run.shoeId === shoeId);
    const shoe = shoeDataMap[shoeId];
    const memorial = memorials.find(m => m.shoeId === shoeId);
    return {
      shoeId,
      name: shoe ? shoeName(shoe) : memorial ? `${memorial.brand} ${memorial.model}` : 'Unknown shoe',
      runs,
      miles: totalMiles(runs),
      rain: runs.filter(hasRain).length,
      races: runs.filter(run => run.purpose === 'race').length,
      comeback: runs.filter(hasComeback).length,
      value: shoe && totalMiles(runs) > 0 ? shoe.price_usd / totalMiles(runs) : Number.POSITIVE_INFINITY,
    };
  }).filter(s => s.runs.length > 0);

  const awards: ShoeAward[] = [];
  const pushBest = (
    id: string,
    title: string,
    pick: typeof stats[number] | undefined,
    detail: (pick: typeof stats[number]) => string,
  ) => {
    if (!pick) return;
    if (awards.some(a => a.id === id || (a.shoeId === pick.shoeId && awards.length > 2))) return;
    awards.push({ id, title, shoeId: pick.shoeId, shoeName: pick.name, detail: detail(pick) });
  };

  pushBest('most_loyal', 'Most Loyal Shoe', [...stats].sort((a, b) => b.runs.length - a.runs.length)[0], p => `${p.runs.length} runs this year`);
  pushBest('most_miles', 'Most Miles', [...stats].sort((a, b) => b.miles - a.miles)[0], p => `${Math.round(p.miles)} miles`);
  pushBest('rain_champion', 'Rain Champion', [...stats].filter(s => s.rain > 0).sort((a, b) => b.rain - a.rain)[0], p => `${p.rain} wet runs`);
  pushBest('race_day', 'Race Day Shoe', [...stats].filter(s => s.races > 0).sort((a, b) => b.races - a.races)[0], p => `${p.races} races`);
  pushBest('best_value', 'Best Value Shoe', [...stats].filter(s => Number.isFinite(s.value) && s.miles >= 25).sort((a, b) => a.value - b.value)[0], p => `$${p.value.toFixed(2)}/mile`);
  pushBest('comeback_hero', 'Comeback Hero', [...stats].filter(s => s.comeback > 0).sort((a, b) => b.comeback - a.comeback)[0], p => `${p.comeback} return runs`);

  return awards.slice(0, 4);
}
