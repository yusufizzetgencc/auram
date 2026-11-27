/**
 * Koku Danışmanı — Türkçe soruyu anlayıp ana motorlarla, KULLANICIYA ÖZEL cevaplayan kural tabanlı danışman (saf fonksiyonlar).
 *
 * Soru türleri:
 *   kendim       "Cumartesi düğüne gidiyorum, dolabımdan ne sıkayım?"   → gununSecimi (ten + öğrenilenler + hava + etkinlik)
 *   hediye       "Anneme 3.000 TL'ye hediye ne alayım?"                  → öneri motoru (alıcının nötr profiliyle)
 *   benzer       "Sauvage'a benzeyen daha uygun bir şey"                 → benzerParfumler
 *   parfum       "Tam Dao bana uyar mı?" / "Explorer akşam için olur mu?" → skorlaParfum + zaman/kalıcılık cevabı
 *   karsilastir  "Tam Dao mu Explorer mı?"                               → iki parfümün teninize ve bağlama göre kıyası
 *   bilgi        "Kalıcılığı nasıl artırırım?", "Nereye sıkmalıyım?"     → ten profilinize göre kişisel ipuçları
 *   ben          "Beni ne kadar tanıyorsun?", "En çok ne sıkıyorum?"     → öğrenen motorun tespitleri + geçmiş
 *
 * Sohbet hafızası: her cevap bir `durum` döner; ekran bir sonraki soruda bunu `onceki` olarak verir.
 *   "Daha hafif bir seçenek", "başka", "daha uygun fiyatlı", "bunlardan hangisi akşam için?" gibi devam soruları
 *   önceki niyeti (etkinlik, kaynak, hediye…) korur, yalnızca değişeni günceller; "başka" daha önce gösterilenleri dışarıda bırakır.
 *
 * Kişiselleştirme: öğrenen motor (zevk.ogrenme) — iltifat aldığı parfümler, ten kalibrasyonu, aile yatkınlığı —,
 * dolap, son kayıtlar, hava ve isim cevap metnine yansır. İnternet gerektirmez; services/advisor.ts isteğe bağlı bir
 * dil modeline bağlanırsa bu motor yedek olarak kalır.
 */
import { Butce, Etkinlik, KokuTipi, Parfum, PerformanceLog, UserPreferences } from '../types';
import { dayDiff, toLocalDateKey } from '../utils/date';
import { trLower } from '../utils/text';
import { gununSecimi, GunlukHava, ETKINLIK_ETIKET } from './daily';
import { getRecommendationsPure, skorlaParfum } from './scoring';
import { benzerParfumler, FIYAT_SIRA, ZevkBaglami } from './similarity';

type Mevsim = 'İlkbahar' | 'Yaz' | 'Sonbahar' | 'Kış';
export type BilgiKonusu = 'kalicilik' | 'nereye' | 'kac' | 'numune' | 'saklama' | 'katman' | 'ph';

export interface Niyet {
  tur: 'kendim' | 'hediye' | 'benzer' | 'parfum' | 'karsilastir' | 'bilgi' | 'ben' | 'selam' | 'belirsiz';
  etkinlik: Etkinlik | null;
  hediyeProfil: 'kadın' | 'erkek' | null;
  hediyeKime: string | null;
  butce: Butce | null;
  butceTL: number | null;
  mevsim: Mevsim | null;
  aileler: KokuTipi[];
  yogunluk: 'hafif' | 'yogun' | null;
  kaynak: 'dolap' | 'katalog' | 'otomatik';
  benzerine: Parfum | null;
  /** Karşılaştırmada ikinci parfüm */
  ikinci: Parfum | null;
  zaman: 'gunduz' | 'aksam' | null;
  konu: BilgiKonusu | null;
  /** Önceki soruya devam mı ("daha", "başka", "bunlardan"…) */
  devamMi: boolean;
  /** Daha önce gösterilenlerden farklı istiyor */
  baskaIste: boolean;
  /** "Bunlardan hangisi…" — önceki önerilerden seçim */
  hangisi: boolean;
  /** "Daha uygun/ucuz" — önceki önerilere göre bir kademe aşağı */
  dahaUcuz: boolean;
  /** Parfüm sorusunda kalıcılık soruluyor mu ("kalıcı mı", "ne kadar kalır") */
  kaliciSoru: boolean;
}

const KELIME = (metin: string, kelimeler: string[]) => kelimeler.some(k => new RegExp(`(^|[^a-zçğıöşü])${k}`, 'i').test(metin));

const ETKINLIK_KELIME: [Etkinlik, string[]][] = [
  ['ozel', ['düğün', 'nikah', 'nişan', 'mezuniyet', 'gala', 'kına', 'davet', 'parti', 'yılbaşı', 'doğum gün', 'özel gün', 'kutlama', 'balo', 'konser']],
  ['bulusma', ['randevu', 'buluşma', 'date', 'akşam yemeğ', 'romantik', 'flört', 'yemeğe çık', 'sevgilimle']],
  ['is', ['iş', 'ofis', 'toplantı', 'mülakat', 'sunum', 'işe', 'görüşme', 'mesai']],
  ['spor', ['spor', 'salon', 'koşu', 'antrenman', 'fitness', 'yürüyüş', 'gym']],
  ['ev', ['evde', 'ev için', 'evde otur']],
  ['gunluk', ['okul', 'gezme', 'alışveriş', 'kahve', 'gündelik', 'günlük', 'hafta sonu', 'tatil', 'plaj', 'üniversite']],
];

const KADIN = ['annem', 'anneme', 'ablam', 'ablama', 'kız arkadaş', 'karım', 'karıma', 'hanımım', 'teyzem', 'teyzeme', 'halam', 'halama', 'kızım', 'kızıma', 'kız kardeş', 'kadın', 'bayan', 'eşime (kadın)'];
const ERKEK = ['babam', 'babama', 'abim', 'abime', 'erkek arkadaş', 'kocam', 'kocama', 'amcam', 'amcama', 'dayım', 'dayıma', 'oğlum', 'oğluma', 'erkek kardeş', 'erkek', 'beyim'];
const KIME = ['annem', 'babam', 'ablam', 'abim', 'sevgilim', 'eşim', 'arkadaşım', 'kız arkadaşım', 'erkek arkadaşım', 'karım', 'kocam', 'kardeşim', 'teyzem', 'halam', 'amcam', 'dayım', 'oğlum', 'kızım', 'hocam', 'patronum'];

const AILE_KELIME: [KokuTipi, string[]][] = [
  ['Odunsu', ['odunsu', 'odun', 'sedir', 'sandal', 'vetiver']],
  ['Çiçeksi', ['çiçeksi', 'çiçek', 'gül', 'yasemin', 'zambak']],
  ['Ferah', ['ferah', 'taze', 'temiz', 'narenciye', 'limon', 'bergamot', 'serin']],
  ['Tatlı', ['tatlı', 'vanilya', 'gurme', 'şekerli', 'karamel', 'pralin']],
  ['Baharatlı', ['baharat', 'biberli', 'tarçın', 'kakule']],
  ['Amber', ['amber', 'sıcak koku']],
  ['Meyvemsi', ['meyve']],
  ['Deri', ['deri', 'tütün']],
  ['Pudralı', ['pudra', 'iris']],
  ['Yeşil', ['yeşil', 'çimen', 'incir']],
  ['Oryantal', ['oryantal', 'tütsü', 'oud', 'ud ']],
  ['Aquatik', ['deniz kok', 'aquatik', 'okyanus', 'marin']],
];

