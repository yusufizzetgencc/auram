/**
 * AROMIXEN - Lüks Parfüm Öneri Uygulaması
 * Global State Management + Gelişmiş pH Hesaplama Sistemi
 */

import parfumData from '@/data/parfumler.json';
import {
    KokuTipi,
    Mevsim,
    Parfum,
    ParfumPHSkor,
    PHAraligi,
    PHBilgiDurumu,
    PHHesapSonucu,
    RecommendationResult,
    UserPHInfo,
    UserPreferences
} from '@/types';
import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';

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
  
  // 1️⃣ Kişisel Bilgiler (YENİ)
  yasGrubu: null,
  kisilikTipi: null,
  
  // 2️⃣ Parfüm Deneyimi (YENİ)
  deneyimSeviyesi: null,
  kullanimSikligi: null,
  
  // 3️⃣ Bütçe ve Marka (YENİ)
  butce: null,
  markaTercihi: null,
  konsantrasyonTercihi: null,
  
  // 4️⃣ Koku Tercihleri
  kokuTipleri: [],
  yogunluk: null,
  izlenimHedefi: null,
  
  // 5️⃣ Kullanım Detayları
  kullanimAmaci: null,
  gununSaati: null,
  cinsiyet: null,
  
  // 6️⃣ Fiziksel Özellikler
  ciltTipi: null,
  ciltHassasiyeti: null,
  terlemeOrani: null,
  kokuAlmaHassasiyeti: null,
  alerjiDurumu: [],
  
  // 7️⃣ Çevre Faktörleri
  mevsim: null,
  iklim: null,
  ortam: null,
  
  // 8️⃣ Yaşam Tarzı
  kiyafetStili: null,
  aktivite: null,
  
  // 9️⃣ Nota Tercihleri
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

  // pH Hesaplama Fonksiyonu - Geliştirilmiş
  const hesaplaPH = (): PHHesapSonucu => {
    const formul = parfumData.phHesaplamaFormulu;
    let tabanPH = formul.tabanPH; // 5.0

    // Cilt tipi etkisi
    let ciltTipiEtkisi = 0;
    if (preferences.ciltTipi === 'kuru') {
      ciltTipiEtkisi = 1 * formul.ciltTipiKatsayi; // +0.2
    } else if (preferences.ciltTipi === 'yagli') {
      ciltTipiEtkisi = -1 * formul.ciltTipiKatsayi; // -0.2
    } else if (preferences.ciltTipi === 'karma') {
      ciltTipiEtkisi = 0.5 * formul.ciltTipiKatsayi; // +0.1
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

    // Yaş etkisi (yeni)
    let yasEtkisi = 0;
    if (preferences.yasGrubu === '18-24') {
      yasEtkisi = -0.1; // Genç cilt genellikle daha asidik
    } else if (preferences.yasGrubu === '55+') {
      yasEtkisi = 0.15; // Olgun cilt daha bazik olabilir
    }

    // Tahmini pH hesapla
    const tahminiPH = Number((tabanPH + ciltTipiEtkisi + terlemeEtkisi + hassasiyetEtkisi + yasEtkisi).toFixed(2));
    const aralik = getPHAraligi(tahminiPH);

    // Güvenilirlik hesapla (ne kadar bilgi varsa o kadar güvenilir)
    let guvenilirlik = 40; // Temel
    if (preferences.ciltTipi) guvenilirlik += 15;
    if (preferences.terlemeOrani) guvenilirlik += 15;
    if (preferences.ciltHassasiyeti) guvenilirlik += 15;
    if (preferences.yasGrubu) guvenilirlik += 10;
    if (preferences.kokuAlmaHassasiyeti) guvenilirlik += 5;

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
      const idealFark = Math.abs(userPH - phUyumu.idealPH);
      phUyumSkoru = Math.max(0, 100 - (idealFark * 20));
    } else {
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

    let ustNotaPerformansi = 70;
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
      kalicilikModifikasyonu = -0.2;
    } else if (isYagli) {
      kalicilikModifikasyonu = 0.3;
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

  // Gelişmiş Öneri Algoritması - pH + Yeni Kriterler Entegreli
  const getRecommendations = (): RecommendationResult[] => {
    const results: RecommendationResult[] = [];
    
    // Efektif pH değeri
    const effectivePH = kullaniciPH || 5.5;

    parfumler.forEach(parfum => {
      let score = 0;
      let maxScore = 0;
      const matchReasons: string[] = [];
      const uyumKategorileri: RecommendationResult['uyumKategorileri'] = [];

      // pH Skoru Hesapla
      const phSkor = hesaplaParfumPHSkoru(parfum, effectivePH);

      // 1️⃣ pH UYUMU (Max 20 puan)
      maxScore += 20;
      const phPuan = (phSkor.phUyumSkoru / 100) * 20;
      score += phPuan;
      if (phSkor.phUyumSkoru >= 70) {
        matchReasons.push(`pH uyumu: %${Math.round(phSkor.phUyumSkoru)}`);
      }
      uyumKategorileri.push({
        kategori: 'pH Uyumu',
        uyum: phSkor.phUyumSkoru >= 50,
        detay: `%${Math.round(phSkor.phUyumSkoru)} uyum`
      });

      // 2️⃣ KOKU TİPİ UYUMU (Max 18 puan)
      maxScore += 18;
      if (preferences.kokuTipleri.length > 0) {
        const tipUyumu = preferences.kokuTipleri.includes(parfum.tip as KokuTipi);
        const ikincilUyum = parfum.ikincilTip && preferences.kokuTipleri.includes(parfum.ikincilTip as KokuTipi);
        
        if (tipUyumu) {
          score += 16;
          matchReasons.push(`${parfum.tip} koku tercihinize uygun`);
        }
        if (ikincilUyum) {
          score += 2;
        }
        uyumKategorileri.push({
          kategori: 'Koku Tipi',
          uyum: tipUyumu || !!ikincilUyum,
          detay: tipUyumu ? parfum.tip : 'Uyumsuz'
        });
      }

      // 3️⃣ CİNSİYET UYUMU (Max 12 puan)
      maxScore += 12;
      if (preferences.cinsiyet) {
        const cinsiyetUyumu = parfum.cinsiyet === preferences.cinsiyet || parfum.cinsiyet === 'unisex';
        if (cinsiyetUyumu) {
          score += 12;
        } else {
          score -= 15; // Uyumsuz cinsiyet ciddi ceza
        }
        uyumKategorileri.push({
          kategori: 'Cinsiyet',
          uyum: cinsiyetUyumu,
          detay: parfum.cinsiyet
        });
      }

      // 4️⃣ MEVSİM UYUMU (Max 10 puan)
      maxScore += 10;
      if (preferences.mevsim) {
        const mevsimUyumu = parfum.mevsim.includes(preferences.mevsim) || 
                          parfum.mevsim.includes('Tüm Mevsimler' as Mevsim);
        if (mevsimUyumu) {
          score += 10;
          matchReasons.push(`${preferences.mevsim} için uygun`);
        }
        uyumKategorileri.push({
          kategori: 'Mevsim',
          uyum: mevsimUyumu,
          detay: parfum.mevsim.join(', ')
        });
      }

      // 5️⃣ YOĞUNLUK UYUMU (Max 8 puan)
      maxScore += 8;
      if (preferences.yogunluk && parfum.yogunluk === preferences.yogunluk) {
        score += 8;
        uyumKategorileri.push({
          kategori: 'Yoğunluk',
          uyum: true,
          detay: parfum.yogunluk
        });
      }

      // 6️⃣ KULLANIM AMACI UYUMU (Max 8 puan)
      maxScore += 8;
      if (preferences.kullanimAmaci && parfum.kullanimAmaci.includes(preferences.kullanimAmaci)) {
        score += 8;
        matchReasons.push('Kullanım amacınıza uygun');
      }

      // 7️⃣ KİŞİLİK UYUMU - YENİ (Max 6 puan)
      maxScore += 6;
      if (preferences.kisilikTipi && parfum.kisilikTipi?.includes(preferences.kisilikTipi)) {
        score += 6;
        matchReasons.push('Kişiliğinize uygun');
      }

      // 8️⃣ İZLENİM HEDEFİ UYUMU - YENİ (Max 6 puan)
      maxScore += 6;
      if (preferences.izlenimHedefi && parfum.izlenim?.includes(preferences.izlenimHedefi)) {
        score += 6;
        matchReasons.push(`${preferences.izlenimHedefi} izlenimi için ideal`);
      }

      // 9️⃣ BÜTÇE UYUMU - YENİ (Max 5 puan)
      maxScore += 5;
      if (preferences.butce && parfum.fiyatAraligi) {
        const butceSirasi = ['ekonomik', 'orta', 'premium', 'luks'];
        const userBudgetIndex = butceSirasi.indexOf(preferences.butce);
        const parfumBudgetIndex = butceSirasi.indexOf(parfum.fiyatAraligi);
        
        if (parfumBudgetIndex <= userBudgetIndex) {
          score += 5;
        } else if (parfumBudgetIndex === userBudgetIndex + 1) {
          score += 2; // Biraz üstü
        }
      }

      // 🔟 YAŞ GRUBU UYUMU - YENİ (Max 4 puan)
      maxScore += 4;
      if (preferences.yasGrubu && parfum.yasGrubu?.includes(preferences.yasGrubu)) {
        score += 4;
      }

      // 1️⃣1️⃣ GÜNÜN SAATİ UYUMU - YENİ (Max 4 puan)
      maxScore += 4;
      if (preferences.gununSaati && parfum.gununSaati?.includes(preferences.gununSaati)) {
        score += 4;
      }

      // 1️⃣2️⃣ KALICILIK UYUMU + pH MODİFİKASYONU (Max 6 puan)
      maxScore += 6;
      if (preferences.kalicilikTercihi) {
        let efektifKalicilik = parfum.kalicilik;
        if (phSkor.kalicilikModifikasyonu > 0.2) {
          if (parfum.kalicilik === 'kisa') efektifKalicilik = 'orta';
          else if (parfum.kalicilik === 'orta') efektifKalicilik = 'uzun';
        } else if (phSkor.kalicilikModifikasyonu < -0.1) {
          if (parfum.kalicilik === 'uzun') efektifKalicilik = 'orta';
          else if (parfum.kalicilik === 'orta') efektifKalicilik = 'kisa';
        }

        if (efektifKalicilik === preferences.kalicilikTercihi) {
          score += 6;
          matchReasons.push(`Cildinizde ${preferences.kalicilikTercihi} süreli kalıcılık`);
        }
      }

      // 1️⃣3️⃣ İKLİM UYUMU (Max 4 puan)
      maxScore += 4;
      if (preferences.iklim && parfum.iklim.includes(preferences.iklim)) {
        score += 4;
      }

      // 1️⃣4️⃣ KIYAFET STİLİ UYUMU (Max 4 puan)
      maxScore += 4;
      if (preferences.kiyafetStili && parfum.kiyafetStili.includes(preferences.kiyafetStili)) {
        score += 4;
      }

      // 1️⃣5️⃣ ORTAM UYUMU (Max 3 puan)
      maxScore += 3;
      if (preferences.ortam && (parfum.ortam === preferences.ortam || parfum.ortam === 'her_ikisi')) {
        score += 3;
      }

      // 1️⃣6️⃣ AKTİVİTE UYUMU (Max 3 puan)
      maxScore += 3;
      if (preferences.aktivite && parfum.aktivite.includes(preferences.aktivite)) {
        score += 3;
      }

      // 1️⃣7️⃣ SEVİLEN NOTALAR BONUS (Max 8 puan)
      maxScore += 8;
      if (preferences.sevilenNotalar.length > 0) {
        const tumNotalar = [...parfum.notalar.ust, ...parfum.notalar.orta, ...parfum.notalar.alt];
        const eslesen = preferences.sevilenNotalar.filter(nota => 
          tumNotalar.some(n => n.toLowerCase().includes(nota.toLowerCase()))
        );
        if (eslesen.length > 0) {
          const notaPuani = Math.min(8, eslesen.length * 2);
          score += notaPuani;
          matchReasons.push(`Sevdiğiniz notalar: ${eslesen.slice(0, 2).join(', ')}`);
        }
      }

      // 1️⃣8️⃣ SEVİLMEYEN NOTALAR CEZA
      if (preferences.sevilmeyenNotalar.length > 0) {
        const tumNotalar = [...parfum.notalar.ust, ...parfum.notalar.orta, ...parfum.notalar.alt];
        const sevilmeyen = preferences.sevilmeyenNotalar.filter(nota => 
          tumNotalar.some(n => n.toLowerCase().includes(nota.toLowerCase()))
        );
        if (sevilmeyen.length > 0) {
          score -= sevilmeyen.length * 8;
        }
      }

      // 1️⃣9️⃣ CİLT HASSASİYETİ KONTROLÜ
      if (preferences.ciltHassasiyeti === 'hassas') {
        if (parfum.tip === 'Baharatlı') {
          score -= 12;
          uyumKategorileri.push({
            kategori: 'Cilt Hassasiyeti',
            uyum: false,
            detay: 'Hassas cilt için baharatlı kokular önerilmez'
          });
        }
      }

      // 2️⃣0️⃣ ALERJİ KONTROLÜ
      if (preferences.alerjiDurumu.length > 0 && !preferences.alerjiDurumu.includes('yok')) {
        if (preferences.alerjiDurumu.includes('cicek') && parfum.tip === 'Çiçeksi') {
          score -= 20;
        }
        if (preferences.alerjiDurumu.includes('baharat') && parfum.tip === 'Baharatlı') {
          score -= 20;
        }
      }

      // 2️⃣1️⃣ KOKU ALMA HASSASİYETİ KONTROLÜ
      if (preferences.kokuAlmaHassasiyeti === 'cok_yuksek' && parfum.yogunluk === 'yogun') {
        score -= 8;
      }

      // Uyum yüzdesi hesapla
      const matchPercentage = Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)));

      if (score > 10 && matchReasons.length >= 1) {
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

    // Skora göre sırala ve en iyi 15'i döndür
    const sortedResults = results
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 15);
    
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
