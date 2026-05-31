/**
 * RETIREMENT CEREMONY — The cinematic death flow.
 * "Make it hurt, slightly — meaningful, never manipulative."
 *
 * Flow: the animation slows, old runs flash by, the shoe's stats fade,
 * then a closing line. The memorial captures everything.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  Modal, Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInUp, SlideInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { LivingShoe, ShoeMemorial, ShoeMoment } from '../app/types/character';
import { Shoe } from '../app/data/shoes';
import { generateDialogue } from '../app/utils/dialogueEngine';
import { Run } from '../app/types/run';

const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const MONO   = 'SpaceMono';

interface RetirementCeremonyProps {
  visible: boolean;
  shoe: Shoe;
  character: LivingShoe;
  runs: Run[];
  onComplete: (memorial: ShoeMemorial, heirId: string | null) => void;
  onCancel: () => void;
  availableHeirs: Shoe[];  // shoes that can inherit
}

type Phase = 'farewell' | 'memories' | 'eulogy' | 'heir';

export const RetirementCeremony: React.FC<RetirementCeremonyProps> = ({
  visible, shoe, character, runs, onComplete, onCancel, availableHeirs,
}) => {
  const [phase, setPhase] = useState<Phase>('farewell');
  const [epitaph, setEpitaph] = useState('');
  const [rating, setRating] = useState<1|2|3|4|5>(4);
  const [buyAgain, setBuyAgain] = useState(true);
  const [selectedHeir, setSelectedHeir] = useState<string | null>(null);
  const [causeOfRetirement, setCauseOfRetirement] = useState('Midsole fatigue');

  // Generate last words
  const lastWords = generateDialogue(character, shoe, 'funeral', {
    miles: Math.round(character.totalMiles),
  }).text;

  const shoeRuns = runs.filter(r => r.shoeId === character.shoeId);
  const raceRuns = shoeRuns.filter(r => r.purpose === 'race');
  const lifespanDays = Math.max(1, Math.round(
    (Date.now() - new Date(character.addedDate).getTime()) / 86400000
  ));

  // Auto-generate biography
  const biography = `${shoe.model} arrived ${character.addedDate.slice(0, 10)}. Over ${character.runCount} runs and ${Math.round(character.totalMiles)} miles, ` +
    (raceRuns.length > 0
      ? `they carried you through ${raceRuns.length} race${raceRuns.length > 1 ? 's' : ''}. `
      : 'they were there for every step. ') +
    (character.nickname ? `Earned the name "${character.nickname}." ` : '') +
    `Retired after ${lifespanDays} days of service.`;

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const memorial: ShoeMemorial = {
      shoeId: character.shoeId,
      brand: shoe.brand,
      model: shoe.model,
      nickname: character.nickname,
      archetype: character.archetype,
      birthDate: character.addedDate,
      deathDate: new Date().toISOString(),
      totalMiles: character.totalMiles,
      runCount: character.runCount,
      lifespanDays,
      causeOfRetirement,
      favoriteRoute: null,
      racesRun: raceRuns.length,
      prsWitnessed: 0,
      lastWords,
      biography,
      moments: character.moments,
      epitaph: epitaph || lastWords,
      rating,
      wouldBuyAgain: buyAgain,
      heirId: selectedHeir,
    };

    onComplete(memorial, selectedHeir);
  };

  const handleShare = async () => {
    const message =
      `IN LOVING MEMORY\n` +
      `${shoe.brand} ${shoe.model}\n` +
      (character.nickname ? `"${character.nickname}"\n` : '') +
      `\n${Math.round(character.totalMiles)} miles · ${character.runCount} runs · ${lifespanDays} days\n` +
      `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}\n` +
      `\n"${epitaph || lastWords}"\n` +
      `\nRetired ${new Date().toISOString().slice(0, 10)} — Stride`;
    try { await Share.share({ message }); } catch { /* dismissed */ }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <SafeAreaView style={s.container}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── PHASE 1: Farewell ──────────────────────────────────── */}
          {phase === 'farewell' && (
            <Animated.View entering={FadeIn.duration(1500)} style={s.center}>
              <Text style={s.ripText}>REST IN PEACE</Text>
              <Text style={s.farewellBrand}>{shoe.brand.toUpperCase()}</Text>
              <Text style={s.farewellModel}>{shoe.model}</Text>
              {character.nickname && (
                <Text style={s.farewellNickname}>"{character.nickname}"</Text>
              )}

              <View style={s.farewellDivider} />

              <Text style={s.farewellStats}>
                {Math.round(character.totalMiles)} miles · {character.runCount} runs · {lifespanDays} days
              </Text>

              <Animated.View entering={FadeInUp.delay(2000).duration(1000)}>
                <Text style={s.lastWordsLabel}>LAST WORDS</Text>
                <Text style={s.lastWords}>"{lastWords}"</Text>
              </Animated.View>

              <TouchableOpacity
                onPress={() => { setPhase('memories'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={s.nextBtn}
              >
                <Text style={s.nextBtnText}>CONTINUE</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── PHASE 2: Memories ──────────────────────────────────── */}
          {phase === 'memories' && (
            <Animated.View entering={FadeIn.duration(800)}>
              <Text style={s.phaseTitle}>// MEMORIES</Text>
              <Text style={s.biographyText}>{biography}</Text>

              {character.moments.length > 0 && (
                <View style={s.momentsList}>
                  {character.moments.map((m, i) => (
                    <Animated.View key={m.type} entering={FadeInUp.delay(i * 200)}>
                      <View style={s.momentRow}>
                        <Text style={s.momentDate}>{m.date.slice(0, 10)}</Text>
                        <Text style={s.momentCaption}>{m.caption}</Text>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                onPress={() => { setPhase('eulogy'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={s.nextBtn}
              >
                <Text style={s.nextBtnText}>WRITE EULOGY</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── PHASE 3: Eulogy ────────────────────────────────────── */}
          {phase === 'eulogy' && (
            <Animated.View entering={FadeIn.duration(800)}>
              <Text style={s.phaseTitle}>// EULOGY</Text>

              <Text style={s.fieldLabel}>CAUSE OF RETIREMENT</Text>
              <View style={s.causeRow}>
                {['Midsole fatigue', 'Outsole worn', 'Upper damage', 'Upgraded', 'Other'].map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCauseOfRetirement(c)}
                    style={[s.causeChip, causeOfRetirement === c && s.causeChipActive]}
                  >
                    <Text style={[s.causeChipText, causeOfRetirement === c && s.causeChipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.fieldLabel}>EPITAPH</Text>
              <TextInput
                style={s.epitaphInput}
                value={epitaph}
                onChangeText={setEpitaph}
                placeholder={lastWords}
                placeholderTextColor="rgba(10,10,10,0.25)"
                maxLength={120}
                multiline
              />

              <Text style={s.fieldLabel}>RATING</Text>
              <View style={s.ratingRow}>
                {([1, 2, 3, 4, 5] as const).map(n => (
                  <TouchableOpacity key={n} onPress={() => setRating(n)}>
                    <Text style={[s.star, rating >= n && s.starActive]}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.fieldLabel}>WOULD YOU BUY AGAIN?</Text>
              <View style={s.buyRow}>
                <TouchableOpacity onPress={() => setBuyAgain(true)} style={[s.buyBtn, buyAgain && s.buyBtnActive]}>
                  <Text style={[s.buyBtnText, buyAgain && s.buyBtnTextActive]}>YES</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setBuyAgain(false)} style={[s.buyBtn, !buyAgain && s.buyBtnActive]}>
                  <Text style={[s.buyBtnText, !buyAgain && s.buyBtnTextActive]}>NO</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => {
                  if (availableHeirs.length > 0) {
                    setPhase('heir');
                  } else {
                    handleComplete();
                  }
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={s.nextBtn}
              >
                <Text style={s.nextBtnText}>
                  {availableHeirs.length > 0 ? 'CHOOSE HEIR' : 'REST IN PEACE'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── PHASE 4: Heir ──────────────────────────────────────── */}
          {phase === 'heir' && (
            <Animated.View entering={FadeIn.duration(800)}>
              <Text style={s.phaseTitle}>// LINEAGE</Text>
              <Text style={s.heirSub}>
                Choose a shoe to inherit {shoe.model}'s legacy. The heir gets a trait and a memory.
              </Text>

              {availableHeirs.map(h => (
                <TouchableOpacity
                  key={h.id}
                  onPress={() => setSelectedHeir(selectedHeir === h.id ? null : h.id)}
                  style={[s.heirRow, selectedHeir === h.id && s.heirRowSelected]}
                >
                  <View>
                    <Text style={[s.heirBrand, selectedHeir === h.id && { color: PAPER }]}>{h.brand}</Text>
                    <Text style={[s.heirModel, selectedHeir === h.id && { color: PAPER }]}>{h.model}</Text>
                  </View>
                  {selectedHeir === h.id && <Ionicons name="checkmark-circle" size={22} color={PAPER} />}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => setSelectedHeir(null)}
                style={s.skipHeirBtn}
              >
                <Text style={s.skipHeirText}>NO HEIR — SKIP</Text>
              </TouchableOpacity>

              <View style={s.finalRow}>
                <TouchableOpacity onPress={handleShare} style={s.shareBtn}>
                  <Ionicons name="share-outline" size={18} color={INK} />
                  <Text style={s.shareBtnText}>SHARE</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleComplete} style={s.restBtn}>
                  <Text style={s.restBtnText}>REST IN PEACE</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* Cancel */}
          <TouchableOpacity onPress={onCancel} style={s.cancelBtn}>
            <Text style={s.cancelBtnText}>CANCEL</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  scroll: { padding: 20, paddingBottom: 60 },
  center: { alignItems: 'center', paddingTop: 40 },

  ripText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.25)', letterSpacing: 4, marginBottom: 20 },
  farewellBrand: { fontFamily: MONO, fontSize: 12, color: 'rgba(10,10,10,0.4)', letterSpacing: 3, marginBottom: 4 },
  farewellModel: { fontSize: 32, fontWeight: '900', color: INK, letterSpacing: -1, textAlign: 'center', marginBottom: 8 },
  farewellNickname: { fontFamily: MONO, fontSize: 13, color: ACCENT, fontStyle: 'italic', marginBottom: 16 },
  farewellDivider: { width: 60, height: 2, backgroundColor: INK, marginVertical: 20 },
  farewellStats: { fontFamily: MONO, fontSize: 11, color: INK, fontWeight: '700', letterSpacing: 0.5, marginBottom: 30 },

  lastWordsLabel: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.3)', letterSpacing: 2, marginBottom: 8, textAlign: 'center' },
  lastWords: { fontSize: 18, fontWeight: '700', color: INK, fontStyle: 'italic', textAlign: 'center', lineHeight: 26, paddingHorizontal: 20, marginBottom: 40 },

  phaseTitle: { fontFamily: MONO, fontSize: 10, color: ACCENT, letterSpacing: 2, marginBottom: 16 },
  biographyText: { fontSize: 15, color: 'rgba(10,10,10,0.7)', lineHeight: 24, marginBottom: 20 },

  momentsList: { marginBottom: 24, gap: 8 },
  momentRow: { flexDirection: 'row', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(10,10,10,0.08)' },
  momentDate: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.35)', width: 80 },
  momentCaption: { fontFamily: MONO, fontSize: 10, color: INK, flex: 1, lineHeight: 16 },

  fieldLabel: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 8, marginTop: 16 },

  causeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  causeChip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 2, borderColor: INK, borderRadius: 2 },
  causeChipActive: { backgroundColor: INK },
  causeChipText: { fontFamily: MONO, fontSize: 9, color: INK, letterSpacing: 0.5 },
  causeChipTextActive: { color: PAPER },

  epitaphInput: { borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 12, fontSize: 14, color: INK, fontFamily: MONO, minHeight: 60, textAlignVertical: 'top', marginBottom: 8 },

  ratingRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  star: { fontSize: 28, color: 'rgba(10,10,10,0.15)' },
  starActive: { color: '#D97706' },

  buyRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  buyBtn: { flex: 1, paddingVertical: 12, borderWidth: 2, borderColor: INK, borderRadius: 2, alignItems: 'center' },
  buyBtnActive: { backgroundColor: INK },
  buyBtnText: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: INK, letterSpacing: 1 },
  buyBtnTextActive: { color: PAPER },

  heirSub: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.5)', lineHeight: 16, marginBottom: 16 },
  heirRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 14, marginBottom: 10 },
  heirRowSelected: { backgroundColor: INK },
  heirBrand: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 1.5 },
  heirModel: { fontSize: 15, fontWeight: '800', color: INK },
  skipHeirBtn: { alignItems: 'center', paddingVertical: 12, marginBottom: 20 },
  skipHeirText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.35)', letterSpacing: 1.5 },

  nextBtn: { backgroundColor: INK, paddingVertical: 16, alignItems: 'center', borderRadius: 2, marginTop: 20 },
  nextBtnText: { fontFamily: MONO, fontSize: 12, fontWeight: '700', color: PAPER, letterSpacing: 2 },

  finalRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderColor: INK, paddingVertical: 14, borderRadius: 2 },
  shareBtnText: { fontFamily: MONO, fontSize: 11, color: INK, letterSpacing: 1 },
  restBtn: { flex: 2, backgroundColor: INK, paddingVertical: 14, borderRadius: 2, alignItems: 'center' },
  restBtnText: { fontFamily: MONO, fontSize: 12, fontWeight: '700', color: PAPER, letterSpacing: 2 },

  cancelBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 20 },
  cancelBtnText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.3)', letterSpacing: 1.5 },
});
