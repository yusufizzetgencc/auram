/**
 * Uygulama araçları — tek liste. Ana sayfa (Bugün) bağlama göre en fazla 4'ünü gösterir (onerilenAraclar);
 * hepsi gruplu olarak /tools ekranında. premium: true olanlar abonelik ister (ekran içinde ikinci bir kilit katmanı da vardır).
 */
import type { IconName } from '@/components/kit';

export type AracGrubu = 'gunluk' | 'kesif' | 'alisveris';

export interface Tool {
  id: string;
  route: string;
  title: string;
  desc: string;
  icon: IconName;
  premium: boolean;
  grup: AracGrubu;
}

export const ARAC_GRUPLARI: { id: AracGrubu; baslik: string }[] = [
  { id: 'gunluk', baslik: 'Her gün' },
  { id: 'kesif', baslik: 'Keşfet ve karşılaştır' },
  { id: 'alisveris', baslik: 'Alışveriş, hediye, arkadaşlar' },
];

export const TOOLS: Tool[] = [
  { id: 'advisor', route: '/advisor', title: 'Koku Danışmanı', desc: 'Sorun, dolabınızdan seçsin', icon: 'chatbubble-ellipses-outline', premium: false, grup: 'kesif' },
  { id: 'diary', route: '/diary', title: 'Koku Günlüğü', desc: 'Takvim, kalıcılık ve notlar', icon: 'journal-outline', premium: true, grup: 'gunluk' },
  { id: 'report', route: '/report', title: 'Koku hafızam', desc: 'Aylık rapor ve tespitler', icon: 'analytics-outline', premium: false, grup: 'gunluk' },
  { id: 'spin', route: '/spin', title: 'Kararsız mısınız?', desc: 'Dolabınızdan rastgele seçim', icon: 'shuffle-outline', premium: true, grup: 'gunluk' },
  { id: 'mood', route: '/mood', title: 'Ruh Hali', desc: 'Bugünkü hissinize göre', icon: 'pulse-outline', premium: true, grup: 'gunluk' },
  { id: 'similar', route: '/similar', title: 'Benzerini bul', desc: 'Sevdiğinizden yola çıkın', icon: 'copy-outline', premium: false, grup: 'kesif' },
  { id: 'compare', route: '/compare', title: 'Karşılaştır', desc: 'İki parfüm yan yana', icon: 'git-compare-outline', premium: false, grup: 'kesif' },
  { id: 'layering', route: '/layering', title: 'Katmanlama', desc: 'Parfümlerinizi birleştirin', icon: 'layers-outline', premium: true, grup: 'kesif' },
  { id: 'store', route: '/store', title: 'Mağaza modu', desc: 'Denenecekler ve rehber', icon: 'storefront-outline', premium: false, grup: 'alisveris' },
  { id: 'gift', route: '/gift', title: 'Hediye Asistanı', desc: 'Başkası için bulun', icon: 'gift-outline', premium: true, grup: 'alisveris' },
  { id: 'friend', route: '/friend', title: 'Koku uyumu', desc: 'Arkadaşınızla karşılaştırın', icon: 'people-outline', premium: false, grup: 'alisveris' },
];

/**
 * Bugün ekranında gösterilecek en fazla 4 araç — kullanıcının durumuna göre:
 * dolabı boşsa "Benzerini bul", doluysa "Kararsız mısınız?"; akşam ve bugün kayıt varsa "Koku Günlüğü"; ayın son haftası "Koku hafızam".
 */
export function onerilenAraclar(d: { dolapDolu: boolean; bugunKayitVar: boolean; saat: number; ayinGunu: number; ayGunSayisi: number }): Tool[] {
  const sira: string[] = ['advisor'];
  if (d.bugunKayitVar && d.saat >= 17) sira.push('diary');
  sira.push(d.dolapDolu ? 'spin' : 'similar');
  if (d.ayGunSayisi - d.ayinGunu < 7 || d.ayinGunu <= 2) sira.push('report');
  sira.push('store', 'friend', 'compare', 'similar');
  const ids = [...new Set(sira)].slice(0, 4);
  return ids.map(id => TOOLS.find(t => t.id === id)!).filter(Boolean);
}
