/**
 * AuthContext — app-wide session state.
 * Wrap the root layout with <AuthProvider>.
 * Any component can call useAuth() to get the current user/session
 * and know whether auth is still loading.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  session:  Session | null;
  user:     User | null;
  loading:  boolean;
  signedIn: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  session:  null,
  user:     null,
  loading:  true,
  signedIn: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession]   = useState<Session | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    // Hydrate from SecureStore on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Stay in sync with auth state changes (login / logout / token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      session,
      user:     session?.user ?? null,
      loading,
      signedIn: !!session,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
