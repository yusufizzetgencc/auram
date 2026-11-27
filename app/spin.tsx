/**
 * TENİNDE — Kararsız mısınız? (rastgele seçim)
 * Seçilen kaynaktan (dolabım, favoriler, size uygun olanlar, tüm katalog) rastgele bir parfüm önerir.
 */
import { Button, Card, EmptyState, Header, Screen, Segmented, T, useTheme } from '@/components/kit';
import { Bottle, brandCaps } from '@/components/kit/perfume';
import { PaywallScreen } from '@/components/paywall';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { getRecommendationsPure } from '@/engine';
import { usePremiumGate } from '@/hooks/use-premium-gate';
import { addSpinResult } from '@/services/storage';
import { Parfum } from '@/types';
import { hapticLight, hapticSuccess } from '@/utils/haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, StyleSheet, View } from 'react-native';

type Source = 'dolap' | 'uygun' | 'hepsi';

export default function SpinScreen() {
  const router = useRouter();
  const c = useTheme();
  const { parfumler, favorites, collections, selectTodaysSotd, etkinPrefs } = useApp();
  const { isPremium, paywallVisible, setPaywallVisible } = usePremiumGate();
  const [source, setSource] = useState<Source>('dolap');
  const [current, setCurrent] = useState<Parfum | null>(null);
  const [spinning, setSpinning] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const pool = useMemo(() => {
    if (source === 'dolap') {
      const ids = new Set([...favorites, ...collections.flatMap(x => x.parfumIds)]);
      return parfumler.filter(p => ids.has(p.id));
    }
    if (source === 'uygun') return getRecommendationsPure(parfumler, etkinPrefs, undefined, 12).map(r => r.parfum);
    return parfumler;
  }, [source, parfumler, favorites, collections, etkinPrefs]);

  const spin = () => {
    if (pool.length === 0 || spinning) return;
    // İkinci savunma hattı: ekrana derin bağlantıyla gelinse de seçim Premium ister
    if (!isPremium) { setPaywallVisible(true); return; }
    setSpinning(true);
    let ticks = 0;
    const total = 14 + Math.floor(Math.random() * 6);
    const step = () => {
      ticks += 1;
      setCurrent(pool[Math.floor(Math.random() * pool.length)]);
      hapticLight();
      if (ticks < total) {
        timer.current = setTimeout(step, 50 + ticks * 12);
      } else {
        const final = pool[Math.floor(Math.random() * pool.length)];
        setCurrent(final);
        setSpinning(false);
        hapticSuccess();
        addSpinResult(final.id).catch(() => {});
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.06, duration: 140, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 160, useNativeDriver: true }),
        ]).start();
      }
    };
    step();
  };

  const wear = async () => {
    if (!current) return;
    await selectTodaysSotd(current.id);
    Alert.alert('Kaydedildi', `${current.isim} bugünün kokusu oldu.`);
  };

  return (
    <Screen>
      <Header title="Kararsız mısınız?" />
      <T variant="h1" style={{ marginTop: Spacing.lg }}>Bugünün kokusunu şansa bırakın</T>
      <View style={{ marginTop: Spacing.xl }}>
        <Segmented<Source> value={source} onChange={s => { setSource(s); setCurrent(null); }} options={[{ value: 'dolap', label: 'Dolabım' }, { value: 'uygun', label: 'Bana uygun' }, { value: 'hepsi', label: 'Tümü' }]} />
      </View>

      {pool.length === 0 ? (
        <EmptyState icon="albums-outline" title="Dolabınız boş" body="Favori veya koleksiyon ekleyin ya da 'Bana uygun' kaynağını seçin." actionLabel="Bana uygun olanlardan seç" onAction={() => setSource('uygun')} />
      ) : (
        <>
          <Animated.View style={[styles.stage, { backgroundColor: c.surfaceAlt, transform: [{ scale }] }]}>
            {current ? (
              <>
                <Bottle parfum={current} size={110} />
                <T variant="overline" caps={brandCaps(current)} color="subtle" style={{ marginTop: Spacing.lg }}>{current.marka}</T>
                <T variant="h1" align="center">{current.isim}</T>
                <T variant="small" color="muted">{current.tip}</T>
              </>
            ) : (
              <T variant="body" color="muted" align="center">{pool.length} parfüm arasından seçmek için dokunun.</T>
            )}
          </Animated.View>
          <Button label={spinning ? 'Seçiliyor…' : current ? 'Tekrar seç' : 'Seç'} icon="shuffle" onPress={spin} disabled={spinning} style={{ marginTop: Spacing.xl }} />
          {current && !spinning ? (
            <Card style={{ marginTop: Spacing.md, flexDirection: 'row', gap: Spacing.sm }}>
              <Button label="Bugün bunu sıkacağım" variant="accent" size="sm" onPress={wear} style={{ flex: 1 }} />
              <Button label="Detay" variant="secondary" size="sm" onPress={() => router.push(`/parfum/${current.id}`)} />
            </Card>
          ) : null}
        </>
      )}
      <PaywallScreen visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: { marginTop: Spacing.xl, height: 320, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
});
