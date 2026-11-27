/**
 * TENİNDE — Öğrenen motor (SAF fonksiyonlar)
 *
 * Uygulama, kullanıcının kendi davranışından öğrenir ve öneriler zamanla ONA göre şekillenir.
 * Hiçbir veri cihazdan çıkmaz; "model" kural tabanlıdır, her etki açıklanabilir ve geri alınabilir.
 *
 * Sinyaller (ağırlık · kaynak):
 *   Sevdim  +2.5 / Sevmedim −2.5      preferences.sevilenParfumler / sevilmeyenParfumler
 *   Dolapta olmak  +2                  wardrobe
 *   Favori  +1                         favorites
 *   Günün kokusu seçimi  +1            sotdHistory (etkinlik varsa bağlam da öğrenilir)
 *   Akşam puanı (1–10)  −2…+2          performanceLogs.personalRating
 *   İltifat  +1                        performanceLogs.compliment
 *   "Başka" ile geçme  −0.4            gecilenler (Bugün ekranı)
 * Eski sinyaller zayıflar: yarı ömür YARI_OMUR_GUN (60 gün).
 *
 * Öğrenilenler:
 *   aileEgilim   Koku ailelerine yatkınlık (−1…+1)
 *   notaEgilim   Sık tekrar eden notalara yatkınlık (−1…+1, en az 2 parfümde geçen notalar)
 *   kalicilik    TEN KALİBRASYONU: akşam kalıcılık kaydı (1–5) − motorun tahmini (1–5). Aile başına ortalama sapma.
 *   baglam       Etkinliğe göre aile tercihi (iş / buluşma …)
 *   iltifatli    İltifat aldığı ya da 8+ puan verdiği parfümler
 *
 * Etki (ogrenmeDuzeltmesi): zevk ±9, ten kalibrasyonu ±5, bağlam ±3, iltifat benzerliği +3; toplam ±OGRENME_MAX (15).
 * Güven, sinyal sayısıyla artar (n / (n + GUVEN_K)); az veriyle öneriler savrulmaz. AGIRLIKLAR değişmez; ten profili belirleyici kalır.
 * Kullanıcı bir tespiti "Bu doğru değil" diye reddederse (reddedilen kimlikler) o etki tamamen kaldırılır.
 */
import { Etkinlik, KokuTipi, Parfum, PerformanceLog, UserPreferences } from '../types';
import { dayDiff } from '../utils/date';
import { hesaplaParfumPHSkoruPure } from './perfume-chemistry';
import { benzerlik } from './similarity';

export const OGRENME_MAX = 15;
export const YARI_OMUR_GUN = 60;
/** Kalıcılık kalibrasyonu için bir ailede gereken en az kayıt */
export const KALIBRASYON_MIN = 2;
/** Güven = n / (n + GUVEN_K): 10 sinyalde %50, 30 sinyalde %75 */
export const GUVEN_K = 10;
/** Bir aile yatkınlığının tespit olarak gösterilmesi için gereken en az kayıt */
export const TESPIT_MIN = 3;

export interface GecilenOneri { parfumId: string; tarih: string; etkinlik?: Etkinlik }

export interface OgrenmeGirdisi {
  bugun: string;
  katalog: Parfum[];
  prefs: UserPreferences;
  ph: number;
  dolap: string[];
  favoriler: string[];
  gunluk: { parfumId: string; date: string; etkinlik?: Etkinlik }[];
  degerlendirmeler: PerformanceLog[];
  gecilenler: GecilenOneri[];
  /** Kullanıcının "Bu doğru değil" dediği tespit kimlikleri */
  reddedilen: string[];
}

export interface Tespit {
  id: string;
  tur: 'aile' | 'kalicilik' | 'baglam' | 'iltifat' | 'nota';
  metin: string;
  /** Kaç kayıt / sinyale dayandığı */
  kanit: number;
  /** + yatkınlık / uzun kalma, − kaçınma / kısa kalma */
  yon: 1 | -1;
}

