/**
 * Teninde Öneri Motoru — tüm saf fonksiyonların tek giriş noktası.
 *   ph-calculator.ts     Ten profili & pH eğilimi tahmini
 *   perfume-chemistry.ts Nota yapısından ten uyumu / performans
 *   penalties.ts         Kırmızı çizgiler & hassasiyet cezaları
 *   scoring.ts           100 puanlık ağırlıklı skor + "neden" gerekçeleri
 *   similarity.ts        Parfüm benzerliği, "benzerleri" ve kişisel zevk düzeltmesi
 *   streak.ts            Seri ve seri koruma hakkı
 *   daily.ts             Günün seçimi (dolap + etkinlik + hava + çeşitlilik)
 *   insights.ts          Koku hafızası, aylık rapor, zevk netliği
 *   wardrobe.ts          Dolap analizi ve sıradaki alım
 *   advisor.ts           Koku Danışmanı (Türkçe soru → öneri)
 */
import { CiltTipi, TerlemeOrani, UserPreferences, YasGrubu } from '../types';

export * from './ph-calculator';
export * from './perfume-chemistry';
export * from './penalties';
export * from './scoring';
export * from './similarity';
export * from './streak';
export * from './daily';
export * from './insights';
export * from './wardrobe';
export * from './advisor';
export * from './friend';
export * from './learning';
export * from './context';

export const buildTemporaryProfile = (
  ciltTipi: CiltTipi | null,
  terlemeOrani: TerlemeOrani | null,
  yasGrubu: YasGrubu | null
): UserPreferences => ({
  phInfo: { biliyorMu: 'bilmiyorum', deger: null, tahminiDeger: null, aralik: 'normal' },
  ciltTipi,
  terlemeOrani,
  yasGrubu,
  gumusOksitlenme: null,
  suTuketimi: null,
  beslenmeAliskanligi: null,
  vucutIsisi: null,
  parfumReaksiyonu: null,
  uygulamaYeri: null,
  kokuAlmaHassasiyeti: null,
  aura: null,
  kokuTipleri: [],
  kacinilacakNotalar: [],
  cinsiyetAlgisi: null,
  ortam: null,
  kiyafetStili: null,
  kisilikTipi: null,
  deneyimSeviyesi: null,
  kullanimSikligi: null,
  butce: null,
  markaTercihi: null,
  konsantrasyonTercihi: null,
  yogunluk: null,
  izlenimHedefi: null,
  kullanimAmaci: [],
  gununSaati: null,
  cinsiyet: null,
  ciltHassasiyeti: null,
  alerjiDurumu: [],
  mevsim: null,
  iklim: null,
  aktivite: null,
  sevilenNotalar: [],
  sevilmeyenNotalar: [],
  kalicilikTercihi: null,
});
export * from './layering';
