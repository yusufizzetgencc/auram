/**
 * AROMIXEN - Mood Tracker
 * Ruh haline göre parfüm önerileri
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { BorderRadius, Colors, FontSizes, FontWeights, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { addMoodEntry, getTodaysMood } from '@/services/storage';
import { MoodParfumMatch, MoodType, Parfum } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mood tanımlamaları
const MOODS: MoodParfumMatch[] = [
  {
    mood: 'enerjik',
    emoji: '⚡',
    label: 'Enerjik',
    description: 'Dinamik, aktif ve canlı',
    colors: ['#FF6B6B', '#FF8E53'],
    scentTypes: ['Ferah', 'Aquatik', 'Meyvemsi'],
    characteristics: ['canlı', 'taze', 'enerjik', 'dinamik'],
  },
  {
    mood: 'romantik',
    emoji: '💕',
    label: 'Romantik',
    description: 'Duygusal ve çekici',
    colors: ['#FF6B9D', '#C44569'],
    scentTypes: ['Çiçeksi', 'Oryantal', 'Tatlı'],
    characteristics: ['çekici', 'feminen', 'zarif', 'romantik'],
  },
  {
    mood: 'profesyonel',
    emoji: '💼',
    label: 'Profesyonel',
    description: 'Ciddi ve güvenilir',
    colors: ['#667eea', '#764ba2'],
    scentTypes: ['Odunsu', 'Ferah', 'Deri'],
    characteristics: ['profesyonel', 'güçlü', 'sofistike', 'karakterli'],
  },
  {
    mood: 'rahat',
    emoji: '☁️',
    label: 'Rahat',
    description: 'Huzurlu ve sakin',
    colors: ['#a8edea', '#fed6e3'],
    scentTypes: ['Yeşil', 'Ferah', 'Pudralı'],
    characteristics: ['rahatlatıcı', 'huzur', 'temiz', 'günlük'],
  },
  {
    mood: 'gizemli',
    emoji: '🌙',
    label: 'Gizemli',
    description: 'Derin ve büyüleyici',
    colors: ['#2C3E50', '#4A00E0'],
    scentTypes: ['Oryantal', 'Baharatlı', 'Amber'],
    characteristics: ['gizemli', 'seksi', 'büyüleyici', 'koyu'],
  },
  {
    mood: 'cesur',
    emoji: '🔥',
    label: 'Cesur',
    description: 'Dikkat çekici ve güçlü',
    colors: ['#FF4500', '#FF6347'],
    scentTypes: ['Baharatlı', 'Deri', 'Odunsu'],
    characteristics: ['güçlü', 'cesur', 'maskülen', 'dikkat çekici'],
  },
  {
    mood: 'mutlu',
    emoji: '✨',
    label: 'Mutlu',
    description: 'Neşeli ve pozitif',
    colors: ['#FFD93D', '#FF9A3C'],
    scentTypes: ['Meyvemsi', 'Çiçeksi', 'Ferah'],
    characteristics: ['canlı', 'taze', 'neşeli', 'eğlenceli'],
  },
  {
    mood: 'sakin',
    emoji: '🧘',
    label: 'Sakin',
    description: 'Meditatif ve dengeli',
    colors: ['#00D4AA', '#00B4D8'],
    scentTypes: ['Yeşil', 'Odunsu', 'Amber'],
    characteristics: ['zen', 'sakin', 'doğal', 'derin'],
  },
];

export default function MoodTrackerScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const { parfumler, preferences, addToRecentlyViewedList } = useApp();

  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [recommendations, setRecommendations] = useState<Parfum[]>([]);
  const [todaysMood, setTodaysMood] = useState<MoodType | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Bugünün mood'unu kontrol et
  useEffect(() => {
    async function checkTodaysMood() {
      const entry = await getTodaysMood();
      if (entry) {
        setTodaysMood(entry.mood);
      }
    }
    checkTodaysMood();
  }, []);

  // Mood seçildiğinde önerileri hesapla
  const handleMoodSelect = async (mood: MoodType) => {
    setSelectedMood(mood);
    
    const moodData = MOODS.find(m => m.mood === mood);
    if (!moodData) return;

    // Uygun parfümleri filtrele ve skorla
    const scored = parfumler
      .filter(p => {
        // Cinsiyet kontrolü
        if (preferences.cinsiyet && p.cinsiyet !== preferences.cinsiyet && p.cinsiyet !== 'unisex') {
          return false;
        }
        return true;
      })
      .map(parfum => {
        let score = 0;
        
        // Koku tipi uyumu
        if (moodData.scentTypes.includes(parfum.tip)) {
          score += 30;
        }
        if (parfum.ikincilTip && moodData.scentTypes.includes(parfum.ikincilTip)) {
          score += 15;
        }
        
        // Etiket uyumu
        const matchingTags = (parfum.etiketler || []).filter(tag => 
          moodData.characteristics.some(c => tag.toLowerCase().includes(c.toLowerCase()))
        );
        score += matchingTags.length * 10;
        
        // Kişilik tipi uyumu
        if (parfum.kisilikTipi) {
          const kisilikMap: Record<MoodType, string[]> = {
            'enerjik': ['dinamik'],
            'romantik': ['romantik', 'sofistike'],
            'profesyonel': ['sofistike'],
            'rahat': ['dogal'],
            'gizemli': ['mistik', 'cesur'],
            'cesur': ['cesur', 'dinamik'],
            'mutlu': ['dinamik', 'dogal'],
            'sakin': ['dogal', 'sofistike'],
          };
          
          const matchingPersonality = parfum.kisilikTipi.filter(k => 
            kisilikMap[mood]?.includes(k)
          );
          score += matchingPersonality.length * 15;
        }
        
        return { parfum, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(item => item.parfum);

    setRecommendations(scored);
    setShowResults(true);

    // Mood kaydını yap
    const today = new Date().toISOString().split('T')[0];
    await addMoodEntry({
      mood,
      date: today,
    });
    setTodaysMood(mood);
  };

  const handleParfumSelect = (parfum: Parfum) => {
    addToRecentlyViewedList(parfum.id);
    router.push(`/parfum/${parfum.id}`);
  };

  const selectedMoodData = MOODS.find(m => m.mood === selectedMood);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <ThemedText type="title">Mood Tracker</ThemedText>
            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              Bugün nasıl hissediyorsun?
            </ThemedText>
          </View>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Bugünün Mood'u */}
          {todaysMood && !showResults && (
            <Animated.View entering={FadeIn.duration(500)}>
              <Card variant="elevated" style={styles.todayCard}>
                <View style={styles.todayContent}>
                  <ThemedText style={styles.todayEmoji}>
                    {MOODS.find(m => m.mood === todaysMood)?.emoji}
                  </ThemedText>
                  <View style={styles.todayInfo}>
                    <ThemedText type="caption" style={{ color: colors.textMuted }}>
                      Bugünkü ruh halin
                    </ThemedText>
                    <ThemedText type="heading">
                      {MOODS.find(m => m.mood === todaysMood)?.label}
                    </ThemedText>
                  </View>
                  <Pressable 
                    onPress={() => setTodaysMood(null)}
                    style={[styles.changeBtn, { backgroundColor: colors.tint + '15' }]}
                  >
                    <ThemedText style={{ color: colors.tint, fontSize: FontSizes.sm }}>
                      Değiştir
                    </ThemedText>
                  </Pressable>
                </View>
              </Card>
            </Animated.View>
          )}

          {/* Mood Seçimi */}
          {!showResults && (
            <Animated.View entering={FadeInUp.delay(100).duration(500)}>
              <View style={styles.moodGrid}>
                {MOODS.map((mood, index) => (
                  <MoodCard 
                    key={mood.mood}
                    mood={mood}
                    isSelected={selectedMood === mood.mood}
                    onSelect={() => handleMoodSelect(mood.mood)}
                    delay={index * 50}
                    colors={colors}
                  />
                ))}
              </View>
            </Animated.View>
          )}

          {/* Sonuçlar */}
          {showResults && selectedMoodData && (
            <Animated.View entering={FadeInUp.duration(500)}>
              {/* Seçilen Mood */}
              <Pressable onPress={() => setShowResults(false)}>
                <LinearGradient
                  colors={selectedMoodData.colors as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.selectedMoodCard}
                >
                  <View style={styles.selectedMoodHeader}>
                    <ThemedText style={styles.selectedMoodEmoji}>
                      {selectedMoodData.emoji}
                    </ThemedText>
                    <View style={styles.selectedMoodInfo}>
                      <ThemedText style={styles.selectedMoodLabel}>
                        {selectedMoodData.label}
                      </ThemedText>
                      <ThemedText style={styles.selectedMoodDesc}>
                        {selectedMoodData.description}
                      </ThemedText>
                    </View>
                    <View style={styles.changeMoodBtn}>
                      <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.8)" />
                    </View>
                  </View>
                  
                  <View style={styles.scentTypeTags}>
                    {selectedMoodData.scentTypes.map((type) => (
                      <View key={type} style={styles.scentTypeTag}>
                        <ThemedText style={styles.scentTypeText}>{type}</ThemedText>
                      </View>
                    ))}
                  </View>
                </LinearGradient>
              </Pressable>

              {/* Öneriler */}
              <View style={styles.recommendationsSection}>
                <ThemedText type="heading" style={styles.sectionTitle}>
                  Sana Özel Öneriler
                </ThemedText>
                <ThemedText type="body" style={{ color: colors.textMuted, marginBottom: Spacing.lg }}>
                  {selectedMoodData.label} ruh haline uygun {recommendations.length} parfüm
                </ThemedText>

                {recommendations.length === 0 ? (
                  <Card variant="elevated" style={styles.noResults}>
                    <Ionicons name="search-outline" size={48} color={colors.textMuted} />
                    <ThemedText type="subtitle" center style={{ marginTop: Spacing.md }}>
                      Uygun parfüm bulunamadı
                    </ThemedText>
                  </Card>
                ) : (
                  <View style={styles.recommendationsGrid}>
                    {recommendations.map((parfum, index) => (
                      <RecommendationCard
                        key={parfum.id}
                        parfum={parfum}
                        moodColors={selectedMoodData.colors}
                        colors={colors}
                        onPress={() => handleParfumSelect(parfum)}
                        delay={index * 60}
                      />
                    ))}
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// Mood Kartı
function MoodCard({ 
  mood, 
  isSelected, 
  onSelect, 
  delay,
  colors,
}: { 
  mood: MoodParfumMatch;
  isSelected: boolean;
  onSelect: () => void;
  delay: number;
  colors: typeof Colors.light;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );
    onSelect();
  };

  return (
    <Animated.View 
      entering={FadeInUp.delay(delay).duration(400)}
      style={[styles.moodCardWrapper, animatedStyle]}
    >
      <Pressable onPress={handlePress}>
        <LinearGradient
          colors={(isSelected ? mood.colors : [colors.card, colors.card]) as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.moodCard,
            isSelected && styles.moodCardSelected,
          ]}
        >
          <ThemedText style={styles.moodEmoji}>{mood.emoji}</ThemedText>
          <ThemedText 
            style={[
              styles.moodLabel, 
              { color: isSelected ? '#FFF' : colors.text }
            ]}
          >
            {mood.label}
          </ThemedText>
          <ThemedText 
            style={[
              styles.moodDesc, 
              { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.textMuted }
            ]}
            numberOfLines={2}
          >
            {mood.description}
          </ThemedText>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// Öneri Kartı
function RecommendationCard({
  parfum,
  moodColors,
  colors,
  onPress,
  delay,
}: {
  parfum: Parfum;
  moodColors: string[];
  colors: typeof Colors.light;
  onPress: () => void;
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(400)}>
      <Pressable onPress={onPress}>
        <Card variant="elevated" style={styles.recCard}>
          <View style={[styles.recIcon, { backgroundColor: moodColors[0] + '20' }]}>
            <Ionicons name="sparkles" size={20} color={moodColors[0]} />
          </View>
          <ThemedText type="subtitle" numberOfLines={1} style={styles.recName}>
            {parfum.isim}
          </ThemedText>
          <ThemedText type="caption" numberOfLines={1} style={{ color: colors.textMuted }}>
            {parfum.marka}
          </ThemedText>
          <View style={[styles.recType, { backgroundColor: moodColors[0] + '15' }]}>
            <ThemedText style={{ color: moodColors[0], fontSize: 10, fontWeight: '600' }}>
              {parfum.tip}
            </ThemedText>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
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
  todayCard: {
    marginBottom: Spacing.xl,
  },
  todayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  todayEmoji: {
    fontSize: 40,
  },
  todayInfo: {
    flex: 1,
  },
  changeBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  moodCardWrapper: {
    width: (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md) / 2,
  },
  moodCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  moodCardSelected: {
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  moodEmoji: {
    fontSize: 36,
    marginBottom: Spacing.sm,
  },
  moodLabel: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    marginBottom: 4,
  },
  moodDesc: {
    fontSize: FontSizes.xs,
    textAlign: 'center',
  },
  selectedMoodCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
  },
  selectedMoodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  selectedMoodEmoji: {
    fontSize: 48,
    marginRight: Spacing.md,
  },
  selectedMoodInfo: {
    flex: 1,
  },
  selectedMoodLabel: {
    color: '#FFF',
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  selectedMoodDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSizes.sm,
  },
  changeMoodBtn: {
    padding: Spacing.sm,
  },
  scentTypeTags: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  scentTypeTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  scentTypeText: {
    color: '#FFF',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  recommendationsSection: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  noResults: {
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  recommendationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  recCard: {
    width: (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md) / 2,
    padding: Spacing.md,
  },
  recIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  recName: {
    fontSize: FontSizes.sm,
    marginBottom: 2,
  },
  recType: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: Spacing.sm,
  },
});


