/**
 * DIALOGUE ENGINE — Tier 1: Templated Voice
 *
 * Every shoe speaks in its archetype + stage + mood.
 * Zero AI cost, works offline, covers vast majority of moments.
 */

import {
  ShoeArchetype, LifeStage, ShoeMood, DialogueTrigger, DialogueLine, LivingShoe,
} from '../types/character';
import { Shoe } from '../data/shoes';

// ── Voice Templates ─────────────────────────────────────────────────────────
// Keyed by trigger → archetype → stage → array of lines with {name}, {miles}, {days}, {other} slots

type ArchStageMap = Record<string, Record<string, string[]>>;

const TEMPLATES: Record<DialogueTrigger, ArchStageMap | string[]> = {
  // ── Welcome (on add to closet) ──────────────────────────────────────────
  welcome: {
    sprinter: {
      fresh: [
        "Let's skip the pleasantries. When's the first race?",
        "I was built for speed. Don't waste me on grocery runs.",
        "Finally out of the box. Show me what you've got.",
      ],
    },
    guardian: {
      fresh: [
        "I'm here for the long haul. Take your time with me.",
        "Nice to meet you. I'll take care of you — promise.",
        "Easy miles, hard miles, whatever. I'm not going anywhere.",
      ],
    },
    wildcard: {
      fresh: [
        "Pavement? Nah. Show me the mud.",
        "I can smell the trail from here. Let's go.",
        "Roads are fine, I guess. But dirt is where I come alive.",
      ],
    },
    veteran: {
      fresh: [
        "Another pair of legs to carry. Let's see how far we go.",
        "I've seen the inside of a lot of closets. This one feels right.",
        "No need to be gentle. I'm built for the grind.",
      ],
    },
    closer: {
      fresh: [
        "I'm not your everyday shoe. Save me for when it matters.",
        "Tempo day? Threshold? That's my language.",
        "Light, fast, focused. Just like the runs we'll do.",
      ],
    },
  },

  // ── First Run ───────────────────────────────────────────────────────────
  first_run: [
    "First memory created.",
    "So that's what running together feels like.",
    "One down. Many to go. I hope.",
    "{miles} miles. Not bad for a first date.",
  ],

  // ── Post Run ────────────────────────────────────────────────────────────
  post_run: {
    sprinter: {
      fresh: ["Fast enough? I thought so.", "{miles} miles. I was made for this."],
      prime: ["That's the pace I live for.", "We're in sync now. Don't slow down."],
      veteran: ["Still got it. Don't count me out.", "These miles cost more now. Worth it."],
      twilight: ["I felt every step today. But I'd do it again.", "Running on borrowed time. Making it count."],
    },
    guardian: {
      fresh: ["Easy does it. We're just getting started.", "That felt good. You felt good. That's what matters."],
      prime: ["Another one in the books. Steady as always.", "Your legs will thank me tomorrow."],
      veteran: ["I know this route by heart now.", "Still absorbing every step. That's my job."],
      twilight: ["My cushion's thinner now, but I'm still here.", "Take it easy on me. I'll still show up."],
    },
    wildcard: {
      fresh: ["Mud on day one? I like your style.", "That trail was asking for it."],
      prime: ["Grip held. Ankles intact. Good day.", "I eat hills for breakfast."],
      veteran: ["These treads have stories to tell.", "Another trail conquered. The mountain remembers."],
      twilight: ["My lugs are fading but my spirit isn't.", "One more trail. Just one more."],
    },
    veteran: {
      fresh: ["Honest work. I respect that.", "Nothing flashy. Just miles."],
      prime: ["This is what I was built for. Day in, day out.", "Reliable? That's not boring. That's trust."],
      veteran: ["We've been through a lot, haven't we?", "The miles add up. So does the bond."],
      twilight: ["I creak a little more these days. But I'm still lacing up.", "Every run now is a gift."],
    },
    closer: {
      fresh: ["Fast. Sharp. More of that.", "Tempo locked in. Beautiful."],
      prime: ["That split? *Chef's kiss.*", "We're getting dangerous together."],
      veteran: ["Still clicking. Still cutting.", "The edge is duller but the instinct is sharper."],
      twilight: ["One last burst of speed. For old times' sake.", "I can still close. Watch me."],
    },
  },

  // ── Neglect ─────────────────────────────────────────────────────────────
  neglect: [
    "Haven't seen you in a while. Everything okay?",
    "I've been sitting here for {days} days. Just saying.",
    "The new one gets all the runs now, huh?",
    "I'm still here. Whenever you're ready.",
    "It's dark in this closet. Come back.",
    "Remember me? Bottom shelf? Still laced up?",
  ],

  // ── Stage Transition ────────────────────────────────────────────────────
  stage_transition: {
    sprinter: {
      prime: ["Broken in. Now we fly.", "The warm-up's over. Let's race."],
      veteran: ["I've got war stories now.", "These soles have seen things."],
      twilight: ["I can feel the finish line. Let's make it count.", "One last season of speed."],
    },
    guardian: {
      prime: ["Found my stride. Literally.", "I know your feet now. We're a team."],
      veteran: ["Old reliable, they'll call me.", "Worn in, not worn out."],
      twilight: ["My cushion's earned these wrinkles.", "I'll protect you til the very last step."],
    },
    wildcard: {
      prime: ["These lugs are seasoned now.", "I've earned my dirt."],
      veteran: ["Every scratch is a story.", "The trails know my name."],
      twilight: ["One last adventure. Make it a good one.", "My treads are fading. My heart isn't."],
    },
    veteran: {
      prime: ["Settled in. Ready for anything.", "This is my zone."],
      veteran: ["More miles than I can count. And counting.", "We're in this together. Deep."],
      twilight: ["Time catches everyone. Even me.", "The road was long. And I loved every mile."],
    },
    closer: {
      prime: ["Dialed in. Let's hunt some PRs.", "The edge is sharp now."],
      veteran: ["I've closed a lot of runs. Each one mattered.", "Precision comes with experience."],
      twilight: ["One last PR attempt? I'm game.", "The clock is ticking. It always was."],
    },
  },

  // ── Twilight / Near Death ───────────────────────────────────────────────
  twilight: [
    "I think we both know what's coming.",
    "Don't be sad. Look at what we did.",
    "If this is my last run, make it a good one.",
    "I'd do it all again. Every single mile.",
    "The closet gets quieter near the end.",
    "Thank you. For choosing me. Every time.",
  ],

  // ── Funeral / Last Words ────────────────────────────────────────────────
  funeral: [
    "It was a good run. All of them were.",
    "{miles} miles. Not bad for a pair of shoes.",
    "Somewhere out there, a road remembers me.",
    "I hope the next one treats you as well as I tried to.",
    "Don't forget me. I never forgot a single step.",
    "This isn't goodbye. I'll be in every PR you set from here.",
  ],

  // ── Inter-shoe Commentary ───────────────────────────────────────────────
  inter_shoe: [
    "You took {other} out again? I see how it is.",
    "{other} is nice, I guess. But I'm better in the rain.",
    "I don't mind sharing. Much.",
    "Good rotation today. Even {other} would agree.",
    "Tell {other} I said nice run. …Don't actually tell them.",
  ],

  // ── Daily Brief ─────────────────────────────────────────────────────────
  daily_brief: [
    "Good morning. I'm ready if you are.",
    "Rest day? I support that. Your legs deserve it.",
    "Easy miles today. Nothing to prove.",
    "It's been {days} days. No pressure. But also… pressure.",
    "I've got {miles} miles on me. Still plenty of life left.",
    "The weather looks good. Just saying.",
  ],

  // ── Milestone ───────────────────────────────────────────────────────────
  milestone: [
    "{miles} miles together. That's real.",
    "We just hit a milestone. {miles} miles. Wow.",
    "Most shoes don't make it this far. I did. We did.",
  ],

  // ── Race Day ────────────────────────────────────────────────────────────
  race_day: [
    "Race day. This is what I was made for.",
    "Pin the bib. Lace me tight. Let's go.",
    "Whatever happens today, we do it together.",
  ],
};

