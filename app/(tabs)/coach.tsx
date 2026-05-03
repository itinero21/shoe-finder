import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import RunningCoachChat from '../../components/RunningCoachChat';
import { RunningCoachContext } from '../services/openai';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CoachScreen() {
  const [context, setContext] = useState<RunningCoachContext>({});

  useEffect(() => {
    loadUserContext();
  }, []);

  const loadUserContext = async () => {
    try {
      const rotationData = await AsyncStorage.getItem('userRotation');
      const rotation = rotationData ? JSON.parse(rotationData) : [];

      const scanResultsData = await AsyncStorage.getItem('scanResults');
      const scanResults = scanResultsData ? JSON.parse(scanResultsData) : null;

      setContext({
        userRotation: rotation.map((shoe: any) => ({
          name: shoe.name,
          mileage: shoe.mileage || 0,
          category: shoe.category,
        })),
        userProfile: scanResults
          ? {
              archType: scanResults.archType,
              pronation: scanResults.pronation,
              width: scanResults.width,
            }
          : undefined,
      });
    } catch (error) {
      console.error('Error loading user context:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>// STRIDE PROTOCOL</Text>
        <Text style={styles.title}>COACH.</Text>
        <Text style={styles.subtitle}>AI-powered running intelligence</Text>
      </View>
      <RunningCoachChat context={context} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#0A0A0A',
    backgroundColor: '#F4F1EA',
  },
  eyebrow: {
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
});
