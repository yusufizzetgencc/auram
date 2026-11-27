/**
 * TENİNDE - Lüks Parfüm Öneri Uygulaması
 * Global State Management + Gelişmiş pH Hesaplama Sistemi + Veri Kalıcılığı
 */

import { clearWidget } from '@/services/widget';
import { toLocalDateKey } from '@/utils/date';
import parfumData from '@/data/parfumler.json';
import { AramaBaglami, etkinTercihler, getEffectivePH, getPHAraligi, getRecommendationsPure, hesaplaParfumPHSkoruPure, hesaplaPHPure, kisiselModel, KisiselModel, seriGuncelle, zenginlestirParfum, ZevkBaglami, zevkBaglami } from '@/engine';
import { hapticSuccess } from '@/utils/haptics';
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
  LearningState,
  loadLearning,
  loadTodayPlan,
  loadWardrobe,
  saveLearning,
  saveWardrobe,
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
  Etkinlik,
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
  WardrobeItem,
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
  getRecommendations: (prefsOverride?: UserPreferences) => RecommendationResult[];
  
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
  /** Depodaki veriyi yeniden okur (ör. yedek geri yüklendikten sonra) */
  reloadFromStorage: () => Promise<void>;
  refreshData: () => Promise<void>;
  
  // ============ SOTD & PERFORMANS ============
  sotdHistory: SOTDEntry[];
  streakData: StreakData;
  performanceLogs: PerformanceLog[];
  todaySotd: SOTDEntry | null;
  /** Günün kokusunu kaydeder. Seri koruma hakkı kullanıldıysa true döner. */
  selectTodaysSotd: (parfumId: string, weather?: any, etkinlik?: Etkinlik) => Promise<{ korumaKullanildi: boolean }>;

  // ============ ÖĞRENEN MOTOR ============
  /** Davranışınızdan öğrenilen model (engine/learning.ts) */
  ogrenme: KisiselModel;
  /** Sevilen/sevilmeyenler + öğrenilen model; skorlaParfum'a 4. parametre olarak verin */
  zevk: ZevkBaglami | undefined;
  /** "Şu an ne arıyorsunuz?" — geçici bağlam (mevsim/amaç/ortam/yoğunluk); kalıcı profili değiştirmez, oturumla sınırlı */
  aramaBaglami: AramaBaglami;
  setAramaBaglami: (degisim: Partial<AramaBaglami>) => void;
  sifirlaAramaBaglami: () => void;
  /** Puanlamada kullanılacak tercihler: profil + bağlam + otomatik mevsim. Ekranlar skorlamada `preferences` yerine bunu kullanır. */
  etkinPrefs: UserPreferences;
  /** Bugün ekranında "Başka" ile geçilen öneri (zayıf olumsuz sinyal) */
  recordSkip: (parfumId: string, etkinlik?: Etkinlik) => void;
  /** "Bu doğru değil": tespitin etkisini kaldırır */
  rejectInsight: (id: string) => Promise<void>;
  /** Reddedilen tespitleri geri getirir */
  resetRejectedInsights: () => Promise<void>;
  reddedilenTespitler: string[];

  // ============ DOLABIM ============
  wardrobe: WardrobeItem[];
  isInWardrobe: (parfumId: string) => boolean;
  addToWardrobe: (parfumId: string, detay?: Partial<Pick<WardrobeItem, 'hacimMl' | 'kalanYuzde' | 'alinmaTarihi' | 'not'>>) => Promise<void>;
  updateWardrobeItem: (id: string, patch: Partial<Omit<WardrobeItem, 'id' | 'parfumId' | 'addedAt'>>) => Promise<void>;
  removeFromWardrobe: (id: string) => Promise<void>;
  /** Dolaptaki parfümler (katalogla eşleşenler) */
  wardrobeParfums: Parfum[];
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
  userName: null,
  avatarEmoji: null,
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
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [learning, setLearning] = useState<LearningState>({ gecilenler: [], reddedilen: [] });
  
  const todaySotd = useMemo(() => {
    const today = toLocalDateKey();
    return sotdHistory.find(e => e.date === today) || null;
  }, [sotdHistory]);

  // ============ PARFÜM VERİLERİ ============
  const parfumler = useMemo(
    () => (parfumData.parfumler as unknown as Parfum[]).map(zenginlestirParfum),
    []
  );
  const kokuTipleri = parfumData.kokuTipleri;
  const mevsimler = parfumData.mevsimler;
  const notalar = parfumData.notalar;

  // ============ İLK YÜKLEME (yedek geri yüklenince de çağrılır) ============
  const reloadFromStorage = useCallback(async (): Promise<void> => {
      try {
        setIsLoading(true);
        
        const storedData = await loadAllUserDataExtended(defaultPreferences);

        // Eski sürümlerden kalan storage verisinde yeni eklenen alanlar (örn. phInfo)
        // eksik olabilir — bu yüzden default değerlerle güvenli birleştirme yapılır.
        setPreferences({
          ...defaultPreferences,
          ...storedData.preferences,
          phInfo: { ...defaultPHInfo, ...storedData.preferences?.phInfo },
        });
        setIsOnboardingCompleteState(storedData.isOnboardingComplete);
        setCurrentStepState(storedData.currentStep);
        setFavorites(storedData.favorites);
        setCollections(storedData.collections);
        setRecentlyViewed(storedData.recentlyViewed);
        setSearchHistory(storedData.searchHistory);
        setSotdHistory(storedData.sotdHistory || []);
        if (storedData.streakData) setStreakData(storedData.streakData);
        setPerformanceLogs(storedData.performanceLogs || []);
        setWardrobe(await loadWardrobe());
        setLearning(await loadLearning());
        
        setIsDataLoaded(true);
      } catch (error) {
        console.error('[AppContext] Veri yükleme hatası:', error);
        setIsDataLoaded(true);
      } finally {
        setIsLoading(false);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { reloadFromStorage(); }, [reloadFromStorage]);

  // Kullanıcının efektif pH değeri
  const kullaniciPH = useMemo(() => getEffectivePH(preferences), [preferences]);

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
    clearWidget();
    
    setPreferences(defaultPreferences);
    setCurrentStepState(0);
    setIsOnboardingCompleteState(false);
    setRecommendations([]);
    setPHSonucu(null);
    setFavorites([]);
    setCollections([]);
    setRecentlyViewed([]);
    setSearchHistory([]);
    // Önceden eksikti: silme sonrası bellekte eski günlük/seri verisi kalıyordu
    setSotdHistory([]);
    setStreakData({ currentStreak: 0, longestStreak: 0, lastSOTDDate: null, totalSOTDs: 0, badges: [] });
    setPerformanceLogs([]);
    setLearning({ gecilenler: [], reddedilen: [] });
    setWardrobe([]);
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
    setWardrobe(await loadWardrobe());
  }, []);

  // ============ pH SKOR HESAPLAMA ============
  const hesaplaParfumPHSkoru = useCallback((parfum: Parfum, userPH: number): ParfumPHSkor => {
    return hesaplaParfumPHSkoruPure(parfum, userPH, preferences.ciltTipi);
  }, [preferences.ciltTipi]);

  // ============ ÖNERİ ALGORİTMASI ============
  // Puanlama mantığı engine/scoring.ts içinde saf fonksiyon olarak yaşar.
  // pH her çağrıda güncel tercihlerden yeniden hesaplanır → state gecikmesi yok.
  // ============ ÖĞRENEN MOTOR ============
  // Model her veri değişiminde cihazda yeniden kurulur (saf fonksiyon, ~100 parfüm için milisaniyeler)
  const ogrenme = useMemo(() => kisiselModel({
    bugun: toLocalDateKey(),
    katalog: parfumler,
    prefs: preferences,
    ph: getEffectivePH(preferences),
    dolap: wardrobe.map(w => w.parfumId),
    favoriler: favorites,
    gunluk: sotdHistory.map(s => ({ parfumId: s.parfumId, date: s.date, etkinlik: s.etkinlik })),
    degerlendirmeler: performanceLogs,
    gecilenler: learning.gecilenler,
    reddedilen: learning.reddedilen,
  }), [parfumler, preferences, wardrobe, favorites, sotdHistory, performanceLogs, learning]);

  const zevk = useMemo(() => zevkBaglami(parfumler, preferences, ogrenme), [parfumler, preferences, ogrenme]);

  const [aramaBaglami, setAramaBaglamiState] = useState<AramaBaglami>({});
  const setAramaBaglami = useCallback((degisim: Partial<AramaBaglami>) => setAramaBaglamiState(prev => ({ ...prev, ...degisim })), []);
  const sifirlaAramaBaglami = useCallback(() => setAramaBaglamiState({}), []);
  // Mevsim, bağlamda seçilmediyse bugünün tarihinden gelir (onboarding'de sorulmaz)
  const etkinPrefs = useMemo(() => etkinTercihler(preferences, aramaBaglami), [preferences, aramaBaglami]);

  // Öneri listesi canlı kalır: tercih değişikliği veya öğrenen motora giren her yeni sinyal
  // (Sevdim/Sevmedim, akşam puanı, dolap, favori, "Başka") listeyi yeniden sıralar.
  // Aksi halde "Önerilerim" yalnızca test bittiği anki hali gösterirdi.
  useEffect(() => {
    if (!isOnboardingComplete || parfumler.length === 0) return;
    setRecommendations(getRecommendationsPure(parfumler, etkinPrefs, undefined, undefined, zevk));
  }, [isOnboardingComplete, parfumler, etkinPrefs, zevk]);

  const recordSkip = useCallback((parfumId: string, etkinlik?: Etkinlik) => {
    setLearning(prev => {
      const next = { ...prev, gecilenler: [...prev.gecilenler, { parfumId, tarih: toLocalDateKey(), ...(etkinlik ? { etkinlik } : {}) }] };
      saveLearning(next);
      return next;
    });
  }, []);

  const rejectInsight = useCallback(async (id: string) => {
    setLearning(prev => {
      const next = { ...prev, reddedilen: [...new Set([...prev.reddedilen, id])] };
      saveLearning(next);
      return next;
    });
  }, []);

  const resetRejectedInsights = useCallback(async () => {
    setLearning(prev => {
      const next = { ...prev, reddedilen: [] };
      saveLearning(next);
      return next;
    });
  }, []);

  const getRecommendations = useCallback((prefsOverride?: UserPreferences): RecommendationResult[] => {
    const p = etkinTercihler(prefsOverride ?? preferences, aramaBaglami);
    const sortedResults = getRecommendationsPure(parfumler, p, undefined, undefined, prefsOverride ? zevkBaglami(parfumler, p, ogrenme) : zevk);
    setRecommendations(sortedResults);
    return sortedResults;
  }, [parfumler, preferences, zevk, ogrenme, aramaBaglami]);

  // ============ SOTD & PERFORMANS FONKSİYONLARI ============
  const selectTodaysSotd = useCallback(async (parfumId: string, weather?: any, etkinlik?: Etkinlik): Promise<{ korumaKullanildi: boolean }> => {
    const today = toLocalDateKey();
    const ayniGun = sotdHistory.find(e => e.date === today);
    // Etkinlik verilmediyse (detay, çark, günlük) bugünün "Bugün ne var?" seçimi kullanılır
    const baglam = etkinlik ?? (await loadTodayPlan())?.etkinlik;
    const entry = await addSotdEntry(parfumId, weather, baglam);
    setSotdHistory(prev => [entry, ...prev.filter(e => e.date !== today)]);

    // Seri (koruma hakkı dahil) — engine/streak.ts
    const { data, korumaKullanildi } = seriGuncelle(streakData, today);
    setStreakData(data);
    saveStreakData(data);

    // Dolaptaki şişeden tahmini kullanım düş: 3 sıkış ≈ 0.3 ml (aynı gün parfüm değiştirilirse tekrar düşülmez)
    if (!ayniGun || ayniGun.parfumId !== parfumId) {
      setWardrobe(prev => {
        const next = prev.map(w => {
          if (w.parfumId !== parfumId || !w.hacimMl) return w;
          const dus = (0.3 / w.hacimMl) * 100;
          return { ...w, kalanYuzde: Math.max(0, Math.round((w.kalanYuzde - dus) * 10) / 10) };
        });
        saveWardrobe(next);
        return next;
      });
    }
    return { korumaKullanildi };
  }, [sotdHistory, streakData]);

  // ============ DOLABIM ============
  const isInWardrobe = useCallback((parfumId: string) => wardrobe.some(w => w.parfumId === parfumId), [wardrobe]);

  const addToWardrobe = useCallback(async (parfumId: string, detay: Partial<Pick<WardrobeItem, 'hacimMl' | 'kalanYuzde' | 'alinmaTarihi' | 'not'>> = {}) => {
    setWardrobe(prev => {
      if (prev.some(w => w.parfumId === parfumId)) return prev;
      const item: WardrobeItem = {
        id: `w_${Date.now().toString(36)}`,
        parfumId,
        hacimMl: detay.hacimMl ?? null,
        kalanYuzde: detay.kalanYuzde ?? 100,
        alinmaTarihi: detay.alinmaTarihi ?? null,
        not: detay.not,
        addedAt: new Date().toISOString(),
      };
      const next = [item, ...prev];
      saveWardrobe(next);
      return next;
    });
  }, []);

  const updateWardrobeItem = useCallback(async (id: string, patch: Partial<Omit<WardrobeItem, 'id' | 'parfumId' | 'addedAt'>>) => {
    setWardrobe(prev => {
      const next = prev.map(w => {
        if (w.id !== id) return w;
        const merged = { ...w, ...patch };
        // Şişe yeniden doldurulduysa / kalan artırıldıysa "azalıyor" bildirimi yeniden gönderilebilsin
        if (patch.kalanYuzde !== undefined && patch.kalanYuzde > w.kalanYuzde) merged.azalanBildirildi = false;
        return merged;
      });
      saveWardrobe(next);
      return next;
    });
  }, []);

  const removeFromWardrobe = useCallback(async (id: string) => {
    setWardrobe(prev => {
      const next = prev.filter(w => w.id !== id);
      saveWardrobe(next);
      return next;
    });
  }, []);

  const wardrobeParfums = useMemo(
    () => wardrobe.map(w => parfumler.find(p => p.id === w.parfumId)).filter((p): p is Parfum => !!p),
    [wardrobe, parfumler],
  );

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
        reloadFromStorage,
        refreshData,
        
        // SOTD & Performans
        sotdHistory,
        streakData,
        performanceLogs,
        todaySotd,
        selectTodaysSotd,
        ogrenme,
        zevk,
        aramaBaglami,
        setAramaBaglami,
        sifirlaAramaBaglami,
        etkinPrefs,
        recordSkip,
        rejectInsight,
        resetRejectedInsights,
        reddedilenTespitler: learning.reddedilen,
        wardrobe,
        isInWardrobe,
        addToWardrobe,
        updateWardrobeItem,
        removeFromWardrobe,
        wardrobeParfums,
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
