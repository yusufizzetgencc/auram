/**
 * TENİNDE — Mağaza modu
 * Parfümeriye gitmeden önce "denenecekler" listesi, mağazada kısa deneme rehberi,
 * denedikten sonra tek dokunuşla "sevdim / sevmedim" (öneriler buna göre kişiselleşir).
 * Liste cihazda saklanır (services/storage.ts → TRY_LIST). Ücretsiz özelliktir.
 */
import { Button, Card, Divider, Header, Screen, Section, T, useTheme } from '@/components/kit';
import { Bottle, brandCaps } from '@/components/kit/perfume';
import { PerfumePicker } from '@/components/kit/PerfumePicker';
import { Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { getRecommendationsPure } from '@/engine';
import { getTryList, saveTryList, TryItem } from '@/services/storage';
import { hapticLight, hapticSuccess } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

const TIPS: [string, string][] = [
  ['hand-left-outline', 'Kâğıda değil bileğinize sıkın; parfüm tende farklı açılır.'],
  ['time-outline', 'Karar vermek için en az 20–30 dakika bekleyin; ilk koku yanıltır.'],
  ['albums-outline', 'Bir ziyarette en fazla 3 parfüm deneyin; burnunuz yorulur.'],
  ['cafe-outline', 'Arada kendi teninizi (ör. dirsek içi) koklayarak burnunuzu dinlendirin.'],
  ['water-outline', 'Beğendiyseniz tam şişeden önce numune (dekant) isteyin.'],
];

export default function StoreModeScreen() {
  const router = useRouter();
  const c = useTheme();
  const { parfumler, preferences, setPreference, getParfumById, etkinPrefs } = useApp();
  const [list, setList] = useState<TryItem[]>([]);
  const [picking, setPicking] = useState(false);

  useEffect(() => { getTryList().then(setList); }, []);
  const persist = (next: TryItem[]) => { setList(next); saveTryList(next); };

  const add = (ids: string[]) => {
    const have = new Set(list.map(t => t.parfumId));
    const fresh = ids.filter(id => !have.has(id)).map(id => ({ parfumId: id, denendi: false, addedAt: new Date().toISOString() }));
    if (fresh.length) { persist([...list, ...fresh]); hapticSuccess(); }
  };
  const addTop3 = () => add(getRecommendationsPure(parfumler, etkinPrefs, undefined, 3).map(r => r.parfum.id));
  const toggleTried = (id: string) => { hapticLight(); persist(list.map(t => (t.parfumId === id ? { ...t, denendi: !t.denendi } : t))); };
  const remove = (id: string) => persist(list.filter(t => t.parfumId !== id));

  const verdict = (id: string, v: 'sevdim' | 'sevmedim') => {
    const sev = (preferences.sevilenParfumler ?? []).filter(x => x !== id);
    const sevme = (preferences.sevilmeyenParfumler ?? []).filter(x => x !== id);
    setPreference('sevilenParfumler', v === 'sevdim' ? [...sev, id] : sev);
    setPreference('sevilmeyenParfumler', v === 'sevmedim' ? [...sevme, id] : sevme);
    hapticSuccess();
  };

  const items = list.map(t => ({ t, p: getParfumById(t.parfumId) })).filter(x => !!x.p);
  const triedCount = items.filter(x => x.t.denendi).length;

  return (
    <Screen>
      <Header title="Mağaza modu" />
      <T variant="h1" style={{ marginTop: Spacing.lg }}>Mağazaya hazır gidin</T>
      <T variant="body" color="muted" style={{ marginTop: Spacing.sm }}>Denemek istediklerinizi listeleyin; mağazada işaretleyin, beğenip beğenmediğinizi söyleyin. Önerileriniz buna göre kişiselleşir.</T>

      <Section title={items.length ? `Denenecekler · ${triedCount}/${items.length}` : 'Denenecekler'} action={items.length ? 'Ekle' : undefined} onAction={() => setPicking(true)}>
        {items.length === 0 ? (
          <Card style={{ alignItems: 'center', gap: Spacing.sm }}>
            <Ionicons name="storefront-outline" size={28} color={c.accent} />
            <T variant="bodyStrong" align="center">Listeniz boş</T>
            <T variant="small" color="muted" align="center">Size en uygun 3 parfümü ekleyerek başlayabilirsiniz.</T>
            <Button label="Bana uygun 3 parfümü ekle" icon="sparkles-outline" size="sm" onPress={addTop3} style={{ marginTop: Spacing.sm }} />
            <Button label="Parfüm seç" variant="ghost" size="sm" onPress={() => setPicking(true)} />
          </Card>
        ) : (
          <Card style={{ paddingVertical: Spacing.sm }}>
            {items.map(({ t, p }, i) => {
              const loved = (preferences.sevilenParfumler ?? []).includes(p!.id);
              const disliked = (preferences.sevilmeyenParfumler ?? []).includes(p!.id);
              return (
                <View key={t.parfumId}>
                  {i > 0 ? <Divider /> : null}
                  <View style={styles.item}>
                    <Pressable onPress={() => toggleTried(t.parfumId)} hitSlop={8} accessibilityRole="checkbox" accessibilityState={{ checked: t.denendi }}>
                      <Ionicons name={t.denendi ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={t.denendi ? c.accent : c.inkSubtle} />
                    </Pressable>
                    <Bottle parfum={p!} size={36} />
                    <Pressable style={{ flex: 1 }} onPress={() => router.push(`/parfum/${p!.id}`)}>
                      <T variant="overline" caps={brandCaps(p)} color="subtle" numberOfLines={1}>{p!.marka}</T>
                      <T variant="bodyStrong" numberOfLines={1} style={t.denendi ? { color: c.inkMuted } : undefined}>{p!.isim}</T>
                    </Pressable>
                    <Pressable onPress={() => remove(t.parfumId)} hitSlop={8} accessibilityLabel="Listeden çıkar">
                      <Ionicons name="close" size={18} color={c.inkSubtle} />
                    </Pressable>
                  </View>
                  {t.denendi ? (
                    <View style={styles.verdict}>
                      <Button label="Sevdim" icon={loved ? 'heart' : 'heart-outline'} size="sm" variant={loved ? 'accent' : 'secondary'} onPress={() => verdict(p!.id, 'sevdim')} style={{ flex: 1 }} />
                      <Button label="Sevmedim" size="sm" variant={disliked ? 'primary' : 'secondary'} onPress={() => verdict(p!.id, 'sevmedim')} style={{ flex: 1 }} />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </Card>
        )}
      </Section>

      <Section title="Mağazada deneme rehberi">
        <Card style={{ gap: Spacing.md }}>
          {TIPS.map(([icon, text]) => (
            <View key={text} style={styles.tip}>
              <Ionicons name={icon as any} size={18} color={c.accent} />
              <T variant="body" style={{ flex: 1 }}>{text}</T>
            </View>
          ))}
        </Card>
      </Section>

      <PerfumePicker visible={picking} onClose={() => setPicking(false)} onSelect={p => add([p.id])} excludeIds={list.map(t => t.parfumId)} title="Denenecek parfüm" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  verdict: { flexDirection: 'row', gap: Spacing.sm, paddingBottom: Spacing.md, paddingLeft: 26 + Spacing.md },
  tip: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
});
