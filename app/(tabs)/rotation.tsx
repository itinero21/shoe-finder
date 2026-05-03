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
import { Ionicons } from '@expo/vector-icons';

import { ShoeCard } from '../../components/ShoeCard';
import { CompareModal } from '../../components/CompareModal';
import { ComparisonView } from '../../components/ComparisonView';
import { RotationCard } from '../../components/RotationCard';
import { LogRunModal } from '../../components/LogRunModal';
import { SHOES } from '../data/shoes';
import { Shoe } from '../data/shoes';
import { getFavorites, removeFromFavorites } from '../utils/storage';
import { getRotationProfile, getRotationInsights, getRotationHealthScore } from '../utils/rotationScore';
import { getRuns } from '../utils/runStorage';
import { getMileageForShoe } from '../utils/mileage';
import { Run } from '../types/run';

export default function FavoritesScreen() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedCompareShoes, setSelectedCompareShoes] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonShoes, setComparisonShoes] = useState<[Shoe, Shoe] | null>(null);
  const [showLogRunModal, setShowLogRunModal] = useState(false);
  const [selectedShoeForLog, setSelectedShoeForLog] = useState<Shoe | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);

  const loadFavorites = async () => {
    try {
      const favs = await getFavorites();
      setFavoriteIds(favs);
      const allRuns = await getRuns();
      setRuns(allRuns);
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

  const handleLogRun = (shoe: Shoe) => {
    setSelectedShoeForLog(shoe);
    setShowLogRunModal(true);
  };

  const handleCloseLogRunModal = () => {
    setShowLogRunModal(false);
    setSelectedShoeForLog(null);
  };

  const handleRunSaved = async () => {
    const allRuns = await getRuns();
    setRuns(allRuns);
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const favoriteShoes = SHOES.filter(shoe => favoriteIds.includes(shoe.id));

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyCard}>
        <Ionicons name="layers-outline" size={48} color="rgba(10,10,10,0.2)" />
        <Text style={styles.emptyTitle}>ARSENAL EMPTY</Text>
        <Text style={styles.emptyDescription}>
          Run the diagnostic and save your protocol shoes to build your arsenal.
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>// STRIDE PROTOCOL</Text>
          <Text style={styles.title}>MY ARSENAL.</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>LOADING...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>// STRIDE PROTOCOL</Text>
        <Text style={styles.title}>MY ARSENAL.</Text>
        <Text style={styles.subtitle}>
          {favoriteShoes.length} {favoriteShoes.length === 1 ? 'shoe' : 'shoes'} in rotation
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
          <>
            {/* Rotation Intelligence Card */}
            <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
              <RotationCard
                roleScores={getRotationProfile(favoriteShoes)}
                insights={getRotationInsights(getRotationProfile(favoriteShoes))}
                healthScore={getRotationHealthScore(getRotationProfile(favoriteShoes))}
              />
            </View>

            {favoriteShoes.map((shoe, index) => {
              const shoeMileage = getMileageForShoe(shoe.id, runs);
              return (
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
                    onLogRun={() => handleLogRun(shoe)}
                    mileage={shoeMileage}
                    showMileage={true}
                  />
                </Animated.View>
              );
            })}
          </>
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

      {/* Log Run Modal */}
      {selectedShoeForLog && (
        <LogRunModal
          visible={showLogRunModal}
          shoeId={selectedShoeForLog.id}
          shoeName={`${selectedShoeForLog.brand} ${selectedShoeForLog.model}`}
          onClose={handleCloseLogRunModal}
          onSaved={handleRunSaved}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  header: {
    backgroundColor: '#F4F1EA',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#0A0A0A',
  },
  headerEyebrow: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: 'rgba(10,10,10,0.4)',
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0A0A0A',
    letterSpacing: -1,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: 'rgba(10,10,10,0.5)',
    letterSpacing: 0.5,
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
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: 'rgba(10,10,10,0.4)',
    letterSpacing: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: '#0A0A0A',
    width: '100%',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0A0A0A',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  emptyDescription: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: 'rgba(10,10,10,0.5)',
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: 0.3,
  },
});