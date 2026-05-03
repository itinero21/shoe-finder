import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Quiz } from '../../components/Quiz';
import { ShoeCard } from '../../components/ShoeCard';
import { CompareModal } from '../../components/CompareModal';
import { ComparisonView } from '../../components/ComparisonView';
import { RotationCard } from '../../components/RotationCard';
import { SHOES, DAILY_TIPS, COMMUNITY_POLLS, Shoe } from '../data/shoes';
import { QuizAnswers, getRecommendations, ScoredShoe } from '../utils/scoring';
import { saveQuizResult, getFavorites, addToFavorites, removeFromFavorites } from '../utils/storage';
import { getRotationProfile, getRotationInsights, getRotationHealthScore } from '../utils/rotationScore';

type AppState = 'welcome' | 'quiz' | 'results';

const WelcomeScreen: React.FC<{ onStartQuiz: () => void }> = ({ onStartQuiz }) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const category = DAILY_TIPS[currentCategoryIndex];
      if (currentTipIndex < category.tips.length - 1) {
        setCurrentTipIndex(currentTipIndex + 1);
      } else {
        setCurrentCategoryIndex((currentCategoryIndex + 1) % DAILY_TIPS.length);
        setCurrentTipIndex(0);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [currentTipIndex, currentCategoryIndex]);

  const currentCategory = DAILY_TIPS[currentCategoryIndex];
  const currentTip = currentCategory.tips[currentTipIndex];
  const currentPoll = COMMUNITY_POLLS[0];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.welcomeGradient}
      >
        <ScrollView
          contentContainerStyle={styles.welcomeContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text style={styles.welcomeTitle}>Shoe Finder</Text>
            <Text style={styles.welcomeSubtitle}>
              Find your perfect running or walking shoes with our smart quiz
            </Text>
          </Animated.View>

          {/* Daily Tip Widget */}
          <Animated.View
            entering={FadeInDown.delay(400).springify()}
            style={styles.tipWidget}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.tipContainer}
            >
              <View style={styles.tipHeader}>
                <Ionicons name="bulb-outline" size={20} color="white" />
                <Text style={styles.tipCategory}>{currentCategory.category}</Text>
              </View>
              <Text style={styles.tipText}>{currentTip}</Text>
            </LinearGradient>
          </Animated.View>

          {/* Community Poll */}
          <Animated.View
            entering={FadeInDown.delay(600).springify()}
            style={styles.pollWidget}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.pollContainer}
            >
              <View style={styles.pollHeader}>
                <Ionicons name="people-outline" size={20} color="white" />
                <Text style={styles.pollTitle}>Community Poll</Text>
              </View>
              <Text style={styles.pollQuestion}>{currentPoll.question}</Text>
              {currentPoll.results.slice(0, 3).map((result, index) => (
                <View key={index} style={styles.pollResult}>
                  <Text style={styles.pollShoe}>{result.shoe}</Text>
                  <View style={styles.pollBarContainer}>
                    <View
                      style={[
                        styles.pollBar,
                        { width: `${result.percentage}%` }
                      ]}
                    />
                    <Text style={styles.pollPercentage}>{result.percentage}%</Text>
                  </View>
                </View>
              ))}
            </LinearGradient>
          </Animated.View>

          {/* Start Quiz Button */}
          <Animated.View entering={FadeInDown.delay(800).springify()}>
            <TouchableOpacity
              onPress={onStartQuiz}
              style={styles.startButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                style={styles.startButtonGradient}
              >
                <Text style={styles.startButtonText}>Start Quiz</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const ResultsScreen: React.FC<{
  answers: QuizAnswers;
  recommendations: ScoredShoe[];
  onStartOver: () => void;
}> = ({ answers, recommendations, onStartOver }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedCompareShoes, setSelectedCompareShoes] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonShoes, setComparisonShoes] = useState<[Shoe, Shoe] | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const favs = await getFavorites();
    setFavorites(favs);
  };

  const handleToggleFavorite = async (shoeId: string) => {
    if (favorites.includes(shoeId)) {
      await removeFromFavorites(shoeId);
      setFavorites(favorites.filter(id => id !== shoeId));
    } else {
      await addToFavorites(shoeId);
      setFavorites([...favorites, shoeId]);
    }
  };

  const handleCompare = (shoe: ScoredShoe) => {
    setShowCompareModal(true);
    if (!selectedCompareShoes.includes(shoe.id)) {
      setSelectedCompareShoes([shoe.id]);
    }
  };

  const handleToggleCompareShoe = (shoeId: string) => {
    setSelectedCompareShoes(prev => 
      prev.includes(shoeId) 
        ? prev.filter(id => id !== shoeId)
        : prev.length < 2 
          ? [...prev, shoeId]
          : prev
    );
  };

  const handleStartComparison = (shoe1: Shoe, shoe2: Shoe) => {
    setComparisonShoes([shoe1, shoe2]);
    setShowCompareModal(false);
    setShowComparison(true);
  };

  const handleCloseComparison = () => {
    setShowComparison(false);
    setComparisonShoes(null);
    setSelectedCompareShoes([]);
  };

  const handleBuyNow = (shoe: ScoredShoe) => {
    Alert.alert('Buy Now', `Redirecting to purchase ${shoe.brand} ${shoe.model}...`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.resultsHeader}>
        <TouchableOpacity onPress={onStartOver} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#495057" />
        </TouchableOpacity>
        <Text style={styles.resultsTitle}>Your Perfect Matches</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.resultsSubtitle}>
          Based on your answers, here are the best shoes for you:
        </Text>

        {/* Rotation Intelligence Card */}
        <View style={{ paddingHorizontal: 20 }}>
          <RotationCard
            roleScores={(() => {
              const recommendedShoes = recommendations.map(r => SHOES.find(s => s.id === r.id)!);
              return getRotationProfile(recommendedShoes);
            })()}
            insights={(() => {
              const recommendedShoes = recommendations.map(r => SHOES.find(s => s.id === r.id)!);
              const profile = getRotationProfile(recommendedShoes);
              return getRotationInsights(profile);
            })()}
            healthScore={(() => {
              const recommendedShoes = recommendations.map(r => SHOES.find(s => s.id === r.id)!);
              const profile = getRotationProfile(recommendedShoes);
              return getRotationHealthScore(profile);
            })()}
          />
        </View>

        {recommendations.map((shoe, index) => (
          <ShoeCard
            key={shoe.id}
            shoe={shoe}
            index={index}
            isFavorite={favorites.includes(shoe.id)}
            onToggleFavorite={() => handleToggleFavorite(shoe.id)}
            onCompare={() => handleCompare(shoe)}
            onBuyNow={() => handleBuyNow(shoe)}
          />
        ))}

        <TouchableOpacity
          onPress={onStartOver}
          style={styles.retakeButton}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.retakeGradient}
          >
            <Ionicons name="refresh-outline" size={20} color="white" />
            <Text style={styles.retakeText}>Retake Quiz</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Compare Modal */}
      <CompareModal
        visible={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        shoes={SHOES}
        selectedShoes={selectedCompareShoes}
        onToggleShoe={handleToggleCompareShoe}
        onCompare={handleStartComparison}
      />

      {/* Comparison View */}
      {comparisonShoes && (
        <ComparisonView
          visible={showComparison}
          onClose={handleCloseComparison}
          shoe1={comparisonShoes[0]}
          shoe2={comparisonShoes[1]}
        />
      )}
    </SafeAreaView>
  );
};

