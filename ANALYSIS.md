# STRIDE PROTOCOL — DEEP ANALYSIS
## Evidence-Based Upgrade Plan for the Shoe Recommendation Engine

---

## 1. WHAT THE RESEARCH ACTUALLY SAYS

### Paper 1: Jackson et al. (2025) — *Footwear Recommendations for Runners*
Auckland University of Technology / Physical Therapy in Sport

**264 podiatrists, physiotherapists, retailers, and running coaches surveyed.**

Key findings that directly challenge or validate our current model:

| Finding | Impact on our system |
|---|---|
| **Comfort is #1 factor (93% of experts)** | We don't ask about cushioning preference at all |
| **Cushioning is #1 shoe characteristic for injury management (94%)** | Our scoring barely weights cushioning level |
| **Previous injury is the #1 risk factor for new injury (87%)** | We only ask about CURRENT injury, not history |
| **Shoe/upper width rated 95% for comfort** | No width question in quiz |
| **Forefoot stiffness rated 93% for comfort** | Not surfaced to user |
| **Body weight influences cushioning needs (Malisoux et al.)** | Not asked — completely missing |
| **Pronation model is CONTESTED** | Our quiz leads with arch + pronation — outdated approach |
| **Carbon plates discussed by only 17% of experts** | Underweighted in our scoring |
| **Minimalist shoes discussed by only 12% of experts** | High-risk category needs flagging |

**"Comfortable footwear is often associated with being more protective" — Nigg et al., 2015 (comfort filter theory)**
→ We have no comfort preference signal at all.

**"One of the most unanimously accepted risk factors for RRI is a previous injury"**
→ We ask about current pain only. History is the #1 predictor of future injury.

**"Weight was reported as one of the considerations LEAST likely to influence recommendations" by retailers — but evidence shows it should be the opposite for cushioning.**
→ Body mass significantly changes which cushioning level is appropriate (Malisoux et al., 2020 RCT: 848 runners).

### Paper 2: de Jong et al. (2022) — *Orthopedic Footwear & Postural Stability*
Sint Maartenskliniek / Clinical Biomechanics

Focused on HMSN (nerve disease) patients, but provides biomechanical framework directly applicable to our shoe database scoring:

- **Forefoot apex position (rocker location)** → our `biomech.rocker` field maps to this
- **Heel counter height and rigidity** → our `biomech.heel_counter_rigidity` maps to this
- **Frontal plane stability** → relates to `biomech.stability_level` and torsional rigidity
- **Shaft height / ankle support** → trail shoe upper height considerations
- Confirms that **heel landing at initial contact** is a key gait quality metric → heel drop matters

---

## 2. CURRENT SYSTEM AUDIT — WHAT'S BROKEN

### 2.1 Quiz Questions (5 questions)

```
Q1: terrain (road/trail)          ✓ Correct but incomplete
Q2: archType (flat/normal/high)   ⚠ Oversimplified, research says weak predictor alone
Q3: pronation (over/neutral/under) ✗ Outdated as PRIMARY signal — research says limited evidence
Q4: injury (current, 4 options)   ⚠ Missing injury HISTORY, too few injury types
Q5: goal (daily/speed/race)        ✓ Correct but missing nuance
```

**Problems:**
- Asking pronation as Q3 implies it's the 3rd most important factor. Research says it's contested.
- No body weight question — directly affects cushioning recommendation (RCT evidence)
- No experience/mileage question — beginner vs. 70km/week veteran need totally different shoes
- No foot width question — 95% of experts consider width crucial for comfort
- No cushioning preference — "comfort filter" theory says this is the strongest predictor
- No previous injury history — #1 epidemiological risk factor for new injury
- Only 4 injury types — missing Achilles, IT band, stress fracture, bunions, metatarsalgia
- No orthotic use question — changes which shoes are compatible
- No heel drop history question — transitions cause Achilles issues

### 2.2 Scoring Algorithm — What's Broken

