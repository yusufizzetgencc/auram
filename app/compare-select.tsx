/**
 * AROMIXEN - Compare Select Screen
 * Karşılaştırma için parfüm seçim ekranı
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useMemo, useEffect } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Spacing, ScentTypeColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function CompareSelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  
  const { parfumler } = useApp();
  
  const initialId = typeof params.initialId === 'string' ? params.initialId : undefined;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (initialId && parfumler.some(p => p.id === initialId)) {
      setSelectedIds([initialId]);
    }
  }, [initialId, parfumler]);

  const filteredParfums = useMemo(() => {
    if (!searchQuery) return parfumler;
    const lowerQ = searchQuery.toLowerCase();
    return parfumler.filter(p => 
      p.isim.toLowerCase().includes(lowerQ) || 
      (p.marka || '').toLowerCase().includes(lowerQ) ||
      p.tip.toLowerCase().includes(lowerQ)
    );
  }, [parfumler, searchQuery]);

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      if (selectedIds.length >= 3) {
        Alert.alert('Sınır Aşıldı', 'En fazla 3 parfüm karşılaştırabilirsiniz.');
        return;
      }
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const startCompare = () => {
    if (selectedIds.length >= 2) {
      router.push(`/compare?ids=${selectedIds.join(',')}`);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View>
            <ThemedText type="subtitle">Karşılaştırma</ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {selectedIds.length}/3 parfüm seçildi
            </ThemedText>
          </View>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* Arama Kutusu */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.searchContainer}>
          <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Parfüm, marka veya tip ara..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Liste */}
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredParfums.map((parfum, index) => {
            const isSelected = selectedIds.includes(parfum.id);
            const typeColor = ScentTypeColors[parfum.tip as keyof typeof ScentTypeColors] || ScentTypeColors.default;
            
            return (
              <Animated.View 
                key={parfum.id} 
                entering={FadeInUp.duration(400).delay(index * 50)}
              >
                <TouchableOpacity
                  style={[
                    styles.card,
                    { 
                      backgroundColor: colors.card, 
                      borderColor: isSelected ? colors.tint : colors.border 
                    },
                    isSelected && { borderWidth: 2 }
                  ]}
                  onPress={() => toggleSelection(parfum.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardInfo}>
                    <ThemedText style={{ color: colors.text, fontWeight: '600' }}>
                      {parfum.isim}
                    </ThemedText>
                    {parfum.marka && (
                      <ThemedText style={[styles.brandText, { color: colors.textSecondary }]}>
                        {parfum.marka}
                      </ThemedText>
                    )}
                    <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
                      <ThemedText style={[styles.typeText, { color: typeColor }]}>
                        {parfum.tip}
                      </ThemedText>
                    </View>
                  </View>
                  
                  <View style={[
                    styles.checkbox,
                    { borderColor: isSelected ? colors.tint : colors.border },
                    isSelected && { backgroundColor: colors.tint }
                  ]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
          
          {filteredParfums.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aradığınız kriterlere uygun parfüm bulunamadı.
              </ThemedText>
            </View>
          )}
          
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Footer Buton */}
        {selectedIds.length >= 2 && (
          <Animated.View entering={FadeInUp.duration(300)} style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.compareBtn, { backgroundColor: colors.tint }]}
              onPress={startCompare}
              activeOpacity={0.8}
            >
              <Ionicons name="git-compare-outline" size={20} color="#FFF" />
              <ThemedText style={styles.compareBtnText}>
                Karşılaştır ({selectedIds.length}/3)
              </ThemedText>
            </TouchableOpacity>
          </Animated.View>
        )}
      </SafeAreaView>
    </ThemedView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    gap: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
  },
  cardInfo: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
  },
  brandText: {
    fontSize: 13,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    borderTopWidth: 1,
    paddingBottom: 40,
  },
  compareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  compareBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