export default function HomeScreen() {
  const [appState, setAppState] = useState<AppState>('welcome');
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(null);
  const [recommendations, setRecommendations] = useState<ScoredShoe[]>([]);

  const handleStartQuiz = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAppState('quiz');
  };

  const handleQuizComplete = async (answers: QuizAnswers) => {
    setQuizAnswers(answers);
    const recs = getRecommendations(answers, SHOES);
    setRecommendations(recs);
    
    // Save quiz result to history
    await saveQuizResult({ answers, recommendations: recs });
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAppState('results');
  };

  const handleStartOver = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAppState('welcome');
    setQuizAnswers(null);
    setRecommendations([]);
  };

  if (appState === 'quiz') {
    return (
      <Quiz
        onComplete={handleQuizComplete}
        onBack={() => setAppState('welcome')}
      />
    );
  }

  if (appState === 'results' && quizAnswers) {
    return (
      <ResultsScreen
        answers={quizAnswers}
        recommendations={recommendations}
        onStartOver={handleStartOver}
      />
    );
  }

  return <WelcomeScreen onStartQuiz={handleStartQuiz} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  welcomeGradient: {
    flex: 1,
  },
  welcomeContent: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  tipWidget: {
    width: '100%',
    marginBottom: 24,
  },
  tipContainer: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  tipText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
  pollWidget: {
    width: '100%',
    marginBottom: 40,
  },
  pollContainer: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pollTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  pollQuestion: {
    fontSize: 16,
    color: 'white',
    marginBottom: 16,
    fontWeight: '500',
  },
  pollResult: {
    marginBottom: 12,
  },
  pollShoe: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  pollBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
  },
  pollBar: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 3,
  },
  pollPercentage: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
    minWidth: 30,
  },
  startButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginRight: 8,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  resultsTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
  },
  spacer: {
    width: 40,
  },
  resultsContent: {
    paddingVertical: 20,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  retakeButton: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 16,
    overflow: 'hidden',
  },
  retakeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  retakeText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});