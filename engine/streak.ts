/**
 * Seri (streak) mantığı — saf fonksiyonlar.
 *
 * Kurallar:
 *  • Aynı gün ikinci kez kayıt seriyi değiştirmez.
 *  • Dünden devam → seri +1.
 *  • Tek bir gün atlanmışsa (fark = 2) ve koruma hakkı varsa → hak harcanır, atlanan gün "korunan" sayılır, seri +1.
 *  • Daha fazla gün atlanmışsa → seri 1'den başlar.
 *  • Koruma hakkı her pazartesi 1'e tamamlanır (birikmez; en fazla KORUMA_MAX).
 */
import { StreakData } from '../types';
import { dayDiff } from '../utils/date';

export const KORUMA_MAX = 1;

/** YYYY-MM-DD → aynı haftanın pazartesisi (YYYY-MM-DD) */
export function haftaBasi(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = (dt.getUTCDay() + 6) % 7; // pazartesi = 0
  dt.setUTCDate(dt.getUTCDate() - dow);
  return dt.toISOString().slice(0, 10);
}

/** Yeni haftaya girildiyse koruma hakkını tamamlar */
export function korumaYenile(data: StreakData, today: string): StreakData {
  const pzt = haftaBasi(today);
  if (data.korumaYenilenme === pzt) return { ...data, korumaHakki: data.korumaHakki ?? KORUMA_MAX };
  return { ...data, korumaHakki: KORUMA_MAX, korumaYenilenme: pzt };
}

export interface SeriSonucu {
  data: StreakData;
  /** Bu kayıtta koruma hakkı harcandı mı */
  korumaKullanildi: boolean;
}

export function seriGuncelle(prev: StreakData, today: string): SeriSonucu {
  const base = korumaYenile(prev, today);
  if (base.lastSOTDDate === today) return { data: base, korumaKullanildi: false };

  let streak = 1;
  let korumaKullanildi = false;
  const korunanGunler = [...(base.korunanGunler ?? [])];
  let hak = base.korumaHakki ?? 0;

  if (base.lastSOTDDate) {
    const fark = dayDiff(base.lastSOTDDate, today);
    if (fark === 1) streak = base.currentStreak + 1;
    else if (fark === 2 && hak > 0 && base.currentStreak > 0) {
      streak = base.currentStreak + 1;
      hak -= 1;
      korumaKullanildi = true;
      const [y, m, d] = today.split('-').map(Number);
      const dun = new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
      korunanGunler.push(dun);
    }
  }

  return {
    korumaKullanildi,
    data: {
      ...base,
      currentStreak: streak,
      longestStreak: Math.max(base.longestStreak, streak),
      lastSOTDDate: today,
      totalSOTDs: base.totalSOTDs + 1,
      korumaHakki: hak,
      korunanGunler: korunanGunler.slice(-30),
    },
  };
}

/** Ekranda gösterilecek "etkin" seri: son kayıt dün veya bugünse seri sürüyor; korumayla kurtarılabilir mi bilgisiyle */
export function seriDurumu(data: StreakData, today: string): { gunler: number; riskte: boolean; kurtarilabilir: boolean } {
  if (!data.lastSOTDDate) return { gunler: 0, riskte: false, kurtarilabilir: false };
  const fark = dayDiff(data.lastSOTDDate, today);
  const hak = korumaYenile(data, today).korumaHakki ?? 0;
  if (fark <= 0) return { gunler: data.currentStreak, riskte: false, kurtarilabilir: false };
  if (fark === 1) return { gunler: data.currentStreak, riskte: true, kurtarilabilir: false };
  if (fark === 2 && hak > 0) return { gunler: data.currentStreak, riskte: true, kurtarilabilir: true };
  return { gunler: 0, riskte: false, kurtarilabilir: false };
}
