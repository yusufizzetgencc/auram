/**
 * TENİNDE — Bugün (ana sayfa) — günlük alışkanlığın merkezi
 *
 * Sade akış — ilk ekranda tek karar:
 *  1. "Bugün ne var?" (iş / buluşma / özel gün / spor / evde / günlük) — yalnızca bugün henüz kayıt yokken
 *  2. Bugün için önerimiz: DOLAPTAN seçim (engine/daily → gununSecimi), hava + etkinlik + ten + çeşitlilik + öğrenilenler.
 *     Dolap boşsa katalogdan seçer ve dolap oluşturmaya davet eder. Kayıt yapılınca "Bugünün kokusu" kartına dönüşür.
 *  3. Tek kart: seri + koruma hakkı (engine/streak) ve bu ayın özeti → aylık rapor
 *  4. Keşfetmeye değer · Size uygun 4 araç (constants/tools → onerilenAraclar, "Tümü" → /tools) · Son baktıklarınız
 */
import { Button, Card, Chip, IconButton, Screen, Section, T, useTheme } from '@/components/kit';
import { ContextQuestion } from '@/components/ProfileCompletion';
import { Bottle, brandCaps, PerfumeTile } from '@/components/kit/perfume';
import { PerfumePicker } from '@/components/kit/PerfumePicker';
import { PaywallScreen } from '@/components/paywall';
import { BorderRadius, Spacing } from '@/constants/theme';
import { onerilenAraclar } from '@/constants/tools';
import { useApp } from '@/context/AppContext';
import { aylikRapor, AY_ADLARI, ETKINLIK_ETIKET, getEffectivePH, gununSecimi, seriDurumu } from '@/engine';
import { usePremiumGate } from '@/hooks/use-premium-gate';
import { track } from '@/services/analytics';
import { getDailyPicks, greeting } from '@/services/dailyRecommendation';
import { loadTodayPlan, saveTodayPlan } from '@/services/storage';
import { fetchWeather, WeatherResult } from '@/services/weather';
import { setWidgetTodayPick, updateWidget } from '@/services/widget';
import { Etkinlik } from '@/types';
import { toLocalDateKey } from '@/utils/date';
import { hapticLight, hapticSuccess } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

const formatDate = (d = new Date()) => d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
const ETKINLIKLER: Etkinlik[] = ['gunluk', 'is', 'bulusma', 'ozel', 'spor', 'ev'];

