/**
 * AROMIXEN - Lüks Parfüm Öneri Uygulaması
 * Type Tanımlamaları - Genişletilmiş
 */

// Koku Tipleri - Genişletilmiş
export type KokuTipi = 'Çiçeksi' | 'Odunsu' | 'Ferah' | 'Amber' | 'Baharatlı' | 'Meyvemsi' | 'Tatlı' | 'Yeşil' | 'Oryantal' | 'Aquatik' | 'Deri' | 'Pudralı';

// Mevsimler
export type Mevsim = 'İlkbahar' | 'Yaz' | 'Sonbahar' | 'Kış' | 'Tüm Mevsimler';

// Cinsiyet
export type Cinsiyet = 'erkek' | 'kadın' | 'unisex';

// Cilt Tipi
export type CiltTipi = 'normal' | 'kuru' | 'yagli' | 'karma';

// Terleme Oranı
export type TerlemeOrani = 'az' | 'normal' | 'cok';

// Cilt Hassasiyeti
export type CiltHassasiyeti = 'hassas' | 'normal' | 'dayanikli';

// Koku Yoğunluğu
export type KokuYogunlugu = 'hafif' | 'orta' | 'yogun';

// Kullanım Amacı
export type KullanimAmaci = 'gunluk' | 'is' | 'aksam' | 'ozel' | 'romantik' | 'spor';

// İklim
export type Iklim = 'sicak' | 'soguk' | 'nemli' | 'kuru' | 'iliman';

// Ortam
export type Ortam = 'kapali' | 'acik' | 'her_ikisi';

// Kıyafet Stili
export type KiyafetStili = 'casual' | 'formal' | 'sportif' | 'trendy' | 'gece' | 'bohem' | 'minimalist';

// Aktivite Yoğunluğu
export type AktiviteYogunlugu = 'spor' | 'ofis' | 'ev' | 'sosyal' | 'seyahat';

// Kalıcılık Tercihi
export type KalicilikTercihi = 'kisa' | 'orta' | 'uzun';

// pH Bilgi Durumu
export type PHBilgiDurumu = 'biliyorum' | 'bilmiyorum';

// pH Aralığı Tipi
export type PHAraligi = 'asidik' | 'normal' | 'bazik';

// ========== YENİ TİPLER ==========

// Yaş Grubu
export type YasGrubu = '18-24' | '25-34' | '35-44' | '45-54' | '55+';

// Bütçe Aralığı
export type Butce = 'ekonomik' | 'orta' | 'premium' | 'luks';

// Parfüm Deneyim Seviyesi
export type DeneyimSeviyesi = 'yeni_baslayan' | 'orta' | 'uzman' | 'koleksiyoner';

// Günün Saati
export type GununSaati = 'sabah' | 'oglen' | 'aksam' | 'gece' | 'tum_gun';

// Koku Alma Hassasiyeti
export type KokuAlmaHassasiyeti = 'dusuk' | 'normal' | 'yuksek' | 'cok_yuksek';

// Alerji/Hassasiyet Durumu
export type AlerjiDurumu = 'yok' | 'alkol' | 'cicek' | 'baharat' | 'diger';

// Parfüm Konsantrasyonu Tercihi
export type KonsantrasyonTercihi = 'eau_fraiche' | 'eau_de_cologne' | 'eau_de_toilette' | 'eau_de_parfum' | 'parfum';

// Kişilik Tipi
export type KisilikTipi = 'romantik' | 'dinamik' | 'sofistike' | 'dogal' | 'cesur' | 'mistik';

// Parfüm Kullanım Sıklığı
export type KullanimSikligi = 'nadir' | 'haftada_1_2' | 'gunluk' | 'gunde_birden_fazla';

// İzlenim Hedefi
export type IzlenimHedefi = 'cekici' | 'profesyonel' | 'taze' | 'gizemli' | 'sicak' | 'enerjik';

// Marka Tercihi
export type MarkaTercihi = 'niche' | 'designer' | 'farketmez';

// Parfüm pH Uyumluluğu
export interface ParfumPHUyumu {
  minPH: number;
  maxPH: number;
  idealPH: number;
  asidikEtki: string;
  bazikEtki: string;
}

