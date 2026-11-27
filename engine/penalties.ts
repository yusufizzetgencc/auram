/**
 * Kırmızı Çizgiler (Ceza Puanları)
 *
 * Kullanıcının "kesinlikle olmasın" dediği nota kategorileri. Ceza, notanın bulunduğu
 * katmana göre ölçeklenir (alt notalar tende saatlerce kalır → en ağır ceza).
 * Bir kırmızı çizgiye takılan parfüm, yeterli temiz alternatif varsa listeden tamamen çıkarılır.
 */

import { KokuAlmaHassasiyeti, Parfum } from '../types';
import { notaEslesir } from './perfume-chemistry';

export const DEALBREAKER_NOTALARI: Record<string, string[]> = {
  'Aşırı şekerli': ['vanilya', 'karamel', 'pralin', 'tonka', '=bal', '=balı', 'şeker', 'çikolata', 'marshmallow', 'beze', 'pamuk şeker'],
  'Baskın çiçek': ['gül', 'yasemin', 'sümbül', 'tuberoz', 'zambak', 'ylang', 'gardenya', 'portakal çiçeği'],
  'Deri veya tütün': ['deri', 'süet', 'tütün', 'isli', 'duman', 'huş', 'katran'],
  'Yoğun baharat': ['=biber', '=biberi', 'karabiber', 'pembe biber', 'tarçın', 'karanfil', 'kakule', 'kimyon', 'safran', 'muskat'],
  'Oud ve reçine': ['oud', 'ud ağacı', 'tütsü', 'mür', 'labdanum', 'benzoin', 'reçine', 'opoponaks'],
};

/** Katman başına ceza (puan) — bir kategori için en ağır katman sayılır */
export const DEALBREAKER_CEZASI = { ust: 20, orta: 28, alt: 35 } as const;
/** Ek her kategori için ilave ceza */
export const EK_KATEGORI_CEZASI = 10;
export const MAKS_DEALBREAKER_CEZASI = 50;

export const HASSASIYET_CEZASI: Partial<Record<KokuAlmaHassasiyeti, number>> = {
  cok_yuksek: 15,
  yuksek: 7,
};

export interface CezaSonucu {
  ceza: number;
  ihlalEdilenler: string[];
  /** Kırmızı çizgiye takıldı mı (öneri listesinden elenme sebebi) */
  kirmiziCizgi: boolean;
}

export const hesaplaDealbreakerCezasi = (parfum: Parfum, kacinilacak: string[]): CezaSonucu => {
  const ihlalEdilenler: string[] = [];
  let enAgir = 0;
  kacinilacak.forEach(kategori => {
    const anahtarlar = DEALBREAKER_NOTALARI[kategori];
    if (!anahtarlar) return;
    let kategoriCezasi = 0;
    (['ust', 'orta', 'alt'] as const).forEach(katman => {
      if ((parfum.notalar[katman] || []).some(n => notaEslesir(n, anahtarlar))) {
        kategoriCezasi = Math.max(kategoriCezasi, DEALBREAKER_CEZASI[katman]);
      }
    });
    if (kategoriCezasi > 0) {
      ihlalEdilenler.push(kategori);
      enAgir = Math.max(enAgir, kategoriCezasi);
    }
  });
  const ceza = ihlalEdilenler.length === 0
    ? 0
    : Math.min(MAKS_DEALBREAKER_CEZASI, enAgir + (ihlalEdilenler.length - 1) * EK_KATEGORI_CEZASI);
  return { ceza, ihlalEdilenler, kirmiziCizgi: ihlalEdilenler.length > 0 };
};

export const hesaplaHassasiyetCezasi = (parfum: Parfum, hassasiyet: KokuAlmaHassasiyeti | null | undefined): number => {
  if (!hassasiyet || parfum.yogunluk !== 'yogun') return 0;
  return HASSASIYET_CEZASI[hassasiyet] ?? 0;
};
