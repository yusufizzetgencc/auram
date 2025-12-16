/**
 * AROMIXEN - Storage Service
 * AsyncStorage ile veri kalıcılığı
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences } from '@/types';

// ============ STORAGE KEYS ============
const STORAGE_KEYS = {
  USER_PREFERENCES: '@aromixen_preferences',
  ONBOARDING_STATUS: '@aromixen_onboarding',
  FAVORITES: '@aromixen_favorites',
  COLLECTIONS: '@aromixen_collections',
  RECENTLY_VIEWED: '@aromixen_recently_viewed',
  SEARCH_HISTORY: '@aromixen_search_history',
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

