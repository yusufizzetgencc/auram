/**
 * AROMIXEN - Spin The Wheel
 * Parfüm çarkı - Rastgele öneri
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Pressable, Dimensions, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp,
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import Svg, { Path, G, Text as SvgText, Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, Button } from '@/components/ui';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { Parfum } from '@/types';
import { addSpinResult } from '@/services/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WHEEL_SIZE = SCREEN_WIDTH - 80;
const WHEEL_RADIUS = WHEEL_SIZE / 2;

const TYPE_COLORS: Record<string, string> = {
  'Odunsu': '#8B4513',
  'Çiçeksi': '#E91E8C',
  'Oryantal': '#DAA520',
  'Ferah': '#00B4D8',
  'Baharatlı': '#FF4500',
  'Aquatik': '#00CED1',
  'Tatlı': '#FF69B4',
  'Amber': '#D4A574',
  'Meyvemsi': '#FF6B6B',
  'Yeşil': '#4CAF50',
  'Deri': '#6B4423',
  'Pudralı': '#DDA0DD',
};

const WHEEL_COLORS = [
  '#FF6B6B', '#FFD93D', '#00B4D8', '#9D4EDD', 
  '#FF69B4', '#27AE60', '#E91E8C', '#DAA520',
];

type SourceType = 'all' | 'favorites' | 'recent';

export default function SpinScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { parfumler, getFavoriteParfums, getRecentlyViewedParfums, addToRecentlyViewedList } = useApp();

  const [source, setSource] = useState<SourceType>('all');
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<Parfum | null>(null);
  const [spinCount, setSpinCount] = useState(0);

  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const resultOpacity = useSharedValue(0);

  // Kaynak parfümleri
  const sourceParfums = useMemo(() => {
    switch (source) {
      case 'favorites':
        return getFavoriteParfums();
      case 'recent':
        return getRecentlyViewedParfums();
      default:
        return parfumler;
    }
  }, [source, parfumler, getFavoriteParfums, getRecentlyViewedParfums]);

  // Çarkta gösterilecek parfümler (max 8)
  const wheelParfums = useMemo(() => {
    const shuffled = [...sourceParfums].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 8);
  }, [sourceParfums, spinCount]);

  const handleSpin = () => {
    if (isSpinning || wheelParfums.length === 0) return;

    setIsSpinning(true);
    setResult(null);
    resultOpacity.value = 0;

    // Rastgele sonuç seç
    const randomIndex = Math.floor(Math.random() * wheelParfums.length);
    const selectedParfum = wheelParfums[randomIndex];

    // Açı hesaplama
    const segmentAngle = 360 / wheelParfums.length;
    const targetAngle = 360 - (randomIndex * segmentAngle) - (segmentAngle / 2);
    const totalRotation = 360 * 5 + targetAngle; // 5 tur + hedef açı

    // Animasyon
    scale.value = withSequence(
      withSpring(1.05),
      withSpring(1)
    );

    rotation.value = withTiming(
      rotation.value + totalRotation,
      {
        duration: 4000,
        easing: Easing.bezier(0.2, 0.9, 0.1, 1),
      },
      (finished) => {
        if (finished) {
          runOnJS(onSpinComplete)(selectedParfum);
        }
      }
    );

    // Titreşim
    Vibration.vibrate(50);
  };

  const onSpinComplete = async (parfum: Parfum) => {
    setIsSpinning(false);
    setResult(parfum);
    
    // Animasyon
    resultOpacity.value = withSpring(1);
    scale.value = withSequence(
      withSpring(1.1),
      withSpring(1)
    );

    // Titreşim
    Vibration.vibrate([0, 100, 50, 100]);

    // Kaydet
    await addSpinResult(parfum.id);
  };

  const handleResultPress = () => {
    if (result) {
      addToRecentlyViewedList(result.id);
      router.push(`/parfum/${result.id}`);
    }
  };

  const handleSpinAgain = () => {
    setResult(null);
    setSpinCount(prev => prev + 1);
    resultOpacity.value = 0;
    // Yeni parfümlerle çarkı güncelle
  };

  const animatedWheelStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const animatedResultStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
    transform: [
      { scale: interpolate(resultOpacity.value, [0, 1], [0.8, 1], Extrapolate.CLAMP) },
    ],
  }));

  // Çark segment'ı oluştur
  const createWheelPath = (index: number, total: number) => {
    const angle = 360 / total;
    const startAngle = index * angle;
    const endAngle = startAngle + angle;
    
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = WHEEL_RADIUS + WHEEL_RADIUS * Math.cos(startRad);
    const y1 = WHEEL_RADIUS + WHEEL_RADIUS * Math.sin(startRad);
    const x2 = WHEEL_RADIUS + WHEEL_RADIUS * Math.cos(endRad);
    const y2 = WHEEL_RADIUS + WHEEL_RADIUS * Math.sin(endRad);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    return `M ${WHEEL_RADIUS} ${WHEEL_RADIUS} L ${x1} ${y1} A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </Pressable>
          <View style={styles.headerCenter}>
            <ThemedText style={styles.headerTitle}>Parfüm Çarkı</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Şansına güven!
            </ThemedText>
          </View>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* Kaynak Seçimi */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.sourceContainer}>
          {[
            { id: 'all', label: 'Tümü', icon: 'grid' },
            { id: 'favorites', label: 'Favoriler', icon: 'heart' },
            { id: 'recent', label: 'Son Görüntülenen', icon: 'time' },
          ].map((item) => (
            <Pressable
              key={item.id}
              onPress={() => { setSource(item.id as SourceType); setSpinCount(prev => prev + 1); }}
              style={[
                styles.sourceBtn,
                source === item.id && styles.sourceBtnActive,
              ]}
            >
              <Ionicons 
                name={item.icon as any} 
                size={16} 
                color={source === item.id ? '#FFD93D' : 'rgba(255,255,255,0.6)'} 
              />
              <ThemedText style={[
                styles.sourceBtnText,
                source === item.id ? styles.sourceBtnTextActive : {},
              ]}>
                {item.label}
              </ThemedText>
            </Pressable>
          ))}
        </Animated.View>

        {/* Çark Alanı */}
        <View style={styles.wheelContainer}>
          {wheelParfums.length === 0 ? (
            <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
              <Ionicons name="alert-circle" size={48} color="rgba(255,255,255,0.5)" />
              <ThemedText style={styles.emptyText}>
                Bu kaynakta parfüm bulunamadı
              </ThemedText>
              <Pressable 
                onPress={() => setSource('all')}
                style={styles.emptyBtn}
              >
                <ThemedText style={{ color: '#FFD93D' }}>Tümünü Göster</ThemedText>
              </Pressable>
            </Animated.View>
          ) : (
            <>
              {/* Pointer */}
              <View style={styles.pointer}>
                <Ionicons name="caret-down" size={40} color="#FFD93D" />
              </View>

              {/* Wheel */}
              <Animated.View style={[styles.wheel, animatedWheelStyle]}>
                <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
                  <G>
                    {wheelParfums.map((parfum, index) => {
                      const color = WHEEL_COLORS[index % WHEEL_COLORS.length];
                      const angle = 360 / wheelParfums.length;
                      const midAngle = (index * angle + angle / 2 - 90) * Math.PI / 180;
                      const textRadius = WHEEL_RADIUS * 0.65;
                      const textX = WHEEL_RADIUS + textRadius * Math.cos(midAngle);
                      const textY = WHEEL_RADIUS + textRadius * Math.sin(midAngle);
                      const textRotation = index * angle + angle / 2;

                      return (
                        <G key={parfum.id}>
                          <Path
                            d={createWheelPath(index, wheelParfums.length)}
                            fill={color}
                            stroke="#FFF"
                            strokeWidth={2}
                          />
                          <SvgText
                            x={textX}
                            y={textY}
                            fill="#FFF"
                            fontSize={10}
                            fontWeight="bold"
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                          >
                            {parfum.isim.length > 12 
                              ? parfum.isim.substring(0, 12) + '...' 
                              : parfum.isim}
                          </SvgText>
                        </G>
                      );
                    })}
                    <Circle
                      cx={WHEEL_RADIUS}
                      cy={WHEEL_RADIUS}
                      r={30}
                      fill="#1a1a2e"
                      stroke="#FFD93D"
                      strokeWidth={3}
                    />
                  </G>
                </Svg>
              </Animated.View>

              {/* Center Button */}
              <Pressable 
                onPress={handleSpin}
                disabled={isSpinning}
                style={styles.spinButton}
              >
                <LinearGradient
                  colors={isSpinning ? ['#666', '#444'] : ['#FFD93D', '#FF9500']}
                  style={styles.spinButtonGradient}
                >
                  <ThemedText style={styles.spinButtonText}>
                    {isSpinning ? '🎰' : 'ÇEVİR'}
                  </ThemedText>
                </LinearGradient>
              </Pressable>
            </>
          )}
        </View>

        {/* Sonuç */}
        {result && (
          <Animated.View style={[styles.resultContainer, animatedResultStyle]}>
            <Pressable onPress={handleResultPress}>
              <Card variant="elevated" style={styles.resultCard}>
                <LinearGradient
                  colors={['rgba(255,217,61,0.2)', 'rgba(157,78,221,0.2)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.resultGradient}
                >
                  <View style={styles.resultHeader}>
                    <ThemedText style={styles.resultEmoji}>🎉</ThemedText>
                    <ThemedText style={styles.resultLabel}>
                      Bugünkü Şansın!
                    </ThemedText>
                  </View>
                  
                  <View style={styles.resultContent}>
                    <View style={[styles.resultIcon, { 
                      backgroundColor: (TYPE_COLORS[result.tip] || '#9D4EDD') + '30' 
                    }]}>
                      <Ionicons 
                        name="sparkles" 
                        size={28} 
                        color={TYPE_COLORS[result.tip] || '#9D4EDD'} 
                      />
                    </View>
                    <View style={styles.resultInfo}>
                      <ThemedText style={styles.resultName}>{result.isim}</ThemedText>
                      <ThemedText style={styles.resultBrand}>{result.marka}</ThemedText>
                      <View style={[styles.resultType, { backgroundColor: (TYPE_COLORS[result.tip] || '#9D4EDD') + '20' }]}>
                        <ThemedText style={{ color: TYPE_COLORS[result.tip] || '#9D4EDD', fontSize: 11 }}>
                          {result.tip}
                        </ThemedText>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.5)" />
                  </View>
                </LinearGradient>
              </Card>
            </Pressable>

            {/* Tekrar Çevir */}
            <Pressable onPress={handleSpinAgain} style={styles.spinAgainBtn}>
              <Ionicons name="refresh" size={18} color="#FFD93D" />
              <ThemedText style={styles.spinAgainText}>Tekrar Çevir</ThemedText>
            </Pressable>
          </Animated.View>
        )}

        {/* Alt Bilgi */}
        {!result && (
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle" size={16} color="rgba(255,255,255,0.5)" />
              <ThemedText style={styles.infoText}>
                Çark her seferinde farklı {wheelParfums.length} parfüm gösterir
              </ThemedText>
            </View>
          </Animated.View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSizes.sm,
  },
  sourceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sourceBtnActive: {
    backgroundColor: 'rgba(255,217,61,0.2)',
    borderWidth: 1,
    borderColor: '#FFD93D',
  },
  sourceBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSizes.sm,
  },
  sourceBtnTextActive: {
    color: '#FFD93D',
  },
  wheelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,217,61,0.2)',
  },
  pointer: {
    position: 'absolute',
    top: -10,
    zIndex: 10,
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  spinButton: {
    position: 'absolute',
    zIndex: 10,
  },
  spinButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD93D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  spinButtonText: {
    color: '#1a1a2e',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  resultContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  resultCard: {
    overflow: 'hidden',
    padding: 0,
  },
  resultGradient: {
    padding: Spacing.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  resultEmoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  resultLabel: {
    color: '#FFD93D',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    color: '#FFF',
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  resultBrand: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSizes.sm,
  },
  resultType: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  spinAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
  },
  spinAgainText: {
    color: '#FFD93D',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  infoContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  infoText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSizes.sm,
  },
});


