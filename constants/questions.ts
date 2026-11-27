/**
 * TENİNDE — Profil (onboarding) soruları
 *
 * Her soru motorda belirli bir hesabı besler (`why` alanı kullanıcıya "Neden soruyoruz?" olarak gösterilir).
 * Soru eklerken/çıkarırken CLAUDE.md §2'yi güncelle.
 */
import type { IconName } from '@/components/kit';
import type { UserPreferences } from '@/types';

export type QuestionType = 'single' | 'multi' | 'text' | 'ph' | 'parfumler';

export interface QuestionOption {
  value: string;
  label: string;
  hint?: string;
  icon?: IconName;
}

export interface Question {
  id: string;
  chapter: 0 | 1 | 2 | 3;
  type: QuestionType;
  field: keyof UserPreferences | 'phBilgi' | 'phDeger';
  title: string;
  subtitle?: string;
  why: string;
  options?: QuestionOption[];
  optional?: boolean;
  /** Bu soru yalnızca koşul sağlanırsa gösterilir */
  showIf?: (p: UserPreferences) => boolean;
  maxSelect?: number;
  /** Kısa ilk akışta sorulan temel soru (öneri kalitesinin ~%77'sini taşır; bkz. CLAUDE.md §2) */
  temel?: boolean;
  /** Onboarding'de sorulmaz; yalnızca "Şu an ne arıyorsunuz?" çubuğunda seçenek kaynağı olarak kullanılır */
  onboardingDisi?: boolean;
}

export const CHAPTERS = ['Tanışalım', 'Teniniz', 'Kullanımınız', 'Zevkiniz'] as const;

