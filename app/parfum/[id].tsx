/**
 * TENİNDE — Parfüm detayı
 * Sade düzen: sabit üst bar (geri · ad · favori · "⋯" menüsü; kaydırınca kaybolmaz) · uyum + en güçlü 2 gerekçe +
 * TEK ana eylem (dolapta değilse "Dolabıma ekle", dolaptaysa "Bugün bunu sıktım") · Denediniz mi? (tek satır) · nota piramidi (tek kart) · Karakter ve Nereden alınır
 * (açılır-kapanır) · benzerleri (Benzer / Daha uygun sekmeli tek liste)
 * Ücretsiz kullanıcı FREE_PARFUM_DETAIL_LIMIT kadar farklı parfüm görebilir; görülenler her zaman açık kalır.
 */
import { Button, Card, Divider, EmptyState, FamilyDot, Header, IconButton, IconName, ListRow, ProgressLine, Screen, Section, Segmented, Stat, T, Tag, useTheme } from '@/components/kit';
import { Bottle, MatchBadge, PerfumeTile, brandCaps } from '@/components/kit/perfume';
import { LockedFeatureOverlay, PaywallScreen } from '@/components/paywall';
import { FREE_COLLECTION_LIMIT, FREE_COLLECTION_PARFUM_LIMIT, FREE_FAVORITE_LIMIT, FREE_PARFUM_DETAIL_LIMIT } from '@/constants/premiumLimits';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { benzerParfumler, getEffectivePH, skorlaParfum } from '@/engine';
import { usePremiumGate } from '@/hooks/use-premium-gate';
import { notaAciklamasi } from '@/constants/noteGlossary';
import { FIYAT_KADEMESI, sampleQuery, STORES, storeUrl } from '@/constants/shopping';
import { addFreeViewedParfumId, getFreeViewedParfumIds, getTryList, saveTryList, TryItem } from '@/services/storage';
import * as WebBrowser from 'expo-web-browser';
import { WardrobeItemSheet } from '@/components/wardrobe/WardrobeItemSheet';
import { track } from '@/services/analytics';
import { hapticSuccess } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const KONS: Record<string, string> = { eau_fraiche: 'Eau Fraîche', eau_de_cologne: 'Eau de Cologne', eau_de_toilette: 'Eau de Toilette', eau_de_parfum: 'Eau de Parfum', parfum: 'Parfum' };
const PROFIL: Record<string, string> = { erkek: 'Maskülen', kadın: 'Feminen', unisex: 'Unisex' };
const YOG: Record<string, string> = { hafif: 'Hafif', orta: 'Orta', yogun: 'Yoğun' };
const KAL: Record<string, string> = { kisa: 'Kısa', orta: 'Orta', uzun: 'Uzun' };
const FIYAT: Record<string, string> = { ekonomik: 'Uygun', orta: 'Orta segment', premium: 'Premium', luks: 'Niş / lüks' };
const AMAC: Record<string, string> = { gunluk: 'Günlük', is: 'İş', aksam: 'Akşam', ozel: 'Özel gün', romantik: 'Romantik', spor: 'Spor' };

