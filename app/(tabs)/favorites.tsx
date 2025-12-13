/**
 * AROMIXEN - Premium Favorites Tab
 * Elegant collection management with stunning visuals
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolateColor 
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';

const { width } = Dimensions.get('window');

// Gradient colors for categories
const COLLECTION_GRADIENTS = {
  romantic: ['#FF6B9D', '#FF8A80'],
  fresh: ['#00D4AA', '#4ECDC4'],
  woody: ['#8B7355', '#A0845C'],
  oriental: ['#9D4EDD', '#C77DFF'],
  citrus: ['#FFB347', '#FFCC70'],
};

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { recommendations, parfumler, preferences } = useApp();
  const [activeCollection, setActiveCollection] = useState('all');

  // Get top recommendations as "suggested favorites"
  const suggestedFavorites = recommendations.slice(0, 5);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Premium Header */}
          <Animated.View 
            entering={FadeInDown.delay(100).duration(600)}
            style={styles.header}
          >
            <LinearGradient
              colors={[colors.tint + '15', 'transparent']}
              style={styles.headerGradient}
            >
              <View style={styles.headerTop}>
                <View>
                  <ThemedText type="label" style={styles.headerLabel}>KOLEKSİYON</ThemedText>
                  <ThemedText type="title" style={styles.headerTitle}>Favorilerim</ThemedText>
                </View>
                <Pressable style={[styles.settingsButton, { backgroundColor: colors.card }]}>
                  <Ionicons name="options-outline" size={22} color={colors.tint} />
                </Pressable>
              </View>
              
              {/* Stats Row */}
              <View style={styles.statsRow}>
                <StatBadge 
                  icon="heart" 
                  value={0} 
                  label="Favori" 
                  gradient={['#FF6B9D', '#FF8A80']} 
                />
                <StatBadge 
                  icon="eye" 
                  value={parfumler.length} 
                  label="Keşfedildi" 
                  gradient={['#9D4EDD', '#C77DFF']} 
                />
                <StatBadge 
                  icon="checkmark-circle" 
                  value={recommendations.length} 
                  label="Öneri" 
                  gradient={['#00D4AA', '#4ECDC4']} 
                />
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Collections Section */}
          <Animated.View 
            entering={FadeInDown.delay(200).duration(600)}
            style={styles.collectionsSection}
          >
            <View style={styles.sectionHeader}>
              <ThemedText type="heading">Koleksiyonlar</ThemedText>
              <Pressable>
                <ThemedText style={[styles.seeAllText, { color: colors.tint }]}>
                  Tümünü Gör
                </ThemedText>
              </Pressable>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.collectionsScroll}
            >
              <CollectionCard 
                title="Romantik" 
                count={0} 
                icon="heart"
                gradient={COLLECTION_GRADIENTS.romantic}
                isActive={activeCollection === 'romantic'}
                onPress={() => setActiveCollection('romantic')}
              />
              <CollectionCard 
                title="Ferah" 
                count={0} 
                icon="water"
                gradient={COLLECTION_GRADIENTS.fresh}
                isActive={activeCollection === 'fresh'}
                onPress={() => setActiveCollection('fresh')}
              />
              <CollectionCard 
                title="Odunsu" 
                count={0} 
                icon="leaf"
                gradient={COLLECTION_GRADIENTS.woody}
                isActive={activeCollection === 'woody'}
                onPress={() => setActiveCollection('woody')}
              />
              <CollectionCard 
                title="Oryantal" 
                count={0} 
                icon="sparkles"
                gradient={COLLECTION_GRADIENTS.oriental}
                isActive={activeCollection === 'oriental'}
                onPress={() => setActiveCollection('oriental')}
              />
            </ScrollView>
          </Animated.View>

          {/* Suggested Section */}
          {suggestedFavorites.length > 0 && (
            <Animated.View 
              entering={FadeInDown.delay(300).duration(600)}
              style={styles.suggestedSection}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="bulb" size={20} color={colors.tint} />
                  <ThemedText type="heading" style={{ marginLeft: Spacing.sm }}>
                    Beğenebileceğin
                  </ThemedText>
                </View>
              </View>
              
              {suggestedFavorites.map((item, index) => (
                <SuggestedPerfumeCard 
                  key={item.parfum.id}
                  perfume={item.parfum}
                  matchScore={item.uyumYuzdesi}
                  index={index}
                  colors={colors}
                />
              ))}
            </Animated.View>
          )}

          {/* Empty State - When no favorites */}
          <Animated.View 
            entering={FadeInDown.delay(400).duration(600)}
            style={styles.emptySection}
          >
            <Card variant="elevated" style={styles.emptyCard}>
              <LinearGradient
                colors={[colors.tint + '10', 'transparent']}
                style={styles.emptyGradient}
              >
                <View style={[styles.emptyIconContainer, { backgroundColor: colors.tint + '15' }]}>
                  <Ionicons name="heart-outline" size={48} color={colors.tint} />
                </View>
                
                <ThemedText type="heading" center style={styles.emptyTitle}>
                  Koleksiyon Oluştur
                </ThemedText>
                <ThemedText type="body" center style={styles.emptyDescription}>
                  Beğendiğin parfümleri favorilere ekle, kendi koleksiyonunu oluştur
                </ThemedText>

                {/* Feature Preview Grid */}
                <View style={styles.featuresGrid}>
                  <FeaturePreview 
                    icon="heart" 
                    title="Favori Ekle" 
                    description="Parfümleri kaydet"
                    gradient={['#FF6B9D', '#FF8A80']}
                  />
                  <FeaturePreview 
                    icon="folder-open" 
                    title="Koleksiyonlar" 
                    description="Kategorize et"
                    gradient={['#9D4EDD', '#C77DFF']}
                  />
                  <FeaturePreview 
                    icon="share-social" 
                    title="Paylaş" 
                    description="Arkadaşlarına gönder"
                    gradient={['#00D4AA', '#4ECDC4']}
                  />
                  <FeaturePreview 
                    icon="notifications" 
                    title="Bildirimler" 
                    description="Fiyat takibi"
                    gradient={['#FFB347', '#FFCC70']}
                  />
                </View>
              </LinearGradient>
            </Card>
          </Animated.View>

          {/* Coming Soon Banner */}
          <Animated.View 
            entering={FadeInUp.delay(500).duration(600)}
            style={styles.comingSoonBanner}
          >
            <LinearGradient
              colors={[colors.tint, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerGradient}
            >
              <View style={styles.bannerContent}>
                <View style={styles.bannerIcon}>
                  <Ionicons name="rocket" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.bannerText}>
                  <ThemedText style={styles.bannerTitle}>Yakında Aktif!</ThemedText>
                  <ThemedText style={styles.bannerSubtitle}>
                    Favori özelliği çok yakında kullanılabilir olacak
                  </ThemedText>
                </View>
              </View>
              
              {/* Decorative Elements */}
              <View style={[styles.bannerDecor, styles.bannerDecor1]} />
              <View style={[styles.bannerDecor, styles.bannerDecor2]} />
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// Stat Badge Component
function StatBadge({ 
  icon, 
  value, 
  label, 
  gradient 
}: { 
  icon: keyof typeof Ionicons.glyphMap; 
  value: number; 
  label: string;
  gradient: string[];
}) {
  return (
    <View style={styles.statBadge}>
      <LinearGradient
        colors={gradient}
        style={styles.statIconBg}
      >
        <Ionicons name={icon} size={16} color="#FFFFFF" />
      </LinearGradient>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText type="caption" style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

// Collection Card Component
function CollectionCard({ 
  title, 
  count, 
  icon, 
  gradient, 
  isActive, 
  onPress 
}: { 
  title: string; 
  count: number; 
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={isActive ? gradient : [gradient[0] + '20', gradient[1] + '10']}
        style={[styles.collectionCard, isActive && styles.collectionCardActive]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.collectionIcon, { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : gradient[0] + '30' }]}>
          <Ionicons name={icon} size={20} color={isActive ? '#FFFFFF' : gradient[0]} />
        </View>
        <ThemedText style={[styles.collectionTitle, isActive && styles.collectionTitleActive]}>
          {title}
        </ThemedText>
        <ThemedText style={[styles.collectionCount, isActive && styles.collectionCountActive]}>
          {count} parfüm
        </ThemedText>
      </LinearGradient>
    </Pressable>
  );
}

// Suggested Perfume Card
function SuggestedPerfumeCard({ 
  perfume, 
  matchScore, 
  index, 
  colors 
}: { 
  perfume: any; 
  matchScore: number; 
  index: number;
  colors: typeof Colors.light;
}) {
  const getTipColor = (tip: string) => {
    const tipColors: Record<string, string> = {
      'Çiçeksi': '#E8A4C9',
      'Odunsu': '#8B7355',
      'Ferah': '#7EC8E3',
      'Amber': '#D4A574',
      'Baharatlı': '#C75B39',
      'Meyvemsi': '#FF6B6B',
      'Tatlı': '#FFB6C1',
      'Yeşil': '#90EE90',
      'Oryantal': '#9D4EDD',
      'Aquatik': '#00CED1',
    };
    return tipColors[tip] || colors.tint;
  };

  return (
    <Animated.View entering={FadeInDown.delay(100 * index).duration(400)}>
      <Pressable style={[styles.suggestedCard, { backgroundColor: colors.card }]}>
        <View style={[styles.suggestedIcon, { backgroundColor: getTipColor(perfume.tip) + '20' }]}>
          <Ionicons name="sparkles" size={24} color={getTipColor(perfume.tip)} />
        </View>
        
        <View style={styles.suggestedInfo}>
          <ThemedText type="subtitle" numberOfLines={1}>{perfume.isim}</ThemedText>
          <View style={styles.suggestedMeta}>
            <View style={[styles.typeBadge, { backgroundColor: getTipColor(perfume.tip) + '20' }]}>
              <ThemedText style={[styles.typeText, { color: getTipColor(perfume.tip) }]}>
                {perfume.tip}
              </ThemedText>
            </View>
            <ThemedText type="caption" style={{ marginLeft: Spacing.sm }}>
              {perfume.marka || 'Premium'}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.suggestedRight}>
          <View style={[styles.matchBadge, { backgroundColor: colors.tint + '15' }]}>
            <ThemedText style={[styles.matchText, { color: colors.tint }]}>
              %{matchScore}
            </ThemedText>
          </View>
          <Pressable style={[styles.addButton, { borderColor: colors.border }]}>
            <Ionicons name="heart-outline" size={20} color={colors.tint} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Feature Preview Component
function FeaturePreview({ 
  icon, 
  title, 
  description, 
  gradient 
}: { 
  icon: keyof typeof Ionicons.glyphMap; 
  title: string; 
  description: string;
  gradient: string[];
}) {
  return (
    <View style={styles.featureItem}>
      <LinearGradient
        colors={gradient}
        style={styles.featureIconBg}
      >
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </LinearGradient>
      <ThemedText style={styles.featureTitle}>{title}</ThemedText>
      <ThemedText type="caption" style={styles.featureDesc}>{description}</ThemedText>
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
    paddingBottom: Spacing['4xl'],
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerGradient: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLabel: {
    opacity: 0.7,
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSizes['3xl'],
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing['2xl'],
    gap: Spacing.lg,
  },
  statBadge: {
    flex: 1,
    alignItems: 'center',
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  statLabel: {
    opacity: 0.7,
  },
  collectionsSection: {
    marginBottom: Spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  collectionsScroll: {
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.md,
  },
  collectionCard: {
    width: 120,
    height: 140,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  collectionCardActive: {
    transform: [{ scale: 1.02 }],
  },
  collectionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  collectionTitleActive: {
    color: '#FFFFFF',
  },
  collectionCount: {
    fontSize: FontSizes.xs,
    opacity: 0.7,
  },
  collectionCountActive: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  suggestedSection: {
    marginBottom: Spacing['2xl'],
  },
  suggestedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  suggestedIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestedInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  suggestedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  suggestedRight: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  matchBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  matchText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySection: {
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing['2xl'],
  },
  emptyCard: {
    overflow: 'hidden',
  },
  emptyGradient: {
    padding: Spacing['2xl'],
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    opacity: 0.7,
    marginBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.lg,
    width: '100%',
  },
  featureItem: {
    width: (width - Spacing['2xl'] * 2 - Spacing.lg * 3) / 2,
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  featureIconBg: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  featureTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
    marginBottom: 2,
  },
  featureDesc: {
    opacity: 0.6,
    textAlign: 'center',
  },
  comingSoonBanner: {
    marginHorizontal: Spacing['2xl'],
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  bannerGradient: {
    padding: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  bannerIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerText: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  bannerDecor: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 100,
  },
  bannerDecor1: {
    width: 100,
    height: 100,
    top: -30,
    right: -20,
  },
  bannerDecor2: {
    width: 60,
    height: 60,
    bottom: -20,
    right: 40,
  },
});
