/**
 * AROMIXEN - Weather Service
 * Gerçek zamanlı hava durumu ve parfüm önerileri
 */

import * as Location from 'expo-location';

export interface WeatherData {
  temperature: number;
  humidity: number;
  description: string;
  icon: string;
  city: string;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'hot' | 'cold' | 'mild';
  windSpeed: number;
  feelsLike: number;
}

export interface WeatherRecommendation {
  scentTypes: string[];
  intensity: string;
  description: string;
  tips: string[];
}

// OpenWeatherMap API Key - Ücretsiz hesap için
const API_KEY = ''; // Boş bırakıldığında mock data kullanılacak

/**
 * Konum izni al
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('[Weather] Konum izni hatası:', error);
    return false;
  }
}

/**
 * Mevcut konumu al
 */
export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return null;
    
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return location;
  } catch (error) {
    console.error('[Weather] Konum alma hatası:', error);
    return null;
  }
}

/**
 * Hava durumu ikonunu belirle
 */
function getWeatherCondition(temp: number, weatherId: number): WeatherData['condition'] {
  // OpenWeatherMap weather condition codes
  if (weatherId >= 200 && weatherId < 300) return 'rainy'; // Thunderstorm
  if (weatherId >= 300 && weatherId < 400) return 'rainy'; // Drizzle
  if (weatherId >= 500 && weatherId < 600) return 'rainy'; // Rain
  if (weatherId >= 600 && weatherId < 700) return 'snowy'; // Snow
  if (weatherId >= 700 && weatherId < 800) return 'windy'; // Atmosphere (fog, mist)
  if (weatherId === 800) {
    if (temp > 30) return 'hot';
    if (temp < 10) return 'cold';
    return 'sunny';
  }
  if (weatherId > 800) return 'cloudy'; // Clouds
  
  // Temperature based fallback
  if (temp > 30) return 'hot';
  if (temp < 5) return 'cold';
  return 'mild';
}

/**
 * Ionicons ikon adını al
 */
function getWeatherIcon(condition: WeatherData['condition']): string {
  const iconMap: Record<string, string> = {
    sunny: 'sunny',
    hot: 'sunny',
    cloudy: 'cloudy',
    rainy: 'rainy',
    snowy: 'snow',
    windy: 'thunderstorm',
    cold: 'snow-outline',
    mild: 'partly-sunny',
  };
  return iconMap[condition] || 'partly-sunny';
}

/**
 * Türkçe hava durumu açıklaması
 */
function getWeatherDescription(condition: WeatherData['condition']): string {
  const descriptions: Record<string, string> = {
    sunny: 'Güneşli',
    hot: 'Sıcak',
    cloudy: 'Bulutlu',
    rainy: 'Yağmurlu',
    snowy: 'Karlı',
    windy: 'Rüzgarlı',
    cold: 'Soğuk',
    mild: 'Ilıman',
  };
  return descriptions[condition] || 'Parçalı Bulutlu';
}

/**
 * Mock hava durumu (API key yoksa)
 */
function getMockWeatherData(): WeatherData {
  const now = new Date();
  const month = now.getMonth();
  const hour = now.getHours();
  
  // Mevsime göre sıcaklık
  let baseTemp = 18;
  if (month >= 5 && month <= 8) baseTemp = 28; // Yaz
  else if (month >= 11 || month <= 2) baseTemp = 8; // Kış
  else baseTemp = 16; // İlkbahar/Sonbahar
  
  // Gün içi varyasyon
  if (hour >= 12 && hour <= 16) baseTemp += 4;
  else if (hour >= 0 && hour <= 6) baseTemp -= 3;
  
  const temp = baseTemp + Math.floor(Math.random() * 4) - 2;
  const condition = temp > 28 ? 'hot' : temp < 10 ? 'cold' : temp > 20 ? 'sunny' : 'mild';
  
  return {
    temperature: temp,
    humidity: 45 + Math.floor(Math.random() * 30),
    description: getWeatherDescription(condition),
    icon: getWeatherIcon(condition),
    city: 'Konumunuz',
    condition,
    windSpeed: 5 + Math.floor(Math.random() * 15),
    feelsLike: temp + (Math.random() > 0.5 ? 2 : -2),
  };
}

/**
 * Gerçek hava durumu verisi al
 */