export interface KisiselModel {
  sinyalSayisi: number;
  /** 0–1 */
  guven: number;
  aileEgilim: Partial<Record<KokuTipi, number>>;
  notaEgilim: Record<string, number>;
  kalicilik: Partial<Record<KokuTipi, { sapma: number; kayit: number }>>;
  /** Tüm kayıtlar üzerinden genel kalıcılık sapması (−1…+1) */
  genelKalicilik: { sapma: number; kayit: number } | null;
  baglam: Partial<Record<Etkinlik, Partial<Record<KokuTipi, number>>>>;
  iltifatli: string[];
  /** İltifatlı parfümlerin kendisi (benzerlik hesabı için) */
  iltifatParfumler: Parfum[];
  tespitler: Tespit[];
}

const BAGLAM_AD: Record<Etkinlik, string> = { gunluk: 'Günlük', is: 'İş', bulusma: 'Buluşma', ozel: 'Özel gün', spor: 'Spor', ev: 'Evde' };

const azalma = (tarih: string, bugun: string) => {
  const gun = Math.max(0, dayDiff(tarih.slice(0, 10), bugun));
  return Math.pow(0.5, gun / YARI_OMUR_GUN);
};

const ekle = <K extends string>(m: Partial<Record<K, number>>, k: K, v: number) => { m[k] = (m[k] ?? 0) + v; };

const notalarOf = (p: Parfum) => [...new Set([...p.notalar.ust, ...p.notalar.orta, ...p.notalar.alt].map(n => n.toLocaleLowerCase('tr')))];

/** Motorun bu parfüm için kalıcılık beklentisi, kayıtla aynı ölçekte (1–5) */
export function beklenenKalicilik(p: Parfum, prefs: UserPreferences, ph: number): number {
  const perf = hesaplaParfumPHSkoruPure(p, ph, prefs.ciltTipi).toplamPerformans; // 0–100
  return 1 + (4 * Math.max(0, Math.min(100, perf))) / 100;
}

