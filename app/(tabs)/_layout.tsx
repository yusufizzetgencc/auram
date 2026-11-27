/**
 * TENİNDE — Sekmeler: Bugün · Keşfet · Koleksiyon · Profil
 */
import { HapticTab } from '@/components/haptic-tab';
import { useTheme } from '@/components/kit';
import { FontFamilies } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS: { name: string; title: string; icon: keyof typeof Ionicons.glyphMap; active: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'index', title: 'Bugün', icon: 'sunny-outline', active: 'sunny' },
  { name: 'parfums', title: 'Keşfet', icon: 'compass-outline', active: 'compass' },
  { name: 'favorites', title: 'Koleksiyon', icon: 'albums-outline', active: 'albums' },
  { name: 'profile', title: 'Profil', icon: 'person-outline', active: 'person' },
];

export default function TabLayout() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: c.ink,
        tabBarInactiveTintColor: c.inkSubtle,
        tabBarStyle: {
          backgroundColor: c.bg,
          borderTopColor: c.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 58 + Math.max(insets.bottom, 8),
          paddingTop: 6,
          elevation: 0,
        },
        tabBarLabelStyle: { fontFamily: FontFamilies.medium, fontSize: 11 },
      }}
    >
      {TABS.map(t => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? t.active : t.icon} size={22} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
