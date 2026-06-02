import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { QuizAnswers, InjuryCurrent, InjuryHistory, getAllBrands } from '../app/utils/scoring';
import { SHOES } from '../app/data/shoes';

const { width } = Dimensions.get('window');

// ─── Step types ─────────────────────────────────────────────────────────────

type SingleStep = {
  kind: 'single';
  id: keyof QuizAnswers;
  question: string;
  subtext?: string;
  badge?: string;
  options: { value: any; label: string; sublabel?: string }[];
};

type MultiStep = {
  kind: 'multi';
  id: keyof QuizAnswers;
  question: string;
  subtext?: string;
  badge?: string;
  noneValue: string;
  options: { value: string; label: string; sublabel?: string }[];
};

type ToggleStep = {
  kind: 'toggle';
  id: keyof QuizAnswers;
  question: string;
  subtext?: string;
  badge?: string;
  options: { value: boolean; label: string; sublabel?: string }[];
};

type BrandStep = {
  kind: 'brand';
  id: 'brand_pref';
  question: string;
  subtext?: string;
};

type QuizStep = SingleStep | MultiStep | ToggleStep | BrandStep;

// ─── Step definitions ────────────────────────────────────────────────────────

const STEP_TERRAIN: SingleStep = {
  kind: 'single',
  id: 'terrain',
  question: 'Where will you mainly run?',
  subtext: 'Surface determines sole construction, grip pattern, and rock protection.',
  options: [
    { value: 'road', label: 'Road / Pavement', sublabel: 'Streets, sidewalks, treadmill' },
    { value: 'trail_groomed', label: 'Groomed Trails', sublabel: 'Packed dirt, light terrain' },
    { value: 'trail_technical', label: 'Technical Trails', sublabel: 'Rocks, roots, steep terrain' },
    { value: 'track', label: 'Track / Synthetic', sublabel: 'Oval track, synthetic surface' },
  ],
};

const STEP_GOAL: SingleStep = {
  kind: 'single',
  id: 'goal',
  question: 'What are you training for?',
  subtext: 'Your goal determines the right balance of cushion, weight, and energy return.',
  options: [
    { value: 'easy_base', label: 'Easy Base Miles', sublabel: 'Recovery runs, daily mileage' },
    { value: 'tempo', label: 'Speed & Tempo', sublabel: 'Intervals, tempo, threshold runs' },
    { value: 'race', label: 'Race Day', sublabel: '5K, half marathon, marathon PR' },
    { value: 'walking', label: 'Walking / Casual', sublabel: 'All-day comfort, light activity' },
  ],
};


const STEP_PRIORITY: SingleStep = {
  kind: 'single',
  id: 'priority',
  question: 'What matters most for this shoe?',
  subtext: 'This is the real fitter question. It tells us whether to protect, comfort, speed up, or save money.',
  badge: '// FITTER MODE',
  options: [
    { value: 'comfort', label: 'Maximum Comfort', sublabel: 'I want the shoe that feels best' },
    { value: 'injury_prevention', label: 'Injury Protection', sublabel: 'I want the safest option for pain/history' },
    { value: 'one_shoe', label: 'One Shoe For Everything', sublabel: 'Daily runs, gym, walking, casual use' },
    { value: 'speed', label: 'Speed / Performance', sublabel: 'Tempo, intervals, race efforts' },
    { value: 'max_cushion', label: 'Maximum Cushion', sublabel: 'Soft, protective, high-stack ride' },
    { value: 'natural', label: 'Natural Feel', sublabel: 'Flexible, lower drop, roomy toe box' },
    { value: 'value', label: 'Best Value', sublabel: 'Good shoe, smart price' },
  ],
};

