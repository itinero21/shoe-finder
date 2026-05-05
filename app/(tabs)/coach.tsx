import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IntegrationsModal } from '../../components/IntegrationsModal';
import { InjuryBanner } from '../../components/InjuryBanner';

// ===================================================================
// STRIDE//COACH — Static Coaching System (NO AI)
// All responses come from pre-written decision trees.
// Zero tokens consumed. Works offline.
// ===================================================================

const COACHING = {
  plans: [
    {
      id: 'c25k_8week',
      name: 'Couch to 5K',
      code: 'C25K-08',
      tagline: 'From zero to 5K in 8 weeks. The classic.',
      duration_weeks: 8,
      runs_per_week: 3,
      target_event: '5K (3.1 mi)',
      level: 'BEGINNER',
      prerequisites: 'Can walk briskly for 30 min',
      color: '#D4FF00',
      sample_week: 'Week 1: Run 30s / Walk 90s × 8 — three times this week',
      weeks: [
        { week: 1, focus: 'Building the habit', workouts: [
          { day: 1, title: 'Intro Intervals', description: 'Run 30 sec, walk 90 sec — repeat 8x', total: '26 min' },
          { day: 3, title: 'Intro Intervals', description: 'Run 30 sec, walk 90 sec — repeat 8x', total: '26 min' },
          { day: 5, title: 'Intro Intervals', description: 'Run 30 sec, walk 90 sec — repeat 8x', total: '26 min' },
        ]},
        { week: 2, focus: 'Stretching the run', workouts: [
          { day: 1, title: 'Build Set A', description: 'Run 60 sec, walk 90 sec — repeat 6x', total: '25 min' },
          { day: 3, title: 'Build Set A', description: 'Run 60 sec, walk 90 sec — repeat 6x', total: '25 min' },
          { day: 5, title: 'Build Set A', description: 'Run 60 sec, walk 90 sec — repeat 6x', total: '25 min' },
        ]},
        { week: 5, focus: 'The bridge', workouts: [
          { day: 1, title: '5-3-5', description: 'Run 5 min, walk 3 min, run 5 min, walk 3 min, run 5 min', total: '31 min' },
          { day: 3, title: '8-5-8', description: 'Run 8 min, walk 5 min, run 8 min', total: '31 min' },
          { day: 5, title: 'First 20', description: 'Run 20 min continuous (no walk breaks)', total: '30 min', milestone: true },
        ]},
        { week: 8, focus: 'Race week', workouts: [
          { day: 1, title: 'Continuous 28', description: 'Run 28 minutes continuous', total: '38 min' },
          { day: 3, title: 'Continuous 30', description: 'Run 30 minutes continuous', total: '40 min' },
          { day: 5, title: '5K RACE DAY', description: 'Run your first 5K. Finish proud.', total: '35 min', milestone: true },
        ]},
      ],
    },
    {
      id: '5k_improver',
      name: '5K Time Trial',
      code: '5K-IMP',
      tagline: 'You can finish a 5K. Now run it faster.',
      duration_weeks: 6,
      runs_per_week: 4,
      target_event: 'Sub-30 min 5K',
      level: 'BEGINNER+',
      prerequisites: 'Can run 5K continuously',
      color: '#FF3D00',
      sample_week: 'Week 1: Easy 20min, Strides, Easy 25min, Long 30min',
    },
    {
      id: '10k_beginner',
      name: 'First 10K',
      code: '10K-NOV',
      tagline: 'Double the distance. Build the engine.',
      duration_weeks: 8,
      runs_per_week: 4,
      target_event: '10K (6.2 mi)',
      level: 'INTERMEDIATE',
      prerequisites: 'Can run 5K comfortably',
      color: '#FF8A00',
      sample_week: 'Week 1: Easy 2mi × 3, Long 3mi',
    },
    {
      id: 'half_marathon_novice',
      name: 'First Half Marathon',
      code: 'HM-NOV',
      tagline: '13.1 miles. The line where casual ends.',
      duration_weeks: 12,
      runs_per_week: 4,
      target_event: 'Half Marathon',
      level: 'INTERMEDIATE',
      prerequisites: 'Can run 5 mi comfortably',
      color: '#9D00FF',
      sample_week: 'Week 1: Easy 3mi × 2, Cross-train, Long 4mi',
    },
    {
      id: 'marathon_novice',
      name: 'First Marathon',
      code: 'FM-NOV',
      tagline: '26.2 miles. The summit.',
      duration_weeks: 18,
      runs_per_week: 4,
      target_event: 'Marathon',
      level: 'ADVANCED',
      prerequisites: '6+ months of running, 8 mi long run',
      color: '#FF006E',
      sample_week: 'Week 1: Easy 3mi × 3, Cross, Long 6mi',
    },
    {
      id: 'comeback_4week',
      name: 'Return to Running',
      code: 'CB-04',
      tagline: "You've been off. Let's come back smart.",
      duration_weeks: 4,
      runs_per_week: 3,
      target_event: 'Rebuild base',
      level: 'ANY',
      prerequisites: 'Cleared by doctor if returning from injury',
      color: '#00E5FF',
      sample_week: 'Week 1: Walk 1min / Run 1min × 10',
    },
  ],
  decision_rules: [
    { id: 'RED_PAIN', match: { feeling: 'pain' }, status: 'RED', headline: 'PROTOCOL PAUSE', response: "Pain is data. Listen to it. Take 2-3 days fully off running. If pain is sharp, located in a joint or bone, or you can't put weight on it without limping — see a physio or sports doctor before your next run." },
    { id: 'ORANGE_FATIGUED', match: { feeling: 'tired', rpe: 'rpe_high' }, status: 'ORANGE', headline: 'BACK OFF PROTOCOL', response: "Your easy runs should feel easy. If they feel hard, you're either running too fast, under-recovered, or both. Try this: slow down by 30-60 seconds per mile on your next two runs. If the next run still feels brutal, add an extra rest day." },
    { id: 'ORANGE_PARTIAL', match: { completion: 'partial', feeling: 'tired' }, status: 'ORANGE', headline: 'PARTIAL CREDIT', response: "Showing up for half is better than not showing up. Your body is telling you it needs more recovery. Get an extra hour of sleep tonight, eat a real meal with protein, and hydrate. Repeat the same workout next session — don't progress yet." },
    { id: 'ORANGE_SKIPPED', match: { completion: 'skipped' }, status: 'ORANGE', headline: 'RESET TOMORROW', response: "One missed workout doesn't break a plan. Six in a row does. The plan was built assuming you'd miss some sessions — just resume where you are. No need to make up the miles." },
    { id: 'YELLOW_OK_HARD', match: { feeling: 'ok', rpe: 'rpe_high' }, status: 'YELLOW', headline: 'NORMAL CHALLENGE', response: "Hard sessions are supposed to feel hard. The fact that you finished is the win. Recovery now matters more than the run did — protein, water, sleep. The adaptation happens between runs, not during them." },
    { id: 'YELLOW_TIRED_EASY', match: { feeling: 'tired', rpe: 'rpe_low' }, status: 'YELLOW', headline: 'WATCH THE TREND', response: "Tired on an easy run is a yellow flag. Could be sleep, stress, fueling, or accumulated fatigue. One run like this is normal. Two in a row, and we'll adjust the plan." },
    { id: 'GREEN_STRONG', match: { completion: 'completed', feeling: 'great' }, status: 'GREEN', headline: 'PROTOCOL HOLDING', response: "This is what consistency looks like. Don't be tempted to add miles or push the pace because you feel good — feeling good is the result of running easy. Trust the plan." },
    { id: 'GREEN_NORMAL', match: { completion: 'completed', feeling: 'ok' }, status: 'GREEN', headline: 'ON TARGET', response: "Solid session. Most runs should feel like this — neither great nor bad. Logging the boring runs is what builds the foundation." },
    { id: 'DEFAULT', match: {}, status: 'GREEN', headline: 'LOGGED', response: 'Workout logged. Onto the next one.' },
  ],
  pain_diagnoses: [
    {
      match: { location: 'shin' },
      name: 'Likely Shin Splints',
      response: 'Pain along the shin during/after running. Almost always from doing too much too soon, hard surfaces, or worn shoes.',
      actions: [
        'Rest 7-10 days from running — cross-train (bike, swim)',
        'Ice 15 min, twice daily',
        'Calf stretches and toe raises',
        'Avoid concrete; run on grass or treadmill when you return',
        'Replace shoes if over 400 miles',
        'Sharp localized pain on bone could be a stress fracture — see a doctor',
      ],
    },
    {
      match: { location: 'knee' },
      name: "Likely Runner's Knee",
      response: 'Pain around or under the kneecap. Common causes: weak hips/glutes, mileage spike, or worn shoes.',
      actions: [
        'Rest 5-7 days from running',
        'Ice the knee 15 min after activity',
        'Hip and glute strengthening (clamshells, side leg raises)',
        'Replace shoes if over 400 miles',
        'If pain persists 2+ weeks, see a sports physio',
      ],
    },
    {
      match: { location: 'foot' },
      name: 'Possible Plantar Fasciitis',
      response: 'Sharp heel pain especially on first morning steps is the textbook symptom.',
      actions: [
        'Roll a frozen water bottle under your foot 2x daily, 10 min each',
        'Calf and Achilles stretches before getting out of bed',
        'Switch to a higher-drop, well-cushioned shoe',
        'Reduce mileage 30-50% for 2 weeks',
        'Add arch-support insoles',
        'Persistent pain 4+ weeks: see a podiatrist',
      ],
    },
    {
      match: { location: 'achilles' },
      name: 'Likely Achilles Tendinitis',
      response: 'Pain or stiffness in the back of the heel/lower calf. Common after mileage spikes.',
      actions: [
        'Stop hill workouts immediately',
        'Reduce mileage 50% for 2 weeks',
        'Eccentric calf raises (3 sets of 15, slow lowering)',
        'Avoid zero-drop shoes; use 10mm+ drop',
        'Ice 15 min after activity',
      ],
    },
    {
      match: {},
      name: 'Pain — Generic Protocol',
      response: "Any pain that doesn't go away within 48 hours, gets worse during a run, or causes you to limp is a stop signal.",
      actions: [
        'Stop running for at least 3 days',
        'RICE: Rest, Ice, Compression, Elevation',
        "If pain doesn't improve in a week, see a sports physio or doctor",
        "Don't 'run through' pain — early intervention is the difference between 1 week off and 2 months off",
      ],
    },
  ],
  conversation: [
    { triggers: ['motivat', "don't feel", "don't want", 'lazy', 'tired of', 'unmotivat'], responses: ["You don't have to feel like running. You just have to start. Lace up. 10 minutes. If you still want to quit at 10, quit guilt-free.", "Motivation is what gets you started. Habit is what keeps you going. Feeling unmotivated is part of the deal.", "The hard part isn't the run. The hard part is the door. Get to the door."] },
    { triggers: ['pace', 'fast', 'slow', 'speed'], responses: ["Your easy pace should let you hold a conversation in full sentences. If you can't, you're running tempo, not easy. Slow down.", "Most runners run their easy runs too fast and their hard runs too slow. Save the speed for speed days.", "There's no such thing as 'too slow' on an easy run."] },
    { triggers: ['hot', 'humid', 'heat', 'summer'], responses: ["Heat makes every pace harder by ~20 sec/mile per 10°F over 60°F. Don't chase pace in heat — chase effort.", "Run early or late. Hydrate the day before, not just during. Carry water on runs over 45 min."] },
    { triggers: ['cold', 'winter', 'freez', 'snow'], responses: ["Dress for 15-20°F warmer than the actual temp. You'll be uncomfortable for the first 5 minutes — that's correct.", "Below 20°F slow your pace. Below 0°F take it indoors."] },
    { triggers: ['eat', 'food', 'fuel', 'nutrition', 'hungry'], responses: ["Before runs under 60 min: nothing required. Over 60 min: a banana or 30g carbs 30-60 min before.", "After every run: protein + carbs within 60 min. Chocolate milk is the cheapest perfect recovery drink."] },
    { triggers: ['shoe', 'replace', 'old shoes', 'footwear'], responses: ["Running shoes last 300-500 miles. Past that you're inviting injury.", "Rotate two pairs of shoes if possible. Studies show ~40% lower injury risk."] },
    { triggers: ['rest', 'day off', 'recover'], responses: ["Rest days are when adaptation happens. Skipping them doesn't make you stronger — it makes you broken.", "If you have to do something on a rest day: walk. 30 minutes, no pace target."] },
    { triggers: ['warm up', 'warmup', 'before run'], responses: ["Warm up with 5-10 min of brisk walking before easy runs. For hard sessions: jog 10-15 min + leg swings, high knees, A-skips."] },
    { triggers: ['injury', 'hurt', 'pain'], responses: ["Pain during a run is a stop signal. Discomfort is okay; pain is not. Take rest days seriously."] },
    { triggers: ['long run', 'long runs'], responses: ["Long runs should be 60-90 sec per mile slower than race pace. Bring water for anything over 60 minutes."] },
  ],
};

