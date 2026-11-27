/**
 * TENİNDE — Profil oluşturma (onboarding)
 * Sorular constants/questions.ts içinde tanımlıdır; bu ekran yalnızca akışı yönetir.
 * Modlar: ilk açılış tüm sorular tek seferde (tam), ?mod=tamamla yalnızca eksik soruları (ör. eski sürümden gelen boş alanlar),
 * ?yeniden=1 (Profil → Güncelle) tüm soruları açar.
 */
import { Button, FamilyDot, IconButton, OptionCard, T, useTheme } from '@/components/kit';
import { Bottle, brandCaps } from '@/components/kit/perfume';
import { PerfumePicker } from '@/components/kit/PerfumePicker';
import { CHAPTERS, OnboardingMod, Question, onboardingSorulari, profilDoluluk } from '@/constants/questions';
import { BorderRadius, FontFamilies, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { getPHAraligiEtiketi, hesaplaPHPure } from '@/engine';
import { Parfum, PHBilgiDurumu, UserPreferences } from '@/types';
import { hapticLight, hapticSuccess } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { track } from '@/services/analytics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
  const router = useRouter();
  // Profil → "Güncelle" testi baştan açar (önceki cevaplar dolu gelir); aksi halde yarım kalan yerden devam edilir.
  const { yeniden, mod: modParam } = useLocalSearchParams<{ yeniden?: string; mod?: string }>();
  const mod: OnboardingMod = modParam === 'tamamla' && !yeniden ? 'tamamla' : 'tam';
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const {
    parfumler, preferences, setPreference, toggleArrayPreference, setPHBilgiDurumu, setKullaniciPH,
    currentStep, setCurrentStep, hesaplaPH, getRecommendations, setIsOnboardingComplete,
  } = useApp();

  // Tamamlama modunda liste açılışta sabitlenir: aksi halde cevaplanan soru listeden düşer ve sıra kayar.
  const [tamamlaIdleri] = useState(() => (mod === 'tamamla' ? onboardingSorulari(preferences, 'tamamla').map(q => q.id) : []));
  const steps = useMemo(() => {
    if (mod !== 'tamamla') return onboardingSorulari(preferences, mod);
    const tum = onboardingSorulari(preferences, 'tam');
    return tum.filter(q => tamamlaIdleri.includes(q.id) || (q.id === 'ph_deger' && tamamlaIdleri.includes('ph_bilgi')));
  }, [preferences, mod, tamamlaIdleri]);
  // İlk kurulumda yarım kalan yerden devam edilir; Güncelle (yeniden) ve tamamlama baştan başlar
  const [index, setIndex] = useState(() => (mod === 'tam' && !yeniden ? Math.min(Math.max(currentStep, 0), Math.max(steps.length - 1, 0)) : 0));
  // Ekran zaten açıkken "yeniden" ile tekrar gelinirse de başa dön
  useEffect(() => { if (yeniden) setIndex(0); }, [yeniden]);
  const q: Question | undefined = steps[Math.min(index, steps.length - 1)];
  const isLast = index >= steps.length - 1;

  const [whyOpen, setWhyOpen] = useState(false);
  const [lovedPicker, setLovedPicker] = useState(false);
  const [phText, setPhText] = useState(preferences.phInfo.deger ? String(preferences.phInfo.deger) : '');
  const fade = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  const ph = useMemo(() => hesaplaPHPure(preferences), [preferences]);
  const measured = preferences.phInfo.biliyorMu === 'biliyorum' && !!preferences.phInfo.deger;

  useEffect(() => { setWhyOpen(false); scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [index]);

  // ---------- değer okuma ----------
  const valueOf = (question: Question): any => {
    if (question.field === 'phBilgi') return preferences.phInfo.biliyorMu;
    if (question.field === 'phDeger') return preferences.phInfo.deger;
    return preferences[question.field as keyof UserPreferences];
  };
  const answered = (question: Question): boolean => {
    const v = valueOf(question);
    if (question.type === 'ph') {
      const n = parseFloat(phText.replace(',', '.'));
      return !isNaN(n) && n >= 4 && n <= 7;
    }
    if (question.type === 'multi' || question.type === 'parfumler') return Array.isArray(v) && v.length > 0;
    if (question.type === 'text') return typeof v === 'string' && v.trim().length > 0;
    return v !== null && v !== undefined && v !== '';
  };

  // ---------- gezinme ----------
  // Geçiş sırasında dokunuşlar kilitlenir: aksi halde hızlı çift dokunuş bir sonraki
  // sorunun aynı konumdaki seçeneğini istemeden işaretler.
  const [locked, setLocked] = useState(false);
  const lockedRef = useRef(false);
  const goTo = (next: number) => {
    lockedRef.current = true;
    setLocked(true);
    Animated.timing(fade, { toValue: 0, duration: 110, useNativeDriver: true }).start(() => {
      setIndex(next);
      if (mod === 'tam') setCurrentStep(next);
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start(() => {
        setTimeout(() => { lockedRef.current = false; setLocked(false); }, 120);
      });
    });
  };

  const finish = () => {
    hapticSuccess();
    hesaplaPH();
    getRecommendations(preferences); // pH motor içinde güncel cevaplardan yeniden hesaplanır
    if (mod === 'tamamla') {
      track('profile_completed', { yuzde: profilDoluluk(preferences).yuzde, soru: steps.length });
      router.back();
      return;
    }
    setIsOnboardingComplete(true);
    // Yalnızca sayımlar/kategoriler; cevapların kendisi (isim vb.) gönderilmez
    track('onboarding_completed', { aile_sayisi: preferences.kokuTipleri?.length ?? 0, sevilen_sayisi: preferences.sevilenParfumler?.length ?? 0, ph_olculdu: preferences.phInfo?.biliyorMu === 'biliyorum' });
    router.replace('/ad-loading');
  };

  const next = () => {
    if (lockedRef.current || !q) return;
    // Bırakma analizi için yalnızca soru kimliği ve sıra (cevap gönderilmez)
    track('onboarding_step', { soru: q.id, sira: index + 1, toplam: steps.length, mod });
    if (q.optional && !answered(q)) {
      const atlanan = preferences.atlananSorular ?? [];
      if (!atlanan.includes(q.id)) setPreference('atlananSorular', [...atlanan, q.id]);
    }
    if (isLast) finish(); else goTo(index + 1);
  };
  const back = () => (index > 0 ? goTo(index - 1) : router.back());
  // Tamamlama modunda yarıda bırakmak serbest: o ana kadarki cevaplar zaten kaydedildi, öneriler onlarla yenilenir
  const kapat = () => {
    getRecommendations(preferences);
    track('profile_completion_closed', { sira: index + 1, toplam: steps.length });
    router.back();
  };

  // ---------- cevaplama ----------
  const selectSingle = (value: string) => {
    if (lockedRef.current) return;
    if (q.field === 'phBilgi') setPHBilgiDurumu(value as PHBilgiDurumu);
    else setPreference(q.field as keyof UserPreferences, value as any);
    // Otomatik ilerleme yok: kullanıcı seçimini görür, gerekirse değiştirir ve "Devam" ile ilerler.
    hapticLight();
  };

  const toggleMulti = (value: string) => {
    if (lockedRef.current) return;
    const current = (valueOf(q) as string[]) || [];
    if (!current.includes(value) && q.maxSelect && current.length >= q.maxSelect) {
      hapticLight();
      return;
    }
    toggleArrayPreference(q.field as keyof UserPreferences, value);
  };

  const onPhChange = (text: string) => {
    const clean = text.replace(/[^0-9.,]/g, '').replace(',', '.');
    setPhText(clean);
    const n = parseFloat(clean);
    if (!isNaN(n) && n >= 4 && n <= 7) setKullaniciPH(n);
  };

  // ---------- ilerleme ----------
  // Yalnızca bu akışta sorusu olan bölümler gösterilir (kısa akışta "Tanışalım" yok)
  const chapterProgress = CHAPTERS.map((_, ch) => ch).filter(ch => steps.some(s => s.chapter === ch)).map(ch => {
    const inCh = steps.filter(s => s.chapter === ch);
    const cur = q?.chapter ?? 0;
    const done = inCh.filter(s => steps.indexOf(s) < index).length + (cur === ch ? 0.5 : 0);
    return cur > ch ? 1 : cur < ch ? 0 : done / inCh.length;
  });

  const phLabel = measured
    ? `pH ${preferences.phInfo.deger!.toFixed(1)}`
    : `pH ~${(ph.aralikMin ?? ph.tahminiPH).toFixed(1)}–${(ph.aralikMax ?? ph.tahminiPH).toFixed(1)}`;

  // Tamamlanacak soru kalmadıysa (ör. başka ekrandan cevaplandı) geri dön
  useEffect(() => { if (!q) router.back(); }, [q, router]);
  if (!q) return null;

  // ---------- içerik ----------
  const renderBody = () => {
    if (q.type === 'text') {
      return (
        <TextInput
          value={(valueOf(q) as string) ?? ''}
          onChangeText={t => setPreference(q.field as keyof UserPreferences, t as any)}
          placeholder="Adınız"
          placeholderTextColor={c.inkSubtle}
          autoFocus
          returnKeyType="next"
          onSubmitEditing={next}
          style={[styles.input, { color: c.ink, borderColor: c.border, backgroundColor: c.surface }]}
        />
      );
    }
    if (q.type === 'ph') {
      const n = parseFloat(phText);
      const valid = !isNaN(n) && n >= 4 && n <= 7;
      return (
        <View>
          <View style={[styles.phBox, { borderColor: valid ? c.accent : c.border, backgroundColor: c.surface }]}>
            <TextInput
              value={phText}
              onChangeText={onPhChange}
              placeholder="5.0"
              placeholderTextColor={c.inkSubtle}
              keyboardType="decimal-pad"
              maxLength={4}
              autoFocus
              style={[styles.phInput, { color: c.ink }]}
            />
            <T variant="h2" color="subtle">pH</T>
          </View>
          <T variant="small" color={phText && !valid ? 'danger' : 'muted'} style={{ marginTop: Spacing.md }}>
            {phText && !valid ? 'Değer 4.0 ile 7.0 arasında olmalı.' : valid ? getPHAraligiEtiketi(hesaplaPHPure({ ...preferences, phInfo: { ...preferences.phInfo, deger: n } }).aralik) + ' — ' + (n < 4.85 ? 'narenciye notaları sizde canlı açılır.' : n > 5.25 ? 'odunsu ve amber alt notalar dolgun kalır.' : 'çoğu parfüm şişedeki karakterine yakın açılır.') : 'Ondalık için nokta kullanın, örn. 5.2'}
          </T>
        </View>
      );
    }
    if (q.type === 'parfumler') {
      const ids = ((valueOf(q) as string[]) || []);
      const chosen = ids.map(id => parfumler.find(p => p.id === id)).filter((p): p is Parfum => !!p);
      const full = !!q.maxSelect && ids.length >= q.maxSelect;
      return (
        <View style={{ gap: Spacing.sm }}>
          {chosen.map(p => (
            <View key={p.id} style={[styles.lovedRow, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Bottle parfum={p} size={36} />
              <View style={{ flex: 1 }}>
                <T variant="overline" caps={brandCaps(p)} color="subtle" numberOfLines={1}>{p.marka}</T>
                <T variant="bodyStrong" numberOfLines={1}>{p.isim}</T>
              </View>
              <Pressable onPress={() => setPreference('sevilenParfumler', ids.filter(x => x !== p.id))} hitSlop={8} accessibilityLabel={`${p.isim} çıkar`}>
                <Ionicons name="close" size={20} color={c.inkSubtle} />
              </Pressable>
            </View>
          ))}
          {!full ? (
            <Pressable onPress={() => setLovedPicker(true)} style={[styles.lovedAdd, { borderColor: c.border }]}>
              <Ionicons name="add" size={20} color={c.accent} />
              <T variant="bodyStrong" color="accent">{chosen.length ? 'Bir parfüm daha ekle' : 'Parfüm ekle'}</T>
            </Pressable>
          ) : null}
          <PerfumePicker
            visible={lovedPicker}
            onClose={() => setLovedPicker(false)}
            excludeIds={ids}
            title="Sevdiğiniz parfüm"
            onSelect={p => setPreference('sevilenParfumler', [...ids, p.id])}
          />
        </View>
      );
    }
    if (q.id === 'aileler') {
      const selected = (valueOf(q) as string[]) || [];
      return (
        <View style={styles.familyGrid}>
          {q.options!.map(o => {
            const on = selected.includes(o.value);
            return (
              <Pressable
                key={o.value}
                onPress={() => toggleMulti(o.value)}
                style={[styles.familyCard, { backgroundColor: on ? c.accentSoft : c.surface, borderColor: on ? c.accent : c.border }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <FamilyDot family={o.value} size={10} />
                  <T variant="bodyStrong" style={{ flex: 1 }}>{o.label}</T>
                  {on ? <Ionicons name="checkmark-circle" size={18} color={c.accent} /> : null}
                </View>
                <T variant="small" color="muted" style={{ marginTop: 6 }}>{o.hint}</T>
              </Pressable>
            );
          })}
        </View>
      );
    }
    const v = valueOf(q);
    return (
      <View style={{ gap: Spacing.sm }}>
        {q.options!.map(o => (
          <OptionCard
            key={o.value}
            title={o.label}
            subtitle={o.hint}
            icon={o.icon}
            multi={q.type === 'multi'}
            selected={q.type === 'multi' ? ((v as string[]) || []).includes(o.value) : v === o.value}
            onPress={() => (q.type === 'multi' ? toggleMulti(o.value) : selectSingle(o.value))}
          />
        ))}
      </View>
    );
  };

  const canContinue = answered(q) || !!q.optional;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top }}>
        <View style={styles.topBar}>
          {mod === 'tamamla'
            ? <IconButton name="close" onPress={kapat} accessibilityLabel="Sonra tamamla" />
            : <IconButton name="chevron-back" onPress={back} accessibilityLabel="Geri" />}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <T variant="overline" color="accent">{mod === 'tamamla' ? 'Profilinizi tamamlayın' : CHAPTERS[q.chapter]}</T>
            <T variant="small" color="subtle">{index + 1} / {steps.length}</T>
          </View>
          <View style={[styles.phChip, { borderColor: c.border, backgroundColor: c.surface }]}>
            <T variant="smallStrong" style={{ fontVariant: ['tabular-nums'] }}>{phLabel}</T>
          </View>
        </View>
        <View style={styles.progressRow}>
          {chapterProgress.map((p, i) => (
            <View key={i} style={[styles.progressSeg, { backgroundColor: c.border }]}>
              <View style={{ width: `${Math.round(p * 100)}%`, height: '100%', backgroundColor: c.accent }} />
            </View>
          ))}
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: fade }} pointerEvents={locked ? 'none' : 'auto'}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <T variant="h1">{q.title}</T>
          {q.subtitle ? <T variant="body" color="muted" style={{ marginTop: Spacing.sm }}>{q.subtitle}</T> : null}

          <Pressable onPress={() => setWhyOpen(o => !o)} style={styles.whyToggle} hitSlop={8}>
            <Ionicons name={whyOpen ? 'remove-circle-outline' : 'information-circle-outline'} size={16} color={c.accent} />
            <T variant="smallStrong" color="accent">Neden soruyoruz?</T>
          </Pressable>
          {whyOpen ? (
            <View style={[styles.whyBox, { backgroundColor: c.accentSoft }]}>
              <T variant="small">{q.why}</T>
            </View>
          ) : null}

          <View style={{ marginTop: Spacing.xl }}>{renderBody()}</View>
        </ScrollView>
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, borderTopColor: c.border }]}>
        {q.optional && !answered(q) ? (
          <Button label="Atla" variant="ghost" onPress={next} style={{ flex: 1 }} />
        ) : null}
        <Button
          label={isLast ? (mod === 'tamamla' ? 'Kaydet' : 'Önerilerimi gör') : 'Devam'}
          iconRight={isLast ? (mod === 'tamamla' ? 'checkmark' : 'sparkles-outline') : 'arrow-forward'}
          onPress={next}
          disabled={!canContinue}
          variant={isLast ? 'accent' : 'primary'}
          style={{ flex: 2 }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  lovedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: StyleSheet.hairlineWidth },
  lovedAdd: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg, borderRadius: BorderRadius.md, borderWidth: 1, borderStyle: 'dashed' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, height: 56 },
  phChip: { height: 32, paddingHorizontal: 12, borderRadius: BorderRadius.full, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', marginRight: Spacing.sm },
  progressRow: { flexDirection: 'row', gap: 4, paddingHorizontal: Spacing.lg, marginTop: Spacing.xs },
  progressSeg: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
  content: { padding: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing['3xl'] },
  whyToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.lg, alignSelf: 'flex-start' },
  whyBox: { marginTop: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md },
  input: { height: 56, borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, fontFamily: FontFamilies.medium, fontSize: 18 },
  phBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md, borderWidth: 1.5, borderRadius: BorderRadius.lg, paddingVertical: Spacing.xl },
  phInput: { fontFamily: FontFamilies.displayBold, fontSize: 56, minWidth: 120, textAlign: 'center', fontVariant: ['tabular-nums'] },
  familyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  familyCard: { width: '48.5%', padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
});
