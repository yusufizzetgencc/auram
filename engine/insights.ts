/**
 * Koku hafızası, aylık rapor ve zevk netliği — saf fonksiyonlar.
 * Girdi: günün kokusu kayıtları (SOTD), akşam değerlendirmeleri (PerformanceLog), dolap ve katalog.
 * Çıktı yalnızca veri; metinleştirme ekranda yapılır. Yeterli veri yoksa ilgili alan null döner
 * (uydurma istatistik gösterilmez).
 */
import { PerformanceLog, Parfum, UserPreferences, WardrobeItem } from '../types';
import { dayDiff } from '../utils/date';
import { mevsimOf } from './daily';

export interface Kullanim { parfumId: string; date: string }

export interface ParfumSayi { parfum: Parfum; deger: number }

export interface KokuHafizasi {
  toplamGun: number;
  farkliParfum: number;
  enCok: ParfumSayi[];                      // gün sayısına göre ilk 3
  mevsimeGore: Record<'İlkbahar' | 'Yaz' | 'Sonbahar' | 'Kış', ParfumSayi | null>;
  enUzunKalan: ParfumSayi | null;           // ortalama kalıcılık puanı (1–5), en az 2 değerlendirme
  iltifatSampiyonu: ParfumSayi | null;      // iltifat oranı (0–1), en az 2 değerlendirme
  aileDagilimi: { aile: string; yuzde: number }[];
  /** "Odunsu notalar sizde ortalama 4.3/5 kalıyor" — en az 3 değerlendirmesi olan en iyi aile */
  tenTespiti: { aile: string; ortalama: number; adet: number } | null;
  /** Dolapta olup 30+ gündür (veya hiç) sıkılmayanlar */
  unutulanlar: { parfum: Parfum; gun: number | null }[];
}

const MEVSIMLER = ['İlkbahar', 'Yaz', 'Sonbahar', 'Kış'] as const;

const dateOf = (key: string) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); };

function enCokKullanilan(kayitlar: Kullanim[], byId: Map<string, Parfum>, n: number): ParfumSayi[] {
  const sayac = new Map<string, number>();
  kayitlar.forEach(k => sayac.set(k.parfumId, (sayac.get(k.parfumId) ?? 0) + 1));
  return [...sayac.entries()]
    .filter(([id]) => byId.has(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, c]) => ({ parfum: byId.get(id)!, deger: c }));
}

export function kokuHafizasi(
  kayitlar: Kullanim[],
  loglar: PerformanceLog[],
  katalog: Parfum[],
  dolap: WardrobeItem[] = [],
  bugun?: string,
): KokuHafizasi {
  const byId = new Map(katalog.map(p => [p.id, p]));
  const gecerli = kayitlar.filter(k => byId.has(k.parfumId));

  const mevsimeGore = Object.fromEntries(
    MEVSIMLER.map(m => [m, enCokKullanilan(gecerli.filter(k => mevsimOf(dateOf(k.date)) === m), byId, 1)[0] ?? null]),
  ) as KokuHafizasi['mevsimeGore'];

  // Değerlendirmeler: parfüm başına ortalama kalıcılık ve iltifat oranı
  const grup = new Map<string, PerformanceLog[]>();
  loglar.filter(l => byId.has(l.parfumId)).forEach(l => grup.set(l.parfumId, [...(grup.get(l.parfumId) ?? []), l]));
  let enUzunKalan: ParfumSayi | null = null;
  let iltifatSampiyonu: ParfumSayi | null = null;
  grup.forEach((ls, id) => {
    if (ls.length < 2) return;
    const ort = ls.reduce((s, l) => s + l.longevity, 0) / ls.length;
    const oran = ls.filter(l => l.compliment).length / ls.length;
    if (!enUzunKalan || ort > enUzunKalan.deger) enUzunKalan = { parfum: byId.get(id)!, deger: Math.round(ort * 10) / 10 };
    if (oran > 0 && (!iltifatSampiyonu || oran > iltifatSampiyonu.deger)) iltifatSampiyonu = { parfum: byId.get(id)!, deger: Math.round(oran * 100) / 100 };
  });

  // Aile dağılımı (kullanım günlerine göre, ana aile)
  const aileSay = new Map<string, number>();
  gecerli.forEach(k => { const t = byId.get(k.parfumId)!.tip; aileSay.set(t, (aileSay.get(t) ?? 0) + 1); });
  const aileDagilimi = [...aileSay.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([aile, c]) => ({ aile, yuzde: Math.round((c / Math.max(1, gecerli.length)) * 100) }));

  // Ten tespiti: aile bazında kalıcılık
  const aileLog = new Map<string, number[]>();
  loglar.filter(l => byId.has(l.parfumId)).forEach(l => {
    const t = byId.get(l.parfumId)!.tip;
    aileLog.set(t, [...(aileLog.get(t) ?? []), l.longevity]);
  });
  let tenTespiti: KokuHafizasi['tenTespiti'] = null;
  aileLog.forEach((v, aile) => {
    if (v.length < 3) return;
    const ort = Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10;
    if (!tenTespiti || ort > tenTespiti.ortalama) tenTespiti = { aile, ortalama: ort, adet: v.length };
  });

  // Unutulanlar
  const unutulanlar: KokuHafizasi['unutulanlar'] = [];
  if (bugun) {
    dolap.forEach(item => {
      const p = byId.get(item.parfumId);
      if (!p) return;
      const son = gecerli.filter(k => k.parfumId === item.parfumId).map(k => dayDiff(k.date, bugun)).filter(d => d >= 0).sort((a, b) => a - b)[0];
      const gun = son === undefined ? null : son;
      const eklenmeGun = dayDiff(item.addedAt.slice(0, 10), bugun);
      if ((gun === null && eklenmeGun >= 14) || (gun !== null && gun >= 30)) unutulanlar.push({ parfum: p, gun });
    });
    unutulanlar.sort((a, b) => (b.gun ?? 9999) - (a.gun ?? 9999));
  }

  return {
    toplamGun: gecerli.length,
    farkliParfum: new Set(gecerli.map(k => k.parfumId)).size,
    enCok: enCokKullanilan(gecerli, byId, 3),
    mevsimeGore,
    enUzunKalan,
    iltifatSampiyonu,
    aileDagilimi,
    tenTespiti,
    unutulanlar,
  };
}

