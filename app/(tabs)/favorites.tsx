import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { ShoeCard } from '../../components/ShoeCard';
import { CompareModal } from '../../components/CompareModal';
import { ComparisonView } from '../../components/ComparisonView';
import { SHOES } from '../data/shoes';
import { Shoe } from '../data/shoes';
import { getFavorites, removeFromFavorites } from '../utils/storage';

export default function FavoritesScreen() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedCompareShoes, setSelectedCompareShoes] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonShoes, setComparisonShoes] = useState<[Shoe, Shoe] | null>(null);

  const loadFavorites = async () => {
    try {
      const favs = await getFavorites();
      setFavoriteIds(favs);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const handleRemoveFavorite = async (shoeId: string) => {
    await removeFromFavorites(shoeId);
    setFavoriteIds(favoriteIds.filter(id => id !== shoeId));
  };

  const handleAddToCompare = (shoeId: string) => {
    setShowCompareModal(true);
    if (!selectedCompareShoes.includes(shoeId)) {
      setSelectedCompareShoes([shoeId]);
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

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const favoriteShoes = SHOES.filter(shoe => favoriteIds.includes(shoe.id));

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)']}
        style={styles.emptyCard}
      >
        <Ionicons name="heart-outline" size={64} color="#adb5bd" />
        <Text style={styles.emptyTitle}>No Favorites Yet</Text>
        <Text style={styles.emptyDescription}>
          Start taking quizzes and save your favorite shoe recommendations here!
        </Text>
      </LinearGradient>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Favorites</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Favorites</Text>
        <Text style={styles.subtitle}>
          {favoriteShoes.length} {favoriteShoes.length === 1 ? 'shoe' : 'shoes'} saved
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {favoriteShoes.length === 0 ? (
          <EmptyState />
        ) : (
          favoriteShoes.map((shoe, index) => (
            <Animated.View
              key={shoe.id}
              entering={FadeInDown.delay(index * 100).springify()}
            >
              <ShoeCard
                shoe={shoe}
                index={index}
                isFavorite={true}
                onToggleFavorite={() => handleRemoveFavorite(shoe.id)}
                onCompare={() => handleAddToCompare(shoe.id)}
              />
            </Animated.View>
          ))
        )}
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
});