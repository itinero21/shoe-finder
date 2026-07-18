/**
 * ENGINE 1 — THE RUNNING GENOME
 *
 * A living profile of the runner, learned from real behavior — never asked.
 * Four dimensions, computed fresh from run history every time the closet
 * loads. Additive to the quiz profile (pronation, arch, injuries stay):
 *
 *   BODY DNA      — recovery speed, proven weekly capacity, issue rate
 *   TRAINING DNA  — long-run day, run rhythm, monthly volume, best month
 *   BEHAVIOR DNA  — shoe buying cadence, rotation overuse, consistency
 *   SHOE DNA      — learned mechanical preferences (via personalization)
 *
 * Every insight requires enough data to be honest; thin data → no claim.
 */
import { Run, RunIssue } from '../types/run';
import { LivingShoe, ShoeMemorial } from '../types/character';

export type GenomeDimension = 'body' | 'training' | 'behavior' | 'shoe';

export interface GenomeInsight {
  dimension: GenomeDimension;
  label: string;
  value: string;
  detail: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const HARD_PURPOSES = new Set(['long', 'tempo', 'speed', 'race']);

function daysBetween(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86400000;
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
}

// ── BODY DNA ────────────────────────────────────────────────────────────────

function bodyDNA(runs: Run[]): GenomeInsight[] {
  const out: GenomeInsight[] = [];
  const sorted = [...runs].sort((a, b) => a.date.localeCompare(b.date));

  // Recovery speed: how long after a hard run until the next run
  const gaps: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (HARD_PURPOSES.has(sorted[i]!.purpose ?? '')) {
      gaps.push(daysBetween(sorted[i]!.date, sorted[i + 1]!.date));
    }
  }
  if (gaps.length >= 3) {
    const m = median(gaps);
    out.push({
      dimension: 'body',
      label: 'RECOVERY SPEED',
      value: m <= 1.5 ? 'FAST' : m <= 2.5 ? 'NORMAL' : 'DELIBERATE',
      detail: `You typically run again ${m <= 1 ? 'the next day' : `${m.toFixed(1)} days`} after a hard effort.`,
    });
  }

  // Proven weekly capacity: best 7-day volume that produced no bad feedback
  if (sorted.length >= 8) {
    let best = 0;
    for (const r of sorted) {
      const windowRuns = sorted.filter(x =>
        new Date(x.date) >= new Date(r.date) &&
        daysBetween(r.date, x.date) <= 7);
      const km = windowRuns.reduce((s, x) => s + x.distanceKm, 0);
      const rough = windowRuns.some(x => (x.feel5 != null && x.feel5 <= 2) || x.feel === 1);
      if (!rough && km > best) best = km;
    }
    if (best >= 10) {
      out.push({
        dimension: 'body',
        label: 'PROVEN WEEKLY CAPACITY',
        value: `${Math.round(best)} KM`,
        detail: 'Your highest 7-day volume with zero rough-feeling runs.',
      });
    }
  }

  // Fatigue response: how runs feel on the 3rd+ consecutive day
  const byDate = new Map(sorted.map(r => [r.date.slice(0, 10), r]));
  const streakFeels: number[] = [];
  const restedFeels: number[] = [];
  for (const r of sorted) {
    const f = r.feel5 ?? (r.feel === 3 ? 5 : r.feel === 2 ? 3 : r.feel === 1 ? 2 : undefined);
    if (f == null) continue;
    const d = new Date(r.date);
    const prev1 = new Date(d.getTime() - 86400000).toISOString().slice(0, 10);
    const prev2 = new Date(d.getTime() - 2 * 86400000).toISOString().slice(0, 10);
    if (byDate.has(prev1) && byDate.has(prev2)) streakFeels.push(f);
    else restedFeels.push(f);
  }
  if (streakFeels.length >= 3 && restedFeels.length >= 3) {
    const streakAvg = streakFeels.reduce((a, b) => a + b, 0) / streakFeels.length;
    const restedAvg = restedFeels.reduce((a, b) => a + b, 0) / restedFeels.length;
    const drop = restedAvg - streakAvg;
    out.push({
      dimension: 'body',
      label: 'FATIGUE RESPONSE',
      value: drop < 0.4 ? 'RESILIENT' : drop < 1 ? 'NORMAL' : 'REST-SENSITIVE',
      detail: drop < 0.4
        ? 'Back-to-back days barely dent how your runs feel.'
        : `Runs on a 3rd straight day rate ${drop.toFixed(1)} points lower — rest days pay you back.`,
    });
  }

