/**
 * TENİNDE — Bildirim planlayıcı (SAF: expo bağımlılığı yok, Jest ile test edilir)
 *
 * Tüm bildirimler YEREL'dir (cihazda planlanır, sunucu gerekmez). Uygulama her açıldığında ve ilgili veri
 * değiştiğinde (günün kokusu kaydı, dolap, ayarlar) plan baştan kurulur; böylece içerik hep günceldir.
 *
 * Türler ve kurallar:
 *  sabah     Önümüzdeki 7 gün, seçilen saatte. Dolap varsa o günün seçimi (gununSecimi) isimle yazılır;
 *            bugün için saat geçmişse ya da bugün zaten kayıt varsa bugününki atlanır.
 *  aksam     Bugün günün kokusu kaydedildiyse 20:00'de "teninizde ne kadar kaldı?" (geçmişse yok).
 *  seri      Seri ≥ 2 ve bugün kayıt yoksa bugün 21:00'de seri hatırlatması (geçmişse yok).
 *  haftalik  Önümüzdeki pazar 19:00, son 7 günün özeti.
 *  aylik     Gelecek ayın 1'i 10:00, "<Ay> raporunuz hazır".
 *  azalan    Ayrı: şişe %15'in altına inince ANINDA (planlayıcı dışı, bkz. notifications.ts).
 * Sessiz saat: 22:00–08:00 arası hiçbir bildirim planlanmaz (sabah saati 08:00'den erken seçilemez).
 */
import { gununSecimi } from '@/engine/daily';
import { AY_ADLARI } from '@/engine/insights';
import { ZevkBaglami } from '@/engine/similarity';
import { NotificationPreferences, Parfum, UserPreferences } from '@/types';
import { dayDiff, toLocalDateKey } from '@/utils/date';

export type BildirimTuru = 'sabah' | 'aksam' | 'seri' | 'haftalik' | 'aylik' | 'azalan';

export interface PlanliBildirim {
  id: string;
  tur: BildirimTuru;
  baslik: string;
  govde: string;
  tarih: Date;
  /** Dokununca açılacak uygulama yolu */
  url: string;
}

export interface PlanGirdisi {
  simdi: Date;
  ayar: NotificationPreferences;
  prefs: UserPreferences;
  ph: number;
  dolap: Parfum[];
  katalog: Parfum[];
  zevk?: ZevkBaglami;
  gecmis: { parfumId: string; date: string }[];
  seri: number;
  isim?: string | null;
}

export const SESSIZ_BAS = 22;
export const SESSIZ_BIT = 8;

const saatAyristir = (t?: string) => {
  const [h, m] = (t ?? '09:00').split(':').map(n => parseInt(n, 10));
  return { saat: Math.min(21, Math.max(SESSIZ_BIT, isNaN(h) ? 9 : h)), dakika: isNaN(m) ? 0 : m };
};

const gunSonra = (d: Date, n: number, saat: number, dakika = 0) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, saat, dakika, 0, 0);
  return x;
};

export const acikMi = (ayar: NotificationPreferences, tur: Exclude<BildirimTuru, 'azalan'>) => ayar.enabled && ayar[tur] !== false;

