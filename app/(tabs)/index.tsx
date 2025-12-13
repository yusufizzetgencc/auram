/**
 * AROMIXEN - Premium Parfümler Sayfası
 * Elegant design with advanced filtering and sorting
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  Dimensions,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, Button } from '@/components/ui';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, Shadows, ScentTypeColors, ScentTypeIcons } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { Parfum, KokuTipi, Mevsim, KokuYogunlugu } from '@/types';

const { width } = Dimensions.get('window');

const FILTER_TYPES: (KokuTipi | 'Tümü')[] = ['Tümü', 'Çiçeksi', 'Odunsu', 'Ferah', 'Amber', 'Baharatlı', 'Meyvemsi', 'Tatlı', 'Yeşil', 'Oryantal', 'Aquatik'];
const SORT_OPTIONS = ['Önerilen', 'A-Z', 'Z-A', 'Puan', 'Yoğunluk'];

// Yoğunluk göstergesi
const getYogunlukBars = (yogunluk: KokuYogunlugu) => {
  switch(yogunluk) {
    case 'hafif': return 1;
    case 'orta': return 2;
    case 'yogun': return 3;
  }
};

export default function AllPerfumesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const shadows = Shadows[colorScheme ?? 'light'];
  const { parfumler, recommendations } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<KokuTipi | 'Tümü'>('Tümü');
  const [selectedParfum, setSelectedParfum] = useState<Parfum | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('Önerilen');
  const [showSortModal, setShowSortModal] = useState(false);

  const filteredPerfumes = useMemo(() => {
    let result = parfumler.filter(parfum => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        parfum.isim.toLowerCase().includes(query) ||
        parfum.tip.toLowerCase().includes(query) ||
        (parfum.marka?.toLowerCase().includes(query) || false) ||
        parfum.notalar.ust.some(n => n.toLowerCase().includes(query)) ||
        parfum.notalar.orta.some(n => n.toLowerCase().includes(query)) ||
        parfum.notalar.alt.some(n => n.toLowerCase().includes(query)) ||
        parfum.etiketler?.some(e => e.toLowerCase().includes(query));
      
      const matchesType = selectedType === 'Tümü' || parfum.tip === selectedType;
      return matchesSearch && matchesType;
    });

    // Sorting
    switch(sortBy) {
      case 'A-Z':
        result.sort((a, b) => a.isim.localeCompare(b.isim));
        break;
      case 'Z-A':
        result.sort((a, b) => b.isim.localeCompare(a.isim));
        break;
      case 'Puan':
        result.sort((a, b) => (b.puan || 0) - (a.puan || 0));
        break;
      case 'Yoğunluk':
        const yogunlukOrder = { 'yogun': 3, 'orta': 2, 'hafif': 1 };
        result.sort((a, b) => yogunlukOrder[b.yogunluk] - yogunlukOrder[a.yogunluk]);
        break;
      default:
        // Default sorting - keep original order
        break;
    }

    return result;
  }, [parfumler, searchQuery, selectedType, sortBy]);

  // Quick stats
  const stats = useMemo(() => ({
    total: parfumler.length,
    types: [...new Set(parfumler.map(p => p.tip))].length,
    brands: [...new Set(parfumler.filter(p => p.marka).map(p => p.marka))].length,
  }), [parfumler]);

  return (
    <ThemedView style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={colorScheme === 'dark' 
          ? ['#0D0A14', '#150F20', '#1E1628'] 
          : ['#FDFBFF', '#F8F4FC', '#F0EAF5']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Premium Header */}
        <Animated.View 
          entering={FadeIn.duration(500)}
          style={styles.header}
        >
          {/* Stats Banner */}
          <View style={[styles.statsBanner, { backgroundColor: colors.tint + '10' }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.tint }]}>{stats.total}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Parfüm</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.tint + '30' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.tint }]}>{stats.types}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Kategori</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.tint + '30' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.tint }]}>{stats.brands}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Marka</Text>
            </View>
          </View>

          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Keşfet ✨</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {filteredPerfumes.length} koku bulundu
              </Text>
            </View>
            
            <View style={styles.headerActions}>
              {/* Sort Button */}
              <Pressable 
                onPress={() => setShowSortModal(true)}
                style={[styles.actionButton, { backgroundColor: colors.card }]}
              >
                <Ionicons name="swap-vertical-outline" size={18} color={colors.tint} />
              </Pressable>
              
              {/* View Toggle */}
              <View style={[styles.viewToggle, { backgroundColor: colors.card }]}>
                <Pressable 
                  onPress={() => setViewMode('grid')}
                  style={[
                    styles.viewButton, 
                    { backgroundColor: viewMode === 'grid' ? colors.tint + '20' : 'transparent' }
                  ]}
                >
                  <Ionicons 
                    name="grid-outline" 
                    size={16} 
                    color={viewMode === 'grid' ? colors.tint : colors.textMuted} 
                  />
                </Pressable>
                <Pressable 
                  onPress={() => setViewMode('list')}
                  style={[
                    styles.viewButton, 
                    { backgroundColor: viewMode === 'list' ? colors.tint + '20' : 'transparent' }
                  ]}
                >
                  <Ionicons 
                    name="list-outline" 
                    size={16} 
                    color={viewMode === 'list' ? colors.tint : colors.textMuted} 
                  />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Search */}
          <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Koku, nota, marka veya etiket ara..."
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

          {/* Active Sort Badge */}
          {sortBy !== 'Önerilen' && (
            <View style={styles.activeSortBadge}>
              <Ionicons name="swap-vertical" size={12} color={colors.tint} />
              <Text style={[styles.activeSortText, { color: colors.tint }]}>
                Sıralama: {sortBy}
              </Text>
              <Pressable onPress={() => setSortBy('Önerilen')}>
                <Ionicons name="close-circle" size={14} color={colors.tint} />
              </Pressable>
            </View>
          )}
        </Animated.View>

        {/* Filters */}
        <View style={styles.filterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {FILTER_TYPES.map((type) => {
              const isSelected = selectedType === type;
              const typeColor = type !== 'Tümü' ? ScentTypeColors[type] || colors.tint : colors.tint;
              const count = type === 'Tümü' 
                ? parfumler.length 
                : parfumler.filter(p => p.tip === type).length;
              
              return (
                <Pressable
                  key={type}
                  onPress={() => setSelectedType(type)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected ? typeColor : colors.card,
                      borderColor: isSelected ? typeColor : colors.border,
                    },
                  ]}
                >
                  {type !== 'Tümü' && (
                    <View style={[
                      styles.filterDot, 
                      { backgroundColor: isSelected ? '#FFFFFF' : typeColor }
                    ]} />
                  )}
                  <Text
                    style={[
                      styles.filterText,
                      { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {type}
                  </Text>
                  <View style={[
                    styles.filterCount,
                    { backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : colors.backgroundTertiary }
                  ]}>
                    <Text style={[
                      styles.filterCountText,
                      { color: isSelected ? '#FFFFFF' : colors.textMuted }
                    ]}>
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Perfume List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredPerfumes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconContainer, { backgroundColor: colors.tint + '15' }]}>
                <Ionicons name="search" size={40} color={colors.tint} />
              </View>
              <ThemedText type="subtitle" center style={{ marginTop: Spacing.lg }}>
                Sonuç bulunamadı
              </ThemedText>
              <ThemedText type="body" center style={{ marginTop: Spacing.sm, opacity: 0.7 }}>
                Farklı anahtar kelimeler deneyin
              </ThemedText>
              <Pressable 
                onPress={() => { setSearchQuery(''); setSelectedType('Tümü'); }}
                style={[styles.resetButton, { backgroundColor: colors.tint }]}
              >
                <Text style={styles.resetButtonText}>Filtreleri Temizle</Text>
              </Pressable>
            </View>
          ) : viewMode === 'grid' ? (
            <View style={styles.gridContainer}>
              {filteredPerfumes.map((parfum, index) => (
                <Animated.View
                  key={parfum.id}
                  entering={FadeInDown.delay(index * 30).duration(300)}
                  style={styles.gridItem}
                >
                  <PerfumeGridCard 
                    parfum={parfum} 
                    colors={colors}
                    shadows={shadows}
                    onPress={() => setSelectedParfum(parfum)}
                  />
                </Animated.View>
              ))}
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredPerfumes.map((parfum, index) => (
                <Animated.View
                  key={parfum.id}
                  entering={FadeInDown.delay(index * 30).duration(300)}
                >
                  <PerfumeListCard 
                    parfum={parfum} 
                    colors={colors}
                    shadows={shadows}
                    onPress={() => setSelectedParfum(parfum)}
                  />
                </Animated.View>
              ))}
            </View>
          )}
          
          {/* Bottom spacing for floating tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Sort Modal */}
        <Modal
          visible={showSortModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSortModal(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setShowSortModal(false)}
          >
            <Animated.View 
              entering={FadeInUp.duration(200)}
              style={[styles.sortModal, { backgroundColor: colors.card }]}
            >
              <View style={styles.sortModalHeader}>
                <Text style={[styles.sortModalTitle, { color: colors.text }]}>Sıralama</Text>
                <Pressable onPress={() => setShowSortModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>
              
              {SORT_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.sortOption,
                    sortBy === option && { backgroundColor: colors.tint + '15' }
                  ]}
                  onPress={() => { setSortBy(option); setShowSortModal(false); }}
                >
                  <Text style={[
                    styles.sortOptionText,
                    { color: sortBy === option ? colors.tint : colors.text }
                  ]}>
                    {option}
                  </Text>
                  {sortBy === option && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.tint} />
                  )}
                </Pressable>
              ))}
            </Animated.View>
          </Pressable>
        </Modal>

        {/* Parfüm Detay Modal */}
        <ParfumDetailModal
          parfum={selectedParfum}
          visible={selectedParfum !== null}
          onClose={() => setSelectedParfum(null)}
          colors={colors}
          shadows={shadows}
          colorScheme={colorScheme}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

