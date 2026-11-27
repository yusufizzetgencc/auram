/**
 * Parfüm Kimyası — Parfümün nota yapısından ten uyumu ve performans tahmini.
 *
 * Parfüm başına elle uydurulmuş pH sayıları yerine, uyum NOTALARDAN türetilir:
 *  - Asidik eğilimli tende narenciye/ferah notalar canlı açılır, yoğun tatlılar keskinleşebilir.
 *  - Nötre yakın tende odunsu/amber/reçineli alt notalar dolgun ve sıcak kalır.
 *  - Yağlı ten tüm notaları (özellikle uçucu üst notaları) daha uzun tutar; kuru ten uçurur.
 */

import { trLower } from '../utils/text';
import { CiltTipi, NotaKalicilikMod, Parfum, ParfumPHSkor } from '../types';
import { getPHEgilimi } from './ph-calculator';

export type NotaGrubu = 'narenciye' | 'tatli' | 'odunsuAmber' | 'cicek' | 'ferah' | 'baharat' | 'misk';

/**
 * Anahtarlar kelime BAŞI ile eşleşir (Türkçe ekler için: "vanilyası", "gülü").
 * '=' ile başlayan anahtar yalnızca TAM kelimeyle eşleşir ("=bal" → "balsam"ı yakalamaz).
 */
export const NOTA_GRUPLARI: Record<NotaGrubu, string[]> = {
  narenciye: ['bergamot', 'limon', 'portakal', 'mandalina', 'greyfurt', 'yuzu', 'misket limonu', 'turunç', 'neroli', 'petitgrain', 'narenciye', 'kan portakalı', 'ağaç kavunu', 'kişniş'],
  tatli: ['vanilya', 'karamel', 'pralin', 'tonka', '=bal', '=balı', 'şeker', 'çikolata', 'kakao', 'badem', 'marshmallow', 'beze', 'kestane', 'pamuk şeker', 'dulce'],
  odunsuAmber: ['sedir', 'sandal', 'vetiver', 'paçuli', 'amber', 'ambroksan', 'ambrette', 'oud', 'ud ağacı', 'reçine', 'tütsü', 'günlük', 'labdanum', 'benzoin', 'mür', 'guaiac', 'kaşmir ağacı', 'odunsu', 'meşe yosunu', 'huş', 'deri', 'tütün', 'iso e super', 'akigalawood', 'köknar', 'papirüs', 'stiraks', 'balsam', 'opoponaks'],
  cicek: ['gül', 'yasemin', 'sümbül', 'tuberoz', 'zambak', 'ylang', 'iris', 'menekşe', 'şakayık', 'manolya', 'frezya', 'portakal çiçeği', 'gardenya', 'leylak', 'lavanta', 'mimoza', 'orkide', 'nergis', 'heliotrop'],
  ferah: ['deniz', '=su', '=suyu', 'okyanus', 'yeşil', 'nane', 'salatalık', 'çay', 'yaprak', 'çimen', 'aldehit', 'ozon', 'tuz', 'adaçayı', 'biberiye', 'karpuz', 'armut', 'elma', 'incir', 'kavun', 'fesleğen', 'kekik', 'ardıç', 'mine çiçeği', 'bambu'],
  baharat: ['=biber', '=biberi', 'karabiber', 'pembe biber', 'tarçın', 'karanfil', 'kakule', 'zencefil', 'safran', 'muskat', 'kimyon', 'anason'],
  misk: ['=misk', '=miski', 'beyaz misk'],
};

const normalize = (s: string) => trLower(s).trim();

/** Bir notanın verilen anahtar listesinden biriyle eşleşip eşleşmediği (kelime başı eşleşmesi). */
export const notaEslesir = (nota: string, anahtarlar: string[]): boolean => {
  const n = normalize(nota);
  return anahtarlar.some(k => {
    const exact = k.startsWith('=');
    const key = normalize(exact ? k.slice(1) : k);
    if (n === key) return true;
    if (key.includes(' ')) return n.includes(key);
    const tokens = n.split(/[\s-]+/);
    return exact ? tokens.includes(key) : tokens.some(token => token.startsWith(key));
  });
};

export interface NotaProfili {
  narenciye: number; tatli: number; odunsuAmber: number; cicek: number; ferah: number; baharat: number; misk: number;
  /** Alt notaların toplam kompozisyondaki ağırlığı (0-1) */
  altAgirlik: number;
}

/** Katman ağırlıkları: alt notalar tende en uzun kalan, en belirleyici katmandır. */
const KATMAN_AGIRLIK = { ust: 0.6, orta: 0.8, alt: 1.0 };

export const hesaplaNotaProfili = (parfum: Pick<Parfum, 'notalar'>): NotaProfili => {
  const sonuc: NotaProfili = { narenciye: 0, tatli: 0, odunsuAmber: 0, cicek: 0, ferah: 0, baharat: 0, misk: 0, altAgirlik: 0 };
  let toplam = 0;
  let altToplam = 0;
  (['ust', 'orta', 'alt'] as const).forEach(katman => {
    (parfum.notalar[katman] || []).forEach(nota => {
      const w = KATMAN_AGIRLIK[katman];
      toplam += w;
      if (katman === 'alt') altToplam += w;
      (Object.keys(NOTA_GRUPLARI) as NotaGrubu[]).forEach(g => {
        if (notaEslesir(nota, NOTA_GRUPLARI[g])) sonuc[g] += w;
      });
    });
  });
  if (toplam === 0) return sonuc;
  (Object.keys(NOTA_GRUPLARI) as NotaGrubu[]).forEach(g => { sonuc[g] = Math.min(1, sonuc[g] / toplam); });
  sonuc.altAgirlik = altToplam / toplam;
  return sonuc;
};

