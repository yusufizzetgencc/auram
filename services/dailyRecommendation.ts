/**
 * TENİNDE — Günün önerileri
 * Ayrı bir puanlama yazmak yerine ana motoru (engine/scoring) bugünün koşullarıyla çalıştırır:
 * mevsim = bugünün mevsimi, kullanım amacı = günün saati. Sonuç her gün farklılaşsın diye
 * en iyi adaylar arasında tarih tohumlu bir döndürme yapılır.
 */
import { getRecommendationsPure } from '@/engine';
import { Parfum, RecommendationResult, UserPreferences } from '@/types';
import { currentSeason, WeatherData } from './weather';

export interface DailyPick extends RecommendationResult {
  /** Bugüne özel gerekçe (mevsim / saat / hava) */
  todayReason: string;
}

const dayOfYear = (d = new Date()) => Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);

export function getDailyPicks(parfumler: Parfum[], preferences: UserPreferences, favorites: string[], weather: WeatherData | null, count = 3): DailyPick[] {
  const hour = new Date().getHours();
  const evening = hour >= 18 || hour < 4;
  const season = currentSeason();
  const prefs: UserPreferences = {
    ...preferences,
    mevsim: season,
    kullanimAmaci: evening ? ['aksam', 'romantik'] : ['gunluk', 'is'],
  };
  const ranked = getRecommendationsPure(parfumler, prefs, undefined, 15);
  // Favoriler hafif öne çıksın
  ranked.sort((a, b) => (favorites.includes(b.parfum.id) ? 4 : 0) + b.score - ((favorites.includes(a.parfum.id) ? 4 : 0) + a.score));

  const pool = ranked.slice(0, Math.max(count * 3, 6));
  const offset = dayOfYear() % pool.length;
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)].slice(0, count);

  return rotated.map(r => {
    let todayReason = evening ? 'Akşam saatleri için uygun yoğunlukta.' : `${season} günü için uygun.`;
    if (weather && weather.temperature >= 26 && r.parfum.yogunluk === 'hafif') todayReason = `${weather.temperature}°C'de boğmadan ferah kalır.`;
    else if (weather && weather.temperature <= 10 && r.parfum.yogunluk === 'yogun') todayReason = `${weather.temperature}°C'de yavaş ve dolgun açılır.`;
    else if (favorites.includes(r.parfum.id)) todayReason = 'Favorilerinizden, bugüne de uyuyor.';
    return { ...r, todayReason };
  });
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'Günaydın';
  if (h >= 12 && h < 18) return 'İyi günler';
  if (h >= 18 && h < 23) return 'İyi akşamlar';
  return 'İyi geceler';
}
