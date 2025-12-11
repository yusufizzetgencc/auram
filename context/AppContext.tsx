/**
 * AROMIXEN - Kişisel Parfüm Öneri Uygulaması
 * Global State Management + pH Hesaplama Sistemi
 */

import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { 
  UserPreferences, 
  Parfum, 
  RecommendationResult, 
  Cinsiyet, 
  KokuTipi, 
  CiltTipi, 
  Mevsim, 
  KiyafetStili,
  KokuYogunlugu,
  KullanimAmaci,
  TerlemeOrani,
  CiltHassasiyeti,
  Iklim,
  Ortam,
  AktiviteYogunlugu,
  KalicilikTercihi,
  PHHesapSonucu,
  ParfumPHSkor,
  PHAraligi,
  UserPHInfo,
  PHBilgiDurumu
} from '@/types';
import parfumData from '@/data/parfumler.json';

interface AppContextType {
  // User preferences
  preferences: UserPreferences;
  setPreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  toggleArrayPreference: <K extends keyof UserPreferences>(key: K, value: string) => void;
  resetPreferences: () => void;
  
  // pH İşlemleri
  setPHBilgiDurumu: (durum: PHBilgiDurumu) => void;
  setKullaniciPH: (ph: number) => void;
  hesaplaPH: () => PHHesapSonucu;
  kullaniciPH: number | null;
  phSonucu: PHHesapSonucu | null;
  
  // Onboarding
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isOnboardingComplete: boolean;
  setIsOnboardingComplete: (complete: boolean) => void;
  
  // Recommendations
  recommendations: RecommendationResult[];
  getRecommendations: () => RecommendationResult[];
  
  // Parfüm listesi
  parfumler: Parfum[];
  
  // Meta data
  kokuTipleri: typeof parfumData.kokuTipleri;
  mevsimler: typeof parfumData.mevsimler;
  notalar: string[];
}

const defaultPHInfo: UserPHInfo = {
  biliyorMu: 'bilmiyorum',
  deger: null,
  tahminiDeger: null,
  aralik: null,
};

