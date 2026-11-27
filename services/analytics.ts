/**
 * TENİNDE — Anonim kullanım verisi (analitik)
 *
 * Amaç: kullanıcıların nerede bıraktığını, hangi ekrana döndüğünü, ödeme ekranında ne yaptığını ölçmek.
 * Gizlilik:
 *  • Kişisel veri GÖNDERİLMEZ: ad, e-posta, pH değeri, cevaplar, parfüm notları yok. Yalnızca olay adı +
 *    küçük, kişiyi tanımlamayan özellikler (ör. { kaynak: 'favoriler' }) ve rastgele anonim kimlik.
 *  • Kullanıcı Profil → "Anonim kullanım verisi" anahtarıyla kapatabilir (optOut).
 *  • Sağlayıcı anahtarı yoksa (EXPO_PUBLIC_POSTHOG_KEY) hiçbir şey ağa gönderilmez; geliştirmede konsola yazılır.
 *
 * Sağlayıcı: PostHog "capture" HTTP uç noktası (yerel modül gerektirmez). Değiştirmek için yalnızca flush() değişir.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { AnalyticsState, loadAnalyticsState, saveAnalyticsState } from './storage';

const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const HOST = (process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com').replace(/\/$/, '');
const FLUSH_MS = 30_000;
const MAX_BATCH = 20;

type Props = Record<string, string | number | boolean | null | undefined>;
interface Olay { event: string; properties: Props; timestamp: string }

let state: AnalyticsState | null = null;
let kuyruk: Olay[] = [];
let zamanlayici: ReturnType<typeof setTimeout> | null = null;
const hazir = loadAnalyticsState().then(s => { state = s; }).catch(() => {});

/** Bir olay kaydeder. Asla hata fırlatmaz, arayüzü bekletmez. */
export function track(event: string, properties: Props = {}): void {
  hazir.then(() => {
    if (!state || state.optOut) return;
    const olay: Olay = {
      event,
      properties: {
        ...properties,
        $os: Platform.OS,
        app_version: Constants.expoConfig?.version ?? null,
      },
      timestamp: new Date().toISOString(),
    };
    if (__DEV__) console.log('[analytics]', event, properties);
    if (!KEY) return;
    kuyruk.push(olay);
    if (kuyruk.length >= MAX_BATCH) flush();
    else if (!zamanlayici) zamanlayici = setTimeout(flush, FLUSH_MS);
  });
}

/** Ekran görüntüleme (expo-router yolundan; parametre değerleri gönderilmez) */
export function trackScreen(path: string): void {
  // /parfum/p012 → /parfum/[id] : hangi parfüme bakıldığı kişisel tercih sayılır, gönderilmez
  track('$screen', { $screen_name: path.replace(/\/p\d{3}\b/, '/[id]') });
}

export async function flush(): Promise<void> {
  if (zamanlayici) { clearTimeout(zamanlayici); zamanlayici = null; }
  if (!KEY || !state || !kuyruk.length) return;
  const batch = kuyruk.splice(0, kuyruk.length);
  try {
    await fetch(`${HOST}/batch/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: KEY,
        batch: batch.map(o => ({ ...o, distinct_id: state!.id, properties: { ...o.properties, $process_person_profile: false } })),
      }),
    });
  } catch {
    // Ağ yoksa olaylar düşer; tekrar deneme bilinçli olarak yok (pil/veri tasarrufu)
  }
}

export async function isAnalyticsEnabled(): Promise<boolean> {
  await hazir;
  return !!state && !state.optOut;
}

export async function setAnalyticsEnabled(on: boolean): Promise<void> {
  await hazir;
  if (!state) return;
  state = { ...state, optOut: !on };
  if (!on) kuyruk = [];
  await saveAnalyticsState(state);
}
