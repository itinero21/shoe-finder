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

type BrandStep = {
  kind: 'brand';
  id: 'brand_pref';
  question: string;
  subtext?: string;
};

type QuizStep = SingleStep | MultiStep | BrandStep;

// ─── Step definitions ────────────────────────────────────────────────────────

const SINGLE_STEPS: QuizStep[] = [
  {
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
  },
  {
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
  },
  {
    kind: 'single',
    id: 'comfort_pref',
    question: 'How should your shoes feel underfoot?',
    subtext: 'Comfort preference is the strongest predictor of which shoe works for you.',
    badge: '// #1 PREDICTOR',
    options: [
      { value: 'soft', label: 'Soft & Plush', sublabel: 'Cloud-like, lots of cushion' },
      { value: 'medium', label: 'Balanced Feel', sublabel: 'Not too soft, not too hard' },
      { value: 'firm', label: 'Firm & Responsive', sublabel: 'Snappy, ground connection' },
    ],
  },
  {
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
  },
];

const INJURY_CURRENT_STEP: MultiStep = {
  kind: 'multi',
  id: 'injury_current',
  question: 'Any current pain or injury?',
  subtext: 'Select all that apply. We\'ll target the biomechanics for each issue.',
  noneValue: 'none',
  options: [
    { value: 'none', label: 'No Issues', sublabel: 'Feeling healthy and strong' },
    { value: 'plantar', label: 'Heel / Arch Pain', sublabel: 'Plantar fasciitis' },
    { value: 'achilles', label: 'Achilles Pain', sublabel: 'Back of heel, tendon area' },
    { value: 'knee', label: 'Knee Pain', sublabel: "Runner's knee, joint pain" },
    { value: 'shin', label: 'Shin Pain', sublabel: 'Shin splints, lower leg stress' },
    { value: 'itband', label: 'IT Band / Hip', sublabel: 'Outer knee, lateral hip' },
    { value: 'metatarsalgia', label: 'Ball of Foot Pain', sublabel: 'Forefoot, metatarsalgia' },
    { value: 'other', label: 'Other Issue', sublabel: 'General discomfort' },
  ],
};