// ── ENGINE ──────────────────────────────────────────────────────────────────────
function matchRule(rules: any[], data: Record<string, any>) {
  for (const rule of rules) {
    let match = true;
    for (const [key, value] of Object.entries(rule.match as Record<string, any>)) {
      if (data[key] !== value) { match = false; break; }
    }
    if (match) return rule;
  }
  return rules[rules.length - 1];
}

function findResponse(text: string): string | null {
  const lower = text.toLowerCase();
  for (const cat of COACHING.conversation) {
    for (const trigger of cat.triggers) {
      if (lower.includes(trigger)) {
        return cat.responses[Math.floor(Math.random() * cat.responses.length)];
      }
    }
  }
  return null;
}

// ── STATUS COLORS ──────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  RED:    { bg: '#FF3D00', text: '#F4F1EA', label: 'PAUSE' },
  ORANGE: { bg: '#FF8A00', text: '#0A0A0A', label: 'ADJUST' },
  YELLOW: { bg: '#D4FF00', text: '#0A0A0A', label: 'WATCH' },
  GREEN:  { bg: '#0A0A0A', text: '#F4F1EA', label: 'PROCEED' },
};

// ── PULSE DOT ──────────────────────────────────────────────────────────────────
function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.5, duration: 333, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 334, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [scale]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3D00', transform: [{ scale }] }} />
      <Text style={s.pulseTxt}>CADENCE_180</Text>
    </View>
  );
}

