/**
 * Benzerlik motoru — iki parfümün koku olarak ne kadar yakın olduğunu hesaplar (0–1).
 * Saf fonksiyonlardır; "Buna benzeyenler", "Daha uygun benzerleri" ve kişisel zevk ayarı bunu kullanır.
 *
 * Bileşenler:
 *  • Ortak notalar  %50 — katman ağırlıklı Jaccard (üst 0.6 · orta 0.8 · alt 1.0; alt notalar izi belirler)
 *  • Koku ailesi    %30 — aynı ana aile 1, çapraz ana/ikincil 0.6, yalnız ikincil ortak 0.4
 *  • Yoğunluk       %10 — aynı 1, bir kademe fark 0.5
 *  • Profil         %10 — aynı ya da biri unisex 1, karşı profil 0.3
 *
 * Not: Bu bir "muadil" iddiası değildir; yalnızca nota/aile yapısının yakınlığıdır.
 */
import type { Etkinlik } from '../types';
import { Parfum, UserPreferences } from '../types';
import type { KisiselModel } from './learning';
import { trLower } from '../utils/text';

const KATMAN = { ust: 0.6, orta: 0.8, alt: 1 } as const;
const YOG = { hafif: 1, orta: 2, yogun: 3 } as const;
export const FIYAT_SIRA: Record<string, number> = { ekonomik: 0, orta: 1, premium: 2, luks: 3 };

/** Nota → en yüksek katman ağırlığı */
const notaHaritasi = (p: Parfum): Map<string, number> => {
  const m = new Map<string, number>();
  (Object.keys(KATMAN) as (keyof typeof KATMAN)[]).forEach(k => {
    p.notalar[k].forEach(n => {
      const key = trLower(n).trim();
      if (key) m.set(key, Math.max(m.get(key) ?? 0, KATMAN[k]));
    });
  });
  return m;
};

export interface BenzerlikSonucu {
  parfum: Parfum;
  /** 0–1 */
  benzerlik: number;
  /** Ekranda gösterilecek ortak notalar (en etkili önce) */
  ortakNotalar: string[];
}

export function benzerlik(a: Parfum, b: Parfum): { skor: number; ortakNotalar: string[] } {
  const ma = notaHaritasi(a);
  const mb = notaHaritasi(b);
  let kesisim = 0;
  let birlesim = 0;
  const ortak: [string, number][] = [];
  new Set([...ma.keys(), ...mb.keys()]).forEach(n => {
    const wa = ma.get(n) ?? 0;
    const wb = mb.get(n) ?? 0;
    birlesim += Math.max(wa, wb);
    if (wa && wb) {
      kesisim += (wa + wb) / 2;
      ortak.push([n, wa + wb]);
    }
  });
  const nota = birlesim ? kesisim / birlesim : 0;

  let aile = 0;
  if (a.tip === b.tip) aile = 1;
  else if (a.tip === b.ikincilTip || a.ikincilTip === b.tip) aile = 0.6;
  else if (a.ikincilTip && a.ikincilTip === b.ikincilTip) aile = 0.4;

  const fark = Math.abs(YOG[a.yogunluk] - YOG[b.yogunluk]);
  const yog = fark === 0 ? 1 : fark === 1 ? 0.5 : 0;
  const profil = a.cinsiyet === b.cinsiyet || a.cinsiyet === 'unisex' || b.cinsiyet === 'unisex' ? 1 : 0.3;

  const skor = 0.5 * nota + 0.3 * aile + 0.1 * yog + 0.1 * profil;
  return { skor: Math.round(skor * 1000) / 1000, ortakNotalar: ortak.sort((x, y) => y[1] - x[1]).map(x => x[0]) };
}

/** Bir parfüme en çok benzeyenler. `dahaUygun` verilirse yalnızca daha düşük fiyat kademesindekiler. */
export function benzerParfumler(
  base: Parfum,
  katalog: Parfum[],
  opts: { limit?: number; dahaUygun?: boolean; esik?: number } = {},
): BenzerlikSonucu[] {
  const { limit = 8, dahaUygun = false, esik = 0.3 } = opts;
  const baseFiyat = FIYAT_SIRA[base.fiyatAraligi ?? 'orta'];
  return katalog
    .filter(p => p.id !== base.id)
    .filter(p => !dahaUygun || FIYAT_SIRA[p.fiyatAraligi ?? 'orta'] < baseFiyat)
    .map(p => {
      const { skor, ortakNotalar } = benzerlik(base, p);
      return { parfum: p, benzerlik: skor, ortakNotalar };
    })
    .filter(s => s.benzerlik >= esik)
    .sort((a, b) => b.benzerlik - a.benzerlik)
    .slice(0, limit);
}

// ---------- Kişisel zevk (sevdiklerim / sevmediklerim) ----------

export interface ZevkBaglami {
  sevilenler: Parfum[];
  sevilmeyenler: Parfum[];
  /** Kullanıcının davranışından öğrenilen model (engine/learning.ts) */
  ogrenme?: KisiselModel;
  /** Bugünün etkinliği — öğrenilen bağlam tercihi için */
  etkinlik?: Etkinlik;
}

/** Zevk ayarının üst sınırı (puan). Ana ağırlıklar (AGIRLIKLAR) değişmez; bu, onların üstüne eklenen kişisel düzeltmedir. */
export const ZEVK_BONUS_MAX = 10;
export const ZEVK_CEZA_MAX = 12;
const ZEVK_ESIK = 0.35;

export function zevkBaglami(katalog: Parfum[], p: UserPreferences, ogrenme?: KisiselModel): ZevkBaglami | undefined {
  const sev = p.sevilenParfumler ?? [];
  const sevme = p.sevilmeyenParfumler ?? [];
  if (!sev.length && !sevme.length && !ogrenme?.sinyalSayisi) return undefined;
  const byId = new Map(katalog.map(x => [x.id, x]));
  return {
    sevilenler: sev.map(id => byId.get(id)).filter((x): x is Parfum => !!x),
    sevilmeyenler: sevme.map(id => byId.get(id)).filter((x): x is Parfum => !!x),
    ...(ogrenme?.sinyalSayisi ? { ogrenme } : {}),
  };
}

/** Sevilenlere benzerse artı, sevilmeyenlere benzerse eksi puan ve gerekçe */
export function zevkDuzeltmesi(parfum: Parfum, z?: ZevkBaglami): { delta: number; gerekce?: string; uyari?: string } {
  if (!z) return { delta: 0 };
  const enYakin = (liste: Parfum[]) =>
    liste
      .filter(x => x.id !== parfum.id)
      .map(x => ({ x, s: benzerlik(parfum, x).skor }))
      .sort((a, b) => b.s - a.s)[0];

  const iyi = enYakin(z.sevilenler);
  const kotu = enYakin(z.sevilmeyenler);
  let delta = 0;
  let gerekce: string | undefined;
  let uyari: string | undefined;
  if (iyi && iyi.s >= ZEVK_ESIK) {
    delta += Math.round(Math.min(1, (iyi.s - ZEVK_ESIK) / 0.4) * ZEVK_BONUS_MAX);
    gerekce = `Sevdiğiniz ${iyi.x.isim} ile benzer bir yapısı var.`;
  }
  if (kotu && kotu.s >= ZEVK_ESIK) {
    delta -= Math.round(Math.min(1, (kotu.s - ZEVK_ESIK) / 0.4) * ZEVK_CEZA_MAX);
    uyari = `Sevmediğiniz ${kotu.x.isim} ile benzer notalar taşıyor`;
  }
  return { delta, gerekce, uyari };
}
