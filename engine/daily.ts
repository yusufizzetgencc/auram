/**
 * Günün seçimi — "Bugün ne sıkayım?" sorusunun motoru (saf fonksiyon).
 *
 * Adaylar normalde kullanıcının DOLABIdır; dolap boşsa katalog kullanılır.
 * Her aday dört bileşenle puanlanır (0–1):
 *   • Ten uyumu      %40  — ana motorun (skorlaParfum) eşleşme yüzdesi; mevsim bugünün mevsimine çekilir
 *   • Etkinlik       %25  — iş / buluşma / özel gün / spor / ev / günlük için yoğunluk ve kullanım amacı uyumu
 *   • Hava           %20  — sıcaklık ve nem × yoğunluk ve aile; hava yoksa parfümün mevsimi
 *   • Çeşitlilik     %15  — dün sıkılan geri planda kalır, uzun süredir sıkılmayan öne çıkar
 * Eşitlikte tarih tohumlu sabit bir sıra kullanılır (gün içinde öneri zıplamaz).
 */
import { Etkinlik, Parfum, UserPreferences } from '../types';
import { dayDiff, toLocalDateKey } from '../utils/date';
import { skorlaParfum } from './scoring';
import { ZevkBaglami } from './similarity';

export const GUNLUK_AGIRLIK = { ten: 0.4, etkinlik: 0.25, hava: 0.2, cesitlilik: 0.15 } as const;

export const ETKINLIK_ETIKET: Record<Etkinlik, { label: string; icon: string }> = {
  gunluk: { label: 'Günlük', icon: 'sunny-outline' },
  is: { label: 'İş', icon: 'briefcase-outline' },
  bulusma: { label: 'Buluşma', icon: 'wine-outline' },
  ozel: { label: 'Özel gün', icon: 'sparkles-outline' },
  spor: { label: 'Spor', icon: 'barbell-outline' },
  ev: { label: 'Evde', icon: 'home-outline' },
};

export interface GunlukHava {
  sicaklik: number;
  nem: number;
}

export interface GunlukGirdi {
  adaylar: Parfum[];
  prefs: UserPreferences;
  ph: number;
  tarih?: Date;
  etkinlik: Etkinlik;
  hava?: GunlukHava | null;
  /** Geçmiş kullanım (günün kokusu kayıtları) */
  gecmis?: { parfumId: string; date: string }[];
  zevk?: ZevkBaglami;
  /** Adaylar dolaptan mı geliyor (gerekçe dili buna göre değişir) */
  dolaptan?: boolean;
}

export interface GunlukSecim {
  parfum: Parfum;
  /** 0–100 */
  puan: number;
  gerekceler: string[];
  bilesenler: { ten: number; etkinlik: number; hava: number; cesitlilik: number };
}

const YOG = { hafif: 0, orta: 1, yogun: 2 } as const;
const SICAK_AILE = ['Amber', 'Oryantal', 'Odunsu', 'Baharatlı', 'Tatlı', 'Deri'];
const SERIN_AILE = ['Ferah', 'Aquatik', 'Yeşil', 'Meyvemsi'];

export function mevsimOf(d: Date): 'İlkbahar' | 'Yaz' | 'Sonbahar' | 'Kış' {
  const m = d.getMonth();
  if (m >= 2 && m <= 4) return 'İlkbahar';
  if (m >= 5 && m <= 7) return 'Yaz';
  if (m >= 8 && m <= 10) return 'Sonbahar';
  return 'Kış';
}

function etkinlikPuani(p: Parfum, e: Etkinlik): number {
  const y = YOG[p.yogunluk];
  const k = p.kullanimAmaci ?? [];
  const has = (...xs: string[]) => xs.some(x => k.includes(x as any));
  switch (e) {
    case 'is': return [1, 0.8, 0.2][y] * 0.8 + (has('is') ? 0.2 : 0);
    case 'bulusma': return [0.5, 0.85, 1][y] * 0.7 + (has('aksam', 'romantik') ? 0.3 : 0);
    case 'ozel': return [0.4, 0.8, 1][y] * 0.7 + (has('ozel', 'aksam') ? 0.3 : 0);
    case 'spor': return [1, 0.4, 0][y] * 0.8 + ([p.tip, p.ikincilTip].some(f => f && SERIN_AILE.includes(f)) ? 0.2 : 0);
    case 'ev': return [1, 0.7, 0.4][y] * 0.85 + (has('gunluk') ? 0.15 : 0);
    default: return [0.85, 0.85, 0.5][y] * 0.8 + (has('gunluk') ? 0.2 : 0);
  }
}

