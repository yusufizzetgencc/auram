/**
 * TENİNDE — Keşfet (katalog)
 * Sade düzen: arama + filtre düğmesi, tek satır koku ailesi, iki sütunlu parfüm ızgarası.
 * Ayrıntılı filtreler (marka, aile, profil, yoğunluk, fiyat, sıralama) alttan açılan panelde.
 */
import { Button, Chip, IconButton, Segmented, T, useTheme } from '@/components/kit';
import { Bottle, brandCaps } from '@/components/kit/perfume';
import { matchesQuery, SearchField } from '@/components/kit/PerfumePicker';
import { BorderRadius, ScentTypeColors, Spacing } from '@/constants/theme';
import { SearchContextBar } from '@/components/SearchContextBar';
import { useApp } from '@/context/AppContext';
import { getEffectivePH, skorlaParfum } from '@/engine';
import { Parfum } from '@/types';
import { hapticLight } from '@/utils/haptics';
import { trLower } from '@/utils/text';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Sort = 'match' | 'az' | 'fiyat';
type Price = NonNullable<Parfum['fiyatAraligi']>;

const FAMILIES = Object.keys(ScentTypeColors);
const GENDERS: { v: Parfum['cinsiyet']; l: string }[] = [{ v: 'kadın', l: 'Feminen' }, { v: 'erkek', l: 'Maskülen' }, { v: 'unisex', l: 'Unisex' }];
const STRENGTH: { v: Parfum['yogunluk']; l: string }[] = [{ v: 'hafif', l: 'Hafif' }, { v: 'orta', l: 'Orta' }, { v: 'yogun', l: 'Yoğun' }];
const PRICES: { v: Price; l: string }[] = [{ v: 'ekonomik', l: 'Uygun' }, { v: 'orta', l: 'Orta' }, { v: 'premium', l: 'Premium' }, { v: 'luks', l: 'Lüks' }];
const PRICE_RANK: Record<string, number> = { ekonomik: 0, orta: 1, premium: 2, luks: 3 };
const SORT_LABEL: Record<Sort, string> = { match: 'Size göre', az: 'A–Z', fiyat: 'Fiyat' };

const toggle = <V,>(list: V[], v: V) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