export const QUESTIONS: Question[] = [
  // ───────── 0 · Tanışalım ─────────
  {
    id: 'isim', chapter: 0, type: 'text', field: 'userName', optional: true,
    title: 'Size nasıl hitap edelim?',
    subtitle: 'İsteğe bağlı. Sadece bu cihazda saklanır.',
    why: 'Önerilerinizi kişisel bir dille sunabilmek için.',
  },

  // ───────── 1 · Teniniz ─────────
  {
    id: 'ph_bilgi', chapter: 1, type: 'single', field: 'phBilgi',
    title: 'Ten pH\'ınızı hiç ölçtünüz mü?',
    subtitle: 'Eczanelerde satılan cilt pH test şeritleri birkaç dakikada sonuç verir.',
    why: 'Ölçülmüş bir değer, cevaplardan yapılan tahminden her zaman daha doğrudur. Bilmiyorsanız sorun değil; birkaç soruyla eğiliminizi tahmin ederiz.',
    options: [
      { value: 'bilmiyorum', label: 'Hayır, cevaplarımdan tahmin edin', hint: 'Önerilen', icon: 'sparkles-outline' },
      { value: 'biliyorum', label: 'Evet, değerimi biliyorum', hint: 'Test şeridi veya dermatolog ölçümü', icon: 'flask-outline' },
    ],
  },
  {
    id: 'ph_deger', chapter: 1, type: 'ph', field: 'phDeger',
    title: 'Ölçtüğünüz değer',
    subtitle: 'Sabah, yıkamadan önce iç bilekten ölçüm en doğrusudur. Sağlıklı ten genelde 4.5–6.0 arasındadır.',
    why: 'Bu değer tahminin yerine geçer ve önerilerdeki ten kimyası uyumunu doğrudan belirler.',
    showIf: p => p.phInfo.biliyorMu === 'biliyorum',
  },
  {
    id: 'cilt', temel: true, chapter: 1, type: 'single', field: 'ciltTipi',
    title: 'Sabah yüzünüzü yıkadıktan sonra öğlene kadar alnınız nasıl olur?',
    why: 'Ten yağı (sebum) koku moleküllerini tutar. Yağlı tende parfüm daha uzun kalır, kuru tende daha çabuk uçar.',
    options: [
      { value: 'kuru', label: 'Mat kalır, gerginleşir', hint: 'Kuru ten', icon: 'sunny-outline' },
      { value: 'karma', label: 'Hafif parlar', hint: 'Karma / normal ten', icon: 'partly-sunny-outline' },
      { value: 'yagli', label: 'Belirgin parlar, yağlanır', hint: 'Yağlı ten', icon: 'water-outline' },
    ],
  },
  {
    id: 'gozlenen_kalicilik', chapter: 1, type: 'single', field: 'gozlenenKalicilik',
    title: 'Parfümler sizde genelde ne kadar kalıyor?',
    subtitle: 'Kendi teninizde, kendiniz kokladığınızda.',
    why: 'Kendi gözleminiz, kalıcılık tahmini için en doğrudan bilgidir. Çabuk uçuyorsa daha güçlü alt notalı parfümleri öne çıkarırız.',
    options: [
      { value: 'lt2', label: '2 saatten az', icon: 'hourglass-outline' },
      { value: '2-4', label: '2–4 saat', icon: 'time-outline' },
      { value: '4-6', label: '4–6 saat', icon: 'time-outline' },
      { value: '6+', label: '6 saatten fazla', icon: 'infinite-outline' },
      { value: 'bilmiyorum', label: 'Dikkat etmedim', icon: 'help-circle-outline' },
    ],
  },
  {
    id: 'reaksiyon', chapter: 1, type: 'single', field: 'parfumReaksiyonu',
    title: 'Parfümünüz akşama doğru teninizde nasıl kokuyor?',
    why: 'Tatlılaşma ya da keskinleşme, ten kimyanızın parfümü nasıl dönüştürdüğüne dair en güçlü ipucudur.',
    options: [
      { value: 'tatli_pudrali', label: 'Tatlılaşır, pudralanır', icon: 'flower-outline' },
      { value: 'eksi_uzaklasir', label: 'Keskinleşir, ekşimsi olur', icon: 'flash-outline' },
      { value: 'ayni_kalir', label: 'Aynı kalır, sadece hafifler', icon: 'remove-outline' },
      { value: 'bilmiyorum', label: 'Hiç dikkat etmedim', icon: 'help-circle-outline' },
    ],
  },
  {
    id: 'terleme', chapter: 1, type: 'single', field: 'terlemeOrani',
    title: 'Normal bir günde ne kadar terlersiniz?',
    why: 'Ter ten ısısını ve yüzeyini değiştirir; parfümün yayılımını ve tende nasıl açıldığını etkiler.',
    options: [
      { value: 'az', label: 'Nadiren', hint: 'Sıcakta bile az terlerim', icon: 'leaf-outline' },
      { value: 'normal', label: 'Ortalama', hint: 'Eforla veya sıcakta terlerim', icon: 'walk-outline' },
      { value: 'cok', label: 'Sık ve çabuk', hint: 'Kolay terlerim', icon: 'water-outline' },
    ],
  },
  {
    id: 'isi', temel: true, chapter: 1, type: 'single', field: 'vucutIsisi',
    title: 'Ortam normalken elleriniz ve boynunuz genelde nasıldır?',
    why: 'Sıcak ten kokuyu hızlı yayar ama çabuk tüketir; serin ten yoğun parfümleri yavaş ve nazikçe açar.',
    options: [
      { value: 'serin', label: 'Serin, kolay üşürüm', icon: 'snow-outline' },
      { value: 'dengeli', label: 'Ilık, dengeli', icon: 'thermometer-outline' },
      { value: 'sicak', label: 'Sıcak, çabuk ısınırım', icon: 'flame-outline' },
    ],
  },
  {
    id: 'gumus', chapter: 1, type: 'single', field: 'gumusOksitlenme', optional: true,
    title: 'Gümüş takılarınız teninizde kararır mı?',
    why: 'Zayıf ama tamamlayıcı bir ipucu. Kararma çoğunlukla terdeki kükürt bileşiklerinden olur; tahmine küçük bir ağırlıkla girer.',
    options: [
      { value: 'asidik', label: 'Evet, çabuk kararır', icon: 'contrast-outline' },
      { value: 'notr_alkali', label: 'Hayır, parlak kalır', icon: 'diamond-outline' },
      { value: 'emin_degil', label: 'Takı kullanmıyorum / emin değilim', icon: 'help-circle-outline' },
    ],
  },

  // ───────── 2 · Kullanımınız ─────────
  {
    id: 'uygulama', chapter: 2, type: 'single', field: 'uygulamaYeri',
    title: 'Parfümü en çok nereye sıkarsınız?',
    why: 'Sadece kıyafete sıkıyorsanız ten kimyası devreye girmez; o zaman pH uyumunu hesaba katmayız.',
    options: [
      { value: 'sadece_ten', label: 'Sadece tenime', hint: 'Bilek, boyun', icon: 'hand-left-outline' },
      { value: 'ten_kiyafet', label: 'Tenime ve kıyafetime', icon: 'layers-outline' },
      { value: 'sadece_kiyafet', label: 'Sadece kıyafetime', icon: 'shirt-outline' },
    ],
  },
  {
    id: 'amac', chapter: 2, type: 'multi', field: 'kullanimAmaci', optional: true,
    title: 'Bu parfümü ne için kullanacaksınız?',
    subtitle: 'Birden fazla seçebilirsiniz.',
    why: 'Bir ofis kokusu ile bir gece kokusu çok farklı yoğunluk ve karakter ister.',
    options: [
      { value: 'gunluk', label: 'Günlük', icon: 'sunny-outline' },
      { value: 'is', label: 'İş ve ofis', icon: 'briefcase-outline' },
      { value: 'aksam', label: 'Akşam ve gece', icon: 'moon-outline' },
      { value: 'ozel', label: 'Özel gün', icon: 'sparkles-outline' },
      { value: 'romantik', label: 'Romantik', icon: 'heart-outline' },
      { value: 'spor', label: 'Spor ve hareket', icon: 'bicycle-outline' },
    ],
  },
  {
    id: 'ortam', chapter: 2, type: 'single', field: 'ortam',
    title: 'Gününüzün çoğu nerede geçiyor?',
    why: 'Kapalı alanda yoğun bir parfüm çevreyi rahatsız edebilir; açık havada hafif parfümler kaybolur.',
    options: [
      { value: 'kapali', label: 'Kapalı alanda', hint: 'Ofis, ev, toplantı', icon: 'business-outline' },
      { value: 'acik', label: 'Açık havada', hint: 'Saha, yolculuk', icon: 'partly-sunny-outline' },
      { value: 'her_ikisi', label: 'İkisi de', icon: 'swap-horizontal-outline' },
    ],
  },
  {
    id: 'mevsim', temel: true, onboardingDisi: true, chapter: 2, type: 'single', field: 'mevsim',
    title: 'Hangi mevsim için arıyorsunuz?',
    why: 'Sıcak havada ağır notalar boğucu olabilir, soğukta hafif notalar kaybolur.',
    options: [
      { value: 'İlkbahar', label: 'İlkbahar', icon: 'flower-outline' },
      { value: 'Yaz', label: 'Yaz', icon: 'sunny-outline' },
      { value: 'Sonbahar', label: 'Sonbahar', icon: 'leaf-outline' },
      { value: 'Kış', label: 'Kış', icon: 'snow-outline' },
      { value: 'Tüm Mevsimler', label: 'Tüm yıl', icon: 'calendar-outline' },
    ],
  },
  {
    id: 'yogunluk', chapter: 2, type: 'single', field: 'konsantrasyonTercihi',
    title: 'Ne kadar güçlü bir koku istersiniz?',
    why: 'Konsantrasyon, kokunun ne kadar yayılacağını ve ne kadar kalacağını belirler.',
    options: [
      { value: 'eau_de_toilette', label: 'Tene yakın, hafif', hint: 'Eau de Toilette / Cologne', icon: 'radio-button-off-outline' },
      { value: 'eau_de_parfum', label: 'Dengeli, fark edilir', hint: 'Eau de Parfum', icon: 'radio-button-on-outline' },
      { value: 'parfum', label: 'Güçlü ve çok kalıcı', hint: 'Parfum / Extrait', icon: 'ellipse' },
      { value: 'fark_etmez', label: 'Fark etmez', icon: 'help-circle-outline' },
    ],
  },
  {
    id: 'hassasiyet', temel: true, chapter: 2, type: 'single', field: 'kokuAlmaHassasiyeti',
    title: 'Kokulara karşı hassasiyetiniz nasıl?',
    why: 'Hassas burunlar için ağır ve yoğun parfümleri geri planda tutarız.',
    options: [
      { value: 'dusuk', label: 'Düşük', hint: 'Kokuları geç fark ederim', icon: 'volume-low-outline' },
      { value: 'normal', label: 'Normal', icon: 'volume-medium-outline' },
      { value: 'yuksek', label: 'Hassasım', hint: 'Ağır kokular beni yorar', icon: 'volume-high-outline' },
      { value: 'cok_yuksek', label: 'Çok hassasım', hint: 'Baş ağrısı yapabilir', icon: 'alert-circle-outline' },
    ],
  },
  {
    id: 'butce', temel: true, chapter: 2, type: 'single', field: 'butceTercihi',
    title: 'Bütçeniz hangi aralıkta?',
    why: 'Bütçenizin üzerindeki parfümleri listenin gerisine atarız.',
    options: [
      { value: 'ekonomik', label: 'Uygun fiyatlı', hint: 'Klon ve bütçe dostu markalar', icon: 'pricetag-outline' },
      { value: 'orta', label: 'Orta segment', hint: 'Popüler tasarımcı markaları', icon: 'pricetags-outline' },
      { value: 'premium', label: 'Premium', hint: 'Lüks tasarımcı serileri', icon: 'diamond-outline' },
      { value: 'luks', label: 'Niş ve lüks', hint: 'Niş parfüm evleri', icon: 'star-outline' },
      { value: 'farketmez', label: 'Fark etmez', icon: 'help-circle-outline' },
    ],
  },

  // ───────── 3 · Zevkiniz ─────────
  {
    id: 'aura', temel: true, chapter: 3, type: 'single', field: 'aura',
    title: 'Arkanızda nasıl bir iz bırakmak istersiniz?',
    why: 'Parfümün karakteri, sizinle ilgili bıraktığı ilk izlenimdir.',
    options: [
      { value: 'temiz', label: 'Temiz ve zarif', hint: 'Sabun, ferahlık, beyaz çiçekler', icon: 'water-outline' },
      { value: 'gizemli', label: 'Gizemli ve derin', hint: 'Tütsü, odun, amber', icon: 'moon-outline' },
      { value: 'cekici', label: 'Çekici ve baştan çıkarıcı', hint: 'Vanilya, misk, sıcak notalar', icon: 'heart-outline' },
      { value: 'dinamik', label: 'Dinamik ve enerjik', hint: 'Narenciye, nane, deniz', icon: 'flash-outline' },
      { value: 'otoriter', label: 'Otoriter ve saygın', hint: 'Deri, vetiver, iris', icon: 'shield-outline' },
    ],
  },
  {
    id: 'aileler', temel: true, chapter: 3, type: 'multi', field: 'kokuTipleri', maxSelect: 4,
    title: 'Hangi koku aileleri sizi mutlu eder?',
    subtitle: 'En fazla 4 seçin.',
    why: 'Sevdiğiniz aileler öneri puanının %15\'ini belirler.',
    options: [
      { value: 'Ferah', label: 'Ferah', hint: 'Bergamot, limon, nane' },
      { value: 'Çiçeksi', label: 'Çiçeksi', hint: 'Gül, yasemin, şakayık' },
      { value: 'Odunsu', label: 'Odunsu', hint: 'Sedir, sandal, vetiver' },
      { value: 'Tatlı', label: 'Tatlı', hint: 'Vanilya, karamel, tonka' },
      { value: 'Oryantal', label: 'Oryantal', hint: 'Tütsü, baharat, reçine' },
      { value: 'Amber', label: 'Amber', hint: 'Sıcak, reçineli, sarmalayan' },
      { value: 'Meyvemsi', label: 'Meyvemsi', hint: 'Armut, frenk üzümü, şeftali' },
      { value: 'Aquatik', label: 'Aquatik', hint: 'Deniz, tuz, yosun' },
      { value: 'Baharatlı', label: 'Baharatlı', hint: 'Biber, tarçın, kakule' },
      { value: 'Pudralı', label: 'Pudralı', hint: 'İris, menekşe, misk' },
      { value: 'Yeşil', label: 'Yeşil', hint: 'Yaprak, incir, çay' },
      { value: 'Deri', label: 'Deri', hint: 'Süet, tütün, huş' },
    ],
  },
  {
    id: 'sevilenler', chapter: 3, type: 'parfumler', field: 'sevilenParfumler', optional: true, maxSelect: 5,
    title: 'Şu an sevdiğiniz parfümler var mı?',
    subtitle: 'En fazla 5 tane ekleyin. Bilmiyorsanız atlayın.',
    why: 'Sevdiğiniz parfümlere benzeyenler öne çıkar; bunlar size tekrar önerilmez.',
  },
  {
    id: 'kacin', temel: true, chapter: 3, type: 'multi', field: 'kacinilacakNotalar', optional: true,
    title: '“Kesinlikle olmasın” dediğiniz notalar?',
    subtitle: 'Seçtikleriniz içeren parfümler listeden çıkarılır.',
    why: 'Kırmızı çizgileriniz önerilerin en sert filtresidir.',
    options: [
      { value: 'Aşırı şekerli', label: 'Aşırı şekerli', hint: 'Vanilya, karamel, pralin', icon: 'ice-cream-outline' },
      { value: 'Baskın çiçek', label: 'Baskın çiçek', hint: 'Gül, yasemin, tuberoz', icon: 'flower-outline' },
      { value: 'Deri veya tütün', label: 'Deri, tütün veya is', hint: 'Karanlık, dumanlı notalar', icon: 'bonfire-outline' },
      { value: 'Yoğun baharat', label: 'Yoğun baharat', hint: 'Biber, tarçın, karanfil', icon: 'flame-outline' },
      { value: 'Oud ve reçine', label: 'Oud ve ağır reçine', hint: 'Ud ağacı, tütsü, mür', icon: 'cloud-outline' },
    ],
  },
  {
    id: 'cinsiyet', temel: true, chapter: 3, type: 'single', field: 'cinsiyetAlgisi',
    title: 'Parfümün hangi profilde olmasını istersiniz?',
    why: 'Maskülen veya feminen seçerseniz karşı profildeki parfümler önerilmez.',
    options: [
      { value: 'feminen', label: 'Feminen', icon: 'female-outline' },
      { value: 'maskulen', label: 'Maskülen', icon: 'male-outline' },
      { value: 'unisex', label: 'Unisex', icon: 'male-female-outline' },
      { value: 'farketmez', label: 'Fark etmez', icon: 'help-circle-outline' },
    ],
  },
];