```typescript
// CURRENT: Matches conditions[] (old field that no longer exists)
const matchedConditions = shoe.conditions.filter(c => targetConditions.includes(c));
// → Now uses good_for_conditions ✓ (fixed)

// CURRENT: Terrain match is binary road/trail
// MISSING: Trail sub-type (groomed vs. technical), road sub-type (concrete/track/treadmill)

// CURRENT: Body weight has zero influence on score
// MISSING: Light runners (<60kg) need different cushioning than heavy runners (>90kg)

// CURRENT: Experience has zero influence  
// MISSING: Beginners should not be recommended carbon plates or zero-drop shoes

// CURRENT: Width compatibility has zero influence
// MISSING: Wide-footed runners penalised in narrow shoes — blister/black toenail risk
```

**Scoring gaps:**

| Missing signal | Evidence source | How it should affect score |
|---|---|---|
| Body weight | Malisoux et al. RCT (848 runners) | Heavy runners: +2 cushioning, firm midsole; light runners: soft ok |
| Previous injury | Burke et al., Fokkema et al. | +3 if shoe targets the historic injury site |
| Running experience | Clinical consensus | Block carbon/zero-drop for beginners |
| Weekly mileage | Training load theory | High mileage (>60km/wk): durability + daily rotation shoe |
| Cushioning preference | Nigg 2015 comfort filter | Strong subjective signal — overrides biomechanical prediction |
| Foot width | 95% of experts | Width availability match required |
| Heel drop history | De Jong et al. biomechanics | Switching >4mm drop = Achilles risk flag |

---

## 3. WHAT A PROPER ML MODEL NEEDS

### 3.1 Expanded Feature Set (Input Variables)

**Tier 1 — High Evidence Weight (from research)**
```
body_weight_kg        : number   — Malisoux RCT shows strong cushioning interaction
previous_injury       : string[] — #1 risk factor for new injury (Burke et al.)
current_injury        : string[] — expanded to 10+ options
comfort_pref          : 'soft' | 'medium' | 'firm'  — comfort filter theory (Nigg 2015)
foot_width            : 'narrow' | 'regular' | 'wide' | 'extra_wide'
```

**Tier 2 — Moderate Evidence Weight**
```
weekly_km             : number   — training load / injury risk modifier
experience_years      : number   — blocks dangerous shoes for novices
current_drop_mm       : number   — detects risky heel drop transitions
orthotic_user         : boolean  — compatibility filter
terrain               : string   — road | trail_groomed | trail_technical | track | treadmill
```

**Tier 3 — Lower Evidence Weight (still useful)**
```
arch_type             : string   — keep but demote from Q2 to Q4
pronation             : string   — keep but demote, add "I don't know" option
goal                  : string   — keep as-is
age_range             : string   — influences recovery needs, cushioning
```

### 3.2 Decision Tree Logic (What the Research Supports)

The research-backed priority order for shoe selection:

```
ROOT
├── 1. SAFETY GATE: Current injury?
│   ├── YES → injury-specific biomechanical filter first
│   │         (heel_counter for PF, high_drop for Achilles, stability for shin splints)
│   └── NO → proceed to risk factors
│
├── 2. RISK FACTORS: Previous injury? (strongest predictor)
│   ├── YES → weight previous-injury-targeted shoes by +3
│   └── NO → proceed to comfort
│
├── 3. COMFORT SIGNAL: Cushioning preference?  ← This is what research says is #1
│   ├── Soft → cushioning_level 7-10, cushioning_firmness 3-5
│   ├── Medium → cushioning_level 5-8, cushioning_firmness 4-6
│   └── Firm → cushioning_level 4-7, cushioning_firmness 6-8
│
├── 4. BODY WEIGHT MODIFIER:
│   ├── <60kg light → soft shoes more beneficial, less need for firm base
│   ├── 60-90kg medium → standard scoring
│   └── >90kg heavy → firm midsole +2, wide_base required, penalise soft max-stack
│
├── 5. EXPERIENCE GATE:
│   ├── <1yr beginner → BLOCK carbon plate, zero-drop, minimalist
│   ├── 1-3yr intermediate → flag carbon/zero-drop with warning
│   └── >3yr experienced → no restrictions
│
├── 6. TERRAIN + GOAL → (existing logic, refined)
│
└── 7. BIOMECHANICAL FILTERS (arch/pronation — last, not first):
    ├── Flat + overpronation → stability/guidance
    ├── High arch → neutral + cushioned
    └── Neutral → full range
```