const defaultPreferences: UserPreferences = {
  // pH Bilgileri
  phInfo: defaultPHInfo,
  
  // Kişisel Tercihler
  kokuTipleri: [],
  yogunluk: null,
  kullanimAmaci: null,
  cinsiyet: null,
  
  // Fiziksel Özellikler
  ciltTipi: null,
  ciltHassasiyeti: null,
  terlemeOrani: null,
  
  // Hava ve Mekan
  mevsim: null,
  iklim: null,
  ortam: null,
  
  // Yaşam Tarzı
  kiyafetStili: null,
  aktivite: null,
  
  // Koku Alışkanlıkları
  sevilenNotalar: [],
  sevilmeyenNotalar: [],
  kalicilikTercihi: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [currentStep, setCurrentStep] = useState(0);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [phSonucu, setPHSonucu] = useState<PHHesapSonucu | null>(null);

  const parfumler = parfumData.parfumler as unknown as Parfum[];
  const kokuTipleri = parfumData.kokuTipleri;
  const mevsimler = parfumData.mevsimler;
  const notalar = parfumData.notalar;

  // Kullanıcının efektif pH değeri
  const kullaniciPH = useMemo(() => {
    if (preferences.phInfo.biliyorMu === 'biliyorum' && preferences.phInfo.deger) {
      return preferences.phInfo.deger;
    }
    return preferences.phInfo.tahminiDeger;
  }, [preferences.phInfo]);

  const setPreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  // Çoklu seçim için array toggle fonksiyonu
  const toggleArrayPreference = <K extends keyof UserPreferences>(key: K, value: string) => {
    setPreferences(prev => {
      const currentArray = prev[key] as string[];
      if (currentArray.includes(value)) {
        return { ...prev, [key]: currentArray.filter(item => item !== value) };
      } else {
        return { ...prev, [key]: [...currentArray, value] };
      }
    });
  };

  // pH Bilgi Durumu Ayarla
  const setPHBilgiDurumu = (durum: PHBilgiDurumu) => {
    setPreferences(prev => ({
      ...prev,
      phInfo: { ...prev.phInfo, biliyorMu: durum }
    }));
  };

  // Kullanıcının bildiği pH değerini ayarla
  const setKullaniciPH = (ph: number) => {
    const aralik = getPHAraligi(ph);
    setPreferences(prev => ({
      ...prev,
      phInfo: { ...prev.phInfo, deger: ph, aralik }
    }));
  };

  // pH Aralığını Belirle
  const getPHAraligi = (ph: number): PHAraligi => {
    if (ph < 5.0) return 'asidik';
    if (ph > 6.0) return 'bazik';
    return 'normal';
  };

  // pH Hesaplama Fonksiyonu
  const hesaplaPH = (): PHHesapSonucu => {
    const formul = parfumData.phHesaplamaFormulu;
    let tabanPH = formul.tabanPH; // 5.0

    // Cilt tipi etkisi
    let ciltTipiEtkisi = 0;
    if (preferences.ciltTipi === 'kuru') {
      ciltTipiEtkisi = 1 * formul.ciltTipiKatsayi; // +0.2
    } else if (preferences.ciltTipi === 'yagli') {
      ciltTipiEtkisi = -1 * formul.ciltTipiKatsayi; // -0.2
    }

    // Terleme etkisi
    let terlemeEtkisi = 0;
    if (preferences.terlemeOrani === 'normal') {
      terlemeEtkisi = 1 * formul.terlemeKatsayi; // -0.1
    } else if (preferences.terlemeOrani === 'cok') {
      terlemeEtkisi = 2 * formul.terlemeKatsayi; // -0.2
    }

    // Hassasiyet etkisi
    let hassasiyetEtkisi = 0;
    if (preferences.ciltHassasiyeti === 'hassas') {
      hassasiyetEtkisi = 1 * formul.hassasiyetKatsayi; // +0.1
    } else if (preferences.ciltHassasiyeti === 'dayanikli') {
      hassasiyetEtkisi = -1 * formul.hassasiyetKatsayi; // -0.1
    }

    // Tahmini pH hesapla
    const tahminiPH = Number((tabanPH + ciltTipiEtkisi + terlemeEtkisi + hassasiyetEtkisi).toFixed(2));
    const aralik = getPHAraligi(tahminiPH);

    // Güvenilirlik hesapla (ne kadar bilgi varsa o kadar güvenilir)
    let guvenilirlik = 50; // Temel
    if (preferences.ciltTipi) guvenilirlik += 20;
    if (preferences.terlemeOrani) guvenilirlik += 15;
    if (preferences.ciltHassasiyeti) guvenilirlik += 15;

    // Açıklama oluştur
    let aciklama = '';
    if (aralik === 'asidik') {
      aciklama = 'Cildiniz asidik pH\'a sahip. Narenciye ve ferah notalar sizde çok iyi açılır. Alt notalar daha geç ortaya çıkar.';
    } else if (aralik === 'bazik') {
      aciklama = 'Cildiniz bazik pH\'a sahip. Alt notalar (odunsu, amber) sizde daha baskın olur. Üst notalar hızlı uçabilir.';
    } else {
      aciklama = 'Cildiniz normal pH aralığında. Çoğu parfüm sizde dengeli performans gösterir.';
    }

    const sonuc: PHHesapSonucu = {
      tahminiPH,
      aralik,
      guvenilirlik,
      aciklama,
      faktorler: {
        ciltTipiEtkisi,
        terlemeEtkisi,
        hassasiyetEtkisi,
      }
    };

    // State'e kaydet
    setPHSonucu(sonuc);
    setPreferences(prev => ({
      ...prev,
      phInfo: { ...prev.phInfo, tahminiDeger: tahminiPH, aralik }
    }));

    return sonuc;
  };

  // Parfüm için pH Skoru Hesapla
  const hesaplaParfumPHSkoru = (parfum: Parfum, userPH: number): ParfumPHSkor => {
    const { phUyumu, notaKalicilik } = parfum;
    
    // pH Uyum Skoru (0-100)
    let phUyumSkoru = 0;
    if (userPH >= phUyumu.minPH && userPH <= phUyumu.maxPH) {
      // Uyum aralığında
      const idealFark = Math.abs(userPH - phUyumu.idealPH);
      phUyumSkoru = Math.max(0, 100 - (idealFark * 20));
    } else {
      // Uyum dışında
      const minFark = Math.abs(userPH - phUyumu.minPH);
      const maxFark = Math.abs(userPH - phUyumu.maxPH);
      const enYakinFark = Math.min(minFark, maxFark);
      phUyumSkoru = Math.max(0, 50 - (enYakinFark * 25));
    }

    // Cilt tipi ve pH'a göre kalıcılık modifikasyonu
    const isAsidik = userPH < 5.0;
    const isBazik = userPH > 6.0;
    const isKuru = preferences.ciltTipi === 'kuru';
    const isYagli = preferences.ciltTipi === 'yagli';

    // Nota performansları hesapla
    const ustMod = notaKalicilik.ust;
    const ortaMod = notaKalicilik.orta;
    const altMod = notaKalicilik.alt;

    let ustNotaPerformansi = 70; // Temel
    let ortaNotaPerformansi = 70;
    let altNotaPerformansi = 70;

    // pH etkisi
    if (isAsidik) {
      ustNotaPerformansi += ustMod.asidikCilt * 30;
      ortaNotaPerformansi += ortaMod.asidikCilt * 30;
      altNotaPerformansi += altMod.asidikCilt * 30;
    } else if (isBazik) {
      ustNotaPerformansi += ustMod.bazikCilt * 30;
      ortaNotaPerformansi += ortaMod.bazikCilt * 30;
      altNotaPerformansi += altMod.bazikCilt * 30;
    }

    // Cilt tipi etkisi
    if (isKuru) {
      ustNotaPerformansi += ustMod.kuruCilt * 20;
      ortaNotaPerformansi += ortaMod.kuruCilt * 20;
      altNotaPerformansi += altMod.kuruCilt * 20;
    } else if (isYagli) {
      ustNotaPerformansi += ustMod.yagliCilt * 20;
      ortaNotaPerformansi += ortaMod.yagliCilt * 20;
      altNotaPerformansi += altMod.yagliCilt * 20;
    }

    // 0-100 aralığına normalize et
    ustNotaPerformansi = Math.min(100, Math.max(0, ustNotaPerformansi));
    ortaNotaPerformansi = Math.min(100, Math.max(0, ortaNotaPerformansi));
    altNotaPerformansi = Math.min(100, Math.max(0, altNotaPerformansi));

    // Toplam performans
    const toplamPerformans = (ustNotaPerformansi * 0.2 + ortaNotaPerformansi * 0.3 + altNotaPerformansi * 0.5);

    // Kalıcılık modifikasyonu
    let kalicilikModifikasyonu = 0;
    if (isKuru) {
      kalicilikModifikasyonu = -0.2; // Kuru ciltte daha kısa kalır
    } else if (isYagli) {
      kalicilikModifikasyonu = 0.3; // Yağlı ciltte daha uzun kalır
    }

    // Açıklama
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

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    setCurrentStep(0);
    setIsOnboardingComplete(false);
    setRecommendations([]);
    setPHSonucu(null);
  };

  // Gelişmiş Öneri Algoritması - pH Entegreli
  const getRecommendations = (): RecommendationResult[] => {
    const results: RecommendationResult[] = [];
    
    // Efektif pH değeri
    const effectivePH = kullaniciPH || 5.5; // Varsayılan normal pH

    parfumler.forEach(parfum => {
      let score = 0;
      let maxScore = 0;
      const matchReasons: string[] = [];
      const uyumKategorileri: RecommendationResult['uyumKategorileri'] = [];

      // pH Skoru Hesapla
      const phSkor = hesaplaParfumPHSkoru(parfum, effectivePH);

      // 1️⃣ pH UYUMU (Max 25 puan) - EN ÖNEMLİ
      maxScore += 25;
      const phPuan = (phSkor.phUyumSkoru / 100) * 25;
      score += phPuan;
      if (phSkor.phUyumSkoru >= 70) {
        matchReasons.push(`pH uyumu: %${Math.round(phSkor.phUyumSkoru)} - ${phSkor.aciklama}`);
      }
      uyumKategorileri.push({
        kategori: 'pH Uyumu',
        uyum: phSkor.phUyumSkoru >= 50,
        detay: `%${Math.round(phSkor.phUyumSkoru)} uyum - ${phSkor.aciklama}`
      });

      // 2️⃣ KOKU TİPİ UYUMU (Max 20 puan)
      maxScore += 20;
      if (preferences.kokuTipleri.length > 0) {
        const tipUyumu = preferences.kokuTipleri.includes(parfum.tip as KokuTipi);
        const ikincilUyum = parfum.ikincilTip && preferences.kokuTipleri.includes(parfum.ikincilTip as KokuTipi);
        
        if (tipUyumu) {
          score += 18;
          matchReasons.push(`${parfum.tip} koku tercihinize uygun`);
        }
        if (ikincilUyum) {
          score += 2;
        }
        uyumKategorileri.push({
          kategori: 'Koku Tipi',
          uyum: tipUyumu || !!ikincilUyum,
          detay: tipUyumu ? `Ana tip: ${parfum.tip}` : 'Koku tipi uyumsuz'
        });
      }

      // 3️⃣ CİNSİYET UYUMU (Max 15 puan)
      maxScore += 15;
      if (preferences.cinsiyet) {
        const cinsiyetUyumu = parfum.cinsiyet === preferences.cinsiyet || parfum.cinsiyet === 'unisex';
        if (cinsiyetUyumu) {
          score += 15;
          if (parfum.cinsiyet === preferences.cinsiyet) {
            matchReasons.push('Cinsiyet tercihinize tam uygun');
          }
        } else {
          score -= 20; // Uyumsuz cinsiyet ciddi ceza
        }
        uyumKategorileri.push({
          kategori: 'Cinsiyet',
          uyum: cinsiyetUyumu,
          detay: cinsiyetUyumu ? `${parfum.cinsiyet} parfüm` : 'Cinsiyet uyumsuz'
        });
      }

      // 4️⃣ MEVSİM UYUMU (Max 15 puan)
      maxScore += 15;
      if (preferences.mevsim) {
        const mevsimUyumu = parfum.mevsim.includes(preferences.mevsim) || 
                          parfum.mevsim.includes('Tüm Mevsimler' as Mevsim);
        if (mevsimUyumu) {
          score += 15;
          matchReasons.push(`${preferences.mevsim} için ideal`);
        }
        uyumKategorileri.push({
          kategori: 'Mevsim',
          uyum: mevsimUyumu,
          detay: mevsimUyumu ? parfum.mevsim.join(', ') : 'Mevsim uyumsuz'
        });
      }

      // 5️⃣ YOĞUNLUK UYUMU (Max 10 puan)
      maxScore += 10;
      if (preferences.yogunluk && parfum.yogunluk === preferences.yogunluk) {
        score += 10;
        matchReasons.push(`${preferences.yogunluk} yoğunluk tercihinize uygun`);
        uyumKategorileri.push({
          kategori: 'Yoğunluk',
          uyum: true,
          detay: `${parfum.yogunluk} yoğunluk`
        });
      }

      // 6️⃣ KULLANIM AMACI UYUMU (Max 10 puan)
      maxScore += 10;
      if (preferences.kullanimAmaci && parfum.kullanimAmaci.includes(preferences.kullanimAmaci)) {
        score += 10;
        uyumKategorileri.push({
          kategori: 'Kullanım',
          uyum: true,
          detay: parfum.kullanimAmaci.join(', ')
        });
      }

      // 7️⃣ KALICILIK UYUMU + pH MODİFİKASYONU (Max 10 puan)
      maxScore += 10;
      if (preferences.kalicilikTercihi) {
        // pH'ın kalıcılığa etkisini hesapla
        let efektifKalicilik = parfum.kalicilik;
        if (phSkor.kalicilikModifikasyonu > 0.2) {
          // Yağlı cilt - kalıcılık artar
          if (parfum.kalicilik === 'kisa') efektifKalicilik = 'orta';
          else if (parfum.kalicilik === 'orta') efektifKalicilik = 'uzun';
        } else if (phSkor.kalicilikModifikasyonu < -0.1) {
          // Kuru cilt - kalıcılık azalır
          if (parfum.kalicilik === 'uzun') efektifKalicilik = 'orta';
          else if (parfum.kalicilik === 'orta') efektifKalicilik = 'kisa';
        }

        if (efektifKalicilik === preferences.kalicilikTercihi) {
          score += 10;
          matchReasons.push(`Cildinizde ${preferences.kalicilikTercihi} süreli kalıcılık`);
        }
        uyumKategorileri.push({
          kategori: 'Kalıcılık',
          uyum: efektifKalicilik === preferences.kalicilikTercihi,
          detay: `Temel: ${parfum.kalicilik}, Sizde: ${efektifKalicilik}`
        });
      }

      // 8️⃣ İKLİM UYUMU (Max 5 puan)
      maxScore += 5;
      if (preferences.iklim && parfum.iklim.includes(preferences.iklim)) {
        score += 5;
      }

      // 9️⃣ KIYAFET STİLİ UYUMU (Max 5 puan)
      maxScore += 5;
      if (preferences.kiyafetStili && parfum.kiyafetStili.includes(preferences.kiyafetStili)) {
        score += 5;
      }

      // 🔟 SEVİLEN NOTALAR BONUS (Max 10 puan)
      maxScore += 10;
      if (preferences.sevilenNotalar.length > 0) {
        const tumNotalar = [...parfum.notalar.ust, ...parfum.notalar.orta, ...parfum.notalar.alt];
        const eslesen = preferences.sevilenNotalar.filter(nota => 
          tumNotalar.some(n => n.toLowerCase().includes(nota.toLowerCase()))
        );
        if (eslesen.length > 0) {
          const notaPuani = Math.min(10, eslesen.length * 3);
          score += notaPuani;
          matchReasons.push(`Sevdiğiniz notalar: ${eslesen.slice(0, 3).join(', ')}`);
        }
      }

      // 1️⃣1️⃣ SEVİLMEYEN NOTALAR CEZA
      if (preferences.sevilmeyenNotalar.length > 0) {
        const tumNotalar = [...parfum.notalar.ust, ...parfum.notalar.orta, ...parfum.notalar.alt];
        const sevilmeyen = preferences.sevilmeyenNotalar.filter(nota => 
          tumNotalar.some(n => n.toLowerCase().includes(nota.toLowerCase()))
        );
        if (sevilmeyen.length > 0) {
          score -= sevilmeyen.length * 8;
        }
      }

      // 1️⃣2️⃣ CİLT HASSASİYETİ KONTROLÜ
      if (preferences.ciltHassasiyeti === 'hassas') {
        // Baharatlı kokular hassas cilde uygun değil
        if (parfum.tip === 'Baharatlı') {
          score -= 15;
          uyumKategorileri.push({
            kategori: 'Cilt Hassasiyeti',
            uyum: false,
            detay: 'Hassas cilt için baharatlı kokular önerilmez'
          });
        }
      }

      // Uyum yüzdesi hesapla
      const matchPercentage = Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)));

      if (score > 15 && matchReasons.length >= 1) {
        results.push({ 
          parfum, 
          score, 
          maxScore,
          matchPercentage,
          matchReasons,
          uyumKategorileri,
          phSkor
        });
      }
    });

    // Skora göre sırala ve en iyi 10'u döndür
    const sortedResults = results
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 10);
    
    setRecommendations(sortedResults);
    return sortedResults;
  };

  return (
    <AppContext.Provider
      value={{
        preferences,
        setPreference,
        toggleArrayPreference,
        resetPreferences,
        setPHBilgiDurumu,
        setKullaniciPH,
        hesaplaPH,
        kullaniciPH,
        phSonucu,
        currentStep,
        setCurrentStep,
        isOnboardingComplete,
        setIsOnboardingComplete,
        recommendations,
        getRecommendations,
        parfumler,
        kokuTipleri,
        mevsimler,
        notalar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
