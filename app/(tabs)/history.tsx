import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { getQuizHistory, QuizResult } from '../utils/storage';

export default function HistoryScreen() {
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const loadHistory = async () => {
    try {
      const history = await getQuizHistory();
      setQuizHistory(history);
    } catch (error) {
      console.error('Error loading quiz history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const toggleExpanded = (id: string) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(id)) {
      newExpandedItems.delete(id);
    } else {
      newExpandedItems.add(id);
    }
    setExpandedItems(newExpandedItems);
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getActivityEmoji = (activity: string) => {
    return activity === 'running' ? '🏃‍♂️' : '🚶‍♀️';
  };

  const getDistanceLabel = (distance: string) => {
    switch (distance) {
      case 'short': return 'Short distances (<5km)';
      case 'medium': return 'Medium distances (5-15km)';
      case 'long': return 'Long distances (>15km)';
      default: return distance;
    }
  };

  const getInjuryLabel = (injury: string) => {
    switch (injury) {
      case 'none': return 'No injuries';
      case 'knee': return 'Knee pain';
      case 'plantar': return 'Plantar fasciitis';
      case 'shin': return 'Shin splints';
      default: return injury;
    }
  };

  const getTerrainLabel = (terrain: string) => {
    switch (terrain) {
      case 'road': return 'Road/Pavement';
      case 'trail': return 'Trails';
      case 'both': return 'Mixed terrain';
      default: return terrain;
    }
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)']}
        style={styles.emptyCard}
      >
        <Ionicons name="time-outline" size={64} color="#adb5bd" />
        <Text style={styles.emptyTitle}>No Quiz History</Text>
        <Text style={styles.emptyDescription}>
          Take your first quiz to see your results history here!
        </Text>
      </LinearGradient>
    </View>
  );

  const HistoryItem: React.FC<{ result: QuizResult; index: number }> = ({ result, index }) => {
    const isExpanded = expandedItems.has(result.id);

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        style={styles.historyItem}
      >
        <TouchableOpacity
          onPress={() => toggleExpanded(result.id)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#ffffff', '#f8f9ff']}
            style={styles.historyCard}
          >
            <View style={styles.historyHeader}>
              <View style={styles.historyHeaderLeft}>
                <Text style={styles.activityEmoji}>
                  {getActivityEmoji(result.answers.activity)}
                </Text>
                <View>
                  <Text style={styles.historyTitle}>
                    {result.answers.activity === 'running' ? 'Running' : 'Walking'} Quiz
                  </Text>
                  <Text style={styles.historyDate}>{formatDate(result.timestamp)}</Text>
                </View>
              </View>
              
              <View style={styles.historyHeaderRight}>
                <Text style={styles.recommendationCount}>
                  {result.recommendations.length} recommendations
                </Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#6c757d"
                />
              </View>
            </View>

            {isExpanded && (
              <View style={styles.historyDetails}>
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsTitle}>Your Answers:</Text>
                  <View style={styles.detailsList}>
                    <Text style={styles.detailItem}>• Distance: {getDistanceLabel(result.answers.distance)}</Text>
                    <Text style={styles.detailItem}>• Injuries: {getInjuryLabel(result.answers.injuries)}</Text>
                    <Text style={styles.detailItem}>• Flat feet: {result.answers.flatFeet ? 'Yes' : 'No'}</Text>
                    <Text style={styles.detailItem}>• Terrain: {getTerrainLabel(result.answers.terrain)}</Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsTitle}>Top Recommendations:</Text>
                  <View style={styles.recommendationsList}>
                    {result.recommendations.slice(0, 3).map((shoe, idx) => (
                      <View key={shoe.id} style={styles.recommendationItem}>
                        <Text style={styles.recommendationRank}>#{idx + 1}</Text>
                        <Text style={styles.recommendationText}>
                          {shoe.brand} {shoe.model}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Quiz History</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quiz History</Text>
        <Text style={styles.subtitle}>
          {quizHistory.length} {quizHistory.length === 1 ? 'quiz' : 'quizzes'} completed
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {quizHistory.length === 0 ? (
          <EmptyState />
        ) : (
          quizHistory.map((result, index) => (
            <HistoryItem key={result.id} result={result} index={index} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  content: {
    paddingVertical: 20,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 24,
    width: '100%',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#495057',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
  },
  historyItem: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  historyCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  historyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 14,
    color: '#6c757d',
  },
  historyHeaderRight: {
    alignItems: 'flex-end',
  },
  recommendationCount: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  historyDetails: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  detailsList: {
    paddingLeft: 8,
  },
  detailItem: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  recommendationsList: {
    paddingLeft: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recommendationRank: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#667eea',
    minWidth: 20,
  },
  recommendationText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 8,
  },
});