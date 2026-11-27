/**
 * Arkadaşımla koku uyumu — saf fonksiyonlar.
 *
 * Profil kodu: kullanıcının KOKU ZEVKİNİN özeti (aileler, aura, pH eğilimi, profil, en fazla 5 sevdiği parfüm,
 * isteğe bağlı ilk ad). Ten cevapları, kırmızı çizgiler, bütçe ve diğer kişisel veriler koda GİRMEZ.
 * Biçim: "TEN1-" + base64url(JSON). Sunucu gerekmez; kod mesajla paylaşılır.
 *
 * Uyum (0–100): %40 ortak koku aileleri (Jaccard) · %20 aura · %20 pH eğilimi yakınlığı · %20 sevilen parfümlerin benzerliği.
 */
import { Aura, CinsiyetAlgisi, KokuTipi, Parfum, UserPreferences } from '../types';
import { getRecommendationsPure, skorlaParfum } from './scoring';
import { benzerlik } from './similarity';

export interface ArkadasProfili {
  v: 1;
  ad?: string;
  ph: number;
  aura: Aura | null;
  aileler: KokuTipi[];
  sevilen: string[];
  cinsiyet: CinsiyetAlgisi | null;
}

const ONEK = 'TEN1-';
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

// Hermes'te btoa/atob'a güvenmemek için küçük base64url (UTF-8 güvenli: önce encodeURIComponent)
function b64Encode(str: string): string {
  const bytes = unescape(encodeURIComponent(str));
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const [a, b, c] = [bytes.charCodeAt(i), bytes.charCodeAt(i + 1), bytes.charCodeAt(i + 2)];
    const n = (a << 16) | ((b || 0) << 8) | (c || 0);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (isNaN(b) ? '' : B64[(n >> 6) & 63]) + (isNaN(c) ? '' : B64[n & 63]);
  }
  return out;
}

function b64Decode(s: string): string {
  let bytes = '';
  for (let i = 0; i < s.length; i += 4) {
    const v = [0, 1, 2, 3].map(k => (i + k < s.length ? B64.indexOf(s[i + k]) : -2));
    if (v.some(x => x === -1)) throw new Error('geçersiz');
    if (v[0] < 0 || v[1] < 0) throw new Error('geçersiz');
    const n = (v[0] << 18) | (v[1] << 12) | ((v[2] < 0 ? 0 : v[2]) << 6) | (v[3] < 0 ? 0 : v[3]);
    bytes += String.fromCharCode((n >> 16) & 255);
    if (v[2] >= 0) bytes += String.fromCharCode((n >> 8) & 255);
    if (v[3] >= 0) bytes += String.fromCharCode(n & 255);
  }
  return decodeURIComponent(escape(bytes));
}

export function profilKodu(p: UserPreferences, ph: number, adPaylas: boolean): string {
  const prof: ArkadasProfili = {
    v: 1,
    ...(adPaylas && p.userName?.trim() ? { ad: p.userName.trim().split(/\s+/)[0].slice(0, 20) } : {}),
    ph: Math.round(ph * 10) / 10,
    aura: p.aura,
    aileler: (p.kokuTipleri ?? []).slice(0, 4),
    sevilen: (p.sevilenParfumler ?? []).slice(0, 5),
    cinsiyet: p.cinsiyetAlgisi,
  };
  return ONEK + b64Encode(JSON.stringify(prof));
}

/** Koddaki boşluk/satır sonlarını tolere eder; geçersizse null */
export function kodCoz(kod: string): ArkadasProfili | null {
  const t = kod.trim().replace(/\s+/g, '');
  const i = t.indexOf(ONEK);
  if (i < 0) return null;
  try {
    const o = JSON.parse(b64Decode(t.slice(i + ONEK.length)));
    if (o?.v !== 1 || typeof o.ph !== 'number' || !Array.isArray(o.aileler)) return null;
    return { v: 1, ad: typeof o.ad === 'string' ? o.ad : undefined, ph: o.ph, aura: o.aura ?? null, aileler: o.aileler, sevilen: Array.isArray(o.sevilen) ? o.sevilen : [], cinsiyet: o.cinsiyet ?? null };
  } catch {
    return null;
  }
}

