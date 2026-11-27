/**
 * Koleksiyon vitrini: parfümler bir rafta yan yana, altında koku ailesi dağılım şeridi ve kısa özet.
 * Görsel, sekmedeki parfümlere göre değişir (Dolabım / Favori / Listeler).
 */
import { T, useTheme } from '@/components/kit';
import { Bottle, familyColor } from '@/components/kit/perfume';
import { BorderRadius, Spacing } from '@/constants/theme';
import { Parfum } from '@/types';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export function Showcase({ parfumler, baslik, ozet }: { parfumler: Parfum[]; baslik: string; ozet: { deger: string; etiket: string }[] }) {
  const c = useTheme();

  const aileler = useMemo(() => {
    const m = new Map<string, number>();
    parfumler.forEach(p => {
      m.set(p.tip, (m.get(p.tip) ?? 0) + 1);
      if (p.ikincilTip) m.set(p.ikincilTip, (m.get(p.ikincilTip) ?? 0) + 0.5);
    });
    const toplam = [...m.values()].reduce((s, v) => s + v, 0) || 1;
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([aile, n]) => ({ aile, pay: n / toplam }));
  }, [parfumler]);

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <T variant="overline" color="accent">{baslik}</T>

      {/* Raf */}
      <View style={[styles.shelfArea, { backgroundColor: c.surfaceAlt }]}>
        {parfumler.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bottles}>
            {parfumler.map(p => (
              <View key={p.id} style={styles.bottle}><Bottle parfum={p} size={parfumler.length > 5 ? 46 : 58} /></View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyShelf}><T variant="small" color="subtle">Rafınız boş</T></View>
        )}
        <View style={[styles.shelf, { backgroundColor: c.border }]} />
      </View>

      {/* Aile dağılımı */}
      {aileler.length ? (
        <>
          <View style={styles.bar}>
            {aileler.map(a => <View key={a.aile} style={{ flex: a.pay, backgroundColor: familyColor(a.aile) }} />)}
          </View>
          <View style={styles.legend}>
            {aileler.slice(0, 4).map(a => (
              <View key={a.aile} style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: familyColor(a.aile) }]} />
                <T variant="small" color="muted">{a.aile} %{Math.round(a.pay * 100)}</T>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <View style={[styles.stats, { borderTopColor: c.border }]}>
        {ozet.map(o => (
          <View key={o.etiket} style={{ flex: 1 }}>
            <T variant="h2">{o.deger}</T>
            <T variant="small" color="muted">{o.etiket}</T>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: BorderRadius.lg, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.lg, marginTop: Spacing.lg },
  shelfArea: { marginTop: Spacing.md, borderRadius: BorderRadius.md, paddingTop: Spacing.lg, overflow: 'hidden' },
  bottles: { flexGrow: 1, justifyContent: 'center', alignItems: 'flex-end', gap: Spacing.lg, paddingHorizontal: Spacing.lg },
  bottle: { alignItems: 'center', justifyContent: 'flex-end' },
  emptyShelf: { height: 70, alignItems: 'center', justifyContent: 'center' },
  shelf: { height: 6, marginTop: 2 },
  bar: { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', marginTop: Spacing.lg },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.md, rowGap: 4, marginTop: Spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  stats: { flexDirection: 'row', marginTop: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
});
