/**
 * Dolaptaki bir şişenin ayrıntıları: hacim, kalan miktar, alınma tarihi, not.
 * Yeni eklemede (item yokken) aynı form "Dolabıma ekle" olarak çalışır.
 * Kalan miktar her "günün kokusu" kaydında ~0.3 ml (3 sıkış) düşülür; buradan elle düzeltilebilir.
 */
import { Button, Divider, IconButton, ProgressLine, T, useTheme } from '@/components/kit';
import { Bottle, brandCaps } from '@/components/kit/perfume';
import { BorderRadius, FontFamilies, Spacing } from '@/constants/theme';
import { Parfum, WardrobeItem } from '@/types';
import { hapticLight } from '@/utils/haptics';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HACIMLER = [10, 30, 50, 75, 100, 125, 200];
const KALAN = [100, 75, 50, 25, 10];
export const SIKIS_ML = 0.1;

export interface WardrobeDraft {
  hacimMl: number | null;
  kalanYuzde: number;
  alinmaTarihi: string | null;
  not: string;
}

export function WardrobeItemSheet({
  visible, parfum, item, onClose, onSave, onRemove,
}: {
  visible: boolean;
  parfum: Parfum | null;
  item?: WardrobeItem | null;
  onClose: () => void;
  onSave: (d: WardrobeDraft) => void;
  onRemove?: () => void;
}) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [hacim, setHacim] = useState<number | null>(null);
  const [kalan, setKalan] = useState(100);
  const [yil, setYil] = useState<string>('');
  const [not, setNot] = useState('');

  useEffect(() => {
    if (!visible) return;
    setHacim(item?.hacimMl ?? null);
    setKalan(item ? Math.round(item.kalanYuzde) : 100);
    setYil(item?.alinmaTarihi ? item.alinmaTarihi.slice(0, 4) : '');
    setNot(item?.not ?? '');
  }, [visible, item]);

  if (!parfum) return null;
  const kalanMl = hacim ? Math.round((hacim * kalan) / 100) : null;
  const sikis = kalanMl !== null ? Math.floor(kalanMl / SIKIS_ML) : null;
  const yilNum = parseInt(yil, 10);
  const yilGecerli = !yil || (yilNum >= 1980 && yilNum <= new Date().getFullYear());

  const save = () => {
    if (!yilGecerli) return;
    onSave({ hacimMl: hacim, kalanYuzde: kalan, alinmaTarihi: yil ? `${yilNum}-01-01` : null, not: not.trim() });
  };
  const remove = () =>
    Alert.alert('Dolaptan çıkar', `${parfum.isim} dolabınızdan çıkarılsın mı? Günlük kayıtlarınız silinmez.`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkar', style: 'destructive', onPress: onRemove },
    ]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.head}>
          <T variant="h2">{item ? 'Şişe ayrıntıları' : 'Dolabıma ekle'}</T>
          <IconButton name="close" onPress={onClose} accessibilityLabel="Kapat" />
        </View>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.xl }} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Bottle parfum={parfum} size={64} />
            <View style={{ flex: 1 }}>
              <T variant="overline" caps={brandCaps(parfum)} color="subtle">{parfum.marka}</T>
              <T variant="h3">{parfum.isim}</T>
            </View>
          </View>

          <View style={{ gap: Spacing.sm }}>
            <T variant="overline" color="subtle">Şişe hacmi</T>
            <View style={styles.wrap}>
              {HACIMLER.map(ml => (
                <Pressable key={ml} onPress={() => { hapticLight(); setHacim(ml); }} style={[styles.pill, { borderColor: hacim === ml ? c.accent : c.border, backgroundColor: hacim === ml ? c.accentSoft : c.surface }]}>
                  <T variant="smallStrong" color={hacim === ml ? 'accent' : 'ink'}>{ml} ml</T>
                </Pressable>
              ))}
              <Pressable onPress={() => setHacim(null)} style={[styles.pill, { borderColor: hacim === null ? c.accent : c.border, backgroundColor: hacim === null ? c.accentSoft : c.surface }]}>
                <T variant="smallStrong" color={hacim === null ? 'accent' : 'ink'}>Bilmiyorum</T>
              </Pressable>
            </View>
          </View>

          <View style={{ gap: Spacing.sm }}>
            <View style={styles.rowBetween}>
              <T variant="overline" color="subtle">Kalan miktar</T>
              <T variant="smallStrong">%{kalan}{kalanMl !== null ? ` · ~${kalanMl} ml` : ''}</T>
            </View>
            <ProgressLine value={kalan} />
            <View style={styles.stepRow}>
              <Button label="−5" size="sm" variant="secondary" onPress={() => setKalan(k => Math.max(0, k - 5))} style={{ flex: 1 }} />
              {KALAN.map(k => (
                <Pressable key={k} onPress={() => setKalan(k)} style={[styles.pillSm, { borderColor: kalan === k ? c.accent : c.border }]}>
                  <T variant="small" color={kalan === k ? 'accent' : 'muted'}>%{k}</T>
                </Pressable>
              ))}
              <Button label="+5" size="sm" variant="secondary" onPress={() => setKalan(k => Math.min(100, k + 5))} style={{ flex: 1 }} />
            </View>
            <T variant="small" color="muted">
              {sikis !== null ? `Yaklaşık ${sikis} sıkış kaldı. ` : ''}Her günün kokusu kaydında ~3 sıkış düşülür; buradan düzeltebilirsiniz.
            </T>
          </View>

          <View style={{ gap: Spacing.sm }}>
            <T variant="overline" color="subtle">Alındığı yıl (isteğe bağlı)</T>
            <TextInput
              value={yil}
              onChangeText={t => setYil(t.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="number-pad"
              placeholder={String(new Date().getFullYear())}
              placeholderTextColor={c.inkSubtle}
              style={[styles.input, { color: c.ink, borderColor: yilGecerli ? c.border : c.danger, backgroundColor: c.surface }]}
            />
            {!yilGecerli ? <T variant="small" color="danger">1980 ile {new Date().getFullYear()} arasında bir yıl girin.</T> : null}
          </View>

          <View style={{ gap: Spacing.sm }}>
            <T variant="overline" color="subtle">Not (isteğe bağlı)</T>
            <TextInput
              value={not}
              onChangeText={setNot}
              placeholder="Örn. Doğum günü hediyesi, tester şişe…"
              placeholderTextColor={c.inkSubtle}
              maxLength={120}
              multiline
              style={[styles.input, styles.note, { color: c.ink, borderColor: c.border, backgroundColor: c.surface }]}
            />
          </View>

          {item && onRemove ? (
            <>
              <Divider />
              <Button label="Dolaptan çıkar" icon="trash-outline" variant="ghost" onPress={remove} />
            </>
          ) : null}
        </ScrollView>
        <View style={[styles.foot, { borderTopColor: c.border, paddingBottom: insets.bottom + Spacing.md }]}>
          <Button label={item ? 'Kaydet' : 'Dolabıma ekle'} icon={item ? 'checkmark' : 'add'} onPress={save} disabled={!yilGecerli} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1 },
  pillSm: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: { height: 48, borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, fontFamily: FontFamilies.medium, fontSize: 16 },
  note: { height: 84, paddingTop: 12, textAlignVertical: 'top' },
  foot: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
});
