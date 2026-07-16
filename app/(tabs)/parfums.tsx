/**
 * AURAM - Parfümler Sayfası
 * Tüm parfümlerin listesi, arama ve filtreleme
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button, Card } from '@/components/ui';
import { PaywallScreen } from '@/components/paywall';
import { BorderRadius, Colors, FontSizes, FontWeights, ScentTypeColors, Spacing } from '@/constants/theme';
import { FREE_FAVORITE_LIMIT } from '@/constants/premiumLimits';
import { useApp } from '@/context/AppContext';
import { usePremiumGate } from '@/hooks/use-premium-gate';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Parfum } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ScentTypeColors imported from theme

type SortType = 'name' | 'type' | 'brand';

export default function ParfumsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const {
    parfumler,
    favorites,
    isFavorite,
    toggleFavoriteParfum,
    addToRecentlyViewedList,
  } = useApp();
  const { isPremium, paywallVisible, setPaywallVisible } = usePremiumGate();

  const handleToggleFavorite = (parfumId: string) => {
    const currentlyFavorite = isFavorite(parfumId);
    if (!currentlyFavorite && !isPremium && favorites.length >= FREE_FAVORITE_LIMIT) {
      setPaywallVisible(true);
      return;
    }
    toggleFavoriteParfum(parfumId);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortType>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);

  // Koku tipleri
  const scentTypes = useMemo(() => {
    const types = new Set(parfumler.map(p => p.tip));
    return Array.from(types);
  }, [parfumler]);

  // Filtrelenmiş ve sıralanmış parfümler
  const filteredParfums = useMemo(() => {
    let result = [...parfumler];
    
    // Arama
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.isim.toLowerCase().includes(query) ||
        (p.marka && p.marka.toLowerCase().includes(query)) ||
        p.tip.toLowerCase().includes(query) ||
        p.notalar.ust.some(n => n.toLowerCase().includes(query)) ||
        p.notalar.orta.some(n => n.toLowerCase().includes(query)) ||
        p.notalar.alt.some(n => n.toLowerCase().includes(query))
      );
    }
    
    // Tip filtresi
    if (selectedType) {
      result = result.filter(p => p.tip === selectedType);
    }
    
    // Bütçe filtresi
    if (selectedBudget) {
      result = result.filter(p => p.fiyatAraligi === selectedBudget);
    }
    
    // Sıralama
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.isim.localeCompare(b.isim));
        break;
      case 'type':
        result.sort((a, b) => a.tip.localeCompare(b.tip));
        break;
      case 'brand':
        result.sort((a, b) => (a.marka || '').localeCompare(b.marka || ''));
        break;
    }
    
    return result;
  }, [parfumler, searchQuery, selectedType, sortBy, selectedBudget]);

  const handleOpenParfum = (parfum: Parfum) => {
    addToRecentlyViewedList(parfum.id);
    router.push(`/parfum/${parfum.id}`);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <ThemedText type="title" style={styles.headerTitle}>Parfümler</ThemedText>
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                {filteredParfums.length} parfüm
              </ThemedText>
            </View>
            
            <View style={styles.headerActions}>
              <Pressable 
                onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                style={[styles.actionBtn, { backgroundColor: colors.backgroundTertiary }]}
              >
                <Ionicons name={viewMode === 'grid' ? 'list' : 'grid'} size={18} color={colors.text} />
              </Pressable>
              <Pressable 
                onPress={() => setIsFilterModalVisible(true)}
                style={[styles.actionBtn, { backgroundColor: colors.backgroundTertiary, width: 'auto', paddingHorizontal: Spacing.sm, flexDirection: 'row', gap: 6 }]}
              >
                <Ionicons name="options-outline" size={18} color={colors.text} />
                <ThemedText style={{ fontSize: FontSizes.sm, fontWeight: FontWeights.semiBold }}>
                  {sortBy === 'name' ? 'İsim' : sortBy === 'type' ? 'Tip' : 'Marka'}
                </ThemedText>
              </Pressable>
            </View>
          </View>
          
          {/* Search */}
          <View style={[styles.searchBox, { backgroundColor: colors.card }]}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Parfüm, marka veya nota ara..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
          
        </Animated.View>

        {/* Filters */}
        <View style={styles.filtersWrapper}>
          {selectedBudget && (
            <View style={{ paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm }}>
              <Pressable 
                onPress={() => setSelectedBudget(null)} 
                style={[styles.budgetActiveChip, { backgroundColor: colors.tint + '15', borderColor: colors.tint }]}
              >
                <ThemedText style={{ color: colors.tint, fontSize: FontSizes.sm, fontWeight: FontWeights.semiBold }}>
                  Fiyat: {selectedBudget.charAt(0).toUpperCase() + selectedBudget.slice(1)}
                </ThemedText>
                <Ionicons name="close" size={16} color={colors.tint} style={{ marginLeft: 4 }} />
              </Pressable>
            </View>
          )}

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            <Pressable
              onPress={() => setSelectedType(null)}
              style={[styles.filterChip, !selectedType && { backgroundColor: colors.tint + '15' }]}
            >
              <ThemedText style={[styles.filterText, !selectedType ? { color: colors.tint } : {}]}>Tümü</ThemedText>
            </Pressable>
            
            {scentTypes.map((type) => (
              <Pressable
                key={type}
                onPress={() => setSelectedType(type === selectedType ? null : type)}
                style={[
                  styles.filterChip, 
                  selectedType === type && { backgroundColor: (ScentTypeColors[type] || colors.tint) + '15' }
                ]}
              >
                <View style={[styles.filterDot, { backgroundColor: ScentTypeColors[type] || colors.tint }]} />
                <ThemedText 
                  style={[styles.filterText, selectedType === type ? { color: ScentTypeColors[type] || colors.tint } : {}]}
                >
                  {type}
                </ThemedText>
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
          {filteredParfums.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <ThemedText type="subtitle" center style={{ marginTop: Spacing.md }}>Sonuç bulunamadı</ThemedText>
              <ThemedText type="body" center style={{ color: colors.textMuted, marginTop: Spacing.xs }}>
                Farklı anahtar kelimeler deneyin
              </ThemedText>
            </View>
          ) : viewMode === 'grid' ? (
            <View style={styles.gridContainer}>
              {filteredParfums.map((parfum, index) => (
                <GridCard
                  key={parfum.id}
                  parfum={parfum}
                  colors={colors}
                  isFavorite={isFavorite(parfum.id)}
                  onPress={() => handleOpenParfum(parfum)}
                  onToggleFavorite={() => handleToggleFavorite(parfum.id)}
                  delay={index * 20}
                />
              ))}
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredParfums.map((parfum, index) => (
                <ListCard
                  key={parfum.id}
                  parfum={parfum}
                  colors={colors}
                  isFavorite={isFavorite(parfum.id)}
                  onPress={() => handleOpenParfum(parfum)}
                  onToggleFavorite={() => handleToggleFavorite(parfum.id)}
                  delay={index * 15}
                />
              ))}
            </View>
          )}
          
          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>

      <Modal visible={isFilterModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsFilterModalVisible(false)}>
        <ThemedView style={styles.modalContainer}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <ThemedText type="heading">Sırala ve Filtrele</ThemedText>
              <Pressable onPress={() => setIsFilterModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Sıralama */}
              <View style={styles.filterSection}>
                <ThemedText type="subtitle" style={styles.filterSectionTitle}>Sıralama</ThemedText>
                <View style={styles.radioGroup}>
                  {[
                    { id: 'name', label: 'İsim (A-Z)' },
                    { id: 'type', label: 'Koku Tipi (A-Z)' },
                    { id: 'brand', label: 'Marka (A-Z)' }
                  ].map(option => (
                    <Pressable 
                      key={option.id} 
                      style={styles.radioRow}
                      onPress={() => {
                        setSortBy(option.id as SortType);
                        // setIsFilterModalVisible(false); // Let user select budget too before closing
                      }}
                    >
                      <ThemedText>{option.label}</ThemedText>
                      {sortBy === option.id && <Ionicons name="checkmark" size={20} color={colors.tint} />}
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Fiyat Aralığı */}
              <View style={[styles.filterSection, { borderBottomWidth: 0 }]}>
                <ThemedText type="subtitle" style={styles.filterSectionTitle}>Fiyat Aralığı</ThemedText>
                <View style={styles.budgetGrid}>
                  {['Tümü', 'ekonomik', 'orta', 'premium', 'luks'].map(budget => {
                    const isSelected = budget === 'Tümü' ? selectedBudget === null : selectedBudget === budget;
                    return (
                      <Pressable
                        key={budget}
                        onPress={() => setSelectedBudget(budget === 'Tümü' ? null : budget)}
                        style={[
                          styles.budgetChip,
                          { backgroundColor: colors.backgroundTertiary },
                          isSelected && { backgroundColor: colors.tint, borderColor: colors.tint }
                        ]}
                      >
                        <ThemedText style={{ color: isSelected ? '#FFF' : colors.text }}>
                          {budget.charAt(0).toUpperCase() + budget.slice(1)}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Sonuçları Göster" onPress={() => setIsFilterModalVisible(false)} fullWidth />
            </View>
          </SafeAreaView>
        </ThemedView>
      </Modal>

      <PaywallScreen
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        title="Sınırsız Favori"
        subtitle="Daha fazla parfümü favorilerine eklemek için Premium'a geç."
      />
    </ThemedView>
  );
}

// Grid Card
function GridCard({ parfum, colors, isFavorite, onPress, onToggleFavorite, delay = 0 }: {
  parfum: Parfum;
  colors: typeof Colors.light;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  delay?: number;
}) {
  const typeColor = ScentTypeColors[parfum.tip] || colors.tint;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)} style={styles.gridItem}>
      <Pressable onPress={onPress}>
        <Card variant="elevated" style={styles.gridCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.typeBadge, { backgroundColor: typeColor + '15' }]}>
              <ThemedText style={[styles.typeText, { color: typeColor }]}>{parfum.tip}</ThemedText>
            </View>
            <Pressable onPress={onToggleFavorite} hitSlop={8}>
              <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? colors.accent : colors.textMuted} />
            </Pressable>
          </View>
          
          <View style={[styles.iconContainer, { backgroundColor: typeColor + '10' }]}>
            <Ionicons name="sparkles" size={24} color={typeColor} />
          </View>
          
          <ThemedText type="subtitle" numberOfLines={2} style={styles.cardName}>{parfum.isim}</ThemedText>
          <ThemedText type="caption" numberOfLines={1} style={{ color: colors.textMuted }}>{parfum.marka}</ThemedText>
          
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={10} color={colors.textMuted} />
              <ThemedText style={[styles.metaText, { color: colors.textMuted }]}>{parfum.kalicilik}</ThemedText>
            </View>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
}

// List Card
function ListCard({ parfum, colors, isFavorite, onPress, onToggleFavorite, delay = 0 }: {
  parfum: Parfum;
  colors: typeof Colors.light;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  delay?: number;
}) {
  const typeColor = ScentTypeColors[parfum.tip] || colors.tint;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <Pressable onPress={onPress}>
        <Card variant="elevated" style={styles.listCard}>
          <View style={[styles.listIcon, { backgroundColor: typeColor + '15' }]}>
            <Ionicons name="sparkles" size={20} color={typeColor} />
          </View>
          
          <View style={styles.listInfo}>
            <ThemedText type="subtitle" numberOfLines={1}>{parfum.isim}</ThemedText>
            <ThemedText type="caption" numberOfLines={1} style={{ color: colors.textMuted }}>{parfum.marka}</ThemedText>
            <View style={styles.listMeta}>
              <View style={[styles.typeBadgeSmall, { backgroundColor: typeColor + '15' }]}>
                <ThemedText style={[styles.typeTextSmall, { color: typeColor }]}>{parfum.tip}</ThemedText>
              </View>
              <ThemedText type="caption" style={{ color: colors.textMuted }}>{parfum.kalicilik}</ThemedText>
            </View>
          </View>
          
          <Pressable onPress={onToggleFavorite} hitSlop={10}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={isFavorite ? colors.accent : colors.textMuted} />
          </Pressable>
        </Card>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  headerTitle: { fontSize: FontSizes.xl },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, gap: Spacing.sm },
  searchInput: { flex: 1, fontSize: FontSizes.base },
  sortRow: { marginTop: Spacing.sm },
  filtersWrapper: { marginBottom: Spacing.sm },
  filtersContent: { paddingHorizontal: Spacing.xl, gap: Spacing.xs },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, gap: 6 },
  filterDot: { width: 6, height: 6, borderRadius: 3 },
  filterText: { fontSize: FontSizes.sm },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: Spacing.lg },
  emptyState: { alignItems: 'center', paddingTop: Spacing['3xl'] },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  gridItem: { width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2 },
  gridCard: { padding: Spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 9, fontWeight: FontWeights.bold },
  iconContainer: { width: 48, height: 48, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: Spacing.sm },
  cardName: { fontSize: FontSizes.sm, marginBottom: 2, minHeight: 36 },
  cardMeta: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 10 },
  listContainer: { gap: Spacing.sm },
  listCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  listIcon: { width: 44, height: 44, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  listInfo: { flex: 1 },
  listMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  typeBadgeSmall: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  typeTextSmall: { fontSize: 9, fontWeight: FontWeights.semiBold },
  budgetActiveChip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  modalContent: { flex: 1, paddingHorizontal: Spacing.xl },
  modalFooter: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  filterSection: { paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  filterSectionTitle: { marginBottom: Spacing.md },
  radioGroup: { gap: Spacing.sm },
  radioRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  budgetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  budgetChip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'transparent' },
});


