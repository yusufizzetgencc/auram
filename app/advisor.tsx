/**
 * TENİNDE — Koku Danışmanı (sohbet)
 * "Cumartesi düğüne gidiyorum, dolabımdan ne sıkayım?" gibi sorulara teninize, dolabınıza ve havaya göre cevap verir.
 * Ücretsiz: FREE_ADVISOR_COUNT soru (ömür boyu), sonrası Premium. Sohbet oturum boyunca tutulur, kaydedilmez.
 */
import { Header, T, useTheme } from '@/components/kit';
import { Bottle, brandCaps } from '@/components/kit/perfume';
import { PaywallScreen } from '@/components/paywall';
import { FREE_ADVISOR_COUNT } from '@/constants/premiumLimits';
import { BorderRadius, FontFamilies, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { getEffectivePH, ORNEK_SORULAR, SohbetDurumu } from '@/engine';
import { usePremiumGate } from '@/hooks/use-premium-gate';
import { askAdvisor } from '@/services/advisor';
import { track } from '@/services/analytics';
import { getAdvisorCount, incrementAdvisorCount } from '@/services/storage';
import { fetchWeather } from '@/services/weather';
import { Parfum } from '@/types';
import { hapticLight } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Mesaj {
  id: string;
  rol: 'kullanici' | 'danisman';
  metin: string;
  oneriler?: { parfum: Parfum; not: string }[];
  devam?: string[];
}

export default function AdvisorScreen() {
  const router = useRouter();
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { parfumler, preferences, wardrobeParfums, sotdHistory, performanceLogs, zevk } = useApp();
  const { isPremium, paywallVisible, setPaywallVisible } = usePremiumGate();
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [metin, setMetin] = useState('');
  const [busy, setBusy] = useState(false);
  const [kullanilan, setKullanilan] = useState(0);
  const [hava, setHava] = useState<{ sicaklik: number; nem: number } | null>(null);
  const scroll = useRef<ScrollView>(null);
  // Sohbet hafızası: devam soruları ("başka", "daha hafif", "bunlardan hangisi") önceki bağlamı korur
  const durum = useRef<SohbetDurumu | null>(null);

  useEffect(() => { getAdvisorCount().then(setKullanilan); }, []);
  useEffect(() => { fetchWeather().then(r => r.ok && setHava({ sicaklik: r.data.temperature, nem: r.data.humidity })); }, []);

  const kalan = Math.max(0, FREE_ADVISOR_COUNT - kullanilan);
  const isim = preferences.userName?.trim();

  const sor = async (soru: string) => {
    const q = soru.trim();
    if (!q || busy) return;
    if (!isPremium && kullanilan >= FREE_ADVISOR_COUNT) { setPaywallVisible(true); return; }
    hapticLight();
    setMetin('');
    setMesajlar(m => [...m, { id: `u${Date.now()}`, rol: 'kullanici', metin: q }]);
    setBusy(true);
    try {
      const cevap = await askAdvisor(q, {
        katalog: parfumler,
        dolap: wardrobeParfums,
        prefs: preferences,
        ph: getEffectivePH(preferences),
        zevk: zevk,
        hava,
        gecmis: sotdHistory.map(s => ({ parfumId: s.parfumId, date: s.date })),
        degerlendirmeler: performanceLogs,
        onceki: durum.current,
      });
      durum.current = cevap.durum ?? null;
      setMesajlar(m => [...m, { id: `d${Date.now()}`, rol: 'danisman', metin: cevap.metin, oneriler: cevap.oneriler, devam: cevap.devam }]);
      if (!isPremium) setKullanilan(await incrementAdvisorCount());
      track('advisor_question', { kaynak: cevap.kaynak, oneri: cevap.oneriler.length });
    } finally {
      setBusy(false);
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 60);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: Spacing.lg }}>
        <Header title="Koku Danışmanı" />
      </View>

      <ScrollView ref={scroll} contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xl }} keyboardShouldPersistTaps="handled">
        {/* Karşılama */}
        <View style={[styles.bubble, styles.left, { backgroundColor: c.surface, borderColor: c.border }]}>
          <T variant="body">
            {isim ? `Merhaba ${isim}. ` : 'Merhaba. '}
            Teninizi{wardrobeParfums.length ? `, dolabınızdaki ${wardrobeParfums.length} parfümü` : ''} ve bugünün havasını biliyorum. Nereye gideceğinizi, kime hediye alacağınızı ya da neye benzer bir şey aradığınızı yazın.
          </T>
        </View>

        {mesajlar.length === 0 ? (
          <View style={styles.suggestions}>
            {ORNEK_SORULAR.map(s => (
              <Pressable key={s} onPress={() => sor(s)} style={[styles.suggestion, { borderColor: c.border, backgroundColor: c.surface }]}>
                <T variant="small">{s}</T>
              </Pressable>
            ))}
          </View>
        ) : null}

        {mesajlar.map(m => (
          <View key={m.id} style={{ gap: Spacing.sm }}>
            <View style={[styles.bubble, m.rol === 'kullanici' ? [styles.right, { backgroundColor: c.ink }] : [styles.left, { backgroundColor: c.surface, borderColor: c.border }]]}>
              <T variant="body" style={m.rol === 'kullanici' ? { color: c.bg } : undefined}>{m.metin}</T>
            </View>
            {m.oneriler?.map(o => (
              <Pressable key={o.parfum.id} onPress={() => router.push(`/parfum/${o.parfum.id}`)} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
                <View style={[styles.art, { backgroundColor: c.surfaceAlt }]}><Bottle parfum={o.parfum} size={36} /></View>
                <View style={{ flex: 1 }}>
                  <T variant="overline" caps={brandCaps(o.parfum)} color="subtle" numberOfLines={1}>{o.parfum.marka}</T>
                  <T variant="bodyStrong" numberOfLines={1}>{o.parfum.isim}</T>
                  <T variant="small" color="muted" numberOfLines={2}>{o.not}</T>
                </View>
                <Ionicons name="chevron-forward" size={16} color={c.inkSubtle} />
              </Pressable>
            ))}
            {m.devam?.length ? (
              <View style={styles.suggestions}>
                {m.devam.map(d => (
                  <Pressable key={d} onPress={() => sor(d)} style={[styles.suggestion, { borderColor: c.accent }]}>
                    <T variant="small" color="accent">{d}</T>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        ))}

        {busy ? <ActivityIndicator color={c.accent} style={{ alignSelf: 'flex-start', marginLeft: Spacing.md }} /> : null}
      </ScrollView>

      <View style={[styles.inputBar, { borderTopColor: c.border, backgroundColor: c.bg, paddingBottom: insets.bottom + Spacing.sm }]}>
        {!isPremium ? (
          <T variant="small" color={kalan ? 'subtle' : 'accent'} style={{ marginBottom: 6 }} onPress={kalan ? undefined : () => setPaywallVisible(true)}>
            {kalan ? `${kalan} ücretsiz soru hakkınız kaldı` : 'Ücretsiz sorularınız bitti · Premium ile sınırsız'}
          </T>
        ) : null}
        <View style={styles.inputRow}>
          <TextInput
            value={metin}
            onChangeText={setMetin}
            placeholder="Örn. Bu akşam buluşmam var, ne sıkayım?"
            placeholderTextColor={c.inkSubtle}
            style={[styles.input, { color: c.ink, borderColor: c.border, backgroundColor: c.surface }]}
            multiline
            maxLength={240}
            onSubmitEditing={() => sor(metin)}
            blurOnSubmit
            returnKeyType="send"
          />
          <Pressable
            onPress={() => sor(metin)}
            disabled={!metin.trim() || busy}
            accessibilityLabel="Gönder"
            style={[styles.send, { backgroundColor: metin.trim() && !busy ? c.accent : c.border }]}
          >
            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
      <PaywallScreen visible={paywallVisible} onClose={() => setPaywallVisible(false)} title="Sınırsız Koku Danışmanı" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '88%', padding: Spacing.md, borderRadius: BorderRadius.lg },
  left: { alignSelf: 'flex-start', borderWidth: StyleSheet.hairlineWidth, borderTopLeftRadius: 6 },
  right: { alignSelf: 'flex-end', borderTopRightRadius: 6 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  suggestion: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1 },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.sm, paddingRight: Spacing.md, borderRadius: BorderRadius.md, borderWidth: StyleSheet.hairlineWidth, maxWidth: '92%' },
  art: { width: 48, height: 56, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  inputBar: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  input: { flex: 1, minHeight: 44, maxHeight: 110, borderWidth: 1, borderRadius: 22, paddingHorizontal: Spacing.md, paddingTop: 11, paddingBottom: 11, fontFamily: FontFamilies.regular, fontSize: 15 },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
