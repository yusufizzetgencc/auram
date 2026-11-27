/**
 * TENİNDE — Koku hafızası ve aylık rapor
 *  • Ay seçici (‹ Kasım 2026 ›)
 *  • Ücretsiz: ayın özet sayıları · Premium: en çok sıkılanlar, aile dağılımı, en uzun kalan, iltifat şampiyonu,
 *    en aktif gün, ten tespiti, mevsimlerin kokuları, zevk netliği ve hikâye kartı paylaşımı
 * Veri: günün kokusu kayıtları + akşam değerlendirmeleri (engine/insights). Yeterli veri yoksa bölüm gösterilmez.
 */
import { Button, Card, EmptyState, Header, IconButton, ProgressLine, Screen, Section, Stat, T, useTheme } from '@/components/kit';
import { Bottle, brandCaps } from '@/components/kit/perfume';
import { LockedFeatureOverlay, PaywallScreen } from '@/components/paywall';
import { ReportCard } from '@/components/report/ReportCard';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { AY_ADLARI, aylikRapor, GUN_ADLARI, kokuHafizasi, zevkNetligi } from '@/engine';
import { usePremiumGate } from '@/hooks/use-premium-gate';
import { track } from '@/services/analytics';
import { toLocalDateKey } from '@/utils/date';
import { hapticMedium } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

