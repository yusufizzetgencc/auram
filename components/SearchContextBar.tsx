/**
 * "Şu an ne arıyorsunuz?" — mevsim, kullanım amacı, ortam ve yoğunluğu tek dokunuşla değiştirir.
 * Kalıcı profil değişmez (bağlam oturumla sınırlı); isteyen "Varsayılanım yap" ile profile yazar.
 * Mevsim varsayılan olarak bugünün tarihinden gelir. Bkz. engine/context.ts.
 */
import { Chip, T, useTheme } from '@/components/kit';
import { soruBul } from '@/constants/questions';
import { Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { AramaBaglami, BaglamAlani, mevsimOf } from '@/engine';
import { track } from '@/services/analytics';
import { UserPreferences } from '@/types';
import { hapticLight } from '@/utils/haptics';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { QuestionSheet, SheetDeger } from './QuestionSheet';

const ALAN: { alan: BaglamAlani; soru: string; baslik: string }[] = [
  { alan: 'mevsim', soru: 'mevsim', baslik: 'Mevsim' },
  { alan: 'kullanimAmaci', soru: 'amac', baslik: 'Amaç' },
  { alan: 'ortam', soru: 'ortam', baslik: 'Ortam' },
  { alan: 'konsantrasyonTercihi', soru: 'yogunluk', baslik: 'Yoğunluk' },
];

const etiket = (soruId: string, v: unknown): string | null => {
  const q = soruBul(soruId);
  const bul = (x: string) => q?.options?.find(o => o.value === x)?.label?.split(',')[0] ?? x;
  if (Array.isArray(v)) return v.length ? v.map(bul).join(', ') : null;
  return typeof v === 'string' ? bul(v) : null;
};

export function SearchContextBar({ style }: { style?: object }) {
  const c = useTheme();
  const { preferences, aramaBaglami, setAramaBaglami, sifirlaAramaBaglami, setPreference } = useApp();
  const [acik, setAcik] = useState<(typeof ALAN)[number] | null>(null);
  const aktif = ALAN.some(a => {
    const v = aramaBaglami[a.alan];
    return Array.isArray(v) ? v.length > 0 : v != null;
  });

  const deger = (a: (typeof ALAN)[number]): unknown =>
    aramaBaglami[a.alan] ?? (a.alan === 'mevsim' ? null : preferences[a.alan as keyof UserPreferences]);

  const chipEtiketi = (a: (typeof ALAN)[number]) => {
    if (a.alan === 'mevsim' && aramaBaglami.mevsim == null) return `${a.baslik}: ${mevsimOf(new Date())} · bugün`;
    return `${a.baslik}: ${etiket(a.soru, deger(a)) ?? 'fark etmez'}`;
  };

  const uygula = (a: (typeof ALAN)[number], v: SheetDeger) => {
    hapticLight();
    setAramaBaglami({ [a.alan]: v } as Partial<AramaBaglami>);
    track('search_context_changed', { alan: a.alan });
  };

  return (
    <View style={style}>
      <T variant="overline" color="subtle" style={{ marginBottom: Spacing.sm }}>Şu an ne arıyorsunuz?</T>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {ALAN.map(a => {
          const degisti = Array.isArray(aramaBaglami[a.alan]) ? (aramaBaglami[a.alan] as unknown[]).length > 0 : aramaBaglami[a.alan] != null;
          return <Chip key={a.alan} label={chipEtiketi(a)} icon="chevron-down" selected={degisti} onPress={() => setAcik(a)} />;
        })}
        {aktif ? <Chip label="Profilime dön" icon="refresh" onPress={() => { hapticLight(); sifirlaAramaBaglami(); }} /> : null}
      </ScrollView>
      {aktif ? (
        <T variant="small" color="muted" style={{ marginTop: Spacing.xs }}>Bu seçimler yalnızca şimdiki arama için; profiliniz değişmedi.</T>
      ) : null}
      {acik ? (
        <QuestionSheet
          soruId={acik.soru}
          visible
          value={(aramaBaglami[acik.alan] ?? (acik.alan === 'mevsim' ? null : preferences[acik.alan as keyof UserPreferences] ?? null)) as SheetDeger}
          onClose={() => setAcik(null)}
          onApply={v => uygula(acik, v)}
          autoLabel={acik.alan === 'mevsim' ? `Otomatik: ${mevsimOf(new Date())} (bugünün mevsimi)` : undefined}
          footerNote="Öneriler hemen yeniden sıralanır. Kalıcı profiliniz değişmez."
          secondary={acik.alan === 'mevsim' ? undefined : {
            label: 'Varsayılanım yap',
            onPress: v => {
              if (v == null) return;
              setPreference(acik.alan as keyof UserPreferences, v as never);
              setAramaBaglami({ [acik.alan]: null } as Partial<AramaBaglami>);
              track('search_context_saved', { alan: acik.alan });
            },
          }}
        />
      ) : null}
      <View style={[styles.line, { backgroundColor: c.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.xs, paddingRight: Spacing.lg },
  line: { height: StyleSheet.hairlineWidth, marginTop: Spacing.md },
});
