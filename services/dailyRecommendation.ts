/**
 * AURAM - Daily Recommendation Service
 * Günün parfüm önerisi ve motivasyon
 */

import { Parfum, UserPreferences, KokuTipi } from '@/types';
import { WeatherData, getWeatherRecommendation } from './weather';

export interface DailyRecommendation {
  parfum: Parfum;
  matchScore: number;
  reasons: string[];
  tip: string;
  motivation: string;
}

// Günlük motivasyon mesajları
const MOTIVATIONS = [
  { emoji: '✨', text: 'Bugün harika kokacaksın!' },
  { emoji: '🌟', text: 'Kendine güven, kokuyla ifade et!' },
  { emoji: '💫', text: 'Her an özel olmayı hak ediyorsun!' },
  { emoji: '🎯', text: 'Doğru koku, doğru izlenim!' },
  { emoji: '🔥', text: 'Bugün etkileyici olmanın günü!' },
  { emoji: '💜', text: 'Koku, görünmez bir aksesuar!' },
  { emoji: '🌸', text: 'Güzel kokular, güzel anlar!' },
  { emoji: '⭐', text: 'Parfümün seni yansıtsın!' },
  { emoji: '🎭', text: 'Her gün yeni bir sahne!' },
  { emoji: '💎', text: 'Lüks detaylarda gizli!' },
];

// Günün ipuçları
const DAILY_TIPS = [
  'Parfümü kuru cilde uygulayın, nem kokuyu bozar',
  'Nabız noktaları en iyi yayılımı sağlar',
  'Bileklerinizi ovuşturmayın, notalar kırılır',
  'Saçlarınıza hafifçe sıkın, gün boyu kokar',
  'Nemlendiricinin üzerine parfüm daha kalıcıdır',
  'Soğuk havada parfüm daha az yayılır, yakından sıkın',
  'Sıcakta parfüm daha çok yayılır, az kullanın',
  'Katmanlama için aynı notaları tercih edin',
  'Parfümünüzü ışıktan uzak, serin yerde saklayın',
  'Gün içinde parfüm değiştirmek istiyorsanız boynunuzu temizleyin',
];

/**
 * Günün motivasyon mesajını al
 */
export function getDailyMotivation(): { emoji: string; text: string } {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return MOTIVATIONS[dayOfYear % MOTIVATIONS.length];
}

/**
 * Günün ipucunu al
 */
export function getDailyTip(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}

/**
 * Günün saatine göre uygun koku tiplerini belirle
 */
function getTimeBasedScentTypes(): KokuTipi[] {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) {
    // Sabah - ferah ve enerjik
    return ['Ferah', 'Aquatik', 'Çiçeksi'];
  } else if (hour >= 12 && hour < 17) {
    // Öğlen - dengeli
    return ['Çiçeksi', 'Odunsu', 'Ferah'];
  } else if (hour >= 17 && hour < 21) {
    // Akşam - çekici
    return ['Oryantal', 'Odunsu', 'Baharatlı'];
  } else {
    // Gece - yoğun
    return ['Oryantal', 'Baharatlı', 'Odunsu'];
  }
}

/**
 * Günün parfümünü hesapla
 */
