/**
 * AROMIXEN - Parfum Detail Screen
 * Detaylı parfüm analizi + Koleksiyona ekleme + Gelişmiş özellikler
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions, Share, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, FadeIn, SlideInRight, SlideInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, Button } from '@/components/ui';
import { PaywallScreen } from '@/components/paywall';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, ScentTypeColors } from '@/constants/theme';
import { FREE_PARFUM_DETAIL_LIMIT, FREE_FAVORITE_LIMIT, FREE_COLLECTION_PARFUM_LIMIT } from '@/constants/premiumLimits';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { usePremiumGate } from '@/hooks/use-premium-gate';
import { getFreeViewedParfumIds, addFreeViewedParfumId } from '@/services/storage';
import { Parfum } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
type NotaTab = 'ust' | 'orta' | 'alt';

// Konsantrasyon bilgileri
const KONSANTRASYON_INFO: Record<string, { label: string; saat: string; yuzde: string; aciklama: string }> = {
  'parfum': { label: 'Parfüm (Extrait)', saat: '8-12+ saat', yuzde: '%20-40', aciklama: 'En yoğun ve kalıcı form' },
  'eau_de_parfum': { label: 'Eau de Parfum', saat: '6-8 saat', yuzde: '%15-20', aciklama: 'Yoğun ve uzun kalıcı' },
  'eau_de_toilette': { label: 'Eau de Toilette', saat: '4-6 saat', yuzde: '%5-15', aciklama: 'Günlük kullanım için ideal' },
  'eau_de_cologne': { label: 'Eau de Cologne', saat: '2-4 saat', yuzde: '%2-4', aciklama: 'Hafif ve ferah' },
};

// Removed hardcoded IZLENIM_COLORS

export default function ParfumDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [activeNotaTab, setActiveNotaTab] = useState<NotaTab>('ust');
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [detailAccess, setDetailAccess] = useState<'checking' | 'allowed' | 'locked'>('checking');

  const {
    parfumler,
    kullaniciPH,
    preferences,
    favorites,
    isFavorite,
    toggleFavoriteParfum,
    addToRecentlyViewedList,
    collections,
    addParfumToCollection,
    removeParfumFromCollection,
  } = useApp();
  const { isPremium, paywallVisible, setPaywallVisible } = usePremiumGate();

  const parfum = useMemo(() => {
    return parfumler.find(p => p.id === id);
  }, [id, parfumler]);

  // Son görüntülenenlere ekleme bir yan etkidir, render fazında (useMemo içinde) değil
  // useEffect içinde tetiklenmeli.
  useEffect(() => {
    if (parfum && detailAccess === 'allowed') addToRecentlyViewedList(parfum.id);
  }, [parfum?.id, detailAccess]);

  // Ücretsiz kullanıcı en fazla FREE_PARFUM_DETAIL_LIMIT kadar farklı parfüm detayı görebilir;
  // daha önce görülenler cihazda hafızada kalır ve her zaman ücretsiz açık kalır.
  useEffect(() => {
    let mounted = true;
    if (!parfum) return;
    if (isPremium) {
      setDetailAccess('allowed');
      return;
    }

    (async () => {
      const viewedIds = await getFreeViewedParfumIds();
      if (!mounted) return;

      if (viewedIds.includes(parfum.id)) {
        setDetailAccess('allowed');
        return;
      }

      if (viewedIds.length < FREE_PARFUM_DETAIL_LIMIT) {
        await addFreeViewedParfumId(parfum.id);
        if (mounted) setDetailAccess('allowed');
      } else {
        setDetailAccess('locked');
      }
    })();

    return () => {
      mounted = false;
    };
  }, [parfum?.id, isPremium]);

  const handleToggleFavorite = () => {
    if (!parfum) return;
    const currentlyFavorite = isFavorite(parfum.id);
    if (!currentlyFavorite && !isPremium && favorites.length >= FREE_FAVORITE_LIMIT) {
      setPaywallVisible(true);
      return;
    }
    toggleFavoriteParfum(parfum.id);
  };

  const phScore = useMemo(() => {
    if (!parfum || !kullaniciPH) return null;
    const userPH = kullaniciPH;
    const isIdeal = userPH >= parfum.phUyumu.minPH && userPH <= parfum.phUyumu.maxPH;
    const score = isIdeal 
      ? Math.round(100 - Math.abs(userPH - parfum.phUyumu.idealPH) * 20)
      : Math.round(50 - Math.min(Math.abs(userPH - parfum.phUyumu.minPH), Math.abs(userPH - parfum.phUyumu.maxPH)) * 25);
    return Math.max(0, Math.min(100, score));
  }, [parfum, kullaniciPH]);

  const notaPerformans = useMemo(() => {
    if (!parfum || !kullaniciPH) return { ust: 70, orta: 70, alt: 70 };
    const isAsidik = kullaniciPH < 5.0;
    const isBazik = kullaniciPH > 6.0;
    let ust = 70, orta = 70, alt = 70;
    if (isAsidik) {
      ust += parfum.notaKalicilik.ust.asidikCilt * 30;
      orta += parfum.notaKalicilik.orta.asidikCilt * 30;
      alt += parfum.notaKalicilik.alt.asidikCilt * 30;
    } else if (isBazik) {
      ust += parfum.notaKalicilik.ust.bazikCilt * 30;
      orta += parfum.notaKalicilik.orta.bazikCilt * 30;
      alt += parfum.notaKalicilik.alt.bazikCilt * 30;
    }
    return {
      ust: Math.min(100, Math.max(0, Math.round(ust))),
      orta: Math.min(100, Math.max(0, Math.round(orta))),
      alt: Math.min(100, Math.max(0, Math.round(alt))),
    };
  }, [parfum, kullaniciPH]);

  const similarParfums = useMemo(() => {
    if (!parfum) return [];
    return parfumler.filter(p => p.id !== parfum.id && (p.tip === parfum.tip || p.ikincilTip === parfum.tip)).slice(0, 4);
  }, [parfum, parfumler]);

  const handleShare = async () => {
    if (!parfum) return;
    try {
      await Share.share({ title: `${parfum.isim} - AURAM`, message: `${parfum.marka} ${parfum.isim} - ${parfum.tip}. AURAM'da keşfet!` });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleAddToCollection = async (collectionId: string) => {
    if (!parfum) return;
    const collection = collections.find(c => c.id === collectionId);
    if (collection?.parfumIds.includes(parfum.id)) {
      await removeParfumFromCollection(collectionId, parfum.id);
      Alert.alert('Çıkarıldı', `"${collection.name}" koleksiyonundan çıkarıldı`);
    } else {
      if (!isPremium && (collection?.parfumIds.length ?? 0) >= FREE_COLLECTION_PARFUM_LIMIT) {
        setShowCollectionModal(false);
        setPaywallVisible(true);
        return;
      }
      await addParfumToCollection(collectionId, parfum.id);
      Alert.alert('Eklendi', `"${collection?.name}" koleksiyonuna eklendi`);
    }
  };

  if (!parfum) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={colors.textMuted} />
            <ThemedText type="subtitle" center style={{ marginTop: Spacing.lg }}>Parfüm bulunamadı</ThemedText>
            <Button title="Geri Dön" onPress={() => router.back()} style={{ marginTop: Spacing.xl }} />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const tipColor = ScentTypeColors[parfum.tip] || colors.tint;
  const isFav = isFavorite(parfum.id);

  if (detailAccess !== 'allowed') {
    return (
      <ThemedView style={styles.container}>
        <LinearGradient colors={[tipColor + '30', 'transparent']} style={styles.headerGradient} />
        <SafeAreaView style={styles.safeArea}>
          <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
            <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: colors.card }]}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </Pressable>
          </Animated.View>

          {detailAccess === 'checking' ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={colors.tint} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.typeBadge, { backgroundColor: tipColor + '20' }]}>
                <ThemedText style={[styles.typeText, { color: tipColor }]}>{parfum.tip}</ThemedText>
              </View>
              <ThemedText type="title" center style={{ marginTop: Spacing.md }}>{parfum.isim}</ThemedText>
              <ThemedText type="subtitle" center style={{ color: colors.textMuted, marginTop: 4 }}>{parfum.marka}</ThemedText>

              <Ionicons name="lock-closed-outline" size={40} color={colors.textMuted} style={{ marginTop: Spacing.xl }} />
              <ThemedText type="subtitle" center style={{ marginTop: Spacing.lg }}>
                Detayları görmek için Premium'a geç
              </ThemedText>
              <ThemedText type="body" center style={{ color: colors.textMuted, marginTop: Spacing.xs }}>
                Ücretsiz {FREE_PARFUM_DETAIL_LIMIT} parfüm inceleme hakkını kullandın. Sınırsız erişim için Premium'a geç.
              </ThemedText>
              <Button title="Premium'a Geç" onPress={() => setPaywallVisible(true)} style={{ marginTop: Spacing.xl }} />
            </View>
          )}
        </SafeAreaView>

        <PaywallScreen
          visible={paywallVisible}
          onClose={() => setPaywallVisible(false)}
          onPurchaseSuccess={() => setDetailAccess('allowed')}
          title="Sınırsız Parfüm Detayı"
          subtitle="Tüm parfümlerin detaylı pH analizini ve notalarını aç."
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <LinearGradient colors={[tipColor + '30', 'transparent']} style={styles.headerGradient} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable onPress={() => setShowCollectionModal(true)} style={[styles.headerBtn, { backgroundColor: colors.card }]}>
              <Ionicons name="folder-outline" size={22} color={colors.text} />
            </Pressable>
            <Pressable onPress={handleToggleFavorite} style={[styles.headerBtn, { backgroundColor: colors.card }]}>
              <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? colors.accent : colors.text} />
            </Pressable>
            <Pressable onPress={handleShare} style={[styles.headerBtn, { backgroundColor: colors.card }]}>
              <Ionicons name="share-outline" size={22} color={colors.text} />
            </Pressable>
          </View>
        </Animated.View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Title Section */}
          <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.titleSection}>
            <View style={[styles.typeBadge, { backgroundColor: tipColor + '20' }]}>
              <ThemedText style={[styles.typeText, { color: tipColor }]}>{parfum.tip}</ThemedText>
            </View>
            <ThemedText type="title" style={styles.parfumName}>{parfum.isim}</ThemedText>
            <ThemedText type="subtitle" style={{ color: colors.textMuted }}>{parfum.marka}</ThemedText>
          </Animated.View>

          {/* pH Performance Card */}
          <Animated.View entering={FadeInUp.delay(200).duration(500)}>
            <Card variant="elevated" style={styles.phCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="analytics" size={20} color={colors.success} />
                </View>
                <ThemedText type="heading">pH Performansı</ThemedText>
              </View>
              
              {phScore !== null ? (
                <>
                  <View style={styles.phScoreContainer}>
                    <View style={[styles.phScoreCircle, { borderColor: phScore >= 70 ? colors.success : phScore >= 50 ? colors.warning : colors.error }]}>
                      <ThemedText style={[styles.phScoreValue, { color: phScore >= 70 ? colors.success : phScore >= 50 ? colors.warning : colors.error }]}>{phScore}</ThemedText>
                      <ThemedText type="caption">Uyum</ThemedText>
                    </View>
                    <View style={styles.phDetails}>
                      <View style={styles.phDetailRow}><ThemedText type="body">pH Aralığı:</ThemedText><ThemedText type="subtitle">{parfum.phUyumu.minPH} - {parfum.phUyumu.maxPH}</ThemedText></View>
                      <View style={styles.phDetailRow}><ThemedText type="body">İdeal pH:</ThemedText><ThemedText type="subtitle">{parfum.phUyumu.idealPH}</ThemedText></View>
                      <View style={styles.phDetailRow}><ThemedText type="body">Senin pH:</ThemedText><ThemedText type="subtitle">{kullaniciPH?.toFixed(1)}</ThemedText></View>
                    </View>
                  </View>

                  <View style={styles.notaPerformans}>
                    <ThemedText type="label" style={{ marginBottom: Spacing.md }}>Cildinizde Nota Performansı</ThemedText>
                    {(['ust', 'orta', 'alt'] as const).map((layer) => (
                      <View key={layer} style={styles.performansRow}>
                        <ThemedText style={styles.performansLabel}>{layer === 'ust' ? '🌸 Üst' : layer === 'orta' ? '💐 Orta' : '🌲 Alt'}</ThemedText>
                        <View style={styles.performansBarBg}>
                          <Animated.View entering={SlideInRight.delay(300).duration(600)} style={[styles.performansBar, { width: `${notaPerformans[layer]}%`, backgroundColor: tipColor }]} />
                        </View>
                        <ThemedText style={styles.performansValue}>{notaPerformans[layer]}%</ThemedText>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <View style={styles.noPHData}>
                  <Ionicons name="information-circle-outline" size={24} color={colors.textMuted} />
                  <ThemedText type="body" center style={{ color: colors.textMuted, marginTop: Spacing.sm }}>pH testini tamamlayın</ThemedText>
                </View>
              )}
            </Card>
          </Animated.View>

          {/* Nota Piramidi */}
          <Animated.View entering={FadeInUp.delay(300).duration(500)}>
            <Card variant="elevated" style={styles.notaCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="layers" size={20} color={colors.primary} />
                </View>
                <ThemedText type="heading">Nota Piramidi</ThemedText>
              </View>
              
              <View style={styles.notaTabs}>
                {(['ust', 'orta', 'alt'] as const).map((tab) => (
                  <Pressable key={tab} onPress={() => setActiveNotaTab(tab)} style={[styles.notaTab, activeNotaTab === tab && { backgroundColor: tipColor + '20' }]}>
                    <ThemedText style={[styles.notaTabText, { color: activeNotaTab === tab ? tipColor : colors.textMuted }]}>
                      {tab === 'ust' ? '🌸 Üst' : tab === 'orta' ? '💐 Orta' : '🌲 Alt'}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
              
              <View style={styles.notaList}>
                {(parfum.notalar?.[activeNotaTab] || []).map((nota, index) => (
                  <Animated.View key={nota} entering={FadeIn.delay(index * 50).duration(300)} style={[styles.notaItem, { backgroundColor: tipColor + '10' }]}>
                    <ThemedText style={{ color: tipColor }}>{nota}</ThemedText>
                  </Animated.View>
                ))}
              </View>
            </Card>
          </Animated.View>

          {/* Özellikler Grid */}
          <Animated.View entering={FadeInUp.delay(400).duration(500)}>
            <Card variant="elevated" style={styles.featuresCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: colors.accent + '20' }]}>
                  <Ionicons name="options" size={20} color={colors.accent} />
                </View>
                <ThemedText type="heading">Özellikler</ThemedText>
              </View>
              
              <View style={styles.featuresGrid}>
                <FeatureItem icon="speedometer-outline" label="Yoğunluk" value={parfum.yogunluk} colors={colors} />
                <FeatureItem icon="time-outline" label="Kalıcılık" value={parfum.kalicilik} colors={colors} />
                <FeatureItem icon="leaf-outline" label="Mevsim" value={parfum.mevsim?.join(', ') || '-'} colors={colors} />
                <FeatureItem icon="person-outline" label="Cinsiyet" value={parfum.cinsiyet} colors={colors} />
              </View>
            </Card>
          </Animated.View>

          {/* Konsantrasyon Bilgisi */}
          {parfum.konsantrasyon && KONSANTRASYON_INFO[parfum.konsantrasyon] && (
            <Animated.View entering={FadeInUp.delay(450).duration(500)}>
              <Card variant="elevated" style={styles.konsantrasyonCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: colors.warning + '20' }]}>
                    <Ionicons name="flask" size={20} color={colors.warning} />
                  </View>
                  <ThemedText type="heading">Konsantrasyon</ThemedText>
                </View>
                
                <View style={styles.konsantrasyonContent}>
                  <View style={styles.konsantrasyonMain}>
                    <ThemedText type="title" style={{ color: tipColor }}>
                      {KONSANTRASYON_INFO[parfum.konsantrasyon].label}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: colors.textMuted, marginTop: 4 }}>
                      {KONSANTRASYON_INFO[parfum.konsantrasyon].aciklama}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.konsantrasyonStats}>
                    <View style={styles.konsantrasyonStat}>
                      <Ionicons name="time" size={16} color={tipColor} />
                      <ThemedText style={{ color: colors.text, fontSize: FontSizes.sm, fontWeight: '600', marginLeft: 6 }}>
                        {KONSANTRASYON_INFO[parfum.konsantrasyon].saat}
                      </ThemedText>
                    </View>
                    <View style={styles.konsantrasyonStat}>
                      <Ionicons name="water" size={16} color={tipColor} />
                      <ThemedText style={{ color: colors.text, fontSize: FontSizes.sm, fontWeight: '600', marginLeft: 6 }}>
                        {KONSANTRASYON_INFO[parfum.konsantrasyon].yuzde} yağ oranı
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </Card>
            </Animated.View>
          )}

          {/* İzlenim ve Kişilik */}
          {(parfum.izlenim && parfum.izlenim.length > 0) || (parfum.kisilikTipi && parfum.kisilikTipi.length > 0) ? (
            <Animated.View entering={FadeInUp.delay(500).duration(500)}>
              <Card variant="elevated" style={styles.izlenimCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="sparkles" size={20} color={colors.primary} />
                  </View>
                  <ThemedText type="heading">İzlenim & Kişilik</ThemedText>
                </View>
                
                {parfum.izlenim && parfum.izlenim.length > 0 && (
                  <View style={styles.izlenimSection}>
                    <ThemedText type="label" style={{ marginBottom: Spacing.sm, color: colors.textMuted }}>
                      Bu koku nasıl bir izlenim bırakır?
                    </ThemedText>
                    <View style={styles.izlenimTags}>
                      {parfum.izlenim.map((izlenim, index) => (
                        <Animated.View 
                          key={izlenim} 
                          entering={SlideInRight.delay(index * 80).duration(300)}
                          style={[styles.izlenimTag, { backgroundColor: tipColor + '20' }]}
                        >
                          <ThemedText style={{ color: tipColor, fontSize: FontSizes.sm, fontWeight: '600', textTransform: 'capitalize' }}>
                            {izlenim}
                          </ThemedText>
                        </Animated.View>
                      ))}
                    </View>
                  </View>
                )}
                
                {parfum.kisilikTipi && parfum.kisilikTipi.length > 0 && (
                  <View style={[styles.izlenimSection, { marginTop: Spacing.lg }]}>
                    <ThemedText type="label" style={{ marginBottom: Spacing.sm, color: colors.textMuted }}>
                      Hangi kişilik tipine uygun?
                    </ThemedText>
                    <View style={styles.izlenimTags}>
                      {parfum.kisilikTipi.map((kisilik, index) => (
                        <Animated.View 
                          key={kisilik} 
                          entering={SlideInRight.delay(index * 80).duration(300)}
                          style={[styles.kisilikTag, { backgroundColor: colors.backgroundTertiary }]}
                        >
                          <ThemedText style={{ color: colors.text, fontSize: FontSizes.sm, textTransform: 'capitalize' }}>
                            {kisilik}
                          </ThemedText>
                        </Animated.View>
                      ))}
                    </View>
                  </View>
                )}
              </Card>
            </Animated.View>
          ) : null}

          {/* Kullanım Zamanı & Ortam */}
          <Animated.View entering={FadeInUp.delay(550).duration(500)}>
            <Card variant="elevated" style={styles.kullanimCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: colors.accent + '20' }]}>
                  <Ionicons name="calendar" size={20} color={colors.accent} />
                </View>
                <ThemedText type="heading">Kullanım Rehberi</ThemedText>
              </View>
              
              <View style={styles.kullanimGrid}>
                {/* Gün Saati */}
                {parfum.gununSaati && parfum.gununSaati.length > 0 && (
                  <View style={styles.kullanimItem}>
                    <Ionicons name="sunny" size={20} color={tipColor} />
                    <ThemedText type="caption" style={{ color: colors.textMuted }}>Günün Saati</ThemedText>
                    <ThemedText style={{ color: colors.text, fontSize: FontSizes.sm, fontWeight: '600', textAlign: 'center', textTransform: 'capitalize' }}>
                      {parfum.gununSaati.map(s => s.replace('_', ' ')).join(', ')}
                    </ThemedText>
                  </View>
                )}
                
                {/* Ortam */}
                {parfum.ortam && (
                  <View style={styles.kullanimItem}>
                    <Ionicons name={parfum.ortam === 'kapali' ? 'home' : parfum.ortam === 'acik' ? 'leaf' : 'globe'} size={20} color={tipColor} />
                    <ThemedText type="caption" style={{ color: colors.textMuted }}>Ortam</ThemedText>
                    <ThemedText style={{ color: colors.text, fontSize: FontSizes.sm, fontWeight: '600', textTransform: 'capitalize' }}>
                      {parfum.ortam === 'kapali' ? 'Kapalı Alan' : parfum.ortam === 'acik' ? 'Açık Alan' : 'Her İkisi'}
                    </ThemedText>
                  </View>
                )}
                
                {/* İklim */}
                {parfum.iklim && parfum.iklim.length > 0 && (
                  <View style={styles.kullanimItem}>
                    <Ionicons name="thermometer" size={20} color={tipColor} />
                    <ThemedText type="caption" style={{ color: colors.textMuted }}>İklim</ThemedText>
                    <ThemedText style={{ color: colors.text, fontSize: FontSizes.sm, fontWeight: '600', textTransform: 'capitalize' }}>
                      {parfum.iklim.join(', ')}
                    </ThemedText>
                  </View>
                )}
                
                {/* Yaş Grubu */}
                {parfum.yasGrubu && parfum.yasGrubu.length > 0 && (
                  <View style={styles.kullanimItem}>
                    <Ionicons name="people" size={20} color={tipColor} />
                    <ThemedText type="caption" style={{ color: colors.textMuted }}>Yaş Grubu</ThemedText>
                    <ThemedText style={{ color: colors.text, fontSize: FontSizes.sm, fontWeight: '600' }}>
                      {parfum.yasGrubu.join(', ')}
                    </ThemedText>
                  </View>
                )}
              </View>
            </Card>
          </Animated.View>

          {/* Fiyat ve Puan */}
          <Animated.View entering={FadeInUp.delay(600).duration(500)}>
            <View style={styles.statsRow}>
              {parfum.puan && (
                <Card variant="elevated" style={styles.statCard}>
                  <View style={styles.statContent}>
                    <Ionicons name="star" size={24} color={colors.warning} />
                    <ThemedText style={styles.statValue}>{parfum.puan.toFixed(1)}</ThemedText>
                    <ThemedText type="caption" style={{ color: colors.textMuted }}>Puan</ThemedText>
                  </View>
                </Card>
              )}
              
              {parfum.fiyatAraligi && (
                <Card variant="elevated" style={styles.statCard}>
                  <View style={styles.statContent}>
                    <Ionicons 
                      name={parfum.fiyatAraligi === 'luks' ? 'diamond' : parfum.fiyatAraligi === 'premium' ? 'star-half' : 'pricetag'} 
                      size={24} 
                      color={parfum.fiyatAraligi === 'luks' ? colors.warning : parfum.fiyatAraligi === 'premium' ? colors.primary : colors.success} 
                    />
                    <ThemedText style={[styles.statValue, { textTransform: 'capitalize' }]}>
                      {parfum.fiyatAraligi}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: colors.textMuted }}>Fiyat</ThemedText>
                  </View>
                </Card>
              )}
            </View>
          </Animated.View>

          {/* Etiketler */}
          {parfum.etiketler && parfum.etiketler.length > 0 && (
            <Animated.View entering={FadeInUp.delay(650).duration(500)}>
              <View style={styles.etiketlerContainer}>
                <ThemedText type="label" style={{ marginBottom: Spacing.sm, color: colors.textMuted }}>Etiketler</ThemedText>
                <View style={styles.etiketlerRow}>
                  {parfum.etiketler.map((etiket, index) => (
                    <Animated.View 
                      key={etiket} 
                      entering={FadeIn.delay(index * 50).duration(200)}
                      style={[styles.etiketTag, { backgroundColor: tipColor + '15' }]}
                    >
                      <ThemedText style={{ color: tipColor, fontSize: FontSizes.xs }}>#{etiket}</ThemedText>
                    </Animated.View>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          {/* Açıklama */}
          {parfum.aciklama && (
            <Animated.View entering={FadeInUp.delay(700).duration(500)}>
              <Card variant="elevated" style={styles.aciklamaCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: tipColor + '20' }]}>
                    <Ionicons name="document-text" size={20} color={tipColor} />
                  </View>
                  <ThemedText type="heading">Hakkında</ThemedText>
                </View>
                <ThemedText style={{ color: colors.textSecondary, lineHeight: 22 }}>
                  {parfum.aciklama}
                </ThemedText>
              </Card>
            </Animated.View>
          )}

          {/* Benzer Parfümler */}
          {similarParfums.length > 0 && (
            <Animated.View entering={FadeInUp.delay(500).duration(500)}>
              <View style={styles.sectionHeader}><ThemedText type="heading">Benzer Parfümler</ThemedText></View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarList}>
                {similarParfums.map((p, index) => (
                  <Pressable key={p.id} onPress={() => router.push(`/parfum/${p.id}`)}>
                    <Animated.View entering={FadeIn.delay(index * 100).duration(400)} style={[styles.similarCard, { backgroundColor: colors.card }]}>
                      <View style={[styles.similarType, { backgroundColor: (ScentTypeColors[p.tip] || colors.tint) + '20' }]}>
                        <ThemedText style={{ color: ScentTypeColors[p.tip] || colors.tint, fontSize: 10 }}>{p.tip}</ThemedText>
                      </View>
                      <ThemedText type="subtitle" numberOfLines={1} style={{ fontSize: FontSizes.sm }}>{p.isim}</ThemedText>
                      <ThemedText type="caption" numberOfLines={1} style={{ color: colors.textMuted }}>{p.marka}</ThemedText>
                    </Animated.View>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Koleksiyona Ekleme Modal */}
      <Modal visible={showCollectionModal} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={styles.modalContainer}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowCollectionModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
              <ThemedText type="heading">Koleksiyona Ekle</ThemedText>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              {collections.length === 0 ? (
                <View style={styles.noCollections}>
                  <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
                  <ThemedText type="subtitle" center style={{ marginTop: Spacing.md }}>Henüz koleksiyon yok</ThemedText>
                  <ThemedText type="body" center style={{ color: colors.textMuted, marginTop: Spacing.xs }}>
                    Profil &gt; Favoriler &gt; Koleksiyonlar'dan yeni koleksiyon oluşturun
                  </ThemedText>
                  <Button title="Koleksiyonlara Git" onPress={() => { setShowCollectionModal(false); router.push('/(tabs)/favorites'); }} style={{ marginTop: Spacing.xl }} />
                </View>
              ) : (
                <View style={styles.collectionsList}>
                  {collections.map((collection) => {
                    const isInCollection = collection.parfumIds.includes(parfum.id);
                    return (
                      <Pressable key={collection.id} onPress={() => handleAddToCollection(collection.id)} style={[styles.collectionItem, { backgroundColor: colors.card }]}>
                        <View style={[styles.collectionIcon, { backgroundColor: collection.color + '20' }]}>
                          <Ionicons name={collection.icon as keyof typeof Ionicons.glyphMap} size={22} color={collection.color} />
                        </View>
                        <View style={styles.collectionInfo}>
                          <ThemedText type="subtitle">{collection.name}</ThemedText>
                          <ThemedText type="caption" style={{ color: colors.textMuted }}>{collection.parfumIds.length} parfüm</ThemedText>
                        </View>
                        <View style={[styles.collectionCheck, { backgroundColor: isInCollection ? colors.success : colors.backgroundTertiary }]}>
                          {isInCollection && <Ionicons name="checkmark" size={16} color="#FFF" />}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </ThemedView>
      </Modal>

      <PaywallScreen
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        title="Auram Premium'a Geç"
        subtitle="Sınırsız favori, koleksiyon ve parfüm detayına eriş."
      />
    </ThemedView>
  );
}

function FeatureItem({ icon, label, value, colors }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; colors: typeof Colors.light }) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: colors.backgroundTertiary }]}>
        <Ionicons name={icon} size={18} color={colors.tint} />
      </View>
      <ThemedText type="caption" style={{ color: colors.textMuted }}>{label}</ThemedText>
      <ThemedText type="body" style={{ fontWeight: '600', textTransform: 'capitalize', textAlign: 'center' }} numberOfLines={2}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  headerBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['2xl'] },
  titleSection: { marginBottom: Spacing.xl },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, marginBottom: Spacing.md },
  typeText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold },
  parfumName: { fontSize: FontSizes['2xl'], marginBottom: Spacing.xs },
  phCard: { marginBottom: Spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  cardIcon: { width: 36, height: 36, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  phScoreContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl, marginBottom: Spacing.xl },
  phScoreCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  phScoreValue: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold },
  phDetails: { flex: 1, gap: Spacing.sm },
  phDetailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  notaPerformans: { paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  performansRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  performansLabel: { width: 60, fontSize: FontSizes.sm },
  performansBarBg: { flex: 1, height: 8, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 4, overflow: 'hidden' },
  performansBar: { height: '100%', borderRadius: 4 },
  performansValue: { width: 40, fontSize: FontSizes.sm, textAlign: 'right' },
  noPHData: { alignItems: 'center', padding: Spacing.lg },
  notaCard: { marginBottom: Spacing.lg },
  notaTabs: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  notaTab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, alignItems: 'center' },
  notaTabText: { fontSize: FontSizes.sm, fontWeight: FontWeights.semiBold },
  notaList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  notaItem: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  featuresCard: { marginBottom: Spacing.lg },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  featureItem: { width: '47%', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, gap: 4 },
  featureIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xs },
  sectionHeader: { marginBottom: Spacing.md },
  similarList: { paddingRight: Spacing.xl, gap: Spacing.md },
  similarCard: { width: 140, padding: Spacing.md, borderRadius: BorderRadius.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  similarType: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm, marginBottom: Spacing.sm },
  // Konsantrasyon
  konsantrasyonCard: { marginBottom: Spacing.lg },
  konsantrasyonContent: { gap: Spacing.md },
  konsantrasyonMain: { marginBottom: Spacing.sm },
  konsantrasyonStats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  konsantrasyonStat: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg },
  // İzlenim
  izlenimCard: { marginBottom: Spacing.lg },
  izlenimSection: {},
  izlenimTags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  izlenimTag: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  kisilikTag: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg },
  // Kullanım
  kullanimCard: { marginBottom: Spacing.lg },
  kullanimGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  kullanimItem: { width: '47%', alignItems: 'center', padding: Spacing.md, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: BorderRadius.lg, gap: 4 },
  // Stats
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  statCard: { flex: 1 },
  statContent: { alignItems: 'center', gap: Spacing.xs },
  statValue: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold },
  // Etiketler
  etiketlerContainer: { marginBottom: Spacing.lg },
  etiketlerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  etiketTag: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm },
  // Açıklama
  aciklamaCard: { marginBottom: Spacing.lg },
  // Modal
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  modalContent: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  noCollections: { alignItems: 'center', paddingTop: Spacing['3xl'] },
  collectionsList: { gap: Spacing.md },
  collectionItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg },
  collectionIcon: { width: 48, height: 48, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  collectionInfo: { flex: 1 },
  collectionCheck: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
});
