/**
 * Aranabilir parfüm seçici (günün kokusu, karşılaştırma, katmanlama, günlük...).
 * Favoriler en üstte listelenir.
 */
import { trLower } from '@/utils/text';
import { BorderRadius, FontFamilies, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Parfum } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, Modal, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, T, useTheme } from './index';
import { PerfumeRow } from './perfume';

export const normalizeTr = (s: string) => trLower(s).normalize('NFD').replace(/[̀-ͯ]/g, '');

export function matchesQuery(p: Parfum, q: string) {
  if (!q) return true;
  const n = normalizeTr(q);
  const hay = normalizeTr([p.isim, p.marka, p.tip, p.ikincilTip, ...p.notalar.ust, ...p.notalar.orta, ...p.notalar.alt].filter(Boolean).join(' '));
  return n.split(/\s+/).every(t => hay.includes(t));
}

export function SearchField({ value, onChangeText, placeholder = 'Parfüm, marka veya nota ara' }: { value: string; onChangeText: (t: string) => void; placeholder?: string }) {
  const c = useTheme();
  return (
    <View style={[styles.search, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Ionicons name="search" size={18} color={c.inkSubtle} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.inkSubtle}
        style={[styles.searchInput, { color: c.ink }]}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value ? <Ionicons name="close-circle" size={18} color={c.inkSubtle} onPress={() => onChangeText('')} /> : null}
    </View>
  );
}

export function PerfumePicker({ visible, onClose, onSelect, title = 'Parfüm seçin', excludeIds = [] }: { visible: boolean; onClose: () => void; onSelect: (p: Parfum) => void; title?: string; excludeIds?: string[] }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { parfumler, favorites } = useApp();
  const [q, setQ] = useState('');

  const data = useMemo(() => {
    const list = parfumler.filter(p => !excludeIds.includes(p.id) && matchesQuery(p, q));
    return [...list.filter(p => favorites.includes(p.id)), ...list.filter(p => !favorites.includes(p.id))];
  }, [parfumler, favorites, q, excludeIds]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={styles.head}>
          <T variant="h2" style={{ flex: 1 }}>{title}</T>
          <IconButton name="close" onPress={onClose} accessibilityLabel="Kapat" />
        </View>
        <View style={{ paddingHorizontal: Spacing.lg }}>
          <SearchField value={q} onChangeText={setQ} />
        </View>
        <FlatList
          data={data}
          keyExtractor={p => p.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }}
          ListEmptyComponent={<T variant="body" color="muted" align="center" style={{ marginTop: Spacing['2xl'] }}>Sonuç bulunamadı.</T>}
          renderItem={({ item }) => (
            <PerfumeRow
              parfum={item}
              onPress={() => { onSelect(item); setQ(''); onClose(); }}
              right={favorites.includes(item.id) ? <Ionicons name="heart" size={16} color={c.accent} /> : undefined}
            />
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', paddingLeft: Spacing.lg, paddingRight: Spacing.sm, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  search: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, height: 46, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, borderWidth: StyleSheet.hairlineWidth },
  searchInput: { flex: 1, fontFamily: FontFamilies.regular, fontSize: 15, height: '100%' },
});
