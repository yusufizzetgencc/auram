/**
 * AURAM - Luxury Welcome Screen
 * Premium, elegant ve sophisticated tasarım
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';

const { width, height } = Dimensions.get('window');

// Lüks renk paleti
const LUXURY_COLORS = {
  gold: '#C9A962',
  goldLight: '#E5D4A1',
  goldDark: '#8B7355',
  champagne: '#F7E7CE',
  roseGold: '#B76E79',
  ivory: '#FFFFF0',
  cream: '#FFFDD0',
  midnight: '#0C1222',
  charcoal: '#1A1F2E',
  slate: '#2D3446',
  pearl: '#F5F5F5',
};

// Elegant floating element
function FloatingGlow({ 
  delay, 
  size, 
  color, 
  startX, 
  startY,
  blur = 60,
}: { 
  delay: number; 
  size: number; 
  color: string; 
  startX: number; 
  startY: number;
  blur?: number;
}) {
  const opacity = useSharedValue(0.3);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      )
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) })
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
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX - size / 2,
          top: startY - size / 2,
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

// Animated diamond sparkle
function DiamondSparkle({ x, y, delay, size = 8 }: { x: number; y: number; delay: number; size?: number }) {
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0, { duration: 1500 })
        ),
        -1
      )
    );
    rotation.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration: 6000, easing: Easing.linear }),
        -1
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y }, animatedStyle]}>
      <View style={{
        width: size,
        height: size,
        backgroundColor: LUXURY_COLORS.gold,
        transform: [{ rotate: '45deg' }],
        shadowColor: LUXURY_COLORS.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      }} />
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const { parfumler } = useApp();

  // Elegant pulse animation for logo
  const logoGlow = useSharedValue(0.4);
  const logoScale = useSharedValue(1);
  
  useEffect(() => {
    logoGlow.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, []);

  const logoGlowStyle = useAnimatedStyle(() => ({
    opacity: logoGlow.value,
  }));

  const logoScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Premium Background */}
      <LinearGradient
        colors={isDark 
          ? [LUXURY_COLORS.midnight, LUXURY_COLORS.charcoal, LUXURY_COLORS.slate, LUXURY_COLORS.charcoal]
          : ['#FDFCFA', '#F9F6F0', '#F5F1E8', '#FBF9F5']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle ambient glows */}
      <View style={styles.glowContainer} pointerEvents="none">
        <FloatingGlow delay={0} size={300} color={isDark ? LUXURY_COLORS.gold + '08' : LUXURY_COLORS.gold + '12'} startX={width * 0.8} startY={height * 0.15} />
        <FloatingGlow delay={1500} size={250} color={isDark ? LUXURY_COLORS.roseGold + '06' : LUXURY_COLORS.roseGold + '10'} startX={width * 0.2} startY={height * 0.7} />
        <FloatingGlow delay={800} size={200} color={isDark ? LUXURY_COLORS.champagne + '05' : LUXURY_COLORS.champagne + '15'} startX={width * 0.5} startY={height * 0.4} />
        
        {/* Diamond sparkles */}
        <DiamondSparkle x={width * 0.15} y={height * 0.12} delay={0} size={6} />
        <DiamondSparkle x={width * 0.85} y={height * 0.18} delay={800} size={8} />
        <DiamondSparkle x={width * 0.1} y={height * 0.55} delay={1600} size={5} />
        <DiamondSparkle x={width * 0.9} y={height * 0.45} delay={400} size={7} />
        <DiamondSparkle x={width * 0.5} y={height * 0.08} delay={1200} size={6} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Top decorative line */}
        <Animated.View entering={FadeIn.delay(200).duration(1000)} style={styles.topDecor}>
          <View style={[styles.decorLine, { backgroundColor: LUXURY_COLORS.gold + '40' }]} />
          <View style={[styles.decorDiamond, { backgroundColor: LUXURY_COLORS.gold }]} />
          <View style={[styles.decorLine, { backgroundColor: LUXURY_COLORS.gold + '40' }]} />
        </Animated.View>

        <View style={styles.content}>
          {/* Logo Section */}
          <Animated.View 
            entering={FadeInDown.delay(300).duration(1000).springify()} 
            style={styles.logoSection}
          >
            <Animated.View style={[styles.logoWrapper, logoScaleStyle]}>
              {/* Outer glow ring */}
              <Animated.View style={[styles.logoOuterGlow, logoGlowStyle]} />
              
              {/* Main logo container */}
              <View style={styles.logoContainer}>
            <LinearGradient
                  colors={[LUXURY_COLORS.gold, LUXURY_COLORS.goldDark, LUXURY_COLORS.gold]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
                  style={styles.logoGradient}
            >
                  <View style={styles.logoInner}>
                    <Ionicons name="diamond-outline" size={38} color={isDark ? LUXURY_COLORS.ivory : LUXURY_COLORS.midnight} />
                  </View>
            </LinearGradient>
              </View>
              
              {/* Decorative corner accents */}
              <View style={[styles.cornerAccent, styles.cornerTopLeft, { borderColor: LUXURY_COLORS.gold }]} />
              <View style={[styles.cornerAccent, styles.cornerTopRight, { borderColor: LUXURY_COLORS.gold }]} />
              <View style={[styles.cornerAccent, styles.cornerBottomLeft, { borderColor: LUXURY_COLORS.gold }]} />
              <View style={[styles.cornerAccent, styles.cornerBottomRight, { borderColor: LUXURY_COLORS.gold }]} />
            </Animated.View>
          </Animated.View>

          {/* Brand Name */}
          <Animated.View entering={FadeInDown.delay(500).duration(800)}>
            <ThemedText style={[styles.brandName, { color: isDark ? LUXURY_COLORS.ivory : LUXURY_COLORS.charcoal }]}>
              AURAM
            </ThemedText>
          </Animated.View>

          {/* Elegant tagline */}
          <Animated.View entering={FadeInDown.delay(700).duration(800)} style={styles.taglineWrapper}>
            <View style={[styles.taglineLineLeft, { backgroundColor: LUXURY_COLORS.gold }]} />
            <ThemedText style={[styles.tagline, { color: LUXURY_COLORS.gold }]}>
              LUXURY FRAGRANCE CURATION
            </ThemedText>
            <View style={[styles.taglineLineRight, { backgroundColor: LUXURY_COLORS.gold }]} />
          </Animated.View>

          {/* Main Description */}
          <Animated.View entering={FadeInDown.delay(900).duration(800)} style={styles.descriptionSection}>
            <ThemedText style={[styles.description, { color: isDark ? LUXURY_COLORS.champagne : LUXURY_COLORS.slate }]}>
              Cildinize, kişiliğinize ve yaşam tarzınıza{'\n'}özel olarak tasarlanmış
            </ThemedText>
            <ThemedText style={[styles.descriptionHighlight, { color: LUXURY_COLORS.gold }]}>
              koku deneyimi
            </ThemedText>
          </Animated.View>

          {/* Premium Features */}
          <Animated.View entering={FadeInDown.delay(1100).duration(800)} style={styles.featuresSection}>
            <View style={[styles.featureCard, { backgroundColor: isDark ? 'rgba(201, 169, 98, 0.08)' : 'rgba(201, 169, 98, 0.06)' }]}>
              <FeatureItem 
                icon="finger-print-outline" 
                title="pH Analizi" 
                value="Kişisel"
                isDark={isDark}
              />
              <View style={[styles.featureDivider, { backgroundColor: LUXURY_COLORS.gold + '30' }]} />
              <FeatureItem 
                icon="flask-outline" 
                title="Parfüm" 
                value={`${parfumler.length}+`}
                isDark={isDark}
              />
              <View style={[styles.featureDivider, { backgroundColor: LUXURY_COLORS.gold + '30' }]} />
              <FeatureItem 
                icon="ribbon-outline" 
                title="Uyum" 
                value="%95"
                isDark={isDark}
              />
            </View>
          </Animated.View>

          {/* Trust indicators */}
          <Animated.View entering={FadeInDown.delay(1300).duration(800)} style={styles.trustSection}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark" size={14} color={LUXURY_COLORS.gold} />
              <ThemedText style={[styles.trustText, { color: isDark ? LUXURY_COLORS.champagne + 'AA' : LUXURY_COLORS.slate + 'AA' }]}>
                Premium Koleksiyon
              </ThemedText>
            </View>
            <View style={[styles.trustDot, { backgroundColor: LUXURY_COLORS.gold }]} />
            <View style={styles.trustItem}>
              <Ionicons name="sparkles" size={14} color={LUXURY_COLORS.gold} />
              <ThemedText style={[styles.trustText, { color: isDark ? LUXURY_COLORS.champagne + 'AA' : LUXURY_COLORS.slate + 'AA' }]}>
                AI Destekli
              </ThemedText>
            </View>
          </Animated.View>
        </View>

        {/* Bottom Section */}
        <Animated.View entering={FadeInUp.delay(1500).duration(800)} style={styles.bottomSection}>
          {/* Journey info */}
          <View style={styles.journeyInfo}>
            <View style={styles.journeyItem}>
              <Ionicons name="time-outline" size={16} color={LUXURY_COLORS.gold} />
              <ThemedText style={[styles.journeyText, { color: isDark ? LUXURY_COLORS.champagne : LUXURY_COLORS.slate }]}>
                5 dakika
              </ThemedText>
            </View>
            <ThemedText style={[styles.journeyDivider, { color: LUXURY_COLORS.gold + '60' }]}>•</ThemedText>
            <View style={styles.journeyItem}>
              <Ionicons name="gift-outline" size={16} color={LUXURY_COLORS.gold} />
              <ThemedText style={[styles.journeyText, { color: isDark ? LUXURY_COLORS.champagne : LUXURY_COLORS.slate }]}>
                Ücretsiz
              </ThemedText>
            </View>
          </View>

          {/* Premium CTA Button */}
          <Pressable 
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.ctaButtonPressed,
            ]}
            onPress={() => router.push('/onboarding')}
          >
            <LinearGradient
              colors={[LUXURY_COLORS.gold, LUXURY_COLORS.goldDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <ThemedText style={styles.ctaText}>Deneyimi Başlat</ThemedText>
              <View style={styles.ctaArrow}>
                <Ionicons name="arrow-forward" size={18} color={LUXURY_COLORS.midnight} />
              </View>
            </LinearGradient>
          </Pressable>

          {/* Subtle bottom note */}
          <ThemedText style={[styles.bottomNote, { color: isDark ? LUXURY_COLORS.champagne + '80' : LUXURY_COLORS.slate + '80' }]}>
            10 kategori • 27 soru • Kişiselleştirilmiş sonuçlar
          </ThemedText>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// Feature Item Component
function FeatureItem({ icon, title, value, isDark }: { icon: string; title: string; value: string; isDark: boolean }) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIconBg, { backgroundColor: LUXURY_COLORS.gold + '15' }]}>
        <Ionicons name={icon as any} size={20} color={LUXURY_COLORS.gold} />
      </View>
      <ThemedText style={[styles.featureValue, { color: isDark ? LUXURY_COLORS.ivory : LUXURY_COLORS.charcoal }]}>
        {value}
      </ThemedText>
      <ThemedText style={[styles.featureTitle, { color: isDark ? LUXURY_COLORS.champagne + 'CC' : LUXURY_COLORS.slate + 'CC' }]}>
        {title}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  safeArea: { 
    flex: 1,
  },
  
  // Top Decoration
  topDecor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  decorLine: {
    width: 50,
    height: 1,
  },
  decorDiamond: {
    width: 8,
    height: 8,
    transform: [{ rotate: '45deg' }],
  },
  
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: Spacing.xl,
  },
  
  // Logo Styles
  logoSection: {
    marginBottom: Spacing.xl,
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 140,
  },
  logoOuterGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: LUXURY_COLORS.gold,
  },
  logoContainer: {
    shadowColor: LUXURY_COLORS.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LUXURY_COLORS.goldLight + '40',
  },
  logoInner: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerAccent: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderWidth: 1.5,
  },
  cornerTopLeft: {
    top: 8,
    left: 8,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
  },
  cornerTopRight: {
    top: 8,
    right: 8,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 4,
  },
  cornerBottomLeft: {
    bottom: 8,
    left: 8,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
  },
  cornerBottomRight: {
    bottom: 8,
    right: 8,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 4,
  },
  
  // Brand Name
  brandName: {
    fontSize: 34,
    fontWeight: '300',
    letterSpacing: 14,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  
  // Tagline
  taglineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
  },
  taglineLineLeft: {
    width: 24,
    height: 1,
    marginRight: Spacing.md,
  },
  taglineLineRight: {
    width: 24,
    height: 1,
    marginLeft: Spacing.md,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4,
  },
  
  // Description
  descriptionSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '300',
    marginBottom: Spacing.xs,
  },
  descriptionHighlight: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 2,
  },
  
  // Features
  featuresSection: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: LUXURY_COLORS.gold + '20',
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  featureValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureTitle: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  featureDivider: {
    width: 1,
    height: 50,
  },
  
  // Trust Section
  trustSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  
  // Bottom Section
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.lg,
  },
  journeyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  journeyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  journeyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  journeyDivider: {
    fontSize: 16,
  },
  
  // CTA Button
  ctaButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: LUXURY_COLORS.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  ctaButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg + 2,
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.md,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '600',
    color: LUXURY_COLORS.midnight,
    letterSpacing: 1.5,
  },
  ctaArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(12, 18, 34, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Bottom Note
  bottomNote: {
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 1,
    fontWeight: '400',
  },
});
