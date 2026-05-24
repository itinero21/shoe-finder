import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Alert, useColorScheme } from 'react-native';
import * as Linking from 'expo-linking';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from './context/AuthContext';
import { exchangeStravaCode } from './services/stravaService';
import { initialSync } from './services/cloudSync';
import { supabase } from './lib/supabase';
import { requestLocationPermission, getLocationPermStatus } from './services/locationService';
import { runDecayCheck } from './utils/driftEngine';

// Parse query params from a deep-link URL
function getParam(url: string, key: string): string | null {
  const match = url.match(new RegExp(`[?&]${key}=([^&]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function handleDeepLink(url: string | null) {
  if (!url) return;

  // Email confirmation: shoefinder://auth/confirm?...
  if (url.startsWith('shoefinder://auth/confirm')) {
    const { error } = await supabase.auth.exchangeCodeForSession(url);
    if (!error) {
      Alert.alert('Email confirmed', 'Your account is verified. You are now signed in.');
    }
    return;
  }

  // Password reset deep link
  if (url.startsWith('shoefinder://reset-password')) {
    const { error } = await supabase.auth.exchangeCodeForSession(url);
    if (!error) {
      Alert.alert('Password Reset', 'You are now signed in. You can change your password in Settings.');
    }
    return;
  }

  if (!url.startsWith('shoefinder://strava-callback')) return;

  const code  = getParam(url, 'code');
  const error = getParam(url, 'error');

  if (error) {
    Alert.alert('Strava', error === 'access_denied'
      ? 'You denied Strava access. You can reconnect any time from the Integrations panel.'
      : `Strava returned an error: ${error}`
    );
    return;
  }
  if (!code) return;

  console.log('[Strava] Exchanging code:', code.slice(0, 10) + '...');
  const tokens = await exchangeStravaCode(code);
  if (tokens) {
    console.log('[Strava] Token exchange SUCCESS:', tokens.athlete_name);
    Alert.alert('Strava connected', `Welcome, ${tokens.athlete_name}. Your runs will sync automatically.`);
  } else {
    console.error('[Strava] Token exchange FAILED');
    Alert.alert('Strava Error', 'Authorization succeeded but token exchange failed. Please try again.');
  }
}

// Gate: redirects unauthenticated users to /login
function AuthGate() {
  const { signedIn, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!signedIn && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (signedIn && inAuthGroup) {
      // After login, run initial cloud sync then go to app
      initialSync().catch(() => {});
      router.replace('/(tabs)');
    }
  }, [signedIn, loading, segments]);

  return null;
}

function RootLayoutInner() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Handle deep links (Strava OAuth, email confirm, password reset)
  useEffect(() => {
    // Check if app was opened via a deep link
    Linking.getInitialURL().then((url) => {
      console.log('[DeepLink] Initial URL:', url);
      handleDeepLink(url);
    });
    // Listen for deep links while app is running
    const sub = Linking.addEventListener('url', ({ url }) => {
      console.log('[DeepLink] Incoming URL:', url);
      handleDeepLink(url);
    });
    return () => sub.remove();
  }, []);

  // Request location permission on first launch + run DRIFT decay check
  useEffect(() => {
    (async () => {
      const status = await getLocationPermStatus();
      if (status === 'not_asked') {
        // Small delay so the app is fully visible before the popup appears
        setTimeout(() => requestLocationPermission(), 1200);
      }
      // Run decay check every app open (fast, local only)
      runDecayCheck().catch(() => {});
    })();
  }, []);

  if (!loaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthGate />
      <Stack>
        <Stack.Screen name="(auth)"  options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)"  options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutInner />
    </AuthProvider>
  );
}
