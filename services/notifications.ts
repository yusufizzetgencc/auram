/**
 * TENİNDE — Yerel bildirimler (zamanlayıcı)
 *
 * Ne gönderilir, ne zaman: services/notificationPlan.ts (saf planlayıcı). Bu dosya yalnızca planı sisteme verir.
 *  • syncNotifications(): Teninde'nin planladığı tüm bildirimleri siler, planı baştan kurar. Uygulama açıldığında
 *    ve günün kokusu / dolap / ayar değiştiğinde çağrılır (components/NotificationSync.tsx).
 *  • notifyLowStock(): şişe azalınca anında bildirim.
 *  • Bildirime dokununca `data.url` ile ilgili ekran açılır (NotificationSync içindeki dinleyici).
 *
 * Sunucudan gönderilen (push) bildirim YOKTUR: hesap/sunucu olmadığı için gerekmiyor; tüm içerik cihazda üretilir.
 */
import { NotificationPreferences, Parfum } from '@/types';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { azalanMetni, bildirimPlani, PlanGirdisi, PlanliBildirim } from './notificationPlan';
import { loadNotificationPreferences, saveNotificationPreferences } from './storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const ON_EK = 'teninde_';
let kanalHazir = false;

async function kanal() {
  if (kanalHazir || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', { name: 'Teninde', importance: Notifications.AndroidImportance.DEFAULT });
  kanalHazir = true;
}

export async function getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as any;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

/** Ana anahtar. Açarken izin ister; izin verilmezse false döner ve ayar kapalı kalır. */
export async function setNotificationsEnabled(on: boolean): Promise<boolean> {
  const current = await loadNotificationPreferences();
  if (on && !(await requestNotificationPermissions())) {
    await saveNotificationPreferences({ ...current, enabled: false });
    return false;
  }
  await saveNotificationPreferences({ ...current, enabled: on });
  if (!on) await cancelAllTeninde();
  return true;
}

export async function updateNotificationPrefs(patch: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
  const next = { ...(await loadNotificationPreferences()), ...patch };
  await saveNotificationPreferences(next);
  return next;
}

async function cancelAllTeninde() {
  const all = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(all.filter(n => n.identifier.startsWith(ON_EK)).map(n => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})));
}

async function uygula(plan: PlanliBildirim[]) {
  await cancelAllTeninde();
  await kanal();
  for (const b of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: b.id,
      content: { title: b.baslik, body: b.govde, data: { url: b.url, tur: b.tur, zaman: b.tarih.getTime() } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: b.tarih, channelId: 'default' },
    }).catch(() => {});
  }
}

/** Planı (ayarlar dahil) baştan kurar. İzin yoksa hiçbir şey yapmaz. Planlanan bildirim sayısını döner. */
export async function syncNotifications(girdi: Omit<PlanGirdisi, 'ayar' | 'simdi'>): Promise<number> {
  const ayar = await loadNotificationPreferences();
  if (!ayar.enabled || (await getPermissionStatus()) !== 'granted') {
    await cancelAllTeninde();
    return 0;
  }
  const plan = bildirimPlani({ ...girdi, ayar, simdi: new Date() });
  await uygula(plan);
  return plan.length;
}

/** Şişe azalınca anında bildirim (ayar kapalıysa veya izin yoksa gönderilmez) */
export async function notifyLowStock(p: Parfum, kalanYuzde: number, sikis: number | null): Promise<boolean> {
  const ayar = await loadNotificationPreferences();
  if (!ayar.enabled || ayar.azalan === false || (await getPermissionStatus()) !== 'granted') return false;
  await kanal();
  const { baslik, govde } = azalanMetni(p, kalanYuzde, sikis);
  await Notifications.scheduleNotificationAsync({
    identifier: `${ON_EK}azalan_${p.id}`,
    content: { title: baslik, body: govde, data: { url: `/parfum/${p.id}`, tur: 'azalan' } },
    trigger: null,
  });
  return true;
}

/**
 * Ücretsiz deneme hatırlatması: deneme bitmeden 2 gün önce 10:00'da. Bildirim izni yoksa sessizce atlanır.
 * Kimliği "teninde_" ile BAŞLAMAZ; böylece günlük plan yenilenirken silinmez.
 */
export async function scheduleTrialReminder(denemeGunu: number): Promise<void> {
  if ((await getPermissionStatus()) !== 'granted') return;
  await kanal();
  const t = new Date();
  t.setDate(t.getDate() + denemeGunu - 2);
  t.setHours(10, 0, 0, 0);
  if (t.getTime() <= Date.now()) return;
  await Notifications.scheduleNotificationAsync({
    identifier: 'abonelik_deneme_hatirlatma',
    content: {
      title: 'Denemeniz 2 gün sonra bitiyor',
      body: 'Devam etmek istemezseniz Ayarlar > Apple Kimliği > Abonelikler bölümünden iptal edebilirsiniz. Devam ederseniz bir şey yapmanıza gerek yok.',
      data: { url: '/(tabs)/profile', tur: 'deneme' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: t, channelId: 'default' },
  });
}

/** Ayarlardaki "Deneme bildirimi gönder": 5 sn sonra örnek bildirim */
export async function sendTestNotification(): Promise<void> {
  await kanal();
  await Notifications.scheduleNotificationAsync({
    identifier: `${ON_EK}deneme`,
    content: { title: 'Teninde', body: 'Bildirimler çalışıyor. Sabah önerileriniz bu şekilde gelecek.', data: { url: '/(tabs)' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: 'default' },
  });
}

/** Ayarlar ekranında gösterilmek üzere planlanan bildirimler */
export async function listScheduled(): Promise<{ id: string; title: string; date: Date | null }[]> {
  const all = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  return all
    .filter(n => n.identifier.startsWith(ON_EK))
    .map(n => {
      // Planlanan zamanı içerikte de saklıyoruz; tetikleyicinin biçimi platforma göre değişiyor
      const tr: any = n.trigger;
      const veri: any = n.content.data;
      const ms = veri?.zaman ?? tr?.value ?? tr?.date;
      return { id: n.identifier, title: n.content.title ?? '', date: ms ? new Date(ms) : null };
    })
    .sort((a, b) => (a.date?.getTime() ?? Infinity) - (b.date?.getTime() ?? Infinity));
}
