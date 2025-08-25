import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Shoe } from '../app/data/shoes';

interface ComparisonViewProps {
  visible: boolean;
  onClose: () => void;
  shoe1: Shoe;
  shoe2: Shoe;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 48) / 2; // 48 = padding + gap

interface ComparisonRowProps {
  label: string;
  value1: string | number;
  value2: string | number;
  icon?: string;
}

const ComparisonRow: React.FC<ComparisonRowProps> = ({
  label,
  value1,
  value2,
  icon,
}) => {
  const formatValue = (value: string | number) => {
    return String(value);
  };

  const getValue1 = formatValue(value1);
  const getValue2 = formatValue(value2);
  
  // Determine which is "better" for highlighting
  const getBetterValue = () => {
    if (label === 'Cushion') {
      const cushionOrder = ['moderate', 'high', 'max'];
      const idx1 = cushionOrder.indexOf(String(value1).toLowerCase());
      const idx2 = cushionOrder.indexOf(String(value2).toLowerCase());
      return idx1 > idx2 ? 'left' : idx1 < idx2 ? 'right' : 'equal';
    }
    return 'equal';
  };

  const betterValue = getBetterValue();

  return (
    <View style={styles.comparisonRow}>
      <View style={styles.rowLabel}>
        {icon && <Ionicons name={icon as any} size={16} color="#6c757d" />}
        <Text style={styles.rowLabelText}>{label}</Text>
      </View>
      
      <View style={styles.rowValues}>
        <View style={[
          styles.valueContainer,
          betterValue === 'left' && styles.betterValue
        ]}>
          <Text style={[
            styles.valueText,
            betterValue === 'left' && styles.betterValueText
          ]}>
            {getValue1}
          </Text>
        </View>
        
        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>vs</Text>
        </View>
        
        <View style={[
          styles.valueContainer,
          betterValue === 'right' && styles.betterValue
        ]}>
          <Text style={[
            styles.valueText,
            betterValue === 'right' && styles.betterValueText
          ]}>
            {getValue2}
          </Text>
        </View>
      </View>
    </View>
  );
};

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  visible,
  onClose,
  shoe1,
  shoe2,
}) => {
  const [imageError1, setImageError1] = useState(false);
  const [imageError2, setImageError2] = useState(false);

  const getCategoryColor = (category: string): [string, string] => {
    switch (category) {
      case 'racing':
      case 'super-shoe':
        return ['#ff6b6b', '#ee5a52'];
      case 'trail':
        return ['#51cf66', '#40c057'];
      case 'walking':
        return ['#74c0fc', '#339af0'];
      default:
        return ['#845ec2', '#b39cd0'];
    }
  };

  const ShoeCard: React.FC<{ shoe: Shoe; onImageError: () => void; imageError: boolean }> = ({
    shoe,
    onImageError,
    imageError,
  }) => (
    <View style={styles.shoeCard}>
      <LinearGradient
        colors={['#ffffff', '#f8f9ff']}
        style={styles.shoeCardGradient}
      >
        <View style={styles.shoeImageContainer}>
          {!imageError ? (
            <Image
              source={{ uri: shoe.image }}
              style={styles.shoeImage}
              onError={onImageError}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={32} color="#adb5bd" />
            </View>
          )}
        </View>
        
        <Text style={styles.shoeBrand}>{shoe.brand}</Text>
        <Text style={styles.shoeModel}>{shoe.model}</Text>
        
        <LinearGradient
          colors={getCategoryColor(shoe.category)}
          style={styles.categoryBadge}
        >
          <Text style={styles.categoryText}>{shoe.category.replace('-', ' ')}</Text>
        </LinearGradient>
      </LinearGradient>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
        <Animated.View entering={SlideInUp.delay(100)} style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#212529" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Shoe Comparison</Text>
          
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#212529" />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Shoe Cards */}
          <Animated.View entering={FadeIn.delay(200)} style={styles.shoesContainer}>
            <ShoeCard
              shoe={shoe1}
              onImageError={() => setImageError1(true)}
              imageError={imageError1}
            />
            <ShoeCard
              shoe={shoe2}
              onImageError={() => setImageError2(true)}
              imageError={imageError2}
            />
          </Animated.View>

          {/* Comparison Table */}
          <Animated.View entering={FadeIn.delay(400)} style={styles.comparisonContainer}>
            <Text style={styles.sectionTitle}>Detailed Comparison</Text>
            
            <View style={styles.comparisonTable}>
              <ComparisonRow
                label="Category"
                value1={shoe1.category}
                value2={shoe2.category}
                icon="library-outline"
              />
              
              <ComparisonRow
                label="Cushion"
                value1={shoe1.cushion}
                value2={shoe2.cushion}
                icon="layers-outline"
              />
              
              <ComparisonRow
                label="Terrain"
                value1={shoe1.terrain}
                value2={shoe2.terrain}
                icon="trail-sign-outline"
              />
            </View>
          </Animated.View>

          {/* Descriptions */}
          <Animated.View entering={FadeIn.delay(600)} style={styles.descriptionsContainer}>
            <Text style={styles.sectionTitle}>Why These Shoes?</Text>
            
            <View style={styles.descriptionsGrid}>
              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionBrand}>{shoe1.brand}</Text>
                <Text style={styles.descriptionModel}>{shoe1.model}</Text>
                <Text style={styles.descriptionText}>{shoe1.notes}</Text>
              </View>
              
              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionBrand}>{shoe2.brand}</Text>
                <Text style={styles.descriptionModel}>{shoe2.model}</Text>
                <Text style={styles.descriptionText}>{shoe2.notes}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View entering={FadeIn.delay(800)} style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.actionGradient}
              >
                <Text style={styles.actionText}>Choose {shoe1.model}</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.actionGradient}
              >
                <Text style={styles.actionText}>Choose {shoe2.model}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  content: {
    flex: 1,
  },
  shoesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
  },
  shoeCard: {
    width: cardWidth,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  shoeCardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  shoeImageContainer: {
    height: 100,
    width: '100%',
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
  shoeBrand: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  shoeModel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  comparisonContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  comparisonTable: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  comparisonRow: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  rowLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  rowValues: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueContainer: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  betterValue: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#667eea',
  },
  valueText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  betterValueText: {
    color: '#667eea',
    fontWeight: '600',
  },
  vsContainer: {
    paddingHorizontal: 12,
  },
  vsText: {
    fontSize: 12,
    color: '#adb5bd',
    fontWeight: '600',
  },
  descriptionsContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  descriptionsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  descriptionCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  descriptionBrand: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  descriptionModel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});