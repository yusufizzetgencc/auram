/**
 * AROMIXEN - Compare Screen
 * 2-3 parfümü yan yana karşılaştır
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { Parfum } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CompareScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  
  const { parfumler, kullaniciPH } = useApp();
  
  // URL'den parfüm ID'lerini al
  const parfumIds = useMemo(() => {
    const ids = params.ids;
    if (typeof ids === 'string') {
      return ids.split(',');
    }
    return Array.isArray(ids) ? ids : [];
  }, [params.ids]);
  
  // Parfümleri bul
  const compareParfums = useMemo(() => {
    return parfumIds
      .map(id => parfumler.find(p => p.id === id))
      .filter((p): p is Parfum => p !== undefined)
      .slice(0, 3);
  }, [parfumIds, parfumler]);

  // Ortak notaları bul
  const commonNotes = useMemo(() => {
    if (compareParfums.length < 2) return [];
    
    const allNotes = compareParfums.map(p => [
      ...p.notalar.ust,
      ...p.notalar.orta,
      ...p.notalar.alt,
    ]);
    
    return allNotes[0].filter(note =>
      allNotes.every(notes => notes.some(n => n.toLowerCase() === note.toLowerCase()))
    );
  }, [compareParfums]);

  // Mevsim örtüşmesi
  const seasonOverlap = useMemo(() => {
    if (compareParfums.length < 2) return [];
    
    const allSeasons = compareParfums.map(p => p.mevsim);
    return allSeasons[0].filter(season =>
      allSeasons.every(seasons => seasons.includes(season))
    );
  }, [compareParfums]);

  if (compareParfums.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.emptyState}>
            <Ionicons name="git-compare-outline" size={64} color={colors.textMuted} />
            <ThemedText type="subtitle" center style={{ marginTop: Spacing.lg }}>
              Karşılaştırılacak parfüm bulunamadı
            </ThemedText>
            <Pressable 
              style={[styles.backButton, { backgroundColor: colors.tint }]}
              onPress={() => router.back()}
            >
              <ThemedText style={{ color: '#FFF', fontWeight: '600' }}>Geri Dön</ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const cardWidth = (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md * (compareParfums.length - 1)) / compareParfums.length;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <ThemedText type="title">Karşılaştırma</ThemedText>
            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              {compareParfums.length} parfüm
            </ThemedText>
          </View>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Parfüm Kartları */}
          <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.cardsRow}>
            {compareParfums.map((parfum, index) => (
              <ParfumCompareCard 
                key={parfum.id}
                parfum={parfum}
                width={cardWidth}
                colors={colors}
                isDark={isDark}
                delay={index * 100}
                userPH={kullaniciPH}
              />
            ))}
          </Animated.View>

          {/* pH Uyum Karşılaştırması */}
          <Animated.View entering={FadeInUp.delay(300).duration(500)}>
            <Card variant="elevated" style={styles.comparisonCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: '#00D4AA20' }]}>
                  <Ionicons name="water" size={20} color="#00D4AA" />
                </View>
                <ThemedText type="heading">pH Uyumu</ThemedText>
              </View>
              
              <View style={styles.phCompare}>
                {compareParfums.map((parfum, index) => {
                  const userPH = kullaniciPH || 5.5;
                  const isIdeal = userPH >= parfum.phUyumu.minPH && userPH <= parfum.phUyumu.maxPH;
                  const phScore = isIdeal 
                    ? Math.round(100 - Math.abs(userPH - parfum.phUyumu.idealPH) * 20)
                    : Math.round(50 - Math.min(Math.abs(userPH - parfum.phUyumu.minPH), Math.abs(userPH - parfum.phUyumu.maxPH)) * 25);
                  
                  return (
                    <View key={parfum.id} style={[styles.phItem, { flex: 1 }]}>
                      <ThemedText type="caption" numberOfLines={1} style={{ textAlign: 'center' }}>
                        {parfum.isim}
                      </ThemedText>
                      <View style={[styles.phScoreBadge, { 
                        backgroundColor: phScore >= 70 ? '#00D4AA20' : phScore >= 50 ? '#FFB02020' : '#FF6B6B20' 
                      }]}>
                        <ThemedText style={[styles.phScoreText, { 
                          color: phScore >= 70 ? '#00D4AA' : phScore >= 50 ? '#FFB020' : '#FF6B6B' 
                        }]}>
                          %{Math.max(0, phScore)}
                        </ThemedText>
                      </View>
                      <ThemedText type="caption" style={{ color: colors.textMuted, fontSize: 10 }}>
                        İdeal: {parfum.phUyumu.idealPH}
                      </ThemedText>
                    </View>
                  );
                })}
              </View>
            </Card>
          </Animated.View>

          {/* Nota Piramitleri */}
          <Animated.View entering={FadeInUp.delay(400).duration(500)}>
            <Card variant="elevated" style={styles.comparisonCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: '#9D4EDD20' }]}>
                  <Ionicons name="layers" size={20} color="#9D4EDD" />
                </View>
                <ThemedText type="heading">Nota Piramitleri</ThemedText>
              </View>
              
              {['ust', 'orta', 'alt'].map((layer) => (
                <View key={layer} style={styles.notaLayer}>
                  <View style={styles.notaLayerHeader}>
                    <View style={[styles.layerBadge, { 
                      backgroundColor: layer === 'ust' ? '#FFD70020' : layer === 'orta' ? '#FF69B420' : '#8B451320' 
                    }]}>
                      <ThemedText style={[styles.layerText, {
                        color: layer === 'ust' ? '#FFD700' : layer === 'orta' ? '#FF69B4' : '#8B4513'
                      }]}>
                        {layer === 'ust' ? '🌸 Üst' : layer === 'orta' ? '💐 Orta' : '🌲 Alt'}
                      </ThemedText>
                    </View>
                  </View>
                  
                  <View style={styles.notaCompareRow}>
                    {compareParfums.map((parfum) => (
                      <View key={parfum.id} style={[styles.notaColumn, { flex: 1 }]}>
                        {parfum.notalar[layer as 'ust' | 'orta' | 'alt'].map((nota, i) => (
                          <View key={i} style={[styles.notaBadge, { backgroundColor: colors.backgroundTertiary }]}>
                            <ThemedText style={styles.notaText} numberOfLines={1}>{nota}</ThemedText>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </Card>
          </Animated.View>

          {/* Ortak Notalar */}
          {commonNotes.length > 0 && (
            <Animated.View entering={FadeInUp.delay(500).duration(500)}>
              <Card variant="elevated" style={styles.comparisonCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: '#4CAF5020' }]}>
                    <Ionicons name="link" size={20} color="#4CAF50" />
                  </View>
                  <ThemedText type="heading">Ortak Notalar</ThemedText>
                </View>
                
                <View style={styles.commonNotesContainer}>
                  {commonNotes.map((nota, index) => (
                    <View key={index} style={[styles.commonNotaBadge, { backgroundColor: '#4CAF5015' }]}>
                      <ThemedText style={{ color: '#4CAF50', fontSize: FontSizes.sm }}>
                        {nota}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </Card>
            </Animated.View>
          )}

          {/* Mevsim Örtüşmesi */}
          <Animated.View entering={FadeInUp.delay(600).duration(500)}>
            <Card variant="elevated" style={styles.comparisonCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: '#FF6B9D20' }]}>
                  <Ionicons name="calendar" size={20} color="#FF6B9D" />
                </View>
                <ThemedText type="heading">Mevsim Uyumu</ThemedText>
              </View>
              
              <View style={styles.seasonsGrid}>
                {['İlkbahar', 'Yaz', 'Sonbahar', 'Kış'].map((season) => {
                  const count = compareParfums.filter(p => p.mevsim.includes(season as any)).length;
                  const isOverlap = count === compareParfums.length;
                  
                  return (
                    <View 
                      key={season} 
                      style={[
                        styles.seasonItem,
                        { 
                          backgroundColor: isOverlap ? '#4CAF5015' : colors.backgroundTertiary,
                          borderColor: isOverlap ? '#4CAF50' : 'transparent',
                          borderWidth: isOverlap ? 1 : 0,
                        }
                      ]}
                    >
                      <ThemedText style={{ fontSize: 20 }}>
                        {season === 'İlkbahar' ? '🌸' : season === 'Yaz' ? '☀️' : season === 'Sonbahar' ? '🍂' : '❄️'}
                      </ThemedText>
                      <ThemedText type="caption">{season}</ThemedText>
                      <ThemedText style={[styles.seasonCount, { 
                        color: isOverlap ? '#4CAF50' : colors.textMuted 
                      }]}>
                        {count}/{compareParfums.length}
                      </ThemedText>
                    </View>
                  );
                })}
              </View>
            </Card>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function ParfumCompareCard({ 
  parfum, 
  width, 
  colors, 
  isDark,
  delay,
  userPH,
}: { 
  parfum: Parfum;
  width: number;
  colors: typeof Colors.light;
  isDark: boolean;
  delay: number;
  userPH: number | null;
}) {
  const tipColors: Record<string, string> = {
    'Odunsu': '#8B4513',
    'Çiçeksi': '#FF69B4',
    'Oryantal': '#DAA520',
    'Ferah': '#87CEEB',
    'Baharatlı': '#FF4500',
    'Aquatik': '#00CED1',
  };

  return (
    <Animated.View 
      entering={FadeIn.delay(delay).duration(400)}
      style={[styles.parfumCard, { width, backgroundColor: colors.card }]}
    >
      {/* Type Badge */}
      <View style={[styles.typeBadge, { backgroundColor: (tipColors[parfum.tip] || colors.tint) + '20' }]}>
        <ThemedText style={[styles.typeText, { color: tipColors[parfum.tip] || colors.tint }]}>
          {parfum.tip}
        </ThemedText>
      </View>
      
      {/* Name & Brand */}
      <ThemedText type="subtitle" numberOfLines={2} style={styles.parfumName}>
        {parfum.isim}
      </ThemedText>
      <ThemedText type="caption" style={{ color: colors.textMuted }} numberOfLines={1}>
        {parfum.marka}
      </ThemedText>
      
      {/* Quick Info */}
      <View style={styles.quickInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
          <ThemedText style={styles.infoText}>{parfum.kalicilik}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="speedometer-outline" size={12} color={colors.textMuted} />
          <ThemedText style={styles.infoText}>{parfum.yogunluk}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={12} color={colors.textMuted} />
          <ThemedText style={styles.infoText}>{parfum.cinsiyet}</ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  backButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  parfumCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  typeText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
  },
  parfumName: {
    fontSize: FontSizes.sm,
    marginBottom: 2,
  },
  quickInfo: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 10,
    opacity: 0.7,
  },
  comparisonCard: {
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
  phCompare: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  phItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  phScoreBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  phScoreText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  notaLayer: {
    marginBottom: Spacing.lg,
  },
  notaLayerHeader: {
    marginBottom: Spacing.sm,
  },
  layerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  layerText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  notaCompareRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  notaColumn: {
    gap: 4,
  },
  notaBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  notaText: {
    fontSize: 10,
    textAlign: 'center',
  },
  commonNotesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  commonNotaBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  seasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  seasonItem: {
    width: '47%',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: 4,
  },
  seasonCount: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
});