export function bildirimPlani(g: PlanGirdisi): PlanliBildirim[] {
  const { simdi, ayar } = g;
  if (!ayar.enabled) return [];
  const out: PlanliBildirim[] = [];
  const bugun = toLocalDateKey(simdi);
  const bugunKayit = g.gecmis.find(k => k.date === bugun);
  const hitap = g.isim?.trim() ? `${g.isim.trim()}, ` : '';

  // ── Sabah: 7 gün, dolaptan günün seçimi ──
  if (acikMi(ayar, 'sabah')) {
    const { saat, dakika } = saatAyristir(ayar.reminderTime);
    // Planlanan günlerin seçimleri birbirini etkilesin (aynı parfüm üst üste önerilmesin)
    const simuleGecmis = [...g.gecmis];
    for (let i = 0; i < 7; i++) {
      const t = gunSonra(simdi, i, saat, dakika);
      if (t.getTime() <= simdi.getTime()) continue;
      if (i === 0 && bugunKayit) continue;
      let govde = 'Havaya, gününüze ve teninize göre öneriniz hazır. Bugün ne sıkacaksınız?';
      let baslik = 'Günaydın';
      if (g.dolap.length) {
        const secim = gununSecimi({ adaylar: g.dolap, prefs: g.prefs, ph: g.ph, tarih: t, etkinlik: t.getDay() === 0 || t.getDay() === 6 ? 'gunluk' : 'is', gecmis: simuleGecmis, zevk: g.zevk, dolaptan: true })[0];
        if (secim) {
          baslik = `${hitap}bugün ${secim.parfum.isim}`;
          govde = secim.gerekceler[0] ? `${secim.gerekceler[0]} Plan değiştiyse uygulamada başka seçenekler var.` : 'Dolabınızdan bugün için en uygun seçim. Plan değiştiyse uygulamada başka seçenekler var.';
          simuleGecmis.push({ parfumId: secim.parfum.id, date: toLocalDateKey(t) });
        }
      }
      out.push({ id: `teninde_sabah_${toLocalDateKey(t)}`, tur: 'sabah', baslik, govde, tarih: t, url: '/(tabs)' });
    }
  }

  // ── Akşam değerlendirmesi ──
  if (acikMi(ayar, 'aksam') && bugunKayit) {
    const t = gunSonra(simdi, 0, 20);
    const p = g.katalog.find(x => x.id === bugunKayit.parfumId);
    if (t > simdi && p) {
      out.push({ id: 'teninde_aksam', tur: 'aksam', baslik: 'Gün nasıl geçti?', govde: `${p.isim} teninizde ne kadar kaldı? İki dokunuşla kaydedin; öneriler buna göre gelişir.`, tarih: t, url: '/diary' });
    }
  }

  // ── Seri hatırlatması ──
  if (acikMi(ayar, 'seri') && !bugunKayit && g.seri >= 2) {
    const t = gunSonra(simdi, 0, 21);
    if (t > simdi) {
      out.push({ id: 'teninde_seri', tur: 'seri', baslik: `${g.seri} günlük seriniz bitmesin`, govde: 'Bugün ne sıktığınızı kaydetmek için bir dokunuş yeter.', tarih: t, url: '/(tabs)' });
    }
  }

  // ── Haftalık özet (pazar 19:00) ──
  if (acikMi(ayar, 'haftalik')) {
    const kacGun = (7 - simdi.getDay()) % 7; // 0 = bugün pazar
    let t = gunSonra(simdi, kacGun, 19);
    if (t <= simdi) t = gunSonra(simdi, kacGun + 7, 19);
    const hafta = g.gecmis.filter(k => { const d = dayDiff(k.date, bugun); return d >= 0 && d < 7; });
    const sayac = new Map<string, number>();
    hafta.forEach(k => sayac.set(k.parfumId, (sayac.get(k.parfumId) ?? 0) + 1));
    const enCokId = [...sayac.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const enCok = g.katalog.find(p => p.id === enCokId);
    const govde = hafta.length
      ? `Bu hafta ${hafta.length} gün parfüm kaydettiniz${enCok ? `; en çok ${enCok.isim}` : ''}. Yeni haftanın ilk önerisi yarın sabah.`
      : 'Bu hafta kayıt yok. Yarın sabah günün kokusunu seçerek yeni bir seri başlatın.';
    out.push({ id: 'teninde_haftalik', tur: 'haftalik', baslik: 'Haftanızın kokusu', govde, tarih: t, url: '/report' });
  }

  // ── Aylık rapor (gelecek ayın 1'i 10:00) ──
  if (acikMi(ayar, 'aylik')) {
    const t = new Date(simdi.getFullYear(), simdi.getMonth() + 1, 1, 10, 0, 0, 0);
    const ay = AY_ADLARI[simdi.getMonth()];
    out.push({
      id: 'teninde_aylik', tur: 'aylik', baslik: `${ay} koku raporunuz hazır`,
      govde: 'Ayın kokusu, teninizde en uzun kalanlar ve iltifat şampiyonunuz.',
      tarih: t, url: `/report?yil=${simdi.getFullYear()}&ay=${simdi.getMonth() + 1}`,
    });
  }

  // Sessiz saat güvencesi
  return out.filter(b => { const h = b.tarih.getHours(); return h >= SESSIZ_BIT && h < SESSIZ_BAS; });
}

/** Azalan şişe bildirimi metni (anında gönderilir) */
export function azalanMetni(p: Parfum, kalanYuzde: number, sikis: number | null): { baslik: string; govde: string } {
  return {
    baslik: `${p.isim} azalıyor`,
    govde: `Şişede yaklaşık %${Math.round(kalanYuzde)} kaldı${sikis !== null ? ` (~${sikis} sıkış)` : ''}. Yenisini almak ya da benzerlerine bakmak için dokunun.`,
  };
}
