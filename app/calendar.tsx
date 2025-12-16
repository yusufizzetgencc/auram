/**
 * AROMIXEN - Scent Calendar
 * Parfüm kullanım takvimi
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, Button } from '@/components/ui';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { ScentCalendarEntry, Parfum } from '@/types';
import { 
  loadScentCalendar, 
  addCalendarEntry, 
  getCalendarEntriesForMonth,
  getLastUsedDate,
  getParfumUsageCount,
} from '@/services/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_SIZE = (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.xs * 6) / 7;

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const OCCASIONS = [
  { id: 'gunluk', label: 'Günlük', icon: 'today', color: '#00B4D8' },
  { id: 'is', label: 'İş', icon: 'briefcase', color: '#667eea' },
  { id: 'ozel', label: 'Özel Gün', icon: 'star', color: '#FFD93D' },
  { id: 'randevu', label: 'Randevu', icon: 'heart', color: '#FF6B9D' },
  { id: 'parti', label: 'Parti', icon: 'sparkles', color: '#9D4EDD' },
  { id: 'spor', label: 'Spor', icon: 'fitness', color: '#00D4AA' },
];

const TYPE_COLORS: Record<string, string> = {
  'Odunsu': '#8B4513',
  'Çiçeksi': '#E91E8C',
  'Oryantal': '#DAA520',
  'Ferah': '#00B4D8',
  'Baharatlı': '#FF4500',
  'Aquatik': '#00CED1',
};

export default function CalendarScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const { parfumler, getFavoriteParfums, getRecentlyViewedParfums } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarEntries, setCalendarEntries] = useState<ScentCalendarEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedParfum, setSelectedParfum] = useState<Parfum | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<string>('gunluk');
  const [note, setNote] = useState('');
  const [rating, setRating] = useState(0);

  // Takvim verilerini yükle
  useEffect(() => {
    async function loadData() {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const entries = await getCalendarEntriesForMonth(year, month);
      setCalendarEntries(entries);
    }
    loadData();
  }, [currentDate]);

  // Ayın günlerini hesapla
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Haftanın hangi günü başlıyor (0=Pazar, 1=Pazartesi...)
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1; // Pazartesi'den başlat
    
    const daysInMonth = lastDay.getDate();
    const days: (number | null)[] = [];
    
    // Önceki ayın günleri
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Bu ayın günleri
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  }, [currentDate]);

  // Gün için kayıt var mı?
  const getEntryForDate = useCallback((day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarEntries.find(e => e.date === dateStr);
  }, [currentDate, calendarEntries]);

  // Önceki/sonraki ay
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Gün seçimi
  const handleDayPress = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    
    const existingEntry = getEntryForDate(day);
    if (existingEntry) {
      const parfum = parfumler.find(p => p.id === existingEntry.parfumId);
      setSelectedParfum(parfum || null);
      setSelectedOccasion(existingEntry.occasion || 'gunluk');
      setNote(existingEntry.note || '');
      setRating(existingEntry.rating || 0);
    } else {
      setSelectedParfum(null);
      setSelectedOccasion('gunluk');
      setNote('');
      setRating(0);
    }
    
    setShowAddModal(true);
  };

  // Kaydet
  const handleSave = async () => {
    if (!selectedDate || !selectedParfum) return;

    await addCalendarEntry({
      parfumId: selectedParfum.id,
      date: selectedDate,
      occasion: selectedOccasion,
      note: note || undefined,
      rating: rating || undefined,
    });

    // Verileri yenile
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const entries = await getCalendarEntriesForMonth(year, month);
    setCalendarEntries(entries);

    setShowAddModal(false);
    setSelectedParfum(null);
    setNote('');
    setRating(0);
  };

  const favoriteParfums = getFavoriteParfums();
  const recentParfums = getRecentlyViewedParfums();

  // İstatistikler
  const stats = useMemo(() => {
    const uniqueParfums = new Set(calendarEntries.map(e => e.parfumId));
    const mostUsed = calendarEntries.reduce((acc, entry) => {
      acc[entry.parfumId] = (acc[entry.parfumId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topParfum = Object.entries(mostUsed).sort((a, b) => b[1] - a[1])[0];
    const topParfumData = topParfum ? parfumler.find(p => p.id === topParfum[0]) : null;

    return {
      totalDays: calendarEntries.length,
      uniqueParfums: uniqueParfums.size,
      topParfum: topParfumData,
      topParfumCount: topParfum ? topParfum[1] : 0,
    };
  }, [calendarEntries, parfumler]);

  const today = new Date();
  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === currentDate.getMonth() && 
           today.getFullYear() === currentDate.getFullYear();
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
            <ThemedText type="title">Parfüm Takvimi</ThemedText>
            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              Kullanım geçmişin
            </ThemedText>
          </View>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Ay Navigasyonu */}
          <Animated.View entering={FadeInUp.delay(100).duration(400)}>
            <Card variant="elevated" style={styles.calendarCard}>
              <View style={styles.monthNav}>
                <Pressable onPress={goToPrevMonth} style={styles.navBtn}>
                  <Ionicons name="chevron-back" size={24} color={colors.text} />
                </Pressable>
                <ThemedText type="heading">
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </ThemedText>
                <Pressable onPress={goToNextMonth} style={styles.navBtn}>
                  <Ionicons name="chevron-forward" size={24} color={colors.text} />
                </Pressable>
              </View>

              {/* Hafta Günleri */}
              <View style={styles.weekdaysRow}>
                {WEEKDAYS.map((day) => (
                  <View key={day} style={styles.weekdayCell}>
                    <ThemedText style={[styles.weekdayText, { color: colors.textMuted }]}>
                      {day}
                    </ThemedText>
                  </View>
                ))}
              </View>

              {/* Günler */}
              <View style={styles.daysGrid}>
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <View key={`empty-${index}`} style={styles.dayCell} />;
                  }

                  const entry = getEntryForDate(day);
                  const parfum = entry ? parfumler.find(p => p.id === entry.parfumId) : null;
                  const typeColor = parfum ? (TYPE_COLORS[parfum.tip] || colors.tint) : null;

                  return (
                    <Pressable 
                      key={day} 
                      onPress={() => handleDayPress(day)}
                      style={[
                        styles.dayCell,
                        isToday(day) && [styles.todayCell, { borderColor: colors.tint }],
                      ]}
                    >
                      <ThemedText style={[
                        styles.dayText,
                        isToday(day) && { color: colors.tint, fontWeight: FontWeights.bold },
                      ]}>
                        {day}
                      </ThemedText>
                      {entry && (
                        <View style={[styles.dayIndicator, { backgroundColor: typeColor }]}>
                          {entry.rating && entry.rating >= 4 && (
                            <Ionicons name="star" size={8} color="#FFF" />
                          )}
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </Animated.View>

          {/* İstatistikler */}
          <Animated.View entering={FadeInUp.delay(200).duration(400)}>
            <View style={styles.statsRow}>
              <Card variant="elevated" style={styles.statCard}>
                <ThemedText style={[styles.statNumber, { color: '#9D4EDD' }]}>
                  {stats.totalDays}
                </ThemedText>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  Kayıtlı Gün
                </ThemedText>
              </Card>
              <Card variant="elevated" style={styles.statCard}>
                <ThemedText style={[styles.statNumber, { color: '#00B4D8' }]}>
                  {stats.uniqueParfums}
                </ThemedText>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  Farklı Parfüm
                </ThemedText>
              </Card>
            </View>
          </Animated.View>

          {/* En Çok Kullanılan */}
          {stats.topParfum && (
            <Animated.View entering={FadeInUp.delay(300).duration(400)}>
              <Card variant="elevated" style={styles.topParfumCard}>
                <View style={styles.topHeader}>
                  <View style={[styles.topIcon, { backgroundColor: '#FFD93D20' }]}>
                    <Ionicons name="trophy" size={20} color="#FFD93D" />
                  </View>
                  <View style={styles.topInfo}>
                    <ThemedText type="caption" style={{ color: colors.textMuted }}>
                      Bu ay en çok kullanılan
                    </ThemedText>
                    <ThemedText type="heading">{stats.topParfum.isim}</ThemedText>
                    <ThemedText type="caption" style={{ color: colors.textMuted }}>
                      {stats.topParfumCount} kez kullanıldı
                    </ThemedText>
                  </View>
                </View>
              </Card>
            </Animated.View>
          )}

          {/* Son Kullanımlar */}
          {calendarEntries.length > 0 && (
            <Animated.View entering={FadeInUp.delay(400).duration(400)}>
              <ThemedText type="heading" style={styles.sectionTitle}>
                Son Kullanımlar
              </ThemedText>
              <View style={styles.recentList}>
                {calendarEntries.slice(0, 5).map((entry, index) => {
                  const parfum = parfumler.find(p => p.id === entry.parfumId);
                  if (!parfum) return null;
                  
                  const typeColor = TYPE_COLORS[parfum.tip] || colors.tint;
                  const occasion = OCCASIONS.find(o => o.id === entry.occasion);
                  
                  return (
                    <Animated.View 
                      key={entry.id}
                      entering={SlideInRight.delay(index * 50).duration(300)}
                    >
                      <Card variant="elevated" style={styles.recentCard}>
                        <View style={[styles.recentIcon, { backgroundColor: typeColor + '15' }]}>
                          <Ionicons name="sparkles" size={18} color={typeColor} />
                        </View>
                        <View style={styles.recentInfo}>
                          <ThemedText type="subtitle">{parfum.isim}</ThemedText>
                          <View style={styles.recentMeta}>
                            <ThemedText type="caption" style={{ color: colors.textMuted }}>
                              {new Date(entry.date).toLocaleDateString('tr-TR', { 
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </ThemedText>
                            {occasion && (
                              <View style={[styles.occasionBadge, { backgroundColor: occasion.color + '15' }]}>
                                <Ionicons name={occasion.icon as any} size={10} color={occasion.color} />
                                <ThemedText style={{ color: occasion.color, fontSize: 10 }}>
                                  {occasion.label}
                                </ThemedText>
                              </View>
                            )}
                          </View>
                        </View>
                        {entry.rating && (
                          <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={12} color="#FFD93D" />
                            <ThemedText style={styles.ratingText}>{entry.rating}</ThemedText>
                          </View>
                        )}
                      </Card>
                    </Animated.View>
                  );
                })}
              </View>
            </Animated.View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Parfüm Ekleme Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={styles.modalContainer}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
              <ThemedText type="heading">
                {selectedDate && new Date(selectedDate).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                })}
              </ThemedText>
              <Pressable onPress={handleSave} disabled={!selectedParfum}>
                <ThemedText style={{ 
                  color: selectedParfum ? colors.tint : colors.textMuted,
                  fontWeight: '600',
                }}>
                  Kaydet
                </ThemedText>
              </Pressable>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Seçili Parfüm */}
              {selectedParfum && (
                <Animated.View entering={FadeIn.duration(300)}>
                  <Card variant="elevated" style={styles.selectedParfumCard}>
                    <View style={styles.selectedParfumRow}>
                      <View style={[styles.selectedIcon, { 
                        backgroundColor: (TYPE_COLORS[selectedParfum.tip] || colors.tint) + '15' 
                      }]}>
                        <Ionicons name="sparkles" size={24} color={TYPE_COLORS[selectedParfum.tip] || colors.tint} />
                      </View>
                      <View style={styles.selectedInfo}>
                        <ThemedText type="heading">{selectedParfum.isim}</ThemedText>
                        <ThemedText type="caption" style={{ color: colors.textMuted }}>
                          {selectedParfum.marka}
                        </ThemedText>
                      </View>
                      <Pressable onPress={() => setSelectedParfum(null)}>
                        <Ionicons name="close-circle" size={24} color={colors.textMuted} />
                      </Pressable>
                    </View>
                  </Card>
                </Animated.View>
              )}

              {/* Vesileler */}
              <View style={styles.occasionsSection}>
                <ThemedText type="label" style={styles.sectionLabel}>Vesile</ThemedText>
                <View style={styles.occasionsGrid}>
                  {OCCASIONS.map((occasion) => (
                    <Pressable
                      key={occasion.id}
                      onPress={() => setSelectedOccasion(occasion.id)}
                      style={[
                        styles.occasionItem,
                        { backgroundColor: selectedOccasion === occasion.id ? occasion.color + '20' : colors.backgroundTertiary },
                        selectedOccasion === occasion.id && { borderColor: occasion.color, borderWidth: 2 },
                      ]}
                    >
                      <Ionicons 
                        name={occasion.icon as any} 
                        size={20} 
                        color={selectedOccasion === occasion.id ? occasion.color : colors.textMuted} 
                      />
                      <ThemedText style={{ 
                        color: selectedOccasion === occasion.id ? occasion.color : colors.textMuted,
                        fontSize: FontSizes.xs,
                        marginTop: 4,
                      }}>
                        {occasion.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Puan */}
              <View style={styles.ratingSection}>
                <ThemedText type="label" style={styles.sectionLabel}>Puan</ThemedText>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable key={star} onPress={() => setRating(star)}>
                      <Ionicons 
                        name={rating >= star ? 'star' : 'star-outline'} 
                        size={32} 
                        color={rating >= star ? '#FFD93D' : colors.textMuted} 
                      />
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Not */}
              <View style={styles.noteSection}>
                <ThemedText type="label" style={styles.sectionLabel}>Not (Opsiyonel)</ThemedText>
                <TextInput
                  style={[styles.noteInput, { backgroundColor: colors.backgroundTertiary, color: colors.text }]}
                  placeholder="Bugün nasıl performans gösterdi?"
                  placeholderTextColor={colors.textMuted}
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Parfüm Seçimi */}
              {!selectedParfum && (
                <>
                  {/* Favoriler */}
                  {favoriteParfums.length > 0 && (
                    <View style={styles.parfumSection}>
                      <ThemedText type="label" style={styles.sectionLabel}>❤️ Favorilerim</ThemedText>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.parfumList}>
                          {favoriteParfums.slice(0, 6).map((parfum) => (
                            <Pressable 
                              key={parfum.id} 
                              onPress={() => setSelectedParfum(parfum)}
                            >
                              <Card variant="elevated" style={styles.parfumSelectCard}>
                                <View style={[styles.parfumSelectIcon, { 
                                  backgroundColor: (TYPE_COLORS[parfum.tip] || colors.tint) + '15' 
                                }]}>
                                  <Ionicons name="sparkles" size={16} color={TYPE_COLORS[parfum.tip] || colors.tint} />
                                </View>
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

                  {/* Son Görüntülenenler */}
                  {recentParfums.length > 0 && (
                    <View style={styles.parfumSection}>
                      <ThemedText type="label" style={styles.sectionLabel}>🕐 Son Görüntülenen</ThemedText>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.parfumList}>
                          {recentParfums.slice(0, 6).map((parfum) => (
                            <Pressable 
                              key={parfum.id} 
                              onPress={() => setSelectedParfum(parfum)}
                            >
                              <Card variant="elevated" style={styles.parfumSelectCard}>
                                <View style={[styles.parfumSelectIcon, { 
                                  backgroundColor: (TYPE_COLORS[parfum.tip] || colors.tint) + '15' 
                                }]}>
                                  <Ionicons name="sparkles" size={16} color={TYPE_COLORS[parfum.tip] || colors.tint} />
                                </View>
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

                  {/* Tüm Parfümler */}
                  <View style={styles.parfumSection}>
                    <ThemedText type="label" style={styles.sectionLabel}>Tüm Parfümler</ThemedText>
                    <View style={styles.allParfumsGrid}>
                      {parfumler.slice(0, 12).map((parfum) => (
                        <Pressable 
                          key={parfum.id} 
                          onPress={() => setSelectedParfum(parfum)}
                          style={[styles.allParfumItem, { backgroundColor: colors.backgroundTertiary }]}
                        >
                          <ThemedText numberOfLines={1} style={{ fontSize: FontSizes.sm }}>
                            {parfum.isim}
                          </ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </ThemedView>
      </Modal>
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
  content: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  calendarCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  navBtn: {
    padding: Spacing.sm,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  weekdayCell: {
    width: DAY_SIZE,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  weekdayText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  dayCell: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DAY_SIZE / 2,
  },
  todayCell: {
    borderWidth: 2,
  },
  dayText: {
    fontSize: FontSizes.sm,
  },
  dayIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.lg,
  },
  statNumber: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  topParfumCard: {
    marginBottom: Spacing.lg,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  topInfo: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  recentList: {
    gap: Spacing.sm,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  recentInfo: {
    flex: 1,
  },
  recentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  occasionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
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
  selectedParfumRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  selectedInfo: {
    flex: 1,
  },
  occasionsSection: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
  },
  occasionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  occasionItem: {
    width: (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.sm * 2) / 3,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  ratingSection: {
    marginBottom: Spacing.xl,
  },
  starsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  noteSection: {
    marginBottom: Spacing.xl,
  },
  noteInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    fontSize: FontSizes.base,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  parfumSection: {
    marginBottom: Spacing.xl,
  },
  parfumList: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  parfumSelectCard: {
    width: 100,
    padding: Spacing.md,
    alignItems: 'center',
  },
  parfumSelectIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  parfumSelectName: {
    fontSize: FontSizes.xs,
    textAlign: 'center',
  },
  allParfumsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  allParfumItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
});


