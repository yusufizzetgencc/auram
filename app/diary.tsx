/**
 * TENİNDE — Koku Günlüğü
 * Eski Takvim + Günlük + Performans ekranlarının yerini alır; tek veri kaynağı:
 * günün kokusu (SOTD) + o günün akşam değerlendirmesi (PerformanceLog).
 */
import { Button, Card, Chip, Divider, EmptyState, Header, IconButton, Screen, Section, Segmented, Stat, T, useTheme } from '@/components/kit';
import { ContextQuestion } from '@/components/ProfileCompletion';
import { Bottle } from '@/components/kit/perfume';
import { PerfumePicker } from '@/components/kit/PerfumePicker';
import { LockedFeatureOverlay, PaywallScreen } from '@/components/paywall';
import { BorderRadius, FontFamilies, ScentTypeColors, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { usePremiumGate } from '@/hooks/use-premium-gate';
import { toLocalDateKey } from '@/utils/date';
import { hapticSuccess } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

const LONGEVITY = [
  { v: '1', l: '<2 sa' }, { v: '2', l: '2–4' }, { v: '3', l: '4–6' }, { v: '4', l: '6–8' }, { v: '5', l: '8+' },
] as const;
const LONG_LABEL = ['', '2 saatten az', '2–4 saat', '4–6 saat', '6–8 saat', '8 saatten fazla'];
const WEEK = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default function DiaryScreen() {
  const router = useRouter();
  const c = useTheme();
  const { sotdHistory, performanceLogs, streakData, todaySotd, selectTodaysSotd, logPerformance, getParfumById, getMonthlyStats } = useApp();
  const { isPremium, paywallVisible, setPaywallVisible } = usePremiumGate();

  const today = toLocalDateKey();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [selected, setSelected] = useState(today);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [longevity, setLongevity] = useState<string>('3');
  const [compliment, setCompliment] = useState<boolean | null>(null);
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');

  const sotdByDate = useMemo(() => Object.fromEntries(sotdHistory.map(s => [s.date, s])), [sotdHistory]);
  const logByDate = useMemo(() => Object.fromEntries(performanceLogs.map(l => [l.date, l])), [performanceLogs]);
  const todayLog = logByDate[today];
  const todayParfum = todaySotd ? getParfumById(todaySotd.parfumId) : undefined;

  // Takvim ızgarası (Pazartesi başlangıçlı)
  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const lead = (first.getDay() + 6) % 7;
    const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
    return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  }, [cursor]);
  const keyOf = (d: number) => `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const shift = (n: number) => setCursor(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  const stats = getMonthlyStats(cursor.m, cursor.y);
  const top = stats.mostUsedParfumId ? getParfumById(stats.mostUsedParfumId) : undefined;

  // Sizde en uzun kalanlar (ortalama kalıcılık)
  const longest = useMemo(() => {
    const agg: Record<string, { sum: number; n: number }> = {};
    performanceLogs.forEach(l => { agg[l.parfumId] = { sum: (agg[l.parfumId]?.sum ?? 0) + l.longevity, n: (agg[l.parfumId]?.n ?? 0) + 1 }; });
    return Object.entries(agg).map(([id, v]) => ({ p: getParfumById(id), avg: v.sum / v.n, n: v.n })).filter(x => x.p).sort((a, b) => b.avg - a.avg).slice(0, 5);
  }, [performanceLogs, getParfumById]);

  const save = async () => {
    if (!todaySotd) return;
    await logPerformance(todaySotd.parfumId, {
      date: today,
      longevity: Number(longevity),
      compliment: !!compliment,
      personalRating: rating * 2,
      note: note.trim() || undefined,
    });
    hapticSuccess();
    setNote('');
  };

  const sel = sotdByDate[selected];
  const selParfum = sel ? getParfumById(sel.parfumId) : undefined;
  const selLog = logByDate[selected];

  const content = (
    <View>
      {/* Özet */}
      <Card style={{ marginTop: Spacing.lg }}>
        <View style={{ flexDirection: 'row' }}>
          <Stat label="Seri" value={`${streakData.currentStreak}`} hint="gün" />
          <Stat label="En uzun" value={`${streakData.longestStreak}`} hint="gün" />
          <Stat label="Toplam" value={`${sotdHistory.length}`} hint="kayıt" />
        </View>
      </Card>

      {/* Bugün */}
      <Section title="Bugün">
        {!todayParfum ? (
          <Card onPress={() => setPickerOpen(true)}>
            <View style={styles.inline}>
              <Ionicons name="add-circle-outline" size={24} color={c.accent} />
              <View style={{ flex: 1 }}>
                <T variant="h3">Bugün ne sıktınız?</T>
                <T variant="small" color="muted">Kaydedin; akşam kalıcılığını değerlendirin.</T>
              </View>
            </View>
          </Card>
        ) : todayLog ? (
          <Card>
            <View style={styles.inline}>
              <Bottle parfum={todayParfum} size={40} />
              <View style={{ flex: 1 }}>
                <T variant="h3">{todayParfum.isim}</T>
                <T variant="small" color="muted">{LONG_LABEL[todayLog.longevity]} kaldı{todayLog.compliment ? ' · iltifat aldınız' : ''}</T>
              </View>
              <Ionicons name="checkmark-circle" size={22} color={c.success} />
            </View>
          </Card>
        ) : (
          <Card>
            <View style={styles.inline}>
              <Bottle parfum={todayParfum} size={40} />
              <View style={{ flex: 1 }}>
                <T variant="overline" color="accent">Akşam değerlendirmesi</T>
                <T variant="h3">{todayParfum.isim}</T>
              </View>
              <T variant="smallStrong" color="accent" onPress={() => setPickerOpen(true)}>Değiştir</T>
            </View>
            <Divider style={{ marginVertical: Spacing.lg }} />
            <T variant="smallStrong" style={{ marginBottom: Spacing.sm }}>Teninizde ne kadar kaldı?</T>
            <Segmented value={longevity} onChange={setLongevity} options={LONGEVITY.map(o => ({ value: o.v, label: o.l }))} />
            <T variant="smallStrong" style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>İltifat aldınız mı?</T>
            <View style={styles.inline}>
              <Chip label="Evet" selected={compliment === true} onPress={() => setCompliment(true)} />
              <Chip label="Hayır" selected={compliment === false} onPress={() => setCompliment(false)} />
            </View>
            <T variant="smallStrong" style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>Bugün ne kadar sevdiniz?</T>
            <View style={styles.inline}>
              {[1, 2, 3, 4, 5].map(n => (
                <Pressable key={n} onPress={() => setRating(n)} hitSlop={6}>
                  <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={26} color={n <= rating ? c.accent : c.inkSubtle} />
                </Pressable>
              ))}
            </View>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Not (isteğe bağlı): akşama nasıl dönüştü?"
              placeholderTextColor={c.inkSubtle}
              multiline
              style={[styles.note, { color: c.ink, borderColor: c.border, backgroundColor: c.bg }]}
            />
            <Button label="Kaydet" onPress={save} disabled={rating === 0} style={{ marginTop: Spacing.md }} />
          </Card>
        )}
        {/* Bağlamsal profil sorusu: tek akşamlık kayıttan bağımsız, genel kalıcılık gözlemi */}
        <ContextQuestion id="gozlenen_kalicilik" title="Genel olarak parfümler sizde ne kadar kalıyor?" style={{ marginTop: Spacing.md }} />
      </Section>

      {/* Takvim */}
      <Section title="Takvim">
        <Card>
          <View style={styles.monthHead}>
            <IconButton name="chevron-back" onPress={() => shift(-1)} accessibilityLabel="Önceki ay" />
            <T variant="h3" style={{ flex: 1 }} align="center">{MONTHS[cursor.m]} {cursor.y}</T>
            <IconButton name="chevron-forward" onPress={() => shift(1)} accessibilityLabel="Sonraki ay" />
          </View>
          <View style={styles.grid}>
            {WEEK.map(w => <T key={w} variant="small" color="subtle" align="center" style={styles.cell}>{w}</T>)}
            {cells.map((d, i) => {
              if (!d) return <View key={`e${i}`} style={styles.cell} />;
              const k = keyOf(d);
              const s = sotdByDate[k];
              const p = s ? getParfumById(s.parfumId) : undefined;
              const isSel = k === selected;
              const isToday = k === today;
              return (
                <Pressable key={k} onPress={() => setSelected(k)} style={styles.cell}>
                  <View style={[styles.day, isSel && { backgroundColor: c.ink }, !isSel && isToday && { borderWidth: 1, borderColor: c.accent }]}>
                    <T variant="smallStrong" style={{ color: isSel ? c.bg : c.ink, fontFamily: FontFamilies.medium }}>{d}</T>
                  </View>
                  {p ? <View style={[styles.mark, { backgroundColor: ScentTypeColors[p.tip] ?? c.accent }]} /> : null}
                </Pressable>
              );
            })}
          </View>
          <Divider style={{ marginVertical: Spacing.md }} />
          {selParfum ? (
            <Pressable onPress={() => router.push(`/parfum/${selParfum.id}`)} style={styles.inline}>
              <Bottle parfum={selParfum} size={36} />
              <View style={{ flex: 1 }}>
                <T variant="bodyStrong">{selParfum.isim}</T>
                <T variant="small" color="muted">
                  {selLog ? `${LONG_LABEL[selLog.longevity]}${selLog.compliment ? ' · iltifat' : ''}${selLog.note ? ` · ${selLog.note}` : ''}` : 'Değerlendirme yok'}
                </T>
              </View>
            </Pressable>
          ) : (
            <T variant="small" color="muted" align="center">Bu gün için kayıt yok.</T>
          )}
        </Card>
      </Section>

      {/* Ay özeti */}
      <Section title={`${MONTHS[cursor.m]} özeti`}>
        {stats.totalDays === 0 ? (
          <T variant="body" color="muted">Bu ay için değerlendirme yok.</T>
        ) : (
          <Card>
            <View style={{ flexDirection: 'row' }}>
              <Stat label="Gün" value={`${stats.totalDays}`} />
              <Stat label="İltifat" value={`%${Math.round(stats.complimentRate)}`} />
              <Stat label="Ort. kalıcılık" value={LONG_LABEL[Math.round(stats.averageLongevity)]?.replace(' saat', ' sa') || '—'} />
            </View>
            {top ? <T variant="small" color="muted" style={{ marginTop: Spacing.md }}>En çok sıktığınız: {top.isim}</T> : null}
          </Card>
        )}
      </Section>

      {/* En uzun kalanlar */}
      <Section title="Sizde en uzun kalanlar">
        {longest.length === 0 ? (
          <T variant="body" color="muted">Akşam değerlendirmesi yaptıkça burada kendi teninizdeki gerçek kalıcılık sıralamanız oluşur.</T>
        ) : (
          <Card style={{ paddingVertical: Spacing.sm }}>
            {longest.map((x, i) => (
              <View key={x.p!.id}>
                {i > 0 ? <Divider /> : null}
                <Pressable onPress={() => router.push(`/parfum/${x.p!.id}`)} style={[styles.inline, { paddingVertical: Spacing.md }]}>
                  <T variant="h3" color="subtle" style={{ width: 22 }}>{i + 1}</T>
                  <View style={{ flex: 1 }}>
                    <T variant="bodyStrong">{x.p!.isim}</T>
                    <T variant="small" color="muted">{x.n} kayıt</T>
                  </View>
                  <T variant="smallStrong">{LONG_LABEL[Math.round(x.avg)]}</T>
                </Pressable>
              </View>
            ))}
          </Card>
        )}
      </Section>
    </View>
  );

  return (
    <Screen>
      <Header title="Koku Günlüğü" />
      {isPremium ? content : (
        sotdHistory.length === 0 && !isPremium ? (
          <EmptyState icon="journal-outline" title="Koku günlüğü Premium'da" body="Her gün ne sıktığınızı, teninizde ne kadar kaldığını ve iltifatları kaydedin." actionLabel="Premium'u incele" onAction={() => setPaywallVisible(true)} />
        ) : (
          <LockedFeatureOverlay onUnlock={() => setPaywallVisible(true)} title="Koku günlüğü Premium'da" subtitle="Takvim, kalıcılık kayıtları ve aylık özet">
            <View style={{ height: 520 }}>{content}</View>
          </LockedFeatureOverlay>
        )
      )}
      <PerfumePicker visible={pickerOpen} onClose={() => setPickerOpen(false)} title="Bugün ne sıktınız?" onSelect={p => selectTodaysSotd(p.id)} />
      <PaywallScreen visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  note: { minHeight: 72, borderWidth: StyleSheet.hairlineWidth, borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.lg, fontFamily: FontFamilies.regular, fontSize: 15, textAlignVertical: 'top' },
  monthHead: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  day: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  mark: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
});
