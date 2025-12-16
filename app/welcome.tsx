/**
 * AROMIXEN - Welcome Screen
 * İlk kez açan kullanıcılar için karşılama ekranı
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { parfumler } = useApp();

  const gradientColors = colorScheme === 'dark'
    ? ['#0D0D14', '#1A1A26', '#2A2A3A'] as const
    : ['#FEFEFE', '#F8F4F0', '#F0EBE5'] as const;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative Elements */}
      <View style={styles.decorContainer}>
        <Animated.View
          entering={FadeInDown.delay(200).duration(800)}
          style={[styles.decorCircle, styles.decorCircle1, { backgroundColor: colors.tint + '10' }]}
        />
        <Animated.View
          entering={FadeInDown.delay(400).duration(800)}
          style={[styles.decorCircle, styles.decorCircle2, { backgroundColor: colors.tint + '08' }]}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo */}
          <Animated.View entering={FadeInDown.delay(300).duration(800)} style={styles.logoContainer}>
            <LinearGradient
              colors={['#9D4EDD', '#7B2CBF']}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="sparkles" size={48} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).duration(800)}>
            <ThemedText type="title" center style={styles.title}>AROMIXEN</ThemedText>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(700).duration(800)}>
            <ThemedText type="body" center style={styles.subtitle}>
              Kişiliğinize en uygun koku profilini keşfedin
            </ThemedText>
          </Animated.View>

          {/* Features */}
          <Animated.View entering={FadeInDown.delay(900).duration(800)} style={styles.featuresContainer}>
            <FeatureItem icon="person-outline" text="Kişisel analiz" colors={colors} />
            <FeatureItem icon="flask-outline" text={`${parfumler.length}+ Koku`} colors={colors} />
            <FeatureItem icon="sparkles-outline" text="Akıllı öneri" colors={colors} />
          </Animated.View>

          {/* Stats */}
          <Animated.View entering={FadeInDown.delay(1000).duration(800)} style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statNumber, { color: colors.tint }]}>14</ThemedText>
              <ThemedText type="caption">Soru</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statNumber, { color: colors.tint }]}>{parfumler.length}+</ThemedText>
              <ThemedText type="caption">Parfüm</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statNumber, { color: colors.tint }]}>%95</ThemedText>
              <ThemedText type="caption">Uyum</ThemedText>
            </View>
          </Animated.View>
        </View>

        {/* Bottom Section */}
        <Animated.View entering={FadeInUp.delay(1100).duration(800)} style={styles.bottomContainer}>
          <Button
            title="Keşfetmeye Başla"
            onPress={() => router.push('/onboarding')}
            size="lg"
            fullWidth
            icon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />}
          />
          <ThemedText type="caption" center style={styles.disclaimer}>
            5 kategori, 14 soru ile size özel parfüm önerileri
          </ThemedText>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

function FeatureItem({ icon, text, colors }: { icon: keyof typeof Ionicons.glyphMap; text: string; colors: typeof Colors.light }) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: colors.tint + '15' }]}>
        <Ionicons name={icon} size={20} color={colors.tint} />
      </View>
      <ThemedText type="caption" style={{ color: colors.textSecondary }}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  decorContainer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  decorCircle: { position: 'absolute', borderRadius: 9999 },
  decorCircle1: { width: width * 1.5, height: width * 1.5, top: -width * 0.5, right: -width * 0.5 },
  decorCircle2: { width: width, height: width, bottom: -width * 0.3, left: -width * 0.3 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing['2xl'] },
  logoContainer: { marginBottom: Spacing['2xl'] },
  logoGradient: { width: 100, height: 100, borderRadius: BorderRadius['2xl'], justifyContent: 'center', alignItems: 'center' },
  title: { marginBottom: Spacing.md, letterSpacing: 6, fontSize: FontSizes['3xl'] },
  subtitle: { marginBottom: Spacing['2xl'], paddingHorizontal: Spacing.xl },
  featuresContainer: { flexDirection: 'row', justifyContent: 'center', gap: Spacing['2xl'], marginBottom: Spacing['2xl'] },
  featureItem: { alignItems: 'center', gap: Spacing.sm },
  featureIcon: { width: 48, height: 48, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  statsContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: FontSizes.xl, fontWeight: '700' },
  statDivider: { width: 1, height: 30 },
  bottomContainer: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing['2xl'], gap: Spacing.base },
  disclaimer: { marginTop: Spacing.sm },
});


