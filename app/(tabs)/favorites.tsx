/**
 * AROMIXEN - Favorites Tab
 * Favori parfümler, koleksiyonlar ve son görüntülenenler
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { Parfum } from '@/types';

type TabType = 'favorites' | 'collections' | 'recent';

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const [activeTab, setActiveTab] = useState<TabType>('favorites');
  
  const { 
    favorites,
    collections,
    recentlyViewed,
    getFavoriteParfums,
    getRecentlyViewedParfums,
    toggleFavoriteParfum,
    createNewCollection,
    removeCollection,
  } = useApp();

  const favoriteParfums = getFavoriteParfums();
  const recentParfums = getRecentlyViewedParfums();

  const tabs = [
    { id: 'favorites' as TabType, label: 'Favoriler', icon: 'heart', count: favorites.length },
    { id: 'collections' as TabType, label: 'Koleksiyonlar', icon: 'folder', count: collections.length },
    { id: 'recent' as TabType, label: 'Son Görüntülenen', icon: 'time', count: recentlyViewed.length },
  ];

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
              await createNewCollection(name.trim(), 'folder', '#9D4EDD');
            }
          }
        },
      ],
      'plain-text'
    );
  };

  const handleDeleteCollection = (id: string, name: string) => {
    Alert.alert(
      'Koleksiyonu Sil',
      `"${name}" koleksiyonunu silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: () => removeCollection(id)
        },
      ]
    );
  };

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
        </Animated.View>
      );
    }

    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.listContainer}>
        {favoriteParfums.map((parfum, index) => (
          <ParfumCard 
            key={parfum.id} 
            parfum={parfum} 
            colors={colors}
            isDark={isDark}
            isFavorite={true}
            onToggleFavorite={() => toggleFavoriteParfum(parfum.id)}
            delay={index * 50}
          />
        ))}
      </Animated.View>
    );
  };

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
          
          {/* Tab bar için boşluk */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function ParfumCard({ 
  parfum, 
  colors, 
  isDark,
  isFavorite,
  onToggleFavorite,
  delay = 0,
}: { 
  parfum: Parfum;
  colors: typeof Colors.light;
  isDark: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  delay?: number;
}) {
  const tipColors: Record<string, string> = {
    'Odunsu': '#8B4513',
    'Çiçeksi': '#FF69B4',
    'Oryantal': '#DAA520',
    'Ferah': '#87CEEB',
    'Baharatlı': '#FF4500',
    'Aquatik': '#00CED1',
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
      <Card variant="elevated" style={styles.parfumCard}>
        <View style={styles.parfumHeader}>
          <View style={[styles.parfumType, { backgroundColor: (tipColors[parfum.tip] || colors.tint) + '20' }]}>
            <ThemedText style={[styles.parfumTypeText, { color: tipColors[parfum.tip] || colors.tint }]}>
              {parfum.tip}
            </ThemedText>
          </View>
          <Pressable onPress={onToggleFavorite} style={styles.favoriteBtn}>
            <Ionicons 
              name={isFavorite ? 'heart' : 'heart-outline'} 
              size={22} 
              color={isFavorite ? '#FF6B9D' : colors.textMuted} 
            />
          </Pressable>
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
        </View>
      </Card>
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
