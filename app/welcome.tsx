/**
 * TENİNDE — Tanıtım (3 sayfa)
 */
import { Button, T, useTheme } from '@/components/kit';
import { Monogram, Wordmark } from '@/components/kit/brand';
import { Bottle, brandCaps } from '@/components/kit/perfume';
import { QUESTIONS } from '@/constants/questions';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAGES = [
  {
    overline: 'Teninde',
    title: 'Aynı parfüm,\niki farklı ten.',
    body: 'Bir parfüm herkeste aynı kokmaz. Ten yağı, ısısı ve kimyası, şişedeki kokuyu size özel bir şeye dönüştürür.',
  },
  {
    overline: 'Ten profili',
    title: 'Önce teninizi\ntanıyoruz.',
    body: 'Birkaç somut soruyla yağlılık, ten ısısı ve pH eğiliminizi çıkarıyoruz. pH değeri bir tahmindir; ölçtüyseniz kendi değerinizi girebilirsiniz.',
  },
  {
    overline: 'Açıklanabilir öneri',
    title: 'Her önerinin\nbir gerekçesi var.',
    body: '“Serin teniniz bu yoğun parfümü nazikçe açar.” Neden önerdiğimizi her zaman açıkça görürsünüz.',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { parfumler, setCurrentStep } = useApp();
  const [page, setPage] = useState(0);
  const ref = useRef<ScrollView>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  // 1. sayfa: AYNI parfüm iki tende; 3. sayfa: gerekçeyle uyumlu yoğun bir parfüm
  const sameBottle = parfumler.find(p => p.isim === 'Bleu de Chanel') ?? parfumler[0];
  const dense = parfumler.find(p => p.yogunluk === 'yogun' && p.isim === 'Baccarat Rouge 540') ?? parfumler.find(p => p.yogunluk === 'yogun') ?? parfumler[0];
  const sample = [sameBottle, sameBottle, dense].filter(Boolean);

  // Kodla kaydırmada iOS onMomentumScrollEnd tetiklemez; sayfayı burada da güncelle
  const goPage = (i: number) => {
    setPage(i);
    ref.current?.scrollTo({ x: width * i, animated: true });
  };

  const next = () => {
    if (page < PAGES.length - 1) {
      goPage(page + 1);
    } else {
      setCurrentStep(0);
      router.push('/onboarding');
    }
  };

  const art = (i: number) => {
    if (i === 0) {
      return (
        <View style={styles.artRow}>
          {sample.slice(0, 2).map((p, k) => (
            <View key={k} style={[styles.artCard, { backgroundColor: c.surfaceAlt, transform: [{ rotate: k === 0 ? '-6deg' : '6deg' }] }]}>
              <Bottle parfum={p} size={70} />
              <T variant="overline" color="muted" style={{ marginTop: 10 }}>{k === 0 ? 'Ten A' : 'Ten B'}</T>
            </View>
          ))}
        </View>
      );
    }
    if (i === 1) {
      const bars: [string, number][] = [['Yağlılık', 0.7], ['Ten ısısı', 0.45], ['pH eğilimi', 0.35]];
      return (
        <View style={[styles.profileArt, { backgroundColor: c.surface, borderColor: c.border }]}>
          {bars.map(([l, v]) => (
            <View key={l} style={{ marginBottom: 18 }}>
              <T variant="smallStrong" style={{ marginBottom: 8 }}>{l}</T>
              <View style={{ height: 2, backgroundColor: c.border }}>
                <View style={{ position: 'absolute', left: `${v * 100}%`, top: -5, width: 12, height: 12, marginLeft: -6, borderRadius: 6, backgroundColor: c.accent }} />
              </View>
            </View>
          ))}
        </View>
      );
    }
    return (
      <View style={[styles.profileArt, { backgroundColor: c.surface, borderColor: c.border }]}>
        <T variant="overline" caps={brandCaps(sample[2])} color="subtle">{sample[2]?.marka}</T>
        <T variant="h2">{sample[2]?.isim}</T>
        <View style={[styles.quote, { borderLeftColor: c.accent }]}>
          <T variant="body" color="muted">Serin teniniz bu yoğun parfümü nazikçe açacak.</T>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <View style={styles.top}>
        <Wordmark size={22} />
        {page < PAGES.length - 1 ? (
          <T variant="smallStrong" color="muted" onPress={() => goPage(PAGES.length - 1)}>Geç</T>
        ) : null}
      </View>

      <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScroll} style={{ flex: 1 }}>
        {PAGES.map((p, i) => (
          <View key={i} style={{ width, paddingHorizontal: Spacing.xl }}>
            <View style={styles.artArea}>{art(i)}</View>
            <T variant="overline" color="accent">{p.overline}</T>
            <T variant="hero" style={{ marginTop: Spacing.sm }}>{p.title}</T>
            <T variant="body" color="muted" style={{ marginTop: Spacing.md }}>{p.body}</T>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.dots}>
          {PAGES.map((_, i) => (
            <View key={i} style={[styles.dot, { width: i === page ? 22 : 6, backgroundColor: i === page ? c.ink : c.border }]} />
          ))}
        </View>
        <Button label={page === PAGES.length - 1 ? 'Ten profilimi oluştur' : 'Devam'} iconRight="arrow-forward" onPress={next} />
        <View style={styles.meta}>
          <Monogram size={16} />
          <T variant="small" color="subtle">Yaklaşık 3 dakika · {QUESTIONS.filter(q => !q.showIf && !q.onboardingDisi).length} kısa soru · Veriler cihazınızda kalır</T>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, height: 56 },
  artArea: { height: 320, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  artRow: { flexDirection: 'row', gap: Spacing.lg },
  artCard: { width: 130, height: 190, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  profileArt: { width: '100%', padding: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: StyleSheet.hairlineWidth },
  quote: { borderLeftWidth: 2, paddingLeft: Spacing.md, marginTop: Spacing.lg },
  bottom: { paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  dots: { flexDirection: 'row', gap: 6, alignSelf: 'center' },
  dot: { height: 6, borderRadius: 3 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
