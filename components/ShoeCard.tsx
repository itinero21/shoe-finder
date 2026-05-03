import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Shoe } from '../app/data/shoes';
import { Ionicons } from '@expo/vector-icons';

interface ShoeCardProps {
  shoe: Shoe & { reasons?: string[] };
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onCompare?: () => void;
  onBuyNow?: () => void;
  onLogRun?: () => void;
  index?: number;
  mileage?: number;
  showMileage?: boolean;
}

const CATEGORY_ACCENT: Record<string, string> = {
  carbon_plate_racing: '#FF3D00',
  trail: '#16A34A',
  stability: '#2563EB',
  motion_control: '#D97706',
  max_cushion: '#7C3AED',
  lightweight_speed: '#D4FF00',
  neutral: '#0A0A0A',
};

const getCategoryLabel = (category: string): string => {
  switch (category) {
    case 'carbon_plate_racing': return 'CARBON PLATE';
    case 'motion_control': return 'MOTION CTRL';
    case 'max_cushion': return 'MAX CUSHION';
    case 'lightweight_speed': return 'SPEED';
    default: return category.replace(/_/g, ' ').toUpperCase();
  }
};

const getMileageColor = (km: number): string => {
  if (km < 200) return '#16A34A';
  if (km < 500) return '#2563EB';
  if (km < 700) return '#D97706';
  return '#FF3D00';
};

const getMileageStatus = (km: number): string => {
  if (km < 200) return 'BREAKING IN';
  if (km < 500) return 'PRIME CONDITION';
  if (km < 700) return 'CONSIDER REPLACING';
  return 'TIME TO REPLACE';
};