const STEP_CURRENT_SHOE: SingleStep = {
  kind: 'single',
  id: 'current_shoe_feel',
  question: 'Which shoe feels closest to what you like?',
  subtext: 'This improves accuracy because previous shoe preference is often stronger than arch tests. Pick “None” if unsure.',
  badge: '// SHOE DNA',
  options: [
    { value: 'none', label: 'None / Not Sure', sublabel: 'Use biomechanics only' },
    { value: 'ghost', label: 'Brooks Ghost / similar', sublabel: 'Reliable traditional daily trainer' },
    { value: 'clifton', label: 'HOKA Clifton / similar', sublabel: 'Light, soft, rocker daily trainer' },
    { value: 'bondi', label: 'HOKA Bondi / similar', sublabel: 'Maximum cushion and walking comfort' },
    { value: 'nimbus', label: 'ASICS Nimbus / similar', sublabel: 'Premium plush neutral cushion' },
    { value: 'novablast', label: 'ASICS Novablast / similar', sublabel: 'Bouncy fun daily trainer' },
    { value: 'adrenaline', label: 'Brooks Adrenaline / similar', sublabel: 'Classic mild stability' },
    { value: 'kayano', label: 'ASICS Kayano / similar', sublabel: 'Premium stability support' },
    { value: '1080', label: 'New Balance 1080 / similar', sublabel: 'Soft premium neutral comfort' },
    { value: 'ride', label: 'Saucony Ride / similar', sublabel: 'Balanced daily trainer' },
    { value: 'triumph', label: 'Saucony Triumph / similar', sublabel: 'Premium cushion daily trainer' },
    { value: 'speedgoat', label: 'HOKA Speedgoat / similar', sublabel: 'Cushioned trail grip' },
    { value: 'lone_peak', label: 'Altra Lone Peak / similar', sublabel: 'Zero-drop wide toe box trail' },
    { value: 'endorphin_speed', label: 'Endorphin Speed / similar', sublabel: 'Fast plated trainer' },
    { value: 'superblast', label: 'ASICS Superblast / similar', sublabel: 'Super trainer, big bounce' },
  ],
};

const STEP_WEEKLY_MILEAGE: SingleStep = {
  kind: 'single',
  id: 'weekly_mileage',
  question: 'How much do you run per week?',
  subtext: 'A 5 km/week beginner and a 70 km/week runner should not get the same recommendation.',
  badge: '// LOAD MATCH',
  options: [
    { value: 'low', label: '0–10 km / week', sublabel: 'New runner, casual, or restart' },
    { value: 'moderate', label: '10–30 km / week', sublabel: 'Regular recreational running' },
    { value: 'high', label: '30–60 km / week', sublabel: 'Consistent training load' },
    { value: 'very_high', label: '60+ km / week', sublabel: 'Marathon / high-mileage training' },
  ],
};

const STEP_AVG_PACE: SingleStep = {
  kind: 'single',
  id: 'avg_pace',
  question: 'What is your usual easy-run pace?',
  subtext: 'Pace helps us avoid pushing expensive race shoes to runners who need comfort and protection first.',
  options: [
    { value: 'slow', label: 'Slower than 7:00/km', sublabel: 'Comfort and rocker matter more than low weight' },
    { value: 'easy', label: '6:00–7:00/km', sublabel: 'Easy recreational pace' },
    { value: 'steady', label: '5:00–6:00/km', sublabel: 'Steady trained runner' },
    { value: 'fast', label: '4:00–5:00/km', sublabel: 'Performance matters more' },
    { value: 'elite', label: 'Faster than 4:00/km', sublabel: 'Very fast / competitive' },
    { value: 'unknown', label: 'Not Sure', sublabel: 'Skip this signal' },
  ],
};

const STEP_COMFORT: SingleStep = {
  kind: 'single',
  id: 'comfort_pref',
  question: 'How should your shoes feel underfoot?',
  subtext: 'Comfort preference is the strongest predictor of which shoe works for you (Nigg, 2015).',
  badge: '// #1 PREDICTOR',
  options: [
    { value: 'soft', label: 'Soft & Plush', sublabel: 'Cloud-like, lots of cushion' },
    { value: 'medium', label: 'Balanced Feel', sublabel: 'Not too soft, not too hard' },
    { value: 'firm', label: 'Firm & Responsive', sublabel: 'Snappy, ground connection' },
  ],
};

