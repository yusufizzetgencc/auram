/**
 * AROMIXEN - Lüks Parfüm Öneri Uygulaması
 * Global State Management + Gelişmiş pH Hesaplama Sistemi + Veri Kalıcılığı
 */

import parfumData from '@/data/parfumler.json';
import {
  Collection,
  RecentlyViewedItem,
  SearchHistoryItem,
  loadAllUserData,
  loadFavorites,
  loadCollections,
  loadRecentlyViewed,
  loadSearchHistory,
  saveFavorites,
  saveCollections,
  saveOnboardingStatus,
  saveUserPreferences,
  toggleFavorite,
  createCollection,
  deleteCollection,
  addToRecentlyViewed,
  clearRecentlyViewed,
  addToSearchHistory,
  removeFromSearchHistory,
  clearSearchHistory,
  clearAllData,
} from '@/services/storage';
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
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface AppContextType {
  // Loading state
  isLoading: boolean;
  isDataLoaded: boolean;
  
  // User preferences
  preferences: UserPreferences;
  setPreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  toggleArrayPreference: <K extends keyof UserPreferences>(key: K, value: string) => void;
  resetPreferences: () => Promise<void>;
  
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
  getParfumById: (id: string) => Parfum | undefined;
  
  // Meta data
  kokuTipleri: typeof parfumData.kokuTipleri;
  mevsimler: typeof parfumData.mevsimler;
  notalar: string[];
  
  // ============ FAVORİLER ============
  favorites: string[];
  isFavorite: (parfumId: string) => boolean;
  toggleFavoriteParfum: (parfumId: string) => Promise<boolean>;
  getFavoriteParfums: () => Parfum[];
  clearFavoritesList: () => Promise<void>;
  
  // ============ KOLEKSİYONLAR ============
  collections: Collection[];
  createNewCollection: (name: string, icon: string, color: string) => Promise<Collection>;
  addParfumToCollection: (collectionId: string, parfumId: string) => Promise<void>;
  removeParfumFromCollection: (collectionId: string, parfumId: string) => Promise<void>;
  removeCollection: (collectionId: string) => Promise<void>;
  getCollectionParfums: (collectionId: string) => Parfum[];
  clearCollectionsList: () => Promise<void>;
  
  // ============ SON GÖRÜNTÜLENENLER ============
  recentlyViewed: RecentlyViewedItem[];
  addToRecentlyViewedList: (parfumId: string) => Promise<void>;
  getRecentlyViewedParfums: () => Parfum[];
  clearRecentlyViewedList: () => Promise<void>;
  
  // ============ ARAMA GEÇMİŞİ ============
  searchHistory: SearchHistoryItem[];
  addSearchToHistory: (query: string, resultCount: number) => Promise<void>;
  removeSearchFromHistory: (query: string) => Promise<void>;
  clearSearchHistoryList: () => Promise<void>;
  
  // ============ VERİ YÖNETİMİ ============
  resetAllData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const defaultPHInfo: UserPHInfo = {
  biliyorMu: 'bilmiyorum',
  deger: null,
  tahminiDeger: null,
  aralik: null,
};

const defaultPreferences: UserPreferences = {
  phInfo: defaultPHInfo,
  yasGrubu: null,
  kisilikTipi: null,
  deneyimSeviyesi: null,
  kullanimSikligi: null,
  butce: null,
  markaTercihi: null,
  konsantrasyonTercihi: null,
  kokuTipleri: [],
  yogunluk: null,
  izlenimHedefi: null,
  kullanimAmaci: null,
  gununSaati: null,
  cinsiyet: null,
  ciltTipi: null,
  ciltHassasiyeti: null,
  terlemeOrani: null,
  kokuAlmaHassasiyeti: null,
  alerjiDurumu: [],
  mevsim: null,
  iklim: null,
  ortam: null,
  kiyafetStili: null,
  aktivite: null,
  sevilenNotalar: [],
  sevilmeyenNotalar: [],
  kalicilikTercihi: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // ============ LOADING STATE ============
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // ============ CORE STATE ============
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [currentStep, setCurrentStepState] = useState(0);
  const [isOnboardingComplete, setIsOnboardingCompleteState] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [phSonucu, setPHSonucu] = useState<PHHesapSonucu | null>(null);

  // ============ FAVORİLER & KOLEKSİYONLAR ============
  const [favorites, setFavorites] = useState<string[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  
  // ============ AKTİVİTE ============
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // ============ PARFÜM VERİLERİ ============
  const parfumler = parfumData.parfumler as unknown as Parfum[];
  const kokuTipleri = parfumData.kokuTipleri;
  const mevsimler = parfumData.mevsimler;
  const notalar = parfumData.notalar;

  // ============ İLK YÜKLEME ============
  useEffect(() => {
    async function loadStoredData() {
      try {
        setIsLoading(true);
        
        const storedData = await loadAllUserData(defaultPreferences);
        
        setPreferences(storedData.preferences);
        setIsOnboardingCompleteState(storedData.isOnboardingComplete);
        setCurrentStepState(storedData.currentStep);
        setFavorites(storedData.favorites);
        setCollections(storedData.collections);
        setRecentlyViewed(storedData.recentlyViewed);
        setSearchHistory(storedData.searchHistory);
        
        setIsDataLoaded(true);
      } catch (error) {
        console.error('[AppContext] Veri yükleme hatası:', error);
        setIsDataLoaded(true);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadStoredData();
  }, []);

  // Kullanıcının efektif pH değeri
  const kullaniciPH = useMemo(() => {
    if (preferences.phInfo.biliyorMu === 'biliyorum' && preferences.phInfo.deger) {
      return preferences.phInfo.deger;
    }
    return preferences.phInfo.tahminiDeger;
  }, [preferences.phInfo]);

  // ============ PARFÜM HELPER ============
  const getParfumById = useCallback((id: string): Parfum | undefined => {
    return parfumler.find(p => p.id === id);
  }, [parfumler]);

  // ============ TERCİH FONKSİYONLARI ============
  const setPreference = useCallback(<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, [key]: value };
      saveUserPreferences(newPrefs);
      return newPrefs;
    });
  }, []);

  const toggleArrayPreference = useCallback(<K extends keyof UserPreferences>(key: K, value: string) => {
    setPreferences(prev => {
      const currentArray = prev[key] as string[];
      let newPrefs: UserPreferences;
      
      if (currentArray.includes(value)) {
        newPrefs = { ...prev, [key]: currentArray.filter(item => item !== value) };
      } else {
        newPrefs = { ...prev, [key]: [...currentArray, value] };
      }
      
      saveUserPreferences(newPrefs);
      return newPrefs;
    });
  }, []);

  // ============ ONBOARDING FONKSİYONLARI ============
  const setCurrentStep = useCallback((step: number) => {
    setCurrentStepState(step);
    saveOnboardingStatus(isOnboardingComplete, step);
  }, [isOnboardingComplete]);

  const setIsOnboardingComplete = useCallback((complete: boolean) => {
    setIsOnboardingCompleteState(complete);
    saveOnboardingStatus(complete, currentStep);
  }, [currentStep]);

  // ============ pH FONKSİYONLARI ============
  const setPHBilgiDurumu = useCallback((durum: PHBilgiDurumu) => {
    setPreferences(prev => {
      const newPrefs = {
        ...prev,
        phInfo: { ...prev.phInfo, biliyorMu: durum }
      };
      saveUserPreferences(newPrefs);
      return newPrefs;
    });
  }, []);

  const getPHAraligi = (ph: number): PHAraligi => {
    if (ph < 5.0) return 'asidik';
    if (ph > 6.0) return 'bazik';
    return 'normal';
  };

  const setKullaniciPH = useCallback((ph: number) => {
    const aralik = getPHAraligi(ph);
    setPreferences(prev => {
      const newPrefs = {
        ...prev,
        phInfo: { ...prev.phInfo, deger: ph, aralik }
      };
      saveUserPreferences(newPrefs);
      return newPrefs;
    });
  }, []);

  const hesaplaPH = useCallback((): PHHesapSonucu => {
    const formul = parfumData.phHesaplamaFormulu;
    let tabanPH = formul.tabanPH;

    let ciltTipiEtkisi = 0;
    if (preferences.ciltTipi === 'kuru') {
      ciltTipiEtkisi = 1 * formul.ciltTipiKatsayi;
    } else if (preferences.ciltTipi === 'yagli') {
      ciltTipiEtkisi = -1 * formul.ciltTipiKatsayi;
    } else if (preferences.ciltTipi === 'karma') {
      ciltTipiEtkisi = 0.5 * formul.ciltTipiKatsayi;
    }

    let terlemeEtkisi = 0;
    if (preferences.terlemeOrani === 'normal') {
      terlemeEtkisi = 1 * formul.terlemeKatsayi;
    } else if (preferences.terlemeOrani === 'cok') {
      terlemeEtkisi = 2 * formul.terlemeKatsayi;
    }

    let hassasiyetEtkisi = 0;
    if (preferences.ciltHassasiyeti === 'hassas') {
      hassasiyetEtkisi = 1 * formul.hassasiyetKatsayi;
    } else if (preferences.ciltHassasiyeti === 'dayanikli') {
      hassasiyetEtkisi = -1 * formul.hassasiyetKatsayi;
    }

    let yasEtkisi = 0;
    if (preferences.yasGrubu === '18-24') {
      yasEtkisi = -0.1;
    } else if (preferences.yasGrubu === '55+') {
      yasEtkisi = 0.15;
    }

    const tahminiPH = Number((tabanPH + ciltTipiEtkisi + terlemeEtkisi + hassasiyetEtkisi + yasEtkisi).toFixed(2));
    const aralik = getPHAraligi(tahminiPH);

    let guvenilirlik = 40;
    if (preferences.ciltTipi) guvenilirlik += 15;
    if (preferences.terlemeOrani) guvenilirlik += 15;
    if (preferences.ciltHassasiyeti) guvenilirlik += 15;
    if (preferences.yasGrubu) guvenilirlik += 10;
    if (preferences.kokuAlmaHassasiyeti) guvenilirlik += 5;

    let aciklama = '';
    if (aralik === 'asidik') {
      aciklama = 'Cildiniz asidik pH\'a sahip. Narenciye ve ferah notalar sizde çok iyi açılır.';
    } else if (aralik === 'bazik') {
      aciklama = 'Cildiniz bazik pH\'a sahip. Alt notalar sizde daha baskın olur.';
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

    setPHSonucu(sonuc);
    setPreferences(prev => {
      const newPrefs = {
        ...prev,
        phInfo: { ...prev.phInfo, tahminiDeger: tahminiPH, aralik }
      };
      saveUserPreferences(newPrefs);
      return newPrefs;
    });

    return sonuc;
  }, [preferences.ciltTipi, preferences.terlemeOrani, preferences.ciltHassasiyeti, preferences.yasGrubu, preferences.kokuAlmaHassasiyeti]);

  // ============ FAVORİ FONKSİYONLARI ============
  const isFavorite = useCallback((parfumId: string): boolean => {
    return favorites.includes(parfumId);
  }, [favorites]);

  const toggleFavoriteParfum = useCallback(async (parfumId: string): Promise<boolean> => {
    const result = await toggleFavorite(parfumId);
    setFavorites(result.favorites);
    return result.isFavorite;
  }, []);

  const getFavoriteParfums = useCallback((): Parfum[] => {
    return favorites
      .map(id => parfumler.find(p => p.id === id))
      .filter((p): p is Parfum => p !== undefined);
  }, [favorites, parfumler]);

  const clearFavoritesList = useCallback(async (): Promise<void> => {
    await saveFavorites([]);
    setFavorites([]);
  }, []);

  // ============ KOLEKSİYON FONKSİYONLARI ============
  const createNewCollection = useCallback(async (name: string, icon: string, color: string): Promise<Collection> => {
    const newCollection = await createCollection(name, icon, color);
    setCollections(prev => [...prev, newCollection]);
    return newCollection;
  }, []);

  const addParfumToCollection = useCallback(async (collectionId: string, parfumId: string): Promise<void> => {
    setCollections(prev => {
      const updated = prev.map(col => {
        if (col.id === collectionId && !col.parfumIds.includes(parfumId)) {
          return {
            ...col,
            parfumIds: [...col.parfumIds, parfumId],
            updatedAt: new Date().toISOString(),
          };
        }
        return col;
      });
      saveCollections(updated);
      return updated;
    });
  }, []);

  const removeParfumFromCollection = useCallback(async (collectionId: string, parfumId: string): Promise<void> => {
    setCollections(prev => {
      const updated = prev.map(col => {
        if (col.id === collectionId) {
          return {
            ...col,
            parfumIds: col.parfumIds.filter(id => id !== parfumId),
            updatedAt: new Date().toISOString(),
          };
        }
        return col;
      });
      saveCollections(updated);
      return updated;
    });
  }, []);

  const removeCollection = useCallback(async (collectionId: string): Promise<void> => {
    await deleteCollection(collectionId);
    setCollections(prev => prev.filter(col => col.id !== collectionId));
  }, []);

  const getCollectionParfums = useCallback((collectionId: string): Parfum[] => {
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) return [];
    
    return collection.parfumIds
      .map(id => parfumler.find(p => p.id === id))
      .filter((p): p is Parfum => p !== undefined);
  }, [collections, parfumler]);

  const clearCollectionsList = useCallback(async (): Promise<void> => {
    await saveCollections([]);
    setCollections([]);
  }, []);

  // ============ SON GÖRÜNTÜLENENLER ============
  const addToRecentlyViewedList = useCallback(async (parfumId: string): Promise<void> => {
    const updated = await addToRecentlyViewed(parfumId);
    setRecentlyViewed(updated);
  }, []);

  const getRecentlyViewedParfums = useCallback((): Parfum[] => {
    return recentlyViewed
      .map(item => parfumler.find(p => p.id === item.parfumId))
      .filter((p): p is Parfum => p !== undefined);
  }, [recentlyViewed, parfumler]);

  const clearRecentlyViewedList = useCallback(async (): Promise<void> => {
    await clearRecentlyViewed();
    setRecentlyViewed([]);
  }, []);

  // ============ ARAMA GEÇMİŞİ ============
  const addSearchToHistoryFn = useCallback(async (query: string, resultCount: number): Promise<void> => {
    const updated = await addToSearchHistory(query, resultCount);
    setSearchHistory(updated);
  }, []);

  const removeSearchFromHistoryFn = useCallback(async (query: string): Promise<void> => {
    const updated = await removeFromSearchHistory(query);
    setSearchHistory(updated);
  }, []);

  const clearSearchHistoryList = useCallback(async (): Promise<void> => {
    await clearSearchHistory();
    setSearchHistory([]);
  }, []);

  // ============ VERİ YÖNETİMİ ============
  const resetPreferences = useCallback(async () => {
    setPreferences(defaultPreferences);
    setCurrentStepState(0);
    setIsOnboardingCompleteState(false);
    setRecommendations([]);
    setPHSonucu(null);
    
    await saveUserPreferences(defaultPreferences);
    await saveOnboardingStatus(false, 0);
  }, []);

  const resetAllData = useCallback(async (): Promise<void> => {
    await clearAllData();
    
    setPreferences(defaultPreferences);
    setCurrentStepState(0);
    setIsOnboardingCompleteState(false);
    setRecommendations([]);
    setPHSonucu(null);
    setFavorites([]);
    setCollections([]);
    setRecentlyViewed([]);
    setSearchHistory([]);
  }, []);

  const refreshData = useCallback(async (): Promise<void> => {
    const [favs, cols, recent, history] = await Promise.all([
      loadFavorites(),
      loadCollections(),
      loadRecentlyViewed(),
      loadSearchHistory(),
    ]);
    
    setFavorites(favs);
    setCollections(cols);
    setRecentlyViewed(recent);
    setSearchHistory(history);
  }, []);

  // ============ pH SKOR HESAPLAMA ============
  const hesaplaParfumPHSkoru = useCallback((parfum: Parfum, userPH: number): ParfumPHSkor => {
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
    const isKuru = preferences.ciltTipi === 'kuru';
    const isYagli = preferences.ciltTipi === 'yagli';

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
  }, [preferences.ciltTipi]);

  // ============ ÖNERİ ALGORİTMASI ============
  const getRecommendations = useCallback((): RecommendationResult[] => {
    const results: RecommendationResult[] = [];
    const effectivePH = kullaniciPH || 5.5;

    parfumler.forEach(parfum => {
      let score = 0;
      let maxScore = 0;
      const matchReasons: string[] = [];
      const uyumKategorileri: RecommendationResult['uyumKategorileri'] = [];

      const phSkor = hesaplaParfumPHSkoru(parfum, effectivePH);

      // 1️⃣ pH UYUMU
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

      // 2️⃣ KOKU TİPİ UYUMU
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

      // 3️⃣ CİNSİYET UYUMU
      maxScore += 12;
      if (preferences.cinsiyet) {
        const cinsiyetUyumu = parfum.cinsiyet === preferences.cinsiyet || parfum.cinsiyet === 'unisex';
        if (cinsiyetUyumu) {
          score += 12;
        } else {
          score -= 15;
        }
        uyumKategorileri.push({
          kategori: 'Cinsiyet',
          uyum: cinsiyetUyumu,
          detay: parfum.cinsiyet
        });
      }

      // 4️⃣ MEVSİM UYUMU
      maxScore += 10;
      if (preferences.mevsim && parfum.mevsim && Array.isArray(parfum.mevsim)) {
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

      // 5️⃣ YOĞUNLUK UYUMU
      maxScore += 8;
      if (preferences.yogunluk && parfum.yogunluk === preferences.yogunluk) {
        score += 8;
        uyumKategorileri.push({
          kategori: 'Yoğunluk',
          uyum: true,
          detay: parfum.yogunluk
        });
      }

      // 6️⃣ KULLANIM AMACI
      maxScore += 8;
      if (preferences.kullanimAmaci && parfum.kullanimAmaci && Array.isArray(parfum.kullanimAmaci) && parfum.kullanimAmaci.includes(preferences.kullanimAmaci)) {
        score += 8;
        matchReasons.push('Kullanım amacınıza uygun');
      }

      // 7️⃣ KİŞİLİK UYUMU
      maxScore += 6;
      if (preferences.kisilikTipi && parfum.kisilikTipi?.includes(preferences.kisilikTipi)) {
        score += 6;
        matchReasons.push('Kişiliğinize uygun');
      }

      // 8️⃣ İZLENİM HEDEFİ
      maxScore += 6;
      if (preferences.izlenimHedefi && parfum.izlenim?.includes(preferences.izlenimHedefi)) {
        score += 6;
        matchReasons.push(`${preferences.izlenimHedefi} izlenimi için ideal`);
      }

      // 9️⃣ BÜTÇE UYUMU
      maxScore += 5;
      if (preferences.butce && parfum.fiyatAraligi) {
        const butceSirasi = ['ekonomik', 'orta', 'premium', 'luks'];
        const userBudgetIndex = butceSirasi.indexOf(preferences.butce);
        const parfumBudgetIndex = butceSirasi.indexOf(parfum.fiyatAraligi);
        
        if (parfumBudgetIndex <= userBudgetIndex) {
          score += 5;
        } else if (parfumBudgetIndex === userBudgetIndex + 1) {
          score += 2;
        }
      }

      // 🔟 YAŞ GRUBU
      maxScore += 4;
      if (preferences.yasGrubu && parfum.yasGrubu?.includes(preferences.yasGrubu)) {
        score += 4;
      }

      // 1️⃣1️⃣ GÜNÜN SAATİ
      maxScore += 4;
      if (preferences.gununSaati && parfum.gununSaati?.includes(preferences.gununSaati)) {
        score += 4;
      }

      // 1️⃣2️⃣ KALICILIK + pH
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

      // 1️⃣3️⃣ İKLİM
      maxScore += 4;
      if (preferences.iklim && parfum.iklim && Array.isArray(parfum.iklim) && parfum.iklim.includes(preferences.iklim)) {
        score += 4;
      }

      // 1️⃣4️⃣ KIYAFET STİLİ
      maxScore += 4;
      if (preferences.kiyafetStili && parfum.kiyafetStili && Array.isArray(parfum.kiyafetStili) && parfum.kiyafetStili.includes(preferences.kiyafetStili)) {
        score += 4;
      }

      // 1️⃣5️⃣ ORTAM
      maxScore += 3;
      if (preferences.ortam && parfum.ortam && (parfum.ortam === preferences.ortam || parfum.ortam === 'her_ikisi')) {
        score += 3;
      }

      // 1️⃣6️⃣ AKTİVİTE
      maxScore += 3;
      if (preferences.aktivite && parfum.aktivite && Array.isArray(parfum.aktivite) && parfum.aktivite.includes(preferences.aktivite)) {
        score += 3;
      }

      // 1️⃣7️⃣ SEVİLEN NOTALAR
      maxScore += 8;
      if (preferences.sevilenNotalar.length > 0 && parfum.notalar) {
        const ustNotalar = parfum.notalar.ust || [];
        const ortaNotalar = parfum.notalar.orta || [];
        const altNotalar = parfum.notalar.alt || [];
        const tumNotalar = [...ustNotalar, ...ortaNotalar, ...altNotalar];
        const eslesen = preferences.sevilenNotalar.filter(nota => 
          tumNotalar.some(n => n && n.toLowerCase().includes(nota.toLowerCase()))
        );
        if (eslesen.length > 0) {
          const notaPuani = Math.min(8, eslesen.length * 2);
          score += notaPuani;
          matchReasons.push(`Sevdiğiniz notalar: ${eslesen.slice(0, 2).join(', ')}`);
        }
      }

      // 1️⃣8️⃣ SEVİLMEYEN NOTALAR
      if (preferences.sevilmeyenNotalar.length > 0 && parfum.notalar) {
        const ustNotalar = parfum.notalar.ust || [];
        const ortaNotalar = parfum.notalar.orta || [];
        const altNotalar = parfum.notalar.alt || [];
        const tumNotalar = [...ustNotalar, ...ortaNotalar, ...altNotalar];
        const sevilmeyen = preferences.sevilmeyenNotalar.filter(nota => 
          tumNotalar.some(n => n && n.toLowerCase().includes(nota.toLowerCase()))
        );
        if (sevilmeyen.length > 0) {
          score -= sevilmeyen.length * 8;
        }
      }

      // 1️⃣9️⃣ CİLT HASSASİYETİ
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

      // 2️⃣0️⃣ ALERJİ
      if (preferences.alerjiDurumu.length > 0 && !preferences.alerjiDurumu.includes('yok')) {
        if (preferences.alerjiDurumu.includes('cicek') && parfum.tip === 'Çiçeksi') {
          score -= 20;
        }
        if (preferences.alerjiDurumu.includes('baharat') && parfum.tip === 'Baharatlı') {
          score -= 20;
        }
      }

      // 2️⃣1️⃣ KOKU ALMA
      if (preferences.kokuAlmaHassasiyeti === 'cok_yuksek' && parfum.yogunluk === 'yogun') {
        score -= 8;
      }

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

    const sortedResults = results
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 15);
    
    setRecommendations(sortedResults);
    return sortedResults;
  }, [parfumler, preferences, kullaniciPH, hesaplaParfumPHSkoru]);

  return (
    <AppContext.Provider
      value={{
        // Loading
        isLoading,
        isDataLoaded,
        
        // Core
        preferences,
        setPreference,
        toggleArrayPreference,
        resetPreferences,
        
        // pH
        setPHBilgiDurumu,
        setKullaniciPH,
        hesaplaPH,
        kullaniciPH,
        phSonucu,
        
        // Onboarding
        currentStep,
        setCurrentStep,
        isOnboardingComplete,
        setIsOnboardingComplete,
        
        // Recommendations
        recommendations,
        getRecommendations,
        
        // Parfüm
        parfumler,
        getParfumById,
        kokuTipleri,
        mevsimler,
        notalar,
        
        // Favoriler
        favorites,
        isFavorite,
        toggleFavoriteParfum,
        getFavoriteParfums,
        clearFavoritesList,
        
        // Koleksiyonlar
        collections,
        createNewCollection,
        addParfumToCollection,
        removeParfumFromCollection,
        removeCollection,
        getCollectionParfums,
        clearCollectionsList,
        
        // Son Görüntülenenler
        recentlyViewed,
        addToRecentlyViewedList,
        getRecentlyViewedParfums,
        clearRecentlyViewedList,
        
        // Arama Geçmişi
        searchHistory,
        addSearchToHistory: addSearchToHistoryFn,
        removeSearchFromHistory: removeSearchFromHistoryFn,
        clearSearchHistoryList,
        
        // Veri Yönetimi
        resetAllData,
        refreshData,
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
