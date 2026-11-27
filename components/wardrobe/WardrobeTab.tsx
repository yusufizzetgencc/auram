/**
 * Koleksiyon → Dolabım: sahip olunan parfümler 2 sütunlu ızgarada (şişe, kalan miktar şeridi, son kullanım; sağ üst → şişe ayrıntıları),
 * uzun süredir sıkılmayanlar ve (Premium) dolap analizi + sıradaki alım.
 * Dolap; sabah önerisinin, Kararsız mısınız'ın ve Koku Danışmanı'nın kaynağıdır.
 */
import { Button, Card, EmptyState, T, useTheme } from '@/components/kit';
import { Bottle, brandCaps, PerfumeRow } from '@/components/kit/perfume';
import { PerfumePicker } from '@/components/kit/PerfumePicker';
import { LockedFeatureOverlay } from '@/components/paywall';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { dolapAnalizi, getEffectivePH, kokuHafizasi } from '@/engine';
import { track } from '@/services/analytics';
import { Parfum, WardrobeItem } from '@/types';
import { dayDiff, toLocalDateKey } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SIKIS_ML, WardrobeDraft, WardrobeItemSheet } from './WardrobeItemSheet';

const MEVSIM_KISA: Record<string, string> = { 'İlkbahar': 'İlkbahar', 'Yaz': 'Yaz', 'Sonbahar': 'Sonbahar', 'Kış': 'Kış' };