/** Notalardan, parfümün en iyi açıldığı pH noktası (veri setine yazılan phUyumu.idealPH ile aynı formül). */
export const hesaplaIdealPH = (np: NotaProfili): number => {
  const v = 5.0 + 0.5 * np.odunsuAmber + 0.4 * np.tatli - 0.8 * np.narenciye - 0.3 * np.ferah;
  return Math.round(Math.max(4.5, Math.min(5.6, v)) * 100) / 100;
};

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

// Saf (Pure) Parfüm Ten Uyum Skoru
export const hesaplaParfumPHSkoruPure = (parfum: Parfum, userPH: number, ciltTipi: CiltTipi | null): ParfumPHSkor => {
  const np = hesaplaNotaProfili(parfum);
  const idealPH = parfum.phUyumu?.idealPH ?? hesaplaIdealPH(np);

  // Sürekli (sıçramasız) uyum eğrisi: ±0.1 tolerans, sonra her 0.1 pH için -6 puan
  const fark = Math.max(0, Math.abs(userPH - idealPH) - 0.1);
  const phUyumSkoru = Math.round(clamp(100 - fark * 60, 30, 100));

  const egilim = getPHEgilimi(userPH); // -1 asidik … +1 nötre yakın
  const isKuru = ciltTipi === 'kuru';
  const isYagli = ciltTipi === 'yagli';
  const yagEtkisi = isYagli ? 1 : isKuru ? -1 : ciltTipi === 'karma' ? 0.1 : 0;

  // Üst notalar en uçucu katman: kuru tende en çok bunlar kaybolur
  let ust = 65 + yagEtkisi * 15 + (-egilim) * 15 * np.narenciye;
  // Orta notalar
  let orta = 68 + yagEtkisi * 10 + egilim * 8 * np.cicek;
  // Alt notalar: odunsu/amber nötre yakın tende, tatlılar asidik tende risk taşır
  let alt = 70 + yagEtkisi * 8 + egilim * 15 * np.odunsuAmber - Math.max(0, -egilim) * 20 * np.tatli;

  const kalicilikBonus = parfum.kalicilik === 'uzun' ? 8 : parfum.kalicilik === 'kisa' ? -8 : 0;
  ust = clamp(ust); orta = clamp(orta + kalicilikBonus / 2); alt = clamp(alt + kalicilikBonus);

  const toplamPerformans = Math.round(ust * 0.2 + orta * 0.3 + alt * 0.5);

  let kalicilikModifikasyonu = 0;
  if (isKuru) kalicilikModifikasyonu = -0.2;
  else if (isYagli) kalicilikModifikasyonu = 0.3;

  let aciklama: string;
  if (egilim < -0.35 && np.narenciye >= 0.15) {
    aciklama = 'Narenciye notaları asidik eğilimli teninizde parlak ve canlı açılır';
  } else if (egilim < -0.35 && np.tatli >= 0.2) {
    aciklama = 'Tatlı alt notalar asidik eğilimli teninizde zamanla keskinleşebilir';
  } else if (egilim > 0.35 && np.odunsuAmber >= 0.2) {
    aciklama = 'Odunsu ve amber alt notalar teninizde sıcak ve dolgun kalır';
  } else if (phUyumSkoru >= 85) {
    aciklama = 'Ten kimyanızla dengeli, şişedeki karakterine yakın açılır';
  } else if (phUyumSkoru >= 60) {
    aciklama = 'Teninizle iyi uyum; bazı notalar farklı vurgulanabilir';
  } else {
    aciklama = 'Teninizde karakteri belirgin şekilde değişebilir, önce deneyin';
  }

  return {
    phUyumSkoru,
    kalicilikModifikasyonu,
    ustNotaPerformansi: Math.round(ust),
    ortaNotaPerformansi: Math.round(orta),
    altNotaPerformansi: Math.round(alt),
    toplamPerformans,
    aciklama,
  };
};

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Ham katalog kaydını, notalardan türetilen ten uyumu alanlarıyla zenginleştirir.
 * (data/parfumler.json'a elle pH sayısı yazılmaz — tek kaynak bu fonksiyondur.)
 */
export const zenginlestirParfum = (raw: Omit<Parfum, 'phUyumu' | 'notaKalicilik'> & Partial<Pick<Parfum, 'phUyumu' | 'notaKalicilik'>>): Parfum => {
  const np = hesaplaNotaProfili(raw);
  const idealPH = hesaplaIdealPH(np);
  const mod = (ucuculuk: number): NotaKalicilikMod => ({
    asidikCilt: r1(0.3 * np.narenciye - 0.4 * np.tatli),
    bazikCilt: r1(0.3 * np.odunsuAmber - 0.1 * np.narenciye),
    kuruCilt: r1(-0.3 * ucuculuk),
    yagliCilt: r1(0.3 * ucuculuk),
  });
  return {
    ...raw,
    phUyumu: {
      idealPH,
      minPH: Math.round((idealPH - 0.35) * 100) / 100,
      maxPH: Math.round((idealPH + 0.35) * 100) / 100,
      asidikEtki: np.narenciye >= 0.15
        ? 'Narenciye açılışı daha parlak ve canlı hissedilir'
        : np.tatli >= 0.2 ? 'Tatlı alt notalar zamanla keskinleşebilir' : 'Karakteri büyük ölçüde korunur',
      bazikEtki: np.odunsuAmber >= 0.2
        ? 'Odunsu ve amber alt notalar daha sıcak ve dolgun kalır'
        : 'Üst notalar biraz daha hızlı yumuşar',
    },
    notaKalicilik: { ust: mod(1), orta: mod(0.6), alt: mod(0.3) },
  };
};
