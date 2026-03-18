import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { useTheme } from '../context/ThemeContext';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
            backgroundColor: colors.cardBg,
            borderTopWidth: 0,
            elevation: 10,
            height: 60,
            paddingBottom: 10,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <Ionicons size={24} name={focused ? "home" : "home-outline"} color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Connect',
          tabBarIcon: ({ color, focused }) => <Ionicons size={24} name={focused ? "people" : "people-outline"} color={color} />,
        }}
      />
    </Tabs>
  );
}
