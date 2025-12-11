/**
 * AROMIXEN - Kişisel Parfüm Öneri Uygulaması
 * Type Tanımlamaları
 */

// Koku Tipleri
export type KokuTipi = 'Çiçeksi' | 'Odunsu' | 'Ferah' | 'Amber' | 'Baharatlı' | 'Meyvemsi' | 'Tatlı' | 'Yeşil';

// Mevsimler
export type Mevsim = 'İlkbahar' | 'Yaz' | 'Sonbahar' | 'Kış' | 'Tüm Mevsimler';

// Cinsiyet
export type Cinsiyet = 'erkek' | 'kadın' | 'unisex';

// Cilt Tipi
export type CiltTipi = 'normal' | 'kuru' | 'yagli';

// Terleme Oranı
export type TerlemeOrani = 'az' | 'normal' | 'cok';

// Cilt Hassasiyeti
export type CiltHassasiyeti = 'hassas' | 'normal' | 'dayanikli';

// Koku Yoğunluğu
export type KokuYogunlugu = 'hafif' | 'orta' | 'yogun';

// Kullanım Amacı
export type KullanimAmaci = 'gunluk' | 'is' | 'aksam' | 'ozel';

// İklim
export type Iklim = 'sicak' | 'soguk' | 'nemli' | 'kuru';

// Ortam
export type Ortam = 'kapali' | 'acik' | 'her_ikisi';

// Kıyafet Stili
export type KiyafetStili = 'casual' | 'formal' | 'sportif' | 'trendy' | 'gece';

// Aktivite Yoğunluğu
export type AktiviteYogunlugu = 'spor' | 'ofis' | 'ev' | 'sosyal';

// Kalıcılık Tercihi
export type KalicilikTercihi = 'kisa' | 'orta' | 'uzun';

// pH Bilgi Durumu
export type PHBilgiDurumu = 'biliyorum' | 'bilmiyorum';

// pH Aralığı Tipi
export type PHAraligi = 'asidik' | 'normal' | 'bazik';
// asidik: 4.0-5.0, normal: 5.0-6.0, bazik: 6.0-7.0

// Parfüm pH Uyumluluğu
export interface ParfumPHUyumu {
  minPH: number;      // Minimum uyumlu pH
  maxPH: number;      // Maximum uyumlu pH
  idealPH: number;    // İdeal pH değeri
  asidikEtki: string; // Asidik ciltte nasıl kokar
  bazikEtki: string;  // Bazik ciltte nasıl kokar
}

// Parfüm Nota Kalıcılık Modifikasyonu
export interface NotaKalicilikMod {
  asidikCilt: number;   // -1 ile +1 arası (asidik ciltte kalıcılık değişimi)
  bazikCilt: number;    // -1 ile +1 arası (bazik ciltte kalıcılık değişimi)
  kuruCilt: number;     // -1 ile +1 arası
  yagliCilt: number;    // -1 ile +1 arası
}

// Parfüm Modeli - Güncellenmiş
export interface Parfum {
  id: string;
  isim: string;
  marka?: string;
  notalar: {
    ust: string[];
    orta: string[];
    alt: string[];
  };
  tip: KokuTipi;
  ikincilTip?: KokuTipi;
  mevsim: Mevsim[];
  cinsiyet: Cinsiyet;
  yogunluk: KokuYogunlugu;
  kalicilik: KalicilikTercihi;
  kullanimAmaci: KullanimAmaci[];
  iklim: Iklim[];
  ortam: Ortam;
  aktivite: AktiviteYogunlugu[];
  kiyafetStili: KiyafetStili[];
  aciklama: string;
  puan?: number;
  etiketler: string[];
  // pH Özellikleri
  phUyumu: ParfumPHUyumu;
  notaKalicilik: {
    ust: NotaKalicilikMod;
    orta: NotaKalicilikMod;
    alt: NotaKalicilikMod;
  };
}