function havaPuani(p: Parfum, hava: GunlukHava | null | undefined, mevsim: string): number {
  const aileler = [p.tip, p.ikincilTip].filter(Boolean) as string[];
  if (!hava) return (p.mevsim ?? []).includes(mevsim as any) ? 1 : 0.5;
  const y = YOG[p.yogunluk];
  let s: number;
  if (hava.sicaklik >= 26) s = [1, 0.6, 0.2][y] + (aileler.some(a => SERIN_AILE.includes(a)) ? 0.1 : 0);
  else if (hava.sicaklik <= 10) s = [0.4, 0.8, 1][y] + (aileler.some(a => SICAK_AILE.includes(a)) ? 0.1 : 0);
  else if (hava.nem >= 75) s = [0.9, 0.85, 0.5][y];
  else s = 0.85;
  return Math.min(1, s);
}

function sonKullanim(parfumId: string, gecmis: { parfumId: string; date: string }[], bugun: string): number | null {
  let min: number | null = null;
  gecmis.forEach(g => {
    if (g.parfumId !== parfumId) return;
    const d = dayDiff(g.date, bugun);
    if (d >= 0 && (min === null || d < min)) min = d;
  });
  return min;
}

function cesitlilikPuani(gun: number | null): number {
  if (gun === null) return 0.9; // hiç sıkılmamış
  if (gun === 0) return 0.6; // bugün zaten seçilmiş (değiştirmek isteyebilir)
  if (gun === 1) return 0.2;
  if (gun === 2) return 0.5;
  if (gun < 7) return 0.8;
  return 1;
}

const tohum = (s: string) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

export function gununSecimi(g: GunlukGirdi): GunlukSecim[] {
  const tarih = g.tarih ?? new Date();
  const bugun = toLocalDateKey(tarih);
  const mevsim = mevsimOf(tarih);
  const gecmis = g.gecmis ?? [];
  // Ana motoru bugünün mevsimiyle çalıştır (kullanıcının profildeki mevsim tercihi yerine)
  const prefs: UserPreferences = { ...g.prefs, mevsim };

  return g.adaylar
    .map(p => {
      const skor = skorlaParfum(p, prefs, g.ph, g.zevk ? { ...g.zevk, etkinlik: g.etkinlik } : undefined);
      const ten = skor.matchPercentage / 100;
      const etk = Math.min(1, etkinlikPuani(p, g.etkinlik));
      const hv = havaPuani(p, g.hava, mevsim);
      const son = sonKullanim(p.id, gecmis, bugun);
      const ces = cesitlilikPuani(son);
      const puan = 100 * (GUNLUK_AGIRLIK.ten * ten + GUNLUK_AGIRLIK.etkinlik * etk + GUNLUK_AGIRLIK.hava * hv + GUNLUK_AGIRLIK.cesitlilik * ces);

      // Gerekçeler: en belirleyici bileşenlerden, sade dille
      const g2: { m: string; w: number }[] = [];
      if (g.hava && g.hava.sicaklik <= 10 && p.yogunluk !== 'hafif') g2.push({ m: `${g.hava.sicaklik}°C'de alt notaları yavaş ve dolgun açılır.`, w: hv });
      else if (g.hava && g.hava.sicaklik >= 26 && p.yogunluk === 'hafif') g2.push({ m: `${g.hava.sicaklik}°C'de boğmadan ferah kalır.`, w: hv });
      else if (g.hava && g.hava.nem >= 75 && p.yogunluk !== 'yogun') g2.push({ m: 'Nemli havada ağırlaşmadan dengede kalır.', w: hv * 0.8 });
      else if (!g.hava && (p.mevsim ?? []).includes(mevsim as any)) g2.push({ m: `${mevsim} için uygun bir seçim.`, w: hv * 0.6 });

      const ETK_METIN: Record<Etkinlik, string> = {
        is: 'Ofiste kimseyi rahatsız etmeyecek yoğunlukta.',
        bulusma: 'Yakın mesafede etkileyici bir iz bırakır.',
        ozel: 'Özel bir gün için yeterince iddialı.',
        spor: 'Hareket halinde hafif ve temiz kalır.',
        ev: 'Evde rahatsız etmeyen, yumuşak bir eşlikçi.',
        gunluk: 'Gün boyu dengeli bir seçim.',
      };
      if (etk >= 0.7) g2.push({ m: ETK_METIN[g.etkinlik], w: etk });
      if (g.dolaptan) {
        if (son === null) g2.push({ m: 'Henüz hiç sıkmadınız; denemek için iyi bir gün.', w: 0.75 });
        else if (son >= 7) g2.push({ m: `${son} gündür sıkmadınız.`, w: 0.7 });
      }
      if (ten >= 0.7 && skor.matchReasons[0]) g2.push({ m: skor.matchReasons[0], w: ten });

      return {
        parfum: p,
        puan: Math.round(puan),
        gerekceler: g2.sort((a, b) => b.w - a.w).map(x => x.m).filter((m, i, a) => a.indexOf(m) === i).slice(0, 2),
        bilesenler: { ten, etkinlik: etk, hava: hv, cesitlilik: ces },
        _t: tohum(bugun + p.id),
      };
    })
    .sort((a, b) => b.puan - a.puan || a._t - b._t)
    .map(({ _t, ...rest }) => rest);
}
