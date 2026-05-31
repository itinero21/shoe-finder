import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const INK = '#0A0A0A';
const PAPER = '#F4F1EA';
const STRAVA = '#FC4C02';
const GARMIN = '#007CC3';
const MONO = 'SpaceMono';

type MarkProps = {
  size?: 'sm' | 'md' | 'lg';
  inverted?: boolean;
};

const dims = {
  sm: { box: 30, text: 10, icon: 15 },
  md: { box: 42, text: 13, icon: 21 },
  lg: { box: 54, text: 16, icon: 28 },
};

export function StravaMark({ size = 'md', inverted = false }: MarkProps) {
  const d = dims[size];
  const fg = inverted ? PAPER : STRAVA;
  return (
    <View style={[s.box, { width: d.box, height: d.box, backgroundColor: inverted ? STRAVA : PAPER }]}>
      <View style={s.stravaPeaks}>
        <View style={[s.peakLarge, { borderBottomColor: fg }]} />
        <View style={[s.peakSmall, { borderBottomColor: fg }]} />
      </View>
    </View>
  );
}

export function AppleHealthMark({ size = 'md', inverted = false }: MarkProps) {
  const d = dims[size];
  return (
    <View style={[s.box, { width: d.box, height: d.box, backgroundColor: inverted ? INK : PAPER }]}>
      <Ionicons name="logo-apple" size={d.icon} color={inverted ? PAPER : INK} />
    </View>
  );
}

export function GarminMark({ size = 'md', inverted = false }: MarkProps) {
  const d = dims[size];
  return (
    <View style={[s.box, { width: d.box, height: d.box, backgroundColor: inverted ? GARMIN : PAPER }]}>
      <Text style={[s.garminText, { fontSize: d.text, color: inverted ? PAPER : GARMIN }]}>G</Text>
      <View style={[s.garminTriangle, { borderBottomColor: inverted ? PAPER : GARMIN }]} />
    </View>
  );
}

export function Wordmark({ brand }: { brand: 'strava' | 'apple' | 'garmin' }) {
  const color = brand === 'strava' ? STRAVA : brand === 'garmin' ? GARMIN : INK;
  const label = brand === 'apple' ? 'APPLE HEALTH' : brand.toUpperCase();
  return <Text style={[s.wordmark, { color }]}>{label}</Text>;
}

const s = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 2,
  },
  stravaPeaks: {
    width: 23,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peakLarge: {
    position: 'absolute',
    left: 2,
    bottom: 1,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 17,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  peakSmall: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  garminText: {
    fontFamily: MONO,
    fontWeight: '900',
    letterSpacing: 0,
  },
  garminTriangle: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  wordmark: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
