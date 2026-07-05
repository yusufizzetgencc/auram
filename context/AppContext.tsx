/**
 * AURAM - Lüks Parfüm Öneri Uygulaması
 * Global State Management + Gelişmiş pH Hesaplama Sistemi + Veri Kalıcılığı
 */

import parfumData from '@/data/parfumler.json';
import { getPHAraligi, hesaplaParfumPHSkoruPure, hesaplaPHPure } from '@/engine';
import {
  addPerformanceLog,
  addSotdEntry,
  addToRecentlyViewed,
  addToSearchHistory,
  clearAllData,
  clearRecentlyViewed,
  clearSearchHistory,
  Collection,
  createCollection,
  deleteCollection,
  loadAllUserDataExtended,
  RecentlyViewedItem,
  removeFromSearchHistory,
  saveCollections,
  saveFavorites,
  saveOnboardingStatus,
  saveStreakData,
  saveUserPreferences,
  SearchHistoryItem,
  toggleFavorite
} from '@/services/storage';
import {
  KokuTipi,
  MonthlyStats,
  Parfum,
  ParfumPHSkor,
  PerformanceLog,
  PHBilgiDurumu,
  PHHesapSonucu,
  RecommendationResult,
  SOTDEntry,
  StreakData,
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
  kullanimAmaci: [],
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
    return hesaplaParfumPHSkoruPure(parfum, userPH, preferences.ciltTipi);
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
      maxScore += 20;
      let phUyumPuan = (phSkor.phUyumSkoru / 100) * 20;
      
      // Eğer kullanıcı parfümü "sadece kıyafete" sıkıyorsa pH'ın etkisi sıfırlanır/azaltılır, 
      // çünkü koku tenle reaksiyona girmeyecektir.
      if (preferences.uygulamaYeri === 'sadece_kiyafet') {
        phUyumPuan = 20; // Kıyafette tam uyum sayılır
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

      // --- 1.5 TOPLAM PERFORMANS ---
      maxScore += 15;
      let performansPuan = (phSkor.toplamPerformans / 100) * 15;
      score += performansPuan;
      
      if (phSkor.toplamPerformans >= 75) {
        matchReasons.push(`Ten kimyanızda çok yüksek performans (${phSkor.aciklama.toLowerCase()}).`);
        uyumKategorileri.push({ kategori: 'Koku Performansı', uyum: true, detay: 'Yüksek kalıcılık ve yayılım' });
      } else if (phSkor.toplamPerformans < 50) {
        uyumKategorileri.push({ kategori: 'Koku Performansı', uyum: false, detay: 'Ortalama altı performans beklentisi' });
      } else {
        uyumKategorileri.push({ kategori: 'Koku Performansı', uyum: true, detay: 'Dengeli performans' });
      }

      // --- 1.6 KALICILIK MODİFİKASYONU ---
      if (phSkor.kalicilikModifikasyonu > 0) {
        matchReasons.push(`Yağlı cilt yapınız bu "${parfum.kalicilik}" kalıcılıktaki parfümü normalden daha uzun tutacaktır.`);
      } else if (phSkor.kalicilikModifikasyonu < 0) {
        matchReasons.push(`Kuru cilt yapınız bu "${parfum.kalicilik}" kalıcılıktaki parfümü normalden daha hızlı uçuracaktır.`);
      }

      // --- 2. KOKU AİLESİ UYUMU ---
      maxScore += 15;
      if (preferences.kokuTipleri.length > 0) {
        const tipUyumu = preferences.kokuTipleri.includes(parfum.tip as KokuTipi);
        const ikincilUyum = parfum.ikincilTip && preferences.kokuTipleri.includes(parfum.ikincilTip as KokuTipi);
        
        if (tipUyumu) {
          score += 13.5;
          matchReasons.push(`Sevdiğiniz "${parfum.tip}" koku ailesine ait.`);
        }
        if (ikincilUyum) {
          score += 1.5;
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
      maxScore += 1;
      if (preferences.cinsiyetAlgisi) {
        let cinsiyetUyumu = false;
        if (preferences.cinsiyetAlgisi === 'feminen' && (parfum.cinsiyet === 'kadın' || parfum.cinsiyet === 'unisex')) cinsiyetUyumu = true;
        if (preferences.cinsiyetAlgisi === 'maskulen' && (parfum.cinsiyet === 'erkek' || parfum.cinsiyet === 'unisex')) cinsiyetUyumu = true;
        if (preferences.cinsiyetAlgisi === 'unisex' && parfum.cinsiyet === 'unisex') cinsiyetUyumu = true;

        if (cinsiyetUyumu) {
          score += 1;
        }
      }

      // --- 5. VÜCUT ISISI (YAYILIM) ---
      maxScore += 10;
      if (preferences.vucutIsisi) {
        const isiYogunlukTablosu: Record<string, Record<string, number>> = {
          sicak: { hafif: 10, orta: 6, yogun: 2 },
          serin: { hafif: 4, orta: 7, yogun: 10 },
          dengeli: { hafif: 7, orta: 8, yogun: 7 }
        };
        const isiPuan = isiYogunlukTablosu[preferences.vucutIsisi]?.[parfum.yogunluk] || 8;
        score += isiPuan;
        
        if (preferences.vucutIsisi === 'serin' && parfum.yogunluk === 'yogun') {
          matchReasons.push('Serin ten yapınız yoğun parfümü nazikçe açacaktır.');
        } else if (preferences.vucutIsisi === 'sicak' && parfum.yogunluk === 'hafif') {
          matchReasons.push('Sıcak ten yapınız hafif parfümü daha canlı ve fark edilir kılacaktır.');
        }
      }

      // --- 6. MEVSİM UYUMU ---
      maxScore += 10;
      if (!preferences.mevsim || preferences.mevsim === 'Tüm Mevsimler') {
        score += 10;
      } else {
        if (parfum.mevsim?.includes(preferences.mevsim)) {
          score += 10;
          matchReasons.push(`${preferences.mevsim} mevsimi için ideal bir seçim.`);
        } else {
          score += 2;
          uyumKategorileri.push({ kategori: 'Mevsim', uyum: false, detay: `${preferences.mevsim} mevsimi için en uygun seçenek olmayabilir` });
        }
      }

      // --- 7. ORTAM UYUMU ---
      maxScore += 3;
      if (preferences.ortam) {
        if (parfum.ortam === preferences.ortam || parfum.ortam === 'her_ikisi') {
          score += 3;
        } else if (preferences.ortam === 'kapali' && parfum.yogunluk === 'yogun') {
          score -= 5; // Kapalı ortamda yoğun koku eksi puan
        }
      }

      // --- 8. KİMAFİT STİLİ UYUMU ---
      maxScore += 1;
      if (preferences.kiyafetStili && parfum.kiyafetStili?.includes(preferences.kiyafetStili)) {
        score += 1;
      }

      // --- 9. KONSANTRASYON UYUMU ---
      maxScore += 5;
      if (!preferences.konsantrasyonTercihi || preferences.konsantrasyonTercihi === 'fark_etmez') {
        score += 5;
      } else if (parfum.konsantrasyon) {
        if (parfum.konsantrasyon === preferences.konsantrasyonTercihi) {
          score += 5;
          matchReasons.push("Aradığınız yoğunluk ve kalıcılık seviyesine tam uyum.");
        } else {
          score += 1;
        }
      } else {
        score += 1; // Tanımsızsa düşük puan ver
      }

      // --- 10. KULLANIM AMACI UYUMU ---
      maxScore += 5;
      if (!preferences.kullanimAmaci || preferences.kullanimAmaci.length === 0) {
        score += 5;
      } else {
        const hasIntersection = preferences.kullanimAmaci.some(amac => parfum.kullanimAmaci?.includes(amac));
        if (hasIntersection) {
          score += 5;
          matchReasons.push("Belirttiğiniz kullanım amaçlarına uygun bir seçim.");
        } else {
          score += 1;
        }
      }

      // --- 11. KAÇINILACAK NOTALAR (KIRMIZI ÇİZGİ) ---
      if (preferences.kacinilacakNotalar.length > 0) {
        const tumNotalarArr = [...(parfum.notalar.ust||[]), ...(parfum.notalar.orta||[]), ...(parfum.notalar.alt||[])].map(n => n.toLowerCase());
        
        const hasNote = (keywords: string[]) => {
          return tumNotalarArr.some(nota => 
            keywords.some(k => nota === k || nota.includes(k + ' ') || nota.includes(' ' + k))
          );
        };

        let hasBadNote = false;
        if (preferences.kacinilacakNotalar.includes('Aşırı şekerli') && hasNote(['vanilya', 'karamel', 'pralin'])) hasBadNote = true;
        if (preferences.kacinilacakNotalar.includes('Baskın çiçek') && hasNote(['gül', 'yasemin', 'sümbül'])) hasBadNote = true;
        if (preferences.kacinilacakNotalar.includes('Deri veya tütün') && hasNote(['deri', 'tütün', 'is', 'isli'])) hasBadNote = true;
        if (preferences.kacinilacakNotalar.includes('Ağır hayvansi misk') && hasNote(['misk', 'amber', 'paçuli'])) hasBadNote = true;
        if (preferences.kacinilacakNotalar.includes('Yoğun baharat') && hasNote(['biber', 'tarçın', 'karanfil', 'kakule'])) hasBadNote = true;
        if (preferences.kacinilacakNotalar.includes('Odunsu dumanlı') && hasNote(['vetiver', 'sedir', 'sandal ağacı'])) hasBadNote = true;
        
        if (hasBadNote) {
          score -= 40; // Çok güçlü eksi puan
          uyumKategorileri.push({ kategori: 'Rahatsız Edici Notalar', uyum: false, detay: 'İçeriğinde hassas olduğunuz notalar var' });
        }
      }

      // --- 12. KOKU HASSASİYETİ ---
      if (preferences.kokuAlmaHassasiyeti === 'cok_yuksek' && parfum.yogunluk === 'yogun') {
        score -= 15;
      }

      const matchPercentage = Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)));

      if (score > 10) {
        if (matchReasons.length === 0) {
          matchReasons.push('Genel profilinizle uyumlu dengeli bir seçim.');
        }
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
      .slice(0, 5);
    
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
