/**
 * AURAM - Tab Navigation Layout
 * 4 Tab: Ana Sayfa, Parfümler, Favoriler, Profil
 */

import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { HapticTab } from '@/components/haptic-tab';
import { Colors, FontWeights } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { ThemedText } from '@/components/themed-text';

// Tab yapılandırması - 4 Tab
const TAB_CONFIG = [
  { 
    name: 'index', 
    title: 'Ana Sayfa', 
    icon: 'home-outline',
    iconFocused: 'home',
    color: '#9D4EDD',
  },
  { 
    name: 'parfums', 
    title: 'Parfümler', 
    icon: 'flask-outline',
    iconFocused: 'flask',
    color: '#00B4D8',
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
  const { todaySotd } = useApp();

  const tabBarHeight = 56 + Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <View style={{ flex: 1 }}>
            {/* Top subtle gradient line */}
            <LinearGradient
              colors={isDark ? ['rgba(157, 78, 221, 0.4)', 'transparent'] : ['rgba(157, 78, 221, 0.15)', 'transparent']}
              style={{ height: 2, width: '100%' }}
            />
            {/* Main Background with slight tint */}
            <View style={{ 
              flex: 1, 
              backgroundColor: isDark ? 'rgba(18, 14, 24, 0.95)' : 'rgba(255, 255, 255, 0.95)' 
            }} />
          </View>
        ),
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: tabBarHeight,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
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
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarLabel: ({ focused, color }) => (
              <ThemedText 
                style={[
                  styles.tabBarLabel, 
                  { 
                    color,
                    fontWeight: focused ? FontWeights.bold : FontWeights.medium,
                  }
                ]}
              >
                {tab.title}
              </ThemedText>
            ),
            tabBarIcon: ({ focused }) => {
              const showBadge = tab.name === 'index' && !todaySotd;
              return (
                <TabIcon
                  name={focused ? tab.iconFocused : tab.icon}
                  focused={focused}
                  color={tab.color}
                  inactiveColor={colors.textMuted}
                  showBadge={showBadge}
                  isDark={isDark}
                />
              );
            },
            tabBarActiveTintColor: tab.color,
          }}
        />
      ))}
    </Tabs>
  );
}

function TabIcon({ 
  name, 
  focused, 
  color,
  inactiveColor,
  showBadge,
  isDark,
}: { 
  name: string;
  focused: boolean;
  color: string;
  inactiveColor: string;
  showBadge?: boolean;
  isDark: boolean;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      scale.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) });
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      scale.value = withTiming(0.8, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [focused]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <View style={styles.iconContainer}>
      <Animated.View 
        style={[
          styles.activeIndicatorPill, 
          { backgroundColor: color + '20' }, 
          animatedIndicatorStyle
        ]} 
      />
      
      <Ionicons
        name={name as keyof typeof Ionicons.glyphMap}
        size={22}
        color={focused ? color : inactiveColor}
        style={{ zIndex: 1 }}
      />
      
      {showBadge && (
        <View style={[styles.badgeDot, { borderColor: isDark ? '#120E18' : '#FFF' }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 50,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeIndicatorPill: {
    position: 'absolute',
    width: 56,
    height: 32,
    borderRadius: 16,
  },
  badgeDot: {
    position: 'absolute',
    top: 2,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    zIndex: 2,
  },
  tabBarLabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
});
