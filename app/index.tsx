/**
 * Kullanıcı durumuna göre yönlendirme
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';

export default function EntryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isDataLoaded, isOnboardingComplete } = useApp();

  useEffect(() => {
    if (isDataLoaded) {
      // Kullanıcı daha önce testi tamamladıysa direkt keşfet'e git
      if (isOnboardingComplete) {
        router.replace('/(tabs)');
      } else {
        // İlk kez açıyorsa welcome ekranına git
        router.replace('/welcome');
      }
    }
  }, [isDataLoaded, isOnboardingComplete]);

  // Loading ekranı
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#9D4EDD', '#7B2CBF']}
        style={styles.logoContainer}
      >
        <Ionicons name="sparkles" size={40} color="#FFF" />
      </LinearGradient>
      <ThemedText type="title" style={styles.title}>AURAM</ThemedText>
      <ActivityIndicator size="small" color={colors.tint} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    letterSpacing: 4,
    marginBottom: 24,
  },
  loader: {
    marginTop: 8,
  },
});
