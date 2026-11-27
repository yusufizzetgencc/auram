/**
 * TENİNDE — Ana ekran widget'ı için veri (SAF: native bağımlılık yok, Jest ile test edilir)
 *
 * Widget uygulama kapalıyken de doğru günü gösterebilsin diye önümüzdeki 7 günün seçimi önceden hesaplanır;
 * widget (targets/widget) kendi tarihine denk gelen kaydı seçer. Bugünün seçimi, Bugün ekranında gösterilenle
 * aynı olsun diye ekrandan gelen `bugunSecim` ile ezilebilir (hava + etkinlik + "Başka" seçimi dahil).
 * İçerik: yalnızca parfüm adı/markası, kısa gerekçe, seri ve isteğe bağlı ilk ad. Başka kişisel veri yok.
 */
import { gununSecimi } from '@/engine/daily';
import { ZevkBaglami } from '@/engine/similarity';
import { Parfum, UserPreferences } from '@/types';
import { toLocalDateKey } from '@/utils/date';

export interface WidgetGun { tarih: string; parfumId: string; isim: string; marka: string; gerekce: string }

export interface WidgetVerisi {
  v: 1;
  ad: string | null;
  seri: number;
  /** Serinin son kaydının tarihi — widget seri "bugün ya da dün" değilse seriyi 0 gösterir */
  seriTarih: string | null;
  kayit: { tarih: string; parfumId: string; isim: string; marka: string } | null;
  gunler: WidgetGun[];
  dolaptan: boolean;
  guncellendi: string;
}

export interface WidgetGirdisi {
  simdi: Date;
  prefs: UserPreferences;
  ph: number;
  dolap: Parfum[];
  katalog: Parfum[];
  zevk?: ZevkBaglami;
  gecmis: { parfumId: string; date: string }[];
  seri: number;
  seriTarih: string | null;
  bugunSecim?: { parfum: Parfum; gerekce: string } | null;
}

/** Marka büyük harfle — components/kit brandCaps ile aynı kural: Türkçe harf içeren Türk markası → Türkçe (SABRİ), diğerleri Latin (NISHANE, MAISON) */
const markaCaps = (p: Parfum) => {
  const m = p.marka ?? '';
  return p.mensei === 'TR' && /[çğıöşüÇĞİÖŞÜ]/.test(m) ? m.toLocaleUpperCase('tr-TR') : m.toUpperCase();
};

const kisa = (s: string, n = 120) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

export function widgetVerisi(g: WidgetGirdisi): WidgetVerisi {
  const dolaptan = g.dolap.length > 0;
  const adaylar = dolaptan ? g.dolap : g.katalog;
  const bugun = toLocalDateKey(g.simdi);
  const simule = [...g.gecmis];
  const gunler: WidgetGun[] = [];

  for (let i = 0; i < 7; i++) {
    const t = new Date(g.simdi.getFullYear(), g.simdi.getMonth(), g.simdi.getDate() + i, 9);
    const key = toLocalDateKey(t);
    if (i === 0 && g.bugunSecim) {
      const p = g.bugunSecim.parfum;
      gunler.push({ tarih: key, parfumId: p.id, isim: p.isim, marka: markaCaps(p), gerekce: kisa(g.bugunSecim.gerekce) });
      simule.push({ parfumId: p.id, date: key });
      continue;
    }
    if (!adaylar.length) break;
    const s = gununSecimi({
      adaylar, prefs: g.prefs, ph: g.ph, tarih: t,
      etkinlik: t.getDay() === 0 || t.getDay() === 6 ? 'gunluk' : 'is',
      gecmis: simule, zevk: g.zevk, dolaptan,
    })[0];
    if (!s) break;
    gunler.push({ tarih: key, parfumId: s.parfum.id, isim: s.parfum.isim, marka: markaCaps(s.parfum), gerekce: kisa(s.gerekceler[0] ?? 'Teninize ve gününüze göre seçildi.') });
    simule.push({ parfumId: s.parfum.id, date: key });
  }

  const k = g.gecmis.find(x => x.date === bugun);
  const kp = k ? g.katalog.find(p => p.id === k.parfumId) : undefined;
  return {
    v: 1,
    ad: g.prefs.userName?.trim().split(/\s+/)[0] || null,
    seri: g.seri,
    seriTarih: g.seriTarih,
    kayit: k && kp ? { tarih: bugun, parfumId: kp.id, isim: kp.isim, marka: markaCaps(kp) } : null,
    gunler,
    dolaptan,
    guncellendi: g.simdi.toISOString(),
  };
}
