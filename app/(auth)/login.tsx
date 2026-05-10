/**
 * Login / Sign-up / Forgot-password screen.
 * Clean, professional design. No third-party branding.
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signIn, signUp, resetPassword, recordConsent } from '../services/authService';

// ─── Design tokens ─────────────────────────────────────────────
const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const LIME   = '#D4FF00';
const DIM    = 'rgba(10,10,10,0.4)';
const MONO   = 'SpaceMono';

type Screen = 'login' | 'signup' | 'forgot';

// ─── Password visibility toggle input ─────────────────────────
function PasswordInput({
  value, onChange, placeholder, autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: 'new-password' | 'current-password';
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={DIM}
        secureTextEntry={!visible}
        autoComplete={autoComplete}
        autoCapitalize="none"
      />
      <Pressable style={s.eyeBtn} onPress={() => setVisible(v => !v)} hitSlop={8}>
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={18} color={DIM} />
      </Pressable>
    </View>
  );
}

// ─── Checkbox component ────────────────────────────────────────
function Checkbox({ checked, onPress }: { checked: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.checkboxHit} hitSlop={8}>
      <View style={[s.checkbox, checked && s.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={12} color={PAPER} />}
      </View>
    </Pressable>
  );
}

// ─── Main screen ───────────────────────────────────────────────
export default function AuthScreen() {
  const [screen, setScreen]       = useState<Screen>('login');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [name, setName]           = useState('');
  const [agreed, setAgreed]       = useState(false);
  const [loading, setLoading]     = useState(false);

  const clear = () => { setEmail(''); setPassword(''); setName(''); setAgreed(false); };
  const go    = (next: Screen) => { clear(); setScreen(next); };

  // ── Login ──────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Enter your email and password to continue.');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert('Sign in failed', friendlyError(error));
      return;
    }
    router.replace('/(tabs)/scan');
  };

  // ── Sign up ────────────────────────────────────────────────
  const handleSignup = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Enter your email and a password to continue.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    if (!agreed) {
      Alert.alert('Terms required', 'You must agree to the Terms of Service and Privacy Policy to create an account.');
      return;
    }
    setLoading(true);
    const { user, error } = await signUp(email.trim(), password, name.trim() || undefined);
    if (error) {
      setLoading(false);
      Alert.alert('Sign up failed', friendlyError(error));
      return;
    }
    // Record legal consent in the database
    if (user) {
      await recordConsent(Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web');
    }
    setLoading(false);
    Alert.alert(
      'Check your email',
      `We sent a confirmation link to ${email.trim()}. Tap it to verify your address, then sign in.`,
      [{ text: 'Got it', onPress: () => go('login') }]
    );
  };

  // ── Forgot password ────────────────────────────────────────
  const handleForgot = async () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Enter the email address on your account.');
      return;
    }
    setLoading(true);
    const { error } = await resetPassword(email.trim());
    setLoading(false);
    if (error) {
      Alert.alert('Error', friendlyError(error));
      return;
    }
    Alert.alert('Email sent', 'Check your inbox for a password reset link.', [
      { text: 'Back to sign in', onPress: () => go('login') },
    ]);
  };

  const primaryAction =
    screen === 'login' ? handleLogin :
    screen === 'signup' ? handleSignup :
    handleForgot;

  const primaryLabel =
    screen === 'login' ? 'SIGN IN' :
    screen === 'signup' ? 'CREATE ACCOUNT' :
    'SEND RESET LINK';

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Wordmark ─────────────────────────────────── */}
          <View style={s.brand}>
            <View style={s.logoMark}>
              <Text style={s.logoLetter}>S</Text>
            </View>
            <Text style={s.wordmark}>STRIDE</Text>
            <Text style={s.tagline}>RUN SMARTER.</Text>
          </View>

          {/* ── Screen heading ───────────────────────────── */}
          <View style={s.heading}>
            <Text style={s.headingLabel}>
              {screen === 'login' ? 'SIGN IN' : screen === 'signup' ? 'CREATE ACCOUNT' : 'RESET PASSWORD'}
            </Text>
            <Text style={s.headingSub}>
              {screen === 'login'
                ? 'Welcome back. Your data is waiting.'
                : screen === 'signup'
                ? 'Join Stride. Track your shoes, optimize your runs.'
                : 'Enter your email and we\'ll send a reset link.'}
            </Text>
          </View>

          {/* ── Form ─────────────────────────────────────── */}
          <View style={s.form}>

            {/* Name — signup only */}
            {screen === 'signup' && (
              <View style={s.field}>
                <Text style={s.label}>NAME  <Text style={s.optional}>(optional)</Text></Text>
                <TextInput
                  style={s.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="What should we call you?"
                  placeholderTextColor={DIM}
                  autoCapitalize="words"
                  autoComplete="name"
                  returnKeyType="next"
                />
              </View>
            )}

            {/* Email */}
            <View style={s.field}>
              <Text style={s.label}>EMAIL</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={DIM}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType={screen === 'forgot' ? 'send' : 'next'}
              />
            </View>

            {/* Password — login + signup */}
            {screen !== 'forgot' && (
              <View style={s.field}>
                <Text style={s.label}>PASSWORD</Text>
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  placeholder={screen === 'signup' ? 'Minimum 8 characters' : '••••••••'}
                  autoComplete={screen === 'signup' ? 'new-password' : 'current-password'}
                />
                {screen === 'login' && (
                  <TouchableOpacity onPress={() => go('forgot')} style={s.forgotLink} hitSlop={8}>
                    <Text style={s.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Terms checkbox — signup only */}
            {screen === 'signup' && (
              <View style={s.termsRow}>
                <Checkbox checked={agreed} onPress={() => setAgreed(a => !a)} />
                <View style={s.termsTextWrap}>
                  <Text style={s.termsBase}>I have read and agree to the{' '}
                    <Text
                      style={s.termsLink}
                      onPress={() => router.push('/(auth)/terms')}
                    >Terms of Service</Text>
                    {' '}and{' '}
                    <Text
                      style={s.termsLink}
                      onPress={() => { router.push({ pathname: '/(auth)/terms' }); }}
                    >Privacy Policy</Text>
                    . I understand that health-related features do not constitute medical advice.
                  </Text>
                </View>
              </View>
            )}

            {/* Primary button */}
            <TouchableOpacity
              style={[
                s.primaryBtn,
                (loading || (screen === 'signup' && !agreed)) && s.primaryBtnDisabled,
              ]}
              onPress={primaryAction}
              disabled={loading || (screen === 'signup' && !agreed)}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={PAPER} size="small" />
                : <Text style={s.primaryBtnText}>{primaryLabel}</Text>
              }
            </TouchableOpacity>

          </View>

          {/* ── Footer links ─────────────────────────────── */}
          <View style={s.footer}>
            <View style={s.divider} />
            {screen === 'login' && (
              <TouchableOpacity style={s.switchBtn} onPress={() => go('signup')} activeOpacity={0.7}>
                <Text style={s.switchText}>Don't have an account?  </Text>
                <Text style={[s.switchText, s.switchTextBold]}>SIGN UP</Text>
              </TouchableOpacity>
            )}
            {screen === 'signup' && (
              <TouchableOpacity style={s.switchBtn} onPress={() => go('login')} activeOpacity={0.7}>
                <Text style={s.switchText}>Already have an account?  </Text>
                <Text style={[s.switchText, s.switchTextBold]}>SIGN IN</Text>
              </TouchableOpacity>
            )}
            {screen === 'forgot' && (
              <TouchableOpacity style={s.switchBtn} onPress={() => go('login')} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={12} color={DIM} style={{ marginRight: 6 }} />
                <Text style={[s.switchText, s.switchTextBold]}>BACK TO SIGN IN</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Legal footnote (login screen) ────────────── */}
          {screen === 'login' && (
            <View style={s.legalNote}>
              <Text style={s.legalNoteText}>
                By signing in, you confirm you agree to our{' '}
                <Text style={s.legalNoteLink} onPress={() => router.push('/(auth)/terms')}>
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text style={s.legalNoteLink} onPress={() => router.push('/(auth)/terms')}>
                  Privacy Policy
                </Text>
                .
              </Text>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Human-friendly error messages ────────────────────────────
function friendlyError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('invalid login') || lower.includes('invalid credentials'))
    return 'Incorrect email or password. Please try again.';
  if (lower.includes('email not confirmed'))
    return 'Please confirm your email address before signing in.';
  if (lower.includes('already registered') || lower.includes('already exists'))
    return 'An account with this email already exists. Try signing in instead.';
  if (lower.includes('network') || lower.includes('fetch'))
    return 'Network error. Check your connection and try again.';
  if (lower.includes('rate limit'))
    return 'Too many attempts. Please wait a moment and try again.';
  if (lower.includes('weak password') || lower.includes('password should'))
    return 'Choose a stronger password (at least 8 characters, mix letters and numbers).';
  return raw;
}

// ─── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: PAPER },
  scroll: { padding: 28, paddingBottom: 48 },

  // Brand
  brand: { alignItems: 'center', marginTop: 24, marginBottom: 40 },
  logoMark: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: INK, alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: INK, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 6,
  },
  logoLetter: { fontSize: 28, fontWeight: '900', color: ACCENT, letterSpacing: -1 },
  wordmark: {
    fontFamily: MONO, fontSize: 22, fontWeight: '900',
    color: INK, letterSpacing: 6, marginBottom: 4,
  },
  tagline: {
    fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.35)',
    letterSpacing: 4,
  },

  // Heading
  heading: { marginBottom: 32 },
  headingLabel: {
    fontFamily: MONO, fontSize: 10, color: ACCENT,
    letterSpacing: 3, fontWeight: '700', marginBottom: 8,
  },
  headingSub: {
    fontFamily: MONO, fontSize: 12, color: 'rgba(10,10,10,0.5)',
    lineHeight: 20,
  },

  // Form
  form: { gap: 20, marginBottom: 32 },
  field: { gap: 8 },
  label: { fontFamily: MONO, fontSize: 9, color: DIM, letterSpacing: 2 },
  optional: { color: 'rgba(10,10,10,0.25)', fontWeight: '400' },
  input: {
    borderWidth: 1.5, borderColor: 'rgba(10,10,10,0.2)',
    backgroundColor: PAPER, paddingHorizontal: 16, paddingVertical: 15,
    fontFamily: MONO, fontSize: 13, color: INK, borderRadius: 6,
  },

  // Password toggle
  eyeBtn: { position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' },

  // Forgot link
  forgotLink: { alignSelf: 'flex-end', marginTop: 4 },
  forgotText: { fontFamily: MONO, fontSize: 9, color: DIM, letterSpacing: 1 },

  // Terms checkbox row
  termsRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  checkboxHit: { paddingTop: 2 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 1.5, borderColor: 'rgba(10,10,10,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: INK, borderColor: INK },
  termsTextWrap: { flex: 1 },
  termsBase: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.55)', lineHeight: 18 },
  termsLink: { color: INK, textDecorationLine: 'underline', fontWeight: '700' },

  // Primary button
  primaryBtn: {
    backgroundColor: INK, paddingVertical: 18,
    alignItems: 'center', borderRadius: 6,
    marginTop: 4,
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: {
    fontFamily: MONO, fontSize: 12, fontWeight: '700',
    color: PAPER, letterSpacing: 3,
  },

  // Footer
  footer: { alignItems: 'center', gap: 16 },
  divider: { height: 1, backgroundColor: 'rgba(10,10,10,0.08)', width: '100%' },
  switchBtn: { flexDirection: 'row', alignItems: 'center' },
  switchText: { fontFamily: MONO, fontSize: 10, color: DIM, letterSpacing: 0.5 },
  switchTextBold: { color: INK, fontWeight: '700' },

  // Legal footnote
  legalNote: { marginTop: 28, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(10,10,10,0.06)' },
  legalNoteText: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.3)', lineHeight: 16, textAlign: 'center' },
  legalNoteLink: { color: 'rgba(10,10,10,0.5)', textDecorationLine: 'underline' },
});
