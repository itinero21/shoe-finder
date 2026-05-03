// Generated from shoes database v4.0.0. Do not edit the JSON directly.

export interface ShoeSpecs {
  weight_oz: number;
  drop_mm: number;
  stack_heel_mm: number;
  stack_forefoot_mm: number;
  widths: string[];
}

export interface ShoeBiomech {
  stability_level: string;
  torsional_rigidity: number;
  heel_counter_rigidity: number;
  midsole_flexibility: number;
  cushioning_level: number;
  cushioning_firmness: number;
  energy_return: number;
  rocker: number;
  toe_box_width: number;
  upper_softness?: number;
  removable_insole?: boolean;
  midfoot_support?: boolean;
  wide_base?: boolean;
}

export interface Shoe {
  id: string;
  brand: string;
  model: string;
  year: number;
  release_date?: string;
  price_usd: number;
  category: string;
  use_cases: string[];
  specs: ShoeSpecs;
  biomech: ShoeBiomech;
  tech: string[];
  good_for_conditions: string[];
  avoid_for_conditions?: string[];
  summary: string;
}

export const SHOES: Shoe[] = [
  {
    "id": "brooks_ghost_18",
    "brand": "Brooks",
    "model": "Ghost 18",
    "year": 2026,
    "release_date": "2026-04-30",
    "price_usd": 150,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile",
      "walking"
    ],
    "specs": {
      "weight_oz": 10.2,
      "drop_mm": 10,
      "stack_heel_mm": 36,
      "stack_forefoot_mm": 26,
      "widths": [
        "narrow",
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 6,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 5,
      "rocker": 5,
      "toe_box_width": 6,
      "upper_softness": 8,
      "removable_insole": true,
      "midfoot_support": false,
      "wide_base": false
    },
    "tech": [
      "DNA LOFT v3 nitrogen-infused foam",
      "Triple jacquard mesh upper",
      "Flat-knit pillow tongue",
      "RoadTack rubber outsole",
      "Ortholite X-60 sockliner",
      "APMA Seal of Acceptance"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "underpronation",
      "knee_pain",
      "wide_feet",
      "narrow_feet"
    ],
    "avoid_for_conditions": [
      "flat_feet_rigid",
      "overpronation_severe"
    ],
    "summary": "Reliable neutral workhorse. 4 widths from narrow to 4E. Updated April 2026."
  },
  {
    "id": "brooks_ghost_max_3",
    "brand": "Brooks",
    "model": "Ghost Max 3",
    "year": 2026,
    "price_usd": 150,
    "category": "max_cushion_neutral",
    "use_cases": [
      "daily_easy",
      "long_run",
      "walking"
    ],
    "specs": {
      "weight_oz": 10.6,
      "drop_mm": 6,
      "stack_heel_mm": 39,
      "stack_forefoot_mm": 33,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 4,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 6,
      "rocker": 7,
      "toe_box_width": 7,
      "upper_softness": 7,
      "removable_insole": true,
      "midfoot_support": false,
      "wide_base": true
    },
    "tech": [
      "DNA LOFT v3",
      "Forefoot rocker",
      "Wide platform"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches",
      "knee_pain",
      "wide_feet",
      "metatarsalgia",
      "plantar_fasciitis"
    ],
    "avoid_for_conditions": [
      "overpronation_severe"
    ],
    "summary": "Max cushion neutral. 6mm drop. Rocker offloads heel and forefoot."
  },
  {
    "id": "brooks_ghost_trail",
    "brand": "Brooks",
    "model": "Ghost Trail",
    "year": 2026,
    "release_date": "2025-11",
    "price_usd": 150,
    "category": "trail_road_to_trail",
    "use_cases": [
      "trail_easy",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 10.4,
      "drop_mm": 10,
      "stack_heel_mm": 33,
      "stack_forefoot_mm": 23,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 5,
      "rocker": 5,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": true,
      "wide_base": false
    },
    "tech": [
      "DNA LOFT v3",
      "Trail-tuned outsole",
      "Available in GTX waterproof"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Ghost ride for light trails. Approachable trail debut.",
    "avoid_for_conditions": []
  },
  {
    "id": "brooks_glycerin_23",
    "brand": "Brooks",
    "model": "Glycerin 23",
    "year": 2026,
    "price_usd": 175,
    "category": "premium_neutral",
    "use_cases": [
      "daily_easy",
      "long_run"
    ],
    "specs": {
      "weight_oz": 10.6,
      "drop_mm": 6,
      "stack_heel_mm": 47,
      "stack_forefoot_mm": 41,
      "widths": [
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 7,
      "rocker": 6,
      "toe_box_width": 7,
      "upper_softness": 8,
      "removable_insole": true
    },
    "tech": [
      "DNA Tuned dual-density (large + small cell) midsole",
      "Plush engineered upper"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "underpronation",
      "high_arches",
      "wide_feet",
      "plantar_fasciitis"
    ],
    "summary": "Premium plush neutral. Up to 2E width. New DNA Tuned foam.",
    "avoid_for_conditions": []
  },
  {
    "id": "brooks_glycerin_flex",
    "brand": "Brooks",
    "model": "Glycerin Flex",
    "year": 2026,
    "release_date": "2026-02-01",
    "price_usd": 170,
    "category": "premium_neutral",
    "use_cases": [
      "daily_easy",
      "long_run",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 9.8,
      "drop_mm": 8,
      "stack_heel_mm": 38,
      "stack_forefoot_mm": 30,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 4,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 8,
      "cushioning_level": 8,
      "cushioning_firmness": 4,
      "energy_return": 7,
      "rocker": 5,
      "toe_box_width": 6,
      "upper_softness": 7,
      "removable_insole": true
    },
    "tech": [
      "DNA Tuned with large flex grooves",
      "Engineered upper"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches",
      "underpronation"
    ],
    "avoid_for_conditions": [
      "flat_feet_flexible",
      "flat_feet_rigid"
    ],
    "summary": "Glycerin with deep flex grooves for natural foot articulation."
  },
  {
    "id": "brooks_glycerin_gts_23",
    "brand": "Brooks",
    "model": "Glycerin GTS 23",
    "year": 2026,
    "price_usd": 180,
    "category": "stability_premium",
    "use_cases": [
      "daily_easy",
      "long_run"
    ],
    "specs": {
      "weight_oz": 10.7,
      "drop_mm": 6,
      "stack_heel_mm": 47,
      "stack_forefoot_mm": 41,
      "widths": [
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "guidance",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 5,
      "cushioning_level": 9,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 6,
      "toe_box_width": 7,
      "upper_softness": 7,
      "removable_insole": true,
      "midfoot_support": true,
      "wide_base": true
    },
    "tech": [
      "DNA Tuned",
      "GuideRails holistic support",
      "Plush upper"
    ],
    "good_for_conditions": [
      "flat_feet_flexible",
      "overpronation_mild",
      "plantar_fasciitis",
      "wide_feet",
      "heavy_runner"
    ],
    "avoid_for_conditions": [
      "high_arches",
      "underpronation"
    ],
    "summary": "Top-of-line stability. Glycerin cushion + GuideRails. 4 widths to 4E."
  },
  {
    "id": "brooks_glycerin_max_2",
    "brand": "Brooks",
    "model": "Glycerin Max 2",
    "year": 2026,
    "price_usd": 200,
    "category": "max_cushion_premium",
    "use_cases": [
      "daily_easy",
      "long_run",
      "walking"
    ],
    "specs": {
      "weight_oz": 10.9,
      "drop_mm": 6,
      "stack_heel_mm": 45,
      "stack_forefoot_mm": 39,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 3,
      "cushioning_level": 10,
      "cushioning_firmness": 4,
      "energy_return": 7,
      "rocker": 8,
      "toe_box_width": 7,
      "upper_softness": 8,
      "removable_insole": true,
      "wide_base": true
    },
    "tech": [
      "DNA Tuned PEBA blend",
      "Aggressive forefoot rocker",
      "Orthotic-friendly"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches",
      "knee_pain",
      "metatarsalgia",
      "orthotic_user",
      "plantar_fasciitis",
      "stress_fracture_history"
    ],
    "summary": "Max-stack premium cushion. Recovery and ortho-friendly.",
    "avoid_for_conditions": []
  },
  {
    "id": "brooks_adrenaline_gts_25",
    "brand": "Brooks",
    "model": "Adrenaline GTS 25",
    "year": 2026,
    "price_usd": 140,
    "category": "stability_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile",
      "walking"
    ],
    "specs": {
      "weight_oz": 10.2,
      "drop_mm": 12,
      "stack_heel_mm": 35,
      "stack_forefoot_mm": 23,
      "widths": [
        "narrow",
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "guidance",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 5,
      "toe_box_width": 6,
      "upper_softness": 7,
      "removable_insole": true,
      "midfoot_support": true,
      "wide_base": true
    },
    "tech": [
      "GuideRails holistic support (no medial post)",
      "DNA LOFT v3",
      "Segmented Crash Pad"
    ],
    "good_for_conditions": [
      "flat_feet_flexible",
      "overpronation_mild",
      "plantar_fasciitis",
      "shin_splints",
      "knee_pain",
      "wide_feet",
      "achilles_tendinitis"
    ],
    "avoid_for_conditions": [
      "high_arches",
      "underpronation"
    ],
    "summary": "Industry-standard daily guidance. 4 widths."
  },
  {
    "id": "brooks_beast_gts_26",
    "brand": "Brooks",
    "model": "Beast GTS 26",
    "year": 2026,
    "release_date": "2026-04",
    "price_usd": 170,
    "category": "motion_control",
    "use_cases": [
      "daily_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 13,
      "drop_mm": 12,
      "stack_heel_mm": 38,
      "stack_forefoot_mm": 26,
      "widths": [
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "max_stability",
      "torsional_rigidity": 10,
      "heel_counter_rigidity": 10,
      "midsole_flexibility": 3,
      "cushioning_level": 7,
      "cushioning_firmness": 7,
      "energy_return": 4,
      "rocker": 4,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": true,
      "midfoot_support": true,
      "wide_base": true
    },
    "tech": [
      "Maximum GuideRails",
      "Wide stable base",
      "Orthotic-friendly",
      "Reinforced heel counter"
    ],
    "good_for_conditions": [
      "flat_feet_rigid",
      "overpronation_severe",
      "heavy_runner",
      "orthotic_user",
      "wide_feet"
    ],
    "avoid_for_conditions": [
      "high_arches",
      "underpronation",
      "narrow_feet"
    ],
    "summary": "Highest stability on market. Severe overpronators, rigid flat feet, heavier runners."
  },
  {
    "id": "brooks_ariel",
    "brand": "Brooks",
    "model": "Ariel GTS",
    "year": 2026,
    "price_usd": 170,
    "category": "motion_control",
    "use_cases": [
      "daily_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 11,
      "drop_mm": 12,
      "stack_heel_mm": 38,
      "stack_forefoot_mm": 26,
      "widths": [
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "max_stability",
      "torsional_rigidity": 10,
      "heel_counter_rigidity": 10,
      "midsole_flexibility": 3,
      "cushioning_level": 7,
      "cushioning_firmness": 7,
      "energy_return": 4,
      "rocker": 4,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": true,
      "midfoot_support": true,
      "wide_base": true
    },
    "tech": [
      "Women's Beast",
      "Maximum GuideRails",
      "Orthotic-friendly"
    ],
    "good_for_conditions": [
      "flat_feet_rigid",
      "overpronation_severe",
      "heavy_runner",
      "orthotic_user",
      "wide_feet"
    ],
    "avoid_for_conditions": [
      "high_arches",
      "underpronation",
      "narrow_feet"
    ],
    "summary": "Women's max-stability counterpart to Beast. Same tech, women-specific last."
  },
  {
    "id": "brooks_addiction_gts_16",
    "brand": "Brooks",
    "model": "Addiction GTS 16",
    "year": 2026,
    "price_usd": 140,
    "category": "motion_control",
    "use_cases": [
      "daily_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 12.4,
      "drop_mm": 12,
      "stack_heel_mm": 35,
      "stack_forefoot_mm": 23,
      "widths": [
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "max_stability",
      "torsional_rigidity": 9,
      "heel_counter_rigidity": 10,
      "midsole_flexibility": 3,
      "cushioning_level": 7,
      "cushioning_firmness": 7,
      "energy_return": 4,
      "rocker": 4,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": true,
      "midfoot_support": true,
      "wide_base": true
    },
    "tech": [
      "Extended Progressive Diagonal Rollbar",
      "BioMoGo DNA",
      "GuideRails"
    ],
    "good_for_conditions": [
      "flat_feet_rigid",
      "overpronation_severe",
      "heavy_runner",
      "orthotic_user",
      "wide_feet"
    ],
    "avoid_for_conditions": [
      "high_arches",
      "underpronation"
    ],
    "summary": "Max motion-control. The everyday walker/standing-occupations choice."
  },
  {
    "id": "brooks_launch_11",
    "brand": "Brooks",
    "model": "Launch 11",
    "year": 2026,
    "price_usd": 110,
    "category": "lightweight_daily",
    "use_cases": [
      "daily_versatile",
      "tempo",
      "race_5k_10k"
    ],
    "specs": {
      "weight_oz": 8.1,
      "drop_mm": 10,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 20,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 7,
      "cushioning_level": 5,
      "cushioning_firmness": 6,
      "energy_return": 6,
      "rocker": 5,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "BioMoGo DNA nitrogen-infused",
      "Lightweight engineered mesh"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Budget lightweight neutral. Versatile fast-day shoe.",
    "avoid_for_conditions": []
  },
  {
    "id": "brooks_hyperion_3",
    "brand": "Brooks",
    "model": "Hyperion 3",
    "year": 2026,
    "price_usd": 140,
    "category": "lightweight_daily",
    "use_cases": [
      "tempo",
      "intervals",
      "race_5k_10k"
    ],
    "specs": {
      "weight_oz": 7,
      "drop_mm": 8,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 22,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 6,
      "cushioning_level": 5,
      "cushioning_firmness": 6,
      "energy_return": 8,
      "rocker": 6,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "DNA Flash v2",
      "Lightweight upper",
      "Forefoot rubber pods"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Featherweight tempo and 5K/10K shoe.",
    "avoid_for_conditions": []
  },
  {
    "id": "brooks_hyperion_max_3",
    "brand": "Brooks",
    "model": "Hyperion Max 3",
    "year": 2026,
    "price_usd": 200,
    "category": "super_trainer",
    "use_cases": [
      "long_run",
      "tempo",
      "race_half",
      "race_marathon"
    ],
    "specs": {
      "weight_oz": 8.3,
      "drop_mm": 8,
      "stack_heel_mm": 45.6,
      "stack_forefoot_mm": 37.6,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 4,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 9,
      "rocker": 8,
      "toe_box_width": 6,
      "upper_softness": 7,
      "removable_insole": false
    },
    "tech": [
      "DNA Gold PEBA foam",
      "SpeedVault Nylon plate",
      "Lateral sole flare"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches"
    ],
    "summary": "Plate-assisted super trainer. Soft, bouncy, propulsive.",
    "avoid_for_conditions": []
  },
  {
    "id": "brooks_hyperion_elite_5",
    "brand": "Brooks",
    "model": "Hyperion Elite 5",
    "year": 2026,
    "price_usd": 250,
    "category": "carbon_racer",
    "use_cases": [
      "race_half",
      "race_marathon"
    ],
    "specs": {
      "weight_oz": 7.2,
      "drop_mm": 8,
      "stack_heel_mm": 39,
      "stack_forefoot_mm": 31,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 3,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 10,
      "rocker": 9,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "DNA Gold PEBA",
      "SpeedVault+ Race carbon-infused plate"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Brooks marathon racer. Lightweight, propulsive.",
    "avoid_for_conditions": []
  },
  {
    "id": "brooks_levitate_7",
    "brand": "Brooks",
    "model": "Levitate 7",
    "year": 2026,
    "price_usd": 150,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 10.4,
      "drop_mm": 8,
      "stack_heel_mm": 32,
      "stack_forefoot_mm": 24,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 6,
      "energy_return": 7,
      "rocker": 5,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "DNA Amp v2 (energy-focused)",
      "Arrow-Point outsole",
      "Fit Knit upper"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Energy-focused daily. Snappier feel than Ghost.",
    "avoid_for_conditions": []
  },
  {
    "id": "brooks_revel_8",
    "brand": "Brooks",
    "model": "Revel 8",
    "year": 2026,
    "price_usd": 90,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 9.4,
      "drop_mm": 10,
      "stack_heel_mm": 28,
      "stack_forefoot_mm": 18,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 6,
      "cushioning_level": 5,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 4,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "BioMoGo DNA",
      "Knit upper"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Budget neutral daily. Casual and entry-level.",
    "avoid_for_conditions": []
  },
  {
    "id": "brooks_trace_4",
    "brand": "Brooks",
    "model": "Trace 4",
    "year": 2026,
    "price_usd": 90,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 9.6,
      "drop_mm": 12,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 18,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 6,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 5,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "BioMoGo DNA",
      "Engineered air mesh"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "achilles_tendinitis"
    ],
    "summary": "Budget cushioned daily. 12mm drop helps Achilles.",
    "avoid_for_conditions": []
  },
  {
    "id": "brooks_anthem_7",
    "brand": "Brooks",
    "model": "Anthem 7",
    "year": 2026,
    "price_usd": 100,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 9.8,
      "drop_mm": 10,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 20,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 6,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 4,
      "toe_box_width": 5,
      "upper_softness": 7,
      "removable_insole": true
    },
    "tech": [
      "BioMoGo DNA",
      "Soft air mesh upper"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Affordable everyday neutral.",
    "avoid_for_conditions": []
  },
  {
    "id": "brooks_cascadia_20",
    "brand": "Brooks",
    "model": "Cascadia 20",
    "year": 2026,
    "release_date": "2026-03-01",
    "price_usd": 150,
    "category": "trail_neutral",
    "use_cases": [
      "trail_easy",
      "trail_technical"
    ],
    "specs": {
      "weight_oz": 10.5,
      "drop_mm": 8,
      "stack_heel_mm": 32,
      "stack_forefoot_mm": 24,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "guidance",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 4,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 5,
      "toe_box_width": 6,
      "upper_softness": 5,
      "removable_insole": true,
      "midfoot_support": true,
      "wide_base": true
    },
    "tech": [
      "TrailTack rubber outsole",
      "Trail Adapt System rock plate",
      "DNA LOFT",
      "Available in GTX"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "overpronation_mild",
      "wide_feet",
      "heavy_runner"
    ],
    "summary": "Versatile trail workhorse with mild stability.",
    "avoid_for_conditions": []
  },
  {
    "id": "brooks_caldera_8",
    "brand": "Brooks",
    "model": "Caldera 8",
    "year": 2026,
    "price_usd": 160,
    "category": "trail_max_cushion",
    "use_cases": [
      "trail_easy",
      "trail_ultra"
    ],
    "specs": {
      "weight_oz": 10.7,
      "drop_mm": 6,
      "stack_heel_mm": 39,
      "stack_forefoot_mm": 33,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 4,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 6,
      "rocker": 6,
      "toe_box_width": 7,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "DNA LOFT v3 nitrogen-infused",
      "TrailTack Green rubber"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches",
      "knee_pain"
    ],
    "summary": "Max-cushion trail for ultras.",
    "avoid_for_conditions": []
  },
  {
    "id": "brooks_catamount_4",
    "brand": "Brooks",
    "model": "Catamount 4",
    "year": 2026,
    "price_usd": 170,
    "category": "trail_performance",
    "use_cases": [
      "trail_easy",
      "trail_technical"
    ],
    "specs": {
      "weight_oz": 9.4,
      "drop_mm": 6,
      "stack_heel_mm": 31,
      "stack_forefoot_mm": 25,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 6,
      "cushioning_firmness": 5,
      "energy_return": 8,
      "rocker": 6,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "Nitrogen-infused DNA Flash v2",
      "SkyVault rock plate",
      "TrailTack Green"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Lightweight trail performance.",
    "avoid_for_conditions": []
  },
  {
    "id": "brooks_cascadia_elite",
    "brand": "Brooks",
    "model": "Cascadia Elite",
    "year": 2026,
    "price_usd": 220,
    "category": "trail_carbon_racer",
    "use_cases": [
      "trail_technical",
      "trail_ultra"
    ],
    "specs": {
      "weight_oz": 9.8,
      "drop_mm": 6,
      "stack_heel_mm": 35,
      "stack_forefoot_mm": 29,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 9,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 3,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 9,
      "rocker": 8,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "DNA Gold PEBA",
      "Carbon plate",
      "TrailTack Green"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Brooks carbon trail racer for technical ultras.",
    "avoid_for_conditions": []
  },
  {
    "id": "brooks_divide_5",
    "brand": "Brooks",
    "model": "Divide 5",
    "year": 2026,
    "price_usd": 110,
    "category": "trail_road_to_trail",
    "use_cases": [
      "trail_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 10.2,
      "drop_mm": 8,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 22,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 4,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "BioMoGo DNA",
      "TrailTack rubber"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "wide_feet"
    ],
    "summary": "Budget light-trail crossover.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_clifton_10",
    "brand": "HOKA",
    "model": "Clifton 10",
    "year": 2026,
    "price_usd": 150,
    "category": "max_cushion_neutral",
    "use_cases": [
      "daily_easy",
      "daily_versatile",
      "long_run",
      "walking"
    ],
    "specs": {
      "weight_oz": 8.7,
      "drop_mm": 8,
      "stack_heel_mm": 42,
      "stack_forefoot_mm": 34,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 4,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 6,
      "rocker": 8,
      "toe_box_width": 6,
      "upper_softness": 7,
      "removable_insole": true,
      "wide_base": true
    },
    "tech": [
      "Compression-molded EVA midsole",
      "Early-stage Meta-Rocker",
      "APMA Seal"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches",
      "knee_pain",
      "metatarsalgia",
      "plantar_fasciitis"
    ],
    "summary": "Lightweight max-cushion. Podiatrist favorite.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_clifton_10_gtx",
    "brand": "HOKA",
    "model": "Clifton 10 GTX",
    "year": 2026,
    "price_usd": 170,
    "category": "max_cushion_neutral",
    "use_cases": [
      "daily_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 9.4,
      "drop_mm": 8,
      "stack_heel_mm": 42,
      "stack_forefoot_mm": 34,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 4,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 6,
      "rocker": 8,
      "toe_box_width": 6,
      "upper_softness": 7,
      "removable_insole": true,
      "wide_base": true
    },
    "tech": [
      "Gore-Tex membrane",
      "CMEVA midsole",
      "Meta-Rocker"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "plantar_fasciitis",
      "knee_pain"
    ],
    "summary": "Waterproof Clifton for wet/winter.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_bondi_9",
    "brand": "HOKA",
    "model": "Bondi 9",
    "year": 2026,
    "price_usd": 175,
    "category": "max_cushion_premium",
    "use_cases": [
      "daily_easy",
      "long_run",
      "walking"
    ],
    "specs": {
      "weight_oz": 10.5,
      "drop_mm": 4,
      "stack_heel_mm": 42,
      "stack_forefoot_mm": 38,
      "widths": [
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 3,
      "cushioning_level": 10,
      "cushioning_firmness": 4,
      "energy_return": 5,
      "rocker": 8,
      "toe_box_width": 7,
      "upper_softness": 8,
      "removable_insole": true,
      "wide_base": true
    },
    "tech": [
      "Supercritical EVA",
      "Meta-Rocker",
      "Memory foam heel collar"
    ],
    "good_for_conditions": [
      "plantar_fasciitis",
      "high_arches",
      "wide_feet",
      "knee_pain",
      "metatarsalgia",
      "morton_neuroma"
    ],
    "avoid_for_conditions": [
      "achilles_tendinitis",
      "overpronation_severe"
    ],
    "summary": "Max cushion. Up to 4E. CAUTION: 4mm drop bad for Achilles."
  },
  {
    "id": "hoka_mach_7",
    "brand": "HOKA",
    "model": "Mach 7",
    "year": 2026,
    "release_date": "2026-03",
    "price_usd": 140,
    "category": "lightweight_daily",
    "use_cases": [
      "daily_versatile",
      "tempo",
      "long_run"
    ],
    "specs": {
      "weight_oz": 8.2,
      "drop_mm": 5,
      "stack_heel_mm": 35,
      "stack_forefoot_mm": 30,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 6,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 8,
      "rocker": 7,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "Supercritical EVA midsole",
      "Meta-Rocker"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "narrow_feet"
    ],
    "summary": "Lightweight versatile trainer. Tempo-capable.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_mach_x_3",
    "brand": "HOKA",
    "model": "Mach X 3",
    "year": 2026,
    "price_usd": 180,
    "category": "super_trainer",
    "use_cases": [
      "tempo",
      "long_run",
      "race_half"
    ],
    "specs": {
      "weight_oz": 8.7,
      "drop_mm": 5,
      "stack_heel_mm": 39,
      "stack_forefoot_mm": 34,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 4,
      "cushioning_level": 8,
      "cushioning_firmness": 4,
      "energy_return": 9,
      "rocker": 8,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": false
    },
    "tech": [
      "PEBA top + supercritical EVA base",
      "Pebax winged plate"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches"
    ],
    "summary": "Plate-assisted super-trainer. Tempo to half.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_skyflow",
    "brand": "HOKA",
    "model": "Skyflow",
    "year": 2026,
    "price_usd": 160,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile",
      "long_run"
    ],
    "specs": {
      "weight_oz": 9.6,
      "drop_mm": 5,
      "stack_heel_mm": 38,
      "stack_forefoot_mm": 33,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 4,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 8,
      "rocker": 8,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "Supercritical EVA",
      "Race-inspired geometry"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "narrow_feet",
      "high_arches"
    ],
    "summary": "Race geometry in daily trainer. Snug, narrow fit.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_rincon_4",
    "brand": "HOKA",
    "model": "Rincon 4",
    "year": 2026,
    "price_usd": 130,
    "category": "lightweight_daily",
    "use_cases": [
      "daily_versatile",
      "tempo",
      "race_5k_10k"
    ],
    "specs": {
      "weight_oz": 7.3,
      "drop_mm": 5,
      "stack_heel_mm": 33,
      "stack_forefoot_mm": 28,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 6,
      "cushioning_level": 6,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 7,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "EVA midsole",
      "Meta-Rocker"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Lightweight neutral. Budget fast-day shoe.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_kawana_2",
    "brand": "HOKA",
    "model": "Kawana 2",
    "year": 2026,
    "price_usd": 140,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "gym",
      "walking"
    ],
    "specs": {
      "weight_oz": 9,
      "drop_mm": 5,
      "stack_heel_mm": 33,
      "stack_forefoot_mm": 28,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 6,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 6,
      "rocker": 5,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": true,
      "wide_base": true
    },
    "tech": [
      "CMEVA midsole",
      "Wide stable base",
      "Hybrid road/gym design"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Daily/gym crossover trainer.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_solimar",
    "brand": "HOKA",
    "model": "Solimar",
    "year": 2026,
    "price_usd": 125,
    "category": "neutral_daily",
    "use_cases": [
      "gym",
      "daily_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 8.4,
      "drop_mm": 5,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 25,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 6,
      "cushioning_level": 5,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 4,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": true,
      "wide_base": true
    },
    "tech": [
      "CMEVA",
      "Stable platform for gym multi-direction"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Gym/movement crossover. Stable for lifting + light running.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_solimar_2",
    "brand": "HOKA",
    "model": "Solimar 2",
    "year": 2026,
    "price_usd": 130,
    "category": "neutral_daily",
    "use_cases": [
      "gym",
      "daily_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 8.4,
      "drop_mm": 5,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 25,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 6,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 4,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": true,
      "wide_base": true
    },
    "tech": [
      "Updated CMEVA",
      "Refined upper"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Updated Solimar gym-runner crossover.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_transport",
    "brand": "HOKA",
    "model": "Transport",
    "year": 2026,
    "price_usd": 150,
    "category": "neutral_daily",
    "use_cases": [
      "walking",
      "daily_easy"
    ],
    "specs": {
      "weight_oz": 10.6,
      "drop_mm": 5,
      "stack_heel_mm": 32,
      "stack_forefoot_mm": 27,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 5,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "CMEVA",
      "Vibram outsole",
      "Urban-ready upper"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Urban walking + light running.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_transport_2",
    "brand": "HOKA",
    "model": "Transport 2",
    "year": 2026,
    "release_date": "2026-05",
    "price_usd": 160,
    "category": "neutral_daily",
    "use_cases": [
      "walking",
      "daily_easy"
    ],
    "specs": {
      "weight_oz": 10.4,
      "drop_mm": 5,
      "stack_heel_mm": 32,
      "stack_forefoot_mm": 27,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 5,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "Updated CMEVA",
      "Vibram"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Updated urban transport. May 2026 release.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_transport_x",
    "brand": "HOKA",
    "model": "Transport X",
    "year": 2026,
    "price_usd": 200,
    "category": "super_trainer",
    "use_cases": [
      "walking",
      "daily_versatile",
      "tempo"
    ],
    "specs": {
      "weight_oz": 9.7,
      "drop_mm": 5,
      "stack_heel_mm": 38,
      "stack_forefoot_mm": 33,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 4,
      "cushioning_level": 8,
      "cushioning_firmness": 4,
      "energy_return": 8,
      "rocker": 8,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": false
    },
    "tech": [
      "Carbon plate",
      "Supercritical EVA",
      "Vibram XS Trek outsole"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Carbon-plated transport hybrid. Walk + run-fast all-day.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_arahi_8",
    "brand": "HOKA",
    "model": "Arahi 8",
    "year": 2026,
    "price_usd": 145,
    "category": "stability_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 9.3,
      "drop_mm": 5,
      "stack_heel_mm": 32,
      "stack_forefoot_mm": 27,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "guidance",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 6,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": true,
      "midfoot_support": true,
      "wide_base": true
    },
    "tech": [
      "H-Frame stability (no medial post)",
      "Compression EVA",
      "Meta-Rocker"
    ],
    "good_for_conditions": [
      "flat_feet_flexible",
      "overpronation_mild",
      "shin_splints"
    ],
    "summary": "Lightest premium guidance. H-Frame works without medial post.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_gaviota_6",
    "brand": "HOKA",
    "model": "Gaviota 6",
    "year": 2026,
    "release_date": "2026-01",
    "price_usd": 180,
    "category": "max_stability",
    "use_cases": [
      "daily_easy",
      "long_run",
      "walking"
    ],
    "specs": {
      "weight_oz": 11,
      "drop_mm": 6,
      "stack_heel_mm": 41,
      "stack_forefoot_mm": 35,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "max_stability",
      "torsional_rigidity": 9,
      "heel_counter_rigidity": 9,
      "midsole_flexibility": 3,
      "cushioning_level": 9,
      "cushioning_firmness": 5,
      "energy_return": 5,
      "rocker": 7,
      "toe_box_width": 7,
      "upper_softness": 7,
      "removable_insole": true,
      "midfoot_support": true,
      "wide_base": true
    },
    "tech": [
      "Updated H-Frame",
      "Meta-Rocker",
      "Max cushion"
    ],
    "good_for_conditions": [
      "flat_feet_rigid",
      "flat_feet_flexible",
      "overpronation_severe",
      "plantar_fasciitis",
      "heavy_runner",
      "orthotic_user"
    ],
    "avoid_for_conditions": [
      "high_arches",
      "underpronation"
    ],
    "summary": "Max-stability + max cushion. Severe overpronation with plush ride."
  },
  {
    "id": "hoka_rocket_x_3",
    "brand": "HOKA",
    "model": "Rocket X 3",
    "year": 2026,
    "price_usd": 250,
    "category": "carbon_racer",
    "use_cases": [
      "race_5k_10k",
      "race_half",
      "race_marathon"
    ],
    "specs": {
      "weight_oz": 7.5,
      "drop_mm": 5,
      "stack_heel_mm": 40,
      "stack_forefoot_mm": 35,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 3,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 10,
      "rocker": 9,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "PEBA midsole",
      "Carbon plate",
      "Aggressive rocker"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Stable carbon racer. Firmer than Cielo.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_cielo_x1_3",
    "brand": "HOKA",
    "model": "Cielo X1 3.0",
    "year": 2026,
    "release_date": "2026-02",
    "price_usd": 275,
    "category": "carbon_racer",
    "use_cases": [
      "race_5k_10k",
      "race_half",
      "race_marathon"
    ],
    "specs": {
      "weight_oz": 8.4,
      "drop_mm": 7,
      "stack_heel_mm": 45,
      "stack_forefoot_mm": 38,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 3,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 10,
      "rocker": 9,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "PEBA midsole",
      "Winged carbon plate",
      "Max stack racer"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches"
    ],
    "summary": "Premium max-stack carbon racer. Half-marathon PB candidate.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_skyward_x_2",
    "brand": "HOKA",
    "model": "Skyward X 2",
    "year": 2026,
    "release_date": "2026-05",
    "price_usd": 250,
    "category": "max_cushion_premium",
    "use_cases": [
      "daily_easy",
      "long_run"
    ],
    "specs": {
      "weight_oz": 11,
      "drop_mm": 5,
      "stack_heel_mm": 45.8,
      "stack_forefoot_mm": 40.8,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 3,
      "cushioning_level": 10,
      "cushioning_firmness": 4,
      "energy_return": 8,
      "rocker": 9,
      "toe_box_width": 6,
      "upper_softness": 7,
      "removable_insole": false,
      "wide_base": true
    },
    "tech": [
      "PEBA top",
      "Carbon fiber plate (redesigned 2026)",
      "Supercritical EVA base"
    ],
    "good_for_conditions": [
      "high_arches",
      "knee_pain",
      "plantar_fasciitis",
      "metatarsalgia",
      "stress_fracture_history"
    ],
    "summary": "Max-cushion + carbon plate. Plush but bouncy.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_speedgoat_7",
    "brand": "HOKA",
    "model": "Speedgoat 7",
    "year": 2026,
    "release_date": "2026-02",
    "price_usd": 160,
    "category": "trail_neutral",
    "use_cases": [
      "trail_easy",
      "trail_technical",
      "trail_ultra"
    ],
    "specs": {
      "weight_oz": 9.8,
      "drop_mm": 5,
      "stack_heel_mm": 39,
      "stack_forefoot_mm": 34,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 4,
      "cushioning_level": 8,
      "cushioning_firmness": 4,
      "energy_return": 7,
      "rocker": 7,
      "toe_box_width": 6,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "Supercritical EVA foam",
      "Vibram Megagrip outsole, 5mm lugs",
      "Meta-Rocker"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches"
    ],
    "summary": "Iconic technical trail. Bouncier supercritical foam in v7.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_challenger_8",
    "brand": "HOKA",
    "model": "Challenger 8",
    "year": 2026,
    "price_usd": 145,
    "category": "trail_road_to_trail",
    "use_cases": [
      "trail_easy",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 9.4,
      "drop_mm": 5,
      "stack_heel_mm": 34,
      "stack_forefoot_mm": 29,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 6,
      "rocker": 7,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "EVA midsole",
      "Multi-directional 4mm lugs",
      "Meta-Rocker"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Road-to-trail crossover.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_mafate_speed_5",
    "brand": "HOKA",
    "model": "Mafate Speed 5",
    "year": 2026,
    "price_usd": 195,
    "category": "trail_technical",
    "use_cases": [
      "trail_technical",
      "trail_ultra"
    ],
    "specs": {
      "weight_oz": 10.5,
      "drop_mm": 4,
      "stack_heel_mm": 38,
      "stack_forefoot_mm": 34,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 4,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 7,
      "toe_box_width": 6,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "PEBA + EVA dual-density",
      "Vibram Megagrip Litebase",
      "5mm lugs"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Premium technical trail racer.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_mafate_x",
    "brand": "HOKA",
    "model": "Mafate X",
    "year": 2026,
    "price_usd": 225,
    "category": "trail_carbon_racer",
    "use_cases": [
      "trail_technical",
      "trail_ultra"
    ],
    "specs": {
      "weight_oz": 10,
      "drop_mm": 5,
      "stack_heel_mm": 42,
      "stack_forefoot_mm": 37,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 9,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 3,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 9,
      "rocker": 8,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "PEBA midsole",
      "Carbon plate",
      "Vibram Megagrip Litebase"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches"
    ],
    "summary": "Max-cushion carbon trail. Ultra-distance speed.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_tecton_x_3",
    "brand": "HOKA",
    "model": "Tecton X 3",
    "year": 2026,
    "price_usd": 225,
    "category": "trail_carbon_racer",
    "use_cases": [
      "trail_technical",
      "trail_ultra"
    ],
    "specs": {
      "weight_oz": 9,
      "drop_mm": 5,
      "stack_heel_mm": 40,
      "stack_forefoot_mm": 35,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 9,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 3,
      "cushioning_level": 8,
      "cushioning_firmness": 4,
      "energy_return": 9,
      "rocker": 9,
      "toe_box_width": 6,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "PEBA midsole",
      "Parallel carbon fiber plates",
      "Vibram Megagrip Litebase"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Carbon-plated trail racer. Speed-focused for ultras.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_torrent_4",
    "brand": "HOKA",
    "model": "Torrent 4",
    "year": 2026,
    "price_usd": 140,
    "category": "trail_neutral",
    "use_cases": [
      "trail_technical",
      "trail_easy"
    ],
    "specs": {
      "weight_oz": 8,
      "drop_mm": 4,
      "stack_heel_mm": 25,
      "stack_forefoot_mm": 21,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 6,
      "cushioning_level": 5,
      "cushioning_firmness": 6,
      "energy_return": 6,
      "rocker": 5,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "ProFly midsole",
      "4mm multi-directional lugs"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Lightweight nimble trail.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_zinal_3",
    "brand": "HOKA",
    "model": "Zinal 3",
    "year": 2026,
    "release_date": "2026-04",
    "price_usd": 170,
    "category": "trail_neutral",
    "use_cases": [
      "trail_technical",
      "trail_easy"
    ],
    "specs": {
      "weight_oz": 8.4,
      "drop_mm": 4,
      "stack_heel_mm": 27,
      "stack_forefoot_mm": 23,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 7,
      "rocker": 6,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "ProFly+ midsole",
      "Vibram Megagrip"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Race-day trail shoe. Lightweight + nimble.",
    "avoid_for_conditions": []
  },
  {
    "id": "hoka_stinson_8",
    "brand": "HOKA",
    "model": "Stinson 8",
    "year": 2026,
    "price_usd": 185,
    "category": "trail_max_cushion",
    "use_cases": [
      "trail_easy",
      "trail_ultra",
      "walking"
    ],
    "specs": {
      "weight_oz": 11.6,
      "drop_mm": 6,
      "stack_heel_mm": 42,
      "stack_forefoot_mm": 36,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 3,
      "cushioning_level": 10,
      "cushioning_firmness": 5,
      "energy_return": 6,
      "rocker": 7,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": true,
      "wide_base": true
    },
    "tech": [
      "EVA midsole",
      "Vibram Megagrip",
      "Wide platform"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "wide_feet",
      "heavy_runner",
      "plantar_fasciitis"
    ],
    "summary": "Max-cushion trail/hike for ultras.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_gel_nimbus_28",
    "brand": "ASICS",
    "model": "Gel-Nimbus 28",
    "year": 2026,
    "price_usd": 165,
    "category": "premium_neutral",
    "use_cases": [
      "daily_easy",
      "long_run",
      "walking"
    ],
    "specs": {
      "weight_oz": 10.8,
      "drop_mm": 8,
      "stack_heel_mm": 43,
      "stack_forefoot_mm": 35,
      "widths": [
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 4,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 6,
      "rocker": 6,
      "toe_box_width": 6,
      "upper_softness": 8,
      "removable_insole": true
    },
    "tech": [
      "PureGEL cushioning",
      "FF Blast Plus Eco foam",
      "Engineered jacquard mesh"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches",
      "underpronation",
      "wide_feet",
      "plantar_fasciitis",
      "knee_pain"
    ],
    "summary": "Plush max-cushion neutral. 4 widths. Long-run favorite.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_gel_cumulus_28",
    "brand": "ASICS",
    "model": "Gel-Cumulus 28",
    "year": 2026,
    "price_usd": 140,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile",
      "walking"
    ],
    "specs": {
      "weight_oz": 9.2,
      "drop_mm": 8,
      "stack_heel_mm": 38,
      "stack_forefoot_mm": 30,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 6,
      "rocker": 5,
      "toe_box_width": 5,
      "upper_softness": 7,
      "removable_insole": true
    },
    "tech": [
      "FF Blast Max foam",
      "PureGEL"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "underpronation"
    ],
    "summary": "Affordable balanced neutral. Excellent for supinators.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_gel_kayano_32",
    "brand": "ASICS",
    "model": "Gel-Kayano 32",
    "year": 2026,
    "price_usd": 165,
    "category": "stability_premium",
    "use_cases": [
      "daily_easy",
      "daily_versatile",
      "long_run"
    ],
    "specs": {
      "weight_oz": 10.7,
      "drop_mm": 10,
      "stack_heel_mm": 40,
      "stack_forefoot_mm": 30,
      "widths": [
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "stability",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 9,
      "midsole_flexibility": 4,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 6,
      "rocker": 6,
      "toe_box_width": 5,
      "upper_softness": 7,
      "removable_insole": true,
      "midfoot_support": true,
      "wide_base": true
    },
    "tech": [
      "4D Guidance System",
      "FF Blast+ ECO foam",
      "PureGEL",
      "OrthoLite X-55 sockliner"
    ],
    "good_for_conditions": [
      "flat_feet_flexible",
      "overpronation_mild",
      "overpronation_severe",
      "plantar_fasciitis",
      "shin_splints",
      "knee_pain",
      "wide_feet"
    ],
    "summary": "Gold-standard premium stability. 30+ year heritage.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_kayano_33",
    "brand": "ASICS",
    "model": "Gel-Kayano 33",
    "year": 2026,
    "release_date": "2026-Q2",
    "price_usd": 170,
    "category": "stability_premium",
    "use_cases": [
      "daily_easy",
      "daily_versatile",
      "long_run"
    ],
    "specs": {
      "weight_oz": 10.5,
      "drop_mm": 10,
      "stack_heel_mm": 40,
      "stack_forefoot_mm": 30,
      "widths": [
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "stability",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 9,
      "midsole_flexibility": 4,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 6,
      "rocker": 6,
      "toe_box_width": 5,
      "upper_softness": 7,
      "removable_insole": true,
      "midfoot_support": true,
      "wide_base": true
    },
    "tech": [
      "Updated 4D Guidance",
      "FF Blast+ ECO",
      "PureGEL"
    ],
    "good_for_conditions": [
      "flat_feet_flexible",
      "overpronation_mild",
      "overpronation_severe",
      "plantar_fasciitis",
      "shin_splints",
      "wide_feet"
    ],
    "summary": "Q2 2026 update to Kayano. Refined upper.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_gt_2000_14",
    "brand": "ASICS",
    "model": "GT-2000 14",
    "year": 2026,
    "release_date": "2025-09",
    "price_usd": 130,
    "category": "stability_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 9.7,
      "drop_mm": 8,
      "stack_heel_mm": 37,
      "stack_forefoot_mm": 29,
      "widths": [
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "guidance",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 5,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": true,
      "midfoot_support": true,
      "wide_base": true
    },
    "tech": [
      "3D Guidance System",
      "FF Blast Plus",
      "LITETRUSS support"
    ],
    "good_for_conditions": [
      "flat_feet_flexible",
      "overpronation_mild",
      "plantar_fasciitis",
      "shin_splints"
    ],
    "summary": "Affordable stability daily. Lighter than Kayano.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_gt_1000_14",
    "brand": "ASICS",
    "model": "GT-1000 14",
    "year": 2026,
    "price_usd": 100,
    "category": "stability_daily",
    "use_cases": [
      "daily_easy"
    ],
    "specs": {
      "weight_oz": 9.6,
      "drop_mm": 8,
      "stack_heel_mm": 32,
      "stack_forefoot_mm": 24,
      "widths": [
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "guidance",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 4,
      "rocker": 4,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": true,
      "midfoot_support": true
    },
    "tech": [
      "LITETRUSS",
      "FlyteFoam Blast"
    ],
    "good_for_conditions": [
      "flat_feet_flexible",
      "overpronation_mild"
    ],
    "summary": "Budget stability daily. Entry-level support.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_novablast_5",
    "brand": "ASICS",
    "model": "Novablast 5",
    "year": 2026,
    "price_usd": 140,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile",
      "tempo"
    ],
    "specs": {
      "weight_oz": 9,
      "drop_mm": 8,
      "stack_heel_mm": 41,
      "stack_forefoot_mm": 33,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 5,
      "cushioning_level": 8,
      "cushioning_firmness": 4,
      "energy_return": 8,
      "rocker": 7,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "FF Blast Plus Eco foam",
      "Trampoline-effect midsole geometry"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "underpronation"
    ],
    "summary": "Bouncy energetic daily. Great value.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_superblast_3",
    "brand": "ASICS",
    "model": "Superblast 3",
    "year": 2026,
    "release_date": "2026-03",
    "price_usd": 200,
    "category": "super_trainer",
    "use_cases": [
      "daily_versatile",
      "long_run",
      "tempo",
      "race_half"
    ],
    "specs": {
      "weight_oz": 8.2,
      "drop_mm": 8,
      "stack_heel_mm": 45.5,
      "stack_forefoot_mm": 37.5,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 4,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 9,
      "rocker": 8,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": false
    },
    "tech": [
      "FF Leap PEBA top",
      "FF Blast Plus base",
      "Plate-less",
      "Diamond-cut forefoot"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches"
    ],
    "summary": "Plate-less super-trainer. Cult favorite.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_megablast",
    "brand": "ASICS",
    "model": "Megablast",
    "year": 2026,
    "release_date": "2025-09",
    "price_usd": 225,
    "category": "super_trainer",
    "use_cases": [
      "daily_versatile",
      "tempo",
      "long_run",
      "race_half"
    ],
    "specs": {
      "weight_oz": 8.1,
      "drop_mm": 5,
      "stack_heel_mm": 45,
      "stack_forefoot_mm": 40,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 4,
      "cushioning_level": 10,
      "cushioning_firmness": 5,
      "energy_return": 10,
      "rocker": 8,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": false
    },
    "tech": [
      "FF Turbo Squared A-TPU foam",
      "Single-density supercritical"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches"
    ],
    "summary": "Outside Best Versatility 2026. Lightest+bounciest ASICS.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_sonicblast",
    "brand": "ASICS",
    "model": "Sonicblast",
    "year": 2026,
    "release_date": "2025-09",
    "price_usd": 180,
    "category": "super_trainer",
    "use_cases": [
      "tempo",
      "daily_versatile",
      "long_run"
    ],
    "specs": {
      "weight_oz": 8.5,
      "drop_mm": 6,
      "stack_heel_mm": 42,
      "stack_forefoot_mm": 36,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 4,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 9,
      "rocker": 8,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": false
    },
    "tech": [
      "FF Turbo Plus",
      "Plated super trainer",
      "Hybrid plate"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Plated super trainer. Tempo + weekly comfort.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_metaspeed_sky_tokyo",
    "brand": "ASICS",
    "model": "Metaspeed Sky Tokyo",
    "year": 2026,
    "release_date": "2025-07",
    "price_usd": 250,
    "category": "carbon_racer",
    "use_cases": [
      "race_half",
      "race_marathon"
    ],
    "specs": {
      "weight_oz": 6.5,
      "drop_mm": 5,
      "stack_heel_mm": 39.5,
      "stack_forefoot_mm": 34.5,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 3,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 10,
      "rocker": 9,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "FF Leap PEBA foam",
      "Carbon plate",
      "For longer-stride runners"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "ASICS marathon racer (long-stride). World-record proven.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_metaspeed_edge_tokyo",
    "brand": "ASICS",
    "model": "Metaspeed Edge Tokyo",
    "year": 2026,
    "release_date": "2025-07",
    "price_usd": 250,
    "category": "carbon_racer",
    "use_cases": [
      "race_half",
      "race_marathon"
    ],
    "specs": {
      "weight_oz": 6.5,
      "drop_mm": 5,
      "stack_heel_mm": 39.5,
      "stack_forefoot_mm": 34.5,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 3,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 10,
      "rocker": 9,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "FF Leap PEBA",
      "Carbon plate",
      "Scooped plate for higher-cadence runners"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "ASICS marathon racer (high-cadence). Edge tuned for cadence runners.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_metaspeed_ray",
    "brand": "ASICS",
    "model": "Metaspeed Ray",
    "year": 2026,
    "price_usd": 300,
    "category": "carbon_racer",
    "use_cases": [
      "race_5k_10k",
      "race_half"
    ],
    "specs": {
      "weight_oz": 4.8,
      "drop_mm": 5,
      "stack_heel_mm": 39,
      "stack_forefoot_mm": 34,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 4,
      "midsole_flexibility": 3,
      "cushioning_level": 8,
      "cushioning_firmness": 4,
      "energy_return": 10,
      "rocker": 9,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "FF Leap A-TPU foam",
      "Partial plate (no full carbon)",
      "Ultra-light upper"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Ultra-light experimental racer. Wild and bouncy.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_s4_yogiri",
    "brand": "ASICS",
    "model": "S4+ Yogiri",
    "year": 2026,
    "price_usd": 240,
    "category": "carbon_racer",
    "use_cases": [
      "race_marathon",
      "race_half"
    ],
    "specs": {
      "weight_oz": 7.5,
      "drop_mm": 5,
      "stack_heel_mm": 40,
      "stack_forefoot_mm": 35,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 3,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 9,
      "rocker": 9,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "FF Turbo Plus",
      "Carbon plate",
      "Stabilized geometry"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Sub-4 marathon racer. Stabilized for everyday racers.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_magic_speed_5",
    "brand": "ASICS",
    "model": "Magic Speed 5",
    "year": 2026,
    "price_usd": 160,
    "category": "super_trainer",
    "use_cases": [
      "tempo",
      "race_5k_10k",
      "race_half"
    ],
    "specs": {
      "weight_oz": 7.8,
      "drop_mm": 7,
      "stack_heel_mm": 36,
      "stack_forefoot_mm": 29,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 4,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 9,
      "rocker": 8,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "FF Blast Plus",
      "Carbon plate",
      "ASICSGRIP outsole"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Budget carbon-plated tempo shoe.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_hyper_speed_4",
    "brand": "ASICS",
    "model": "Hyper Speed 4",
    "year": 2026,
    "price_usd": 100,
    "category": "lightweight_daily",
    "use_cases": [
      "tempo",
      "intervals",
      "race_5k_10k"
    ],
    "specs": {
      "weight_oz": 6.5,
      "drop_mm": 5,
      "stack_heel_mm": 24,
      "stack_forefoot_mm": 19,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 7,
      "cushioning_level": 4,
      "cushioning_firmness": 6,
      "energy_return": 7,
      "rocker": 5,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "FlyteFoam Blast",
      "Lightweight mesh"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Lightweight budget tempo flat.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_glideride_max_2",
    "brand": "ASICS",
    "model": "GlideRide Max 2",
    "year": 2026,
    "release_date": "2025-10",
    "price_usd": 170,
    "category": "max_cushion_neutral",
    "use_cases": [
      "daily_easy",
      "long_run"
    ],
    "specs": {
      "weight_oz": 10.5,
      "drop_mm": 6,
      "stack_heel_mm": 42,
      "stack_forefoot_mm": 36,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 3,
      "cushioning_level": 9,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 9,
      "toe_box_width": 6,
      "upper_softness": 7,
      "removable_insole": true
    },
    "tech": [
      "FF Blast Plus",
      "ASICSGRIP + AHAR Plus",
      "Aggressive forefoot rocker"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "metatarsalgia",
      "plantar_fasciitis",
      "knee_pain",
      "high_arches"
    ],
    "summary": "Rocker geometry + max cushion. Energy-saving long-run shoe.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_noosa_tri",
    "brand": "ASICS",
    "model": "Noosa Tri 16",
    "year": 2026,
    "price_usd": 140,
    "category": "lightweight_daily",
    "use_cases": [
      "tri",
      "race_5k_10k",
      "tempo"
    ],
    "specs": {
      "weight_oz": 8.4,
      "drop_mm": 5,
      "stack_heel_mm": 32,
      "stack_forefoot_mm": 27,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 6,
      "cushioning_level": 6,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 6,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "FlyteFoam Blast",
      "Quick-on tri tongue",
      "Drainage holes"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Triathlon shoe — quick on/off, drains water.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_gel_trabuco_13",
    "brand": "ASICS",
    "model": "GEL-Trabuco 13",
    "year": 2026,
    "price_usd": 150,
    "category": "trail_neutral",
    "use_cases": [
      "trail_easy",
      "trail_technical"
    ],
    "specs": {
      "weight_oz": 10.4,
      "drop_mm": 8,
      "stack_heel_mm": 32,
      "stack_forefoot_mm": 24,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "guidance",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 4,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 6,
      "rocker": 5,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": true,
      "midfoot_support": true
    },
    "tech": [
      "ASICSGRIP outsole",
      "FF Blast Plus",
      "Rock plate"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "overpronation_mild"
    ],
    "summary": "ASICS trail workhorse.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_trabuco_max_4",
    "brand": "ASICS",
    "model": "Trabuco Max 4",
    "year": 2026,
    "price_usd": 160,
    "category": "trail_max_cushion",
    "use_cases": [
      "trail_easy",
      "trail_ultra"
    ],
    "specs": {
      "weight_oz": 11,
      "drop_mm": 6,
      "stack_heel_mm": 40,
      "stack_forefoot_mm": 34,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 4,
      "cushioning_level": 9,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 7,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "ASICSGRIP",
      "FF Blast Plus",
      "Rocker geometry"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches",
      "heavy_runner"
    ],
    "summary": "Max-cushion trail for ultras and long days.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_metafuji_trail",
    "brand": "ASICS",
    "model": "METAFUJI Trail",
    "year": 2026,
    "price_usd": 250,
    "category": "trail_carbon_racer",
    "use_cases": [
      "trail_technical",
      "trail_ultra"
    ],
    "specs": {
      "weight_oz": 9.5,
      "drop_mm": 5,
      "stack_heel_mm": 39,
      "stack_forefoot_mm": 34,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 9,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 3,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 9,
      "rocker": 8,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "FF Turbo Plus",
      "Carbon plate",
      "ASICSGRIP"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "ASICS premier carbon trail racer.",
    "avoid_for_conditions": []
  },
  {
    "id": "asics_fuji_lite_5",
    "brand": "ASICS",
    "model": "Fuji Lite 5",
    "year": 2026,
    "price_usd": 130,
    "category": "trail_road_to_trail",
    "use_cases": [
      "trail_easy",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 8.6,
      "drop_mm": 5,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 25,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 6,
      "cushioning_level": 6,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 5,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "FlyteFoam Blast",
      "ASICSGRIP",
      "Lightweight mesh"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Lightweight nimble trail/road crossover.",
    "avoid_for_conditions": []
  },
  {
    "id": "saucony_ride_19",
    "brand": "Saucony",
    "model": "Ride 19",
    "year": 2026,
    "price_usd": 145,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 9.4,
      "drop_mm": 8,
      "stack_heel_mm": 35,
      "stack_forefoot_mm": 27,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 6,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 6,
      "rocker": 5,
      "toe_box_width": 6,
      "upper_softness": 7,
      "removable_insole": true
    },
    "tech": [
      "PWRRUN+ midsole",
      "Smooth heel-to-toe transitions"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "underpronation"
    ],
    "summary": "Beginner-friendly neutral daily.",
    "avoid_for_conditions": []
  },
  {
    "id": "saucony_triumph_23",
    "brand": "Saucony",
    "model": "Triumph 23",
    "year": 2026,
    "price_usd": 160,
    "category": "max_cushion_premium",
    "use_cases": [
      "daily_easy",
      "long_run"
    ],
    "specs": {
      "weight_oz": 9.7,
      "drop_mm": 10,
      "stack_heel_mm": 42,
      "stack_forefoot_mm": 32,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 4,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 7,
      "rocker": 7,
      "toe_box_width": 6,
      "upper_softness": 7,
      "removable_insole": true,
      "wide_base": true
    },
    "tech": [
      "PWRRUN PB midsole",
      "Wide stable base",
      "Raised midsole sidewalls"
    ],
    "good_for_conditions": [
      "plantar_fasciitis",
      "neutral_arch",
      "high_arches",
      "knee_pain",
      "metatarsalgia",
      "wide_feet",
      "achilles_tendinitis"
    ],
    "summary": "Top PF pick. Stability without medial post.",
    "avoid_for_conditions": []
  },
  {
    "id": "saucony_endorphin_azura",
    "brand": "Saucony",
    "model": "Endorphin Azura",
    "year": 2026,
    "price_usd": 150,
    "category": "super_trainer",
    "use_cases": [
      "daily_versatile",
      "tempo",
      "long_run"
    ],
    "specs": {
      "weight_oz": 8.5,
      "drop_mm": 8,
      "stack_heel_mm": 40,
      "stack_forefoot_mm": 32,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 5,
      "cushioning_level": 8,
      "cushioning_firmness": 4,
      "energy_return": 9,
      "rocker": 7,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": false
    },
    "tech": [
      "PWRRUN PB (PEBA) midsole",
      "SpeedRoll geometry",
      "XT-900 outsole"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches"
    ],
    "summary": "Plate-less super-trainer at $150. Daily/tempo/long. Saucony's best-seller.",
    "avoid_for_conditions": []
  },
  {
    "id": "saucony_kinvara_16",
    "brand": "Saucony",
    "model": "Kinvara 16",
    "year": 2026,
    "price_usd": 130,
    "category": "lightweight_daily",
    "use_cases": [
      "tempo",
      "intervals",
      "race_5k_10k",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 7.3,
      "drop_mm": 4,
      "stack_heel_mm": 29,
      "stack_forefoot_mm": 25,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 7,
      "cushioning_level": 5,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 5,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "PWRRUN foam",
      "FormFit",
      "Lightweight upper"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Classic lightweight low-drop trainer. Ground feel + speed.",
    "avoid_for_conditions": []
  },
  {
    "id": "saucony_echelon_10",
    "brand": "Saucony",
    "model": "Echelon 10",
    "year": 2026,
    "price_usd": 140,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 10.5,
      "drop_mm": 8,
      "stack_heel_mm": 32,
      "stack_forefoot_mm": 24,
      "widths": [
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 5,
      "toe_box_width": 7,
      "upper_softness": 7,
      "removable_insole": true,
      "wide_base": true
    },
    "tech": [
      "PWRRUN foam",
      "Wide platform",
      "Generous interior volume"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "wide_feet",
      "orthotic_user",
      "plantar_fasciitis"
    ],
    "summary": "Orthotic-friendly daily. Generous volume for orthotics.",
    "avoid_for_conditions": []
  },
  {
    "id": "saucony_cohesion_17",
    "brand": "Saucony",
    "model": "Cohesion 17",
    "year": 2026,
    "price_usd": 75,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 10,
      "drop_mm": 12,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 18,
      "widths": [
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 5,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 4,
      "rocker": 4,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "VERSARUN cushioning"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "wide_feet"
    ],
    "summary": "Budget entry-level neutral. Sub-$80.",
    "avoid_for_conditions": []
  },
  {
    "id": "saucony_guide_19",
    "brand": "Saucony",
    "model": "Guide 19",
    "year": 2026,
    "price_usd": 145,
    "category": "stability_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 9.7,
      "drop_mm": 6,
      "stack_heel_mm": 35,
      "stack_forefoot_mm": 29,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "guidance",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 6,
      "rocker": 6,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": true,
      "midfoot_support": true
    },
    "tech": [
      "CenterPath technology",
      "PWRRUN midsole",
      "PWRRUN+ sockliner"
    ],
    "good_for_conditions": [
      "flat_feet_flexible",
      "overpronation_mild",
      "shin_splints"
    ],
    "summary": "Modern guidance — no medial post. CenterPath cradle.",
    "avoid_for_conditions": []
  },
  {
    "id": "saucony_guide_metro",
    "brand": "Saucony",
    "model": "Guide Metro",
    "year": 2026,
    "price_usd": 130,
    "category": "stability_daily",
    "use_cases": [
      "walking",
      "daily_easy"
    ],
    "specs": {
      "weight_oz": 10.2,
      "drop_mm": 8,
      "stack_heel_mm": 34,
      "stack_forefoot_mm": 26,
      "widths": [
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "guidance",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 5,
      "toe_box_width": 6,
      "upper_softness": 7,
      "removable_insole": true,
      "midfoot_support": true
    },
    "tech": [
      "PWRRUN",
      "Sneaker upper",
      "Casual styling"
    ],
    "good_for_conditions": [
      "flat_feet_flexible",
      "overpronation_mild",
      "wide_feet"
    ],
    "summary": "Casual stability for walking and standing.",
    "avoid_for_conditions": []
  },
  {
    "id": "saucony_tempus_2",
    "brand": "Saucony",
    "model": "Tempus 2",
    "year": 2026,
    "price_usd": 170,
    "category": "stability_lightweight",
    "use_cases": [
      "daily_versatile",
      "tempo",
      "long_run"
    ],
    "specs": {
      "weight_oz": 9.3,
      "drop_mm": 8,
      "stack_heel_mm": 35,
      "stack_forefoot_mm": 27,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "stability",
      "torsional_rigidity": 9,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 4,
      "cushioning_level": 8,
      "cushioning_firmness": 4,
      "energy_return": 9,
      "rocker": 7,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": true,
      "midfoot_support": true,
      "wide_base": true
    },
    "tech": [
      "PWRRUN PB core",
      "PWRRUN frame",
      "Wide base"
    ],
    "good_for_conditions": [
      "flat_feet_flexible",
      "overpronation_mild"
    ],
    "summary": "Top energy-return stability. PEBA + frame.",
    "avoid_for_conditions": []
  },
  {
    "id": "saucony_hurricane_25",
    "brand": "Saucony",
    "model": "Hurricane 25",
    "year": 2026,
    "price_usd": 165,
    "category": "max_stability",
    "use_cases": [
      "daily_easy",
      "long_run"
    ],
    "specs": {
      "weight_oz": 10.3,
      "drop_mm": 6,
      "stack_heel_mm": 40,
      "stack_forefoot_mm": 34,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "max_stability",
      "torsional_rigidity": 9,
      "heel_counter_rigidity": 9,
      "midsole_flexibility": 4,
      "cushioning_level": 9,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 7,
      "toe_box_width": 6,
      "upper_softness": 7,
      "removable_insole": true,
      "midfoot_support": true,
      "wide_base": true
    },
    "tech": [
      "PWRRUN PB midsole",
      "CenterPath stability",
      "Wide platform"
    ],
    "good_for_conditions": [
      "flat_feet_flexible",
      "flat_feet_rigid",
      "overpronation_severe",
      "plantar_fasciitis",
      "heavy_runner"
    ],
    "avoid_for_conditions": [
      "high_arches",
      "underpronation"
    ],
    "summary": "Cushioned max-stability. Top RunRepeat shock absorption."
  },
  {
    "id": "saucony_endorphin_speed_5",
    "brand": "Saucony",
    "model": "Endorphin Speed 5",
    "year": 2026,
    "price_usd": 170,
    "category": "super_trainer",
    "use_cases": [
      "tempo",
      "long_run",
      "race_half",
      "race_marathon"
    ],
    "specs": {
      "weight_oz": 7.9,
      "drop_mm": 8,
      "stack_heel_mm": 36,
      "stack_forefoot_mm": 28,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 4,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 9,
      "rocker": 8,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": false
    },
    "tech": [
      "PWRRUN PB midsole",
      "S-shaped Nylon plate",
      "Speedroll geometry"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Versatile nylon-plated trainer. Forgiving plate.",
    "avoid_for_conditions": []
  },
  {
    "id": "saucony_endorphin_pro_5",
    "brand": "Saucony",
    "model": "Endorphin Pro 5",
    "year": 2026,
    "price_usd": 225,
    "category": "carbon_racer",
    "use_cases": [
      "race_5k_10k",
      "race_half",
      "race_marathon"
    ],
    "specs": {
      "weight_oz": 7.6,
      "drop_mm": 8,
      "stack_heel_mm": 39.5,
      "stack_forefoot_mm": 31.5,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 3,
      "cushioning_level": 8,
      "cushioning_firmness": 4,
      "energy_return": 10,
      "rocker": 9,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "PWRRUN HG (PEBA) midsole",
      "Spoon-shaped carbon plate",
      "Speedroll"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Saucony's marathon racer. Stable for super shoe.",
    "avoid_for_conditions": []
  },
  {
    "id": "saucony_endorphin_elite_2",
    "brand": "Saucony",
    "model": "Endorphin Elite 2",
    "year": 2026,
    "price_usd": 275,
    "category": "carbon_racer",
    "use_cases": [
      "race_half",
      "race_marathon"
    ],
    "specs": {
      "weight_oz": 7.4,
      "drop_mm": 8,
      "stack_heel_mm": 39.5,
      "stack_forefoot_mm": 31.5,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 9,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 3,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 10,
      "rocker": 9,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "IncrediRUN supercritical foam",
      "Carbon plate",
      "Filled-in midfoot"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Saucony's flagship marathon weapon. Soft + stable.",
    "avoid_for_conditions": []
  },
  {
    "id": "saucony_endorphin_elite_3",
    "brand": "Saucony",
    "model": "Endorphin Elite 3",
    "year": 2026,
    "release_date": "2026-06",
    "price_usd": 290,
    "category": "carbon_racer",
    "use_cases": [
      "race_half",
      "race_marathon"
    ],
    "specs": {
      "weight_oz": 7.4,
      "drop_mm": 8,
      "stack_heel_mm": 39.5,
      "stack_forefoot_mm": 31.5,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 9,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 3,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 10,
      "rocker": 9,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "IncrediRUN",
      "Updated carbon plate",
      "Refined upper"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Q3 2026 update to Elite. Refined.",
    "avoid_for_conditions": []
  },
  {
    "id": "saucony_kinvara_pro",
    "brand": "Saucony",
    "model": "Kinvara Pro",
    "year": 2026,
    "price_usd": 180,
    "category": "super_trainer",
    "use_cases": [
      "daily_versatile",
      "tempo",
      "long_run"
    ],
    "specs": {
      "weight_oz": 9.7,
      "drop_mm": 8,
      "stack_heel_mm": 42,
      "stack_forefoot_mm": 34,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 4,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 9,
      "rocker": 8,
      "toe_box_width": 6,
      "upper_softness": 7,
      "removable_insole": false
    },
    "tech": [
      "PWRRUN PB top + EVA base",
      "Carbon plate"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches"
    ],
    "summary": "Cushioned super-trainer with carbon plate.",
    "avoid_for_conditions": []
  },
  {
    "id": "saucony_endorphin_trainer",
    "brand": "Saucony",
    "model": "Endorphin Trainer",
    "year": 2026,
    "price_usd": 155,
    "category": "super_trainer",
    "use_cases": [
      "long_run",
      "tempo",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 9.5,
      "drop_mm": 8,
      "stack_heel_mm": 40,
      "stack_forefoot_mm": 32,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 8,
      "rocker": 7,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "PWRRUN PB",
      "Plate-less",
      "Endorphin lineage"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches"
    ],
    "summary": "Cushioned daily plate-less Endorphin.",
    "avoid_for_conditions": []
  },
  {
    "id": "saucony_peregrine_16",
    "brand": "Saucony",
    "model": "Peregrine 16",
    "year": 2026,
    "price_usd": 140,
    "category": "trail_neutral",
    "use_cases": [
      "trail_easy",
      "trail_technical"
    ],
    "specs": {
      "weight_oz": 9.9,
      "drop_mm": 4,
      "stack_heel_mm": 28,
      "stack_forefoot_mm": 24,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 5,
      "toe_box_width": 6,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "Vibram Megagrip outsole",
      "5mm lugs",
      "Carbon fiber rock plate"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Versatile technical trail. Vibram update v16.",
    "avoid_for_conditions": []
  },
  {
    "id": "saucony_xodus_ultra_4",
    "brand": "Saucony",
    "model": "Xodus Ultra 4",
    "year": 2026,
    "price_usd": 160,
    "category": "trail_max_cushion",
    "use_cases": [
      "trail_easy",
      "trail_ultra"
    ],
    "specs": {
      "weight_oz": 11,
      "drop_mm": 6,
      "stack_heel_mm": 35,
      "stack_forefoot_mm": 29,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 4,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 6,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "PWRRUN PB",
      "PWRTRAC outsole",
      "Rock plate"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches"
    ],
    "summary": "Max-cushion trail ultra shoe.",
    "avoid_for_conditions": []
  },
  {
    "id": "nb_1080_v15",
    "brand": "New Balance",
    "model": "Fresh Foam X 1080v15",
    "year": 2026,
    "price_usd": 165,
    "category": "max_cushion_premium",
    "use_cases": [
      "daily_easy",
      "long_run",
      "walking"
    ],
    "specs": {
      "weight_oz": 9.6,
      "drop_mm": 6,
      "stack_heel_mm": 38,
      "stack_forefoot_mm": 32,
      "widths": [
        "narrow",
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 7,
      "rocker": 7,
      "toe_box_width": 7,
      "upper_softness": 8,
      "removable_insole": true,
      "wide_base": true
    },
    "tech": [
      "Fresh Foam X with Infinion (PEBA-blend)",
      "Engineered mesh upper"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches",
      "wide_feet",
      "narrow_feet",
      "plantar_fasciitis",
      "knee_pain"
    ],
    "summary": "Industry leader in width options (4 widths).",
    "avoid_for_conditions": []
  },
  {
    "id": "nb_880_v15",
    "brand": "New Balance",
    "model": "880v15",
    "year": 2026,
    "price_usd": 140,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile",
      "walking"
    ],
    "specs": {
      "weight_oz": 9.8,
      "drop_mm": 8,
      "stack_heel_mm": 34,
      "stack_forefoot_mm": 26,
      "widths": [
        "narrow",
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 6,
      "rocker": 5,
      "toe_box_width": 7,
      "upper_softness": 7,
      "removable_insole": true,
      "wide_base": true
    },
    "tech": [
      "Fresh Foam X",
      "Hypoknit upper"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "wide_feet",
      "narrow_feet"
    ],
    "summary": "Budget cushioned workhorse. 4 widths.",
    "avoid_for_conditions": []
  },
  {
    "id": "nb_more_v6",
    "brand": "New Balance",
    "model": "Fresh Foam X More v6",
    "year": 2026,
    "price_usd": 170,
    "category": "max_cushion_premium",
    "use_cases": [
      "daily_easy",
      "long_run",
      "walking"
    ],
    "specs": {
      "weight_oz": 10.4,
      "drop_mm": 4,
      "stack_heel_mm": 44,
      "stack_forefoot_mm": 40,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 3,
      "cushioning_level": 10,
      "cushioning_firmness": 4,
      "energy_return": 6,
      "rocker": 8,
      "toe_box_width": 6,
      "upper_softness": 7,
      "removable_insole": true,
      "wide_base": true
    },
    "tech": [
      "Fresh Foam X",
      "Maximum stack",
      "Smooth rocker"
    ],
    "good_for_conditions": [
      "high_arches",
      "knee_pain",
      "metatarsalgia",
      "plantar_fasciitis"
    ],
    "avoid_for_conditions": [
      "achilles_tendinitis"
    ],
    "summary": "Max-stack daily. Caution: 4mm drop."
  },
  {
    "id": "nb_ellipse",
    "brand": "New Balance",
    "model": "Ellipse",
    "year": 2026,
    "price_usd": 130,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 9.5,
      "drop_mm": 8,
      "stack_heel_mm": 34,
      "stack_forefoot_mm": 26,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 6,
      "rocker": 5,
      "toe_box_width": 6,
      "upper_softness": 7,
      "removable_insole": true
    },
    "tech": [
      "Fresh Foam X",
      "Lifestyle-forward design"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "New 2026 plush daily/lifestyle.",
    "avoid_for_conditions": []
  },
  {
    "id": "nb_arishi_v5",
    "brand": "New Balance",
    "model": "Fresh Foam Arishi v5",
    "year": 2026,
    "price_usd": 80,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 9.4,
      "drop_mm": 6,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 24,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 6,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 4,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "Fresh Foam",
      "Lightweight upper"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Budget entry-level neutral.",
    "avoid_for_conditions": []
  },
  {
    "id": "nb_680_v9",
    "brand": "New Balance",
    "model": "680v9",
    "year": 2026,
    "price_usd": 75,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 9.8,
      "drop_mm": 8,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 22,
      "widths": [
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 5,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 4,
      "rocker": 4,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "EVA cushioning",
      "Mesh upper"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "wide_feet"
    ],
    "summary": "Entry-level NB. Sub-$80.",
    "avoid_for_conditions": []
  },
  {
    "id": "nb_860_v15",
    "brand": "New Balance",
    "model": "860v15",
    "year": 2026,
    "release_date": "2026-04",
    "price_usd": 140,
    "category": "stability_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile",
      "walking"
    ],
    "specs": {
      "weight_oz": 11.1,
      "drop_mm": 10,
      "stack_heel_mm": 32,
      "stack_forefoot_mm": 22,
      "widths": [
        "narrow",
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "stability",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 4,
      "cushioning_level": 7,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 5,
      "toe_box_width": 7,
      "upper_softness": 7,
      "removable_insole": true,
      "midfoot_support": true,
      "wide_base": true
    },
    "tech": [
      "Stability Plane (no traditional medial post)",
      "Fresh Foam X",
      "Rocker profile"
    ],
    "good_for_conditions": [
      "flat_feet_flexible",
      "overpronation_mild",
      "wide_feet",
      "plantar_fasciitis",
      "achilles_tendinitis"
    ],
    "summary": "Modern stability. 4 widths. April 2026 update.",
    "avoid_for_conditions": []
  },
  {
    "id": "nb_1540_v4",
    "brand": "New Balance",
    "model": "1540v4",
    "year": 2026,
    "price_usd": 175,
    "category": "motion_control",
    "use_cases": [
      "daily_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 12.5,
      "drop_mm": 12,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 18,
      "widths": [
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "max_stability",
      "torsional_rigidity": 10,
      "heel_counter_rigidity": 10,
      "midsole_flexibility": 2,
      "cushioning_level": 6,
      "cushioning_firmness": 7,
      "energy_return": 3,
      "rocker": 3,
      "toe_box_width": 7,
      "upper_softness": 6,
      "removable_insole": true,
      "midfoot_support": true,
      "wide_base": true
    },
    "tech": [
      "Maximum support medial post",
      "Reinforced arch + heel"
    ],
    "good_for_conditions": [
      "flat_feet_rigid",
      "overpronation_severe",
      "heavy_runner",
      "orthotic_user",
      "wide_feet"
    ],
    "avoid_for_conditions": [
      "high_arches",
      "underpronation"
    ],
    "summary": "Max-stability orthotic-friendly. Pairs with custom orthotics."
  },
  {
    "id": "nb_rebel_v5",
    "brand": "New Balance",
    "model": "FuelCell Rebel v5",
    "year": 2026,
    "price_usd": 140,
    "category": "lightweight_daily",
    "use_cases": [
      "daily_versatile",
      "tempo",
      "race_5k_10k"
    ],
    "specs": {
      "weight_oz": 7.9,
      "drop_mm": 6,
      "stack_heel_mm": 31,
      "stack_forefoot_mm": 25,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 6,
      "cushioning_level": 6,
      "cushioning_firmness": 4,
      "energy_return": 9,
      "rocker": 7,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "FuelCell foam (PEBA)",
      "Lightweight upper"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Light bouncy versatile speed shoe.",
    "avoid_for_conditions": []
  },
  {
    "id": "nb_balos",
    "brand": "New Balance",
    "model": "Fresh Foam X Balos",
    "year": 2026,
    "price_usd": 170,
    "category": "super_trainer",
    "use_cases": [
      "daily_versatile",
      "tempo",
      "long_run"
    ],
    "specs": {
      "weight_oz": 9,
      "drop_mm": 6,
      "stack_heel_mm": 40,
      "stack_forefoot_mm": 34,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 4,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 9,
      "rocker": 8,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": false
    },
    "tech": [
      "Supercritical foam (PEBA + EVA)",
      "Plate-less",
      "Rocker geometry"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches"
    ],
    "summary": "New plate-less super-trainer. Bouncy with rocker.",
    "avoid_for_conditions": []
  },
  {
    "id": "nb_supercomp_trainer_v3",
    "brand": "New Balance",
    "model": "FuelCell SuperComp Trainer v3",
    "year": 2026,
    "price_usd": 180,
    "category": "super_trainer",
    "use_cases": [
      "long_run",
      "tempo",
      "race_half"
    ],
    "specs": {
      "weight_oz": 9.8,
      "drop_mm": 6,
      "stack_heel_mm": 42,
      "stack_forefoot_mm": 36,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 4,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 9,
      "rocker": 8,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": false
    },
    "tech": [
      "FuelCell PEBA",
      "Carbon plate",
      "Energy Arc"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches"
    ],
    "summary": "Carbon-plated super-trainer. Marathon prep.",
    "avoid_for_conditions": []
  },
  {
    "id": "nb_supercomp_elite_v5",
    "brand": "New Balance",
    "model": "FuelCell SuperComp Elite v5",
    "year": 2026,
    "price_usd": 250,
    "category": "carbon_racer",
    "use_cases": [
      "race_half",
      "race_marathon"
    ],
    "specs": {
      "weight_oz": 7.6,
      "drop_mm": 4,
      "stack_heel_mm": 40,
      "stack_forefoot_mm": 36,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 3,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 10,
      "rocker": 9,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "FuelCell PEBA foam",
      "Carbon Energy Arc plate"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "NB premium carbon racer.",
    "avoid_for_conditions": []
  },
  {
    "id": "nb_supercomp_pacer",
    "brand": "New Balance",
    "model": "FuelCell SuperComp Pacer",
    "year": 2026,
    "price_usd": 180,
    "category": "carbon_racer",
    "use_cases": [
      "race_5k_10k",
      "race_half",
      "intervals"
    ],
    "specs": {
      "weight_oz": 6.8,
      "drop_mm": 6,
      "stack_heel_mm": 33,
      "stack_forefoot_mm": 27,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 4,
      "cushioning_level": 6,
      "cushioning_firmness": 5,
      "energy_return": 9,
      "rocker": 8,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "FuelCell PEBA",
      "Carbon plate",
      "Lower-profile racer"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "5K-half marathon racer. Lower-profile carbon.",
    "avoid_for_conditions": []
  },
  {
    "id": "nb_hierro_v9",
    "brand": "New Balance",
    "model": "Fresh Foam X Hierro v9",
    "year": 2026,
    "price_usd": 145,
    "category": "trail_max_cushion",
    "use_cases": [
      "trail_easy",
      "trail_ultra"
    ],
    "specs": {
      "weight_oz": 10.8,
      "drop_mm": 8,
      "stack_heel_mm": 35,
      "stack_forefoot_mm": 27,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 4,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 6,
      "rocker": 6,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "Fresh Foam X",
      "Vibram Megagrip outsole",
      "4.5mm lugs"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "wide_feet"
    ],
    "summary": "Cushioned trail workhorse with Vibram grip.",
    "avoid_for_conditions": []
  },
  {
    "id": "nb_rebel_trail",
    "brand": "New Balance",
    "model": "FuelCell Rebel Trail",
    "year": 2026,
    "release_date": "2026-04",
    "price_usd": 150,
    "category": "trail_road_to_trail",
    "use_cases": [
      "trail_easy",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 8.6,
      "drop_mm": 6,
      "stack_heel_mm": 32,
      "stack_forefoot_mm": 26,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 6,
      "cushioning_level": 6,
      "cushioning_firmness": 5,
      "energy_return": 8,
      "rocker": 7,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "FuelCell foam",
      "Trail-tuned outsole"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "April 2026 trail Rebel. Light + bouncy off-road.",
    "avoid_for_conditions": []
  },
  {
    "id": "nb_supercomp_trail",
    "brand": "New Balance",
    "model": "FuelCell SuperComp Trail",
    "year": 2026,
    "price_usd": 180,
    "category": "trail_carbon_racer",
    "use_cases": [
      "trail_technical",
      "trail_ultra"
    ],
    "specs": {
      "weight_oz": 9.8,
      "drop_mm": 6,
      "stack_heel_mm": 36,
      "stack_forefoot_mm": 30,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 4,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 9,
      "rocker": 8,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "FuelCell",
      "Carbon plate",
      "Vibram Megagrip"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Carbon trail racer.",
    "avoid_for_conditions": []
  },
  {
    "id": "nb_minimus_trail",
    "brand": "New Balance",
    "model": "Minimus Trail",
    "year": 2026,
    "price_usd": 120,
    "category": "trail_neutral",
    "use_cases": [
      "trail_technical",
      "trail_easy"
    ],
    "specs": {
      "weight_oz": 7.4,
      "drop_mm": 4,
      "stack_heel_mm": 18,
      "stack_forefoot_mm": 14,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 8,
      "cushioning_level": 3,
      "cushioning_firmness": 7,
      "energy_return": 5,
      "rocker": 3,
      "toe_box_width": 6,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "Vibram outsole",
      "Minimal cushioning"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Low-stack natural trail. Ground-feel focused.",
    "avoid_for_conditions": []
  },
  {
    "id": "on_cloud_6",
    "brand": "On",
    "model": "Cloud 6",
    "year": 2026,
    "price_usd": 140,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 8.5,
      "drop_mm": 6,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 24,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 4,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 6,
      "rocker": 6,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": false
    },
    "tech": [
      "Helion superfoam midsole",
      "CloudTec Phase",
      "Speedboard plate"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Latest 2026 entry-level daily/lifestyle.",
    "avoid_for_conditions": []
  },
  {
    "id": "on_cloudsurfer_3",
    "brand": "On",
    "model": "Cloudsurfer 3",
    "year": 2026,
    "price_usd": 160,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 9,
      "drop_mm": 7,
      "stack_heel_mm": 33,
      "stack_forefoot_mm": 26,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 4,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 8,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": false
    },
    "tech": [
      "CloudTec Phase",
      "Helion foam",
      "Pronounced rocker"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "metatarsalgia",
      "plantar_fasciitis"
    ],
    "summary": "Smooth-rolling rocker daily.",
    "avoid_for_conditions": []
  },
  {
    "id": "on_cloudsurfer_max",
    "brand": "On",
    "model": "Cloudsurfer Max",
    "year": 2026,
    "price_usd": 200,
    "category": "max_cushion_premium",
    "use_cases": [
      "daily_easy",
      "long_run",
      "walking"
    ],
    "specs": {
      "weight_oz": 10.6,
      "drop_mm": 6,
      "stack_heel_mm": 42,
      "stack_forefoot_mm": 36,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 3,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 7,
      "rocker": 9,
      "toe_box_width": 5,
      "upper_softness": 7,
      "removable_insole": false,
      "wide_base": true
    },
    "tech": [
      "Helion HF supercritical foam",
      "CloudTec Phase",
      "Aggressive rocker"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches",
      "plantar_fasciitis",
      "knee_pain",
      "metatarsalgia"
    ],
    "summary": "On's max-cushion long-run flagship.",
    "avoid_for_conditions": []
  },
  {
    "id": "on_cloudeclipse",
    "brand": "On",
    "model": "Cloudeclipse",
    "year": 2026,
    "price_usd": 180,
    "category": "max_cushion_premium",
    "use_cases": [
      "daily_easy",
      "long_run"
    ],
    "specs": {
      "weight_oz": 10.5,
      "drop_mm": 6,
      "stack_heel_mm": 37,
      "stack_forefoot_mm": 31,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 3,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 7,
      "rocker": 8,
      "toe_box_width": 5,
      "upper_softness": 7,
      "removable_insole": false,
      "wide_base": true
    },
    "tech": [
      "Dual Helion CloudTec",
      "Speedboard",
      "Wide platform"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches",
      "plantar_fasciitis",
      "knee_pain"
    ],
    "summary": "Original max-cushion. Smooth dual-foam.",
    "avoid_for_conditions": []
  },
  {
    "id": "on_cloudmonster_3_hyper",
    "brand": "On",
    "model": "Cloudmonster 3 Hyper",
    "year": 2026,
    "price_usd": 220,
    "category": "super_trainer",
    "use_cases": [
      "daily_versatile",
      "long_run",
      "tempo"
    ],
    "specs": {
      "weight_oz": 9.6,
      "drop_mm": 6,
      "stack_heel_mm": 42,
      "stack_forefoot_mm": 36,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 4,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 9,
      "rocker": 8,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": false
    },
    "tech": [
      "Helion HF supercritical PEBA-blend",
      "Plate-less",
      "Massive CloudTec"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches"
    ],
    "summary": "Plate-less max-energy super-trainer.",
    "avoid_for_conditions": []
  },
  {
    "id": "on_cloudrunner_2",
    "brand": "On",
    "model": "Cloudrunner 2",
    "year": 2026,
    "price_usd": 140,
    "category": "stability_daily",
    "use_cases": [
      "daily_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 9.6,
      "drop_mm": 9,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 21,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "guidance",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 6,
      "rocker": 6,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": false,
      "midfoot_support": true
    },
    "tech": [
      "Helion",
      "Engineered mesh",
      "Speedboard"
    ],
    "good_for_conditions": [
      "overpronation_mild",
      "flat_feet_flexible"
    ],
    "summary": "On's accessible stability shoe.",
    "avoid_for_conditions": []
  },
  {
    "id": "on_cloudgo",
    "brand": "On",
    "model": "Cloudgo",
    "year": 2026,
    "price_usd": 140,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 8.8,
      "drop_mm": 9,
      "stack_heel_mm": 28,
      "stack_forefoot_mm": 19,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 6,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 6,
      "rocker": 5,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": false
    },
    "tech": [
      "Helion",
      "CloudTec",
      "Approachable design"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Beginner-friendly On.",
    "avoid_for_conditions": []
  },
  {
    "id": "on_cloudswift_4",
    "brand": "On",
    "model": "Cloudswift 4",
    "year": 2026,
    "price_usd": 160,
    "category": "lightweight_daily",
    "use_cases": [
      "daily_versatile",
      "tempo",
      "walking"
    ],
    "specs": {
      "weight_oz": 8.8,
      "drop_mm": 7,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 23,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 7,
      "rocker": 6,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": false
    },
    "tech": [
      "Helion superfoam",
      "CloudTec",
      "Lightweight upper"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Urban lightweight.",
    "avoid_for_conditions": []
  },
  {
    "id": "on_cloudstratus_3",
    "brand": "On",
    "model": "Cloudstratus 3",
    "year": 2026,
    "price_usd": 180,
    "category": "max_cushion_premium",
    "use_cases": [
      "daily_easy",
      "long_run",
      "walking"
    ],
    "specs": {
      "weight_oz": 10.4,
      "drop_mm": 8,
      "stack_heel_mm": 35,
      "stack_forefoot_mm": 27,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 3,
      "cushioning_level": 9,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 7,
      "toe_box_width": 5,
      "upper_softness": 7,
      "removable_insole": false
    },
    "tech": [
      "Double-stacked CloudTec",
      "Helion foam",
      "Speedboard"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches",
      "plantar_fasciitis"
    ],
    "summary": "Dual-cushion long-run shoe.",
    "avoid_for_conditions": []
  },
  {
    "id": "on_cloudflyer_5",
    "brand": "On",
    "model": "Cloudflyer 5",
    "year": 2026,
    "price_usd": 170,
    "category": "stability_daily",
    "use_cases": [
      "daily_easy",
      "long_run"
    ],
    "specs": {
      "weight_oz": 11,
      "drop_mm": 9,
      "stack_heel_mm": 32,
      "stack_forefoot_mm": 23,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "stability",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 9,
      "midsole_flexibility": 4,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 6,
      "rocker": 6,
      "toe_box_width": 6,
      "upper_softness": 7,
      "removable_insole": false,
      "midfoot_support": true,
      "wide_base": true
    },
    "tech": [
      "Helion",
      "Wider Speedboard",
      "Larger CloudTec"
    ],
    "good_for_conditions": [
      "flat_feet_flexible",
      "overpronation_mild",
      "plantar_fasciitis",
      "heavy_runner"
    ],
    "summary": "On's premium stability.",
    "avoid_for_conditions": []
  },
  {
    "id": "on_cloudflow_5",
    "brand": "On",
    "model": "Cloudflow 5",
    "year": 2026,
    "price_usd": 160,
    "category": "lightweight_daily",
    "use_cases": [
      "tempo",
      "daily_versatile",
      "race_5k_10k"
    ],
    "specs": {
      "weight_oz": 8,
      "drop_mm": 6,
      "stack_heel_mm": 29,
      "stack_forefoot_mm": 23,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 6,
      "cushioning_level": 6,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 7,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "Helion",
      "CloudTec",
      "Lightweight"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Lightweight tempo daily.",
    "avoid_for_conditions": []
  },
  {
    "id": "on_cloudboom_strike",
    "brand": "On",
    "model": "Cloudboom Strike",
    "year": 2026,
    "price_usd": 280,
    "category": "carbon_racer",
    "use_cases": [
      "race_half",
      "race_marathon"
    ],
    "specs": {
      "weight_oz": 7,
      "drop_mm": 4,
      "stack_heel_mm": 39.5,
      "stack_forefoot_mm": 35.5,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 3,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 10,
      "rocker": 9,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "Pebax-based Helion HF",
      "Speedboard carbon plate"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "On's marathon racer.",
    "avoid_for_conditions": []
  },
  {
    "id": "on_cloudboom_strike_ls",
    "brand": "On",
    "model": "Cloudboom Strike LightSpray",
    "year": 2026,
    "price_usd": 330,
    "category": "carbon_racer",
    "use_cases": [
      "race_half",
      "race_marathon"
    ],
    "specs": {
      "weight_oz": 6.6,
      "drop_mm": 4,
      "stack_heel_mm": 39.5,
      "stack_forefoot_mm": 35.5,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 4,
      "midsole_flexibility": 3,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 10,
      "rocker": 9,
      "toe_box_width": 5,
      "upper_softness": 4,
      "removable_insole": false
    },
    "tech": [
      "LightSpray robotic upper (30g)",
      "Helion HF",
      "Carbon Speedboard"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "World's lightest racer with robotic upper.",
    "avoid_for_conditions": []
  },
  {
    "id": "on_cloud_x_4",
    "brand": "On",
    "model": "Cloud X 4",
    "year": 2026,
    "price_usd": 160,
    "category": "neutral_daily",
    "use_cases": [
      "gym",
      "daily_easy"
    ],
    "specs": {
      "weight_oz": 9.4,
      "drop_mm": 6,
      "stack_heel_mm": 25,
      "stack_forefoot_mm": 19,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 5,
      "cushioning_firmness": 6,
      "energy_return": 6,
      "rocker": 5,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": false,
      "wide_base": true
    },
    "tech": [
      "Helion",
      "Multi-direction outsole",
      "Wide stable platform"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "HIIT/gym multi-direction shoe.",
    "avoid_for_conditions": []
  },
  {
    "id": "on_cloudultra_2",
    "brand": "On",
    "model": "Cloudultra 2",
    "year": 2026,
    "price_usd": 200,
    "category": "trail_max_cushion",
    "use_cases": [
      "trail_ultra",
      "trail_easy"
    ],
    "specs": {
      "weight_oz": 11.6,
      "drop_mm": 6,
      "stack_heel_mm": 36,
      "stack_forefoot_mm": 30,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 4,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 7,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": false
    },
    "tech": [
      "Dual Helion",
      "Missiongrip",
      "Adjustable laces"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Max-cushion trail for ultras.",
    "avoid_for_conditions": []
  },
  {
    "id": "on_cloudultra_pro",
    "brand": "On",
    "model": "Cloudultra Pro",
    "year": 2026,
    "price_usd": 260,
    "category": "trail_carbon_racer",
    "use_cases": [
      "trail_technical",
      "trail_ultra"
    ],
    "specs": {
      "weight_oz": 10,
      "drop_mm": 6,
      "stack_heel_mm": 38,
      "stack_forefoot_mm": 32,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 9,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 3,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 9,
      "rocker": 8,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "Helion HF",
      "Carbon Speedboard",
      "Missiongrip rubber"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Carbon trail racer for technical ultras.",
    "avoid_for_conditions": []
  },
  {
    "id": "on_cloudvista_2",
    "brand": "On",
    "model": "Cloudvista 2",
    "year": 2026,
    "price_usd": 160,
    "category": "trail_road_to_trail",
    "use_cases": [
      "trail_easy",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 9.8,
      "drop_mm": 6,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 24,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 7,
      "rocker": 6,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": false
    },
    "tech": [
      "Helion",
      "Missiongrip rubber",
      "Rock plate"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Road-to-trail with Missiongrip.",
    "avoid_for_conditions": []
  },
  {
    "id": "on_cloudventure_peak",
    "brand": "On",
    "model": "Cloudventure Peak",
    "year": 2026,
    "price_usd": 160,
    "category": "trail_neutral",
    "use_cases": [
      "trail_easy",
      "trail_technical"
    ],
    "specs": {
      "weight_oz": 9,
      "drop_mm": 8,
      "stack_heel_mm": 28,
      "stack_forefoot_mm": 20,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 6,
      "rocker": 5,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "Helion",
      "Missiongrip",
      "Gripped CloudTec"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Lightweight trail performance.",
    "avoid_for_conditions": []
  },
  {
    "id": "on_cloudsurfer_trail",
    "brand": "On",
    "model": "Cloudsurfer Trail",
    "year": 2026,
    "price_usd": 170,
    "category": "trail_neutral",
    "use_cases": [
      "trail_easy"
    ],
    "specs": {
      "weight_oz": 9.4,
      "drop_mm": 7,
      "stack_heel_mm": 33,
      "stack_forefoot_mm": 26,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 4,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 7,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": false
    },
    "tech": [
      "CloudTec Phase",
      "Helion",
      "Trail outsole"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Trail Cloudsurfer with rocker.",
    "avoid_for_conditions": []
  },
  {
    "id": "mizuno_wave_rider_29",
    "brand": "Mizuno",
    "model": "Wave Rider 29",
    "year": 2026,
    "price_usd": 140,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 9.5,
      "drop_mm": 10,
      "stack_heel_mm": 36,
      "stack_forefoot_mm": 26,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 6,
      "energy_return": 6,
      "rocker": 5,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": true,
      "midfoot_support": true
    },
    "tech": [
      "Full-length Enerzy NXT nitrogen-infused foam",
      "Wave plate (medial-biased)",
      "X10 outsole"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "plantar_fasciitis",
      "achilles_tendinitis"
    ],
    "summary": "Iconic Mizuno daily. New full-length Enerzy NXT 2026.",
    "avoid_for_conditions": []
  },
  {
    "id": "mizuno_wave_sky_9",
    "brand": "Mizuno",
    "model": "Wave Sky 9",
    "year": 2026,
    "price_usd": 170,
    "category": "max_cushion_premium",
    "use_cases": [
      "daily_easy",
      "long_run"
    ],
    "specs": {
      "weight_oz": 10.6,
      "drop_mm": 8,
      "stack_heel_mm": 39,
      "stack_forefoot_mm": 31,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 4,
      "cushioning_level": 9,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 7,
      "toe_box_width": 6,
      "upper_softness": 7,
      "removable_insole": true
    },
    "tech": [
      "Triple-layer Enerzy NXT + Enerzy Core",
      "Smooth Speed Assist"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches",
      "plantar_fasciitis",
      "knee_pain"
    ],
    "summary": "Max cushion premium. Soft + bouncy.",
    "avoid_for_conditions": []
  },
  {
    "id": "mizuno_wave_inspire_22",
    "brand": "Mizuno",
    "model": "Wave Inspire 22",
    "year": 2026,
    "price_usd": 145,
    "category": "stability_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 10,
      "drop_mm": 8,
      "stack_heel_mm": 34,
      "stack_forefoot_mm": 26,
      "widths": [
        "regular",
        "wide",
        "extra_wide"
      ]
    },
    "biomech": {
      "stability_level": "stability",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 6,
      "energy_return": 6,
      "rocker": 5,
      "toe_box_width": 6,
      "upper_softness": 6,
      "removable_insole": true,
      "midfoot_support": true,
      "wide_base": true
    },
    "tech": [
      "Full Wave plate (medial bias)",
      "Enerzy Core",
      "X10 outsole"
    ],
    "good_for_conditions": [
      "flat_feet_flexible",
      "overpronation_mild",
      "plantar_fasciitis",
      "heavy_runner",
      "wide_feet"
    ],
    "summary": "Stability without medial post — uses Wave plate.",
    "avoid_for_conditions": []
  },
  {
    "id": "mizuno_wave_horizon_8",
    "brand": "Mizuno",
    "model": "Wave Horizon 8",
    "year": 2026,
    "price_usd": 175,
    "category": "max_stability",
    "use_cases": [
      "daily_easy",
      "long_run"
    ],
    "specs": {
      "weight_oz": 11.2,
      "drop_mm": 8,
      "stack_heel_mm": 38,
      "stack_forefoot_mm": 30,
      "widths": [
        "regular",
        "wide"
      ]
    },
    "biomech": {
      "stability_level": "stability",
      "torsional_rigidity": 9,
      "heel_counter_rigidity": 9,
      "midsole_flexibility": 4,
      "cushioning_level": 9,
      "cushioning_firmness": 5,
      "energy_return": 6,
      "rocker": 7,
      "toe_box_width": 5,
      "upper_softness": 7,
      "removable_insole": true,
      "midfoot_support": true,
      "wide_base": true
    },
    "tech": [
      "Structured Wave System",
      "Enerzy Core",
      "Wider base"
    ],
    "good_for_conditions": [
      "flat_feet_flexible",
      "flat_feet_rigid",
      "overpronation_severe",
      "plantar_fasciitis",
      "heavy_runner"
    ],
    "avoid_for_conditions": [
      "high_arches",
      "underpronation"
    ],
    "summary": "Premium max-stability + max-cushion."
  },
  {
    "id": "mizuno_neo_vista_2",
    "brand": "Mizuno",
    "model": "Neo Vista 2",
    "year": 2026,
    "price_usd": 200,
    "category": "super_trainer",
    "use_cases": [
      "long_run",
      "daily_versatile",
      "tempo"
    ],
    "specs": {
      "weight_oz": 9.6,
      "drop_mm": 8.5,
      "stack_heel_mm": 46,
      "stack_forefoot_mm": 37.5,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 4,
      "cushioning_level": 10,
      "cushioning_firmness": 4,
      "energy_return": 8,
      "rocker": 8,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": false
    },
    "tech": [
      "Enerzy NXT (nitrogen-infused PEBA-blend)",
      "Glass-Fibre Wave plate",
      "Smooth Speed Assist"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches",
      "stress_fracture_history",
      "knee_pain"
    ],
    "summary": "Mizuno's max-stack super trainer.",
    "avoid_for_conditions": []
  },
  {
    "id": "mizuno_neo_zen_2",
    "brand": "Mizuno",
    "model": "Neo Zen 2",
    "year": 2026,
    "price_usd": 170,
    "category": "max_cushion_neutral",
    "use_cases": [
      "daily_easy",
      "long_run"
    ],
    "specs": {
      "weight_oz": 8.4,
      "drop_mm": 5,
      "stack_heel_mm": 40.5,
      "stack_forefoot_mm": 35.5,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 8,
      "rocker": 7,
      "toe_box_width": 5,
      "upper_softness": 7,
      "removable_insole": false,
      "wide_base": true
    },
    "tech": [
      "Supercritical Enerzy NXT",
      "Plate-less",
      "Smooth Speed Assist",
      "Bootie upper"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches"
    ],
    "summary": "Plate-less plush daily. Bouncy + light.",
    "avoid_for_conditions": []
  },
  {
    "id": "mizuno_neo_cosmo",
    "brand": "Mizuno",
    "model": "Neo Cosmo",
    "year": 2026,
    "price_usd": 140,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 9.4,
      "drop_mm": 6,
      "stack_heel_mm": 34,
      "stack_forefoot_mm": 28,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 6,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": false
    },
    "tech": [
      "Enerzy foam",
      "Plate-less",
      "Approachable Neo entry"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Entry-level Neo line.",
    "avoid_for_conditions": []
  },
  {
    "id": "mizuno_wave_rebellion_flash_3",
    "brand": "Mizuno",
    "model": "Wave Rebellion Flash 3",
    "year": 2026,
    "price_usd": 180,
    "category": "super_trainer",
    "use_cases": [
      "tempo",
      "long_run",
      "race_half"
    ],
    "specs": {
      "weight_oz": 8.8,
      "drop_mm": 6,
      "stack_heel_mm": 38,
      "stack_forefoot_mm": 32,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 4,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 9,
      "rocker": 8,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "Dual-layer Enerzy",
      "Fiberglass plate",
      "Heel bevel"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Plated super-trainer. Tempo-day weapon.",
    "avoid_for_conditions": []
  },
  {
    "id": "mizuno_wave_rebellion_pro_3",
    "brand": "Mizuno",
    "model": "Wave Rebellion Pro 3",
    "year": 2026,
    "price_usd": 240,
    "category": "carbon_racer",
    "use_cases": [
      "race_half",
      "race_marathon"
    ],
    "specs": {
      "weight_oz": 7.5,
      "drop_mm": 8,
      "stack_heel_mm": 40,
      "stack_forefoot_mm": 32,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 9,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 3,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 10,
      "rocker": 10,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "Enerzy XP (PEBA/TPEE)",
      "Carbon plate",
      "Aggressive heel bevel"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Mizuno's marathon racer. Aggressive heel-cut for forefoot strikers.",
    "avoid_for_conditions": []
  },
  {
    "id": "mizuno_hyperwarp_pure",
    "brand": "Mizuno",
    "model": "Hyperwarp Pure",
    "year": 2026,
    "price_usd": 280,
    "category": "carbon_racer",
    "use_cases": [
      "race_5k_10k",
      "race_half"
    ],
    "specs": {
      "weight_oz": 4.8,
      "drop_mm": 5,
      "stack_heel_mm": 36,
      "stack_forefoot_mm": 31,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 4,
      "midsole_flexibility": 3,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 10,
      "rocker": 9,
      "toe_box_width": 5,
      "upper_softness": 4,
      "removable_insole": false
    },
    "tech": [
      "Enerzy XP PEBA",
      "3D carbon plate",
      "Race-day only"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Lightest super shoe globally — 137g.",
    "avoid_for_conditions": []
  },
  {
    "id": "mizuno_hyperwarp_elite",
    "brand": "Mizuno",
    "model": "Hyperwarp Elite",
    "year": 2026,
    "price_usd": 280,
    "category": "carbon_racer",
    "use_cases": [
      "race_marathon",
      "race_half"
    ],
    "specs": {
      "weight_oz": 6.5,
      "drop_mm": 5,
      "stack_heel_mm": 39,
      "stack_forefoot_mm": 34,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 3,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 10,
      "rocker": 9,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "Enerzy XP",
      "3D carbon plate",
      "Marathon stack"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Marathon-distance Hyperwarp.",
    "avoid_for_conditions": []
  },
  {
    "id": "mizuno_hyperwarp_pro",
    "brand": "Mizuno",
    "model": "Hyperwarp Pro",
    "year": 2026,
    "price_usd": 240,
    "category": "carbon_racer",
    "use_cases": [
      "race_marathon",
      "race_half"
    ],
    "specs": {
      "weight_oz": 7.5,
      "drop_mm": 6,
      "stack_heel_mm": 40,
      "stack_forefoot_mm": 34,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 9,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 3,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 9,
      "rocker": 9,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false,
      "wide_base": true
    },
    "tech": [
      "Enerzy XP",
      "Carbon plate",
      "Stable wider base"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Stable-platform Hyperwarp. For runners needing more support in carbon shoe.",
    "avoid_for_conditions": []
  },
  {
    "id": "mizuno_wave_mujin_9",
    "brand": "Mizuno",
    "model": "Wave Mujin 9",
    "year": 2026,
    "price_usd": 140,
    "category": "trail_neutral",
    "use_cases": [
      "trail_easy",
      "trail_technical"
    ],
    "specs": {
      "weight_oz": 11.2,
      "drop_mm": 10,
      "stack_heel_mm": 32,
      "stack_forefoot_mm": 22,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 4,
      "cushioning_level": 7,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 5,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "Enerzy",
      "Aggressive lugs",
      "Rock plate"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Aggressive technical trail.",
    "avoid_for_conditions": []
  },
  {
    "id": "altra_torin_9",
    "brand": "Altra",
    "model": "Torin 9",
    "year": 2026,
    "price_usd": 160,
    "category": "max_cushion_neutral",
    "use_cases": [
      "daily_easy",
      "long_run"
    ],
    "specs": {
      "weight_oz": 9.5,
      "drop_mm": 0,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 30,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 6,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 4,
      "toe_box_width": 9,
      "upper_softness": 7,
      "removable_insole": true
    },
    "tech": [
      "EGO MAX foam",
      "Vibram BB road compound (NEW 2026)",
      "FootShape Standard fit"
    ],
    "good_for_conditions": [
      "bunions",
      "morton_neuroma",
      "wide_feet",
      "neutral_arch"
    ],
    "avoid_for_conditions": [
      "achilles_tendinitis"
    ],
    "summary": "V9 brings Vibram road compound. Best toe splay in industry."
  },
  {
    "id": "altra_via_olympus_2",
    "brand": "Altra",
    "model": "VIA Olympus 2",
    "year": 2026,
    "price_usd": 170,
    "category": "max_cushion_premium",
    "use_cases": [
      "long_run",
      "daily_easy",
      "race_marathon"
    ],
    "specs": {
      "weight_oz": 10.6,
      "drop_mm": 0,
      "stack_heel_mm": 33,
      "stack_forefoot_mm": 33,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 5,
      "cushioning_level": 9,
      "cushioning_firmness": 5,
      "energy_return": 8,
      "rocker": 5,
      "toe_box_width": 9,
      "upper_softness": 7,
      "removable_insole": true
    },
    "tech": [
      "EGO MAX",
      "Maximum stack road",
      "FootShape Standard"
    ],
    "good_for_conditions": [
      "bunions",
      "wide_feet",
      "high_arches"
    ],
    "avoid_for_conditions": [
      "achilles_tendinitis"
    ],
    "summary": "Max-stack zero-drop for long road days."
  },
  {
    "id": "altra_paradigm_6",
    "brand": "Altra",
    "model": "Paradigm 6",
    "year": 2026,
    "price_usd": 160,
    "category": "stability_premium",
    "use_cases": [
      "daily_easy",
      "long_run"
    ],
    "specs": {
      "weight_oz": 10.8,
      "drop_mm": 0,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 30,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "guidance",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 5,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 5,
      "toe_box_width": 9,
      "upper_softness": 7,
      "removable_insole": true,
      "midfoot_support": true,
      "wide_base": true
    },
    "tech": [
      "GuideRail Dynamic Support",
      "EGO MAX",
      "FootShape Standard"
    ],
    "good_for_conditions": [
      "overpronation_mild",
      "flat_feet_flexible",
      "wide_feet",
      "bunions"
    ],
    "avoid_for_conditions": [
      "achilles_tendinitis",
      "high_arches"
    ],
    "summary": "Zero-drop with stability. Designed for Badwater 135."
  },
  {
    "id": "altra_provision_8",
    "brand": "Altra",
    "model": "Provision 8",
    "year": 2026,
    "price_usd": 140,
    "category": "stability_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 10,
      "drop_mm": 0,
      "stack_heel_mm": 28,
      "stack_forefoot_mm": 28,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "stability",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 6,
      "energy_return": 6,
      "rocker": 4,
      "toe_box_width": 9,
      "upper_softness": 6,
      "removable_insole": true,
      "midfoot_support": true,
      "wide_base": true
    },
    "tech": [
      "Y-Frame stability",
      "EGO foam",
      "FootShape Standard"
    ],
    "good_for_conditions": [
      "overpronation_mild",
      "flat_feet_flexible",
      "wide_feet",
      "bunions"
    ],
    "avoid_for_conditions": [
      "achilles_tendinitis",
      "high_arches"
    ],
    "summary": "Zero-drop stability with Y-Frame. Enclosed support."
  },
  {
    "id": "altra_escalante_5",
    "brand": "Altra",
    "model": "Escalante 5",
    "year": 2026,
    "price_usd": 140,
    "category": "lightweight_daily",
    "use_cases": [
      "daily_versatile",
      "tempo",
      "race_5k_10k"
    ],
    "specs": {
      "weight_oz": 8.7,
      "drop_mm": 0,
      "stack_heel_mm": 24,
      "stack_forefoot_mm": 24,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 7,
      "cushioning_level": 5,
      "cushioning_firmness": 6,
      "energy_return": 7,
      "rocker": 4,
      "toe_box_width": 9,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "EGO MAX",
      "InnerFlex midsole",
      "FootShape Original (Lone Peak fit)",
      "Knit upper"
    ],
    "good_for_conditions": [
      "bunions",
      "wide_feet",
      "neutral_arch"
    ],
    "avoid_for_conditions": [
      "achilles_tendinitis"
    ],
    "summary": "Lightweight zero-drop knit. Versatile."
  },
  {
    "id": "altra_solstice",
    "brand": "Altra",
    "model": "Solstice",
    "year": 2026,
    "price_usd": 110,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 9,
      "drop_mm": 0,
      "stack_heel_mm": 25,
      "stack_forefoot_mm": 25,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 6,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 3,
      "toe_box_width": 8,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "EGO foam",
      "FootShape Standard",
      "Mesh upper"
    ],
    "good_for_conditions": [
      "bunions",
      "neutral_arch"
    ],
    "avoid_for_conditions": [
      "achilles_tendinitis"
    ],
    "summary": "Budget zero-drop. Standard fit."
  },
  {
    "id": "altra_experience_flow_3",
    "brand": "Altra",
    "model": "Experience Flow 3",
    "year": 2026,
    "price_usd": 140,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile",
      "walking"
    ],
    "specs": {
      "weight_oz": 9.4,
      "drop_mm": 4,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 26,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 6,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 5,
      "toe_box_width": 8,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "EGO foam",
      "4mm drop (transitional)",
      "FootShape Standard"
    ],
    "good_for_conditions": [
      "bunions",
      "wide_feet",
      "neutral_arch"
    ],
    "summary": "Transitional 4mm drop. Bridge to zero-drop.",
    "avoid_for_conditions": []
  },
  {
    "id": "altra_experience_flow_st",
    "brand": "Altra",
    "model": "Experience Flow ST",
    "year": 2026,
    "price_usd": 150,
    "category": "stability_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 9.8,
      "drop_mm": 4,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 26,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "guidance",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 5,
      "toe_box_width": 8,
      "upper_softness": 6,
      "removable_insole": true,
      "midfoot_support": true
    },
    "tech": [
      "EGO foam",
      "4mm drop",
      "Stability frame",
      "FootShape Standard"
    ],
    "good_for_conditions": [
      "overpronation_mild",
      "flat_feet_flexible",
      "bunions",
      "wide_feet"
    ],
    "summary": "Transitional drop with stability.",
    "avoid_for_conditions": []
  },
  {
    "id": "altra_experience_form",
    "brand": "Altra",
    "model": "Experience Form",
    "year": 2026,
    "price_usd": 130,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "gym",
      "walking"
    ],
    "specs": {
      "weight_oz": 9,
      "drop_mm": 4,
      "stack_heel_mm": 25,
      "stack_forefoot_mm": 21,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 7,
      "cushioning_level": 5,
      "cushioning_firmness": 6,
      "energy_return": 6,
      "rocker": 4,
      "toe_box_width": 8,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "EGO foam",
      "4mm drop",
      "FootShape Standard"
    ],
    "good_for_conditions": [
      "bunions",
      "neutral_arch"
    ],
    "summary": "Lightweight transitional shoe.",
    "avoid_for_conditions": []
  },
  {
    "id": "altra_altrafwd_experience",
    "brand": "Altra",
    "model": "AltraFWD Experience",
    "year": 2026,
    "price_usd": 130,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "walking"
    ],
    "specs": {
      "weight_oz": 9.6,
      "drop_mm": 4,
      "stack_heel_mm": 28,
      "stack_forefoot_mm": 24,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 6,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 6,
      "rocker": 5,
      "toe_box_width": 8,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "EGO foam",
      "4mm drop",
      "Forward-roll geometry"
    ],
    "good_for_conditions": [
      "bunions"
    ],
    "summary": "Forward-momentum 4mm drop daily.",
    "avoid_for_conditions": []
  },
  {
    "id": "altra_experience_wild_3",
    "brand": "Altra",
    "model": "Experience Wild 3+",
    "year": 2026,
    "price_usd": 160,
    "category": "trail_road_to_trail",
    "use_cases": [
      "trail_easy",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 10,
      "drop_mm": 4,
      "stack_heel_mm": 28,
      "stack_forefoot_mm": 24,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 6,
      "rocker": 4,
      "toe_box_width": 8,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "EGO MAX",
      "4mm drop",
      "Trail outsole"
    ],
    "good_for_conditions": [
      "bunions",
      "wide_feet"
    ],
    "summary": "4mm drop trail/road crossover.",
    "avoid_for_conditions": []
  },
  {
    "id": "altra_vanish_carbon_2",
    "brand": "Altra",
    "model": "Vanish Carbon 2",
    "year": 2026,
    "price_usd": 240,
    "category": "carbon_racer",
    "use_cases": [
      "race_half",
      "race_marathon"
    ],
    "specs": {
      "weight_oz": 7.4,
      "drop_mm": 4,
      "stack_heel_mm": 33,
      "stack_forefoot_mm": 29,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 9,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 3,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 10,
      "rocker": 8,
      "toe_box_width": 8,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "Spoon-shaped carbon plate",
      "PEBA + EGO MAX",
      "FootShape Standard",
      "4mm drop"
    ],
    "good_for_conditions": [
      "bunions",
      "wide_feet",
      "neutral_arch"
    ],
    "summary": "Wide-toe-box carbon racer. Rare.",
    "avoid_for_conditions": []
  },
  {
    "id": "altra_vanish_pulse",
    "brand": "Altra",
    "model": "Vanish Pulse",
    "year": 2026,
    "release_date": "2026-Summer",
    "price_usd": 150,
    "category": "super_trainer",
    "use_cases": [
      "tempo",
      "race_5k_10k",
      "race_half"
    ],
    "specs": {
      "weight_oz": 7.5,
      "drop_mm": 0,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 30,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 9,
      "rocker": 7,
      "toe_box_width": 9,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "Performance super-foam",
      "Plate-less",
      "Zero-drop racer"
    ],
    "good_for_conditions": [
      "bunions",
      "wide_feet"
    ],
    "avoid_for_conditions": [
      "achilles_tendinitis"
    ],
    "summary": "Summer 2026 zero-drop racing answer to super-foam trend."
  },
  {
    "id": "altra_vanish_tempo",
    "brand": "Altra",
    "model": "Vanish Tempo",
    "year": 2026,
    "price_usd": 160,
    "category": "super_trainer",
    "use_cases": [
      "tempo",
      "long_run",
      "race_half"
    ],
    "specs": {
      "weight_oz": 8,
      "drop_mm": 0,
      "stack_heel_mm": 33,
      "stack_forefoot_mm": 33,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 5,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 9,
      "rocker": 7,
      "toe_box_width": 9,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "EGO PRO PEBA",
      "Plate-less",
      "Zero-drop tempo"
    ],
    "good_for_conditions": [
      "bunions",
      "wide_feet"
    ],
    "summary": "Zero-drop plate-less tempo shoe.",
    "avoid_for_conditions": []
  },
  {
    "id": "altra_escalante_racer_2",
    "brand": "Altra",
    "model": "Escalante Racer 2",
    "year": 2026,
    "price_usd": 140,
    "category": "lightweight_daily",
    "use_cases": [
      "intervals",
      "race_5k_10k",
      "tempo"
    ],
    "specs": {
      "weight_oz": 7.4,
      "drop_mm": 0,
      "stack_heel_mm": 23,
      "stack_forefoot_mm": 23,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 8,
      "cushioning_level": 4,
      "cushioning_firmness": 7,
      "energy_return": 7,
      "rocker": 4,
      "toe_box_width": 9,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "EGO PRO",
      "Knit upper",
      "FootShape Original (snug)"
    ],
    "good_for_conditions": [
      "bunions",
      "neutral_arch"
    ],
    "summary": "Stripped-down zero-drop racer. Track and short distances.",
    "avoid_for_conditions": []
  },
  {
    "id": "altra_lone_peak_9",
    "brand": "Altra",
    "model": "Lone Peak 9+",
    "year": 2026,
    "price_usd": 155,
    "category": "trail_neutral",
    "use_cases": [
      "trail_easy",
      "trail_technical",
      "trail_ultra",
      "walking"
    ],
    "specs": {
      "weight_oz": 10.9,
      "drop_mm": 0,
      "stack_heel_mm": 23,
      "stack_forefoot_mm": 23,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 6,
      "cushioning_level": 5,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 3,
      "toe_box_width": 9,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "Vibram Megagrip outsole (LP9+)",
      "3.8mm lugs",
      "StoneGuard rock plate",
      "FootShape Original"
    ],
    "good_for_conditions": [
      "bunions",
      "wide_feet",
      "neutral_arch"
    ],
    "avoid_for_conditions": [
      "achilles_tendinitis"
    ],
    "summary": "Iconic ultra-trail. Ground-feel + Vibram."
  },
  {
    "id": "altra_olympus_6",
    "brand": "Altra",
    "model": "Olympus 6",
    "year": 2026,
    "price_usd": 175,
    "category": "trail_max_cushion",
    "use_cases": [
      "trail_easy",
      "trail_ultra"
    ],
    "specs": {
      "weight_oz": 11.4,
      "drop_mm": 0,
      "stack_heel_mm": 33,
      "stack_forefoot_mm": 33,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 4,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 6,
      "rocker": 5,
      "toe_box_width": 9,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "EGO MAX",
      "Vibram Megagrip",
      "FootShape Original"
    ],
    "good_for_conditions": [
      "bunions",
      "wide_feet",
      "high_arches"
    ],
    "avoid_for_conditions": [
      "achilles_tendinitis"
    ],
    "summary": "Max-cushion zero-drop trail."
  },
  {
    "id": "altra_olympus_275",
    "brand": "Altra",
    "model": "Olympus 275",
    "year": 2026,
    "price_usd": 200,
    "category": "trail_max_cushion",
    "use_cases": [
      "trail_easy",
      "trail_ultra"
    ],
    "specs": {
      "weight_oz": 11.4,
      "drop_mm": 0,
      "stack_heel_mm": 33,
      "stack_forefoot_mm": 33,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 4,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 6,
      "rocker": 5,
      "toe_box_width": 9,
      "upper_softness": 7,
      "removable_insole": true
    },
    "tech": [
      "EGO MAX",
      "Vibram Megagrip",
      "Premium upper"
    ],
    "good_for_conditions": [
      "bunions",
      "wide_feet"
    ],
    "avoid_for_conditions": [
      "achilles_tendinitis"
    ],
    "summary": "Premium upper Olympus. Same biomech."
  },
  {
    "id": "altra_timp_5",
    "brand": "Altra",
    "model": "Timp 5",
    "year": 2026,
    "price_usd": 155,
    "category": "trail_neutral",
    "use_cases": [
      "trail_easy",
      "trail_technical"
    ],
    "specs": {
      "weight_oz": 10.6,
      "drop_mm": 0,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 30,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 6,
      "rocker": 4,
      "toe_box_width": 9,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "EGO MAX",
      "Vibram Megagrip",
      "3mm lugs",
      "FootShape Standard"
    ],
    "good_for_conditions": [
      "bunions",
      "wide_feet"
    ],
    "avoid_for_conditions": [
      "achilles_tendinitis"
    ],
    "summary": "Versatile trail. Mid-stack zero-drop."
  },
  {
    "id": "altra_superior_7",
    "brand": "Altra",
    "model": "Superior 7",
    "year": 2026,
    "price_usd": 130,
    "category": "trail_neutral",
    "use_cases": [
      "trail_technical",
      "trail_easy"
    ],
    "specs": {
      "weight_oz": 9,
      "drop_mm": 0,
      "stack_heel_mm": 21,
      "stack_forefoot_mm": 21,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 7,
      "cushioning_level": 4,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 3,
      "toe_box_width": 9,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "EGO foam",
      "Removable rock plate",
      "FootShape Standard"
    ],
    "good_for_conditions": [
      "bunions"
    ],
    "avoid_for_conditions": [
      "achilles_tendinitis"
    ],
    "summary": "Low-stack technical trail. Ground-feel king."
  },
  {
    "id": "altra_king_mt_2",
    "brand": "Altra",
    "model": "King MT 2",
    "year": 2026,
    "price_usd": 160,
    "category": "trail_technical",
    "use_cases": [
      "trail_technical"
    ],
    "specs": {
      "weight_oz": 10.7,
      "drop_mm": 0,
      "stack_heel_mm": 23,
      "stack_forefoot_mm": 23,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 5,
      "cushioning_level": 5,
      "cushioning_firmness": 7,
      "energy_return": 5,
      "rocker": 3,
      "toe_box_width": 9,
      "upper_softness": 4,
      "removable_insole": true
    },
    "tech": [
      "EGO MAX",
      "Vibram MaxTrac",
      "Aggressive 6mm lugs",
      "Velcro strap"
    ],
    "good_for_conditions": [
      "bunions"
    ],
    "avoid_for_conditions": [
      "achilles_tendinitis"
    ],
    "summary": "Most aggressive trail. Steep technical terrain."
  },
  {
    "id": "altra_outroad_3",
    "brand": "Altra",
    "model": "Outroad 3",
    "year": 2026,
    "price_usd": 140,
    "category": "trail_road_to_trail",
    "use_cases": [
      "trail_easy",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 9.6,
      "drop_mm": 0,
      "stack_heel_mm": 28,
      "stack_forefoot_mm": 28,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 6,
      "cushioning_level": 6,
      "cushioning_firmness": 5,
      "energy_return": 6,
      "rocker": 4,
      "toe_box_width": 9,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "EGO foam",
      "MaxTrac outsole, 1.5mm lugs",
      "FootShape Standard"
    ],
    "good_for_conditions": [
      "bunions",
      "wide_feet"
    ],
    "avoid_for_conditions": [
      "achilles_tendinitis"
    ],
    "summary": "Best zero-drop road-to-trail crossover."
  },
  {
    "id": "altra_mont_blanc_carbon",
    "brand": "Altra",
    "model": "Mont Blanc Carbon",
    "year": 2026,
    "price_usd": 275,
    "category": "trail_carbon_racer",
    "use_cases": [
      "trail_technical",
      "trail_ultra"
    ],
    "specs": {
      "weight_oz": 9.8,
      "drop_mm": 0,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 30,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 9,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 3,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 9,
      "rocker": 8,
      "toe_box_width": 9,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "EGO PRO PEBA",
      "Carbon plate",
      "Vibram Litebase"
    ],
    "good_for_conditions": [
      "bunions"
    ],
    "avoid_for_conditions": [
      "achilles_tendinitis"
    ],
    "summary": "Wide-toe-box carbon trail racer. Rare."
  },
  {
    "id": "topo_phantom_4",
    "brand": "Topo",
    "model": "Phantom 4",
    "year": 2026,
    "price_usd": 150,
    "category": "max_cushion_neutral",
    "use_cases": [
      "daily_easy",
      "long_run"
    ],
    "specs": {
      "weight_oz": 9.4,
      "drop_mm": 5,
      "stack_heel_mm": 33,
      "stack_forefoot_mm": 28,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 6,
      "toe_box_width": 8,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "ZipFoam (TPU-blend)",
      "5mm drop",
      "Anatomical toe box"
    ],
    "good_for_conditions": [
      "bunions",
      "wide_feet",
      "neutral_arch"
    ],
    "summary": "Daily trainer with anatomical fit. Mild rocker.",
    "avoid_for_conditions": []
  },
  {
    "id": "topo_magnifly_5",
    "brand": "Topo",
    "model": "Magnifly 5",
    "year": 2026,
    "price_usd": 130,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 8.8,
      "drop_mm": 0,
      "stack_heel_mm": 25,
      "stack_forefoot_mm": 25,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 7,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 6,
      "rocker": 3,
      "toe_box_width": 8,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "ZipFoam",
      "Zero drop",
      "Anatomical fit"
    ],
    "good_for_conditions": [
      "bunions",
      "wide_feet"
    ],
    "avoid_for_conditions": [
      "achilles_tendinitis"
    ],
    "summary": "Topo's zero-drop. More structured than Altra."
  },
  {
    "id": "topo_cyclone_3",
    "brand": "Topo",
    "model": "Cyclone 3",
    "year": 2026,
    "price_usd": 155,
    "category": "super_trainer",
    "use_cases": [
      "tempo",
      "long_run",
      "race_5k_10k"
    ],
    "specs": {
      "weight_oz": 7.5,
      "drop_mm": 5,
      "stack_heel_mm": 28,
      "stack_forefoot_mm": 23,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 6,
      "cushioning_level": 6,
      "cushioning_firmness": 5,
      "energy_return": 9,
      "rocker": 6,
      "toe_box_width": 8,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "Full-length PEBAX midsole",
      "Plate-less",
      "Anatomical fit"
    ],
    "good_for_conditions": [
      "bunions",
      "wide_feet"
    ],
    "summary": "Lightweight performance trainer. PEBA + wide toebox.",
    "avoid_for_conditions": []
  },
  {
    "id": "topo_specter_2",
    "brand": "Topo",
    "model": "Specter 2",
    "year": 2026,
    "price_usd": 170,
    "category": "super_trainer",
    "use_cases": [
      "long_run",
      "tempo",
      "race_marathon"
    ],
    "specs": {
      "weight_oz": 9,
      "drop_mm": 5,
      "stack_heel_mm": 35,
      "stack_forefoot_mm": 30,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 4,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 9,
      "rocker": 8,
      "toe_box_width": 8,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "PEBAX core + ZipFoam carrier",
      "Aggressive rocker",
      "Anatomical fit"
    ],
    "good_for_conditions": [
      "bunions",
      "wide_feet"
    ],
    "summary": "Wide-toe-box super shoe. Marathon-ready.",
    "avoid_for_conditions": []
  },
  {
    "id": "topo_atmos",
    "brand": "Topo",
    "model": "Atmos",
    "year": 2026,
    "price_usd": 170,
    "category": "max_cushion_neutral",
    "use_cases": [
      "daily_easy",
      "long_run"
    ],
    "specs": {
      "weight_oz": 10,
      "drop_mm": 5,
      "stack_heel_mm": 38,
      "stack_forefoot_mm": 33,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 4,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 7,
      "rocker": 7,
      "toe_box_width": 8,
      "upper_softness": 7,
      "removable_insole": true
    },
    "tech": [
      "ZipFoam",
      "Premium cushioning",
      "Anatomical fit"
    ],
    "good_for_conditions": [
      "bunions",
      "wide_feet",
      "high_arches"
    ],
    "summary": "Topo's max-cushion daily.",
    "avoid_for_conditions": []
  },
  {
    "id": "topo_ultrafly_5",
    "brand": "Topo",
    "model": "Ultrafly 5",
    "year": 2026,
    "price_usd": 160,
    "category": "stability_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 10.4,
      "drop_mm": 5,
      "stack_heel_mm": 32,
      "stack_forefoot_mm": 27,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "stability",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 6,
      "energy_return": 6,
      "rocker": 5,
      "toe_box_width": 8,
      "upper_softness": 6,
      "removable_insole": true,
      "midfoot_support": true
    },
    "tech": [
      "Y-Frame medial support",
      "ZipFoam",
      "Anatomical fit"
    ],
    "good_for_conditions": [
      "overpronation_mild",
      "flat_feet_flexible",
      "bunions",
      "wide_feet"
    ],
    "summary": "Rare low-drop stability with Y-Frame medial support.",
    "avoid_for_conditions": []
  },
  {
    "id": "topo_fli_lyte_6",
    "brand": "Topo",
    "model": "Fli-Lyte 6",
    "year": 2026,
    "price_usd": 120,
    "category": "lightweight_daily",
    "use_cases": [
      "daily_versatile",
      "tempo",
      "gym"
    ],
    "specs": {
      "weight_oz": 8,
      "drop_mm": 3,
      "stack_heel_mm": 23,
      "stack_forefoot_mm": 20,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 7,
      "cushioning_level": 5,
      "cushioning_firmness": 6,
      "energy_return": 6,
      "rocker": 3,
      "toe_box_width": 8,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "ZipFoam",
      "Low stack",
      "Anatomical fit"
    ],
    "good_for_conditions": [
      "bunions",
      "wide_feet"
    ],
    "avoid_for_conditions": [
      "achilles_tendinitis"
    ],
    "summary": "Low-stack 3mm drop versatile."
  },
  {
    "id": "topo_st_4",
    "brand": "Topo",
    "model": "ST-4",
    "year": 2026,
    "price_usd": 110,
    "category": "lightweight_daily",
    "use_cases": [
      "gym",
      "intervals",
      "race_5k_10k"
    ],
    "specs": {
      "weight_oz": 6.8,
      "drop_mm": 0,
      "stack_heel_mm": 18,
      "stack_forefoot_mm": 18,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 4,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 9,
      "cushioning_level": 3,
      "cushioning_firmness": 7,
      "energy_return": 5,
      "rocker": 2,
      "toe_box_width": 8,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "EVA",
      "Zero drop",
      "Minimal cushioning"
    ],
    "good_for_conditions": [
      "bunions"
    ],
    "avoid_for_conditions": [
      "achilles_tendinitis"
    ],
    "summary": "Topo's most minimal. Speedwork or barefoot transitions."
  },
  {
    "id": "topo_trailventure_3",
    "brand": "Topo",
    "model": "Trailventure 3",
    "year": 2026,
    "price_usd": 160,
    "category": "trail_neutral",
    "use_cases": [
      "trail_technical",
      "trail_ultra",
      "walking"
    ],
    "specs": {
      "weight_oz": 11,
      "drop_mm": 5,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 25,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 9,
      "midsole_flexibility": 4,
      "cushioning_level": 7,
      "cushioning_firmness": 6,
      "energy_return": 6,
      "rocker": 4,
      "toe_box_width": 8,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "ZipFoam",
      "Vibram XS Trek",
      "Mid-cut for ankle support"
    ],
    "good_for_conditions": [
      "bunions",
      "wide_feet"
    ],
    "summary": "Mid-cut hike/trail with ankle support.",
    "avoid_for_conditions": []
  },
  {
    "id": "topo_ultraventure_4",
    "brand": "Topo",
    "model": "Ultraventure 4",
    "year": 2026,
    "price_usd": 170,
    "category": "trail_max_cushion",
    "use_cases": [
      "trail_easy",
      "trail_ultra"
    ],
    "specs": {
      "weight_oz": 10.4,
      "drop_mm": 5,
      "stack_heel_mm": 35,
      "stack_forefoot_mm": 30,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 4,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 6,
      "rocker": 6,
      "toe_box_width": 8,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "ZipFoam",
      "Vibram Megagrip",
      "Anatomical fit"
    ],
    "good_for_conditions": [
      "bunions",
      "wide_feet"
    ],
    "summary": "Max-cushion ultra trail with Vibram.",
    "avoid_for_conditions": []
  },
  {
    "id": "puma_velocity_nitro_4",
    "brand": "PUMA",
    "model": "Velocity Nitro 4",
    "year": 2026,
    "price_usd": 140,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 9.5,
      "drop_mm": 8,
      "stack_heel_mm": 32,
      "stack_forefoot_mm": 24,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 6,
      "cushioning_level": 7,
      "cushioning_firmness": 6,
      "energy_return": 7,
      "rocker": 5,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "NITRO foam",
      "PUMAGRIP outsole"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "PUMA's daily workhorse. Snappy + grippy.",
    "avoid_for_conditions": []
  },
  {
    "id": "puma_magnify_nitro_3",
    "brand": "PUMA",
    "model": "Magnify Nitro 3",
    "year": 2026,
    "price_usd": 150,
    "category": "max_cushion_neutral",
    "use_cases": [
      "daily_easy",
      "long_run"
    ],
    "specs": {
      "weight_oz": 10.4,
      "drop_mm": 9,
      "stack_heel_mm": 38,
      "stack_forefoot_mm": 29,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 4,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 8,
      "rocker": 6,
      "toe_box_width": 5,
      "upper_softness": 7,
      "removable_insole": true
    },
    "tech": [
      "NITRO PEBA-blend foam",
      "PUMAGRIP",
      "Plush upper"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches",
      "plantar_fasciitis"
    ],
    "summary": "PEBA daily at $150.",
    "avoid_for_conditions": []
  },
  {
    "id": "puma_magmax_nitro_2",
    "brand": "PUMA",
    "model": "MagMax Nitro 2",
    "year": 2026,
    "price_usd": 170,
    "category": "max_cushion_premium",
    "use_cases": [
      "daily_easy",
      "long_run",
      "walking"
    ],
    "specs": {
      "weight_oz": 11,
      "drop_mm": 10.5,
      "stack_heel_mm": 45.5,
      "stack_forefoot_mm": 35,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 9,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 3,
      "cushioning_level": 10,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 7,
      "toe_box_width": 5,
      "upper_softness": 7,
      "removable_insole": true,
      "wide_base": true
    },
    "tech": [
      "NITRO foam",
      "PUMAGRIP",
      "Wide stable platform"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "heavy_runner",
      "plantar_fasciitis",
      "stress_fracture_history"
    ],
    "summary": "Max stack with stability features.",
    "avoid_for_conditions": []
  },
  {
    "id": "puma_foreverrun_nitro_2",
    "brand": "PUMA",
    "model": "ForeverRun Nitro 2",
    "year": 2026,
    "price_usd": 150,
    "category": "stability_daily",
    "use_cases": [
      "daily_easy",
      "daily_versatile"
    ],
    "specs": {
      "weight_oz": 10.6,
      "drop_mm": 8,
      "stack_heel_mm": 35,
      "stack_forefoot_mm": 27,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "stability",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 5,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": true,
      "midfoot_support": true,
      "wide_base": true
    },
    "tech": [
      "RunGuide System (dual-density NITRO)",
      "PUMAGRIP",
      "Asymmetric heel"
    ],
    "good_for_conditions": [
      "flat_feet_flexible",
      "overpronation_mild",
      "heavy_runner"
    ],
    "summary": "Modern guidance with dual-density.",
    "avoid_for_conditions": []
  },
  {
    "id": "puma_liberate_nitro_2",
    "brand": "PUMA",
    "model": "Liberate Nitro 2",
    "year": 2026,
    "price_usd": 120,
    "category": "lightweight_daily",
    "use_cases": [
      "intervals",
      "race_5k_10k",
      "tempo"
    ],
    "specs": {
      "weight_oz": 6.9,
      "drop_mm": 5,
      "stack_heel_mm": 24,
      "stack_forefoot_mm": 19,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 7,
      "cushioning_level": 4,
      "cushioning_firmness": 6,
      "energy_return": 7,
      "rocker": 5,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "NITRO foam",
      "PUMAGRIP",
      "Lightweight upper"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "PUMA's lightest. Sub-7oz speed shoe.",
    "avoid_for_conditions": []
  },
  {
    "id": "puma_electrify_nitro_3",
    "brand": "PUMA",
    "model": "Electrify Nitro 3",
    "year": 2026,
    "price_usd": 90,
    "category": "neutral_daily",
    "use_cases": [
      "daily_easy"
    ],
    "specs": {
      "weight_oz": 9.4,
      "drop_mm": 8,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 22,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 5,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 6,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 6,
      "rocker": 4,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "NITRO",
      "PUMAGRIP"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Sub-$100 PUMA NITRO entry.",
    "avoid_for_conditions": []
  },
  {
    "id": "puma_deviate_nitro_4",
    "brand": "PUMA",
    "model": "Deviate Nitro 4",
    "year": 2026,
    "price_usd": 160,
    "category": "super_trainer",
    "use_cases": [
      "tempo",
      "long_run",
      "race_half"
    ],
    "specs": {
      "weight_oz": 9,
      "drop_mm": 8,
      "stack_heel_mm": 38,
      "stack_forefoot_mm": 30,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 4,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 9,
      "rocker": 7,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": false
    },
    "tech": [
      "NITRO ELITE foam",
      "PWRPLATE carbon-composite",
      "PUMAGRIP ATR"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Carbon trainer. Versatile workout-day shoe.",
    "avoid_for_conditions": []
  },
  {
    "id": "puma_deviate_nitro_elite_4",
    "brand": "PUMA",
    "model": "Deviate Nitro Elite 4",
    "year": 2026,
    "price_usd": 230,
    "category": "carbon_racer",
    "use_cases": [
      "race_5k_10k",
      "race_half",
      "race_marathon"
    ],
    "specs": {
      "weight_oz": 6,
      "drop_mm": 8,
      "stack_heel_mm": 39,
      "stack_forefoot_mm": 31,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 3,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 10,
      "rocker": 8,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false,
      "wide_base": true
    },
    "tech": [
      "NITRO ELITE Aliphatic-TPU",
      "Carbon plate",
      "PUMAGRIP"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "170g featherweight carbon racer. Stable.",
    "avoid_for_conditions": []
  },
  {
    "id": "puma_fast_r_nitro_elite_3",
    "brand": "PUMA",
    "model": "Fast-R Nitro Elite 3",
    "year": 2026,
    "price_usd": 260,
    "category": "carbon_racer",
    "use_cases": [
      "race_5k_10k",
      "race_half",
      "race_marathon"
    ],
    "specs": {
      "weight_oz": 9.2,
      "drop_mm": 8,
      "stack_heel_mm": 40,
      "stack_forefoot_mm": 32,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 5,
      "midsole_flexibility": 3,
      "cushioning_level": 9,
      "cushioning_firmness": 4,
      "energy_return": 10,
      "rocker": 10,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "NITRO ELITE",
      "Decoupled split midsole",
      "Carbon plate",
      "PUMAGRIP"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Bouncy + aggressive split midsole racer.",
    "avoid_for_conditions": []
  },
  {
    "id": "puma_deviate_nitro_elite_trail",
    "brand": "PUMA",
    "model": "Deviate Nitro Elite Trail",
    "year": 2026,
    "price_usd": 230,
    "category": "trail_carbon_racer",
    "use_cases": [
      "trail_technical",
      "trail_ultra"
    ],
    "specs": {
      "weight_oz": 9.6,
      "drop_mm": 8,
      "stack_heel_mm": 38,
      "stack_forefoot_mm": 30,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 6,
      "midsole_flexibility": 3,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 9,
      "rocker": 8,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": false
    },
    "tech": [
      "NITRO ELITE",
      "Carbon plate",
      "PUMAGRIP ATR"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Carbon trail racer.",
    "avoid_for_conditions": []
  },
  {
    "id": "salomon_speedcross_6",
    "brand": "Salomon",
    "model": "Speedcross 6",
    "year": 2026,
    "price_usd": 140,
    "category": "trail_technical",
    "use_cases": [
      "trail_technical"
    ],
    "specs": {
      "weight_oz": 10.6,
      "drop_mm": 10,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 20,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 8,
      "heel_counter_rigidity": 9,
      "midsole_flexibility": 4,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 5,
      "rocker": 4,
      "toe_box_width": 4,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "EnergyCell+ EVA",
      "Aggressive 5mm chevron lugs",
      "Quicklace",
      "SensiFit"
    ],
    "good_for_conditions": [
      "narrow_feet"
    ],
    "avoid_for_conditions": [
      "wide_feet",
      "bunions"
    ],
    "summary": "Iconic mud and soft-trail shoe. Snug fit."
  },
  {
    "id": "salomon_aero_glide_4",
    "brand": "Salomon",
    "model": "Aero Glide 4",
    "year": 2026,
    "price_usd": 160,
    "category": "max_cushion_neutral",
    "use_cases": [
      "daily_easy",
      "long_run"
    ],
    "specs": {
      "weight_oz": 9,
      "drop_mm": 8,
      "stack_heel_mm": 38,
      "stack_forefoot_mm": 30,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 6,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 4,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 8,
      "rocker": 7,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": false
    },
    "tech": [
      "Energy Foam (PEBA)",
      "Rocker geometry"
    ],
    "good_for_conditions": [
      "neutral_arch",
      "high_arches"
    ],
    "summary": "Salomon's road max-cushion. Bouncy + plush.",
    "avoid_for_conditions": []
  },
  {
    "id": "salomon_genesis",
    "brand": "Salomon",
    "model": "Genesis",
    "year": 2026,
    "price_usd": 150,
    "category": "trail_neutral",
    "use_cases": [
      "trail_easy",
      "trail_technical"
    ],
    "specs": {
      "weight_oz": 9.8,
      "drop_mm": 8,
      "stack_heel_mm": 33,
      "stack_forefoot_mm": 25,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 5,
      "cushioning_level": 7,
      "cushioning_firmness": 6,
      "energy_return": 6,
      "rocker": 5,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "EnergyCell",
      "Contagrip outsole",
      "Quicklace"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Versatile mid-range trail.",
    "avoid_for_conditions": []
  },
  {
    "id": "salomon_pulsar_trail",
    "brand": "Salomon",
    "model": "Pulsar Trail",
    "year": 2026,
    "price_usd": 140,
    "category": "trail_neutral",
    "use_cases": [
      "trail_easy",
      "trail_technical"
    ],
    "specs": {
      "weight_oz": 9,
      "drop_mm": 8,
      "stack_heel_mm": 30,
      "stack_forefoot_mm": 22,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 7,
      "midsole_flexibility": 5,
      "cushioning_level": 6,
      "cushioning_firmness": 6,
      "energy_return": 6,
      "rocker": 5,
      "toe_box_width": 5,
      "upper_softness": 5,
      "removable_insole": true
    },
    "tech": [
      "EnergyCell+",
      "Contagrip MA",
      "Quicklace"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Lightweight trail performance.",
    "avoid_for_conditions": []
  },
  {
    "id": "salomon_slab_ultra_glide",
    "brand": "Salomon",
    "model": "S/Lab Ultra Glide",
    "year": 2026,
    "price_usd": 200,
    "category": "trail_max_cushion",
    "use_cases": [
      "trail_ultra",
      "trail_easy"
    ],
    "specs": {
      "weight_oz": 10.4,
      "drop_mm": 6,
      "stack_heel_mm": 36,
      "stack_forefoot_mm": 30,
      "widths": [
        "regular"
      ]
    },
    "biomech": {
      "stability_level": "neutral",
      "torsional_rigidity": 7,
      "heel_counter_rigidity": 8,
      "midsole_flexibility": 4,
      "cushioning_level": 8,
      "cushioning_firmness": 5,
      "energy_return": 7,
      "rocker": 7,
      "toe_box_width": 5,
      "upper_softness": 6,
      "removable_insole": true
    },
    "tech": [
      "Energy Foam",
      "Contagrip",
      "Lab-developed for elites"
    ],
    "good_for_conditions": [
      "neutral_arch"
    ],
    "summary": "Pro-grade max-cushion trail ultra.",
    "avoid_for_conditions": []
  }
];