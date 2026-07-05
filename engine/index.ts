import { UserPreferences, PHHesapSonucu, PHAraligi, Parfum, ParfumPHSkor, CiltTipi } from '../types';

export const getPHAraligi = (ph: number): PHAraligi => {
  if (ph < 5.0) return 'asidik';
  if (ph > 6.0) return 'bazik';
  return 'normal';
};

// Saf (Pure) pH Hesaplama Fonksiyonu - Side effect içermez, render anında çağrılabilir
export const hesaplaPHPure = (preferences: UserPreferences): PHHesapSonucu => {
  let tahminiPH = 5.5; 

  let ciltTipiAsidik = 0, ciltTipiAlkali = 0;
  let gumusAsidik = 0, gumusAlkali = 0;
  let beslenmeAsidik = 0, beslenmeAlkali = 0;
  let terlemeAsidik = 0;
  let reaksiyonAsidik = 0, reaksiyonAlkali = 0;
  let suAsidik = 0;
  let suTuketimiCarpani = 1.0;

  if (preferences.ciltTipi === 'kuru') ciltTipiAsidik += 0.2;
  if (preferences.ciltTipi === 'yagli') ciltTipiAlkali += 0.2;

  if (preferences.gumusOksitlenme === 'asidik') gumusAsidik += 0.5;
  if (preferences.gumusOksitlenme === 'notr_alkali') gumusAlkali += 0.3;

  if (preferences.beslenmeAliskanligi === 'asidik') beslenmeAsidik += 0.4;
  if (preferences.beslenmeAliskanligi === 'alkali') beslenmeAlkali += 0.4;

  if (preferences.terlemeOrani === 'cok') terlemeAsidik += 0.3;
  
  if (preferences.parfumReaksiyonu === 'tatli_pudrali') reaksiyonAlkali += 0.3;
  if (preferences.parfumReaksiyonu === 'eksi_uzaklasir') reaksiyonAsidik += 0.4;

  if (preferences.suTuketimi === 'az') suAsidik += 0.3;
  if (preferences.suTuketimi === 'cok') suTuketimiCarpani = 0.5;

  let asidikEtki = ciltTipiAsidik + gumusAsidik + beslenmeAsidik + terlemeAsidik + reaksiyonAsidik + suAsidik;
  let alkaliEtki = ciltTipiAlkali + gumusAlkali + beslenmeAlkali + reaksiyonAlkali;

  asidikEtki *= suTuketimiCarpani;
  alkaliEtki *= suTuketimiCarpani;

  tahminiPH = tahminiPH - asidikEtki + alkaliEtki;
  tahminiPH = Math.max(4.0, Math.min(7.0, Number(tahminiPH.toFixed(2))));
  
  const aralik = getPHAraligi(tahminiPH);

  let guvenilirlik = 50;
  if (preferences.ciltTipi) guvenilirlik += 5;
  
  if (preferences.gumusOksitlenme === 'asidik' || preferences.gumusOksitlenme === 'notr_alkali') guvenilirlik += 10;
  else if (preferences.gumusOksitlenme === 'emin_degil') guvenilirlik -= 5;
  
  if (preferences.beslenmeAliskanligi) guvenilirlik += 10;
  if (preferences.parfumReaksiyonu) guvenilirlik += 15;
  if (preferences.suTuketimi) guvenilirlik += 5;
  if (preferences.terlemeOrani) guvenilirlik += 10;

  guvenilirlik = Math.max(0, Math.min(100, guvenilirlik));

  let aciklama = '';
  if (aralik === 'asidik') {
    aciklama = 'Cildiniz asidik pH\'a sahip (Gümüş kararması veya beslenme tarzı etken). Narenciye ve ferah notalar sizde çok iyi açılırken, tatlı kokular ekşiyebilir.';
  } else if (aralik === 'bazik') {
    aciklama = 'Cildiniz bazik/alkali eğilimli. Alt notalar (odunsu, amber, vanilya) sizde daha sıcak ve kalıcı olur.';
  } else {
    aciklama = 'Cildiniz nötr pH dengesinde. Çoğu parfüm şişedeki kokusunu teninizde doğrudan yansıtır.';
  }

  return {
    tahminiPH,
    aralik,
    guvenilirlik,
    aciklama,
    faktorler: {
      ciltTipiEtkisi: Number(((ciltTipiAlkali - ciltTipiAsidik) * suTuketimiCarpani).toFixed(2)),
      gumusEtkisi: Number(((gumusAlkali - gumusAsidik) * suTuketimiCarpani).toFixed(2)),
      suTuketimiCarpani,
      beslenmeEtkisi: Number(((beslenmeAlkali - beslenmeAsidik) * suTuketimiCarpani).toFixed(2)),
      terlemeEtkisi: Number((-terlemeAsidik * suTuketimiCarpani).toFixed(2)),
      reaksiyonEtkisi: Number(((reaksiyonAlkali - reaksiyonAsidik) * suTuketimiCarpani).toFixed(2)),
    }
  };
};

