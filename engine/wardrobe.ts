/**
 * Dolap analizi ve "sıradaki alım" — saf fonksiyonlar.
 *
 * Kapsama: dolaptaki parfümlerin mevsimleri, gündüz/akşam kullanımı ve aileleri sayılır.
 * Eksikler: hiç karşılanmayan mevsim, gündüz ya da akşam boşluğu, tek aileye yığılma.
 * Sıradaki alım: en büyük eksiği kapatan, teninize uyumu yüksek, dolaptakilere fazla benzemeyen (≤0.75)
 * ve henüz sahip olmadığınız parfümler.
 */
import { Parfum, UserPreferences } from '../types';
import { skorlaParfum } from './scoring';
import { benzerlik, ZevkBaglami } from './similarity';

const MEVSIMLER = ['İlkbahar', 'Yaz', 'Sonbahar', 'Kış'] as const;
type Mevsim = (typeof MEVSIMLER)[number];

export const gunduzMu = (p: Parfum) => p.yogunluk !== 'yogun' && (p.kullanimAmaci ?? []).some(k => ['gunluk', 'is', 'spor'].includes(k));
export const aksamMi = (p: Parfum) => (p.kullanimAmaci ?? []).some(k => ['aksam', 'ozel', 'romantik'].includes(k));

export interface Eksik {
  tur: 'mevsim' | 'zaman' | 'aile';
  anahtar: string;
  baslik: string;
  aciklama: string;
}

export interface DolapAnalizi {
  adet: number;
  mevsim: Record<Mevsim, number>;
  gunduz: number;
  aksam: number;
  aileler: { aile: string; adet: number }[];
  eksikler: Eksik[];
  siradakiAlim: { parfum: Parfum; uyum: number; gerekce: string }[];
}

export function dolapAnalizi(dolap: Parfum[], katalog: Parfum[], prefs: UserPreferences, ph: number, zevk?: ZevkBaglami): DolapAnalizi {
  const mevsim = Object.fromEntries(MEVSIMLER.map(m => [m, dolap.filter(p => (p.mevsim ?? []).includes(m)).length])) as Record<Mevsim, number>;
  const gunduz = dolap.filter(gunduzMu).length;
  const aksam = dolap.filter(aksamMi).length;
  const aileMap = new Map<string, number>();
  dolap.forEach(p => aileMap.set(p.tip, (aileMap.get(p.tip) ?? 0) + 1));
  const aileler = [...aileMap.entries()].sort((a, b) => b[1] - a[1]).map(([aile, adet]) => ({ aile, adet }));

  const eksikler: Eksik[] = [];
  if (dolap.length) {
    MEVSIMLER.filter(m => mevsim[m] === 0).forEach(m =>
      eksikler.push({ tur: 'mevsim', anahtar: m, baslik: `${m} için parfümünüz yok`, aciklama: `${m} günlerinde teninizde iyi açılacak bir seçenek eklenebilir.` }),
    );
    if (gunduz === 0) eksikler.push({ tur: 'zaman', anahtar: 'gunduz', baslik: 'Gündüz parfümünüz yok', aciklama: 'İşe ve gün içine uygun, kimseyi rahatsız etmeyen hafif bir seçenek.' });
    if (aksam === 0) eksikler.push({ tur: 'zaman', anahtar: 'aksam', baslik: 'Akşam parfümünüz yok', aciklama: 'Buluşma ve özel günler için daha iddialı bir iz.' });
    if (dolap.length >= 3 && aileler[0] && aileler[0].adet / dolap.length >= 0.75) {
      eksikler.push({ tur: 'aile', anahtar: aileler[0].aile, baslik: `Dolabınız çoğunlukla ${aileler[0].aile.toLocaleLowerCase('tr')}`, aciklama: 'Farklı bir aileden bir parfüm, ruh halinize göre seçim alanı açar.' });
    }
  }

  // Sıradaki alım
  const sahip = new Set(dolap.map(p => p.id));
  const hedef = eksikler[0];
  const kapatirMi = (p: Parfum): boolean => {
    if (!hedef) return true;
    if (hedef.tur === 'mevsim') return (p.mevsim ?? []).includes(hedef.anahtar as Mevsim);
    if (hedef.tur === 'zaman') return hedef.anahtar === 'gunduz' ? gunduzMu(p) : aksamMi(p);
    return p.tip !== hedef.anahtar;
  };
  const adaylar = katalog
    .filter(p => !sahip.has(p.id) && kapatirMi(p))
    .filter(p => dolap.every(d => benzerlik(p, d).skor <= 0.75))
    .map(p => ({ parfum: p, uyum: skorlaParfum(p, prefs, ph, zevk).matchPercentage }))
    .sort((a, b) => b.uyum - a.uyum)
    .slice(0, 3)
    .map(x => ({
      ...x,
      gerekce: hedef
        ? hedef.tur === 'mevsim' ? `${hedef.anahtar} boşluğunu kapatır.` : hedef.tur === 'zaman' ? (hedef.anahtar === 'gunduz' ? 'Gündüz için dolabınızdaki boşluğu kapatır.' : 'Akşamlar için dolabınızdaki boşluğu kapatır.') : `${x.parfum.tip} ailesiyle dolabınıza çeşitlilik katar.`
        : 'Dolabınızdakilere benzemeyen, teninize uygun bir seçenek.',
    }));

  return { adet: dolap.length, mevsim, gunduz, aksam, aileler, eksikler, siradakiAlim: adaylar };
}