/** Arkadaşın profilinden öneri motorunun kullanabileceği tercih nesnesi (ten cevapları bilinmez → nötr) */
export function arkadasTercihleri(base: UserPreferences, a: ArkadasProfili): UserPreferences {
  return {
    ...base,
    userName: a.ad ?? null,
    phInfo: { biliyorMu: 'biliyorum', deger: a.ph, tahminiDeger: a.ph, aralik: null },
    ciltTipi: null, terlemeOrani: null, vucutIsisi: null, parfumReaksiyonu: null, gozlenenKalicilik: null, gumusOksitlenme: null,
    aura: a.aura, kokuTipleri: a.aileler, cinsiyetAlgisi: a.cinsiyet,
    kacinilacakNotalar: [], sevilenParfumler: a.sevilen, sevilmeyenParfumler: [],
    butceTercihi: 'farketmez', mevsim: null, kokuAlmaHassasiyeti: null,
  } as UserPreferences;
}

export interface UyumSonucu {
  yuzde: number;
  ortakAileler: KokuTipi[];
  auraAyni: boolean;
  /** 0–1 */
  phYakinlik: number;
  /** İkinizin de sevdiği ortak parfümler */
  ortakSevilen: Parfum[];
  ozet: string;
  /** İkinize de uyan (her iki skorun düşüğüne göre) */
  ikiniziUyan: { parfum: Parfum; ben: number; o: number }[];
  /** Ona hediye fikri */
  onaHediye: Parfum[];
}

export function kokuUyumu(benPrefs: UserPreferences, benPh: number, a: ArkadasProfili, katalog: Parfum[]): UyumSonucu {
  const benAile = new Set(benPrefs.kokuTipleri ?? []);
  const oAile = new Set(a.aileler);
  const birlesim = new Set([...benAile, ...oAile]);
  const ortakAileler = [...benAile].filter(x => oAile.has(x));
  const aileSkor = birlesim.size ? ortakAileler.length / birlesim.size : 0.5;
  const auraAyni = !!benPrefs.aura && benPrefs.aura === a.aura;
  const phYakinlik = Math.max(0, 1 - Math.abs(benPh - a.ph) / 1.2);

  const byId = new Map(katalog.map(p => [p.id, p]));
  const benSev = (benPrefs.sevilenParfumler ?? []).map(id => byId.get(id)).filter((p): p is Parfum => !!p);
  const oSev = a.sevilen.map(id => byId.get(id)).filter((p): p is Parfum => !!p);
  let sevSkor = 0.5;
  if (benSev.length && oSev.length) {
    sevSkor = benSev.reduce((s, x) => s + Math.max(...oSev.map(y => benzerlik(x, y).skor)), 0) / benSev.length;
  }
  const yuzde = Math.round(100 * (0.4 * aileSkor + 0.2 * (auraAyni ? 1 : benPrefs.aura && a.aura ? 0.3 : 0.5) + 0.2 * phYakinlik + 0.2 * sevSkor));
  const ortakSevilen = benSev.filter(p => a.sevilen.includes(p.id));

  const oPrefs = arkadasTercihleri(benPrefs, a);
  const ikiniziUyan = katalog
    .map(p => ({ parfum: p, ben: skorlaParfum(p, benPrefs, benPh).matchPercentage, o: skorlaParfum(p, oPrefs, a.ph).matchPercentage }))
    .sort((x, y) => Math.min(y.ben, y.o) - Math.min(x.ben, x.o))
    .slice(0, 4);
  const onaHediye = getRecommendationsPure(katalog, oPrefs, a.ph, 4).map(r => r.parfum);

  const kim = a.ad ?? 'Arkadaşınız';
  const ozet = yuzde >= 75
    ? `${kim} ile zevkleriniz çok yakın; birbirinize parfüm önerebilirsiniz.`
    : yuzde >= 55
      ? `${kim} ile ortak noktalarınız var${ortakAileler.length ? ` (${ortakAileler.join(', ').toLocaleLowerCase('tr')})` : ''}, ama farklı yönleriniz de belirgin.`
      : `${kim} ile zevkleriniz oldukça farklı; birbirinizi yeni ailelerle tanıştırabilirsiniz.`;

  return { yuzde, ortakAileler, auraAyni, phYakinlik, ortakSevilen, ozet, ikiniziUyan, onaHediye };
}
