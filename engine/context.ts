/**
 * Arama bağlamı — "Şu an ne arıyorsunuz?"
 *
 * Profil iki katmandır:
 *  - Kalıcı profil (ten, zevk, kırmızı çizgiler, bütçe…): onboarding'de bir kez sorulur, öğrenen motor keskinleştirir.
 *  - Arama bağlamı (mevsim, kullanım amacı, ortam, yoğunluk): duruma göre değişir; soruları yeniden cevaplatmak yerine
 *    tek dokunuşla geçici olarak değiştirilir ve kalıcı profili bozmaz.
 *
 * Mevsim onboarding'de SORULMAZ: varsayılan olarak tarihten gelir (Kasım'da sorulan "Kış" Haziran'da yanlış olurdu).
 * Bu modül saftır; tüm puanlama çağrıları `etkinTercihler(...)` sonucunu kullanır.
 */
import type { KonsantrasyonTercihi, KullanimAmaci, Mevsim, Ortam, UserPreferences } from '../types';
import { mevsimOf } from './daily';

export interface AramaBaglami {
  /** null/undefined → bugünün mevsimi (otomatik) */
  mevsim?: Mevsim | null;
  kullanimAmaci?: KullanimAmaci[] | null;
  ortam?: Ortam | null;
  konsantrasyonTercihi?: KonsantrasyonTercihi | null;
}

export type BaglamAlani = keyof AramaBaglami;
export const BAGLAM_ALANLARI: BaglamAlani[] = ['mevsim', 'kullanimAmaci', 'ortam', 'konsantrasyonTercihi'];

/** Puanlamaya giren tercihler: kalıcı profil + (varsa) geçici bağlam + otomatik mevsim */
export function etkinTercihler(p: UserPreferences, b: AramaBaglami = {}, tarih: Date = new Date()): UserPreferences {
  return {
    ...p,
    mevsim: b.mevsim ?? mevsimOf(tarih),
    kullanimAmaci: b.kullanimAmaci ?? p.kullanimAmaci,
    ortam: b.ortam ?? p.ortam,
    konsantrasyonTercihi: b.konsantrasyonTercihi ?? p.konsantrasyonTercihi,
  };
}

/** Kullanıcı bağlamda bir şeyi profilinden farklı seçti mi? (çubukta "Sıfırla" için) */
export function baglamAktif(b: AramaBaglami): boolean {
  return BAGLAM_ALANLARI.some(k => {
    const v = b[k];
    return Array.isArray(v) ? v.length > 0 : v != null;
  });
}
