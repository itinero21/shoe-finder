/**
 * RETIREMENT CEREMONY — final shoe report.
 * Useful first, emotional second. A record, not a gimmick.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  Modal, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { LivingShoe, ShoeMemorial } from '../app/types/character';
import { Shoe } from '../app/data/shoes';
import { generateDialogue } from '../app/utils/dialogueEngine';
import { Run } from '../app/types/run';

const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const GREEN  = '#16A34A';
const AMBER  = '#D97706';
const GREY   = '#6B7280';
const MONO   = 'SpaceMono';

interface RetirementCeremonyProps {
  visible: boolean;
  shoe: Shoe;
  character: LivingShoe;
  runs: Run[];
  onComplete: (memorial: ShoeMemorial, heirId: string | null) => void;
  onCancel: () => void;
  availableHeirs: Shoe[];
}

type Phase = 'report' | 'record' | 'heir';

export const RetirementCeremony: React.FC<RetirementCeremonyProps> = ({
  visible, shoe, character, runs, onComplete, onCancel, availableHeirs,
}) => {
  const [phase, setPhase] = useState<Phase>('report');
  const [epitaph, setEpitaph] = useState('');
  const [rating, setRating] = useState<1|2|3|4|5>(4);
  const [buyAgain, setBuyAgain] = useState(true);
  const [selectedHeir, setSelectedHeir] = useState<string | null>(null);
  const [causeOfRetirement, setCauseOfRetirement] = useState('MIDSOLE FATIGUE');

  const shoeRuns = runs.filter(r => r.shoeId === character.shoeId);
  const raceRuns = shoeRuns.filter(r => r.purpose === 'race');
  const trailRuns = shoeRuns.filter(r => r.terrain === 'trail');
  const longRun = shoeRuns.reduce((best, r) => r.distanceKm > (best?.distanceKm ?? 0) ? r : best, null as Run | null);
  const lifespanDays = Math.max(1, Math.round(
    (Date.now() - new Date(character.addedDate).getTime()) / 86400000
  ));
  const miles = Math.max(0, character.totalMiles);
  const km = miles * 1.609344;
  const costPerKm = shoe.price_usd && km > 0 ? shoe.price_usd / km : null;
  const valueGrade = costPerKm == null
    ? 'UNKNOWN'
    : costPerKm <= 0.18 ? 'ELITE VALUE'
      : costPerKm <= 0.28 ? 'GOOD VALUE'
        : 'EXPENSIVE MILES';
  const lastWords = generateDialogue(character, shoe, 'funeral', {
    miles: Math.round(character.totalMiles),
  }).text;
  const biography = buildBiography({
    shoe,
    character,
    raceCount: raceRuns.length,
    trailCount: trailRuns.length,
    lifespanDays,
    valueGrade,
  });

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
      `STRIDE FINAL REPORT\n` +
      `${shoe.brand} ${shoe.model}\n` +
      (character.nickname ? `${character.nickname}\n` : '') +
      `\n${Math.round(miles)} MI / ${character.runCount} RUNS / ${lifespanDays} DAYS\n` +
      `${valueGrade}${costPerKm ? ` / $${costPerKm.toFixed(2)} PER KM` : ''}\n` +
      `\n"${epitaph || lastWords}"`;
    try { await Share.share({ message }); } catch { /* dismissed */ }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <View>
            <Text style={s.eyebrow}>// RETIREMENT REPORT</Text>
            <Text style={s.title}>{phase === 'report' ? 'FINAL AUDIT' : phase === 'record' ? 'THE RECORD' : 'TRANSFER'}</Text>
          </View>
          <TouchableOpacity onPress={onCancel} style={s.closeBtn}>
            <Ionicons name="close" size={22} color={INK} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {phase === 'report' && (
            <>
              <View style={s.heroWrap}>
                <View style={s.heroShadow} />
                <View style={s.heroCard}>
                  <Text style={s.brand}>{shoe.brand.toUpperCase()}</Text>
                  <Text style={s.model}>{shoe.model.toUpperCase()}</Text>
                  {character.nickname && <Text style={s.nickname}>{character.nickname.toUpperCase()}</Text>}
                  <View style={s.verdictRow}>
                    <View style={s.verdictBadge}>
                      <Text style={s.verdictText}>READY TO RETIRE</Text>
                    </View>
                    <Text style={s.lifeText}>{Math.round(character.lifePct)}% USED</Text>
                  </View>
                </View>
              </View>

              <View style={s.statGrid}>
                <Stat value={String(Math.round(miles))} label="MILES" />
                <Divider />
                <Stat value={String(Math.round(km))} label="KM" />
                <Divider />
                <Stat value={String(character.runCount)} label="RUNS" />
              </View>

              <View style={s.statGrid}>
                <Stat value={costPerKm ? `$${costPerKm.toFixed(2)}` : 'N/A'} label="PER KM" />
                <Divider />
                <Stat value={String(raceRuns.length)} label="RACES" />
                <Divider />
                <Stat value={longRun ? `${(longRun.distanceKm * 0.621371).toFixed(1)}` : '0'} label="LONGEST MI" />
              </View>

              <ReportCard label="// VALUE VERDICT" title={valueGrade} body={valueBody(valueGrade, shoe.model)} color={costPerKm && costPerKm <= 0.18 ? GREEN : AMBER} />
              <ReportCard label="// LAST WORDS" title="FINAL LINE" body={`"${lastWords.toUpperCase()}"`} color={ACCENT} />

              <TouchableOpacity
                onPress={() => { setPhase('record'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={s.primaryBtn}
              >
                <Text style={s.primaryBtnText}>RECORD THE END</Text>
              </TouchableOpacity>
            </>
          )}

          {phase === 'record' && (
            <>
              <Text style={s.sectionLabel}>// WHY IT ENDS</Text>
              <View style={s.causeRow}>
                {['MIDSOLE FATIGUE', 'OUTSOLE WORN', 'UPPER DAMAGE', 'UPGRADED', 'WALKING ONLY', 'OTHER'].map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCauseOfRetirement(c)}
                    style={[s.causeChip, causeOfRetirement === c && s.causeChipActive]}
                  >
                    <Text style={[s.causeChipText, causeOfRetirement === c && s.causeChipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.sectionLabel}>// EPITAPH</Text>
              <TextInput
                style={s.epitaphInput}
                value={epitaph}
                onChangeText={setEpitaph}
                placeholder={lastWords.toUpperCase()}
                placeholderTextColor="rgba(10,10,10,0.25)"
                maxLength={120}
                multiline
              />

              <Text style={s.sectionLabel}>// BUY AGAIN</Text>
              <View style={s.buyRow}>
                <TouchableOpacity onPress={() => setBuyAgain(true)} style={[s.buyBtn, buyAgain && s.buyBtnActive]}>
                  <Text style={[s.buyBtnText, buyAgain && s.buyBtnTextActive]}>YES</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setBuyAgain(false)} style={[s.buyBtn, !buyAgain && s.buyBtnActive]}>
                  <Text style={[s.buyBtnText, !buyAgain && s.buyBtnTextActive]}>NO</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.sectionLabel}>// RATING</Text>
              <View style={s.ratingRow}>
                {([1, 2, 3, 4, 5] as const).map(n => (
                  <TouchableOpacity key={n} onPress={() => setRating(n)} style={[s.ratingBox, rating >= n && s.ratingBoxActive]}>
                    <Text style={[s.ratingText, rating >= n && s.ratingTextActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {character.moments.length > 0 && (
                <View style={s.memoryPanel}>
                  <Text style={s.memoryTitle}>// BEST RECORDS</Text>
                  {character.moments.slice(0, 4).map(m => (
                    <View key={m.type} style={s.memoryRow}>
                      <Text style={s.memoryDate}>{m.date.slice(0, 10)}</Text>
                      <Text style={s.memoryText}>{m.caption.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                onPress={() => {
                  if (availableHeirs.length > 0) setPhase('heir');
                  else handleComplete();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={s.primaryBtn}
              >
                <Text style={s.primaryBtnText}>{availableHeirs.length > 0 ? 'CHOOSE HEIR' : 'FINALIZE RETIREMENT'}</Text>
              </TouchableOpacity>
            </>
          )}

          {phase === 'heir' && (
            <>
              <ReportCard
                label="// TRANSFER LOGIC"
                title="PASS ONE THING ON"
                body={`${shoe.model.toUpperCase()} CAN PASS ITS ARCHETYPE, MEMORY, AND ${Math.round(miles)} MILES OF HISTORY TO THE NEXT SHOE.`}
                color={ACCENT}
              />

              {availableHeirs.map(h => (
                <TouchableOpacity
                  key={h.id}
                  onPress={() => setSelectedHeir(selectedHeir === h.id ? null : h.id)}
                  style={s.heirWrap}
                >
                  <View style={[s.heirShadow, selectedHeir === h.id && { backgroundColor: ACCENT }]} />
                  <View style={[s.heirRow, selectedHeir === h.id && s.heirRowSelected]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.heirBrand, selectedHeir === h.id && s.heirTextSelected]}>{h.brand.toUpperCase()}</Text>
                      <Text style={[s.heirModel, selectedHeir === h.id && s.heirTextSelected]}>{h.model.toUpperCase()}</Text>
                    </View>
                    {selectedHeir === h.id && <Ionicons name="checkmark" size={20} color={PAPER} />}
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity onPress={() => setSelectedHeir(null)} style={s.secondaryBtn}>
                <Text style={s.secondaryBtnText}>NO HEIR</Text>
              </TouchableOpacity>

              <View style={s.finalRow}>
                <TouchableOpacity onPress={handleShare} style={s.shareBtn}>
                  <Ionicons name="share-outline" size={18} color={INK} />
                  <Text style={s.shareBtnText}>SHARE</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleComplete} style={s.restBtn}>
                  <Text style={s.restBtnText}>FINALIZE</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

function buildBiography({
  shoe,
  character,
  raceCount,
  trailCount,
  lifespanDays,
  valueGrade,
}: {
  shoe: Shoe;
  character: LivingShoe;
  raceCount: number;
  trailCount: number;
  lifespanDays: number;
  valueGrade: string;
}) {
  const name = `${shoe.brand} ${shoe.model}`;
  const nickname = character.nickname ? ` EARNED NAME: ${character.nickname.toUpperCase()}.` : '';
  return `${name.toUpperCase()} ENTERED THE CLOSET ON ${character.addedDate.slice(0, 10)}. ` +
    `IT RAN ${Math.round(character.totalMiles)} MILES OVER ${character.runCount} RUNS AND ${lifespanDays} DAYS. ` +
    `${raceCount} RACE RUNS. ${trailCount} TRAIL RUNS. VALUE: ${valueGrade}.${nickname}`;
}

function valueBody(valueGrade: string, model: string) {
  if (valueGrade === 'ELITE VALUE') return `${model.toUpperCase()} GAVE MORE THAN IT COST. THIS ONE BELONGS IN THE HALL.`;
  if (valueGrade === 'GOOD VALUE') return `${model.toUpperCase()} DID ITS JOB. A RELIABLE BUY IF THE FIT WORKED.`;
  if (valueGrade === 'EXPENSIVE MILES') return `GOOD STORY, EXPENSIVE MILES. BUY AGAIN ONLY IF IT PROTECTED YOU.`;
  return `PRICE OR MILEAGE DATA IS MISSING. STRIDE WILL STILL SAVE THE RECORD.`;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={s.divider} />;
}

function ReportCard({ label, title, body, color }: { label: string; title: string; body: string; color: string }) {
  return (
    <View style={s.reportWrap}>
      <View style={[s.reportShadow, { backgroundColor: color }]} />
      <View style={s.reportCard}>
        <Text style={s.reportLabel}>{label}</Text>
        <Text style={s.reportTitle}>{title}</Text>
        <Text style={s.reportBody}>{body}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: INK,
  },
  eyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 4 },
  title: { fontFamily: MONO, fontSize: 24, fontWeight: '900', color: INK, letterSpacing: 0 },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: INK, borderRadius: 2 },
  scroll: { padding: 20, paddingBottom: 80 },

  heroWrap: { position: 'relative', marginBottom: 18 },
  heroShadow: { position: 'absolute', top: 6, left: 6, right: -6, bottom: -6, backgroundColor: ACCENT, borderRadius: 2 },
  heroCard: { borderWidth: 2, borderColor: INK, borderRadius: 2, backgroundColor: PAPER, padding: 18 },
  brand: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.45)', letterSpacing: 2, marginBottom: 4 },
  model: { fontFamily: MONO, fontSize: 24, fontWeight: '900', color: INK, letterSpacing: 0, lineHeight: 30 },
  nickname: { fontFamily: MONO, fontSize: 10, fontWeight: '900', color: ACCENT, letterSpacing: 1, marginTop: 8 },
  verdictRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  verdictBadge: { backgroundColor: INK, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 2 },
  verdictText: { fontFamily: MONO, fontSize: 8, fontWeight: '900', color: PAPER, letterSpacing: 1.5 },
  lifeText: { fontFamily: MONO, fontSize: 10, fontWeight: '900', color: ACCENT, letterSpacing: 1 },

  statGrid: { flexDirection: 'row', borderWidth: 2, borderColor: INK, marginBottom: 14, backgroundColor: PAPER },
  stat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 8 },
  statValue: { fontFamily: MONO, fontSize: 14, fontWeight: '900', color: INK, letterSpacing: 0, textAlign: 'center' },
  statLabel: { fontFamily: MONO, fontSize: 7, fontWeight: '700', color: 'rgba(10,10,10,0.45)', letterSpacing: 1.2, marginTop: 3, textAlign: 'center' },
  divider: { width: 2, backgroundColor: INK },

  reportWrap: { position: 'relative', marginBottom: 16 },
  reportShadow: { position: 'absolute', top: 6, left: 6, right: -6, bottom: -6, borderRadius: 2 },
  reportCard: { borderWidth: 2, borderColor: INK, borderRadius: 2, backgroundColor: PAPER, padding: 14 },
  reportLabel: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: ACCENT, letterSpacing: 2, marginBottom: 8 },
  reportTitle: { fontFamily: MONO, fontSize: 15, fontWeight: '900', color: INK, letterSpacing: 0, marginBottom: 8 },
  reportBody: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.62)', letterSpacing: 0.5, lineHeight: 17 },

  sectionLabel: { fontFamily: MONO, fontSize: 9, fontWeight: '700', color: ACCENT, letterSpacing: 2, marginBottom: 10, marginTop: 14 },
  causeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  causeChip: { paddingHorizontal: 11, paddingVertical: 8, borderWidth: 2, borderColor: INK, borderRadius: 2 },
  causeChipActive: { backgroundColor: INK },
  causeChipText: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: INK, letterSpacing: 1 },
  causeChipTextActive: { color: PAPER },

  epitaphInput: {
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 2,
    padding: 12,
    fontSize: 11,
    color: INK,
    fontFamily: MONO,
    minHeight: 72,
    textAlignVertical: 'top',
    marginBottom: 6,
    lineHeight: 18,
  },

  buyRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  buyBtn: { flex: 1, paddingVertical: 12, borderWidth: 2, borderColor: INK, borderRadius: 2, alignItems: 'center' },
  buyBtnActive: { backgroundColor: INK },
  buyBtnText: { fontFamily: MONO, fontSize: 11, fontWeight: '900', color: INK, letterSpacing: 1 },
  buyBtnTextActive: { color: PAPER },

  ratingRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  ratingBox: { flex: 1, borderWidth: 2, borderColor: INK, paddingVertical: 11, alignItems: 'center', borderRadius: 2 },
  ratingBoxActive: { backgroundColor: AMBER },
  ratingText: { fontFamily: MONO, fontSize: 12, fontWeight: '900', color: INK, letterSpacing: 0 },
  ratingTextActive: { color: PAPER },

  memoryPanel: { borderWidth: 2, borderColor: INK, padding: 12, marginBottom: 18, borderRadius: 2 },
  memoryTitle: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: ACCENT, letterSpacing: 2, marginBottom: 10 },
  memoryRow: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: 'rgba(10,10,10,0.12)', paddingTop: 8, marginTop: 8 },
  memoryDate: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 1, width: 78 },
  memoryText: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.62)', letterSpacing: 0.5, lineHeight: 15, flex: 1 },

  heirWrap: { position: 'relative', marginBottom: 12 },
  heirShadow: { position: 'absolute', top: 5, left: 5, right: -5, bottom: -5, backgroundColor: GREY, borderRadius: 2 },
  heirRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: INK, borderRadius: 2, backgroundColor: PAPER, padding: 14 },
  heirRowSelected: { backgroundColor: INK },
  heirBrand: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.45)', letterSpacing: 2, marginBottom: 3 },
  heirModel: { fontFamily: MONO, fontSize: 15, fontWeight: '900', color: INK, letterSpacing: 0 },
  heirTextSelected: { color: PAPER },

  primaryBtn: { backgroundColor: INK, paddingVertical: 16, alignItems: 'center', borderRadius: 2, marginTop: 12, borderWidth: 2, borderColor: INK },
  primaryBtnText: { fontFamily: MONO, fontSize: 12, fontWeight: '900', color: PAPER, letterSpacing: 2 },
  secondaryBtn: { alignItems: 'center', paddingVertical: 13, marginBottom: 8, borderWidth: 2, borderColor: 'rgba(10,10,10,0.18)', borderRadius: 2 },
  secondaryBtnText: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: 'rgba(10,10,10,0.45)', letterSpacing: 1.5 },

  finalRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderColor: INK, paddingVertical: 14, borderRadius: 2 },
  shareBtnText: { fontFamily: MONO, fontSize: 11, fontWeight: '900', color: INK, letterSpacing: 1 },
  restBtn: { flex: 2, backgroundColor: INK, paddingVertical: 14, borderRadius: 2, alignItems: 'center', borderWidth: 2, borderColor: INK },
  restBtnText: { fontFamily: MONO, fontSize: 12, fontWeight: '900', color: PAPER, letterSpacing: 2 },
});
