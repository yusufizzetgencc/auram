/**
 * Görünmez bileşen: bildirim planını güncel tutar ve bildirime dokunulunca ilgili ekranı açar.
 *  • Uygulama ön plana geldiğinde ve günün kokusu / dolap / tercih / isim değiştiğinde planı yeniden kurar
 *    (art arda değişiklikleri 1.5 sn bekleyerek tek seferde işler).
 *  • Dolaptaki bir şişe %15'in altına inince bir kez "azalıyor" bildirimi gönderir.
 *  • Ana ekran widget'ının verisini (önümüzdeki 7 günün seçimi, seri, bugünün kaydı) günceller.
 *  • Ekran gezinmesini anonim analitiğe bildirir.
 */
import { useApp } from '@/context/AppContext';
import { getEffectivePH } from '@/engine';
import { track, trackScreen } from '@/services/analytics';
import { notifyLowStock, syncNotifications } from '@/services/notifications';
import { updateWidget } from '@/services/widget';
import * as Notifications from 'expo-notifications';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { SIKIS_ML } from './wardrobe/WardrobeItemSheet';

export function NotificationSync() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDataLoaded, isOnboardingComplete, parfumler, preferences, wardrobe, wardrobeParfums, sotdHistory, streakData, updateWardrobeItem, zevk } = useApp();
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);
  const son = useRef<string>('');

  // Planı güncelle
  useEffect(() => {
    if (!isDataLoaded || !isOnboardingComplete) return;
    const imza = JSON.stringify([preferences.userName, preferences.sevilenParfumler, wardrobe.map(w => w.parfumId), sotdHistory[0]?.date, sotdHistory[0]?.parfumId, streakData.currentStreak]);
    const calistir = () => {
      syncNotifications({
        prefs: preferences,
        ph: getEffectivePH(preferences),
        dolap: wardrobeParfums,
        katalog: parfumler,
        zevk: zevk,
        gecmis: sotdHistory.map(s => ({ parfumId: s.parfumId, date: s.date })),
        seri: streakData.currentStreak,
        isim: preferences.userName,
      }).catch(() => {});
      updateWidget({
        prefs: preferences,
        ph: getEffectivePH(preferences),
        dolap: wardrobeParfums,
        katalog: parfumler,
        zevk: zevk,
        gecmis: sotdHistory.map(s => ({ parfumId: s.parfumId, date: s.date })),
        seri: streakData.currentStreak,
        seriTarih: streakData.lastSOTDDate,
      });
    };
    if (imza !== son.current) {
      son.current = imza;
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
      zamanlayici.current = setTimeout(calistir, 1500);
    }
    const sub = AppState.addEventListener('change', s => { if (s === 'active') calistir(); });
    return () => sub.remove();
  }, [isDataLoaded, isOnboardingComplete, preferences, wardrobe, wardrobeParfums, parfumler, sotdHistory, streakData, zevk]);

  // Azalan şişeler
  useEffect(() => {
    wardrobe.forEach(w => {
      if (!w.hacimMl || w.kalanYuzde > 15 || w.azalanBildirildi) return;
      const p = parfumler.find(x => x.id === w.parfumId);
      if (!p) return;
      const sikis = Math.floor(((w.hacimMl * w.kalanYuzde) / 100) / SIKIS_ML);
      notifyLowStock(p, w.kalanYuzde, sikis).then(gonderildi => {
        if (gonderildi) updateWardrobeItem(w.id, { azalanBildirildi: true });
      }).catch(() => {});
    });
  }, [wardrobe, parfumler, updateWardrobeItem]);

  // Bildirime dokununca ilgili ekran
  useEffect(() => {
    const ac = (r: Notifications.NotificationResponse | null) => {
      const data = r?.notification.request.content.data as { url?: string; tur?: string } | undefined;
      if (!data?.url) return;
      track('notification_opened', { tur: data.tur ?? 'bilinmiyor' });
      setTimeout(() => router.push(data.url as any), 300);
    };
    Notifications.getLastNotificationResponseAsync().then(ac).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(ac);
    return () => sub.remove();
  }, [router]);

  // Ekran analitiği
  useEffect(() => { if (pathname) trackScreen(pathname); }, [pathname]);

  return null;
}
