/**
 * Profil tamamlama — ilk akış yalnızca 9 temel soru sorar; geri kalanlar burada, doğru anda istenir.
 *  ProfileCompletionCard: doluluk yüzdesi + "Tamamla" (onboarding ?mod=tamamla açar). Profil tamsa hiçbir şey çizmez.
 *  ContextQuestion: tek bir eksik soruyu bağlamında (ör. akşam değerlendirmesinde kalıcılık) çip olarak sorar.
 */
import { Button, Card, Chip, ProgressLine, T, useTheme } from '@/components/kit';
import { onboardingSorulari, profilDoluluk, soruBul, soruCevaplandi } from '@/constants/questions';
import { Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { track } from '@/services/analytics';
import { UserPreferences } from '@/types';
import { hapticLight } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export function ProfileCompletionCard({ style }: { style?: object }) {
  const router = useRouter();
  const c = useTheme();
  const { preferences } = useApp();
  const { yuzde, eksik } = profilDoluluk(preferences);
  if (eksik.length === 0) return null;
  // Akışta sorulacak gerçek sayı (isteğe bağlı isim sorusu dahil) kullanıcıya söylenen sayıyla aynı olmalı
  const soruSayisi = onboardingSorulari(preferences, 'tamamla').length;
  const dakika = Math.max(1, Math.round(soruSayisi * 0.15));
  return (
    <Card style={style}>
      <View style={styles.row}>
        <Ionicons name="finger-print-outline" size={20} color={c.accent} />
        <T variant="bodyStrong" style={{ flex: 1 }}>Ten profiliniz %{yuzde} dolu</T>
      </View>
      <View style={{ marginTop: Spacing.sm }}><ProgressLine value={yuzde} /></View>
      <T variant="small" color="muted" style={{ marginTop: Spacing.sm }}>
        {soruSayisi} kısa soru daha (~{dakika} dk): parfümlerin sizde ne kadar kaldığı, terleme, nereye sıktığınız… Önerileriniz teninize göre keskinleşir.
      </T>
      <Button
        label="Profilimi tamamla"
        icon="create-outline"
        variant="secondary"
        size="sm"
        onPress={() => { track('profile_completion_open', { yuzde }); router.push({ pathname: '/onboarding', params: { mod: 'tamamla' } }); }}
        style={{ marginTop: Spacing.md }}
      />
    </Card>
  );
}

/** Eksikse tek soruyu yerinde sorar; cevaplanınca (veya profil tamsa) kaybolur. */
export function ContextQuestion({ id, title, style }: { id: string; title?: string; style?: object }) {
  const c = useTheme();
  const { preferences, setPreference, getRecommendations } = useApp();
  const q = soruBul(id);
  if (!q || !q.options || soruCevaplandi(q, preferences) || (preferences.atlananSorular ?? []).includes(id)) return null;
  const field = q.field as keyof UserPreferences;
  const sec = (value: string) => {
    hapticLight();
    setPreference(field, value as never);
    getRecommendations({ ...preferences, [field]: value } as UserPreferences);
    track('context_question_answered', { soru: id });
  };
  const atla = () => setPreference('atlananSorular', [...(preferences.atlananSorular ?? []), id]);
  return (
    <View style={[styles.box, { backgroundColor: c.accentSoft }, style]}>
      <View style={styles.row}>
        <Ionicons name="sparkles-outline" size={16} color={c.accent} />
        <T variant="smallStrong" style={{ flex: 1 }}>{title ?? q.title}</T>
        <Pressable onPress={atla} hitSlop={10} accessibilityLabel="Bu soruyu geç">
          <Ionicons name="close" size={16} color={c.inkSubtle} />
        </Pressable>
      </View>
      <View style={styles.chips}>
        {q.options.filter(o => o.value !== 'bilmiyorum').map(o => (
          <Chip key={o.value} label={o.label} onPress={() => sec(o.value)} />
        ))}
      </View>
      <T variant="small" color="muted" style={{ marginTop: Spacing.xs }}>{q.why}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  box: { padding: Spacing.md, borderRadius: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },
});
