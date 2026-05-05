import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Shoe } from '../app/data/shoes';
import { QuizAnswers } from '../app/utils/scoring';
import { explainShoe } from '../app/utils/whyNot';
import { SHOES } from '../app/data/shoes';

interface Props {
  visible: boolean;
  shoe: Shoe | null;
  answers: QuizAnswers | null;
  onClose: () => void;
}

export const WhyNotModal: React.FC<Props> = ({ visible, shoe, answers, onClose }) => {
  const [showDeep, setShowDeep] = useState(false);

  if (!shoe || !answers) return null;

  const result = explainShoe(shoe, answers, SHOES);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.eyebrow}>// WHY NOT?</Text>
            <Text style={s.headerShoe}>{shoe.brand} {shoe.model}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={22} color="#0A0A0A" />
          </TouchableOpacity>
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Verdict */}
          <View style={s.verdictCard}>
            <View style={s.verdictShadow} />
            <View style={s.verdictInner}>
              <Text style={s.verdictEyebrow}>// VERDICT</Text>
              <Text style={s.verdictHeadline}>{result.headline.toUpperCase()}</Text>
            </View>
          </View>

          {/* Rule explanation */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>▎ THE REASON</Text>
            <Text style={s.sectionBody}>{result.rule_explanation}</Text>
          </View>

          {/* Biomech detail — collapsible */}
          <TouchableOpacity
            onPress={() => setShowDeep(!showDeep)}
            style={s.deepToggle}
          >
            <Text style={s.deepToggleText}>
              {showDeep ? '▾ HIDE SCIENCE' : '▸ THE SCIENCE — TELL ME MORE'}
            </Text>
          </TouchableOpacity>

          {showDeep && (
            <View style={s.deepCard}>
              <Text style={s.deepText}>{result.biomech_detail}</Text>
            </View>
          )}

          {/* Alternatives */}
          {result.alternatives.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>▎ BETTER OPTIONS FOR YOU</Text>
              {result.alternatives.map(({ shoe: alt, reason }, i) => (
                <View key={alt.id} style={s.altCard}>
                  <View style={s.altShadow} />
                  <View style={s.altInner}>
                    <View style={s.altRank}>
                      <Text style={s.altRankText}>/{String(i + 1).padStart(2, '0')}/</Text>
                    </View>
                    <View style={s.altText}>
                      <Text style={s.altBrand}>{alt.brand.toUpperCase()}</Text>
                      <Text style={s.altModel}>{alt.model}</Text>
                      <Text style={s.altReason}>{reason}</Text>
                    </View>
                    <Text style={s.altPrice}>${alt.price_usd}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Override option */}
          <View style={s.overrideSection}>
            <Text style={s.overrideLabel}>// DISAGREE?</Text>
            <Text style={s.overrideText}>
              These are evidence-based rules, not laws. If you know your body and want to run in this shoe anyway, that's valid.
            </Text>
            <TouchableOpacity onPress={onClose} style={s.overrideBtn}>
              <Text style={s.overrideBtnText}>SHOW ME ANYWAY</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F1EA' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#0A0A0A',
  },
  headerLeft: { flex: 1 },
  eyebrow: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: '#FF3D00',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerShoe: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0A0A0A',
    letterSpacing: -0.3,
  },
  closeBtn: { padding: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },

  verdictCard: { position: 'relative', marginBottom: 24 },
  verdictShadow: {
    position: 'absolute',
    top: 5, left: 5, right: -5, bottom: -5,
    backgroundColor: '#FF3D00',
    borderRadius: 2,
  },
  verdictInner: {
    backgroundColor: '#0A0A0A',
    borderWidth: 2,
    borderColor: '#0A0A0A',
    borderRadius: 2,
    padding: 20,
  },
  verdictEyebrow: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(244,241,234,0.5)',
    letterSpacing: 2,
    marginBottom: 6,
  },
  verdictHeadline: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F4F1EA',
    letterSpacing: -0.5,
    lineHeight: 28,
  },

  section: { marginBottom: 24 },
  sectionLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(10,10,10,0.4)',
    letterSpacing: 2,
    marginBottom: 10,
  },
  sectionBody: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    color: '#0A0A0A',
    lineHeight: 20,
    letterSpacing: 0.2,
  },

  deepToggle: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(10,10,10,0.15)',
    marginBottom: 16,
  },
  deepToggleText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: '#FF3D00',
    letterSpacing: 1,
    fontWeight: '700',
  },
  deepCard: {
    backgroundColor: 'rgba(10,10,10,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.15)',
    borderRadius: 2,
    padding: 16,
    marginBottom: 24,
  },
  deepText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: 'rgba(10,10,10,0.7)',
    lineHeight: 19,
    letterSpacing: 0.2,
  },

  altCard: { position: 'relative', marginBottom: 14 },
  altShadow: {
    position: 'absolute',
    top: 4, left: 4, right: -4, bottom: -4,
    backgroundColor: '#0A0A0A',
    borderRadius: 2,
  },
  altInner: {
    backgroundColor: '#F4F1EA',
    borderWidth: 2,
    borderColor: '#0A0A0A',
    borderRadius: 2,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  altRank: {
    width: 36,
    alignItems: 'center',
  },
  altRankText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: 'rgba(10,10,10,0.3)',
  },
  altText: { flex: 1 },
  altBrand: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(10,10,10,0.4)',
    letterSpacing: 1.5,
  },
  altModel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A0A0A',
    marginBottom: 2,
  },
  altReason: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(10,10,10,0.5)',
    letterSpacing: 0.3,
    lineHeight: 14,
  },
  altPrice: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: '700',
    color: '#0A0A0A',
  },

  overrideSection: {
    marginTop: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.2)',
    borderRadius: 2,
  },
  overrideLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(10,10,10,0.4)',
    letterSpacing: 2,
    marginBottom: 6,
  },
  overrideText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: 'rgba(10,10,10,0.55)',
    lineHeight: 16,
    marginBottom: 12,
  },
  overrideBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#0A0A0A',
    borderRadius: 2,
  },
  overrideBtnText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    fontWeight: '700',
    color: '#0A0A0A',
    letterSpacing: 1,
  },
});