export const ShoeCard: React.FC<ShoeCardProps> = ({
  shoe,
  isFavorite = false,
  onToggleFavorite,
  onCompare,
  onBuyNow,
  onLogRun,
  index = 0,
  mileage = 0,
  showMileage = false,
}) => {
  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handlePressIn = () => scale.value = withSpring(0.98);
  const handlePressOut = () => scale.value = withSpring(1);

  const handleFavoritePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    heartScale.value = withSpring(1.4, {}, () => {
      heartScale.value = withSpring(1);
    });
    onToggleFavorite?.();
  };

  const accentColor = CATEGORY_ACCENT[shoe.category] ?? '#0A0A0A';
  const isLightAccent = shoe.category === 'lightweight_speed';

  return (
    <Animated.View style={[styles.wrapper, animatedCardStyle]}>
      {/* Hard ink shadow */}
      <View style={styles.shadow} />

      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        {/* Top bar: rank + category tag + favorite */}
        <View style={styles.topBar}>
          <Text style={styles.rankLabel}>#{String(index + 1).padStart(2, '0')}</Text>

          <View style={[styles.categoryTag, { backgroundColor: accentColor }]}>
            <Text style={[styles.categoryTagText, isLightAccent && { color: '#0A0A0A' }]}>
              {getCategoryLabel(shoe.category)}
            </Text>
          </View>

          <TouchableOpacity onPress={handleFavoritePress} style={styles.favBtn}>
            <Animated.View style={animatedHeartStyle}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? '#FF3D00' : 'rgba(10,10,10,0.3)'}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Brand */}
        <Text style={styles.brand}>{shoe.brand.toUpperCase()}</Text>

        {/* Model */}
        <Text style={styles.model}>{shoe.model}</Text>

        {/* Spec row */}
        <View style={styles.specRow}>
          <View style={styles.specItem}>
            <Text style={styles.specValue}>{shoe.dropMm}mm</Text>
            <Text style={styles.specKey}>DROP</Text>
          </View>
          <View style={styles.specDivider} />
          <View style={styles.specItem}>
            <Text style={styles.specValue}>{shoe.stackMm}mm</Text>
            <Text style={styles.specKey}>STACK</Text>
          </View>
          <View style={styles.specDivider} />
          <View style={styles.specItem}>
            <Text style={styles.specValue}>{shoe.weightOz}oz</Text>
            <Text style={styles.specKey}>WEIGHT</Text>
          </View>
          <View style={styles.specDivider} />
          <View style={styles.specItem}>
            <Text style={styles.specValue}>${shoe.price}</Text>
            <Text style={styles.specKey}>PRICE</Text>
          </View>
        </View>

        {/* Mileage tracker */}
        {showMileage && (
          <View style={styles.mileageBox}>
            <View style={styles.mileageTopRow}>
              <Text style={styles.mileageLabel}>MILEAGE</Text>
              <Text style={[styles.mileageValue, { color: getMileageColor(mileage) }]}>
                {mileage.toFixed(1)} km
              </Text>
            </View>
            <View style={styles.mileageTrack}>
              <View style={[styles.mileageFill, {
                width: `${Math.min((mileage / 800) * 100, 100)}%` as any,
                backgroundColor: getMileageColor(mileage),
              }]} />
            </View>
            <Text style={styles.mileageStatus}>{getMileageStatus(mileage)}</Text>
          </View>
        )}

        {/* Notes */}
        <Text style={styles.notes}>{shoe.notes}</Text>

        {/* Reasons */}
        {shoe.reasons && shoe.reasons.length > 0 && (
          <View style={styles.reasons}>
            {shoe.reasons.map((r, i) => (
              <Text key={i} style={styles.reason}>— {r}</Text>
            ))}
          </View>
        )}

        {/* Action row */}
        <View style={styles.actions}>
          {showMileage && onLogRun && (
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onLogRun(); }} style={[styles.actionBtn, styles.actionBtnPrimary]}>
              <Text style={styles.actionBtnPrimaryText}>+ LOG RUN</Text>
            </TouchableOpacity>
          )}

          {onCompare && (
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onCompare(); }}
              style={[styles.actionBtn, styles.actionBtnSecondary]}
            >
              <Text style={styles.actionBtnSecondaryText}>COMPARE</Text>
            </TouchableOpacity>
          )}

          {!showMileage && onBuyNow && (
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onBuyNow(); }}
              style={[styles.actionBtn, styles.actionBtnPrimary, { flex: 2 }]}
            >
              <Text style={styles.actionBtnPrimaryText}>BUY NOW →</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
    marginHorizontal: 16,
    position: 'relative',
  },
  shadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: -6,
    bottom: -6,
    backgroundColor: '#0A0A0A',
    borderRadius: 2,
  },
  card: {
    backgroundColor: '#F4F1EA',
    borderWidth: 2,
    borderColor: '#0A0A0A',
    borderRadius: 2,
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  rankLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: 'rgba(10,10,10,0.35)',
    letterSpacing: 1,
  },
  categoryTag: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 2,
    alignSelf: 'flex-start',
  },
  categoryTagText: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: '#F4F1EA',
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  favBtn: {
    padding: 4,
  },
  brand: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: 'rgba(10,10,10,0.5)',
    letterSpacing: 2,
    marginBottom: 4,
  },
  model: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0A0A0A',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0A0A0A',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  specItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  specDivider: {
    width: 2,
    alignSelf: 'stretch',
    backgroundColor: '#0A0A0A',
  },
  specValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A0A0A',
    marginBottom: 2,
  },
  specKey: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    color: 'rgba(10,10,10,0.4)',
    letterSpacing: 1,
  },
  mileageBox: {
    borderWidth: 2,
    borderColor: '#0A0A0A',
    borderRadius: 2,
    padding: 12,
    marginBottom: 14,
  },
  mileageTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mileageLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(10,10,10,0.5)',
    letterSpacing: 1.5,
  },
  mileageValue: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: '700',
  },
  mileageTrack: {
    height: 4,
    backgroundColor: 'rgba(10,10,10,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  mileageFill: {
    height: '100%',
    borderRadius: 2,
  },
  mileageStatus: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(10,10,10,0.4)',
    letterSpacing: 1,
  },
  notes: {
    fontSize: 14,
    color: 'rgba(10,10,10,0.65)',
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  reasons: {
    marginBottom: 14,
  },
  reason: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: 'rgba(10,10,10,0.55)',
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimary: {
    backgroundColor: '#0A0A0A',
  },
  actionBtnPrimaryText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#F4F1EA',
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    borderWidth: 2,
    borderColor: '#0A0A0A',
    backgroundColor: 'transparent',
  },
  actionBtnSecondaryText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#0A0A0A',
    letterSpacing: 1.5,
    fontWeight: '700',
  },
});