export default function TodayScreen() {
  const router = useRouter();
  const c = useTheme();
  const {
    parfumler, preferences, favorites, todaySotd, streakData, sotdHistory, performanceLogs,
    selectTodaysSotd, getParfumById, getRecentlyViewedParfums, wardrobeParfums, zevk, recordSkip } = useApp();
  const { isPremium, requirePremium, paywallVisible, setPaywallVisible } = usePremiumGate();
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [etkinlik, setEtkinlik] = useState<Etkinlik>('gunluk');
  // "Başka" ile geçilenler (kimlikle tutulur: geçilen parfümün puanı düştüğü için sıra değişse de atlama olmaz)
  const [gecilen, setGecilen] = useState<string[]>([]);

  const load = useCallback(async () => setWeather(await fetchWeather()), []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadTodayPlan().then(p => p && setEtkinlik(p.etkinlik)); }, []);

  const w = weather?.ok ? weather.data : null;
  const bugun = toLocalDateKey();
  const dolaptan = wardrobeParfums.length > 0;

  // Günün seçimi: dolap varsa dolaptan, yoksa katalogdan
  const secimler = useMemo(() => {
    const adaylar = dolaptan ? wardrobeParfums : parfumler.slice();
    return gununSecimi({
      adaylar,
      prefs: preferences,
      ph: getEffectivePH(preferences),
      etkinlik,
      hava: w ? { sicaklik: w.temperature, nem: w.humidity } : null,
      gecmis: sotdHistory.map(s => ({ parfumId: s.parfumId, date: s.date })),
      zevk: zevk,
      dolaptan,
    }).slice(0, dolaptan ? Math.min(5, wardrobeParfums.length) : 5);
  }, [dolaptan, wardrobeParfums, parfumler, preferences, etkinlik, w, sotdHistory, zevk]);

  useEffect(() => { setGecilen([]); }, [etkinlik, dolaptan]);
  const kalan = secimler.filter(s => !gecilen.includes(s.parfum.id));
  const oneri = kalan[0] ?? secimler[0] ?? null;
  const baska = () => {
    if (!oneri) return;
    hapticLight();
    recordSkip(oneri.parfum.id, etkinlik); // öğrenen motor için zayıf olumsuz sinyal
    // Hepsi geçildiyse baştan başla
    setGecilen(g => (kalan.length <= 1 ? [] : [...g, oneri.parfum.id]));
  };

  // Widget, Bugün ekranında gösterilen öneriyi göstersin (hava + etkinlik + "Başka" dahil)
  useEffect(() => {
    setWidgetTodayPick(oneri ? { parfum: oneri.parfum, gerekce: oneri.gerekceler[0] ?? 'Teninize ve gününüze göre seçildi.' } : null, bugun);
    updateWidget({
      prefs: preferences,
      ph: getEffectivePH(preferences),
      dolap: wardrobeParfums,
      katalog: parfumler,
      zevk: zevk,
      gecmis: sotdHistory.map(s => ({ parfumId: s.parfumId, date: s.date })),
      seri: streakData.currentStreak,
      seriTarih: streakData.lastSOTDDate,
    });
  }, [oneri, bugun, preferences, wardrobeParfums, parfumler, sotdHistory, streakData, zevk]);

  const picks = useMemo(() => getDailyPicks(parfumler, preferences, favorites, w, 3), [parfumler, preferences, favorites, w]);
  const sotd = todaySotd ? getParfumById(todaySotd.parfumId) : undefined;
  const recent = getRecentlyViewedParfums().slice(0, 8);
  const name = preferences.userName?.trim();
  const seri = seriDurumu(streakData, bugun);
  const hak = streakData.korumaYenilenme ? (streakData.korumaHakki ?? 0) : 1;

  const now = new Date();
  const araclar = onerilenAraclar({
    dolapDolu: dolaptan,
    bugunKayitVar: !!todaySotd,
    saat: now.getHours(),
    ayinGunu: now.getDate(),
    ayGunSayisi: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
  });
  const rapor = useMemo(
    () => aylikRapor(now.getFullYear(), now.getMonth() + 1, sotdHistory.map(s => ({ parfumId: s.parfumId, date: s.date })), performanceLogs, parfumler),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sotdHistory, performanceLogs, parfumler],
  );

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const chooseEtkinlik = (e: Etkinlik) => {
    hapticLight();
    setEtkinlik(e);
    saveTodayPlan(e);
    track('today_plan', { etkinlik: e });
  };

  const wear = async (parfumId: string, kaynak: string) => {
    const { korumaKullanildi } = await selectTodaysSotd(parfumId, w ? { temp: w.temperature, condition: w.condition, city: w.city } : undefined, etkinlik);
    hapticSuccess();
    track('sotd_logged', { kaynak, dolaptan });
    if (korumaKullanildi) Alert.alert('Seriniz korundu', 'Dün kayıt yoktu; haftalık seri koruma hakkınız kullanıldı. Hakkınız pazartesi yenilenir.');
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />}>
      {/* Başlık */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <T variant="overline" color="subtle">{formatDate()}{w ? ` · ${w.temperature}°C` : ''}</T>
          <T variant="h1" style={{ marginTop: 4 }}>{greeting()}{name ? `, ${name}` : ''}</T>
        </View>
        <IconButton name="chatbubble-ellipses-outline" filled onPress={() => router.push('/advisor')} accessibilityLabel="Koku Danışmanı" />
      </View>

      {/* Hava alınamadıysa tek satır */}
      {w === null && weather && !weather.ok ? (
        <Pressable onPress={load} style={[styles.inline, { marginTop: Spacing.sm }]} hitSlop={8}>
          <Ionicons name={weather.reason === 'permission' ? 'location-outline' : 'cloud-offline-outline'} size={14} color={c.inkSubtle} />
          <T variant="small" color="subtle">{weather.reason === 'permission' ? 'Havaya göre öneri için konum izni verin' : 'Hava alınamadı · yenilemek için dokunun'}</T>
        </Pressable>
      ) : null}

      {/* Bugün ne var? — karar verildiyse (bugün kayıt varsa) gizlenir */}
      {!sotd ? (
        <>
          <T variant="overline" color="subtle" style={{ marginTop: Spacing.xl }}>Bugün ne var?</T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, { paddingHorizontal: Spacing.lg }]} style={{ marginHorizontal: -Spacing.lg }}>
            {ETKINLIKLER.map(e => (
              <Chip key={e} label={ETKINLIK_ETIKET[e].label} icon={ETKINLIK_ETIKET[e].icon as any} selected={etkinlik === e} onPress={() => chooseEtkinlik(e)} />
            ))}
          </ScrollView>
        </>
      ) : null}

      {/* Bugün için önerimiz / bugünün kokusu */}
      {sotd ? (
        <Card style={{ marginTop: Spacing.lg }} onPress={() => router.push(`/parfum/${sotd.id}`)}>
          <View style={styles.row}>
            <View style={[styles.sotdArt, { backgroundColor: c.surfaceAlt }]}><Bottle parfum={sotd} size={46} /></View>
            <View style={{ flex: 1 }}>
              <View style={styles.inline}><Ionicons name="checkmark-circle" size={14} color={c.accent} /><T variant="overline" color="accent">Bugünün kokusu</T></View>
              <T variant="overline" caps={brandCaps(sotd)} color="subtle" style={{ marginTop: 4 }}>{sotd.marka}</T>
              <T variant="h3" numberOfLines={1}>{sotd.isim}</T>
            </View>
          </View>
          <View style={[styles.actions, { borderTopColor: c.border }]}>
            <Pressable onPress={() => setPickerOpen(true)} hitSlop={8}><T variant="smallStrong" color="accent">Değiştir</T></Pressable>
            <Pressable onPress={() => requirePremium(() => router.push('/diary'))} hitSlop={8} style={styles.inline}>
              <Ionicons name="moon-outline" size={14} color={c.inkMuted} />
              <T variant="smallStrong" color="muted">Akşam: teninizde ne kadar kaldı?</T>
            </Pressable>
          </View>
        </Card>
      ) : null}
      {/* Kayıt yapıldığı an doğru an: "nereye sıktınız?" profili tamamlar */}
      {sotd ? (
        <ContextQuestion id="uygulama" title="Parfümü genelde nereye sıkıyorsunuz?" style={{ marginTop: Spacing.sm }} />
      ) : oneri ? (
        <Card style={{ marginTop: Spacing.lg }}>
          <T variant="overline" color="accent">{dolaptan ? 'Dolabınızdan bugün için' : 'Bugün için önerimiz'}</T>
          <Pressable onPress={() => router.push(`/parfum/${oneri.parfum.id}`)} style={[styles.row, { marginTop: Spacing.md }]}>
            <View style={[styles.heroArt, { backgroundColor: c.surfaceAlt }]}><Bottle parfum={oneri.parfum} size={64} /></View>
            <View style={{ flex: 1 }}>
              <T variant="overline" caps={brandCaps(oneri.parfum)} color="subtle">{oneri.parfum.marka}</T>
              <T variant="h2" numberOfLines={2}>{oneri.parfum.isim}</T>
              <T variant="small" color="muted">%{oneri.puan} bugüne uygun</T>
            </View>
          </Pressable>
          <View style={{ marginTop: Spacing.md, gap: 6 }}>
            {oneri.gerekceler.map(g => (
              <View key={g} style={styles.reason}><View style={[styles.dot, { backgroundColor: c.accent }]} /><T variant="body" style={{ flex: 1 }}>{g}</T></View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg }}>
            <Button label="Bunu sıkacağım" icon="checkmark" onPress={() => wear(oneri.parfum.id, dolaptan ? 'oneri_dolap' : 'oneri_katalog')} style={{ flex: 1 }} />
            {secimler.length > 1 ? <Button label="Başka" icon="refresh" variant="secondary" onPress={baska} /> : null}
          </View>
          <Pressable onPress={() => setPickerOpen(true)} hitSlop={8} style={{ marginTop: Spacing.md, alignSelf: 'center' }}>
            <T variant="smallStrong" color="muted">Başka bir parfüm sıktım</T>
          </Pressable>
          {!dolaptan ? (
            <Pressable onPress={() => router.push({ pathname: '/(tabs)/favorites', params: { sekme: 'dolap' } })} style={[styles.invite, { backgroundColor: c.accentSoft }]}>
              <Ionicons name="file-tray-stacked-outline" size={18} color={c.accent} />
              <T variant="small" style={{ flex: 1 }}>Dolabınızı oluşturun; öneriler sahip olduğunuz parfümlerden gelsin.</T>
              <Ionicons name="chevron-forward" size={16} color={c.accent} />
            </Pressable>
          ) : null}
        </Card>
      ) : null}

      {/* Seri + bu ayın özeti (tek kart) */}
      <Card tone="alt" style={{ marginTop: Spacing.md }}>
        <View style={styles.row}>
          <View style={[styles.streak, { borderColor: c.accent }]}><T variant="h3" color="accent">{seri.gunler}</T></View>
          <View style={{ flex: 1 }}>
            <T variant="bodyStrong">{seri.gunler ? `${seri.gunler} günlük seri` : 'Seri başlatın'}</T>
            <T variant="small" color="muted">
              {todaySotd
                ? `Bugün kaydedildi · en uzun ${streakData.longestStreak} gün`
                : seri.kurtarilabilir
                  ? 'Dün kayıt yoktu; bugün kaydederseniz koruma hakkınız serinizi kurtarır.'
                  : seri.riskte
                    ? 'Bugün kaydetmezseniz seri sıfırlanır.'
                    : 'Her gün ne sıktığınızı kaydedin.'}
            </T>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Ionicons name={hak > 0 ? 'shield-checkmark-outline' : 'shield-outline'} size={20} color={hak > 0 ? c.accent : c.inkSubtle} />
            <T variant="small" color="subtle">{hak} hak</T>
          </View>
        </View>
        {rapor.toplamGun > 0 ? (
          <Pressable onPress={() => router.push('/report')} style={[styles.month, { borderTopColor: c.border }]}>
            <Ionicons name="analytics-outline" size={16} color={c.accent} />
            <T variant="small" style={{ flex: 1 }} numberOfLines={1}>
              {AY_ADLARI[now.getMonth()]}: {rapor.toplamGun} gün, {rapor.farkliParfum} parfüm{rapor.enCok[0] ? ` · en çok ${rapor.enCok[0].parfum.isim}` : ''}
            </T>
            <T variant="smallStrong" color="accent">Rapor</T>
          </Pressable>
        ) : null}
      </Card>

      {/* Keşfetmeye değer (katalog) */}
      <Section title={dolaptan ? 'Keşfetmeye değer' : 'Bugün için seçtiklerimiz'} action="Tümü" onAction={() => router.push('/(tabs)/parfums')}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md, paddingHorizontal: Spacing.lg }} style={{ marginHorizontal: -Spacing.lg }}>
          {picks.map(p => (
            <View key={p.parfum.id} style={{ width: 160 }}>
              <PerfumeTile parfum={p.parfum} width={160} badge={`%${p.matchPercentage}`} onPress={() => router.push(`/parfum/${p.parfum.id}`)} />
              <T variant="small" color="muted" numberOfLines={2} style={{ marginTop: 4 }}>{p.todayReason}</T>
            </View>
          ))}
        </ScrollView>
      </Section>

      {/* Size uygun araçlar (en fazla 4) */}
      <Section title="Araçlar" action="Tümü" onAction={() => router.push('/tools')}>
        <View style={styles.grid}>
          {araclar.map(t => (
            <Pressable
              key={t.id}
              onPress={() => (t.premium ? requirePremium(() => router.push(t.route as any)) : router.push(t.route as any))}
              style={({ pressed }) => [styles.tool, { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.8 : 1 }]}
            >
              <View style={styles.toolTop}>
                <Ionicons name={t.icon} size={22} color={c.ink} />
                {t.premium && !isPremium ? <Ionicons name="lock-closed" size={13} color={c.inkSubtle} /> : null}
              </View>
              <T variant="bodyStrong" style={{ marginTop: Spacing.md }}>{t.title}</T>
              <T variant="small" color="muted" numberOfLines={2}>{t.desc}</T>
            </Pressable>
          ))}
        </View>
      </Section>

      {/* Son bakılanlar */}
      {recent.length > 0 ? (
        <Section title="Son baktıklarınız">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md }}>
            {recent.map(p => <PerfumeTile key={p.id} parfum={p} width={120} onPress={() => router.push(`/parfum/${p.id}`)} />)}
          </ScrollView>
        </Section>
      ) : null}

      <PerfumePicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Bugün ne sıktınız?"
        onSelect={p => wear(p.id, 'secici')}
      />
      <PaywallScreen visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: Spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chips: { gap: Spacing.sm, marginTop: Spacing.sm },
  sotdArt: { width: 56, height: 64, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  heroArt: { width: 84, height: 96, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  reason: { flexDirection: 'row', gap: Spacing.md },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 9 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  invite: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg, padding: Spacing.md, borderRadius: BorderRadius.md },
  month: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  streak: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tool: { width: '48.8%', padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: StyleSheet.hairlineWidth },
  toolTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
});
