/**
 * TENİNDE — Hediye Asistanı
 * Alıcı için geçici bir profil kurulur ve ana öneri motoru bu profille çalıştırılır.
 */
import { trLower, trUpper } from '@/utils/text';
import { Button, Card, Header, IconButton, OptionCard, Screen, T, useTheme } from '@/components/kit';
import { MatchBadge, PerfumeRow } from '@/components/kit/perfume';
import { LockedFeatureOverlay, PaywallScreen } from '@/components/paywall';
import { Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { buildTemporaryProfile, getRecommendationsPure } from '@/engine';
import { usePremiumGate } from '@/hooks/use-premium-gate';
import { Aura, Butce, CiltTipi, CinsiyetAlgisi, KullanimAmaci, TerlemeOrani, UserPreferences } from '@/types';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

type Opt<V> = { v: V; l: string; h?: string; i: any };

const KIME: Opt<CinsiyetAlgisi>[] = [
  { v: 'feminen', l: 'Bir kadına', h: 'Anne, sevgili, arkadaş…', i: 'female-outline' },
  { v: 'maskulen', l: 'Bir erkeğe', h: 'Baba, sevgili, arkadaş…', i: 'male-outline' },
  { v: 'farketmez', l: 'Fark etmez / bilmiyorum', h: 'Unisex seçenekler de dahil', i: 'male-female-outline' },
];
const DURUM: Opt<KullanimAmaci[]>[] = [
  { v: ['romantik'], l: 'Romantik bir an', h: 'Yıldönümü, sevgililer günü', i: 'heart-outline' },
  { v: ['ozel'], l: 'Doğum günü / özel gün', i: 'gift-outline' },
  { v: ['is'], l: 'İş ortamı', h: 'Meslektaş, yönetici', i: 'briefcase-outline' },
  { v: ['gunluk'], l: 'Her gün kullanacağı bir koku', i: 'sunny-outline' },
  { v: ['aksam'], l: 'Akşam ve gece için', i: 'moon-outline' },
];
const TARZ: Opt<Aura>[] = [
  { v: 'temiz', l: 'Sade ve zarif', h: 'Minimal, temiz giyinir', i: 'water-outline' },
  { v: 'gizemli', l: 'Derin ve gizemli', h: 'Sakin, düşünceli', i: 'moon-outline' },
  { v: 'cekici', l: 'Romantik ve çekici', h: 'Sıcak, sosyal', i: 'heart-outline' },
  { v: 'dinamik', l: 'Enerjik ve sportif', h: 'Hareketli, neşeli', i: 'flash-outline' },
  { v: 'otoriter', l: 'Klasik ve güçlü', h: 'Şık, otoriter', i: 'shield-outline' },
];
const BUTCE: Opt<Butce>[] = [
  { v: 'ekonomik', l: 'Uygun fiyatlı', i: 'pricetag-outline' },
  { v: 'orta', l: 'Orta segment', i: 'pricetags-outline' },
  { v: 'premium', l: 'Premium', i: 'diamond-outline' },
  { v: 'luks', l: 'Niş ve lüks', i: 'star-outline' },
];
const TEN: Opt<CiltTipi | null>[] = [
  { v: 'kuru', l: 'Kuru tenli', i: 'sunny-outline' },
  { v: 'karma', l: 'Normal tenli', i: 'partly-sunny-outline' },
  { v: 'yagli', l: 'Yağlı tenli', i: 'water-outline' },
  { v: null, l: 'Bilmiyorum', i: 'help-circle-outline' },
];
const TER: Opt<TerlemeOrani | null>[] = [
  { v: 'az', l: 'Az terler', i: 'leaf-outline' },
  { v: 'normal', l: 'Ortalama', i: 'walk-outline' },
  { v: 'cok', l: 'Çok terler', i: 'water-outline' },
  { v: null, l: 'Bilmiyorum', i: 'help-circle-outline' },
];

const STEPS = [
  { key: 'kime', title: 'Hediye kime?', opts: KIME },
  { key: 'durum', title: 'Hangi vesileyle?', opts: DURUM },
  { key: 'tarz', title: 'Tarzını en iyi ne anlatır?', opts: TARZ },
  { key: 'butce', title: 'Bütçeniz?', opts: BUTCE },
  { key: 'ten', title: 'Teni nasıl? (biliyorsanız)', opts: TEN },
  { key: 'ter', title: 'Ne kadar terler? (biliyorsanız)', opts: TER },
] as const;

export default function GiftScreen() {
  const router = useRouter();
  const c = useTheme();
  const { parfumler } = useApp();
  const { isPremium, paywallVisible, setPaywallVisible } = usePremiumGate();
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<Record<string, any>>({});

  const done = step >= STEPS.length;
  const pick = (key: string, v: any) => { setAns(a => ({ ...a, [key]: v })); setTimeout(() => setStep(s => s + 1), 180); };

  const results = useMemo(() => {
    if (!done) return [];
    const p: UserPreferences = {
      ...buildTemporaryProfile(ans.ten ?? null, ans.ter ?? null, null),
      cinsiyetAlgisi: ans.kime,
      kullanimAmaci: ans.durum,
      aura: ans.tarz,
      butceTercihi: ans.butce,
    };
    return getRecommendationsPure(parfumler, p, undefined, 6);
  }, [done, ans, parfumler]);

  const tarzLabel = trLower(TARZ.find(t => t.v === ans.tarz)?.l ?? '');

  return (
    <Screen>
      <Header title="Hediye Asistanı" right={step > 0 ? <IconButton name="refresh" onPress={() => { setStep(0); setAns({}); }} accessibilityLabel="Baştan" /> : undefined} />
      {!done ? (
        <View>
          <T variant="overline" color="accent" style={{ marginTop: Spacing.lg }}>Adım {step + 1} / {STEPS.length}</T>
          <View style={{ flexDirection: 'row', gap: 4, marginTop: Spacing.sm }}>
            {STEPS.map((_, i) => <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= step ? c.accent : c.border }} />)}
          </View>
          <T variant="h1" style={{ marginTop: Spacing.xl }}>{STEPS[step].title}</T>
          <View style={{ marginTop: Spacing.xl, gap: Spacing.sm }}>
            {(STEPS[step].opts as readonly Opt<any>[]).map(o => (
              <OptionCard key={o.l} title={o.l} subtitle={o.h} icon={o.i} selected={JSON.stringify(ans[STEPS[step].key]) === JSON.stringify(o.v)} onPress={() => pick(STEPS[step].key, o.v)} />
            ))}
          </View>
          {step > 0 ? <Button label="Geri" variant="ghost" icon="chevron-back" onPress={() => setStep(s => s - 1)} style={{ marginTop: Spacing.lg }} /> : null}
        </View>
      ) : (
        <View>
          <T variant="h1" style={{ marginTop: Spacing.lg }}>Önerilerimiz</T>
          <T variant="body" color="muted" style={{ marginTop: Spacing.sm }}>{tarzLabel ? `${trUpper(tarzLabel.charAt(0)) + tarzLabel.slice(1)} bir tarz için, ` : ''}bütçenize uygun seçenekler.</T>
          {results.length === 0 ? (
            <Card style={{ marginTop: Spacing.xl }}><T variant="body">Bu kriterlere uyan parfüm bulamadık. Bütçeyi veya tarzı değiştirmeyi deneyin.</T></Card>
          ) : (
            <View style={{ marginTop: Spacing.md }}>
              {results.map((r, i) => {
                const row = <PerfumeRow parfum={r.parfum} onPress={() => router.push(`/parfum/${r.parfum.id}`)} subtitle={`${r.parfum.tip} · ${r.parfum.kalicilik === 'uzun' ? 'uzun kalıcı' : 'dengeli kalıcılık'}`} right={<MatchBadge value={r.matchPercentage} />} />;
                return !isPremium && i >= 1
                  ? <LockedFeatureOverlay key={r.parfum.id} compact onUnlock={() => setPaywallVisible(true)}>{row}</LockedFeatureOverlay>
                  : <View key={r.parfum.id}>{row}</View>;
              })}
            </View>
          )}
          <Card tone="alt" style={{ marginTop: Spacing.xl }}>
            <T variant="small" color="muted">Hediye parfümde güvenli seçim: alıcının ten tipini bilmiyorsanız orta yoğunlukta ve unisex seçenekler daha az risklidir. Mümkünse hediye fişi isteyin.</T>
          </Card>
        </View>
      )}
      <PaywallScreen visible={paywallVisible} onClose={() => setPaywallVisible(false)} title="Tüm hediye önerileri" />
    </Screen>
  );
}
