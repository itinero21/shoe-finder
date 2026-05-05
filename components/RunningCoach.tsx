import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface Tip {
  heading: string;
  body: string;
}

interface Category {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tips: Tip[];
}

const KNOWLEDGE_BASE: Category[] = [
  {
    id: 'training',
    label: 'TRAINING',
    icon: 'trending-up-outline',
    tips: [
      {
        heading: 'The 80/20 Rule',
        body: 'Run 80% of your weekly mileage at easy, conversational pace. Reserve the remaining 20% for tempo, intervals, and hard efforts. This ratio is used by elite runners worldwide and reduces injury risk dramatically.',
      },
      {
        heading: 'Build Mileage Gradually',
        body: 'Never increase weekly mileage by more than 10% week-on-week. Rapid volume spikes are the leading cause of overuse injuries like stress fractures and shin splints.',
      },
      {
        heading: 'The Long Run',
        body: 'Cap your weekly long run at 30% of total weekly mileage. Run it 60–90 seconds per mile slower than goal race pace. Time on feet matters more than speed on long runs.',
      },
      {
        heading: 'Rest Days Are Training',
        body: 'Adaptation happens during recovery, not during the run itself. Schedule at least one full rest day per week and one easy week every 3–4 weeks to consolidate fitness.',
      },
      {
        heading: 'Strides Improve Form',
        body: 'Add 4–6 strides (20-second accelerations at 95% effort) after easy runs 2–3 times per week. They improve turnover and running economy without adding recovery burden.',
      },
    ],
  },
  {
    id: 'recovery',
    label: 'RECOVERY',
    icon: 'fitness-outline',
    tips: [
      {
        heading: 'The 48-Hour Rule',
        body: 'Allow 48 hours between hard sessions — tempo, intervals, or long runs. Running hard on fatigued legs teaches poor movement patterns and increases injury risk.',
      },
      {
        heading: 'Sleep Is Your Superpower',
        body: 'Athletes who sleep 9+ hours outperform those sleeping 6 hours by measurable margins. Growth hormone — responsible for tissue repair — is released primarily during deep sleep.',
      },
      {
        heading: 'Active Recovery Works',
        body: 'A 20–30 minute easy jog or walk the day after a hard effort flushes lactate, reduces soreness, and keeps aerobic adaptation ticking without adding stress.',
      },
      {
        heading: 'Foam Rolling Protocol',
        body: 'Spend 60–90 seconds on each muscle group: calves, IT band, quads, hip flexors. Roll slowly, pause on tender spots. Best done post-run when tissue is warm.',
      },
      {
        heading: 'Cold vs. Heat',
        body: 'Use ice within 24–48 hours of acute injury to reduce inflammation. After that, switch to heat to promote blood flow and healing. Never ice before running — it masks pain signals.',
      },
    ],
  },
  {
    id: 'injury',
    label: 'INJURY PREVENTION',
    icon: 'shield-checkmark-outline',
    tips: [
      {
        heading: 'Runner\'s Knee (PFPS)',
        body: 'Caused by weak glutes and hip abductors letting the knee cave inward. Fix: clamshells, single-leg squats, and lateral band walks 3x per week. Reduce downhill running until resolved.',
      },
      {
        heading: 'Plantar Fasciitis',
        body: 'Tightness in the plantar fascia. Morning pain is the hallmark. Fix: calf stretching, towel scrunches, and frozen water bottle rolling. Max-cushion shoes reduce impact load. Avoid barefoot walking on hard floors.',
      },
      {
        heading: 'IT Band Syndrome',
        body: 'Pain on the outer knee, worsens around miles 2–3. Fix: foam roll the TFL (hip), not the IT band itself. Strengthen hip abductors. Avoid cambered road surfaces temporarily.',
      },
      {
        heading: 'Shin Splints',
        body: 'Medial tibial stress syndrome — ache along the inner shin. Caused by too much, too soon. Fix: reduce mileage by 50%, increase cadence to reduce ground contact forces, and strengthen the tibialis anterior.',
      },
      {
        heading: 'Achilles Tendinopathy',
        body: 'Stiffness and pain at the back of the heel. Fix: eccentric heel drops off a step — 3 sets of 15 twice daily. This is clinically proven to remodel tendon structure. Avoid uphill running until resolved.',
      },
    ],
  },
  {
    id: 'form',
    label: 'RUNNING FORM',
    icon: 'body-outline',
    tips: [
      {
        heading: 'Cadence: Aim for 170–180 spm',
        body: 'Low cadence (under 160 spm) means overstriding — landing with your foot ahead of your centre of mass. This brakes forward momentum and increases injury risk. Use a metronome app to train cadence.',
      },
      {
        heading: 'Forward Lean',
        body: 'Lean forward from the ankles, not the waist. Imagine a plank from head to heel tilted slightly forward. This lets gravity assist your forward momentum rather than fighting it.',
      },
      {
        heading: 'Arm Drive',
        body: 'Arms drive forward momentum. Bend elbows at 90°, swing front-to-back (not across your body). Loose hands — imagine holding a potato chip without breaking it.',
      },
      {
        heading: 'Foot Strike',
        body: 'Midfoot or forefoot striking under your centre of mass is biomechanically optimal. Heel striking is fine if it occurs under your hips, not out in front of them. Focus on where your foot lands, not how it lands.',
      },
      {
        heading: 'Head and Gaze',
        body: 'Look 15–20 meters ahead, not down at your feet. A forward-looking gaze keeps your spine neutral and your airway open. Tension in your jaw and neck wastes energy — consciously relax them.',
      },
    ],
  },
  {
    id: 'gear',
    label: 'GEAR & SHOES',
    icon: 'layers-outline',
    tips: [
      {
        heading: 'Shoe Rotation Extends Life',
        body: 'Rotating two or three pairs gives foam time to decompress between runs. A shoe rotated with another lasts up to 20% longer and provides better cushioning per run than a single shoe used daily.',
      },
      {
        heading: 'Replace at 500–700km',
        body: 'Midsole foam degrades invisibly — the outer sole often looks fine while cushioning is gone. Track mileage and replace training shoes at 500–700km, racing flats at 300–400km.',
      },
      {
        heading: 'Fit: Thumb Space at the Toe',
        body: 'Feet swell during long runs. You need roughly a thumb\'s width between your longest toe and the end of the shoe. Too tight = black toenails, too loose = blistering.',
      },
      {
        heading: 'Heel Drop Matters',
        body: 'Higher drop (10–14mm) suits heel strikers and those transitioning from traditional shoes. Lower drop (0–8mm) encourages midfoot striking but requires gradual adaptation. Switching abruptly causes Achilles issues.',
      },
      {
        heading: 'Technical Socks Are Not Optional',
        body: 'Moisture-wicking, seamless running socks prevent blisters and hotspots. Avoid cotton — it holds moisture and causes friction. Merino wool is ideal for longer efforts.',
      },
    ],
  },
  {
    id: 'race',
    label: 'RACE PREP',
    icon: 'flag-outline',
    tips: [
      {
        heading: 'The Taper',
        body: 'In the final 2–3 weeks before a race, reduce mileage by 20–40% while maintaining intensity. You\'re not losing fitness — you\'re allowing cumulative fatigue to dissipate so your peak fitness can express itself.',
      },
      {
        heading: 'Nothing New on Race Day',
        body: 'Never wear new shoes, new socks, new clothing, or eat new food on race day. Everything should have been tested in training. Even a minor friction point becomes unbearable at mile 18.',
      },
      {
        heading: 'Pacing Strategy',
        body: 'Even splits or slightly negative splits (second half faster) produce the best results. Starting 5–10 seconds per km slower than goal pace for the first third is not conservative — it\'s strategic.',
      },
      {
        heading: 'Carbohydrate Loading',
        body: 'For races over 90 minutes, increase carb intake to 8–10g per kg body weight in the 48 hours pre-race. Reduce fibre intake the day before to avoid GI issues mid-race.',
      },
      {
        heading: 'Warm-Up Protocol',
        body: '10–15 minutes easy jogging + dynamic drills (leg swings, high knees, A-skips) prepares the neuromuscular system. For 5K and 10K races, include 2–3 strides at race pace 10 minutes before the gun.',
      },
    ],
  },
];

