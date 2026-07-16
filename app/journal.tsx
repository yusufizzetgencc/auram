/**
 * AROMIXEN - Scent Journal
 * Parfüm deneyim günlüğü
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight, SlideOutLeft } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, Button } from '@/components/ui';
import { PaywallScreen } from '@/components/paywall';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, ScentTypeColors } from '@/constants/theme';
import { FREE_JOURNAL_COUNT } from '@/constants/premiumLimits';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { usePremiumGate } from '@/hooks/use-premium-gate';
import { JournalEntry, Parfum, MoodType } from '@/types';
import {
  loadJournalEntries,
  addJournalEntry,
  deleteJournalEntry,
  updateJournalEntry,
} from '@/services/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOODS: { id: MoodType; emoji: string; label: string; color: string }[] = [
  { id: 'enerjik', emoji: '⚡', label: 'Enerjik', color: '#FF6B6B' },
  { id: 'romantik', emoji: '💕', label: 'Romantik', color: '#E91E8C' },
  { id: 'profesyonel', emoji: '💼', label: 'Profesyonel', color: '#667eea' },
  { id: 'rahat', emoji: '☁️', label: 'Rahat', color: '#00B4D8' },
  { id: 'gizemli', emoji: '🌙', label: 'Gizemli', color: '#9D4EDD' },
  { id: 'mutlu', emoji: '✨', label: 'Mutlu', color: '#FFD93D' },
];

const OCCASIONS = [
  { id: 'gunluk', label: 'Günlük', icon: 'today' },
  { id: 'is', label: 'İş', icon: 'briefcase' },
  { id: 'randevu', label: 'Randevu', icon: 'heart' },
  { id: 'parti', label: 'Parti', icon: 'sparkles' },
  { id: 'ozel', label: 'Özel Gün', icon: 'star' },
  { id: 'seyahat', label: 'Seyahat', icon: 'airplane' },
];

const TAGS = [
  'Uzun kalıcı', 'Kısa kalıcı', 'Çok beğendim', 'Tekrar alırım', 
  'İltifat aldım', 'Hafif', 'Yoğun', 'Ferah', 'Sıcak',
  'Yaz için', 'Kış için', 'Gece için', 'Gündüz için',
];

export default function JournalScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { parfumler, getFavoriteParfums, getRecentlyViewedParfums, addToRecentlyViewedList } = useApp();
  const { isPremium, paywallVisible, setPaywallVisible } = usePremiumGate();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  
  // Form state
  const [selectedParfum, setSelectedParfum] = useState<Parfum | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodType | null>(null);
  const [occasion, setOccasion] = useState<string>('gunluk');
  const [rating, setRating] = useState(0);
  const [longevity, setLongevity] = useState(3);
  const [sillage, setSillage] = useState(3);
  const [projection, setProjection] = useState(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFavoriteDay, setIsFavoriteDay] = useState(false);

  // Verileri yükle
  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const data = await loadJournalEntries();
    setEntries(data);
  };

  const resetForm = () => {
    setSelectedParfum(null);
    setTitle('');
    setContent('');
    setMood(null);
    setOccasion('gunluk');
    setRating(0);
    setLongevity(3);
    setSillage(3);
    setProjection(3);
    setSelectedTags([]);
    setIsFavoriteDay(false);
    setSelectedEntry(null);
  };

  const handleSave = async () => {
    if (!selectedParfum || !content || rating === 0) {
      Alert.alert('Eksik Bilgi', 'Lütfen parfüm seçin, yorum yazın ve puan verin.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    if (selectedEntry) {
      // Güncelle
      await updateJournalEntry(selectedEntry.id, {
        parfumId: selectedParfum.id,
        title: title || undefined,
        content,
        mood: mood || undefined,
        occasion,
        rating,
        performance: { longevity, sillage, projection },
        tags: selectedTags,
        isFavoriteDay,
      });
    } else {
      // Yeni ekle
      await addJournalEntry({
        parfumId: selectedParfum.id,
        date: today,
        title: title || undefined,
        content,
        mood: mood || undefined,
        occasion,
        rating,
        performance: { longevity, sillage, projection },
        tags: selectedTags,
        isFavoriteDay,
      });
    }

    await loadEntries();
    setShowAddModal(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Günlüğü Sil',
      'Bu günlük kaydını silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: async () => {
            await deleteJournalEntry(id);
            await loadEntries();
          }
        },
      ]
    );
  };

  const openAddModal = () => {
    if (!isPremium && entries.length >= FREE_JOURNAL_COUNT) {
      setPaywallVisible(true);
      return;
    }
    resetForm();
    setShowAddModal(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    const parfum = parfumler.find(p => p.id === entry.parfumId);
    if (!parfum) return;

    setSelectedEntry(entry);
    setSelectedParfum(parfum);
    setTitle(entry.title || '');
    setContent(entry.content);
    setMood(entry.mood || null);
    setOccasion(entry.occasion || 'gunluk');
    setRating(entry.rating);
    setLongevity(entry.performance.longevity);
    setSillage(entry.performance.sillage);
    setProjection(entry.performance.projection);
    setSelectedTags(entry.tags);
    setIsFavoriteDay(entry.isFavoriteDay);
    setShowAddModal(true);
  };

  const handleParfumPress = (parfum: Parfum) => {
    addToRecentlyViewedList(parfum.id);
    router.push(`/parfum/${parfum.id}`);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const favoriteParfums = getFavoriteParfums();
  const recentParfums = getRecentlyViewedParfums();

  // İstatistikler
  const stats = {
    totalEntries: entries.length,
    avgRating: entries.length > 0 
      ? (entries.reduce((acc, e) => acc + e.rating, 0) / entries.length).toFixed(1) 
      : '0',
    favoriteDays: entries.filter(e => e.isFavoriteDay).length,
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <ThemedText type="title">Parfüm Günlüğü</ThemedText>
            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              Deneyimlerini kaydet
            </ThemedText>
          </View>
          <Pressable
            onPress={openAddModal}
            style={[styles.addBtn, { backgroundColor: colors.tint }]}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </Pressable>
        </Animated.View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* İstatistikler */}
          <Animated.View entering={FadeInUp.delay(100).duration(400)}>
            <View style={styles.statsRow}>
              <Card variant="elevated" style={styles.statCard}>
                <Ionicons name="book" size={20} color={colors.primary} />
                <ThemedText style={[styles.statNumber, { color: colors.primary }]}>
                  {stats.totalEntries}
                </ThemedText>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  Kayıt
                </ThemedText>
              </Card>
              <Card variant="elevated" style={styles.statCard}>
                <Ionicons name="star" size={20} color={colors.warning} />
                <ThemedText style={[styles.statNumber, { color: colors.warning }]}>
                  {stats.avgRating}
                </ThemedText>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  Ort. Puan
                </ThemedText>
              </Card>
              <Card variant="elevated" style={styles.statCard}>
                <Ionicons name="heart" size={20} color={colors.accent} />
                <ThemedText style={[styles.statNumber, { color: colors.accent }]}>
                  {stats.favoriteDays}
                </ThemedText>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  Favori Gün
                </ThemedText>
              </Card>
            </View>
          </Animated.View>

          {/* Günlük Kayıtları */}
          {entries.length === 0 ? (
            <Animated.View entering={FadeIn.duration(400)}>
              <Card variant="elevated" style={styles.emptyCard}>
                <LinearGradient
                  colors={colors.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyGradient}
                >
                  <Ionicons name="book-outline" size={48} color="#FFF" />
                  <ThemedText style={styles.emptyTitle}>
                    Henüz günlük kaydı yok
                  </ThemedText>
                  <ThemedText style={styles.emptyDesc}>
                    Parfüm deneyimlerini kaydetmeye başla
                  </ThemedText>
                  <Pressable
                    onPress={openAddModal}
                    style={styles.emptyBtn}
                  >
                    <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>
                      İlk Kaydı Oluştur
                    </ThemedText>
                  </Pressable>
                </LinearGradient>
              </Card>
            </Animated.View>
          ) : (
            <View style={styles.entriesList}>
              {entries.map((entry, index) => {
                const parfum = parfumler.find(p => p.id === entry.parfumId);
                if (!parfum) return null;
                
                const moodData = MOODS.find(m => m.id === entry.mood);
                const occasionData = OCCASIONS.find(o => o.id === entry.occasion);
                const typeColor = ScentTypeColors[parfum.tip] || colors.tint;
                
                return (
                  <Animated.View 
                    key={entry.id}
                    entering={SlideInRight.delay(index * 60).duration(400)}
                  >
                    <Card variant="elevated" style={styles.entryCard}>
                      {/* Header */}
                      <View style={styles.entryHeader}>
                        <View style={[styles.entryIcon, { backgroundColor: typeColor + '15' }]}>
                          <Ionicons name="sparkles" size={18} color={typeColor} />
                        </View>
                        <View style={styles.entryInfo}>
                          <View style={styles.entryTitleRow}>
                            <ThemedText type="subtitle" numberOfLines={1} style={styles.entryName}>
                              {parfum.isim}
                            </ThemedText>
                            {entry.isFavoriteDay && (
                              <Ionicons name="heart" size={14} color={colors.accent} />
                            )}
                          </View>
                          <ThemedText type="caption" style={{ color: colors.textMuted }}>
                            {new Date(entry.date).toLocaleDateString('tr-TR', { 
                              day: 'numeric', 
                              month: 'long',
                              year: 'numeric',
                            })}
                          </ThemedText>
                        </View>
                        <View style={styles.entryActions}>
                          <Pressable onPress={() => handleEditEntry(entry)}>
                            <Ionicons name="pencil" size={18} color={colors.textMuted} />
                          </Pressable>
                          <Pressable onPress={() => handleDelete(entry.id)}>
                            <Ionicons name="trash-outline" size={18} color={colors.error} />
                          </Pressable>
                        </View>
                      </View>

                      {/* Title */}
                      {entry.title && (
                        <ThemedText type="heading" style={styles.entryTitle}>
                          {entry.title}
                        </ThemedText>
                      )}

                      {/* Content */}
                      <ThemedText style={styles.entryContent} numberOfLines={3}>
                        {entry.content}
                      </ThemedText>

                      {/* Meta Row */}
                      <View style={styles.entryMeta}>
                        {/* Mood */}
                        {moodData && (
                          <View style={[styles.metaBadge, { backgroundColor: moodData.color + '15' }]}>
                            <ThemedText style={{ fontSize: 12 }}>{moodData.emoji}</ThemedText>
                            <ThemedText style={{ color: moodData.color, fontSize: 10 }}>
                              {moodData.label}
                            </ThemedText>
                          </View>
                        )}

                        {/* Occasion */}
                        {occasionData && (
                          <View style={[styles.metaBadge, { backgroundColor: colors.backgroundTertiary }]}>
                            <Ionicons name={occasionData.icon as any} size={10} color={colors.textMuted} />
                            <ThemedText style={{ color: colors.textMuted, fontSize: 10 }}>
                              {occasionData.label}
                            </ThemedText>
                          </View>
                        )}

                        {/* Rating */}
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={12} color="#FFD93D" />
                          <ThemedText style={styles.ratingText}>{entry.rating}</ThemedText>
                        </View>
                      </View>

                      {/* Performance */}
                      <View style={styles.performanceRow}>
                        <View style={styles.performanceItem}>
                          <ThemedText type="caption" style={{ color: colors.textMuted }}>
                            Kalıcılık
                          </ThemedText>
                          <View style={styles.performanceBar}>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <View 
                                key={i}
                                style={[
                                  styles.performanceDot,
                                  { backgroundColor: i <= entry.performance.longevity ? colors.tint : colors.backgroundTertiary }
                                ]}
                              />
                            ))}
                          </View>
                        </View>
                        <View style={styles.performanceItem}>
                          <ThemedText type="caption" style={{ color: colors.textMuted }}>
                            İz Bırakma
                          </ThemedText>
                          <View style={styles.performanceBar}>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <View 
                                key={i}
                                style={[
                                  styles.performanceDot,
                                  { backgroundColor: i <= entry.performance.sillage ? colors.primary : colors.backgroundTertiary }
                                ]}
                              />
                            ))}
                          </View>
                        </View>
                        <View style={styles.performanceItem}>
                          <ThemedText type="caption" style={{ color: colors.textMuted }}>
                            Yayılım
                          </ThemedText>
                          <View style={styles.performanceBar}>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <View 
                                key={i}
                                style={[
                                  styles.performanceDot,
                                  { backgroundColor: i <= entry.performance.projection ? colors.warning : colors.backgroundTertiary }
                                ]}
                              />
                            ))}
                          </View>
                        </View>
                      </View>

                      {/* Tags */}
                      {entry.tags.length > 0 && (
                        <View style={styles.entryTags}>
                          {entry.tags.slice(0, 3).map((tag) => (
                            <View key={tag} style={[styles.tag, { backgroundColor: colors.backgroundTertiary }]}>
                              <ThemedText style={{ fontSize: 10, color: colors.textMuted }}>
                                {tag}
                              </ThemedText>
                            </View>
                          ))}
                          {entry.tags.length > 3 && (
                            <ThemedText style={{ fontSize: 10, color: colors.textMuted }}>
                              +{entry.tags.length - 3}
                            </ThemedText>
                          )}
                        </View>
                      )}
                    </Card>
                  </Animated.View>
                );
              })}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Ekleme/Düzenleme Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={styles.modalContainer}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => { setShowAddModal(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
              <ThemedText type="heading">
                {selectedEntry ? 'Günlüğü Düzenle' : 'Yeni Kayıt'}
              </ThemedText>
              <Pressable onPress={handleSave}>
                <ThemedText style={{ color: colors.tint, fontWeight: '600' }}>
                  Kaydet
                </ThemedText>
              </Pressable>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Parfüm Seçimi */}
              {selectedParfum ? (
                <Card variant="elevated" style={styles.selectedParfumCard}>
                  <View style={styles.selectedRow}>
                    <View style={[styles.selectedIcon, { 
                      backgroundColor: (ScentTypeColors[selectedParfum.tip] || colors.tint) + '15' 
                    }]}>
                      <Ionicons name="sparkles" size={20} color={ScentTypeColors[selectedParfum.tip] || colors.tint} />
                    </View>
                    <View style={styles.selectedInfo}>
                      <ThemedText type="subtitle">{selectedParfum.isim}</ThemedText>
                      <ThemedText type="caption" style={{ color: colors.textMuted }}>
                        {selectedParfum.marka}
                      </ThemedText>
                    </View>
                    <Pressable onPress={() => setSelectedParfum(null)}>
                      <Ionicons name="close-circle" size={24} color={colors.textMuted} />
                    </Pressable>
                  </View>
                </Card>
              ) : (
                <View style={styles.parfumSection}>
                  <ThemedText type="label" style={styles.sectionLabel}>Parfüm Seç *</ThemedText>
                  
                  {favoriteParfums.length > 0 && (
                    <>
                      <ThemedText type="caption" style={{ color: colors.textMuted, marginBottom: Spacing.sm }}>
                        Favorilerim
                      </ThemedText>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.parfumList}>
                          {favoriteParfums.slice(0, 6).map((parfum) => (
                            <Pressable key={parfum.id} onPress={() => setSelectedParfum(parfum)}>
                              <Card variant="elevated" style={styles.parfumSelectCard}>
                                <ThemedText numberOfLines={1} style={styles.parfumSelectName}>
                                  {parfum.isim}
                                </ThemedText>
                              </Card>
                            </Pressable>
                          ))}
                        </View>
                      </ScrollView>
                    </>
                  )}

                  <ThemedText type="caption" style={{ color: colors.textMuted, marginBottom: Spacing.sm, marginTop: Spacing.md }}>
                    Son Görüntülenen
                  </ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.parfumList}>
                      {recentParfums.slice(0, 6).map((parfum) => (
                        <Pressable key={parfum.id} onPress={() => setSelectedParfum(parfum)}>
                          <Card variant="elevated" style={styles.parfumSelectCard}>
                            <ThemedText numberOfLines={1} style={styles.parfumSelectName}>
                              {parfum.isim}
                            </ThemedText>
                          </Card>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Başlık */}
              <View style={styles.formSection}>
                <ThemedText type="label" style={styles.sectionLabel}>Başlık (Opsiyonel)</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.backgroundTertiary, color: colors.text }]}
                  placeholder="Örn: İlk deneyimim"
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Yorum */}
              <View style={styles.formSection}>
                <ThemedText type="label" style={styles.sectionLabel}>Yorumun *</ThemedText>
                <TextInput
                  style={[styles.textarea, { backgroundColor: colors.backgroundTertiary, color: colors.text }]}
                  placeholder="Bu parfüm nasıl performans gösterdi? Neler hissettin?"
                  placeholderTextColor={colors.textMuted}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Puan */}
              <View style={styles.formSection}>
                <ThemedText type="label" style={styles.sectionLabel}>Puan *</ThemedText>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable key={star} onPress={() => setRating(star)}>
                      <Ionicons 
                        name={rating >= star ? 'star' : 'star-outline'} 
                        size={36} 
                        color={rating >= star ? colors.warning : colors.textMuted} 
                      />
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Mood */}
              <View style={styles.formSection}>
                <ThemedText type="label" style={styles.sectionLabel}>Ruh Halin</ThemedText>
                <View style={styles.moodsGrid}>
                  {MOODS.map((m) => (
                    <Pressable
                      key={m.id}
                      onPress={() => setMood(mood === m.id ? null : m.id)}
                      style={[
                        styles.moodItem,
                        { backgroundColor: mood === m.id ? m.color + '20' : colors.backgroundTertiary },
                        mood === m.id && { borderColor: m.color, borderWidth: 2 },
                      ]}
                    >
                      <ThemedText style={{ fontSize: 20 }}>{m.emoji}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Vesile */}
              <View style={styles.formSection}>
                <ThemedText type="label" style={styles.sectionLabel}>Vesile</ThemedText>
                <View style={styles.occasionsGrid}>
                  {OCCASIONS.map((o) => (
                    <Pressable
                      key={o.id}
                      onPress={() => setOccasion(o.id)}
                      style={[
                        styles.occasionItem,
                        { backgroundColor: occasion === o.id ? colors.tint + '20' : colors.backgroundTertiary },
                        occasion === o.id && { borderColor: colors.tint, borderWidth: 2 },
                      ]}
                    >
                      <Ionicons 
                        name={o.icon as any} 
                        size={16} 
                        color={occasion === o.id ? colors.tint : colors.textMuted} 
                      />
                      <ThemedText style={{ 
                        fontSize: 10, 
                        color: occasion === o.id ? colors.tint : colors.textMuted 
                      }}>
                        {o.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Performans */}
              <View style={styles.formSection}>
                <ThemedText type="label" style={styles.sectionLabel}>Performans</ThemedText>
                
                <View style={styles.perfRow}>
                  <ThemedText style={{ flex: 1 }}>Kalıcılık</ThemedText>
                  <View style={styles.perfDots}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Pressable key={i} onPress={() => setLongevity(i)}>
                        <View 
                          style={[
                            styles.perfDot,
                            { backgroundColor: i <= longevity ? colors.tint : colors.backgroundTertiary }
                          ]}
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.perfRow}>
                  <ThemedText style={{ flex: 1 }}>İz Bırakma</ThemedText>
                  <View style={styles.perfDots}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Pressable key={i} onPress={() => setSillage(i)}>
                        <View 
                          style={[
                            styles.perfDot,
                            { backgroundColor: i <= sillage ? colors.primary : colors.backgroundTertiary }
                          ]}
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.perfRow}>
                  <ThemedText style={{ flex: 1 }}>Yayılım</ThemedText>
                  <View style={styles.perfDots}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Pressable key={i} onPress={() => setProjection(i)}>
                        <View 
                          style={[
                            styles.perfDot,
                            { backgroundColor: i <= projection ? colors.warning : colors.backgroundTertiary }
                          ]}
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              {/* Tags */}
              <View style={styles.formSection}>
                <ThemedText type="label" style={styles.sectionLabel}>Etiketler</ThemedText>
                <View style={styles.tagsGrid}>
                  {TAGS.map((tag) => (
                    <Pressable
                      key={tag}
                      onPress={() => toggleTag(tag)}
                      style={[
                        styles.tagItem,
                        { backgroundColor: selectedTags.includes(tag) ? colors.tint + '20' : colors.backgroundTertiary },
                        selectedTags.includes(tag) && { borderColor: colors.tint, borderWidth: 1 },
                      ]}
                    >
                      <ThemedText style={{ 
                        fontSize: 11, 
                        color: selectedTags.includes(tag) ? colors.tint : colors.textMuted 
                      }}>
                        {tag}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Favori Gün */}
              <Pressable 
                onPress={() => setIsFavoriteDay(!isFavoriteDay)}
                style={[styles.favoriteRow, { backgroundColor: isFavoriteDay ? colors.accent + '15' : colors.backgroundTertiary }]}
              >
                <Ionicons 
                  name={isFavoriteDay ? 'heart' : 'heart-outline'} 
                  size={24} 
                  color={isFavoriteDay ? colors.accent : colors.textMuted} 
                />
                <ThemedText style={{ flex: 1, marginLeft: Spacing.md }}>
                  Favori gün olarak işaretle
                </ThemedText>
                {isFavoriteDay && (
                  <Ionicons name="checkmark" size={20} color={colors.accent} />
                )}
              </Pressable>

              <View style={{ height: 100 }} />
            </ScrollView>
          </SafeAreaView>
        </ThemedView>
      </Modal>

      <PaywallScreen
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        title="Sınırsız Günlük Kaydı"
        subtitle="Tüm parfüm deneyimlerini kaydetmek için Premium'a geç."
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
  },
  statNumber: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginTop: 4,
  },
  emptyCard: {
    overflow: 'hidden',
    padding: 0,
  },
  emptyGradient: {
    padding: Spacing['2xl'],
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginTop: Spacing.md,
  },
  emptyDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  emptyBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
  },
  entriesList: {
    gap: Spacing.md,
  },
  entryCard: {
    padding: Spacing.md,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  entryInfo: {
    flex: 1,
  },
  entryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  entryName: {
    fontSize: FontSizes.sm,
  },
  entryActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  entryTitle: {
    fontSize: FontSizes.base,
    marginTop: Spacing.md,
  },
  entryContent: {
    marginTop: Spacing.sm,
    color: '#888',
    lineHeight: 20,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
  },
  ratingText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  performanceRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  performanceItem: {
    flex: 1,
  },
  performanceBar: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 4,
  },
  performanceDot: {
    width: 12,
    height: 4,
    borderRadius: 2,
  },
  entryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  // Modal
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  selectedParfumCard: {
    marginBottom: Spacing.xl,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  selectedInfo: {
    flex: 1,
  },
  parfumSection: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
  },
  parfumList: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  parfumSelectCard: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  parfumSelectName: {
    fontSize: FontSizes.sm,
  },
  formSection: {
    marginBottom: Spacing.xl,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    fontSize: FontSizes.base,
  },
  textarea: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    fontSize: FontSizes.base,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  starsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  moodsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  moodItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  occasionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  occasionItem: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 2,
  },
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  perfDots: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  perfDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tagItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
});


