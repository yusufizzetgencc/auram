/**
 * AROMIXEN - Weather Service
 * Hava durumu ve parfüm önerileri
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
}

export interface WeatherRecommendation {
  scentTypes: string[];
  intensity: string;
  description: string;
  tips: string[];
}

// Simüle edilmiş hava durumu (gerçek API olmadan)
const MOCK_WEATHER_DATA: Record<string, WeatherData> = {
  default: {
    temperature: 18,
    humidity: 55,
    description: 'Parçalı Bulutlu',
    icon: 'partly-sunny',
    city: 'İstanbul',
    condition: 'mild',
    windSpeed: 12,
  },
  summer: {
    temperature: 32,
    humidity: 45,
    description: 'Güneşli',
    icon: 'sunny',
    city: 'İstanbul',
    condition: 'hot',
    windSpeed: 8,
  },
  winter: {
    temperature: 5,
    humidity: 75,
    description: 'Bulutlu',
    icon: 'cloudy',
    city: 'İstanbul',
    condition: 'cold',
    windSpeed: 20,
  },
  rainy: {
    temperature: 14,
    humidity: 85,
    description: 'Yağmurlu',
    icon: 'rainy',
    city: 'İstanbul',
    condition: 'rainy',
    windSpeed: 15,
  },
};

// Mevsimine göre hava durumu seç
function getSeasonalWeather(): WeatherData {
  const month = new Date().getMonth();
  
  if (month >= 5 && month <= 8) {
    return MOCK_WEATHER_DATA.summer;
  } else if (month >= 11 || month <= 2) {
    return MOCK_WEATHER_DATA.winter;
  } else {
    // İlkbahar/Sonbahar - rastgele
    const conditions = ['default', 'rainy'];
    const randomIndex = Math.floor(Math.random() * conditions.length);
    return MOCK_WEATHER_DATA[conditions[randomIndex]];
  }
}

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
 * Hava durumu verisi al (şimdilik mock)
 */
export async function fetchWeatherData(): Promise<WeatherData> {
  // Gerçek API entegrasyonu için:
  // const location = await getCurrentLocation();
  // if (location) {
  //   const response = await fetch(
  //     `https://api.openweathermap.org/data/2.5/weather?lat=${location.coords.latitude}&lon=${location.coords.longitude}&appid=YOUR_API_KEY&units=metric&lang=tr`
  //   );
  //   const data = await response.json();
  //   return parseWeatherResponse(data);
  // }
  
  // Mock data kullan
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getSeasonalWeather());
    }, 500);
  });
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
        '💧 Narenciye bazlı kokular serinlik hissi verir',
        '🌊 Aquatik notalar yaz için idealdir',
        '⏰ Daha az sıkın, sıcakta koku yoğunlaşır',
      ],
    },
    cold: {
      scentTypes: ['Oryantal', 'Odunsu', 'Baharatlı'],
      intensity: 'yoğun',
      description: 'Soğuk havada sıcak ve sarmalayıcı kokular',
      tips: [
        '🔥 Amber ve vanilya notaları sıcaklık verir',
        '🌲 Odunsu kokular kışın zarif durur',
        '✨ Yoğun parfümler soğukta daha kalıcıdır',
      ],
    },
    mild: {
      scentTypes: ['Çiçeksi', 'Odunsu', 'Ferah'],
      intensity: 'orta',
      description: 'Ilıman havada dengeli ve zarif kokular',
      tips: [
        '🌸 Çiçeksi notalar ilkbahar için mükemmel',
        '🍃 Yeşil notalar tazelik katar',
        '⚖️ Orta yoğunlukta kokular tercih edin',
      ],
    },
    rainy: {
      scentTypes: ['Odunsu', 'Oryantal', 'Amber'],
      intensity: 'orta-yoğun',
      description: 'Yağmurlu günlerde toprak ve sıcak notalar',
      tips: [
        '🌧️ Petrichor benzeri notalar uyumlu olur',
        '🪵 Sedir ve sandal ağacı yağmurla güzel',
        '💫 Nem kokuyu yayar, dikkatli dozlayın',
      ],
    },
    sunny: {
      scentTypes: ['Ferah', 'Çiçeksi', 'Narenciye'],
      intensity: 'hafif-orta',
      description: 'Güneşli günlerde enerjik ve pozitif kokular',
      tips: [
        '☀️ Portakal ve bergamot enerji verir',
        '🌻 Beyaz çiçekler güneşte açılır',
        '🎯 Sabah saatlerinde uygulayın',
      ],
    },
    cloudy: {
      scentTypes: ['Odunsu', 'Çiçeksi', 'Oryantal'],
      intensity: 'orta',
      description: 'Bulutlu günlerde sofistike ve zarif kokular',
      tips: [
        '☁️ Dumanlı notalar havayla uyumlu',
        '🌫️ İris ve süsen bulutlu günler için ideal',
        '🎨 Derinlikli kokular öne çıkar',
      ],
    },
    snowy: {
      scentTypes: ['Oryantal', 'Baharatlı', 'Amber'],
      intensity: 'yoğun',
      description: 'Karlı günlerde sıcak ve davetkar kokular',
      tips: [
        '❄️ Tarçın ve karanfil sıcaklık verir',
        '🍂 Tonka ve vanilya sarmalayıcıdır',
        '🧣 Boyun ve bileklere uygulayın',
      ],
    },
    windy: {
      scentTypes: ['Odunsu', 'Oryantal', 'Deri'],
      intensity: 'yoğun',
      description: 'Rüzgarlı günlerde güçlü ve kalıcı kokular',
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
    return [
      '🌅 Sabah saatleri ferah kokular için ideal',
      '☕ Hafif yoğunlukta başlayın',
      '🏃 Aktif bir gün için enerjik notalar',
    ];
  } else if (hour >= 12 && hour < 18) {
    return [
      '☀️ Öğlen saatlerinde kokuyu tazeleyebilirsiniz',
      '💼 İş ortamı için orta yoğunluk tercih edin',
      '🌿 Yeşil notalar öğlende ferahlatıcı',
    ];
  } else if (hour >= 18 && hour < 22) {
    return [
      '🌆 Akşam için daha yoğun kokular tercih edebilirsiniz',
      '💃 Sosyal ortamlar için çekici notalar',
      '✨ Oryantal ve amber notalar akşama uygun',
    ];
  } else {
    return [
      '🌙 Gece için samimi ve sıcak kokular',
      '💤 Lavanta ve vanilya rahatlatıcıdır',
      '🕯️ Hafif sıkın, gece koku hassasiyeti artar',
    ];
  }
}

/**
 * Hava durumu ikonunu Ionicons formatına çevir
 */
export function getWeatherIcon(condition: WeatherData['condition']): string {
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