// Grid Kart
function PerfumeGridCard({
  parfum,
  colors,
  shadows,
  onPress,
}: {
  parfum: Parfum;
  colors: typeof Colors.light;
  shadows: typeof Shadows.light;
  onPress: () => void;
}) {
  const typeColor = ScentTypeColors[parfum.tip] || colors.tint;
  const typeIcon = ScentTypeIcons[parfum.tip] || 'sparkles-outline';
  const bars = getYogunlukBars(parfum.yogunluk);

  return (
    <Pressable onPress={onPress}>
      <View style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.sm]}>
        {/* Icon */}
        <LinearGradient
          colors={[typeColor + '30', typeColor + '10']}
          style={styles.gridIcon}
        >
          <Ionicons name={typeIcon as any} size={28} color={typeColor} />
        </LinearGradient>

        {/* Brand */}
        {parfum.marka && (
          <Text style={[styles.gridBrand, { color: colors.textMuted }]} numberOfLines={1}>
            {parfum.marka}
          </Text>
        )}

        {/* Name */}
        <Text style={[styles.gridName, { color: colors.text }]} numberOfLines={2}>
          {parfum.isim}
        </Text>

        {/* Type Badge */}
        <View style={[styles.gridTypeBadge, { backgroundColor: typeColor + '20' }]}>
          <Text style={[styles.gridTypeText, { color: typeColor }]}>
            {parfum.tip}
          </Text>
        </View>

        {/* Info Row */}
        <View style={styles.gridInfoRow}>
          <View style={styles.yogunlukIndicator}>
            {[1, 2, 3].map(i => (
              <View 
                key={i} 
                style={[
                  styles.yogunlukBar, 
                  { backgroundColor: i <= bars ? typeColor : colors.backgroundTertiary }
                ]} 
              />
            ))}
          </View>
          
          <View style={styles.gridSeasonRow}>
            <Ionicons name="calendar-outline" size={10} color={colors.textMuted} />
            <Text style={[styles.gridSeasonText, { color: colors.textMuted }]}>
              {parfum.mevsim[0]?.substring(0, 3)}
            </Text>
          </View>
        </View>

        {/* Rating */}
        {parfum.puan && (
          <View style={[styles.ratingBadge, { backgroundColor: '#FFD70020' }]}>
            <Ionicons name="star" size={10} color="#FFD700" />
            <Text style={[styles.ratingText, { color: '#B8860B' }]}>{parfum.puan}</Text>
          </View>
        )}

        {/* Favorite Button */}
        <Pressable style={[styles.favoriteButton, { backgroundColor: colors.backgroundTertiary }]}>
          <Ionicons name="heart-outline" size={16} color={colors.textMuted} />
        </Pressable>
      </View>
    </Pressable>
  );
}

