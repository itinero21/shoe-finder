import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated as RNAnimated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile, advanceInjuryPhase, clearActiveInjury, ActiveInjury, InjuryPhase } from '../app/utils/userProfile';

const INK   = '#0A0A0A';
const PAPER = '#F4F1EA';
const ACCENT = '#FF3D00';
const MONO  = 'SpaceMono';

const PHASE_CONFIG: Record<InjuryPhase, {
  color: string;
  bg: string;
  label: string;
  icon: string;
  advice: string;
  cta: string;
}> = {
  acute: {
    color: '#FF3D00',
    bg: '#FFF1EE',
    label: 'ACUTE PHASE',
    icon: '!!',
    advice: 'Rest is recovery. Avoid high-impact runs. Prioritize cushioned, low-drop shoes only.',
    cta: 'FEELING BETTER?',
  },
  subacute: {
    color: '#D97706',
    bg: '#FFFBEB',
    label: 'SUB-ACUTE',
    icon: '!',
    advice: 'Easy walking and gentle movement OK. No speed work. Monitor for pain flare-ups.',
    cta: 'PAIN FREE? ADVANCE',
  },
  return: {
    color: '#2563EB',
    bg: '#EFF6FF',
    label: 'RETURN TO RUN',
    icon: 'RTR',
    advice: 'Start with run/walk intervals. Keep effort easy. Use your most cushioned shoe.',
    cta: 'RUNNING WELL? NEXT',
  },
  maintenance: {
    color: '#16A34A',
    bg: '#F0FDF4',
    label: 'MAINTENANCE',
    icon: 'OK',
    advice: 'Back to normal training. Stay mindful of load spikes. Strength work recommended.',
    cta: 'FULLY RECOVERED',
  },
};

interface InjuryBannerProps {
  onInjuryCleared?: () => void;
}

export function InjuryBanner({ onInjuryCleared }: InjuryBannerProps) {
  const [injury, setInjury] = useState<ActiveInjury | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = React.useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    loadInjury();
  }, []);

  const loadInjury = async () => {
    const profile = await getUserProfile();
    setInjury(profile.active_injury);
  };

  const handleAdvance = async () => {
    setIsLoading(true);
    if (injury?.phase === 'maintenance') {
      await clearActiveInjury();
      RNAnimated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setInjury(null);
        onInjuryCleared?.();
      });
    } else {
      await advanceInjuryPhase();
      await loadInjury();
    }
    setIsLoading(false);
  };

  if (!injury) return null;

  const config = PHASE_CONFIG[injury.phase];

  return (
    <RNAnimated.View style={[s.wrapper, { opacity: fadeAnim }]}>
      <View style={[s.banner, { backgroundColor: config.bg, borderColor: config.color }]}>
        {/* Main row */}
        <TouchableOpacity style={s.mainRow} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
          <Text style={s.icon}>{config.icon}</Text>
          <View style={s.labelCol}>
            <View style={s.topRow}>
              <Text style={[s.phase, { color: config.color }]}>{config.label}</Text>
              <Text style={s.injuryType}>{injury.injury_type.replace(/_/g, ' ').toUpperCase()}</Text>
            </View>
            {!expanded && (
              <Text style={s.previewText} numberOfLines={1}>{config.advice}</Text>
            )}
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={config.color}
          />
        </TouchableOpacity>

        {/* Expanded content */}
        {expanded && (
          <View style={s.expandedContent}>
            <View style={[s.adviceLine, { borderLeftColor: config.color }]}>
              <Text style={s.adviceText}>{config.advice}</Text>
            </View>

            {injury.shoes_to_avoid.length > 0 && (
              <View style={s.shoesRow}>
                <Text style={s.shoesLabel}>AVOID:</Text>
                <Text style={s.shoesValue}>{injury.shoes_to_avoid.join(', ')}</Text>
              </View>
            )}

            {injury.shoes_recommended.length > 0 && (
              <View style={s.shoesRow}>
                <Text style={[s.shoesLabel, { color: '#16A34A' }]}>USE:</Text>
                <Text style={s.shoesValue}>{injury.shoes_recommended.join(', ')}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.ctaBtn, { borderColor: config.color, backgroundColor: config.color }]}
              onPress={handleAdvance}
              disabled={isLoading}
            >
              <Text style={s.ctaBtnText}>
                {injury.phase === 'maintenance' ? 'MARK RECOVERED' : config.cta}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </RNAnimated.View>
  );
}

const s = StyleSheet.create({
  wrapper: { marginHorizontal: 16, marginBottom: 8 },
  banner: {
    borderWidth: 2, borderRadius: 2, overflow: 'hidden',
  },
  mainRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10, gap: 10,
  },
  icon: { fontFamily: MONO, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  labelCol: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  phase: {
    fontFamily: MONO, fontSize: 9, fontWeight: '700', letterSpacing: 1.5,
  },
  injuryType: {
    fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 1,
  },
  previewText: {
    fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.5)',
  },
  expandedContent: {
    paddingHorizontal: 12, paddingBottom: 14, paddingTop: 4,
    borderTopWidth: 1, borderTopColor: 'rgba(10,10,10,0.1)',
  },
  adviceLine: {
    borderLeftWidth: 3, paddingLeft: 10, marginBottom: 12,
  },
  adviceText: {
    fontSize: 13, color: INK, lineHeight: 20,
  },
  shoesRow: {
    flexDirection: 'row', gap: 8, marginBottom: 6, flexWrap: 'wrap',
  },
  shoesLabel: {
    fontFamily: MONO, fontSize: 9, fontWeight: '700', color: ACCENT, letterSpacing: 1,
  },
  shoesValue: {
    fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.6)', flex: 1,
  },
  ctaBtn: {
    marginTop: 10, paddingVertical: 10, borderRadius: 2,
    borderWidth: 2, alignItems: 'center',
  },
  ctaBtnText: {
    fontFamily: MONO, fontSize: 10, fontWeight: '700', color: PAPER, letterSpacing: 1.5,
  },
});