const STEP_WEIGHT: SingleStep = {
  kind: 'single',
  id: 'body_weight',
  question: 'What is your weight range?',
  subtext: 'Body weight directly affects which cushioning density and midsole is safest.',
  badge: '// MIDSOLE MATCH',
  options: [
    { value: 'light', label: 'Under 60 kg', sublabel: '132 lbs and under' },
    { value: 'medium', label: '60 – 80 kg', sublabel: '132 – 176 lbs' },
    { value: 'heavy', label: '80 – 100 kg', sublabel: '176 – 220 lbs' },
    { value: 'very_heavy', label: 'Over 100 kg', sublabel: '220 lbs and over' },
  ],
};

// NEW v10 — Pronation question (was missing in v6)
const STEP_PRONATION: SingleStep = {
  kind: 'single',
  id: 'pronation',
  question: 'How does your foot roll when you run?',
  subtext: 'Pronation determines whether you need stability features. Check the wear pattern on old shoes: inside-heel wear = overpronation, outside-heel wear = supination.',
  badge: '// STABILITY MATCH',
  options: [
    { value: 'overpronate_severe', label: 'Rolls In a Lot', sublabel: 'Severe overpronation, ankle clearly collapses inward' },
    { value: 'overpronate_mild', label: 'Rolls In Slightly', sublabel: 'Mild overpronation, common pattern' },
    { value: 'neutral', label: 'Stays Neutral', sublabel: 'Foot lands and rolls straight forward' },
    { value: 'supinate', label: 'Rolls Out', sublabel: 'Supination / underpronation, common with high arches' },
    { value: 'unsure', label: "I'm Not Sure", sublabel: "We'll infer from your other answers" },
  ],
};

const STEP_INJURY_CURRENT: MultiStep = {
  kind: 'multi',
  id: 'injury_current',
  question: 'Any current pain or injury?',
  subtext: "Select all that apply. We'll target the biomechanics for each issue.",
  noneValue: 'none',
  options: [
    { value: 'none', label: 'No Issues', sublabel: 'Feeling healthy and strong' },
    { value: 'plantar', label: 'Heel / Arch Pain', sublabel: 'Plantar fasciitis' },
    { value: 'achilles', label: 'Achilles Pain', sublabel: 'Back of heel, tendon area' },
    { value: 'knee', label: 'Knee Pain', sublabel: "Runner's knee, joint pain" },
    { value: 'shin', label: 'Shin Pain', sublabel: 'Shin splints, lower leg stress' },
    { value: 'itband', label: 'IT Band / Hip', sublabel: 'Outer knee, lateral hip' },
    { value: 'metatarsalgia', label: 'Ball of Foot Pain', sublabel: 'Forefoot, metatarsalgia' },
    { value: 'bunions', label: 'Bunions', sublabel: 'Big toe joint enlargement' },
    { value: 'morton_neuroma', label: "Morton's Neuroma", sublabel: 'Between-toe nerve pain' },
    { value: 'other', label: 'Other Issue', sublabel: 'General discomfort' },
  ],
};

const STEP_INJURY_HISTORY: MultiStep = {
  kind: 'multi',
  id: 'injury_history',
  question: 'Any injury in the last 12 months?',
  subtext: "Past injury is the #1 predictor of future injury — we'll build in prevention.",
  badge: '// #1 RISK FACTOR',
  noneValue: 'none',
  options: [
    { value: 'none', label: 'No History', sublabel: 'Clean bill of health' },
    { value: 'plantar', label: 'Plantar Fasciitis', sublabel: 'Heel or arch pain' },
    { value: 'achilles', label: 'Achilles Issues', sublabel: 'Tendon or heel pain' },
    { value: 'knee', label: 'Knee Problems', sublabel: "Runner's knee, PFPS" },
    { value: 'shin', label: 'Shin Splints', sublabel: 'Tibial stress, lower leg' },
    { value: 'itband', label: 'IT Band', sublabel: 'Lateral knee or hip' },
    { value: 'stress_fracture', label: 'Stress Fracture', sublabel: 'Bone stress injury' },
    { value: 'other', label: 'Other', sublabel: 'Other running injury' },
  ],
};