export function kisiselModel(g: OgrenmeGirdisi): KisiselModel {
  const byId = new Map(g.katalog.map(p => [p.id, p]));
  const red = new Set(g.reddedilen);
  const aileHam: Partial<Record<KokuTipi, number>> = {};
  const aileKanit: Partial<Record<KokuTipi, number>> = {};
  const notaHam: Record<string, number> = {};
  const notaSay: Record<string, number> = {};
  const baglamHam: Partial<Record<Etkinlik, Partial<Record<KokuTipi, number>>>> = {};
  const baglamSay: Partial<Record<Etkinlik, number>> = {};
  let sinyalSayisi = 0;

  const sinyal = (id: string, agirlik: number, tarih?: string, etkinlik?: Etkinlik) => {
    const p = byId.get(id);
    if (!p || !agirlik) return;
    const w = agirlik * (tarih ? azalma(tarih, g.bugun) : 1);
    sinyalSayisi++;
    ekle(aileHam, p.tip, w);
    ekle(aileKanit, p.tip, 1);
    if (p.ikincilTip) { ekle(aileHam, p.ikincilTip, w * 0.5); ekle(aileKanit, p.ikincilTip, 0.5); }
    notalarOf(p).forEach(n => { notaHam[n] = (notaHam[n] ?? 0) + w * 0.5; notaSay[n] = (notaSay[n] ?? 0) + 1; });
    if (etkinlik && w > 0) {
      const b = (baglamHam[etkinlik] ??= {});
      ekle(b, p.tip, w);
      baglamSay[etkinlik] = (baglamSay[etkinlik] ?? 0) + 1;
    }
  };

  (g.prefs.sevilenParfumler ?? []).forEach(id => sinyal(id, 2.5));
  (g.prefs.sevilmeyenParfumler ?? []).forEach(id => sinyal(id, -2.5));
  g.dolap.forEach(id => sinyal(id, 2));
  g.favoriler.forEach(id => sinyal(id, 1));
  g.gunluk.forEach(k => sinyal(k.parfumId, 1, k.date, k.etkinlik));
  g.gecilenler.forEach(k => sinyal(k.parfumId, -0.4, k.tarih));
  g.degerlendirmeler.forEach(d => {
    const puan = typeof d.personalRating === 'number' ? ((d.personalRating - 5.5) / 4.5) * 2 : 0;
    sinyal(d.parfumId, puan + (d.compliment ? 1 : 0), d.date);
  });

  // Normalize: tanh ile −1…+1 (birkaç güçlü sinyalde doygunluğa yaklaşır)
  const aileEgilim: Partial<Record<KokuTipi, number>> = {};
  (Object.keys(aileHam) as KokuTipi[]).forEach(a => {
    if (red.has(`aile:${a}`)) return;
    const v = Math.tanh((aileHam[a] ?? 0) / 4);
    if (Math.abs(v) >= 0.05) aileEgilim[a] = v;
  });
  const notaEgilim: Record<string, number> = {};
  Object.keys(notaHam).forEach(n => {
    if ((notaSay[n] ?? 0) < 2 || red.has(`nota:${n}`)) return;
    const v = Math.tanh(notaHam[n] / 4);
    if (Math.abs(v) >= 0.1) notaEgilim[n] = v;
  });

  // Bağlam: etkinlik başına aile payı (en az 2 seçim)
  const baglam: KisiselModel['baglam'] = {};
  (Object.keys(baglamHam) as Etkinlik[]).forEach(e => {
    if ((baglamSay[e] ?? 0) < 2) return;
    const b = baglamHam[e]!;
    const toplam = Object.values(b).reduce((s, v) => s + Math.max(0, v ?? 0), 0);
    if (!toplam) return;
    const out: Partial<Record<KokuTipi, number>> = {};
    (Object.keys(b) as KokuTipi[]).forEach(a => {
      if (red.has(`baglam:${e}:${a}`)) return;
      out[a] = Math.max(0, b[a] ?? 0) / toplam;
    });
    baglam[e] = out;
  });

  // Ten kalibrasyonu: gözlenen kalıcılık − beklenen
  const kalHam: Partial<Record<KokuTipi, { top: number; n: number }>> = {};
  let genelTop = 0;
  let genelN = 0;
  g.degerlendirmeler.forEach(d => {
    const p = byId.get(d.parfumId);
    if (!p || typeof d.longevity !== 'number' || d.longevity < 1) return;
    const sapma = (d.longevity - beklenenKalicilik(p, g.prefs, g.ph)) / 4; // −1…+1
    const k = (kalHam[p.tip] ??= { top: 0, n: 0 });
    k.top += sapma; k.n++;
    genelTop += sapma; genelN++;
  });
  const kalicilik: KisiselModel['kalicilik'] = {};
  (Object.keys(kalHam) as KokuTipi[]).forEach(a => {
    const k = kalHam[a]!;
    if (k.n < KALIBRASYON_MIN || red.has(`kalicilik:${a}`)) return;
    // Az kayıtta sıfıra doğru çek (küçültme): n/(n+2)
    kalicilik[a] = { sapma: (k.top / k.n) * (k.n / (k.n + 2)), kayit: k.n };
  });
  const genelKalicilik = genelN >= 3 && !red.has('kalicilik:genel') ? { sapma: (genelTop / genelN) * (genelN / (genelN + 3)), kayit: genelN } : null;

  // İltifat / yüksek puan
  const iltifatli = [...new Set(g.degerlendirmeler.filter(d => d.compliment || d.personalRating >= 8).map(d => d.parfumId))]
    .filter(id => byId.has(id) && !red.has(`iltifat:${id}`));

  const model: KisiselModel = {
    sinyalSayisi,
    guven: sinyalSayisi / (sinyalSayisi + GUVEN_K),
    aileEgilim, notaEgilim, kalicilik, genelKalicilik, baglam, iltifatli,
    iltifatParfumler: iltifatli.map(id => byId.get(id)!),
    tespitler: [],
  };
  model.tespitler = tespitler(model, aileKanit, baglamSay, g);
  return model;
}

