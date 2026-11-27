/**
 * TENİNDE — Sonuçlar
 * Ten profili + en uyumlu 5 parfüm (her biri gerekçesiyle) + paylaşılabilir koku kimliği.
 */
import { trLower } from '@/utils/text';
import { Button, Card, Divider, FamilyDot, Screen, T, Tag, useTheme } from '@/components/kit';
import { Bottle, MatchBadge, PerfumeRow, brandCaps } from '@/components/kit/perfume';
import { SkinProfileCard } from '@/components/kit/skin';
import { SearchContextBar } from '@/components/SearchContextBar';
import { PaywallScreen } from '@/components/paywall';
import { ShareIdentityModal } from '@/components/results/ShareIdentityModal';
import { FREE_RESULT_COUNT } from '@/constants/premiumLimits';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { AURA_BASLIK, hesaplaPHPure } from '@/engine';
import { usePremiumGate } from '@/hooks/use-premium-gate';
import { RecommendationResult } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

const YOGUNLUK: Record<string, string> = { hafif: 'Hafif', orta: 'Orta', yogun: 'Yoğun' };

export default function ResultsScreen() {
  const router = useRouter();
  const c = useTheme();
  const { recommendations, getRecommendations, preferences } = useApp();
  const { isPremium, paywallVisible, setPaywallVisible } = usePremiumGate();
  const [shareOpen, setShareOpen] = useState(false);

  const ph = useMemo(() => hesaplaPHPure(preferences), [preferences]);
  const measured = preferences.phInfo.biliyorMu === 'biliyorum' && !!preferences.phInfo.deger;
  const aura = preferences.aura ? AURA_BASLIK[preferences.aura] : 'Kişisel koku imzanız';
  const name = preferences.userName?.trim();

  useEffect(() => {
    if (recommendations.length === 0) getRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [top, ...rest] = recommendations;
  const open = (r: RecommendationResult, locked: boolean) => (locked ? setPaywallVisible(true) : router.push(`/parfum/${r.parfum.id}`));

  return (
    <Screen
      footer={<Button label="Uygulamayı keşfet" iconRight="arrow-forward" onPress={() => router.replace('/(tabs)')} />}
    >
      <View style={{ paddingTop: Spacing.xl }}>
        <T variant="overline" color="accent">Ten profiliniz hazır</T>
        <T variant="hero" style={{ marginTop: Spacing.sm }}>{name ? `${name}, ` : ''}{trLower(aura)} bir iz için seçtiklerimiz</T>
      </View>

      <View style={{ marginTop: Spacing.xl }}>
        <SkinProfileCard
          ph={ph}
          measured={measured}
          measuredValue={preferences.phInfo.deger}
          footer={<Button label="Koku kimliğimi paylaş" icon="share-outline" variant="secondary" size="sm" onPress={() => setShareOpen(true)} style={{ marginTop: Spacing.lg }} />}
        />
      </View>

      {top ? (
        <>
          <SearchContextBar style={{ marginTop: Spacing['2xl'] }} />
          <T variant="overline" color="subtle" style={{ marginTop: Spacing.lg, marginBottom: Spacing.md }}>En uyumlu eşleşmeniz</T>
          <Card onPress={() => open(top, false)} style={{ padding: 0, overflow: 'hidden' }}>
            <View style={[styles.heroArt, { backgroundColor: c.surfaceAlt }]}>
              <Bottle parfum={top.parfum} size={120} />
              <View style={styles.heroBadge}><MatchBadge value={top.matchPercentage} /></View>
            </View>
            <View style={{ padding: Spacing.lg }}>
              <T variant="overline" caps={brandCaps(top.parfum)} color="subtle">{top.parfum.marka}</T>
              <T variant="h1" style={{ marginTop: 2 }}>{top.parfum.isim}</T>
              <View style={styles.tags}>
                <View style={styles.inline}><FamilyDot family={top.parfum.tip} /><T variant="small" color="muted">{top.parfum.tip}</T></View>
                <Tag label={YOGUNLUK[top.parfum.yogunluk]} />
                {(top.parfum.mevsim || []).slice(0, 2).map(m => <Tag key={m} label={m} />)}
              </View>
              <Divider style={{ marginVertical: Spacing.lg }} />
              <T variant="overline" color="accent" style={{ marginBottom: Spacing.sm }}>Neden bu parfüm?</T>
              {top.matchReasons.slice(0, 3).map((r, i) => (
                <View key={i} style={styles.reason}>
                  <View style={[styles.reasonDot, { backgroundColor: c.accent }]} />
                  <T variant="body" style={{ flex: 1 }}>{r}</T>
                </View>
              ))}
              <View style={[styles.inline, { marginTop: Spacing.sm }]}>
                <T variant="smallStrong" color="accent">Nota piramidini gör</T>
                <Ionicons name="arrow-forward" size={14} color={c.accent} />
              </View>
            </View>
          </Card>
        </>
      ) : (
        <Card style={{ marginTop: Spacing['2xl'] }}>
          <T variant="h3">Öneri bulunamadı</T>
          <T variant="body" color="muted" style={{ marginTop: 4 }}>Kırmızı çizgileriniz tüm katalogu eledi. Profilinizden tercihlerinizi gevşetebilirsiniz.</T>
        </Card>
      )}

      {rest.length > 0 ? (
        <View style={{ marginTop: Spacing['2xl'] }}>
          <T variant="h2" style={{ marginBottom: Spacing.sm }}>Diğer eşleşmeler</T>
          {rest.map((r, i) => {
            const locked = !isPremium && i + 1 >= FREE_RESULT_COUNT;
            return (
              <View key={r.parfum.id}>
                <PerfumeRow
                  // Kilitliyken isim/marka hiç gönderilmez (bulanıklık arkasından okunabiliyordu)
                  parfum={locked ? { ...r.parfum, isim: 'Gizli eşleşme', marka: `%${r.matchPercentage} uyum` } : r.parfum}
                  onPress={() => open(r, locked)}
                  subtitle={locked ? 'İsmi ve gerekçeyi görmek için kilidi açın' : r.matchReasons[0]}
                  right={locked ? <Ionicons name="lock-closed" size={18} color={c.inkSubtle} /> : <MatchBadge value={r.matchPercentage} />}
                />
              </View>
            );
          })}
          {!isPremium ? (
            <Card tone="accent" style={{ marginTop: Spacing.lg }} onPress={() => setPaywallVisible(true)}>
              <View style={styles.inline}>
                <Ionicons name="sparkles-outline" size={18} color={c.accent} />
                <T variant="bodyStrong" style={{ flex: 1 }}>Tüm eşleşmeleri ve gerekçeleri aç</T>
                <Ionicons name="chevron-forward" size={18} color={c.accent} />
              </View>
            </Card>
          ) : null}
        </View>
      ) : null}

      <ShareIdentityModal visible={shareOpen} onClose={() => setShareOpen(false)} auraBaslik={aura} ph={ph} olculmus={measured} enIyi={top} isim={name} />
      <PaywallScreen visible={paywallVisible} onClose={() => setPaywallVisible(false)} title="Tüm eşleşmelerinizi açın" subtitle="Kalan önerileri ve neden size uyduklarını görün." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroArt: { height: 220, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg },
  heroBadge: { position: 'absolute', top: Spacing.md, right: Spacing.md },
  tags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reason: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
  reasonDot: { width: 5, height: 5, borderRadius: 3, marginTop: 9 },
});