### 3.3 Shoe Database Scoring Improvements

The new `shoes.ts` has rich biomechanical data we're barely using:

| Field | Currently used | Should be used for |
|---|---|---|
| `biomech.cushioning_firmness` | ✗ | Comfort preference matching |
| `biomech.rocker` | ✗ | Plantar fasciitis + metatarsalgia scoring |
| `biomech.energy_return` | ✗ | Speed/race goal scoring |
| `biomech.removable_insole` | ✗ | Orthotic user matching |
| `biomech.wide_base` | ✗ | Heavy runner scoring |
| `biomech.toe_box_width` | ✗ | Foot width matching |
| `biomech.heel_counter_rigidity` | ✗ | Plantar fasciitis + overpronation scoring |
| `biomech.torsional_rigidity` | ✗ | Flat foot + stability scoring |
| `biomech.midsole_flexibility` | ✗ | High arch + trail scoring |
| `specs.widths` | ✗ | Foot width compatibility filter |
| `specs.drop_mm` | Partially | Drop transition risk detection |
| `avoid_for_conditions` | ✗ | Hard penalty scoring |

**14 out of 16 biomechanical fields in the database are completely unused in scoring.**

---

## 4. REDESIGNED QUIZ — 7 QUESTIONS

Evidence-ranked, replacing the outdated pronation-first approach:

```
Q1: terrain           — Where do you run? (road/trail-groomed/trail-technical/track)
Q2: goal              — What are you training for? (easy base/tempo/race/walking)  
Q3: comfort_pref      — How do you like your shoes to feel? (soft-plush/medium/firm-responsive)
                        ← #1 predictor per Nigg 2015 comfort filter theory
Q4: body_weight       — Your weight range? (under 60kg / 60-80kg / 80-100kg / over 100kg)
                        ← Malisoux RCT: strong cushioning interaction
Q5: injury_status     — Current pain? (expanded: none/knee/plantar/achilles/shin/IT band/foot/other)
                        + sub-question: any injury history in last 12 months?
Q6: experience        — How long have you been running? (<6 months / 6mo-2yr / 2-5yr / 5yr+)
                        + weekly km estimate
Q7: foot_profile      — Foot width + arch type (combined question, width primary)
                        Optional: current shoe drop (to detect risky transitions)
```

**Pronation moves from Q3 to optional/advanced — consistent with research showing it's a weak predictor alone.**

---

## 5. SCORING FUNCTION REDESIGN

### 5.1 Weighted Scoring Architecture

Replace the current flat +score system with a weighted multi-factor model:

```typescript
interface QuizAnswers {
  // Tier 1 — high weight
  comfort_pref: 'soft' | 'medium' | 'firm';
  body_weight: 'light' | 'medium' | 'heavy' | 'very_heavy';
  injury_current: string[];
  injury_history: string[];

  // Tier 2 — moderate weight  
  terrain: 'road' | 'trail_groomed' | 'trail_technical' | 'track';
  goal: 'easy_base' | 'tempo' | 'race' | 'walking';
  experience: 'beginner' | 'intermediate' | 'experienced' | 'advanced';
  weekly_km: 'low' | 'moderate' | 'high' | 'very_high';

  // Tier 3 — lower weight (moved here from Q1-3)
  foot_width: 'narrow' | 'regular' | 'wide' | 'extra_wide';
  arch_type: 'flat' | 'normal' | 'high';
  current_drop_mm?: number;  // for transition risk detection
  orthotic_user: boolean;
}
```