const STEP_EXPERIENCE: SingleStep = {
  kind: 'single',
  id: 'experience',
  question: 'How long have you been running?',
  subtext: 'Experience level determines safe shoe types — some require adaptation first.',
  options: [
    { value: 'beginner', label: 'Just Starting', sublabel: 'Under 6 months' },
    { value: 'intermediate', label: 'Building Up', sublabel: '6 months – 2 years' },
    { value: 'experienced', label: 'Regular Runner', sublabel: '2 – 5 years' },
    { value: 'advanced', label: 'Veteran', sublabel: '5+ years, high mileage' },
  ],
};

const STEP_FOOT_WIDTH: SingleStep = {
  kind: 'single',
  id: 'foot_width',
  question: 'How wide is your foot?',
  subtext: 'Width fit is critical for long-run comfort — affects blisters and fatigue.',
  badge: '// 95% OF EXPERTS RATE CRITICAL',
  options: [
    { value: 'narrow', label: 'Narrow', sublabel: 'Slim, tapered fit' },
    { value: 'regular', label: 'Regular / Medium', sublabel: 'Standard width' },
    { value: 'wide', label: 'Wide', sublabel: 'Broader foot, wide toe box' },
    { value: 'extra_wide', label: 'Extra Wide', sublabel: 'Very wide foot or bunions' },
  ],
};

const STEP_ARCH: SingleStep = {
  kind: 'single',
  id: 'arch_type',
  question: 'What is your arch type?',
  subtext: "Arch height alone doesn't determine pronation, but it helps refine our pick when combined with your pronation answer.",
  options: [
    { value: 'flat', label: 'Flat / Low Arch', sublabel: 'Whole sole contacts the ground' },
    { value: 'normal', label: 'Normal Arch', sublabel: 'Natural curve, moderate contact' },
    { value: 'high', label: 'High Arch', sublabel: 'Pronounced curve, minimal contact' },
    { value: 'unsure', label: "I'm Not Sure", sublabel: "We'll work without this signal" },
  ],
};

// NEW v10 — Drop preference (was missing in v6)
const STEP_DROP: SingleStep = {
  kind: 'single',
  id: 'drop_pref',
  question: 'Heel-to-toe drop preference?',
  subtext: 'Drop is the height difference between heel and forefoot. Higher drop = more familiar/cushioned heel; lower drop = more natural feel. Skip if unsure.',
  options: [
    { value: 'low', label: 'Low Drop (0–5mm)', sublabel: 'Zero-drop or near, natural-feel' },
    { value: 'medium', label: 'Medium Drop (6–8mm)', sublabel: 'Modern sweet spot' },
    { value: 'high', label: 'High Drop (9–12mm)', sublabel: 'Traditional, Achilles-friendly' },
    { value: 'no_pref', label: 'No Preference', sublabel: "I haven't thought about it" },
  ],
};

const STEP_ORTHOTICS: ToggleStep = {
  kind: 'toggle',
  id: 'wears_orthotics',
  question: 'Do you wear custom orthotics?',
  subtext: "We'll only recommend shoes with removable insoles that fit orthotics.",
  options: [
    { value: false, label: 'No, just regular shoes', sublabel: 'No custom inserts' },
    { value: true, label: 'Yes, I use orthotics', sublabel: 'Need removable insole + roomy fit' },
  ],
};

const STEP_BRAND: BrandStep = {
  kind: 'brand',
  id: 'brand_pref',
  question: 'Any preferred brands?',
  subtext: "We'll recommend only from your chosen brands — or pick \"Any\" for the full database.",
};

// Full diagnostic (12 questions, longer track)
const ALL_STEPS: QuizStep[] = [
  STEP_TERRAIN,
  STEP_PRIORITY,
  STEP_CURRENT_SHOE,
  STEP_WEEKLY_MILEAGE,
  STEP_AVG_PACE,
  STEP_GOAL,
  STEP_COMFORT,
  STEP_WEIGHT,
  STEP_PRONATION,
  STEP_INJURY_CURRENT,
  STEP_INJURY_HISTORY,
  STEP_EXPERIENCE,
  STEP_FOOT_WIDTH,
  STEP_ARCH,
  STEP_DROP,
  STEP_ORTHOTICS,
  STEP_BRAND,
];

