/**
 * TENİNDE — Koleksiyon: Dolabım (sahip olunanlar) + favoriler + kullanıcı koleksiyonları
 * Görsel düzen: sekme → vitrin (raf + aile dağılımı + özet, components/collection/Showcase) → 2 sütunlu ızgara.
 * Listeler albüm kapağı gibi (üst üste üç şişe); her ızgara kesik çizgili bir "ekle" kutusuyla biter.
 */
import { Button, EmptyState, IconButton, PageTitle, Screen, Segmented, T, useTheme } from '@/components/kit';
import { Bottle, brandCaps, PerfumeRow } from '@/components/kit/perfume';
import { Showcase } from '@/components/collection/Showcase';
import { PerfumePicker } from '@/components/kit/PerfumePicker';
import { PaywallScreen } from '@/components/paywall';
import { FREE_COLLECTION_LIMIT, FREE_COLLECTION_PARFUM_LIMIT, FREE_FAVORITE_LIMIT } from '@/constants/premiumLimits';
import { BorderRadius, FontFamilies, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { usePremiumGate } from '@/hooks/use-premium-gate';
import { WardrobeTab } from '@/components/wardrobe/WardrobeTab';
import { Collection } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Tab = 'dolap' | 'fav' | 'col';

export default function CollectionScreen() {
  const router = useRouter();
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const {
    favorites, getFavoriteParfums, toggleFavoriteParfum,
    collections, createNewCollection, removeCollection, getCollectionParfums, addParfumToCollection, removeParfumFromCollection, wardrobe,
    wardrobeParfums, sotdHistory, getParfumById,
  } = useApp();
  const { width } = useWindowDimensions();
  const tileW = (width - Spacing.lg * 2 - Spacing.md) / 2;
  const params = useLocalSearchParams<{ sekme?: Tab }>();
  const { isPremium, paywallVisible, setPaywallVisible } = usePremiumGate();
  const [tab, setTab] = useState<Tab>(params.sekme ?? 'dolap');
  useEffect(() => { if (params.sekme) setTab(params.sekme); }, [params.sekme]);
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const favs = getFavoriteParfums();

  // Vitrin: sekmedeki parfümler + kısa özet
  const vitrin = useMemo(() => {
    if (tab === 'dolap') {
      const ml = wardrobe.reduce((t, w) => t + (w.hacimMl ? (w.hacimMl * w.kalanYuzde) / 100 : 0), 0);
      const sikilan = sotdHistory.filter(h => wardrobe.some(w => w.parfumId === h.parfumId)).length;
      return { baslik: 'Dolabınız', parfumler: wardrobeParfums, ozet: [
        { deger: String(wardrobe.length), etiket: 'parfüm' },
        ml > 0 ? { deger: `~${Math.round(ml)}`, etiket: 'ml kaldı' } : { deger: String(new Set(wardrobeParfums.map(p => p.tip)).size), etiket: 'koku ailesi' },
        { deger: String(sikilan), etiket: 'kez sıkıldı' },
      ] };
    }
    if (tab === 'fav') {
      return { baslik: 'Favorileriniz', parfumler: favs, ozet: [
        { deger: String(favs.length), etiket: 'favori' },
        { deger: String(favs.filter(p => wardrobe.some(w => w.parfumId === p.id)).length), etiket: 'dolabınızda' },
        { deger: String(new Set(favs.map(p => p.tip)).size), etiket: 'koku ailesi' },
      ] };
    }
    const ids = [...new Set(collections.flatMap(col => col.parfumIds))];
    const ps = ids.map(id => getParfumById(id)).filter((p): p is NonNullable<typeof p> => !!p);
    return { baslik: 'Listeleriniz', parfumler: ps, ozet: [
      { deger: String(collections.length), etiket: 'liste' },
      { deger: String(ps.length), etiket: 'parfüm' },
      { deger: String(new Set(ps.map(p => p.tip)).size), etiket: 'koku ailesi' },
    ] };
  }, [tab, wardrobe, wardrobeParfums, sotdHistory, favs, collections, getParfumById]);
  const opened: Collection | undefined = collections.find(x => x.id === openId);
  const openedParfums = opened ? getCollectionParfums(opened.id) : [];

  const startNew = () => {
    if (!isPremium && collections.length >= FREE_COLLECTION_LIMIT) return setPaywallVisible(true);
    setNewName('');
    setNewOpen(true);
  };
  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    await createNewCollection(name, 'albums-outline', '#A8642A');
    setNewOpen(false);
  };
  const addToOpened = () => {
    if (!opened) return;
    if (!isPremium && opened.parfumIds.length >= FREE_COLLECTION_PARFUM_LIMIT) return setPaywallVisible(true);
    setPickerOpen(true);
  };
  const confirmDelete = (col: Collection) =>
    Alert.alert('Koleksiyonu sil', `"${col.name}" silinsin mi? İçindeki parfümler silinmez.`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => { removeCollection(col.id); setOpenId(null); } },
    ]);

  return (
    <Screen>
      <PageTitle title="Koleksiyon" />
      <Segmented<Tab> value={tab} onChange={setTab} options={[{ value: 'dolap', label: `Dolabım · ${wardrobe.length}` }, { value: 'fav', label: `Favori · ${favorites.length}` }, { value: 'col', label: `Listeler · ${collections.length}` }]} />
      {vitrin.parfumler.length ? <Showcase baslik={vitrin.baslik} parfumler={vitrin.parfumler} ozet={vitrin.ozet} /> : null}

      {tab === 'dolap' ? (
        <WardrobeTab isPremium={isPremium} onPaywall={() => setPaywallVisible(true)} />
      ) : tab === 'fav' ? (
        <View style={{ marginTop: Spacing.lg }}>
          {!isPremium ? (
            <T variant="small" color="subtle" style={{ marginBottom: Spacing.sm }}>{favs.length}/{FREE_FAVORITE_LIMIT} ücretsiz favori</T>
          ) : null}
          {favs.length === 0 ? (
            <EmptyState icon="heart-outline" title="Henüz favori yok" body="Parfüm sayfalarındaki kalp simgesiyle favorilerinizi burada toplayın." actionLabel="Parfümleri keşfet" onAction={() => router.push('/(tabs)/parfums')} />
          ) : (
            <View style={styles.grid}>
              {favs.map(p => (
                <Pressable key={p.id} onPress={() => router.push(`/parfum/${p.id}`)} style={({ pressed }) => [{ width: tileW, opacity: pressed ? 0.85 : 1 }]}>
                  <View style={[styles.tileArt, { height: tileW * 1.05, backgroundColor: c.surfaceAlt }]}>
                    <Bottle parfum={p} size={tileW * 0.5} />
                    <Pressable onPress={() => toggleFavoriteParfum(p.id)} hitSlop={10} style={[styles.tileBtn, { backgroundColor: c.surface, borderColor: c.border }]} accessibilityLabel="Favoriden çıkar">
                      <Ionicons name="heart" size={15} color={c.accent} />
                    </Pressable>
                    {wardrobe.some(w => w.parfumId === p.id) ? (
                      <View style={[styles.tileTag, { backgroundColor: c.surface }]}><T variant="overline" style={{ fontSize: 9 }}>Dolabımda</T></View>
                    ) : null}
                  </View>
                  <T variant="overline" caps={brandCaps(p)} color="subtle" numberOfLines={1} style={{ marginTop: Spacing.sm }}>{p.marka}</T>
                  <T variant="bodyStrong" numberOfLines={1}>{p.isim}</T>
                  <T variant="small" color="subtle" numberOfLines={1}>{p.tip}{p.ikincilTip ? ` · ${p.ikincilTip}` : ''}</T>
                </Pressable>
              ))}
              <Pressable onPress={() => router.push('/(tabs)/parfums')} style={({ pressed }) => [styles.addTile, { width: tileW, height: tileW * 1.05, borderColor: c.border, opacity: pressed ? 0.7 : 1 }]}>
                <View style={[styles.addIcon, { backgroundColor: c.accentSoft }]}><Ionicons name="compass-outline" size={22} color={c.accent} /></View>
                <T variant="smallStrong" color="muted" style={{ marginTop: Spacing.sm }}>Keşfet</T>
              </Pressable>
            </View>
          )}
        </View>
      ) : (
        <View style={{ marginTop: Spacing.lg }}>
          {collections.length === 0 ? (
            <EmptyState icon="albums-outline" title="Koleksiyon oluşturun" body={'"Yazlıklar", "Gece kokuları", "İstek listesi" gibi listelerle parfümlerinizi düzenleyin.'} actionLabel="Yeni koleksiyon" onAction={startNew} />
          ) : (
            <View style={styles.grid}>
              {collections.map(col => {
                const items = getCollectionParfums(col.id);
                return (
                  <Pressable key={col.id} onPress={() => setOpenId(col.id)} style={({ pressed }) => [{ width: tileW, opacity: pressed ? 0.85 : 1 }]}>
                    <View style={[styles.cover, { height: tileW, backgroundColor: c.surfaceAlt }]}>
                      {items.length ? items.slice(0, 3).map((p, i, arr) => (
                        <View key={p.id} style={{ position: 'absolute', transform: [{ translateX: (i - (arr.length - 1) / 2) * tileW * 0.22 }, { rotate: `${(i - (arr.length - 1) / 2) * 8}deg` }] }}>
                          <Bottle parfum={p} size={tileW * 0.42} />
                        </View>
                      )) : <Ionicons name="albums-outline" size={30} color={c.inkSubtle} />}
                    </View>
                    <T variant="bodyStrong" numberOfLines={1} style={{ marginTop: Spacing.sm }}>{col.name}</T>
                    <T variant="small" color="subtle">{items.length} parfüm</T>
                  </Pressable>
                );
              })}
              <Pressable onPress={startNew} style={({ pressed }) => [styles.addTile, { width: tileW, height: tileW, borderColor: c.border, opacity: pressed ? 0.7 : 1 }]}>
                <View style={[styles.addIcon, { backgroundColor: c.accentSoft }]}><Ionicons name="add" size={22} color={c.accent} /></View>
                <T variant="smallStrong" color="muted" style={{ marginTop: Spacing.sm }}>Yeni koleksiyon</T>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Yeni koleksiyon */}
      <Modal visible={newOpen} transparent animationType="fade" onRequestClose={() => setNewOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: c.scrim }]} onPress={() => setNewOpen(false)}>
          <Pressable style={[styles.dialog, { backgroundColor: c.surface }]}>
            <T variant="h2">Yeni koleksiyon</T>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Örn. Gece kokuları"
              placeholderTextColor={c.inkSubtle}
              autoFocus
              maxLength={32}
              onSubmitEditing={create}
              style={[styles.input, { color: c.ink, borderColor: c.border, backgroundColor: c.bg }]}
            />
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Button label="Vazgeç" variant="ghost" onPress={() => setNewOpen(false)} style={{ flex: 1 }} />
              <Button label="Oluştur" onPress={create} disabled={!newName.trim()} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Koleksiyon detayı */}
      <Modal visible={!!opened} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpenId(null)}>
        <View style={{ flex: 1, backgroundColor: c.bg, paddingBottom: insets.bottom }}>
          <View style={styles.sheetHead}>
            <View style={{ flex: 1 }}>
              <T variant="h1">{opened?.name}</T>
              <T variant="small" color="muted">{openedParfums.length} parfüm{!isPremium ? ` · en fazla ${FREE_COLLECTION_PARFUM_LIMIT} (ücretsiz)` : ''}</T>
            </View>
            <IconButton name="close" onPress={() => setOpenId(null)} accessibilityLabel="Kapat" />
          </View>
          <View style={{ paddingHorizontal: Spacing.lg, flex: 1 }}>
            <Button label="Parfüm ekle" icon="add" variant="secondary" onPress={addToOpened} />
            {openedParfums.length === 0 ? (
              <EmptyState icon="flask-outline" title="Bu koleksiyon boş" body="Parfüm ekleyerek başlayın." />
            ) : openedParfums.map(p => (
              <PerfumeRow
                key={p.id}
                parfum={p}
                onPress={() => { setOpenId(null); router.push(`/parfum/${p.id}`); }}
                right={<IconButton name="remove-circle-outline" color={c.inkMuted} onPress={() => opened && removeParfumFromCollection(opened.id, p.id)} accessibilityLabel="Koleksiyondan çıkar" />}
              />
            ))}
            <View style={{ flex: 1 }} />
            {opened ? <Button label="Koleksiyonu sil" variant="ghost" icon="trash-outline" onPress={() => confirmDelete(opened)} /> : null}
          </View>
        </View>
        <PerfumePicker visible={pickerOpen} onClose={() => setPickerOpen(false)} title="Koleksiyona ekle" excludeIds={opened?.parfumIds ?? []} onSelect={p => opened && addParfumToCollection(opened.id, p.id)} />
      </Modal>

      <PaywallScreen visible={paywallVisible} onClose={() => setPaywallVisible(false)} title="Sınırsız koleksiyon" subtitle="Dolabınızı dilediğiniz gibi düzenleyin." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, rowGap: Spacing.lg },
  tileArt: { borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tileBtn: { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  tileTag: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  cover: { borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  addTile: { borderRadius: BorderRadius.lg, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, justifyContent: 'center', padding: Spacing.xl },
  dialog: { borderRadius: BorderRadius.lg, padding: Spacing.xl, gap: Spacing.lg },
  input: { height: 50, borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, fontFamily: FontFamilies.medium, fontSize: 16 },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.lg, paddingTop: Spacing.xl },
});
