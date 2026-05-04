import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text } from 'react-native';
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
        name="scan"
        options={{
          title: 'SCOUT',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="scan-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rotation"
        options={{
          title: 'ARSENAL',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'DISCOVER',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'COACH',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="race"
        options={{
          title: 'RACES',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flag-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
