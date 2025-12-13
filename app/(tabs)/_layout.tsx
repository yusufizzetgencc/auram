/**
 * AROMIXEN - Premium Tab Navigation Layout
 * Elegant floating tab bar design
 */

import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';

import { HapticTab } from '@/components/haptic-tab';
import { Colors, BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute',
          bottom: Math.max(insets.bottom, 12) + 8,
          left: Spacing.xl,
          right: Spacing.xl,
          height: 68,
          backgroundColor: colorScheme === 'dark' 
            ? 'rgba(30, 30, 35, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          borderRadius: BorderRadius['2xl'],
          borderTopWidth: 0,
          paddingBottom: 0,
          paddingTop: 0,
          ...Platform.select({
            ios: {
              shadowColor: colors.tint,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
            },
            android: {
              elevation: 12,
            },
          }),
        },
        tabBarItemStyle: {
          paddingTop: 10,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Parfümler',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'sparkles' : 'sparkles-outline'}
              color={color}
              focused={focused}
              activeGradient={['#9D4EDD', '#C77DFF']}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoriler',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'heart' : 'heart-outline'}
              color={focused ? '#FF6B9D' : color}
              focused={focused}
              activeGradient={['#FF6B9D', '#FF8A80']}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'person' : 'person-outline'}
              color={focused ? '#00D4AA' : color}
              focused={focused}
              activeGradient={['#00D4AA', '#4ECDC4']}
            />
          ),
        }}
      />
    </Tabs>
  );
}

// Tab Icon Component with animated background
function TabIcon({ 
  name, 
  color, 
  focused, 
  activeGradient 
}: { 
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
  activeGradient: string[];
}) {
  return (
    <View style={styles.iconContainer}>
      {focused && (
        <LinearGradient
          colors={[activeGradient[0] + '30', activeGradient[1] + '15']}
          style={styles.activeBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      <Ionicons
        name={name}
        size={focused ? 26 : 24}
        color={color}
        style={focused ? styles.activeIcon : undefined}
      />
      {focused && (
        <View style={[styles.activeIndicator, { backgroundColor: activeGradient[0] }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 52,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.lg,
  },
  activeIcon: {
    transform: [{ translateY: -1 }],
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
