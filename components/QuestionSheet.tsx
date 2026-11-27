/**
 * Tek bir profil sorusunu alttan açılan panelde sorar — 20 soruluk testi baştan yapmadan tek cevabı değiştirmek için.
 * Hem "Şu an ne arıyorsunuz?" çubuğu (geçici) hem Profil → Tercihleriniz (kalıcı) kullanır.
 * Seçenekler constants/questions.ts'ten gelir; metin ve "Neden soruyoruz?" tek kaynakta kalır.
 */
import { Button, IconButton, OptionCard, T, useTheme } from '@/components/kit';
import { soruBul } from '@/constants/questions';
import { Spacing } from '@/constants/theme';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SheetDeger = string | string[] | null;

export function QuestionSheet({
  soruId, visible, value, onClose, onApply, autoLabel, footerNote, secondary,
}: {
  soruId: string;
  visible: boolean;
  value: SheetDeger;
  onClose: () => void;
  /** null → "otomatik"/profildeki değere dön */
  onApply: (v: SheetDeger) => void;
  /** Verilirse en üstte "otomatik" seçeneği çıkar (ör. mevsim: bugünün mevsimi) */
  autoLabel?: string;
  footerNote?: string;
  /** İkinci eylem (ör. "Varsayılanım yap") */
  secondary?: { label: string; onPress: (v: SheetDeger) => void };
}) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const q = soruBul(soruId);
  const multi = q?.type === 'multi';
  // İkinci eylem varsa tek seçimli sorularda da önce seçilir, sonra "Uygula"/ikinci eylemle onaylanır
  const onayli = multi || !!secondary;
  const [secim, setSecim] = useState<SheetDeger>(value);
  useEffect(() => { if (visible) setSecim(value); }, [visible, value]);
  if (!q?.options) return null;

  const sec = (v: string) => {
    if (!onayli) { onApply(v); onClose(); return; }
    if (!multi) { setSecim(v); return; }
    const liste = Array.isArray(secim) ? secim : [];
    setSecim(liste.includes(v) ? liste.filter(x => x !== v) : [...liste, v]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={styles.head}>
          <T variant="h2" style={{ flex: 1 }}>{q.title}</T>
          <IconButton name="close" onPress={onClose} accessibilityLabel="Kapat" />
        </View>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.sm }}>
          {q.why ? <T variant="small" color="muted" style={{ marginBottom: Spacing.sm }}>{q.why}</T> : null}
          {autoLabel ? (
            <OptionCard title={autoLabel} icon="sync-outline" selected={secim == null} onPress={() => { onApply(null); onClose(); }} />
          ) : null}
          {q.options.map(o => (
            <OptionCard
              key={o.value}
              title={o.label}
              subtitle={o.hint}
              icon={o.icon}
              multi={multi}
              selected={multi ? (Array.isArray(secim) && secim.includes(o.value)) : secim === o.value}
              onPress={() => sec(o.value)}
            />
          ))}
          {footerNote ? <T variant="small" color="subtle" style={{ marginTop: Spacing.sm }}>{footerNote}</T> : null}
        </ScrollView>
        {onayli ? (
          <View style={[styles.foot, { paddingBottom: insets.bottom + Spacing.md, borderTopColor: c.border }]}>
            {secondary ? <Button label={secondary.label} variant="secondary" disabled={secim == null || (Array.isArray(secim) && !secim.length)} onPress={() => { secondary.onPress(secim); onClose(); }} style={{ flex: 1 }} /> : null}
            <Button
              label="Uygula"
              onPress={() => { onApply(Array.isArray(secim) ? (secim.length ? secim : null) : secim); onClose(); }}
              style={{ flex: 1 }}
            />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  foot: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
});