// Parfüm Nota Kalıcılık Modifikasyonu
export interface NotaKalicilikMod {
  asidikCilt: number;
  bazikCilt: number;
  kuruCilt: number;
  yagliCilt: number;
}

// Parfüm Modeli - Genişletilmiş
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
  fiyatAraligi?: Butce;
  konsantrasyon?: KonsantrasyonTercihi;
  kisilikTipi?: KisilikTipi[];
  izlenim?: IzlenimHedefi[];
  yasGrubu?: YasGrubu[];
  gununSaati?: GununSaati[];
  etiketler: string[];
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
  deger: number | null;
  tahminiDeger: number | null;
  aralik: PHAraligi | null;
}

// Kullanıcı Tercihleri - Kapsamlı Genişletilmiş
export interface UserPreferences {
  // pH Bilgileri
  phInfo: UserPHInfo;
  
  // 1️⃣ Kişisel Bilgiler (YENİ)
  yasGrubu: YasGrubu | null;
  kisilikTipi: KisilikTipi | null;
  
  // 2️⃣ Parfüm Deneyimi (YENİ)
  deneyimSeviyesi: DeneyimSeviyesi | null;
  kullanimSikligi: KullanimSikligi | null;
  
  // 3️⃣ Bütçe ve Marka (YENİ)
  butce: Butce | null;
  markaTercihi: MarkaTercihi | null;
  konsantrasyonTercihi: KonsantrasyonTercihi | null;
  
  // 4️⃣ Koku Tercihleri
  kokuTipleri: KokuTipi[];
  yogunluk: KokuYogunlugu | null;
  izlenimHedefi: IzlenimHedefi | null;
  
  // 5️⃣ Kullanım Detayları
  kullanimAmaci: KullanimAmaci | null;
  gununSaati: GununSaati | null;
  cinsiyet: Cinsiyet | null;
  
  // 6️⃣ Fiziksel Özellikler
  ciltTipi: CiltTipi | null;
  ciltHassasiyeti: CiltHassasiyeti | null;
  terlemeOrani: TerlemeOrani | null;
  kokuAlmaHassasiyeti: KokuAlmaHassasiyeti | null;
  alerjiDurumu: AlerjiDurumu[];
  
  // 7️⃣ Çevre Faktörleri
  mevsim: Mevsim | null;
  iklim: Iklim | null;
  ortam: Ortam | null;
  
  // 8️⃣ Yaşam Tarzı
  kiyafetStili: KiyafetStili | null;
  aktivite: AktiviteYogunlugu | null;
  
  // 9️⃣ Nota Tercihleri
  sevilenNotalar: string[];
  sevilmeyenNotalar: string[];
  kalicilikTercihi: KalicilikTercihi | null;
}

// pH Hesaplama Sonucu
export interface PHHesapSonucu {
  tahminiPH: number;
  aralik: PHAraligi;
  guvenilirlik: number;
  aciklama: string;
  faktorler: {
    ciltTipiEtkisi: number;
    terlemeEtkisi: number;
    hassasiyetEtkisi: number;
  };
}

// Parfüm pH Skor Sonucu
export interface ParfumPHSkor {
  phUyumSkoru: number;
  kalicilikModifikasyonu: number;
  ustNotaPerformansi: number;
  ortaNotaPerformansi: number;
  altNotaPerformansi: number;
  toplamPerformans: number;
  aciklama: string;
}

// Onboarding Adımı - Genişletilmiş
export interface OnboardingStep {
  id: string;
  kategori: string;
  title: string;
  subtitle: string;
  type: 'single' | 'multiple' | 'multi-select-notes' | 'ph-input' | 'slider' | 'multi-select';
  field: keyof UserPreferences | 'phDeger';
  options?: {
    id: string;
    title: string;
    subtitle?: string;
    icon?: string;
    color?: string;
    emoji?: string;
  }[];
  noteOptions?: string[];
  sliderConfig?: {
    min: number;
    max: number;
    step: number;
    unit: string;
  };
  required?: boolean;
  helpText?: string;
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
  phSkor: ParfumPHSkor;
}

export type ColorScheme = 'light' | 'dark';
