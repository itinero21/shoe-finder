import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
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
        }}
      />

      <Tabs.Screen
        name="wars"
        options={{
          title: 'GAMES',
          tabBarIcon: ({ color }) => <Ionicons name="flash-outline" size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="coach"
        options={{
          title: 'COACH',
          tabBarIcon: ({ color }) => <Ionicons name="pulse-outline" size={22} color={color} />,
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
