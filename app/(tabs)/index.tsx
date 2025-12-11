/**
 * AROMIXEN - Modern Parfümler Sayfası
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, Button } from '@/components/ui';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { Parfum, KokuTipi, Mevsim, KokuYogunlugu } from '@/types';

const { width } = Dimensions.get('window');

const FILTER_TYPES: (KokuTipi | 'Tümü')[] = ['Tümü', 'Çiçeksi', 'Odunsu', 'Ferah', 'Amber', 'Baharatlı', 'Meyvemsi', 'Tatlı', 'Yeşil'];

// Koku tipine göre renk
const getTypeColor = (tip: string): string => {
  const colorMap: Record<string, string> = {
    'Çiçeksi': '#E8A4C9',
    'Odunsu': '#8B7355',
    'Ferah': '#7EC8E3',
    'Amber': '#D4A574',
    'Baharatlı': '#C75B39',
    'Meyvemsi': '#FF6B6B',
    'Tatlı': '#FFB6C1',
    'Yeşil': '#90EE90',
  };
  return colorMap[tip] || '#D4A574';
};

// Koku tipine göre icon
const getTypeIcon = (tip: string): keyof typeof Ionicons.glyphMap => {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    'Çiçeksi': 'flower-outline',
    'Odunsu': 'leaf-outline',
    'Ferah': 'water-outline',
    'Amber': 'flame-outline',
    'Baharatlı': 'sparkles-outline',
    'Meyvemsi': 'nutrition-outline',
    'Tatlı': 'ice-cream-outline',
    'Yeşil': 'leaf-outline',
  };
  return iconMap[tip] || 'sparkles-outline';
};

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
  const { parfumler } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<KokuTipi | 'Tümü'>('Tümü');
  const [selectedParfum, setSelectedParfum] = useState<Parfum | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredPerfumes = useMemo(() => {
    return parfumler.filter(parfum => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        parfum.isim.toLowerCase().includes(query) ||
        parfum.tip.toLowerCase().includes(query) ||
        parfum.notalar.ust.some(n => n.toLowerCase().includes(query)) ||
        parfum.notalar.orta.some(n => n.toLowerCase().includes(query)) ||
        parfum.notalar.alt.some(n => n.toLowerCase().includes(query)) ||
        parfum.etiketler?.some(e => e.toLowerCase().includes(query));
      
      const matchesType = selectedType === 'Tümü' || parfum.tip === selectedType;
      return matchesSearch && matchesType;
    });
  }, [parfumler, searchQuery, selectedType]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View 
          entering={FadeIn.duration(500)}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <ThemedText type="title" style={styles.headerTitle}>Parfümler</ThemedText>
              <ThemedText type="caption" style={{ marginTop: 2 }}>
                {filteredPerfumes.length} koku keşfet
              </ThemedText>
            </View>
            
            <View style={styles.viewToggle}>
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

          {/* Search */}
          <View style={[styles.searchBox, { backgroundColor: colors.backgroundTertiary }]}>
            <Ionicons name="search-outline" size={16} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Koku, nota veya etiket ara..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Compact Filters */}
        <View style={styles.filterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {FILTER_TYPES.map((type) => {
              const isSelected = selectedType === type;
              const typeColor = type !== 'Tümü' ? getTypeColor(type) : colors.tint;
              
              return (
                <Pressable
                  key={type}
                  onPress={() => setSelectedType(type)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected ? typeColor : colors.backgroundTertiary,
                    },
                  ]}
                >
                  {type !== 'Tümü' && (
                    <View style={[
                      styles.filterDot, 
                      { backgroundColor: isSelected ? '#FFFFFF' : typeColor }
                    ]} />
                  )}
                  <ThemedText
                    style={[
                      styles.filterText,
                      { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {type}
                  </ThemedText>
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
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <ThemedText type="body" center style={{ marginTop: Spacing.md }}>
                Sonuç bulunamadı
              </ThemedText>
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
                    onPress={() => setSelectedParfum(parfum)}
                  />
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Parfüm Detay Modal */}
        <ParfumDetailModal
          parfum={selectedParfum}
          visible={selectedParfum !== null}
          onClose={() => setSelectedParfum(null)}
          colors={colors}
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
  onPress,
}: {
  parfum: Parfum;
  colors: typeof Colors.light;
  onPress: () => void;
}) {
  const typeColor = getTypeColor(parfum.tip);
  const typeIcon = getTypeIcon(parfum.tip);
  const bars = getYogunlukBars(parfum.yogunluk);

  return (
    <Pressable onPress={onPress}>
      <Card variant="elevated" padding="md" style={styles.gridCard}>
        {/* Icon */}
        <View style={[styles.gridIcon, { backgroundColor: typeColor + '15' }]}>
          <Ionicons name={typeIcon} size={28} color={typeColor} />
        </View>

        {/* Name */}
        <ThemedText type="heading" style={styles.gridName} numberOfLines={2}>
          {parfum.isim}
        </ThemedText>

        {/* Type Badge */}
        <View style={[styles.gridTypeBadge, { backgroundColor: typeColor + '20' }]}>
          <ThemedText style={[styles.gridTypeText, { color: typeColor }]}>
            {parfum.tip}
          </ThemedText>
        </View>

        {/* Info Row */}
        <View style={styles.gridInfoRow}>
          <View style={styles.yogunlukIndicator}>
            {[1, 2, 3].map(i => (
              <View 
                key={i} 
                style={[
                  styles.yogunlukBar, 
                  { backgroundColor: i <= bars ? colors.tint : colors.backgroundTertiary }
                ]} 
              />
            ))}
          </View>
          
          <View style={styles.gridSeasonRow}>
            <Ionicons name="calendar-outline" size={10} color={colors.textMuted} />
            <ThemedText style={styles.gridSeasonText}>
              {parfum.mevsim[0]?.substring(0, 3)}
            </ThemedText>
          </View>
        </View>

        {/* Rating */}
        {parfum.puan && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <ThemedText style={styles.ratingText}>{parfum.puan}</ThemedText>
          </View>
        )}
      </Card>
    </Pressable>
  );
}

// List Kart
function PerfumeListCard({
  parfum,
  colors,
  onPress,
}: {
  parfum: Parfum;
  colors: typeof Colors.light;
  onPress: () => void;
}) {
  const typeColor = getTypeColor(parfum.tip);
  const typeIcon = getTypeIcon(parfum.tip);

  return (
    <Pressable onPress={onPress}>
      <Card variant="elevated" padding="md" style={styles.listCard}>
        <View style={[styles.listIcon, { backgroundColor: typeColor + '15' }]}>
          <Ionicons name={typeIcon} size={24} color={typeColor} />
        </View>
        
        <View style={styles.listContent}>
          <ThemedText type="heading" style={styles.listName} numberOfLines={1}>
            {parfum.isim}
          </ThemedText>
          
          <ThemedText type="caption" numberOfLines={1} style={{ marginBottom: 4 }}>
            {parfum.aciklama}
          </ThemedText>
          
          <View style={styles.listTags}>
            <View style={[styles.listTypeBadge, { backgroundColor: typeColor + '20' }]}>
              <ThemedText style={[styles.listTypeText, { color: typeColor }]}>
                {parfum.tip}
              </ThemedText>
            </View>
            
            <ThemedText type="caption" style={{ marginLeft: 8 }}>
              {parfum.mevsim[0]}
            </ThemedText>
            
            {parfum.puan && (
              <View style={styles.listRating}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <ThemedText style={styles.listRatingText}>{parfum.puan}</ThemedText>
              </View>
            )}
          </View>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Card>
    </Pressable>
  );
}

// Detay Modal
function ParfumDetailModal({
  parfum,
  visible,
  onClose,
  colors,
  colorScheme,
}: {
  parfum: Parfum | null;
  visible: boolean;
  onClose: () => void;
  colors: typeof Colors.light;
  colorScheme: 'light' | 'dark' | null | undefined;
}) {
  if (!parfum) return null;

  const typeColor = getTypeColor(parfum.tip);
  const typeIcon = getTypeIcon(parfum.tip);

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
          <View style={styles.modalHeader}>
            <Pressable onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
            <ThemedText type="heading">Parfüm Detayı</ThemedText>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView 
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <View style={styles.modalHero}>
              <LinearGradient
                colors={[typeColor + '30', typeColor + '10']}
                style={styles.modalHeroGradient}
              >
                <View style={[styles.modalIcon, { backgroundColor: typeColor + '30' }]}>
                  <Ionicons name={typeIcon} size={48} color={typeColor} />
                </View>
              </LinearGradient>
            </View>

            {/* Title */}
            <ThemedText type="title" center style={styles.modalTitle}>
              {parfum.isim}
            </ThemedText>

            {/* Tags */}
            <View style={styles.modalTagsRow}>
              <View style={[styles.modalTag, { backgroundColor: typeColor + '20' }]}>
                <ThemedText style={{ color: typeColor, fontWeight: FontWeights.semiBold }}>
                  {parfum.tip}
                </ThemedText>
              </View>
              
              <View style={[styles.modalTag, { backgroundColor: colors.backgroundTertiary }]}>
                <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                <ThemedText style={{ marginLeft: 4 }}>{parfum.cinsiyet}</ThemedText>
              </View>
              
              {parfum.puan && (
                <View style={[styles.modalTag, { backgroundColor: '#FFD70020' }]}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <ThemedText style={{ marginLeft: 4, color: '#B8860B' }}>{parfum.puan}</ThemedText>
                </View>
              )}
            </View>

            {/* Description */}
            <ThemedText type="body" center style={styles.modalDescription}>
              {parfum.aciklama}
            </ThemedText>

            {/* Info Grid */}
            <View style={styles.infoGrid}>
              <InfoItem 
                icon="time-outline" 
                label="Kalıcılık" 
                value={parfum.kalicilik} 
                colors={colors} 
              />
              <InfoItem 
                icon="speedometer-outline" 
                label="Yoğunluk" 
                value={parfum.yogunluk} 
                colors={colors} 
              />
              <InfoItem 
                icon="calendar-outline" 
                label="Mevsim" 
                value={parfum.mevsim.join(', ')} 
                colors={colors} 
              />
              <InfoItem 
                icon="location-outline" 
                label="Ortam" 
                value={parfum.ortam === 'her_ikisi' ? 'Her İkisi' : parfum.ortam === 'kapali' ? 'Kapalı' : 'Açık'} 
                colors={colors} 
              />
            </View>

            {/* Notes Pyramid */}
            <View style={styles.modalSection}>
              <ThemedText type="label" style={styles.sectionTitle}>NOTA PİRAMİDİ</ThemedText>
              
              <View style={styles.notesPyramid}>
                <NoteLevel 
                  label="🔝 Üst Notalar" 
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
                  label="🌳 Alt Notalar" 
                  notes={parfum.notalar.alt} 
                  color="#8B7355"
                  colors={colors}
                />
              </View>
            </View>

            {/* Usage */}
            <View style={styles.modalSection}>
              <ThemedText type="label" style={styles.sectionTitle}>KULLANIM</ThemedText>
              
              <View style={styles.usageGrid}>
                {parfum.kullanimAmaci.map(amac => (
                  <View key={amac} style={[styles.usageItem, { backgroundColor: colors.backgroundTertiary }]}>
                    <Ionicons 
                      name={getAmacIcon(amac)} 
                      size={18} 
                      color={colors.tint} 
                    />
                    <ThemedText type="caption" style={{ marginTop: 4 }}>
                      {getAmacLabel(amac)}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>

            {/* Tags */}
            {parfum.etiketler && parfum.etiketler.length > 0 && (
              <View style={styles.modalSection}>
                <ThemedText type="label" style={styles.sectionTitle}>ETİKETLER</ThemedText>
                
                <View style={styles.tagsContainer}>
                  {parfum.etiketler.map((etiket, index) => (
                    <View key={index} style={[styles.etiketBadge, { backgroundColor: colors.backgroundTertiary }]}>
                      <ThemedText style={styles.etiketText}>#{etiket}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

function InfoItem({ icon, label, value, colors }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={[styles.infoItem, { backgroundColor: colors.backgroundTertiary }]}>
      <Ionicons name={icon} size={20} color={colors.tint} />
      <ThemedText type="caption" style={{ marginTop: 4, opacity: 0.7 }}>{label}</ThemedText>
      <ThemedText style={styles.infoValue}>{value}</ThemedText>
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
      <ThemedText style={styles.noteLevelLabel}>{label}</ThemedText>
      <View style={styles.noteLevelNotes}>
        {notes.map((nota, index) => (
          <View key={index} style={[styles.notaBadge, { backgroundColor: colors.background }]}>
            <ThemedText type="caption">{nota}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

function getAmacIcon(amac: string): keyof typeof Ionicons.glyphMap {
  const map: Record<string, keyof typeof Ionicons.glyphMap> = {
    'gunluk': 'today-outline',
    'is': 'briefcase-outline',
    'aksam': 'moon-outline',
    'ozel': 'star-outline',
  };
  return map[amac] || 'ellipse-outline';
}

function getAmacLabel(amac: string): string {
  const map: Record<string, string> = {
    'gunluk': 'Günlük',
    'is': 'İş',
    'aksam': 'Akşam',
    'ozel': 'Özel Gün',
  };
  return map[amac] || amac;
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 4,
  },
  viewButton: {
    padding: 6,
    borderRadius: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.sm,
    paddingVertical: 2,
  },
  filterWrapper: {
    paddingBottom: Spacing.sm,
  },
  filterContainer: {
    paddingHorizontal: Spacing.lg,
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 6,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing['2xl'],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: Spacing['4xl'],
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
    minHeight: 180,
  },
  gridIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  gridName: {
    fontSize: FontSizes.base,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    minHeight: 40,
  },
  gridTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  gridTypeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
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
  gridSeasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gridSeasonText: {
    fontSize: 10,
    opacity: 0.7,
  },
  ratingRow: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
  },
  listContainer: {
    gap: Spacing.md,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  listContent: {
    flex: 1,
  },
  listName: {
    fontSize: FontSizes.base,
    marginBottom: 2,
  },
  listTags: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  listTypeText: {
    fontSize: 10,
    fontWeight: FontWeights.semiBold,
  },
  listRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 2,
  },
  listRatingText: {
    fontSize: FontSizes.xs,
  },
  // Modal Styles
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
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalCloseButton: {
    padding: Spacing.sm,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    paddingBottom: Spacing['3xl'],
  },
  modalHero: {
    marginBottom: Spacing.lg,
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
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  modalTagsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  modalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  modalDescription: {
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing['2xl'],
    lineHeight: 24,
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
  infoValue: {
    marginTop: 4,
    fontWeight: FontWeights.semiBold,
    textTransform: 'capitalize',
  },
  modalSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  notesPyramid: {
    gap: Spacing.sm,
  },
  noteLevel: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  noteLevelLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
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
  usageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  usageItem: {
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    minWidth: 80,
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
    opacity: 0.8,
  },
});
