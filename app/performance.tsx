/**
 * AROMIXEN - Performans Takipçisi
 * Kullanıcının günlük koku deneyimlerini kaydettiği ve analiz ettiği ekran
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { LockedFeatureOverlay, PaywallScreen } from '@/components/paywall';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { usePremiumGate } from '@/hooks/use-premium-gate';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PerformanceScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const { 
    sotdHistory, 
    performanceLogs, 
    logPerformance, 
    getMonthlyStats,
    parfumler
  } = useApp();
  const { isPremium, paywallVisible, setPaywallVisible } = usePremiumGate();

  const [activeTab, setActiveTab] = useState<'review' | 'history' | 'stats'>('review');

  // Değerlendirme Form State
  const [longevity, setLongevity] = useState(3);
  const [compliment, setCompliment] = useState<boolean | null>(null);
  const [personalRating, setPersonalRating] = useState(7);

  // Değerlendirilmemiş son SOTD bul
  const unreviewedSotd = useMemo(() => {
    // SOTD geçmişinde olup, PerformanceLogs'da bugünün/o günün tarihi olmayan ilk kayıt
    return sotdHistory.find(sotd => 
      !performanceLogs.some(log => log.date === sotd.date)
    );
  }, [sotdHistory, performanceLogs]);

  const currentMonthStats = useMemo(() => {
    const today = new Date();
    return getMonthlyStats(today.getMonth() + 1, today.getFullYear());
  }, [getMonthlyStats, performanceLogs]);

  const handleSaveReview = async () => {
    if (!unreviewedSotd) return;
    if (compliment === null) {
      Alert.alert('Eksik Bilgi', 'Lütfen iltifat alıp almadığınızı belirtin.');
      return;
    }

    await logPerformance(unreviewedSotd.parfumId, {
      date: unreviewedSotd.date,
      longevity,
      compliment,
      personalRating,
    });
    
    Alert.alert('Başarılı', 'Günün performansı kaydedildi! 🎉');
    setLongevity(3);
    setCompliment(null);
    setPersonalRating(7);
    if (!unreviewedSotd) setActiveTab('history');
  };

  const renderReviewTab = () => {
    if (!unreviewedSotd) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={64} color={colors.textMuted} />
          <ThemedText style={styles.emptyStateText}>Tüm performans değerlendirmeleri tamamlandı!</ThemedText>
        </View>
      );
    }

    const parfum = parfumler.find(p => p.id === unreviewedSotd.parfumId);

    return (
      <View style={styles.tabContent}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Günün Değerlendirmesi</ThemedText>
        <ThemedText style={styles.dateText}>{unreviewedSotd.date} SOTD Seçimi</ThemedText>
        
        <Card style={styles.reviewCard}>
          <ThemedText style={styles.parfumName}>{parfum?.isim || 'Bilinmeyen Parfüm'}</ThemedText>
          <ThemedText style={styles.parfumBrand}>{parfum?.marka}</ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Kalıcılık (1-5)</ThemedText>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setLongevity(star)}>
                  <Ionicons 
                    name={star <= longevity ? 'star' : 'star-outline'} 
                    size={32} 
                    color="#FFD166" 
                  />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>İltifat Aldın Mı?</ThemedText>
            <View style={styles.buttonRow}>
              <Pressable 
                style={[styles.toggleBtn, compliment === true && styles.toggleBtnActive]} 
                onPress={() => setCompliment(true)}
              >
                <ThemedText style={[styles.toggleBtnText, compliment === true ? styles.toggleBtnTextActive : undefined]}>👍 Evet</ThemedText>
              </Pressable>
              <Pressable 
                style={[styles.toggleBtn, compliment === false && styles.toggleBtnActive]} 
                onPress={() => setCompliment(false)}
              >
                <ThemedText style={[styles.toggleBtnText, compliment === false ? styles.toggleBtnTextActive : undefined]}>👎 Hayır</ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Senin Puanın: {personalRating}/10</ThemedText>
            <View style={styles.sliderRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <Pressable 
                  key={rating} 
                  onPress={() => setPersonalRating(rating)}
                  style={[styles.ratingDot, personalRating >= rating && styles.ratingDotActive]}
                />
              ))}
            </View>
          </View>

          <Pressable style={styles.saveBtn} onPress={handleSaveReview}>
            <ThemedText style={styles.saveBtnText}>Kaydet</ThemedText>
          </Pressable>
        </Card>
      </View>
    );
  };

  const renderHistoryTab = () => {
    if (performanceLogs.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
          <ThemedText style={styles.emptyStateText}>Henüz geçmiş bir değerlendirme yok.</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {performanceLogs.map((log) => {
          const parfum = parfumler.find(p => p.id === log.parfumId);
          return (
            <Card key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <ThemedText style={styles.logDate}>{log.date}</ThemedText>
                <View style={styles.logScore}>
                  <Ionicons name="star" size={14} color={colors.warning} />
                  <ThemedText style={styles.logScoreText}>{log.personalRating}/10</ThemedText>
                </View>
              </View>
              <ThemedText style={styles.parfumName}>{parfum?.isim}</ThemedText>
              <View style={styles.logDetails}>
                <ThemedText style={styles.logDetailText}>⏳ Kalıcılık: {log.longevity}/5</ThemedText>
                <ThemedText style={styles.logDetailText}>{log.compliment ? '💬 İltifat Aldı' : '🤫 İltifat Yok'}</ThemedText>
              </View>
            </Card>
          );
        })}
      </View>
    );
  };

  const renderStatsTab = () => {
    if (currentMonthStats.totalDays === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="stats-chart-outline" size={64} color={colors.textMuted} />
          <ThemedText style={styles.emptyStateText}>Bu ay henüz yeterli veri yok.</ThemedText>
        </View>
      );
    }

    const mostUsed = parfumler.find(p => p.id === currentMonthStats.mostUsedParfumId);
    const mostComplimented = parfumler.find(p => p.id === currentMonthStats.mostComplimentedParfumId);

    const statsContent = (
      <View style={styles.tabContent}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Bu Ayın Özeti</ThemedText>

        <View style={styles.statsGrid}>
          <Card style={styles.statBox}>
            <ThemedText style={styles.statValue}>{currentMonthStats.totalDays}</ThemedText>
            <ThemedText style={styles.statLabel}>Gün Kaydedildi</ThemedText>
          </Card>
          <Card style={styles.statBox}>
            <ThemedText style={styles.statValue}>%{currentMonthStats.complimentRate}</ThemedText>
            <ThemedText style={styles.statLabel}>İltifat Oranı</ThemedText>
          </Card>
        </View>

        <Card style={styles.highlightCard}>
          <ThemedText style={styles.highlightTitle}>🏆 En Çok Kullanılan</ThemedText>
          <ThemedText style={styles.parfumName}>{mostUsed?.isim}</ThemedText>
          <ThemedText style={styles.parfumBrand}>{mostUsed?.marka}</ThemedText>
        </Card>

        {mostComplimented && (
          <Card style={[styles.highlightCard, { marginTop: Spacing.md }]}>
            <ThemedText style={styles.highlightTitle}>💬 İltifat Mıknatısı</ThemedText>
            <ThemedText style={styles.parfumName}>{mostComplimented.isim}</ThemedText>
            <ThemedText style={styles.parfumBrand}>{mostComplimented.marka}</ThemedText>
          </Card>
        )}
      </View>
    );

    if (!isPremium) {
      return (
        <LockedFeatureOverlay
          onUnlock={() => setPaywallVisible(true)}
          title="Detaylı Analizi Aç"
          subtitle="Aylık istatistiklerini ve en iyi eşleşmelerini gör"
        >
          {statsContent}
        </LockedFeatureOverlay>
      );
    }

    return statsContent;
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <ThemedText type="title" style={styles.title}>Performans</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.tabBar}>
          <Pressable style={[styles.tab, activeTab === 'review' && styles.tabActive]} onPress={() => setActiveTab('review')}>
            <ThemedText style={[styles.tabText, activeTab === 'review' ? styles.tabTextActive : undefined]}>Değerlendir</ThemedText>
          </Pressable>
          <Pressable style={[styles.tab, activeTab === 'history' && styles.tabActive]} onPress={() => setActiveTab('history')}>
            <ThemedText style={[styles.tabText, activeTab === 'history' ? styles.tabTextActive : undefined]}>Geçmiş</ThemedText>
          </Pressable>
          <Pressable style={[styles.tab, activeTab === 'stats' && styles.tabActive]} onPress={() => setActiveTab('stats')}>
            <ThemedText style={[styles.tabText, activeTab === 'stats' ? styles.tabTextActive : undefined]}>Analiz</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'review' && renderReviewTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'stats' && renderStatsTab()}
        <View style={{ height: 100 }} />
      </ScrollView>

      <PaywallScreen
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        title="Detaylı Performans Analizi"
        subtitle="Aylık istatistiklerini ve en iyi eşleşmelerini Premium ile aç."
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  backBtn: { padding: Spacing.xs },
  title: { fontSize: FontSizes.xl },
  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(150,150,150,0.1)', borderRadius: BorderRadius.full, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: BorderRadius.full },
  tabActive: { backgroundColor: Colors.light.primary },
  tabText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.light.textMuted },
  tabTextActive: { color: '#FFF' },
  scrollView: { flex: 1, paddingHorizontal: Spacing.lg },
  tabContent: { paddingTop: Spacing.lg },
  sectionTitle: { marginBottom: Spacing.xs },
  dateText: { color: '#888', marginBottom: Spacing.lg },
  reviewCard: { padding: Spacing.lg },
  parfumName: { fontSize: FontSizes.lg, fontWeight: 'bold' },
  parfumBrand: { fontSize: FontSizes.sm, color: '#888', marginBottom: Spacing.xl },
  inputGroup: { marginBottom: Spacing.xl },
  inputLabel: { fontSize: FontSizes.sm, fontWeight: '600', marginBottom: Spacing.md },
  starRow: { flexDirection: 'row', gap: Spacing.sm },
  buttonRow: { flexDirection: 'row', gap: Spacing.md },
  toggleBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: '#DDD', alignItems: 'center' },
  toggleBtnActive: { backgroundColor: Colors.light.primary + '15', borderColor: Colors.light.primary },
  toggleBtnText: { fontWeight: 'bold', color: Colors.light.textMuted },
  toggleBtnTextActive: { color: Colors.light.primary },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 20 },
  ratingDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#EEE' },
  ratingDotActive: { backgroundColor: Colors.light.primary },
  saveBtn: { backgroundColor: Colors.light.primary, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: FontSizes.md },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyStateText: { marginTop: Spacing.md, color: '#888', textAlign: 'center' },
  logCard: { padding: Spacing.md, marginBottom: Spacing.md },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  logDate: { color: '#888', fontSize: FontSizes.sm },
  logScore: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logScoreText: { fontWeight: 'bold', fontSize: FontSizes.sm },
  logDetails: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm },
  logDetailText: { fontSize: FontSizes.sm, color: '#666' },
  statsGrid: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  statBox: { flex: 1, padding: Spacing.md, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: Colors.light.primary, marginBottom: 4 },
  statLabel: { fontSize: FontSizes.sm, color: Colors.light.textMuted },
  highlightCard: { padding: Spacing.md, borderLeftWidth: 4, borderLeftColor: Colors.light.primary },
  highlightTitle: { fontSize: FontSizes.sm, color: Colors.light.textMuted, marginBottom: 4 },
});
