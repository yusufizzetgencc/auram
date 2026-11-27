/**
 * TENİNDE — Ruh hali
 * Seçilen hisse göre ana motor, aile ve aura tercihleri geçici olarak değiştirilerek çalıştırılır.
 * Ten profili ve kırmızı çizgiler korunur.
 */
import { Card, Header, Screen, T, useTheme } from '@/components/kit';
import { MatchBadge, PerfumeRow } from '@/components/kit/perfume';
import { LockedFeatureOverlay, PaywallScreen } from '@/components/paywall';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { getRecommendationsPure } from '@/engine';
import { usePremiumGate } from '@/hooks/use-premium-gate';
import { addMoodEntry, getTodaysMood } from '@/services/storage';
import { Aura, KokuTipi, MoodType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

const MOODS: { mood: MoodType; label: string; hint: string; icon: any; families: KokuTipi[]; aura: Aura }[] = [
  { mood: 'enerjik', label: 'Enerjik', hint: 'Canlı, harekete hazır', icon: 'flash-outline', families: ['Ferah', 'Aquatik', 'Meyvemsi'], aura: 'dinamik' },
  { mood: 'sakin', label: 'Sakin', hint: 'Yavaş, huzurlu bir gün', icon: 'leaf-outline', families: ['Yeşil', 'Odunsu', 'Pudralı'], aura: 'temiz' },
  { mood: 'profesyonel', label: 'Odaklı', hint: 'Toplantılar, iş günü', icon: 'briefcase-outline', families: ['Odunsu', 'Ferah', 'Pudralı'], aura: 'otoriter' },
  { mood: 'romantik', label: 'Romantik', hint: 'Yakınlık ve sıcaklık', icon: 'heart-outline', families: ['Çiçeksi', 'Tatlı', 'Amber'], aura: 'cekici' },
  { mood: 'gizemli', label: 'Gizemli', hint: 'Akşam, derinlik', icon: 'moon-outline', families: ['Oryantal', 'Amber', 'Baharatlı'], aura: 'gizemli' },
  { mood: 'cesur', label: 'Cesur', hint: 'Dikkat çekmek istiyorum', icon: 'flame-outline', families: ['Baharatlı', 'Deri', 'Oryantal'], aura: 'otoriter' },
  { mood: 'mutlu', label: 'Neşeli', hint: 'Hafif, güler yüzlü', icon: 'happy-outline', families: ['Meyvemsi', 'Çiçeksi', 'Ferah'], aura: 'dinamik' },
  { mood: 'rahat', label: 'Rahat', hint: 'Ev, hafta sonu', icon: 'cafe-outline', families: ['Pudralı', 'Tatlı', 'Yeşil'], aura: 'temiz' },
];

export default function MoodScreen() {
  const router = useRouter();
  const c = useTheme();
  const { parfumler, etkinPrefs } = useApp();
  const { isPremium, paywallVisible, setPaywallVisible } = usePremiumGate();
  const [mood, setMood] = useState<MoodType | null>(null);

  useEffect(() => { getTodaysMood().then(e => e && setMood(e.mood)); }, []);

  const selected = MOODS.find(m => m.mood === mood);
  const recs = useMemo(() => {
    if (!selected) return [];
    return getRecommendationsPure(parfumler, { ...etkinPrefs, kokuTipleri: selected.families, aura: selected.aura }, undefined, 5);
  }, [selected, parfumler, etkinPrefs]);

  const choose = (m: MoodType) => {
    setMood(m);
    addMoodEntry({ mood: m, date: new Date().toISOString() }).catch(() => {});
  };

  return (
    <Screen>
      <Header title="Ruh hali" />
      <T variant="h1" style={{ marginTop: Spacing.lg }}>Bugün nasıl hissediyorsunuz?</T>
      <T variant="body" color="muted" style={{ marginTop: Spacing.sm }}>Hissinize uyan aileleri, teninize uyanlar arasından seçelim.</T>

      <View style={styles.grid}>
        {MOODS.map(m => {
          const on = mood === m.mood;
          return (
            <Pressable
              key={m.mood}
              onPress={() => choose(m.mood)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={({ pressed }) => [styles.tile, { backgroundColor: on ? c.accentSoft : c.surface, borderColor: on ? c.accent : c.border, opacity: pressed ? 0.8 : 1 }]}
            >
              <Ionicons name={m.icon} size={20} color={on ? c.accent : c.ink} />
              <View style={{ flex: 1 }}>
                <T variant="bodyStrong">{m.label}</T>
                <T variant="small" color="muted" numberOfLines={1}>{m.hint}</T>
              </View>
            </Pressable>
          );
        })}
      </View>

      {selected ? (
        <View style={{ marginTop: Spacing['2xl'] }}>
          <T variant="h2">{selected.label} bir gün için</T>
          <T variant="small" color="muted" style={{ marginTop: 4 }}>{selected.families.join(' · ')}</T>
          <View style={{ marginTop: Spacing.sm }}>
            {recs.map((r, i) => {
              const row = <PerfumeRow parfum={r.parfum} onPress={() => router.push(`/parfum/${r.parfum.id}`)} subtitle={r.matchReasons[0]} right={<MatchBadge value={r.matchPercentage} />} />;
              return !isPremium && i >= 1
                ? <LockedFeatureOverlay key={r.parfum.id} compact onUnlock={() => setPaywallVisible(true)}>{row}</LockedFeatureOverlay>
                : <View key={r.parfum.id}>{row}</View>;
            })}
          </View>
          {recs.length === 0 ? <Card><T variant="body" color="muted">Kırmızı çizgileriniz nedeniyle bu his için uygun parfüm kalmadı.</T></Card> : null}
        </View>
      ) : null}
      <PaywallScreen visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xl },
  tile: { width: '48.5%', flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1 },
});