const BILGI_KELIME: [BilgiKonusu, string[]][] = [
  ['kalicilik', ['kalıcılı', 'uzun kalsın', 'uzun kalması', 'çabuk uçuyor', 'uçuyor', 'çabuk gidiyor', 'kokusu gidiyor', 'kalmıyor']],
  ['nereye', ['nereye sık', 'nereye sür', 'nereye uygula', 'nabız', 'hangi bölge']],
  ['kac', ['kaç sık', 'kaç kez sık', 'kaç fıs', 'ne kadar sık', 'kaç puf']],
  ['numune', ['numune', 'dekant', 'tester']],
  ['saklama', ['sakla', 'buzdolab', 'bozulur', 'son kullanma', 'güneşte']],
  ['katman', ['katman', 'karıştır', 'iki parfüm', 'üst üste']],
  ['ph', ['ph', 'ten kimya', 'asidik']],
];

const BEN_KELIME = ['beni ne kadar', 'ne öğrendin', 'hakkımda', 'zevkim ne', 'beni tanı', 'en çok ne sık', 'en çok hangi', 'bende en uzun', 'tenim nasıl', 'profilim'];
const SORU_KALIBI = ['nasıl', 'neden', 'nereye', 'kaç', 'mantıklı mı', 'gerekir mi', 'olur mu', 'ne yapmalı', 'ne yapayım', 'mi ', 'mı ', 'mu ', 'mü '];

export const butceKademesi = (tl: number): Butce => (tl <= 1500 ? 'ekonomik' : tl <= 4000 ? 'orta' : tl <= 9000 ? 'premium' : 'luks');
const KADEME: Butce[] = ['ekonomik', 'orta', 'premium', 'luks'];

/** Metinde geçen katalog parfümleri (en uzun ad önce; çakışmasız, en fazla 2) */
function anilanParfumler(t: string, katalog: Parfum[]): Parfum[] {
  let kalan = t;
  const out: Parfum[] = [];
  for (const p of [...katalog].sort((a, b) => b.isim.length - a.isim.length)) {
    if (p.isim.length < 3) continue;
    const ad = trLower(p.isim);
    const i = kalan.indexOf(ad);
    if (i >= 0 && (ad.length >= 4 || new RegExp(`(^|[^a-zçğıöşü])${ad}([^a-zçğıöşü]|$)`).test(kalan))) {
      out.push(p);
      kalan = kalan.slice(0, i) + ' '.repeat(ad.length) + kalan.slice(i + ad.length);
      if (out.length === 2) break;
    }
  }
  // Metindeki sıraya göre
  return out.sort((a, b) => t.indexOf(trLower(a.isim)) - t.indexOf(trLower(b.isim)));
}

