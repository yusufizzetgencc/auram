/**
 * Teninde marka öğeleri — yollar scripts/build_brand.py ile üretilir (constants/brandPaths.ts).
 *  Monogram: işaret — amber damla, altında hafif kemerli ince "ten" çizgisi (uygulama simgesiyle aynı)
 *  Wordmark: Manrope SemiBold harfleri vektör; noktasız ı'nın noktası işaretin küçüğü
 * İkisi de yazı tipine bağlı değildir; her ekranda ve boyutta aynı görünür.
 */
import { ISARET, YAZI } from '@/constants/brandPaths';
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from './index';

/** İşaret. `color` damla rengi (varsayılan amber), `ring` ten çizgisinin rengi (varsayılan mürekkep). */
export function Monogram({ size = 64, color, ring }: { size?: number; color?: string; ring?: string }) {
  const c = useTheme();
  // Küçük boyutta çizgi biraz kalınlaşır ki kaybolmasın
  const kalinlik = size < 28 ? 6 : size < 48 ? 5 : 4.2;
  return (
    <Svg width={size} height={size} viewBox="17 15 66 66" accessibilityLabel="Teninde">
      <Path d={ISARET.damla} fill={color ?? c.accent} />
      <Path d={ISARET.ten} stroke={ring ?? c.ink} strokeWidth={kalinlik} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

/** Yazı logosu. `size` yazı boyutu (px) gibi davranır: 2000 font birimi = size. `accent` damla rengi (koyu kartlarda açık amber). */
export function Wordmark({ size = 28, color, accent }: { size?: number; color?: string; accent?: string }) {
  const c = useTheme();
  const [, , w, h] = YAZI.viewBox.split(' ').map(Number);
  const renk = color ?? c.ink;
  return (
    <Svg width={(w / 2000) * size} height={(h / 2000) * size} viewBox={YAZI.viewBox} accessibilityLabel="Teninde">
      <Path d={YAZI.harfler} fill={renk} />
      <Path d={YAZI.ten} stroke={renk} strokeWidth={YAZI.tenKalinlik} strokeLinecap="round" fill="none" />
      <Path d={YAZI.damla} fill={accent ?? c.accent} />
    </Svg>
  );
}