export function getDailyRecommendation(
  parfumler: Parfum[],
  preferences: UserPreferences,
  favorites: string[],
  weather?: WeatherData | null
): DailyRecommendation | null {
  if (!parfumler || parfumler.length === 0) return null;
  if (!preferences) return null;
  
  // Varsayılan değerler
  const safePreferences = {
    ...preferences,
    kokuTipleri: preferences.kokuTipleri || [],
    phInfo: preferences.phInfo || { tahminiDeger: null },
  };
  const safeFavorites = favorites || [];

  // Bugünün tarihi ile rotasyon sağla
  const today = new Date();
  const dayIndex = today.getDate() + today.getMonth() * 31;
  
  // Skorlama için kriterler
  const scores: { parfum: Parfum; score: number; reasons: string[] }[] = [];
  
  // Zaman bazlı koku tipleri
  const timeBasedTypes = getTimeBasedScentTypes();
  
  // Hava durumu önerileri
  const weatherRec = weather ? getWeatherRecommendation(weather) : null;
  
  parfumler.forEach((parfum) => {
    let score = 0;
    const reasons: string[] = [];
    
    // 1. Cinsiyet uyumu (zorunlu)
    if (safePreferences.cinsiyet) {
      if (parfum.cinsiyet !== safePreferences.cinsiyet && parfum.cinsiyet !== 'unisex') {
        return; // Bu parfümü dahil etme
      }
      score += 10;
    }
    
    // 2. Tercih edilen koku tipleri
    if (safePreferences.kokuTipleri.length > 0 && safePreferences.kokuTipleri.includes(parfum.tip as KokuTipi)) {
      score += 25;
      reasons.push(`Tercih ettiğin ${parfum.tip} koku`);
    }
    
    // 3. Zaman bazlı uyum
    if (parfum.tip && timeBasedTypes.includes(parfum.tip as KokuTipi)) {
      score += 15;
      reasons.push('Günün bu saati için ideal');
    }
    
    // 4. Hava durumu uyumu
    if (weatherRec && weatherRec.scentTypes && parfum.tip && weatherRec.scentTypes.includes(parfum.tip)) {
      score += 20;
      reasons.push(`${weather?.description || 'Hava'} için uygun`);
    }
    
    // 5. Mevsim uyumu
    const currentMonth = today.getMonth();
    let currentSeason = 'İlkbahar';
    if (currentMonth >= 5 && currentMonth <= 7) currentSeason = 'Yaz';
    else if (currentMonth >= 8 && currentMonth <= 10) currentSeason = 'Sonbahar';
    else if (currentMonth >= 11 || currentMonth <= 1) currentSeason = 'Kış';
    
    if (parfum.mevsim && Array.isArray(parfum.mevsim) && parfum.mevsim.includes(currentSeason as any)) {
      score += 15;
      reasons.push(`${currentSeason} mevsimi için uygun`);
    }
    
    // 6. Favori bonus
    if (safeFavorites.length > 0 && parfum.id && safeFavorites.includes(parfum.id)) {
      score += 10;
      reasons.push('Favorilerinden');
    }
    
    // 7. pH uyumu
    if (safePreferences.phInfo && safePreferences.phInfo.tahminiDeger && parfum.phUyumu) {
      const userPH = safePreferences.phInfo.tahminiDeger;
      if (userPH >= parfum.phUyumu.minPH && userPH <= parfum.phUyumu.maxPH) {
        score += 15;
        reasons.push('pH\'ınla uyumlu');
      }
    }
    
    // 8. Kullanım amacı
    if (safePreferences.kullanimAmaci && parfum.kullanimAmaci && Array.isArray(parfum.kullanimAmaci) && parfum.kullanimAmaci.includes(safePreferences.kullanimAmaci)) {
      score += 10;
      reasons.push('Kullanım amacına uygun');
    }
    
    // En az bir neden varsa ekle
    if (reasons.length > 0) {
      scores.push({ parfum, score, reasons });
    }
  });
  
  if (scores.length === 0) {
    // Hiç uygun parfüm yoksa rastgele seç
    const randomIndex = dayIndex % parfumler.length;
    return {
      parfum: parfumler[randomIndex],
      matchScore: 50,
      reasons: ['Bugün için önerimiz'],
      tip: getDailyTip(),
      motivation: getDailyMotivation().text,
    };
  }
  
  // En yüksek skorlu parfümleri sırala
  scores.sort((a, b) => b.score - a.score);
  
  // Top 5 arasından günün rotasyonuna göre seç
  const topScores = scores.slice(0, 5);
  const selectedIndex = dayIndex % topScores.length;
  const selected = topScores[selectedIndex];
  
  // Match score'u 0-100 aralığına normalize et
  const maxPossibleScore = 120; // Tüm kriterlerin toplamı
  const normalizedScore = Math.min(100, Math.round((selected.score / maxPossibleScore) * 100));
  
  return {
    parfum: selected.parfum,
    matchScore: normalizedScore,
    reasons: selected.reasons.slice(0, 3), // En fazla 3 neden
    tip: getDailyTip(),
    motivation: getDailyMotivation().text,
  };
}

/**
 * Birden fazla öneri al (keşfet için)
 */
export function getMultipleDailyRecommendations(
  parfumler: Parfum[],
  preferences: UserPreferences,
  favorites: string[],
  count: number = 5
): DailyRecommendation[] {
  const recommendations: DailyRecommendation[] = [];
  const usedIds = new Set<string>();
  
  // Güvenlik kontrolleri
  if (!parfumler || parfumler.length === 0) return recommendations;
  if (!preferences) return recommendations;
  
  const safeFavorites = favorites || [];
  
  // Ana öneriyi al
  const mainRec = getDailyRecommendation(parfumler, preferences, safeFavorites);
  if (mainRec && mainRec.parfum && mainRec.parfum.id) {
    recommendations.push(mainRec);
    usedIds.add(mainRec.parfum.id);
  }
  
  // Farklı tiplerden öneriler ekle
  const types: KokuTipi[] = ['Odunsu', 'Çiçeksi', 'Oryantal', 'Ferah', 'Baharatlı', 'Aquatik'];
  
  for (const type of types) {
    if (recommendations.length >= count) break;
    
    const typeParfums = parfumler.filter(p => 
      p && p.tip === type && 
      p.id && !usedIds.has(p.id) &&
      (!preferences?.cinsiyet || p.cinsiyet === preferences.cinsiyet || p.cinsiyet === 'unisex')
    );
    
    if (typeParfums.length > 0) {
      const randomIndex = Math.floor(Math.random() * typeParfums.length);
      const parfum = typeParfums[randomIndex];
      
      recommendations.push({
        parfum,
        matchScore: 60 + Math.floor(Math.random() * 25),
        reasons: [`${type} koku ailesi`, 'Keşfetmeye değer'],
        tip: getDailyTip(),
        motivation: getDailyMotivation().text,
      });
      usedIds.add(parfum.id);
    }
  }
  
  return recommendations.slice(0, count);
}