const INJURY_HISTORY_STEP: MultiStep = {
  kind: 'multi',
  id: 'injury_history',
  question: 'Any injury in the last 12 months?',
  subtext: 'Past injury is the #1 predictor of future injury — we\'ll build in prevention.',
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

const TRAILING_STEPS: QuizStep[] = [
  {
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
  },
  {
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
  },
  {
    kind: 'single',
    id: 'arch_type',
    question: 'What is your arch type?',
    subtext: 'Arch height influences motion control needs — combined with your other answers.',
    options: [
      { value: 'flat', label: 'Flat / Low Arch', sublabel: 'Whole sole contacts the ground' },
      { value: 'normal', label: 'Normal Arch', sublabel: 'Natural curve, moderate contact' },
      { value: 'high', label: 'High Arch', sublabel: 'Pronounced curve, minimal contact' },
    ],
  },
  {
    kind: 'brand',
    id: 'brand_pref',
    question: 'Any preferred brands?',
    subtext: 'We\'ll recommend only from your chosen brands — or pick "Any" for the full database.',
  },
];

const ALL_STEPS: QuizStep[] = [
  ...SINGLE_STEPS,
  INJURY_CURRENT_STEP,
  INJURY_HISTORY_STEP,
  ...TRAILING_STEPS,
];

const TOTAL_STEPS = ALL_STEPS.length;

// ─── Props ────────────────────────────────────────────────────────────────────

interface QuizProps {
  onComplete: (answers: QuizAnswers) => void;
  onBack?: () => void;
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

// ─── Main Quiz component ──────────────────────────────────────────────────────

export const Quiz: React.FC<QuizProps> = ({ onComplete, onBack }) => {
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

  const advance = (newAnswers: Partial<QuizAnswers>) => {
    if (currentStep < TOTAL_STEPS - 1) {
      const next = currentStep + 1;
      const nextStep = ALL_STEPS[next];
      animateForward(() => {
        setCurrentStep(next);
        // Pre-fill multi-selection state for multi steps
        if (nextStep.kind === 'multi') {
          const existing = newAnswers[nextStep.id] as string[] | undefined;
          setMultiSelection(existing ?? []);
        }
        if (nextStep.kind === 'brand') {
          setBrandSelection((newAnswers.brand_pref as string[]) ?? []);
        }
      });
    } else {
      animateForward(() => runOnJS(onComplete)(newAnswers as QuizAnswers));
    }
  };

  // Single-select answer
  const handleSingleAnswer = (value: any) => {
    const step = ALL_STEPS[currentStep] as SingleStep;
    const newAnswers = { ...answers, [step.id]: value };
    setAnswers(newAnswers);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    advance(newAnswers);
  };

  // Multi-select toggle
  const handleMultiToggle = (value: string) => {
    const step = ALL_STEPS[currentStep] as MultiStep;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setMultiSelection(prev => {
      if (value === step.noneValue) {
        // "None" clears everything else and selects itself
        return prev.includes(value) ? [] : [value];
      }
      // Any other option deselects "none"
      const withoutNone = prev.filter(v => v !== step.noneValue);
      if (withoutNone.includes(value)) {
        return withoutNone.filter(v => v !== value);
      }
      return [...withoutNone, value];
    });
  };

  const handleMultiConfirm = () => {
    const step = ALL_STEPS[currentStep] as MultiStep;
    const selection = multiSelection.length === 0 ? [step.noneValue] : multiSelection;
    const newAnswers = { ...answers, [step.id]: selection };
    setAnswers(newAnswers);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    advance(newAnswers);
  };

  // Brand selection
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
    animateForward(() => runOnJS(onComplete)(newAnswers as QuizAnswers));
  };

  const handleBack = () => {
    if (currentStep > 0) {
      animateBack(() => {
        const prev = currentStep - 1;
        setCurrentStep(prev);
        const prevStep = ALL_STEPS[prev];
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

  const step = ALL_STEPS[currentStep];
  const stepNum = String(currentStep + 1).padStart(2, '0');

  return (
    <SafeAreaView style={styles.container}>
      {/* Top nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.navLabel}>DIAGNOSTIC</Text>
        <Text style={styles.navCounter}>{currentStep + 1}/{TOTAL_STEPS}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressRow}>
        {ALL_STEPS.map((_, i) => (
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
                      <Text style={styles.optionArrow}>→</Text>
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
                        {selected && <Text style={styles.multiCheckMark}>✓</Text>}
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

              {/* Confirm button */}
              <View style={styles.confirmWrap}>
                <View style={styles.confirmShadow} />
                <TouchableOpacity onPress={handleMultiConfirm} style={styles.confirmBtn}>
                  <Text style={styles.confirmText}>
                    {multiSelection.length === 0 || multiSelection.includes((step as MultiStep).noneValue)
                      ? 'CONFIRM — NO ISSUES →'
                      : `CONFIRM ${multiSelection.length} SELECTED →`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── BRAND SELECT ──────────────────────────────────── */}
          {step.kind === 'brand' && (
            <View>
              {/* "Any brand" quick pick */}
              <View style={styles.anyBrandWrap}>
                <View style={styles.confirmShadow} />
                <TouchableOpacity onPress={() => handleBrandConfirm(true)} style={styles.anyBrandBtn}>
                  <Text style={styles.anyBrandText}>OPEN TO ANY BRAND →</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.brandOrDivider}>— or pick your brands —</Text>

              {/* Brand chips */}
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

              {/* Confirm selected brands */}
              {brandSelection.length > 0 && (
                <View style={[styles.confirmWrap, { marginTop: 20 }]}>
                  <View style={styles.confirmShadow} />
                  <TouchableOpacity onPress={() => handleBrandConfirm(false)} style={styles.confirmBtn}>
                    <Text style={styles.confirmText}>
                      {`SHOW RESULTS — ${brandSelection.length} BRAND${brandSelection.length > 1 ? 'S' : ''} →`}
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
  backBtn: {
    paddingVertical: 6,
  },
  backBtnText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#0A0A0A',
    letterSpacing: 1,
  },
  navLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#0A0A0A',
    letterSpacing: 2,
  },
  navCounter: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: 'rgba(10,10,10,0.4)',
    letterSpacing: 1,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#0A0A0A',
  },
  progressSegment: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(10,10,10,0.15)',
  },
  progressSegmentActive: {
    backgroundColor: '#FF3D00',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 60,
  },
  stepNumber: {
    fontFamily: 'SpaceMono',
    fontSize: 64,
    fontWeight: '700',
    color: 'rgba(10,10,10,0.07)',
    lineHeight: 64,
    marginBottom: 6,
  },
  badgeRow: { marginBottom: 8 },
  badge: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: '#FF3D00',
    letterSpacing: 2,
    fontWeight: '700',
  },
  question: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0A0A0A',
    lineHeight: 34,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtext: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: 'rgba(10,10,10,0.5)',
    lineHeight: 17,
    letterSpacing: 0.2,
  },
  divider: {
    height: 2,
    backgroundColor: '#0A0A0A',
    marginVertical: 24,
  },
  // ── Options (single) ──
  optionWrap: {
    marginBottom: 14,
    position: 'relative',
  },
  optionShadow: {
    position: 'absolute',
    top: 5, left: 5, right: -5, bottom: -5,
    backgroundColor: '#0A0A0A',
    borderRadius: 2,
  },
  optionCard: {
    backgroundColor: '#F4F1EA',
    borderWidth: 2,
    borderColor: '#0A0A0A',
    borderRadius: 2,
    padding: 18,
  },
  optionCardSelected: {
    backgroundColor: '#0A0A0A',
  },
  optionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  optionIndex: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    color: 'rgba(10,10,10,0.3)',
    letterSpacing: 1,
    width: 24,
  },
  optionTextBlock: { flex: 1 },
  optionLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A0A0A',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  optionLabelSelected: { color: '#F4F1EA' },
  optionSublabel: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: 'rgba(10,10,10,0.5)',
    letterSpacing: 0.2,
  },
  optionSublabelSelected: { color: 'rgba(244,241,234,0.6)' },
  optionArrow: {
    fontSize: 18,
    color: '#0A0A0A',
    fontWeight: '700',
  },
  // ── Multi-select check ──
  multiCheck: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#0A0A0A',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  multiCheckSelected: {
    backgroundColor: '#FF3D00',
    borderColor: '#FF3D00',
  },
  multiCheckMark: {
    color: '#F4F1EA',
    fontSize: 13,
    fontWeight: '700',
  },
  // ── Confirm button ──
  confirmWrap: {
    marginTop: 8,
    position: 'relative',
  },
  confirmShadow: {
    position: 'absolute',
    top: 5, left: 5, right: -5, bottom: -5,
    backgroundColor: '#0A0A0A',
    borderRadius: 2,
  },
  confirmBtn: {
    backgroundColor: '#0A0A0A',
    borderWidth: 2,
    borderColor: '#0A0A0A',
    borderRadius: 2,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: '700',
    color: '#F4F1EA',
    letterSpacing: 1.5,
  },
  // ── Brand select ──
  anyBrandWrap: {
    position: 'relative',
    marginBottom: 24,
  },
  anyBrandBtn: {
    backgroundColor: '#D4FF00',
    borderWidth: 2,
    borderColor: '#0A0A0A',
    borderRadius: 2,
    paddingVertical: 18,
    alignItems: 'center',
  },
  anyBrandText: {
    fontFamily: 'SpaceMono',
    fontSize: 13,
    fontWeight: '700',
    color: '#0A0A0A',
    letterSpacing: 1.5,
  },
  brandOrDivider: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: 'rgba(10,10,10,0.4)',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 16,
  },
  brandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  brandChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 2,
    borderColor: '#0A0A0A',
    borderRadius: 2,
    backgroundColor: '#F4F1EA',
  },
  brandChipSelected: {
    backgroundColor: '#0A0A0A',
  },
  brandChipText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#0A0A0A',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  brandChipTextSelected: {
    color: '#F4F1EA',
  },
});
