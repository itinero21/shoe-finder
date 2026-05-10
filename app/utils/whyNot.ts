/**
 * Why Not engine — explains every shoe rejection in plain English.
 * Surfaces the exact rule that fired and offers 3 alternatives.
 */

import { Shoe } from '../data/shoes';
import { QuizAnswers } from './scoring';
import { scoreShoe } from './scoring';

export interface WhyNotResult {
  headline: string;
  rule_explanation: string;
  biomech_detail: string;
  alternatives: { shoe: Shoe; reason: string }[];
}

export function explainShoe(shoe: Shoe, answers: QuizAnswers, allShoes: Shoe[]): WhyNotResult {
  const rules: { headline: string; rule: string; detail: string; triggered: boolean }[] = [];

  const b = shoe.biomech;
  const s = shoe.specs;
  const needsTrail = answers.terrain === 'trail_groomed' || answers.terrain === 'trail_technical';
  const isTrail = shoe.use_cases.some(u => u.startsWith('trail'));
  const isCarbon = shoe.category === 'carbon_racer';
  const firmness = b.cushioning_firmness;

  // ── Terrain mismatch ──────────────────────────────────────────────────────
  rules.push({
    headline: 'Wrong surface',
    rule: needsTrail
      ? 'You run on trails — this road shoe has no traction lug or rock plate for off-road terrain.'
      : 'You run on roads — this trail shoe\'s aggressive lugs feel harsh and wear fast on pavement.',
    detail: 'Trail shoes have rubber lug outsoles and rock plates for grip and foot protection on uneven terrain. Road shoes have smooth, continuous rubber optimised for flat, predictable pavement. Using one on the other surface shortens the shoe\'s life and reduces performance.',
    triggered: (needsTrail && !isTrail) || (!needsTrail && isTrail),
  });

  // ── Experience gate — carbon ───────────────────────────────────────────────
  rules.push({
    headline: 'Not for your experience level',
    rule: 'Carbon plate shoes require established running mechanics. For runners under 2 years, the plate amplifies any gait flaw and can increase Achilles and calf injury risk.',
    detail: 'The stiff lever action of a carbon plate reduces the natural articulation of the foot. Experienced runners have adapted tendons, strong calves, and ingrained mechanics that handle this. Beginners don\'t — and the adaptation takes months of gradual exposure at low drop, not weeks.',
    triggered: isCarbon && (answers.experience === 'beginner' || answers.experience === 'intermediate'),
  });

  // ── Zero/low drop — beginner ───────────────────────────────────────────────
  rules.push({
    headline: 'Drop too low for your experience',
    rule: `This shoe has ${s.drop_mm}mm drop. Switching to low drop too quickly is the #1 cause of Achilles and calf injuries in new runners.`,
    detail: 'Higher heel drop (8-12mm) reduces load on the Achilles tendon and calf musculature. Low drop (0-4mm) transfers that load to the calf and tendon. The calf complex needs months to adapt. Even experienced runners transitioning from 10mm to 0mm drop should do it over 3-6 months.',
    triggered: s.drop_mm <= 4 && (answers.experience === 'beginner' || answers.experience === 'intermediate'),
  });

  // ── Cushion preference mismatch ───────────────────────────────────────────
  rules.push({
    headline: 'Cushioning feel doesn\'t match your preference',
    rule: answers.comfort_pref === 'soft'
      ? `You prefer soft cushioning — this shoe rates ${firmness}/10 firmness (higher = firmer). It will feel harder than you want.`
      : answers.comfort_pref === 'firm'
      ? `You prefer firm, responsive cushioning — this shoe rates ${firmness}/10 firmness. It may feel mushy and disconnected.`
      : '',
    detail: 'Comfort preference is the strongest predictor of whether a shoe works for you (Nigg 2015 comfort filter theory). A mismatch between preferred and actual firmness leads to subconscious compensation in gait, increasing injury risk regardless of biomechanical "correctness."',
    triggered:
      (answers.comfort_pref === 'soft' && firmness >= 7) ||
      (answers.comfort_pref === 'firm' && firmness <= 3),
  });

  // ── Achilles risk — injury current ────────────────────────────────────────
  rules.push({
    headline: 'High Achilles risk for your current injury',
    rule: `You have Achilles pain — this shoe's ${s.drop_mm}mm drop keeps your tendon stretched throughout your stride, preventing recovery.`,
    detail: 'Achilles tendinopathy requires reduced tendon loading during the recovery phase. Shoes with 10-12mm drop lift the heel, shortening the tendon\'s range of motion and reducing eccentric load per step. Low-drop shoes do the opposite — they force the tendon into an elongated, high-stress position on every stride.',
    triggered: answers.injury_current.includes('achilles') && s.drop_mm <= 6,
  });

  // ── Plantar fasciitis risk ─────────────────────────────────────────────────
  rules.push({
    headline: 'Wrong setup for plantar fasciitis',
    rule: `You have plantar fasciitis — this shoe has low heel drop (${s.drop_mm}mm) and weak rocker geometry (${b.rocker}/10). It doesn\'t offload the fascia.`,
    detail: 'Plantar fasciitis responds to heel offloading (higher drop), rocker geometry (reduces lever arm on the plantar fascia), and a firm heel counter (reduces late-phase pronation strain on the insertion point). This shoe provides none of these.',
    triggered: answers.injury_current.includes('plantar') && s.drop_mm <= 5 && b.rocker <= 4,
  });

  // ── IT Band — stability shoe ──────────────────────────────────────────────
  rules.push({
    headline: 'Stability shoe conflicts with IT band recovery',
    rule: 'IT band syndrome is driven by lateral hip mechanics, not arch collapse. A medial post in this shoe redirects forces laterally — aggravating the exact tissue you\'re recovering.',
    detail: 'The IT band runs from the hip to the outer knee. Its syndrome is almost always related to hip abductor weakness or overstriding, not foot pronation. Stability shoes with medial posts increase medial support while potentially increasing lateral knee stress — the opposite of what IT band recovery needs.',
    triggered: answers.injury_current.includes('itband') && b.stability_level === 'motion_control',
  });

  // ── Foot width mismatch ───────────────────────────────────────────────────
  const wideWidths = ['wide', 'extra_wide', '2E', '4E', 'W', 'XW'];
  const hasWide = (shoe.specs.widths ?? []).some(w => wideWidths.includes(w));
  rules.push({
    headline: 'No wide option for your foot',
    rule: `You have wide feet — this shoe only comes in standard width. Narrow toe boxes cause black toenails, blisters, and Morton's neuroma on long runs.`,
    detail: '95% of sports medicine professionals and podiatrists rate width fit as a critical factor for long-run comfort. A shoe that\'s too narrow compresses the metatarsals and can cause nerve entrapment, increased blister risk, and altered gait mechanics as the runner avoids pain.',
    triggered: (answers.foot_width === 'wide' || answers.foot_width === 'extra_wide') && !hasWide,
  });

  // ── Arch + stability mismatch ─────────────────────────────────────────────
  rules.push({
    headline: 'Motion control is biomechanically backwards for high arches',
    rule: 'Your high arches don\'t pronate inward — they supinate outward. A medial post in this shoe pushes your foot further outward, increasing lateral ankle and IT band stress.',
    detail: 'Motion control shoes are engineered for severe overpronation — maximum inward rolling. High-arch runners typically under-pronate (roll outward). Forcing a medial wedge under an already-rigid, supinating foot is biomechanically counterproductive and can cause new problems.',
    triggered: answers.arch_type === 'high' && shoe.category === 'motion_control',
  });

  // ── Flat arch — neutral shoe ─────────────────────────────────────────────
  rules.push({
    headline: 'Flat feet need more structure than this neutral shoe provides',
    rule: 'You have flat arches — this neutral shoe has no stability features. Without torsional rigidity or guidance, your arch may collapse further on longer runs.',
    detail: 'Flexible flat feet pronate heavily under load because the arch lacks passive stiffness. A neutral shoe provides no corrective geometry. Guidance or stability shoes add torsional rigidity and frame support that compensates for what the arch itself can\'t provide.',
    triggered: answers.arch_type === 'flat' && b.stability_level === 'neutral' && b.torsional_rigidity <= 4,
  });

  // Find the first triggered rule
  const triggered = rules.filter(r => r.triggered);
  const primary = triggered[0];

  const headline = primary?.headline ?? 'Lower priority match';
  const rule_explanation = primary?.rule ?? 'This shoe scored lower against your profile than the top recommendations — not a bad shoe, just not the best fit for your specific combination of answers.';
  const biomech_detail = primary?.detail ?? `This shoe has: drop ${s.drop_mm}mm, cushion firmness ${firmness}/10, stability: ${b.stability_level}. Your top recommendations scored higher across cushion preference, injury profile, and terrain match.`;

  // Find 3 alternatives — better scoring shoes from same brand or category
  const scored = allShoes
    .filter(a => a.id !== shoe.id)
    .map(a => ({ shoe: a, score: scoreShoe(a, answers).score }))
    .filter(a => a.score > 0)
    .sort((a, b) => b.score - a.score);

  const sameBrand = scored.filter(a => a.shoe.brand === shoe.brand).slice(0, 2);
  const otherTop = scored.filter(a => a.shoe.brand !== shoe.brand).slice(0, 3 - sameBrand.length);
  const altPool = [...sameBrand, ...otherTop].slice(0, 3);

  const alternatives = altPool.map(({ shoe: alt }) => {
    const reasons: string[] = [];
    if (alt.brand === shoe.brand) reasons.push(`Same brand, better fit for your profile`);
    if (alt.biomech.stability_level !== shoe.biomech.stability_level) {
      reasons.push(`${alt.biomech.stability_level} stability vs ${shoe.biomech.stability_level}`);
    }
    if (Math.abs(alt.biomech.cushioning_firmness - firmness) > 2) {
      const dir = alt.biomech.cushioning_firmness < firmness ? 'softer' : 'firmer';
      reasons.push(`${dir} midsole — better cushion match`);
    }
    if (alt.specs.drop_mm !== s.drop_mm) {
      reasons.push(`${alt.specs.drop_mm}mm drop — safer for your injury profile`);
    }
    return { shoe: alt, reason: reasons[0] ?? 'Higher match score for your profile' };
  });

  return { headline, rule_explanation, biomech_detail, alternatives };
}
