/**
 * TENİNDE — Bildirim ayarları
 * Ana anahtar + tür bazında anahtarlar + sabah saati + planlanan bildirimlerin listesi + deneme bildirimi.
 * Her değişiklikten sonra plan baştan kurulur (services/notifications → syncNotifications).
 */
import { Button, Card, Divider, Header, ListRow, Screen, Section, T, useTheme } from '@/components/kit';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { getEffectivePH } from '@/engine';
import { track } from '@/services/analytics';
import { getPermissionStatus, listScheduled, sendTestNotification, setNotificationsEnabled, syncNotifications, updateNotificationPrefs } from '@/services/notifications';
import { loadNotificationPreferences } from '@/services/storage';
import { NotificationPreferences } from '@/types';
import { hapticLight } from '@/utils/haptics';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Switch, View } from 'react-native';

type Tur = 'sabah' | 'aksam' | 'seri' | 'haftalik' | 'aylik' | 'azalan';
const SAATLER = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30'];

export default function NotificationSettings() {
  const c = useTheme();
  const { parfumler, preferences, wardrobeParfums, sotdHistory, streakData, zevk } = useApp();
  const [ayar, setAyar] = useState<NotificationPreferences | null>(null);
  const [izin, setIzin] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [planli, setPlanli] = useState<{ id: string; title: string; date: Date | null }[]>([]);

  const yenile = useCallback(async () => {
    await syncNotifications({
      prefs: preferences,
      ph: getEffectivePH(preferences),
      dolap: wardrobeParfums,
      katalog: parfumler,
      zevk: zevk,
      gecmis: sotdHistory.map(s => ({ parfumId: s.parfumId, date: s.date })),
      seri: streakData.currentStreak,
      isim: preferences.userName,
    });
    setPlanli(await listScheduled());
  }, [preferences, wardrobeParfums, parfumler, sotdHistory, streakData, zevk]);

  useEffect(() => {
    (async () => {
      setAyar(await loadNotificationPreferences());
      setIzin(await getPermissionStatus());
      setPlanli(await listScheduled());
    })();
  }, []);

  const ana = async (on: boolean) => {
    hapticLight();
    const ok = await setNotificationsEnabled(on);
    setIzin(await getPermissionStatus());
    setAyar(await loadNotificationPreferences());
    if (on && !ok) {
      Alert.alert('Bildirim izni gerekli', 'Ayarlar > Teninde > Bildirimler bölümünden izin verin.', [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Ayarları aç', onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    track('notifications_toggled', { acik: on });
    await yenile();
  };

  const tur = async (t: Tur, on: boolean) => {
    hapticLight();
    setAyar(await updateNotificationPrefs({ [t]: on }));
    track('notification_type_toggled', { tur: t, acik: on });
    await yenile();
  };

  const saat = async (s: string) => {
    hapticLight();
    setAyar(await updateNotificationPrefs({ reminderTime: s }));
    await yenile();
  };

  if (!ayar) return <Screen><Header title="Bildirimler" /></Screen>;
  const acik = ayar.enabled && izin === 'granted';
  const sw = (t: Tur) => <Switch value={acik && ayar[t] !== false} disabled={!acik} onValueChange={v => tur(t, v)} trackColor={{ true: c.accent, false: c.border }} />;

  return (
    <Screen>
      <Header title="Bildirimler" />

      {izin === 'denied' ? (
        <Card tone="alt" style={{ marginTop: Spacing.lg }}>
          <T variant="bodyStrong">Bildirim izni kapalı</T>
          <T variant="small" color="muted" style={{ marginTop: 4 }}>Teninde bildirim gönderemiyor. iPhone Ayarları’ndan izin verebilirsiniz.</T>
          <Button label="Ayarları aç" size="sm" variant="secondary" onPress={() => Linking.openSettings()} style={{ marginTop: Spacing.md, alignSelf: 'flex-start' }} />
        </Card>
      ) : null}

      <Card style={{ marginTop: Spacing.lg, paddingVertical: Spacing.sm }}>
        <ListRow icon="notifications-outline" title="Bildirimler" subtitle={acik ? 'Açık' : 'Kapalı'} right={<Switch value={acik} onValueChange={ana} trackColor={{ true: c.accent, false: c.border }} />} />
      </Card>

      <Section title="Her gün">
        <Card style={{ paddingVertical: Spacing.sm }}>
          <ListRow icon="sunny-outline" title="Sabah önerisi" subtitle={wardrobeParfums.length ? `Her gün ${ayar.reminderTime ?? '09:00'} · dolabınızdan günün seçimi` : `Her gün ${ayar.reminderTime ?? '09:00'} · dolabınızı oluşturursanız isimle önerir`} right={sw('sabah')} />
          {acik && ayar.sabah !== false ? (
            <View style={styles.times}>
              {SAATLER.map(s => (
                <Pressable key={s} onPress={() => saat(s)} style={[styles.time, { borderColor: ayar.reminderTime === s ? c.accent : c.border, backgroundColor: ayar.reminderTime === s ? c.accentSoft : 'transparent' }]}>
                  <T variant="smallStrong" color={ayar.reminderTime === s ? 'accent' : 'muted'}>{s}</T>
                </Pressable>
              ))}
            </View>
          ) : null}
          <Divider />
          <ListRow icon="moon-outline" title="Akşam değerlendirmesi" subtitle="Günün kokusunu seçtiğiniz gün 20:00'de: teninizde ne kadar kaldı?" right={sw('aksam')} />
          <Divider />
          <ListRow icon="flame-outline" title="Seri hatırlatması" subtitle="Seriniz 2 günü geçtiyse ve o gün kayıt yoksa 21:00'de" right={sw('seri')} />
        </Card>
      </Section>

      <Section title="Özetler ve dolap">
        <Card style={{ paddingVertical: Spacing.sm }}>
          <ListRow icon="calendar-outline" title="Haftalık özet" subtitle="Pazar 19:00 · haftanın kokusu" right={sw('haftalik')} />
          <Divider />
          <ListRow icon="analytics-outline" title="Aylık rapor" subtitle="Her ayın 1'i 10:00 · rapor hazır" right={sw('aylik')} />
          <Divider />
          <ListRow icon="water-outline" title="Parfümünüz azalınca" subtitle="Dolaptaki şişe %15'in altına inince bir kez" right={sw('azalan')} />
        </Card>
      </Section>

      <T variant="small" color="subtle" style={{ marginTop: Spacing.md }}>
        Sessiz saatler: 22:00–08:00 arası bildirim gönderilmez. Bildirimler cihazınızda hazırlanır; hiçbir kişisel veri sunucuya gönderilmez.
      </T>

      {acik ? (
        <Section title="Planlanan bildirimler">
          <Card style={{ gap: Spacing.sm }}>
            {planli.length ? planli.slice(0, 6).map(p => (
              <View key={p.id} style={styles.planRow}>
                <T variant="small" color="muted" style={{ width: 92 }}>{p.date ? p.date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' }) + ' ' + p.date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '—'}</T>
                <T variant="small" style={{ flex: 1 }} numberOfLines={1}>{p.title}</T>
              </View>
            )) : <T variant="small" color="muted">Şu an planlanan bildirim yok.</T>}
            <Button label="Deneme bildirimi gönder" icon="paper-plane-outline" size="sm" variant="secondary" onPress={async () => { await sendTestNotification(); Alert.alert('Gönderildi', '5 saniye içinde bir deneme bildirimi gelecek. Görmek için uygulamayı arka plana alın.'); }} style={{ marginTop: Spacing.sm }} />
          </Card>
        </Section>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingLeft: 52, paddingBottom: Spacing.md },
  time: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1 },
  planRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
});
