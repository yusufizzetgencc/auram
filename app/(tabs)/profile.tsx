/**
 * AROMIXEN - Premium Profile Tab
 * User scent profile with detailed analytics and preferences
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, Button } from '@/components/ui';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';

const { width } = Dimensions.get('window');

// Scent profile gradients
const PROFILE_GRADIENTS = {
  primary: ['#9D4EDD', '#C77DFF'],
  success: ['#00D4AA', '#4ECDC4'],
  warning: ['#FFB347', '#FFCC70'],
  danger: ['#FF6B9D', '#FF8A80'],
  info: ['#7EC8E3', '#A8E6CF'],
};

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { preferences, resetPreferences, isOnboardingComplete, recommendations, phDegeri, parfumler } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

  const handleStartNewQuiz = () => {
    resetPreferences();
    router.push('/onboarding');
  };

  const hasPreferences = preferences.kokuTipleri.length > 0 || preferences.cinsiyet;

  // Calculate scent profile stats
  const getScentProfile = () => {
    const types = preferences.kokuTipleri;
    const intensity = preferences.yogunluk;
    
    // Determine dominant character
    let character = 'Keşifçi';
    if (types.includes('Çiçeksi') || types.includes('Romantik')) character = 'Romantik';
    else if (types.includes('Odunsu') || types.includes('Oryantal')) character = 'Sofistike';
    else if (types.includes('Ferah') || types.includes('Aquatik')) character = 'Dinamik';
    else if (types.includes('Baharatlı')) character = 'Cesur';
    
    return {
      character,
      intensity: intensity || 'orta',
      phLevel: phDegeri || 5.0,
      compatibility: recommendations.length > 0 ? Math.round(recommendations[0].uyumYuzdesi) : 0,
    };
  };

  const profile = getScentProfile();

  // Get pH status
  const getPhStatus = (ph: number) => {
    if (ph < 5.0) return { label: 'Asidik', color: '#FFB347', description: 'Üst notalar parlak' };
    if (ph > 6.0) return { label: 'Bazik', color: '#7EC8E3', description: 'Alt notalar baskın' };
    return { label: 'Dengeli', color: '#00D4AA', description: 'Optimal performans' };
  };

  const phStatus = getPhStatus(profile.phLevel);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Premium Header with Profile Card */}
          <Animated.View 
            entering={FadeInDown.delay(100).duration(600)}
            style={styles.header}
          >
            <LinearGradient
              colors={PROFILE_GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileCard}
            >
              {/* Decorative Elements */}
              <View style={[styles.decorCircle, styles.decorCircle1]} />
              <View style={[styles.decorCircle, styles.decorCircle2]} />
              <View style={[styles.decorCircle, styles.decorCircle3]} />
              
              <View style={styles.profileContent}>
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                    style={styles.avatarGradient}
                  >
                    <Ionicons name="person" size={40} color="#FFFFFF" />
                  </LinearGradient>
                </View>
                
                <View style={styles.profileInfo}>
                  <ThemedText style={styles.profileName}>Koku Profilim</ThemedText>
                  <View style={styles.profileBadge}>
                    <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                    <ThemedText style={styles.profileBadgeText}>
                      {profile.character} Karakter
                    </ThemedText>
                  </View>
                </View>
                
                <Pressable style={styles.editButton}>
                  <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
                </Pressable>
              </View>
              
              {/* Quick Stats */}
              <View style={styles.quickStats}>
                <View style={styles.quickStatItem}>
                  <ThemedText style={styles.quickStatValue}>
                    {preferences.kokuTipleri.length}
                  </ThemedText>
                  <ThemedText style={styles.quickStatLabel}>Koku Tipi</ThemedText>
                </View>
                <View style={styles.quickStatDivider} />
                <View style={styles.quickStatItem}>
                  <ThemedText style={styles.quickStatValue}>
                    {recommendations.length}
                  </ThemedText>
                  <ThemedText style={styles.quickStatLabel}>Öneri</ThemedText>
                </View>
                <View style={styles.quickStatDivider} />
                <View style={styles.quickStatItem}>
                  <ThemedText style={styles.quickStatValue}>
                    {profile.compatibility}%
                  </ThemedText>
                  <ThemedText style={styles.quickStatLabel}>Uyum</ThemedText>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* pH Analysis Card */}
          {isOnboardingComplete && (
            <Animated.View entering={FadeInDown.delay(200).duration(600)}>
              <Card variant="elevated" style={styles.phCard}>
                <View style={styles.phHeader}>
                  <View style={styles.phTitleRow}>
                    <View style={[styles.phIcon, { backgroundColor: phStatus.color + '20' }]}>
                      <Ionicons name="flask" size={20} color={phStatus.color} />
                    </View>
                    <View>
                      <ThemedText type="heading">Cilt pH Analizi</ThemedText>
                      <ThemedText type="caption" style={{ marginTop: 2 }}>
                        Koku performansını etkiler
                      </ThemedText>
                    </View>
                  </View>
                </View>
                
                <View style={styles.phContent}>
                  <View style={styles.phMeter}>
                    <LinearGradient
                      colors={['#FFB347', '#00D4AA', '#7EC8E3']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.phMeterBar}
                    >
                      <View 
                        style={[
                          styles.phIndicator, 
                          { left: `${((profile.phLevel - 4) / 3) * 100}%` }
                        ]} 
                      />
                    </LinearGradient>
                    <View style={styles.phLabels}>
                      <ThemedText type="caption">4.0</ThemedText>
                      <ThemedText type="caption">5.5</ThemedText>
                      <ThemedText type="caption">7.0</ThemedText>
                    </View>
                  </View>
                  
                  <View style={styles.phResult}>
                    <View style={[styles.phResultBadge, { backgroundColor: phStatus.color + '20' }]}>
                      <ThemedText style={[styles.phResultValue, { color: phStatus.color }]}>
                        pH {profile.phLevel.toFixed(1)}
                      </ThemedText>
                      <ThemedText style={[styles.phResultLabel, { color: phStatus.color }]}>
                        {phStatus.label}
                      </ThemedText>
                    </View>
                    <ThemedText type="caption" center style={{ marginTop: Spacing.sm }}>
                      {phStatus.description}
                    </ThemedText>
                  </View>
                </View>
              </Card>
            </Animated.View>
          )}

          {/* Scent Preferences Grid */}
          {hasPreferences && (
            <Animated.View entering={FadeInDown.delay(300).duration(600)}>
              <View style={styles.sectionHeader}>
                <ThemedText type="heading">Tercihlerim</ThemedText>
              </View>
              
              <View style={styles.preferencesGrid}>
                {preferences.cinsiyet && (
                  <PreferenceCard
                    icon="person"
                    label="Cinsiyet"
                    value={preferences.cinsiyet}
                    gradient={PROFILE_GRADIENTS.primary}
                  />
                )}
                {preferences.yogunluk && (
                  <PreferenceCard
                    icon="speedometer"
                    label="Yoğunluk"
                    value={preferences.yogunluk}
                    gradient={PROFILE_GRADIENTS.warning}
                  />
                )}
                {preferences.kullanimAmaci && (
                  <PreferenceCard
                    icon="today"
                    label="Kullanım"
                    value={preferences.kullanimAmaci}
                    gradient={PROFILE_GRADIENTS.success}
                  />
                )}
                {preferences.mevsim && (
                  <PreferenceCard
                    icon="leaf"
                    label="Mevsim"
                    value={preferences.mevsim}
                    gradient={PROFILE_GRADIENTS.info}
                  />
                )}
                {preferences.iklim && (
                  <PreferenceCard
                    icon="thermometer"
                    label="İklim"
                    value={preferences.iklim}
                    gradient={PROFILE_GRADIENTS.danger}
                  />
                )}
                {preferences.kiyafetStili && (
                  <PreferenceCard
                    icon="shirt"
                    label="Stil"
                    value={preferences.kiyafetStili}
                    gradient={PROFILE_GRADIENTS.primary}
                  />
                )}
              </View>
            </Animated.View>
          )}

          {/* Scent Types */}
          {preferences.kokuTipleri.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400).duration(600)}>
              <Card variant="elevated" style={styles.typesCard}>
                <View style={styles.typesHeader}>
                  <Ionicons name="sparkles" size={20} color={colors.tint} />
                  <ThemedText type="heading" style={{ marginLeft: Spacing.sm }}>
                    Favori Koku Tipleri
                  </ThemedText>
                </View>
                
                <View style={styles.typesGrid}>
                  {preferences.kokuTipleri.map((tip, index) => (
                    <ScentTypeBadge key={index} type={tip} />
                  ))}
                </View>
              </Card>
            </Animated.View>
          )}

          {/* Notes Section */}
          {(preferences.sevilenNotalar.length > 0 || preferences.sevilmeyenNotalar.length > 0) && (
            <Animated.View entering={FadeInDown.delay(500).duration(600)}>
              <Card variant="elevated" style={styles.notesCard}>
                {preferences.sevilenNotalar.length > 0 && (
                  <View style={styles.notesSection}>
                    <View style={styles.notesSectionHeader}>
                      <Ionicons name="heart" size={18} color="#4CAF50" />
                      <ThemedText type="subtitle" style={{ marginLeft: Spacing.sm }}>
                        Sevilen Notalar
                      </ThemedText>
                    </View>
                    <View style={styles.notesGrid}>
                      {preferences.sevilenNotalar.map((nota, index) => (
                        <View key={index} style={[styles.noteBadge, styles.likedNote]}>
                          <ThemedText style={styles.likedNoteText}>{nota}</ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                
                {preferences.sevilmeyenNotalar.length > 0 && (
                  <View style={[styles.notesSection, { marginTop: Spacing.xl }]}>
                    <View style={styles.notesSectionHeader}>
                      <Ionicons name="close-circle" size={18} color="#EF5350" />
                      <ThemedText type="subtitle" style={{ marginLeft: Spacing.sm }}>
                        Kaçınılan Notalar
                      </ThemedText>
                    </View>
                    <View style={styles.notesGrid}>
                      {preferences.sevilmeyenNotalar.map((nota, index) => (
                        <View key={index} style={[styles.noteBadge, styles.dislikedNote]}>
                          <ThemedText style={styles.dislikedNoteText}>{nota}</ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </Card>
            </Animated.View>
          )}

          {/* Action Buttons */}
          <Animated.View entering={FadeInDown.delay(600).duration(600)}>
            <View style={styles.actionsSection}>
              <Button
                title={isOnboardingComplete ? 'Yeni Test Başlat' : 'Koku Testine Başla'}
                onPress={handleStartNewQuiz}
                fullWidth
                icon={
                  <Ionicons
                    name={isOnboardingComplete ? "refresh-outline" : "sparkles-outline"}
                    size={20}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                }
              />

              {isOnboardingComplete && (
                <Button
                  title="Önerilerimi Gör"
                  onPress={() => router.push('/results')}
                  variant="outline"
                  fullWidth
                  style={{ marginTop: Spacing.md }}
                  icon={
                    <Ionicons
                      name="list-outline"
                      size={20}
                      color={colors.tint}
                      style={{ marginRight: 8 }}
                    />
                  }
                />
              )}
            </View>
          </Animated.View>

          {/* App Stats */}
          <Animated.View entering={FadeInUp.delay(700).duration(600)}>
            <Card variant="elevated" style={styles.statsCard}>
              <ThemedText type="heading" style={styles.statsTitle}>
                Uygulama İstatistikleri
              </ThemedText>
              
              <View style={styles.appStatsGrid}>
                <AppStatItem
                  icon="sparkles"
                  value={parfumler.length}
                  label="Parfüm"
                  gradient={PROFILE_GRADIENTS.primary}
                />
                <AppStatItem
                  icon="flask"
                  value="60+"
                  label="Veri Noktası"
                  gradient={PROFILE_GRADIENTS.success}
                />
                <AppStatItem
                  icon="analytics"
                  value="21"
                  label="Kriter"
                  gradient={PROFILE_GRADIENTS.warning}
                />
                <AppStatItem
                  icon="shield-checkmark"
                  value="AI"
                  label="Destekli"
                  gradient={PROFILE_GRADIENTS.info}
                />
              </View>
            </Card>
          </Animated.View>

          {/* Settings Section */}
          <Animated.View entering={FadeInUp.delay(800).duration(600)}>
            <Card variant="elevated" style={styles.settingsCard}>
              <ThemedText type="heading" style={styles.settingsTitle}>
                Ayarlar
              </ThemedText>

              <SettingItem
                icon="moon-outline"
                label="Karanlık Mod"
                value="Sistem"
                colors={colors}
              />
              <SettingItem
                icon="notifications-outline"
                label="Bildirimler"
                value="Yakında"
                colors={colors}
              />
              <SettingItem
                icon="language-outline"
                label="Dil"
                value="Türkçe"
                colors={colors}
              />
              <SettingItem
                icon="information-circle-outline"
                label="Versiyon"
                value="1.0.0"
                colors={colors}
                isLast
              />
            </Card>
          </Animated.View>

          {/* App Footer */}
          <Animated.View entering={FadeInUp.delay(900).duration(600)}>
            <View style={styles.appFooter}>
              <LinearGradient
                colors={[colors.tint + '15', 'transparent']}
                style={styles.footerGradient}
              >
                <View style={[styles.appLogoSmall, { backgroundColor: colors.tint + '20' }]}>
                  <Ionicons name="sparkles" size={24} color={colors.tint} />
                </View>
                <ThemedText type="subtitle" center style={styles.appName}>
                  AROMIXEN
                </ThemedText>
                <ThemedText type="caption" center style={styles.appTagline}>
                  Kişisel Parfüm Öneri Asistanınız
                </ThemedText>
                <ThemedText type="caption" center style={styles.appCopyright}>
                  © 2024 Tüm hakları saklıdır.
                </ThemedText>
              </LinearGradient>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// Preference Card Component
function PreferenceCard({
  icon,
  label,
  value,
  gradient,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  gradient: string[];
}) {
  return (
    <View style={styles.preferenceCard}>
      <LinearGradient
        colors={gradient}
        style={styles.preferenceIconBg}
      >
        <Ionicons name={icon} size={18} color="#FFFFFF" />
      </LinearGradient>
      <ThemedText type="caption" style={styles.preferenceLabel}>{label}</ThemedText>
      <ThemedText style={styles.preferenceValue} numberOfLines={1}>
        {value}
      </ThemedText>
    </View>
  );
}

// Scent Type Badge
function ScentTypeBadge({ type }: { type: string }) {
  const typeColors: Record<string, string> = {
    'Çiçeksi': '#E8A4C9',
    'Odunsu': '#8B7355',
    'Ferah': '#7EC8E3',
    'Amber': '#D4A574',
    'Baharatlı': '#C75B39',
    'Meyvemsi': '#FF6B6B',
    'Tatlı': '#FFB6C1',
    'Yeşil': '#90EE90',
    'Oryantal': '#9D4EDD',
    'Aquatik': '#00CED1',
    'Pudralı': '#DDA0DD',
    'Deri': '#8B4513',
  };
  
  const color = typeColors[type] || '#9D4EDD';
  
  return (
    <View style={[styles.scentTypeBadge, { backgroundColor: color + '20', borderColor: color }]}>
      <View style={[styles.scentTypeDot, { backgroundColor: color }]} />
      <ThemedText style={[styles.scentTypeText, { color }]}>{type}</ThemedText>
    </View>
  );
}

// App Stat Item
function AppStatItem({
  icon,
  value,
  label,
  gradient,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  gradient: string[];
}) {
  return (
    <View style={styles.appStatItem}>
      <LinearGradient
        colors={gradient}
        style={styles.appStatIcon}
      >
        <Ionicons name={icon} size={18} color="#FFFFFF" />
      </LinearGradient>
      <ThemedText style={styles.appStatValue}>{value}</ThemedText>
      <ThemedText type="caption" style={styles.appStatLabel}>{label}</ThemedText>
    </View>
  );
}

// Setting Item
function SettingItem({
  icon,
  label,
  value,
  colors,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: typeof Colors.light;
  isLast?: boolean;
}) {
  return (
    <Pressable style={[styles.settingItem, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border + '30' }]}>
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: colors.tint + '10' }]}>
          <Ionicons name={icon} size={18} color={colors.tint} />
        </View>
        <ThemedText style={styles.settingLabel}>{label}</ThemedText>
      </View>
      <View style={styles.settingRight}>
        <ThemedText type="caption" style={{ color: colors.textMuted }}>
          {value}
        </ThemedText>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['4xl'],
  },
  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  profileCard: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing['2xl'],
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 100,
  },
  decorCircle1: {
    width: 120,
    height: 120,
    top: -40,
    right: -30,
  },
  decorCircle2: {
    width: 80,
    height: 80,
    bottom: -30,
    left: -20,
  },
  decorCircle3: {
    width: 50,
    height: 50,
    top: 40,
    right: 60,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  avatarContainer: {
    marginRight: Spacing.lg,
  },
  avatarGradient: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  profileBadgeText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    marginLeft: Spacing.xs,
    fontWeight: FontWeights.medium,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    marginTop: Spacing['2xl'],
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  quickStatValue: {
    color: '#FFFFFF',
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  quickStatLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  phCard: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.xl,
  },
  phHeader: {
    marginBottom: Spacing.xl,
  },
  phTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  phContent: {
    gap: Spacing.xl,
  },
  phMeter: {
    paddingHorizontal: Spacing.sm,
  },
  phMeterBar: {
    height: 12,
    borderRadius: BorderRadius.full,
    position: 'relative',
  },
  phIndicator: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    top: -4,
    marginLeft: -10,
    borderWidth: 3,
    borderColor: '#333',
  },
  phLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  phResult: {
    alignItems: 'center',
  },
  phResultBadge: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  phResultValue: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  phResultLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  sectionHeader: {
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  preferenceCard: {
    width: (width - Spacing.xl * 2 - Spacing.md * 2) / 3,
    backgroundColor: 'rgba(157, 78, 221, 0.05)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  preferenceIconBg: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  preferenceLabel: {
    opacity: 0.7,
    marginBottom: 2,
  },
  preferenceValue: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
    textTransform: 'capitalize',
  },
  typesCard: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.xl,
  },
  typesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  scentTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  scentTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  scentTypeText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  notesCard: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.xl,
  },
  notesSection: {},
  notesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  noteBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  likedNote: {
    backgroundColor: '#4CAF5015',
  },
  likedNoteText: {
    color: '#4CAF50',
    fontSize: FontSizes.sm,
  },
  dislikedNote: {
    backgroundColor: '#EF535015',
  },
  dislikedNoteText: {
    color: '#EF5350',
    fontSize: FontSizes.sm,
  },
  actionsSection: {
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing.xl,
  },
  statsCard: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.xl,
  },
  statsTitle: {
    marginBottom: Spacing.xl,
  },
  appStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  appStatItem: {
    alignItems: 'center',
  },
  appStatIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  appStatValue: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  appStatLabel: {
    opacity: 0.7,
    marginTop: 2,
  },
  settingsCard: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.xl,
  },
  settingsTitle: {
    marginBottom: Spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: FontSizes.base,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  appFooter: {
    marginHorizontal: Spacing['2xl'],
  },
  footerGradient: {
    alignItems: 'center',
    padding: Spacing['2xl'],
    borderRadius: BorderRadius.xl,
  },
  appLogoSmall: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    marginBottom: Spacing.xs,
  },
  appTagline: {
    opacity: 0.7,
    marginBottom: Spacing.md,
  },
  appCopyright: {
    opacity: 0.5,
  },
});