// Koku Tipi Item
export interface KokuTipiItem {
  id: string;
  isim: string;
  icon: string;
  color: string;
  aciklama: string;
}

// Mevsim Item
export interface MevsimItem {
  id: string;
  isim: string;
  icon: string;
  color: string;
}

// Cilt Tipi Item
export interface CiltTipiItem {
  id: string;
  isim: string;
  icon: string;
  aciklama: string;
}

// Kıyafet Stili Item
export interface KiyafetStiliItem {
  id: string;
  isim: string;
  icon: string;
  aciklama: string;
}

// Kullanıcı pH Bilgileri
export interface UserPHInfo {
  biliyorMu: PHBilgiDurumu;
  deger: number | null;        // Kullanıcının bildiği pH değeri
  tahminiDeger: number | null; // Hesaplanan tahmini pH
  aralik: PHAraligi | null;    // pH aralığı kategorisi
}

// Kullanıcı Tercihleri - Genişletilmiş
export interface UserPreferences {
  // pH Bilgileri
  phInfo: UserPHInfo;
  
  // 1️⃣ Kişisel Tercihler
  kokuTipleri: KokuTipi[]; // Çoklu seçim
  yogunluk: KokuYogunlugu | null;
  kullanimAmaci: KullanimAmaci | null;
  cinsiyet: Cinsiyet | null;
  
  // 2️⃣ Kişisel Fiziksel Özellikler
  ciltTipi: CiltTipi | null;
  ciltHassasiyeti: CiltHassasiyeti | null;
  terlemeOrani: TerlemeOrani | null;
  
  // 3️⃣ Hava ve Mekan Durumu
  mevsim: Mevsim | null;
  iklim: Iklim | null;
  ortam: Ortam | null;
  
  // 4️⃣ Yaşam Tarzı ve Kıyafet
  kiyafetStili: KiyafetStili | null;
  aktivite: AktiviteYogunlugu | null;
  
  // 5️⃣ Koku Alışkanlıkları
  sevilenNotalar: string[];
  sevilmeyenNotalar: string[];
  kalicilikTercihi: KalicilikTercihi | null;
}

// pH Hesaplama Sonucu
export interface PHHesapSonucu {
  tahminiPH: number;
  aralik: PHAraligi;
  guvenilirlik: number; // 0-100 arası
  aciklama: string;
  faktorler: {
    ciltTipiEtkisi: number;
    terlemeEtkisi: number;
    hassasiyetEtkisi: number;
  };
}

// Parfüm pH Skor Sonucu
export interface ParfumPHSkor {
  phUyumSkoru: number;        // 0-100 arası
  kalicilikModifikasyonu: number; // -1 ile +1 arası
  ustNotaPerformansi: number;  // 0-100 arası
  ortaNotaPerformansi: number;
  altNotaPerformansi: number;
  toplamPerformans: number;    // 0-100 arası
  aciklama: string;
}

// Onboarding Adımı
export interface OnboardingStep {
  id: string;
  kategori: string;
  title: string;
  subtitle: string;
  type: 'single' | 'multiple' | 'multi-select-notes' | 'ph-input' | 'slider';
  field: keyof UserPreferences | 'phDeger';
  options?: {
    id: string;
    title: string;
    subtitle?: string;
    icon?: string;
    color?: string;
  }[];
  noteOptions?: string[];
  sliderConfig?: {
    min: number;
    max: number;
    step: number;
    unit: string;
  };
}

// Öneri Sonucu - Güncellenmiş
export interface RecommendationResult {
  parfum: Parfum;
  score: number;
  maxScore: number;
  matchPercentage: number;
  matchReasons: string[];
  uyumKategorileri: {
    kategori: string;
    uyum: boolean;
    detay: string;
  }[];
  // pH Bazlı Skorlar
  phSkor: ParfumPHSkor;
}

export type ColorScheme = 'light' | 'dark';