  // Temperature response: comfort in warm months vs cold months (month proxy)
  const warm = (m: number) => m >= 5 && m <= 8;   // Jun–Sep
  const cold = (m: number) => m <= 1 || m === 11; // Dec–Feb
  const warmFeels: number[] = [];
  const coldFeels: number[] = [];
  for (const r of runs) {
    const f = r.feel5 ?? (r.feel === 3 ? 5 : r.feel === 2 ? 3 : r.feel === 1 ? 2 : undefined);
    if (f == null) continue;
    const m = new Date(r.date).getMonth();
    if (warm(m)) warmFeels.push(f);
    else if (cold(m)) coldFeels.push(f);
  }
  if (warmFeels.length >= 5 && coldFeels.length >= 5) {
    const wAvg = warmFeels.reduce((a, b) => a + b, 0) / warmFeels.length;
    const cAvg = coldFeels.reduce((a, b) => a + b, 0) / coldFeels.length;
    const diff = wAvg - cAvg;
    if (Math.abs(diff) >= 0.4) {
      out.push({
        dimension: 'body',
        label: 'TEMPERATURE RESPONSE',
        value: diff > 0 ? 'RUNS BETTER WARM' : 'RUNS BETTER COLD',
        detail: `Your runs rate ${Math.abs(diff).toFixed(1)} points higher in ${diff > 0 ? 'summer' : 'winter'} months.`,
      });
    }
  }

  // Issue susceptibility: reports per 100 km
  const totalKm = runs.reduce((s, r) => s + r.distanceKm, 0);
  const issueRuns = runs.filter(r => (r.issues?.length ?? 0) > 0 || r.feel === 1 || (r.feel5 != null && r.feel5 <= 2));
  if (totalKm >= 50 && runs.length >= 8) {
    const per100 = (issueRuns.length / totalKm) * 100;
    out.push({
      dimension: 'body',
      label: 'ISSUE RATE',
      value: per100 < 2 ? 'LOW' : per100 < 5 ? 'MODERATE' : 'ELEVATED',
      detail: `${issueRuns.length} runs with issues or low feel across ${Math.round(totalKm)} km.`,
    });
  }

  return out;
}

// ── TRAINING DNA ────────────────────────────────────────────────────────────

function trainingDNA(runs: Run[]): GenomeInsight[] {
  const out: GenomeInsight[] = [];
  if (runs.length < 6) return out;

  // Best long-run day: weekday where the longest runs happen
  const longThreshold = median(runs.map(r => r.distanceKm)) * 1.4;
  const longRuns = runs.filter(r => r.distanceKm >= Math.max(8, longThreshold));
  if (longRuns.length >= 3) {
    const byDay: Record<number, number> = {};
    for (const r of longRuns) {
      const d = new Date(r.date).getDay();
      byDay[d] = (byDay[d] ?? 0) + 1;
    }
    const [topDay, count] = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]!;
    if (count >= 2) {
      out.push({
        dimension: 'training',
        label: 'LONG-RUN DAY',
        value: DAY_NAMES[+topDay]!.toUpperCase(),
        detail: `${count} of your ${longRuns.length} longest runs land on ${DAY_NAMES[+topDay]}.`,
      });
    }
  }

  // Run rhythm: median days between runs
  const sorted = [...runs].sort((a, b) => a.date.localeCompare(b.date));
  const spacing: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) spacing.push(daysBetween(sorted[i]!.date, sorted[i + 1]!.date));
  if (spacing.length >= 5) {
    const m = median(spacing);
    out.push({
      dimension: 'training',
      label: 'RUN RHYTHM',
      value: m <= 1.2 ? 'NEAR-DAILY' : m <= 2.2 ? 'EVERY OTHER DAY' : `EVERY ${Math.round(m)} DAYS`,
      detail: `Median spacing between runs: ${m.toFixed(1)} days.`,
    });
  }

  // Hard-session spacing: how you naturally space intense work
  const hard = sorted.filter(r => HARD_PURPOSES.has(r.purpose ?? ''));
  if (hard.length >= 4) {
    const hardGaps: number[] = [];
    for (let i = 0; i < hard.length - 1; i++) hardGaps.push(daysBetween(hard[i]!.date, hard[i + 1]!.date));
    const m = median(hardGaps);
    out.push({
      dimension: 'training',
      label: 'HARD-SESSION SPACING',
      value: `EVERY ${Math.round(m)} DAYS`,
      detail: `You naturally leave ~${m.toFixed(1)} days between hard efforts.`,
    });
  }

  // Race prep style: volume in the 7 days before races vs your normal week
  const races = sorted.filter(r => r.purpose === 'race');
  if (races.length >= 2 && sorted.length >= 15) {
    const weeklyAvg = sorted.reduce((s, r) => s + r.distanceKm, 0) /
      Math.max(1, daysBetween(sorted[0]!.date, sorted[sorted.length - 1]!.date) / 7);
    const preRaceKms = races.map(race =>
      sorted.filter(r =>
        r.id !== race.id &&
        new Date(r.date) < new Date(race.date) &&
        daysBetween(r.date, race.date) <= 7
      ).reduce((s, r) => s + r.distanceKm, 0));
    const preAvg = preRaceKms.reduce((a, b) => a + b, 0) / preRaceKms.length;
    if (weeklyAvg > 5) {
      const ratio = preAvg / weeklyAvg;
      out.push({
        dimension: 'training',
        label: 'RACE PREP STYLE',
        value: ratio < 0.6 ? 'DEEP TAPER' : ratio < 0.9 ? 'LIGHT TAPER' : 'TRAINS THROUGH',
        detail: `Race weeks run at ${Math.round(ratio * 100)}% of your normal volume (${races.length} races).`,
      });
    }
  }

  // Best month: highest-volume calendar month
  const byMonth: Record<number, number> = {};
  for (const r of runs) {
    const m = new Date(r.date).getMonth();
    byMonth[m] = (byMonth[m] ?? 0) + r.distanceKm;
  }
  const months = Object.entries(byMonth);
  if (months.length >= 3) {
    const [topMonth, km] = months.sort((a, b) => b[1] - a[1])[0]!;
    out.push({
      dimension: 'training',
      label: 'PEAK MONTH',
      value: MONTH_NAMES[+topMonth]!.toUpperCase(),
      detail: `${Math.round(km)} km — your biggest month on record.`,
    });
  }

  return out;
}

