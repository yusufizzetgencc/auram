/**
 * Öneri Puanlama Motoru (100 puan üzerinden) — saf fonksiyonlar, UI'dan bağımsız.
 *
 * Ağırlıklar (toplam 100) — değiştirirsen CLAUDE.md §3.2 ve testleri güncelle:
 */
import { trLower } from '../utils/text';
import { KokuTipi, Parfum, ParfumPHSkor, RecommendationResult, UserPreferences } from '../types';
import { hesaplaParfumPHSkoruPure } from './perfume-chemistry';
import { getEffectivePH } from './ph-calculator';
import { hesaplaDealbreakerCezasi, hesaplaHassasiyetCezasi } from './penalties';
import { ogrenmeDuzeltmesi } from './learning';
import { ZevkBaglami, zevkBaglami, zevkDuzeltmesi } from './similarity';

export const AGIRLIKLAR = {
  tenPerformansi: 20,  // yağlılık/ısı × nota katmanları (kalıcılık & yayılım)
  phUyumu: 10,         // asidite eğilimi × nota yapısı (kanıtı zayıf → düşük ağırlık)
  kokuAilesi: 15,
  aura: 15,
  mevsim: 10,
  isiYogunluk: 10,
  konsantrasyon: 5,
  kullanimAmaci: 5,
  ortam: 5,
  cinsiyet: 3,
  butce: 2,            // bütçe üstündekiler ayrıca cezalandırılır (BUTCE_ASIM_CEZASI)
} as const;

/** Onboarding'deki üç güç seviyesi: hafif (EdC/EdT/Fraîche) · dengeli (EdP) · güçlü (Parfum) */
const KONS_GRUP: Record<string, string> = {
  eau_fraiche: 'hafif', eau_de_cologne: 'hafif', eau_de_toilette: 'hafif', eau_de_parfum: 'dengeli', parfum: 'guclu',
};

const BUTCE_SIRA = ['ekonomik', 'orta', 'premium', 'luks'] as const;
/** Bütçenin her bir kademe üstü için ceza */
export const BUTCE_ASIM_CEZASI = 6;

/** Kullanıcının boş bıraktığı kriterler herkese aynı nötr krediyi verir (yüzdeler şişmez/çökmez). */
export const NOTR_KREDI = 0.6;

const AURA_ESLESME: Record<string, string[]> = {
  temiz: ['taze', 'dogal', 'profesyonel'],
  gizemli: ['gizemli', 'mistik', 'sofistike'],
  cekici: ['cekici', 'sicak', 'romantik'],
  dinamik: ['enerjik', 'dinamik', 'sportif'],
  otoriter: ['profesyonel', 'cesur', 'sofistike'],
};

export const AURA_ETIKET: Record<string, string> = {
  temiz: 'temiz ve zarif',
  gizemli: 'gizemli ve derin',
  cekici: 'çekici ve baştan çıkarıcı',
  dinamik: 'dinamik ve enerjik',
  otoriter: 'otoriter ve saygın',
};

/** Kart/başlıklarda kullanılan aura adı */
export const AURA_BASLIK: Record<string, string> = {
  temiz: 'Temiz & Zarif',
  gizemli: 'Gizemli & Derin',
  cekici: 'Çekici & Baştan Çıkarıcı',
  dinamik: 'Dinamik & Enerjik',
  otoriter: 'Otoriter & Saygın',
};

const ISI_YOGUNLUK: Record<string, Record<string, number>> = {
  sicak: { hafif: 1.0, orta: 0.65, yogun: 0.25 },
  serin: { hafif: 0.45, orta: 0.75, yogun: 1.0 },
  dengeli: { hafif: 0.75, orta: 0.9, yogun: 0.7 },
};

/** ten: gerekçe kullanıcının ten profilinden mi geliyor (uygulamanın asıl farkı → önce gösterilir) */
interface Gerekce { metin: string; agirlik: number; ten?: boolean }

/** Cinsiyet algısı tercihi bir FİLTREDİR: maskülen isteyene kadın parfümü önerilmez. */
export const cinsiyetUygunMu = (parfum: Parfum, p: UserPreferences): boolean => {
  if (p.cinsiyetAlgisi === 'maskulen') return parfum.cinsiyet !== 'kadın';
  if (p.cinsiyetAlgisi === 'feminen') return parfum.cinsiyet !== 'erkek';
  return true;
};

export interface SkorDetay extends RecommendationResult {
  kirmiziCizgi: boolean;
}

