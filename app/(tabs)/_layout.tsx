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
        tabBarInactiveTintColor: 'rgba(10,10,10,0.35)',
        tabBarStyle: {
          backgroundColor: '#F4F1EA',
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

      {/* THE CLOSET — your cast of living shoes + graveyard */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'CLOSET',
          tabBarIcon: ({ color }) => <Ionicons name="shirt-outline" size={22} color={color} />,
        }}
      />

      {/* RUN — track a live run, log/sync, pick shoe, see consequence */}
      <Tabs.Screen
        name="run"
        options={{
          title: 'RUN',
          tabBarIcon: ({ color }) => <Ionicons name="footsteps-outline" size={22} color={color} />,
        }}
      />

      {/* + ADD / SHOP — add shoes, discovery, quiz */}
      <Tabs.Screen
        name="scan"
        options={{
          title: 'ADD',
          tabBarIcon: ({ color }) => <Ionicons name="add-circle-outline" size={22} color={color} />,
        }}
      />

    </Tabs>
  );
}
