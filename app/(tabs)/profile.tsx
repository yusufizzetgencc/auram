/**
 * AROMIXEN - Profile Tab
 * Kullanıcı profili, Koku DNA, istatistikler ve veri yönetimi
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, Button } from '@/components/ui';
import { RadarChart } from '@/components/ui/RadarChart';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  
  const { 
    preferences, 
    resetPreferences, 
    isOnboardingComplete, 
    recommendations,
    parfumler,
    favorites,
    collections,
    recentlyViewed,
    searchHistory,
    clearFavoritesList,
    clearCollectionsList,
    clearRecentlyViewedList,
    clearSearchHistoryList,
    resetAllData,
    kullaniciPH,
    phSonucu,
  } = useApp();

  // Koku DNA Profili Hesaplama
  const scentDNA = useMemo(() => {
    const dna = {
      odunsu: 0,
      ciceksi: 0,
      oryantal: 0,
      ferah: 0,
      baharatli: 0,
      aquatik: 0,
    };

    // Tercih edilen koku tiplerinden puan ekle
    preferences.kokuTipleri.forEach(tip => {
      switch(tip) {
        case 'Odunsu': dna.odunsu += 40; break;
        case 'Çiçeksi': dna.ciceksi += 40; break;
        case 'Oryantal': dna.oryantal += 40; break;
        case 'Ferah': dna.ferah += 40; break;
        case 'Baharatlı': dna.baharatli += 40; break;
        case 'Aquatik': dna.aquatik += 40; break;
      }
    });

    // Favori parfümlerden puan ekle
    const favoriteParfums = favorites.map(id => parfumler.find(p => p.id === id)).filter(Boolean);
    favoriteParfums.forEach(parfum => {
      if (!parfum) return;
      switch(parfum.tip) {
        case 'Odunsu': dna.odunsu += 15; break;
        case 'Çiçeksi': dna.ciceksi += 15; break;
        case 'Oryantal': dna.oryantal += 15; break;
        case 'Ferah': dna.ferah += 15; break;
        case 'Baharatlı': dna.baharatli += 15; break;
        case 'Aquatik': dna.aquatik += 15; break;
      }
    });

    // Normalize (0-100 arası)
    const maxValue = Math.max(...Object.values(dna), 1);
    return {
      odunsu: Math.round((dna.odunsu / maxValue) * 100),
      ciceksi: Math.round((dna.ciceksi / maxValue) * 100),
      oryantal: Math.round((dna.oryantal / maxValue) * 100),
      ferah: Math.round((dna.ferah / maxValue) * 100),
      baharatli: Math.round((dna.baharatli / maxValue) * 100),
      aquatik: Math.round((dna.aquatik / maxValue) * 100),
    };
  }, [preferences.kokuTipleri, favorites, parfumler]);

  // Radar chart data
  const radarData = [
    { label: 'Odunsu', value: scentDNA.odunsu },
    { label: 'Çiçeksi', value: scentDNA.ciceksi },
    { label: 'Oryantal', value: scentDNA.oryantal },
    { label: 'Ferah', value: scentDNA.ferah },
    { label: 'Baharatlı', value: scentDNA.baharatli },
    { label: 'Aquatik', value: scentDNA.aquatik },
  ];

  // Baskın koku tipi
  const dominantType = useMemo(() => {
    const max = Math.max(...Object.values(scentDNA));
    const types = Object.entries(scentDNA);
    const dominant = types.find(([_, v]) => v === max);
    const typeNames: Record<string, string> = {
      odunsu: 'Odunsu',
      ciceksi: 'Çiçeksi',
      oryantal: 'Oryantal',
      ferah: 'Ferah',
      baharatli: 'Baharatlı',
      aquatik: 'Aquatik',
    };
    return dominant ? typeNames[dominant[0]] : 'Keşifçi';
  }, [scentDNA]);

  // Koku kimliği açıklaması
  const scentIdentity = useMemo(() => {
    const identities: Record<string, { title: string; desc: string; emoji: string }> = {
      'Odunsu': { 
        title: 'Doğa Aşığı', 
        desc: 'Sıcak, toprak kokularını seven sofistike bir ruh.',
        emoji: '🌲'
      },
      'Çiçeksi': { 
        title: 'Romantik Ruh', 
        desc: 'Zarif ve feminen, çiçeklerin büyüsüne kapılan.',
        emoji: '🌸'
      },
      'Oryantal': { 
        title: 'Gizemli Kaşif', 
        desc: 'Egzotik ve çekici, doğunun sırlarını taşıyan.',
        emoji: '✨'
      },
      'Ferah': { 
        title: 'Özgür Ruh', 
        desc: 'Tazeliği ve enerjiyi seven, dinamik kişilik.',
        emoji: '💨'
      },
      'Baharatlı': { 
        title: 'Cesur Gezgin', 
        desc: 'Sıcak ve çarpıcı, dikkat çeken karizmatik.',
        emoji: '🔥'
      },
      'Aquatik': { 
        title: 'Deniz Tutkunu', 
        desc: 'Ferah ve özgür, okyanusun çağrısına kulak veren.',
        emoji: '🌊'
      },
    };
    return identities[dominantType] || { title: 'Keşifçi', desc: 'Tüm koku dünyasını keşfetmeye hazır.', emoji: '🔮' };
  }, [dominantType]);

  // Profil paylaş
  const handleShareProfile = async () => {
    try {
      await Share.share({
        title: 'Koku DNA\'m - AROMIXEN',
        message: `${scentIdentity.emoji} Benim koku kimliğim: ${scentIdentity.title}\n\n${scentIdentity.desc}\n\nBaskın tipim: ${dominantType}\n\n#AROMIXEN ile keşfet!`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleStartNewQuiz = async () => {
    await resetPreferences();
    router.push('/onboarding');
  };

  const handleClearHistory = () => {
    if (recentlyViewed.length === 0 && searchHistory.length === 0) {
      Alert.alert('Bilgi', 'Temizlenecek geçmiş bulunmuyor');
      return;
    }
    Alert.alert(
      'Geçmişi Temizle',
      'Son görüntülenen parfümler ve arama geçmişi silinecek.',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Temizle', 
          onPress: async () => {
            await clearRecentlyViewedList();
            await clearSearchHistoryList();
            Alert.alert('Başarılı', 'Geçmiş temizlendi');
          }
        },
      ]
    );
  };

  const handleClearFavorites = () => {
    if (favorites.length === 0) {
      Alert.alert('Bilgi', 'Favori parfümünüz bulunmuyor');
      return;
    }
    Alert.alert(
      'Favorileri Temizle',
      `${favorites.length} favori parfüm silinecek.`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Temizle', 
          style: 'destructive',
          onPress: async () => {
            await clearFavoritesList();
            Alert.alert('Başarılı', 'Favoriler temizlendi');
          }
        },
      ]
    );
  };

  const handleClearCollections = () => {
    if (collections.length === 0) {
      Alert.alert('Bilgi', 'Koleksiyonunuz bulunmuyor');
      return;
    }
    Alert.alert(
      'Koleksiyonları Temizle',
      `${collections.length} koleksiyon silinecek.`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Temizle', 
          style: 'destructive',
          onPress: async () => {
            await clearCollectionsList();
            Alert.alert('Başarılı', 'Koleksiyonlar temizlendi');
          }
        },
      ]
    );
  };

  const handleResetAllData = () => {
    Alert.alert(
      'Tüm Verileri Sil',
      'Tüm tercihleriniz, favorileriniz, koleksiyonlarınız ve geçmişiniz silinecek. Bu işlem geri alınamaz!',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            router.replace('/');
          }
        },
      ]
    );
  };

  const hasPreferences = preferences.kokuTipleri.length > 0 || preferences.cinsiyet;
  const hasDNA = Object.values(scentDNA).some(v => v > 0);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View 
            entering={FadeInDown.delay(100).duration(500)}
            style={styles.header}
          >
            <LinearGradient
              colors={[colors.tint + '20', colors.tint + '05']}
              style={styles.headerGradient}
            >
              <View style={[styles.avatarContainer, { backgroundColor: colors.tint + '30' }]}>
                <Ionicons name="person" size={40} color={colors.tint} />
              </View>
              <ThemedText type="title" style={styles.headerTitle}>
                Koku Profilim
              </ThemedText>
              <ThemedText type="body" center style={{ opacity: 0.8 }}>
                Kişisel parfüm tercihlerin
              </ThemedText>
            </LinearGradient>
          </Animated.View>

          {/* Stats */}
          <Animated.View 
            entering={FadeInDown.delay(200).duration(500)}
            style={styles.statsContainer}
          >
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.statNumber, { color: '#9D4EDD' }]}>
                {favorites.length}
              </ThemedText>
              <ThemedText type="caption">Favori</ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.statNumber, { color: '#FF6B9D' }]}>
                {collections.length}
              </ThemedText>
              <ThemedText type="caption">Koleksiyon</ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.statNumber, { color: '#00D4AA' }]}>
                {recentlyViewed.length}
              </ThemedText>
              <ThemedText type="caption">Görüntülenen</ThemedText>
            </View>
          </Animated.View>

          {/* Koku DNA */}
          {hasDNA && (
            <Animated.View entering={FadeInUp.delay(300).duration(500)}>
              <Card variant="elevated" style={styles.dnaCard}>
                <View style={styles.dnaHeader}>
                  <View style={styles.dnaHeaderLeft}>
                    <View style={[styles.cardIcon, { backgroundColor: '#9D4EDD20' }]}>
                      <Ionicons name="finger-print" size={20} color="#9D4EDD" />
                    </View>
                    <View>
                      <ThemedText type="heading">Koku DNA'n</ThemedText>
                      <ThemedText type="caption" style={{ color: colors.textMuted }}>
                        Senin koku parmak izin
                      </ThemedText>
                    </View>
                  </View>
                  <Pressable onPress={handleShareProfile} style={styles.shareBtn}>
                    <Ionicons name="share-outline" size={20} color={colors.tint} />
                  </Pressable>
                </View>
                
                {/* Radar Chart */}
                <View style={styles.radarContainer}>
                  <RadarChart 
                    data={radarData} 
                    size={260}
                    animate={true}
                  />
                </View>
                
                {/* Identity Card */}
                <LinearGradient
                  colors={['#9D4EDD', '#7B2CBF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.identityCard}
                >
                  <ThemedText style={styles.identityEmoji}>{scentIdentity.emoji}</ThemedText>
                  <ThemedText style={styles.identityTitle}>{scentIdentity.title}</ThemedText>
                  <ThemedText style={styles.identityDesc}>{scentIdentity.desc}</ThemedText>
                  <View style={styles.identityBadge}>
                    <ThemedText style={styles.identityBadgeText}>
                      Baskın: {dominantType}
                    </ThemedText>
                  </View>
                </LinearGradient>
              </Card>
            </Animated.View>
          )}

          {/* pH Bilgisi */}
          {kullaniciPH && (
            <Animated.View entering={FadeInUp.delay(400).duration(500)}>
              <Card variant="elevated" style={styles.phCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: '#00D4AA20' }]}>
                    <Ionicons name="water" size={20} color="#00D4AA" />
                  </View>
                  <ThemedText type="heading">pH Profilim</ThemedText>
                </View>
                
                <View style={styles.phContent}>
                  <View style={[styles.phCircle, { borderColor: '#00D4AA' }]}>
                    <ThemedText style={styles.phValue}>{kullaniciPH.toFixed(1)}</ThemedText>
                    <ThemedText type="caption">pH</ThemedText>
                  </View>
                  
                  <View style={styles.phInfo}>
                    <View style={styles.phInfoRow}>
                      <ThemedText type="body">Cilt Tipi:</ThemedText>
                      <ThemedText type="subtitle" style={{ textTransform: 'capitalize' }}>
                        {preferences.ciltTipi || '-'}
                      </ThemedText>
                    </View>
                    <View style={styles.phInfoRow}>
                      <ThemedText type="body">Aralık:</ThemedText>
                      <ThemedText type="subtitle" style={{ textTransform: 'capitalize' }}>
                        {phSonucu?.aralik || '-'}
                      </ThemedText>
                    </View>
                    {phSonucu && (
                      <View style={styles.phInfoRow}>
                        <ThemedText type="body">Güvenilirlik:</ThemedText>
                        <ThemedText type="subtitle">%{phSonucu.guvenilirlik}</ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              </Card>
            </Animated.View>
          )}

          {/* Current Preferences */}
          {hasPreferences && (
            <Animated.View entering={FadeInUp.delay(500).duration(500)}>
              <Card variant="elevated" style={styles.preferencesCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: colors.tint + '15' }]}>
                    <Ionicons name="sparkles" size={20} color={colors.tint} />
                  </View>
                  <ThemedText type="heading">Tercihlerim</ThemedText>
                </View>

                <View style={styles.preferencesList}>
                  {preferences.cinsiyet && (
                    <PreferenceRow icon="person-outline" label="Cinsiyet" value={preferences.cinsiyet} colors={colors} />
                  )}
                  {preferences.kokuTipleri.length > 0 && (
                    <PreferenceRow icon="sparkles-outline" label="Koku Tipleri" value={preferences.kokuTipleri.join(', ')} colors={colors} />
                  )}
                  {preferences.yogunluk && (
                    <PreferenceRow icon="speedometer-outline" label="Yoğunluk" value={preferences.yogunluk} colors={colors} />
                  )}
                  {preferences.mevsim && (
                    <PreferenceRow icon="leaf-outline" label="Mevsim" value={preferences.mevsim} colors={colors} />
                  )}
                  {preferences.ciltTipi && (
                    <PreferenceRow icon="hand-left-outline" label="Cilt Tipi" value={preferences.ciltTipi} colors={colors} />
                  )}
                </View>
              </Card>
            </Animated.View>
          )}

          {/* Actions */}
          <Animated.View entering={FadeInUp.delay(600).duration(500)}>
            <Card variant="elevated" style={styles.actionsCard}>
              <Button
                title={isOnboardingComplete ? 'Yeni Test Başlat' : 'Koku Testine Başla'}
                onPress={handleStartNewQuiz}
                fullWidth
                icon={<Ionicons name={isOnboardingComplete ? "refresh-outline" : "sparkles-outline"} size={20} color="#FFFFFF" style={{ marginRight: 8 }} />}
              />

              {isOnboardingComplete && (
                <Button
                  title="Önerilerimi Gör"
                  onPress={() => router.push('/results')}
                  variant="outline"
                  fullWidth
                  style={{ marginTop: Spacing.md }}
                  icon={<Ionicons name="list-outline" size={20} color={colors.tint} style={{ marginRight: 8 }} />}
                />
              )}
            </Card>
          </Animated.View>

          {/* Veri Yönetimi */}
          <Animated.View entering={FadeInUp.delay(700).duration(500)}>
            <Card variant="elevated" style={styles.settingsCard}>
              <ThemedText type="heading" style={styles.settingsTitle}>Veri Yönetimi</ThemedText>

              <Pressable onPress={handleClearHistory}>
                <SettingItem icon="time-outline" label="Geçmişi Temizle" value={`${recentlyViewed.length + searchHistory.length} kayıt`} colors={colors} />
              </Pressable>
              
              <Pressable onPress={handleClearFavorites}>
                <SettingItem icon="heart-outline" label="Favorileri Temizle" value={`${favorites.length} favori`} colors={colors} />
              </Pressable>
              
              <Pressable onPress={handleClearCollections}>
                <SettingItem icon="folder-outline" label="Koleksiyonları Temizle" value={`${collections.length} koleksiyon`} colors={colors} />
              </Pressable>
              
              <Pressable onPress={handleResetAllData}>
                <SettingItem icon="trash-outline" label="Tüm Verileri Sil" value="Dikkat!" colors={{...colors, tint: colors.error}} isLast />
              </Pressable>
            </Card>
          </Animated.View>

          {/* App Info */}
          <Animated.View entering={FadeInUp.delay(800).duration(500)}>
            <View style={styles.appInfo}>
              <View style={[styles.appLogoSmall, { backgroundColor: colors.tint + '15' }]}>
                <Ionicons name="sparkles" size={20} color={colors.tint} />
              </View>
              <ThemedText type="caption" center style={{ marginTop: Spacing.sm }}>
                AROMIXEN v1.0.0
              </ThemedText>
              <ThemedText type="caption" center style={{ opacity: 0.6, marginTop: 2 }}>
                Kişisel parfüm öneri uygulamanız
              </ThemedText>
            </View>
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function PreferenceRow({ icon, label, value, colors }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceLeft}>
        <Ionicons name={icon} size={18} color={colors.icon} />
        <ThemedText type="body" style={styles.preferenceLabel}>{label}</ThemedText>
      </View>
      <View style={[styles.preferenceBadge, { backgroundColor: colors.tint + '15' }]}>
        <ThemedText style={[styles.preferenceValue, { color: colors.tint }]} numberOfLines={1}>
          {value}
        </ThemedText>
      </View>
    </View>
  );
}

