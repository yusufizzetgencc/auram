/**
 * AROMIXEN - Premium Welcome Screen
 * Elegant Mor/Fuşya Teması
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated as RNAnimated, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const shadows = Shadows[colorScheme ?? 'light'];

  // Floating animation
  const floatValue = useSharedValue(0);
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    floatValue.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    pulseValue.value = withRepeat(
      withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatValue.value * -10 }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  // Gradient colors for theme
  const gradientColors = colorScheme === 'dark'
    ? ['#0D0A14', '#150F20', '#1E1628'] as const
    : ['#FDFBFF', '#F8F4FC', '#F0EAF5'] as const;

  const accentGradient = colorScheme === 'dark'
    ? ['#B366FF', '#9D4EDD', '#7B2CBF'] as const
    : ['#9D4EDD', '#7B2CBF', '#5A189A'] as const;

  const secondaryGradient = colorScheme === 'dark'
    ? ['#FF6B9D', '#E63946', '#C9184A'] as const
    : ['#FF6B9D', '#E63946', '#C9184A'] as const;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background Gradient */}
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative Gradient Orbs */}
      <View style={styles.decorContainer}>
        <Animated.View
          entering={FadeInDown.delay(200).duration(1000)}
          style={[styles.decorOrb, styles.decorOrb1]}
        >
          <LinearGradient
            colors={['#9D4EDD30', '#9D4EDD10', '#9D4EDD00']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>
        <Animated.View
          entering={FadeInDown.delay(400).duration(1000)}
          style={[styles.decorOrb, styles.decorOrb2]}
        >
          <LinearGradient
            colors={['#FF6B9D20', '#FF6B9D08', '#FF6B9D00']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>
        <Animated.View
          entering={FadeInDown.delay(600).duration(1000)}
          style={[styles.decorOrb, styles.decorOrb3]}
        >
          <LinearGradient
            colors={['#00D4AA15', '#00D4AA05', '#00D4AA00']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Content */}
        <View style={styles.content}>
          {/* Logo & Title */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(800)}
            style={[styles.logoContainer, floatStyle]}
          >
            <LinearGradient
              colors={accentGradient}
              style={[styles.logoGradient, shadows.glow]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="sparkles" size={48} color="#FFFFFF" />
            </LinearGradient>
            
            {/* Glow effect */}
            <View style={styles.logoGlow}>
              <LinearGradient
                colors={['#9D4EDD40', '#9D4EDD00']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 0.5, y: 1 }}
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).duration(800)}>
            <Text style={[styles.title, { color: colors.text }]}>
              AROMIXEN
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(800)}>
            <Text style={[styles.tagline, { color: colors.tint }]}>
              ✨ Kişisel Parfüm Uzmanınız ✨
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(700).duration(800)}>
            <ThemedText type="body" center style={[styles.subtitle, { color: colors.textSecondary }]}>
              Cilt tipiniz, kişiliğiniz ve yaşam tarzınıza göre{'\n'}
              mükemmel parfümünüzü keşfedin
            </ThemedText>
          </Animated.View>

          {/* Features Grid */}
          <Animated.View
            entering={FadeInDown.delay(900).duration(800)}
            style={styles.featuresGrid}
          >
            <FeatureCard
              icon="flask-outline"
              emoji="🧪"
              title="pH Analizi"
              subtitle="Cilt kimyanız"
              color="#00D4AA"
              colors={colors}
            />
            <FeatureCard
              icon="person-outline"
              emoji="👤"
              title="Kişilik Testi"
              subtitle="22+ soru"
              color="#9D4EDD"
              colors={colors}
            />
            <FeatureCard
              icon="sparkles-outline"
              emoji="✨"
              title="AI Öneri"
              subtitle="60+ parfüm"
              color="#FF6B9D"
              colors={colors}
            />
          </Animated.View>

          {/* Stats */}
          <Animated.View
            entering={FadeInDown.delay(1000).duration(800)}
            style={[styles.statsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.tint }]}>22+</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Detaylı Soru</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#FF6B9D' }]}>60+</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Parfüm</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#00D4AA' }]}>%97</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Uyum Oranı</Text>
            </View>
          </Animated.View>
        </View>

        {/* Bottom Section */}
        <Animated.View
          entering={FadeInUp.delay(1100).duration(800)}
          style={styles.bottomContainer}
        >
          <LinearGradient
            colors={accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.startButton, shadows.lg]}
          >
            <Button
              title="Keşfetmeye Başla"
              onPress={() => router.push('/onboarding')}
              size="lg"
              fullWidth
              variant="ghost"
              style={{ backgroundColor: 'transparent' }}
              textStyle={{ color: '#FFFFFF', fontWeight: '700' }}
              icon={<Ionicons name="arrow-forward" size={22} color="#FFFFFF" style={{ marginLeft: 8 }} />}
            />
          </LinearGradient>

          <View style={styles.bottomInfo}>
            <View style={styles.bottomInfoItem}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.bottomInfoText, { color: colors.textMuted }]}>~3 dakika</Text>
            </View>
            <View style={[styles.bottomInfoDot, { backgroundColor: colors.textMuted }]} />
            <View style={styles.bottomInfoItem}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.bottomInfoText, { color: colors.textMuted }]}>Ücretsiz</Text>
            </View>
            <View style={[styles.bottomInfoDot, { backgroundColor: colors.textMuted }]} />
            <View style={styles.bottomInfoItem}>
              <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.bottomInfoText, { color: colors.textMuted }]}>Gizli</Text>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

function FeatureCard({ 
  icon, 
  emoji, 
  title, 
  subtitle, 
  color, 
  colors 
}: { 
  icon: keyof typeof Ionicons.glyphMap; 
  emoji: string;
  title: string; 
  subtitle: string;
  color: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.featureIconContainer, { backgroundColor: color + '15' }]}>
        <Text style={styles.featureEmoji}>{emoji}</Text>
      </View>
      <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.featureSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  decorContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  decorOrb: {
    position: 'absolute',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  decorOrb1: {
    width: width * 1.2,
    height: width * 1.2,
    top: -width * 0.4,
    right: -width * 0.3,
  },
  decorOrb2: {
    width: width * 0.9,
    height: width * 0.9,
    bottom: -width * 0.2,
    left: -width * 0.4,
  },
  decorOrb3: {
    width: width * 0.6,
    height: width * 0.6,
    top: height * 0.35,
    right: -width * 0.2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  logoContainer: {
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  logoGradient: {
    width: 110,
    height: 110,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 160,
    height: 80,
    bottom: -30,
    left: -25,
    borderRadius: 80,
    overflow: 'hidden',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 8,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    lineHeight: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  featureCard: {
    width: (width - Spacing.lg * 2 - Spacing.md * 2) / 3,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  featureEmoji: {
    fontSize: 22,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  featureSubtitle: {
    fontSize: 10,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  startButton: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  bottomInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bottomInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bottomInfoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bottomInfoDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
});
