/**
 * Ten Profili & pH Eğilimi Tahmini
 *
 * ÖNEMLİ: Bu modül pH ÖLÇMEZ. Anket cevaplarından, literatürdeki genel eğilimlere
 * dayanan küçük katsayılarla bir pH ARALIĞI tahmin eder.
 *
 * Dayanak (özet):
 *  - Sağlıklı ten yüzeyi pH'ı ~4.1–5.8; yıkanmamış "doğal" değer ortalama ~4.7,
 *    günlük yıkama sonrası tipik ölçüm ~5.0 (Lambers ve ark., 2006 — PubMed 18489300).
 *    Bu yüzden başlangıç 5.0, üst sınır 6.0 (sağlıklı tende 6+ nadirdir).
 *  - Kuru / bariyeri zayıf ciltte pH genelde daha YÜKSEK bildirilir (atopik dermatit
 *    literatürü). Eski modelde bu yön tersti.
 *  - Ter pH'ı terleme hızı arttıkça yükselme eğilimindedir (zayıf kanıt, küçük katsayı).
 *  - Gümüş kararması asitten değil kükürt bileşiklerinden kaynaklanır → çok zayıf sinyal.
 *  - Beslenme ve su tüketiminin ten yüzeyi pH'ını anlamlı değiştirdiğine dair güçlü
 *    kanıt yok → pH'a etkisi 0 (soru UI'dan kaldırıldı).
 *
 * Parfümün tende nasıl davrandığını pH'tan çok YAĞLILIK (kalıcılık) ve ISI
 * (buharlaşma/yayılım) belirler; bu yüzden sonuç bir "Ten Profili" olarak döner.
 */

import { PHAraligi, PHHesapSonucu, TenProfili, UserPreferences } from '../types';

export const PH_BASE = 5.0;
export const PH_MIN = 4.3;
export const PH_MAX = 6.0;

/** Eğilim eşikleri (dar bir sağlıklı aralık içinde göreli) */
export const getPHAraligi = (ph: number): PHAraligi => {
  if (ph < 4.85) return 'asidik';
  if (ph > 5.25) return 'bazik';
  return 'normal';
};

/** Kullanıcıya gösterilecek etiket — "bazik ten" demiyoruz, sağlıklı ten bazik değildir. */
export const getPHAraligiEtiketi = (aralik: PHAraligi): string => {
  if (aralik === 'asidik') return 'Asidik Eğilim';
  if (aralik === 'bazik') return 'Nötre Yakın Eğilim';
  return 'Dengeli';
};

/** -1 (belirgin asidik) … +1 (nötre yakın) arası göreli eğilim */
export const getPHEgilimi = (ph: number): number =>
  Math.max(-1, Math.min(1, (ph - PH_BASE) / 0.4));

const round2 = (n: number) => Math.round(n * 100) / 100;

export const hesaplaTenProfili = (p: UserPreferences, ph: number): TenProfili => {
  const yagMap: Record<string, number> = { kuru: 25, normal: 50, karma: 55, yagli: 80 };
  let yaglilik = p.ciltTipi ? yagMap[p.ciltTipi] ?? 50 : 50;

  const isiMap: Record<string, number> = { serin: 30, dengeli: 50, sicak: 75 };
  let isi = p.vucutIsisi ? isiMap[p.vucutIsisi] ?? 50 : 50;
  if (p.terlemeOrani === 'cok') isi += 10;
  if (p.terlemeOrani === 'az') isi -= 5;
  isi = Math.max(0, Math.min(100, isi));

  // Kalıcılık: yağ kokuyu tutar, yüksek ısı buharlaşmayı hızlandırır.
  // Kullanıcının kendi gözlemi ("parfümler bende ne kadar kalıyor") en doğrudan sinyaldir.
  const gozlemEtkisi: Record<string, number> = { lt2: -18, '2-4': -6, '4-6': 6, '6+': 16 };
  const gozlem = p.gozlenenKalicilik ? gozlemEtkisi[p.gozlenenKalicilik] ?? 0 : 0;
  const kalicilikEndeksi = Math.round(Math.max(0, Math.min(100, 50 + (yaglilik - 50) * 0.7 - (isi - 50) * 0.3 + gozlem)));
  // Yayılım: ısı kokuyu yukarı taşır
  const yayilimEndeksi = Math.round(Math.max(0, Math.min(100, 50 + (isi - 50) * 0.8 + (yaglilik - 50) * 0.2)));

  return {
    yaglilik,
    isi,
    asiditeEgilimi: round2(getPHEgilimi(ph)),
    kalicilikEndeksi,
    yayilimEndeksi,
  };
};

