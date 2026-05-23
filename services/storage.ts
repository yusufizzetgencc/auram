/**
 * AROMIXEN - Storage Service
 * AsyncStorage ile veri kalıcılığı
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences, ScentCalendarEntry, MoodEntry, JournalEntry, NotificationPreferences, SpinResult, SOTDEntry, StreakData, PerformanceLog } from '@/types';

// ============ STORAGE KEYS ============
const STORAGE_KEYS = {
  USER_PREFERENCES: '@aromixen_preferences',
  ONBOARDING_STATUS: '@aromixen_onboarding',
  FAVORITES: '@aromixen_favorites',
  COLLECTIONS: '@aromixen_collections',
  RECENTLY_VIEWED: '@aromixen_recently_viewed',
  SEARCH_HISTORY: '@aromixen_search_history',
  // Yeni özellikler
  SCENT_CALENDAR: '@aromixen_scent_calendar',
  MOOD_HISTORY: '@aromixen_mood_history',
  JOURNAL_ENTRIES: '@aromixen_journal',
  SPIN_HISTORY: '@aromixen_spin_history',
  NOTIFICATION_PREFS: '@aromixen_notifications',
  SOTD_HISTORY: '@aromixen_sotd_history',
  STREAK_DATA: '@aromixen_streak_data',
  PERFORMANCE_LOGS: '@aromixen_performance_logs',
} as const;

// ============ TYPES ============
export interface Collection {
  id: string;
  name: string;
  icon: string;
  color: string;
  parfumIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RecentlyViewedItem {
  parfumId: string;
  viewedAt: string;
}

export interface SearchHistoryItem {
  query: string;
  resultCount: number;
  searchedAt: string;
}

// ============ GENERIC HELPERS ============
async function saveData<T>(key: string, data: T): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
    console.error(`[Storage] Save error for ${key}:`, error);
      return false;
    }
  }

async function loadData<T>(key: string, defaultValue: T): Promise<T> {
    try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
    console.error(`[Storage] Load error for ${key}:`, error);
    return defaultValue;
  }
}

// ============ USER PREFERENCES ============
export async function saveUserPreferences(preferences: UserPreferences): Promise<boolean> {
  return saveData(STORAGE_KEYS.USER_PREFERENCES, preferences);
}

export async function loadUserPreferences(defaultPrefs: UserPreferences): Promise<UserPreferences> {
  return loadData(STORAGE_KEYS.USER_PREFERENCES, defaultPrefs);
}

// ============ ONBOARDING ============
interface OnboardingData {
  isComplete: boolean;
  currentStep: number;
}

export async function saveOnboardingStatus(isComplete: boolean, currentStep: number): Promise<boolean> {
  return saveData(STORAGE_KEYS.ONBOARDING_STATUS, { isComplete, currentStep });
}

export async function loadOnboardingStatus(): Promise<OnboardingData> {
  return loadData(STORAGE_KEYS.ONBOARDING_STATUS, { isComplete: false, currentStep: 0 });
}

// ============ FAVORITES ============
export async function loadFavorites(): Promise<string[]> {
  return loadData(STORAGE_KEYS.FAVORITES, []);
}

export async function saveFavorites(favoriteIds: string[]): Promise<boolean> {
  return saveData(STORAGE_KEYS.FAVORITES, favoriteIds);
}

export async function addToFavorites(parfumId: string): Promise<string[]> {
  const favorites = await loadFavorites();
  if (!favorites.includes(parfumId)) {
    favorites.unshift(parfumId);
    await saveFavorites(favorites);
    }
    return favorites;
  }

export async function removeFromFavorites(parfumId: string): Promise<string[]> {
  const favorites = await loadFavorites();
  const updated = favorites.filter(id => id !== parfumId);
  await saveFavorites(updated);
  return updated;
}

export async function toggleFavorite(parfumId: string): Promise<{ favorites: string[]; isFavorite: boolean }> {
  const favorites = await loadFavorites();
    const isFavorite = favorites.includes(parfumId);
    
  let updated: string[];
    if (isFavorite) {
    updated = favorites.filter(id => id !== parfumId);
    } else {
    updated = [parfumId, ...favorites];
  }
  
  await saveFavorites(updated);
  return { favorites: updated, isFavorite: !isFavorite };
}

// ============ COLLECTIONS ============
export async function loadCollections(): Promise<Collection[]> {
  return loadData(STORAGE_KEYS.COLLECTIONS, []);
}

export async function saveCollections(collections: Collection[]): Promise<boolean> {
  return saveData(STORAGE_KEYS.COLLECTIONS, collections);
}

export async function createCollection(name: string, icon: string, color: string): Promise<Collection> {
  const collections = await loadCollections();
  const newCollection: Collection = {
    id: `col_${Date.now()}`,
      name,
      icon,
      color,
      parfumIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  
    collections.push(newCollection);
  await saveCollections(collections);
    return newCollection;
  }

export async function deleteCollection(collectionId: string): Promise<boolean> {
  const collections = await loadCollections();
  const updated = collections.filter(c => c.id !== collectionId);
  return saveCollections(updated);
}

// ============ RECENTLY VIEWED ============
const MAX_RECENTLY_VIEWED = 20;

export async function loadRecentlyViewed(): Promise<RecentlyViewedItem[]> {
  return loadData(STORAGE_KEYS.RECENTLY_VIEWED, []);
}

export async function saveRecentlyViewed(items: RecentlyViewedItem[]): Promise<boolean> {
  return saveData(STORAGE_KEYS.RECENTLY_VIEWED, items);
}

export async function addToRecentlyViewed(parfumId: string): Promise<RecentlyViewedItem[]> {
  let items = await loadRecentlyViewed();
  
  // Remove if exists
  items = items.filter(item => item.parfumId !== parfumId);
  
  // Add to beginning
  items.unshift({
    parfumId,
    viewedAt: new Date().toISOString(),
  });
  
  // Limit
  if (items.length > MAX_RECENTLY_VIEWED) {
    items = items.slice(0, MAX_RECENTLY_VIEWED);
  }
  
  await saveRecentlyViewed(items);
  return items;
}

export async function clearRecentlyViewed(): Promise<boolean> {
  return saveRecentlyViewed([]);
}

// ============ SEARCH HISTORY ============
const MAX_SEARCH_HISTORY = 15;

export async function loadSearchHistory(): Promise<SearchHistoryItem[]> {
  return loadData(STORAGE_KEYS.SEARCH_HISTORY, []);
}

export async function saveSearchHistory(items: SearchHistoryItem[]): Promise<boolean> {
  return saveData(STORAGE_KEYS.SEARCH_HISTORY, items);
}

export async function addToSearchHistory(query: string, resultCount: number): Promise<SearchHistoryItem[]> {
  let items = await loadSearchHistory();
  
  // Remove duplicate
  items = items.filter(item => item.query.toLowerCase() !== query.toLowerCase());
  
  // Add new
  items.unshift({
    query,
    resultCount,
    searchedAt: new Date().toISOString(),
  });
  
  // Limit
  if (items.length > MAX_SEARCH_HISTORY) {
    items = items.slice(0, MAX_SEARCH_HISTORY);
  }
  
  await saveSearchHistory(items);
  return items;
}

export async function removeFromSearchHistory(query: string): Promise<SearchHistoryItem[]> {
  const items = await loadSearchHistory();
  const updated = items.filter(item => item.query !== query);
  await saveSearchHistory(updated);
  return updated;
}

export async function clearSearchHistory(): Promise<boolean> {
  return saveSearchHistory([]);
}

// ============ LOAD ALL DATA ============
export async function loadAllUserData(defaultPrefs: UserPreferences) {
  const [preferences, onboarding, favorites, collections, recentlyViewed, searchHistory] = await Promise.all([
    loadUserPreferences(defaultPrefs),
    loadOnboardingStatus(),
    loadFavorites(),
    loadCollections(),
    loadRecentlyViewed(),
    loadSearchHistory(),
      ]);

      return {
        preferences,
    isOnboardingComplete: onboarding.isComplete,
    currentStep: onboarding.currentStep,
        favorites,
        collections,
    recentlyViewed,
    searchHistory,
  };
}

// ============ CLEAR ALL DATA ============
export async function clearAllData(): Promise<boolean> {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    return true;
  } catch (error) {
    console.error('[Storage] Clear all error:', error);
    return false;
  }
}

// ============ 🎯 SCENT CALENDAR ============
export async function loadScentCalendar(): Promise<ScentCalendarEntry[]> {
  return loadData(STORAGE_KEYS.SCENT_CALENDAR, []);
}

export async function saveScentCalendar(entries: ScentCalendarEntry[]): Promise<boolean> {
  return saveData(STORAGE_KEYS.SCENT_CALENDAR, entries);
}

export async function addCalendarEntry(entry: Omit<ScentCalendarEntry, 'id' | 'createdAt'>): Promise<ScentCalendarEntry> {
  const entries = await loadScentCalendar();
  const newEntry: ScentCalendarEntry = {
    ...entry,
    id: `cal_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  
  // Aynı gün için varsa güncelle
  const existingIndex = entries.findIndex(e => e.date === entry.date);
  if (existingIndex >= 0) {
    entries[existingIndex] = newEntry;
  } else {
    entries.unshift(newEntry);
  }
  
  await saveScentCalendar(entries);
  return newEntry;
}

export async function getCalendarEntriesForMonth(year: number, month: number): Promise<ScentCalendarEntry[]> {
  const entries = await loadScentCalendar();
  return entries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate.getFullYear() === year && entryDate.getMonth() === month;
  });
}

export async function getLastUsedDate(parfumId: string): Promise<string | null> {
  const entries = await loadScentCalendar();
  const entry = entries.find(e => e.parfumId === parfumId);
  return entry?.date || null;
}

export async function getParfumUsageCount(parfumId: string): Promise<number> {
  const entries = await loadScentCalendar();
  return entries.filter(e => e.parfumId === parfumId).length;
}

// ============ 📊 MOOD TRACKER ============
export async function loadMoodHistory(): Promise<MoodEntry[]> {
  return loadData(STORAGE_KEYS.MOOD_HISTORY, []);
}

export async function saveMoodHistory(entries: MoodEntry[]): Promise<boolean> {
  return saveData(STORAGE_KEYS.MOOD_HISTORY, entries);
}

export async function addMoodEntry(entry: Omit<MoodEntry, 'id' | 'createdAt'>): Promise<MoodEntry> {
  const entries = await loadMoodHistory();
  const newEntry: MoodEntry = {
    ...entry,
    id: `mood_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  
  entries.unshift(newEntry);
  
  // Son 100 kayıtı tut
  if (entries.length > 100) {
    entries.splice(100);
  }
  
  await saveMoodHistory(entries);
  return newEntry;
}

export async function getTodaysMood(): Promise<MoodEntry | null> {
  const entries = await loadMoodHistory();
  const today = new Date().toISOString().split('T')[0];
  return entries.find(e => e.date === today) || null;
}

// ============ 📸 SCENT JOURNAL ============
export async function loadJournalEntries(): Promise<JournalEntry[]> {
  return loadData(STORAGE_KEYS.JOURNAL_ENTRIES, []);
}

export async function saveJournalEntries(entries: JournalEntry[]): Promise<boolean> {
  return saveData(STORAGE_KEYS.JOURNAL_ENTRIES, entries);
}

export async function addJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
  const entries = await loadJournalEntries();
  const now = new Date().toISOString();
  const newEntry: JournalEntry = {
    ...entry,
    id: `journal_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  
  entries.unshift(newEntry);
  await saveJournalEntries(entries);
  return newEntry;
}

export async function updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry | null> {
  const entries = await loadJournalEntries();
  const index = entries.findIndex(e => e.id === id);
  
  if (index === -1) return null;
  
  entries[index] = {
    ...entries[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await saveJournalEntries(entries);
  return entries[index];
}

export async function deleteJournalEntry(id: string): Promise<boolean> {
  const entries = await loadJournalEntries();
  const updated = entries.filter(e => e.id !== id);
  return saveJournalEntries(updated);
}

export async function getJournalEntriesForParfum(parfumId: string): Promise<JournalEntry[]> {
  const entries = await loadJournalEntries();
  return entries.filter(e => e.parfumId === parfumId);
}

// ============ 🎲 SPIN WHEEL HISTORY ============
export async function loadSpinHistory(): Promise<SpinResult[]> {
  return loadData(STORAGE_KEYS.SPIN_HISTORY, []);
}

export async function saveSpinHistory(history: SpinResult[]): Promise<boolean> {
  return saveData(STORAGE_KEYS.SPIN_HISTORY, history);
}

export async function addSpinResult(parfumId: string): Promise<SpinResult> {
  const history = await loadSpinHistory();
  const result: SpinResult = {
    parfum: { id: parfumId } as any, // Sadece ID sakla, tam parfüm context'ten alınacak
    spinAt: new Date().toISOString(),
    wasUsed: false,
  };
  
  history.unshift(result);
  
  // Son 50 sonucu tut
  if (history.length > 50) {
    history.splice(50);
  }
  
  await saveSpinHistory(history);
  return result;
}

// ============ 🔔 NOTIFICATION PREFERENCES ============
const defaultNotificationPrefs: NotificationPreferences = {
  enabled: true,
  weatherSuggestions: true,
  specialDayReminders: true,
  dailyMoodCheck: false,
  discoveryTips: true,
  reminderTime: '09:00',
};

export async function loadNotificationPreferences(): Promise<NotificationPreferences> {
  return loadData(STORAGE_KEYS.NOTIFICATION_PREFS, defaultNotificationPrefs);
}

export async function saveNotificationPreferences(prefs: NotificationPreferences): Promise<boolean> {
  return saveData(STORAGE_KEYS.NOTIFICATION_PREFS, prefs);
}

// ============ EXTENDED LOAD ALL DATA ============
export async function loadAllUserDataExtended(defaultPrefs: UserPreferences) {
  const [
    preferences, 
    onboarding, 
    favorites, 
    collections, 
    recentlyViewed, 
    searchHistory,
    scentCalendar,
    moodHistory,
    journalEntries,
    spinHistory,
    notificationPrefs,
    sotdHistory,
    streakData,
    performanceLogs,
  ] = await Promise.all([
    loadUserPreferences(defaultPrefs),
    loadOnboardingStatus(),
    loadFavorites(),
    loadCollections(),
    loadRecentlyViewed(),
    loadSearchHistory(),
    loadScentCalendar(),
    loadMoodHistory(),
    loadJournalEntries(),
    loadSpinHistory(),
    loadNotificationPreferences(),
    loadSotdHistory(),
    loadStreakData(),
    loadPerformanceLogs(),
  ]);

  return {
    preferences,
    isOnboardingComplete: onboarding.isComplete,
    currentStep: onboarding.currentStep,
    favorites,
    collections,
    recentlyViewed,
    searchHistory,
    scentCalendar,
    moodHistory,
    journalEntries,
    spinHistory,
    notificationPrefs,
    sotdHistory,
    streakData,
    performanceLogs,
  };
}

// ============ 🏆 SOTD (Scent of the Day) ============
export async function loadSotdHistory(): Promise<SOTDEntry[]> {
  return loadData(STORAGE_KEYS.SOTD_HISTORY, []);
}

export async function saveSotdHistory(entries: SOTDEntry[]): Promise<boolean> {
  return saveData(STORAGE_KEYS.SOTD_HISTORY, entries);
}

export async function addSotdEntry(parfumId: string, weather?: any): Promise<SOTDEntry> {
  const history = await loadSotdHistory();
  const today = new Date().toISOString().split('T')[0];
  
  // Check if today already has SOTD
  const existingIndex = history.findIndex(e => e.date === today);
  
  const entry: SOTDEntry = {
    id: `sotd_${Date.now()}`,
    parfumId,
    date: today,
    weather,
    createdAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    history[existingIndex] = entry; // Override today's pick
  } else {
    history.unshift(entry);
  }

  await saveSotdHistory(history);
  return entry;
}

export async function getTodaysSotd(): Promise<SOTDEntry | null> {
  const history = await loadSotdHistory();
  const today = new Date().toISOString().split('T')[0];
  return history.find(e => e.date === today) || null;
}

// ============ 🔥 STREAK ============
const defaultStreak: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastSOTDDate: null,
  totalSOTDs: 0,
  badges: []
};

export async function loadStreakData(): Promise<StreakData> {
  return loadData(STORAGE_KEYS.STREAK_DATA, defaultStreak);
}

export async function saveStreakData(data: StreakData): Promise<boolean> {
  return saveData(STORAGE_KEYS.STREAK_DATA, data);
}

// ============ 📊 PERFORMANCE LOGS ============
export async function loadPerformanceLogs(): Promise<PerformanceLog[]> {
  return loadData(STORAGE_KEYS.PERFORMANCE_LOGS, []);
}

export async function savePerformanceLogs(logs: PerformanceLog[]): Promise<boolean> {
  return saveData(STORAGE_KEYS.PERFORMANCE_LOGS, logs);
}

export async function addPerformanceLog(log: Omit<PerformanceLog, 'id' | 'createdAt'>): Promise<PerformanceLog> {
  const logs = await loadPerformanceLogs();
  
  const existingIndex = logs.findIndex(l => l.date === log.date);
  
  const newLog: PerformanceLog = {
    ...log,
    id: `perf_${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    logs[existingIndex] = newLog;
  } else {
    logs.unshift(newLog);
  }

  await savePerformanceLogs(logs);
  return newLog;
}

export async function getTodaysPerformanceLog(): Promise<PerformanceLog | null> {
  const logs = await loadPerformanceLogs();
  const today = new Date().toISOString().split('T')[0];
  return logs.find(l => l.date === today) || null;
}

