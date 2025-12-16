/**
 * AROMIXEN - Keşfet (Home Dashboard)
 * Modern, temiz tasarım
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, FadeInUp, SlideInRight } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { Parfum } from '@/types';
import { fetchWeatherData, getWeatherRecommendation, WeatherData } from '@/services/weather';
import { getDailyRecommendation, getDailyMotivation, DailyRecommendation } from '@/services/dailyRecommendation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TYPE_COLORS: Record<string, string> = {
  'Odunsu': '#8B4513',
  'Çiçeksi': '#E91E8C',
  'Oryantal': '#DAA520',
  'Ferah': '#00B4D8',
  'Baharatlı': '#FF4500',
  'Aquatik': '#00CED1',
};

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  
  const { 
    parfumler, 
    preferences, 
    favorites,
    isFavorite,
    toggleFavoriteParfum,
    addToRecentlyViewedList,
    getFavoriteParfums,
    getRecentlyViewedParfums,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [dailyRec, setDailyRec] = useState<DailyRecommendation | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const motivation = getDailyMotivation();

  // Veri yükle
  const loadData = useCallback(async () => {
    try {
      const weatherData = await fetchWeatherData();
      setWeather(weatherData);
      
      const recommendation = getDailyRecommendation(parfumler, preferences, favorites, weatherData);
      setDailyRec(recommendation);
    } catch (error) {
      console.error('Data load error:', error);
    }
  }, [parfumler, preferences, favorites]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Filtrelenmiş parfümler
  const filteredParfums = useMemo(() => {
    let result = parfumler;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.isim.toLowerCase().includes(query) ||
        p.marka.toLowerCase().includes(query) ||
        p.tip.toLowerCase().includes(query)
      );
    }
    
    if (selectedType) {
      result = result.filter(p => p.tip === selectedType);
    }
    
    return result.slice(0, 20);
  }, [parfumler, searchQuery, selectedType]);

  // Favori ve son görüntülenenler
  const favoriteParfums = getFavoriteParfums().slice(0, 5);
  const recentParfums = getRecentlyViewedParfums().slice(0, 5);

  const handleOpenParfum = (parfum: Parfum) => {
    addToRecentlyViewedList(parfum.id);
    router.push(`/parfum/${parfum.id}`);
  };

  const weatherRec = weather ? getWeatherRecommendation(weather) : null;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
      >
        {/* Header */}
        <SafeAreaView edges={['top']}>
          <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <View style={styles.headerTop}>
              <View style={styles.logoContainer}>
                <LinearGradient colors={['#9D4EDD', '#7B2CBF']} style={styles.logoIcon}>
                  <Ionicons name="sparkles" size={18} color="#FFF" />
                </LinearGradient>
                <ThemedText style={styles.logoText}>AROMIXEN</ThemedText>
            </View>
              <Pressable 
                onPress={() => router.push('/(tabs)/profile')} 
                style={[styles.profileBtn, { backgroundColor: colors.backgroundTertiary }]}
              >
                <Ionicons name="person" size={18} color={colors.text} />
              </Pressable>
            </View>
            
            <View style={styles.greetingSection}>
              <ThemedText style={styles.greetingEmoji}>{motivation.emoji}</ThemedText>
              <ThemedText type="title" style={styles.greetingTitle}>Merhaba!</ThemedText>
              <ThemedText type="body" style={[styles.greetingSubtitle, { color: colors.textMuted }]}>
                {parfumler.length} parfüm seni bekliyor
              </ThemedText>
              </View>
          </Animated.View>
        </SafeAreaView>

        {/* Search Bar */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.searchSection}>
          <View style={[styles.searchBox, { backgroundColor: colors.card }]}>
            <Ionicons name="search-outline" size={20} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Parfüm, nota veya marka ara..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        </Animated.View>

        <View style={styles.content}>
          {/* Weather Widget */}
          {weather && (
            <Animated.View entering={FadeInUp.delay(200).duration(400)}>
              <Card variant="elevated" style={styles.weatherCard}>
                <View style={styles.weatherContent}>
                  <View style={styles.weatherLeft}>
                    <View style={[styles.weatherIconBg, { backgroundColor: isDark ? 'rgba(135,206,235,0.15)' : 'rgba(74,144,217,0.1)' }]}>
                      <Ionicons 
                        name={weather.icon as keyof typeof Ionicons.glyphMap} 
                        size={28} 
                        color={isDark ? '#87CEEB' : '#4A90D9'} 
                      />
                  </View>
                    <View style={styles.weatherInfo}>
                      <View style={styles.weatherTempRow}>
                        <ThemedText style={styles.weatherTemp}>{weather.temperature}°</ThemedText>
                        <ThemedText type="caption" style={[styles.weatherFeels, { color: colors.textMuted }]}>
                          Hissedilen {weather.feelsLike}°
                        </ThemedText>
                      </View>
                      <ThemedText type="caption" style={{ color: colors.textMuted }}>
                        {weather.city} • {weather.description}
                      </ThemedText>
                    </View>
        </View>

                  <View style={styles.weatherRight}>
                    <View style={[styles.weatherBadge, { backgroundColor: 'rgba(157,78,221,0.1)' }]}>
                      <Ionicons name="water-outline" size={12} color="#9D4EDD" />
                      <ThemedText style={[styles.weatherBadgeText, { color: '#9D4EDD' }]}>%{weather.humidity}</ThemedText>
              </View>
                    <View style={[styles.weatherBadge, { backgroundColor: 'rgba(0,180,216,0.1)' }]}>
                      <Ionicons name="speedometer-outline" size={12} color="#00B4D8" />
                      <ThemedText style={[styles.weatherBadgeText, { color: '#00B4D8' }]}>{weather.windSpeed} km/s</ThemedText>
            </View>
            </View>
            </View>
                
                {weatherRec && (
                  <View style={styles.weatherRecommendation}>
                    <ThemedText type="caption" style={[styles.weatherRecLabel, { color: colors.textMuted }]}>
                      Önerilen koku tipleri
                    </ThemedText>
                    <View style={styles.weatherTags}>
                      {weatherRec.scentTypes.slice(0, 3).map((type, i) => (
          <Pressable 
                          key={i} 
                          onPress={() => setSelectedType(type === selectedType ? null : type)}
                          style={[styles.weatherTag, { backgroundColor: (TYPE_COLORS[type] || colors.tint) + '15' }]}
                        >
                          <ThemedText style={[styles.weatherTagText, { color: TYPE_COLORS[type] || colors.tint }]}>
                            {type}
                          </ThemedText>
                </Pressable>
                      ))}
              </View>
                  </View>
                )}
              </Card>
            </Animated.View>
          )}

          {/* Daily Recommendation */}
          {dailyRec && (
            <Animated.View entering={FadeInUp.delay(300).duration(400)}>
              <Pressable onPress={() => handleOpenParfum(dailyRec.parfum)}>
        <LinearGradient
                  colors={['#9D4EDD', '#7B2CBF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.dailyCard}
                >
                  <View style={styles.dailyHeader}>
                    <View style={styles.dailyBadge}>
                      <Ionicons name="sparkles" size={12} color="#FFD700" />
                      <ThemedText style={styles.dailyBadgeText}>Günün Önerisi</ThemedText>
                    </View>
                    <View style={styles.dailyScore}>
                      <ThemedText style={styles.dailyScoreText}>%{dailyRec.matchScore}</ThemedText>
                    </View>
                  </View>
                  
                  <ThemedText style={styles.dailyName}>{dailyRec.parfum.isim}</ThemedText>
                  <ThemedText style={styles.dailyBrand}>{dailyRec.parfum.marka}</ThemedText>
                  
                  <View style={styles.dailyReasons}>
                    {dailyRec.reasons.slice(0, 2).map((reason, i) => (
                      <View key={i} style={styles.dailyReason}>
                        <Ionicons name="checkmark-circle" size={14} color="rgba(255,255,255,0.8)" />
                        <ThemedText style={styles.dailyReasonText}>{reason}</ThemedText>
        </View>
            ))}
          </View>
          
                  <View style={styles.dailyAction}>
                    <ThemedText style={styles.dailyActionText}>İncele</ThemedText>
                    <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.8)" />
          </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* Scent Types */}
          <Animated.View entering={FadeInUp.delay(400).duration(400)}>
            <View style={styles.sectionHeader}>
              <ThemedText type="heading">Koku Aileleri</ThemedText>
              {selectedType && (
                <Pressable onPress={() => setSelectedType(null)}>
                  <ThemedText style={{ color: colors.tint, fontSize: FontSizes.sm }}>Temizle</ThemedText>
        </Pressable>
              )}
      </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.typesContainer}
            >
              {Object.entries(TYPE_COLORS).map(([type, color], index) => {
                const isSelected = selectedType === type;
                const count = parfumler.filter(p => p.tip === type).length;

  return (
                  <Animated.View key={type} entering={SlideInRight.delay(400 + index * 40).duration(300)}>
                    <Pressable
                      onPress={() => setSelectedType(isSelected ? null : type)}
                      style={[styles.typeCard, { 
                        backgroundColor: isSelected ? color : colors.card,
                        borderColor: isSelected ? color : colors.border,
                      }]}
                    >
                      <View style={[styles.typeIcon, { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : color + '15' }]}>
                        <Ionicons name="sparkles" size={18} color={isSelected ? '#FFF' : color} />
              </View>
                      <ThemedText style={[styles.typeName, { color: isSelected ? '#FFF' : colors.text }]}>{type}</ThemedText>
                      <ThemedText style={[styles.typeCount, { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.textMuted }]}>
                        {count}
                      </ThemedText>
        </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Favorites Section */}
          {favoriteParfums.length > 0 && (
            <Animated.View entering={FadeInUp.delay(500).duration(400)}>
              <View style={styles.sectionHeader}>
                <ThemedText type="heading">❤️ Favorilerim</ThemedText>
                <Pressable onPress={() => router.push('/(tabs)/favorites')}>
                  <ThemedText style={{ color: colors.tint, fontSize: FontSizes.sm }}>Tümü</ThemedText>
            </Pressable>
          </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                {favoriteParfums.map((parfum, index) => (
                  <MiniParfumCard
                    key={parfum.id}
                    parfum={parfum}
                    colors={colors}
                    onPress={() => handleOpenParfum(parfum)}
                    delay={index * 40}
                  />
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Recently Viewed */}
          {recentParfums.length > 0 && (
            <Animated.View entering={FadeInUp.delay(600).duration(400)}>
              <View style={styles.sectionHeader}>
                <ThemedText type="heading">🕐 Son Görüntülenen</ThemedText>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                {recentParfums.map((parfum, index) => (
                  <MiniParfumCard
                    key={parfum.id}
                    parfum={parfum}
                colors={colors} 
                    onPress={() => handleOpenParfum(parfum)}
                    delay={index * 40}
                  />
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* All Perfumes Grid */}
          <Animated.View entering={FadeInUp.delay(700).duration(400)}>
            <View style={styles.sectionHeader}>
              <ThemedText type="heading">
                {selectedType ? `${selectedType}` : 'Tüm Parfümler'}
              </ThemedText>
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                {filteredParfums.length} sonuç
              </ThemedText>
                    </View>
            
            <View style={styles.parfumGrid}>
              {filteredParfums.map((parfum, index) => (
                <ParfumCard
                  key={parfum.id}
                  parfum={parfum}
                  colors={colors}
                  isFavorite={isFavorite(parfum.id)}
                  onPress={() => handleOpenParfum(parfum)}
                  onToggleFavorite={() => toggleFavoriteParfum(parfum.id)}
                  delay={index * 30}
                />
                  ))}
                </View>
          </Animated.View>

          <View style={{ height: 120 }} />
        </View>
          </ScrollView>
      </ThemedView>
  );
}

// Mini Parfüm Kartı
function MiniParfumCard({ parfum, colors, onPress, delay = 0 }: {
  parfum: Parfum;
  colors: typeof Colors.light;
  onPress: () => void;
  delay?: number;
}) {
  const typeColor = TYPE_COLORS[parfum.tip] || colors.tint;

  return (
    <Animated.View entering={SlideInRight.delay(delay).duration(300)}>
      <Pressable onPress={onPress}>
        <Card variant="elevated" style={styles.miniCard}>
          <View style={[styles.miniType, { backgroundColor: typeColor + '15' }]}>
            <ThemedText style={[styles.miniTypeText, { color: typeColor }]}>{parfum.tip}</ThemedText>
    </View>
          <ThemedText type="subtitle" numberOfLines={1} style={styles.miniName}>{parfum.isim}</ThemedText>
          <ThemedText type="caption" numberOfLines={1} style={{ color: colors.textMuted }}>{parfum.marka}</ThemedText>
        </Card>
      </Pressable>
    </Animated.View>
  );
}

// Parfüm Kartı (Grid)
function ParfumCard({ parfum, colors, isFavorite, onPress, onToggleFavorite, delay = 0 }: {
  parfum: Parfum;
  colors: typeof Colors.light;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  delay?: number;
}) {
  const typeColor = TYPE_COLORS[parfum.tip] || colors.tint;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)} style={styles.cardWrapper}>
      <Pressable onPress={onPress}>
        <Card variant="elevated" style={styles.parfumCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardType, { backgroundColor: typeColor + '15' }]}>
              <ThemedText style={[styles.cardTypeText, { color: typeColor }]}>{parfum.tip}</ThemedText>
          </View>
            <Pressable onPress={onToggleFavorite} hitSlop={8}>
              <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={20} color={isFavorite ? '#FF6B9D' : colors.textMuted} />
            </Pressable>
      </View>
          
          <ThemedText type="subtitle" numberOfLines={2} style={styles.cardName}>{parfum.isim}</ThemedText>
          <ThemedText type="caption" style={{ color: colors.textMuted }}>{parfum.marka}</ThemedText>
          
          <View style={styles.cardMeta}>
            <View style={styles.cardMetaItem}>
              <Ionicons name="time-outline" size={11} color={colors.textMuted} />
              <ThemedText style={[styles.cardMetaText, { color: colors.textMuted }]}>{parfum.kalicilik}</ThemedText>
    </View>
            <View style={styles.cardMetaItem}>
              <Ionicons name="speedometer-outline" size={11} color={colors.textMuted} />
              <ThemedText style={[styles.cardMetaText, { color: colors.textMuted }]}>{parfum.yogunluk}</ThemedText>
            </View>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
  logoText: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, letterSpacing: 1 },
  profileBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  greetingSection: { marginBottom: Spacing.md },
  greetingEmoji: { fontSize: 28, marginBottom: Spacing.xs },
  greetingTitle: { fontSize: FontSizes['2xl'], marginBottom: 2 },
  greetingSubtitle: { fontSize: FontSizes.sm },
  searchSection: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.xl, gap: Spacing.sm },
  searchInput: { flex: 1, fontSize: FontSizes.base },
  content: { paddingHorizontal: Spacing.xl },
  weatherCard: { marginBottom: Spacing.lg, padding: Spacing.lg },
  weatherContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  weatherLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  weatherIconBg: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  weatherInfo: { flex: 1 },
  weatherTempRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  weatherTemp: { fontSize: 28, fontWeight: FontWeights.bold },
  weatherFeels: { fontSize: FontSizes.xs },
  weatherRight: { gap: Spacing.xs },
  weatherBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full, gap: 4 },
  weatherBadgeText: { fontSize: 11, fontWeight: FontWeights.semiBold },
  weatherRecommendation: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  weatherRecLabel: { fontSize: FontSizes.xs, marginBottom: Spacing.sm },
  weatherTags: { flexDirection: 'row', gap: Spacing.sm },
  weatherTag: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  weatherTagText: { fontSize: FontSizes.sm, fontWeight: FontWeights.semiBold },
  dailyCard: { padding: Spacing.lg, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg },
  dailyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  dailyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, gap: 4 },
  dailyBadgeText: { color: '#FFF', fontSize: 11, fontWeight: FontWeights.semiBold },
  dailyScore: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  dailyScoreText: { color: '#FFF', fontSize: FontSizes.sm, fontWeight: FontWeights.bold },
  dailyName: { color: '#FFF', fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
  dailyBrand: { color: 'rgba(255,255,255,0.7)', fontSize: FontSizes.sm, marginBottom: Spacing.sm },
  dailyReasons: { gap: 4, marginBottom: Spacing.md },
  dailyReason: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dailyReasonText: { color: 'rgba(255,255,255,0.9)', fontSize: FontSizes.sm },
  dailyAction: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 4 },
  dailyActionText: { color: 'rgba(255,255,255,0.8)', fontSize: FontSizes.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md, marginTop: Spacing.sm },
  typesContainer: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  typeCard: { width: 90, padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center', borderWidth: 1 },
  typeIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xs },
  typeName: { fontSize: FontSizes.xs, fontWeight: FontWeights.semiBold, marginBottom: 2 },
  typeCount: { fontSize: 10 },
  horizontalList: { gap: Spacing.md, paddingBottom: Spacing.sm },
  miniCard: { width: 130, padding: Spacing.md },
  miniType: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: Spacing.xs },
  miniTypeText: { fontSize: 9, fontWeight: FontWeights.bold },
  miniName: { fontSize: FontSizes.sm, marginBottom: 2 },
  parfumGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  cardWrapper: { width: (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md) / 2 },
  parfumCard: { padding: Spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  cardType: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  cardTypeText: { fontSize: 9, fontWeight: FontWeights.bold },
  cardName: { fontSize: FontSizes.sm, marginBottom: 2, minHeight: 36 },
  cardMeta: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)' },
  cardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardMetaText: { fontSize: 10 },
});
