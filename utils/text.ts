/**
 * Türkçe büyük/küçük harf dönüşümü.
 * Hermes motoru toLocaleUpperCase('tr-TR') için yerel ayarı uygulamıyor ('i' → 'I' oluyor),
 * bu yüzden i/İ ve ı/I eşlemesi elle yapılır. Arayüzde her zaman bunları kullan.
 */
export const trUpper = (s: string) => s.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();
export const trLower = (s: string) => s.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
