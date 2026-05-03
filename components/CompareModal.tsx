import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Shoe } from '../app/data/shoes';

interface CompareModalProps {
  visible: boolean;
  onClose: () => void;
  shoes: Shoe[];
  selectedShoes: string[];
  onToggleShoe: (shoeId: string) => void;
  onCompare: (shoe1: Shoe, shoe2: Shoe) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  visible,
  onClose,
  shoes,
  selectedShoes,
  onToggleShoe,
  onCompare,
}) => {
  const handleCompare = () => {
    if (selectedShoes.length === 2) {
      const shoe1 = shoes.find(s => s.id === selectedShoes[0]);
      const shoe2 = shoes.find(s => s.id === selectedShoes[1]);
      if (shoe1 && shoe2) {
        onCompare(shoe1, shoe2);
      }
    } else {
      Alert.alert('Select 2 Shoes', 'Please select exactly 2 shoes to compare.');
    }
  };

  const isSelected = (shoeId: string) => selectedShoes.includes(shoeId);
  const canSelectMore = selectedShoes.length < 2;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <Animated.View entering={SlideInUp.delay(100)} style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.navBtn}>
            <Text style={styles.navBtnText}>← CANCEL</Text>
          </TouchableOpacity>

          <Text style={styles.title}>COMPARE</Text>

          <TouchableOpacity
            onPress={handleCompare}
            disabled={selectedShoes.length !== 2}
            style={styles.navBtn}
          >
            <Text style={[
              styles.navBtnText,
              selectedShoes.length === 2 && styles.navBtnTextActive
            ]}>
              GO →
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.indicator}>
          <Text style={styles.indicatorText}>
            {selectedShoes.length}/2 SELECTED
          </Text>
          <View style={styles.indicatorDots}>
            <View style={[styles.dot, selectedShoes.length >= 1 && styles.dotActive]} />
            <View style={[styles.dot, selectedShoes.length >= 2 && styles.dotActive]} />
          </View>
        </View>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {shoes.map((shoe, index) => (
            <Animated.View
              key={shoe.id}
              entering={FadeIn.delay(index * 40)}
            >
              <TouchableOpacity
                onPress={() => {
                  if (isSelected(shoe.id) || canSelectMore) {
                    onToggleShoe(shoe.id);
                  } else {
                    Alert.alert(
                      'Maximum Selection',
                      'Deselect one shoe first.'
                    );
                  }
                }}
                style={[
                  styles.shoeRow,
                  isSelected(shoe.id) && styles.shoeRowSelected,
                  !canSelectMore && !isSelected(shoe.id) && styles.shoeRowDisabled,
                ]}
              >
                <View style={styles.shoeInfo}>
                  <Text style={[styles.shoeBrand, isSelected(shoe.id) && styles.textLight]}>{shoe.brand.toUpperCase()}</Text>
                  <Text style={[styles.shoeModel, isSelected(shoe.id) && styles.textLightBold]}>{shoe.model}</Text>
                  <Text style={[styles.shoeSpecs, isSelected(shoe.id) && styles.textLight]}>
                    {shoe.specs.drop_mm}mm drop · {shoe.specs.weight_oz}oz
                  </Text>
                </View>

                <View style={[
                  styles.checkbox,
                  isSelected(shoe.id) && styles.checkboxSelected,
                ]}>
                  {isSelected(shoe.id) && (
                    <Ionicons name="checkmark" size={14} color="#F4F1EA" />
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#0A0A0A',
  },
  navBtn: {
    paddingVertical: 6,
  },
  navBtnText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: 'rgba(10,10,10,0.35)',
    letterSpacing: 1,
  },
  navBtnTextActive: {
    color: '#FF3D00',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0A0A0A',
    letterSpacing: 1,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#0A0A0A',
  },
  indicatorText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: 'rgba(10,10,10,0.5)',
    letterSpacing: 2,
  },
  indicatorDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#0A0A0A',
    backgroundColor: 'transparent',
  },
  dotActive: {
    backgroundColor: '#FF3D00',
    borderColor: '#FF3D00',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  shoeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F1EA',
    borderWidth: 2,
    borderColor: '#0A0A0A',
    borderRadius: 2,
    padding: 16,
    marginBottom: 10,
  },
  shoeRowSelected: {
    backgroundColor: '#0A0A0A',
  },
  shoeRowDisabled: {
    opacity: 0.35,
  },
  shoeInfo: {
    flex: 1,
  },
  shoeBrand: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    letterSpacing: 2,
    color: 'rgba(10,10,10,0.5)',
    marginBottom: 3,
  },
  shoeModel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A0A0A',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  shoeSpecs: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: 'rgba(10,10,10,0.45)',
    letterSpacing: 0.3,
  },
  textLight: {
    color: 'rgba(244,241,234,0.6)',
  },
  textLightBold: {
    color: '#F4F1EA',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: '#0A0A0A',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkboxSelected: {
    backgroundColor: '#FF3D00',
    borderColor: '#FF3D00',
  },
});