export default function PerfumeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const {
    parfumler, preferences, favorites, isFavorite, toggleFavoriteParfum, addToRecentlyViewedList,
    collections, addParfumToCollection, removeParfumFromCollection, createNewCollection, selectTodaysSotd, todaySotd, setPreference, wardrobe, addToWardrobe, updateWardrobeItem, removeFromWardrobe, zevk, etkinPrefs } = useApp();
  const { isPremium, paywallVisible, setPaywallVisible } = usePremiumGate();
  const [access, setAccess] = useState<'checking' | 'allowed' | 'locked'>('checking');
  const [colOpen, setColOpen] = useState(false);
  const [newCol, setNewCol] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [baslikGorunur, setBaslikGorunur] = useState(false);
  const [acik, setAcik] = useState<{ karakter: boolean; alis: boolean; aciklama: boolean }>({ karakter: false, alis: false, aciklama: false });
  const [benzerSekme, setBenzerSekme] = useState<'benzer' | 'uygun'>('benzer');

  const parfum = useMemo(() => parfumler.find(p => p.id === id), [id, parfumler]);
  const result = useMemo(() => (parfum ? skorlaParfum(parfum, etkinPrefs, getEffectivePH(preferences), zevk) : null), [parfum, preferences, etkinPrefs, zevk]);
  // Nota + aile benzerliği (engine/similarity.ts). "Daha uygun" = daha düşük fiyat kademesindekiler.
  const similar = useMemo(() => (parfum ? benzerParfumler(parfum, parfumler, { limit: 8 }) : []), [parfum, parfumler]);
  const cheaper = useMemo(() => (parfum ? benzerParfumler(parfum, parfumler, { limit: 6, dahaUygun: true }) : []), [parfum, parfumler]);
  const [tryList, setTryList] = useState<TryItem[]>([]);
  const [wardrobeSheet, setWardrobeSheet] = useState(false);
  useEffect(() => { getTryList().then(setTryList); }, []);

  useEffect(() => {
    let alive = true;
    if (!parfum) return;
    if (isPremium) { setAccess('allowed'); return; }
    (async () => {
      const seen = await getFreeViewedParfumIds();
      if (!alive) return;
      if (seen.includes(parfum.id)) return setAccess('allowed');
      if (seen.length < FREE_PARFUM_DETAIL_LIMIT) {
        await addFreeViewedParfumId(parfum.id);
        if (alive) setAccess('allowed');
      } else setAccess('locked');
    })();
    return () => { alive = false; };
  }, [parfum, isPremium]);

  useEffect(() => {
    if (parfum && access === 'allowed') addToRecentlyViewedList(parfum.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parfum?.id, access]);

  if (!parfum || !result) {
    return (
      <Screen>
        <Header />
        <EmptyState icon="alert-circle-outline" title="Parfüm bulunamadı" body="Bu parfüm katalogdan kaldırılmış olabilir." actionLabel="Keşfet'e dön" onAction={() => router.replace('/(tabs)/parfums')} />
      </Screen>
    );
  }

  const fav = isFavorite(parfum.id);
  const toggleFav = () => {
    if (!fav && !isPremium && favorites.length >= FREE_FAVORITE_LIMIT) return setPaywallVisible(true);
    toggleFavoriteParfum(parfum.id);
  };
  const share = () => Share.share({ message: `${parfum.marka} ${parfum.isim} — Teninde'de teninize uyumunu görün.` });
  const wearToday = async () => {
    const { korumaKullanildi } = await selectTodaysSotd(parfum.id);
    hapticSuccess();
    track('sotd_logged', { kaynak: 'detay', dolaptan: !!wardrobeItem });
    Alert.alert('Kaydedildi', `${parfum.isim} bugünün kokusu olarak kaydedildi.${korumaKullanildi ? ' Dün kayıt yoktu; seri koruma hakkınız serinizi korudu.' : ''}`);
  };
  const toggleInCollection = (colId: string, inside: boolean, count: number) => {
    if (inside) return removeParfumFromCollection(colId, parfum.id);
    if (!isPremium && count >= FREE_COLLECTION_PARFUM_LIMIT) { setColOpen(false); return setPaywallVisible(true); }
    addParfumToCollection(colId, parfum.id);
  };

  const createAndAdd = async () => {
    const name = newCol.trim();
    if (!name) return;
    if (!isPremium && collections.length >= FREE_COLLECTION_LIMIT) { setColOpen(false); return setPaywallVisible(true); }
    const col = await createNewCollection(name, 'albums-outline', '#A8642A');
    await addParfumToCollection(col.id, parfum.id);
    setNewCol('');
  };

  // Deneyim geri bildirimi: sevdim / sevmedim → öneriler bu bilgiye göre kişiselleşir
  const loved = (preferences.sevilenParfumler ?? []).includes(parfum.id);
  const disliked = (preferences.sevilmeyenParfumler ?? []).includes(parfum.id);
  const setVerdict = (v: 'sevdim' | 'sevmedim') => {
    const sev = (preferences.sevilenParfumler ?? []).filter(x => x !== parfum.id);
    const sevme = (preferences.sevilmeyenParfumler ?? []).filter(x => x !== parfum.id);
    const already = v === 'sevdim' ? loved : disliked;
    setPreference('sevilenParfumler', !already && v === 'sevdim' ? [...sev, parfum.id] : sev);
    setPreference('sevilmeyenParfumler', !already && v === 'sevmedim' ? [...sevme, parfum.id] : sevme);
    hapticSuccess();
  };

  const wardrobeItem = wardrobe.find(w => w.parfumId === parfum.id) ?? null;
  const inTryList = tryList.some(t => t.parfumId === parfum.id);
  const toggleTry = async () => {
    const next = inTryList ? tryList.filter(t => t.parfumId !== parfum.id) : [...tryList, { parfumId: parfum.id, denendi: false, addedAt: new Date().toISOString() }];
    setTryList(next);
    await saveTryList(next);
    hapticSuccess();
  };

  const query = `${parfum.marka ?? ''} ${parfum.isim}`.trim();
  const openUrl = (url: string) => WebBrowser.openBrowserAsync(url).catch(() => {});
  const explainNote = (n: string) => {
    const d = notaAciklamasi(n);
    if (d) Alert.alert(n.charAt(0).toLocaleUpperCase('tr') + n.slice(1), d);
  };

  const ph = result.phSkor;
  const layers: [string, string, string[], number][] = [
    ['Üst notalar', 'ilk 15 dk', parfum.notalar.ust, ph.ustNotaPerformansi],
    ['Kalp notaları', '15 dk – 2 sa', parfum.notalar.orta, ph.ortaNotaPerformansi],
    ['Alt notalar', '2 sa +', parfum.notalar.alt, ph.altNotaPerformansi],
  ];

  const bugunBu = todaySotd?.parfumId === parfum.id;
  const menu: { icon: IconName; title: string; subtitle?: string; onPress: () => void }[] = [
    ...(wardrobeItem
      ? [{ icon: 'file-tray-stacked-outline' as IconName, title: 'Dolaptaki şişe', subtitle: wardrobeItem.hacimMl ? `%${Math.round(wardrobeItem.kalanYuzde)} kaldı · düzenle` : 'Ayrıntıları düzenle', onPress: () => setWardrobeSheet(true) }]
      : bugunBu ? [] : [{ icon: 'today-outline' as IconName, title: 'Bugün bunu sıktım', subtitle: 'Günlüğünüze ve serinize eklenir', onPress: wearToday }]),
    { icon: 'git-compare-outline', title: 'Başka bir parfümle karşılaştır', onPress: () => router.push({ pathname: '/compare', params: { a: parfum.id } }) },
    { icon: inTryList ? 'checkmark-circle' : 'storefront-outline', title: inTryList ? 'Mağazada deneyeceklerimde' : 'Mağazada deneyeceklerime ekle', onPress: toggleTry },
    { icon: 'albums-outline', title: 'Koleksiyona ekle', onPress: () => setColOpen(true) },
    { icon: 'share-outline', title: 'Paylaş', onPress: share },
  ];
  const menudenSec = (fn: () => void) => { setMenuOpen(false); setTimeout(fn, 250); };

  // Ana eylem: dolapta değilse "Dolabıma ekle", dolaptaysa "Bugün bunu sıktım"
  const anaEylem = !wardrobeItem
    ? { label: 'Dolabıma ekle', icon: 'add' as IconName, onPress: () => setWardrobeSheet(true) }
    : bugunBu
      ? { label: 'Bugünün kokusu', icon: 'checkmark-circle' as IconName, onPress: () => router.push('/diary'), tamam: true }
      : { label: 'Bugün bunu sıktım', icon: 'checkmark' as IconName, onPress: wearToday };

  const uyarilar = result.uyumKategorileri.filter(k => !k.uyum);
  const benzerListe = benzerSekme === 'benzer' || !cheaper.length ? similar : cheaper;

  const body = (
    <View>
      {/* Uyum + ana eylem + deneyim (tek kart) */}
      <Card style={{ marginTop: Spacing.xl }}>
        <View style={styles.rowBetween}>
          <T variant="h2">Teninize uyumu</T>
          <MatchBadge value={result.matchPercentage} />
        </View>
        <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
          {result.matchReasons.slice(0, 2).map((r, i) => (
            <View key={i} style={styles.reason}>
              <View style={[styles.dot, { backgroundColor: c.accent }]} />
              <T variant="body" style={{ flex: 1 }}>{r}</T>
            </View>
          ))}
        </View>
        {uyarilar.length ? (
          <View style={{ marginTop: Spacing.md, gap: 4 }}>
            {uyarilar.map(k => (
              <View key={k.kategori} style={styles.inline}>
                <Ionicons name="alert-circle-outline" size={14} color={c.warning} />
                <T variant="small" color="muted" style={{ flex: 1 }}>{k.kategori}: {k.detay}</T>
              </View>
            ))}
          </View>
        ) : null}
        <Button label={anaEylem.label} icon={anaEylem.icon} onPress={anaEylem.onPress} variant={'tamam' in anaEylem ? 'secondary' : 'primary'} style={{ marginTop: Spacing.lg }} />
        <Divider style={{ marginVertical: Spacing.lg }} />
        <View style={styles.rowBetween}>
          <T variant="smallStrong" color="muted">Denediniz mi?</T>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <Button label="Sevdim" icon={loved ? 'heart' : 'heart-outline'} size="sm" variant={loved ? 'accent' : 'secondary'} onPress={() => setVerdict('sevdim')} />
            <Button label="Sevmedim" size="sm" variant={disliked ? 'primary' : 'secondary'} onPress={() => setVerdict('sevmedim')} />
          </View>
        </View>
      </Card>

      {/* Nota piramidi (tek kart) */}
      <Section title="Nota piramidi">
        <Card>
          {layers.map(([t, time, notes, perf], li) => (
            <View key={t}>
              {li ? <Divider style={{ marginVertical: Spacing.md }} /> : null}
              <View style={styles.rowBetween}>
                <T variant="bodyStrong">{t}</T>
                <T variant="small" color="subtle">{time} · tende %{perf}</T>
              </View>
              <View style={styles.notes}>
                {notes.length ? notes.map((n, i) => {
                  const known = !!notaAciklamasi(n);
                  return (
                    <T
                      key={n + i}
                      variant="h3"
                      onPress={known ? () => explainNote(n) : undefined}
                      style={[{ textTransform: 'capitalize' }, known && { textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: c.inkSubtle }]}
                    >
                      {n}{i < notes.length - 1 ? ' ·' : ''}
                    </T>
                  );
                }) : <T variant="h3">—</T>}
              </View>
              <View style={{ marginTop: Spacing.sm }}><ProgressLine value={perf} /></View>
            </View>
          ))}
        </Card>
        <T variant="small" color="subtle" style={{ marginTop: Spacing.sm }}>
          {parfum.dogrulandi ? 'Notalar markanın resmi nota piramidiyle doğrulandı.' : 'Nota bilgileri doğrulama sürecindedir; küçük farklılıklar olabilir.'} Altı çizili notaya dokunarak nasıl koktuğunu öğrenin.
        </T>
      </Section>

      {/* Ayrıntılar: açılır-kapanır */}
      <Card style={{ marginTop: Spacing.xl, paddingVertical: Spacing.sm }}>
        <ListRow icon="options-outline" title="Karakter ve performans" subtitle={`${YOG[parfum.yogunluk]} · ${PROFIL[parfum.cinsiyet]} · kalıcılık ${KAL[parfum.kalicilik]?.toLocaleLowerCase('tr')}`} onPress={() => setAcik(a => ({ ...a, karakter: !a.karakter }))} right={<Ionicons name={acik.karakter ? 'chevron-up' : 'chevron-down'} size={18} color={c.inkSubtle} />} />
        {acik.karakter ? (
          <View style={styles.acilir}>
            <View style={{ flexDirection: 'row' }}>
              <Stat label="Ten kimyası" value={`%${ph.phUyumSkoru}`} />
              <Stat label="Performans" value={`%${ph.toplamPerformans}`} />
              <Stat label="Fiyat" value={parfum.fiyatAraligi ? FIYAT[parfum.fiyatAraligi] : '—'} />
            </View>
            <T variant="small" color="muted" style={{ marginTop: Spacing.md }}>{ph.aciklama}.</T>
            <T variant="overline" color="subtle" style={{ marginTop: Spacing.md }}>Mevsim</T>
            <View style={styles.tags}>{(parfum.mevsim || []).map(m => <Tag key={m} label={m} />)}</View>
            <T variant="overline" color="subtle" style={{ marginTop: Spacing.md }}>Kullanım</T>
            <View style={styles.tags}>{(parfum.kullanimAmaci || []).map(m => <Tag key={m} label={AMAC[m] ?? m} />)}</View>
          </View>
        ) : null}
        <Divider />
        <ListRow icon="bag-handle-outline" title="Nereden alınır?" subtitle={parfum.fiyatAraligi ? `${FIYAT_KADEMESI[parfum.fiyatAraligi].label} · ${FIYAT_KADEMESI[parfum.fiyatAraligi].yaklasik}` : 'Mağazalar ve numune'} onPress={() => setAcik(a => ({ ...a, alis: !a.alis }))} right={<Ionicons name={acik.alis ? 'chevron-up' : 'chevron-down'} size={18} color={c.inkSubtle} />} />
        {acik.alis ? (
          <View style={styles.acilir}>
            <View style={styles.stores}>
              {STORES.map(st => <Button key={st.id} label={st.label} size="sm" variant="secondary" iconRight="open-outline" onPress={() => openUrl(storeUrl(st, query))} style={{ flexGrow: 1 }} />)}
            </View>
            <Pressable onPress={() => openUrl(storeUrl(STORES[0], sampleQuery(parfum.marka ?? '', parfum.isim)))} style={[styles.inline, { marginTop: Spacing.md }]}>
              <Ionicons name="water-outline" size={16} color={c.accent} />
              <T variant="smallStrong" color="accent">Önce numunesini deneyin</T>
            </Pressable>
            <T variant="small" color="subtle" style={{ marginTop: Spacing.sm }}>Fiyatlar yaklaşıktır; güncel fiyat mağazada görünür.</T>
          </View>
        ) : null}
      </Card>

      {/* Benzerleri (tek liste, sekmeli) */}
      {similar.length > 0 ? (
        <Section title="Buna benzeyenler">
          {cheaper.length ? (
            <View style={{ marginBottom: Spacing.md }}>
              <Segmented value={benzerSekme} onChange={setBenzerSekme} options={[{ value: 'benzer', label: 'En benzer' }, { value: 'uygun', label: 'Daha uygun fiyatlı' }]} />
            </View>
          ) : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md }}>
            {benzerListe.map(s => (
              <View key={s.parfum.id} style={{ width: 130 }}>
                <PerfumeTile parfum={s.parfum} width={130} badge={`%${Math.round(s.benzerlik * 100)} benzer`} onPress={() => router.push(`/parfum/${s.parfum.id}`)} />
                <T variant="small" color="muted" numberOfLines={2} style={{ marginTop: 2 }}>
                  {benzerSekme === 'uygun' && cheaper.length ? (s.parfum.fiyatAraligi ? FIYAT_KADEMESI[s.parfum.fiyatAraligi].label : '') : s.ortakNotalar.length ? `Ortak: ${s.ortakNotalar.slice(0, 2).join(', ')}` : ''}
                </T>
              </View>
            ))}
          </ScrollView>
          <T variant="small" color="subtle" style={{ marginTop: Spacing.sm }}>Benzerlik nota ve aile yapısından hesaplanır; aynı koku olduğu anlamına gelmez.</T>
        </Section>
      ) : null}
    </View>
  );

  return (
    <Screen
      padded={false}
      stickyHeaderIndices={[0]}
      scrollEventThrottle={32}
      onScroll={e => { const y = e.nativeEvent.contentOffset.y; if ((y > 300) !== baslikGorunur) setBaslikGorunur(y > 300); }}
    >
      {/* Sabit üst bar: kaydırınca da ekranda kalır; ad başlıktan geçince ortada görünür */}
      <View style={[styles.topBar, { backgroundColor: c.bg, borderBottomColor: baslikGorunur ? c.border : 'transparent' }]}>
        <Header
          title={baslikGorunur ? parfum.isim : undefined}
          right={
            <View style={{ flexDirection: 'row' }}>
              <IconButton name={fav ? 'heart' : 'heart-outline'} color={fav ? c.accent : c.ink} onPress={toggleFav} accessibilityLabel="Favori" />
              <IconButton name="ellipsis-horizontal" onPress={() => setMenuOpen(true)} accessibilityLabel="Diğer eylemler" />
            </View>
          }
        />
      </View>

      <View style={{ paddingHorizontal: Spacing.lg }}>
        <View style={[styles.hero, { backgroundColor: c.surfaceAlt }]}>
          <Bottle parfum={parfum} size={110} />
        </View>
        <T variant="overline" caps={brandCaps(parfum)} color="subtle" style={{ marginTop: Spacing.xl }}>{parfum.marka}</T>
        <T variant="hero" style={{ marginTop: 2 }}>{parfum.isim}</T>
        <View style={styles.tags}>
          <View style={styles.inline}><FamilyDot family={parfum.tip} /><T variant="small" color="muted">{parfum.tip}{parfum.ikincilTip ? ` · ${parfum.ikincilTip}` : ''}</T></View>
          {parfum.konsantrasyon ? <Tag label={KONS[parfum.konsantrasyon] ?? parfum.konsantrasyon} /> : null}
        </View>
        <T variant="body" color="muted" style={{ marginTop: Spacing.md }} numberOfLines={acik.aciklama ? undefined : 3} onPress={() => setAcik(a => ({ ...a, aciklama: !a.aciklama }))}>{parfum.aciklama}</T>

        {access === 'locked' ? (
          <View style={{ marginTop: Spacing.xl }}>
            <LockedFeatureOverlay onUnlock={() => setPaywallVisible(true)} title="Ücretsiz detay hakkınız doldu" subtitle={`${FREE_PARFUM_DETAIL_LIMIT} farklı parfümü ücretsiz incelediniz. Premium ile sınırsız.`}>
              <View style={{ height: 380 }}>{body}</View>
            </LockedFeatureOverlay>
          </View>
        ) : access === 'allowed' ? body : null}
      </View>

      <Modal visible={colOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setColOpen(false)}>
        <View style={{ flex: 1, backgroundColor: c.bg, padding: Spacing.lg, paddingBottom: insets.bottom + Spacing.lg }}>
          <View style={styles.rowBetween}>
            <T variant="h2">Koleksiyona ekle</T>
            <IconButton name="close" onPress={() => setColOpen(false)} />
          </View>
          <View style={{ marginTop: Spacing.md }}>
            {collections.map(col => {
              const inside = col.parfumIds.includes(parfum.id);
              return (
                <View key={col.id}>
                  <ListRow
                    icon="albums-outline"
                    title={col.name}
                    subtitle={`${col.parfumIds.length} parfüm`}
                    onPress={() => toggleInCollection(col.id, inside, col.parfumIds.length)}
                    right={<Ionicons name={inside ? 'checkmark-circle' : 'add-circle-outline'} size={22} color={inside ? c.accent : c.inkSubtle} />}
                  />
                  <Divider />
                </View>
              );
            })}
          </View>
          <T variant="overline" color="subtle" style={{ marginTop: Spacing.xl }}>Yeni koleksiyon</T>
          <View style={[styles.newRow, { borderColor: c.border, backgroundColor: c.surface }]}>
            <TextInput
              value={newCol}
              onChangeText={setNewCol}
              placeholder="Örn. Kış akşamları"
              placeholderTextColor={c.inkSubtle}
              style={[styles.newInput, { color: c.ink }]}
              returnKeyType="done"
              onSubmitEditing={createAndAdd}
              maxLength={40}
            />
            <Button label="Oluştur" size="sm" variant="accent" onPress={createAndAdd} disabled={!newCol.trim()} />
          </View>
          <View style={{ flex: 1 }} />
          <Button label="Tamam" onPress={() => setColOpen(false)} />
        </View>
      </Modal>

      {/* "⋯" diğer eylemler */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: c.scrim }]} onPress={() => setMenuOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: c.bg, paddingBottom: insets.bottom + Spacing.md }]}>
            <View style={[styles.grabber, { backgroundColor: c.border }]} />
            <T variant="overline" caps={brandCaps(parfum)} color="subtle">{parfum.marka}</T>
            <T variant="h3" style={{ marginBottom: Spacing.sm }}>{parfum.isim}</T>
            {menu.map((m, i) => (
              <View key={m.title}>
                {i ? <Divider /> : null}
                <ListRow icon={m.icon} title={m.title} subtitle={m.subtitle} onPress={() => menudenSec(m.onPress)} />
              </View>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <WardrobeItemSheet
        visible={wardrobeSheet}
        parfum={parfum}
        item={wardrobeItem}
        onClose={() => setWardrobeSheet(false)}
        onSave={async d => {
          if (wardrobeItem) await updateWardrobeItem(wardrobeItem.id, d);
          else { await addToWardrobe(parfum.id, d); track('wardrobe_add', { kaynak: 'detay' }); }
          setWardrobeSheet(false);
          hapticSuccess();
        }}
        onRemove={wardrobeItem ? () => { removeFromWardrobe(wardrobeItem.id); setWardrobeSheet(false); } : undefined}
      />
      <PaywallScreen visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { height: 200, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reason: { flexDirection: 'row', gap: Spacing.md },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 9 },
  notes: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 6, marginTop: 6 },
  topBar: { paddingHorizontal: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  acilir: { paddingLeft: 52, paddingBottom: Spacing.md },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  grabber: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  stores: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  newRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderRadius: BorderRadius.md, paddingLeft: Spacing.md, paddingRight: 6, paddingVertical: 6 },
  newInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 16, paddingVertical: 8 },
});
