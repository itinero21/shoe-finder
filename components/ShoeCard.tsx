import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Shoe } from '../app/data/shoes';
import { Ionicons } from '@expo/vector-icons';

interface ShoeCardProps {
  shoe: Shoe & { reasons?: string[] };
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onCompare?: () => void;
  onBuyNow?: () => void;
  index?: number;
}

export const ShoeCard: React.FC<ShoeCardProps> = ({
  shoe,
  isFavorite = false,
  onToggleFavorite,
  onCompare,
  onBuyNow,
  index = 0,
}) => {
  const [imageError, setImageError] = useState(false);
  
  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handleFavoritePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    heartScale.value = withSpring(1.3, {}, () => {
      heartScale.value = withSpring(1);
    });
    onToggleFavorite?.();
  };

  const handleComparePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCompare?.();
  };

  const handleBuyPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBuyNow?.();
  };

  const getCategoryColor = (category: string): [string, string] => {
    switch (category.toLowerCase()) {
      case 'racing':
        return ['#ff6b6b', '#ee5a52'];
      case 'trail':
        return ['#51cf66', '#40c057'];
      case 'stability':
        return ['#74c0fc', '#339af0'];
      case 'neutral':
      default:
        return ['#845ec2', '#b39cd0'];
    }
  };


  return (
    <Animated.View
      style={[styles.container, animatedCardStyle]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        <LinearGradient
          colors={['#ffffff', '#f8f9ff']}
          style={styles.cardGradient}
        >
          {/* Header with favorite button */}
          <View style={styles.header}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{index + 1}</Text>
            </View>
            
            <TouchableOpacity
              onPress={handleFavoritePress}
              style={styles.favoriteButton}
            >
              <Animated.View style={animatedHeartStyle}>
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={24}
                  color={isFavorite ? '#ff6b6b' : '#adb5bd'}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Shoe Image */}
          <View style={styles.imageContainer}>
            {!imageError ? (
              <Image
                source={{ uri: shoe.image }}
                style={styles.shoeImage}
                onError={() => setImageError(true)}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="image-outline" size={40} color="#adb5bd" />
              </View>
            )}
          </View>

          {/* Shoe Info */}
          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Text style={styles.brand}>{shoe.brand}</Text>
            </View>
            
            <Text style={styles.model}>{shoe.model}</Text>
            
            {/* Category and Specs */}
            <View style={styles.specsContainer}>
              <LinearGradient
                colors={getCategoryColor(shoe.category)}
                style={styles.categoryBadge}
              >
                <Text style={styles.categoryText}>{shoe.category}</Text>
              </LinearGradient>
              
              <View style={styles.specBadge}>
                <Text style={styles.specText}>{shoe.cushion} cushion</Text>
              </View>
              
              <View style={styles.specBadge}>
                <Text style={styles.specText}>{shoe.terrain}</Text>
              </View>
            </View>

            {/* Notes */}
            <Text style={styles.whyThisShoe}>{shoe.notes}</Text>
            
            {/* Reasons */}
            {shoe.reasons && shoe.reasons.length > 0 && (
              <View style={styles.reasonsContainer}>
                <Text style={styles.reasonsTitle}>Perfect because:</Text>
                {shoe.reasons.map((reason, idx) => (
                  <Text key={idx} style={styles.reason}>• {reason}</Text>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={handleComparePress}
                style={[styles.actionButton, styles.compareButton]}
              >
                <Ionicons name="git-compare-outline" size={16} color="#6c757d" />
                <Text style={styles.compareText}>Compare</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleBuyPress}
                style={[styles.actionButton, styles.buyButton]}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.buyGradient}
                >
                  <Text style={styles.buyText}>Buy Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  cardGradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankBadge: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  favoriteButton: {
    padding: 4,
  },
  imageContainer: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  shoeImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brand: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
  },
  model: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 12,
  },
  specsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  specBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  specText: {
    fontSize: 12,
    color: '#6c757d',
    textTransform: 'capitalize',
  },
  whyThisShoe: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 12,
    lineHeight: 22,
  },
  reasonsContainer: {
    marginBottom: 16,
  },
  reasonsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 6,
  },
  reason: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    gap: 6,
  },
  compareText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
  },
  buyButton: {
    flex: 2,
  },
  buyGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});