const saatMetni = (sapma: number) => {
  // 1 puanlık kalıcılık farkı ≈ 2 saat (ölçek: <2 / 2–4 / 4–6 / 6–8 / 8+ saat)
  const saat = Math.round(Math.abs(sapma) * 4 * 2);
  return saat >= 1 ? `yaklaşık ${saat} saat` : 'biraz';
};

function tespitler(m: KisiselModel, aileKanit: Partial<Record<KokuTipi, number>>, baglamSay: Partial<Record<Etkinlik, number>>, g: OgrenmeGirdisi): Tespit[] {
  const out: Tespit[] = [];
  (Object.keys(m.kalicilik) as KokuTipi[]).forEach(a => {
    const k = m.kalicilik[a]!;
    if (Math.abs(k.sapma) < 0.1) return;
    out.push({
      id: `kalicilik:${a}`, tur: 'kalicilik', kanit: k.kayit, yon: k.sapma > 0 ? 1 : -1,
      metin: `${a} parfümler teninizde tahminimizden ${saatMetni(k.sapma)} ${k.sapma > 0 ? 'uzun' : 'kısa'} kalıyor.`,
    });
  });
  if (m.genelKalicilik && Math.abs(m.genelKalicilik.sapma) >= 0.1) {
    out.push({
      id: 'kalicilik:genel', tur: 'kalicilik', kanit: m.genelKalicilik.kayit, yon: m.genelKalicilik.sapma > 0 ? 1 : -1,
      metin: m.genelKalicilik.sapma > 0 ? 'Teniniz parfümü genel olarak tahminimizden iyi tutuyor.' : 'Teniniz parfümü genel olarak tahminimizden çabuk tüketiyor; kalıcı alt notalar size daha uygun.',
    });
  }
  (Object.keys(m.aileEgilim) as KokuTipi[])
    .filter(a => Math.abs(m.aileEgilim[a]!) >= 0.35 && (aileKanit[a] ?? 0) >= TESPIT_MIN)
    .sort((a, b) => Math.abs(m.aileEgilim[b]!) - Math.abs(m.aileEgilim[a]!))
    .slice(0, 4)
    .forEach(a => {
      const v = m.aileEgilim[a]!;
      out.push({ id: `aile:${a}`, tur: 'aile', kanit: Math.round(aileKanit[a] ?? 0), yon: v > 0 ? 1 : -1, metin: v > 0 ? `${a} ailesine yatkınsınız.` : `${a} ailesinden uzak duruyorsunuz.` });
    });
  (Object.keys(m.baglam) as Etkinlik[]).forEach(e => {
    const b = m.baglam[e]!;
    const [enIyi, pay] = (Object.entries(b) as [KokuTipi, number][]).sort((x, y) => y[1] - x[1])[0] ?? [];
    if (!enIyi || (pay ?? 0) < 0.5) return;
    out.push({ id: `baglam:${e}:${enIyi}`, tur: 'baglam', kanit: baglamSay[e] ?? 0, yon: 1, metin: `${BAGLAM_AD[e]} günlerinde çoğunlukla ${enIyi.toLocaleLowerCase('tr')} seçiyorsunuz.` });
  });
  const byId = new Map(g.katalog.map(p => [p.id, p]));
  m.iltifatli.slice(0, 2).forEach(id => {
    const p = byId.get(id)!;
    const n = g.degerlendirmeler.filter(d => d.parfumId === id && (d.compliment || d.personalRating >= 8)).length;
    out.push({ id: `iltifat:${id}`, tur: 'iltifat', kanit: n, yon: 1, metin: `${p.isim} sizde iyi sonuç veriyor (iltifat ya da yüksek puan). Benzerlerini öne alıyoruz.` });
  });
  return out.sort((a, b) => b.kanit - a.kanit);
}

