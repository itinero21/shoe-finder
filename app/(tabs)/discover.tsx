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
  use_cases: string[];
}

const BRAND_OPTIONS = [...new Set(SHOES.map(shoe => shoe.brand))].sort();
const CATEGORY_OPTIONS = [...new Set(SHOES.map(shoe => shoe.category))].sort();
const USE_CASE_OPTIONS = [...new Set(SHOES.flatMap(shoe => shoe.use_cases))].sort();

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    brands: [],
    categories: [],
    use_cases: [],
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
        shoe.summary.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.brands.length > 0) {
      results = results.filter(shoe => filters.brands.includes(shoe.brand));
    }
    
    if (filters.categories.length > 0) {
      results = results.filter(shoe => filters.categories.includes(shoe.category));
    }
    
    if (filters.use_cases.length > 0) {
      results = results.filter(shoe => shoe.use_cases.some(u => filters.use_cases.includes(u)));
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
      use_cases: [],
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const getActiveFilterCount = () => {
    return filters.brands.length + filters.categories.length + filters.use_cases.length;
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
        <Text style={styles.headerEyebrow}>// STRIDE PROTOCOL</Text>
        <Text style={styles.title}>DISCOVER.</Text>
        <Text style={styles.subtitle}>
          {filteredShoes.length} {filteredShoes.length === 1 ? 'shoe' : 'shoes'} in the database
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="rgba(10,10,10,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search brand, model, description..."
            placeholderTextColor="rgba(10,10,10,0.35)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="rgba(10,10,10,0.35)" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          style={styles.filterButton}
        >
          <Ionicons name="options-outline" size={20} color="#0A0A0A" />
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
            <View style={styles.emptyCard}>
              <Ionicons name="search-outline" size={48} color="rgba(10,10,10,0.2)" />
              <Text style={styles.emptyTitle}>NO RESULTS</Text>
              <Text style={styles.emptyDescription}>
                Try adjusting your search terms or filters
              </Text>
            </View>
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
              title="Use Case"
              options={USE_CASE_OPTIONS}
              selectedOptions={filters.use_cases}
              onToggle={(value) => toggleFilter('use_cases', value)}
            />
          </ScrollView>

          <TouchableOpacity
            onPress={() => setShowFilters(false)}
            style={styles.applyButton}
          >
            <View style={styles.applyGradient}>
              <Text style={styles.applyText}>
                SHOW {filteredShoes.length} RESULTS →
              </Text>
            </View>
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F4F1EA',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#0A0A0A',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,10,10,0.06)',
    borderWidth: 2,
    borderColor: '#0A0A0A',
    borderRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0A0A0A',
    fontFamily: 'SpaceMono',
  },
  filterButton: {
    padding: 10,
    borderWidth: 2,
    borderColor: '#0A0A0A',
    borderRadius: 2,
    backgroundColor: '#F4F1EA',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3D00',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#F4F1EA',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F4F1EA',
    borderBottomWidth: 2,
    borderBottomColor: '#0A0A0A',
  },
  modalCancel: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#0A0A0A',
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0A0A0A',
    letterSpacing: 1,
  },
  modalClear: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#FF3D00',
    letterSpacing: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 20,
  },
  filterSectionTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(10,10,10,0.5)',
    marginBottom: 14,
    letterSpacing: 2,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: '#0A0A0A',
    backgroundColor: '#F4F1EA',
  },
  filterOptionSelected: {
    backgroundColor: '#0A0A0A',
  },
  filterOptionText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#0A0A0A',
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },
  filterOptionTextSelected: {
    color: '#F4F1EA',
  },
  applyButton: {
    margin: 20,
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#0A0A0A',
  },
  applyGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
  },
  applyText: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: '700',
    color: '#F4F1EA',
    letterSpacing: 2,
  },
});