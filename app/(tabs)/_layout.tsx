/**
 * Tab layout with layered UX.
 * Beginner (< 50 mi, < 28 days):   HOME, MY SHOES, FIND
 * Intermediate (50+ mi, 28+ days): + COACH
 * Advanced (level 5+):             + DRIFT, GAMES
 *
 * Phase H of v8 intelligence spec.
 */
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile } from '../utils/userProfile';

type Layer = 'beginner' | 'intermediate' | 'advanced';

function computeLayer(lifetimeMiles: number, createdAt: string, level: number): Layer {
  const daysSince = (Date.now() - new Date(createdAt).getTime()) / 86400000;
  if (level >= 5) return 'advanced';
  if (lifetimeMiles >= 50 && daysSince >= 28) return 'intermediate';
  return 'beginner';
}

export default function TabLayout() {
  const [layer, setLayer] = useState<Layer>('beginner');

  useEffect(() => {
    getUserProfile().then(p => {
      setLayer(computeLayer(p.lifetime_miles, p.created_at, p.current_level));
    });
  }, []);

  const hide = (tab: 'drift' | 'games' | 'coach'): object => {
    if (tab === 'drift'  && layer !== 'advanced')                   return { display: 'none' };
    if (tab === 'games'  && layer !== 'advanced')                   return { display: 'none' };
    if (tab === 'coach'  && layer === 'beginner')                   return { display: 'none' };
    return {};
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF3D00',
        tabBarInactiveTintColor: 'rgba(244,241,234,0.4)',
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopWidth: 2,
          borderTopColor: '#FF3D00',
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          height: Platform.OS === 'ios' ? 80 : 62,
        },
        tabBarLabelStyle: {
          fontFamily: 'SpaceMono',
          fontSize: 9,
          letterSpacing: 1,
          marginTop: 2,
        },
      }}>

      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="rotation"
        options={{
          title: 'MY SHOES',
          tabBarIcon: ({ color }) => <Ionicons name="layers-outline" size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          title: 'FIND',
          tabBarIcon: ({ color }) => <Ionicons name="search-outline" size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          title: 'DRIFT',
          tabBarIcon: ({ color }) => <Ionicons name="map-outline" size={22} color={color} />,
          tabBarItemStyle: hide('drift'),
        }}
      />

      <Tabs.Screen
        name="wars"
        options={{
          title: 'GAMES',
          tabBarIcon: ({ color }) => <Ionicons name="flash-outline" size={22} color={color} />,
          tabBarItemStyle: hide('games'),
        }}
      />

      <Tabs.Screen
        name="coach"
        options={{
          title: 'COACH',
          tabBarIcon: ({ color }) => <Ionicons name="pulse-outline" size={22} color={color} />,
          tabBarItemStyle: hide('coach'),
        }}
      />

      {/* Hidden screens — accessible within their parent tabs */}
      <Tabs.Screen name="discover"  options={{ href: null }} />
      <Tabs.Screen name="race"      options={{ href: null }} />
      <Tabs.Screen name="history"   options={{ href: null }} />
      <Tabs.Screen name="explore"   options={{ href: null }} />
    </Tabs>
  );
}
