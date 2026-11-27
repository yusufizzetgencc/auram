/**
 * Katmanlama motoru — iki parfümün birlikte nasıl duracağını kural tabanlı puanlar.
 * Tüm 12 koku ailesi için uyum tablosu vardır (eski sürümde 4 aile eksikti ve öneri çıkmıyordu).
 */
import { trLower } from '../utils/text';
import { KokuTipi, Parfum } from '../types';

export const LAYERING_RULES: Record<KokuTipi, { iyi: KokuTipi[]; kotu: KokuTipi[]; not: string }> = {
  'Odunsu':   { iyi: ['Oryantal', 'Baharatlı', 'Amber', 'Deri', 'Ferah'], kotu: ['Tatlı'], not: 'Odunsu taban, üstüne eklenen kokuya derinlik ve kalıcılık verir.' },
  'Çiçeksi':  { iyi: ['Pudralı', 'Meyvemsi', 'Tatlı', 'Yeşil', 'Odunsu'], kotu: ['Deri'], not: 'Çiçekler pudralı ve meyvemsi notalarla yumuşak bir geçiş yapar.' },
  'Oryantal': { iyi: ['Odunsu', 'Baharatlı', 'Amber', 'Tatlı'], kotu: ['Aquatik', 'Yeşil'], not: 'Oryantal yapı sıcak notalarla gece için zengin bir iz bırakır.' },
  'Ferah':    { iyi: ['Aquatik', 'Yeşil', 'Odunsu', 'Çiçeksi'], kotu: ['Tatlı', 'Oryantal'], not: 'Ferah bir açılış, ağır bir kompozisyonu gündüze taşır.' },
  'Baharatlı':{ iyi: ['Odunsu', 'Oryantal', 'Amber', 'Deri'], kotu: ['Aquatik', 'Meyvemsi'], not: 'Baharat, odun ve amberle sıcak ve dikkat çekici bir uyum kurar.' },
  'Aquatik':  { iyi: ['Ferah', 'Yeşil', 'Odunsu'], kotu: ['Oryantal', 'Tatlı', 'Baharatlı'], not: 'Deniz notaları ferah ve odunsu tonlarla temiz kalır.' },
  'Tatlı':    { iyi: ['Çiçeksi', 'Amber', 'Oryantal', 'Pudralı'], kotu: ['Aquatik', 'Ferah'], not: 'Gurme notalar çiçek ve amberle yumuşar, bayıcılığı azalır.' },
  'Amber':    { iyi: ['Odunsu', 'Oryantal', 'Tatlı', 'Baharatlı', 'Çiçeksi'], kotu: ['Aquatik'], not: 'Amber, katmanın altında sarmalayıcı bir yatak oluşturur.' },
  'Meyvemsi': { iyi: ['Çiçeksi', 'Tatlı', 'Ferah', 'Pudralı'], kotu: ['Deri', 'Baharatlı'], not: 'Meyve notaları çiçeksi ve tatlı kokulara canlılık katar.' },
  'Yeşil':    { iyi: ['Ferah', 'Çiçeksi', 'Aquatik', 'Odunsu'], kotu: ['Tatlı', 'Oryantal'], not: 'Yeşil notalar ferah ve çiçeksi kokulara doğal bir dinçlik verir.' },
  'Deri':     { iyi: ['Odunsu', 'Baharatlı', 'Amber', 'Oryantal'], kotu: ['Çiçeksi', 'Meyvemsi', 'Aquatik'], not: 'Deri; odun, baharat ve amberle karakterli bir bütün oluşturur.' },
  'Pudralı':  { iyi: ['Çiçeksi', 'Tatlı', 'Amber', 'Meyvemsi'], kotu: ['Deri', 'Aquatik'], not: 'Pudralı dokunuş çiçeksi ve tatlı kokuları kadifeleştirir.' },
};

const YOG = { hafif: 1, orta: 2, yogun: 3 } as const;
const allNotes = (p: Parfum) => [...p.notalar.ust, ...p.notalar.orta, ...p.notalar.alt].map(n => trLower(n));

export interface LayeringSuggestion {
  parfum: Parfum;
  score: number; // 0-100
  reasons: string[];
  /** Hangisi önce (alta) sıkılmalı */
  order: [Parfum, Parfum];
}

export function scoreLayering(base: Parfum, other: Parfum): LayeringSuggestion {
  const rule = LAYERING_RULES[base.tip];
  const reasons: string[] = [];
  let score = 50;

  const otherFamilies = [other.tip, other.ikincilTip].filter(Boolean) as KokuTipi[];
  if (otherFamilies.some(f => rule?.iyi.includes(f))) { score += 25; reasons.push(`${base.tip} ve ${other.tip} birbirini tamamlar.`); }
  if (otherFamilies.some(f => rule?.kotu.includes(f))) { score -= 30; }
  if (other.tip === base.tip) { score += 8; reasons.push('Aynı aileden; geçiş pürüzsüz olur.'); }

  const shared = allNotes(base).filter(n => allNotes(other).includes(n));
  if (shared.length) { score += Math.min(18, shared.length * 6); reasons.push(`Ortak nota: ${shared.slice(0, 2).join(', ')}.`); }

  const seasons = (base.mevsim || []).filter(m => (other.mevsim || []).includes(m));
  if (seasons.length) score += Math.min(6, seasons.length * 2);

  // Yoğunluk farkı: biri taban, diğeri üst katman olmalı; iki çok yoğun parfüm boğucu olur
  if (YOG[base.yogunluk] === 3 && YOG[other.yogunluk] === 3) { score -= 12; reasons.push('İkisi de yoğun; her birinden az sıkın.'); }
  else if (YOG[base.yogunluk] !== YOG[other.yogunluk]) score += 5;

  const order: [Parfum, Parfum] = YOG[base.yogunluk] >= YOG[other.yogunluk] ? [base, other] : [other, base];
  if (rule && reasons.length < 3) reasons.push(rule.not);

  return { parfum: other, score: Math.max(0, Math.min(100, Math.round(score))), reasons, order };
}

export function getLayeringSuggestions(base: Parfum, candidates: Parfum[], limit = 8): LayeringSuggestion[] {
  return candidates
    .filter(p => p.id !== base.id)
    .map(p => scoreLayering(base, p))
    .filter(s => s.score >= 55)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
