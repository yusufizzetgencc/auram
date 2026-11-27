/**
 * TENİNDE — Katmanlama
 * Bir taban parfüm seçin; kendi dolabınızdan (favoriler + koleksiyonlar) veya tüm katalogdan uyumlu eşler önerilir.
 */
import { Card, EmptyState, Header, Screen, Segmented, T, useTheme } from '@/components/kit';
import { Bottle, MatchBadge, PerfumeRow } from '@/components/kit/perfume';
import { PerfumePicker } from '@/components/kit/PerfumePicker';
import { LockedFeatureOverlay, PaywallScreen } from '@/components/paywall';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { getLayeringSuggestions } from '@/engine';
import { usePremiumGate } from '@/hooks/use-premium-gate';
import { Parfum } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

const FREE_SUGGESTIONS = 1;
const TIPS = [
  'Önce yoğun olanı (taban), birkaç dakika sonra hafif olanı sıkın.',
  'Her birinden normal dozun yarısını kullanın.',
  'Farklı bölgelere sıkmak (ör. bilek ve boyun) daha kontrollü bir karışım verir.',
];

export default function LayeringScreen() {
  const router = useRouter();
  const c = useTheme();
  const { parfumler, favorites, collections } = useApp();
  const { isPremium, paywallVisible, setPaywallVisible } = usePremiumGate();
  const [base, setBase] = useState<Parfum | null>(null);
  const [source, setSource] = useState<'dolap' | 'katalog'>('dolap');
  const [picker, setPicker] = useState(false);

  const owned = useMemo(() => {
    const ids = new Set([...favorites, ...collections.flatMap(col => col.parfumIds)]);
    return parfumler.filter(p => ids.has(p.id));
  }, [parfumler, favorites, collections]);

  const suggestions = useMemo(
    () => (base ? getLayeringSuggestions(base, source === 'dolap' ? owned : parfumler) : []),
    [base, source, owned, parfumler],
  );

  return (
    <Screen>
      <Header title="Katmanlama" />
      <T variant="h1" style={{ marginTop: Spacing.lg }}>İki parfümden tek bir imza</T>
      <T variant="body" color="muted" style={{ marginTop: Spacing.sm }}>Bir taban seçin; birlikte uyumlu duracak eşleri önerelim.</T>

      <Pressable onPress={() => setPicker(true)} style={[styles.base, { backgroundColor: base ? c.surface : c.surfaceAlt, borderColor: c.border }]}>
        {base ? (
          <>
            <Bottle parfum={base} size={48} />
            <View style={{ flex: 1 }}>
              <T variant="overline" color="accent">Taban</T>
              <T variant="h3">{base.isim}</T>
              <T variant="small" color="muted">{base.marka} · {base.tip}</T>
            </View>
            <T variant="smallStrong" color="accent">Değiştir</T>
          </>
        ) : (
          <>
            <Ionicons name="add-circle-outline" size={26} color={c.accent} />
            <T variant="h3" style={{ flex: 1 }}>Taban parfümü seçin</T>
          </>
        )}
      </Pressable>

      {base ? (
        <>
          <View style={{ marginTop: Spacing.xl }}>
            <Segmented value={source} onChange={setSource} options={[{ value: 'dolap', label: `Dolabımdan · ${owned.length}` }, { value: 'katalog', label: 'Tüm katalog' }]} />
          </View>
          {suggestions.length === 0 ? (
            <EmptyState
              icon="layers-outline"
              title={source === 'dolap' ? 'Dolabınızda uygun eş yok' : 'Uygun eş bulunamadı'}
              body={source === 'dolap' ? 'Favori veya koleksiyonlarınıza parfüm ekledikçe öneriler burada çıkar. Tüm katalogda da arayabilirsiniz.' : undefined}
              actionLabel={source === 'dolap' ? 'Tüm katalogda ara' : undefined}
              onAction={() => setSource('katalog')}
            />
          ) : (
            <View style={{ marginTop: Spacing.md }}>
              {suggestions.map((s, i) => {
                const row = (
                  <View>
                    <PerfumeRow parfum={s.parfum} onPress={() => router.push(`/parfum/${s.parfum.id}`)} subtitle={s.reasons[0]} right={<MatchBadge value={s.score} />} />
                    <T variant="small" color="muted" style={{ marginTop: -Spacing.sm, marginBottom: Spacing.md, marginLeft: 72 }}>
                      Sıra: önce {s.order[0].isim}, sonra {s.order[1].isim}
                    </T>
                  </View>
                );
                return !isPremium && i >= FREE_SUGGESTIONS
                  ? <LockedFeatureOverlay key={s.parfum.id} compact onUnlock={() => setPaywallVisible(true)}>{row}</LockedFeatureOverlay>
                  : <View key={s.parfum.id}>{row}</View>;
              })}
            </View>
          )}
        </>
      ) : null}

      <Card tone="alt" style={{ marginTop: Spacing.xl }}>
        <T variant="overline" color="accent">Nasıl katmanlanır?</T>
        {TIPS.map(t => <T key={t} variant="body" style={{ marginTop: Spacing.sm }}>• {t}</T>)}
      </Card>

      <PerfumePicker visible={picker} onClose={() => setPicker(false)} title="Taban parfüm" onSelect={setBase} />
      <PaywallScreen visible={paywallVisible} onClose={() => setPaywallVisible(false)} title="Tüm katmanlama önerileri" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.xl, padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: StyleSheet.hairlineWidth },
});
