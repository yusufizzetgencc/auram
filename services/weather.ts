/**
 * TENİNDE — Hava durumu
 *
 * Kaynak: Open-Meteo (API anahtarı gerekmez). NOT: Open-Meteo'nun ücretsiz katmanı ticari olmayan
 * kullanım içindir; uygulama ücretli/ticari yayına çıktığında ücretli plana geçilmeli veya
 * sağlayıcı değiştirilmelidir. Sağlayıcı değişikliği yalnızca bu dosyayı etkiler.
 *
 * Kural: veri alınamazsa null döner. Uydurma (rastgele) hava verisi ASLA gösterilmez.
 */
import * as Location from 'expo-location';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'hot' | 'cold' | 'mild';
  description: string;
  icon: string;
  city: string;
}

export interface WeatherAdvice {
  title: string;
  body: string;
  families: string[];
}

export type WeatherResult = { ok: true; data: WeatherData } | { ok: false; reason: 'permission' | 'network' };

/** WMO hava kodu → durum */
const fromWmo = (code: number, temp: number): WeatherData['condition'] => {
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snowy';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return 'rainy';
  if (code === 45 || code === 48) return 'cloudy';
  if (temp >= 30) return 'hot';
  if (temp <= 5) return 'cold';
  if (code === 2 || code === 3) return 'cloudy';
  return code <= 1 ? 'sunny' : 'mild';
};

const LABEL: Record<WeatherData['condition'], { text: string; icon: string }> = {
  sunny: { text: 'Güneşli', icon: 'sunny-outline' },
  hot: { text: 'Sıcak', icon: 'thermometer-outline' },
  cloudy: { text: 'Bulutlu', icon: 'cloudy-outline' },
  rainy: { text: 'Yağmurlu', icon: 'rainy-outline' },
  snowy: { text: 'Karlı', icon: 'snow-outline' },
  windy: { text: 'Rüzgârlı', icon: 'leaf-outline' },
  cold: { text: 'Soğuk', icon: 'snow-outline' },
  mild: { text: 'Ilıman', icon: 'partly-sunny-outline' },
};

let cache: { at: number; data: WeatherData } | null = null;
const CACHE_MS = 20 * 60 * 1000;

export async function fetchWeather(): Promise<WeatherResult> {
  if (cache && Date.now() - cache.at < CACHE_MS) return { ok: true, data: cache.data };
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return { ok: false, reason: 'permission' };
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    const { latitude, longitude } = loc.coords;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(3)}&longitude=${longitude.toFixed(3)}` +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto';
    const res = await fetch(url);
    if (!res.ok) return { ok: false, reason: 'network' };
    const json = await res.json();
    const cur = json.current;
    const temp = Math.round(cur.temperature_2m);
    const condition = fromWmo(cur.weather_code, temp);

    let city = '';
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      city = place?.district || place?.city || place?.subregion || place?.region || '';
    } catch {
      // şehir adı opsiyonel
    }

    const data: WeatherData = {
      temperature: temp,
      feelsLike: Math.round(cur.apparent_temperature),
      humidity: Math.round(cur.relative_humidity_2m),
      windSpeed: Math.round(cur.wind_speed_10m),
      condition,
      description: LABEL[condition].text,
      icon: LABEL[condition].icon,
      city,
    };
    cache = { at: Date.now(), data };
    return { ok: true, data };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/** Sıcaklık ve neme göre kısa, gerekçeli tavsiye */
export function getWeatherAdvice(w: WeatherData): WeatherAdvice {
  if (w.temperature >= 26) {
    return { title: 'Sıcak bir gün', body: 'Isı buharlaşmayı hızlandırır; ferah notalar seçin ve az sıkın.', families: ['Ferah', 'Aquatik', 'Yeşil'] };
  }
  if (w.temperature <= 10) {
    return { title: 'Serin bir gün', body: 'Soğukta koku yavaş açılır; sıcak ve yoğun notalar daha iyi duyulur.', families: ['Amber', 'Oryantal', 'Odunsu'] };
  }
  if (w.humidity >= 75) {
    return { title: 'Nemli bir gün', body: 'Nem kokuyu ağırlaştırabilir; temiz ve hafif kompozisyonlar dengede kalır.', families: ['Ferah', 'Çiçeksi', 'Pudralı'] };
  }
  return { title: 'Ilıman bir gün', body: 'Neredeyse her aile iyi açılır; ruh halinize göre seçin.', families: ['Çiçeksi', 'Odunsu', 'Meyvemsi'] };
}

/** Bugünün mevsimi (ay bazlı, Kuzey yarımküre) */
export function currentSeason(date = new Date()): 'İlkbahar' | 'Yaz' | 'Sonbahar' | 'Kış' {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return 'İlkbahar';
  if (m >= 5 && m <= 7) return 'Yaz';
  if (m >= 8 && m <= 10) return 'Sonbahar';
  return 'Kış';
}
