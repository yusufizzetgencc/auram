/**
 * TENİNDE - Root Layout
 */

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
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
import { NotificationSync } from '@/components/NotificationSync';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { trackingPermission } from '@/services/trackingPermission';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Custom themes
const TenindeLightTheme = {
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

const TenindeDarkTheme = {
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
  const [fontsReady, fontError] = useFonts({
    ...Ionicons.font,
    ...MaterialIcons.font,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Yazı tipi yüklenemezse sistem fontuyla devam et (uygulama açılışta takılı kalmasın)
  const fontsLoaded = fontsReady || !!fontError;

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

  // Yazı tipleri yüklenmeden ekran çizilmez (splash açık kalır). Aksi halde metinler yedek fontla ölçülüp
  // önbelleğe alınıyor, font gelince son harfler kırpılıyordu (özellikle bildirim/bağlantıyla soğuk açılışta).
  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? TenindeDarkTheme : TenindeLightTheme}>
      <NotificationSync />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colorScheme === 'dark' ? Colors.dark.bg : Colors.light.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="ad-loading" options={{ gestureEnabled: false }} />
        <Stack.Screen name="results" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="diary" />
        <Stack.Screen name="compare" />
        <Stack.Screen name="layering" />
        <Stack.Screen name="gift" />
        <Stack.Screen name="mood" />
        <Stack.Screen name="spin" />
        <Stack.Screen name="science" />
        <Stack.Screen name="similar" />
        <Stack.Screen name="store" />
        <Stack.Screen name="advisor" />
        <Stack.Screen name="report" />
        <Stack.Screen name="friend" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="learned" />
        <Stack.Screen name="tools" />
        <Stack.Screen name="settings" />
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

