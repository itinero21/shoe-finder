/**
 * THE LIVING SHOE — Character Model
 * Every shoe is a character with personality, mood, life stages, and relationships.
 * The unit of the game is the SHOE, never the runner.
 */

// ── Archetypes (born from biomechanics, shaped by use) ──────────────────────

export type ShoeArchetype =
  | 'sprinter'    // carbon/super-shoe, high speed → aggressive, lives for race day
  | 'guardian'    // max-cushion daily trainer → calm, protective, reliable
  | 'wildcard'    // trail shoe, high grip → adventurous, unpredictable
  | 'veteran'     // high-mileage workhorse → wise, stoic, enduring
  | 'closer'      // lightweight tempo shoe → intense, focused, competitive
  ;

// ── Life Stages (progression is mortality, not levels) ──────────────────────

export type LifeStage =
  | 'fresh'       // 0–15%: eager, cocky, untested
  | 'prime'       // 15–50%: confident, reliable
  | 'veteran'     // 50–80%: seasoned, worn, knowing
  | 'twilight'    // 80–100%: reflective, poetic, aware the end is near
  | 'departed'    // retired: lives in the Graveyard, speaks in memories
  ;

// ── Mood (dynamic, recomputed daily + after each run) ───────────────────────

export type ShoeMood =
  | 'eager'       // fresh, ready to go
  | 'content'     // used often, good matches
  | 'proud'       // after a great run / PR
  | 'tired'       // used a lot recently
  | 'wistful'     // hasn't been used in a while
  | 'anxious'     // neglected, worried about being replaced
  | 'hurt'        // abused (wrong terrain/purpose)
  | 'weary'       // high wear, life running out
  | 'reflective'  // twilight stage, looking back
  ;

// ── Earned Nickname (one per shoe, emerges from behavior) ───────────────────

export type EarnedNickname =
  | 'The Workhorse'
  | 'The Survivor'
  | 'The Speed Demon'
  | 'The Rain Warrior'
  | 'The Marathoner'
  | 'The Faithful'
  | 'The Comeback Kid'
  | 'The Night Runner'
  | 'The Iron Horse'
  | null
  ;

// ── Moment (auto-detected milestone for the scrapbook) ──────────────────────

export interface ShoeMoment {
  type: 'first_run' | 'first_rain' | 'first_trail' | 'fastest_5k' | 'fastest_10k'
      | 'longest_run' | 'first_race' | 'milestone_100' | 'milestone_200'
      | 'milestone_500' | 'comeback' | 'final_run';
  date: string;           // ISO date
  distanceKm: number;
  caption: string;        // auto-generated caption
  runId?: string;         // reference to the run
}

// ── Relationship (pairwise sentiment between shoes) ─────────────────────────

export interface ShoeRelationship {
  otherShoeId: string;
  sentiment: number;      // -1.0 (resentful) to +1.0 (admiring)
  lastUpdated: string;    // ISO date
}

// ── The Living Shoe (central character entity) ──────────────────────────────

export interface LivingShoe {
  // Identity
  shoeId: string;         // references app/data/shoes.ts ID
  addedDate: string;      // ISO date when added to closet

  // Character
  archetype: ShoeArchetype;
  personalitySeed: number;          // 0-1 random seed for voice variation
  archetypeDrift: Partial<Record<ShoeArchetype, number>>; // drift weights from usage
  nickname: EarnedNickname;

  // State
  mood: ShoeMood;
  lifeStage: LifeStage;
  lifePct: number;                  // 0-100, miles_used / lifespan_miles * 100
  lifespanMiles: number;            // estimated total lifespan

  // Usage
  totalMiles: number;
  runCount: number;
  lastRunDate: string | null;
  daysSinceLastRun: number;

  // Relationships
  relationships: ShoeRelationship[];

  // Memory
  moments: ShoeMoment[];

  // Lineage
  ancestorId: string | null;        // shoe this one inherited from
  inheritedTrait: string | null;    // trait inherited from ancestor
  inheritedMemory: string | null;   // memory line from ancestor
  heirId: string | null;            // shoe that inherits from this one

  // Meta
  lastMoodUpdate: string;           // ISO date
  lastDialogueTrigger: string | null;

  // Economics
  purchasePrice: number | null;     // actual price user paid (not list price)
  decompressionHours: number;       // hours foam needs to recover after last run

  // Imported history (e.g. Strava gear mileage before STRIDE existed).
  // Counts toward totalMiles / life / cost-per-mile, but not run stats.
  importedBaselineMiles?: number;
}

// ── Dialogue Line ───────────────────────────────────────────────────────────

export type DialogueTrigger =
  | 'post_run'
  | 'stage_transition'
  | 'milestone'
  | 'daily_brief'
  | 'neglect'
  | 'twilight'
  | 'funeral'
  | 'race_day'
  | 'inter_shoe'
  | 'welcome'
  | 'first_run'
  ;

export interface DialogueLine {
  trigger: DialogueTrigger;
  text: string;
  shoeId: string;
  timestamp: string;
  mood: ShoeMood;
  archetype: ShoeArchetype;
  stage: LifeStage;
}

// ── Memorial / Departed Shoe ────────────────────────────────────────────────

export interface ShoeMemorial {
  shoeId: string;
  brand: string;
  model: string;
  nickname: EarnedNickname;
  archetype: ShoeArchetype;
  birthDate: string;       // when added
  deathDate: string;       // when retired
  totalMiles: number;
  runCount: number;
  lifespanDays: number;
  causeOfRetirement: string;
  favoriteRoute: string | null;
  racesRun: number;
  prsWitnessed: number;
  lastWords: string;       // final dialogue line
  biography: string;       // short bio in shoe's voice
  moments: ShoeMoment[];   // the scrapbook
  epitaph: string;         // user-written or auto
  rating: 1 | 2 | 3 | 4 | 5;
  wouldBuyAgain: boolean;
  heirId: string | null;
}