export default function ReportScreen() {
  const router = useRouter();
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{ yil?: string; ay?: string }>();
  const { parfumler, sotdHistory, performanceLogs, wardrobe, preferences } = useApp();
  const { isPremium, paywallVisible, setPaywallVisible } = usePremiumGate();
  const now = new Date();
  const [yil, setYil] = useState(params.yil ? Number(params.yil) : now.getFullYear());
  const [ay, setAy] = useState(params.ay ? Number(params.ay) : now.getMonth() + 1);
  const [shareOpen, setShareOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<View>(null);

  useEffect(() => { track('report_viewed', { premium: isPremium }); }, [isPremium]);

  const kayit = useMemo(() => sotdHistory.map(s => ({ parfumId: s.parfumId, date: s.date })), [sotdHistory]);
  const rapor = useMemo(() => aylikRapor(yil, ay, kayit, performanceLogs, parfumler), [yil, ay, kayit, performanceLogs, parfumler]);
  const hafiza = useMemo(() => kokuHafizasi(kayit, performanceLogs, parfumler, wardrobe, toLocalDateKey()), [kayit, performanceLogs, parfumler, wardrobe]);
  const netlik = zevkNetligi(preferences, performanceLogs.length);

  const ileriYok = yil === now.getFullYear() && ay === now.getMonth() + 1;
  const gezin = (d: number) => {
    let a = ay + d, y = yil;
    if (a < 1) { a = 12; y -= 1; }
    if (a > 12) { a = 1; y += 1; }
    setAy(a); setYil(y);
  };

  const cardWidth = Math.min(width - Spacing.xl * 2, 340, (height - insets.top - insets.bottom - 160) / (16 / 9));
  const share = async () => {
    if (!cardRef.current) return;
    hapticMedium();
    setBusy(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Koku raporumu paylaş' });
        track('report_shared');
      } else Alert.alert('Paylaşım kullanılamıyor', 'Bu cihazda paylaşım desteklenmiyor.');
    } catch {
      Alert.alert('Bir sorun oluştu', 'Kart oluşturulamadı, lütfen tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  };

  const detay = (
    <View>
      {rapor.enCok.length ? (
        <Section title="En çok sıktıklarınız">
          <Card style={{ gap: Spacing.md }}>
            {rapor.enCok.map((x, i) => (
              <Pressable key={x.parfum.id} onPress={() => router.push(`/parfum/${x.parfum.id}`)} style={styles.row}>
                <T variant="h3" color={i === 0 ? 'accent' : 'subtle'} style={{ width: 20 }}>{i + 1}</T>
                <Bottle parfum={x.parfum} size={34} />
                <View style={{ flex: 1 }}>
                  <T variant="overline" caps={brandCaps(x.parfum)} color="subtle">{x.parfum.marka}</T>
                  <T variant="bodyStrong" numberOfLines={1}>{x.parfum.isim}</T>
                </View>
                <T variant="smallStrong">{x.deger} gün</T>
              </Pressable>
            ))}
          </Card>
        </Section>
      ) : null}

      {rapor.aileDagilimi.length ? (
        <Section title="Koku aileleri">
          <Card style={{ gap: Spacing.md }}>
            {rapor.aileDagilimi.slice(0, 5).map(a => (
              <View key={a.aile}>
                <View style={styles.rowBetween}><T variant="body">{a.aile}</T><T variant="smallStrong">%{a.yuzde}</T></View>
                <View style={{ marginTop: 6 }}><ProgressLine value={a.yuzde} /></View>
              </View>
            ))}
          </Card>
        </Section>
      ) : null}

      <Section title="Teninizde">
        <Card style={{ gap: Spacing.md }}>
          <Insight icon="hourglass-outline" baslik="En uzun kalan" deger={rapor.enUzunKalan ? `${rapor.enUzunKalan.parfum.isim} · ${rapor.enUzunKalan.deger}/5` : null} bos="En az 2 akşam değerlendirmesi gerekir." />
          <Insight icon="chatbubbles-outline" baslik="İltifat şampiyonu" deger={rapor.iltifatSampiyonu ? `${rapor.iltifatSampiyonu.parfum.isim} · %${Math.round(rapor.iltifatSampiyonu.deger * 100)}` : null} bos="Akşam değerlendirmesinde iltifat aldıysanız işaretleyin." />
          <Insight icon="calendar-outline" baslik="En çok parfüm sıktığınız gün" deger={rapor.enAktifGun !== null ? GUN_ADLARI[rapor.enAktifGun] : null} bos="Daha fazla kayıt gerekiyor." />
          {hafiza.tenTespiti ? (
            <Insight icon="sparkles-outline" baslik="Ten tespiti" deger={`${hafiza.tenTespiti.aile} parfümler sizde ortalama ${hafiza.tenTespiti.ortalama}/5 kalıyor`} bos="" />
          ) : null}
        </Card>
      </Section>

      {Object.values(hafiza.mevsimeGore).some(Boolean) ? (
        <Section title="Mevsimlerin kokuları">
          <View style={styles.seasons}>
            {(Object.keys(hafiza.mevsimeGore) as (keyof typeof hafiza.mevsimeGore)[]).map(m => {
              const v = hafiza.mevsimeGore[m];
              return (
                <View key={m} style={[styles.season, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <T variant="overline" color="subtle">{m}</T>
                  {v ? <><Bottle parfum={v.parfum} size={34} /><T variant="small" numberOfLines={1} align="center">{v.parfum.isim}</T></> : <T variant="small" color="subtle">—</T>}
                </View>
              );
            })}
          </View>
        </Section>
      ) : null}

      <Button label="Hikâyede paylaş" icon="share-outline" variant="accent" onPress={() => setShareOpen(true)} style={{ marginTop: Spacing.xl }} />
    </View>
  );

  return (
    <Screen>
      <Header title="Koku hafızam" />

      <View style={[styles.monthBar, { marginTop: Spacing.lg }]}>
        <IconButton name="chevron-back" onPress={() => gezin(-1)} accessibilityLabel="Önceki ay" />
        <T variant="h2">{AY_ADLARI[ay - 1]} {yil}</T>
        <IconButton name="chevron-forward" onPress={() => !ileriYok && gezin(1)} color={ileriYok ? c.border : undefined} accessibilityLabel="Sonraki ay" />
      </View>

      {rapor.toplamGun === 0 ? (
        <EmptyState icon="analytics-outline" title="Bu ay için kayıt yok" body="Her gün ne sıktığınızı kaydettikçe raporunuz burada oluşur." actionLabel="Bugünü kaydet" onAction={() => router.push('/(tabs)')} />
      ) : (
        <>
          <Card style={{ marginTop: Spacing.lg }}>
            <View style={{ flexDirection: 'row' }}>
              <Stat label="Gün" value={String(rapor.toplamGun)} hint={rapor.oncekiAyFarki !== null ? `${rapor.oncekiAyFarki >= 0 ? '+' : ''}${rapor.oncekiAyFarki} geçen aya göre` : undefined} />
              <Stat label="Parfüm" value={String(rapor.farkliParfum)} />
              <Stat label="İltifat" value={String(rapor.iltifatSayisi)} />
            </View>
            {rapor.ortalamaKalicilik !== null ? <T variant="small" color="muted" style={{ marginTop: Spacing.md }}>Ortalama kalıcılık {rapor.ortalamaKalicilik}/5</T> : null}
          </Card>
          {isPremium ? detay : (
            <View style={{ marginTop: Spacing.xl }}>
              <LockedFeatureOverlay onUnlock={() => setPaywallVisible(true)} title="Tam rapor Premium'da" subtitle="Ayın kokusu, teninizde en uzun kalanlar, iltifat şampiyonu ve paylaşılabilir hikâye kartı.">
                <View style={{ height: 420 }}>{detay}</View>
              </LockedFeatureOverlay>
            </View>
          )}
        </>
      )}

      {/* Zevk netliği */}
      <Section title="Uygulama sizi ne kadar tanıyor?">
        <Card>
          <View style={styles.rowBetween}><T variant="bodyStrong">Zevk netliği</T><T variant="h3" color="accent">%{netlik.yuzde}</T></View>
          <View style={{ marginTop: Spacing.sm }}><ProgressLine value={netlik.yuzde} /></View>
          <T variant="small" color="muted" style={{ marginTop: Spacing.sm }}>{netlik.sonrakiAdim ?? 'Sizi çok iyi tanıyoruz; öneriler tamamen kişisel.'}</T>
        </Card>
      </Section>

      <Modal visible={shareOpen} transparent animationType="fade" onRequestClose={() => setShareOpen(false)}>
        <View style={[styles.backdrop, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.lg }]}>
          <ReportCard ref={cardRef} rapor={rapor} width={cardWidth} isim={preferences.userName} />
          <View style={[styles.rowGap, { width: cardWidth }]}>
            <Button label="Kapat" variant="secondary" onPress={() => setShareOpen(false)} style={{ flex: 1 }} />
            <Button label="Paylaş" icon="share-outline" variant="accent" onPress={share} loading={busy} style={{ flex: 2 }} />
          </View>
        </View>
      </Modal>
      <PaywallScreen visible={paywallVisible} onClose={() => setPaywallVisible(false)} title="Koku raporunuzun tamamı" />
    </Screen>
  );
}

function Insight({ icon, baslik, deger, bos }: { icon: any; baslik: string; deger: string | null; bos: string }) {
  const c = useTheme();
  return (
    <View style={styles.insight}>
      <Ionicons name={icon} size={18} color={deger ? c.accent : c.inkSubtle} />
      <View style={{ flex: 1 }}>
        <T variant="small" color="subtle">{baslik}</T>
        <T variant={deger ? 'bodyStrong' : 'small'} color={deger ? 'ink' : 'muted'}>{deger ?? bos}</T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowGap: { flexDirection: 'row', gap: Spacing.md },
  insight: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  seasons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  season: { width: '48.5%', alignItems: 'center', gap: 6, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: StyleSheet.hairlineWidth },
  backdrop: { flex: 1, backgroundColor: 'rgba(12,10,9,0.94)', alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
});
