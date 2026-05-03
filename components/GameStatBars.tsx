import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShoeGameStats, TIER_COLORS } from '../app/utils/gameEngine';

interface Props {
  stats: ShoeGameStats;
  compact?: boolean;
}

const STAT_LABELS: { key: keyof Omit<ShoeGameStats, 'tier' | 'overall'>; label: string; color: string }[] = [
  { key: 'speed',     label: 'SPD', color: '#FF3D00' },
  { key: 'endurance', label: 'END', color: '#2563EB' },
  { key: 'grip',      label: 'GRP', color: '#16A34A' },
  { key: 'comfort',   label: 'CMF', color: '#7C3AED' },
];

export const GameStatBars: React.FC<Props> = ({ stats, compact = false }) => {
  const tierColor = TIER_COLORS[stats.tier];

  if (compact) {
    return (
      <View style={styles.compactRow}>
        <View style={[styles.tierBadgeCompact, { borderColor: tierColor }]}>
          <Text style={[styles.tierTextCompact, { color: tierColor }]}>{stats.tier.toUpperCase()}</Text>
        </View>
        {STAT_LABELS.map(({ key, label, color }) => (
          <View key={key} style={styles.compactStat}>
            <Text style={styles.compactStatLabel}>{label}</Text>
            <Text style={[styles.compactStatVal, { color }]}>{stats[key]}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tier header */}
      <View style={styles.tierRow}>
        <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
          <Text style={styles.tierText}>{stats.tier.toUpperCase()}</Text>
        </View>
        <Text style={styles.overallLabel}>OVERALL {stats.overall}/10</Text>
      </View>

      {/* Stat bars */}
      {STAT_LABELS.map(({ key, label, color }) => (
        <View key={key} style={styles.statRow}>
          <Text style={styles.statLabel}>{label}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${stats[key] * 10}%` as any, backgroundColor: color }]} />
          </View>
          <Text style={[styles.statVal, { color }]}>{stats[key]}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderColor: '#0A0A0A',
    borderRadius: 2,
    padding: 14,
    marginBottom: 14,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 2,
  },
  tierText: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    fontWeight: '700',
    color: '#F4F1EA',
    letterSpacing: 1.5,
  },
  overallLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: 'rgba(10,10,10,0.5)',
    letterSpacing: 1,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  statLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(10,10,10,0.5)',
    letterSpacing: 1,
    width: 30,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(10,10,10,0.1)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 1,
  },
  statVal: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '700',
    width: 16,
    textAlign: 'right',
  },
  // Compact
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  tierBadgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
    borderWidth: 1.5,
  },
  tierTextCompact: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  compactStat: {
    alignItems: 'center',
  },
  compactStatLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 7,
    color: 'rgba(10,10,10,0.4)',
    letterSpacing: 0.5,
  },
  compactStatVal: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '700',
  },
});