export default function RunningCoach() {
  const [openCategory, setOpenCategory] = useState<string | null>('training');
  const [openTip, setOpenTip] = useState<string | null>(null);

  const toggleCategory = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenCategory(prev => (prev === id ? null : id));
    setOpenTip(null);
  };

  const toggleTip = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenTip(prev => (prev === key ? null : key));
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.intro}>
        Evidence-based protocols for every phase of your training.
      </Text>

      {KNOWLEDGE_BASE.map((cat) => {
        const isOpen = openCategory === cat.id;
        return (
          <View key={cat.id} style={styles.catBlock}>
            {/* Category header */}
            <TouchableOpacity
              onPress={() => toggleCategory(cat.id)}
              style={[styles.catHeader, isOpen && styles.catHeaderOpen]}
              activeOpacity={0.85}
            >
              <View style={styles.catLeft}>
                <Ionicons
                  name={cat.icon}
                  size={16}
                  color={isOpen ? '#F4F1EA' : '#0A0A0A'}
                />
                <Text style={[styles.catLabel, isOpen && styles.catLabelOpen]}>
                  {cat.label}
                </Text>
              </View>
              <Text style={[styles.catChevron, isOpen && styles.catChevronOpen]}>
                {isOpen ? '−' : '+'}
              </Text>
            </TouchableOpacity>

            {/* Tips list */}
            {isOpen && (
              <View style={styles.tipsBlock}>
                {cat.tips.map((tip, i) => {
                  const tipKey = `${cat.id}-${i}`;
                  const tipOpen = openTip === tipKey;
                  return (
                    <View key={tipKey}>
                      <TouchableOpacity
                        onPress={() => toggleTip(tipKey)}
                        style={styles.tipRow}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.tipIndex}>
                          /{String(i + 1).padStart(2, '0')}/
                        </Text>
                        <Text style={styles.tipHeading}>{tip.heading}</Text>
                        <Text style={styles.tipChevron}>{tipOpen ? 'CLOSE' : 'OPEN'}</Text>
                      </TouchableOpacity>

                      {tipOpen && (
                        <View style={styles.tipBody}>
                          <Text style={styles.tipBodyText}>{tip.body}</Text>
                        </View>
                      )}

                      {i < cat.tips.length - 1 && <View style={styles.tipDivider} />}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          // STRIDE PROTOCOL · RUNNING INTELLIGENCE v1.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F4F1EA' },
  content: { padding: 16, paddingBottom: 40 },
  intro: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: 'rgba(10,10,10,0.5)',
    lineHeight: 18,
    letterSpacing: 0.3,
    marginBottom: 20,
  },
  catBlock: {
    marginBottom: 12,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#0A0A0A',
    borderRadius: 2,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F4F1EA',
  },
  catHeaderOpen: {
    backgroundColor: '#0A0A0A',
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: '700',
    color: '#0A0A0A',
    letterSpacing: 2,
  },
  catLabelOpen: {
    color: '#F4F1EA',
  },
  catChevron: {
    fontFamily: 'SpaceMono',
    fontSize: 20,
    color: '#0A0A0A',
    fontWeight: '700',
    lineHeight: 22,
  },
  catChevronOpen: {
    color: '#FF3D00',
  },
  tipsBlock: {
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: '#0A0A0A',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    overflow: 'hidden',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  tipIndex: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(10,10,10,0.35)',
    letterSpacing: 1,
    width: 32,
  },
  tipHeading: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0A0A0A',
    letterSpacing: -0.2,
  },
  tipChevron: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: '#FF3D00',
    fontWeight: '700',
  },
  tipBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  tipBodyText: {
    fontSize: 14,
    color: 'rgba(10,10,10,0.7)',
    lineHeight: 22,
  },
  tipDivider: {
    height: 1,
    backgroundColor: 'rgba(10,10,10,0.08)',
    marginHorizontal: 16,
  },
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#0A0A0A',
  },
  footerText: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(10,10,10,0.3)',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});