export function soruyuAyristir(metin: string, katalog: Parfum[]): Niyet {
  const t = ' ' + trLower(metin).replace(/[’']/g, "'") + ' ';

  // Bütçe: "3.000 TL", "3000tl", "3 bin", "2,5 bin lira"
  let butceTL: number | null = null;
  const m = t.match(/(\d+(?:[.,]\d+)?)\s*(bin|k)?\s*(tl|lira|₺)?/);
  if (m && (m[2] || m[3] || Number(m[1].replace(/\./g, '')) >= 300)) {
    const sayi = Number(m[1].replace(/\.(?=\d{3})/g, '').replace(',', '.'));
    butceTL = m[2] ? Math.round(sayi * 1000) : Math.round(sayi);
    if (butceTL < 100) butceTL = null;
  }
  const dahaUcuz = KELIME(t, ['daha uygun', 'daha ucuz', 'daha hesaplı']);
  let butce: Butce | null = butceTL ? butceKademesi(butceTL) : null;
  if (!butce && !dahaUcuz && KELIME(t, ['ucuz', 'uygun fiyat', 'bütçe dostu', 'ekonomik'])) butce = 'ekonomik';
  if (!butce && KELIME(t, ['lüks', 'pahalı', 'niş'])) butce = 'luks';
  if (dahaUcuz && !butce) butce = 'ekonomik'; // önceki bağlam yoksa; devamda bir kademe aşağı hesaplanır

  let mevsim: Mevsim | null = null;
  if (KELIME(t, ['yaz', 'tatil', 'plaj', 'sıcak'])) mevsim = 'Yaz';
  else if (KELIME(t, ['kış', 'soğuk', 'yılbaşı'])) mevsim = 'Kış';
  else if (KELIME(t, ['sonbahar'])) mevsim = 'Sonbahar';
  else if (KELIME(t, ['ilkbahar', 'bahar'])) mevsim = 'İlkbahar';

  const zaman = KELIME(t, ['akşam', 'gece', 'bu gece']) ? 'aksam' : KELIME(t, ['sabah', 'gündüz', 'öğle', 'gün boyu']) ? 'gunduz' : null;
  const etkinlik = ETKINLIK_KELIME.find(([, ks]) => KELIME(t, ks))?.[0] ?? null;
  const aileler = AILE_KELIME.filter(([, ks]) => KELIME(t, ks)).map(([a]) => a);
  const yogunluk = KELIME(t, ['hafif', 'sakin', 'belli belirsiz', 'yumuşak']) ? 'hafif' : KELIME(t, ['yoğun', 'iddialı', 'güçlü', 'uzun süre kal', 'kalıcı bir', 'daha kalıcı']) ? 'yogun' : null;
  const kaynak = KELIME(t, ['dolabım', 'bende olan', 'elimdeki', 'sahip olduğum', 'parfümlerimden']) ? 'dolap' : KELIME(t, ['katalog', 'yeni bir', 'yeni parfüm', 'almak istiyorum', 'ne alayım']) ? 'katalog' : 'otomatik';

  const anilan = anilanParfumler(t, katalog);
  const benzerIstek = KELIME(t, ['benzer', 'gibi', 'tarzı', 'yerine', 'alternatif', 'benzeyen', 'muadil']);
  const karsilastirIstek = anilan.length === 2 && (KELIME(t, ['mi', 'mı', 'mu', 'mü', 'hangisi', 'karşılaştır', 'vs', 'yoksa', 'arasında']) || / mı | mi /.test(t));

  const hediye = KELIME(t, ['hediye', 'ne alayım', 'ne alsam', 'doğum günü için', 'için parfüm']);
  const hediyeProfil = KELIME(t, KADIN) ? 'kadın' : KELIME(t, ERKEK) ? 'erkek' : null;
  const hediyeKime = KIME.find(k => t.includes(k)) ?? null;

  const konu = BILGI_KELIME.find(([, ks]) => KELIME(t, ks))?.[0] ?? null;
  const soruKalibi = SORU_KALIBI.some(k => t.includes(k));
  const ben = BEN_KELIME.some(k => t.includes(k));
  const selam = /^\s*(merhaba|selam|selamlar|hey|günaydın|iyi akşamlar|naber)[\s!.,]*$/.test(t.trim()) || /^(merhaba|selam)\s*$/.test(t.trim());

  const baskaIste = KELIME(t, ['başka', 'diğer', 'farklı', 'bir tane daha', 'değiştir']);
  const hangisi = KELIME(t, ['hangisi', 'bunlardan', 'içlerinden', 'arasından']);
  const devamMi = baskaIste || hangisi || dahaUcuz || KELIME(t, ['daha ', 'peki', 'onun yerine', 'bir de', 'o zaman']) || /^\s*(ya |peki|daha)/.test(t);

  let tur: Niyet['tur'] = 'belirsiz';
  if (selam) tur = 'selam';
  else if (ben) tur = 'ben';
  else if (karsilastirIstek) tur = 'karsilastir';
  else if (anilan.length && benzerIstek) tur = 'benzer';
  else if (konu && !anilan.length && !hediye && !(etkinlik && !soruKalibi)) tur = 'bilgi';
  else if (anilan.length === 1 && !hediye) tur = 'parfum';
  else if (hediye || (hediyeKime && !etkinlik)) tur = 'hediye';
  else if (etkinlik || mevsim || zaman || aileler.length || butce || yogunluk || kaynak === 'dolap' || KELIME(t, ['ne sıkayım', 'ne sıksam', 'öner', 'parfüm'])) tur = 'kendim';

  return {
    tur, etkinlik, hediyeProfil, hediyeKime, butce, butceTL, mevsim, aileler, yogunluk,
    kaynak: kaynak as Niyet['kaynak'],
    benzerine: anilan[0] ?? null,
    ikinci: anilan[1] ?? null,
    zaman, konu, devamMi, baskaIste, hangisi, dahaUcuz,
    kaliciSoru: KELIME(t, ['kalıcı', 'ne kadar kal', 'kaç saat']),
  };
}

export interface DanismanOnerisi { parfum: Parfum; not: string }

/** Bir sonraki soruya taşınan sohbet durumu */
export interface SohbetDurumu { niyet: Niyet; gosterilen: string[] }

export interface DanismanCevabi {
  metin: string;
  oneriler: DanismanOnerisi[];
  /** Kullanıcının dokunarak sorabileceği devam soruları */
  devam: string[];
  /** Sohbet hafızası — ekran bir sonraki soruda `onceki` olarak geri verir */
  durum?: SohbetDurumu;
}

export interface DanismanBaglami {
  katalog: Parfum[];
  dolap: Parfum[];
  prefs: UserPreferences;
  ph: number;
  zevk?: ZevkBaglami;
  tarih?: Date;
  hava?: GunlukHava | null;
  gecmis?: { parfumId: string; date: string }[];
  degerlendirmeler?: PerformanceLog[];
  onceki?: SohbetDurumu | null;
}

const butceUygun = (p: Parfum, b: Butce | null) => !b || FIYAT_SIRA[p.fiyatAraligi ?? 'orta'] <= FIYAT_SIRA[b];
const BUTCE_METNI: Record<Butce, string> = { ekonomik: 'uygun fiyatlı', orta: 'orta segment', premium: 'premium', luks: 'lüks' };
const YOGUNLUK_METNI: Record<string, string> = { hafif: 'hafif', orta: 'orta yoğunlukta', yogun: 'yoğun, akşamlık' };
const KAL_METNI: Record<string, string> = { kisa: 'kısa (2–4 saat)', orta: 'orta (4–6 saat)', uzun: 'uzun (6 saat +)' };
const gunduzMu = (p: Parfum) => p.yogunluk !== 'yogun' && (p.kullanimAmaci ?? []).some(k => ['gunluk', 'is', 'spor'].includes(k));
const aksamMi = (p: Parfum) => (p.kullanimAmaci ?? []).some(k => ['aksam', 'ozel', 'romantik'].includes(k)) || p.yogunluk === 'yogun';
const buyukHarf = (s: string) => s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);

/** Hediye kartı notu: alıcının teni bilinmediği için kullanıcının teninden SÖZ ETMEZ; karakter + tanıdık notalar + yoğunluk (fiyat başlıkta) */
export function hediyeNotu(p: Parfum): string {
  const aile = p.ikincilTip ? `${p.tip}, ${trLower(p.ikincilTip)}` : p.tip;
  const notalar = [...p.notalar.orta, ...p.notalar.ust].slice(0, 2).map(trLower).join(', ');
  const parcalar = [`${aile}${notalar ? ` (${notalar})` : ''}`, YOGUNLUK_METNI[p.yogunluk] ?? ''];
  return parcalar.filter(Boolean).join(' · ');
}

export const ORNEK_SORULAR = [
  'Bu akşam buluşmam var, dolabımdan ne sıkayım?',
  'Cumartesi düğüne gidiyorum, ne önerirsin?',
  'Anneme 3.000 TL\'ye hediye ne alayım?',
  'Sauvage\'a benzeyen daha uygun bir şey var mı?',
  'Kalıcılığı nasıl artırırım?',
  'Beni ne kadar tanıyorsun?',
];

/** Devam sorusunu önceki niyetle birleştirir: değişmeyen bağlam (etkinlik, kaynak, hediye…) korunur */
export function niyetiBirlestir(yeni: Niyet, onceki: SohbetDurumu | null | undefined, katalog: Parfum[]): Niyet {
  if (!onceki) return yeni;
  const bagimsiz = ['parfum', 'karsilastir', 'bilgi', 'ben', 'selam', 'benzer'].includes(yeni.tur) && !(yeni.tur === 'benzer' && !yeni.benzerine);
  const anlamsizDevam = yeni.tur === 'belirsiz' && (yeni.devamMi || yeni.zaman || yeni.yogunluk);
  if (bagimsiz || (!yeni.devamMi && !anlamsizDevam && yeni.tur !== 'belirsiz' && yeni.tur !== 'kendim')) return yeni;
  if (!yeni.devamMi && !anlamsizDevam && yeni.tur === 'kendim' && (yeni.etkinlik || yeni.aileler.length)) return yeni; // yeni bir istek
  if (yeni.tur === 'belirsiz' && !anlamsizDevam) return yeni;

  const o = onceki.niyet;
  const tur = ['kendim', 'hediye', 'benzer'].includes(o.tur) ? o.tur : 'kendim';
  let butce = yeni.butceTL ? yeni.butce : o.butce;
  if (yeni.dahaUcuz) {
    // Gösterilenlerin en pahalı kademesinin bir altı
    const byId = new Map(katalog.map(p => [p.id, p]));
    const siralar = onceki.gosterilen.map(id => FIYAT_SIRA[byId.get(id)?.fiyatAraligi ?? 'orta']);
    const maks = siralar.length ? Math.max(...siralar) : FIYAT_SIRA[o.butce ?? 'orta'];
    butce = KADEME[Math.max(0, maks - 1)];
  } else if (!yeni.butceTL && yeni.butce) butce = yeni.butce;
  return {
    ...o,
    tur: tur as Niyet['tur'],
    etkinlik: yeni.etkinlik ?? o.etkinlik,
    mevsim: yeni.mevsim ?? o.mevsim,
    aileler: yeni.aileler.length ? yeni.aileler : o.aileler,
    yogunluk: yeni.yogunluk ?? o.yogunluk,
    kaynak: yeni.kaynak !== 'otomatik' ? yeni.kaynak : o.kaynak,
    hediyeProfil: yeni.hediyeProfil ?? o.hediyeProfil,
    hediyeKime: yeni.hediyeKime ?? o.hediyeKime,
    zaman: yeni.zaman ?? o.zaman,
    butce,
    butceTL: yeni.butceTL ?? o.butceTL,
    devamMi: true,
    baskaIste: yeni.baskaIste,
    hangisi: yeni.hangisi,
    dahaUcuz: yeni.dahaUcuz,
    kaliciSoru: yeni.kaliciSoru,
    konu: null,
  };
}

// ───────── Kişisel cümleler ─────────

function sonGun(p: Parfum, c: DanismanBaglami, bugun: string): number | null {
  const k = (c.gecmis ?? []).filter(g => g.parfumId === p.id).map(g => dayDiff(g.date, bugun)).filter(d => d >= 0);
  return k.length ? Math.min(...k) : null;
}

/** Önerilen parfüm hakkında öğrenilenlerden tek, en güçlü kişisel cümle */
function kisiselCumle(p: Parfum, c: DanismanBaglami, bugun: string): string | null {
  const m = c.zevk?.ogrenme;
  if (m?.iltifatli.includes(p.id)) return `Bununla daha önce iltifat almıştınız; sizde iyi sonuç verdiğini biliyoruz.`;
  const k = m?.kalicilik[p.tip];
  if (k && k.sapma > 0.1) return `Kayıtlarınıza göre ${trLower(p.tip)} parfümler teninizde tahmin edilenden uzun kalıyor.`;
  const son = sonGun(p, c, bugun);
  if (son === 0) return 'Bugün zaten bunu sıktınız.';
  if (son === 1) return 'Dün de bunu sıkmıştınız; değişiklik isterseniz "başka" yazın.';
  if (son !== null && son <= 14) return `En son ${son} gün önce sıktınız.`;
  if (son === null && c.dolap.some(d => d.id === p.id)) return 'Dolabınızda olduğu halde henüz kaydetmediniz; denemek için iyi bir gün.';
  const e = m?.aileEgilim[p.tip];
  if (e !== undefined && e > 0.35) return `${p.tip} ailesine yatkın olduğunuzu seçimlerinizden biliyorum.`;
  return null;
}

function havaCumlesi(c: DanismanBaglami): string {
  if (!c.hava) return '';
  const t = Math.round(c.hava.sicaklik);
  if (t <= 10) return `Hava soğuk (${t}°C); sıcak, alt notası güçlü kokular daha iyi açılır. `;
  if (t <= 17) return `Hava serin (${t}°C). `;
  if (t >= 27) return `Hava sıcak (${t}°C); ağır kokular boğucu olabilir, daha ferah seçenekleri öne aldım. `;
  return '';
}

/**
 * Öneri kartı notları birbirini tekrarlamasın: her parfüm için önce ona özel kişisel cümle (iltifat, kalıcılık kaydı,
 * son kullanım), yoksa henüz kullanılmamış ilk gerekçe, o da yoksa karakter özeti.
 */
function kartNotlari(liste: { parfum: Parfum; gerekceler: string[]; puan: number }[], c: DanismanBaglami, bugun: string): DanismanOnerisi[] {
  const kullanilan = new Set<string>();
  return liste.map(s => {
    const kisisel = kisiselCumle(s.parfum, c, bugun);
    const gerekce = s.gerekceler.find(g => !kullanilan.has(g));
    const not = (kisisel && !kullanilan.has(kisisel) ? kisisel : gerekce) ?? `${s.parfum.tip}${s.parfum.ikincilTip ? `, ${trLower(s.parfum.ikincilTip)}` : ''} · %${s.puan} uygun`;
    kullanilan.add(not);
    return { parfum: s.parfum, not };
  });
}

/** Aynı soruya hep aynı kalıpla başlamamak için metinden türetilen küçük çeşitlilik */
const sec = <T,>(liste: T[], tohum: string) => liste[[...tohum].reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) >>> 0, 7) % liste.length];