export async function fetchWeatherData(): Promise<WeatherData> {
  // API key yoksa mock data kullan
  if (!API_KEY) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(getMockWeatherData()), 300);
    });
  }

  try {
    const location = await getCurrentLocation();
    
    if (!location) {
      return getMockWeatherData();
    }

    const { latitude, longitude } = location.coords;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=tr`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.cod !== 200) {
      console.error('[Weather] API hatası:', data.message);
      return getMockWeatherData();
    }

    const temp = Math.round(data.main.temp);
    const condition = getWeatherCondition(temp, data.weather[0].id);
    
    return {
      temperature: temp,
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: getWeatherIcon(condition),
      city: data.name,
      condition,
      windSpeed: Math.round(data.wind.speed * 3.6), // m/s to km/h
      feelsLike: Math.round(data.main.feels_like),
    };
  } catch (error) {
    console.error('[Weather] Veri çekme hatası:', error);
    return getMockWeatherData();
  }
}

/**
 * Hava durumuna göre parfüm önerisi
 */
export function getWeatherRecommendation(weather: WeatherData): WeatherRecommendation {
  const recommendations: Record<WeatherData['condition'], WeatherRecommendation> = {
    hot: {
      scentTypes: ['Ferah', 'Aquatik', 'Narenciye'],
      intensity: 'hafif',
      description: 'Sıcak havada ferah ve hafif kokular tercih edin',
      tips: [
        '💧 Narenciye bazlı kokular serinlik verir',
        '🌊 Aquatik notalar yaz için ideal',
        '⏰ Az sıkın, sıcakta koku yoğunlaşır',
      ],
    },
    cold: {
      scentTypes: ['Oryantal', 'Odunsu', 'Baharatlı'],
      intensity: 'yoğun',
      description: 'Soğuk havada sıcak ve sarmalayıcı kokular',
      tips: [
        '🔥 Amber ve vanilya sıcaklık verir',
        '🌲 Odunsu kokular kışın zarif',
        '✨ Yoğun parfümler soğukta kalıcı',
      ],
    },
    mild: {
      scentTypes: ['Çiçeksi', 'Odunsu', 'Ferah'],
      intensity: 'orta',
      description: 'Ilıman havada dengeli ve zarif kokular',
      tips: [
        '🌸 Çiçeksi notalar ilkbahar için ideal',
        '🍃 Yeşil notalar tazelik katar',
        '⚖️ Orta yoğunlukta kokular tercih edin',
      ],
    },
    rainy: {
      scentTypes: ['Odunsu', 'Oryantal', 'Amber'],
      intensity: 'orta-yoğun',
      description: 'Yağmurlu günlerde toprak ve sıcak notalar',
      tips: [
        '🌧️ Petrichor benzeri notalar uyumlu',
        '🪵 Sedir ve sandal yağmurla güzel',
        '💫 Nem kokuyu yayar, dikkatli dozlayın',
      ],
    },
    sunny: {
      scentTypes: ['Ferah', 'Çiçeksi', 'Narenciye'],
      intensity: 'hafif-orta',
      description: 'Güneşli günlerde enerjik kokular',
      tips: [
        '☀️ Portakal ve bergamot enerji verir',
        '🌻 Beyaz çiçekler güneşte açılır',
        '🎯 Sabah saatlerinde uygulayın',
      ],
    },
    cloudy: {
      scentTypes: ['Odunsu', 'Çiçeksi', 'Oryantal'],
      intensity: 'orta',
      description: 'Bulutlu günlerde sofistike kokular',
      tips: [
        '☁️ Dumanlı notalar havayla uyumlu',
        '🌫️ İris ve süsen bulutlu günler için',
        '🎨 Derinlikli kokular öne çıkar',
      ],
    },
    snowy: {
      scentTypes: ['Oryantal', 'Baharatlı', 'Amber'],
      intensity: 'yoğun',
      description: 'Karlı günlerde sıcak kokular',
      tips: [
        '❄️ Tarçın ve karanfil sıcaklık verir',
        '🍂 Tonka ve vanilya sarmalayıcı',
        '🧣 Boyun ve bileklere uygulayın',
      ],
    },
    windy: {
      scentTypes: ['Odunsu', 'Oryantal', 'Deri'],
      intensity: 'yoğun',
      description: 'Rüzgarlı günlerde güçlü kokular',
      tips: [
        '💨 Rüzgar kokuyu hızlı dağıtır',
        '🛡️ Kalıcı alt notalar tercih edin',
        '📍 Nabız noktalarına odaklanın',
      ],
    },
  };

  return recommendations[weather.condition] || recommendations.mild;
}

/**
 * Günün saatine göre ek öneriler
 */
export function getTimeBasedTips(): string[] {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) {
    return ['🌅 Sabah için ferah kokular ideal', '☕ Hafif yoğunlukta başlayın'];
  } else if (hour >= 12 && hour < 18) {
    return ['☀️ Öğlende kokuyu tazeleyebilirsiniz', '💼 Orta yoğunluk tercih edin'];
  } else if (hour >= 18 && hour < 22) {
    return ['🌆 Akşam için yoğun kokular', '💃 Çekici notalar tercih edin'];
  } else {
    return ['🌙 Gece için samimi kokular', '💤 Lavanta rahatlatıcı'];
  }
}
