import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { ShoeCard } from '../../components/ShoeCard';
import { CompareModal } from '../../components/CompareModal';
import { ComparisonView } from '../../components/ComparisonView';
import { SHOES } from '../data/shoes';
import { Shoe } from '../data/shoes';
import { getFavorites, addToFavorites, removeFromFavorites } from '../utils/storage';

interface Filters {
  brands: string[];
  categories: string[];
  cushion: string[];
  terrain: string[];
}

const BRAND_OPTIONS = [...new Set(SHOES.map(shoe => shoe.brand))].sort();
const CATEGORY_OPTIONS = [...new Set(SHOES.map(shoe => shoe.category))].sort();
const CUSHION_OPTIONS = [...new Set(SHOES.map(shoe => shoe.cushion))].sort();
const TERRAIN_OPTIONS = [...new Set(SHOES.map(shoe => shoe.terrain))].sort();

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    brands: [],
    categories: [],
    cushion: [],
    terrain: [],
  });
  const [showFilters, setShowFilters] = useState(false);
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

  const filteredShoes = useMemo(() => {
    let results = SHOES;

    // Text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(shoe => 
        shoe.brand.toLowerCase().includes(query) ||
        shoe.model.toLowerCase().includes(query) ||
        shoe.notes.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.brands.length > 0) {
      results = results.filter(shoe => filters.brands.includes(shoe.brand));
    }
    
    if (filters.categories.length > 0) {
      results = results.filter(shoe => filters.categories.includes(shoe.category));
    }
    
    if (filters.cushion.length > 0) {
      results = results.filter(shoe => filters.cushion.includes(shoe.cushion));
    }
    
    if (filters.terrain.length > 0) {
      results = results.filter(shoe => filters.terrain.includes(shoe.terrain));
    };

    return results;
  }, [searchQuery, filters]);

  const toggleFilter = (category: keyof Filters, value: string) => {
    
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const clearAllFilters = () => {
    setFilters({
      brands: [],
      categories: [],
      cushion: [],
      terrain: [],
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const getActiveFilterCount = () => {
    return filters.brands.length + 
           filters.categories.length + 
           filters.cushion.length + 
           filters.terrain.length;
  };

  const FilterSection: React.FC<{
    title: string;
    options: string[];
    selectedOptions: string[];
    onToggle: (value: string) => void;
  }> = ({ title, options, selectedOptions, onToggle }) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionTitle}>{title}</Text>
      <View style={styles.filterOptions}>
        {options.map(option => (
          <TouchableOpacity
            key={option}
            onPress={() => onToggle(option)}
            style={[
              styles.filterOption,
              selectedOptions.includes(option) && styles.filterOptionSelected
            ]}
          >
            <Text style={[
              styles.filterOptionText,
              selectedOptions.includes(option) && styles.filterOptionTextSelected
            ]}>
              {option.replace('-', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search & Filter</Text>
        <Text style={styles.subtitle}>
          {filteredShoes.length} {filteredShoes.length === 1 ? 'shoe' : 'shoes'} found
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#adb5bd" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search shoes by brand, model, or description..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#adb5bd" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          style={styles.filterButton}
        >
          <Ionicons name="filter" size={20} color="#667eea" />
          {getActiveFilterCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Results */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filteredShoes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)']}
              style={styles.emptyCard}
            >
              <Ionicons name="search-outline" size={64} color="#adb5bd" />
              <Text style={styles.emptyTitle}>No Results Found</Text>
              <Text style={styles.emptyDescription}>
                Try adjusting your search terms or filters
              </Text>
            </LinearGradient>
          </View>
        ) : (
          filteredShoes.map((shoe, index) => (
            <Animated.View
              key={shoe.id}
              entering={FadeInDown.delay(index * 50).springify()}
            >
              <ShoeCard
                shoe={shoe}
                index={index}
                isFavorite={favorites.includes(shoe.id)}
                onToggleFavorite={() => handleToggleFavorite(shoe.id)}
                onCompare={() => handleAddToCompare(shoe.id)}
              />
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={clearAllFilters}>
              <Text style={styles.modalClear}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <FilterSection
              title="Brands"
              options={BRAND_OPTIONS}
              selectedOptions={filters.brands}
              onToggle={(value) => toggleFilter('brands', value)}
            />
            
            <FilterSection
              title="Categories"
              options={CATEGORY_OPTIONS}
              selectedOptions={filters.categories}
              onToggle={(value) => toggleFilter('categories', value)}
            />
            
            <FilterSection
              title="Cushion"
              options={CUSHION_OPTIONS}
              selectedOptions={filters.cushion}
              onToggle={(value) => toggleFilter('cushion', value)}
            />
            
            <FilterSection
              title="Terrain"
              options={TERRAIN_OPTIONS}
              selectedOptions={filters.terrain}
              onToggle={(value) => toggleFilter('terrain', value)}
            />
          </ScrollView>

          <TouchableOpacity
            onPress={() => setShowFilters(false)}
            style={styles.applyButton}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.applyGradient}
            >
              <Text style={styles.applyText}>
                Show {filteredShoes.length} Results
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#495057',
  },
  filterButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    paddingVertical: 20,
    flexGrow: 1,
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalCancel: {
    fontSize: 16,
    color: '#667eea',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  modalClear: {
    fontSize: 16,
    color: '#667eea',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 16,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterOptionSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#495057',
    textTransform: 'capitalize',
  },
  filterOptionTextSelected: {
    color: 'white',
  },
  applyButton: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  applyGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});