// Saf (Pure) Parfüm pH Skor Hesaplama Fonksiyonu - Side effect içermez
export const hesaplaParfumPHSkoruPure = (parfum: Parfum, userPH: number, ciltTipi: CiltTipi | null): ParfumPHSkor => {
  const { phUyumu, notaKalicilik } = parfum;
  
  let phUyumSkoru = 0;
  if (userPH >= phUyumu.minPH && userPH <= phUyumu.maxPH) {
    const idealFark = Math.abs(userPH - phUyumu.idealPH);
    phUyumSkoru = Math.max(0, 100 - (idealFark * 20));
  } else {
    const minFark = Math.abs(userPH - phUyumu.minPH);
    const maxFark = Math.abs(userPH - phUyumu.maxPH);
    const enYakinFark = Math.min(minFark, maxFark);
    phUyumSkoru = Math.max(0, 50 - (enYakinFark * 25));
  }

  const isAsidik = userPH < 5.0;
  const isBazik = userPH > 6.0;
  const isKuru = ciltTipi === 'kuru';
  const isYagli = ciltTipi === 'yagli';

  const ustMod = notaKalicilik.ust;
  const ortaMod = notaKalicilik.orta;
  const altMod = notaKalicilik.alt;

  let ustNotaPerformansi = 70;
  let ortaNotaPerformansi = 70;
  let altNotaPerformansi = 70;

  if (isAsidik) {
    ustNotaPerformansi += ustMod.asidikCilt * 30;
    ortaNotaPerformansi += ortaMod.asidikCilt * 30;
    altNotaPerformansi += altMod.asidikCilt * 30;
  } else if (isBazik) {
    ustNotaPerformansi += ustMod.bazikCilt * 30;
    ortaNotaPerformansi += ortaMod.bazikCilt * 30;
    altNotaPerformansi += altMod.bazikCilt * 30;
  }

  if (isKuru) {
    ustNotaPerformansi += ustMod.kuruCilt * 20;
    ortaNotaPerformansi += ortaMod.kuruCilt * 20;
    altNotaPerformansi += altMod.kuruCilt * 20;
  } else if (isYagli) {
    ustNotaPerformansi += ustMod.yagliCilt * 20;
    ortaNotaPerformansi += ortaMod.yagliCilt * 20;
    altNotaPerformansi += altMod.yagliCilt * 20;
  }

  ustNotaPerformansi = Math.min(100, Math.max(0, ustNotaPerformansi));
  ortaNotaPerformansi = Math.min(100, Math.max(0, ortaNotaPerformansi));
  altNotaPerformansi = Math.min(100, Math.max(0, altNotaPerformansi));

  const toplamPerformans = (ustNotaPerformansi * 0.2 + ortaNotaPerformansi * 0.3 + altNotaPerformansi * 0.5);

  let kalicilikModifikasyonu = 0;
  if (isKuru) {
    kalicilikModifikasyonu = -0.2;
  } else if (isYagli) {
    kalicilikModifikasyonu = 0.3;
  }

  let aciklama = '';
  if (phUyumSkoru >= 80) {
    aciklama = isAsidik ? phUyumu.asidikEtki : (isBazik ? phUyumu.bazikEtki : 'pH\'ınızla mükemmel uyum');
  } else if (phUyumSkoru >= 50) {
    aciklama = 'pH\'ınızla iyi uyum, bazı notalar farklı hissedilebilir';
  } else {
    aciklama = 'pH\'ınızla sınırlı uyum, performans değişkenlik gösterebilir';
  }

  return {
    phUyumSkoru,
    kalicilikModifikasyonu,
    ustNotaPerformansi,
    ortaNotaPerformansi,
    altNotaPerformansi,
    toplamPerformans,
    aciklama,
  };
};
