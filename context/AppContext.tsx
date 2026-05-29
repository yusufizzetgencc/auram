/**
 * AURAM - Lüks Parfüm Öneri Uygulaması
 * Global State Management + Gelişmiş pH Hesaplama Sistemi + Veri Kalıcılığı
 */

import parfumData from '@/data/parfumler.json';
import {
  Collection,
  RecentlyViewedItem,
  SearchHistoryItem,
  loadAllUserDataExtended,
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
  addSotdEntry,
  saveStreakData,
  addPerformanceLog,
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
    UserPreferences,
    SOTDEntry,
    StreakData,
    PerformanceLog,
    MonthlyStats
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
  
  // ============ SOTD & PERFORMANS ============
  sotdHistory: SOTDEntry[];
  streakData: StreakData;
  performanceLogs: PerformanceLog[];
  todaySotd: SOTDEntry | null;
  selectTodaysSotd: (parfumId: string, weather?: any) => Promise<void>;
  logPerformance: (parfumId: string, data: Omit<PerformanceLog, 'id' | 'createdAt' | 'parfumId'>) => Promise<void>;
  getMonthlyStats: (month: number, year: number) => MonthlyStats;
}

const defaultPHInfo: UserPHInfo = {
  biliyorMu: 'bilmiyorum',
  deger: null,
  tahminiDeger: null,
  aralik: null,
};