### 5.2 Biomechanical Match Scoring

```typescript
function scoreBiomechanical(shoe: Shoe, answers: QuizAnswers): number {
  let score = 0;

  // CUSHIONING PREFERENCE (comfort filter — highest weight per research)
  const firmness = shoe.biomech.cushioning_firmness; // 1-10
  if (answers.comfort_pref === 'soft' && firmness <= 4) score += 5;
  if (answers.comfort_pref === 'medium' && firmness >= 4 && firmness <= 6) score += 5;
  if (answers.comfort_pref === 'firm' && firmness >= 6) score += 5;
  // Mismatch penalty
  if (answers.comfort_pref === 'soft' && firmness >= 7) score -= 4;
  if (answers.comfort_pref === 'firm' && firmness <= 3) score -= 4;

  // BODY WEIGHT × CUSHIONING (Malisoux RCT)
  const cushLevel = shoe.biomech.cushioning_level;
  if (answers.body_weight === 'heavy' || answers.body_weight === 'very_heavy') {
    if (shoe.biomech.wide_base) score += 3;
    if (firmness >= 5) score += 2; // firm support for heavy runners
    if (firmness <= 3 && cushLevel >= 9) score -= 3; // mushy max-stack = bad for heavy
  }
  if (answers.body_weight === 'light') {
    if (cushLevel >= 7 && firmness <= 5) score += 2; // soft cushion fine for light runners
  }

  // ENERGY RETURN × GOAL
  if (answers.goal === 'race' || answers.goal === 'tempo') {
    score += Math.round(shoe.biomech.energy_return * 0.5); // 0-5 bonus
  }

  // ROCKER × INJURY
  if (answers.injury_current.includes('plantar_fasciitis') || 
      answers.injury_history.includes('plantar_fasciitis')) {
    score += shoe.biomech.rocker; // 0-10 rocker bonus
  }
  if (answers.injury_current.includes('metatarsalgia')) {
    if (shoe.biomech.rocker >= 7) score += 4;
  }

  // HEEL COUNTER × INJURY  
  if (answers.injury_current.includes('plantar_fasciitis') ||
      answers.injury_current.includes('overpronation')) {
    score += Math.round(shoe.biomech.heel_counter_rigidity * 0.4);
  }

  // TORSIONAL RIGIDITY × ARCH TYPE
  if (answers.arch_type === 'flat') {
    score += Math.round(shoe.biomech.torsional_rigidity * 0.4);
  }

  // WIDTH COMPATIBILITY (95% of experts rate as critical for comfort)
  if (answers.foot_width === 'wide' || answers.foot_width === 'extra_wide') {
    if (shoe.specs.widths.some(w => ['wide', 'extra_wide', '2E', '4E'].includes(w))) {
      score += 4; // width available = strong positive
    } else {
      score -= 5; // no wide option = strong negative
    }
    if (shoe.biomech.toe_box_width >= 7) score += 2;
  }
  if (answers.foot_width === 'narrow') {
    if (shoe.specs.widths.includes('narrow') || shoe.specs.widths.includes('2A')) score += 2;
  }

  // ORTHOTIC COMPATIBILITY
  if (answers.orthotic_user && shoe.biomech.removable_insole) score += 4;
  if (answers.orthotic_user && !shoe.biomech.removable_insole) score -= 3;

  // EXPERIENCE SAFETY GATE
  if (answers.experience === 'beginner') {
    if (['carbon_plate_racing', 'super_trainer'].includes(shoe.category)) score -= 8;
    if (shoe.specs.drop_mm <= 2) score -= 6; // zero/low drop dangerous for beginners
  }

  // DROP TRANSITION RISK
  if (answers.current_drop_mm !== undefined) {
    const dropDiff = Math.abs(shoe.specs.drop_mm - answers.current_drop_mm);
    if (dropDiff > 4) score -= 3; // large transition = injury risk
    if (dropDiff > 8) score -= 6; // extreme transition = high risk
  }

  return score;
}
```

