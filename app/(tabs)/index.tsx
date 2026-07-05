/**
 * AROMIXEN - Ana Sayfa (Dashboard)
 * Hava durumu, günün önerisi, koku aileleri, favoriler, son görüntülenenler
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
    Dimensions,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
    Text,
    Image,
} from 'react-native';
import Animated, { FadeIn, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { BorderRadius, Colors, FontSizes, FontWeights, Spacing, ScentTypeColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Confetti, ConfettiRef } from '@/components/confetti';
import { DailyRecommendation, getDailyMotivation, getMultipleDailyRecommendations } from '@/services/dailyRecommendation';
import { fetchWeatherData, getWeatherRecommendation, WeatherData } from '@/services/weather';
import { Parfum } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ScentTypeColors is imported from theme.ts instead

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
    todaySotd,
    streakData,
    selectTodaysSotd,
    performanceLogs,
  } = useApp();

  const confettiRef = useRef<ConfettiRef>(null);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [dailyRecs, setDailyRecs] = useState<DailyRecommendation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const motivation = getDailyMotivation();

  const currentHour = new Date().getHours();
  let timeGreeting = 'Merhaba';
  if (currentHour >= 5 && currentHour < 12) timeGreeting = 'Günaydın';
  else if (currentHour >= 12 && currentHour < 18) timeGreeting = 'İyi Günler';
  else if (currentHour >= 18 && currentHour < 22) timeGreeting = 'İyi Akşamlar';
  else timeGreeting = 'İyi Geceler';

  const loadData = useCallback(async () => {
    try {
      const weatherData = await fetchWeatherData();
      setWeather(weatherData);
      const recommendations = getMultipleDailyRecommendations(parfumler, preferences, favorites, 3);
      setDailyRecs(recommendations);
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
  const scentFamilies = Object.entries(ScentTypeColors).slice(0, 8).map(([type, color]) => ({
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
                <Image 
                  source={require('@/assets/images/logo.png')} 
                  style={{ width: 32, height: 32, marginRight: 8, resizeMode: 'contain' }} 
                />
                <ThemedText style={styles.logoText}>AURAM</ThemedText>
              </View>
              <Pressable 
                onPress={() => router.push('/(tabs)/profile')} 
                style={[styles.profileBtn, { backgroundColor: colors.backgroundTertiary }]}
              >
                <Ionicons name="person" size={18} color={colors.text} />
              </Pressable>
            </View>
            
            <View style={styles.greetingSection}>
              {weather ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ThemedText style={styles.greetingEmoji}>🌤️</ThemedText>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="title" style={styles.greetingTitle}>
                      {timeGreeting}!
                    </ThemedText>
                    <ThemedText style={{ color: colors.textMuted, fontSize: 14, marginTop: 4 }}>
                      Şu an hava {weather.temperature}°C, {weather.description.toLowerCase()}.
                    </ThemedText>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ThemedText style={styles.greetingEmoji}>{motivation.emoji}</ThemedText>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="title" style={styles.greetingTitle}>{timeGreeting}!</ThemedText>
                  </View>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Daily Hero Recommendation */}
          {!todaySotd && dailyRecs.length > 0 && (
            <Animated.View entering={FadeInUp.delay(30).duration(400)}>
              <LinearGradient
                colors={['#8A2387', '#E94057', '#F27121']}
                style={styles.dailyCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.dailyHeader}>
                  <View style={styles.dailyBadge}>
                    <Ionicons name="sparkles" size={12} color="#FFF" />
                    <Text style={styles.dailyBadgeText}>
                      {weatherRec ? 'Hava Durumuna Göre Seçildi' : '✨ Bugün İçin Seçtik'}
                    </Text>
                  </View>
                  <View style={styles.dailyScore}>
                    <Text style={styles.dailyScoreText}>%{Math.round(dailyRecs[0].matchScore)} Uyum</Text>
                  </View>
                </View>

                <Text style={styles.dailyName}>{dailyRecs[0].parfum.isim}</Text>
                <Text style={styles.dailyBrand}>{dailyRecs[0].parfum.marka || 'Auram'}</Text>

                <View style={styles.dailyReasons}>
                  {dailyRecs[0].reasons.slice(0, 2).map((reason, index) => (
                    <View key={index} style={styles.dailyReason}>
                      <Ionicons name="checkmark-circle" size={14} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.dailyReasonText}>{reason}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm }}>
                  <Pressable 
                    style={styles.dailyAction} 
                    onPress={() => handleOpenParfum(dailyRecs[0].parfum)}
                  >
                    <Text style={styles.dailyActionText}>Detayına Git</Text>
                    <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.8)" />
                  </Pressable>

                  <Pressable 
                    style={[styles.dailyAction, { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }]} 
                    onPress={() => {
                      selectTodaysSotd(dailyRecs[0].parfum.id, weather);
                      confettiRef.current?.fire();
                    }}
                  >
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                    <Text style={[styles.dailyActionText, { color: '#FFF', fontWeight: 'bold' }]}>Bugün Bunu Sıktım</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* SOTD Hub */}
          <Animated.View entering={FadeInUp.delay(50).duration(400)}>
            {streakData.currentStreak > 0 && (
              <View style={[styles.streakBanner, { backgroundColor: colors.accent + (isDark ? '20' : '15') }]}>
                <ThemedText style={[styles.streakText, { color: colors.accent }]}>
                  🔥 Serin: {streakData.currentStreak}. Gün | En Uzun: {streakData.longestStreak}
                </ThemedText>
              </View>
            )}

            {!todaySotd ? (
              <View style={styles.sotdContainer}>
                <ThemedText type="subtitle" style={styles.sotdTitle}>Bugün Ne Sıksan?</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sotdScroll}>
                  {dailyRecs.map((rec, index) => (
                    <Card key={index} style={styles.sotdCard}>
                      <ThemedText style={styles.sotdCardTitle} numberOfLines={1}>{rec.parfum.isim}</ThemedText>
                      <ThemedText style={styles.sotdCardBrand}>{rec.parfum.marka || 'Auram'}</ThemedText>
                      <Pressable 
                        style={styles.sotdButton}
                        onPress={() => {
                          selectTodaysSotd(rec.parfum.id, weather);
                          confettiRef.current?.fire();
                        }}
                      >
                        <ThemedText style={styles.sotdButtonText}>Bugün Bunu Sıktım</ThemedText>
                      </Pressable>
                    </Card>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View style={styles.sotdContainer}>
                <ThemedText type="subtitle" style={styles.sotdTitle}>Günün Kokusu</ThemedText>
                <Card style={styles.sotdSelectedCard}>
                  <View style={styles.sotdSelectedIcon}>
                    <Ionicons name="checkmark-circle" size={32} color="#00D4AA" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.sotdCardTitle}>{parfumler.find(p => p.id === todaySotd.parfumId)?.isim}</ThemedText>
                    <ThemedText style={styles.sotdCardBrand}>Harika bir seçim! Akşam performansını kaydetmeyi unutma.</ThemedText>
                  </View>
                </Card>
              </View>
            )}
          </Animated.View>
        </SafeAreaView>

        <View style={styles.content}>
          {/* Quick Actions */}
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.quickActions}>
                <Pressable 
              onPress={() => router.push('/(tabs)/parfums')} 
              style={[styles.quickAction, { backgroundColor: colors.primary + '15' }]}
            >
              <Ionicons name="flask" size={22} color={colors.primary} />
              <ThemedText style={[styles.quickActionText, { color: colors.primary }]}>Parfümleri Keşfet</ThemedText>
                </Pressable>
                <Pressable 
              onPress={() => router.push('/(tabs)/favorites')} 
              style={[styles.quickAction, { backgroundColor: colors.accent + '15' }]}
            >
              <Ionicons name="heart" size={22} color={colors.accent} />
              <ThemedText style={[styles.quickActionText, { color: colors.accent }]}>Favorilerim</ThemedText>
            </Pressable>
          </Animated.View>

          {/* Premium Features */}
          <Animated.View entering={FadeInUp.delay(150).duration(400)}>
            <View style={styles.sectionHeader}>
              <ThemedText type="heading">✨ Premium Özellikler</ThemedText>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.premiumContainer}
            >
              <Pressable onPress={() => router.push('/mood')} style={styles.premiumCard}>
                <LinearGradient
                  colors={colors.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.premiumGradient}
                >
                  <ThemedText style={styles.premiumEmoji}>📊</ThemedText>
                  <ThemedText style={styles.premiumTitle}>Mood Tracker</ThemedText>
                  <ThemedText style={styles.premiumDesc}>Ruh haline göre öneri</ThemedText>
                </LinearGradient>
              </Pressable>

              <Pressable onPress={() => router.push('/calendar')} style={styles.premiumCard}>
                <LinearGradient
                  colors={colors.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.premiumGradient}
                >
                  <ThemedText style={styles.premiumEmoji}>🎯</ThemedText>
                  <ThemedText style={styles.premiumTitle}>Takvim</ThemedText>
                  <ThemedText style={styles.premiumDesc}>Kullanım geçmişi</ThemedText>
                </LinearGradient>
              </Pressable>

              <Pressable onPress={() => router.push('/layering')} style={styles.premiumCard}>
                <LinearGradient
                  colors={colors.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.premiumGradient}
                >
                  <ThemedText style={styles.premiumEmoji}>💫</ThemedText>
                  <ThemedText style={styles.premiumTitle}>Katmanlama</ThemedText>
                  <ThemedText style={styles.premiumDesc}>Kombinasyon önerileri</ThemedText>
                </LinearGradient>
              </Pressable>

              <Pressable onPress={() => router.push('/gift')} style={styles.premiumCard}>
                <LinearGradient
                  colors={colors.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.premiumGradient}
                >
                  <ThemedText style={styles.premiumEmoji}>🎁</ThemedText>
                  <ThemedText style={styles.premiumTitle}>Hediye</ThemedText>
                  <ThemedText style={styles.premiumDesc}>Hediye asistanı</ThemedText>
                </LinearGradient>
              </Pressable>

              <Pressable onPress={() => router.push('/journal')} style={styles.premiumCard}>
                <LinearGradient
                  colors={colors.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.premiumGradient}
                >
                  <ThemedText style={styles.premiumEmoji}>📸</ThemedText>
                  <ThemedText style={styles.premiumTitle}>Günlük</ThemedText>
                  <ThemedText style={styles.premiumDesc}>Deneyim kaydı</ThemedText>
                </LinearGradient>
              </Pressable>

              <Pressable onPress={() => router.push('/spin')} style={styles.premiumCard}>
                <LinearGradient
                  colors={colors.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.premiumGradient}
                >
                  <ThemedText style={styles.premiumEmoji}>🎲</ThemedText>
                  <ThemedText style={styles.premiumTitle}>Çark</ThemedText>
                  <ThemedText style={styles.premiumDesc}>Şansını dene!</ThemedText>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </Animated.View>

          {/* Weather Widget */}
          {weather && (
            <Animated.View entering={FadeInUp.delay(200).duration(400)}>
              <Card variant="elevated" style={styles.weatherCard}>
                {/* Konum Bilgisi */}
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color={colors.tint} />
                  <ThemedText style={{ color: colors.tint, fontSize: FontSizes.sm, fontWeight: '600', marginLeft: 4 }}>
                    {weather.fullAddress || weather.city}
                  </ThemedText>
                </View>
                
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
                        {weather.description}
                      </ThemedText>
          </View>
          </View>

                  <View style={styles.weatherRight}>
                    <View style={[styles.weatherBadge, { backgroundColor: colors.primary + '1A' }]}>
                      <Ionicons name="water-outline" size={12} color={colors.primary} />
                      <ThemedText style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>%{weather.humidity}</ThemedText>
            </View>
                    <View style={[styles.weatherBadge, { backgroundColor: colors.accent + '1A' }]}>
                      <Ionicons name="speedometer-outline" size={12} color={colors.accent} />
                      <ThemedText style={{ color: colors.accent, fontSize: 11, fontWeight: '600' }}>{weather.windSpeed} km/s</ThemedText>
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
                          style={[styles.weatherTag, { backgroundColor: (ScentTypeColors[type] || colors.tint) + '15' }]}
              >
                          <ThemedText style={{ color: ScentTypeColors[type] || colors.tint, fontSize: FontSizes.sm, fontWeight: '600' }}>
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
                  <ThemedText style={[styles.statNumber, { color: colors.primary }]}>{parfumler.length}</ThemedText>
                  <ThemedText type="caption" style={{ color: colors.textMuted }}>Parfüm</ThemedText>
              </View>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statNumber, { color: colors.accent }]}>{favorites.length}</ThemedText>
                  <ThemedText type="caption" style={{ color: colors.textMuted }}>Favori</ThemedText>
            </View>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statNumber, { color: colors.primary }]}>{Object.keys(ScentTypeColors).length}</ThemedText>
                  <ThemedText type="caption" style={{ color: colors.textMuted }}>Koku Ailesi</ThemedText>
                    </View>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statNumber, { color: colors.accent }]}>{recentParfums.length}</ThemedText>
                  <ThemedText type="caption" style={{ color: colors.textMuted }}>Son Görüntülenen</ThemedText>
                </View>
              </View>
            </Card>
          </Animated.View>

          <View style={{ height: 120 }} />
        </View>
          </ScrollView>
      <Confetti ref={confettiRef} />
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
  const typeColor = ScentTypeColors[parfum.tip] || colors.tint;

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
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.light.textMuted,
  },
  streakBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakText: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
  },
  sotdContainer: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
  },
  sotdTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  sotdScroll: {
    paddingRight: Spacing.lg,
  },
  sotdCard: {
    width: 200,
    marginRight: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(157, 78, 221, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
  },
  sotdCardTitle: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sotdCardBrand: {
    fontSize: FontSizes.sm,
    color: Colors.light.textMuted,
    marginBottom: Spacing.md,
  },
  sotdButton: {
    backgroundColor: '#9D4EDD',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  sotdButtonText: {
    color: '#FFF',
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
  },
  sotdSelectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    borderColor: 'rgba(0, 212, 170, 0.3)',
    borderWidth: 1,
  },
  sotdSelectedIcon: {
    marginRight: Spacing.md,
  },
  // Premium Features
  premiumContainer: { gap: Spacing.md, paddingBottom: Spacing.sm, marginBottom: Spacing.md },
  premiumCard: { width: 120, borderRadius: BorderRadius.xl, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  premiumGradient: { padding: Spacing.md, alignItems: 'center', minHeight: 120 },
  premiumEmoji: { fontSize: 28, marginBottom: Spacing.sm },
  premiumTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, textAlign: 'center' },
  premiumDesc: { fontSize: 10, textAlign: 'center', marginTop: 2, opacity: 0.8 },
  weatherCard: { marginBottom: Spacing.lg, padding: Spacing.lg },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
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