/**
 * @param zevk Sevdiğiniz/sevmediğiniz parfümler (bkz. similarity.ts) ve öğrenilen model (learning.ts). Verilirse skora
 *             en fazla +10 / −12 zevk düzeltmesi ve ±15 öğrenme düzeltmesi eklenir; AGIRLIKLAR değişmez.
 */
export const skorlaParfum = (parfum: Parfum, p: UserPreferences, userPH: number, zevk?: ZevkBaglami): SkorDetay => {
  const W = AGIRLIKLAR;
  const gerekceler: Gerekce[] = [];
  const uyumKategorileri: RecommendationResult['uyumKategorileri'] = [];
  let score = 0;
  const phSkor: ParfumPHSkor = hesaplaParfumPHSkoruPure(parfum, userPH, p.ciltTipi);
  const sadeceKiyafet = p.uygulamaYeri === 'sadece_kiyafet';

  // 1. Ten performansı (kalıcılık/yayılım)
  const perf = (phSkor.toplamPerformans / 100) * W.tenPerformansi;
  score += perf;
  if (p.ciltTipi === 'yagli' && parfum.notalar.ust.length > 0 && !sadeceKiyafet) {
    gerekceler.push({ metin: 'Yağlı cilt yapınız bu parfümün üst notalarını normalden daha uzun tutacak.', agirlik: perf * 0.6, ten: true });
  } else if (p.ciltTipi === 'kuru' && parfum.kalicilik === 'uzun') {
    gerekceler.push({ metin: 'Güçlü alt notaları, kuru teninizde bile gün boyu kalıcılık sağlar.', agirlik: perf * 0.6, ten: true });
  } else if (phSkor.toplamPerformans >= 78) {
    gerekceler.push({ metin: 'Ten yapınızda yüksek kalıcılık ve dengeli yayılım bekleniyor.', agirlik: perf * 0.5, ten: true });
  }
  uyumKategorileri.push({
    kategori: 'Ten Performansı',
    uyum: phSkor.toplamPerformans >= 60,
    detay: phSkor.toplamPerformans >= 78 ? 'Yüksek kalıcılık ve yayılım' : phSkor.toplamPerformans >= 60 ? 'Dengeli performans' : 'Teninizde hızlı uçabilir',
  });

  // 2. pH / asidite eğilimi uyumu
  if (sadeceKiyafet) {
    score += W.phUyumu; // ten teması yok → pH riski devre dışı
    uyumKategorileri.push({ kategori: 'Ten Kimyası', uyum: true, detay: 'Kıyafete uygulandığı için ten kimyası etkisi yok' });
  } else {
    const ph = (phSkor.phUyumSkoru / 100) * W.phUyumu;
    score += ph;
    if (phSkor.phUyumSkoru >= 85) gerekceler.push({ metin: `${phSkor.aciklama}.`, agirlik: ph * 0.8, ten: true });
    uyumKategorileri.push({ kategori: 'Ten Kimyası', uyum: phSkor.phUyumSkoru >= 60, detay: phSkor.aciklama });
  }

  // 3. Koku ailesi
  if (p.kokuTipleri.length > 0) {
    const ana = p.kokuTipleri.includes(parfum.tip as KokuTipi);
    const ikincil = !!parfum.ikincilTip && p.kokuTipleri.includes(parfum.ikincilTip as KokuTipi);
    const oran = ana ? (ikincil ? 1 : 0.9) : ikincil ? 0.5 : 0;
    score += oran * W.kokuAilesi;
    if (ana) gerekceler.push({ metin: `Sevdiğiniz ${trLower(parfum.tip)} koku ailesinin güçlü bir örneği.`, agirlik: oran * W.kokuAilesi * 0.8 });
    uyumKategorileri.push({ kategori: 'Koku Ailesi', uyum: oran > 0, detay: ana ? parfum.tip : ikincil ? `${parfum.ikincilTip} dokunuşu` : 'Seçtiğiniz ailelerin dışında' });
  } else {
    score += NOTR_KREDI * W.kokuAilesi;
  }

  // 4. Aura
  if (p.aura) {
    const istenen = AURA_ESLESME[p.aura] || [];
    const ozellikler: string[] = [...(parfum.izlenim || []), ...(parfum.kisilikTipi || [])];
    const eslesen = istenen.filter(o => ozellikler.includes(o)).length;
    const oran = eslesen >= 2 ? 1 : eslesen === 1 ? 0.75 : 0.1;
    score += oran * W.aura;
    if (eslesen > 0) gerekceler.push({ metin: `Arkanızda bırakmak istediğiniz ${AURA_ETIKET[p.aura]} izi yansıtıyor.`, agirlik: oran * W.aura * 0.9 });
    uyumKategorileri.push({ kategori: 'Aura', uyum: eslesen > 0, detay: eslesen > 0 ? AURA_ETIKET[p.aura] : 'Farklı bir karakter' });
  } else {
    score += NOTR_KREDI * W.aura;
  }

  // 5. Mevsim
  const mevsimler = parfum.mevsim || [];
  if (!p.mevsim) {
    score += NOTR_KREDI * W.mevsim;
  } else if (p.mevsim === 'Tüm Mevsimler') {
    score += (mevsimler.length >= 3 || mevsimler.includes('Tüm Mevsimler') ? 1 : 0.7) * W.mevsim;
  } else if (mevsimler.includes(p.mevsim) || mevsimler.includes('Tüm Mevsimler')) {
    score += W.mevsim;
    gerekceler.push({ metin: `${p.mevsim} için ideal bir seçim.`, agirlik: W.mevsim * 0.4 });
  } else {
    score += 0.2 * W.mevsim;
    uyumKategorileri.push({ kategori: 'Mevsim', uyum: false, detay: `${p.mevsim} için en uygun seçenek olmayabilir` });
  }

  // 6. Vücut ısısı × yoğunluk
  if (p.vucutIsisi) {
    const oran = ISI_YOGUNLUK[p.vucutIsisi]?.[parfum.yogunluk] ?? 0.7;
    score += oran * W.isiYogunluk;
    if (p.vucutIsisi === 'serin' && parfum.yogunluk === 'yogun') {
      gerekceler.push({ metin: 'Serin ten yapınız bu yoğun parfümü nazikçe açacak.', agirlik: W.isiYogunluk, ten: true });
    } else if (p.vucutIsisi === 'sicak' && parfum.yogunluk === 'hafif') {
      gerekceler.push({ metin: 'Sıcak teniniz bu hafif kompozisyonu canlı ve fark edilir kılacak.', agirlik: W.isiYogunluk, ten: true });
    }
  } else {
    score += NOTR_KREDI * W.isiYogunluk;
  }

  // 7. Konsantrasyon
  if (!p.konsantrasyonTercihi || p.konsantrasyonTercihi === 'fark_etmez' || !parfum.konsantrasyon) {
    score += (p.konsantrasyonTercihi && p.konsantrasyonTercihi !== 'fark_etmez' ? NOTR_KREDI : 1) * W.konsantrasyon;
  } else if (KONS_GRUP[parfum.konsantrasyon] === KONS_GRUP[p.konsantrasyonTercihi]) {
    score += W.konsantrasyon;
  } else {
    score += 0.3 * W.konsantrasyon;
  }

  // 8. Kullanım amacı
  if (!p.kullanimAmaci || p.kullanimAmaci.length === 0) {
    score += NOTR_KREDI * W.kullanimAmaci;
  } else if (p.kullanimAmaci.some(a => parfum.kullanimAmaci?.includes(a))) {
    score += W.kullanimAmaci;
  } else {
    score += 0.2 * W.kullanimAmaci;
  }

  // 9. Ortam
  if (!p.ortam) {
    score += NOTR_KREDI * W.ortam;
  } else if (p.ortam === 'kapali' && parfum.yogunluk === 'yogun') {
    uyumKategorileri.push({ kategori: 'Ortam', uyum: false, detay: 'Kapalı ortam için yoğun olabilir' });
  } else if (parfum.ortam === p.ortam || parfum.ortam === 'her_ikisi' || p.ortam === 'her_ikisi') {
    score += W.ortam;
  } else {
    score += 0.4 * W.ortam;
  }

  // 10. Cinsiyet algısı (filtre dışındakiler: tam unisex tercihine bonus)
  if (!p.cinsiyetAlgisi || p.cinsiyetAlgisi !== 'unisex' || parfum.cinsiyet === 'unisex') {
    score += W.cinsiyet;
  } else {
    score += 0.4 * W.cinsiyet;
  }

  // 11. Bütçe
  if (!p.butceTercihi || p.butceTercihi === 'farketmez' || !parfum.fiyatAraligi) {
    score += NOTR_KREDI * W.butce;
  } else {
    const asim = BUTCE_SIRA.indexOf(parfum.fiyatAraligi) - BUTCE_SIRA.indexOf(p.butceTercihi);
    if (asim <= 0) {
      score += W.butce;
    } else {
      score -= asim * BUTCE_ASIM_CEZASI;
      uyumKategorileri.push({ kategori: 'Bütçe', uyum: false, detay: 'Belirttiğiniz bütçenin üzerinde' });
    }
  }

  // Cezalar
  const dealbreaker = hesaplaDealbreakerCezasi(parfum, p.kacinilacakNotalar || []);
  if (dealbreaker.kirmiziCizgi) {
    score -= dealbreaker.ceza;
    uyumKategorileri.push({ kategori: 'Kaçındığınız Notalar', uyum: false, detay: `İçeriyor: ${dealbreaker.ihlalEdilenler.join(', ')}` });
  }
  const hassasiyetCezasi = hesaplaHassasiyetCezasi(parfum, p.kokuAlmaHassasiyeti);
  if (hassasiyetCezasi > 0) {
    score -= hassasiyetCezasi;
    uyumKategorileri.push({ kategori: 'Koku Hassasiyeti', uyum: false, detay: 'Hassas burunlar için yoğun olabilir' });
  }

  // Kişisel zevk: deneyip sevdiğiniz/sevmediğiniz parfümlere benzerlik
  const zd = zevkDuzeltmesi(parfum, zevk);
  if (zd.delta) score += zd.delta;
  if (zd.gerekce) gerekceler.push({ metin: zd.gerekce, agirlik: 9, ten: false });
  if (zd.uyari) uyumKategorileri.push({ kategori: 'Zevkiniz', uyum: false, detay: zd.uyari });

  // Öğrenen motor: davranışınızdan ve akşam kayıtlarınızdan öğrenilenler (en fazla ±15, bkz. learning.ts)
  const od = ogrenmeDuzeltmesi(parfum, zevk?.ogrenme, zevk?.etkinlik);
  if (od.delta) score += od.delta;
  if (od.gerekce) gerekceler.push({ metin: od.gerekce, agirlik: od.ten ? perf + 1 : 8.5, ten: !!od.ten });
  if (od.uyari) uyumKategorileri.push({ kategori: 'Kayıtlarınız', uyum: false, detay: od.uyari });

  const maxScore = 100;
  const matchPercentage = Math.max(0, Math.min(100, Math.round(score)));

  // Sıralama: en güçlü TEN gerekçesi önce, ardından ağırlığa göre diğerleri
  const sirali = [...gerekceler].sort((a, b) => b.agirlik - a.agirlik);
  const enIyiTen = sirali.find(g => g.ten);
  const matchReasons = (enIyiTen ? [enIyiTen, ...sirali.filter(g => g !== enIyiTen)] : sirali)
    .map(g => g.metin)
    .filter((m, i, arr) => arr.indexOf(m) === i);
  if (matchReasons.length === 0) matchReasons.push('Genel profilinizle uyumlu, dengeli bir seçim.');

  return {
    parfum,
    score,
    maxScore,
    matchPercentage,
    matchReasons,
    uyumKategorileri,
    phSkor,
    kirmiziCizgi: dealbreaker.kirmiziCizgi,
  };
};

