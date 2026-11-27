/**
 * TENİNDE — Karşılaştır (seçim + sonuç tek ekranda)
 * İki parfüm seçilince karşılaştırma açılır. Ücretsiz kullanıcının ömür boyu FREE_COMPARE_COUNT hakkı vardır.
 */
import { Button, Card, Divider, FamilyDot, Header, Screen, T, useTheme } from '@/components/kit';
import { Bottle, brandCaps } from '@/components/kit/perfume';
import { PerfumePicker } from '@/components/kit/PerfumePicker';
import { PaywallScreen } from '@/components/paywall';
import { FREE_COMPARE_COUNT } from '@/constants/premiumLimits';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { getEffectivePH, skorlaParfum } from '@/engine';
import { usePremiumGate } from '@/hooks/use-premium-gate';
import { getCompareCount, incrementCompareCount } from '@/services/storage';
import { Parfum } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

const YOG = { hafif: 1, orta: 2, yogun: 3 } as const;
const KAL = { kisa: 1, orta: 2, uzun: 3 } as const;
const LBL_Y = ['', 'Hafif', 'Orta', 'Yoğun'];
const LBL_K = ['', 'Kısa', 'Orta', 'Uzun'];

export default function CompareScreen() {
  const router = useRouter();
  const c = useTheme();
  const params = useLocalSearchParams<{ a?: string; b?: string }>();
  const { parfumler, preferences, zevk, etkinPrefs } = useApp();
  const { isPremium, paywallVisible, setPaywallVisible } = usePremiumGate();
  const [a, setA] = useState<Parfum | undefined>(() => parfumler.find(p => p.id === params.a));
  const [b, setB] = useState<Parfum | undefined>(() => parfumler.find(p => p.id === params.b));
  const [picking, setPicking] = useState<'a' | 'b' | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [used, setUsed] = useState(0);

  useEffect(() => { getCompareCount().then(setUsed); }, []);

  // İki parfüm seçildiğinde hakkı tüket (aynı çift için bir kez)
  useEffect(() => {
    if (!a || !b) { setUnlocked(false); return; }
    if (isPremium) { setUnlocked(true); return; }
    (async () => {
      const n = await incrementCompareCount();
      setUsed(n);
      if (n > FREE_COMPARE_COUNT) { setUnlocked(false); setPaywallVisible(true); }
      else setUnlocked(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a?.id, b?.id, isPremium]);

  const ph = useMemo(() => getEffectivePH(preferences), [preferences]);
  const ra = a ? skorlaParfum(a, etkinPrefs, ph, zevk) : null;
  const rb = b ? skorlaParfum(b, etkinPrefs, ph, zevk) : null;

  const Slot = ({ p, which }: { p?: Parfum; which: 'a' | 'b' }) => (
    <Pressable onPress={() => setPicking(which)} style={[styles.slot, { backgroundColor: p ? c.surface : c.surfaceAlt, borderColor: c.border }]}>
      {p ? (
        <>
          <Bottle parfum={p} size={60} />
          <T variant="overline" caps={brandCaps(p)} color="subtle" numberOfLines={1} style={{ marginTop: Spacing.sm }}>{p.marka}</T>
          <T variant="bodyStrong" numberOfLines={1} align="center">{p.isim}</T>
          <T variant="small" color="accent" style={{ marginTop: 4 }}>Değiştir</T>
        </>
      ) : (
        <>
          <Ionicons name="add" size={28} color={c.accent} />
          <T variant="smallStrong" style={{ marginTop: Spacing.sm }}>Parfüm seçin</T>
        </>
      )}
    </Pressable>
  );

  const Row = ({ label, va, vb, better }: { label: string; va: string; vb: string; better?: 'a' | 'b' | null }) => (
    <View>
      <T variant="overline" color="subtle" align="center">{label}</T>
      <View style={styles.cmpRow}>
        <T variant="h3" align="center" style={[{ flex: 1 }, better === 'a' && { color: c.accent }]}>{va}</T>
        <View style={[styles.vs, { backgroundColor: c.border }]} />
        <T variant="h3" align="center" style={[{ flex: 1 }, better === 'b' && { color: c.accent }]}>{vb}</T>
      </View>
    </View>
  );

  const pick = (x: number, y: number) => (x === y ? null : x > y ? 'a' : 'b');
  const shared = a && b ? [...a.notalar.ust, ...a.notalar.orta, ...a.notalar.alt].filter(n => [...b.notalar.ust, ...b.notalar.orta, ...b.notalar.alt].includes(n)) : [];

  return (
    <Screen>
      <Header title="Karşılaştır" />
      <View style={styles.slots}>
        <Slot p={a} which="a" />
        <Slot p={b} which="b" />
      </View>
      {!isPremium ? (
        <T variant="small" color="subtle" align="center" style={{ marginTop: Spacing.sm }}>
          {Math.max(0, FREE_COMPARE_COUNT - used)} ücretsiz karşılaştırma hakkınız kaldı
        </T>
      ) : null}

      {a && b && ra && rb && unlocked ? (
        <>
          <Card style={{ marginTop: Spacing.xl, gap: Spacing.lg }}>
            <Row label="Teninize uyum" va={`%${ra.matchPercentage}`} vb={`%${rb.matchPercentage}`} better={pick(ra.matchPercentage, rb.matchPercentage)} />
            <Divider />
            <Row label="Ten kimyası" va={`%${ra.phSkor.phUyumSkoru}`} vb={`%${rb.phSkor.phUyumSkoru}`} better={pick(ra.phSkor.phUyumSkoru, rb.phSkor.phUyumSkoru)} />
            <Divider />
            <Row label="Teninizdeki performans" va={`%${ra.phSkor.toplamPerformans}`} vb={`%${rb.phSkor.toplamPerformans}`} better={pick(ra.phSkor.toplamPerformans, rb.phSkor.toplamPerformans)} />
            <Divider />
            <Row label="Kalıcılık" va={LBL_K[KAL[a.kalicilik]]} vb={LBL_K[KAL[b.kalicilik]]} />
            <Divider />
            <Row label="Yoğunluk" va={LBL_Y[YOG[a.yogunluk]]} vb={LBL_Y[YOG[b.yogunluk]]} />
          </Card>

          <Card style={{ marginTop: Spacing.md }}>
            <T variant="overline" color="subtle">Koku aileleri</T>
            <View style={styles.cmpRow}>
              <View style={[styles.inline, { flex: 1, justifyContent: 'center' }]}><FamilyDot family={a.tip} /><T variant="body">{a.tip}</T></View>
              <View style={[styles.vs, { backgroundColor: c.border }]} />
              <View style={[styles.inline, { flex: 1, justifyContent: 'center' }]}><FamilyDot family={b.tip} /><T variant="body">{b.tip}</T></View>
            </View>
            <Divider style={{ marginVertical: Spacing.md }} />
            <T variant="overline" color="subtle">Ortak notalar</T>
            <T variant="body" style={{ marginTop: 4, textTransform: 'capitalize' }}>{shared.length ? shared.join(' · ') : 'Ortak nota yok — birbirinden çok farklılar.'}</T>
          </Card>

          <Card tone="accent" style={{ marginTop: Spacing.md }}>
            <T variant="overline" color="accent">Teninize göre</T>
            <T variant="body" style={{ marginTop: 4 }}>
              {ra.matchPercentage === rb.matchPercentage
                ? 'İkisi de teninize eşit uyumlu; karar zevkinize kalmış.'
                : `${ra.matchPercentage > rb.matchPercentage ? a.isim : b.isim} size daha uygun. ${(ra.matchPercentage > rb.matchPercentage ? ra : rb).matchReasons[0]}`}
            </T>
          </Card>

          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg }}>
            <Button label={a.isim} variant="secondary" size="sm" onPress={() => router.push(`/parfum/${a.id}`)} style={{ flex: 1 }} />
            <Button label={b.isim} variant="secondary" size="sm" onPress={() => router.push(`/parfum/${b.id}`)} style={{ flex: 1 }} />
          </View>
        </>
      ) : a && b && !unlocked && !isPremium ? (
        <Card style={{ marginTop: Spacing.xl }} onPress={() => setPaywallVisible(true)}>
          <T variant="h3">Ücretsiz karşılaştırma hakkınız doldu</T>
          <T variant="body" color="muted" style={{ marginTop: 4 }}>Premium ile sınırsız karşılaştırın.</T>
        </Card>
      ) : (
        <T variant="body" color="muted" align="center" style={{ marginTop: Spacing.xl }}>İki parfüm seçin; teninize uyum, performans ve notaları yan yana görün.</T>
      )}

      <PerfumePicker
        visible={!!picking}
        onClose={() => setPicking(null)}
        excludeIds={[a?.id, b?.id].filter(Boolean) as string[]}
        onSelect={p => (picking === 'a' ? setA(p) : setB(p))}
      />
      <PaywallScreen visible={paywallVisible} onClose={() => setPaywallVisible(false)} title="Sınırsız karşılaştırma" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  slots: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  slot: { flex: 1, height: 190, borderRadius: BorderRadius.lg, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', padding: Spacing.md },
  cmpRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  vs: { width: StyleSheet.hairlineWidth, height: 24 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
