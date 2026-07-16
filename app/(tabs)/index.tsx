/**
 * AURAM - Ana Sayfa (Dashboard)
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
import { PaywallScreen } from '@/components/paywall';
import { BorderRadius, Colors, FontSizes, FontWeights, Spacing, ScentTypeColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { usePremiumGate } from '@/hooks/use-premium-gate';
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
  const { requirePremium, paywallVisible, setPaywallVisible } = usePremiumGate();

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
        {/* Top Hero Section */}
        <SafeAreaView edges={['top']} style={[styles.topSectionWrapper, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={styles.topSectionContent}>
            <Animated.View entering={FadeIn.duration(500)}>
              <View style={styles.headerTop}>
                <View style={styles.logoContainer}>
                  <Image 
                    source={require('@/assets/images/logo.png')} 
                    style={{ width: 28, height: 28, marginRight: 8, resizeMode: 'contain' }} 
                  />
                  <ThemedText style={styles.logoText}>AURAM</ThemedText>
                </View>
                <Pressable 
                  onPress={() => router.push('/(tabs)/profile')} 
                  style={[styles.profileBtn, { backgroundColor: colors.backgroundTertiary }]}
                >
                  <Ionicons name="person" size={18} color={colors.text} />
                  {/* Dot Indicator */}
                  {favorites.length > 0 && (
                    <View style={[styles.notificationDot, { backgroundColor: colors.accent, borderColor: colors.background }]} />
                  )}
                </Pressable>
              </View>
              
              <View style={styles.greetingSection}>
                {weather ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ThemedText style={styles.greetingEmoji}>🌤️</ThemedText>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.greetingTitle}>
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
                      <ThemedText style={styles.greetingTitle}>{timeGreeting}!</ThemedText>
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
                  <SectionTitle title="Bugün Ne Sıksan?" subtitle="GÜNLÜK ÖNERİ" colors={colors} />
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
                  <SectionTitle title="Günün Kokusu" subtitle="SEÇİMİN" colors={colors} />
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
          </View>
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
            <SectionTitle title="Premium Özellikler" subtitle="GELİŞMİŞ DENEYİM" icon="sparkles" colors={colors} />
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.premiumContainer}
            >
              {[
                { id: 'mood', title: 'Mood Tracker', desc: 'Ruh haline göre', icon: 'analytics-outline', color: '#9D4EDD' },
                { id: 'calendar', title: 'Takvim', desc: 'Kullanım geçmişi', icon: 'calendar-outline', color: '#00B4D8' },
                { id: 'layering', title: 'Katmanlama', desc: 'Kombinasyonlar', icon: 'layers-outline', color: '#FF6B9D' },
                { id: 'gift', title: 'Hediye', desc: 'Hediye asistanı', icon: 'gift-outline', color: '#FFB020' },
                { id: 'journal', title: 'Günlük', desc: 'Deneyim kaydı', icon: 'camera-outline', color: '#00D4AA' },
                { id: 'spin', title: 'Çark', desc: 'Şansını dene', icon: 'aperture-outline', color: '#FF6B6B' },
              ].map((item, index) => (
                <Pressable
                  key={item.id}
                  onPress={() => requirePremium(() => router.push(`/${item.id}` as any))}
                  style={[styles.premiumPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                >
                  <View style={[styles.premiumIconBox, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.premiumTitle}>{item.title}</ThemedText>
                    <ThemedText style={styles.premiumDesc}>{item.desc}</ThemedText>
                  </View>
                  <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
                </Pressable>
              ))}
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
            <SectionTitle 
              title="Koku Aileleri" 
              subtitle="KEŞFET" 
              actionText="Tümünü Gör" 
              onActionPress={() => router.push('/(tabs)/parfums')} 
              colors={colors} 
            />

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.typesContainer}
            >
              {scentFamilies.map(({ type, color, count }, index) => {
                const getScentIcon = (t: string) => {
                  const tl = t.toLowerCase();
                  if (tl.includes('çiçek')) return 'flower-outline';
                  if (tl.includes('odun')) return 'leaf-outline';
                  if (tl.includes('ferah') || tl.includes('aqua')) return 'water-outline';
                  if (tl.includes('baharat')) return 'flame-outline';
                  if (tl.includes('meyve')) return 'nutrition-outline';
                  return 'sparkles-outline';
                };

                return (
                  <Animated.View key={type} entering={SlideInRight.delay(400 + index * 40).duration(300)}>
                    <Pressable
                      onPress={() => router.push('/(tabs)/parfums')}
                      style={[styles.scentFamilyPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.card, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'transparent' }]}
                    >
                      <View style={[styles.scentFamilyIcon, { backgroundColor: color + '15' }]}>
                        <Ionicons name={getScentIcon(type)} size={16} color={color} />
                      </View>
                      <View>
                        <ThemedText style={styles.scentFamilyName}>{type}</ThemedText>
                        <ThemedText style={styles.scentFamilyCount}>{count} parfüm</ThemedText>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Favorites Section */}
          {favoriteParfums.length > 0 && (
            <Animated.View entering={FadeInUp.delay(500).duration(400)}>
              <SectionTitle 
                title="Favorilerim" 
                subtitle="KİŞİSEL KİTAPLIĞIN" 
                icon="heart"
                actionText={`Tümü (${favorites.length})`} 
                onActionPress={() => router.push('/(tabs)/favorites')} 
                colors={colors} 
              />
              
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
              <SectionTitle title="Son Görüntülenen" subtitle="GEÇMİŞ" icon="time" colors={colors} />

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
              <View style={[styles.statsHeader, { marginBottom: Spacing.xl }]}>
                <View style={[styles.sectionIconWrapper, { backgroundColor: colors.tint + '12' }]}>
                  <Ionicons name="analytics" size={16} color={colors.tint} />
                </View>
                <View>
                  <ThemedText style={[styles.sectionSubtitle, { color: colors.tint }]}>İSTATİSTİK</ThemedText>
                  <ThemedText style={styles.sectionTitle}>Profil Özeti</ThemedText>
                </View>
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

      <PaywallScreen
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        title="Premium Özellikleri Aç"
        subtitle="Mood Tracker, Takvim, Katmanlama, Hediye Asistanı, Günlük ve Şans Çarkı'nı kullanmaya başla."
      />
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
      <Pressable 
        onPress={onPress} 
        style={[styles.sleekMiniCard, { backgroundColor: colors.card, borderColor: 'rgba(0,0,0,0.03)', shadowColor: colors.text }]}
      >
        <View style={[styles.sleekMiniIcon, { backgroundColor: typeColor + '12' }]}>
          <ThemedText style={{ color: typeColor, fontSize: 18, fontWeight: 'bold' }}>
            {parfum.isim.charAt(0)}
          </ThemedText>
        </View>
        <View style={{ flex: 1, paddingRight: Spacing.sm }}>
          <ThemedText type="subtitle" numberOfLines={1} style={{ fontSize: 13, marginBottom: 2 }}>{parfum.isim}</ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ThemedText type="caption" numberOfLines={1} style={{ color: colors.textMuted, fontSize: 11 }}>{parfum.marka}</ThemedText>
            <View style={[styles.miniTypeBadge, { backgroundColor: typeColor + '10' }]}>
              <ThemedText style={{ color: typeColor, fontSize: 8, fontWeight: '700' }}>{parfum.tip}</ThemedText>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Ortak Section Header Bileşeni
function SectionTitle({ 
  title, 
  subtitle, 
  actionText, 
  onActionPress,
  icon,
  colors,
}: { 
  title: string; 
  subtitle?: string; 
  actionText?: string; 
  onActionPress?: () => void;
  icon?: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {icon && (
          <View style={[styles.sectionIconWrapper, { backgroundColor: colors.tint + '15' }]}>
            <Ionicons name={icon as any} size={18} color={colors.tint} />
          </View>
        )}
        <View style={{ justifyContent: 'center' }}>
          {subtitle && (
            <ThemedText style={[styles.sectionSubtitle, { color: colors.tint }]}>{subtitle}</ThemedText>
          )}
          <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        </View>
      </View>
      {actionText && onActionPress && (
        <Pressable onPress={onActionPress} hitSlop={15} style={[styles.sectionAction, { backgroundColor: colors.text + '08' }]}>
          <ThemedText style={[styles.sectionActionText, { color: colors.text }]}>{actionText}</ThemedText>
          <Ionicons name="chevron-forward" size={12} color={colors.text} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  topSectionWrapper: {
    borderBottomWidth: 1,
    paddingBottom: Spacing.xl,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  topSectionContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
  logoText: { fontSize: FontSizes.sm, fontWeight: FontWeights.semiBold, letterSpacing: 1.5, opacity: 0.7 },
  profileBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  greetingSection: { marginBottom: Spacing.lg },
  greetingEmoji: { fontSize: 32, marginBottom: Spacing.xs },
  greetingTitle: { fontSize: 34, fontWeight: '900', letterSpacing: -1, marginBottom: 4 },
  content: { paddingHorizontal: Spacing.xl },
  quickActions: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  quickAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, gap: Spacing.sm },
  quickActionText: { fontSize: FontSizes.sm, fontWeight: FontWeights.semiBold },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.light.textMuted,
  },
  streakBanner: {
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
    marginVertical: Spacing.sm,
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
  premiumPill: { flexDirection: 'row', alignItems: 'center', width: 180, padding: Spacing.sm, borderRadius: BorderRadius.xl, borderWidth: 1, gap: Spacing.md },
  premiumIconBox: { width: 44, height: 44, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  premiumTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, marginBottom: 2 },
  premiumDesc: { fontSize: 10, opacity: 0.7 },
  
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
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.lg, marginTop: Spacing.xl },
  sectionIconWrapper: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  sectionSubtitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
  sectionTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  sectionAction: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 4 },
  sectionActionText: { fontSize: 11, fontWeight: '700' },
  
  typesContainer: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  scentFamilyPill: { flexDirection: 'row', alignItems: 'center', padding: Spacing.sm, paddingRight: Spacing.lg, borderRadius: BorderRadius.full, borderWidth: 1, gap: Spacing.sm },
  scentFamilyIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  scentFamilyName: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, marginBottom: 2 },
  scentFamilyCount: { fontSize: 10, opacity: 0.6 },
  
  horizontalList: { gap: Spacing.md, paddingBottom: Spacing.sm },
  sleekMiniCard: { flexDirection: 'row', alignItems: 'center', width: 220, padding: Spacing.sm, borderRadius: BorderRadius.xl, borderWidth: 1, gap: Spacing.sm, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  sleekMiniIcon: { width: 44, height: 44, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  miniTypeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  
  statsCard: { padding: Spacing.lg },
  statsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold },
});
