/**
 * AROMIXEN - Layering Suggestions
 * Parfüm katmanlama önerileri
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { BorderRadius, Colors, FontSizes, FontWeights, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LayeringRule, Parfum } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// Katmanlama kuralları
const LAYERING_RULES: LayeringRule[] = [
  {
    baseType: 'Odunsu',
    compatibleTypes: ['Oryantal', 'Baharatlı', 'Amber', 'Deri'],
    incompatibleTypes: ['Aquatik', 'Ferah'],
    tips: ['Alt notalar birbirini tamamlar', 'Derin ve karmaşık bir iz bırakır'],
  },
  {
    baseType: 'Çiçeksi',
    compatibleTypes: ['Tatlı', 'Meyvemsi', 'Pudralı', 'Yeşil'],
    incompatibleTypes: ['Deri', 'Baharatlı'],
    tips: ['Romantik ve feminen bir etki', 'Yumuşak geçişler sağlar'],
  },
  {
    baseType: 'Oryantal',
    compatibleTypes: ['Odunsu', 'Baharatlı', 'Amber', 'Tatlı'],
    incompatibleTypes: ['Ferah', 'Aquatik'],
    tips: ['Egzotik ve çekici', 'Gece için mükemmel'],
  },
  {
    baseType: 'Ferah',
    compatibleTypes: ['Aquatik', 'Yeşil', 'Meyvemsi', 'Çiçeksi'],
    incompatibleTypes: ['Oryantal', 'Deri'],
    tips: ['Tazelik katar', 'Yaz için ideal'],
  },
  {
    baseType: 'Baharatlı',
    compatibleTypes: ['Odunsu', 'Oryantal', 'Deri', 'Amber'],
    incompatibleTypes: ['Çiçeksi', 'Aquatik'],
    tips: ['Sıcak ve dikkat çekici', 'Kış için mükemmel'],
  },
  {
    baseType: 'Aquatik',
    compatibleTypes: ['Ferah', 'Yeşil', 'Meyvemsi'],
    incompatibleTypes: ['Oryantal', 'Baharatlı', 'Odunsu'],
    tips: ['Deniz esintisi', 'Yaz için ferahlatıcı'],
  },
  {
    baseType: 'Tatlı',
    compatibleTypes: ['Çiçeksi', 'Oryantal', 'Amber', 'Meyvemsi'],
    incompatibleTypes: ['Aquatik', 'Yeşil'],
    tips: ['Gurme ve çekici', 'Akşam için ideal'],
  },
  {
    baseType: 'Amber',
    compatibleTypes: ['Odunsu', 'Oryantal', 'Tatlı', 'Baharatlı'],
    incompatibleTypes: ['Aquatik', 'Ferah'],
    tips: ['Sıcak ve sarmalayıcı', 'Kalıcılığı artırır'],
  },
];

// Katmanlama İpuçları
const LAYERING_TIPS = [
  {
    icon: '🎯',
    title: 'Hafiften Ağıra',
    description: 'Önce hafif kokuyu, sonra yoğun kokuyu sıkın',
  },
  {
    icon: '⏰',
    title: 'Zamanlama',
    description: 'İlk koku kuruduktan sonra ikincisini uygulayın',
  },
  {
    icon: '💧',
    title: 'Az Daha Çok',
    description: 'Her parfümden normal dozun yarısını kullanın',
  },
  {
    icon: '🎨',
    title: 'Aynı Aile',
    description: 'Ortak notaları olan parfümleri tercih edin',
  },
  {
    icon: '🔬',
    title: 'Test Edin',
    description: 'Önce bileğinizde deneyin, sonra karar verin',
  },
];

export default function LayeringScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { parfumler, getFavoriteParfums, addToRecentlyViewedList } = useApp();

  const [selectedBase, setSelectedBase] = useState<Parfum | null>(null);
  const [suggestions, setSuggestions] = useState<{ parfum: Parfum; score: number; reasons: string[] }[]>([]);
  const [showTips, setShowTips] = useState(true);

  const favoriteParfums = getFavoriteParfums();

  // Katmanlama önerilerini hesapla
  const calculateLayeringSuggestions = (baseParfum: Parfum) => {
    const rule = LAYERING_RULES.find(r => r.baseType === baseParfum.tip);
    
    const scored = parfumler
      .filter(p => p.id !== baseParfum.id)
      .map(parfum => {
        let score = 0;
        const reasons: string[] = [];

        // Uyumlu tip kontrolü
        if (rule?.compatibleTypes.includes(parfum.tip)) {
          score += 40;
          reasons.push(`${parfum.tip} tipi ${baseParfum.tip} ile uyumlu`);
        }

        // İkincil tip uyumu
        if (parfum.ikincilTip && rule?.compatibleTypes.includes(parfum.ikincilTip)) {
          score += 20;
          reasons.push('İkincil tip uyumu');
        }

        // Uyumsuz tip cezası
        if (rule?.incompatibleTypes.includes(parfum.tip)) {
          score -= 50;
        }

        // Ortak notalar
        const baseNotes = [...baseParfum.notalar.orta, ...baseParfum.notalar.alt];
        const layerNotes = [...parfum.notalar.ust, ...parfum.notalar.orta];
        const commonNotes = baseNotes.filter(note => 
          layerNotes.some(ln => ln.toLowerCase().includes(note.toLowerCase()) || 
                                note.toLowerCase().includes(ln.toLowerCase()))
        );
        
        if (commonNotes.length > 0) {
          score += commonNotes.length * 15;
          reasons.push(`Ortak notalar: ${commonNotes.slice(0, 2).join(', ')}`);
        }

        // Yoğunluk dengesi
        if (baseParfum.yogunluk === 'yogun' && parfum.yogunluk === 'hafif') {
          score += 10;
          reasons.push('Yoğunluk dengesi iyi');
        } else if (baseParfum.yogunluk === 'hafif' && parfum.yogunluk === 'yogun') {
          score += 10;
          reasons.push('Yoğunluk dengesi iyi');
        }

        // Aynı mevsim
        const commonSeasons = (baseParfum.mevsim || []).filter(s => (parfum.mevsim || []).includes(s));
        if (commonSeasons.length > 0) {
          score += 10;
        }

        return { parfum, score, reasons };
      })
      .filter(item => item.score > 20)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    setSuggestions(scored);
    setShowTips(false);
  };

  const handleSelectBase = (parfum: Parfum) => {
    setSelectedBase(parfum);
    calculateLayeringSuggestions(parfum);
  };

  const handleParfumPress = (parfum: Parfum) => {
    addToRecentlyViewedList(parfum.id);
    router.push(`/parfum/${parfum.id}`);
  };

  const currentRule = selectedBase ? LAYERING_RULES.find(r => r.baseType === selectedBase.tip) : null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <ThemedText type="title">Katmanlama</ThemedText>
            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              Parfüm kombinasyonları
            </ThemedText>
          </View>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Seçili Parfüm veya Seçim */}
          <Animated.View entering={FadeInUp.delay(100).duration(400)}>
            {selectedBase ? (
              <Card variant="elevated" style={styles.selectedCard}>
                <View style={styles.selectedHeader}>
                  <View style={[styles.selectedIcon, { 
                    backgroundColor: (TYPE_COLORS[selectedBase.tip] || colors.tint) + '15' 
                  }]}>
                    <Ionicons name="layers" size={24} color={TYPE_COLORS[selectedBase.tip] || colors.tint} />
                  </View>
                  <View style={styles.selectedInfo}>
                    <ThemedText type="caption" style={{ color: colors.textMuted }}>
                      Baz Parfüm
                    </ThemedText>
                    <ThemedText type="heading">{selectedBase.isim}</ThemedText>
                    <View style={[styles.typeBadge, { backgroundColor: (TYPE_COLORS[selectedBase.tip] || colors.tint) + '15' }]}>
                      <ThemedText style={{ color: TYPE_COLORS[selectedBase.tip] || colors.tint, fontSize: FontSizes.sm }}>
                        {selectedBase.tip}
                      </ThemedText>
                    </View>
                  </View>
                  <Pressable 
                    onPress={() => { setSelectedBase(null); setSuggestions([]); setShowTips(true); }}
                    style={[styles.changeBtn, { backgroundColor: colors.backgroundTertiary }]}
                  >
                    <Ionicons name="swap-horizontal" size={20} color={colors.text} />
                  </Pressable>
                </View>

                {/* Uyumlu Tipler */}
                {currentRule && (
                  <View style={styles.compatibilitySection}>
                    <ThemedText type="caption" style={{ color: colors.textMuted, marginBottom: Spacing.sm }}>
                      Uyumlu Koku Tipleri
                    </ThemedText>
                    <View style={styles.compatibleTypes}>
                      {currentRule.compatibleTypes.map((type) => (
                        <View 
                          key={type} 
                          style={[styles.compatibleType, { backgroundColor: (TYPE_COLORS[type] || colors.tint) + '15' }]}
                        >
                          <ThemedText style={{ color: TYPE_COLORS[type] || colors.tint, fontSize: FontSizes.xs }}>
                            {type}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </Card>
            ) : (
              <Card variant="elevated" style={styles.selectPrompt}>
                <LinearGradient
                  colors={['#9D4EDD', '#7B2CBF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.promptGradient}
                >
                  <Ionicons name="layers" size={40} color="#FFF" />
                  <ThemedText style={styles.promptTitle}>Baz Parfüm Seç</ThemedText>
                  <ThemedText style={styles.promptDesc}>
                    Katmanlama için önce ana parfümünü seç
                  </ThemedText>
                </LinearGradient>
              </Card>
            )}
          </Animated.View>

          {/* Öneriler */}
          {suggestions.length > 0 && (
            <Animated.View entering={FadeInUp.delay(200).duration(400)}>
              <ThemedText type="heading" style={styles.sectionTitle}>
                Önerilen Katmanlar
              </ThemedText>
              <View style={styles.suggestionsGrid}>
                {suggestions.map((item, index) => (
                  <Animated.View 
                    key={item.parfum.id}
                    entering={SlideInRight.delay(index * 80).duration(400)}
                  >
                    <Pressable onPress={() => handleParfumPress(item.parfum)}>
                      <Card variant="elevated" style={styles.suggestionCard}>
                        <View style={styles.suggestionHeader}>
                          <View style={[styles.suggestionIcon, { 
                            backgroundColor: (TYPE_COLORS[item.parfum.tip] || colors.tint) + '15' 
                          }]}>
                            <Ionicons 
                              name="sparkles" 
                              size={18} 
                              color={TYPE_COLORS[item.parfum.tip] || colors.tint} 
                            />
                          </View>
                          <View style={styles.scoreCircle}>
                            <ThemedText style={styles.scoreText}>
                              {Math.min(100, item.score)}%
                            </ThemedText>
                          </View>
                        </View>
                        
                        <ThemedText type="subtitle" numberOfLines={1} style={styles.suggestionName}>
                          {item.parfum.isim}
                        </ThemedText>
                        <ThemedText type="caption" style={{ color: colors.textMuted }} numberOfLines={1}>
                          {item.parfum.marka}
                        </ThemedText>
                        
                        <View style={[styles.suggestionType, { 
                          backgroundColor: (TYPE_COLORS[item.parfum.tip] || colors.tint) + '10' 
                        }]}>
                          <ThemedText style={{ 
                            color: TYPE_COLORS[item.parfum.tip] || colors.tint, 
                            fontSize: 10 
                          }}>
                            {item.parfum.tip}
                          </ThemedText>
                        </View>

                        {item.reasons.length > 0 && (
                          <View style={styles.reasonsList}>
                            {item.reasons.slice(0, 2).map((reason, i) => (
                              <View key={i} style={styles.reasonItem}>
                                <Ionicons name="checkmark" size={10} color={colors.tint} />
                                <ThemedText style={styles.reasonText} numberOfLines={1}>
                                  {reason}
                                </ThemedText>
                              </View>
                            ))}
                          </View>
                        )}
                      </Card>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Katmanlama İpuçları */}
          {showTips && (
            <Animated.View entering={FadeInUp.delay(200).duration(400)}>
              <ThemedText type="heading" style={styles.sectionTitle}>
                Katmanlama İpuçları
              </ThemedText>
              <View style={styles.tipsGrid}>
                {LAYERING_TIPS.map((tip, index) => (
                  <Animated.View 
                    key={tip.title}
                    entering={FadeIn.delay(index * 100).duration(400)}
                  >
                    <Card variant="elevated" style={styles.tipCard}>
                      <ThemedText style={styles.tipEmoji}>{tip.icon}</ThemedText>
                      <ThemedText type="subtitle" style={styles.tipTitle}>
                        {tip.title}
                      </ThemedText>
                      <ThemedText type="caption" style={{ color: colors.textMuted, textAlign: 'center' }}>
                        {tip.description}
                      </ThemedText>
                    </Card>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Parfüm Seçimi */}
          {!selectedBase && (
            <>
              {/* Favoriler */}
              {favoriteParfums.length > 0 && (
                <Animated.View entering={FadeInUp.delay(300).duration(400)}>
                  <ThemedText type="heading" style={styles.sectionTitle}>
                    ❤️ Favorilerimden Seç
                  </ThemedText>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                  >
                    {favoriteParfums.slice(0, 8).map((parfum, index) => (
                      <Animated.View 
                        key={parfum.id}
                        entering={SlideInRight.delay(index * 50).duration(300)}
                      >
                        <Pressable onPress={() => handleSelectBase(parfum)}>
                          <Card variant="elevated" style={styles.selectCard}>
                            <View style={[styles.selectCardIcon, { 
                              backgroundColor: (TYPE_COLORS[parfum.tip] || colors.tint) + '15' 
                            }]}>
                              <Ionicons 
                                name="sparkles" 
                                size={18} 
                                color={TYPE_COLORS[parfum.tip] || colors.tint} 
                              />
                            </View>
                            <ThemedText type="subtitle" numberOfLines={1} style={styles.selectCardName}>
                              {parfum.isim}
                            </ThemedText>
                            <ThemedText type="caption" style={{ color: colors.textMuted }}>
                              {parfum.tip}
                            </ThemedText>
                          </Card>
                        </Pressable>
                      </Animated.View>
                    ))}
                  </ScrollView>
                </Animated.View>
              )}

              {/* Tip'e göre grupla */}
              <Animated.View entering={FadeInUp.delay(400).duration(400)}>
                <ThemedText type="heading" style={styles.sectionTitle}>
                  Koku Tipine Göre
                </ThemedText>
                <View style={styles.typeGrid}>
                  {Object.entries(TYPE_COLORS).slice(0, 6).map(([type, color]) => {
                    const count = parfumler.filter(p => p.tip === type).length;
                    if (count === 0) return null;
                    
                    return (
                      <Pressable 
                        key={type}
                        onPress={() => {
                          const first = parfumler.find(p => p.tip === type);
                          if (first) handleSelectBase(first);
                        }}
                        style={[styles.typeCard, { backgroundColor: color + '15' }]}
                      >
                        <Ionicons name="sparkles" size={20} color={color} />
                        <ThemedText style={{ color, fontWeight: '600', marginTop: 4 }}>
                          {type}
                        </ThemedText>
                        <ThemedText type="caption" style={{ color: colors.textMuted }}>
                          {count} parfüm
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
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
  content: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  selectedCard: {
    marginBottom: Spacing.lg,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  selectedInfo: {
    flex: 1,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  changeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compatibilitySection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  compatibleTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  compatibleType: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  selectPrompt: {
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    padding: 0,
  },
  promptGradient: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  promptTitle: {
    color: '#FFF',
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginTop: Spacing.md,
  },
  promptDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  suggestionCard: {
    width: (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md) / 2,
    padding: Spacing.md,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCircle: {
    backgroundColor: 'rgba(157,78,221,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  scoreText: {
    color: '#9D4EDD',
    fontSize: 11,
    fontWeight: FontWeights.bold,
  },
  suggestionName: {
    fontSize: FontSizes.sm,
    marginBottom: 2,
  },
  suggestionType: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: Spacing.sm,
  },
  reasonsList: {
    marginTop: Spacing.sm,
    gap: 2,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reasonText: {
    fontSize: 9,
    color: '#666',
    flex: 1,
  },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  tipCard: {
    width: (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md) / 2,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  tipEmoji: {
    fontSize: 28,
    marginBottom: Spacing.sm,
  },
  tipTitle: {
    fontSize: FontSizes.sm,
    marginBottom: 4,
    textAlign: 'center',
  },
  horizontalList: {
    gap: Spacing.md,
    paddingRight: Spacing.xl,
  },
  selectCard: {
    width: 120,
    padding: Spacing.md,
    alignItems: 'center',
  },
  selectCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  selectCardName: {
    fontSize: FontSizes.xs,
    textAlign: 'center',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  typeCard: {
    width: (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md * 2) / 3,
    padding: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
});


