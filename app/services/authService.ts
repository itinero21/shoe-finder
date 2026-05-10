/**
 * Auth service — wraps Supabase auth calls.
 * All functions return a typed result so callers never need
 * to handle raw Supabase error objects.
 */
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

export interface AuthResult {
  user?: User;
  session?: Session;
  error?: string;
}

// Deep-link the confirmation email back into the app
const EMAIL_REDIRECT = 'shoefinder://auth/confirm';

// ── Sign up ───────────────────────────────────────────────────
export async function signUp(email: string, password: string, displayName?: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      emailRedirectTo: EMAIL_REDIRECT,
      data: { display_name: displayName ?? email.split('@')[0] },
    },
  });
  if (error) return { error: error.message };
  return { user: data.user ?? undefined, session: data.session ?? undefined };
}

// ── Sign in ───────────────────────────────────────────────────
export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) return { error: error.message };
  return { user: data.user, session: data.session };
}

// ── Record terms + privacy consent ───────────────────────────
export const TERMS_VERSION   = '1.0';
export const PRIVACY_VERSION = '1.0';

export async function recordConsent(platform: 'ios' | 'android' | 'web' = 'web'): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return;
  await supabase.from('user_consents').insert({
    user_id:         userId,
    terms_version:   TERMS_VERSION,
    privacy_version: PRIVACY_VERSION,
    platform,
  });
}

// ── Sign out ──────────────────────────────────────────────────
export async function signOut(): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signOut();
  return error ? { error: error.message } : {};
}

// ── Get current session ───────────────────────────────────────
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ── Get current user ──────────────────────────────────────────
export async function getUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// ── Reset password ────────────────────────────────────────────
export async function resetPassword(email: string): Promise<{ error?: string }> {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: 'shoefinder://reset-password' }
  );
  return error ? { error: error.message } : {};
}

// ── Listen to auth state changes ──────────────────────────────
export function onAuthStateChange(callback: (session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return data.subscription;
}