// ── BEHAVIOR DNA ────────────────────────────────────────────────────────────

function behaviorDNA(runs: Run[], livingShoes: LivingShoe[], memorials: ShoeMemorial[]): GenomeInsight[] {
  const out: GenomeInsight[] = [];

  // Shoe buying cadence
  const acquisitionDates = [
    ...livingShoes.map(c => c.addedDate),
    ...memorials.map(m => m.birthDate),
  ].filter(Boolean).sort();
  if (acquisitionDates.length >= 3) {
    const gaps: number[] = [];
    for (let i = 0; i < acquisitionDates.length - 1; i++) {
      gaps.push(daysBetween(acquisitionDates[i]!, acquisitionDates[i + 1]!));
    }
    const months = median(gaps) / 30.4;
    if (months >= 0.5) {
      out.push({
        dimension: 'behavior',
        label: 'BUYING CADENCE',
        value: `EVERY ${months < 1.5 ? Math.round(months * 4) / 4 : Math.round(months)} MONTHS`,
        detail: `Based on ${acquisitionDates.length} shoes added over time.`,
      });
    }
  }

  // Rotation overuse: one shoe hogging recent mileage
  const active = livingShoes.filter(c => c.lifeStage !== 'departed');
  if (active.length >= 2) {
    const cutoff = Date.now() - 30 * 86400000;
    const recent = runs.filter(r => new Date(r.date).getTime() >= cutoff);
    const total = recent.reduce((s, r) => s + r.distanceKm, 0);
    if (total >= 20) {
      const byShoe: Record<string, number> = {};
      for (const r of recent) byShoe[r.shoeId] = (byShoe[r.shoeId] ?? 0) + r.distanceKm;
      const [topShoe, km] = Object.entries(byShoe).sort((a, b) => b[1] - a[1])[0]!;
      const share = km / total;
      if (share >= 0.6) {
        const char = active.find(c => c.shoeId === topShoe);
        out.push({
          dimension: 'behavior',
          label: 'ROTATION HABIT',
          value: 'ONE-SHOE HEAVY',
          detail: `${Math.round(share * 100)}% of the last 30 days went to one shoe${char ? '' : ''} — the rest of the rotation is idle.`,
        });
      } else {
        out.push({
          dimension: 'behavior',
          label: 'ROTATION HABIT',
          value: 'BALANCED',
          detail: `Top shoe carries ${Math.round(share * 100)}% of recent mileage — healthy spread.`,
        });
      }
    }
  }

  // Distance by temperature band: do cool months pull longer runs? (month proxy)
  const coolKm: number[] = [];
  const warmKm: number[] = [];
  for (const r of runs) {
    const m = new Date(r.date).getMonth();
    if (m >= 5 && m <= 8) warmKm.push(r.distanceKm);
    else if (m <= 2 || m >= 9) coolKm.push(r.distanceKm);
  }
  if (coolKm.length >= 6 && warmKm.length >= 6) {
    const coolAvg = coolKm.reduce((a, b) => a + b, 0) / coolKm.length;
    const warmAvg = warmKm.reduce((a, b) => a + b, 0) / warmKm.length;
    if (Math.abs(coolAvg - warmAvg) / Math.max(coolAvg, warmAvg) >= 0.2) {
      const cooler = coolAvg > warmAvg;
      out.push({
        dimension: 'behavior',
        label: 'DISTANCE PATTERN',
        value: cooler ? 'FARTHER WHEN COOL' : 'FARTHER WHEN WARM',
        detail: `Average run: ${coolAvg.toFixed(1)} km in cool months vs ${warmAvg.toFixed(1)} km in summer.`,
      });
    }
  }

  // Most consistent season: which quarter holds the most runs
  const bySeason: Record<string, number> = {};
  const seasonOf = (m: number) => (m <= 1 || m === 11 ? 'WINTER' : m <= 4 ? 'SPRING' : m <= 7 ? 'SUMMER' : 'FALL');
  for (const r of runs) {
    const sName = seasonOf(new Date(r.date).getMonth());
    bySeason[sName] = (bySeason[sName] ?? 0) + 1;
  }
  const seasons = Object.entries(bySeason);
  if (seasons.length >= 3 && runs.length >= 20) {
    const [topSeason, count] = seasons.sort((a, b) => b[1] - a[1])[0]!;
    if (count / runs.length >= 0.35) {
      out.push({
        dimension: 'behavior',
        label: 'MOST CONSISTENT SEASON',
        value: topSeason,
        detail: `${Math.round((count / runs.length) * 100)}% of your runs happen in ${topSeason.toLowerCase()}.`,
      });
    }
  }

  // Comeback pattern: gaps ≥ 10 days and how often they happen
  const sorted = [...runs].sort((a, b) => a.date.localeCompare(b.date));
  let breaks = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (daysBetween(sorted[i]!.date, sorted[i + 1]!.date) >= 10) breaks++;
  }
  if (sorted.length >= 15) {
    out.push({
      dimension: 'behavior',
      label: 'CONSISTENCY',
      value: breaks === 0 ? 'UNBROKEN' : breaks <= 2 ? 'STEADY' : 'STREAKY',
      detail: breaks === 0
        ? 'No gap longer than 10 days in your entire history.'
        : `${breaks} break${breaks > 1 ? 's' : ''} of 10+ days — you always come back.`,
    });
  }

  return out;
}

