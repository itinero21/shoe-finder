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
  Alert,
} from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
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
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Select Shoes to Compare</Text>
          
          <TouchableOpacity
            onPress={handleCompare}
            disabled={selectedShoes.length !== 2}
            style={[
              styles.compareHeaderButton,
              selectedShoes.length === 2 && styles.compareHeaderButtonActive
            ]}
          >
            <Text style={[
              styles.compareHeaderText,
              selectedShoes.length === 2 && styles.compareHeaderTextActive
            ]}>
              Compare
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.selectionIndicator}>
          <Text style={styles.selectionText}>
            {selectedShoes.length}/2 shoes selected
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {shoes.map((shoe, index) => (
            <Animated.View
              key={shoe.id}
              entering={FadeIn.delay(index * 50)}
            >
              <TouchableOpacity
                onPress={() => {
                  if (isSelected(shoe.id) || canSelectMore) {
                    onToggleShoe(shoe.id);
                  } else {
                    Alert.alert(
                      'Maximum Selection',
                      'You can only compare 2 shoes at a time. Deselect one first.'
                    );
                  }
                }}
                style={[
                  styles.shoeItem,
                  isSelected(shoe.id) && styles.shoeItemSelected,
                  !canSelectMore && !isSelected(shoe.id) && styles.shoeItemDisabled
                ]}
              >
                <View style={styles.shoeContent}>
                  <Image
                    source={{ uri: shoe.image }}
                    style={styles.shoeImage}
                    resizeMode="contain"
                  />
                  
                  <View style={styles.shoeInfo}>
                    <Text style={styles.shoeBrand}>{shoe.brand}</Text>
                    <Text style={styles.shoeModel}>{shoe.model}</Text>
                    
                    <View style={styles.shoeSpecs}>
                      <Text style={styles.specText}>{shoe.category}</Text>
                      <Text style={styles.specDot}>•</Text>
                      <Text style={styles.specText}>{shoe.cushion}</Text>
                      <Text style={styles.specDot}>•</Text>
                      <Text style={styles.specText}>{shoe.terrain}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.selectionCheckbox}>
                    {isSelected(shoe.id) ? (
                      <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.selectedCheckbox}
                      >
                        <Ionicons name="checkmark" size={16} color="white" />
                      </LinearGradient>
                    ) : (
                      <View style={[
                        styles.unselectedCheckbox,
                        !canSelectMore && styles.disabledCheckbox
                      ]} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
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
  cancelText: {
    fontSize: 16,
    color: '#667eea',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  compareHeaderButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  compareHeaderButtonActive: {
    backgroundColor: '#667eea',
  },
  compareHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#adb5bd',
  },
  compareHeaderTextActive: {
    color: 'white',
  },
  selectionIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  selectionText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingVertical: 16,
  },
  shoeItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  shoeItemSelected: {
    borderColor: '#667eea',
    backgroundColor: '#f8f9ff',
  },
  shoeItemDisabled: {
    opacity: 0.5,
  },
  shoeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shoeImage: {
    width: 80,
    height: 60,
    marginRight: 16,
  },
  shoeInfo: {
    flex: 1,
  },
  shoeBrand: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  shoeModel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  shoeSpecs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specText: {
    fontSize: 12,
    color: '#6c757d',
    textTransform: 'capitalize',
  },
  specDot: {
    fontSize: 12,
    color: '#adb5bd',
    marginHorizontal: 6,
  },
  selectionCheckbox: {
    width: 24,
    height: 24,
    marginLeft: 12,
  },
  selectedCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    backgroundColor: 'white',
  },
  disabledCheckbox: {
    borderColor: '#f1f3f4',
    backgroundColor: '#f8f9fa',
  },
});