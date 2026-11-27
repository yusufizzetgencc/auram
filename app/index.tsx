/**
 * Giriş: kullanıcının durumuna göre yönlendirir.
 */
import { useTheme } from '@/components/kit';
import { Wordmark } from '@/components/kit/brand';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function EntryScreen() {
  const router = useRouter();
  const c = useTheme();
  const { isDataLoaded, isOnboardingComplete } = useApp();

  useEffect(() => {
    if (!isDataLoaded) return;
    router.replace(isOnboardingComplete ? '/(tabs)' : '/welcome');
  }, [isDataLoaded, isOnboardingComplete, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg, gap: 24 }}>
      <Wordmark size={34} />
      <ActivityIndicator color={c.accent} />
    </View>
  );
}
