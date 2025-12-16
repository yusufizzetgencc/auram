/**
 * AROMIXEN - Premium Welcome Screen
 * Modern ve etkileyici karşılama ekranı
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp, 
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';

const { width, height } = Dimensions.get('window');

// Floating orb component
function FloatingOrb({ 
  delay, 
  size, 
  color, 
  startX, 
  startY,
  duration = 4000,
}: { 
  delay: number; 
  size: number; 
  color: string; 
  startX: number; 
  startY: number;
  duration?: number;
}) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-30, { duration: duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: duration, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    translateX.value = withDelay(
      delay + 500,
      withRepeat(
        withSequence(
          withTiming(15, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
          withTiming(-15, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.1, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.9, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          top: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

// Animated sparkle
function Sparkle({ x, y, delay }: { x: number; y: number; delay: number }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0, { duration: 800 })
        ),
        -1
      )
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y }, animatedStyle]}>
      <Ionicons name="sparkles" size={16} color="#FFD700" />
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const { parfumler } = useApp();

  // Pulse animation for logo
  const logoPulse = useSharedValue(1);
  
  useEffect(() => {
    logoPulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoPulse.value }],
  }));

  const stats = [
    { value: '10', label: 'Kategori', icon: 'layers-outline' as const, color: '#9D4EDD' },
    { value: '27', label: 'Soru', icon: 'chatbubbles-outline' as const, color: '#FF6B9D' },
    { value: `${parfumler.length}+`, label: 'Parfüm', icon: 'flask-outline' as const, color: '#00D4AA' },
  ];

  const features = [
    { 
      icon: 'finger-print-outline' as const, 
      title: 'Kişisel pH Analizi', 
      subtitle: 'Cildinize özel',
      color: '#00D4AA',
    },
    { 
      icon: 'bulb-outline' as const, 
      title: 'Akıllı Öneri', 
      subtitle: 'AI destekli',
      color: '#FF8C42',
    },
    { 
      icon: 'heart-outline' as const, 
      title: '%95 Uyum', 
      subtitle: 'Memnuniyet',
      color: '#E63946',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={isDark 
          ? ['#0A0A12', '#12101C', '#1A1428', '#120F1C'] 
          : ['#FDFBFF', '#F8F0FA', '#F0E8F5', '#E8E0F0']}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating Orbs Background */}
      <View style={styles.orbsContainer} pointerEvents="none">
        <FloatingOrb delay={0} size={200} color={isDark ? '#9D4EDD15' : '#9D4EDD10'} startX={-50} startY={100} />
        <FloatingOrb delay={1000} size={150} color={isDark ? '#FF6B9D12' : '#FF6B9D08'} startX={width - 80} startY={200} />
        <FloatingOrb delay={500} size={120} color={isDark ? '#00D4AA10' : '#00D4AA08'} startX={50} startY={height - 300} />
        <FloatingOrb delay={1500} size={180} color={isDark ? '#7B2CBF10' : '#7B2CBF08'} startX={width - 120} startY={height - 400} duration={5000} />
        
        {/* Sparkles */}
        <Sparkle x={width * 0.2} y={height * 0.15} delay={0} />
        <Sparkle x={width * 0.8} y={height * 0.25} delay={600} />
        <Sparkle x={width * 0.15} y={height * 0.6} delay={1200} />
        <Sparkle x={width * 0.85} y={height * 0.55} delay={1800} />
        <Sparkle x={width * 0.5} y={height * 0.35} delay={400} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo Section */}
          <Animated.View 
            entering={FadeInDown.delay(200).duration(800).springify()} 
            style={styles.logoSection}
          >
            <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
              {/* Outer glow */}
              <View style={styles.logoGlow} />
              
              {/* Main logo */}
            <LinearGradient
                colors={['#9D4EDD', '#7B2CBF', '#5A189A']}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
                <View style={styles.logoInner}>
                  <Ionicons name="sparkles" size={42} color="#FFFFFF" />
                </View>
            </LinearGradient>
              
              {/* Decorative ring */}
              <View style={styles.logoRing} />
            </Animated.View>
          </Animated.View>

          {/* Title Section */}
          <Animated.View entering={FadeInDown.delay(400).duration(800)}>
            <ThemedText style={[styles.brandName, { color: colors.text }]}>
              AROMIXEN
            </ThemedText>
            <View style={styles.taglineContainer}>
              <View style={[styles.taglineLine, { backgroundColor: colors.tint }]} />
              <ThemedText style={[styles.tagline, { color: colors.textSecondary }]}>
                Kişisel Koku Profili
              </ThemedText>
              <View style={[styles.taglineLine, { backgroundColor: colors.tint }]} />
            </View>
          </Animated.View>

          {/* Main Description */}
          <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.descriptionContainer}>
            <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
              Cildinize, yaşam tarzınıza ve kişiliğinize{'\n'}
              <ThemedText style={[styles.descriptionHighlight, { color: colors.tint }]}>
                mükemmel uyumlu
              </ThemedText>{' '}parfümü keşfedin
            </ThemedText>
          </Animated.View>

          {/* Features Row */}
          <Animated.View entering={FadeInDown.delay(800).duration(800)} style={styles.featuresRow}>
            {features.map((feature, index) => (
              <Animated.View 
                key={feature.title}
                entering={SlideInRight.delay(900 + index * 100).duration(500)}
                style={styles.featureItem}
              >
                <View style={[styles.featureIconContainer, { backgroundColor: feature.color + '20' }]}>
                  <Ionicons name={feature.icon} size={22} color={feature.color} />
                </View>
                <ThemedText style={[styles.featureTitle, { color: colors.text }]}>
                  {feature.title}
                </ThemedText>
                <ThemedText style={[styles.featureSubtitle, { color: colors.textMuted }]}>
                  {feature.subtitle}
                </ThemedText>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Stats Section */}
          <Animated.View entering={FadeInDown.delay(1000).duration(800)} style={styles.statsSection}>
            <View style={[styles.statsCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              {stats.map((stat, index) => (
                <React.Fragment key={stat.label}>
                  <Animated.View 
                    entering={FadeIn.delay(1100 + index * 150).duration(500)}
                    style={styles.statItem}
                  >
                    <View style={[styles.statIconContainer, { backgroundColor: stat.color + '20' }]}>
                      <Ionicons name={stat.icon} size={18} color={stat.color} />
            </View>
                    <ThemedText style={[styles.statValue, { color: stat.color }]}>
                      {stat.value}
                    </ThemedText>
                    <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                      {stat.label}
                    </ThemedText>
                  </Animated.View>
                  {index < stats.length - 1 && (
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* Bottom Section */}
        <Animated.View entering={FadeInUp.delay(1200).duration(800)} style={styles.bottomContainer}>
          {/* Journey Info */}
          <View style={styles.journeyInfo}>
            <View style={styles.journeyBadge}>
              <Ionicons name="time-outline" size={14} color={colors.tint} />
              <ThemedText style={[styles.journeyText, { color: colors.textSecondary }]}>
                ~5 dakika
              </ThemedText>
            </View>
            <View style={[styles.journeyDot, { backgroundColor: colors.border }]} />
            <View style={styles.journeyBadge}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#00D4AA" />
              <ThemedText style={[styles.journeyText, { color: colors.textSecondary }]}>
                Ücretsiz
              </ThemedText>
            </View>
          </View>

          {/* CTA Button */}
          <Pressable 
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.ctaButtonPressed,
            ]}
            onPress={() => router.push('/onboarding')}
          >
            <LinearGradient
              colors={['#9D4EDD', '#7B2CBF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <ThemedText style={styles.ctaText}>Koku Yolculuğuna Başla</ThemedText>
              <View style={styles.ctaIconContainer}>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </Pressable>

          {/* Bottom Note */}
          <View style={styles.bottomNote}>
            <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
            <ThemedText style={[styles.bottomNoteText, { color: colors.textMuted }]}>
              10 kategori, 27 soruyla size özel parfüm profili oluşturuyoruz
          </ThemedText>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  orbsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  safeArea: { 
    flex: 1,
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: Spacing.xl,
  },
  
  // Logo Styles
  logoSection: {
    marginBottom: Spacing['2xl'],
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#9D4EDD',
    opacity: 0.15,
  },
  logoGradient: {
    width: 110,
    height: 110,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9D4EDD',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  logoInner: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.3)',
  },
  
  // Title Styles
  brandName: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  taglineLine: {
    width: 30,
    height: 1,
  },
  tagline: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  
  // Description Styles
  descriptionContainer: {
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.xl,
  },
  description: {
    fontSize: FontSizes.base,
    textAlign: 'center',
    lineHeight: 26,
  },
  descriptionHighlight: {
    fontWeight: '700',
  },
  
  // Features Styles
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing['2xl'],
  },
  featureItem: {
    alignItems: 'center',
    width: (width - Spacing.xl * 2 - Spacing.lg * 2) / 3,
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  featureTitle: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 10,
    textAlign: 'center',
  },
  
  // Stats Styles
  statsSection: {
    width: '100%',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    gap: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 50,
    opacity: 0.3,
  },
  
  // Bottom Section Styles
  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  journeyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  journeyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  journeyText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  journeyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  ctaButton: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#9D4EDD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.md,
  },
  ctaText: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  ctaIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  bottomNoteText: {
    fontSize: FontSizes.xs,
    textAlign: 'center',
  },
});