export interface AylikRapor extends KokuHafizasi {
  yil: number;
  ay: number; // 1–12
  /** Önceki aya göre kayıtlı gün farkı (önceki ay hiç kayıt yoksa null) */
  oncekiAyFarki: number | null;
  /** Ortalama kalıcılık (1–5) ve iltifat sayısı — o ayın değerlendirmelerinden */
  ortalamaKalicilik: number | null;
  iltifatSayisi: number;
  /** En çok parfüm sıkılan haftanın günü (0=pazartesi) */
  enAktifGun: number | null;
}

export const AY_ADLARI = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const GUN_ADLARI = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

const ayaAit = (key: string, yil: number, ay: number) => key.startsWith(`${yil}-${String(ay).padStart(2, '0')}`);

export function aylikRapor(yil: number, ay: number, kayitlar: Kullanim[], loglar: PerformanceLog[], katalog: Parfum[]): AylikRapor {
  const buAy = kayitlar.filter(k => ayaAit(k.date, yil, ay));
  const ayLog = loglar.filter(l => ayaAit(l.date, yil, ay));
  const temel = kokuHafizasi(buAy, ayLog, katalog);
  const oncekiYil = ay === 1 ? yil - 1 : yil;
  const oncekiAy = ay === 1 ? 12 : ay - 1;
  const onceki = kayitlar.filter(k => ayaAit(k.date, oncekiYil, oncekiAy)).length;

  const gunSay = [0, 0, 0, 0, 0, 0, 0];
  buAy.forEach(k => { gunSay[(dateOf(k.date).getDay() + 6) % 7] += 1; });
  const max = Math.max(...gunSay);

  return {
    ...temel,
    yil,
    ay,
    oncekiAyFarki: onceki ? temel.toplamGun - onceki : null,
    ortalamaKalicilik: ayLog.length ? Math.round((ayLog.reduce((s, l) => s + l.longevity, 0) / ayLog.length) * 10) / 10 : null,
    iltifatSayisi: ayLog.filter(l => l.compliment).length,
    enAktifGun: max > 0 ? gunSay.indexOf(max) : null,
  };
}

/**
 * Zevk netliği (0–100): uygulamanın sizi ne kadar tanıdığı.
 *   %50 profil soruları · %30 sevdim/sevmedim geri bildirimi (10 parfümde dolar) · %20 akşam değerlendirmesi (10 kayıtta dolar)
 */
export function zevkNetligi(p: UserPreferences, logSayisi: number): { yuzde: number; sonrakiAdim: string | null } {
  const temel: unknown[] = [p.ciltTipi, p.vucutIsisi, p.terlemeOrani, p.parfumReaksiyonu, p.aura, p.kokuTipleri?.length ? 1 : null, p.mevsim, p.cinsiyetAlgisi, p.konsantrasyonTercihi, p.ortam];
  const profil = temel.filter(v => v !== null && v !== undefined && v !== '').length / temel.length;
  const geri = Math.min(1, ((p.sevilenParfumler?.length ?? 0) + (p.sevilmeyenParfumler?.length ?? 0)) / 10);
  const log = Math.min(1, logSayisi / 10);
  const yuzde = Math.round(100 * (0.5 * profil + 0.3 * geri + 0.2 * log));
  let sonrakiAdim: string | null = null;
  if (profil < 1) sonrakiAdim = 'Profil sorularını tamamlayın.';
  else if (geri < 1) sonrakiAdim = 'Denediğiniz parfümlere “Sevdim / Sevmedim” deyin.';
  else if (log < 1) sonrakiAdim = 'Akşamları parfümünüzün teninizde ne kadar kaldığını kaydedin.';
  return { yuzde, sonrakiAdim };
}
