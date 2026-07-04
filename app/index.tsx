/**
 * AROMIXEN - Entry Point
 * Kullanıcı durumuna göre yönlendirme
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { requestTrackingPermissionsAsync, getTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { trackingPermission } from '@/services/trackingPermission';
import { Platform } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';

export default function EntryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isDataLoaded, isOnboardingComplete } = useApp();
  const [attHandled, setAttHandled] = useState(false);

  useEffect(() => {
    const handleATT = async () => {
      try {
        if (Platform.OS === 'ios') {
          // İzin daha önce istenmiş mi kontrol et
          const { status: existingStatus } = await getTrackingPermissionsAsync();
          if (existingStatus === 'undetermined') {
            // İlk kez isteniyorsa sor
            const { status } = await requestTrackingPermissionsAsync();
            trackingPermission.setPermission(status === 'granted');
          } else {
            trackingPermission.setPermission(existingStatus === 'granted');
          }
        } else {
          trackingPermission.setPermission(true);
        }
      } catch (error) {
        console.warn('[ATT] Permission check failed:', error);
        trackingPermission.setPermission(false);
      } finally {
        setAttHandled(true);
      }
    };
    
    handleATT();
  }, []);

  useEffect(() => {
    if (isDataLoaded && attHandled) {
      // Kullanıcı daha önce testi tamamladıysa direkt keşfet'e git
      if (isOnboardingComplete) {
        router.replace('/(tabs)');
      } else {
        // İlk kez açıyorsa welcome ekranına git
        router.replace('/welcome');
      }
    }
  }, [isDataLoaded, isOnboardingComplete, attHandled]);

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
