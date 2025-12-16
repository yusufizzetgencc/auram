/**
 * AROMIXEN - Parfum Detail Screen
 * Detaylı parfüm analizi sayfası
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  FadeIn,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, Button } from '@/components/ui';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { Parfum, KokuTipi } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NotaTab = 'ust' | 'orta' | 'alt';

export default function ParfumDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  
  const [activeNotaTab, setActiveNotaTab] = useState<NotaTab>('ust');
  
  const { 
    parfumler, 
    kullaniciPH, 
    preferences,
    isFavorite,
    toggleFavoriteParfum,
    addToRecentlyViewedList,
  } = useApp();
  
  // Parfümü bul
  const parfum = useMemo(() => {
    const found = parfumler.find(p => p.id === id);
    if (found) {
      // Son görüntülenenlere ekle
      addToRecentlyViewedList(found.id);
    }
    return found;
  }, [id, parfumler]);

  // pH skoru hesapla
  const phScore = useMemo(() => {
    if (!parfum || !kullaniciPH) return null;
    
    const userPH = kullaniciPH;
    const isIdeal = userPH >= parfum.phUyumu.minPH && userPH <= parfum.phUyumu.maxPH;
    const score = isIdeal 
      ? Math.round(100 - Math.abs(userPH - parfum.phUyumu.idealPH) * 20)
      : Math.round(50 - Math.min(Math.abs(userPH - parfum.phUyumu.minPH), Math.abs(userPH - parfum.phUyumu.maxPH)) * 25);
    
    return Math.max(0, Math.min(100, score));
  }, [parfum, kullaniciPH]);

  // Nota performansları
  const notaPerformans = useMemo(() => {
    if (!parfum || !kullaniciPH) return { ust: 70, orta: 70, alt: 70 };
    
    const isAsidik = kullaniciPH < 5.0;
    const isBazik = kullaniciPH > 6.0;
    
    let ust = 70, orta = 70, alt = 70;
    
    if (isAsidik) {
      ust += parfum.notaKalicilik.ust.asidikCilt * 30;
      orta += parfum.notaKalicilik.orta.asidikCilt * 30;
      alt += parfum.notaKalicilik.alt.asidikCilt * 30;
    } else if (isBazik) {
      ust += parfum.notaKalicilik.ust.bazikCilt * 30;
      orta += parfum.notaKalicilik.orta.bazikCilt * 30;
      alt += parfum.notaKalicilik.alt.bazikCilt * 30;
    }
    
    return {
      ust: Math.min(100, Math.max(0, Math.round(ust))),
      orta: Math.min(100, Math.max(0, Math.round(orta))),
      alt: Math.min(100, Math.max(0, Math.round(alt))),
    };
  }, [parfum, kullaniciPH]);

  // Benzer parfümler
  const similarParfums = useMemo(() => {
    if (!parfum) return [];
    
    return parfumler
      .filter(p => 
        p.id !== parfum.id && 
        (p.tip === parfum.tip || p.ikincilTip === parfum.tip)
      )
      .slice(0, 4);
  }, [parfum, parfumler]);

  // Paylaş
  const handleShare = async () => {
    if (!parfum) return;
    
    try {
      await Share.share({
        title: `${parfum.isim} - AROMIXEN`,
        message: `${parfum.marka} ${parfum.isim} - ${parfum.tip} koku ailesi. AROMIXEN'de keşfet!`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  if (!parfum) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={colors.textMuted} />
            <ThemedText type="subtitle" center style={{ marginTop: Spacing.lg }}>
              Parfüm bulunamadı
            </ThemedText>
            <Button 
              title="Geri Dön" 
              onPress={() => router.back()} 
              style={{ marginTop: Spacing.xl }}
            />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const tipColors: Record<string, string> = {
    'Odunsu': '#8B4513',
    'Çiçeksi': '#FF69B4',
    'Oryantal': '#DAA520',
    'Ferah': '#87CEEB',
    'Baharatlı': '#FF4500',
    'Aquatik': '#00CED1',
  };

  const tipColor = tipColors[parfum.tip] || colors.tint;
  const isFav = isFavorite(parfum.id);

  return (
    <ThemedView style={styles.container}>
      {/* Header Gradient */}
      <LinearGradient
        colors={[tipColor + '30', 'transparent']}
        style={styles.headerGradient}
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable 
              onPress={() => toggleFavoriteParfum(parfum.id)} 
              style={[styles.headerBtn, { backgroundColor: colors.card }]}
            >
              <Ionicons 
                name={isFav ? 'heart' : 'heart-outline'} 
                size={22} 
                color={isFav ? '#FF6B9D' : colors.text} 
              />
            </Pressable>
            <Pressable onPress={handleShare} style={[styles.headerBtn, { backgroundColor: colors.card }]}>
              <Ionicons name="share-outline" size={22} color={colors.text} />
            </Pressable>
          </View>
        </Animated.View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Title Section */}
          <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.titleSection}>
            <View style={[styles.typeBadge, { backgroundColor: tipColor + '20' }]}>
              <ThemedText style={[styles.typeText, { color: tipColor }]}>
                {parfum.tip}
              </ThemedText>
            </View>
            
            <ThemedText type="title" style={styles.parfumName}>
              {parfum.isim}
            </ThemedText>
            <ThemedText type="subtitle" style={{ color: colors.textMuted }}>
              {parfum.marka}
            </ThemedText>
          </Animated.View>

          {/* pH Performance Card */}
          <Animated.View entering={FadeInUp.delay(200).duration(500)}>
            <Card variant="elevated" style={styles.phCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: '#00D4AA20' }]}>
                  <Ionicons name="analytics" size={20} color="#00D4AA" />
                </View>
                <ThemedText type="heading">pH Performansı</ThemedText>
              </View>
              
              {phScore !== null ? (
                <>
                  {/* pH Score Circle */}
                  <View style={styles.phScoreContainer}>
                    <View style={[styles.phScoreCircle, { borderColor: phScore >= 70 ? '#00D4AA' : phScore >= 50 ? '#FFB020' : '#FF6B6B' }]}>
                      <ThemedText style={[styles.phScoreValue, { color: phScore >= 70 ? '#00D4AA' : phScore >= 50 ? '#FFB020' : '#FF6B6B' }]}>
                        {phScore}
                      </ThemedText>
                      <ThemedText type="caption">Uyum</ThemedText>
                    </View>
                    
                    <View style={styles.phDetails}>
                      <View style={styles.phDetailRow}>
                        <ThemedText type="body">pH Aralığı:</ThemedText>
                        <ThemedText type="subtitle">{parfum.phUyumu.minPH} - {parfum.phUyumu.maxPH}</ThemedText>
                      </View>
                      <View style={styles.phDetailRow}>
                        <ThemedText type="body">İdeal pH:</ThemedText>
                        <ThemedText type="subtitle">{parfum.phUyumu.idealPH}</ThemedText>
                      </View>
                      <View style={styles.phDetailRow}>
                        <ThemedText type="body">Senin pH:</ThemedText>
                        <ThemedText type="subtitle">{kullaniciPH?.toFixed(1)}</ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* Nota Performance Bars */}
                  <View style={styles.notaPerformans}>
                    <ThemedText type="label" style={{ marginBottom: Spacing.md }}>
                      Cildinizde Nota Performansı
                    </ThemedText>
                    
                    {(['ust', 'orta', 'alt'] as const).map((layer) => (
                      <View key={layer} style={styles.performansRow}>
                        <ThemedText style={styles.performansLabel}>
                          {layer === 'ust' ? '🌸 Üst' : layer === 'orta' ? '💐 Orta' : '🌲 Alt'}
                        </ThemedText>
                        <View style={styles.performansBarBg}>
                          <Animated.View 
                            entering={SlideInRight.delay(300 + (['ust', 'orta', 'alt'].indexOf(layer) * 100)).duration(600)}
                            style={[
                              styles.performansBar, 
                              { 
                                width: `${notaPerformans[layer]}%`,
                                backgroundColor: tipColor,
                              }
                            ]} 
                          />
                        </View>
                        <ThemedText style={styles.performansValue}>{notaPerformans[layer]}%</ThemedText>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <View style={styles.noPHData}>
                  <Ionicons name="information-circle-outline" size={24} color={colors.textMuted} />
                  <ThemedText type="body" center style={{ color: colors.textMuted, marginTop: Spacing.sm }}>
                    pH testini tamamlayın, kişisel performans analizi görün
                  </ThemedText>
                </View>
              )}
            </Card>
          </Animated.View>

          {/* Nota Piramidi */}
          <Animated.View entering={FadeInUp.delay(300).duration(500)}>
            <Card variant="elevated" style={styles.notaCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: '#9D4EDD20' }]}>
                  <Ionicons name="layers" size={20} color="#9D4EDD" />
                </View>
                <ThemedText type="heading">Nota Piramidi</ThemedText>
              </View>
              
              {/* Tabs */}
              <View style={styles.notaTabs}>
                {(['ust', 'orta', 'alt'] as const).map((tab) => (
                  <Pressable
                    key={tab}
                    onPress={() => setActiveNotaTab(tab)}
                    style={[
                      styles.notaTab,
                      activeNotaTab === tab && { backgroundColor: tipColor + '20' }
                    ]}
                  >
                    <ThemedText style={[
                      styles.notaTabText,
                      { color: activeNotaTab === tab ? tipColor : colors.textMuted }
                    ]}>
                      {tab === 'ust' ? '🌸 Üst' : tab === 'orta' ? '💐 Orta' : '🌲 Alt'}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
              
              {/* Nota List */}
              <View style={styles.notaList}>
                {parfum.notalar[activeNotaTab].map((nota, index) => (
                  <Animated.View 
                    key={nota}
                    entering={FadeIn.delay(index * 50).duration(300)}
                    style={[styles.notaItem, { backgroundColor: tipColor + '10' }]}
                  >
                    <ThemedText style={{ color: tipColor }}>{nota}</ThemedText>
                  </Animated.View>
                ))}
              </View>
              
              {/* Nota Info */}
              <View style={styles.notaInfo}>
                <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
                <ThemedText type="caption" style={{ color: colors.textMuted, flex: 1 }}>
                  {activeNotaTab === 'ust' 
                    ? 'İlk 15-30 dakika hissedilen notalar' 
                    : activeNotaTab === 'orta'
                    ? '30 dakika - 3 saat arası baskın notalar'
                    : '3 saatten sonra kalıcı olan notalar'}
                </ThemedText>
              </View>
            </Card>
          </Animated.View>

          {/* Özellikler Grid */}
          <Animated.View entering={FadeInUp.delay(400).duration(500)}>
            <Card variant="elevated" style={styles.featuresCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: '#FF6B9D20' }]}>
                  <Ionicons name="options" size={20} color="#FF6B9D" />
                </View>
                <ThemedText type="heading">Özellikler</ThemedText>
              </View>
              
              <View style={styles.featuresGrid}>
                <FeatureItem icon="speedometer-outline" label="Yoğunluk" value={parfum.yogunluk} colors={colors} />
                <FeatureItem icon="time-outline" label="Kalıcılık" value={parfum.kalicilik} colors={colors} />
                <FeatureItem icon="leaf-outline" label="Mevsim" value={parfum.mevsim.join(', ')} colors={colors} />
                <FeatureItem icon="person-outline" label="Cinsiyet" value={parfum.cinsiyet} colors={colors} />
                <FeatureItem icon="briefcase-outline" label="Kullanım" value={parfum.kullanimAmaci.join(', ')} colors={colors} />
                <FeatureItem icon="flask-outline" label="Konsantrasyon" value={parfum.konsantrasyon} colors={colors} />
              </View>
            </Card>
          </Animated.View>

          {/* Benzer Parfümler */}
          {similarParfums.length > 0 && (
            <Animated.View entering={FadeInUp.delay(500).duration(500)}>
              <View style={styles.sectionHeader}>
                <ThemedText type="heading">Benzer Parfümler</ThemedText>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.similarList}
              >
                {similarParfums.map((p, index) => (
                  <Pressable 
                    key={p.id}
                    onPress={() => router.push(`/parfum/${p.id}`)}
                  >
                    <Animated.View 
                      entering={FadeIn.delay(index * 100).duration(400)}
                      style={[styles.similarCard, { backgroundColor: colors.card }]}
                    >
                      <View style={[styles.similarType, { backgroundColor: (tipColors[p.tip] || colors.tint) + '20' }]}>
                        <ThemedText style={{ color: tipColors[p.tip] || colors.tint, fontSize: 10 }}>
                          {p.tip}
                        </ThemedText>
                      </View>
                      <ThemedText type="subtitle" numberOfLines={1} style={{ fontSize: FontSizes.sm }}>
                        {p.isim}
                      </ThemedText>
                      <ThemedText type="caption" numberOfLines={1} style={{ color: colors.textMuted }}>
                        {p.marka}
                      </ThemedText>
                    </Animated.View>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function FeatureItem({ 
  icon, 
  label, 
  value, 
  colors 
}: { 
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: colors.backgroundTertiary }]}>
        <Ionicons name={icon} size={18} color={colors.tint} />
      </View>
      <ThemedText type="caption" style={{ color: colors.textMuted }}>{label}</ThemedText>
      <ThemedText type="body" style={{ fontWeight: '600', textTransform: 'capitalize' }} numberOfLines={2}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  titleSection: {
    marginBottom: Spacing.xl,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  typeText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  parfumName: {
    fontSize: FontSizes['3xl'],
    marginBottom: Spacing.xs,
  },
  phCard: {
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  phScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  phScoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phScoreValue: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  phDetails: {
    flex: 1,
    gap: Spacing.sm,
  },
  phDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notaPerformans: {
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  performansRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  performansLabel: {
    width: 60,
    fontSize: FontSizes.sm,
  },
  performansBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  performansBar: {
    height: '100%',
    borderRadius: 4,
  },
  performansValue: {
    width: 40,
    fontSize: FontSizes.sm,
    textAlign: 'right',
  },
  noPHData: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  notaCard: {
    marginBottom: Spacing.lg,
  },
  notaTabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  notaTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  notaTabText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  notaList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  notaItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  notaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  featuresCard: {
    marginBottom: Spacing.lg,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  featureItem: {
    width: '47%',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: 4,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  similarList: {
    paddingRight: Spacing.xl,
    gap: Spacing.md,
  },
  similarCard: {
    width: 140,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  similarType: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
});

