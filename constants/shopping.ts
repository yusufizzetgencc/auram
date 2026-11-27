/**
 * Satın alma bağlantıları ve fiyat kademeleri — tek noktadan yönetilir.
 *
 * Bağlantılar mağazanın ARAMA sayfasına gider (ürün sayfası URL'si tutulmaz, böylece katalogda kırık bağlantı oluşmaz).
 * Satış ortaklığı (affiliate) anlaşması yapıldığında yalnızca `affiliate` alanı doldurulur; kod değişmez.
 *
 * Fiyat aralıkları YAKLAŞIKTIR (Türkiye, 2026 sonu, 50–100 ml); arayüzde her zaman "yaklaşık" ibaresiyle gösterilir.
 * Gerçek fiyat mağazada görülür.
 */
import type { Butce } from '@/types';

export interface Store {
  id: string;
  label: string;
  /** Arama URL'si üretir */
  search: (q: string) => string;
  /** Satış ortaklığı parametresi (ör. "aff_id=…"). Boşsa eklenmez. */
  affiliate?: string;
}

export const STORES: Store[] = [
  { id: 'trendyol', label: 'Trendyol', search: q => `https://www.trendyol.com/sr?q=${encodeURIComponent(q)}` },
  { id: 'hepsiburada', label: 'Hepsiburada', search: q => `https://www.hepsiburada.com/ara?q=${encodeURIComponent(q)}` },
  { id: 'sephora', label: 'Sephora', search: q => `https://www.sephora.com.tr/arama?q=${encodeURIComponent(q)}` },
];

export const storeUrl = (s: Store, q: string) => {
  const url = s.search(q);
  return s.affiliate ? `${url}${url.includes('?') ? '&' : '?'}${s.affiliate}` : url;
};

/** Numune (dekant) araması — körü körüne tam şişe almadan önce */
export const sampleQuery = (marka: string, isim: string) => `${marka} ${isim} dekant`;

export const FIYAT_KADEMESI: Record<Butce, { label: string; yaklasik: string }> = {
  ekonomik: { label: 'Uygun', yaklasik: '~1.500 TL altı' },
  orta: { label: 'Orta', yaklasik: '~1.500–4.000 TL' },
  premium: { label: 'Premium', yaklasik: '~4.000–9.000 TL' },
  luks: { label: 'Lüks', yaklasik: '~9.000 TL üzeri' },
};
