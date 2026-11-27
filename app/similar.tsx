/**
 * TENİNDE — Benzerini bul
 * "Bunu seviyorum, benzerini bul": kullanıcı bildiği bir parfümü seçer; nota + aile yapısı en yakın parfümler
 * ve daha uygun fiyatlı benzerleri listelenir (engine/similarity.ts). "Muadil" iddiası yoktur.
 * Ücretsiz kullanıcı ilk BENZER_UCRETSIZ sonucu açık görür, gerisi kilitlidir.
 */
import { Button, Card, EmptyState, Header, Screen, Section, T, useTheme } from '@/components/kit';
import { Bottle, brandCaps, PerfumeRow } from '@/components/kit/perfume';
import { PerfumePicker } from '@/components/kit/PerfumePicker';
import { LockedFeatureOverlay, PaywallScreen } from '@/components/paywall';
import { FREE_SIMILAR_COUNT } from '@/constants/premiumLimits';
import { FIYAT_KADEMESI } from '@/constants/shopping';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { benzerParfumler } from '@/engine';
import { usePremiumGate } from '@/hooks/use-premium-gate';
import { Parfum } from '@/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export default function SimilarScreen() {
  const router = useRouter();
  const c = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const { parfumler, preferences, setPreference } = useApp();
  const { isPremium, paywallVisible, setPaywallVisible } = usePremiumGate();
  const [base, setBase] = useState<Parfum | undefined>(() => parfumler.find(p => p.id === params.id));
  const [picking, setPicking] = useState(false);

  const similar = useMemo(() => (base ? benzerParfumler(base, parfumler, { limit: 10 }) : []), [base, parfumler]);
  const cheaper = useMemo(() => (base ? benzerParfumler(base, parfumler, { limit: 6, dahaUygun: true }) : []), [base, parfumler]);

  const loved = !!base && (preferences.sevilenParfumler ?? []).includes(base.id);
  const markLoved = () => {
    if (!base || loved) return;
    setPreference('sevilenParfumler', [...(preferences.sevilenParfumler ?? []), base.id]);
    setPreference('sevilmeyenParfumler', (preferences.sevilmeyenParfumler ?? []).filter(x => x !== base.id));
  };

  const row = (p: Parfum, pct: number, sub: string, locked: boolean) => {
    const r = <PerfumeRow parfum={p} subtitle={sub} onPress={() => router.push(`/parfum/${p.id}`)} right={<T variant="smallStrong" color="accent">%{pct}</T>} />;
    return locked ? <LockedFeatureOverlay key={p.id} compact onUnlock={() => setPaywallVisible(true)}>{r}</LockedFeatureOverlay> : <View key={p.id}>{r}</View>;
  };

  return (
    <Screen>
      <Header title="Benzerini bul" />
      <T variant="h1" style={{ marginTop: Spacing.lg }}>Sevdiğiniz parfümden yola çıkın</T>
      <T variant="body" color="muted" style={{ marginTop: Spacing.sm }}>Bildiğiniz bir parfümü seçin; notaları ve karakteri ona en yakın olanları gösterelim.</T>

      <Pressable onPress={() => setPicking(true)} style={[styles.base, { backgroundColor: base ? c.surface : c.surfaceAlt, borderColor: c.border }]}>
        {base ? (
          <>
            <Bottle parfum={base} size={56} />
            <View style={{ flex: 1 }}>
              <T variant="overline" caps={brandCaps(base)} color="subtle">{base.marka}</T>
              <T variant="h3">{base.isim}</T>
              <T variant="small" color="muted">{base.tip}{base.ikincilTip ? ` · ${base.ikincilTip}` : ''}</T>
            </View>
            <T variant="smallStrong" color="accent">Değiştir</T>
          </>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', paddingVertical: Spacing.lg }}>
            <T variant="bodyStrong">Parfüm seçin</T>
            <T variant="small" color="muted">Örn. şu an kullandığınız parfüm</T>
          </View>
        )}
      </Pressable>

      {base ? (
        <>
          {!loved ? (
            <Button label="Bunu seviyorum — önerilerime yansıt" icon="heart-outline" variant="secondary" size="sm" onPress={markLoved} style={{ marginTop: Spacing.md }} />
          ) : (
            <T variant="small" color="accent" style={{ marginTop: Spacing.md }}>Sevdikleriniz arasında; önerileriniz buna göre kişiselleşiyor.</T>
          )}

          <Section title="En çok benzeyenler">
            {similar.length ? (
              <Card style={{ paddingVertical: 0 }}>
                {similar.map((s, i) => row(s.parfum, Math.round(s.benzerlik * 100), s.ortakNotalar.length ? `Ortak: ${s.ortakNotalar.slice(0, 3).join(', ')}` : s.parfum.tip, !isPremium && i >= FREE_SIMILAR_COUNT))}
              </Card>
            ) : (
              <EmptyState icon="search-outline" title="Yakın bir parfüm bulamadık" body="Bu parfümün yapısı katalogdakilerden oldukça farklı." />
            )}
          </Section>

          {cheaper.length ? (
            <Section title="Daha uygun fiyatlı benzerleri">
              <Card style={{ paddingVertical: 0 }}>
                {cheaper.map((s, i) => row(s.parfum, Math.round(s.benzerlik * 100), s.parfum.fiyatAraligi ? `${FIYAT_KADEMESI[s.parfum.fiyatAraligi].label} · ${FIYAT_KADEMESI[s.parfum.fiyatAraligi].yaklasik}` : s.parfum.tip, !isPremium && i >= FREE_SIMILAR_COUNT))}
              </Card>
            </Section>
          ) : null}

          <T variant="small" color="subtle" style={{ marginTop: Spacing.md }}>
            Benzerlik; ortak notalar, koku ailesi, yoğunluk ve profilden hesaplanır. Aynı koku olduğu anlamına gelmez — tende denemenizi öneririz.
          </T>
        </>
      ) : null}

      <PerfumePicker visible={picking} onClose={() => setPicking(false)} onSelect={p => setBase(p)} title="Hangi parfümü seviyorsunuz?" />
      <PaywallScreen visible={paywallVisible} onClose={() => setPaywallVisible(false)} title="Tüm benzer parfümler" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.xl, padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: StyleSheet.hairlineWidth },
});
