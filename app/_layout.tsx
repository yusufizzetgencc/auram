/**
 * KOKU - Root Layout
 */

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { AppProvider, useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Custom themes
const KokuLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const KokuDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { isDataLoaded } = useApp();

  useEffect(() => {
    if (isDataLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isDataLoaded]);

  useEffect(() => {
    const requestTracking = async () => {
      try {
        await requestTrackingPermissionsAsync();
      } catch (error) {
        console.warn('Tracking permission request error:', error);
      }
    };
    requestTracking();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? KokuDarkTheme : KokuLightTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="ad-loading" options={{ gestureEnabled: false }} />
        <Stack.Screen name="results" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="compare" />
        <Stack.Screen name="gift" />
        <Stack.Screen name="journal" />
        <Stack.Screen name="layering" />
        <Stack.Screen name="mood" />
        <Stack.Screen name="spin" />
        <Stack.Screen name="performance" />
        <Stack.Screen name="parfum/[id]" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootLayoutContent />
    </AppProvider>
  );
}
