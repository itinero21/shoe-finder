export interface GlossaryEntry {
  term: string;
  plain: string;
  deep: string;
  myth_buster: string;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  pronation: {
    term: 'Pronation',
    plain: 'The natural inward roll of your foot when it lands. Everyone pronates a little — it\'s how your foot absorbs shock.',
    deep: 'On a normal landing, the outer heel touches first, then the foot rolls inward about 15° before the toes push off. Too little is supination. Too much is overpronation.',
    myth_buster: '\'Overpronation\' is overdiagnosed. Many runners diagnosed as overpronators have neutral mechanics with inner-edge wear from push-off, not arch collapse.',
  },
  stack: {
    term: 'Stack Height',
    plain: 'How much foam is between your foot and the ground. Higher stack = more cushion, often more weight.',
    deep: 'Measured in mm at heel and forefoot. A 40/30mm stack means 40mm under heel, 30mm under forefoot. Max-cushion shoes run ~38-42mm; minimal shoes ~18-22mm.',
    myth_buster: 'Higher stack doesn\'t mean more comfortable for everyone. Some runners feel disconnected and unstable on tall stacks — it\'s personal.',
  },
  drop: {
    term: 'Heel-to-Toe Drop',
    plain: 'How much higher your heel sits than your toes inside the shoe.',
    deep: 'Traditional shoes are 10-12mm drop. Low drop is 4-6mm. Zero drop is 0mm (Altra, Topo). Higher drop unloads the calf and Achilles. Lower drop encourages forefoot landing.',
    myth_buster: 'Switching to zero drop too quickly is the #1 cause of Achilles injury in "natural running" converts. Transition over months, not days.',
  },
  medial_post: {
    term: 'Medial Post',
    plain: 'Extra firm material under the arch designed to stop the foot from rolling inward.',
    deep: 'Found in stability shoes. Modern alternatives (Brooks GuideRails, Hoka H-Frame, Saucony CenterPath) achieve similar effect through frame design rather than a hard wedge.',
    myth_buster: 'Stability shoes have been shown in RCTs to be no better at injury prevention than neutral shoes for most runners. Match the shoe to your foot, not to your fear.',
  },
  rocker: {
    term: 'Rocker',
    plain: 'The curved bottom of the shoe that helps you roll forward through your stride.',
    deep: 'Aggressive rocker (HOKA, Brooks Glycerin Max) reduces ankle work and helps people with plantar fasciitis, metatarsalgia, or stiff big toes. Subtle rocker is more neutral feeling.',
    myth_buster: 'Rocker doesn\'t make you faster — it shifts which muscles work. Some runners find aggressive rocker tiring or disorienting at first.',
  },
  carbon_plate: {
    term: 'Carbon Plate',
    plain: 'A stiff carbon fiber sheet inside the shoe that makes you roll forward more efficiently.',
    deep: 'Acts like a lever, reducing the work your calves and feet do at toe-off. Improved running economy by ~4% in studies. Most are capped at 40mm stack for World Athletics legal racing.',
    myth_buster: 'Carbon plates reduce fatigue, they don\'t add raw speed. For a 5K they may not help much — they shine in marathons where fatigue compounds.',
  },
  supercritical_foam: {
    term: 'Supercritical Foam',
    plain: 'Foam puffed up with gas under high pressure — lighter and bouncier than standard EVA.',
    deep: 'Includes PEBA (Nike ZoomX, Saucony PWRRUN PB), supercritical EVA (HOKA Skyflow), nitrogen-infused EVA (PUMA Nitro). Higher energy return, often less durable.',
    myth_buster: 'Supercritical foam wears out faster — sometimes in 200-300 miles. Don\'t put it in a daily trainer expecting 500+ miles.',
  },
  torsional_rigidity: {
    term: 'Torsional Rigidity',
    plain: 'How much the shoe resists twisting between heel and forefoot.',
    deep: 'Tested by holding heel and forefoot and twisting. Stiffer = more stable for flat feet. More flexible = better for high arches that need to articulate naturally on uneven terrain.',
    myth_buster: 'More rigid isn\'t always better. High-arch runners need flexibility for their foot to function correctly — over-stiffening can cause forefoot pain.',
  },
  heel_counter: {
    term: 'Heel Counter',
    plain: 'The cup at the back of the shoe that holds your heel firmly in place.',
    deep: 'Stiff heel counter = better support for plantar fasciitis and posterior tibial tendinopathy. Soft = more comfortable but less stable. Some minimalist shoes have no counter at all.',
    myth_buster: 'If your heel slips, the shoe is too big OR the counter is too soft for your foot. Try a different brand before sizing down.',
  },
  guidance_vs_stability: {
    term: 'Guidance vs Stability',
    plain: 'Guidance shoes gently nudge your foot on its natural path. Stability shoes use a firmer corrective wedge.',
    deep: 'Guidance (Brooks GuideRails, Hoka Arahi H-Frame) uses sidewalls and internal frames. Stability (ASICS Kayano, Mizuno Inspire) uses a medial post. Max-stability (Beast, Gaviota) is for severe flat-foot overpronation.',
    myth_buster: 'If a shoe expert hands you a stability shoe without seeing your gait or wear pattern, ask them why.',
  },
  energy_return: {
    term: 'Energy Return',
    plain: 'How much of the energy put into each step bounces back to propel you forward.',
    deep: 'Measured in % in lab settings. Premium PEBA foam returns ~85% of energy (vs ~65% for standard EVA). Translates to less fatigue per step, especially over marathon distances.',
    myth_buster: 'More energy return doesn\'t always feel better. Hyper-bouncy foam can feel unstable or unnatural to runners used to traditional cushion.',
  },
  wide_last: {
    term: 'Wide Last / Foot Width',
    plain: 'The mold the shoe is built around. A wide last creates more room, especially in the toe box.',
    deep: 'Standard width = D for men, B for women. Wide = 2E (men), D (women). Extra Wide = 4E (men), 2E (women). Trail shoes like Altra and Topo use naturally wider, foot-shaped lasts.',
    myth_buster: '95% of podiatrists rate width fit as critical for comfort — yet most running shops only stock standard width. Always ask.',
  },
};

export function getGlossaryEntry(key: string): GlossaryEntry | null {
  return GLOSSARY[key] ?? null;
}

export function getAllTerms(): GlossaryEntry[] {
  return Object.values(GLOSSARY);
}
