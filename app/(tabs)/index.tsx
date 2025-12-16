/**
 * AROMIXEN - Modern Dashboard
 * Hero, Hava Durumu, Günün Önerisi ve Parfüm Keşfi
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Dimensions,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  FadeIn, 
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { Parfum, KokuTipi } from '@/types';
import { fetchWeatherData, getWeatherRecommendation, WeatherData } from '@/services/weather';
import { getDailyRecommendation, getDailyMotivation, DailyRecommendation } from '@/services/dailyRecommendation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Koku tipi renkleri
const TYPE_COLORS: Record<string, string> = {
  'Odunsu': '#8B4513',
  'Çiçeksi': '#FF69B4',
  'Oryantal': '#DAA520',
  'Ferah': '#87CEEB',
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

  // Parfüm açma
  const handleOpenParfum = (parfum: Parfum) => {
    addToRecentlyViewedList(parfum.id);
    router.push(`/parfum/${parfum.id}`);
  };

  // Hava durumu önerisi
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
        {/* Hero Section */}
        <Animated.View entering={FadeIn.duration(600)}>
          <View style={styles.heroContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80' }}
              style={styles.heroImage}
            />
      <LinearGradient
              colors={['transparent', isDark ? 'rgba(18,14,24,0.8)' : 'rgba(255,255,255,0.85)', isDark ? '#120E18' : '#FFFFFF']}
              style={styles.heroGradient}
            />
            
            {/* Top Bar */}
            <SafeAreaView style={styles.heroTopBar}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#9D4EDD', '#C77DFF']}
                  style={styles.logoIcon}
                >
                  <Ionicons name="sparkles" size={18} color="#FFF" />
                </LinearGradient>
                <ThemedText style={styles.logoText}>AROMIXEN</ThemedText>
            </View>
            </SafeAreaView>
            
            {/* Hero Content */}
            <View style={styles.heroContent}>
              <ThemedText style={styles.heroMotivation}>
                {motivation.emoji} {motivation.text}
              </ThemedText>
              <ThemedText type="title" style={styles.heroTitle}>
                Koku Yolculuğuna{'\n'}Hoş Geldin
              </ThemedText>
              <ThemedText type="body" style={styles.heroSubtitle}>
                {parfumler.length}+ parfüm arasından keşfet
              </ThemedText>
            </View>
              </View>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View 
          entering={FadeInUp.delay(200).duration(500)}
          style={styles.searchContainer}
        >
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
            <Animated.View entering={FadeInUp.delay(300).duration(500)}>
              <Card variant="elevated" style={styles.weatherCard}>
                <LinearGradient
                  colors={isDark ? ['#1E1A2E', '#2D2640'] : ['#E8F4FD', '#D1E8F5']}
                  style={styles.weatherGradient}
                >
                  <View style={styles.weatherHeader}>
                    <View style={styles.weatherLeft}>
                      <View style={styles.weatherIconContainer}>
                        <Ionicons 
                          name={weather.icon as keyof typeof Ionicons.glyphMap} 
                          size={32} 
                          color={isDark ? '#87CEEB' : '#4A90D9'} 
                        />
                      </View>
                      <View>
                        <ThemedText style={styles.weatherTemp}>{weather.temperature}°C</ThemedText>
                        <ThemedText type="caption" style={{ color: colors.textMuted }}>
                          {weather.city} • {weather.description}
                        </ThemedText>
                      </View>
                    </View>
                    
                    <View style={styles.weatherRight}>
                      <View style={[styles.weatherBadge, { backgroundColor: colors.tint + '20' }]}>
                        <Ionicons name="water-outline" size={14} color={colors.tint} />
                        <ThemedText style={[styles.weatherBadgeText, { color: colors.tint }]}>
                          %{weather.humidity}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  
                  {weatherRec && (
                    <View style={styles.weatherRecommendation}>
                      <ThemedText type="caption" style={{ color: colors.textMuted, marginBottom: 4 }}>
                        Bugün için önerilen kokular:
                      </ThemedText>
                      <View style={styles.weatherTags}>
                        {weatherRec.scentTypes.slice(0, 3).map((type, i) => (
                          <View 
                            key={i} 
                            style={[styles.weatherTag, { backgroundColor: (TYPE_COLORS[type] || colors.tint) + '20' }]}
                          >
                            <ThemedText style={[styles.weatherTagText, { color: TYPE_COLORS[type] || colors.tint }]}>
                              {type}
                            </ThemedText>
                          </View>
                        ))}
                      </View>
            </View>
          )}
                </LinearGradient>
              </Card>
        </Animated.View>
          )}

          {/* Daily Recommendation */}
          {dailyRec && (
            <Animated.View entering={FadeInUp.delay(400).duration(500)}>
              <Pressable onPress={() => handleOpenParfum(dailyRec.parfum)}>
                <Card variant="elevated" style={styles.dailyCard}>
                  <LinearGradient
                    colors={['#9D4EDD', '#7B2CBF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.dailyGradient}
                  >
                    <View style={styles.dailyHeader}>
                      <View style={styles.dailyBadge}>
                        <Ionicons name="sparkles" size={14} color="#FFD700" />
                        <ThemedText style={styles.dailyBadgeText}>Günün Önerisi</ThemedText>
                      </View>
                      <View style={styles.dailyScore}>
                        <ThemedText style={styles.dailyScoreText}>%{dailyRec.matchScore}</ThemedText>
                        <ThemedText style={styles.dailyScoreLabel}>Uyum</ThemedText>
                      </View>
                    </View>
                    
                    <ThemedText style={styles.dailyName}>{dailyRec.parfum.isim}</ThemedText>
                    <ThemedText style={styles.dailyBrand}>{dailyRec.parfum.marka}</ThemedText>
                    
                    <View style={styles.dailyReasons}>
                      {dailyRec.reasons.map((reason, i) => (
                        <View key={i} style={styles.dailyReason}>
                          <Ionicons name="checkmark-circle" size={14} color="rgba(255,255,255,0.8)" />
                          <ThemedText style={styles.dailyReasonText}>{reason}</ThemedText>
                        </View>
                      ))}
                    </View>
                    
                    <View style={styles.dailyTip}>
                      <Ionicons name="bulb-outline" size={16} color="rgba(255,255,255,0.6)" />
                      <ThemedText style={styles.dailyTipText}>{dailyRec.tip}</ThemedText>
                    </View>
                  </LinearGradient>
                </Card>
              </Pressable>
            </Animated.View>
          )}

          {/* Scent Types */}
          <Animated.View entering={FadeInUp.delay(500).duration(500)}>
            <View style={styles.sectionHeader}>
              <ThemedText type="heading">Koku Aileleri</ThemedText>
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
                  <Animated.View 
                  key={type}
                    entering={SlideInRight.delay(500 + index * 50).duration(400)}
                  >
                    <Pressable
                      onPress={() => setSelectedType(isSelected ? null : type)}
                  style={[
                        styles.typeCard,
                        { 
                          backgroundColor: isSelected ? color : colors.card,
                          borderColor: color,
                          borderWidth: isSelected ? 0 : 1,
                        }
                      ]}
                    >
                      <View style={[styles.typeIcon, { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : color + '20' }]}>
                        <Ionicons 
                          name="sparkles" 
                          size={20} 
                          color={isSelected ? '#FFF' : color} 
                        />
                  </View>
                      <ThemedText style={[styles.typeName, { color: isSelected ? '#FFF' : colors.text }]}>
                        {type}
                      </ThemedText>
                      <ThemedText style={[styles.typeCount, { color: isSelected ? 'rgba(255,255,255,0.7)' : colors.textMuted }]}>
                        {count} parfüm
                      </ThemedText>
                </Pressable>
                  </Animated.View>
              );
            })}
          </ScrollView>
          </Animated.View>

          {/* Favorites */}
          {favoriteParfums.length > 0 && (
            <Animated.View entering={FadeInUp.delay(600).duration(500)}>
              <View style={styles.sectionHeader}>
                <ThemedText type="heading">❤️ Favorilerim</ThemedText>
                <Pressable onPress={() => router.push('/(tabs)/favorites')}>
                  <ThemedText style={{ color: colors.tint }}>Tümünü Gör</ThemedText>
                </Pressable>
        </View>

        <ScrollView
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {favoriteParfums.map((parfum, index) => (
                  <ParfumMiniCard
                  key={parfum.id}
                    parfum={parfum} 
                    colors={colors}
                    onPress={() => handleOpenParfum(parfum)}
                    delay={index * 50}
                  />
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Recently Viewed */}
          {recentParfums.length > 0 && (
            <Animated.View entering={FadeInUp.delay(700).duration(500)}>
              <View style={styles.sectionHeader}>
                <ThemedText type="heading">🕐 Son Görüntülenen</ThemedText>
            </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {recentParfums.map((parfum, index) => (
                  <ParfumMiniCard
                    key={parfum.id}
                    parfum={parfum} 
                    colors={colors}
                    onPress={() => handleOpenParfum(parfum)}
                    delay={index * 50}
                  />
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* All Perfumes */}
          <Animated.View entering={FadeInUp.delay(800).duration(500)}>
            <View style={styles.sectionHeader}>
              <ThemedText type="heading">
                {selectedType ? `${selectedType} Parfümler` : 'Tüm Parfümler'}
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

          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

// Mini Parfüm Kartı (Yatay Liste)
function ParfumMiniCard({
  parfum,
  colors,
  onPress,
  delay = 0,
}: {
  parfum: Parfum;
  colors: typeof Colors.light;
  onPress: () => void;
  delay?: number;
}) {
  const typeColor = TYPE_COLORS[parfum.tip] || colors.tint;

  return (
    <Animated.View entering={SlideInRight.delay(delay).duration(400)}>
    <Pressable onPress={onPress}>
        <Card variant="elevated" style={styles.miniCard}>
          <View style={[styles.miniType, { backgroundColor: typeColor + '20' }]}>
            <ThemedText style={[styles.miniTypeText, { color: typeColor }]}>
            {parfum.tip}
            </ThemedText>
        </View>
          <ThemedText type="subtitle" numberOfLines={1} style={styles.miniName}>
            {parfum.isim}
          </ThemedText>
          <ThemedText type="caption" numberOfLines={1} style={{ color: colors.textMuted }}>
            {parfum.marka}
          </ThemedText>
        </Card>
        </Pressable>
    </Animated.View>
  );
}

// Parfüm Kartı (Grid)
function ParfumCard({
  parfum,
  colors,
  isFavorite,
  onPress,
  onToggleFavorite,
  delay = 0,
}: {
  parfum: Parfum;
  colors: typeof Colors.light;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  delay?: number;
}) {
  const typeColor = TYPE_COLORS[parfum.tip] || colors.tint;

  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).duration(400)}
      style={styles.cardWrapper}
    >
      <Pressable onPress={onPress}>
        <Card variant="elevated" style={styles.parfumCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardType, { backgroundColor: typeColor + '20' }]}>
              <ThemedText style={[styles.cardTypeText, { color: typeColor }]}>
                {parfum.tip}
              </ThemedText>
            </View>
            <Pressable onPress={onToggleFavorite} style={styles.cardFavorite}>
              <Ionicons 
                name={isFavorite ? 'heart' : 'heart-outline'} 
                size={20} 
                color={isFavorite ? '#FF6B9D' : colors.textMuted} 
              />
        </Pressable>
      </View>
          
          <ThemedText type="subtitle" numberOfLines={2} style={styles.cardName}>
              {parfum.isim}
          </ThemedText>
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            {parfum.marka}
          </ThemedText>
          
          <View style={styles.cardMeta}>
            <View style={styles.cardMetaItem}>
              <Ionicons name="time-outline" size={12} color={colors.textMuted} />
              <ThemedText style={styles.cardMetaText}>{parfum.kalicilik}</ThemedText>
              </View>
            <View style={styles.cardMetaItem}>
              <Ionicons name="speedometer-outline" size={12} color={colors.textMuted} />
              <ThemedText style={styles.cardMetaText}>{parfum.yogunluk}</ThemedText>
              </View>
                </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    height: 320,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  heroTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  logoText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroContent: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.xl,
    right: Spacing.xl,
  },
  heroMotivation: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
    opacity: 0.8,
  },
  heroTitle: {
    fontSize: FontSizes['3xl'],
    lineHeight: 40,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    opacity: 0.7,
  },
  searchContainer: {
    paddingHorizontal: Spacing.xl,
    marginTop: -Spacing.xl,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.base,
  },
  content: {
    paddingTop: Spacing.xl,
  },
  weatherCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  weatherGradient: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  weatherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  weatherIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(135, 206, 235, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherTemp: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  weatherRight: {},
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  weatherBadgeText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  weatherRecommendation: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  weatherTags: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  weatherTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  weatherTagText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  dailyCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  dailyGradient: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  dailyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  dailyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  dailyBadgeText: {
    color: '#FFF',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  dailyScore: {
    alignItems: 'center',
  },
  dailyScoreText: {
    color: '#FFF',
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  dailyScoreLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSizes.xs,
  },
  dailyName: {
    color: '#FFF',
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginBottom: 2,
  },
  dailyBrand: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSizes.base,
    marginBottom: Spacing.md,
  },
  dailyReasons: {
    gap: 6,
    marginBottom: Spacing.md,
  },
  dailyReason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dailyReasonText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: FontSizes.sm,
  },
  dailyTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  dailyTipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSizes.sm,
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  typesContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  typeCard: {
    width: 100,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typeName: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
    marginBottom: 2,
  },
  typeCount: {
    fontSize: FontSizes.xs,
  },
  horizontalList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  miniCard: {
    width: 140,
    padding: Spacing.md,
  },
  miniType: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  miniTypeText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
  },
  miniName: {
    fontSize: FontSizes.sm,
    marginBottom: 2,
  },
  parfumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  cardWrapper: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2,
  },
  parfumCard: {
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardType: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  cardTypeText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
  },
  cardFavorite: {
    padding: 4,
  },
  cardName: {
    fontSize: FontSizes.sm,
    marginBottom: 2,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  cardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    fontSize: 10,
    opacity: 0.7,
  },
});
