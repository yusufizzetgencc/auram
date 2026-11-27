/**
 * TENİNDE — Analiz / reklam ara ekranı
 * Ücretsiz kullanıcıya önerilerden önce ödüllü reklam gösterilir; premium kullanıcı doğrudan sonuçlara gider.
 */
import { T, useTheme } from '@/components/kit';
import { Monogram } from '@/components/kit/brand';
import { Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { adService } from '@/services/adService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, View } from 'react-native';

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
const waitUntil = (cond: () => boolean, timeout: number, step = 250) =>
  new Promise<void>(resolve => {
    let t = 0;
    const id = setInterval(() => {
      t += step;
      if (cond() || t >= timeout) { clearInterval(id); resolve(); }
    }, step);
  });

export default function AdLoadingScreen() {
  const router = useRouter();
  const c = useTheme();
  const { isPremium } = useSubscription();
  const { parfumler } = useApp();
  const [done, setDone] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;

  const STEPS = [
    'Ten profiliniz hesaplanıyor',
    `${parfumler.length} parfüm teninize göre puanlanıyor`,
    'Kırmızı çizgileriniz uygulanıyor',
    'Gerekçeler hazırlanıyor',
  ];

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.06, duration: 900, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
    ]));
    loop.start();
    const id = setInterval(() => setDone(d => Math.min(d + 1, STEPS.length)), 750);
    return () => { loop.stop(); clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (isPremium) {
        await wait(2600); // analiz animasyonunu tamamlasın
        if (alive) router.replace('/results');
        return;
      }
      await waitUntil(() => adService.isTrackingPermissionHandled(), 5000);
      if (!alive) return;
      adService.preloadAd();
      await wait(2000);
      await waitUntil(() => adService.isAdReady(), 8000, 300);
      if (!alive) return;
      await adService.showRewardedAd();
      if (alive) router.replace('/results');
    })();
    return () => { alive = false; };
  }, [isPremium, router]);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Monogram size={88} />
      </Animated.View>
      <T variant="h1" align="center" style={{ marginTop: Spacing['2xl'] }}>Profiliniz hazırlanıyor</T>
      <T variant="body" color="muted" align="center" style={{ marginTop: Spacing.sm }}>Bu birkaç saniye sürer.</T>

      <View style={styles.list}>
        {STEPS.map((s, i) => {
          const finished = i < done;
          const active = i === done;
          return (
            <View key={s} style={styles.row}>
              <View style={[styles.mark, { borderColor: finished ? c.accent : c.border, backgroundColor: finished ? c.accent : 'transparent' }]}>
                {finished ? <Ionicons name="checkmark" size={12} color={c.onAccent} /> : active ? <ActivityIndicator size="small" color={c.accent} style={{ transform: [{ scale: 0.6 }] }} /> : null}
              </View>
              <T variant="body" color={finished || active ? 'ink' : 'subtle'}>{s}</T>
            </View>
          );
        })}
      </View>

      {!isPremium ? (
        <T variant="small" color="subtle" align="center" style={styles.note}>
          Önerileriniz kısa bir reklamdan sonra açılacak. Premium ile reklamsız.
        </T>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  list: { marginTop: Spacing['2xl'], gap: Spacing.md, alignSelf: 'stretch', paddingHorizontal: Spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  mark: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  note: { position: 'absolute', bottom: 48, left: Spacing.xl, right: Spacing.xl },
});
