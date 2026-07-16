/**
 * KOKU - Root Layout
 */

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { Platform } from 'react-native';
import { requestTrackingPermissionsAsync, getTrackingPermissionsAsync } from 'expo-tracking-transparency';

import { Colors } from '@/constants/theme';
import { AppProvider, useApp } from '@/context/AppContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { trackingPermission } from '@/services/trackingPermission';

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
  const [splashHidden, setSplashHidden] = useState(false);
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    ...MaterialIcons.font,
  });

  useEffect(() => {
    if (isDataLoaded && fontsLoaded) {
      SplashScreen.hideAsync().then(() => {
        setSplashHidden(true);
      });
    }
  }, [isDataLoaded, fontsLoaded]);

  // Splash kapandıktan sonra izin iste (App aktif olduktan sonra)
  useEffect(() => {
    if (!splashHidden) return;
    
    const requestTracking = async () => {
      // iOS UI geçişinin tamamlanması için kısa bir süre bekle
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        if (Platform.OS === 'ios') {
          const { status: existingStatus } = await getTrackingPermissionsAsync();
          if (existingStatus === 'undetermined') {
            const { status } = await requestTrackingPermissionsAsync();
            trackingPermission.setPermission(status === 'granted');
          } else {
            trackingPermission.setPermission(existingStatus === 'granted');
          }
        } else {
          trackingPermission.setPermission(true);
        }
      } catch (e) {
        console.warn('[ATT] Error requesting permission globally', e);
      }
    };
    
    requestTracking();
  }, [splashHidden]);

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
      <SubscriptionProvider>
        <RootLayoutContent />
      </SubscriptionProvider>
    </AppProvider>
  );
}