export const ONERI_SAYISI = 5;

/**
 * Tüm katalog için öneri listesi.
 * @param userPH verilmezse tercihlerden yeniden hesaplanır (state gecikmesine karşı güvenli).
 */
export const getRecommendationsPure = (
  parfumler: Parfum[],
  preferences: UserPreferences,
  userPH?: number,
  limit: number = ONERI_SAYISI,
  /** Öğrenen model dahil hazır zevk bağlamı (AppContext verir); yoksa tercihlerden kurulur */
  zevkHazir?: ZevkBaglami,
): RecommendationResult[] => {
  const ph = userPH ?? getEffectivePH(preferences);
  const zevk = zevkHazir ?? zevkBaglami(parfumler, preferences);
  // Kullanıcının zaten denediği (sevdiği/sevmediği) parfümler yeni öneri olarak tekrar gösterilmez
  const denenmis = new Set([...(preferences.sevilenParfumler ?? []), ...(preferences.sevilmeyenParfumler ?? [])]);
  const skorlar = parfumler
    .filter(pf => cinsiyetUygunMu(pf, preferences) && !denenmis.has(pf.id))
    .map(pf => skorlaParfum(pf, preferences, ph, zevk))
    .sort((a, b) => b.score - a.score);

  // Kırmızı çizgiye takılanlar, yeterli temiz alternatif varsa tamamen elenir
  const temiz = skorlar.filter(s => !s.kirmiziCizgi);
  const havuz = temiz.length >= limit ? temiz : [...temiz, ...skorlar.filter(s => s.kirmiziCizgi)];

  return havuz.slice(0, limit).map(({ kirmiziCizgi: _k, ...rest }) => rest);
};