export default function ExploreScreen() {
  const router = useRouter();
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ aile?: string }>();
  const { parfumler, preferences, addSearchToHistory, addToRecentlyViewedList, zevk, etkinPrefs } = useApp();

  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('match');
  const [families, setFamilies] = useState<string[]>(params.aile ? [params.aile] : []);
  const [brands, setBrands] = useState<string[]>([]);
  const [gender, setGender] = useState<Parfum['cinsiyet'] | null>(null);
  const [strength, setStrength] = useState<Parfum['yogunluk'] | null>(null);
  const [prices, setPrices] = useState<Price[]>([]);
  const [sheet, setSheet] = useState(false);
  const [brandQ, setBrandQ] = useState('');

  useEffect(() => { if (params.aile) setFamilies([params.aile]); }, [params.aile]);

  const scores = useMemo(() => {
    const ph = getEffectivePH(preferences);
    const map: Record<string, number> = {};
    parfumler.forEach(p => { map[p.id] = skorlaParfum(p, etkinPrefs, ph, zevk).matchPercentage; });
    return map;
  }, [parfumler, preferences, etkinPrefs, zevk]);

  /** Marka listesi: ad + parfüm sayısı, Türkçe alfabeyle */
  const brandList = useMemo(() => {
    const m = new Map<string, number>();
    parfumler.forEach(p => p.marka && m.set(p.marka, (m.get(p.marka) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'tr'));
  }, [parfumler]);

  const list = useMemo(() => {
    const filtered = parfumler.filter(p =>
      matchesQuery(p, q) &&
      (families.length === 0 || families.includes(p.tip) || (!!p.ikincilTip && families.includes(p.ikincilTip))) &&
      (brands.length === 0 || brands.includes(p.marka ?? '')) &&
      (!gender || p.cinsiyet === gender) &&
      (!strength || p.yogunluk === strength) &&
      (prices.length === 0 || (!!p.fiyatAraligi && prices.includes(p.fiyatAraligi))),
    );
    if (sort === 'az') return filtered.sort((a, b) => a.isim.localeCompare(b.isim, 'tr'));
    if (sort === 'fiyat') return filtered.sort((a, b) => (PRICE_RANK[a.fiyatAraligi ?? 'orta'] - PRICE_RANK[b.fiyatAraligi ?? 'orta']) || scores[b.id] - scores[a.id]);
    return filtered.sort((a, b) => scores[b.id] - scores[a.id]);
  }, [parfumler, q, families, brands, gender, strength, prices, sort, scores]);

  const panelCount = brands.length + (gender ? 1 : 0) + (strength ? 1 : 0) + prices.length + (families.length > 1 ? families.length : 0);
  const anyFilter = families.length + brands.length + prices.length + (gender ? 1 : 0) + (strength ? 1 : 0) > 0;
  const clearAll = () => { setFamilies([]); setBrands([]); setGender(null); setStrength(null); setPrices([]); };

  const open = (p: Parfum) => {
    if (q.trim()) addSearchToHistory(q.trim(), list.length);
    addToRecentlyViewedList(p.id);
    router.push(`/parfum/${p.id}`);
  };

  const gap = Spacing.md;
  const cardW = (width - Spacing.lg * 2 - gap) / 2;

  // Panelden seçilen filtreler: ızgaranın üstünde kaldırılabilir kısa etiketler
  const activePills: { key: string; label: string; onRemove: () => void }[] = [
    ...brands.map(b => ({ key: `b-${b}`, label: b, onRemove: () => setBrands(toggle(brands, b)) })),
    ...(gender ? [{ key: 'g', label: GENDERS.find(g => g.v === gender)!.l, onRemove: () => setGender(null) }] : []),
    ...(strength ? [{ key: 's', label: STRENGTH.find(s => s.v === strength)!.l, onRemove: () => setStrength(null) }] : []),
    ...prices.map(pr => ({ key: `p-${pr}`, label: PRICES.find(x => x.v === pr)!.l, onRemove: () => setPrices(toggle(prices, pr)) })),
  ];

  const header = (
    <View>
      <View style={styles.titleRow}>
        <T variant="h1">Keşfet</T>
        <T variant="small" color="subtle">{parfumler.length} parfüm</T>
      </View>

      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}><SearchField value={q} onChangeText={setQ} /></View>
        <Pressable
          onPress={() => { hapticLight(); setSheet(true); }}
          accessibilityRole="button"
          accessibilityLabel="Filtrele"
          style={({ pressed }) => [styles.filterBtn, { backgroundColor: panelCount ? c.ink : c.surface, borderColor: c.border, opacity: pressed ? 0.8 : 1 }]}
        >
          <Ionicons name="options-outline" size={20} color={panelCount ? c.bg : c.ink} />
          {panelCount ? (
            <View style={[styles.badge, { backgroundColor: c.accent }]}>
              <T variant="smallStrong" style={{ color: '#FFFFFF', fontSize: 11, lineHeight: 14 }}>{panelCount}</T>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, { paddingHorizontal: Spacing.lg }]} style={{ marginHorizontal: -Spacing.lg }}>
        <Chip label="Tümü" selected={families.length === 0} onPress={() => setFamilies([])} />
        {FAMILIES.map(f => (
          <Chip key={f} label={f} color={ScentTypeColors[f]} selected={families.includes(f)} onPress={() => setFamilies(families.length === 1 && families[0] === f ? [] : [f])} />
        ))}
      </ScrollView>

      {/* "Size göre" sıralamada bağlam: mevsim/amaç/ortam/yoğunluk tek dokunuşla */}
      {sort === 'match' ? <SearchContextBar style={{ marginTop: Spacing.md }} /> : null}

      {activePills.length ? (
        <View style={styles.pills}>
          {activePills.map(pl => (
            <Pressable key={pl.key} onPress={pl.onRemove} style={[styles.pill, { backgroundColor: c.surfaceAlt }]} accessibilityLabel={`${pl.label} filtresini kaldır`}>
              <T variant="smallStrong">{pl.label}</T>
              <Ionicons name="close" size={14} color={c.inkMuted} />
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.countRow}>
        <T variant="small" color="muted">{list.length} sonuç</T>
        <Pressable
          onPress={() => setSort(sort === 'match' ? 'az' : sort === 'az' ? 'fiyat' : 'match')}
          hitSlop={8}
          style={styles.sortBtn}
          accessibilityLabel={`Sıralama: ${SORT_LABEL[sort]}`}
        >
          <Ionicons name="swap-vertical" size={15} color={c.inkMuted} />
          <T variant="smallStrong" color="muted">{SORT_LABEL[sort]}</T>
        </Pressable>
      </View>
    </View>
  );

  const renderCard = ({ item }: { item: Parfum }) => (
    <Pressable onPress={() => { hapticLight(); open(item); }} style={({ pressed }) => [{ width: cardW, opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.art, { backgroundColor: c.surfaceAlt, height: cardW * 0.95 }]}>
        <Bottle parfum={item} size={cardW * 0.52} />
        <View style={[styles.match, { backgroundColor: c.surface }]}>
          <T variant="smallStrong" color="accent">%{scores[item.id]}</T>
        </View>
      </View>
      <T variant="overline" caps={brandCaps(item)} color="subtle" numberOfLines={1} style={{ marginTop: Spacing.sm }}>{item.marka ?? ''}</T>
      <T variant="bodyStrong" numberOfLines={1}>{item.isim}</T>
      <View style={styles.familyLine}>
        <View style={[styles.dot, { backgroundColor: ScentTypeColors[item.tip] }]} />
        <T variant="small" color="muted" numberOfLines={1}>{item.tip}{item.ikincilTip ? ` · ${item.ikincilTip}` : ''}</T>
      </View>
    </Pressable>
  );

  const shownBrands = brandList.filter(([b]) => !brandQ.trim() || trLower(b).includes(trLower(brandQ.trim())));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <FlatList
        data={list}
        keyExtractor={p => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap }}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing['3xl'], gap: Spacing.xl }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: Spacing['2xl'], gap: Spacing.md }}>
            <T variant="body" color="muted" align="center">Bu kriterlere uyan parfüm yok.</T>
            {anyFilter ? <Button label="Filtreleri temizle" variant="secondary" size="sm" onPress={clearAll} /> : null}
          </View>
        }
        renderItem={renderCard}
      />

      {/* Filtre paneli */}
      <Modal visible={sheet} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSheet(false)}>
        <View style={{ flex: 1, backgroundColor: c.bg }}>
          <View style={[styles.sheetHead, { borderBottomColor: c.border }]}>
            <T variant="h2">Filtrele</T>
            <IconButton name="close" onPress={() => setSheet(false)} accessibilityLabel="Kapat" />
          </View>

          <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['2xl'], gap: Spacing.xl }} keyboardShouldPersistTaps="handled">
            <Section title="Sırala">
              <Segmented<Sort> value={sort} onChange={setSort} options={[{ value: 'match', label: 'Size göre' }, { value: 'az', label: 'A–Z' }, { value: 'fiyat', label: 'Fiyat' }]} />
            </Section>

            <Section title="Marka" right={brands.length ? <T variant="smallStrong" color="accent" onPress={() => setBrands([])}>Temizle</T> : null}>
              <View style={[styles.brandSearch, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Ionicons name="search" size={16} color={c.inkSubtle} />
                <TextInput value={brandQ} onChangeText={setBrandQ} placeholder="Marka ara" placeholderTextColor={c.inkSubtle} style={[styles.brandInput, { color: c.ink }]} autoCorrect={false} />
              </View>
              <ScrollView nestedScrollEnabled style={[styles.brandBox, { borderColor: c.border, backgroundColor: c.surface }]} keyboardShouldPersistTaps="handled">
                {shownBrands.map(([b, n], i) => {
                  const on = brands.includes(b);
                  return (
                    <Pressable
                      key={b}
                      onPress={() => setBrands(toggle(brands, b))}
                      style={[styles.brandRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                    >
                      <T variant="body" style={{ flex: 1 }} numberOfLines={1}>{b}</T>
                      <T variant="small" color="subtle">{n}</T>
                      <Ionicons name={on ? 'checkbox' : 'square-outline'} size={20} color={on ? c.accent : c.inkSubtle} />
                    </Pressable>
                  );
                })}
                {shownBrands.length === 0 ? <T variant="small" color="muted" style={{ padding: Spacing.md }}>Bu adla bir marka yok.</T> : null}
              </ScrollView>
            </Section>

            <Section title="Koku ailesi">
              <View style={styles.wrap}>
                {FAMILIES.map(f => <Chip key={f} label={f} color={ScentTypeColors[f]} selected={families.includes(f)} onPress={() => setFamilies(toggle(families, f))} />)}
              </View>
            </Section>

            <Section title="Profil">
              <View style={styles.wrap}>
                {GENDERS.map(g => <Chip key={g.v} label={g.l} selected={gender === g.v} onPress={() => setGender(gender === g.v ? null : g.v)} />)}
              </View>
            </Section>

            <Section title="Yoğunluk">
              <View style={styles.wrap}>
                {STRENGTH.map(s => <Chip key={s.v} label={s.l} selected={strength === s.v} onPress={() => setStrength(strength === s.v ? null : s.v)} />)}
              </View>
            </Section>

            <Section title="Fiyat">
              <View style={styles.wrap}>
                {PRICES.map(p => <Chip key={p.v} label={p.l} selected={prices.includes(p.v)} onPress={() => setPrices(toggle(prices, p.v))} />)}
              </View>
            </Section>
          </ScrollView>

          <View style={[styles.sheetFoot, { borderTopColor: c.border, paddingBottom: insets.bottom + Spacing.md }]}>
            <Button label="Temizle" variant="ghost" onPress={clearAll} style={{ flex: 1 }} />
            <Button label={`${list.length} parfümü göster`} onPress={() => setSheet(false)} style={{ flex: 2 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={{ gap: Spacing.md }}>
      <View style={styles.sectionHead}>
        <T variant="overline" color="subtle">{title}</T>
        {right}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: Spacing.lg },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
  filterBtn: { width: 48, height: 48, borderRadius: BorderRadius.md, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  chips: { gap: Spacing.sm, marginTop: Spacing.md },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.lg },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  art: { borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  match: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  familyLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetFoot: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  brandSearch: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, height: 42 },
  brandInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15 },
  brandBox: { borderWidth: StyleSheet.hairlineWidth, borderRadius: BorderRadius.md, maxHeight: 300 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 11 },
});