function SettingItem({ icon, label, value, colors, isLast = false }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: typeof Colors.light;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.settingItem, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border + '30' }]}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={20} color={colors.tint} />
        <ThemedText style={styles.settingLabel}>{label}</ThemedText>
      </View>
      <View style={styles.settingRight}>
        <ThemedText type="caption" style={{ color: colors.textMuted }}>{value}</ThemedText>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: Spacing['2xl'] },
  header: { marginBottom: Spacing.lg },
  headerGradient: {
    alignItems: 'center',
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['2xl'],
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTitle: { marginBottom: Spacing.xs },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  statNumber: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  dnaCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  dnaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  dnaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareBtn: {
    padding: Spacing.sm,
  },
  radarContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  identityCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  identityEmoji: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  identityTitle: {
    color: '#FFF',
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  identityDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSizes.sm,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  identityBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  identityBadgeText: {
    color: '#FFF',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  phCard: {
    marginHorizontal: Spacing.xl,
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
  phContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  phCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phValue: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  phInfo: {
    flex: 1,
    gap: Spacing.sm,
  },
  phInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  preferencesCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  preferencesList: { gap: Spacing.sm },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceLabel: { marginLeft: Spacing.md },
  preferenceBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    maxWidth: '50%',
  },
  preferenceValue: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
    textTransform: 'capitalize',
  },
  actionsCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  settingsCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  settingsTitle: { marginBottom: Spacing.lg },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  settingLabel: { marginLeft: Spacing.md },
  appInfo: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  appLogoSmall: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
