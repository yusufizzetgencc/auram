/**
 * TENİNDE — Widget köprüsü
 * Widget verisini App Group'a (group.com.teninde.app) yazar ve WidgetKit'e yenile der.
 * Native modül yoksa (Expo Go, Android, web) ExtensionStorage sessizce hiçbir şey yapmaz.
 */
import { ExtensionStorage } from '@bacons/apple-targets';
import { toLocalDateKey } from '@/utils/date';
import { Platform } from 'react-native';
import { widgetVerisi, WidgetGirdisi } from './widgetPlan';

export const APP_GROUP = 'group.com.teninde.app';
export const WIDGET_KEY = 'teninde_widget';
const WIDGET_KIND = 'TenindeWidget';

const depo = Platform.OS === 'ios' ? new ExtensionStorage(APP_GROUP) : null;
let sonYazilan = '';
let bugunSecim: WidgetGirdisi['bugunSecim'] = null;
let bugunSecimTarih = '';

/** Bugün ekranı gösterdiği öneriyi bildirir; widget aynı parfümü gösterir */
export function setWidgetTodayPick(secim: WidgetGirdisi['bugunSecim'], tarih: string) {
  bugunSecim = secim;
  bugunSecimTarih = tarih;
}

export function updateWidget(girdi: Omit<WidgetGirdisi, 'simdi' | 'bugunSecim'>, simdi = new Date()) {
  if (!depo) return;
  try {
    const secim = bugunSecimTarih === toLocalDateKey(simdi) ? bugunSecim : null;
    const veri = widgetVerisi({ ...girdi, simdi, bugunSecim: secim });
    const { guncellendi, ...icerik } = veri;
    const imza = JSON.stringify(icerik);
    if (imza === sonYazilan) return; // değişiklik yoksa widget'ı boşuna yenileme
    sonYazilan = imza;
    depo.set(WIDGET_KEY, JSON.stringify({ ...icerik, guncellendi }));
    ExtensionStorage.reloadWidget(WIDGET_KIND);
  } catch {
    // widget isteğe bağlı bir yüzey; hata uygulamayı etkilememeli
  }
}

/** Veri silindiğinde widget'ı da boşalt */
export function clearWidget() {
  if (!depo) return;
  try {
    depo.remove(WIDGET_KEY);
    sonYazilan = '';
    ExtensionStorage.reloadWidget(WIDGET_KIND);
  } catch {}
}
