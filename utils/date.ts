/**
 * Yerel saat dilimine göre YYYY-MM-DD anahtarı.
 * toISOString() UTC kullanır: Türkiye'de (UTC+3) 00:00–03:00 arası kayıtlar bir önceki
 * güne düşüyor ve SOTD serisi kırılıyordu.
 */
export const toLocalDateKey = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** İki YYYY-MM-DD anahtarı arasındaki takvim günü farkı (DST'den etkilenmez). */
export const dayDiff = (fromKey: string, toKey: string): number => {
  const [y1, m1, d1] = fromKey.split('-').map(Number);
  const [y2, m2, d2] = toKey.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
};