const defaultPreferences: UserPreferences = {
  phInfo: defaultPHInfo,
  
  // 🧬 Bölüm 1: Biyolojik İmza ve pH Analizi
  ciltTipi: null,
  gumusOksitlenme: null,
  suTuketimi: null,
  beslenmeAliskanligi: null,
  terlemeOrani: null,
  vucutIsisi: null,

  // 🧪 Bölüm 2: Koku Reaksiyonu ve Uygulama Alışkanlığı
  parfumReaksiyonu: null,
  uygulamaYeri: null,
  kokuAlmaHassasiyeti: null,

  // 🎭 Bölüm 3: Aura ve Koku Karakteri
  aura: null,
  kokuTipleri: [],
  kacinilacakNotalar: [],
  cinsiyetAlgisi: null,

  // 👔 Bölüm 4: Yaşam Dinamikleri
  ortam: null,
  kiyafetStili: null,

  // Geriye dönük uyumluluk veya ileride kullanılabilecek boş alanlar
  yasGrubu: null,
  kisilikTipi: null,
  deneyimSeviyesi: null,
  kullanimSikligi: null,
  butce: null,
  markaTercihi: null,
  konsantrasyonTercihi: null,
  yogunluk: null,
  izlenimHedefi: null,
  kullanimAmaci: null,
  gununSaati: null,
  cinsiyet: null,
  ciltHassasiyeti: null,
  alerjiDurumu: [],
  mevsim: null,
  iklim: null,
  aktivite: null,
  sevilenNotalar: [],
  sevilmeyenNotalar: [],
  kalicilikTercihi: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const getPHAraligi = (ph: number): PHAraligi => {
  if (ph < 5.0) return 'asidik';
  if (ph > 6.0) return 'bazik';
  return 'normal';
};

// Saf (Pure) pH Hesaplama Fonksiyonu - Side effect içermez, render anında çağrılabilir
export const hesaplaPHPure = (preferences: UserPreferences): PHHesapSonucu => {
  let tahminiPH = 5.5; 
  let asidikEtki = 0;
  let alkaliEtki = 0;

  if (preferences.ciltTipi === 'kuru') asidikEtki += 0.2;
  if (preferences.ciltTipi === 'yagli') alkaliEtki += 0.2;

  if (preferences.gumusOksitlenme === 'asidik') asidikEtki += 0.5;
  if (preferences.gumusOksitlenme === 'notr_alkali') alkaliEtki += 0.3;

  if (preferences.suTuketimi === 'az') asidikEtki += 0.3;
  if (preferences.suTuketimi === 'cok') {
    asidikEtki *= 0.5;
    alkaliEtki *= 0.5;
  }

  if (preferences.beslenmeAliskanligi === 'asidik') asidikEtki += 0.4;
  if (preferences.beslenmeAliskanligi === 'alkali') alkaliEtki += 0.4;

  if (preferences.terlemeOrani === 'cok') asidikEtki += 0.3;
  
  if (preferences.parfumReaksiyonu === 'tatli_pudrali') alkaliEtki += 0.3;
  if (preferences.parfumReaksiyonu === 'eksi_uzaklasir') asidikEtki += 0.4;

  tahminiPH = tahminiPH - asidikEtki + alkaliEtki;
  tahminiPH = Math.max(4.0, Math.min(7.0, Number(tahminiPH.toFixed(2))));
  
  const aralik = getPHAraligi(tahminiPH);

  let guvenilirlik = 50;
  if (preferences.gumusOksitlenme) guvenilirlik += 10;
  if (preferences.beslenmeAliskanligi) guvenilirlik += 10;
  if (preferences.parfumReaksiyonu) guvenilirlik += 15;
  if (preferences.suTuketimi) guvenilirlik += 5;
  if (preferences.terlemeOrani) guvenilirlik += 10;

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
      ciltTipiEtkisi: asidikEtki > alkaliEtki ? -0.1 : 0.1,
      terlemeEtkisi: 0,
      hassasiyetEtkisi: 0,
    }
  };
};

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

  // ============ SOTD & PERFORMANS ============
  const [sotdHistory, setSotdHistory] = useState<SOTDEntry[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({ currentStreak: 0, longestStreak: 0, lastSOTDDate: null, totalSOTDs: 0, badges: [] });
  const [performanceLogs, setPerformanceLogs] = useState<PerformanceLog[]>([]);
  
  const todaySotd = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return sotdHistory.find(e => e.date === today) || null;
  }, [sotdHistory]);

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
        
        const storedData = await loadAllUserDataExtended(defaultPreferences);
        
        setPreferences(storedData.preferences);
        setIsOnboardingCompleteState(storedData.isOnboardingComplete);
        setCurrentStepState(storedData.currentStep);
        setFavorites(storedData.favorites);
        setCollections(storedData.collections);
        setRecentlyViewed(storedData.recentlyViewed);
        setSearchHistory(storedData.searchHistory);
        setSotdHistory(storedData.sotdHistory || []);
        if (storedData.streakData) setStreakData(storedData.streakData);
        setPerformanceLogs(storedData.performanceLogs || []);
        
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
      const currentArray = (prev[key] as string[]) || [];
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
    const sonuc = hesaplaPHPure(preferences);
    setPHSonucu(sonuc);
    setPreferences(prev => {
      const newPrefs = {
        ...prev,
        phInfo: { ...prev.phInfo, tahminiDeger: sonuc.tahminiPH, aralik: sonuc.aralik }
      };
      saveUserPreferences(newPrefs);
      return newPrefs;
    });

    return sonuc;
  }, [preferences]);

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
    const storedData = await loadAllUserDataExtended(defaultPreferences);
    
    setFavorites(storedData.favorites);
    setCollections(storedData.collections);
    setRecentlyViewed(storedData.recentlyViewed);
    setSearchHistory(storedData.searchHistory);
    setSotdHistory(storedData.sotdHistory || []);
    if (storedData.streakData) setStreakData(storedData.streakData);
    setPerformanceLogs(storedData.performanceLogs || []);
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

      // --- 1. pH UYUMU VE UYGULAMA YERİ (EN KRİTİK) ---
      maxScore += 25;
      let phUyumPuan = (phSkor.phUyumSkoru / 100) * 25;
      
      // Eğer kullanıcı parfümü "sadece kıyafete" sıkıyorsa pH'ın etkisi sıfırlanır/azaltılır, 
      // çünkü koku tenle reaksiyona girmeyecektir.
      if (preferences.uygulamaYeri === 'sadece_kiyafet') {
        phUyumPuan = 25; // Kıyafette tam uyum sayılır
        matchReasons.push('Kıyafete sıktığınız için ten kimyası reaksiyonu minimumda kalır.');
        uyumKategorileri.push({ kategori: 'pH Uyumu (Kıyafet)', uyum: true, detay: 'Kıyafette tam uyum' });
      } else {
        if (phSkor.phUyumSkoru >= 70) {
          matchReasons.push(`Ten pH'ınızla %${Math.round(phSkor.phUyumSkoru)} kimyasal uyum.`);
        }
        uyumKategorileri.push({
          kategori: 'Ten Kimyası (pH)',
          uyum: phSkor.phUyumSkoru >= 50,
          detay: `%${Math.round(phSkor.phUyumSkoru)} uyum`
        });
      }
      score += phUyumPuan;

      // --- 2. KOKU AİLESİ UYUMU ---
      maxScore += 20;
      if (preferences.kokuTipleri.length > 0) {
        const tipUyumu = preferences.kokuTipleri.includes(parfum.tip as KokuTipi);
        const ikincilUyum = parfum.ikincilTip && preferences.kokuTipleri.includes(parfum.ikincilTip as KokuTipi);
        
        if (tipUyumu) {
          score += 18;
          matchReasons.push(`Sevdiğiniz "${parfum.tip}" koku ailesine ait.`);
        }
        if (ikincilUyum) {
          score += 2;
        }
        uyumKategorileri.push({
          kategori: 'Koku Ailesi',
          uyum: tipUyumu || !!ikincilUyum,
          detay: tipUyumu ? parfum.tip : 'Uyumsuz'
        });
      }

      // --- 3. AURA & KAREKTER (İzlenim Hedefi yerine) ---
      maxScore += 15;
      if (preferences.aura) {
        // Auraları parfümün mevcut özellikleriyle eşleştirelim (izlenimHedefi veya kisilikTipi üzerinden tahmini bir eşleşme yapıyoruz)
        const auraMap: Record<string, string[]> = {
          temiz: ['taze', 'dogal', 'profesyonel'],
          gizemli: ['gizemli', 'mistik', 'sofistike'],
          cekici: ['cekici', 'sicak', 'romantik'],
          dinamik: ['enerjik', 'dinamik', 'sportif'],
          otoriter: ['profesyonel', 'cesur', 'sofistike']
        };
        const istenenOzellikler = auraMap[preferences.aura] || [];
        const parfumOzellikleri = [...(parfum.izlenim || []), ...(parfum.kisilikTipi || [])];
        
        const auraUyumu = istenenOzellikler.some(o => parfumOzellikleri.includes(o as any));
        if (auraUyumu) {
          score += 15;
          matchReasons.push(`Arzuladığınız "${preferences.aura}" auraya tam uyum.`);
        }
      }

      // --- 4. CİNSİYET ALGISI ---
      maxScore += 10;
      if (preferences.cinsiyetAlgisi) {
        let cinsiyetUyumu = false;
        if (preferences.cinsiyetAlgisi === 'feminen' && (parfum.cinsiyet === 'kadın' || parfum.cinsiyet === 'unisex')) cinsiyetUyumu = true;
        if (preferences.cinsiyetAlgisi === 'maskulen' && (parfum.cinsiyet === 'erkek' || parfum.cinsiyet === 'unisex')) cinsiyetUyumu = true;
        if (preferences.cinsiyetAlgisi === 'unisex' && parfum.cinsiyet === 'unisex') cinsiyetUyumu = true;

        if (cinsiyetUyumu) {
          score += 10;
        }
      }

      // --- 5. VÜCUT ISISI (YAYILIM) ---
      maxScore += 10;
      if (preferences.vucutIsisi) {
        // Sıcak vücut yayılımı artırır, bu yüzden çok yoğun parfümler boğucu olabilir.
        if (preferences.vucutIsisi === 'sicak' && parfum.yogunluk === 'yogun') {
          score += 2; // Düşük puan
        } else if (preferences.vucutIsisi === 'serin' && parfum.yogunluk === 'yogun') {
          score += 10; // Yüksek puan (serin ten yayılımı yavaşlatır, yoğun koku denge sağlar)
          matchReasons.push('Serin ten yapınız yoğun parfümü nazikçe açacaktır.');
        } else {
          score += 8; // Normal uyum
        }
      }

      // --- 6. ORTAM UYUMU ---
      maxScore += 10;
      if (preferences.ortam) {
        if (parfum.ortam === preferences.ortam || parfum.ortam === 'her_ikisi') {
          score += 10;
        } else if (preferences.ortam === 'kapali' && parfum.yogunluk === 'yogun') {
          score -= 5; // Kapalı ortamda yoğun koku eksi puan
        }
      }

      // --- 7. KİMAFİT STİLİ UYUMU ---
      maxScore += 10;
      if (preferences.kiyafetStili && parfum.kiyafetStili?.includes(preferences.kiyafetStili)) {
        score += 10;
      }

      // --- 8. KAÇINILACAK NOTALAR (KIRMIZI ÇİZGİ) ---
      if (preferences.kacinilacakNotalar.length > 0) {
        const tumNotalar = [...(parfum.notalar.ust||[]), ...(parfum.notalar.orta||[]), ...(parfum.notalar.alt||[])].join(' ').toLowerCase();
        
        let hasBadNote = false;
        if (preferences.kacinilacakNotalar.includes('Aşırı şekerli') && (tumNotalar.includes('vanilya') || tumNotalar.includes('karamel') || tumNotalar.includes('pralin'))) hasBadNote = true;
        if (preferences.kacinilacakNotalar.includes('Baskın çiçek') && (tumNotalar.includes('gül') || tumNotalar.includes('yasemin') || tumNotalar.includes('sümbül'))) hasBadNote = true;
        if (preferences.kacinilacakNotalar.includes('Deri veya tütün') && (tumNotalar.includes('deri') || tumNotalar.includes('tütün') || tumNotalar.includes('is'))) hasBadNote = true;
        
        if (hasBadNote) {
          score -= 40; // Çok güçlü eksi puan
          uyumKategorileri.push({ kategori: 'Rahatsız Edici Notalar', uyum: false, detay: 'İçeriğinde hassas olduğunuz notalar var' });
        }
      }

      // --- 9. KOKU HASSASİYETİ ---
      if (preferences.kokuAlmaHassasiyeti === 'cok_yuksek' && parfum.yogunluk === 'yogun') {
        score -= 15;
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

  // ============ SOTD & PERFORMANS FONKSİYONLARI ============
  const selectTodaysSotd = useCallback(async (parfumId: string, weather?: any) => {
    const entry = await addSotdEntry(parfumId, weather);
    setSotdHistory(prev => {
      const today = new Date().toISOString().split('T')[0];
      const filtered = prev.filter(e => e.date !== today);
      return [entry, ...filtered];
    });

    // Update streak logic
    setStreakData(prev => {
      const today = new Date().toISOString().split('T')[0];
      let newStreak = prev.currentStreak;
      
      if (prev.lastSOTDDate !== today) {
        // Calculate days difference
        if (prev.lastSOTDDate) {
          const lastDate = new Date(prev.lastSOTDDate);
          const currentDate = new Date(today);
          const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
        } else {
          newStreak = 1;
        }
      }

      const newData: StreakData = {
        ...prev,
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
        lastSOTDDate: today,
        totalSOTDs: prev.lastSOTDDate !== today ? prev.totalSOTDs + 1 : prev.totalSOTDs
      };
      
      saveStreakData(newData);
      return newData;
    });
  }, []);

  const logPerformance = useCallback(async (parfumId: string, data: Omit<PerformanceLog, 'id' | 'createdAt' | 'parfumId'>) => {
    const log = await addPerformanceLog({ ...data, parfumId });
    setPerformanceLogs(prev => {
      const filtered = prev.filter(l => l.date !== log.date);
      return [log, ...filtered];
    });
  }, []);

  const getMonthlyStats = useCallback((month: number, year: number): MonthlyStats => {
    const logsForMonth = performanceLogs.filter(log => {
      const date = new Date(log.date);
      return date.getMonth() + 1 === month && date.getFullYear() === year;
    });

    const totalDays = logsForMonth.length;
    let mostUsedParfumId: string | null = null;
    let mostComplimentedParfumId: string | null = null;
    let averageLongevity = 0;
    let complimentRate = 0;
    const topParfums: { parfumId: string; count: number; compliments: number }[] = [];

    if (totalDays > 0) {
      const parfumCounts: Record<string, { count: number; compliments: number }> = {};
      let totalLongevity = 0;
      let totalCompliments = 0;

      logsForMonth.forEach(log => {
        totalLongevity += log.longevity;
        if (log.compliment) totalCompliments += 1;

        if (!parfumCounts[log.parfumId]) {
          parfumCounts[log.parfumId] = { count: 0, compliments: 0 };
        }
        parfumCounts[log.parfumId].count += 1;
        if (log.compliment) parfumCounts[log.parfumId].compliments += 1;
      });

      averageLongevity = Number((totalLongevity / totalDays).toFixed(1));
      complimentRate = Math.round((totalCompliments / totalDays) * 100);

      Object.entries(parfumCounts).forEach(([parfumId, data]) => {
        topParfums.push({ parfumId, count: data.count, compliments: data.compliments });
      });

      topParfums.sort((a, b) => b.count - a.count);
      
      if (topParfums.length > 0) {
        mostUsedParfumId = topParfums[0].parfumId;
        const sortedByCompliments = [...topParfums].sort((a, b) => b.compliments - a.compliments);
        mostComplimentedParfumId = sortedByCompliments[0].parfumId;
      }
    }

    return {
      month,
      year,
      totalDays,
      mostUsedParfumId,
      mostComplimentedParfumId,
      averageLongevity,
      complimentRate,
      topParfums: topParfums.slice(0, 5) // Top 5
    };
  }, [performanceLogs]);

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
        
        // SOTD & Performans
        sotdHistory,
        streakData,
        performanceLogs,
        todaySotd,
        selectTodaysSotd,
        logPerformance,
        getMonthlyStats,
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
