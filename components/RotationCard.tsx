import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface RotationCardProps {
  roleScores: {
    easy: number;
    long: number;
    speed: number;
    race: number;
  };
  insights?: string[];
  healthScore?: number;
}

const ROLE_INFO = {
  easy: { label: 'EASY DAYS', color: '#16A34A' },
  long: { label: 'LONG RUNS', color: '#2563EB' },
  speed: { label: 'SPEED WORK', color: '#D97706' },
  race: { label: 'RACE DAY', color: '#FF3D00' },
};

const getHealthColor = (score: number) => {
  if (score >= 80) return '#16A34A';
  if (score >= 60) return '#D97706';
  return '#FF3D00';
};

export function RotationCard({ roleScores, insights, healthScore }: RotationCardProps) {
  const maxScore = Math.max(...Object.values(roleScores), 1);

  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(100)}
      style={styles.wrapper}
    >
      {/* Hard shadow */}
      <View style={styles.shadow} />

      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.eyebrow}>// ARSENAL ANALYSIS</Text>
            <Text style={styles.title}>ROTATION FIT</Text>
          </View>
          {healthScore !== undefined && (
            <View style={[styles.scoreBadge, { borderColor: getHealthColor(healthScore) }]}>
              <Text style={[styles.scoreText, { color: getHealthColor(healthScore) }]}>
                {healthScore}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Role bars */}
        {Object.entries(roleScores).map(([role, score]) => {
          const info = ROLE_INFO[role as keyof typeof ROLE_INFO];
          const percentage = (score / maxScore) * 100;

          return (
            <View key={role} style={styles.roleRow}>
              <View style={styles.roleHeader}>
                <Text style={styles.roleLabel}>{info.label}</Text>
                <Text style={styles.roleScore}>{score}/10</Text>
              </View>
              <View style={styles.track}>
                <Animated.View
                  entering={FadeInUp.duration(600).delay(200)}
                  style={[styles.fill, {
                    width: `${percentage}%` as any,
                    backgroundColor: info.color,
                  }]}
                />
              </View>
            </View>
          );
        })}

        {/* Insights */}
        {insights && insights.length > 0 && (
          <View style={styles.insightsBox}>
            <Text style={styles.insightsLabel}>// INSIGHTS</Text>
            {insights.map((insight, i) => (
              <Text key={i} style={styles.insight}>
                — {insight}
              </Text>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginTop: 8,
    marginBottom: 8,
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
    backgroundColor: '#0A0A0A',
    borderWidth: 2,
    borderColor: '#0A0A0A',
    borderRadius: 2,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  eyebrow: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(244,241,234,0.4)',
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F4F1EA',
    letterSpacing: -0.5,
  },
  scoreBadge: {
    borderWidth: 2,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scoreText: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 2,
    backgroundColor: 'rgba(244,241,234,0.15)',
    marginBottom: 16,
  },
  roleRow: {
    marginBottom: 14,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  roleLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(244,241,234,0.5)',
    letterSpacing: 1.5,
  },
  roleScore: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#F4F1EA',
    fontWeight: '700',
  },
  track: {
    height: 4,
    backgroundColor: 'rgba(244,241,234,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  insightsBox: {
    borderWidth: 2,
    borderColor: 'rgba(244,241,234,0.15)',
    borderRadius: 2,
    padding: 12,
    marginTop: 8,
  },
  insightsLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(244,241,234,0.35)',
    letterSpacing: 2,
    marginBottom: 8,
  },
  insight: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: 'rgba(244,241,234,0.65)',
    lineHeight: 18,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
});
