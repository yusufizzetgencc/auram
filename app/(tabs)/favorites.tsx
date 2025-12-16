/**
 * AROMIXEN - Favorites Tab
 * Favori parfümler, koleksiyonlar ve son görüntülenenler
 * Filtreleme, sıralama ve karşılaştırma özellikleri
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, SlideInRight } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, Button } from '@/components/ui';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { Parfum, KokuTipi } from '@/types';

type TabType = 'favorites' | 'collections' | 'recent';
type SortType = 'name' | 'type' | 'brand' | 'recent';

const TYPE_COLORS: Record<string, string> = {
  'Odunsu': '#8B4513',
  'Çiçeksi': '#FF69B4',
  'Oryantal': '#DAA520',
  'Ferah': '#87CEEB',
  'Baharatlı': '#FF4500',
  'Aquatik': '#00CED1',
};

const COLLECTION_ICONS = [
  { icon: 'heart', color: '#FF6B9D' },
  { icon: 'star', color: '#FFD700' },
  { icon: 'diamond', color: '#9D4EDD' },
  { icon: 'moon', color: '#4A90D9' },
  { icon: 'sunny', color: '#FF9500' },
  { icon: 'leaf', color: '#4CAF50' },
];

export default function FavoritesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  
  const [activeTab, setActiveTab] = useState<TabType>('favorites');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortType>('recent');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  
  const { 
    favorites,
    collections,
    recentlyViewed,
    getFavoriteParfums,
    getRecentlyViewedParfums,
    toggleFavoriteParfum,
    createNewCollection,
    removeCollection,
    addToRecentlyViewedList,
  } = useApp();

  const favoriteParfums = getFavoriteParfums();
  const recentParfums = getRecentlyViewedParfums();

  // Filtrelenmiş ve sıralanmış favoriler
  const filteredFavorites = useMemo(() => {
    let result = [...favoriteParfums];
    
    // Filtrele
    if (filterType) {
      result = result.filter(p => p.tip === filterType);
    }
    
    // Sırala
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.isim.localeCompare(b.isim));
        break;
      case 'type':
        result.sort((a, b) => a.tip.localeCompare(b.tip));
        break;
      case 'brand':
        result.sort((a, b) => a.marka.localeCompare(b.marka));
        break;
      case 'recent':
      default:
        // Zaten favori ekleme sırasına göre
        break;
    }
    
    return result;
  }, [favoriteParfums, filterType, sortBy]);

  // Mevcut koku tipleri
  const availableTypes = useMemo(() => {
    const types = new Set(favoriteParfums.map(p => p.tip));
    return Array.from(types);
  }, [favoriteParfums]);

  const tabs = [
    { id: 'favorites' as TabType, label: 'Favoriler', icon: 'heart', count: favorites.length },
    { id: 'collections' as TabType, label: 'Koleksiyonlar', icon: 'folder', count: collections.length },
    { id: 'recent' as TabType, label: 'Son Görüntülenen', icon: 'time', count: recentlyViewed.length },
  ];

  // Karşılaştırma için seç
  const toggleCompareSelection = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(prev => prev.filter(i => i !== id));
    } else if (selectedForCompare.length < 3) {
      setSelectedForCompare(prev => [...prev, id]);
    } else {
      Alert.alert('Uyarı', 'En fazla 3 parfüm karşılaştırabilirsiniz');
    }
  };

  // Karşılaştırmaya git
  const goToCompare = () => {
    if (selectedForCompare.length >= 2) {
      router.push(`/compare?ids=${selectedForCompare.join(',')}`);
      setCompareMode(false);
      setSelectedForCompare([]);
    } else {
      Alert.alert('Uyarı', 'En az 2 parfüm seçmelisiniz');
    }
  };

  // Parfüm aç
  const handleOpenParfum = (parfum: Parfum) => {
    addToRecentlyViewedList(parfum.id);
    router.push(`/parfum/${parfum.id}`);
  };

  // Koleksiyon oluştur
  const handleCreateCollection = () => {
    Alert.prompt(
      'Yeni Koleksiyon',
      'Koleksiyon adını girin:',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Oluştur', 
          onPress: async (name) => {
            if (name && name.trim()) {
              const randomIcon = COLLECTION_ICONS[Math.floor(Math.random() * COLLECTION_ICONS.length)];
              await createNewCollection(name.trim(), randomIcon.icon, randomIcon.color);
            }
          }
        },
      ],
      'plain-text'
    );
  };

  // Koleksiyon sil
  const handleDeleteCollection = (id: string, name: string) => {
    Alert.alert(
      'Koleksiyonu Sil',
      `"${name}" koleksiyonunu silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => removeCollection(id) },
      ]
    );
  };

  // Favoriler tab içeriği
  const renderFavorites = () => {
    if (favoriteParfums.length === 0) {
      return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.tint + '15' }]}>
            <Ionicons name="heart-outline" size={48} color={colors.tint} />
          </View>
          <ThemedText type="subtitle" center style={{ marginTop: Spacing.lg }}>
            Henüz favori yok
          </ThemedText>
          <ThemedText type="body" center style={styles.emptyText}>
            Parfümlere dokunarak favorilere ekleyebilirsiniz
          </ThemedText>
          <Button 
            title="Parfümleri Keşfet" 
            onPress={() => router.push('/(tabs)')}
            style={{ marginTop: Spacing.xl }}
          />
        </Animated.View>
      );
    }

  return (
      <Animated.View entering={FadeIn.duration(400)}>
        {/* Toolbar */}
        <View style={styles.toolbar}>
          {/* Filters */}
        <ScrollView
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <Pressable
              onPress={() => setFilterType(null)}
              style={[
                styles.filterChip,
                !filterType && { backgroundColor: colors.tint + '20' }
              ]}
            >
              <ThemedText style={[styles.filterText, !filterType && { color: colors.tint }]}>
                Tümü
              </ThemedText>
                </Pressable>
            
            {availableTypes.map((type) => (
              <Pressable
                key={type}
                onPress={() => setFilterType(type === filterType ? null : type)}
                style={[
                  styles.filterChip,
                  filterType === type && { backgroundColor: (TYPE_COLORS[type] || colors.tint) + '20' }
                ]}
              >
                <View style={[styles.filterDot, { backgroundColor: TYPE_COLORS[type] || colors.tint }]} />
                <ThemedText style={[styles.filterText, filterType === type && { color: TYPE_COLORS[type] || colors.tint }]}>
                  {type}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>

          {/* Actions */}
          <View style={styles.toolbarActions}>
            <Pressable
              onPress={() => {
                setCompareMode(!compareMode);
                setSelectedForCompare([]);
              }}
              style={[styles.actionBtn, compareMode && { backgroundColor: colors.tint + '20' }]}
            >
              <Ionicons 
                name="git-compare-outline" 
                size={20} 
                color={compareMode ? colors.tint : colors.textMuted} 
              />
            </Pressable>
            
            <Pressable
              onPress={() => {
                const sorts: SortType[] = ['recent', 'name', 'type', 'brand'];
                const current = sorts.indexOf(sortBy);
                setSortBy(sorts[(current + 1) % sorts.length]);
              }}
              style={styles.actionBtn}
            >
              <Ionicons name="swap-vertical-outline" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Sort indicator */}
        <View style={styles.sortIndicator}>
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            Sıralama: {sortBy === 'recent' ? 'Son Eklenen' : sortBy === 'name' ? 'İsim' : sortBy === 'type' ? 'Tip' : 'Marka'}
          </ThemedText>
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            {filteredFavorites.length} parfüm
          </ThemedText>
        </View>

        {/* Compare mode banner */}
        {compareMode && (
          <Animated.View entering={FadeInDown.duration(300)} style={[styles.compareBanner, { backgroundColor: colors.tint + '10' }]}>
            <View style={styles.compareBannerLeft}>
              <Ionicons name="git-compare-outline" size={20} color={colors.tint} />
              <ThemedText style={{ color: colors.tint }}>
                {selectedForCompare.length}/3 seçildi
              </ThemedText>
            </View>
            
            <View style={styles.compareBannerActions}>
              <Pressable 
                onPress={() => {
                  setCompareMode(false);
                  setSelectedForCompare([]);
                }}
                style={styles.compareBannerBtn}
              >
                <ThemedText style={{ color: colors.textMuted }}>İptal</ThemedText>
              </Pressable>
              
              <Button
                title="Karşılaştır"
                onPress={goToCompare}
                disabled={selectedForCompare.length < 2}
                size="sm"
              />
            </View>
          </Animated.View>
        )}

        {/* Parfüm listesi */}
        <View style={styles.listContainer}>
          {filteredFavorites.map((parfum, index) => (
            <ParfumCard 
              key={parfum.id} 
              parfum={parfum} 
              colors={colors}
              isDark={isDark}
              isFavorite={true}
              isSelected={selectedForCompare.includes(parfum.id)}
              compareMode={compareMode}
              onPress={() => compareMode ? toggleCompareSelection(parfum.id) : handleOpenParfum(parfum)}
              onToggleFavorite={() => toggleFavoriteParfum(parfum.id)}
              delay={index * 50}
            />
          ))}
        </View>
      </Animated.View>
    );
  };

  // Koleksiyonlar tab içeriği
  const renderCollections = () => {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.listContainer}>
        {/* Add Collection Button */}
        <Pressable onPress={handleCreateCollection}>
          <Card variant="elevated" style={styles.addCollectionCard}>
            <View style={[styles.addIcon, { backgroundColor: colors.tint + '15' }]}>
              <Ionicons name="add" size={28} color={colors.tint} />
            </View>
            <ThemedText type="subtitle">Yeni Koleksiyon</ThemedText>
            <ThemedText type="caption" style={{ opacity: 0.7 }}>
              Parfümlerinizi organize edin
            </ThemedText>
          </Card>
        </Pressable>

        {collections.length === 0 ? (
          <View style={styles.emptyCollections}>
            <ThemedText type="body" center style={{ opacity: 0.6 }}>
              Henüz koleksiyon oluşturmadınız
            </ThemedText>
          </View>
        ) : (
          collections.map((collection, index) => (
            <Animated.View 
              key={collection.id} 
              entering={FadeInDown.delay(index * 50).duration(400)}
            >
              <Card variant="elevated" style={styles.collectionCard}>
                <View style={styles.collectionHeader}>
                  <View style={[styles.collectionIcon, { backgroundColor: collection.color + '20' }]}>
                    <Ionicons 
                      name={collection.icon as keyof typeof Ionicons.glyphMap} 
                      size={24} 
                      color={collection.color} 
                    />
                  </View>
                  <View style={styles.collectionInfo}>
                    <ThemedText type="subtitle">{collection.name}</ThemedText>
                    <ThemedText type="caption" style={{ opacity: 0.6 }}>
                      {collection.parfumIds.length} parfüm
                  </ThemedText>
                  </View>
                  <Pressable 
                    onPress={() => handleDeleteCollection(collection.id, collection.name)}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </Pressable>
                </View>
              </Card>
            </Animated.View>
          ))
        )}
      </Animated.View>
    );
  };

  // Son görüntülenenler tab içeriği
  const renderRecent = () => {
    if (recentParfums.length === 0) {
      return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.tint + '15' }]}>
            <Ionicons name="time-outline" size={48} color={colors.tint} />
              </View>
          <ThemedText type="subtitle" center style={{ marginTop: Spacing.lg }}>
            Son görüntülenen yok
          </ThemedText>
          <ThemedText type="body" center style={styles.emptyText}>
            Parfümleri incelediğinizde burada görünecekler
          </ThemedText>
        </Animated.View>
      );
    }

    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.listContainer}>
        {recentParfums.map((parfum, index) => (
          <ParfumCard 
            key={parfum.id} 
            parfum={parfum} 
                  colors={colors}
            isDark={isDark}
            isFavorite={favorites.includes(parfum.id)}
            isSelected={false}
            compareMode={false}
            onPress={() => handleOpenParfum(parfum)}
            onToggleFavorite={() => toggleFavoriteParfum(parfum.id)}
            delay={index * 50}
                />
              ))}
            </Animated.View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>Koleksiyonum</ThemedText>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}
          >
            {tabs.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.tab,
                  activeTab === tab.id && { backgroundColor: colors.tint + '15' }
                ]}
              >
                <Ionicons 
                  name={(activeTab === tab.id ? tab.icon : tab.icon + '-outline') as keyof typeof Ionicons.glyphMap}
                  size={18} 
                  color={activeTab === tab.id ? colors.tint : colors.textMuted} 
                />
                <ThemedText 
                  style={[
                    styles.tabLabel,
                    { color: activeTab === tab.id ? colors.tint : colors.textMuted }
                  ]}
                >
                  {tab.label}
                </ThemedText>
                {tab.count > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: activeTab === tab.id ? colors.tint : colors.textMuted }]}>
                    <ThemedText style={styles.tabBadgeText}>{tab.count}</ThemedText>
                </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
              </View>
              
        {/* Content */}
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'favorites' && renderFavorites()}
          {activeTab === 'collections' && renderCollections()}
          {activeTab === 'recent' && renderRecent()}
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// Parfüm Kartı
function ParfumCard({ 
  parfum, 
  colors, 
  isDark,
  isFavorite,
  isSelected,
  compareMode,
  onPress,
  onToggleFavorite,
  delay = 0,
}: { 
  parfum: Parfum;
  colors: typeof Colors.light;
  isDark: boolean;
  isFavorite: boolean;
  isSelected: boolean;
  compareMode: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  delay?: number;
}) {
  const typeColor = TYPE_COLORS[parfum.tip] || colors.tint;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
    <Pressable onPress={onPress}>
        <Card 
          variant="elevated" 
          style={[
            styles.parfumCard,
            isSelected && { borderColor: colors.tint, borderWidth: 2 }
          ]}
        >
          {compareMode && (
            <View style={[styles.selectIndicator, { backgroundColor: isSelected ? colors.tint : colors.backgroundTertiary }]}>
              {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
        </View>
          )}
          
          <View style={styles.parfumHeader}>
            <View style={[styles.parfumType, { backgroundColor: typeColor + '20' }]}>
              <ThemedText style={[styles.parfumTypeText, { color: typeColor }]}>
                {parfum.tip}
        </ThemedText>
            </View>
            {!compareMode && (
              <Pressable onPress={onToggleFavorite} style={styles.favoriteBtn}>
                <Ionicons 
                  name={isFavorite ? 'heart' : 'heart-outline'} 
                  size={22} 
                  color={isFavorite ? '#FF6B9D' : colors.textMuted} 
                />
    </Pressable>
            )}
        </View>
        
          <ThemedText type="subtitle" style={styles.parfumName}>
            {parfum.isim}
          </ThemedText>
          <ThemedText type="caption" style={[styles.parfumBrand, { color: colors.textMuted }]}>
            {parfum.marka}
          </ThemedText>
          
          <View style={styles.parfumMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="water-outline" size={14} color={colors.textMuted} />
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                pH: {parfum.phUyumu.idealPH}
              </ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                {parfum.kalicilik}
            </ThemedText>
          </View>
            <View style={styles.metaItem}>
              <Ionicons name="speedometer-outline" size={14} color={colors.textMuted} />
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                {parfum.yogunluk}
              </ThemedText>
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
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSizes['2xl'],
  },
  tabsContainer: {
    paddingBottom: Spacing.md,
  },
  tabs: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  tabLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: FontWeights.bold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  filterScroll: {
    flex: 1,
    gap: Spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterText: {
    fontSize: FontSizes.sm,
  },
  toolbarActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  actionBtn: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  sortIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  compareBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  compareBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  compareBannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  compareBannerBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  listContainer: {
    gap: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: Spacing.sm,
    opacity: 0.6,
  },
  addCollectionCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: 'rgba(157, 78, 221, 0.3)',
  },
  addIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyCollections: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  collectionCard: {
    marginBottom: Spacing.sm,
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collectionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  collectionInfo: {
    flex: 1,
  },
  deleteBtn: {
    padding: Spacing.sm,
  },
  parfumCard: {
    padding: Spacing.lg,
    position: 'relative',
  },
  selectIndicator: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  parfumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  parfumType: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  parfumTypeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
  },
  favoriteBtn: {
    padding: Spacing.xs,
  },
  parfumName: {
    marginBottom: 2,
  },
  parfumBrand: {
    marginBottom: Spacing.sm,
  },
  parfumMeta: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
