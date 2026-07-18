/**
 * HALL OF FAME — Career museum told through shoes.
 * NOT a leveling mechanic. A retrospective wall of plaques.
 * No points, no levels, no progress bars.
 */
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LivingShoe, ShoeMemorial } from '../app/types/character';
import { Shoe } from '../app/data/shoes';

const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const MONO   = 'SpaceMono';

interface HallOfFameProps {
  visible: boolean;
  onClose: () => void;
  livingShoes: LivingShoe[];
  memorials: ShoeMemorial[];
  shoeDataMap: Record<string, Shoe>;
  totalRuns: number;
}

interface Plaque {
  icon: string;
  title: string;
  value: string;
  detail: string;
}

export const HallOfFame: React.FC<HallOfFameProps> = ({
  visible, onClose, livingShoes, memorials, shoeDataMap, totalRuns,
}) => {
  const allShoes = [...livingShoes.map(c => ({
    id: c.shoeId, miles: c.totalMiles, runs: c.runCount, name: shoeDataMap[c.shoeId]
      ? `${shoeDataMap[c.shoeId].brand} ${shoeDataMap[c.shoeId].model}` : 'Unknown',
  })), ...memorials.map(m => ({
    id: m.shoeId, miles: m.totalMiles, runs: m.runCount, name: `${m.brand} ${m.model}`,
  }))];

  const totalMiles = allShoes.reduce((s, sh) => s + sh.miles, 0);
  const totalShoesRetired = memorials.length;
  const totalShoesActive = livingShoes.filter(c => c.lifeStage !== 'departed').length;

  // Records
  const fastest = allShoes.length > 0
    ? allShoes.reduce((best, sh) => sh.runs > 0 && sh.miles / sh.runs > (best.miles / Math.max(best.runs, 1)) ? sh : best, allShoes[0])
    : null;
  const mostLoyal = allShoes.length > 0
    ? allShoes.reduce((best, sh) => sh.runs > best.runs ? sh : best, allShoes[0])
    : null;
  const longest = allShoes.length > 0
    ? allShoes.reduce((best, sh) => sh.miles > best.miles ? sh : best, allShoes[0])
    : null;
  const mostMemorable = memorials.length > 0
    ? memorials.reduce((best, m) => m.rating > best.rating ? m : best, memorials[0])
    : null;

  const plaques: Plaque[] = [
    { icon: 'walk-outline', title: 'LIFETIME DISTANCE', value: `${Math.round(totalMiles)} mi`, detail: `Across ${allShoes.length} shoes` },
    { icon: 'footsteps-outline', title: 'SHOES ACTIVE', value: String(totalShoesActive), detail: 'Currently in the closet' },
    { icon: 'archive-outline', title: 'SHOES RETIRED', value: String(totalShoesRetired), detail: 'Retired with honors' },
    { icon: 'stats-chart-outline', title: 'TOTAL RUNS', value: String(totalRuns), detail: 'Every step counts' },
  ];

  if (longest) plaques.push({ icon: 'map-outline', title: 'MOST MILES', value: `${Math.round(longest.miles)} mi`, detail: longest.name });
  if (mostLoyal) plaques.push({ icon: 'heart-outline', title: 'MOST LOYAL', value: `${mostLoyal.runs} runs`, detail: mostLoyal.name });
  if (fastest && fastest.runs > 0) plaques.push({ icon: 'flash-outline', title: 'LONGEST AVG', value: `${(fastest.miles / fastest.runs).toFixed(1)} mi/run`, detail: fastest.name });
  if (mostMemorable) plaques.push({ icon: 'star-outline', title: 'HIGHEST RATED', value: '★'.repeat(mostMemorable.rating), detail: `${mostMemorable.brand} ${mostMemorable.model}` });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.closeText}>CLOSE</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>HALL OF FAME</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.subtitle}>Your running life, told through shoes.</Text>

          {plaques.map((p, i) => (
            <View key={i} style={s.plaque}>
              <Ionicons name={p.icon as any} size={20} color={ACCENT} style={s.plaqueIcon as any} />
              <View style={s.plaqueContent}>
                <Text style={s.plaqueTitle}>{p.title}</Text>
                <Text style={s.plaqueValue}>{p.value}</Text>
                <Text style={s.plaqueDetail}>{p.detail}</Text>
              </View>
            </View>
          ))}

          {allShoes.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyText}>Add shoes and log runs to build your legacy.</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 2, borderBottomColor: INK },
  closeText: { fontFamily: MONO, fontSize: 11, color: INK, letterSpacing: 1 },
  headerTitle: { fontSize: 14, fontWeight: '900', color: INK, letterSpacing: 2 },
  scroll: { padding: 20 },
  subtitle: { fontFamily: MONO, fontSize: 11, color: 'rgba(10,10,10,0.5)', marginBottom: 24, lineHeight: 17 },

  plaque: { flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 16, marginBottom: 12 },
  plaqueIcon: { marginTop: 2 },
  plaqueContent: { flex: 1 },
  plaqueTitle: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 4 },
  plaqueValue: { fontSize: 22, fontWeight: '900', color: INK, letterSpacing: -0.5, marginBottom: 2 },
  plaqueDetail: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)' },

  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.35)', textAlign: 'center' },
});
