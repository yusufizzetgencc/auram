/**
 * AROMIXEN - Results Screen
 * pH Bazlı Kişiselleştirilmiş Parfüm Önerileri
 */

import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { RecommendationResult } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const shadows = Shadows[colorScheme ?? 'light'];
  
  const { 
    recommendations, 
    getRecommendations, 
    kullaniciPH, 
    phSonucu,
    resetPreferences 
  } = useApp();

  const [selectedParfum, setSelectedParfum] = useState<RecommendationResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Eğer öneri yoksa yeniden hesapla
    if (recommendations.length === 0) {
      getRecommendations();
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const openParfumDetail = (result: RecommendationResult) => {
    setSelectedParfum(result);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedParfum(null);
  };

  const handleRestart = () => {
    resetPreferences();
    router.replace('/');
  };

  const handleExplore = () => {
    router.push('/(tabs)');
  };

  // pH Bilgi Kartı
  const renderPHInfo = () => {
    const effectivePH = kullaniciPH || 5.5;
    const phAralik = effectivePH < 5.0 ? 'asidik' : effectivePH > 6.0 ? 'bazik' : 'normal';
    
    let phColor = '#4CAF50';
    let phIcon = 'checkmark-circle';
    let phTitle = 'Normal pH';
    
    if (phAralik === 'asidik') {
      phColor = '#FF9800';
      phIcon = 'flash';
      phTitle = 'Asidik Cilt';
    } else if (phAralik === 'bazik') {
      phColor = '#9C27B0';
      phIcon = 'water';
      phTitle = 'Bazik Cilt';
    }

    return (
      <View style={[styles.phCard, { backgroundColor: colors.card, borderColor: phColor }, shadows.md]}>
        <View style={[styles.phIconContainer, { backgroundColor: phColor }]}>
          <Ionicons name={phIcon as any} size={24} color="#FFF" />
        </View>
        <View style={styles.phContent}>
          <Text style={[styles.phTitle, { color: phColor }]}>{phTitle}</Text>
          <Text style={[styles.phValue, { color: colors.text }]}>pH {effectivePH.toFixed(1)}</Text>
          {phSonucu && (
            <Text style={[styles.phDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {phSonucu.aciklama}
            </Text>
          )}
        </View>
        <View style={styles.phBadge}>
          <Text style={[styles.phBadgeText, { color: phColor }]}>
            %{phSonucu?.guvenilirlik || 80}
          </Text>
          <Text style={[styles.phBadgeLabel, { color: colors.textSecondary }]}>Güvenilirlik</Text>
        </View>
      </View>
    );
  };

  // Öneri Kartı
  const renderRecommendationCard = (result: RecommendationResult, index: number) => {
    const { parfum, matchPercentage, phSkor } = result;
    
    // Uyum seviyesine göre renk
    let matchColor = '#4CAF50';
    if (matchPercentage < 60) matchColor = '#FF9800';
    else if (matchPercentage < 75) matchColor = '#2196F3';

    return (
      <Animated.View
        key={parfum.id}
        style={{
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          }],
        }}
      >
        <TouchableOpacity
          style={[styles.recommendationCard, { backgroundColor: colors.card }, shadows.sm]}
          onPress={() => openParfumDetail(result)}
          onLongPress={() => router.push(`/compare-select?initialId=${parfum.id}`)}
          activeOpacity={0.8}
        >
          {/* Sıra Numarası */}
          <View style={[styles.rankBadge, { backgroundColor: index < 3 ? colors.tint : colors.textMuted }]}>
            <Text style={styles.rankText}>#{index + 1}</Text>
          </View>

          {/* Ana İçerik */}
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={[styles.parfumName, { color: colors.text }]} numberOfLines={1}>{parfum.isim}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity 
                  onPress={() => router.push(`/compare-select?initialId=${parfum.id}`)}
                  style={{ padding: 4 }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="git-compare-outline" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                <View style={[styles.matchBadge, { backgroundColor: `${matchColor}20` }]}>
                  <Text style={[styles.matchText, { color: matchColor }]}>%{matchPercentage}</Text>
                </View>
              </View>
            </View>

            {/* Tip ve Mevsim */}
            <View style={styles.tagRow}>
              <View style={styles.tag}>
                <Ionicons name="pricetag-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.tagText, { color: colors.textSecondary }]}>{parfum.tip}</Text>
              </View>
              <View style={styles.tag}>
                <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.tagText, { color: colors.textSecondary }]}>{(parfum.mevsim || []).join(', ') || 'Tüm Mevsimler'}</Text>
              </View>
              {parfum.fiyatAraligi && (
                <View style={[styles.tag, { backgroundColor: colors.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }]}>
                  <Text style={[styles.tagText, { color: colors.textSecondary, fontSize: 10 }]}>
                    {parfum.fiyatAraligi === 'ekonomik' ? 'Ekonomik' :
                     parfum.fiyatAraligi === 'orta' ? 'Orta Segment' :
                     parfum.fiyatAraligi === 'premium' ? 'Premium' :
                     parfum.fiyatAraligi === 'luks' ? 'Lüks' : ''}
                  </Text>
                </View>
              )}
            </View>

            {/* pH Uyumu */}
            <View style={styles.phScoreRow}>
              <Text style={[styles.phScoreLabel, { color: colors.textSecondary }]}>pH Uyumu:</Text>
              <View style={[styles.phScoreBar, { backgroundColor: colors.border }]}>
                <View 
                  style={[
                    styles.phScoreFill, 
                    { 
                      width: `${phSkor.phUyumSkoru}%`,
                      backgroundColor: phSkor.phUyumSkoru >= 70 ? '#4CAF50' : phSkor.phUyumSkoru >= 50 ? '#FF9800' : '#F44336'
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.phScoreValue, { color: colors.textSecondary }]}>%{Math.round(phSkor.phUyumSkoru)}</Text>
            </View>

            {/* Uyum Sebepleri */}
            {result.matchReasons.length > 0 && (
              <View style={styles.reasonsContainer}>
                {result.matchReasons.slice(0, 2).map((reason, i) => (
                  <View key={i} style={styles.reasonItem}>
                    <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                    <Text style={[styles.reasonText, { color: colors.textSecondary }]} numberOfLines={1}>{reason}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Detay Modal
  const renderDetailModal = () => {
    if (!selectedParfum) return null;

    const { parfum, matchPercentage, matchReasons, uyumKategorileri, phSkor } = selectedParfum;

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Parfüm Detayı</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Parfüm Başlık */}
            <View style={styles.detailHeader}>
              <Text style={[styles.detailName, { color: colors.text }]}>{parfum.isim}</Text>
              <View style={[styles.detailMatchBadge, { backgroundColor: colors.tint }]}>
                <Text style={styles.detailMatchText}>%{matchPercentage} Uyum</Text>
              </View>
              <Text style={[styles.detailDescription, { color: colors.textSecondary }]}>{parfum.aciklama}</Text>
            </View>

            {/* pH Performans Kartı */}
            <View style={[styles.phPerformanceCard, { backgroundColor: colors.card }, shadows.sm]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <Ionicons name="flask-outline" size={18} /> pH Performansı
              </Text>
              
              <View style={styles.phPerformanceGrid}>
                <View style={[styles.phPerformanceItem, { backgroundColor: colors.background }]}>
                  <Text style={[styles.phPerfLabel, { color: colors.textSecondary }]}>pH Uyumu</Text>
                  <Text style={[styles.phPerfValue, { color: phSkor.phUyumSkoru >= 70 ? '#4CAF50' : '#FF9800' }]}>
                    %{Math.round(phSkor.phUyumSkoru)}
                  </Text>
                </View>
                <View style={[styles.phPerformanceItem, { backgroundColor: colors.background }]}>
                  <Text style={[styles.phPerfLabel, { color: colors.textSecondary }]}>Üst Nota Perf.</Text>
                  <Text style={[styles.phPerfValue, { color: colors.text }]}>%{Math.round(phSkor.ustNotaPerformansi)}</Text>
                </View>
                <View style={[styles.phPerformanceItem, { backgroundColor: colors.background }]}>
                  <Text style={[styles.phPerfLabel, { color: colors.textSecondary }]}>Orta Nota Perf.</Text>
                  <Text style={[styles.phPerfValue, { color: colors.text }]}>%{Math.round(phSkor.ortaNotaPerformansi)}</Text>
                </View>
                <View style={[styles.phPerformanceItem, { backgroundColor: colors.background }]}>
                  <Text style={[styles.phPerfLabel, { color: colors.textSecondary }]}>Alt Nota Perf.</Text>
                  <Text style={[styles.phPerfValue, { color: colors.text }]}>%{Math.round(phSkor.altNotaPerformansi)}</Text>
                </View>
              </View>

              <View style={[styles.phExplanation, { backgroundColor: colors.tint + '15' }]}>
                <Ionicons name="information-circle-outline" size={16} color={colors.tint} />
                <Text style={[styles.phExplanationText, { color: colors.tint }]}>{phSkor.aciklama}</Text>
              </View>
            </View>

            {/* Notalar */}
            <View style={styles.notesSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Koku Notaları</Text>
              
              <View style={styles.noteCategory}>
                <Text style={[styles.noteCategoryTitle, { color: colors.text }]}>🌸 Üst Notalar</Text>
                <Text style={[styles.noteCategoryDesc, { color: colors.textSecondary }]}>İlk 15 dakika</Text>
                <View style={styles.noteTags}>
                  {parfum.notalar.ust.map((nota, i) => (
                    <View key={i} style={[styles.noteTag, { backgroundColor: '#FFF3E0' }]}>
                      <Text style={[styles.noteTagText, { color: '#E65100' }]}>{nota}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.noteCategory}>
                <Text style={[styles.noteCategoryTitle, { color: colors.text }]}>💐 Orta Notalar</Text>
                <Text style={[styles.noteCategoryDesc, { color: colors.textSecondary }]}>15 dk - 2 saat</Text>
                <View style={styles.noteTags}>
                  {parfum.notalar.orta.map((nota, i) => (
                    <View key={i} style={[styles.noteTag, { backgroundColor: '#E8F5E9' }]}>
                      <Text style={[styles.noteTagText, { color: '#2E7D32' }]}>{nota}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.noteCategory}>
                <Text style={[styles.noteCategoryTitle, { color: colors.text }]}>🌲 Alt Notalar</Text>
                <Text style={[styles.noteCategoryDesc, { color: colors.textSecondary }]}>2+ saat, kalıcı</Text>
                <View style={styles.noteTags}>
                  {parfum.notalar.alt.map((nota, i) => (
                    <View key={i} style={[styles.noteTag, { backgroundColor: '#EFEBE9' }]}>
                      <Text style={[styles.noteTagText, { color: '#4E342E' }]}>{nota}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Uyum Kategorileri */}
            <View style={styles.categoriesSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Uyum Detayları</Text>
              {uyumKategorileri.map((kategori, i) => (
                <View key={i} style={[styles.categoryItem, { borderBottomColor: colors.border }]}>
                  <Ionicons 
                    name={kategori.uyum ? 'checkmark-circle' : 'close-circle'} 
                    size={20} 
                    color={kategori.uyum ? '#4CAF50' : '#F44336'} 
                  />
                  <View style={styles.categoryContent}>
                    <Text style={[styles.categoryName, { color: colors.text }]}>{kategori.kategori}</Text>
                    <Text style={[styles.categoryDetail, { color: colors.textSecondary }]}>{kategori.detay}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Özellikler */}
            <View style={styles.featuresSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Özellikler</Text>
              <View style={styles.featuresGrid}>
                <View style={[styles.featureItem, { backgroundColor: colors.card }, shadows.sm]}>
                  <Ionicons name="male-female-outline" size={20} color={colors.tint} />
                  <Text style={[styles.featureLabel, { color: colors.textSecondary }]}>Cinsiyet</Text>
                  <Text style={[styles.featureValue, { color: colors.text }]}>{parfum.cinsiyet}</Text>
                </View>
                <View style={[styles.featureItem, { backgroundColor: colors.card }, shadows.sm]}>
                  <Ionicons name="speedometer-outline" size={20} color={colors.tint} />
                  <Text style={[styles.featureLabel, { color: colors.textSecondary }]}>Yoğunluk</Text>
                  <Text style={[styles.featureValue, { color: colors.text }]}>{parfum.yogunluk}</Text>
                </View>
                <View style={[styles.featureItem, { backgroundColor: colors.card }, shadows.sm]}>
                  <Ionicons name="time-outline" size={20} color={colors.tint} />
                  <Text style={[styles.featureLabel, { color: colors.textSecondary }]}>Kalıcılık</Text>
                  <Text style={[styles.featureValue, { color: colors.text }]}>{parfum.kalicilik}</Text>
                </View>
                <View style={[styles.featureItem, { backgroundColor: colors.card }, shadows.sm]}>
                  <Ionicons name="star-outline" size={20} color={colors.tint} />
                  <Text style={[styles.featureLabel, { color: colors.textSecondary }]}>Puan</Text>
                  <Text style={[styles.featureValue, { color: colors.text }]}>{parfum.puan}/5</Text>
                </View>
              </View>
            </View>

            {/* Etiketler */}
            <View style={styles.tagsSection}>
              <View style={styles.tagsList}>
                {parfum.etiketler.map((tag, i) => (
                  <View key={i} style={[styles.tagItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.tagItemText, { color: colors.textSecondary }]}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Sizin İçin Öneriler</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {recommendations.length} parfüm, pH değerinize göre özelleştirildi
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* pH Bilgi Kartı */}
        {renderPHInfo()}

        {/* Öneriler */}
        <View style={styles.recommendationsSection}>
          <Text style={[styles.sectionHeader, { color: colors.text }]}>En Uyumlu Parfümler</Text>
          {recommendations.length > 0 ? (
            recommendations.map((result, index) => renderRecommendationCard(result, index))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Öneri Bulunamadı</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Tercihlerinizi değiştirip tekrar deneyin</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, borderTopColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.tint }]} onPress={handleRestart}>
          <Ionicons name="refresh-outline" size={20} color={colors.tint} />
          <Text style={[styles.secondaryButtonText, { color: colors.tint }]}>Yeniden Başla</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.tint }, shadows.md]} onPress={handleExplore}>
          <Text style={styles.primaryButtonText}>Tümünü Keşfet</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Detail Modal */}
      {renderDetailModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  phCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.md,
  },
  phIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phContent: {
    flex: 1,
  },
  phTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  phValue: {
    fontSize: 22,
    fontWeight: '700',
    marginVertical: 2,
  },
  phDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  phBadge: {
    alignItems: 'center',
  },
  phBadgeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  phBadgeLabel: {
    fontSize: 10,
  },
  recommendationsSection: {
    gap: Spacing.md,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  cardContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  parfumName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  matchBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  matchText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagText: {
    fontSize: 12,
  },
  phScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  phScoreLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  phScoreBar: {
    flex: 1,
    height: 6,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  phScoreFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  phScoreValue: {
    fontSize: 11,
    fontWeight: '600',
    width: 30,
  },
  reasonsContainer: {
    marginTop: Spacing.xs,
    gap: 2,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reasonText: {
    fontSize: 11,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl * 2,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  detailHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  detailName: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  detailMatchBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginVertical: Spacing.md,
  },
  detailMatchText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  detailDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  phPerformanceCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  phPerformanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  phPerformanceItem: {
    width: (width - Spacing.lg * 4 - Spacing.md) / 2,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  phPerfLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  phPerfValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  phExplanation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  phExplanationText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  notesSection: {
    marginBottom: Spacing.lg,
  },
  noteCategory: {
    marginBottom: Spacing.lg,
  },
  noteCategoryTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  noteCategoryDesc: {
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  noteTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  noteTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  noteTagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  categoriesSection: {
    marginBottom: Spacing.lg,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  featuresSection: {
    marginBottom: Spacing.lg,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  featureItem: {
    width: (width - Spacing.lg * 4 - Spacing.md) / 2,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  featureLabel: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  featureValue: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  tagsSection: {
    marginBottom: Spacing.xl * 2,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tagItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tagItemText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