/** Görünür sorular (koşullu soruları filtreler) */
export const visibleQuestions = (p: UserPreferences) => QUESTIONS.filter(q => !q.onboardingDisi && (!q.showIf || q.showIf(p)));

// ───────── Kısa akış + sonradan tamamlama ─────────
/**
 * kisa: ilk açılış — yalnızca temel 9 soru (~1 dk).
 * tamamla: temel olmayan ve henüz cevaplanmamış/atlanmamış sorular.
 * tam: Profil → "Güncelle": tüm sorular, önceki cevaplar dolu.
 */
export type OnboardingMod = 'kisa' | 'tamamla' | 'tam';

/** Soru cevaplandı mı? (saf; pH ölçümü phInfo'dan okunur) */
export function soruCevaplandi(q: Question, p: UserPreferences): boolean {
  if (q.field === 'phBilgi') return !!p.phInfo?.biliyorMu;
  if (q.field === 'phDeger') return !!p.phInfo?.deger;
  const v = p[q.field as keyof UserPreferences] as unknown;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'string') return v.trim().length > 0;
  return v !== null && v !== undefined;
}

/** Doluluk hesabına girmeyen sorular: isim kişisel hitap içindir, pH değeri koşulludur */
const DOLULUK_DISI = new Set(['isim', 'ph_deger']);

const tamamMi = (q: Question, p: UserPreferences) =>
  soruCevaplandi(q, p) || (p.atlananSorular ?? []).includes(q.id);

export function onboardingSorulari(p: UserPreferences, mod: OnboardingMod): Question[] {
  const gorunur = visibleQuestions(p);
  if (mod === 'kisa') return gorunur.filter(q => q.temel);
  if (mod === 'tamamla') return gorunur.filter(q => !q.temel && !tamamMi(q, p) && q.id !== 'ph_deger');
  return gorunur;
}

/** Profil doluluğu: temel sorular + tamamlanmış ek sorular (atlananlar dahil) */
export function profilDoluluk(p: UserPreferences): { yuzde: number; eksik: Question[] } {
  const sayilan = visibleQuestions(p).filter(q => !DOLULUK_DISI.has(q.id));
  const eksik = sayilan.filter(q => !tamamMi(q, p));
  const yuzde = sayilan.length ? Math.round(((sayilan.length - eksik.length) / sayilan.length) * 100) : 100;
  return { yuzde, eksik };
}

export const soruBul = (id: string) => QUESTIONS.find(q => q.id === id);
