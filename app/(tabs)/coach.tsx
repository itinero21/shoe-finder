import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import RunningCoach from '../../components/RunningCoach';

export default function CoachScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>// STRIDE PROTOCOL</Text>
        <Text style={styles.title}>COACH.</Text>
        <Text style={styles.subtitle}>Running intelligence, no fluff</Text>
      </View>
      <RunningCoach />
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
