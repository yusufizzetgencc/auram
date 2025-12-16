/**
 * AROMIXEN - Profile Tab
 * Kullanıcı profili, istatistikler ve veri yönetimi
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, Button } from '@/components/ui';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { 
    preferences, 
    resetPreferences, 
    isOnboardingComplete, 
    recommendations,
    favorites,
    collections,
    recentlyViewed,
    searchHistory,
    clearFavoritesList,
    clearCollectionsList,
    clearRecentlyViewedList,
    clearSearchHistoryList,
    resetAllData,
  } = useApp();

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
              <ThemedText type="caption">Son Görüntülenen</ThemedText>
            </View>
          </Animated.View>

          {/* Current Preferences */}
          {hasPreferences && (
            <Animated.View entering={FadeInDown.delay(300).duration(500)}>
              <Card variant="elevated" style={styles.preferencesCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: colors.tint + '15' }]}>
                    <Ionicons name="sparkles" size={20} color={colors.tint} />
                  </View>
                  <ThemedText type="heading">Tercihlerim</ThemedText>
                </View>

                <View style={styles.preferencesList}>
                  {preferences.cinsiyet && (
                    <PreferenceRow
                      icon="person-outline"
                      label="Cinsiyet"
                      value={preferences.cinsiyet}
                      colors={colors}
                    />
                  )}
                  {preferences.kokuTipleri.length > 0 && (
                    <PreferenceRow
                      icon="sparkles-outline"
                      label="Koku Tipleri"
                      value={preferences.kokuTipleri.join(', ')}
                      colors={colors}
                    />
                  )}
                  {preferences.yogunluk && (
                    <PreferenceRow
                      icon="speedometer-outline"
                      label="Yoğunluk"
                      value={preferences.yogunluk}
                      colors={colors}
                    />
                  )}
                  {preferences.kullanimAmaci && (
                    <PreferenceRow
                      icon="today-outline"
                      label="Kullanım"
                      value={preferences.kullanimAmaci}
                      colors={colors}
                    />
                  )}
                  {preferences.ciltTipi && (
                    <PreferenceRow
                      icon="hand-left-outline"
                      label="Cilt Tipi"
                      value={preferences.ciltTipi}
                      colors={colors}
                    />
                  )}
                  {preferences.mevsim && (
                    <PreferenceRow
                      icon="leaf-outline"
                      label="Mevsim"
                      value={preferences.mevsim}
                      colors={colors}
                    />
                  )}
                </View>

                {/* Sevilen Notalar */}
                {preferences.sevilenNotalar.length > 0 && (
                  <View style={styles.notasSection}>
                    <ThemedText type="caption" style={styles.notasLabel}>
                      ❤️ Sevilen Notalar
                    </ThemedText>
                    <View style={styles.notasContainer}>
                      {preferences.sevilenNotalar.map((nota, index) => (
                        <View key={index} style={[styles.notaBadge, { backgroundColor: '#4CAF5020' }]}>
                          <ThemedText style={{ color: '#4CAF50', fontSize: FontSizes.xs }}>
                            {nota}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Sevilmeyen Notalar */}
                {preferences.sevilmeyenNotalar.length > 0 && (
                  <View style={styles.notasSection}>
                    <ThemedText type="caption" style={styles.notasLabel}>
                      ❌ Sevilmeyen Notalar
                    </ThemedText>
                    <View style={styles.notasContainer}>
                      {preferences.sevilmeyenNotalar.map((nota, index) => (
                        <View key={index} style={[styles.notaBadge, { backgroundColor: '#EF535020' }]}>
                          <ThemedText style={{ color: '#EF5350', fontSize: FontSizes.xs }}>
                            {nota}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </Card>
            </Animated.View>
          )}

          {/* Actions */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <Card variant="elevated" style={styles.actionsCard}>
              <Button
                title={isOnboardingComplete ? 'Yeni Test Başlat' : 'Koku Testine Başla'}
                onPress={handleStartNewQuiz}
                fullWidth
                icon={
                  <Ionicons
                    name={isOnboardingComplete ? "refresh-outline" : "sparkles-outline"}
                    size={20}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                }
              />

              {isOnboardingComplete && (
                <Button
                  title="Önerilerimi Gör"
                  onPress={() => router.push('/results')}
                  variant="outline"
                  fullWidth
                  style={{ marginTop: Spacing.md }}
                  icon={
                    <Ionicons
                      name="list-outline"
                      size={20}
                      color={colors.tint}
                      style={{ marginRight: 8 }}
                    />
                  }
                />
              )}
            </Card>
          </Animated.View>

          {/* Veri Yönetimi */}
          <Animated.View entering={FadeInDown.delay(500).duration(500)}>
            <Card variant="elevated" style={styles.settingsCard}>
              <ThemedText type="heading" style={styles.settingsTitle}>
                Veri Yönetimi
              </ThemedText>

              <Pressable onPress={handleClearHistory}>
                <SettingItem
                  icon="time-outline"
                  label="Geçmişi Temizle"
                  value={`${recentlyViewed.length + searchHistory.length} kayıt`}
                  colors={colors}
                />
              </Pressable>
              
              <Pressable onPress={handleClearFavorites}>
                <SettingItem
                  icon="heart-outline"
                  label="Favorileri Temizle"
                  value={`${favorites.length} favori`}
                  colors={colors}
                />
              </Pressable>
              
              <Pressable onPress={handleClearCollections}>
                <SettingItem
                  icon="folder-outline"
                  label="Koleksiyonları Temizle"
                  value={`${collections.length} koleksiyon`}
                  colors={colors}
                />
              </Pressable>
              
              <Pressable onPress={handleResetAllData}>
                <SettingItem
                  icon="trash-outline"
                  label="Tüm Verileri Sil"
                  value="Dikkat!"
                  colors={{...colors, tint: colors.error}}
                  isLast
                />
              </Pressable>
            </Card>
          </Animated.View>

          {/* Settings */}
          <Animated.View entering={FadeInDown.delay(600).duration(500)}>
            <Card variant="elevated" style={styles.settingsCard}>
              <ThemedText type="heading" style={styles.settingsTitle}>
                Ayarlar
              </ThemedText>

              <SettingItem
                icon="moon-outline"
                label="Karanlık Mod"
                value="Sistem ayarı"
                colors={colors}
              />
              <SettingItem
                icon="notifications-outline"
                label="Bildirimler"
                value="Yakında"
                colors={colors}
              />
              <SettingItem
                icon="language-outline"
                label="Dil"
                value="Türkçe"
                colors={colors}
                isLast
              />
            </Card>
          </Animated.View>

          {/* App Info */}
          <Animated.View entering={FadeInDown.delay(700).duration(500)}>
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

          {/* Tab bar için boşluk */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function PreferenceRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceLeft}>
        <Ionicons name={icon} size={18} color={colors.icon} />
        <ThemedText type="body" style={styles.preferenceLabel}>
          {label}
        </ThemedText>
      </View>
      <View style={[styles.preferenceBadge, { backgroundColor: colors.tint + '15' }]}>
        <ThemedText style={[styles.preferenceValue, { color: colors.tint }]} numberOfLines={1}>
          {value}
        </ThemedText>
      </View>
    </View>
  );
}

function SettingItem({
  icon,
  label,
  value,
  colors,
  isLast = false,
}: {
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
        <ThemedText type="caption" style={{ color: colors.textMuted }}>
          {value}
        </ThemedText>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['2xl'],
  },
  header: {
    marginBottom: Spacing.lg,
  },
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
  headerTitle: {
    marginBottom: Spacing.xs,
  },
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
  preferencesCard: {
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
  preferencesList: {
    gap: Spacing.sm,
  },
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
  preferenceLabel: {
    marginLeft: Spacing.md,
  },
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
  notasSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  notasLabel: {
    marginBottom: Spacing.sm,
  },
  notasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  notaBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  actionsCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  settingsCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  settingsTitle: {
    marginBottom: Spacing.lg,
  },
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
  settingLabel: {
    marginLeft: Spacing.md,
  },
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
