/**
 * Onboarding — fork screen shown to new users.
 *
 * Two paths:
 *   A. "I KNOW MY SHOES" — already fitted / knows their model → browse & add directly
 *   B. "FIND MY SHOES"   — run the Scout quiz for recommendations
 *
 * After either path the parent marks onboarding complete.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Modal, SafeAreaView, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SHOES } from '../app/data/shoes';
import { addToFavorites } from '../app/utils/storage';

const { width } = Dimensions.get('window');

const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME   = '#D4FF00';
const MONO   = 'SpaceMono';

type Screen = 'fork' | 'browse';

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [screen, setScreen]   = useState<Screen>('fork');
  const [query, setQuery]     = useState('');
  const [added, setAdded]     = useState<Set<string>>(new Set());
  const [saving, setSaving]   = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SHOES;
    return SHOES.filter(s =>
      s.brand.toLowerCase().includes(q) ||
      s.model.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  }, [query]);

  const toggleShoe = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = new Set(added);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setAdded(next);
  };

  const handleDone = async () => {
    if (saving) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    for (const id of added) {
      await addToFavorites(id);
    }
    onComplete();
  };

  // ── FORK SCREEN ──────────────────────────────────────────────────────────────
  if (screen === 'fork') {
    return (
      <View style={s.forkContainer}>
        <SafeAreaView style={s.forkInner}>
          {/* Logo / header */}
          <View style={s.forkHeader}>
            <Text style={s.forkEyebrow}>// STRIDE PROTOCOL</Text>
            <Text style={s.forkTitle}>WELCOME.</Text>
            <Text style={s.forkSub}>
              The running shoe tracker built for people who take their kit seriously.
            </Text>
          </View>

          {/* Fork cards */}
          <View style={s.forkCards}>
            {/* Path A — already fitted */}
            <TouchableOpacity
              style={s.forkCardDark}
              activeOpacity={0.88}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setScreen('browse');
              }}
            >
              <View style={s.forkCardTop}>
                <Ionicons name="checkmark-circle" size={28} color={LIME} />
                <Text style={s.forkCardTag}>ALREADY FITTED</Text>
              </View>
              <Text style={s.forkCardTitle}>I KNOW MY SHOES.</Text>
              <Text style={s.forkCardDesc}>
                You've already been fitted or know what you run in. Find your shoes and add them to your arsenal instantly.
              </Text>
              <View style={s.forkCardCta}>
                <Text style={s.forkCardCtaTxt}>BROWSE & ADD</Text>
                <Ionicons name="arrow-forward" size={14} color={LIME} />
              </View>
            </TouchableOpacity>

            {/* Path B — take the quiz */}
            <TouchableOpacity
              style={s.forkCardLight}
              activeOpacity={0.88}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onComplete(); // parent will navigate to scout quiz via empty-state CTA
              }}
            >
              <View style={s.forkCardTop}>
                <Ionicons name="search" size={28} color={ACCENT} />
                <Text style={[s.forkCardTag, { color: ACCENT }]}>NEW TO RUNNING</Text>
              </View>
              <Text style={[s.forkCardTitle, { color: INK }]}>FIND MY SHOES.</Text>
              <Text style={[s.forkCardDesc, { color: 'rgba(10,10,10,0.55)' }]}>
                Not sure what you need? Take the 2-minute Scout diagnostic and get a personalised recommendation.
              </Text>
              <View style={s.forkCardCta}>
                <Text style={[s.forkCardCtaTxt, { color: ACCENT }]}>RUN THE QUIZ</Text>
                <Ionicons name="arrow-forward" size={14} color={ACCENT} />
              </View>
            </TouchableOpacity>
          </View>

          <Text style={s.forkFootnote}>
            You can always do both — add your current shoes now and take the quiz later.
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  // ── BROWSE SCREEN ────────────────────────────────────────────────────────────
  return (
    <View style={s.browseContainer}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.browseHeader}>
          <TouchableOpacity onPress={() => setScreen('fork')} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color={INK} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.browseTitle}>ADD YOUR SHOES.</Text>
            <Text style={s.browseSub}>Search for any shoe you already run in.</Text>
          </View>
          {added.size > 0 && (
            <TouchableOpacity style={s.doneBtn} onPress={handleDone} disabled={saving}>
              <Text style={s.doneBtnTxt}>
                {saving ? 'SAVING…' : `DONE (${added.size})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search bar */}
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={16} color="rgba(10,10,10,0.35)" />
          <TextInput
            style={s.searchInput}
            placeholder="Search brand or model…"
            placeholderTextColor="rgba(10,10,10,0.3)"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color="rgba(10,10,10,0.3)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Selected count bar */}
        {added.size > 0 && (
          <View style={s.selectionBar}>
            <Ionicons name="checkmark-circle" size={14} color={LIME} />
            <Text style={s.selectionTxt}>{added.size} shoe{added.size !== 1 ? 's' : ''} selected</Text>
          </View>
        )}

        {/* Shoe list */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.shoeList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filtered.length === 0 && (
            <View style={s.noResults}>
              <Ionicons name="search-outline" size={32} color="rgba(10,10,10,0.15)" />
              <Text style={s.noResultsTxt}>No shoes match "{query}"</Text>
            </View>
          )}
          {filtered.map(shoe => {
            const isAdded = added.has(shoe.id);
            return (
              <TouchableOpacity
                key={shoe.id}
                style={[s.shoeRow, isAdded && s.shoeRowAdded]}
                activeOpacity={0.8}
                onPress={() => toggleShoe(shoe.id)}
              >
                <View style={s.shoeInfo}>
                  <Text style={s.shoeBrand}>{shoe.brand.toUpperCase()}</Text>
                  <Text style={s.shoeModel}>{shoe.model}</Text>
                  <Text style={s.shoeCategory}>{shoe.category} · ${shoe.price_usd}</Text>
                </View>
                <View style={[s.addBtn, isAdded && s.addBtnAdded]}>
                  <Ionicons
                    name={isAdded ? 'checkmark' : 'add'}
                    size={18}
                    color={isAdded ? INK : PAPER}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom CTA */}
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.bottomDoneBtn, added.size === 0 && s.bottomDoneBtnGhost]}
            onPress={added.size > 0 ? handleDone : onComplete}
            disabled={saving}
          >
            <Text style={[s.bottomDoneTxt, added.size === 0 && s.bottomDoneTxtGhost]}>
              {saving
                ? 'SAVING…'
                : added.size > 0
                  ? `ADD ${added.size} SHOE${added.size !== 1 ? 'S' : ''} TO ARSENAL`
                  : 'SKIP FOR NOW'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  // ── FORK ──────────────────────────────────────────────────────────────────
  forkContainer: { flex: 1, backgroundColor: PAPER },
  forkInner: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },

  forkHeader: { marginBottom: 28, paddingTop: 20 },
  forkEyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 6 },
  forkTitle: { fontSize: 44, fontWeight: '900', color: INK, letterSpacing: -2, lineHeight: 44, marginBottom: 10 },
  forkSub: { fontFamily: MONO, fontSize: 11, color: 'rgba(10,10,10,0.5)', lineHeight: 18 },

  forkCards: { gap: 14 },

  forkCardDark: {
    backgroundColor: INK, borderRadius: 4, padding: 20,
  },
  forkCardLight: {
    backgroundColor: PAPER, borderRadius: 4, padding: 20,
    borderWidth: 2, borderColor: INK,
  },
  forkCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  forkCardTag: { fontFamily: MONO, fontSize: 8, color: LIME, letterSpacing: 2, fontWeight: '700' },

  forkCardTitle: { fontSize: 22, fontWeight: '900', color: PAPER, letterSpacing: -0.5, marginBottom: 8 },
  forkCardDesc: { fontFamily: MONO, fontSize: 10, color: 'rgba(244,241,234,0.55)', lineHeight: 17, marginBottom: 14 },
  forkCardCta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  forkCardCtaTxt: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: LIME, letterSpacing: 1 },

  forkFootnote: {
    fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.3)',
    textAlign: 'center', marginTop: 20, lineHeight: 15,
  },

  // ── BROWSE ────────────────────────────────────────────────────────────────
  browseContainer: { flex: 1, backgroundColor: PAPER },

  browseHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 2, borderBottomColor: INK,
  },
  backBtn: { padding: 4 },
  browseTitle: { fontSize: 18, fontWeight: '900', color: INK, letterSpacing: -0.5 },
  browseSub: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 0.5 },
  doneBtn: { backgroundColor: INK, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 2 },
  doneBtnTxt: { fontFamily: MONO, fontSize: 9, fontWeight: '700', color: LIME, letterSpacing: 1 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginVertical: 12,
    backgroundColor: 'rgba(10,10,10,0.05)', borderRadius: 2,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: INK, fontFamily: MONO },

  selectionBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: INK, paddingHorizontal: 16, paddingVertical: 8,
  },
  selectionTxt: { fontFamily: MONO, fontSize: 10, color: LIME, letterSpacing: 1 },

  shoeList: { paddingHorizontal: 16, paddingTop: 4 },

  shoeRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(10,10,10,0.07)',
  },
  shoeRowAdded: { backgroundColor: 'rgba(212,255,0,0.08)' },

  shoeInfo: { flex: 1 },
  shoeBrand: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 2 },
  shoeModel: { fontSize: 15, fontWeight: '800', color: INK, letterSpacing: -0.3 },
  shoeCategory: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', marginTop: 2 },

  addBtn: {
    width: 34, height: 34, borderRadius: 2,
    backgroundColor: INK, alignItems: 'center', justifyContent: 'center',
  },
  addBtnAdded: { backgroundColor: LIME },

  noResults: { alignItems: 'center', paddingTop: 60, gap: 10 },
  noResultsTxt: { fontFamily: MONO, fontSize: 11, color: 'rgba(10,10,10,0.3)' },

  bottomBar: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 2, borderTopColor: INK,
    backgroundColor: PAPER,
  },
  bottomDoneBtn: {
    backgroundColor: ACCENT, paddingVertical: 16,
    alignItems: 'center', borderRadius: 2,
  },
  bottomDoneBtnGhost: {
    backgroundColor: 'transparent', borderWidth: 2, borderColor: 'rgba(10,10,10,0.15)',
  },
  bottomDoneTxt: { fontFamily: MONO, fontSize: 12, fontWeight: '900', color: INK, letterSpacing: 2 },
  bottomDoneTxtGhost: { color: 'rgba(10,10,10,0.3)' },
});
