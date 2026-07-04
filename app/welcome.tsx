/**
 * AURAM - Luxury Welcome Screen
 * Premium, elegant ve sophisticated tasarım - Velvet & Amber
 * ATT (App Tracking Transparency) izin talebi burada yapılır.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Pressable, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { trackingPermission } from '@/services/trackingPermission';

const { width, height } = Dimensions.get('window');

// Elegant floating particle
function Particle({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-50, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.4, { duration: 2000 }),
          withTiming(0, { duration: 2000 })
        ),
        -1,
        true
      )
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: '#D6A06F',
      shadowColor: '#D6A06F',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: size,
    }, animatedStyle]} />
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const { parfumler } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Kullanıcı "Yolculuğa Başla" butonuna basınca:
   * iOS → Standart iOS sistem ATT izin penceresi gösterilir
   *        (konum izni gibi normal iOS penceresi)
   *        Mesaj app.json > NSUserTrackingUsageDescription'dan gelir
   * Android → Direkt onboarding'e geçilir
   */
  const handleStart = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (Platform.OS === 'ios') {
        const { status } = await requestTrackingPermissionsAsync();
        console.log('[ATT] Tracking izin durumu:', status);
        trackingPermission.setPermission(status === 'granted');
      } else {
        trackingPermission.setPermission(true);
      }
    } catch (error) {
      console.warn('[ATT] Tracking permission error:', error);
      trackingPermission.setPermission(false);
    }

    router.push('/onboarding');
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={isDark ? ['#1C1420', '#2D2833', '#110D14'] : ['#FDFBF7', '#F5F0E6', '#EBE3D5']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Particles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Particle delay={0} x={width * 0.2} y={height * 0.3} size={4} />
        <Particle delay={1000} x={width * 0.8} y={height * 0.2} size={6} />
        <Particle delay={500} x={width * 0.5} y={height * 0.6} size={3} />
        <Particle delay={1500} x={width * 0.1} y={height * 0.7} size={5} />
        <Particle delay={800} x={width * 0.85} y={height * 0.8} size={7} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.content}>
          {/* Logo Section */}
          <Animated.View 
            entering={FadeInDown.delay(300).duration(1000).springify()} 
            style={styles.logoSection}
          >
            <Image 
              source={require('@/assets/images/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Elegant Tagline */}
          <Animated.View entering={FadeInDown.delay(500).duration(800)} style={styles.taglineWrapper}>
            <View style={[styles.taglineLine, { backgroundColor: colors.accent }]} />
            <ThemedText style={[styles.tagline, { color: colors.accent }]}>
              KİŞİYE ÖZEL İMZA KOKUNUZ
            </ThemedText>
            <View style={[styles.taglineLine, { backgroundColor: colors.accent }]} />
          </Animated.View>

          {/* Main Title */}
          <Animated.View entering={FadeInDown.delay(700).duration(800)} style={styles.titleSection}>
            <ThemedText style={[styles.title, { color: colors.textPrimary }]}>
              Koku{'\n'}Sanatını{'\n'}Keşfedin
            </ThemedText>
            <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
              Ten kimyanız ve yaşam tarzınızla kusursuz uyum sağlayan mükemmel parfümü yapay zeka ile bulun.
            </ThemedText>
          </Animated.View>

          {/* Feature Highlights */}
          <Animated.View entering={FadeInDown.delay(900).duration(800)} style={styles.featuresRow}>
            <FeatureBox icon="finger-print-outline" text="pH Analizi" color={colors.accent} textColor={colors.textPrimary} />
            <View style={[styles.featureDivider, { backgroundColor: colors.border }]} />
            <FeatureBox icon="star-outline" text="Premium Seçki" color={colors.accent} textColor={colors.textPrimary} />
            <View style={[styles.featureDivider, { backgroundColor: colors.border }]} />
            <FeatureBox icon="flask-outline" text="Mükemmel Uyum" color={colors.accent} textColor={colors.textPrimary} />
          </Animated.View>
        </View>

        {/* Bottom Section */}
        <Animated.View entering={FadeInUp.delay(1100).duration(800)} style={styles.bottomSection}>
          
          {/* CTA Button */}
          <Pressable 
            style={({ pressed }) => [
              styles.ctaButton,
              { backgroundColor: colors.primary },
              pressed && styles.ctaButtonPressed,
              isLoading && { opacity: 0.7 },
            ]}
            onPress={handleStart}
            disabled={isLoading}
          >
            <ThemedText style={styles.ctaText}>Yolculuğa Başla</ThemedText>
            <Ionicons name="arrow-forward" size={20} color="#FFF" style={styles.ctaIcon} />
          </Pressable>

          {/* Info Note */}
          <ThemedText style={[styles.bottomNote, { color: colors.textSecondary }]}>
            15 kısa soru • Sadece size özel parfüm eşleşmeleri
          </ThemedText>
        </Animated.View>

      </SafeAreaView>
    </View>
  );
}

// Simple Feature Component
function FeatureBox({ icon, text, color, textColor }: { icon: string; text: string; color: string; textColor: string }) {
  return (
    <View style={styles.featureBox}>
      <Ionicons name={icon as any} size={22} color={color} style={{ marginBottom: 8 }} />
      <ThemedText style={[styles.featureBoxText, { color: textColor }]}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  safeArea: { 
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing['2xl'],
  },
  
  // Logo
  logoSection: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  
  // Tagline
  taglineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    width: '100%',
  },
  taglineLine: {
    height: 1,
    flex: 1,
    opacity: 0.3,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 4,
    paddingHorizontal: Spacing.md,
  },
  
  // Title & Description
  titleSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  title: {
    fontSize: 42,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 52,
    letterSpacing: 1,
    marginBottom: Spacing.lg,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
    paddingHorizontal: Spacing.md,
  },

  // Features
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: Spacing.md,
  },
  featureBox: {
    flex: 1,
    alignItems: 'center',
  },
  featureBoxText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  featureDivider: {
    width: 1,
    height: 30,
    opacity: 0.5,
  },

  // Bottom Section
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    alignItems: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  ctaText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  ctaIcon: {
    marginLeft: Spacing.sm,
  },
  bottomNote: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
});