// List Kart
function PerfumeListCard({
  parfum,
  colors,
  shadows,
  onPress,
}: {
  parfum: Parfum;
  colors: typeof Colors.light;
  shadows: typeof Shadows.light;
  onPress: () => void;
}) {
  const typeColor = ScentTypeColors[parfum.tip] || colors.tint;
  const typeIcon = ScentTypeIcons[parfum.tip] || 'sparkles-outline';
  const bars = getYogunlukBars(parfum.yogunluk);

  return (
    <Pressable onPress={onPress}>
      <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.sm]}>
        <LinearGradient
          colors={[typeColor + '30', typeColor + '10']}
          style={styles.listIcon}
        >
          <Ionicons name={typeIcon as any} size={24} color={typeColor} />
        </LinearGradient>
        
        <View style={styles.listContent}>
          <View style={styles.listTitleRow}>
            <Text style={[styles.listName, { color: colors.text }]} numberOfLines={1}>
              {parfum.isim}
            </Text>
            {parfum.puan && (
              <View style={styles.listRating}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={[styles.listRatingText, { color: '#B8860B' }]}>{parfum.puan}</Text>
              </View>
            )}
          </View>
          
          {parfum.marka && (
            <Text style={[styles.listBrand, { color: colors.textMuted }]}>
              {parfum.marka}
            </Text>
          )}
          
          <View style={styles.listTags}>
            <View style={[styles.listTypeBadge, { backgroundColor: typeColor + '20' }]}>
              <Text style={[styles.listTypeText, { color: typeColor }]}>
                {parfum.tip}
              </Text>
            </View>
            
            <View style={styles.yogunlukIndicator}>
              {[1, 2, 3].map(i => (
                <View 
                  key={i} 
                  style={[
                    styles.yogunlukBarSmall, 
                    { backgroundColor: i <= bars ? typeColor : colors.backgroundTertiary }
                  ]} 
                />
              ))}
            </View>
            
            <Text style={[styles.listMevsim, { color: colors.textMuted }]}>
              {parfum.mevsim[0]}
            </Text>
          </View>
        </View>
        
        <Pressable style={[styles.listFavoriteButton, { borderColor: colors.border }]}>
          <Ionicons name="heart-outline" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
    </Pressable>
  );
}