// Saf (Pure) pH Hesaplama Fonksiyonu - Side effect içermez
export const hesaplaPHPure = (preferences: UserPreferences): PHHesapSonucu => {
  const ciltMap: Record<string, number> = { kuru: 0.15, yagli: -0.1, karma: 0, normal: 0 };
  const ciltTipiEtkisi = preferences.ciltTipi ? ciltMap[preferences.ciltTipi] ?? 0 : 0;

  const terlemeEtkisi = preferences.terlemeOrani === 'cok' ? 0.1 : 0;

  let gumusEtkisi = 0;
  if (preferences.gumusOksitlenme === 'asidik') gumusEtkisi = -0.05;
  if (preferences.gumusOksitlenme === 'notr_alkali') gumusEtkisi = 0.03;

  // Kişinin kendi gözlemi — davranışsal en güçlü sinyal
  let reaksiyonEtkisi = 0;
  if (preferences.parfumReaksiyonu === 'eksi_uzaklasir') reaksiyonEtkisi = -0.15;
  if (preferences.parfumReaksiyonu === 'tatli_pudrali') reaksiyonEtkisi = 0.1;

  const raw = PH_BASE + ciltTipiEtkisi + terlemeEtkisi + gumusEtkisi + reaksiyonEtkisi;
  const tahminiPH = round2(Math.max(PH_MIN, Math.min(PH_MAX, raw)));
  const aralik = getPHAraligi(tahminiPH);

  // Belirsizlik: insanlar arası doğal yayılım ~±0.45; bilgi veren her cevap aralığı daraltır.
  const bilgiVerenCevap = [
    preferences.ciltTipi,
    preferences.terlemeOrani,
    preferences.parfumReaksiyonu && preferences.parfumReaksiyonu !== 'bilmiyorum' ? preferences.parfumReaksiyonu : null,
    preferences.gumusOksitlenme && preferences.gumusOksitlenme !== 'emin_degil' ? preferences.gumusOksitlenme : null,
  ].filter(Boolean).length;
  const yariGenislik = Math.max(0.25, 0.45 - bilgiVerenCevap * 0.05);
  const aralikMin = round2(Math.max(PH_MIN, tahminiPH - yariGenislik));
  const aralikMax = round2(Math.min(PH_MAX, tahminiPH + yariGenislik));

  // Anket tabanlı tahmin asla %75'i geçmez; gerçek ölçüm (test şeridi) girilirse %95 kullanılır.
  const guvenilirlik = Math.min(75, 35 + bilgiVerenCevap * 10);

  let aciklama: string;
  if (aralik === 'asidik') {
    aciklama = 'Teniniz asidik eğilimli görünüyor. Narenciye ve ferah notalar sizde canlı açılır; çok tatlı kompozisyonlar zamanla keskinleşebilir.';
  } else if (aralik === 'bazik') {
    aciklama = 'Teniniz nötre yakın eğilimli görünüyor. Odunsu, amber ve sıcak alt notalar sizde yumuşak ve dolgun hissedilir.';
  } else {
    aciklama = 'Teniniz dengeli bir aralıkta. Çoğu parfüm şişedeki karakterine yakın açılır.';
  }

  return {
    tahminiPH,
    aralik,
    guvenilirlik,
    aciklama,
    aralikMin,
    aralikMax,
    tenProfili: hesaplaTenProfili(preferences, tahminiPH),
    faktorler: {
      ciltTipiEtkisi,
      gumusEtkisi,
      suTuketimiCarpani: 1,
      beslenmeEtkisi: 0,
      terlemeEtkisi,
      reaksiyonEtkisi,
    },
  };
};

/**
 * Gerçek ölçüm girildiyse onu, yoksa cevaplardan HER SEFERİNDE yeniden hesapla.
 * (Kayıtlı tahminiDeger'e güvenmiyoruz: eski modelden kalmış veya state güncellenmeden
 * okunmuş olabilir — ilk öneri listesinin pH'ı yok sayması hatası buradan çıkıyordu.)
 */
export const getEffectivePH = (preferences: UserPreferences): number => {
  const info = preferences.phInfo;
  if (info?.biliyorMu === 'biliyorum' && info.deger) return info.deger;
  return hesaplaPHPure(preferences).tahminiPH;
};