---

## 6. MISSING INJURY TYPES

Current quiz has 4 options. Clinical consensus from research supports at least 10:

| Condition | Biomechanical key | Primary shoe attributes needed |
|---|---|---|
| Plantar fasciitis | Heel off-loading, arch support | High drop (8-12mm), rocker ≥6, firm heel counter |
| Achilles tendinopathy | Reduce tendon stretch | High drop (10-12mm), avoid zero/low drop |
| Runner's knee (PFPS) | Alignment, cushioning | Guidance/neutral + cushioning ≥6 |
| Shin splints (MTSS) | Reduce tibial stress | Guidance/stability, cushioning ≥6 |
| IT band syndrome | Avoid varus bias | Neutral only, cushioning ≥6, avoid medial post |
| Metatarsalgia | Forefoot offload | Rocker ≥7, forefoot stack ≥25mm |
| Morton's neuroma | No toe compression | Wide toe box ≥8, rocker ≥6 |
| Stress fracture (recovering) | Impact reduction | Max cushioning, no carbon plate |
| Bunions | No lateral pressure | Wide toe box, soft upper ≥7 |
| Hip pain / IT band | Pelvis mechanics | Neutral stability only |

---

## 7. DATA WE NEED TO COLLECT FOR FUTURE ML TRAINING

The papers emphasise that individualised recommendation requires more data. To train a real ML model, we'd want to log:

```typescript
interface RunnerProfile {
  // Inputs (quiz answers)
  answers: ExtendedQuizAnswers;

  // Shoe selected from recommendations
  shoe_chosen_id: string;

  // Outcome signals (collected later via check-in)
  satisfaction_rating?: 1|2|3|4|5;     // comfort rating after 4 weeks
  injury_developed?: string | null;     // new injury in 3 months
  miles_run_in_shoe?: number;           // engagement signal
  would_recommend?: boolean;

  // Implicit signals
  time_to_decision_ms: number;          // decision confidence proxy
  recommendations_viewed: number;       // how many they browsed
}
```

With ~500 runner profiles + outcomes, a Random Forest or Gradient Boosting model could rank-order recommendations better than the current hand-written heuristic scoring. The decision tree in the current `matchRule()` coach system is the right architectural pattern — it just needs to be data-trained rather than hand-written.

---

## 8. SUMMARY — PRIORITY ORDER FOR IMPLEMENTATION

| Priority | Change | Research basis |
|---|---|---|
| 🔴 1 | Add cushioning preference question | Nigg 2015 comfort filter, #1 factor per 93% of experts |
| 🔴 2 | Add body weight question | Malisoux RCT (848 runners), strong interaction with cushioning |
| 🔴 3 | Use all 16 biomech fields in scoring | 14/16 currently unused |
| 🟠 4 | Add previous injury history | Burke et al., Fokkema et al. — #1 risk predictor |
| 🟠 5 | Expand injury options to 10 types | Clinical completeness |
| 🟠 6 | Add foot width question + scoring | 95% of experts rate width as critical for comfort |
| 🟡 7 | Add experience/mileage question | Safety gate for carbon/zero-drop |
| 🟡 8 | Demote pronation question to last | Research shows limited standalone predictive value |
| 🟡 9 | Add orthotic use question | Removable insole compatibility filter |
| 🟡 10 | Drop transition risk detection | Biomechanical Achilles safety |
| ⚪ 11 | Outcome logging for future ML training | Foundation for data-driven model |

---

*Analysis based on: Jackson et al. 2025 (Physical Therapy in Sport), de Jong et al. 2022 (Clinical Biomechanics), Malisoux et al. 2020 (AJSM), Nigg et al. 2015 (BJSM), Burke et al. 2023, Fokkema et al. 2023*