// Quick scan (10 questions): still fast, but includes the signals that stop the last 10% wrong answers.
const BEGINNER_STEPS: QuizStep[] = [
  STEP_TERRAIN,
  STEP_PRIORITY,
  STEP_CURRENT_SHOE,
  STEP_WEEKLY_MILEAGE,
  STEP_COMFORT,
  STEP_WEIGHT,
  STEP_PRONATION,
  STEP_FOOT_WIDTH,
  STEP_INJURY_CURRENT,
  STEP_BRAND,
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface QuizProps {
  onComplete: (answers: QuizAnswers) => void;
  onBack?: () => void;
  beginnerMode?: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const HardShadowCard: React.FC<{
  children: React.ReactNode;
  onPress: () => void;
  selected?: boolean;
}> = ({ children, onPress, selected }) => (
  <View style={[styles.optionWrap, { marginBottom: 12 }]}>
    {!selected && <View style={styles.optionShadow} />}
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.optionCard, selected && styles.optionCardSelected]}
    >
      {children}
    </TouchableOpacity>
  </View>
);

// ─── Defaults for fields the quick scan doesn't ask ──────────────────────────

const QUICK_SCAN_DEFAULTS: Partial<QuizAnswers> = {
  goal: 'easy_base',
  experience: 'intermediate',
  arch_type: 'unsure',
  injury_history: ['none'],
  drop_pref: 'no_pref',
  wears_orthotics: false,
  weekly_mileage: 'moderate',
  avg_pace: 'unknown',
  priority: 'one_shoe',
  current_shoe_feel: 'none',
};

// ─── Main Quiz component ──────────────────────────────────────────────────────