// ───────── Cevap ─────────

export function danismanCevabi(nHam: Niyet, c: DanismanBaglami): DanismanCevabi {
  const tarih = c.tarih ?? new Date();
  const bugun = toLocalDateKey(tarih);
  const n = niyetiBirlestir(nHam, c.onceki, c.katalog);
  const isim = c.prefs.userName?.trim().split(/\s+/)[0];
  const tohum = `${n.tur}${n.etkinlik}${n.zaman}${bugun}`;
  const bitir = (cevap: Omit<DanismanCevabi, 'durum'>): DanismanCevabi => ({ ...cevap, durum: { niyet: n, gosterilen: cevap.oneriler.map(o => o.parfum.id) } });

  if (n.tur === 'selam') {
    return bitir({
      metin: `${isim ? `Merhaba ${isim}` : 'Merhaba'}. Bugün nereye gidiyorsunuz? Ya da bir parfümü sorun, hediye arayın; teninize ve kayıtlarınıza göre cevaplayayım.`,
      oneriler: [],
      devam: ['Bugün ne sıkayım?', ORNEK_SORULAR[0], ORNEK_SORULAR[2]],
    });
  }

  // ── Beni ne kadar tanıyorsun? ──
  if (n.tur === 'ben') {
    const m = c.zevk?.ogrenme;
    const sayac = new Map<string, number>();
    (c.gecmis ?? []).forEach(g => sayac.set(g.parfumId, (sayac.get(g.parfumId) ?? 0) + 1));
    const enCok = [...sayac.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id, k]) => ({ p: c.katalog.find(x => x.id === id), k })).filter(x => x.p);
    const parcalar: string[] = [];
    if (m?.tespitler.length) parcalar.push(m.tespitler.slice(0, 3).map(t => t.metin).join(' '));
    if (enCok.length) parcalar.push(`En çok sıktıklarınız: ${enCok.map(x => `${x.p!.isim} (${x.k} gün)`).join(', ')}.`);
    if (c.prefs.kokuTipleri?.length) parcalar.push(`Profilinizde ${c.prefs.kokuTipleri.slice(0, 3).join(', ').toLocaleLowerCase('tr')} ailelerini seçtiniz.`);
    if (!parcalar.length) {
      return bitir({ metin: 'Henüz sizi tanıyacak kadar kaydınız yok. Günün kokusunu kaydedip akşam "teninizde ne kadar kaldı?" sorusunu cevapladıkça teninizi ve zevkinizi öğrenirim.', oneriler: [], devam: ['Bugün ne sıkayım?', 'Kalıcılığı nasıl artırırım?'] });
    }
    const oneri = enCok.length ? enCok.map(x => ({ parfum: x.p!, not: `${x.k} gün sıktınız` })) : [];
    return bitir({
      metin: `${isim ? `${isim}, ` : ''}sizin hakkımda bildiklerim: ${parcalar.join(' ')}${m ? ` Toplam ${m.sinyalSayisi} etkileşimden öğrendim; "Sizden öğrendiklerim" ekranında yanlış olanı silebilirsiniz.` : ''}`,
      oneriler: oneri,
      devam: ['Bugün ne sıkayım?', 'Bana yeni ne önerirsin?'],
    });
  }

  // ── Bilgi soruları (kişisel ipuçlarıyla) ──
  if (n.tur === 'bilgi' && n.konu) return bitir(bilgiCevabi(n.konu, c));

  // ── Tek parfüm hakkında ──
  if (n.tur === 'parfum' && n.benzerine) {
    const p = n.benzerine;
    const s = skorlaParfum(p, c.prefs, c.ph, c.zevk);
    const sahip = c.dolap.some(d => d.id === p.id);
    const sevilen = (c.prefs.sevilenParfumler ?? []).includes(p.id);
    const sevilmeyen = (c.prefs.sevilmeyenParfumler ?? []).includes(p.id);
    const satirlar: string[] = [];
    const yorum = s.matchPercentage >= 80 ? 'size çok uygun' : s.matchPercentage >= 65 ? 'size uygun' : s.matchPercentage >= 50 ? 'size kısmen uygun' : 'size pek uygun değil';
    satirlar.push(`${p.marka} ${p.isim} teninize göre %${s.matchPercentage} ile ${yorum}.`);
    if (s.matchReasons[0]) satirlar.push(s.matchReasons[0]);
    if (n.zaman === 'aksam') satirlar.push(aksamMi(p) ? 'Akşam için iyi bir seçim; karakteri geceye uygun.' : 'Akşamdan çok gündüze uygun bir karakteri var; akşam için daha iddialı bir seçenek isteyebilirsiniz.');
    if (n.zaman === 'gunduz') satirlar.push(gunduzMu(p) ? 'Gündüz rahatça kullanılır.' : 'Gündüz için biraz yoğun kaçabilir; az sıkın.');
    if (n.etkinlik) {
      const uygun = n.etkinlik === 'is' || n.etkinlik === 'spor' ? p.yogunluk !== 'yogun' : n.etkinlik === 'ozel' || n.etkinlik === 'bulusma' ? p.yogunluk !== 'hafif' : true;
      satirlar.push(`${ETKINLIK_ETIKET[n.etkinlik].label} için ${uygun ? 'uygun' : 'ideal değil'}.`);
    }
    if (n.kaliciSoru || n.konu === 'kalicilik') {
      const k = c.zevk?.ogrenme?.kalicilik[p.tip];
      satirlar.push(`Kalıcılığı ${KAL_METNI[p.kalicilik] ?? p.kalicilik}${k ? `; kayıtlarınıza göre ${trLower(p.tip)} parfümler sizde ${k.sapma > 0 ? 'beklenenden uzun' : 'beklenenden kısa'} kalıyor` : ''}.`);
    }
    if (sahip) satirlar.push('Dolabınızda var.');
    if (sevilen) satirlar.push('Sevdiklerinizden biri.');
    if (sevilmeyen) satirlar.push('Daha önce sevmediğinizi belirtmiştiniz.');
    const uyari = s.uyumKategorileri.find(k => !k.uyum);
    if (uyari) satirlar.push(`Dikkat: ${uyari.detay}.`);
    const oneriler: DanismanOnerisi[] = [{ parfum: p, not: `%${s.matchPercentage} uyum · ${p.tip}${p.ikincilTip ? `, ${trLower(p.ikincilTip)}` : ''}` }];
    if (s.matchPercentage < 65) {
      const alternatif = benzerParfumler(p, c.katalog, { limit: 8, esik: 0.3 })
        .map(b => ({ b, sk: skorlaParfum(b.parfum, c.prefs, c.ph, c.zevk).matchPercentage }))
        .filter(x => x.sk > s.matchPercentage)
        .sort((a, b) => b.sk - a.sk)
        .slice(0, 2);
      if (alternatif.length) {
        satirlar.push('Benzer karakterde ama teninize daha uygun olanları da ekledim.');
        alternatif.forEach(x => oneriler.push({ parfum: x.b.parfum, not: `%${x.sk} uyum · ${p.isim} ile %${Math.round(x.b.benzerlik * 100)} benzer` }));
      }
    }
    return bitir({
      metin: satirlar.join(' '),
      oneriler,
      devam: [`${p.isim} akşam için olur mu?`, `${p.isim}'e benzer daha uygun`, sahip ? 'Bugün ne sıkayım?' : `${p.isim} kalıcı mı?`],
    });
  }

  // ── İki parfümü karşılaştır ──
  if (n.tur === 'karsilastir' && n.benzerine && n.ikinci) {
    const [a, b] = [n.benzerine, n.ikinci];
    const sa = skorlaParfum(a, c.prefs, c.ph, c.zevk);
    const sb = skorlaParfum(b, c.prefs, c.ph, c.zevk);
    let kazanan = sa.matchPercentage >= sb.matchPercentage ? a : b;
    let neden = '';
    if (n.zaman || n.etkinlik) {
      const sira = gununSecimi({ adaylar: [a, b], prefs: c.prefs, ph: c.ph, tarih, etkinlik: n.etkinlik ?? (n.zaman === 'aksam' ? 'bulusma' : 'gunluk'), hava: c.hava, gecmis: c.gecmis, zevk: c.zevk, dolaptan: true });
      if (sira[0]) { kazanan = sira[0].parfum; neden = sira[0].gerekceler[0] ?? ''; }
    }
    const kaybeden = kazanan.id === a.id ? b : a;
    const sk = kazanan.id === a.id ? sa : sb;
    const baglam = n.etkinlik ? `${ETKINLIK_ETIKET[n.etkinlik].label.toLocaleLowerCase('tr')} için ` : n.zaman === 'aksam' ? 'akşam için ' : n.zaman === 'gunduz' ? 'gündüz için ' : '';
    return bitir({
      metin: `${baglam ? buyukHarf(baglam) : 'Teninize göre '}${kazanan.isim} daha iyi bir seçim. ${neden || sk.matchReasons[0] || ''} ${kaybeden.isim} ise ${kaybeden.yogunluk === 'hafif' ? 'daha hafif ve gündelik' : kaybeden.yogunluk === 'yogun' ? 'daha yoğun ve iddialı' : 'daha dengeli'} bir alternatif.`.replace(/\s+/g, ' ').trim(),
      oneriler: [
        { parfum: a, not: `%${sa.matchPercentage} uyum · ${a.tip}, ${YOGUNLUK_METNI[a.yogunluk] ?? ''}` },
        { parfum: b, not: `%${sb.matchPercentage} uyum · ${b.tip}, ${YOGUNLUK_METNI[b.yogunluk] ?? ''}` },
      ],
      devam: ['Hangisi akşam için?', 'Hangisi daha kalıcı?', 'İkisi de olmasın, başka öner'],
    });
  }

  // ── "X'e benzer" ──
  if (n.tur === 'benzer' && n.benzerine) {
    const base = n.benzerine;
    const haric = new Set(n.baskaIste ? c.onceki?.gosterilen ?? [] : []);
    const liste = benzerParfumler(base, c.katalog, { limit: 16, esik: 0.25 })
      .filter(s => butceUygun(s.parfum, n.butce) && !haric.has(s.parfum.id))
      .filter(s => !n.yogunluk || (n.yogunluk === 'hafif' ? s.parfum.yogunluk !== 'yogun' : s.parfum.yogunluk !== 'hafif'))
      .map(s => ({ s, sk: skorlaParfum(s.parfum, c.prefs, c.ph, c.zevk).matchPercentage }))
      // Benzerlik + teninize uyum birlikte: aynı benzerlikte size uyan öne geçer
      .sort((x, y) => (y.s.benzerlik * 0.6 + (y.sk / 100) * 0.4) - (x.s.benzerlik * 0.6 + (x.sk / 100) * 0.4))
      .slice(0, 4);
    if (!liste.length) {
      return bitir({ metin: `${base.isim} yapısına yakın${n.butce ? `, ${BUTCE_METNI[n.butce]}` : ''} ${haric.size ? 'başka ' : ''}bir parfüm katalogda bulamadım.`, oneriler: [], devam: [`${base.isim} bana uyar mı?`] });
    }
    return bitir({
      metin: `${base.marka} ${base.isim} ile nota ve karakter olarak en yakın${n.butce ? `, ${BUTCE_METNI[n.butce]}` : ''} seçenekler; teninize uyanları öne aldım:`,
      oneriler: liste.map(({ s, sk }) => ({ parfum: s.parfum, not: `%${Math.round(s.benzerlik * 100)} benzer · teninize %${sk}${s.ortakNotalar.length ? ` · ortak: ${s.ortakNotalar.slice(0, 2).join(', ')}` : ''}` })),
      devam: ['Bunlardan hangisi akşam için?', `${base.isim}'den daha hafif bir şey`, 'Başka'],
    });
  }

  // ── Hediye ──
  if (n.tur === 'hediye') {
    const alici: UserPreferences = {
      ...c.prefs,
      phInfo: { biliyorMu: 'bilmiyorum', deger: null, tahminiDeger: null, aralik: 'normal' },
      ciltTipi: null, terlemeOrani: null, vucutIsisi: null, parfumReaksiyonu: null, gozlenenKalicilik: null,
      kacinilacakNotalar: [], sevilenParfumler: [], sevilmeyenParfumler: [],
      kokuTipleri: n.aileler, mevsim: n.mevsim, aura: null,
      cinsiyetAlgisi: n.hediyeProfil === 'kadın' ? 'feminen' : n.hediyeProfil === 'erkek' ? 'maskulen' : null,
      butceTercihi: n.butce ?? 'farketmez', kokuAlmaHassasiyeti: null,
    } as UserPreferences;
    const haric = new Set(n.baskaIste || n.dahaUcuz ? c.onceki?.gosterilen ?? [] : []);
    const havuz = c.katalog.filter(p => butceUygun(p, n.butce) && p.yogunluk !== 'yogun' && !haric.has(p.id) && (!n.yogunluk || n.yogunluk !== 'hafif' || p.yogunluk === 'hafif'));
    const recs = getRecommendationsPure(havuz, alici, 5.0, 4);
    const kime = n.hediyeKime ? `${n.hediyeKime.replace(/ım$|im$|um$|üm$/, '')}` : '';
    const giris = `${kime ? buyukHarf(kime) + ' için' : 'Hediye için'} ${n.butce ? `${BUTCE_METNI[n.butce]} ` : ''}${haric.size ? 'farklı ' : ''}önerilerim:`;
    const ipucu = n.aileler.length ? ` Sevdiği ${n.aileler.join(', ').toLocaleLowerCase('tr')} karaktere göre süzdüm.` : ' Sevdiği bir parfümü yazarsanız ("annem X kullanıyor") daha isabetli öneririm.';
    return bitir({
      metin: `${giris} Karşı tarafın tenini bilmediğim için çoğu kişide güvenle açılan, hafif ve orta yoğunlukta parfümleri öne aldım.${n.hediyeProfil ? '' : ' Kadın mı erkek mi olduğunu yazarsanız listeyi daraltırım.'}${ipucu}`,
      oneriler: recs.map(r => ({ parfum: r.parfum, not: hediyeNotu(r.parfum) })),
      devam: [n.butce !== 'ekonomik' ? 'Daha uygun fiyatlı' : 'Başka seçenekler', 'Daha hafif olsun', 'Hediye için numune almak mantıklı mı?'],
    });
  }

  // ── "Bunlardan hangisi …?" ──
  if (n.hangisi && c.onceki?.gosterilen.length) {
    const adaylar = c.onceki.gosterilen.map(id => c.katalog.find(p => p.id === id)).filter((p): p is Parfum => !!p);
    if (adaylar.length) {
      let sirali = gununSecimi({ adaylar, prefs: c.prefs, ph: c.ph, tarih, etkinlik: n.etkinlik ?? (n.zaman === 'aksam' ? 'bulusma' : 'gunluk'), hava: c.hava, gecmis: c.gecmis, zevk: c.zevk, dolaptan: true });
      if (n.zaman === 'aksam') sirali = [...sirali].sort((x, y) => Number(aksamMi(y.parfum)) - Number(aksamMi(x.parfum)));
      if (n.zaman === 'gunduz') sirali = [...sirali].sort((x, y) => Number(gunduzMu(y.parfum)) - Number(gunduzMu(x.parfum)));
      if (n.yogunluk === 'yogun') sirali = [...sirali].sort((x, y) => ({ kisa: 0, orta: 1, uzun: 2 } as Record<string, number>)[y.parfum.kalicilik] - ({ kisa: 0, orta: 1, uzun: 2 } as Record<string, number>)[x.parfum.kalicilik]);
      const ilk = sirali[0];
      const neye = n.zaman === 'aksam' ? 'akşam için' : n.zaman === 'gunduz' ? 'gündüz için' : n.yogunluk === 'yogun' ? 'kalıcılık için' : n.etkinlik ? `${ETKINLIK_ETIKET[n.etkinlik].label.toLocaleLowerCase('tr')} için` : 'sizin için';
      const kisisel = kisiselCumle(ilk.parfum, c, bugun);
      return bitir({
        metin: `Bunlardan ${neye} en iyisi ${ilk.parfum.isim}. ${ilk.gerekceler[0] ?? ''}${kisisel ? ` ${kisisel}` : ''}`.trim(),
        oneriler: kartNotlari(sirali.slice(0, 2), c, bugun),
        devam: ['Başka', 'Daha hafif bir seçenek', 'Bugün ne sıkayım?'],
      });
    }
  }

  // ── Kendim için (dolap veya katalog) ──
  if (n.tur === 'kendim' || (n.tur === 'belirsiz' && n.devamMi)) {
    const haric = new Set(n.baskaIste ? c.onceki?.gosterilen ?? [] : []);
    const filtre = (p: Parfum) =>
      butceUygun(p, n.butce) &&
      (!n.mevsim || (p.mevsim ?? []).includes(n.mevsim)) &&
      (!n.aileler.length || n.aileler.includes(p.tip) || (!!p.ikincilTip && n.aileler.includes(p.ikincilTip))) &&
      (!n.yogunluk || (n.yogunluk === 'hafif' ? p.yogunluk !== 'yogun' : p.yogunluk !== 'hafif'));
    const zamanFiltre = (ps: Parfum[]) => {
      if (!n.zaman) return ps;
      const z = ps.filter(n.zaman === 'aksam' ? aksamMi : gunduzMu);
      return z.length ? z : ps;
    };

    let dolapAday = zamanFiltre(c.dolap.filter(filtre));
    // "Başka" denip dolapta gösterilmemiş parfüm kalmadıysa katalogdan devam edilir
    const dolapBitti = haric.size > 0 && dolapAday.length > 0 && dolapAday.every(p => haric.has(p.id));
    if (haric.size && !dolapBitti) dolapAday = dolapAday.filter(p => !haric.has(p.id));
    const dolaptan = !dolapBitti && (n.kaynak === 'dolap' || (n.kaynak === 'otomatik' && dolapAday.length >= 1 && !n.butce));
    const katalogAday = zamanFiltre(c.katalog.filter(p => filtre(p) && !haric.has(p.id) && !c.dolap.some(d => d.id === p.id) && !(c.prefs.sevilmeyenParfumler ?? []).includes(p.id)));
    const adaylar = dolaptan ? dolapAday : katalogAday;
    const etkinlik = n.etkinlik ?? (n.zaman === 'aksam' ? 'bulusma' : 'gunluk');

    if (!adaylar.length) {
      const neden = n.kaynak === 'dolap' && !c.dolap.length ? 'Dolabınıza henüz parfüm eklemediniz.' : haric.size ? 'Bu koşullarda gösterecek başka parfüm kalmadı.' : 'Bu koşullara uyan bir parfüm bulamadım.';
      return bitir({ metin: `${neden} Koşulları biraz gevşeterek tekrar deneyebilirsiniz.`, oneriler: [], devam: ['Katalogdan öner', 'Bugün ne sıkayım?'] });
    }

    const secim = gununSecimi({ adaylar, prefs: c.prefs, ph: c.ph, tarih, etkinlik, hava: c.hava, gecmis: c.gecmis, zevk: c.zevk, dolaptan }).slice(0, dolaptan ? 3 : 4);
    const ilk = secim[0];
    const etk = n.etkinlik ? ETKINLIK_ETIKET[n.etkinlik].label.toLocaleLowerCase('tr') : n.zaman === 'aksam' ? 'bu akşam' : n.zaman === 'gunduz' ? 'gün içi' : null;
    const icin = etk ? `${buyukHarf(etk)} için` : 'Bugün için';
    const kisisel = kisiselCumle(ilk.parfum, c, bugun);
    const hava = havaCumlesi(c);
    const filtreMetni = [n.yogunluk === 'hafif' ? 'hafif' : n.yogunluk === 'yogun' ? 'kalıcı/iddialı' : '', n.mevsim ? trLower(n.mevsim) : '', n.aileler.length ? n.aileler.join(', ').toLocaleLowerCase('tr') : '', n.butce ? BUTCE_METNI[n.butce] : ''].filter(Boolean).join(', ');

    let metin: string;
    if (dolaptan) {
      const kalip = sec([
        `${icin} dolabınızdan en iyi seçim ${ilk.parfum.isim}.`,
        `${icin} ${ilk.parfum.isim} öneririm.`,
        `${isim ? `${isim}, ` : ''}${trLower(icin)} dolabınızdan ${ilk.parfum.isim}.`,
      ], tohum + ilk.parfum.id);
      metin = `${hava}${kalip} ${ilk.gerekceler[0] ?? ''}${kisisel ? ` ${kisisel}` : ''}${n.baskaIste ? ' (Önceki önerileri dışarıda bıraktım.)' : ''}`;
    } else {
      const neden = dolapBitti
        ? `Dolabınızdaki uygun ${c.dolap.length === 1 ? 'parfümü' : `${dolapAday.length} parfümün hepsini`} gösterdim; katalogdan `
        : c.dolap.length && n.kaynak !== 'katalog' && !n.butce ? 'Dolabınızda bu koşullara uyan yok; katalogdan ' : '';
      metin = `${hava}${neden}${neden ? '' : `${icin} `}teninize en uygun${filtreMetni ? ` ${filtreMetni}` : ''} ${haric.size ? 'diğer ' : ''}seçenekler. En başta ${ilk.parfum.isim}: ${trLower(ilk.gerekceler[0] ?? 'profilinizle uyumlu.')}${kisisel ? ` ${kisisel}` : ''}`;
    }

    const devam = dolaptan
      ? ['Başka', n.yogunluk === 'hafif' ? 'Daha kalıcı bir şey' : 'Daha hafif bir seçenek', 'Katalogdan yeni bir şey öner']
      : ['Başka', 'Daha uygun fiyatlı', 'Bunlardan hangisi akşam için?'];
    return bitir({
      metin: metin.replace(/\s+/g, ' ').trim(),
      oneriler: kartNotlari(secim, c, bugun),
      devam,
    });
  }

  // ── Anlaşılamadı: yine de kişisel bir başlangıç ──
  return bitir({
    metin: 'Sorunuzu tam anlayamadım. Nereye gideceğinizi, kime hediye alacağınızı, merak ettiğiniz parfümün adını ya da hangi parfüme benzer bir şey aradığınızı yazarsanız teninize ve kayıtlarınıza göre cevaplayayım.',
    oneriler: [],
    devam: c.dolap.length ? ['Bugün ne sıkayım?', ORNEK_SORULAR[4], ORNEK_SORULAR[5]] : ORNEK_SORULAR.slice(0, 3),
  });
}

