/**
 * Auram - Kilitli Özellik Overlay
 * Çocuk içeriği bulanıklaştırır, üzerine merak uyandıran bir CTA koyar.
 * Asla tam karartma yapılmaz — kullanıcı her zaman bir şeyin var olduğunu görür.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { Colors, BorderRadius, FontSizes, FontWeights, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface LockedFeatureOverlayProps {
  children: React.ReactNode;
  onUnlock: () => void;
  title?: string;
  subtitle?: string;
  blurIntensity?: number;
}

export function LockedFeatureOverlay({
  children,
  onUnlock,
  title = 'Devamını Keşfet',
  subtitle = 'Bu özelliği açmak için Premium\'a geç.',
  blurIntensity = 24,
}: LockedFeatureOverlayProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <View pointerEvents="none">{children}</View>
      <BlurView
        intensity={blurIntensity}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      >
        <Pressable style={styles.tapArea} onPress={onUnlock}>
          <View style={[styles.badge, { backgroundColor: colors.tint }]}>
            <Ionicons name="sparkles" size={20} color="#FFF" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        </Pressable>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  tapArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semiBold,
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
});