export function WardrobeTab({ isPremium, onPaywall }: { isPremium: boolean; onPaywall: () => void }) {
  const router = useRouter();
  const c = useTheme();
  const {
    parfumler, preferences, favorites, sotdHistory, wardrobe, wardrobeParfums,
    addToWardrobe, updateWardrobeItem, removeFromWardrobe, zevk } = useApp();
  const [picker, setPicker] = useState(false);
  const [draftParfum, setDraftParfum] = useState<Parfum | null>(null);
  const [editing, setEditing] = useState<WardrobeItem | null>(null);
  const { width } = useWindowDimensions();
  const tileW = (width - Spacing.lg * 2 - Spacing.md) / 2;

  const bugun = toLocalDateKey();
  const sonKullanim = useMemo(() => {
    const m = new Map<string, number>();
    sotdHistory.forEach(s => {
      const d = dayDiff(s.date, bugun);
      if (d >= 0 && (!m.has(s.parfumId) || d < m.get(s.parfumId)!)) m.set(s.parfumId, d);
    });
    return m;
  }, [sotdHistory, bugun]);

  const analiz = useMemo(() => {
    if (!wardrobeParfums.length) return null;
    return dolapAnalizi(wardrobeParfums, parfumler, preferences, getEffectivePH(preferences), zevk);
  }, [wardrobeParfums, parfumler, preferences, zevk]);

  const unutulanlar = useMemo(
    () => kokuHafizasi(sotdHistory.map(s => ({ parfumId: s.parfumId, date: s.date })), [], parfumler, wardrobe, bugun).unutulanlar,
    [sotdHistory, parfumler, wardrobe, bugun],
  );

  const favNotOwned = favorites.filter(id => !wardrobe.some(w => w.parfumId === id));

  const saveNew = async (d: WardrobeDraft) => {
    if (!draftParfum) return;
    await addToWardrobe(draftParfum.id, d);
    track('wardrobe_add', { kaynak: 'dolap_ekrani' });
    setDraftParfum(null);
  };
  const saveEdit = async (d: WardrobeDraft) => {
    if (!editing) return;
    await updateWardrobeItem(editing.id, d);
    setEditing(null);
  };
  const importFavs = async () => {
    for (const id of favNotOwned) await addToWardrobe(id);
    track('wardrobe_add', { kaynak: 'favoriler', adet: favNotOwned.length });
  };

  const editingParfum = editing ? parfumler.find(p => p.id === editing.parfumId) ?? null : null;

  if (!wardrobe.length) {
    return (
      <View style={{ marginTop: Spacing.lg }}>
        <EmptyState
          icon="file-tray-stacked-outline"
          title="Dolabınızı oluşturun"
          body="Sahip olduğunuz parfümleri ekleyin; her sabah aralarından havaya, gününüze ve teninize en uygununu önerelim."
          actionLabel="Parfüm ekle"
          onAction={() => setPicker(true)}
        />
        {favNotOwned.length ? <Button label={`Favorilerimden aktar (${favNotOwned.length})`} variant="ghost" icon="heart-outline" onPress={importFavs} /> : null}
        <PerfumePicker visible={picker} onClose={() => setPicker(false)} title="Dolabınıza ekleyin" onSelect={p => setDraftParfum(p)} />
        <WardrobeItemSheet visible={!!draftParfum} parfum={draftParfum} onClose={() => setDraftParfum(null)} onSave={saveNew} />
      </View>
    );
  }

  return (
    <View style={{ marginTop: Spacing.lg, gap: Spacing.lg }}>
      {/* Dolap ızgarası: dokun → detay, sağ üst → şişe ayrıntıları */}
      <View style={styles.grid}>
        {wardrobe.map(w => {
          const p = parfumler.find(x => x.id === w.parfumId);
          if (!p) return null;
          const son = sonKullanim.get(p.id);
          const kalanMl = w.hacimMl ? (w.hacimMl * w.kalanYuzde) / 100 : null;
          const az = w.kalanYuzde <= 15;
          return (
            <Pressable key={w.id} onPress={() => router.push(`/parfum/${p.id}`)} style={({ pressed }) => [{ width: tileW, opacity: pressed ? 0.85 : 1 }]}>
              <View style={[styles.tileArt, { height: tileW * 1.05, backgroundColor: c.surfaceAlt }]}>
                <Bottle parfum={p} size={tileW * 0.5} />
                <Pressable onPress={() => setEditing(w)} hitSlop={10} style={[styles.tileBtn, { backgroundColor: c.surface, borderColor: c.border }]} accessibilityLabel={`${p.isim} şişe ayrıntıları`}>
                  <Ionicons name="options-outline" size={15} color={c.ink} />
                </Pressable>
                {son === 0 ? (
                  <View style={[styles.tileTag, { backgroundColor: c.accent }]}><T variant="overline" color="onAccent" style={{ fontSize: 9 }}>Bugün</T></View>
                ) : az && w.hacimMl ? (
                  <View style={[styles.tileTag, { backgroundColor: c.danger }]}><T variant="overline" color="onAccent" style={{ fontSize: 9 }}>Azalıyor</T></View>
                ) : null}
                {w.hacimMl ? (
                  <View style={[styles.tileLevel, { backgroundColor: c.border }]}>
                    <View style={{ width: `${Math.max(3, w.kalanYuzde)}%`, height: '100%', backgroundColor: az ? c.danger : c.accent }} />
                  </View>
                ) : null}
              </View>
              <T variant="overline" caps={brandCaps(p)} color="subtle" numberOfLines={1} style={{ marginTop: Spacing.sm }}>{p.marka}</T>
              <T variant="bodyStrong" numberOfLines={1}>{p.isim}</T>
              <T variant="small" color="subtle" numberOfLines={1}>
                {kalanMl !== null ? `~${Math.floor(kalanMl / SIKIS_ML)} sıkış · ` : ''}{son === undefined ? 'henüz sıkılmadı' : son === 0 ? 'bugün' : son === 1 ? 'dün' : `${son} gün önce`}
              </T>
            </Pressable>
          );
        })}
        <Pressable onPress={() => setPicker(true)} style={({ pressed }) => [styles.addTile, { width: tileW, height: tileW * 1.05, borderColor: c.border, opacity: pressed ? 0.7 : 1 }]}>
          <View style={[styles.addIcon, { backgroundColor: c.accentSoft }]}><Ionicons name="add" size={22} color={c.accent} /></View>
          <T variant="smallStrong" color="muted" style={{ marginTop: Spacing.sm }}>Parfüm ekle</T>
        </Pressable>
      </View>

      {/* Unutulanlar */}
      {unutulanlar.length ? (
        <Card>
          <View style={styles.inline}><Ionicons name="time-outline" size={18} color={c.accent} /><T variant="bodyStrong">Uzun süredir sıkmadıklarınız</T></View>
          <T variant="small" color="muted" style={{ marginTop: 4 }}>Sabah önerilerinde bunlara öncelik veriyoruz.</T>
          <View style={styles.chips}>
            {unutulanlar.slice(0, 4).map(u => (
              <Pressable key={u.parfum.id} onPress={() => router.push(`/parfum/${u.parfum.id}`)} style={[styles.chip, { backgroundColor: c.surfaceAlt }]}>
                <T variant="smallStrong">{u.parfum.isim}</T>
                <T variant="small" color="muted">{u.gun === null ? 'hiç' : `${u.gun} gün`}</T>
              </Pressable>
            ))}
          </View>
        </Card>
      ) : null}

      {/* Dolap analizi (Premium) */}
      {analiz ? (
        <View>
          <T variant="h3" style={{ marginBottom: Spacing.sm }}>Dolap analizi</T>
          {(() => {
            const icerik = (
              <Card>
                <T variant="overline" color="subtle">Mevsimler</T>
                <View style={styles.seasons}>
                  {(Object.keys(analiz.mevsim) as (keyof typeof analiz.mevsim)[]).map(m => (
                    <View key={m} style={[styles.season, { backgroundColor: analiz.mevsim[m] ? c.accentSoft : c.surfaceAlt }]}>
                      <T variant="smallStrong" color={analiz.mevsim[m] ? 'accent' : 'subtle'}>{analiz.mevsim[m]}</T>
                      <T variant="small" color="muted">{MEVSIM_KISA[m]}</T>
                    </View>
                  ))}
                </View>
                <View style={[styles.inline, { marginTop: Spacing.md, gap: Spacing.lg }]}>
                  <T variant="small" color="muted">Gündüz: <T variant="smallStrong">{analiz.gunduz}</T></T>
                  <T variant="small" color="muted">Akşam: <T variant="smallStrong">{analiz.aksam}</T></T>
                  <T variant="small" color="muted">Aile: <T variant="smallStrong">{analiz.aileler.length}</T></T>
                </View>
                {analiz.eksikler.length ? (
                  <View style={{ marginTop: Spacing.lg, gap: Spacing.sm }}>
                    {analiz.eksikler.slice(0, 3).map(e => (
                      <View key={e.tur + e.anahtar} style={styles.gap}>
                        <Ionicons name="alert-circle-outline" size={16} color={c.warning} />
                        <View style={{ flex: 1 }}>
                          <T variant="smallStrong">{e.baslik}</T>
                          <T variant="small" color="muted">{e.aciklama}</T>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <T variant="small" color="success" style={{ marginTop: Spacing.md }}>Dolabınız mevsimler ve gün/akşam için dengeli görünüyor.</T>
                )}
                {analiz.siradakiAlim.length ? (
                  <>
                    <T variant="overline" color="subtle" style={{ marginTop: Spacing.lg }}>Sıradaki alımınız için</T>
                    {analiz.siradakiAlim.map(s => (
                      <PerfumeRow key={s.parfum.id} parfum={s.parfum} subtitle={s.gerekce} onPress={() => router.push(`/parfum/${s.parfum.id}`)} right={<T variant="smallStrong" color="accent">%{s.uyum}</T>} />
                    ))}
                  </>
                ) : null}
              </Card>
            );
            return isPremium ? icerik : (
              <LockedFeatureOverlay onUnlock={onPaywall} title="Dolap analizi Premium'da" subtitle={analiz.eksikler.length ? `Dolabınızda ${analiz.eksikler.length} eksik bulduk; nasıl kapatacağınızı görün.` : 'Mevsim, gündüz/akşam dengesi ve sıradaki alım önerisi.'}>
                {icerik}
              </LockedFeatureOverlay>
            );
          })()}
        </View>
      ) : null}

      <PerfumePicker visible={picker} onClose={() => setPicker(false)} title="Dolabınıza ekleyin" excludeIds={wardrobe.map(w => w.parfumId)} onSelect={p => setDraftParfum(p)} />
      <WardrobeItemSheet visible={!!draftParfum} parfum={draftParfum} onClose={() => setDraftParfum(null)} onSave={saveNew} />
      <WardrobeItemSheet
        visible={!!editing}
        parfum={editingParfum}
        item={editing}
        onClose={() => setEditing(null)}
        onSave={saveEdit}
        onRemove={() => { if (editing) removeFromWardrobe(editing.id); setEditing(null); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, rowGap: Spacing.lg },
  tileArt: { borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tileBtn: { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  tileTag: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  tileLevel: { position: 'absolute', left: 12, right: 12, bottom: 12, height: 4, borderRadius: 2, overflow: 'hidden' },
  addTile: { borderRadius: BorderRadius.lg, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  chip: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  seasons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  season: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  gap: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
});