// ───────── Bilgi cevapları — ten profilinize ve kayıtlarınıza göre ─────────

function bilgiCevabi(konu: BilgiKonusu, c: DanismanBaglami): Omit<DanismanCevabi, 'durum'> {
  const p = c.prefs;
  const m = c.zevk?.ogrenme;
  const kuru = p.ciltTipi === 'kuru';
  const yagli = p.ciltTipi === 'yagli';
  const sicak = p.vucutIsisi === 'sicak';

  // Kayıtlarına göre sende en uzun kalan (en az 1 akşam kaydı)
  const kayitlar = c.degerlendirmeler ?? [];
  const ort = new Map<string, { t: number; n: number }>();
  kayitlar.forEach(k => { const o = ort.get(k.parfumId) ?? { t: 0, n: 0 }; o.t += k.longevity; o.n++; ort.set(k.parfumId, o); });
  const enUzun = [...ort.entries()].sort((a, b) => b[1].t / b[1].n - a[1].t / a[1].n)[0];
  const enUzunP = enUzun ? c.katalog.find(x => x.id === enUzun[0]) : undefined;

  switch (konu) {
    case 'kalicilik': {
      const ipuclari = [
        kuru ? 'Teniniz kuru olduğu için en büyük etki nemden gelir: parfümden önce kokusuz bir nemlendirici (ya da çok ince vazelin) sürün.' : yagli ? 'Yağlı teniniz parfümü zaten iyi tutar; nemlendirici şart değil, asıl fark sıkılan noktalardan gelir.' : 'Duştan sonra, ten hâlâ hafif nemliyken sıkın; kokusuz nemlendirici kalıcılığı belirgin artırır.',
        'Nabız noktalarına (boyun yanları, bilek içi, dirsek içi) sıkın ve bileklerinizi ovuşturmayın; ovmak üst notaları hızla uçurur.',
        p.uygulamaYeri === 'sadece_kiyafet' ? 'Zaten kıyafete sıkıyorsunuz; kumaş kokuyu tende olduğundan uzun tutar.' : 'Bir fıs da kıyafete (ya da atkıya) sıkın; kumaş kokuyu tenden uzun tutar.',
        sicak ? 'Sıcak teniniz kokuyu hızlı yayıp hızlı tüketir; Eau de Parfum ve alt notası güçlü (odunsu, amber) parfümler size daha uzun eşlik eder.' : 'Eau de Toilette yerine Eau de Parfum, ferah yerine odunsu/amber alt notalar daha uzun kalır.',
      ];
      const kisisel = m?.genelKalicilik
        ? m.genelKalicilik.sapma < 0 ? ' Kayıtlarınıza göre teniniz parfümü tahminimizden çabuk tüketiyor; bu yüzden bu ipuçları sizin için özellikle önemli.' : ' Kayıtlarınıza göre teniniz parfümü tahminimizden iyi tutuyor.'
        : ' Akşam değerlendirmelerinizi kaydederseniz hangi parfümün sizde ne kadar kaldığını öğrenip size göre söyleyebilirim.';
      return {
        metin: `${ipuclari.join(' ')}${kisisel}${enUzunP ? ` Şu ana kadar sizde en uzun kalan: ${enUzunP.isim}.` : ''}`,
        oneriler: enUzunP ? [{ parfum: enUzunP, not: 'Kayıtlarınıza göre sizde en uzun kalan' }] : [],
        devam: ['Nereye sıkmalıyım?', 'Kaç kez sıkmalıyım?', 'Kalıcı bir parfüm öner'],
      };
    }
    case 'nereye':
      return {
        metin: `Isının kokuyu yaydığı noktalar: boyun yanları, kulak arkası, bilek içi ve dirsek içi. Saçınıza doğrudan değil, havaya sıkıp içinden geçerek uygulayın; alkol saçı kurutur.${p.kokuAlmaHassasiyeti === 'cok_yuksek' || p.kokuAlmaHassasiyeti === 'yuksek' ? ' Koku hassasiyetiniz olduğu için yüze yakın bölgeler yerine bilek ve göğsü tercih edin.' : ''} Açık renk ve ipek kumaşlara yakından sıkmayın, leke bırakabilir.`,
        oneriler: [],
        devam: ['Kaç kez sıkmalıyım?', 'Kalıcılığı nasıl artırırım?'],
      };
    case 'kac': {
      const kapali = p.ortam === 'kapali';
      return {
        metin: `Yoğunluğa göre: Eau de Cologne/Toilette 3–4, Eau de Parfum 2–3, Parfum (extrait) 1–2 fıs. ${kapali ? 'Gününüz çoğunlukla kapalı ortamda geçtiği için iş günlerinde 1–2 fıs yeterli; yakınınızdakileri rahatsız etmez.' : 'Açık havada ve akşamları bir fıs fazlası sorun olmaz.'} Kendi kokunuza kısa sürede alışırsınız; "kokmuyor" diye tekrar sıkmak çoğu zaman fazlası olur.`,
        oneriler: [],
        devam: ['Nereye sıkmalıyım?', 'Bugün ne sıkayım?'],
      };
    }
    case 'numune':
      return {
        metin: 'Kesinlikle mantıklı. Parfüm kağıtta değil tende karar verilir: numuneyi 2–3 gün, sabah sıkıp akşama kadar izleyin. Teninizde nasıl açıldığını ve ne kadar kaldığını uygulamaya kaydederseniz önerileriniz de buna göre gelişir. Hediye için de önce numune ya da küçük boy (dekant) iyi bir yoldur.',
        oneriler: [],
        devam: ['Mağazada nasıl deneyeyim?', 'Bana yeni ne önerirsin?'],
      };
    case 'saklama':
      return {
        metin: 'Işık, ısı ve hava parfümün düşmanıdır. Kutusunda ya da dolapta, serin ve karanlık bir yerde saklayın; banyo (nem ve ısı değişimi) en kötü yerdir. Buzdolabı gerekmez. Kapağı kapalı tutulan bir şişe 3–5 yıl rahatça dayanır; üst notalar ekşimeye başlarsa bozulmuştur.',
        oneriler: [],
        devam: ['Kalıcılığı nasıl artırırım?'],
      };
    case 'katman': {
      const dolap = c.dolap;
      return {
        metin: `Önce daha ağır ve kalıcı olanı (odunsu, amber, vanilya) sıkın, üstüne daha hafif ve ferah olanı ekleyin; tersi yapılırsa hafif koku kaybolur. Aynı aileden ya da ortak bir notası olan iki parfüm en güvenli eşleşmedir.${dolap.length >= 2 ? ' Dolabınızdaki parfümlerle hazır eşleşmeler için Katmanlama aracına bakabilirsiniz.' : ''}`,
        oneriler: [],
        devam: ['Bugün ne sıkayım?'],
      };
    }
    case 'ph': {
      const ph = c.ph;
      const egilim = ph < 4.85 ? 'asidik eğilimli' : ph > 5.25 ? 'nötre yakın' : 'dengeli';
      const etki = ph < 4.85 ? 'narenciye ve ferah notalar sizde canlı açılır; çok tatlı kompozisyonlar zamanla keskinleşebilir' : ph > 5.25 ? 'odunsu ve amber alt notalar sizde sıcak ve dolgun kalır' : 'çoğu aile sizde şişedeki karakterine yakın açılır';
      return {
        metin: `Teninizin cevaplarınızdan tahmin edilen eğilimi ${egilim} (~${(ph - 0.25).toFixed(1)}–${(ph + 0.25).toFixed(1)}): ${etki}. Bu bir ölçüm değil tahmindir; kalıcılıkta asıl belirleyici teninizin yağlılığı ve ısısıdır.${p.phInfo?.biliyorMu === 'biliyorum' ? ' Test şeridiyle ölçtüğünüz değeri kullanıyoruz.' : ' Test şeridiyle ölçerseniz profilinize girebilirsiniz.'}`,
        oneriler: [],
        devam: ['Kalıcılığı nasıl artırırım?', 'Bana uygun aileler hangileri?'],
      };
    }
  }
}
