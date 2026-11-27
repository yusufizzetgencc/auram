/**
 * TENİNDE — Profil: yalnızca "siz"
 * ten profili · zevkiniz (netlik + sevdikleriniz + öğrenilenler) · tercihleriniz · kısa istatistik.
 * Bildirimler, üyelik, veri, destek ve yasal bağlantılar → sağ üstteki dişli: /settings
 */
import { Button, Card, Chip, Divider, IconButton, IconName, ListRow, PageTitle, ProgressLine, Screen, Section, Stat, T } from '@/components/kit';
import { ProfileCompletionCard } from '@/components/ProfileCompletion';
import { QuestionSheet, SheetDeger } from '@/components/QuestionSheet';
import { SkinProfileCard } from '@/components/kit/skin';
import { PaywallScreen } from '@/components/paywall';
import { ShareIdentityModal } from '@/components/results/ShareIdentityModal';
import { QUESTIONS } from '@/constants/questions';
import { Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { AURA_BASLIK, hesaplaPHPure, zevkNetligi } from '@/engine';
import { UserPreferences } from '@/types';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

const label = (questionId: string, value?: string | null) =>
  QUESTIONS.find(q => q.id === questionId)?.options?.find(o => o.value === value)?.label;

/** Tek tek düzenlenebilen tercihler: 20 soruyu baştan yapmadan yalnızca birini değiştirmek için */
const DUZENLENEBILIR: { soru: string; alan: keyof UserPreferences; baslik: string; icon: IconName }[] = [
  { soru: 'amac', alan: 'kullanimAmaci', baslik: 'Kullanım amacı', icon: 'briefcase-outline' },
  { soru: 'ortam', alan: 'ortam', baslik: 'Ortam', icon: 'business-outline' },
  { soru: 'yogunluk', alan: 'konsantrasyonTercihi', baslik: 'Yoğunluk', icon: 'radio-button-on-outline' },
  { soru: 'aura', alan: 'aura', baslik: 'Bırakmak istediğiniz iz', icon: 'sparkles-outline' },
  { soru: 'butce', alan: 'butceTercihi', baslik: 'Bütçe', icon: 'pricetag-outline' },
  { soru: 'hassasiyet', alan: 'kokuAlmaHassasiyeti', baslik: 'Koku hassasiyeti', icon: 'volume-medium-outline' },
  { soru: 'cinsiyet', alan: 'cinsiyetAlgisi', baslik: 'Parfüm profili', icon: 'male-female-outline' },
];

const degerEtiketi = (soru: string, v: unknown): string => {
  if (Array.isArray(v)) return v.length ? v.map(x => label(soru, x) ?? x).join(', ') : 'Seçilmedi';
  return (typeof v === 'string' && label(soru, v)?.split(',')[0]) || 'Seçilmedi';
};

export default function ProfileScreen() {
  const router = useRouter();
  const {
    preferences, recommendations, favorites, streakData, sotdHistory, performanceLogs, wardrobe,
    setCurrentStep, getParfumById, ogrenme, setPreference } = useApp();
  const { isPremium } = useSubscription();
  const [paywall, setPaywall] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [duzenle, setDuzenle] = useState<(typeof DUZENLENEBILIR)[number] | null>(null);

  const netlik = zevkNetligi(preferences, performanceLogs.length);
  const ph = useMemo(() => hesaplaPHPure(preferences), [preferences]);
  const measured = preferences.phInfo.biliyorMu === 'biliyorum' && !!preferences.phInfo.deger;
  const name = preferences.userName?.trim();
  const aura = preferences.aura ? AURA_BASLIK[preferences.aura] : 'Kişisel koku imzası';
  const loved = (preferences.sevilenParfumler ?? []).map(id => getParfumById(id)).filter(Boolean);
  const redo = () => { setCurrentStep(0); router.push({ pathname: '/onboarding', params: { yeniden: '1' } }); };

  return (
    <Screen>
      <PageTitle
        overline={isPremium ? 'Premium üye' : undefined}
        title={name || 'Profiliniz'}
        subtitle={aura}
        right={<IconButton name="settings-outline" onPress={() => router.push('/settings')} accessibilityLabel="Ayarlar" />}
      />

      <SkinProfileCard
        ph={ph}
        measured={measured}
        measuredValue={preferences.phInfo.deger}
        showAxes
        footer={
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg }}>
            <Button label="Güncelle" icon="create-outline" variant="secondary" size="sm" onPress={redo} style={{ flex: 1 }} />
            <Button label="Paylaş" icon="share-outline" variant="secondary" size="sm" onPress={() => setShareOpen(true)} style={{ flex: 1 }} />
          </View>
        }
      />
      {recommendations.length > 0 ? (
        <Button label="Önerilerimi gör" iconRight="arrow-forward" onPress={() => router.push('/results')} style={{ marginTop: Spacing.md }} />
      ) : null}
      <ProfileCompletionCard style={{ marginTop: Spacing.md }} />

      <Section title="Zevkiniz">
        <Card>
          <View style={styles.between}>
            <T variant="bodyStrong">Sizi ne kadar tanıyoruz?</T>
            <T variant="h3" color="accent">%{netlik.yuzde}</T>
          </View>
          <View style={{ marginTop: Spacing.sm }}><ProgressLine value={netlik.yuzde} /></View>
          {netlik.sonrakiAdim ? <T variant="small" color="muted" style={{ marginTop: Spacing.sm }}>Sonraki adım: {netlik.sonrakiAdim}</T> : null}
          {loved.length ? (
            <>
              <T variant="overline" color="subtle" style={{ marginTop: Spacing.lg }}>Sevdikleriniz</T>
              <View style={styles.chips}>{loved.map(p => <Chip key={p!.id} label={p!.isim} icon="heart-outline" onPress={() => router.push(`/parfum/${p!.id}`)} />)}</View>
            </>
          ) : null}
          <Divider style={{ marginTop: Spacing.lg }} />
          <ListRow
            icon="sparkles-outline"
            title="Sizden öğrendiklerim"
            subtitle={ogrenme.tespitler.length ? ogrenme.tespitler[0].metin : 'Kayıtlarınızdan teninize ve zevkinize dair öğrenilenler'}
            onPress={() => router.push('/learned')}
          />
        </Card>
      </Section>

      <Section title="Tercihleriniz" action="Güncelle" onAction={redo}>
        <Card>
          <T variant="overline" color="subtle">Sevdiğiniz aileler</T>
          <View style={styles.chips}>
            {preferences.kokuTipleri.length ? preferences.kokuTipleri.map(f => <Chip key={f} label={f} />) : <T variant="small" color="muted">Seçilmedi</T>}
          </View>
          {preferences.kacinilacakNotalar.length ? (
            <>
              <T variant="overline" color="subtle" style={{ marginTop: Spacing.md }}>Kaçındıklarınız</T>
              <View style={styles.chips}>{preferences.kacinilacakNotalar.map(f => <Chip key={f} label={f} />)}</View>
            </>
          ) : null}
          <Divider style={{ marginTop: Spacing.md }} />
          {DUZENLENEBILIR.map(d => (
            <ListRow key={d.soru} icon={d.icon} title={d.baslik} subtitle={degerEtiketi(d.soru, preferences[d.alan])} onPress={() => setDuzenle(d)} />
          ))}
          <T variant="small" color="subtle" style={{ marginTop: Spacing.sm }}>
            Tek bir cevabı değiştirmek için dokunun. Mevsim sorulmaz; öneriler bugünün mevsimine göre gelir.
          </T>
        </Card>
        {duzenle ? (
          <QuestionSheet
            soruId={duzenle.soru}
            visible
            value={(preferences[duzenle.alan] ?? null) as SheetDeger}
            onClose={() => setDuzenle(null)}
            onApply={v => { if (v != null) setPreference(duzenle.alan, v as never); }}
            footerNote="Kaydettiğiniz an önerileriniz yeniden sıralanır."
          />
        ) : null}
      </Section>

      <Card tone="alt" style={{ marginTop: Spacing.xl }}>
        <View style={{ flexDirection: 'row' }}>
          <Stat label="Seri" value={`${streakData.currentStreak}`} hint={`en uzun ${streakData.longestStreak}`} />
          <Stat label="Kayıt" value={`${sotdHistory.length}`} hint="gün" />
          <Stat label="Dolap" value={`${wardrobe.length}`} hint={`${favorites.length} favori`} />
        </View>
      </Card>

      {!isPremium ? (
        <Card style={{ marginTop: Spacing.md, paddingVertical: Spacing.sm }}>
          <ListRow icon="sparkles-outline" title="Premium'a geçin" subtitle="Tüm eşleşmeler, araçlar ve reklamsız deneyim" onPress={() => setPaywall(true)} />
        </Card>
      ) : null}

      <ShareIdentityModal visible={shareOpen} onClose={() => setShareOpen(false)} auraBaslik={aura} ph={ph} olculmus={measured} enIyi={recommendations[0]} isim={name} />
      <PaywallScreen visible={paywall} onClose={() => setPaywall(false)} />
    </Screen>
  );
}

const styles = {
  chips: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: Spacing.sm, marginTop: Spacing.sm },
  between: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
};
