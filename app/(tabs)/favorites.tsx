/**
 * AURAM - Favoriler
 * Favori parfümler, koleksiyonlar ve son görüntülenenler
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, Button } from '@/components/ui';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, ScentTypeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { Parfum } from '@/types';

type TabType = 'favorites' | 'collections' | 'recent';
type SortType = 'name' | 'type' | 'brand' | 'recent';

const COLLECTION_COLORS = [
  '#5C4066', '#D6A06F', '#756C7D', '#2D2833', '#A37B55', 
  '#9D93A5', '#3A2F40', '#00D4AA', '#FFB020', '#FF6B6B',
];

const COLLECTION_ICONS = [
  'heart', 'star', 'diamond', 'moon', 'sunny', 'leaf',
  'flower', 'flame', 'water', 'sparkles', 'ribbon', 'rose',
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
  
  // Koleksiyon oluşturma modal
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLLECTION_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(COLLECTION_ICONS[0]);
  
  // Koleksiyon Detay Modal
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [showAddParfumMode, setShowAddParfumMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { 
    parfumler,
    favorites,
    collections,
    recentlyViewed,
    getFavoriteParfums,
    getRecentlyViewedParfums,
    toggleFavoriteParfum,
    createNewCollection,
    removeCollection,
    addToRecentlyViewedList,
    getCollectionParfums,
    addParfumToCollection,
    removeParfumFromCollection,
  } = useApp();

  const selectedCollection = useMemo(() => 
    collections.find(c => c.id === selectedCollectionId), 
  [collections, selectedCollectionId]);

  const collectionParfums = useMemo(() => 
    selectedCollectionId ? getCollectionParfums(selectedCollectionId) : [],
  [getCollectionParfums, selectedCollectionId]);

  const addableParfums = useMemo(() => {
    if (!showAddParfumMode || !selectedCollection) return [];
    const query = searchQuery.toLowerCase();
    return parfumler.filter(p => 
      !selectedCollection.parfumIds.includes(p.id) && 
      (p.isim.toLowerCase().includes(query) || (p.marka && p.marka.toLowerCase().includes(query)))
    );
  }, [parfumler, showAddParfumMode, selectedCollection, searchQuery]);

  const favoriteParfums = getFavoriteParfums();
  const recentParfums = getRecentlyViewedParfums();

  // Filtrelenmiş favoriler
  const filteredFavorites = useMemo(() => {
    let result = [...favoriteParfums];
    if (filterType) result = result.filter(p => p.tip === filterType);
    
    switch (sortBy) {
      case 'name': result.sort((a, b) => a.isim.localeCompare(b.isim)); break;
      case 'type': result.sort((a, b) => a.tip.localeCompare(b.tip)); break;
      case 'brand': result.sort((a, b) => (a.marka || '').localeCompare(b.marka || '')); break;
    }
    return result;
  }, [favoriteParfums, filterType, sortBy]);

  const availableTypes = useMemo(() => {
    return Array.from(new Set(favoriteParfums.map(p => p.tip)));
  }, [favoriteParfums]);

  const tabs = [
    { id: 'favorites' as TabType, label: 'Favoriler', icon: 'heart', count: favorites.length },
    { id: 'collections' as TabType, label: 'Koleksiyonlar', icon: 'folder', count: collections.length },
    { id: 'recent' as TabType, label: 'Son Görüntülenen', icon: 'time', count: recentlyViewed.length },
  ];

  const toggleCompareSelection = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(prev => prev.filter(i => i !== id));
    } else if (selectedForCompare.length < 3) {
      setSelectedForCompare(prev => [...prev, id]);
    } else {
      Alert.alert('Uyarı', 'En fazla 3 parfüm karşılaştırabilirsiniz');
    }
  };

  const goToCompare = () => {
    if (selectedForCompare.length >= 2) {
      router.push(`/compare?ids=${selectedForCompare.join(',')}`);
      setCompareMode(false);
      setSelectedForCompare([]);
    } else {
      Alert.alert('Uyarı', 'En az 2 parfüm seçmelisiniz');
    }
  };

  const handleOpenParfum = (parfum: Parfum) => {
    addToRecentlyViewedList(parfum.id);
    router.push(`/parfum/${parfum.id}`);
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      Alert.alert('Hata', 'Koleksiyon adı gerekli');
      return;
    }
    await createNewCollection(newCollectionName.trim(), selectedIcon, selectedColor);
    setShowNewCollectionModal(false);
    setNewCollectionName('');
    setSelectedColor(COLLECTION_COLORS[0]);
    setSelectedIcon(COLLECTION_ICONS[0]);
  };

  const handleDeleteCollection = (id: string, name: string) => {
    Alert.alert('Koleksiyonu Sil', `"${name}" silinecek.`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => removeCollection(id) },
    ]);
  };

  // Favoriler Tab
  const renderFavorites = () => {
    if (favoriteParfums.length === 0) {
      return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.accent + '15' }]}>
            <Ionicons name="heart-outline" size={40} color={colors.accent} />
          </View>
          <ThemedText type="subtitle" center style={{ marginTop: Spacing.lg }}>Henüz favori yok</ThemedText>
          <ThemedText type="body" center style={[styles.emptyText, { color: colors.textMuted }]}>
            Parfümlere dokunarak favorilere ekleyin
          </ThemedText>
          <Button title="Keşfet" onPress={() => router.push('/(tabs)')} style={{ marginTop: Spacing.xl }} />
        </Animated.View>
      );
    }

    return (
      <View>
        {/* Toolbar */}
        <View style={styles.toolbar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <Pressable onPress={() => setFilterType(null)} style={[styles.filterChip, !filterType && styles.filterChipActive]}>
              <ThemedText style={[styles.filterText, !filterType ? { color: colors.tint } : {}]}>Tümü</ThemedText>
            </Pressable>
            {availableTypes.map((type) => (
              <Pressable
                key={type}
                onPress={() => setFilterType(type === filterType ? null : type)}
                style={[styles.filterChip, filterType === type && { backgroundColor: (ScentTypeColors[type] || colors.tint) + '15' }]}
              >
                <View style={[styles.filterDot, { backgroundColor: ScentTypeColors[type] || colors.tint }]} />
                <ThemedText style={[styles.filterText, filterType === type ? { color: ScentTypeColors[type] || colors.tint } : {}]}>
                  {type}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
          
          <View style={styles.toolbarActions}>
            <Pressable
              onPress={() => router.push('/compare-select')}
              style={[styles.actionBtn, { marginRight: 8 }]}
            >
              <Ionicons name="search" size={18} color={colors.textMuted} />
            </Pressable>
            <Pressable
              onPress={() => { setCompareMode(!compareMode); setSelectedForCompare([]); }}
              style={[styles.actionBtn, compareMode && { backgroundColor: colors.tint + '15' }]}
            >
              <Ionicons name="git-compare-outline" size={18} color={compareMode ? colors.tint : colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Compare Banner */}
        {compareMode && (
          <Animated.View entering={FadeInDown.duration(200)} style={[styles.compareBanner, { backgroundColor: colors.tint + '10' }]}>
            <ThemedText style={{ color: colors.tint }}>{selectedForCompare.length}/3 seçildi</ThemedText>
            <View style={styles.compareBannerActions}>
              <Pressable onPress={() => { setCompareMode(false); setSelectedForCompare([]); }}>
                <ThemedText style={{ color: colors.textMuted }}>İptal</ThemedText>
              </Pressable>
              <Button title="Karşılaştır" onPress={goToCompare} size="sm" disabled={selectedForCompare.length < 2} />
            </View>
          </Animated.View>
        )}

        {/* Liste */}
        <View style={styles.listContainer}>
          {filteredFavorites.map((parfum, index) => (
            <ParfumCard 
              key={parfum.id} 
              parfum={parfum} 
              colors={colors}
              isSelected={selectedForCompare.includes(parfum.id)}
              compareMode={compareMode}
              onPress={() => compareMode ? toggleCompareSelection(parfum.id) : handleOpenParfum(parfum)}
              onToggleFavorite={() => toggleFavoriteParfum(parfum.id)}
              delay={index * 40}
            />
          ))}
        </View>
      </View>
    );
  };

  // Koleksiyonlar Tab
  const renderCollections = () => (
    <View style={styles.collectionsContainer}>
      {/* Add Button */}
      <Animated.View entering={FadeIn.duration(300)}>
        <Pressable onPress={() => setShowNewCollectionModal(true)} style={[styles.addCollectionBtn, { borderColor: colors.tint + '40' }]}>
          <View style={[styles.addIcon, { backgroundColor: colors.tint + '15' }]}>
            <Ionicons name="add" size={24} color={colors.tint} />
          </View>
          <ThemedText type="subtitle">Yeni Koleksiyon</ThemedText>
        </Pressable>
      </Animated.View>

      {collections.length === 0 ? (
        <ThemedText type="body" center style={[styles.emptyCollText, { color: colors.textMuted }]}>
          Koleksiyonlarınızı oluşturun
        </ThemedText>
      ) : (
        collections.map((collection, index) => (
          <Animated.View key={collection.id} entering={FadeInDown.delay(index * 50).duration(300)}>
            <Pressable onPress={() => { setSelectedCollectionId(collection.id); setShowAddParfumMode(false); }}>
              <Card variant="elevated" style={styles.collectionCard}>
                <View style={styles.collectionHeader}>
                  <View style={[styles.collectionIcon, { backgroundColor: collection.color + '20' }]}>
                    <Ionicons name={collection.icon as keyof typeof Ionicons.glyphMap} size={22} color={collection.color} />
                  </View>
                  <View style={styles.collectionInfo}>
                    <ThemedText type="subtitle">{collection.name}</ThemedText>
                    <ThemedText type="caption" style={{ color: colors.textMuted }}>{collection.parfumIds.length} parfüm</ThemedText>
                  </View>
                  <Pressable onPress={() => handleDeleteCollection(collection.id, collection.name)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </Pressable>
                </View>
              </Card>
            </Pressable>
          </Animated.View>
        ))
      )}
    </View>
  );

  // Son Görüntülenen Tab
  const renderRecent = () => {
    if (recentParfums.length === 0) {
      return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.tint + '15' }]}>
            <Ionicons name="time-outline" size={40} color={colors.tint} />
          </View>
          <ThemedText type="subtitle" center style={{ marginTop: Spacing.lg }}>Henüz geçmiş yok</ThemedText>
          <ThemedText type="body" center style={[styles.emptyText, { color: colors.textMuted }]}>
            Parfümleri incelediğinizde burada görünecek
          </ThemedText>
        </Animated.View>
      );
    }

    return (
      <View style={styles.listContainer}>
        {recentParfums.map((parfum, index) => (
          <ParfumCard 
            key={parfum.id} 
            parfum={parfum} 
            colors={colors}
            isSelected={false}
            compareMode={false}
            isFavorite={favorites.includes(parfum.id)}
            onPress={() => handleOpenParfum(parfum)}
            onToggleFavorite={() => toggleFavoriteParfum(parfum.id)}
            delay={index * 40}
          />
        ))}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">Koleksiyonum</ThemedText>
        </View>

        {/* Tabs */}
        <View style={styles.tabsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            {tabs.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tab, activeTab === tab.id && { backgroundColor: colors.tint + '12' }]}
              >
                <Ionicons 
                  name={(activeTab === tab.id ? tab.icon : tab.icon + '-outline') as keyof typeof Ionicons.glyphMap}
                  size={16} 
                  color={activeTab === tab.id ? colors.tint : colors.textMuted} 
                />
                <ThemedText style={[styles.tabLabel, { color: activeTab === tab.id ? colors.tint : colors.textMuted }]}>
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
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
          {activeTab === 'favorites' && renderFavorites()}
          {activeTab === 'collections' && renderCollections()}
          {activeTab === 'recent' && renderRecent()}
          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Koleksiyon Detay / Parfüm Ekleme Modalı */}
      <Modal visible={!!selectedCollectionId} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedCollectionId(null)}>
        {selectedCollection && (
          <ThemedView style={styles.modalContainer}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => {
                  if (showAddParfumMode) {
                    setShowAddParfumMode(false);
                    setSearchQuery('');
                  } else {
                    setSelectedCollectionId(null);
                  }
                }} hitSlop={10}>
                  <Ionicons name={showAddParfumMode ? "arrow-back" : "close"} size={24} color={colors.text} />
                </Pressable>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <Ionicons name={selectedCollection.icon as any} size={20} color={selectedCollection.color} />
                  <ThemedText type="heading">{showAddParfumMode ? 'Parfüm Ekle' : selectedCollection.name}</ThemedText>
                </View>
                <View style={{ width: 24 }} />
              </View>

              {!showAddParfumMode ? (
                // Detay Görünümü
                <View style={{ flex: 1 }}>
                  <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
                    {collectionParfums.length === 0 ? (
                      <View style={{ alignItems: 'center', paddingVertical: Spacing['2xl'] }}>
                        <Ionicons name="flask-outline" size={48} color={colors.textMuted} />
                        <ThemedText type="body" style={{ color: colors.textMuted, marginTop: Spacing.md }}>Bu koleksiyon boş.</ThemedText>
                      </View>
                    ) : (
                      <View style={styles.listContainer}>
                        {collectionParfums.map((parfum, index) => (
                          <ParfumCard 
                            key={parfum.id} 
                            parfum={parfum} 
                            colors={colors}
                            isSelected={false}
                            compareMode={false}
                            onPress={() => {
                              setSelectedCollectionId(null);
                              router.push(`/parfum/${parfum.id}`);
                            }}
                            customActionIcon="close-circle-outline"
                            onCustomAction={() => removeParfumFromCollection(selectedCollection.id, parfum.id)}
                            delay={index * 40}
                          />
                        ))}
                      </View>
                    )}
                  </ScrollView>
                  <View style={styles.modalFooter}>
                    <Button 
                      title="Parfüm Ekle" 
                      icon={<Ionicons name="add" size={18} color="#FFF" style={{ marginRight: 8 }} />}
                      onPress={() => setShowAddParfumMode(true)} 
                      fullWidth 
                    />
                  </View>
                </View>
              ) : (
                // Parfüm Ekleme Görünümü
                <View style={{ flex: 1 }}>
                  <View style={{ padding: Spacing.xl, paddingBottom: 0 }}>
                    <View style={[styles.searchBar, { backgroundColor: colors.backgroundTertiary }]}>
                      <Ionicons name="search" size={20} color={colors.textMuted} />
                      <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Parfüm veya marka ara..."
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                      {searchQuery ? (
                        <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
                          <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                  <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
                    {addableParfums.length === 0 ? (
                      <View style={{ alignItems: 'center', paddingVertical: Spacing['2xl'] }}>
                        <ThemedText type="body" style={{ color: colors.textMuted }}>Sonuç bulunamadı.</ThemedText>
                      </View>
                    ) : (
                      <View style={styles.listContainer}>
                        {addableParfums.map((parfum, index) => (
                          <ParfumCard 
                            key={parfum.id} 
                            parfum={parfum} 
                            colors={colors}
                            isSelected={false}
                            compareMode={false}
                            onPress={() => {
                              setSelectedCollectionId(null);
                              router.push(`/parfum/${parfum.id}`);
                            }}
                            customActionIcon="add-circle-outline"
                            onCustomAction={() => {
                              addParfumToCollection(selectedCollection.id, parfum.id);
                            }}
                            delay={Math.min(index * 20, 300)}
                          />
                        ))}
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </SafeAreaView>
          </ThemedView>
        )}
      </Modal>

      {/* Koleksiyon Oluşturma Modal */}
      <Modal visible={showNewCollectionModal} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={styles.modalContainer}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowNewCollectionModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
              <ThemedText type="heading">Yeni Koleksiyon</ThemedText>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              {/* İsim */}
              <View style={styles.inputSection}>
                <ThemedText type="label" style={styles.inputLabel}>Koleksiyon Adı</ThemedText>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.backgroundTertiary, color: colors.text }]}
                  placeholder="Örn: Yaz Favorilerim"
                  placeholderTextColor={colors.textMuted}
                  value={newCollectionName}
                  onChangeText={setNewCollectionName}
                />
              </View>

              {/* Renk Seçimi */}
              <View style={styles.inputSection}>
                <ThemedText type="label" style={styles.inputLabel}>Renk</ThemedText>
                <View style={styles.colorGrid}>
                  {COLLECTION_COLORS.map((color) => (
                    <Pressable
                      key={color}
                      onPress={() => setSelectedColor(color)}
                      style={[styles.colorOption, { backgroundColor: color }, selectedColor === color && styles.colorOptionSelected]}
                    >
                      {selectedColor === color && <Ionicons name="checkmark" size={18} color="#FFF" />}
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Simge Seçimi */}
              <View style={styles.inputSection}>
                <ThemedText type="label" style={styles.inputLabel}>Simge</ThemedText>
                <View style={styles.iconGrid}>
                  {COLLECTION_ICONS.map((icon) => (
                    <Pressable
                      key={icon}
                      onPress={() => setSelectedIcon(icon)}
                      style={[
                        styles.iconOption, 
                        { backgroundColor: selectedIcon === icon ? selectedColor + '20' : colors.backgroundTertiary },
                        selectedIcon === icon && { borderColor: selectedColor, borderWidth: 2 }
                      ]}
                    >
                      <Ionicons 
                        name={icon as keyof typeof Ionicons.glyphMap} 
                        size={22} 
                        color={selectedIcon === icon ? selectedColor : colors.textMuted} 
                      />
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Preview */}
              <View style={styles.previewSection}>
                <ThemedText type="label" style={styles.inputLabel}>Önizleme</ThemedText>
                <View style={[styles.previewCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.previewIcon, { backgroundColor: selectedColor + '20' }]}>
                    <Ionicons name={selectedIcon as keyof typeof Ionicons.glyphMap} size={24} color={selectedColor} />
                  </View>
                  <ThemedText type="subtitle">{newCollectionName || 'Koleksiyon Adı'}</ThemedText>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Koleksiyonu Oluştur" onPress={handleCreateCollection} fullWidth disabled={!newCollectionName.trim()} />
            </View>
          </SafeAreaView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

// Parfüm Kartı
function ParfumCard({ parfum, colors, isSelected, compareMode, isFavorite = true, onPress, onToggleFavorite, delay = 0, customActionIcon, onCustomAction }: {
  parfum: Parfum;
  colors: typeof Colors.light;
  isSelected: boolean;
  compareMode: boolean;
  isFavorite?: boolean;
  onPress: () => void;
  onToggleFavorite?: () => void;
  delay?: number;
  customActionIcon?: string;
  onCustomAction?: () => void;
}) {
  const typeColor = ScentTypeColors[parfum.tip] || colors.tint;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <Pressable onPress={onPress}>
        <Card variant="elevated" style={[styles.parfumCard, isSelected ? { borderColor: colors.tint, borderWidth: 2 } : {}]}>
          {compareMode && (
            <View style={[styles.selectIndicator, { backgroundColor: isSelected ? colors.tint : colors.backgroundTertiary }]}>
              {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
          )}
          
          <View style={styles.parfumRow}>
            <View style={[styles.parfumTypeIcon, { backgroundColor: typeColor + '15' }]}>
              <Ionicons name="sparkles" size={18} color={typeColor} />
            </View>
            
            <View style={styles.parfumInfo}>
              <ThemedText type="subtitle" numberOfLines={1}>{parfum.isim}</ThemedText>
              <ThemedText type="caption" style={{ color: colors.textMuted }}>{parfum.marka}</ThemedText>
              
              <View style={styles.parfumMeta}>
                <View style={[styles.parfumTypeBadge, { backgroundColor: typeColor + '12' }]}>
                  <ThemedText style={[styles.parfumTypeText, { color: typeColor }]}>{parfum.tip}</ThemedText>
                </View>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>{parfum.kalicilik}</ThemedText>
              </View>
            </View>
            
            {!compareMode && (
              <Pressable onPress={customActionIcon ? onCustomAction : onToggleFavorite} hitSlop={10}>
                <Ionicons name={(customActionIcon as any) || (isFavorite ? 'heart' : 'heart-outline')} size={22} color={customActionIcon ? colors.textMuted : (isFavorite ? colors.accent : colors.textMuted)} />
              </Pressable>
            )}
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  tabsWrapper: { marginBottom: Spacing.sm },
  tabs: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, gap: 6 },
  tabLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium },
  tabBadge: { minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  tabBadgeText: { color: '#FFF', fontSize: 10, fontWeight: FontWeights.bold },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  toolbar: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  filterScroll: { flex: 1, gap: Spacing.xs },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, gap: 6 },
  filterChipActive: { backgroundColor: 'rgba(92,64,102,0.1)' },
  filterDot: { width: 6, height: 6, borderRadius: 3 },
  filterText: { fontSize: FontSizes.sm },
  toolbarActions: { marginLeft: Spacing.sm },
  actionBtn: { padding: Spacing.sm, borderRadius: BorderRadius.md },
  compareBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  compareBannerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  listContainer: { gap: Spacing.sm },
  emptyState: { alignItems: 'center', paddingTop: Spacing['3xl'], paddingHorizontal: Spacing.xl },
  emptyIcon: { width: 80, height: 80, borderRadius: BorderRadius['2xl'], justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: Spacing.sm },
  collectionsContainer: { gap: Spacing.md },
  addCollectionBtn: { alignItems: 'center', padding: Spacing.xl, borderRadius: BorderRadius.xl, borderWidth: 2, borderStyle: 'dashed', gap: Spacing.md },
  addIcon: { width: 48, height: 48, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  emptyCollText: { marginTop: Spacing.xl },
  collectionCard: { padding: Spacing.md },
  collectionHeader: { flexDirection: 'row', alignItems: 'center' },
  collectionIcon: { width: 44, height: 44, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  collectionInfo: { flex: 1 },
  parfumCard: { padding: Spacing.md },
  selectIndicator: { position: 'absolute', top: Spacing.sm, left: Spacing.sm, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  parfumRow: { flexDirection: 'row', alignItems: 'center' },
  parfumTypeIcon: { width: 44, height: 44, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  parfumInfo: { flex: 1 },
  parfumMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  parfumTypeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  parfumTypeText: { fontSize: 10, fontWeight: FontWeights.semiBold },
  // Modal
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  modalContent: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  modalFooter: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  inputSection: { marginBottom: Spacing.xl },
  inputLabel: { marginBottom: Spacing.sm },
  textInput: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, fontSize: FontSizes.base },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  colorOption: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  colorOptionSelected: { borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  iconOption: { width: 48, height: 48, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  previewSection: { marginTop: Spacing.lg },
  previewCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderRadius: BorderRadius.xl, marginTop: Spacing.sm, gap: Spacing.md },
  previewIcon: { width: 48, height: 48, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, height: 44, marginBottom: Spacing.md },
  searchInput: { flex: 1, marginLeft: Spacing.sm, fontSize: FontSizes.base },
});
