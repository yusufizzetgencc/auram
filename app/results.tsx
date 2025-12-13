/**
 * AROMIXEN - Premium Results Screen
 * pH Bazlı Kişiselleştirilmiş Parfüm Önerileri
 * Elegant Mor/Fuşya Teması
 */

import { BorderRadius, Colors, ScentTypeColors, Shadows, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { RecommendationResult } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
    resetPreferences,
    preferences,
  } = useApp();

  const [selectedParfum, setSelectedParfum] = useState<RecommendationResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (recommendations.length === 0) {
      getRecommendations();
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
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
    
    let phColor = '#00D4AA';
    let phIcon = 'checkmark-circle';
    let phTitle = 'Normal pH';
    let phEmoji = '⚖️';
    
    if (phAralik === 'asidik') {
      phColor = '#FF8C42';
      phIcon = 'flash';
      phTitle = 'Asidik Cilt';
      phEmoji = '🍊';
    } else if (phAralik === 'bazik') {
      phColor = '#9D4EDD';
      phIcon = 'water';
      phTitle = 'Bazik Cilt';
      phEmoji = '🌲';
    }

    return (
      <LinearGradient
        colors={[phColor + '20', phColor + '10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.phCard, { borderColor: phColor }]}
      >
        <View style={[styles.phIconContainer, { backgroundColor: phColor }]}>
          <Text style={styles.phEmoji}>{phEmoji}</Text>
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
          <Text style={[styles.phBadgeLabel, { color: colors.textMuted }]}>Güvenilirlik</Text>
        </View>
      </LinearGradient>
    );
  };

  // Öneri Kartı
  const renderRecommendationCard = (result: RecommendationResult, index: number) => {
    const { parfum, matchPercentage, phSkor } = result;
    const typeColor = ScentTypeColors[parfum.tip] || colors.tint;
    
    // Uyum seviyesine göre renk ve badge
    let matchColor = '#00D4AA';
    let matchBadge = '💚';
    if (matchPercentage >= 85) {
      matchColor = '#9D4EDD';
      matchBadge = '💜';
    } else if (matchPercentage >= 70) {
      matchColor = '#00D4AA';
      matchBadge = '💚';
    } else if (matchPercentage >= 55) {
      matchColor = '#FF8C42';
      matchBadge = '🧡';
    } else {
      matchColor = '#8A7A9C';
      matchBadge = '🤍';
    }

    const isTopThree = index < 3;

    return (
      <Animated.View
        key={parfum.id}
        style={{
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            }),
          }],
        }}
      >
        <TouchableOpacity
          style={[
            styles.recommendationCard, 
            { backgroundColor: colors.card, borderColor: colors.border },
            isTopThree && { borderColor: matchColor, borderWidth: 2 },
            shadows.sm
          ]}
          onPress={() => openParfumDetail(result)}
          activeOpacity={0.8}
        >
          {/* Rank Badge */}
          <LinearGradient
            colors={isTopThree ? [matchColor, matchColor + 'DD'] : [colors.textMuted, colors.textMuted + 'DD']}
            style={styles.rankBadge}
          >
            <Text style={styles.rankText}>#{index + 1}</Text>
          </LinearGradient>

          {/* Content */}
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Text style={[styles.parfumName, { color: colors.text }]} numberOfLines={1}>
                  {parfum.isim}
                </Text>
                {parfum.marka && (
                  <Text style={[styles.parfumMarka, { color: colors.textMuted }]}>
                    {parfum.marka}
                  </Text>
                )}
              </View>
              <View style={[styles.matchBadge, { backgroundColor: matchColor + '20' }]}>
                <Text style={styles.matchEmoji}>{matchBadge}</Text>
                <Text style={[styles.matchText, { color: matchColor }]}>%{matchPercentage}</Text>
              </View>
            </View>

            {/* Tags */}
            <View style={styles.tagRow}>
              <View style={[styles.typeTag, { backgroundColor: typeColor + '20' }]}>
                <Text style={[styles.typeTagText, { color: typeColor }]}>{parfum.tip}</Text>
              </View>
              <View style={styles.tag}>
                <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                  {parfum.mevsim[0]}
                </Text>
              </View>
              {parfum.puan && (
                <View style={styles.tag}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                    {parfum.puan}
                  </Text>
                </View>
              )}
            </View>

            {/* pH Uyumu Bar */}
            <View style={styles.phScoreRow}>
              <Text style={[styles.phScoreLabel, { color: colors.textMuted }]}>pH Uyumu</Text>
              <View style={[styles.phScoreBar, { backgroundColor: colors.backgroundTertiary }]}>
                <LinearGradient
                  colors={phSkor.phUyumSkoru >= 70 ? ['#00D4AA', '#2ECC71'] : ['#FF8C42', '#FFB74D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.phScoreFill, { width: `${phSkor.phUyumSkoru}%` }]}
                />
              </View>
              <Text style={[styles.phScoreValue, { color: colors.textSecondary }]}>
                %{Math.round(phSkor.phUyumSkoru)}
              </Text>
            </View>

            {/* Match Reasons */}
            {result.matchReasons.length > 0 && (
              <View style={styles.reasonsContainer}>
                {result.matchReasons.slice(0, 2).map((reason, i) => (
                  <View key={i} style={styles.reasonItem}>
                    <Ionicons name="checkmark-circle" size={14} color="#00D4AA" />
                    <Text style={[styles.reasonText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {reason}
                    </Text>
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
    const typeColor = ScentTypeColors[parfum.tip] || colors.tint;

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
            {/* Hero Section */}
            <LinearGradient
              colors={[typeColor + '30', typeColor + '10', colors.background]}
              style={styles.heroGradient}
            >
              <View style={[styles.heroIcon, { backgroundColor: typeColor }]}>
                <Ionicons name="sparkles" size={40} color="#FFF" />
              </View>
            </LinearGradient>

            {/* Title */}
            <View style={styles.detailHeader}>
              <Text style={[styles.detailName, { color: colors.text }]}>{parfum.isim}</Text>
              {parfum.marka && (
                <Text style={[styles.detailMarka, { color: colors.textMuted }]}>by {parfum.marka}</Text>
              )}
              <View style={[styles.detailMatchBadge, { backgroundColor: colors.tint }]}>
                <Text style={styles.detailMatchText}>%{matchPercentage} Uyum</Text>
              </View>
              <Text style={[styles.detailDescription, { color: colors.textSecondary }]}>
                {parfum.aciklama}
              </Text>
            </View>

            {/* pH Performance */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                🧪 pH Performansı
              </Text>
              
              <View style={styles.phPerformanceGrid}>
                <View style={[styles.phPerformanceItem, { backgroundColor: colors.backgroundTertiary }]}>
                  <Text style={[styles.phPerfValue, { color: phSkor.phUyumSkoru >= 70 ? '#00D4AA' : '#FF8C42' }]}>
                    %{Math.round(phSkor.phUyumSkoru)}
                  </Text>
                  <Text style={[styles.phPerfLabel, { color: colors.textMuted }]}>pH Uyumu</Text>
                </View>
                <View style={[styles.phPerformanceItem, { backgroundColor: colors.backgroundTertiary }]}>
                  <Text style={[styles.phPerfValue, { color: colors.text }]}>
                    %{Math.round(phSkor.ustNotaPerformansi)}
                  </Text>
                  <Text style={[styles.phPerfLabel, { color: colors.textMuted }]}>Üst Nota</Text>
                </View>
                <View style={[styles.phPerformanceItem, { backgroundColor: colors.backgroundTertiary }]}>
                  <Text style={[styles.phPerfValue, { color: colors.text }]}>
                    %{Math.round(phSkor.ortaNotaPerformansi)}
                  </Text>
                  <Text style={[styles.phPerfLabel, { color: colors.textMuted }]}>Orta Nota</Text>
                </View>
                <View style={[styles.phPerformanceItem, { backgroundColor: colors.backgroundTertiary }]}>
                  <Text style={[styles.phPerfValue, { color: colors.text }]}>
                    %{Math.round(phSkor.altNotaPerformansi)}
                  </Text>
                  <Text style={[styles.phPerfLabel, { color: colors.textMuted }]}>Alt Nota</Text>
                </View>
              </View>

              <View style={[styles.phExplanation, { backgroundColor: colors.tint + '15' }]}>
                <Ionicons name="information-circle-outline" size={16} color={colors.tint} />
                <Text style={[styles.phExplanationText, { color: colors.tint }]}>{phSkor.aciklama}</Text>
              </View>
            </View>

            {/* Notes Pyramid */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🎭 Nota Piramidi</Text>
              
              <View style={styles.notesPyramid}>
                <NoteLevel 
                  label="✨ Üst Notalar" 
                  desc="İlk 15 dakika"
                  notes={parfum.notalar.ust} 
                  color="#FFE66D"
                  colors={colors}
                />
                <NoteLevel 
                  label="💫 Orta Notalar" 
                  desc="15dk - 2 saat"
                  notes={parfum.notalar.orta} 
                  color="#FF8C42"
                  colors={colors}
                />
                <NoteLevel 
                  label="🌲 Alt Notalar" 
                  desc="2+ saat, kalıcı"
                  notes={parfum.notalar.alt} 
                  color="#8B5A2B"
                  colors={colors}
                />
              </View>
            </View>

            {/* Features Grid */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📋 Özellikler</Text>
              
              <View style={styles.featuresGrid}>
                <FeatureItem icon="person-outline" label="Cinsiyet" value={parfum.cinsiyet} colors={colors} />
                <FeatureItem icon="speedometer-outline" label="Yoğunluk" value={parfum.yogunluk} colors={colors} />
                <FeatureItem icon="time-outline" label="Kalıcılık" value={parfum.kalicilik} colors={colors} />
                <FeatureItem icon="star-outline" label="Puan" value={`${parfum.puan}/5`} colors={colors} />
              </View>
            </View>

            {/* Tags */}
            {parfum.etiketler && parfum.etiketler.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>🏷️ Etiketler</Text>
                <View style={styles.tagsContainer}>
                  {parfum.etiketler.map((etiket, index) => (
                    <View key={index} style={[styles.etiketBadge, { backgroundColor: colors.backgroundTertiary }]}>
                      <Text style={[styles.etiketText, { color: colors.textSecondary }]}>#{etiket}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Gradient Background */}
      <LinearGradient
        colors={colorScheme === 'dark' 
          ? ['#0D0A14', '#150F20', '#1E1628'] 
          : ['#FDFBFF', '#F8F4FC', '#F0EAF5']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Sizin İçin Öneriler 💜</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {recommendations.length} parfüm, pH ve kişiliğinize göre
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* pH Info Card */}
        {renderPHInfo()}

        {/* Recommendations */}
        <View style={styles.recommendationsSection}>
          <Text style={[styles.sectionHeader, { color: colors.text }]}>
            ✨ En Uyumlu Parfümler
          </Text>
          {recommendations.length > 0 ? (
            recommendations.map((result, index) => renderRecommendationCard(result, index))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Öneri Bulunamadı</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Tercihlerinizi değiştirip tekrar deneyin
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.secondaryButton, { borderColor: colors.tint }]} 
          onPress={handleRestart}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.tint} />
          <Text style={[styles.secondaryButtonText, { color: colors.tint }]}>Yeniden</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.primaryButtonContainer} onPress={handleExplore}>
          <LinearGradient
            colors={['#9D4EDD', '#7B2CBF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.primaryButton, shadows.md]}
          >
            <Text style={styles.primaryButtonText}>Tümünü Keşfet</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Detail Modal */}
      {renderDetailModal()}
    </View>
  );
}

function NoteLevel({ label, desc, notes, color, colors }: {
  label: string;
  desc: string;
  notes: string[];
  color: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={[styles.noteLevel, { backgroundColor: color + '15' }]}>
      <View style={styles.noteLevelHeader}>
        <Text style={styles.noteLevelLabel}>{label}</Text>
        <Text style={[styles.noteLevelDesc, { color: colors.textMuted }]}>{desc}</Text>
      </View>
      <View style={styles.noteLevelNotes}>
        {notes.map((nota, index) => (
          <View key={index} style={[styles.notaBadge, { backgroundColor: colors.card }]}>
            <Text style={[styles.notaText, { color: colors.text }]}>{nota}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function FeatureItem({ icon, label, value, colors }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={[styles.featureItem, { backgroundColor: colors.backgroundTertiary }]}>
      <Ionicons name={icon} size={20} color={colors.tint} />
      <Text style={[styles.featureLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.featureValue, { color: colors.text }]}>{value}</Text>
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
    fontWeight: '800',
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
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    gap: Spacing.md,
  },
  phIconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phEmoji: {
    fontSize: 24,
  },
  phContent: {
    flex: 1,
  },
  phTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  phValue: {
    fontSize: 24,
    fontWeight: '800',
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
    fontWeight: '800',
  },
  phBadgeLabel: {
    fontSize: 10,
  },
  recommendationsSection: {
    gap: Spacing.md,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  rankBadge: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  cardContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleRow: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  parfumName: {
    fontSize: 16,
    fontWeight: '700',
  },
  parfumMarka: {
    fontSize: 12,
    marginTop: 2,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  matchEmoji: {
    fontSize: 12,
  },
  matchText: {
    fontSize: 14,
    fontWeight: '800',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  typeTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
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
    fontWeight: '600',
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
    fontWeight: '700',
    width: 35,
    textAlign: 'right',
  },
  reasonsContainer: {
    marginTop: Spacing.xs,
    gap: 3,
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
    padding: Spacing['3xl'],
    gap: Spacing.md,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    fontWeight: '700',
  },
  primaryButtonContainer: {
    flex: 1.5,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
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
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
  },
  heroGradient: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailHeader: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginTop: -Spacing.lg,
    marginBottom: Spacing.xl,
  },
  detailName: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  detailMarka: {
    fontSize: 14,
    marginTop: 4,
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
  sectionCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  phPerformanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  phPerformanceItem: {
    width: (width - Spacing.lg * 4 - Spacing.sm) / 2 - Spacing.sm / 2,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  phPerfValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  phPerfLabel: {
    fontSize: 11,
    marginTop: 4,
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
  notesPyramid: {
    gap: Spacing.sm,
  },
  noteLevel: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  noteLevelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  noteLevelLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  noteLevelDesc: {
    fontSize: 11,
  },
  noteLevelNotes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  notaBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  notaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  featureItem: {
    width: (width - Spacing.lg * 4 - Spacing.sm) / 2 - Spacing.sm / 2,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  featureLabel: {
    fontSize: 11,
    marginTop: Spacing.xs,
  },
  featureValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  etiketBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  etiketText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
