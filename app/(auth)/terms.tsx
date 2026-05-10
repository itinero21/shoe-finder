/**
 * Terms of Service + Privacy Policy screen.
 * Accessible from the sign-up flow and from app settings.
 * Two tabs: Terms | Privacy
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Platform, Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SUPPORT_EMAIL } from '../constants';

const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const MONO   = 'SpaceMono';

const UPDATED = 'May 7, 2026';

type Tab = 'terms' | 'privacy';

// ─── Section component ─────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <Text style={s.para}>{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.bulletRow}>
      <Text style={s.bulletDot}>—</Text>
      <Text style={s.bulletText}>{children}</Text>
    </View>
  );
}

// ─── Terms of Service content ──────────────────────────────────
function TermsContent() {
  return (
    <>
      <Text style={s.meta}>Last updated: {UPDATED}{'\n'}Effective: {UPDATED}</Text>

      <Section title="1. Agreement">
        <P>By creating an account or using the Stride application ("App"), you confirm that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, you must not use the App.</P>
      </Section>

      <Section title="2. What Stride Is">
        <P>Stride is a running shoe management application designed to help athletes track footwear, manage training rotations, log runs, and optimize performance based on personal data you provide.</P>
        <P>Stride is not a medical device, healthcare provider, licensed physiotherapist, sports medicine clinic, or fitness professional. Nothing in the App constitutes medical advice, clinical diagnosis, or prescribed treatment of any kind.</P>
      </Section>

      <Section title="3. Health & Injury Disclaimer">
        <P>THE FOLLOWING SECTION IS IMPORTANT. PLEASE READ IT CAREFULLY.</P>
        <P>The injury guidance, recovery phase suggestions, shoe recommendations for injured runners, and coaching insights provided by Stride are based on general athletic principles and published sports science literature. They are provided for informational and motivational purposes only.</P>
        <P>These features are NOT a substitute for professional medical advice. You must:</P>
        <Bullet>Consult a licensed physician, physiotherapist, or sports medicine professional before making any training decisions when managing an existing injury or medical condition.</Bullet>
        <Bullet>Stop all activity immediately if you experience acute pain, chest pain, difficulty breathing, dizziness, or any unusual symptom.</Bullet>
        <Bullet>Not rely solely on the App when determining whether it is safe to run.</Bullet>
        <P>By using any injury-related, coaching, or health-adjacent feature of the App, you acknowledge and agree that Stride and its developers bear no responsibility, legal liability, or financial obligation for any injury, aggravation of an existing condition, adverse health outcome, or physical harm arising from or related to reliance on the App's suggestions, recommendations, or content.</P>
      </Section>

      <Section title="4. Eligibility & Accounts">
        <Bullet>You must be at least 13 years of age to use the App (16 years in the European Economic Area or other jurisdictions with higher minimum age requirements).</Bullet>
        <Bullet>You are responsible for maintaining the confidentiality of your account credentials. Do not share your password with anyone.</Bullet>
        <Bullet>You must provide accurate, current, and complete registration information.</Bullet>
        <Bullet>You may not transfer your account to another person.</Bullet>
        <Bullet>You must notify us immediately if you become aware of unauthorized access to your account.</Bullet>
      </Section>

      <Section title="5. Acceptable Use">
        <P>You agree not to:</P>
        <Bullet>Use the App for any unlawful purpose or in violation of any applicable laws or regulations.</Bullet>
        <Bullet>Attempt to gain unauthorized access to our systems, databases, or other users' accounts.</Bullet>
        <Bullet>Reverse engineer, decompile, disassemble, or otherwise attempt to extract the source code of the App.</Bullet>
        <Bullet>Use automated scripts, bots, crawlers, or similar tools to extract data from the App.</Bullet>
        <Bullet>Upload, transmit, or introduce any malicious code, virus, or harmful component.</Bullet>
        <Bullet>Impersonate any person or entity, or misrepresent your affiliation with any person or entity.</Bullet>
        <Bullet>Use the App in any manner that could damage, disable, or impair its functionality or availability.</Bullet>
      </Section>

      <Section title="6. Third-Party Integrations">
        <P>Stride integrates with third-party services including Strava, Inc. Your use of any third-party integration is subject exclusively to that service's own terms, privacy policy, and practices. Stride is not responsible for, and has no control over, the data practices of third-party services you choose to connect.</P>
        <P>Disconnecting a third-party integration within the App revokes Stride's access to that service but does not affect any data already stored in the third-party's systems.</P>
      </Section>

      <Section title="7. Intellectual Property">
        <P>The App, its underlying algorithms, design, code, content, trademarks, and all related intellectual property are owned by the developer of Stride. You are granted a limited, non-exclusive, non-transferable, revocable license to use the App for personal, non-commercial purposes in accordance with these Terms.</P>
        <P>You may not reproduce, distribute, sublicense, sell, or create derivative works from the App or its content without express written permission.</P>
        <P>By submitting content to the App (such as run notes or shoe names), you grant us a worldwide, royalty-free license to use that content solely to provide the App's services to you.</P>
      </Section>

      <Section title="8. Disclaimer of Warranties">
        <P>THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, AND NON-INFRINGEMENT.</P>
        <P>WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. WE DO NOT WARRANT THE ACCURACY OR COMPLETENESS OF ANY SHOE RECOMMENDATIONS, TRAINING SUGGESTIONS, OR COACHING CONTENT.</P>
      </Section>

      <Section title="9. Limitation of Liability">
        <P>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, STRIDE AND ITS DEVELOPERS, OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:</P>
        <Bullet>Physical injury or bodily harm</Bullet>
        <Bullet>Loss of data or corruption of data</Bullet>
        <Bullet>Loss of revenue, profits, or business opportunity</Bullet>
        <Bullet>Property damage</Bullet>
        <P>ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE APP, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</P>
        <P>IN NO EVENT SHALL OUR TOTAL CUMULATIVE LIABILITY TO YOU EXCEED THE GREATER OF (A) THE TOTAL AMOUNT YOU PAID FOR THE APP IN THE TWELVE MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED US DOLLARS (USD $100).</P>
      </Section>

      <Section title="10. Indemnification">
        <P>You agree to defend, indemnify, and hold harmless Stride and its developers from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising out of or relating to: (a) your use of or access to the App; (b) your violation of these Terms; or (c) your violation of any rights of any third party.</P>
      </Section>

      <Section title="11. Termination">
        <P>We reserve the right to suspend or permanently terminate your account, without notice or liability, for any conduct that we determine, in our sole discretion, violates these Terms or is harmful to other users, us, or third parties.</P>
        <P>You may delete your account at any time from within the App settings. Upon account deletion, your right to use the App ceases immediately and your data will be permanently deleted within 30 days.</P>
      </Section>

      <Section title="12. Changes to These Terms">
        <P>We may update these Terms from time to time. When material changes are made, we will notify you through the App and update the "Last updated" date above. Your continued use of the App after the effective date of updated Terms constitutes your acceptance of the changes.</P>
        <P>If you do not agree with updated Terms, you must stop using the App and may delete your account.</P>
      </Section>

      <Section title="13. Governing Law">
        <P>These Terms are governed by and construed in accordance with applicable law. Any dispute arising from these Terms shall first be attempted to be resolved through good-faith negotiation. If resolution cannot be reached, disputes shall be submitted to binding individual arbitration — not class action — to the extent permitted by law.</P>
        <P>Nothing in this section limits your statutory rights as a consumer in your jurisdiction.</P>
      </Section>

      <Section title="14. General">
        <P>If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect. Our failure to enforce any right or provision of these Terms shall not be considered a waiver of those rights.</P>
        <P>These Terms, together with the Privacy Policy, constitute the entire agreement between you and Stride regarding the App.</P>
      </Section>

      <Section title="15. Contact">
        <P>For questions, concerns, or legal inquiries regarding these Terms, email us at{' '}
          <Text style={s.link} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
            {SUPPORT_EMAIL}
          </Text>
          . We respond to all legitimate inquiries within a reasonable timeframe.
        </P>
      </Section>
    </>
  );
}

// ─── Privacy Policy content ────────────────────────────────────
function PrivacyContent() {
  return (
    <>
      <Text style={s.meta}>Last updated: {UPDATED}</Text>

      <P>This Privacy Policy explains what information Stride collects, how we use it, how we protect it, and your rights regarding your data. We believe in plain language — no legalese traps.</P>

      <Section title="1. Information We Collect">
        <Text style={s.subHeading}>Account Information</Text>
        <Bullet>Email address</Bullet>
        <Bullet>Password (we never see it — it is hashed using bcrypt before storage)</Bullet>
        <Bullet>Optional display name</Bullet>

        <Text style={s.subHeading}>Fitness & Training Data</Text>
        <Bullet>Running activities you log: distance, duration, date, terrain, perceived effort, personal notes</Bullet>
        <Bullet>Shoe inventory and per-shoe mileage</Bullet>
        <Bullet>Race events and goal times you enter</Bullet>
        <Bullet>XP, level, and achievement progress</Bullet>

        <Text style={s.subHeading}>Health Information You Voluntarily Provide</Text>
        <Bullet>Injury type and phase (if you choose to use the injury tracking feature)</Bullet>
        <Bullet>Foot arch type and gait information (from the optional gait quiz)</Bullet>
        <P>This data is used solely to generate personalized shoe recommendations and is never sold, shared with advertisers, or disclosed to third parties.</P>

        <Text style={s.subHeading}>Third-Party Data (Strava)</Text>
        <Bullet>If you connect Strava, we receive only the activity data you explicitly authorize</Bullet>
        <Bullet>We do not access your Strava profile, social connections, kudos, or segment data</Bullet>
        <Bullet>You can disconnect Strava at any time from within the App</Bullet>

        <Text style={s.subHeading}>Technical Data</Text>
        <Bullet>Device operating system and version (for compatibility)</Bullet>
        <Bullet>App version (for bug tracking)</Bullet>
        <Bullet>We do not collect advertising identifiers, precise GPS location, or biometric data</Bullet>
      </Section>

      <Section title="2. How We Use Your Information">
        <Bullet>Provide, personalize, and improve the App's features</Bullet>
        <Bullet>Sync your data across your devices when you are signed in</Bullet>
        <Bullet>Calculate shoe mileage, rotation health scores, and performance metrics</Bullet>
        <Bullet>Generate AI-powered shoe recommendations and coaching insights</Bullet>
        <Bullet>Maintain a legal record of your consent to these policies</Bullet>
        <Bullet>Respond to your support requests</Bullet>
        <P>We do not use your data for advertising, profiling for marketing purposes, or selling to data brokers. We do not build advertising profiles from your health or fitness data.</P>
      </Section>

      <Section title="3. How We Protect Your Data">
        <P>We take security seriously. Here is exactly what is in place:</P>
        <Bullet><Text style={s.bold}>Row Level Security (RLS):</Text> Every table in our database enforces database-level access policies. Even with a valid authentication token, it is cryptographically impossible for one user to read, write, or delete another user's data. This is enforced at the database engine level, not just application code.</Bullet>
        <Bullet><Text style={s.bold}>Encryption in transit:</Text> All data sent between the App and our servers is encrypted using TLS (HTTPS).</Bullet>
        <Bullet><Text style={s.bold}>Encrypted at rest:</Text> Authentication tokens are stored in your device's hardware-backed encrypted storage — iOS Keychain or Android Keystore. They are never written to unencrypted local storage.</Bullet>
        <Bullet><Text style={s.bold}>Password hashing:</Text> Passwords are hashed with bcrypt before storage. We have no mechanism to retrieve your original password.</Bullet>
        <Bullet><Text style={s.bold}>Immutable consent log:</Text> Your agreement to these policies is recorded with a timestamp in a database table that cannot be updated or deleted.</Bullet>
        <Bullet><Text style={s.bold}>No admin backdoor:</Text> No Stride employee or developer can read your personal data without bypassing the same RLS policies that protect you from other users.</Bullet>
      </Section>

      <Section title="4. Data Sharing & Disclosure">
        <P>We do not sell your personal data. We do not rent it. We do not trade it.</P>
        <P>We may disclose your data only in these limited circumstances:</P>
        <Bullet><Text style={s.bold}>Strava:</Text> Only if you actively connect your Strava account, and only the data scope you explicitly authorize.</Bullet>
        <Bullet><Text style={s.bold}>Legal obligation:</Text> If required by law, court order, or governmental authority to protect the rights, property, or safety of users or the public.</Bullet>
        <Bullet><Text style={s.bold}>Business transfer:</Text> In the event of a merger, acquisition, or sale of all or substantially all of our assets, your data may be transferred — but only under commitments of confidentiality and the same privacy protections described here.</Bullet>
      </Section>

      <Section title="5. AI Features & Data Processing">
        <P>Some features of the App use AI models to generate recommendations and coaching responses. When these features are used:</P>
        <Bullet>Only the minimum necessary data (e.g., your quiz answers, shoe attributes) is sent to generate a response</Bullet>
        <Bullet>Data sent to AI APIs is transmitted over encrypted connections</Bullet>
        <Bullet>We do not use your personal data to train AI models without your explicit consent</Bullet>
        <Bullet>AI-generated advice is not medical advice. See the Terms of Service health disclaimer.</Bullet>
      </Section>

      <Section title="6. Your Rights">
        <P>Depending on where you live, you may have the following rights:</P>
        <Bullet><Text style={s.bold}>Access:</Text> Request a copy of the personal data we hold about you</Bullet>
        <Bullet><Text style={s.bold}>Correction:</Text> Request correction of inaccurate data</Bullet>
        <Bullet><Text style={s.bold}>Deletion:</Text> Request permanent deletion of your account and all associated data (right to be forgotten)</Bullet>
        <Bullet><Text style={s.bold}>Portability:</Text> Request your data in a portable format</Bullet>
        <Bullet><Text style={s.bold}>Objection:</Text> Object to certain processing of your data</Bullet>
        <Bullet><Text style={s.bold}>Withdraw consent:</Text> Withdraw consent at any time by deleting your account</Bullet>
        <P>To exercise any of these rights, delete your account from within the App (which triggers immediate data deletion) or contact us through the App Store listing.</P>
      </Section>

      <Section title="7. Data Retention">
        <P>We retain your data for as long as your account remains active. When you delete your account:</P>
        <Bullet>Your profile, runs, arsenal, and all personal data are permanently deleted from our active database within 30 days</Bullet>
        <Bullet>Consent records are retained for a legally required period to demonstrate compliance, then deleted</Bullet>
        <Bullet>Backups are purged on their normal rotation cycle (within 90 days)</Bullet>
      </Section>

      <Section title="8. Children's Privacy">
        <P>The App is not directed to children under the age of 13 (or 16 in the European Economic Area). We do not knowingly collect personal information from children below these ages. If you are a parent or guardian and believe your child has provided us with personal data, please contact us immediately so we can delete it.</P>
      </Section>

      <Section title="9. International Users">
        <P>If you access the App from outside the country in which our servers are located, your data may be transferred across international borders. By using the App, you consent to such transfers. We ensure that such transfers comply with applicable data protection laws.</P>
        <P>If you are in the European Economic Area (EEA), United Kingdom, or Switzerland, you have additional rights under GDPR. Our legal basis for processing your data is your explicit consent (provided when you create your account and accept these policies) and the performance of our contract with you.</P>
      </Section>

      <Section title="10. Changes to This Policy">
        <P>We will notify you of material changes to this Privacy Policy through the App before they take effect. The "Last updated" date at the top of this document will always reflect when changes were made. Continued use of the App after changes take effect constitutes your acceptance of the updated Policy.</P>
      </Section>

      <Section title="11. Contact">
        <P>For privacy-related questions, data requests, or to report a potential security vulnerability, email us at{' '}
          <Text style={s.link} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
            {SUPPORT_EMAIL}
          </Text>
          . We take all security reports seriously and will acknowledge receipt within 72 hours.
        </P>
      </Section>
    </>
  );
}

// ─── Main screen ───────────────────────────────────────────────
export default function TermsScreen() {
  const [tab, setTab] = useState<Tab>('terms');
  const canGoBack = router.canGoBack();

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        {canGoBack && (
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={20} color={PAPER} />
          </TouchableOpacity>
        )}
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>LEGAL</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab toggle */}
      <View style={s.tabBar}>
        <TouchableOpacity
          style={[s.tabBtn, tab === 'terms' && s.tabBtnActive]}
          onPress={() => setTab('terms')}
          activeOpacity={0.8}
        >
          <Text style={[s.tabText, tab === 'terms' && s.tabTextActive]}>TERMS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, tab === 'privacy' && s.tabBtnActive]}
          onPress={() => setTab('privacy')}
          activeOpacity={0.8}
        >
          <Text style={[s.tabText, tab === 'privacy' && s.tabTextActive]}>PRIVACY</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        key={tab} // remount scroll when tab changes so position resets
      >
        <Text style={s.docTitle}>
          {tab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
        </Text>
        {tab === 'terms' ? <TermsContent /> : <PrivacyContent />}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: INK },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(244,241,234,0.08)',
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontFamily: MONO, fontSize: 10, color: ACCENT,
    letterSpacing: 3, fontWeight: '700',
  },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(244,241,234,0.1)',
  },
  tabBtn: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: ACCENT },
  tabText: { fontFamily: MONO, fontSize: 10, color: 'rgba(244,241,234,0.35)', letterSpacing: 2 },
  tabTextActive: { color: PAPER },

  scroll: { flex: 1 },
  scrollContent: { padding: 24 },

  docTitle: {
    fontSize: 28, fontWeight: '900', color: PAPER,
    letterSpacing: -1, marginBottom: 4,
  },
  meta: {
    fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.35)',
    letterSpacing: 0.5, marginBottom: 28, lineHeight: 16,
  },

  section: { marginBottom: 28 },
  sectionTitle: {
    fontFamily: MONO, fontSize: 10, color: ACCENT,
    letterSpacing: 1.5, marginBottom: 12, fontWeight: '700',
  },
  subHeading: {
    fontFamily: MONO, fontSize: 9, color: 'rgba(244,241,234,0.5)',
    letterSpacing: 1, marginTop: 14, marginBottom: 8,
  },
  para: {
    fontFamily: MONO, fontSize: 11, color: 'rgba(244,241,234,0.7)',
    lineHeight: 20, marginBottom: 10,
  },
  bold: { color: PAPER, fontWeight: '700' },

  link: { color: ACCENT, textDecorationLine: 'underline' },

  bulletRow: { flexDirection: 'row', marginBottom: 8, paddingRight: 8 },
  bulletDot: { fontFamily: MONO, fontSize: 11, color: ACCENT, marginRight: 10, marginTop: 1 },
  bulletText: {
    flex: 1, fontFamily: MONO, fontSize: 11,
    color: 'rgba(244,241,234,0.7)', lineHeight: 20,
  },
});
