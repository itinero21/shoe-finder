import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { QuizAnswers } from '../app/utils/scoring';

const { width } = Dimensions.get('window');

interface QuizStep {
  id: keyof QuizAnswers;
  question: string;
  subtext?: string;
  options: {
    value: any;
    label: string;
    sublabel?: string;
  }[];
}

const QUIZ_STEPS: QuizStep[] = [
  {
    id: 'terrain',
    question: 'Where will you mainly run?',
    subtext: 'Your primary training surface determines the sole construction and traction pattern.',
    options: [
      { value: 'road', label: 'Road / Pavement', sublabel: 'Sidewalks, streets, treadmill, track' },
      { value: 'trail', label: 'Trails', sublabel: 'Dirt paths, hills, uneven terrain' },
    ],
  },
  {
    id: 'archType',
    question: 'What is your arch type?',
    subtext: 'Arch height determines how much motion control and support you need.',
    options: [
      { value: 'flat', label: 'Flat / Low Arch', sublabel: 'Entire sole touches the ground' },
      { value: 'normal', label: 'Normal Arch', sublabel: 'Natural curve, moderate contact' },
      { value: 'high', label: 'High Arch', sublabel: 'Pronounced curve, minimal midfoot contact' },
    ],
  },
  {
    id: 'pronation',
    question: 'How does your foot roll when you run?',
    subtext: 'Pronation pattern affects which support systems will benefit you most.',
    options: [
      { value: 'over', label: 'Rolls Inward', sublabel: 'Overpronation — ankle caves in' },
      { value: 'neutral', label: 'Neutral', sublabel: 'Natural, balanced roll' },
      { value: 'under', label: 'Rolls Outward', sublabel: 'Supination — outer edge takes load' },
    ],
  },
  {
    id: 'injury',
    question: 'Any current pain or injury concerns?',
    subtext: 'Targeted cushioning and support can help manage and prevent common issues.',
    options: [
      { value: 'none', label: 'No Issues', sublabel: 'Feeling strong and healthy' },
      { value: 'plantar', label: 'Heel / Arch Pain', sublabel: 'Plantar fasciitis symptoms' },
      { value: 'knee', label: 'Knee Pain', sublabel: "Runner's knee or joint pain" },
      { value: 'shin', label: 'Shin Pain', sublabel: 'Shin splints or lower leg pain' },
    ],
  },
  {
    id: 'goal',
    question: 'What is your primary running goal?',
    subtext: 'Your goal determines the optimal balance of cushion, weight, and responsiveness.',
    options: [
      { value: 'daily', label: 'Daily Training', sublabel: 'Comfortable everyday mileage' },
      { value: 'speed', label: 'Speed / Tempo', sublabel: 'Intervals, tempo runs, workouts' },
      { value: 'race', label: 'Racing', sublabel: '5K, half marathon, marathon PR' },
    ],
  },
];

interface QuizProps {
  onComplete: (answers: QuizAnswers) => void;
  onBack?: () => void;
}

const HardShadowOption: React.FC<{ children: React.ReactNode; onPress: () => void }> = ({ children, onPress }) => (
  <View style={optionWrapStyle}>
    <View style={optionShadowStyle} />
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={optionCardStyle}>
      {children}
    </TouchableOpacity>
  </View>
);

const optionWrapStyle = { marginBottom: 14, position: 'relative' as const };
const optionShadowStyle = {
  position: 'absolute' as const,
  top: 5, left: 5, right: -5, bottom: -5,
  backgroundColor: '#0A0A0A',
  borderRadius: 2,
};
const optionCardStyle = {
  backgroundColor: '#F4F1EA',
  borderWidth: 2,
  borderColor: '#0A0A0A',
  borderRadius: 2,
  padding: 18,
};

export const Quiz: React.FC<QuizProps> = ({ onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});

  const slideX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
    opacity: opacity.value,
  }));

  const handleAnswer = (value: any) => {
    const currentQuestionId = QUIZ_STEPS[currentStep].id;
    const newAnswers = { ...answers, [currentQuestionId]: value };
    setAnswers(newAnswers);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (currentStep < QUIZ_STEPS.length - 1) {
      slideX.value = withTiming(-width * 0.3, { duration: 220 }, () => {
        runOnJS(setCurrentStep)(currentStep + 1);
        slideX.value = width * 0.3;
        opacity.value = 0;
        slideX.value = withSpring(0, { damping: 22, stiffness: 100 });
        opacity.value = withTiming(1, { duration: 180 });
      });
    } else {
      slideX.value = withTiming(-width * 0.3, { duration: 220 }, () => {
        runOnJS(onComplete)(newAnswers as QuizAnswers);
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      slideX.value = withTiming(width * 0.3, { duration: 220 }, () => {
        runOnJS(setCurrentStep)(currentStep - 1);
        slideX.value = -width * 0.3;
        opacity.value = 0;
        slideX.value = withSpring(0, { damping: 22, stiffness: 100 });
        opacity.value = withTiming(1, { duration: 180 });
      });
    } else if (onBack) {
      onBack();
    }
  };

  const currentQuestion = QUIZ_STEPS[currentStep];
  const stepNum = `0${currentStep + 1}`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.navLabel}>DIAGNOSTIC</Text>
        <Text style={styles.navCounter}>{currentStep + 1}/{QUIZ_STEPS.length}</Text>
      </View>

      {/* Progress segments */}
      <View style={styles.progressRow}>
        {QUIZ_STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              i <= currentStep && styles.progressSegmentActive,
            ]}
          />
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={animatedStyle}>
          {/* Step number */}
          <Text style={styles.stepNumber}>{stepNum}</Text>

          {/* Question */}
          <Text style={styles.question}>{currentQuestion.question}</Text>

          {currentQuestion.subtext && (
            <Text style={styles.subtext}>{currentQuestion.subtext}</Text>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Options */}
          <View style={styles.options}>
            {currentQuestion.options.map((option, index) => (
              <HardShadowOption key={index} onPress={() => handleAnswer(option.value)}>
                <View style={styles.optionInner}>
                  <Text style={styles.optionIndex}>{String(index + 1).padStart(2, '0')}</Text>
                  <View style={styles.optionTextBlock}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    {option.sublabel && (
                      <Text style={styles.optionSublabel}>{option.sublabel}</Text>
                    )}
                  </View>
                  <Text style={styles.optionArrow}>→</Text>
                </View>
              </HardShadowOption>
            ))}
          </View>
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
    gap: 4,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },
  stepNumber: {
    fontFamily: 'SpaceMono',
    fontSize: 64,
    fontWeight: '700',
    color: 'rgba(10,10,10,0.08)',
    lineHeight: 64,
    marginBottom: 8,
  },
  question: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0A0A0A',
    lineHeight: 36,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtext: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: 'rgba(10,10,10,0.5)',
    lineHeight: 18,
    letterSpacing: 0.3,
  },
  divider: {
    height: 2,
    backgroundColor: '#0A0A0A',
    marginVertical: 28,
  },
  options: {
    gap: 0,
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
  optionTextBlock: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0A0A0A',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  optionSublabel: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: 'rgba(10,10,10,0.5)',
    letterSpacing: 0.2,
  },
  optionArrow: {
    fontSize: 18,
    color: '#0A0A0A',
    fontWeight: '700',
  },
});
