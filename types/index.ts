/**
 * AURAM - Lüks Parfüm Öneri Uygulaması
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
export type KonsantrasyonTercihi = 'eau_fraiche' | 'eau_de_cologne' | 'eau_de_toilette' | 'eau_de_parfum' | 'parfum' | 'fark_etmez';

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

// Yeni pH ve Biyolojik Analiz Tipleri
export type GumusOksitlenme = 'asidik' | 'notr_alkali' | 'emin_degil';
export type SuTuketimi = 'az' | 'normal' | 'cok';
export type BeslenmeAliskanligi = 'asidik' | 'notr' | 'alkali';
export type VucutIsisi = 'sicak' | 'serin' | 'dengeli';
export type ParfumReaksiyonu = 'tatli_pudrali' | 'eksi_uzaklasir' | 'ayni_kalir';
export type UygulamaYeri = 'sadece_ten' | 'ten_kiyafet' | 'sadece_kiyafet';
export type Aura = 'temiz' | 'gizemli' | 'cekici' | 'dinamik' | 'otoriter';
export type CinsiyetAlgisi = 'feminen' | 'maskulen' | 'unisex';

// Kullanıcı Tercihleri - Biyolojik Odaklı YENİ Yapı
export interface UserPreferences {
  // 0️⃣ Temel / Zorunlu pH (Eğer formülle hesaplanacaksa burada tutulur)
  phInfo: UserPHInfo;
  
  // 🧬 Bölüm 1: Biyolojik İmza ve pH Analizi (Ten Kimyası)
  ciltTipi: CiltTipi | null;
  gumusOksitlenme: GumusOksitlenme | null;
  suTuketimi: SuTuketimi | null;
  beslenmeAliskanligi: BeslenmeAliskanligi | null;
  terlemeOrani: TerlemeOrani | null;
  vucutIsisi: VucutIsisi | null;

  // 🧪 Bölüm 2: Koku Reaksiyonu ve Uygulama Alışkanlığı
  parfumReaksiyonu: ParfumReaksiyonu | null;
  uygulamaYeri: UygulamaYeri | null;
  kokuAlmaHassasiyeti: KokuAlmaHassasiyeti | null;

  // 🎭 Bölüm 3: Aura ve Koku Karakteri
  aura: Aura | null;
  kokuTipleri: KokuTipi[];
  kacinilacakNotalar: string[]; // (aşırı şekerli vb. temsili notalar tutulabilir veya sadece string key)
  cinsiyetAlgisi: CinsiyetAlgisi | null;

  // 👔 Bölüm 4: Yaşam Dinamikleri
  ortam: Ortam | null;
  kiyafetStili: KiyafetStili | null;

  // Geriye dönük uyumluluk veya API için saklanabilecek (fakat onboarding'de sorulmayan) bazı opsiyonel alanlar
  yasGrubu?: YasGrubu | null;
  kisilikTipi?: KisilikTipi | null;
  deneyimSeviyesi?: DeneyimSeviyesi | null;
  kullanimSikligi?: KullanimSikligi | null;
  butce?: Butce | null;
  markaTercihi?: MarkaTercihi | null;
  konsantrasyonTercihi?: KonsantrasyonTercihi | null;
  yogunluk?: KokuYogunlugu | null;
  izlenimHedefi?: IzlenimHedefi | null;
  kullanimAmaci?: KullanimAmaci[];
  gununSaati?: GununSaati | null;
  cinsiyet?: Cinsiyet | null;
  ciltHassasiyeti?: CiltHassasiyeti | null;
  alerjiDurumu?: AlerjiDurumu[];
  mevsim?: Mevsim | null;
  iklim?: Iklim | null;
  aktivite?: AktiviteYogunlugu | null;
  sevilenNotalar?: string[];
  sevilmeyenNotalar?: string[];
  kalicilikTercihi?: KalicilikTercihi | null;
}

// pH Hesaplama Sonucu
export interface PHHesapSonucu {
  tahminiPH: number;
  aralik: PHAraligi;
  guvenilirlik: number;
  aciklama: string;
  faktorler: {
    ciltTipiEtkisi: number;
    gumusEtkisi: number;
    suTuketimiCarpani: number;
    beslenmeEtkisi: number;
    terlemeEtkisi: number;
    reaksiyonEtkisi: number;
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

// ========== YENİ ÖZELLİKLER TİPLERİ ==========

// 🎯 Parfüm Takvimi (Scent Calendar)
export interface ScentCalendarEntry {
  id: string;
  parfumId: string;
  date: string; // YYYY-MM-DD format
  occasion?: string; // "iş", "randevu", "özel gün" vb.
  note?: string;
  rating?: number; // 1-5
  weather?: string;
  createdAt: string;
}

// 📊 Mood Tracker
export type MoodType = 'enerjik' | 'romantik' | 'profesyonel' | 'rahat' | 'gizemli' | 'cesur' | 'mutlu' | 'sakin';

export interface MoodEntry {
  id: string;
  mood: MoodType;
  date: string;
  parfumId?: string; // Seçilen parfüm
  note?: string;
  createdAt: string;
}

export interface MoodParfumMatch {
  mood: MoodType;
  emoji: string;
  label: string;
  description: string;
  colors: string[];
  scentTypes: KokuTipi[];
  characteristics: string[];
}

// 💫 Katmanlama Önerileri (Layering)
export interface LayeringPair {
  baseParfumId: string;
  topParfumId: string;
  compatibilityScore: number; // 0-100
  reason: string;
  effect: string; // Katmanlamanın oluşturduğu etki
  tips: string[];
}

export interface LayeringRule {
  baseType: KokuTipi;
  compatibleTypes: KokuTipi[];
  incompatibleTypes: KokuTipi[];
  tips: string[];
}

// 🎁 Hediye Asistanı
export type GiftRecipient = 'anne' | 'baba' | 'sevgili_erkek' | 'sevgili_kadin' | 'arkadas_erkek' | 'arkadas_kadin' | 'is_arkadasi' | 'kendim';
export type GiftOccasion = 'dogum_gunu' | 'yildonumu' | 'sevgililer_gunu' | 'anneler_gunu' | 'babalar_gunu' | 'yeni_yil' | 'ozel_gun' | 'tesaduf';

export interface GiftQuery {
  recipient: GiftRecipient;
  recipientAge?: YasGrubu;
  recipientGender: Cinsiyet;
  occasion?: GiftOccasion;
  budget: Butce;
  recipientStyle?: KisilikTipi;
  preferredTypes?: KokuTipi[];
}

export interface GiftRecommendation {
  parfum: Parfum;
  matchScore: number;
  reasons: string[];
  giftMessage?: string;
}

// 📸 Parfüm Günlüğü (Scent Journal)
export interface JournalEntry {
  id: string;
  parfumId: string;
  date: string;
  title?: string;
  content: string;
  mood?: MoodType;
  occasion?: string;
  location?: string;
  weather?: string;
  rating: number; // 1-5
  performance: {
    longevity: number; // 1-5 (kalıcılık)
    sillage: number; // 1-5 (iz bırakma)
    projection: number; // 1-5 (yayılım)
  };
  tags: string[];
  isFavoriteDay: boolean;
  createdAt: string;
  updatedAt: string;
}

// 🎲 Parfüm Çarkı
export interface SpinWheelConfig {
  source: 'all' | 'favorites' | 'collection';
  collectionId?: string;
  filters?: {
    types?: KokuTipi[];
    season?: Mevsim;
    intensity?: KokuYogunlugu;
  };
}

export interface SpinResult {
  parfum: Parfum;
  spinAt: string;
  wasUsed: boolean;
}

// 🔔 Akıllı Bildirimler
export type NotificationType = 'weather_suggestion' | 'special_day_reminder' | 'usage_reminder' | 'discovery' | 'mood_check';

export interface NotificationPreferences {
  enabled: boolean;
  weatherSuggestions: boolean;
  specialDayReminders: boolean;
  dailyMoodCheck: boolean;
  discoveryTips: boolean;
  reminderTime?: string; // "09:00" format
}

export interface ScheduledNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  scheduledFor: string;
  sent: boolean;
}

// 🏆 SOTD — Günün Kokusu
export interface SOTDEntry {
  id: string;
  parfumId: string;
  date: string;             // "YYYY-MM-DD"
  weather?: {
    temp: number;
    condition: string;
    city: string;
  };
  createdAt: string;
}

// 🔥 Streak (Seri) Sistemi
export interface StreakData {
  currentStreak: number;    // Mevcut ardışık gün
  longestStreak: number;    // En uzun seri
  lastSOTDDate: string | null;  // Son SOTD tarihi
  totalSOTDs: number;       // Toplam seçim sayısı
  badges: StreakBadge[];    // Kazanılan rozetler
}

export interface StreakBadge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  requiredStreak: number;
  earnedAt: string;
}

// 📊 Performans Günlüğü (Akşam Değerlendirmesi)
export interface PerformanceLog {
  id: string;
  parfumId: string;
  date: string;
  longevity: number;        // 1-5 ⭐
  compliment: boolean;      // İltifat aldın mı?
  personalRating: number;   // 1-10 slider
  note?: string;
  createdAt: string;
}

// 📈 Aylık İstatistikler (Wrapped)
export interface MonthlyStats {
  month: number;
  year: number;
  totalDays: number;
  mostUsedParfumId: string | null;
  mostComplimentedParfumId: string | null;
  averageLongevity: number;
  complimentRate: number;   // %
  topParfums: { parfumId: string; count: number; compliments: number }[];
}
