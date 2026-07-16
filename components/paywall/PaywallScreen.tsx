/**
 * Auram - Paywall Ekranı
 * Haftalık/aylık/yıllık paketleri gösterir, RevenueCat üzerinden satın alma yapar.
 * Fiyat/deneme bilgisi Store'dan (App Store Connect / Play Console) geldiği için
 * burada hiçbir rakam sabitlenmez — her şey `pkg.product` üzerinden okunur.
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Button, Card } from '@/components/ui';
import { Colors, BorderRadius, FontSizes, FontWeights, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSubscription } from '@/context/SubscriptionContext';

interface PaywallScreenProps {
  visible: boolean;
  onClose: () => void;
  onPurchaseSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

// Premium'a geçince kilidi açılan özellikler — tüm paywall tetikleyicilerinde
// tutarlı şekilde gösterilir, kullanıcı neye para verdiğini her seferinde görür.
const PREMIUM_BENEFITS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'sparkles', text: 'Tüm parfüm önerilerini ve "neden bu parfüm" gerekçelerini gör' },
  { icon: 'flask', text: 'Sınırsız parfüm detayı ve pH analizi incele' },
  { icon: 'heart', text: 'Sınırsız favori ekle' },
  { icon: 'folder-open', text: 'Sınırsız koleksiyon oluştur, her birine sınırsız parfüm ekle' },
  { icon: 'git-compare', text: 'Sınırsız parfüm karşılaştırması yap' },
  { icon: 'layers', text: 'Katmanlama, Hediye Asistanı, Mood Tracker, Takvim, Günlük ve Şans Çarkı\'nı kullan' },
  { icon: 'play-skip-forward', text: 'Reklamsız, kesintisiz deneyim' },
];

export function PaywallScreen({
  visible,
  onClose,
  onPurchaseSuccess,
  title = "Koku DNA'nın Tamamını Keşfet",
  subtitle = 'Tüm eşleşmelerini, gerekçelerini ve premium modülleri aç.',
}: PaywallScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { offerings, purchase, restore, refreshOfferings } = useSubscription();

  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [fetchingOfferings, setFetchingOfferings] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setFetchingOfferings(true);
    refreshOfferings().finally(() => {
      if (!cancelled) setFetchingOfferings(false);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, refreshOfferings]);

  useEffect(() => {
    const packages = offerings?.availablePackages ?? [];
    if (packages.length > 0 && !selectedPackage) {
      // Varsayılan seçim: aylık paket varsa o, yoksa ilk paket
      const monthly = packages.find((p: any) => p.packageType === 'MONTHLY');
      setSelectedPackage(monthly ?? packages[0]);
    }
  }, [offerings, selectedPackage]);

  const packages = offerings?.availablePackages ?? [];

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    setPurchasing(true);
    try {
      const result = await purchase(selectedPackage);
      if (result.success) {
        onPurchaseSuccess?.();
        onClose();
      } else if (!result.cancelled) {
        Alert.alert('Bir Sorun Oluştu', result.error || 'Satın alma tamamlanamadı. Lütfen daha sonra tekrar deneyin.');
      }
    } catch (error) {
      Alert.alert('Bir Sorun Oluştu', 'Satın alma tamamlanamadı. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const success = await restore();
    setRestoring(false);

    if (success) {
      Alert.alert('Satın Alımlar Geri Yüklendi', 'Premium erişimin aktif edildi.');
      onPurchaseSuccess?.();
      onClose();
    } else {
      Alert.alert('Bulunamadı', 'Geri yüklenecek aktif bir abonelik bulunamadı.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <LinearGradient colors={['#9D4EDD', '#7B2CBF']} style={styles.iconBadge}>
              <Ionicons name="sparkles" size={32} color="#FFF" />
            </LinearGradient>

            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>

            <View style={styles.benefitsList}>
              {PREMIUM_BENEFITS.map((benefit) => (
                <View key={benefit.text} style={styles.benefitRow}>
                  <View style={[styles.benefitIcon, { backgroundColor: colors.tint + '15' }]}>
                    <Ionicons name={benefit.icon} size={16} color={colors.tint} />
                  </View>
                  <Text style={[styles.benefitText, { color: colors.text }]}>{benefit.text}</Text>
                </View>
              ))}
            </View>

            {fetchingOfferings ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={colors.tint} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                  Paketler yükleniyor...
                </Text>
              </View>
            ) : packages.length === 0 ? (
              <View style={styles.loadingBox}>
                <Ionicons name="cloud-offline-outline" size={32} color={colors.textMuted} />
                <Text style={[styles.loadingText, { color: colors.textMuted, textAlign: 'center' }]}>
                  Paketler şu anda yüklenemedi. Lütfen internet bağlantını kontrol edip tekrar dene.
                </Text>
                <Pressable onPress={() => refreshOfferings()} style={{ marginTop: Spacing.md }}>
                  <Text style={{ color: colors.tint, fontWeight: FontWeights.semiBold }}>Tekrar Dene</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.packagesContainer}>
                {packages.map((pkg: any) => {
                  const selected = selectedPackage?.identifier === pkg.identifier;
                  return (
                    <Card
                      key={pkg.identifier}
                      onPress={() => setSelectedPackage(pkg)}
                      selected={selected}
                      variant="elevated"
                      style={styles.packageCard}
                    >
                      <View style={styles.packageRow}>
                        <View style={styles.packageInfo}>
                          <Text style={[styles.packageTitle, { color: colors.text }]}>
                            {pkg.product?.title ?? 'Auram Premium'}
                          </Text>
                          <Text style={[styles.packagePrice, { color: colors.textMuted }]}>
                            {pkg.product?.priceString ?? ''}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.radio,
                            {
                              borderColor: selected ? colors.tint : colors.border,
                              backgroundColor: selected ? colors.tint : 'transparent',
                            },
                          ]}
                        >
                          {selected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                        </View>
                      </View>
                    </Card>
                  );
                })}
              </View>
            )}

            <Button
              title={purchasing ? 'İşleniyor...' : 'Devam Et'}
              onPress={handlePurchase}
              disabled={!selectedPackage || purchasing}
              loading={purchasing}
              fullWidth
              size="lg"
              style={styles.ctaButton}
            />

            <Pressable onPress={handleRestore} disabled={restoring} style={styles.restoreButton}>
              <Text style={[styles.restoreText, { color: colors.tint }]}>
                {restoring ? 'Geri yükleniyor...' : 'Satın Alımları Geri Yükle'}
              </Text>
            </Pressable>

            <View style={styles.legalRow}>
              <Pressable onPress={() => Linking.openURL('https://auram.app/terms')}>
                <Text style={[styles.legalText, { color: colors.textMuted }]}>Kullanım Koşulları</Text>
              </Pressable>
              <Text style={[styles.legalText, { color: colors.textMuted }]}>·</Text>
              <Pressable onPress={() => Linking.openURL('https://auram.app/privacy')}>
                <Text style={[styles.legalText, { color: colors.textMuted }]}>Gizlilik Politikası</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: Spacing.base,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    alignItems: 'center',
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.base,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  benefitsList: {
    width: '100%',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    flex: 1,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  loadingBox: {
    paddingVertical: Spacing['2xl'],
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.sm,
  },
  packagesContainer: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  packageCard: {
    marginBottom: Spacing.md,
  },
  packageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packageInfo: {
    flex: 1,
  },
  packageTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semiBold,
    marginBottom: 2,
  },
  packagePrice: {
    fontSize: FontSizes.sm,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    marginTop: Spacing.sm,
  },
  restoreButton: {
    marginTop: Spacing.lg,
    padding: Spacing.xs,
  },
  restoreText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  legalRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  legalText: {
    fontSize: FontSizes.xs,
  },
});
