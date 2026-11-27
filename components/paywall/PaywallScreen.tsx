/**
 * TENİNDE — Premium ödeme ekranı
 * Fiyat/deneme bilgisi mağazadan gelir; burada hiçbir rakam sabitlenmez.
 * Paketler yüklenemezse (mağaza yapılandırması eksik vb.) boş ekran yerine açıklama + tekrar dene gösterilir.
 */
import { Button, IconButton, T, useTheme } from '@/components/kit';
import { Monogram } from '@/components/kit/brand';
import { LEGAL } from '@/constants/legal';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useSubscription } from '@/context/SubscriptionContext';
import { track } from '@/services/analytics';
import { scheduleTrialReminder } from '@/services/notifications';
import { hapticLight } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PaywallScreenProps {
  visible: boolean;
  onClose: () => void;
  onPurchaseSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export const PREMIUM_BENEFITS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'sparkles-outline', text: 'Tüm eşleşmeler ve "neden bu parfüm" gerekçeleri' },
  { icon: 'chatbubble-ellipses-outline', text: 'Sınırsız Koku Danışmanı' },
  { icon: 'file-tray-stacked-outline', text: 'Dolap analizi ve "sıradaki alımınız" önerisi' },
  { icon: 'analytics-outline', text: 'Aylık koku raporu, ten tespitleri ve hikâye kartı' },
  { icon: 'search-outline', text: 'Sınırsız parfüm detayı, benzer parfüm ve karşılaştırma' },
  { icon: 'layers-outline', text: 'Koku Günlüğü, Katmanlama, Hediye Asistanı ve Ruh Hali' },
  { icon: 'albums-outline', text: 'Sınırsız favori ve koleksiyon' },
  { icon: 'eye-off-outline', text: 'Reklamsız deneyim' },
];

const BIRIM: Record<string, [string, number]> = { DAY: ['gün', 1], WEEK: ['hafta', 7], MONTH: ['ay', 30], YEAR: ['yıl', 365] };
const YENILEME: Record<string, string> = { WEEKLY: 'hafta', MONTHLY: 'ay', ANNUAL: 'yıl', THREE_MONTH: '3 ay', SIX_MONTH: '6 ay' };

/** Paketin ücretsiz deneme süresi (gün) — yalnızca fiyatı 0 olan giriş teklifi deneme sayılır */
function denemeGunu(pkg: any): number | null {
  const intro = pkg?.product?.introPrice;
  if (!intro || intro.price !== 0) return null;
  const b = BIRIM[intro.periodUnit];
  return b ? b[1] * (intro.periodNumberOfUnits ?? 1) : null;
}

function denemeEtiketi(pkg: any): string | null {
  const intro = pkg?.product?.introPrice;
  if (!intro) return null;
  const b = BIRIM[intro.periodUnit]?.[0] ?? 'dönem';
  if (intro.price === 0) return `${intro.periodNumberOfUnits} ${b} ücretsiz deneme`;
  return `İlk ${intro.periodNumberOfUnits * (intro.cycles || 1)} ${b} ${intro.priceString}`;
}

const PERIOD: Record<string, string> = { WEEKLY: 'Haftalık', MONTHLY: 'Aylık', ANNUAL: 'Yıllık', THREE_MONTH: '3 Aylık', SIX_MONTH: '6 Aylık', LIFETIME: 'Ömür boyu' };