export const Quiz: React.FC<QuizProps> = ({ onComplete, onBack, beginnerMode = false }) => {
  const STEPS = beginnerMode ? BEGINNER_STEPS : ALL_STEPS;
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({
    injury_current: [],
    injury_history: [],
    brand_pref: [],
  });
  const [multiSelection, setMultiSelection] = useState<string[]>([]);
  const [brandSelection, setBrandSelection] = useState<string[]>([]);

  const slideX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
    opacity: opacity.value,
  }));

  const ALL_BRANDS = getAllBrands(SHOES);

  const animateForward = (cb: () => void) => {
    slideX.value = withTiming(-width * 0.3, { duration: 220 }, () => {
      runOnJS(cb)();
      slideX.value = width * 0.3;
      opacity.value = 0;
      slideX.value = withSpring(0, { damping: 22, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 180 });
    });
  };

  const animateBack = (cb: () => void) => {
    slideX.value = withTiming(width * 0.3, { duration: 220 }, () => {
      runOnJS(cb)();
      slideX.value = -width * 0.3;
      opacity.value = 0;
      slideX.value = withSpring(0, { damping: 22, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 180 });
    });
  };

  // Apply defaults for any unanswered fields in quick scan mode
  const finalizeAnswers = (raw: Partial<QuizAnswers>): QuizAnswers => {
    return { ...QUICK_SCAN_DEFAULTS, ...raw } as QuizAnswers;
  };

  const advance = (newAnswers: Partial<QuizAnswers>) => {
    if (currentStep < STEPS.length - 1) {
      const next = currentStep + 1;
      const nextStep = STEPS[next];
      animateForward(() => {
        setCurrentStep(next);
        if (nextStep.kind === 'multi') {
          const existing = newAnswers[nextStep.id] as string[] | undefined;
          setMultiSelection(existing ?? []);
        }
        if (nextStep.kind === 'brand') {
          setBrandSelection((newAnswers.brand_pref as string[]) ?? []);
        }
      });
    } else {
      animateForward(() => runOnJS(onComplete)(finalizeAnswers(newAnswers)));
    }
  };

  const handleSingleAnswer = (value: any) => {
    const step = STEPS[currentStep] as SingleStep;
    const newAnswers = { ...answers, [step.id]: value };
    setAnswers(newAnswers);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    advance(newAnswers);
  };

  const handleToggleAnswer = (value: boolean) => {
    const step = STEPS[currentStep] as ToggleStep;
    const newAnswers = { ...answers, [step.id]: value };
    setAnswers(newAnswers);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    advance(newAnswers);
  };

  const handleMultiToggle = (value: string) => {
    const step = STEPS[currentStep] as MultiStep;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setMultiSelection(prev => {
      if (value === step.noneValue) {
        return prev.includes(value) ? [] : [value];
      }
      const withoutNone = prev.filter(v => v !== step.noneValue);
      if (withoutNone.includes(value)) return withoutNone.filter(v => v !== value);
      return [...withoutNone, value];
    });
  };

  const handleMultiConfirm = () => {
    const step = STEPS[currentStep] as MultiStep;
    const selection = multiSelection.length === 0 ? [step.noneValue] : multiSelection;
    const newAnswers = { ...answers, [step.id]: selection };
    setAnswers(newAnswers);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    advance(newAnswers);
  };

  const handleBrandToggle = (brand: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBrandSelection(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const handleBrandConfirm = (any: boolean) => {
    const selection = any ? [] : brandSelection;
    const newAnswers = { ...answers, brand_pref: selection };
    setAnswers(newAnswers);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    animateForward(() => runOnJS(onComplete)(finalizeAnswers(newAnswers)));
  };

  const handleBack = () => {
    if (currentStep > 0) {
      animateBack(() => {
        const prev = currentStep - 1;
        setCurrentStep(prev);
        const prevStep = STEPS[prev];
        if (prevStep.kind === 'multi') {
          setMultiSelection((answers[prevStep.id] as string[]) ?? []);
        }
        if (prevStep.kind === 'brand') {
          setBrandSelection((answers.brand_pref as string[]) ?? []);
        }
      });
    } else if (onBack) {
      onBack();
    }
  };

  const step = STEPS[currentStep];
  const stepNum = String(currentStep + 1).padStart(2, '0');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>BACK</Text>
        </TouchableOpacity>
        <Text style={styles.navLabel}>{beginnerMode ? 'QUICK SCAN' : 'DIAGNOSTIC'}</Text>
        <Text style={styles.navCounter}>{currentStep + 1}/{STEPS.length}</Text>
      </View>

      <View style={styles.progressRow}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[styles.progressSegment, i <= currentStep && styles.progressSegmentActive]}
          />
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={animatedStyle}>
          <Text style={styles.stepNumber}>{stepNum}</Text>

          {'badge' in step && step.badge && (
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>{step.badge}</Text>
            </View>
          )}

          <Text style={styles.question}>{step.question}</Text>
          {'subtext' in step && step.subtext && <Text style={styles.subtext}>{step.subtext}</Text>}
          <View style={styles.divider} />

          {/* ── SINGLE SELECT ─────────────────────────────────── */}
          {step.kind === 'single' && (
            <View>
              {step.options.map((opt, i) => (
                <View key={i} style={styles.optionWrap}>
                  <View style={styles.optionShadow} />
                  <TouchableOpacity
                    onPress={() => handleSingleAnswer(opt.value)}
                    activeOpacity={0.85}
                    style={styles.optionCard}
                  >
                    <View style={styles.optionInner}>
                      <Text style={styles.optionIndex}>{String(i + 1).padStart(2, '0')}</Text>
                      <View style={styles.optionTextBlock}>
                        <Text style={styles.optionLabel}>{opt.label}</Text>
                        {opt.sublabel && <Text style={styles.optionSublabel}>{opt.sublabel}</Text>}
                      </View>
                      <Text style={styles.optionArrow}>//</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* ── TOGGLE (boolean single-select) ────────────────── */}
          {step.kind === 'toggle' && (
            <View>
              {step.options.map((opt, i) => (
                <View key={i} style={styles.optionWrap}>
                  <View style={styles.optionShadow} />
                  <TouchableOpacity
                    onPress={() => handleToggleAnswer(opt.value)}
                    activeOpacity={0.85}
                    style={styles.optionCard}
                  >
                    <View style={styles.optionInner}>
                      <Text style={styles.optionIndex}>{String(i + 1).padStart(2, '0')}</Text>
                      <View style={styles.optionTextBlock}>
                        <Text style={styles.optionLabel}>{opt.label}</Text>
                        {opt.sublabel && <Text style={styles.optionSublabel}>{opt.sublabel}</Text>}
                      </View>
                      <Text style={styles.optionArrow}>//</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* ── MULTI SELECT ──────────────────────────────────── */}
          {step.kind === 'multi' && (
            <View>
              {step.options.map((opt, i) => {
                const selected = multiSelection.includes(opt.value);
                return (
                  <HardShadowCard key={i} onPress={() => handleMultiToggle(opt.value)} selected={selected}>
                    <View style={styles.optionInner}>
                      <View style={[styles.multiCheck, selected && styles.multiCheckSelected]}>
                        {selected && <Text style={styles.multiCheckMark}>OK</Text>}
                      </View>
                      <View style={styles.optionTextBlock}>
                        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                          {opt.label}
                        </Text>
                        {opt.sublabel && (
                          <Text style={[styles.optionSublabel, selected && styles.optionSublabelSelected]}>
                            {opt.sublabel}
                          </Text>
                        )}
                      </View>
                    </View>
                  </HardShadowCard>
                );
              })}

              <View style={styles.confirmWrap}>
                <View style={styles.confirmShadow} />
                <TouchableOpacity onPress={handleMultiConfirm} style={styles.confirmBtn}>
                  <Text style={styles.confirmText}>
                    {multiSelection.length === 0 || multiSelection.includes((step as MultiStep).noneValue)
                      ? 'CONFIRM — NO ISSUES'
                      : `CONFIRM ${multiSelection.length} SELECTED`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── BRAND SELECT ──────────────────────────────────── */}
          {step.kind === 'brand' && (
            <View>
              <View style={styles.anyBrandWrap}>
                <View style={styles.confirmShadow} />
                <TouchableOpacity onPress={() => handleBrandConfirm(true)} style={styles.anyBrandBtn}>
                  <Text style={styles.anyBrandText}>OPEN TO ANY BRAND</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.brandOrDivider}>— or pick your brands —</Text>

              <View style={styles.brandGrid}>
                {ALL_BRANDS.map(brand => {
                  const selected = brandSelection.includes(brand);
                  return (
                    <TouchableOpacity
                      key={brand}
                      onPress={() => handleBrandToggle(brand)}
                      style={[styles.brandChip, selected && styles.brandChipSelected]}
                    >
                      <Text style={[styles.brandChipText, selected && styles.brandChipTextSelected]}>
                        {brand}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {brandSelection.length > 0 && (
                <View style={[styles.confirmWrap, { marginTop: 20 }]}>
                  <View style={styles.confirmShadow} />
                  <TouchableOpacity onPress={() => handleBrandConfirm(false)} style={styles.confirmBtn}>
                    <Text style={styles.confirmText}>
                      {`SHOW RESULTS — ${brandSelection.length} BRAND${brandSelection.length > 1 ? 'S' : ''}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#0A0A0A',
  },
  backBtn: { paddingVertical: 6 },
  backBtnText: {
    fontFamily: 'SpaceMono', fontSize: 11, color: '#0A0A0A', letterSpacing: 1,
  },
  navLabel: {
    fontFamily: 'SpaceMono', fontSize: 11, color: '#0A0A0A', letterSpacing: 2,
  },
  navCounter: {
    fontFamily: 'SpaceMono', fontSize: 11, color: 'rgba(10,10,10,0.4)', letterSpacing: 1,
  },
  progressRow: {
    flexDirection: 'row', gap: 3, paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 2, borderBottomColor: '#0A0A0A',
  },
  progressSegment: { flex: 1, height: 3, backgroundColor: 'rgba(10,10,10,0.15)' },
  progressSegmentActive: { backgroundColor: '#FF3D00' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 60 },
  stepNumber: {
    fontFamily: 'SpaceMono', fontSize: 64, fontWeight: '700',
    color: 'rgba(10,10,10,0.07)', lineHeight: 64, marginBottom: 6,
  },
  badgeRow: { marginBottom: 8 },
  badge: {
    fontFamily: 'SpaceMono', fontSize: 9, color: '#FF3D00',
    letterSpacing: 2, fontWeight: '700',
  },
  question: {
    fontSize: 28, fontWeight: '900', color: '#0A0A0A',
    lineHeight: 34, marginBottom: 10, letterSpacing: -0.5,
  },
  subtext: {
    fontFamily: 'SpaceMono', fontSize: 10, color: 'rgba(10,10,10,0.5)',
    lineHeight: 17, letterSpacing: 0.2,
  },
  divider: { height: 2, backgroundColor: '#0A0A0A', marginVertical: 24 },
  optionWrap: { marginBottom: 14, position: 'relative' },
  optionShadow: {
    position: 'absolute', top: 5, left: 5, right: -5, bottom: -5,
    backgroundColor: '#0A0A0A', borderRadius: 2,
  },
  optionCard: {
    backgroundColor: '#F4F1EA', borderWidth: 2, borderColor: '#0A0A0A',
    borderRadius: 2, padding: 18,
  },
  optionCardSelected: { backgroundColor: '#0A0A0A' },
  optionInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  optionIndex: {
    fontFamily: 'SpaceMono', fontSize: 12, color: 'rgba(10,10,10,0.3)',
    letterSpacing: 1, width: 24,
  },
  optionTextBlock: { flex: 1 },
  optionLabel: {
    fontSize: 16, fontWeight: '800', color: '#0A0A0A',
    letterSpacing: -0.3, marginBottom: 2,
  },
  optionLabelSelected: { color: '#F4F1EA' },
  optionSublabel: {
    fontFamily: 'SpaceMono', fontSize: 10, color: 'rgba(10,10,10,0.5)',
    letterSpacing: 0.2,
  },
  optionSublabelSelected: { color: 'rgba(244,241,234,0.6)' },
  optionArrow: { fontSize: 18, color: '#0A0A0A', fontWeight: '700' },
  multiCheck: {
    width: 22, height: 22, borderWidth: 2, borderColor: '#0A0A0A',
    borderRadius: 2, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  multiCheckSelected: { backgroundColor: '#FF3D00', borderColor: '#FF3D00' },
  multiCheckMark: { color: '#F4F1EA', fontSize: 13, fontWeight: '700' },
  confirmWrap: { marginTop: 8, position: 'relative' },
  confirmShadow: {
    position: 'absolute', top: 5, left: 5, right: -5, bottom: -5,
    backgroundColor: '#0A0A0A', borderRadius: 2,
  },
  confirmBtn: {
    backgroundColor: '#0A0A0A', borderWidth: 2, borderColor: '#0A0A0A',
    borderRadius: 2, paddingVertical: 16, alignItems: 'center',
  },
  confirmText: {
    fontFamily: 'SpaceMono', fontSize: 12, fontWeight: '700',
    color: '#F4F1EA', letterSpacing: 1.5,
  },
  anyBrandWrap: { position: 'relative', marginBottom: 24 },
  anyBrandBtn: {
    backgroundColor: '#D4FF00', borderWidth: 2, borderColor: '#0A0A0A',
    borderRadius: 2, paddingVertical: 18, alignItems: 'center',
  },
  anyBrandText: {
    fontFamily: 'SpaceMono', fontSize: 13, fontWeight: '700',
    color: '#0A0A0A', letterSpacing: 1.5,
  },
  brandOrDivider: {
    fontFamily: 'SpaceMono', fontSize: 10, color: 'rgba(10,10,10,0.4)',
    textAlign: 'center', letterSpacing: 1, marginBottom: 16,
  },
  brandGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  brandChip: {
    paddingHorizontal: 14, paddingVertical: 9, borderWidth: 2,
    borderColor: '#0A0A0A', borderRadius: 2, backgroundColor: '#F4F1EA',
  },
  brandChipSelected: { backgroundColor: '#0A0A0A' },
  brandChipText: {
    fontFamily: 'SpaceMono', fontSize: 11, color: '#0A0A0A',
    fontWeight: '700', letterSpacing: 0.5,
  },
  brandChipTextSelected: { color: '#F4F1EA' },
});