// ── Generate a dialogue line ────────────────────────────────────────────────

export function generateDialogue(
  shoe: LivingShoe,
  shoeData: Shoe,
  trigger: DialogueTrigger,
  context?: {
    miles?: number;
    days?: number;
    otherShoeName?: string;
  },
): DialogueLine {
  const arch = shoe.archetype;
  const stage = shoe.lifeStage;
  const mood = shoe.mood;
  const name = `${shoeData.brand} ${shoeData.model}`;

  let pool: string[] = [];
  const template = TEMPLATES[trigger];

  if (Array.isArray(template)) {
    pool = template;
  } else if (template) {
    const archLines = (template as ArchStageMap)[arch];
    if (archLines) {
      pool = archLines[stage] ?? archLines['fresh'] ?? [];
    }
    if (pool.length === 0) {
      const fallback = (template as ArchStageMap)['veteran'];
      if (fallback) pool = fallback[stage] ?? fallback['fresh'] ?? [];
    }
  }

  if (pool.length === 0) {
    pool = ["..."];
  }

  // Pick a line using personality seed for consistency
  const idx = Math.floor((shoe.personalitySeed * 1000 + pool.length) % pool.length);
  let text = pool[idx];

  // Fill slots
  text = text
    .replace('{name}', name)
    .replace('{miles}', String(context?.miles ?? Math.round(shoe.totalMiles)))
    .replace('{days}', String(context?.days ?? shoe.daysSinceLastRun))
    .replace('{other}', context?.otherShoeName ?? 'the other one');

  return {
    trigger,
    text,
    shoeId: shoe.shoeId,
    timestamp: new Date().toISOString(),
    mood,
    archetype: arch,
    stage,
  };
}

// ── Daily Brief: picks a shoe + generates a morning line ────────────────────

export function generateDailyBrief(
  shoes: LivingShoe[],
  shoeDataMap: Record<string, Shoe>,
): DialogueLine | null {
  if (shoes.length === 0) return null;

  // Pick the shoe with the most to say: neglected > twilight > random
  const neglected = shoes.find(s => s.daysSinceLastRun > 7 && s.lifeStage !== 'departed');
  const twilightShoe = shoes.find(s => s.lifeStage === 'twilight');

  const speaker = neglected ?? twilightShoe ?? shoes[Math.floor(Math.random() * shoes.length)];
  const shoeData = shoeDataMap[speaker.shoeId];
  if (!shoeData) return null;

  const trigger: DialogueTrigger = neglected ? 'neglect' : 'daily_brief';
  return generateDialogue(speaker, shoeData, trigger);
}