export function PaywallScreen({
  visible,
  onClose,
  onPurchaseSuccess,
  title = 'Teninde Premium',
  subtitle = 'Ten profilinizin tüm potansiyelini açın.',
}: PaywallScreenProps) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { offerings, offeringsStatus, purchase, restore, refreshOfferings } = useSubscription();
  const [selected, setSelected] = useState<any | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (visible) { refreshOfferings(); track('paywall_shown', { baglam: title }); }
  }, [visible, refreshOfferings, title]);

  const packages: any[] = useMemo(() => offerings?.availablePackages ?? [], [offerings]);
  useEffect(() => {
    if (packages.length && !selected) setSelected(packages.find(p => p.packageType === 'ANNUAL') ?? packages.find(p => p.packageType === 'MONTHLY') ?? packages[0]);
  }, [packages, selected]);

  const buy = async () => {
    if (!selected) return;
    setPurchasing(true);
    const gun = denemeGunu(selected);
    track('purchase_started', { paket: selected.packageType, deneme: !!gun });
    try {
      const r = await purchase(selected);
      if (r.success) {
        track('purchase_completed', { paket: selected.packageType, deneme: !!gun });
        if (gun && gun >= 3) scheduleTrialReminder(gun).catch(() => {});
        onPurchaseSuccess?.();
        onClose();
        if (gun) Alert.alert('Denemeniz başladı', `${gun} gün boyunca tüm Premium özellikler açık.${gun >= 3 ? ' Deneme bitmeden 2 gün önce size hatırlatacağız.' : ''}`);
      } else if (r.cancelled) track('purchase_cancelled', { paket: selected.packageType });
      else Alert.alert('Satın alma tamamlanamadı', r.error || 'Lütfen daha sonra tekrar deneyin.');
    } finally {
      setPurchasing(false);
    }
  };

  const doRestore = async () => {
    setRestoring(true);
    const ok = await restore();
    setRestoring(false);
    track('purchase_restored', { basarili: ok });
    if (ok) { Alert.alert('Geri yüklendi', 'Premium erişiminiz aktif.'); onPurchaseSuccess?.(); onClose(); }
    else Alert.alert('Bulunamadı', 'Geri yüklenecek aktif bir abonelik bulunamadı.');
  };

  const gun = denemeGunu(selected);

  const renderPlans = () => {
    if (offeringsStatus === 'loading' && packages.length === 0) {
      return <ActivityIndicator color={c.accent} style={{ marginVertical: Spacing['2xl'] }} />;
    }
    if (packages.length === 0) {
      const msg = offeringsStatus === 'unavailable'
        ? 'Abonelikler bu sürümde kullanılamıyor.'
        : offeringsStatus === 'network'
          ? 'Abonelik paketleri yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.'
          : 'Abonelik seçenekleri şu an sunulamıyor. Lütfen biraz sonra tekrar deneyin.';
      return (
        <View style={[styles.notice, { backgroundColor: c.surfaceAlt }]}>
          <Ionicons name={offeringsStatus === 'network' ? 'cloud-offline-outline' : 'time-outline'} size={20} color={c.inkMuted} />
          <T variant="small" color="muted" style={{ flex: 1 }}>{msg}</T>
          {offeringsStatus !== 'unavailable' ? <T variant="smallStrong" color="accent" onPress={refreshOfferings}>Tekrar dene</T> : null}
        </View>
      );
    }
    return (
      <View style={{ gap: Spacing.sm }}>
        {packages.map(pkg => {
          const on = selected?.identifier === pkg.identifier;
          const intro = denemeEtiketi(pkg);
          const aylik = pkg.packageType === 'ANNUAL' ? pkg.product?.pricePerMonthString : null;
          const best = pkg.packageType === 'ANNUAL';
          return (
            <Pressable
              key={pkg.identifier}
              onPress={() => { hapticLight(); setSelected(pkg); }}
              style={[styles.plan, { borderColor: on ? c.accent : c.border, backgroundColor: on ? c.accentSoft : c.surface }]}
            >
              <View style={[styles.radio, { borderColor: on ? c.accent : c.border }]}>
                {on ? <View style={[styles.radioDot, { backgroundColor: c.accent }]} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <T variant="bodyStrong">{PERIOD[pkg.packageType] ?? pkg.product?.title ?? pkg.identifier}</T>
                  {best ? <View style={[styles.best, { backgroundColor: c.accent }]}><T variant="overline" color="onAccent" style={{ fontSize: 9 }}>En avantajlı</T></View> : null}
                </View>
                {intro ? <T variant="small" color="accent">{intro}</T> : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T variant="h3">{pkg.product?.priceString ?? ''}</T>
                {aylik ? <T variant="small" color="muted">aylık {aylik}</T> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={styles.topBar}>
          <IconButton name="close" onPress={onClose} accessibilityLabel="Kapat" />
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl }}>
          <Monogram size={56} />
          <T variant="h1" style={{ marginTop: Spacing.lg }}>{title}</T>
          <T variant="body" color="muted" style={{ marginTop: Spacing.sm }}>{subtitle}</T>

          <View style={{ marginTop: Spacing.xl, gap: Spacing.md }}>
            {PREMIUM_BENEFITS.map(b => (
              <View key={b.text} style={styles.benefit}>
                <Ionicons name={b.icon} size={18} color={c.accent} />
                <T variant="body" style={{ flex: 1 }}>{b.text}</T>
              </View>
            ))}
          </View>

          <View style={{ marginTop: Spacing['2xl'] }}>{renderPlans()}</View>

          {gun ? (
            <View style={[styles.timeline, { borderColor: c.border }]}>
              <T variant="overline" color="subtle">Deneme nasıl işler?</T>
              {[
                { icon: 'lock-open-outline' as const, baslik: 'Bugün', metin: 'Tüm Premium özellikler açılır. Ücret alınmaz.' },
                ...(gun >= 3 ? [{ icon: 'notifications-outline' as const, baslik: `${gun - 2}. gün`, metin: 'Denemenin bitmesine 2 gün kala size hatırlatırız.' }] : []),
                { icon: 'card-outline' as const, baslik: `${gun}. gün`, metin: `İptal etmediyseniz abonelik ${selected?.product?.priceString ?? ''} ile başlar.` },
              ].map((a, i, arr) => (
                <View key={a.baslik} style={styles.step}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={[styles.stepDot, { backgroundColor: i === 0 ? c.accent : c.surfaceAlt, borderColor: c.border }]}>
                      <Ionicons name={a.icon} size={14} color={i === 0 ? c.onAccent : c.inkMuted} />
                    </View>
                    {i < arr.length - 1 ? <View style={[styles.stepLine, { backgroundColor: c.border }]} /> : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: Spacing.md }}>
                    <T variant="smallStrong">{a.baslik}</T>
                    <T variant="small" color="muted">{a.metin}</T>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, borderTopColor: c.border }]}>
          <Button label={gun ? `${gun} gün ücretsiz dene` : 'Devam et'} variant="accent" onPress={buy} loading={purchasing} disabled={!selected} />
          {selected ? (
            <T variant="small" color="muted" align="center">
              {gun
                ? `Deneme bitince ${selected.product?.priceString ?? ''} / ${YENILEME[selected.packageType] ?? 'dönem'}. İstediğiniz an iptal edebilirsiniz.`
                : `${selected.product?.priceString ?? ''} / ${YENILEME[selected.packageType] ?? 'dönem'} · İstediğiniz an iptal edebilirsiniz.`}
            </T>
          ) : null}
          <View style={styles.legal}>
            <T variant="small" color="muted" onPress={doRestore}>{restoring ? 'Geri yükleniyor…' : 'Satın alımları geri yükle'}</T>
            <T variant="small" color="subtle">·</T>
            <T variant="small" color="muted" onPress={() => Linking.openURL(LEGAL.terms)}>Koşullar</T>
            <T variant="small" color="subtle">·</T>
            <T variant="small" color="muted" onPress={() => Linking.openURL(LEGAL.privacy)}>Gizlilik</T>
          </View>
          <T variant="small" color="subtle" align="center" style={{ fontSize: 11, lineHeight: 15 }}>
            Abonelik, dönem bitmeden en az 24 saat önce iptal edilmezse otomatik yenilenir. Ayarlar &gt; Apple Kimliği &gt; Abonelikler üzerinden yönetebilirsiniz.
          </T>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', padding: Spacing.sm },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  notice: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.md },
  plan: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  timeline: { marginTop: Spacing.xl, padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: StyleSheet.hairlineWidth, gap: Spacing.md },
  step: { flexDirection: 'row', gap: Spacing.md },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  stepLine: { width: 1, flex: 1, marginTop: 2 },
  best: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.sm },
  footer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth, gap: Spacing.md },
  legal: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
});
