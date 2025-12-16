/**
 * AROMIXEN - Profil
 * Kullanıcı profili, Koku DNA, istatistikler
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, Share, Dimensions } from 'react-native';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const { 
    preferences, 
    resetPreferences, 
    isOnboardingComplete, 
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

  // Koku DNA Profili
  const scentDNA = useMemo(() => {
    const dna = { odunsu: 0, ciceksi: 0, oryantal: 0, ferah: 0, baharatli: 0, aquatik: 0 };

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

  const radarData = [
    { label: 'Odunsu', value: scentDNA.odunsu },
    { label: 'Çiçeksi', value: scentDNA.ciceksi },
    { label: 'Oryantal', value: scentDNA.oryantal },
    { label: 'Ferah', value: scentDNA.ferah },
    { label: 'Baharatlı', value: scentDNA.baharatli },
    { label: 'Aquatik', value: scentDNA.aquatik },
  ];

  const dominantType = useMemo(() => {
    const max = Math.max(...Object.values(scentDNA));
    const types = Object.entries(scentDNA);
    const dominant = types.find(([_, v]) => v === max);
    const typeNames: Record<string, string> = {
      odunsu: 'Odunsu', ciceksi: 'Çiçeksi', oryantal: 'Oryantal',
      ferah: 'Ferah', baharatli: 'Baharatlı', aquatik: 'Aquatik',
    };
    return dominant ? typeNames[dominant[0]] : 'Keşifçi';
  }, [scentDNA]);

  const scentIdentity = useMemo(() => {
    const identities: Record<string, { title: string; desc: string; emoji: string }> = {
      'Odunsu': { title: 'Doğa Aşığı', desc: 'Sıcak, toprak kokularını seven sofistike bir ruh.', emoji: '🌲' },
      'Çiçeksi': { title: 'Romantik Ruh', desc: 'Zarif ve feminen, çiçeklerin büyüsüne kapılan.', emoji: '🌸' },
      'Oryantal': { title: 'Gizemli Kaşif', desc: 'Egzotik ve çekici, doğunun sırlarını taşıyan.', emoji: '✨' },
      'Ferah': { title: 'Özgür Ruh', desc: 'Tazeliği ve enerjiyi seven, dinamik kişilik.', emoji: '💨' },
      'Baharatlı': { title: 'Cesur Gezgin', desc: 'Sıcak ve çarpıcı, dikkat çeken karizmatik.', emoji: '🔥' },
      'Aquatik': { title: 'Deniz Tutkunu', desc: 'Ferah ve özgür, okyanusun çağrısına kulak veren.', emoji: '🌊' },
    };
    return identities[dominantType] || { title: 'Keşifçi', desc: 'Tüm koku dünyasını keşfetmeye hazır.', emoji: '🔮' };
  }, [dominantType]);

  const handleShareProfile = async () => {
    try {
      await Share.share({
        title: 'Koku DNA\'m - AROMIXEN',
        message: `${scentIdentity.emoji} Koku kimliğim: ${scentIdentity.title}\n${scentIdentity.desc}\n\n#AROMIXEN`,
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
    if (recentlyViewed.length === 0 && searchHistory.length === 0) return;
    Alert.alert('Geçmişi Temizle', 'Tüm geçmiş silinecek.', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Temizle', onPress: async () => { await clearRecentlyViewedList(); await clearSearchHistoryList(); } },
    ]);
  };

  const handleClearFavorites = () => {
    if (favorites.length === 0) return;
    Alert.alert('Favorileri Temizle', `${favorites.length} favori silinecek.`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Temizle', style: 'destructive', onPress: () => clearFavoritesList() },
    ]);
  };

  const handleClearCollections = () => {
    if (collections.length === 0) return;
    Alert.alert('Koleksiyonları Temizle', `${collections.length} koleksiyon silinecek.`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Temizle', style: 'destructive', onPress: () => clearCollectionsList() },
    ]);
  };

  const handleResetAllData = () => {
    Alert.alert('Tüm Verileri Sil', 'Bu işlem geri alınamaz!', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await resetAllData(); router.replace('/'); } },
    ]);
  };

  const hasPreferences = preferences.kokuTipleri.length > 0 || preferences.cinsiyet;
  const hasDNA = Object.values(scentDNA).some(v => v > 0);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.tint + '15' }]}>
              <Ionicons name="person" size={32} color={colors.tint} />
            </View>
            <ThemedText type="title" style={styles.headerTitle}>Profilim</ThemedText>
          </Animated.View>

          {/* Stats */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.statNumber, { color: '#FF6B9D' }]}>{favorites.length}</ThemedText>
              <ThemedText type="caption" style={{ color: colors.textMuted }}>Favori</ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.statNumber, { color: '#9D4EDD' }]}>{collections.length}</ThemedText>
              <ThemedText type="caption" style={{ color: colors.textMuted }}>Koleksiyon</ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.statNumber, { color: '#00B4D8' }]}>{recentlyViewed.length}</ThemedText>
              <ThemedText type="caption" style={{ color: colors.textMuted }}>Görüntülenen</ThemedText>
            </View>
          </Animated.View>

          {/* Koku DNA */}
          {hasDNA && (
            <Animated.View entering={FadeInUp.delay(300).duration(400)}>
              <Card variant="elevated" style={styles.dnaCard}>
                <View style={styles.dnaHeader}>
                  <View style={styles.dnaHeaderLeft}>
                    <View style={[styles.iconBg, { backgroundColor: '#9D4EDD15' }]}>
                      <Ionicons name="finger-print" size={18} color="#9D4EDD" />
                    </View>
                    <ThemedText type="heading">Koku DNA</ThemedText>
                  </View>
                  <Pressable onPress={handleShareProfile} style={styles.shareBtn}>
                    <Ionicons name="share-outline" size={18} color={colors.tint} />
                  </Pressable>
                </View>
                
                <View style={styles.radarContainer}>
                  <RadarChart data={radarData} size={Math.min(SCREEN_WIDTH - 80, 260)} animate={true} />
                </View>
                
                <LinearGradient colors={['#9D4EDD', '#7B2CBF']} style={styles.identityCard}>
                  <ThemedText style={styles.identityEmoji}>{scentIdentity.emoji}</ThemedText>
                  <ThemedText style={styles.identityTitle}>{scentIdentity.title}</ThemedText>
                  <ThemedText style={styles.identityDesc}>{scentIdentity.desc}</ThemedText>
                  <View style={styles.identityBadge}>
                    <ThemedText style={styles.identityBadgeText}>Baskın: {dominantType}</ThemedText>
                  </View>
                </LinearGradient>
              </Card>
            </Animated.View>
          )}

          {/* pH Bilgisi */}
          {kullaniciPH && (
            <Animated.View entering={FadeInUp.delay(400).duration(400)}>
              <Card variant="elevated" style={styles.phCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBg, { backgroundColor: '#00D4AA15' }]}>
                    <Ionicons name="water" size={18} color="#00D4AA" />
                  </View>
                  <ThemedText type="heading">pH Profilim</ThemedText>
                </View>
                
                <View style={styles.phContent}>
                  <View style={styles.phCircle}>
                    <ThemedText style={styles.phValue}>{kullaniciPH.toFixed(1)}</ThemedText>
                    <ThemedText type="caption" style={{ color: colors.textMuted }}>pH</ThemedText>
                  </View>
                  
                  <View style={styles.phInfo}>
                    <View style={styles.phRow}>
                      <ThemedText type="body" style={{ color: colors.textMuted }}>Cilt:</ThemedText>
                      <ThemedText style={styles.phRowValue}>{preferences.ciltTipi || '-'}</ThemedText>
                    </View>
                    <View style={styles.phRow}>
                      <ThemedText type="body" style={{ color: colors.textMuted }}>Aralık:</ThemedText>
                      <ThemedText style={styles.phRowValue}>{phSonucu?.aralik || '-'}</ThemedText>
                    </View>
                  </View>
                </View>
              </Card>
            </Animated.View>
          )}

          {/* Tercihler */}
          {hasPreferences && (
            <Animated.View entering={FadeInUp.delay(500).duration(400)}>
              <Card variant="elevated" style={styles.prefsCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBg, { backgroundColor: colors.tint + '15' }]}>
                    <Ionicons name="sparkles" size={18} color={colors.tint} />
                  </View>
                  <ThemedText type="heading">Tercihlerim</ThemedText>
                </View>

                <View style={styles.prefsList}>
                  {preferences.cinsiyet && <PrefRow icon="person-outline" label="Cinsiyet" value={preferences.cinsiyet} colors={colors} />}
                  {preferences.kokuTipleri.length > 0 && <PrefRow icon="sparkles-outline" label="Koku Tipleri" value={preferences.kokuTipleri.join(', ')} colors={colors} />}
                  {preferences.yogunluk && <PrefRow icon="speedometer-outline" label="Yoğunluk" value={preferences.yogunluk} colors={colors} />}
                  {preferences.mevsim && <PrefRow icon="leaf-outline" label="Mevsim" value={preferences.mevsim} colors={colors} />}
                </View>
              </Card>
            </Animated.View>
          )}

          {/* Aksiyonlar */}
          <Animated.View entering={FadeInUp.delay(600).duration(400)}>
            <Card variant="elevated" style={styles.actionsCard}>
              <Button
                title={isOnboardingComplete ? 'Yeni Test Başlat' : 'Teste Başla'}
                onPress={handleStartNewQuiz}
                fullWidth
                icon={<Ionicons name={isOnboardingComplete ? "refresh-outline" : "sparkles-outline"} size={18} color="#FFF" style={{ marginRight: 6 }} />}
              />
              {isOnboardingComplete && (
                <Button
                  title="Önerilerimi Gör"
                  onPress={() => router.push('/results')}
                  variant="outline"
                  fullWidth
                  style={{ marginTop: Spacing.sm }}
                  icon={<Ionicons name="list-outline" size={18} color={colors.tint} style={{ marginRight: 6 }} />}
                />
              )}
            </Card>
          </Animated.View>

          {/* Veri Yönetimi */}
          <Animated.View entering={FadeInUp.delay(700).duration(400)}>
            <Card variant="elevated" style={styles.settingsCard}>
              <ThemedText type="heading" style={styles.settingsTitle}>Veri Yönetimi</ThemedText>
              
              <Pressable onPress={handleClearHistory} style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                  <ThemedText style={{ marginLeft: Spacing.sm }}>Geçmişi Temizle</ThemedText>
                </View>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>{recentlyViewed.length + searchHistory.length}</ThemedText>
              </Pressable>
              
              <Pressable onPress={handleClearFavorites} style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="heart-outline" size={18} color={colors.textMuted} />
                  <ThemedText style={{ marginLeft: Spacing.sm }}>Favorileri Temizle</ThemedText>
                </View>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>{favorites.length}</ThemedText>
              </Pressable>
              
              <Pressable onPress={handleClearCollections} style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="folder-outline" size={18} color={colors.textMuted} />
                  <ThemedText style={{ marginLeft: Spacing.sm }}>Koleksiyonları Temizle</ThemedText>
                </View>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>{collections.length}</ThemedText>
              </Pressable>
              
              <Pressable onPress={handleResetAllData} style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <View style={styles.settingLeft}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                  <ThemedText style={{ marginLeft: Spacing.sm, color: colors.error }}>Tüm Verileri Sil</ThemedText>
                </View>
              </Pressable>
            </Card>
          </Animated.View>

          {/* App Info */}
          <View style={styles.appInfo}>
            <View style={[styles.appLogo, { backgroundColor: colors.tint + '15' }]}>
              <Ionicons name="sparkles" size={16} color={colors.tint} />
            </View>
            <ThemedText type="caption" style={{ color: colors.textMuted }}>AROMIXEN v1.0.0</ThemedText>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function PrefRow({ icon, label, value, colors }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; colors: typeof Colors.light }) {
  return (
    <View style={styles.prefRow}>
      <View style={styles.prefLeft}>
        <Ionicons name={icon} size={16} color={colors.textMuted} />
        <ThemedText style={styles.prefLabel}>{label}</ThemedText>
      </View>
      <ThemedText style={[styles.prefValue, { color: colors.tint }]} numberOfLines={1}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl },
  header: { alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  avatarContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  headerTitle: { fontSize: FontSizes.xl },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  statCard: { flex: 1, alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg },
  statNumber: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
  dnaCard: { marginBottom: Spacing.lg, padding: Spacing.lg },
  dnaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  dnaHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  shareBtn: { padding: Spacing.xs },
  radarContainer: { alignItems: 'center', marginBottom: Spacing.lg },
  identityCard: { padding: Spacing.lg, borderRadius: BorderRadius.xl, alignItems: 'center' },
  identityEmoji: { fontSize: 32, marginBottom: Spacing.xs },
  identityTitle: { color: '#FFF', fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
  identityDesc: { color: 'rgba(255,255,255,0.8)', fontSize: FontSizes.sm, textAlign: 'center', marginTop: 4, marginBottom: Spacing.sm },
  identityBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full },
  identityBadgeText: { color: '#FFF', fontSize: FontSizes.sm, fontWeight: FontWeights.semiBold },
  phCard: { marginBottom: Spacing.lg, padding: Spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  iconBg: { width: 32, height: 32, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  phContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  phCircle: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: '#00D4AA', justifyContent: 'center', alignItems: 'center' },
  phValue: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold },
  phInfo: { flex: 1, gap: Spacing.xs },
  phRow: { flexDirection: 'row', justifyContent: 'space-between' },
  phRowValue: { fontWeight: FontWeights.semiBold, textTransform: 'capitalize' },
  prefsCard: { marginBottom: Spacing.lg, padding: Spacing.lg },
  prefsList: { gap: Spacing.sm },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prefLeft: { flexDirection: 'row', alignItems: 'center' },
  prefLabel: { marginLeft: Spacing.sm },
  prefValue: { fontSize: FontSizes.sm, fontWeight: FontWeights.semiBold, textTransform: 'capitalize', maxWidth: '50%' },
  actionsCard: { marginBottom: Spacing.lg, padding: Spacing.lg },
  settingsCard: { marginBottom: Spacing.lg, padding: Spacing.lg },
  settingsTitle: { marginBottom: Spacing.md },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  appInfo: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.xs },
  appLogo: { width: 32, height: 32, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
});