// Detay Modal
function ParfumDetailModal({
  parfum,
  visible,
  onClose,
  colors,
  shadows,
  colorScheme,
}: {
  parfum: Parfum | null;
  visible: boolean;
  onClose: () => void;
  colors: typeof Colors.light;
  shadows: typeof Shadows.light;
  colorScheme: 'light' | 'dark' | null | undefined;
}) {
  if (!parfum) return null;

  const typeColor = ScentTypeColors[parfum.tip] || colors.tint;
  const typeIcon = ScentTypeIcons[parfum.tip] || 'sparkles-outline';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.modalContainer}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
            <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>Parfüm Detayı</Text>
            <Pressable style={styles.modalCloseButton}>
              <Ionicons name="heart-outline" size={24} color={colors.tint} />
            </Pressable>
          </View>

          <ScrollView 
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <LinearGradient
              colors={[typeColor + '30', typeColor + '10', 'transparent']}
              style={styles.modalHeroGradient}
            >
              <View style={[styles.modalIcon, { backgroundColor: typeColor }]}>
                <Ionicons name={typeIcon as any} size={48} color="#FFF" />
              </View>
            </LinearGradient>

            {/* Title */}
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {parfum.isim}
            </Text>
            {parfum.marka && (
              <Text style={[styles.modalMarka, { color: colors.textMuted }]}>
                by {parfum.marka}
              </Text>
            )}

            {/* Tags */}
            <View style={styles.modalTagsRow}>
              <View style={[styles.modalTag, { backgroundColor: typeColor + '20' }]}>
                <Text style={[styles.modalTagText, { color: typeColor }]}>
                  {parfum.tip}
                </Text>
              </View>
              
              <View style={[styles.modalTag, { backgroundColor: colors.backgroundTertiary }]}>
                <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.modalTagText, { color: colors.textSecondary, marginLeft: 4 }]}>
                  {parfum.cinsiyet}
                </Text>
              </View>
              
              {parfum.puan && (
                <View style={[styles.modalTag, { backgroundColor: '#FFD70020' }]}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={[styles.modalTagText, { color: '#B8860B', marginLeft: 4 }]}>
                    {parfum.puan}
                  </Text>
                </View>
              )}

              {parfum.fiyatAraligi && (
                <View style={[styles.modalTag, { backgroundColor: colors.backgroundTertiary }]}>
                  <Ionicons name="pricetag-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.modalTagText, { color: colors.textSecondary, marginLeft: 4 }]}>
                    {parfum.fiyatAraligi}
                  </Text>
                </View>
              )}
            </View>

            {/* Description */}
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              {parfum.aciklama}
            </Text>

            {/* Info Grid */}
            <View style={styles.infoGrid}>
              <InfoItem icon="time-outline" label="Kalıcılık" value={parfum.kalicilik} colors={colors} accent={typeColor} />
              <InfoItem icon="speedometer-outline" label="Yoğunluk" value={parfum.yogunluk} colors={colors} accent={typeColor} />
              <InfoItem icon="calendar-outline" label="Mevsim" value={parfum.mevsim.join(', ')} colors={colors} accent={typeColor} />
              <InfoItem 
                icon="location-outline" 
                label="Ortam" 
                value={parfum.ortam === 'her_ikisi' ? 'Her İkisi' : parfum.ortam === 'kapali' ? 'Kapalı' : 'Açık'} 
                colors={colors} 
                accent={typeColor}
              />
            </View>

            {/* pH Info */}
            {parfum.phUyumu && (
              <View style={styles.modalSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>🧪 pH UYUMU</Text>
                <View style={[styles.phInfoCard, { backgroundColor: colors.backgroundTertiary }]}>
                  <View style={styles.phRow}>
                    <View style={styles.phItem}>
                      <Text style={[styles.phLabel, { color: colors.textMuted }]}>Min pH</Text>
                      <Text style={[styles.phValue, { color: colors.text }]}>{parfum.phUyumu.minPH}</Text>
                    </View>
                    <View style={styles.phItem}>
                      <Text style={[styles.phLabel, { color: colors.textMuted }]}>İdeal pH</Text>
                      <Text style={[styles.phValue, { color: typeColor }]}>{parfum.phUyumu.idealPH}</Text>
                    </View>
                    <View style={styles.phItem}>
                      <Text style={[styles.phLabel, { color: colors.textMuted }]}>Max pH</Text>
                      <Text style={[styles.phValue, { color: colors.text }]}>{parfum.phUyumu.maxPH}</Text>
                    </View>
                  </View>
                  <View style={styles.phEffects}>
                    <Text style={[styles.phEffectText, { color: colors.textSecondary }]}>
                      <Text style={{ fontWeight: '600' }}>Asidik: </Text>{parfum.phUyumu.asidikEtki}
                    </Text>
                    <Text style={[styles.phEffectText, { color: colors.textSecondary }]}>
                      <Text style={{ fontWeight: '600' }}>Bazik: </Text>{parfum.phUyumu.bazikEtki}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Notes Pyramid */}
            <View style={styles.modalSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🎭 NOTA PİRAMİDİ</Text>
              
              <View style={styles.notesPyramid}>
                <NoteLevel 
                  label="✨ Üst Notalar" 
                  notes={parfum.notalar.ust} 
                  color="#FFE66D"
                  colors={colors}
                />
                <NoteLevel 
                  label="💫 Orta Notalar" 
                  notes={parfum.notalar.orta} 
                  color="#FF8C42"
                  colors={colors}
                />
                <NoteLevel 
                  label="🌲 Alt Notalar" 
                  notes={parfum.notalar.alt} 
                  color="#8B5A2B"
                  colors={colors}
                />
              </View>
            </View>

            {/* Tags */}
            {parfum.etiketler && parfum.etiketler.length > 0 && (
              <View style={styles.modalSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>🏷️ ETİKETLER</Text>
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
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

function InfoItem({ icon, label, value, colors, accent }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: typeof Colors.light;
  accent?: string;
}) {
  return (
    <View style={[styles.infoItem, { backgroundColor: colors.backgroundTertiary }]}>
      <Ionicons name={icon} size={20} color={accent || colors.tint} />
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function NoteLevel({ label, notes, color, colors }: {
  label: string;
  notes: string[];
  color: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={[styles.noteLevel, { backgroundColor: color + '15' }]}>
      <Text style={styles.noteLevelLabel}>{label}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  statsBanner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: BorderRadius.lg,
  },
  viewButton: {
    padding: 8,
    borderRadius: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.sm,
    paddingVertical: 2,
  },
  activeSortBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  activeSortText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  filterWrapper: {
    paddingVertical: Spacing.sm,
  },
  filterContainer: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: 4,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterCount: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing['3xl'],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: Spacing['4xl'],
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: Spacing.md,
  },
  gridCard: {
    alignItems: 'center',
    minHeight: 195,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    position: 'relative',
  },
  gridIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  gridBrand: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridName: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    minHeight: 36,
  },
  gridTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  gridTypeText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  gridInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 'auto',
  },
  yogunlukIndicator: {
    flexDirection: 'row',
    gap: 3,
  },
  yogunlukBar: {
    width: 16,
    height: 4,
    borderRadius: 2,
  },
  yogunlukBarSmall: {
    width: 12,
    height: 3,
    borderRadius: 2,
  },
  gridSeasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gridSeasonText: {
    fontSize: 10,
  },
  ratingBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    gap: Spacing.md,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  listIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  listContent: {
    flex: 1,
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    flex: 1,
    marginRight: Spacing.sm,
  },
  listBrand: {
    fontSize: FontSizes.xs,
    marginBottom: Spacing.xs,
  },
  listTags: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  listTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  listTypeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  listMevsim: {
    fontSize: 11,
  },
  listRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  listRatingText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  listFavoriteButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  // Sort Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sortModal: {
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  sortModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  sortModalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xs,
  },
  sortOptionText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
  },
  // Detail Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    padding: Spacing.sm,
  },
  modalHeaderTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    paddingBottom: Spacing['3xl'],
  },
  modalHeroGradient: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIcon: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: FontSizes['2xl'],
    fontWeight: '800',
    textAlign: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  modalMarka: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    marginTop: 4,
  },
  modalTagsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
  },
  modalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  modalTagText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  modalDescription: {
    fontSize: FontSizes.base,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing['2xl'],
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing['2xl'],
  },
  infoItem: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2 - Spacing.sm / 2,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: FontSizes.xs,
    marginTop: 4,
  },
  infoValue: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  modalSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  phInfoCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  phRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  phItem: {
    alignItems: 'center',
  },
  phLabel: {
    fontSize: FontSizes.xs,
    marginBottom: 4,
  },
  phValue: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  phEffects: {
    gap: Spacing.sm,
  },
  phEffectText: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  notesPyramid: {
    gap: Spacing.sm,
  },
  noteLevel: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  noteLevelLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    marginBottom: Spacing.sm,
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
    fontSize: FontSizes.xs,
    fontWeight: '500',
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
    fontSize: FontSizes.sm,
  },
});