export interface OgrenmeEtkisi {
  delta: number;
  /** Kullanıcıya gösterilecek gerekçe (varsa) */
  gerekce?: string;
  /** Gerekçe ten kaynaklı mı (sıralamada önce gelir) */
  ten?: boolean;
  uyari?: string;
}

/** Öğrenilen modelin bir parfüme etkisi. Model yoksa ya da güven çok düşükse 0. */
export function ogrenmeDuzeltmesi(p: Parfum, m: KisiselModel | undefined, etkinlik?: Etkinlik): OgrenmeEtkisi {
  if (!m || m.sinyalSayisi === 0) return { delta: 0 };
  const parcalar: { puan: number; metin?: string; ten?: boolean; uyari?: string }[] = [];

  // 1) Zevk: aile + nota yatkınlığı (±9), güvenle ölçeklenir
  const aile = (m.aileEgilim[p.tip] ?? 0) + 0.5 * (p.ikincilTip ? m.aileEgilim[p.ikincilTip] ?? 0 : 0);
  const notalar = notalarOf(p).map(n => m.notaEgilim[n]).filter((x): x is number => x !== undefined);
  const nota = notalar.length ? notalar.reduce((s, x) => s + x, 0) / notalar.length : 0;
  const zevkPuan = m.guven * (6 * Math.max(-1, Math.min(1, aile)) + 3 * nota);
  parcalar.push({ puan: zevkPuan, metin: zevkPuan >= 2.5 ? `Seçimlerinize göre ${p.tip.toLocaleLowerCase('tr')} ailesine yatkınsınız; bu parfüm o çizgide.` : undefined });

  // 2) Ten kalibrasyonu (±5): aileye özgü sapma, yoksa genel sapmanın yarısı
  const k = m.kalicilik[p.tip];
  const sapma = k ? k.sapma : m.genelKalicilik ? m.genelKalicilik.sapma * 0.5 : 0;
  const tenPuan = 5 * Math.max(-1, Math.min(1, sapma * 2));
  if (tenPuan >= 1.5 && k) parcalar.push({ puan: tenPuan, ten: true, metin: `Kayıtlarınıza göre ${p.tip.toLocaleLowerCase('tr')} parfümler teninizde tahmin edilenden uzun kalıyor.` });
  else if (tenPuan <= -1.5 && k) parcalar.push({ puan: tenPuan, uyari: `Kayıtlarınıza göre ${p.tip.toLocaleLowerCase('tr')} parfümler teninizde kısa kalıyor.` });
  else parcalar.push({ puan: tenPuan });

  // 3) Bağlam (±3)
  if (etkinlik && m.baglam[etkinlik]) {
    const pay = m.baglam[etkinlik]![p.tip] ?? 0;
    parcalar.push({ puan: 3 * (pay * 2 - 0.5), metin: pay >= 0.5 ? `${BAGLAM_AD[etkinlik]} günlerinde genellikle bu aileyi seçiyorsunuz.` : undefined });
  }

  // 4) İltifat aldığınız parfümlere benzerlik (+3)
  const iltifat = m.iltifatParfumler.filter(q => q.id !== p.id);
  if (iltifat.length) {
    let enIyi = 0;
    let isim = '';
    for (const q of iltifat) {
      const s = benzerlik(p, q).skor;
      if (s > enIyi) { enIyi = s; isim = q.isim; }
    }
    if (enIyi >= 0.45) parcalar.push({ puan: 3 * Math.min(1, (enIyi - 0.45) / 0.35 + 0.4), metin: `İltifat aldığınız ${isim} ile benzer karakterde.` });
  }

  const ham = parcalar.reduce((s, x) => s + x.puan, 0);
  const delta = Math.max(-OGRENME_MAX, Math.min(OGRENME_MAX, ham));
  const enGuclu = parcalar.filter(x => x.metin && x.puan > 0).sort((a, b) => b.puan - a.puan)[0];
  const uyari = parcalar.find(x => x.uyari)?.uyari;
  return { delta: Math.round(delta * 10) / 10, gerekce: enGuclu?.metin, ten: enGuclu?.ten, uyari };
}