// ── SHOE DNA (readable form of learned preferences) ─────────────────────────

export interface ShoeDNAReadable {
  label: string;
  value: string;
}

export function describeShoeDNA(prefs: {
  softness?: number; dropMm?: number; rocker?: number; stiffness?: number; toeBoxVolume?: number;
}): ShoeDNAReadable[] {
  const out: ShoeDNAReadable[] = [];
  if (prefs.softness != null) {
    out.push({ label: 'CUSHION', value: prefs.softness >= 65 ? 'PLUSH' : prefs.softness >= 45 ? 'BALANCED' : 'FIRM' });
  }
  if (prefs.dropMm != null) {
    out.push({ label: 'DROP', value: `~${Math.round(prefs.dropMm)}MM` });
  }
  if (prefs.rocker != null) {
    out.push({ label: 'ROCKER', value: prefs.rocker >= 65 ? 'AGGRESSIVE' : prefs.rocker >= 45 ? 'MODERATE' : 'FLAT' });
  }
  if (prefs.stiffness != null) {
    out.push({ label: 'FLEX', value: prefs.stiffness >= 65 ? 'STIFF/PLATED' : prefs.stiffness >= 45 ? 'MODERATE' : 'FLEXIBLE' });
  }
  if (prefs.toeBoxVolume != null) {
    out.push({ label: 'TOE BOX', value: prefs.toeBoxVolume >= 70 ? 'ROOMY' : 'STANDARD' });
  }
  return out;
}

// ── PUBLIC API ──────────────────────────────────────────────────────────────

export function buildRunningGenome(
  runs: Run[],
  livingShoes: LivingShoe[],
  memorials: ShoeMemorial[],
): GenomeInsight[] {
  return [
    ...bodyDNA(runs),
    ...trainingDNA(runs),
    ...behaviorDNA(runs, livingShoes, memorials),
  ];
}
