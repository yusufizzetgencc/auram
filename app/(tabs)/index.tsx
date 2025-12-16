/**
 * AROMIXEN - Ana Sayfa (Dashboard)
 * Hava durumu, günün önerisi, koku aileleri, favoriler, son görüntülenenler
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { BorderRadius, Colors, FontSizes, FontWeights, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DailyRecommendation, getDailyMotivation, getDailyRecommendation } from '@/services/dailyRecommendation';
import { fetchWeatherData, getWeatherRecommendation, WeatherData } from '@/services/weather';
import { Parfum } from '@/types';

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
    addToRecentlyViewedList,
    getFavoriteParfums,
    getRecentlyViewedParfums,
  } = useApp();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [dailyRec, setDailyRec] = useState<DailyRecommendation | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const motivation = getDailyMotivation();

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

  const favoriteParfums = getFavoriteParfums().slice(0, 6);
  const recentParfums = getRecentlyViewedParfums().slice(0, 6);

  const handleOpenParfum = (parfum: Parfum) => {
    addToRecentlyViewedList(parfum.id);
    router.push(`/parfum/${parfum.id}`);
  };

  const weatherRec = weather ? getWeatherRecommendation(weather) : null;

  // Koku aileleri ve sayıları
  const scentFamilies = Object.entries(TYPE_COLORS).map(([type, color]) => ({
    type,
    color,
    count: parfumler.filter(p => p.tip === type).length,
  }));

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
              <ThemedText type="body" style={{ color: colors.textMuted }}>
                {parfumler.length} parfüm seni bekliyor
              </ThemedText>
            </View>
          </Animated.View>
        </SafeAreaView>

        <View style={styles.content}>
          {/* Quick Actions */}
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.quickActions}>
                <Pressable 
              onPress={() => router.push('/(tabs)/parfums')} 
              style={[styles.quickAction, { backgroundColor: '#9D4EDD15' }]}
            >
              <Ionicons name="flask" size={22} color="#9D4EDD" />
              <ThemedText style={[styles.quickActionText, { color: '#9D4EDD' }]}>Parfümleri Keşfet</ThemedText>
                </Pressable>
                <Pressable 
              onPress={() => router.push('/(tabs)/favorites')} 
              style={[styles.quickAction, { backgroundColor: '#FF6B9D15' }]}
            >
              <Ionicons name="heart" size={22} color="#FF6B9D" />
              <ThemedText style={[styles.quickActionText, { color: '#FF6B9D' }]}>Favorilerim</ThemedText>
            </Pressable>
          </Animated.View>

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
                        <ThemedText type="caption" style={{ color: colors.textMuted }}>
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
                      <ThemedText style={{ color: '#9D4EDD', fontSize: 11, fontWeight: '600' }}>%{weather.humidity}</ThemedText>
            </View>
                    <View style={[styles.weatherBadge, { backgroundColor: 'rgba(0,180,216,0.1)' }]}>
                      <Ionicons name="speedometer-outline" size={12} color="#00B4D8" />
                      <ThemedText style={{ color: '#00B4D8', fontSize: 11, fontWeight: '600' }}>{weather.windSpeed} km/s</ThemedText>
                  </View>
        </View>
              </View>
                
                {weatherRec && (
                  <View style={styles.weatherRecommendation}>
                    <ThemedText type="caption" style={{ color: colors.textMuted, marginBottom: Spacing.sm }}>
                      Bugün için önerilen koku tipleri
              </ThemedText>
                    <View style={styles.weatherTags}>
                      {weatherRec.scentTypes.slice(0, 3).map((type, i) => (
              <Pressable 
                          key={i} 
                          onPress={() => router.push('/(tabs)/parfums')}
                          style={[styles.weatherTag, { backgroundColor: (TYPE_COLORS[type] || colors.tint) + '15' }]}
              >
                          <ThemedText style={{ color: TYPE_COLORS[type] || colors.tint, fontSize: FontSizes.sm, fontWeight: '600' }}>
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

          {/* Scent Families */}
          <Animated.View entering={FadeInUp.delay(400).duration(400)}>
            <View style={styles.sectionHeader}>
              <ThemedText type="heading">Koku Aileleri</ThemedText>
              <Pressable onPress={() => router.push('/(tabs)/parfums')}>
                <ThemedText style={{ color: colors.tint, fontSize: FontSizes.sm }}>Tümünü Gör</ThemedText>
            </Pressable>
          </View>

          <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.typesContainer}
            >
              {scentFamilies.map(({ type, color, count }, index) => (
                <Animated.View key={type} entering={SlideInRight.delay(400 + index * 40).duration(300)}>
                  <Pressable
                    onPress={() => router.push('/(tabs)/parfums')}
                    style={[styles.typeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={[styles.typeIcon, { backgroundColor: color + '15' }]}>
                      <Ionicons name="sparkles" size={18} color={color} />
              </View>
                    <ThemedText style={styles.typeName}>{type}</ThemedText>
                    <ThemedText style={[styles.typeCount, { color: colors.textMuted }]}>{count} parfüm</ThemedText>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Favorites Section */}
          {favoriteParfums.length > 0 && (
            <Animated.View entering={FadeInUp.delay(500).duration(400)}>
              <View style={styles.sectionHeader}>
                <ThemedText type="heading">❤️ Favorilerim</ThemedText>
                <Pressable onPress={() => router.push('/(tabs)/favorites')}>
                  <ThemedText style={{ color: colors.tint, fontSize: FontSizes.sm }}>Tümü ({favorites.length})</ThemedText>
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

          {/* Stats Summary */}
          <Animated.View entering={FadeInUp.delay(700).duration(400)}>
            <Card variant="elevated" style={styles.statsCard}>
              <View style={styles.statsHeader}>
                <Ionicons name="analytics" size={20} color={colors.tint} />
                <ThemedText type="heading" style={{ marginLeft: Spacing.sm }}>Özet</ThemedText>
                    </View>
              
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statNumber, { color: '#9D4EDD' }]}>{parfumler.length}</ThemedText>
                  <ThemedText type="caption" style={{ color: colors.textMuted }}>Parfüm</ThemedText>
              </View>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statNumber, { color: '#FF6B9D' }]}>{favorites.length}</ThemedText>
                  <ThemedText type="caption" style={{ color: colors.textMuted }}>Favori</ThemedText>
            </View>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statNumber, { color: '#00B4D8' }]}>{Object.keys(TYPE_COLORS).length}</ThemedText>
                  <ThemedText type="caption" style={{ color: colors.textMuted }}>Koku Ailesi</ThemedText>
                    </View>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statNumber, { color: '#00D4AA' }]}>{recentParfums.length}</ThemedText>
                  <ThemedText type="caption" style={{ color: colors.textMuted }}>Son Görüntülenen</ThemedText>
                </View>
              </View>
            </Card>
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
          <View style={[styles.miniIcon, { backgroundColor: typeColor + '15' }]}>
            <Ionicons name="sparkles" size={16} color={typeColor} />
          </View>
          <View style={[styles.miniType, { backgroundColor: typeColor + '15' }]}>
            <ThemedText style={{ color: typeColor, fontSize: 9, fontWeight: '700' }}>{parfum.tip}</ThemedText>
      </View>
          <ThemedText type="subtitle" numberOfLines={1} style={styles.miniName}>{parfum.isim}</ThemedText>
          <ThemedText type="caption" numberOfLines={1} style={{ color: colors.textMuted }}>{parfum.marka}</ThemedText>
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
  greetingSection: { marginBottom: Spacing.lg },
  greetingEmoji: { fontSize: 28, marginBottom: Spacing.xs },
  greetingTitle: { fontSize: FontSizes['2xl'], marginBottom: 2 },
  content: { paddingHorizontal: Spacing.xl },
  quickActions: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  quickAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, gap: Spacing.sm },
  quickActionText: { fontSize: FontSizes.sm, fontWeight: FontWeights.semiBold },
  weatherCard: { marginBottom: Spacing.lg, padding: Spacing.lg },
  weatherContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  weatherLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  weatherIconBg: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  weatherInfo: { flex: 1 },
  weatherTempRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  weatherTemp: { fontSize: 28, fontWeight: FontWeights.bold },
  weatherRight: { gap: Spacing.xs },
  weatherBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full, gap: 4 },
  weatherRecommendation: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  weatherTags: { flexDirection: 'row', gap: Spacing.sm },
  weatherTag: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
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
  typeCard: { width: 100, padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center', borderWidth: 1 },
  typeIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  typeName: { fontSize: FontSizes.xs, fontWeight: FontWeights.semiBold, marginBottom: 2, textAlign: 'center' },
  typeCount: { fontSize: 10 },
  horizontalList: { gap: Spacing.md, paddingBottom: Spacing.sm },
  miniCard: { width: 140, padding: Spacing.md },
  miniIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  miniType: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: Spacing.xs },
  miniName: { fontSize: FontSizes.sm, marginBottom: 2 },
  statsCard: { padding: Spacing.lg },
  statsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold },
});
