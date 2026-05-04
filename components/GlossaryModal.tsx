import React, { useState } from 'react';
import {
  View, Text, Modal, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GLOSSARY, GlossaryEntry, getAllTerms } from '../app/utils/glossary';

const INK   = '#0A0A0A';
const PAPER = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME  = '#D4FF00';
const MONO  = 'SpaceMono';

interface GlossaryModalProps {
  visible: boolean;
  onClose: () => void;
  /** If provided, opens directly to that term */
  initialTerm?: string | null;
}

export function GlossaryModal({ visible, onClose, initialTerm }: GlossaryModalProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(initialTerm ?? null);
  const allTerms = getAllTerms();
  const entry: GlossaryEntry | null = selectedKey ? (GLOSSARY[selectedKey] ?? null) : null;

  const handleClose = () => {
    setSelectedKey(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.container}>
        {/* Header */}
        <View style={s.header}>
          {entry ? (
            <TouchableOpacity onPress={() => setSelectedKey(null)} style={s.backBtn}>
              <Ionicons name="arrow-back" size={20} color={INK} />
              <Text style={s.backText}>ALL TERMS</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.headerLeft}>
              <Text style={s.eyebrow}>// STRIDE PROTOCOL</Text>
              <Text style={s.title}>GLOSSARY.</Text>
            </View>
          )}
          <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
            <Ionicons name="close" size={22} color={INK} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={s.scroll} contentContainerStyle={s.scrollContent}>
          {entry ? (
            /* ─── Term detail view ─── */
            <Animated.View entering={FadeInDown.springify()}>
              {/* Term card */}
              <View style={s.termCard}>
                <View style={s.termDot} />
                <Text style={s.termName}>{entry.term.toUpperCase()}</Text>
              </View>

              {/* Plain English */}
              <View style={s.section}>
                <Text style={s.sectionLabel}>PLAIN ENGLISH</Text>
                <Text style={s.sectionBody}>{entry.plain}</Text>
              </View>

              {/* Divider */}
              <View style={s.divider} />

              {/* Deep dive */}
              <View style={s.section}>
                <View style={s.sectionLabelRow}>
                  <Text style={s.sectionLabel}>THE SCIENCE</Text>
                  <View style={s.limeBadge}><Text style={s.limeBadgeText}>DEEP</Text></View>
                </View>
                <Text style={s.sectionBody}>{entry.deep}</Text>
              </View>

              <View style={s.divider} />

              {/* Myth buster */}
              <View style={[s.section, s.mythCard]}>
                <View style={s.mythHeader}>
                  <Text style={s.mythIcon}>⚡</Text>
                  <Text style={s.mythLabel}>MYTH BUSTER</Text>
                </View>
                <Text style={s.mythBody}>{entry.myth_buster}</Text>
              </View>

              {/* Related terms nudge */}
              <View style={s.relatedRow}>
                <Text style={s.relatedLabel}>EXPLORE MORE TERMS</Text>
                <TouchableOpacity onPress={() => setSelectedKey(null)}>
                  <Text style={s.relatedLink}>VIEW ALL →</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : (
            /* ─── Term list view ─── */
            <>
              <Text style={s.listSubtitle}>
                {allTerms.length} biomechanical terms explained in plain English.
              </Text>
              {allTerms.map((t, i) => {
                const key = Object.keys(GLOSSARY).find(k => GLOSSARY[k] === t) ?? '';
                return (
                  <Animated.View key={key} entering={FadeInDown.delay(i * 40).springify()}>
                    <TouchableOpacity
                      style={s.termRow}
                      onPress={() => setSelectedKey(key)}
                    >
                      <View style={s.termRowLeft}>
                        <Text style={s.termRowName}>{t.term}</Text>
                        <Text style={s.termRowPlain} numberOfLines={2}>{t.plain}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="rgba(10,10,10,0.3)" />
                    </TouchableOpacity>
                    <View style={s.termRowDivider} />
                  </Animated.View>
                );
              })}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 2, borderBottomColor: INK,
  },
  headerLeft: {},
  eyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '900', color: INK, letterSpacing: -1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { fontFamily: MONO, fontSize: 10, color: INK, letterSpacing: 1.5 },
  closeBtn: { padding: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },

  // List view
  listSubtitle: {
    fontFamily: MONO, fontSize: 11, color: 'rgba(10,10,10,0.5)',
    marginBottom: 20, lineHeight: 18,
  },
  termRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16,
  },
  termRowLeft: { flex: 1, marginRight: 10 },
  termRowName: { fontSize: 16, fontWeight: '800', color: INK, marginBottom: 4, letterSpacing: -0.3 },
  termRowPlain: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.5)', lineHeight: 16 },
  termRowDivider: { height: 1, backgroundColor: 'rgba(10,10,10,0.1)' },

  // Detail view
  termCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 20, borderBottomWidth: 2, borderBottomColor: INK, marginBottom: 24,
  },
  termDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: ACCENT },
  termName: { fontSize: 26, fontWeight: '900', color: INK, letterSpacing: -0.5, flex: 1 },
  section: { marginBottom: 24 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionLabel: {
    fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)',
    letterSpacing: 2, marginBottom: 10,
  },
  sectionBody: {
    fontSize: 15, color: INK, lineHeight: 24,
    fontWeight: '400',
  },
  limeBadge: {
    backgroundColor: LIME, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2,
    borderWidth: 1, borderColor: INK,
  },
  limeBadgeText: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: INK, letterSpacing: 1 },
  divider: { height: 2, backgroundColor: 'rgba(10,10,10,0.08)', marginBottom: 24 },
  mythCard: {
    backgroundColor: INK, padding: 18, borderRadius: 2, marginBottom: 30,
  },
  mythHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  mythIcon: { fontSize: 16 },
  mythLabel: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, fontWeight: '700' },
  mythBody: { fontSize: 14, color: PAPER, lineHeight: 22 },
  relatedRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8,
  },
  relatedLabel: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 1.5 },
  relatedLink: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 1.5, fontWeight: '700' },
});
