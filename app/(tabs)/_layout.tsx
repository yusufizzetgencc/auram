/**
 * AROMIXEN - Tab Navigation Layout
 * Alt kısımda sabit navigasyon çubuğu
 */

import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Tab yapılandırması
const TAB_CONFIG = [
  { 
    name: 'index', 
    title: 'Keşfet', 
    icon: 'compass-outline',
    iconFocused: 'compass',
    color: '#9D4EDD',
  },
  { 
    name: 'favorites', 
    title: 'Favoriler', 
    icon: 'heart-outline',
    iconFocused: 'heart',
    color: '#FF6B9D',
  },
  { 
    name: 'profile', 
    title: 'Profil', 
    icon: 'person-outline',
    iconFocused: 'person',
    color: '#00D4AA',
  },
];

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';

  // Tab bar yüksekliği - safe area dahil
  const tabBarHeight = 56 + Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: tabBarHeight,
          backgroundColor: isDark 
            ? 'rgba(18, 14, 24, 0.98)' 
            : 'rgba(255, 255, 255, 0.98)',
          borderTopWidth: 1,
          borderTopColor: isDark 
            ? 'rgba(157, 78, 221, 0.12)' 
            : 'rgba(0, 0, 0, 0.06)',
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: isDark ? 0.25 : 0.06,
              shadowRadius: 8,
            },
            android: {
              elevation: 12,
            },
          }),
        },
        tabBarItemStyle: {
          paddingTop: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                name={focused ? tab.iconFocused : tab.icon}
                focused={focused}
                color={tab.color}
                inactiveColor={colors.textMuted}
              />
            ),
            tabBarActiveTintColor: tab.color,
          }}
        />
      ))}
    </Tabs>
  );
}

// Tab Icon Component
function TabIcon({ 
  name, 
  focused, 
  color,
  inactiveColor,
}: { 
  name: string;
  focused: boolean;
  color: string;
  inactiveColor: string;
}) {
  return (
    <View style={styles.iconContainer}>
      {focused && (
        <View style={[styles.activeIndicator, { backgroundColor: color }]} />
      )}
      <Ionicons
        name={name as keyof typeof Ionicons.glyphMap}
        size={24}
        color={focused ? color : inactiveColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 48,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
