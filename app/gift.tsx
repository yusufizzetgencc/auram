/**
 * AROMIXEN - Gift Assistant
 * Hediye parfüm önerileri
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight, SlideInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, Button } from '@/components/ui';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { Parfum, GiftRecipient, GiftOccasion, Butce, KisilikTipi, Cinsiyet } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TYPE_COLORS: Record<string, string> = {
  'Odunsu': '#8B4513',
  'Çiçeksi': '#E91E8C',
  'Oryantal': '#DAA520',
  'Ferah': '#00B4D8',
  'Baharatlı': '#FF4500',
  'Aquatik': '#00CED1',
  'Tatlı': '#FF69B4',
  'Amber': '#D4A574',
  'Meyvemsi': '#FF6B6B',
};

// Alıcı tipleri
const RECIPIENTS: { id: GiftRecipient; label: string; icon: string; gender: Cinsiyet; color: string }[] = [
  { id: 'anne', label: 'Anne', icon: '👩‍🦰', gender: 'kadın', color: '#E91E8C' },
  { id: 'baba', label: 'Baba', icon: '👨‍🦳', gender: 'erkek', color: '#3498DB' },
  { id: 'sevgili_kadin', label: 'Sevgili (Kadın)', icon: '💕', gender: 'kadın', color: '#FF6B9D' },
  { id: 'sevgili_erkek', label: 'Sevgili (Erkek)', icon: '💙', gender: 'erkek', color: '#667eea' },
  { id: 'arkadas_kadin', label: 'Arkadaş (Kadın)', icon: '👭', gender: 'kadın', color: '#9D4EDD' },
  { id: 'arkadas_erkek', label: 'Arkadaş (Erkek)', icon: '👬', gender: 'erkek', color: '#00B4D8' },
  { id: 'is_arkadasi', label: 'İş Arkadaşı', icon: '💼', gender: 'unisex', color: '#2C3E50' },
  { id: 'kendim', label: 'Kendime', icon: '🎁', gender: 'unisex', color: '#FFD93D' },
];

// Vesileler
const OCCASIONS: { id: GiftOccasion; label: string; icon: string; color: string }[] = [
  { id: 'dogum_gunu', label: 'Doğum Günü', icon: '🎂', color: '#FF6B6B' },
  { id: 'yildonumu', label: 'Yıldönümü', icon: '💍', color: '#E91E8C' },
  { id: 'sevgililer_gunu', label: 'Sevgililer Günü', icon: '❤️', color: '#FF4757' },
  { id: 'anneler_gunu', label: 'Anneler Günü', icon: '🌸', color: '#FF69B4' },
  { id: 'babalar_gunu', label: 'Babalar Günü', icon: '👔', color: '#3498DB' },
  { id: 'yeni_yil', label: 'Yeni Yıl', icon: '🎄', color: '#27AE60' },
  { id: 'ozel_gun', label: 'Özel Gün', icon: '✨', color: '#9D4EDD' },
  { id: 'tesaduf', label: 'Sürpriz', icon: '🎉', color: '#FFD93D' },
];

// Bütçe seçenekleri
const BUDGETS: { id: Butce; label: string; icon: string; range: string; color: string }[] = [
  { id: 'ekonomik', label: 'Ekonomik', icon: '💰', range: '₺0 - ₺500', color: '#27AE60' },
  { id: 'orta', label: 'Orta', icon: '💵', range: '₺500 - ₺1.500', color: '#3498DB' },
  { id: 'premium', label: 'Premium', icon: '💎', range: '₺1.500 - ₺3.000', color: '#9D4EDD' },
  { id: 'luks', label: 'Lüks', icon: '👑', range: '₺3.000+', color: '#FFD93D' },
];

// Stiller
const STYLES: { id: KisilikTipi; label: string; icon: string; color: string }[] = [
  { id: 'romantik', label: 'Romantik', icon: '🌹', color: '#E91E8C' },
  { id: 'dinamik', label: 'Dinamik', icon: '⚡', color: '#FF6B6B' },
  { id: 'sofistike', label: 'Sofistike', icon: '👔', color: '#2C3E50' },
  { id: 'dogal', label: 'Doğal', icon: '🌿', color: '#27AE60' },
  { id: 'cesur', label: 'Cesur', icon: '🔥', color: '#FF4500' },
  { id: 'mistik', label: 'Gizemli', icon: '🌙', color: '#9D4EDD' },
];

// Hediye mesajları
const GIFT_MESSAGES: Record<GiftRecipient, string[]> = {
  anne: [
    'En güzel kokulara layık anneme 💐',
    'Seni her zaman hatırlatacak özel bir koku 🌸',
  ],
  baba: [
    'En özel erkeğe, en özel koku 👔',
    'Güç ve zarafet bir arada, tıpkı senin gibi',
  ],
  sevgili_kadin: [
    'Her sıkışında beni hatırla 💕',
    'Güzelliğine yakışır bir koku ✨',
  ],
  sevgili_erkek: [
    'Sana her baktığımda bu kokuyu hissediyorum 💙',
    'Özel biri için özel bir parfüm',
  ],
  arkadas_kadin: [
    'Dostluğumuzun hatırası olsun 👭',
    'Harika bir arkadaş, harika bir koku',
  ],
  arkadas_erkek: [
    'Kankama özel seçtim 👊',
    'Dostluğumuz kadar kalıcı olsun',
  ],
  is_arkadasi: [
    'Profesyonel ilişkimize yakışır bir hediye 💼',
    'Başarının kokusu seninle olsun',
  ],
  kendim: [
    'Kendine yatırım, en güzel yatırım 🎁',
    'Sen buna değersin ✨',
  ],
};

type Step = 'recipient' | 'occasion' | 'budget' | 'style' | 'results';

export default function GiftScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { parfumler, addToRecentlyViewedList } = useApp();

  const [step, setStep] = useState<Step>('recipient');
  const [selectedRecipient, setSelectedRecipient] = useState<GiftRecipient | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<GiftOccasion | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Butce | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<KisilikTipi | null>(null);

  const recipientData = RECIPIENTS.find(r => r.id === selectedRecipient);

  // Önerileri hesapla
  const recommendations = useMemo(() => {
    if (!selectedRecipient || !selectedBudget) return [];

    const recipient = RECIPIENTS.find(r => r.id === selectedRecipient);
    if (!recipient) return [];

    const scored = parfumler
      .filter(parfum => {
        // Cinsiyet kontrolü
        if (recipient.gender !== 'unisex' && 
            parfum.cinsiyet !== recipient.gender && 
            parfum.cinsiyet !== 'unisex') {
          return false;
        }

        // Bütçe kontrolü
        if (parfum.fiyatAraligi && parfum.fiyatAraligi !== selectedBudget) {
          // Bütçe sıralaması: ekonomik < orta < premium < luks
          const budgetOrder = ['ekonomik', 'orta', 'premium', 'luks'];
          const parfumBudgetIndex = budgetOrder.indexOf(parfum.fiyatAraligi);
          const selectedBudgetIndex = budgetOrder.indexOf(selectedBudget);
          if (parfumBudgetIndex > selectedBudgetIndex) {
            return false;
          }
        }

        return true;
      })
      .map(parfum => {
        let score = 50; // Base score
        const reasons: string[] = [];

        // Stil uyumu
        if (selectedStyle && parfum.kisilikTipi?.includes(selectedStyle)) {
          score += 25;
          reasons.push(`${STYLES.find(s => s.id === selectedStyle)?.label} tarza uygun`);
        }

        // Vesileye göre öneriler
        if (selectedOccasion) {
          const occasionTypeMap: Record<GiftOccasion, string[]> = {
            dogum_gunu: ['Çiçeksi', 'Meyvemsi', 'Tatlı'],
            yildonumu: ['Oryantal', 'Çiçeksi', 'Amber'],
            sevgililer_gunu: ['Oryantal', 'Çiçeksi', 'Tatlı'],
            anneler_gunu: ['Çiçeksi', 'Pudralı', 'Yeşil'],
            babalar_gunu: ['Odunsu', 'Deri', 'Baharatlı'],
            yeni_yil: ['Baharatlı', 'Oryantal', 'Amber'],
            ozel_gun: ['Oryantal', 'Tatlı', 'Amber'],
            tesaduf: ['Ferah', 'Aquatik', 'Çiçeksi'],
          };

          if (occasionTypeMap[selectedOccasion]?.includes(parfum.tip)) {
            score += 20;
            reasons.push(`${OCCASIONS.find(o => o.id === selectedOccasion)?.label} için ideal`);
          }
        }

        // Alıcıya özel öneriler
        const recipientTypeMap: Record<GiftRecipient, string[]> = {
          anne: ['Çiçeksi', 'Pudralı', 'Yeşil'],
          baba: ['Odunsu', 'Ferah', 'Deri'],
          sevgili_kadin: ['Oryantal', 'Çiçeksi', 'Tatlı'],
          sevgili_erkek: ['Odunsu', 'Oryantal', 'Baharatlı'],
          arkadas_kadin: ['Meyvemsi', 'Çiçeksi', 'Ferah'],
          arkadas_erkek: ['Aquatik', 'Ferah', 'Odunsu'],
          is_arkadasi: ['Ferah', 'Odunsu', 'Aquatik'],
          kendim: [], // Tüm tipler uygun
        };

        if (recipientTypeMap[selectedRecipient]?.includes(parfum.tip)) {
          score += 15;
          reasons.push(`${recipientData?.label} için önerilen tip`);
        }

        // Puan kontrolü
        if (parfum.puan && parfum.puan >= 4.5) {
          score += 10;
          reasons.push('Yüksek puanlı');
        }

        return { parfum, score, reasons };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    return scored;
  }, [parfumler, selectedRecipient, selectedOccasion, selectedBudget, selectedStyle]);

  const handleNext = () => {
    const steps: Step[] = ['recipient', 'occasion', 'budget', 'style', 'results'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: Step[] = ['recipient', 'occasion', 'budget', 'style', 'results'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleParfumPress = (parfum: Parfum) => {
    addToRecentlyViewedList(parfum.id);
    router.push(`/parfum/${parfum.id}`);
  };

  const handleReset = () => {
    setStep('recipient');
    setSelectedRecipient(null);
    setSelectedOccasion(null);
    setSelectedBudget(null);
    setSelectedStyle(null);
  };

  const canProceed = () => {
    switch (step) {
      case 'recipient': return !!selectedRecipient;
      case 'occasion': return true; // Opsiyonel
      case 'budget': return !!selectedBudget;
      case 'style': return true; // Opsiyonel
      default: return false;
    }
  };

  const giftMessage = selectedRecipient 
    ? GIFT_MESSAGES[selectedRecipient][Math.floor(Math.random() * GIFT_MESSAGES[selectedRecipient].length)]
    : '';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Pressable onPress={() => step === 'recipient' ? router.back() : handleBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <ThemedText type="title">Hediye Asistanı</ThemedText>
            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              Mükemmel hediyeyi bul
            </ThemedText>
          </View>
          {step !== 'recipient' && (
            <Pressable onPress={handleReset}>
              <ThemedText style={{ color: colors.tint }}>Sıfırla</ThemedText>
            </Pressable>
          )}
        </Animated.View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          {['recipient', 'occasion', 'budget', 'style', 'results'].map((s, i) => (
            <View key={s} style={styles.progressItem}>
              <View style={[
                styles.progressDot,
                { 
                  backgroundColor: ['recipient', 'occasion', 'budget', 'style', 'results'].indexOf(step) >= i 
                    ? colors.tint 
                    : colors.backgroundTertiary 
                }
              ]} />
            </View>
          ))}
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Adım 1: Alıcı */}
          {step === 'recipient' && (
            <Animated.View entering={FadeInUp.duration(400)}>
              <ThemedText type="heading" center style={styles.stepTitle}>
                Kime hediye alacaksın?
              </ThemedText>
              <View style={styles.optionsGrid}>
                {RECIPIENTS.map((recipient, index) => (
                  <Animated.View 
                    key={recipient.id}
                    entering={FadeIn.delay(index * 50).duration(300)}
                  >
                    <Pressable
                      onPress={() => setSelectedRecipient(recipient.id)}
                      style={[
                        styles.optionCard,
                        { backgroundColor: selectedRecipient === recipient.id ? recipient.color + '20' : colors.card },
                        selectedRecipient === recipient.id && { borderColor: recipient.color, borderWidth: 2 },
                      ]}
                    >
                      <ThemedText style={styles.optionIcon}>{recipient.icon}</ThemedText>
                      <ThemedText style={[
                        styles.optionLabel,
                        { color: selectedRecipient === recipient.id ? recipient.color : colors.text }
                      ]}>
                        {recipient.label}
                      </ThemedText>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Adım 2: Vesile */}
          {step === 'occasion' && (
            <Animated.View entering={FadeInUp.duration(400)}>
              <ThemedText type="heading" center style={styles.stepTitle}>
                Hangi vesileyle?
              </ThemedText>
              <ThemedText type="caption" center style={{ color: colors.textMuted, marginBottom: Spacing.lg }}>
                Opsiyonel - Atlamak için devam et
              </ThemedText>
              <View style={styles.optionsGrid}>
                {OCCASIONS.map((occasion, index) => (
                  <Animated.View 
                    key={occasion.id}
                    entering={FadeIn.delay(index * 50).duration(300)}
                  >
                    <Pressable
                      onPress={() => setSelectedOccasion(occasion.id)}
                      style={[
                        styles.optionCard,
                        { backgroundColor: selectedOccasion === occasion.id ? occasion.color + '20' : colors.card },
                        selectedOccasion === occasion.id && { borderColor: occasion.color, borderWidth: 2 },
                      ]}
                    >
                      <ThemedText style={styles.optionIcon}>{occasion.icon}</ThemedText>
                      <ThemedText style={[
                        styles.optionLabel,
                        { color: selectedOccasion === occasion.id ? occasion.color : colors.text }
                      ]}>
                        {occasion.label}
                      </ThemedText>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Adım 3: Bütçe */}
          {step === 'budget' && (
            <Animated.View entering={FadeInUp.duration(400)}>
              <ThemedText type="heading" center style={styles.stepTitle}>
                Bütçen nedir?
              </ThemedText>
              <View style={styles.budgetGrid}>
                {BUDGETS.map((budget, index) => (
                  <Animated.View 
                    key={budget.id}
                    entering={SlideInUp.delay(index * 100).duration(400)}
                  >
                    <Pressable
                      onPress={() => setSelectedBudget(budget.id)}
                      style={[
                        styles.budgetCard,
                        { backgroundColor: selectedBudget === budget.id ? budget.color + '20' : colors.card },
                        selectedBudget === budget.id && { borderColor: budget.color, borderWidth: 2 },
                      ]}
                    >
                      <ThemedText style={styles.budgetIcon}>{budget.icon}</ThemedText>
                      <View style={styles.budgetInfo}>
                        <ThemedText style={[
                          styles.budgetLabel,
                          { color: selectedBudget === budget.id ? budget.color : colors.text }
                        ]}>
                          {budget.label}
                        </ThemedText>
                        <ThemedText style={{ color: colors.textMuted, fontSize: FontSizes.sm }}>
                          {budget.range}
                        </ThemedText>
                      </View>
                      {selectedBudget === budget.id && (
                        <Ionicons name="checkmark-circle" size={24} color={budget.color} />
                      )}
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Adım 4: Stil */}
          {step === 'style' && (
            <Animated.View entering={FadeInUp.duration(400)}>
              <ThemedText type="heading" center style={styles.stepTitle}>
                Kişinin tarzı nasıl?
              </ThemedText>
              <ThemedText type="caption" center style={{ color: colors.textMuted, marginBottom: Spacing.lg }}>
                Opsiyonel - Atlamak için devam et
              </ThemedText>
              <View style={styles.styleGrid}>
                {STYLES.map((style, index) => (
                  <Animated.View 
                    key={style.id}
                    entering={FadeIn.delay(index * 50).duration(300)}
                  >
                    <Pressable
                      onPress={() => setSelectedStyle(style.id)}
                      style={[
                        styles.styleCard,
                        { backgroundColor: selectedStyle === style.id ? style.color + '20' : colors.card },
                        selectedStyle === style.id && { borderColor: style.color, borderWidth: 2 },
                      ]}
                    >
                      <ThemedText style={styles.styleIcon}>{style.icon}</ThemedText>
                      <ThemedText style={[
                        styles.styleLabel,
                        { color: selectedStyle === style.id ? style.color : colors.text }
                      ]}>
                        {style.label}
                      </ThemedText>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Adım 5: Sonuçlar */}
          {step === 'results' && (
            <Animated.View entering={FadeInUp.duration(400)}>
              {/* Özet */}
              <Card variant="elevated" style={styles.summaryCard}>
                <LinearGradient
                  colors={[recipientData?.color || colors.tint, (recipientData?.color || colors.tint) + '80']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.summaryGradient}
                >
                  <ThemedText style={styles.summaryEmoji}>
                    {recipientData?.icon}
                  </ThemedText>
                  <ThemedText style={styles.summaryTitle}>
                    {recipientData?.label} için Öneriler
                  </ThemedText>
                  {giftMessage && (
                    <ThemedText style={styles.giftMessage}>
                      "{giftMessage}"
                    </ThemedText>
                  )}
                </LinearGradient>
              </Card>

              {/* Öneriler */}
              <ThemedText type="heading" style={styles.sectionTitle}>
                Önerilen Parfümler
              </ThemedText>
              
              {recommendations.length === 0 ? (
                <Card variant="elevated" style={styles.noResults}>
                  <Ionicons name="search-outline" size={48} color={colors.textMuted} />
                  <ThemedText type="subtitle" center style={{ marginTop: Spacing.md }}>
                    Kriterlere uygun parfüm bulunamadı
                  </ThemedText>
                  <Pressable 
                    onPress={handleReset}
                    style={[styles.resetBtn, { backgroundColor: colors.tint }]}
                  >
                    <ThemedText style={{ color: '#FFF' }}>Yeniden Dene</ThemedText>
                  </Pressable>
                </Card>
              ) : (
                <View style={styles.resultsGrid}>
                  {recommendations.map((item, index) => (
                    <Animated.View 
                      key={item.parfum.id}
                      entering={SlideInRight.delay(index * 80).duration(400)}
                    >
                      <Pressable onPress={() => handleParfumPress(item.parfum)}>
                        <Card variant="elevated" style={styles.resultCard}>
                          <View style={styles.resultHeader}>
                            <View style={[styles.resultIcon, { 
                              backgroundColor: (TYPE_COLORS[item.parfum.tip] || colors.tint) + '15' 
                            }]}>
                              <Ionicons name="gift" size={18} color={TYPE_COLORS[item.parfum.tip] || colors.tint} />
                            </View>
                            <View style={[styles.matchBadge, { backgroundColor: recipientData?.color + '15' }]}>
                              <ThemedText style={{ color: recipientData?.color, fontSize: 10, fontWeight: '700' }}>
                                %{Math.min(100, item.score)}
                              </ThemedText>
                            </View>
                          </View>
                          
                          <ThemedText type="subtitle" numberOfLines={1} style={styles.resultName}>
                            {item.parfum.isim}
                          </ThemedText>
                          <ThemedText type="caption" numberOfLines={1} style={{ color: colors.textMuted }}>
                            {item.parfum.marka}
                          </ThemedText>
                          
                          <View style={[styles.resultType, { 
                            backgroundColor: (TYPE_COLORS[item.parfum.tip] || colors.tint) + '10' 
                          }]}>
                            <ThemedText style={{ 
                              color: TYPE_COLORS[item.parfum.tip] || colors.tint, 
                              fontSize: 10 
                            }}>
                              {item.parfum.tip}
                            </ThemedText>
                          </View>

                          {item.reasons.length > 0 && (
                            <View style={styles.reasonTag}>
                              <Ionicons name="checkmark" size={10} color={colors.tint} />
                              <ThemedText style={styles.reasonTagText} numberOfLines={1}>
                                {item.reasons[0]}
                              </ThemedText>
                            </View>
                          )}
                        </Card>
                      </Pressable>
                    </Animated.View>
                  ))}
                </View>
              )}
            </Animated.View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Alt Buton */}
        {step !== 'results' && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.bottomButton}>
            <Button 
              title={step === 'style' ? 'Önerileri Gör' : 'Devam Et'}
              onPress={handleNext}
              disabled={!canProceed()}
              style={{ flex: 1 }}
            />
          </Animated.View>
        )}
      </SafeAreaView>
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  progressItem: {
    flex: 1,
    maxWidth: 40,
  },
  progressDot: {
    height: 4,
    borderRadius: 2,
  },
  content: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  stepTitle: {
    marginBottom: Spacing.xl,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  optionCard: {
    width: (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md) / 2,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  optionLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
    textAlign: 'center',
  },
  budgetGrid: {
    gap: Spacing.md,
  },
  budgetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  budgetIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  styleCard: {
    width: (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md * 2) / 3,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  styleIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  styleLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
    textAlign: 'center',
  },
  summaryCard: {
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    padding: 0,
  },
  summaryGradient: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  summaryEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  summaryTitle: {
    color: '#FFF',
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  giftMessage: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: FontSizes.sm,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  noResults: {
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  resetBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  resultCard: {
    width: (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md) / 2,
    padding: Spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  resultName: {
    fontSize: FontSizes.sm,
    marginBottom: 2,
  },
  resultType: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: Spacing.sm,
  },
  reasonTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  reasonTagText: {
    fontSize: 9,
    color: '#666',
    flex: 1,
  },
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
});


