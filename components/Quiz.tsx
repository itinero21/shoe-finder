import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { QuizAnswers } from '../app/utils/scoring';

const { width } = Dimensions.get('window');

interface QuizStep {
  id: keyof QuizAnswers;
  question: string;
  options: {
    value: any;
    label: string;
    description?: string;
    emoji?: string;
  }[];
}

const QUIZ_STEPS: QuizStep[] = [
  {
    id: 'activity',
    question: 'What will you mainly use these shoes for?',
    options: [
      { value: 'running', label: 'Running', emoji: '🏃‍♂️', description: 'Training, races, fitness' },
      { value: 'walking', label: 'Walking', emoji: '🚶‍♀️', description: 'Daily walks, casual wear' },
    ],
  },
  {
    id: 'distance',
    question: 'What distance do you typically cover?',
    options: [
      { value: 'short', label: 'Short', emoji: '🏃‍♀️', description: 'Under 5km / 3 miles' },
      { value: 'medium', label: 'Medium', emoji: '🏃', description: '5-15km / 3-9 miles' },
      { value: 'long', label: 'Long', emoji: '🏃‍♂️', description: 'Over 15km / 9+ miles' },
    ],
  },
  {
    id: 'injuries',
    question: 'Do you have any current or recent injuries?',
    options: [
      { value: 'none', label: 'No injuries', emoji: '💪', description: 'Feeling great!' },
      { value: 'knee', label: 'Knee pain', emoji: '🦵', description: 'Current or past knee issues' },
      { value: 'plantar', label: 'Plantar fasciitis', emoji: '🦶', description: 'Heel or arch pain' },
      { value: 'shin', label: 'Shin splints', emoji: '🦿', description: 'Lower leg pain' },
    ],
  },
  {
    id: 'flatFeet',
    question: 'Do you have flat feet or overpronate?',
    options: [
      { value: false, label: 'No', emoji: '👣', description: 'Normal or high arches' },
      { value: true, label: 'Yes', emoji: '🦶', description: 'Flat feet or roll inward' },
    ],
  },
  {
    id: 'terrain',
    question: 'Where will you primarily run/walk?',
    options: [
      { value: 'road', label: 'Road/Pavement', emoji: '🛣️', description: 'Sidewalks, streets, tracks' },
      { value: 'trail', label: 'Trails', emoji: '🌲', description: 'Dirt paths, hiking trails' },
      { value: 'both', label: 'Mixed', emoji: '🌍', description: 'Both road and trail' },
    ],
  },
];

interface QuizProps {
  onComplete: (answers: QuizAnswers) => void;
  onBack?: () => void;
}

export const Quiz: React.FC<QuizProps> = ({ onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  
  const slideX = useSharedValue(0);
  const progressValue = useSharedValue(0);

  const animatedSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%`,
  }));

  const handleAnswer = (value: any) => {
    const currentQuestionId = QUIZ_STEPS[currentStep].id;
    const newAnswers = { ...answers, [currentQuestionId]: value };
    setAnswers(newAnswers);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentStep < QUIZ_STEPS.length - 1) {
      // Move to next step
      slideX.value = withTiming(-width, { duration: 300 }, () => {
        runOnJS(setCurrentStep)(currentStep + 1);
        slideX.value = width;
        slideX.value = withSpring(0, { damping: 20, stiffness: 90 });
      });
      
      progressValue.value = withTiming(((currentStep + 2) / QUIZ_STEPS.length) * 100);
    } else {
      // Quiz complete
      slideX.value = withTiming(-width, { duration: 300 }, () => {
        runOnJS(onComplete)(newAnswers as QuizAnswers);
      });
      progressValue.value = withTiming(100);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      slideX.value = withTiming(width, { duration: 300 }, () => {
        runOnJS(setCurrentStep)(currentStep - 1);
        slideX.value = -width;
        slideX.value = withSpring(0, { damping: 20, stiffness: 90 });
      });
      
      progressValue.value = withTiming((currentStep / QUIZ_STEPS.length) * 100);
    } else if (onBack) {
      onBack();
    }
  };

  React.useEffect(() => {
    progressValue.value = withTiming(((currentStep + 1) / QUIZ_STEPS.length) * 100);
  }, [currentStep, progressValue]);

  const currentQuestion = QUIZ_STEPS[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <Text style={styles.stepText}>
            {currentStep + 1} of {QUIZ_STEPS.length}
          </Text>
          
          <View style={styles.spacer} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
          </View>
        </View>

        {/* Question */}
        <Animated.View style={[styles.questionContainer, animatedSlideStyle]}>
          <Text style={styles.question}>{currentQuestion.question}</Text>
          
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionButton}
                onPress={() => handleAnswer(option.value)}
                activeOpacity={0.8}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <View style={styles.optionText}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    {option.description && (
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  spacer: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  questionContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  question: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 36,
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  optionButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
    borderRadius: 16,
  },
  optionEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});