// ── TOP BAR ────────────────────────────────────────────────────────────────────
function TopBar({ subtitle, onBack }: { subtitle?: string; onBack?: (() => void) | null }) {
  return (
    <View style={s.topBar}>
      <TouchableOpacity onPress={onBack ?? undefined} style={s.backBtn} disabled={!onBack}>
        <Text style={[s.backText, !onBack && { color: 'rgba(10,10,10,0.4)' }]}>
          {onBack ? 'BACK' : 'STRIDE//COACH'}
        </Text>
      </TouchableOpacity>
      {subtitle ? <Text style={s.topBarSub} numberOfLines={1}>{subtitle}</Text> : <View style={{ flex: 1 }} />}
      <PulseDot />
    </View>
  );
}

// ── HARD-SHADOW CARD WRAPPER ───────────────────────────────────────────────────
function Card({ style, children, shadowColor = '#0A0A0A' }: { style?: any; children: React.ReactNode; shadowColor?: string }) {
  return (
    <View style={{ marginRight: 4, marginBottom: 4 }}>
      <View style={[{ position: 'absolute', top: 4, left: 4, right: -4, bottom: -4, backgroundColor: shadowColor }]} />
      <View style={[s.card, style]}>{children}</View>
    </View>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function CoachScreen() {
  const [screen, setScreen] = useState<'plans' | 'plan_detail' | 'checkin' | 'response' | 'pain' | 'chat'>('plans');
  const [activePlan, setActivePlan] = useState<any>(null);
  const [checkInData, setCheckInData] = useState<Record<string, string | null>>({ completion: null, feeling: null, rpe: null });
  const [coachResponse, setCoachResponse] = useState<any>(null);
  const [painData, setPainData] = useState<Record<string, string | null>>({ location: null, type: null });
  const [painResult, setPainResult] = useState<any>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  // ── PLANS ──────────────────────────────────────────────────────────────────
  if (screen === 'plans') {
    return (
      <SafeAreaView style={s.root}>
        <TopBar subtitle="STATIC ENGINE / NO AI" onBack={null} />
        <InjuryBanner />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollPad}>
          {/* Header */}
          <View style={s.coachHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>▎ COACHING / 06 PROTOCOLS</Text>
              <Text style={s.heroTitle}>PICK YOUR{'\n'}MISSION.</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowIntegrations(true)}
              style={s.integrationsBtn}
            >
              <Text style={s.integrationsBtnText}>SYNC</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.heroSub}>
            Plans built from real coaching frameworks — Hal Higdon, C25K, return-to-run protocols. No subscription. No tokens.
          </Text>

          <IntegrationsModal
            visible={showIntegrations}
            onClose={() => setShowIntegrations(false)}
          />

          {/* Marquee Banner */}
          <View style={s.marqueeBand}>
            <Text style={s.marqueeText} numberOfLines={1}>
              {'  REAL COACHING. NO AI  //  REAL COACHING. NO AI  //  REAL COACHING. NO AI  //  '}
            </Text>
          </View>

          {/* Plan cards */}
          <View style={s.planGrid}>
            {COACHING.plans.map((plan) => {
              const lightBg = ['#D4FF00', '#00E5FF'].includes(plan.color);
              return (
                <Card key={plan.id} style={s.planCard}>
                  <TouchableOpacity onPress={() => { setActivePlan(plan); setScreen('plan_detail'); }} activeOpacity={0.85}>
                    <View style={s.planCardTop}>
                      <View style={[s.codeTag, { backgroundColor: plan.color }]}>
                        <Text style={[s.codeTagText, { color: lightBg ? '#0A0A0A' : '#F4F1EA' }]}>/{plan.code}/</Text>
                      </View>
                      <Text style={s.planLevel}>{plan.level}</Text>
                    </View>
                    <Text style={s.planName}>{plan.name}</Text>
                    <Text style={s.planTagline}>{plan.tagline}</Text>
                    <View style={s.planStats}>
                      <View style={s.planStat}>
                        <Text style={s.planStatLabel}>WEEKS</Text>
                        <Text style={s.planStatVal}>{plan.duration_weeks}</Text>
                      </View>
                      <View style={s.planStat}>
                        <Text style={s.planStatLabel}>RUNS/WK</Text>
                        <Text style={s.planStatVal}>{plan.runs_per_week}</Text>
                      </View>
                      <View style={s.planStat}>
                        <Text style={s.planStatLabel}>GOAL</Text>
                        <Text style={[s.planStatVal, { fontSize: 11, color: '#FF3D00', lineHeight: 14 }]}>{plan.target_event.toUpperCase()}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Card>
              );
            })}
          </View>

          {/* Quick links */}
          <View style={s.quickLinks}>
            <Card style={[s.quickCard, { backgroundColor: '#0A0A0A' }]} shadowColor="#FF3D00">
              <TouchableOpacity onPress={() => setScreen('checkin')} activeOpacity={0.85}>
                <Text style={s.quickCardIdx}>/01/</Text>
                <Text style={s.quickCardTitle}>LOG A WORKOUT</Text>
                <Text style={s.quickCardSub}>3 questions, get coaching feedback</Text>
              </TouchableOpacity>
            </Card>
            <Card style={[s.quickCard, { backgroundColor: '#FF3D00' }]}>
              <TouchableOpacity onPress={() => setScreen('pain')} activeOpacity={0.85}>
                <Text style={[s.quickCardIdx, { color: 'rgba(244,241,234,0.7)' }]}>/02/</Text>
                <Text style={s.quickCardTitle}>REPORT PAIN</Text>
                <Text style={[s.quickCardSub, { color: 'rgba(244,241,234,0.7)' }]}>Pain triage decision tree</Text>
              </TouchableOpacity>
            </Card>
            <Card style={[s.quickCard, { backgroundColor: '#D4FF00' }]}>
              <TouchableOpacity onPress={() => setScreen('chat')} activeOpacity={0.85}>
                <Text style={[s.quickCardIdx, { color: 'rgba(10,10,10,0.5)' }]}>/03/</Text>
                <Text style={[s.quickCardTitle, { color: '#0A0A0A' }]}>ASK COACH</Text>
                <Text style={[s.quickCardSub, { color: 'rgba(10,10,10,0.6)' }]}>Pre-written answers, no AI</Text>
              </TouchableOpacity>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PLAN DETAIL ────────────────────────────────────────────────────────────
  if (screen === 'plan_detail' && activePlan) {
    const plan = activePlan;
    const previewWeeks = plan.weeks ? plan.weeks.slice(0, 4) : [];
    return (
      <SafeAreaView style={s.root}>
        <TopBar subtitle={`/${plan.code}/`} onBack={() => setScreen('plans')} />
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Dark hero */}
          <View style={s.darkHero}>
            <Text style={[s.eyebrow, { color: plan.color, marginBottom: 10 }]}>◆ PROTOCOL / {plan.code}</Text>
            <Text style={s.planDetailTitle}>{plan.name}</Text>
            <Text style={s.planDetailTagline}>{plan.tagline}</Text>
            <View style={s.detailStats}>
              {[
                { val: `${plan.duration_weeks}`, unit: 'WKS', label: 'DURATION' },
                { val: `${plan.runs_per_week}`, unit: '/WK', label: 'RUN DAYS' },
                { val: plan.level.split('+')[0], unit: '', label: 'LEVEL' },
                { val: plan.target_event.split(' ')[0], unit: '', label: 'TARGET' },
              ].map((s2, i) => (
                <View key={i} style={s.detailStat}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                    <Text style={s.detailStatVal}>{s2.val}</Text>
                    {!!s2.unit && <Text style={s.detailStatUnit}>{s2.unit}</Text>}
                  </View>
                  <Text style={s.detailStatLabel}>/{s2.label}/</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={s.scrollPad}>
            {/* Prerequisites + sample week */}
            <View style={s.prereqRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.sectionLabel}>▎ PREREQUISITES</Text>
                <Text style={s.prereqText}>{plan.prerequisites}</Text>
              </View>
            </View>
            <View style={s.prereqRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.sectionLabel}>▎ SAMPLE WEEK</Text>
                <Text style={s.sampleWeekText}>{plan.sample_week}</Text>
              </View>
            </View>

            {/* Week preview */}
            {previewWeeks.length > 0 && (
              <View style={{ marginTop: 28 }}>
                <Text style={s.sectionLabel}>▎ WEEK-BY-WEEK PREVIEW</Text>
                {previewWeeks.map((week: any, i: number) => (
                  <View key={i} style={s.weekBlock}>
                    <View style={s.weekHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                        <Text style={[s.weekNum, { color: plan.color === '#D4FF00' ? '#0A0A0A' : plan.color }]}>0{week.week}</Text>
                        <Text style={s.weekLabel}>WEEK</Text>
                      </View>
                      {week.focus && <Text style={s.weekFocus}>"{week.focus}"</Text>}
                    </View>
                    {week.workouts && week.workouts.map((w: any, j: number) => (
                      <View key={j} style={[s.workoutRow, w.milestone && s.workoutRowMilestone]}>
                        <Text style={s.workoutDay}>DAY {w.day}{w.milestone ? ' · ◆ MILESTONE' : ''}</Text>
                        <Text style={s.workoutTitle}>{w.title}</Text>
                        <Text style={s.workoutDesc}>{w.description}</Text>
                        <Text style={s.workoutTotal}>{w.total}</Text>
                      </View>
                    ))}
                  </View>
                ))}
                {plan.weeks && plan.weeks.length > 4 && (
                  <Text style={s.moreWeeks}>+ {plan.weeks.length - 4} MORE WEEKS</Text>
                )}
              </View>
            )}
          </View>

          {/* CTA */}
          <View style={s.darkCta}>
            <Text style={s.ctaText}>
              Ready to commit? After each session you'll check in — the plan adapts.
            </Text>
            <Card style={s.ctaBtn} shadowColor="#F4F1EA">
              <TouchableOpacity onPress={() => setScreen('checkin')} activeOpacity={0.85}>
                <Text style={s.ctaBtnText}>BEGIN PROTOCOL</Text>
              </TouchableOpacity>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── CHECK-IN ───────────────────────────────────────────────────────────────
  if (screen === 'checkin') {
    const allAnswered = checkInData.completion && checkInData.feeling && checkInData.rpe;
    const handleSubmit = () => {
      const matched = matchRule(COACHING.decision_rules, checkInData);
      setCoachResponse(matched);
      setScreen('response');
    };

    const OptionBtn = ({ id, label, icon, field, accent }: { id: string; label: string; icon: string; field: string; accent?: string }) => {
      const active = checkInData[field] === id;
      return (
        <Card style={[s.optBtn, active && { backgroundColor: accent || '#0A0A0A', borderColor: accent || '#0A0A0A' }]}
          shadowColor={active ? '#FF3D00' : '#0A0A0A'}>
          <TouchableOpacity onPress={() => setCheckInData({ ...checkInData, [field]: id })} activeOpacity={0.85}>
            <Text style={[s.optIcon, active && { color: '#F4F1EA' }]}>{icon}</Text>
            <Text style={[s.optLabel, active && { color: '#F4F1EA' }]}>{label}</Text>
          </TouchableOpacity>
        </Card>
      );
    };

    return (
      <SafeAreaView style={s.root}>
        <TopBar subtitle="DEBRIEF" onBack={() => { setScreen('plans'); setCheckInData({ completion: null, feeling: null, rpe: null }); }} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollPad}>
          <Text style={s.eyebrow}>▎ POST-RUN CHECK-IN</Text>
          <Text style={s.heroTitle}>DEBRIEF.</Text>
          <Text style={s.heroSub}>Three honest reads. Coaching response is instant — no AI.</Text>

          {/* Q1 */}
          <Text style={s.qLabel}>/01/ COMPLETION</Text>
          <Text style={s.qTitle}>Did you finish today's session?</Text>
          <View style={s.optRow}>
            <OptionBtn id="completed" label="Crushed it" icon="◆" field="completion" />
            <OptionBtn id="partial" label="Most of it" icon="◐" field="completion" />
            <OptionBtn id="skipped" label="Couldn't today" icon="○" field="completion" />
          </View>

          {/* Q2 */}
          <Text style={[s.qLabel, { marginTop: 28 }]}>/02/ FEELING</Text>
          <Text style={s.qTitle}>How did your body feel?</Text>
          <View style={s.optRow}>
            <OptionBtn id="great" label="Strong" icon="++" field="feeling" />
            <OptionBtn id="ok" label="Normal" icon="OK" field="feeling" />
            <OptionBtn id="tired" label="Tired" icon="--" field="feeling" />
            <OptionBtn id="pain" label="Pain" icon="!!" field="feeling" accent="#FF3D00" />
          </View>

          {/* Q3 */}
          <Text style={[s.qLabel, { marginTop: 28 }]}>/03/ EFFORT</Text>
          <Text style={s.qTitle}>How hard was it? (1=easy, 10=max)</Text>
          <View style={s.optRow}>
            <OptionBtn id="rpe_low" label="1–3 Easy" icon="▎" field="rpe" />
            <OptionBtn id="rpe_mid" label="4–6 Moderate" icon="▎▎" field="rpe" />
            <OptionBtn id="rpe_high" label="7–9 Hard" icon="▎▎▎" field="rpe" />
            <OptionBtn id="rpe_max" label="10 Max" icon="▎▎▎▎" field="rpe" />
          </View>

          {/* Submit */}
          <View style={{ marginTop: 36, marginBottom: 40 }}>
            <Card style={[s.submitBtn, !allAnswered && s.submitBtnDisabled]} shadowColor={allAnswered ? '#0A0A0A' : 'transparent'}>
              <TouchableOpacity onPress={handleSubmit} disabled={!allAnswered} activeOpacity={0.85}>
                <Text style={[s.submitBtnText, !allAnswered && { color: 'rgba(10,10,10,0.3)' }]}>
                  GET COACHING
                </Text>
              </TouchableOpacity>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── RESPONSE ───────────────────────────────────────────────────────────────
  if (screen === 'response' && coachResponse) {
    const status = STATUS_STYLE[coachResponse.status] || STATUS_STYLE.GREEN;
    return (
      <SafeAreaView style={s.root}>
        <TopBar subtitle="COACH RESPONSE" onBack={() => setScreen('checkin')} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[s.responseHero, { backgroundColor: status.bg }]}>
            <Text style={[s.eyebrow, { color: status.text, opacity: 0.7 }]}>◆ STATUS / {coachResponse.status} / {status.label}</Text>
            <Text style={[s.heroTitle, { color: status.text, marginTop: 8 }]}>{coachResponse.headline}</Text>
          </View>
          <View style={s.scrollPad}>
            <Text style={s.sectionLabel}>▎ COACH SAYS</Text>
            <Text style={[s.responseQuote, { borderLeftColor: status.bg }]}>
              {coachResponse.response}
            </Text>

            <View style={{ marginTop: 36, gap: 12, marginBottom: 40 }}>
              <Card>
                <TouchableOpacity onPress={() => { setCheckInData({ completion: null, feeling: null, rpe: null }); setScreen('plans'); }} style={[s.actionBtn, { backgroundColor: '#0A0A0A' }]} activeOpacity={0.85}>
                  <Text style={[s.actionBtnText, { color: '#F4F1EA' }]}>BACK TO PLANS</Text>
                </TouchableOpacity>
              </Card>
              {coachResponse.status === 'RED' && (
                <Card shadowColor="#FF3D00">
                  <TouchableOpacity onPress={() => setScreen('pain')} style={[s.actionBtn, { backgroundColor: '#FF3D00' }]} activeOpacity={0.85}>
                    <Text style={[s.actionBtnText, { color: '#F4F1EA' }]}>PAIN TRIAGE</Text>
                  </TouchableOpacity>
                </Card>
              )}
              <Card>
                <TouchableOpacity onPress={() => setScreen('chat')} style={[s.actionBtn, { backgroundColor: '#D4FF00' }]} activeOpacity={0.85}>
                  <Text style={[s.actionBtnText, { color: '#0A0A0A' }]}>ASK COACH</Text>
                </TouchableOpacity>
              </Card>
            </View>

            <Text style={s.ruleId}>END_OF_DEBRIEF / RULE_ID: {coachResponse.id}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PAIN TRIAGE ────────────────────────────────────────────────────────────
  if (screen === 'pain') {
    const handlePainSubmit = () => {
      const result = matchRule(COACHING.pain_diagnoses, painData);
      setPainResult(result);
    };

    return (
      <SafeAreaView style={s.root}>
        <TopBar subtitle="PAIN TRIAGE" onBack={() => { setScreen('plans'); setPainData({ location: null, type: null }); setPainResult(null); }} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollPad}>
          <Text style={s.eyebrow}>▎ INJURY ASSESSMENT</Text>
          <Text style={s.heroTitle}>PAIN{'\n'}PROTOCOL.</Text>
          <Text style={s.heroSub}>Tell us where it hurts. Decision tree gives a recovery protocol. Not a diagnosis — see a sports physio for serious pain.</Text>

          {!painResult ? (
            <>
              {/* Location */}
              <Text style={[s.qLabel, { marginTop: 28 }]}>/01/ LOCATION</Text>
              <Text style={s.qTitle}>Where is the pain?</Text>
              <View style={s.locationGrid}>
                {['knee', 'shin', 'foot', 'achilles', 'calf', 'ankle', 'hip', 'back'].map((loc) => (
                  <Card key={loc} style={[s.locationBtn, painData.location === loc && { backgroundColor: '#FF3D00', borderColor: '#FF3D00' }]}>
                    <TouchableOpacity onPress={() => setPainData({ ...painData, location: loc })} activeOpacity={0.85}>
                      <Text style={[s.locationBtnText, painData.location === loc && { color: '#F4F1EA' }]}>
                        {loc.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  </Card>
                ))}
              </View>

              {/* Type */}
              <Text style={[s.qLabel, { marginTop: 28 }]}>/02/ TYPE</Text>
              <Text style={s.qTitle}>What does it feel like?</Text>
              <View style={s.locationGrid}>
                {['sharp', 'dull', 'burning', 'throbbing', 'tight'].map((t) => (
                  <Card key={t} style={[s.locationBtn, painData.type === t && { backgroundColor: '#0A0A0A', borderColor: '#0A0A0A' }]}>
                    <TouchableOpacity onPress={() => setPainData({ ...painData, type: t })} activeOpacity={0.85}>
                      <Text style={[s.locationBtnText, painData.type === t && { color: '#F4F1EA' }]}>
                        {t.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  </Card>
                ))}
              </View>

              <View style={{ marginTop: 36, marginBottom: 40 }}>
                <Card style={[s.submitBtn, !painData.location && s.submitBtnDisabled]} shadowColor={painData.location ? '#0A0A0A' : 'transparent'}>
                  <TouchableOpacity onPress={handlePainSubmit} disabled={!painData.location} activeOpacity={0.85}>
                    <Text style={[s.submitBtnText, !painData.location && { color: 'rgba(10,10,10,0.3)' }]}>TRIAGE</Text>
                  </TouchableOpacity>
                </Card>
              </View>
            </>
          ) : (
            <View style={{ marginTop: 28, paddingBottom: 40 }}>
              {/* Diagnosis card */}
              <View style={s.diagnosisCard}>
                <Text style={s.sectionLabel}>▎ PROBABLE DIAGNOSIS</Text>
                <Text style={s.diagnosisName}>{painResult.name}</Text>
                <Text style={s.diagnosisText}>{painResult.response}</Text>
              </View>

              {/* Protocol */}
              <Text style={[s.sectionLabel, { marginTop: 24, marginBottom: 12 }]}>▎ RECOVERY PROTOCOL</Text>
              {painResult.actions.map((action: string, i: number) => (
                <View key={i} style={s.actionItem}>
                  <Text style={s.actionItemIdx}>/{String(i + 1).padStart(2, '0')}/</Text>
                  <Text style={s.actionItemText}>{action}</Text>
                </View>
              ))}

              {/* Disclaimer */}
              <View style={s.disclaimer}>
                <Text style={s.disclaimerTitle}>⚠ DISCLAIMER</Text>
                <Text style={s.disclaimerText}>
                  This is a triage tool, not a medical diagnosis. Persistent pain, sharp localized pain on bone, inability to bear weight, or pain lasting more than 2 weeks warrants a visit to a sports physio or doctor.
                </Text>
              </View>

              <Card style={[s.actionBtn, { backgroundColor: '#0A0A0A', marginTop: 24 }]} shadowColor="#FF3D00">
                <TouchableOpacity onPress={() => { setPainData({ location: null, type: null }); setPainResult(null); }} activeOpacity={0.85}>
                  <Text style={[s.actionBtnText, { color: '#F4F1EA' }]}>TRIAGE ANOTHER</Text>
                </TouchableOpacity>
              </Card>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── CHAT ───────────────────────────────────────────────────────────────────
  if (screen === 'chat') {
    const handleSend = (text?: string) => {
      const msg = (text ?? chatInput).trim();
      if (!msg) return;
      const response = findResponse(msg);
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', text: msg },
        { role: 'coach', text: response ?? "Specific question not recognized. Try keywords like 'motivation', 'pace', 'shoes', 'fuel', 'rest', 'heat', or 'cold'." },
      ]);
      setChatInput('');
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const quickAsks = [
      "I don't feel like running today",
      "How fast should my easy runs be?",
      "When should I replace my shoes?",
      "What should I eat before a run?",
      "Do I really need rest days?",
      "How do I run in hot weather?",
    ];

    return (
      <SafeAreaView style={s.root}>
        <TopBar subtitle="STATIC COACH / KEYWORD MATCH" onBack={() => { setScreen('plans'); setChatHistory([]); }} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
          <ScrollView ref={chatScrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollPad}>
            <Text style={s.eyebrow}>▎ ASK COACH</Text>
            <Text style={s.heroTitle}>COACHING{'\n'}DESK.</Text>
            <Text style={s.heroSub}>All responses are pre-written by real coaches. Keyword-matched instantly. No AI.</Text>

            {chatHistory.length === 0 && (
              <View style={{ marginTop: 24 }}>
                <Text style={s.quickAsksLabel}>QUICK ASKS</Text>
                {quickAsks.map((q, i) => (
                  <Card key={i} style={s.quickAskBtn}>
                    <TouchableOpacity onPress={() => handleSend(q)} activeOpacity={0.85}>
                      <Text style={s.quickAskText}>"{q}"</Text>
                    </TouchableOpacity>
                  </Card>
                ))}
              </View>
            )}

            {chatHistory.map((msg, i) => (
              <View key={i} style={[s.chatMsg, msg.role === 'user' ? s.chatMsgUser : s.chatMsgCoach]}>
                <Text style={s.chatMsgRole}>{msg.role === 'user' ? 'YOU' : '◆ COACH'}</Text>
                <View style={msg.role === 'user' ? s.chatBubbleUser : s.chatBubbleCoach}>
                  <Text style={msg.role === 'user' ? s.chatTextUser : s.chatTextCoach}>{msg.text}</Text>
                </View>
              </View>
            ))}
            <View style={{ height: 80 }} />
          </ScrollView>

          {/* Input */}
          <View style={s.chatInputRow}>
            <TextInput
              style={s.chatInput}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Ask about pace, fueling, shoes..."
              placeholderTextColor="rgba(10,10,10,0.35)"
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />
            <Card shadowColor="#0A0A0A">
              <TouchableOpacity onPress={() => handleSend()} style={s.chatSendBtn} activeOpacity={0.85}>
                <Text style={s.chatSendText}>ASK</Text>
              </TouchableOpacity>
            </Card>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return null;
}

// ── STYLES ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F1EA' },
  scrollPad: { padding: 20, paddingBottom: 40 },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: '#0A0A0A', backgroundColor: '#F4F1EA' },
  backBtn: { marginRight: 12 },
  backText: { fontFamily: 'SpaceMono', fontSize: 11, color: '#0A0A0A', letterSpacing: 1 },
  topBarSub: { flex: 1, fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 1.5, textAlign: 'center' },
  pulseTxt: { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(10,10,10,0.5)', letterSpacing: 1.5 },

  // Card
  card: { backgroundColor: '#F4F1EA', borderWidth: 2, borderColor: '#0A0A0A', borderRadius: 2 },

  // Typography
  eyebrow: { fontFamily: 'SpaceMono', fontSize: 10, color: '#FF3D00', letterSpacing: 2, marginBottom: 10 },
  heroTitle: { fontSize: 48, fontWeight: '900', color: '#0A0A0A', letterSpacing: -2, lineHeight: 46, marginBottom: 14 },
  heroSub: { fontFamily: 'SpaceMono', fontSize: 11, color: 'rgba(10,10,10,0.55)', lineHeight: 18, letterSpacing: 0.2, marginBottom: 20 },
  coachHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  integrationsBtn: { borderWidth: 2, borderColor: '#0A0A0A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 2, marginTop: 4 },
  integrationsBtnText: { fontFamily: 'SpaceMono', fontSize: 9, fontWeight: '700', color: '#0A0A0A', letterSpacing: 1.5 },

  // Marquee banner
  marqueeBand: { backgroundColor: '#D4FF00', borderTopWidth: 2, borderBottomWidth: 2, borderColor: '#0A0A0A', paddingVertical: 10, marginHorizontal: -20, marginBottom: 24 },
  marqueeText: { fontFamily: 'SpaceMono', fontSize: 13, fontWeight: '700', color: '#0A0A0A', letterSpacing: 1, paddingHorizontal: 12 },

  // Plans
  planGrid: { gap: 16 },
  planCard: { padding: 18 },
  planCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  codeTag: { paddingHorizontal: 8, paddingVertical: 4 },
  codeTagText: { fontFamily: 'SpaceMono', fontSize: 10, letterSpacing: 1.5 },
  planLevel: { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2 },
  planName: { fontSize: 22, fontWeight: '900', color: '#0A0A0A', letterSpacing: -0.5, lineHeight: 24, marginBottom: 8 },
  planTagline: { fontFamily: 'SpaceMono', fontSize: 11, color: 'rgba(10,10,10,0.6)', lineHeight: 17, marginBottom: 16, fontStyle: 'italic' },
  planStats: { flexDirection: 'row', borderTopWidth: 2, borderTopColor: '#0A0A0A', paddingTop: 12, gap: 12 },
  planStat: { flex: 1 },
  planStatLabel: { fontFamily: 'SpaceMono', fontSize: 8, color: 'rgba(10,10,10,0.5)', letterSpacing: 1.5, marginBottom: 3 },
  planStatVal: { fontFamily: 'SpaceMono', fontSize: 20, fontWeight: '700', color: '#0A0A0A', lineHeight: 22 },

  // Quick links
  quickLinks: { marginTop: 32, gap: 12 },
  quickCard: { padding: 20 },
  quickCardIdx: { fontFamily: 'SpaceMono', fontSize: 10, color: '#FF3D00', letterSpacing: 2, marginBottom: 6 },
  quickCardTitle: { fontSize: 18, fontWeight: '900', color: '#F4F1EA', letterSpacing: -0.3, marginBottom: 4 },
  quickCardSub: { fontFamily: 'SpaceMono', fontSize: 10, color: 'rgba(244,241,234,0.55)', lineHeight: 15 },

  // Plan detail
  darkHero: { backgroundColor: '#0A0A0A', padding: 24, paddingBottom: 28 },
  planDetailTitle: { fontSize: 38, fontWeight: '900', color: '#F4F1EA', letterSpacing: -1.5, lineHeight: 38, marginBottom: 10 },
  planDetailTagline: { fontFamily: 'SpaceMono', fontSize: 12, color: 'rgba(244,241,234,0.6)', lineHeight: 18, fontStyle: 'italic', marginBottom: 24 },
  detailStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(244,241,234,0.2)', paddingTop: 16 },
  detailStat: { flex: 1 },
  detailStatVal: { fontFamily: 'SpaceMono', fontSize: 22, fontWeight: '700', color: '#F4F1EA', lineHeight: 24 },
  detailStatUnit: { fontFamily: 'SpaceMono', fontSize: 11, color: 'rgba(244,241,234,0.4)' },
  detailStatLabel: { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(244,241,234,0.4)', letterSpacing: 1.5, marginTop: 4 },
  prereqRow: { marginBottom: 16 },
  prereqText: { fontSize: 15, color: '#0A0A0A', lineHeight: 22, fontStyle: 'italic' },
  sampleWeekText: { fontFamily: 'SpaceMono', fontSize: 11, color: '#0A0A0A', lineHeight: 18 },
  sectionLabel: { fontFamily: 'SpaceMono', fontSize: 10, color: '#FF3D00', letterSpacing: 2, marginBottom: 12 },
  weekBlock: { borderWidth: 2, borderColor: '#0A0A0A', padding: 16, marginBottom: 12 },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  weekNum: { fontSize: 32, fontWeight: '900', lineHeight: 34 },
  weekLabel: { fontFamily: 'SpaceMono', fontSize: 10, color: 'rgba(10,10,10,0.5)', letterSpacing: 2 },
  weekFocus: { fontFamily: 'SpaceMono', fontSize: 10, color: 'rgba(10,10,10,0.5)', fontStyle: 'italic', flex: 1, textAlign: 'right' },
  workoutRow: { borderWidth: 1, borderColor: 'rgba(10,10,10,0.15)', padding: 12, marginBottom: 8 },
  workoutRowMilestone: { backgroundColor: 'rgba(255,61,0,0.06)', borderColor: '#FF3D00' },
  workoutDay: { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(10,10,10,0.5)', letterSpacing: 1.5, marginBottom: 4 },
  workoutTitle: { fontSize: 14, fontWeight: '800', color: '#0A0A0A', marginBottom: 3 },
  workoutDesc: { fontFamily: 'SpaceMono', fontSize: 10, color: 'rgba(10,10,10,0.7)', lineHeight: 16, marginBottom: 4 },
  workoutTotal: { fontFamily: 'SpaceMono', fontSize: 10, color: '#FF3D00', letterSpacing: 1 },
  moreWeeks: { fontFamily: 'SpaceMono', fontSize: 10, color: 'rgba(10,10,10,0.35)', letterSpacing: 2, textAlign: 'center', paddingVertical: 16 },
  darkCta: { backgroundColor: '#0A0A0A', padding: 32, alignItems: 'center' },
  ctaText: { fontFamily: 'SpaceMono', fontSize: 11, color: 'rgba(244,241,234,0.55)', lineHeight: 18, textAlign: 'center', marginBottom: 24, maxWidth: 280 },
  ctaBtn: { backgroundColor: '#FF3D00', borderColor: '#FF3D00', padding: 18, paddingHorizontal: 40 },
  ctaBtnText: { fontFamily: 'SpaceMono', fontSize: 13, fontWeight: '700', color: '#F4F1EA', letterSpacing: 2 },

  // Check-in
  qLabel: { fontFamily: 'SpaceMono', fontSize: 10, color: '#FF3D00', letterSpacing: 2, marginBottom: 6 },
  qTitle: { fontSize: 20, fontWeight: '800', color: '#0A0A0A', letterSpacing: -0.3, marginBottom: 16 },
  optRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optBtn: { padding: 16, minWidth: 80, flex: 1 },
  optIcon: { fontFamily: 'SpaceMono', fontSize: 18, color: '#0A0A0A', marginBottom: 6 },
  optLabel: { fontFamily: 'SpaceMono', fontSize: 10, color: '#0A0A0A', letterSpacing: 0.5, lineHeight: 15 },
  submitBtn: { backgroundColor: '#FF3D00', borderColor: '#FF3D00', padding: 20, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: 'rgba(10,10,10,0.08)', borderColor: 'rgba(10,10,10,0.12)' },
  submitBtnText: { fontFamily: 'SpaceMono', fontSize: 14, fontWeight: '700', color: '#F4F1EA', letterSpacing: 2 },

  // Response
  responseHero: { padding: 28 },
  responseQuote: { fontSize: 16, color: '#0A0A0A', lineHeight: 26, borderLeftWidth: 4, borderLeftColor: '#FF3D00', paddingLeft: 16, marginTop: 4 },
  actionBtn: { padding: 18, alignItems: 'center' },
  actionBtnText: { fontFamily: 'SpaceMono', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  ruleId: { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(10,10,10,0.3)', letterSpacing: 1.5, marginTop: 24 },

  // Pain triage
  locationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  locationBtn: { padding: 14, minWidth: 80 },
  locationBtnText: { fontFamily: 'SpaceMono', fontSize: 11, fontWeight: '700', color: '#0A0A0A', letterSpacing: 1.5, textAlign: 'center' },
  diagnosisCard: { backgroundColor: '#0A0A0A', padding: 20 },
  diagnosisName: { fontSize: 22, fontWeight: '900', color: '#F4F1EA', letterSpacing: -0.5, lineHeight: 26, marginBottom: 10, marginTop: 4 },
  diagnosisText: { fontFamily: 'SpaceMono', fontSize: 12, color: 'rgba(244,241,234,0.7)', lineHeight: 19, fontStyle: 'italic' },
  actionItem: { flexDirection: 'row', gap: 12, borderLeftWidth: 2, borderLeftColor: '#FF3D00', paddingLeft: 14, paddingVertical: 4, marginBottom: 12 },
  actionItemIdx: { fontFamily: 'SpaceMono', fontSize: 9, color: '#FF3D00', letterSpacing: 1, marginTop: 2, width: 28 },
  actionItemText: { flex: 1, fontSize: 14, color: '#0A0A0A', lineHeight: 21 },
  disclaimer: { borderWidth: 2, borderColor: '#FF3D00', padding: 16, marginTop: 24, backgroundColor: 'rgba(255,61,0,0.05)' },
  disclaimerTitle: { fontFamily: 'SpaceMono', fontSize: 10, color: '#FF3D00', letterSpacing: 2, marginBottom: 8 },
  disclaimerText: { fontFamily: 'SpaceMono', fontSize: 11, color: '#0A0A0A', lineHeight: 18 },

  // Chat
  quickAsksLabel: { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(10,10,10,0.4)', letterSpacing: 2, marginBottom: 12 },
  quickAskBtn: { padding: 14, marginBottom: 10 },
  quickAskText: { fontSize: 14, color: '#0A0A0A', lineHeight: 20 },
  chatMsg: { marginBottom: 16 },
  chatMsgUser: { alignItems: 'flex-end' },
  chatMsgCoach: { alignItems: 'flex-start' },
  chatMsgRole: { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(10,10,10,0.45)', letterSpacing: 1.5, marginBottom: 4 },
  chatBubbleUser: { backgroundColor: '#0A0A0A', padding: 14, maxWidth: '85%', borderRadius: 2 },
  chatBubbleCoach: { backgroundColor: '#D4FF00', padding: 14, maxWidth: '85%', borderWidth: 2, borderColor: '#0A0A0A', borderRadius: 2 },
  chatTextUser: { fontFamily: 'SpaceMono', fontSize: 12, color: '#F4F1EA', lineHeight: 19 },
  chatTextCoach: { fontSize: 14, color: '#0A0A0A', lineHeight: 22 },
  chatInputRow: { flexDirection: 'row', padding: 14, borderTopWidth: 2, borderTopColor: '#0A0A0A', backgroundColor: '#F4F1EA', gap: 10, alignItems: 'center' },
  chatInput: { flex: 1, borderWidth: 2, borderColor: '#0A0A0A', paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'SpaceMono', fontSize: 12, color: '#0A0A0A', backgroundColor: '#F4F1EA' },
  chatSendBtn: { backgroundColor: '#FF3D00', paddingHorizontal: 16, paddingVertical: 14 },
  chatSendText: { fontFamily: 'SpaceMono', fontSize: 11, fontWeight: '700', color: '#F4F1EA', letterSpacing: 1.5 },
});
