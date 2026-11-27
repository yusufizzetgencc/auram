/**
 * TENİNDE — Tasarım Sistemi v2
 *
 * His: sakin, sıcak, lüks ama klinik değil. Parfüm butiği ile bilim dergisi arası.
 * Kurallar:
 *  - Krem zemin, mürekkep metin, TEK vurgu rengi (amber). Başka parlak renk yok.
 *  - Gölge yerine ince kenarlık. Kart köşe yarıçapı 20.
 *  - Başlıklar Manrope (sıkı, yarı kalın), metin Inter.
 *  - 8 pt ızgara, dokunma alanı en az 44 pt.
 * Ekranlarda sabit hex renk KULLANMA; buradaki token'ları kullan.
 */

import { Platform, TextStyle } from 'react-native';

const light = {
  bg: '#F7F3EE',
  surface: '#FFFFFF',
  surfaceAlt: '#EFE8DF',
  ink: '#1E1B18',
  inkMuted: '#6F675F',
  inkSubtle: '#9A9087',
  accent: '#A8642A',
  accentSoft: '#F1E2D1',
  onAccent: '#FFFFFF',
  border: '#E4DCD2',
  success: '#3F7D5B',
  warning: '#B5862A',
  danger: '#B3473D',
  scrim: 'rgba(30, 27, 24, 0.45)',
};

const dark: typeof light = {
  bg: '#121010',
  surface: '#1C1917',
  surfaceAlt: '#26211E',
  ink: '#F2ECE4',
  inkMuted: '#A89F95',
  inkSubtle: '#7A7169',
  accent: '#D9955A',
  accentSoft: '#3A2A1D',
  onAccent: '#121010',
  border: '#332C27',
  success: '#6FB58C',
  warning: '#D9AE55',
  danger: '#E07A6F',
  scrim: 'rgba(0, 0, 0, 0.6)',
};

/** Eski ekran/kod uyumluluğu için anlamsal eşlemeler (yeni kodda yukarıdaki adları kullan). */
const withLegacy = (t: typeof light) => ({
  ...t,
  background: t.bg,
  backgroundSecondary: t.surfaceAlt,
  backgroundTertiary: t.surfaceAlt,
  textPrimary: t.ink,
  textSecondary: t.inkMuted,
  text: t.ink,
  textMuted: t.inkSubtle,
  primary: t.ink,
  card: t.surface,
  cardBorder: t.border,
  tint: t.accent,
  tintSecondary: t.inkMuted,
  icon: t.inkMuted,
  tabIconDefault: t.inkSubtle,
  tabIconSelected: t.ink,
  error: t.danger,
  info: t.accent,
  overlay: t.scrim,
  gradient: [t.bg, t.bg] as [string, string, ...string[]],
});

export const Colors = { light: withLegacy(light), dark: withLegacy(dark) };
export type ThemeColors = ReturnType<typeof withLegacy>;

// ============ TİPOGRAFİ ============
export const FontFamilies = {
  displayBold: 'Manrope_700Bold',
  display: 'Manrope_600SemiBold',
  displayMedium: 'Manrope_500Medium',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** fontWeight değerini doğru Inter ailesine çevirir (özel fontta fontWeight kullanılmaz). */
export const interFor = (weight?: string | number): string => {
  const w = Number(weight === 'bold' ? 700 : weight === 'normal' || weight === undefined ? 400 : weight);
  if (w >= 700) return FontFamilies.bold;
  if (w >= 600) return FontFamilies.semiBold;
  if (w >= 500) return FontFamilies.medium;
  return FontFamilies.regular;
};

/** Tip ölçeği — ekranlarda serbest fontSize yerine bunları kullan. */
export const Type = {
  hero: { fontFamily: FontFamilies.displayBold, fontSize: 34, lineHeight: 40, letterSpacing: -0.8 },
  h1: { fontFamily: FontFamilies.displayBold, fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  h2: { fontFamily: FontFamilies.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  h3: { fontFamily: FontFamilies.display, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: FontFamilies.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: FontFamilies.semiBold, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: FontFamilies.regular, fontSize: 13, lineHeight: 18 },
  smallStrong: { fontFamily: FontFamilies.medium, fontSize: 13, lineHeight: 18 },
  // Büyük harf dönüşümü T bileşeninde Türkçe kurallarla yapılır (textTransform 'i'→'I' yapar, 'İ' değil)
  overline: { fontFamily: FontFamilies.semiBold, fontSize: 11, lineHeight: 14, letterSpacing: 1.4 },
  number: { fontFamily: FontFamilies.displayBold, fontSize: 48, lineHeight: 52, letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
} satisfies Record<string, TextStyle>;

// Eski kod uyumluluğu
export const Fonts = Platform.select({
  default: { regular: FontFamilies.regular, medium: FontFamilies.medium, semiBold: FontFamilies.semiBold, bold: FontFamilies.bold, display: FontFamilies.display },
});

export const FontSizes = { xs: 11, sm: 13, base: 15, md: 17, lg: 20, xl: 24, '2xl': 28, '3xl': 34, '4xl': 44, '5xl': 56 };

export const FontWeights = {
  thin: '100' as const,
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

// 8 pt ızgara
export const Spacing = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, '2xl': 32, '3xl': 40, '4xl': 48, '5xl': 64 };

export const BorderRadius = { none: 0, sm: 6, base: 10, md: 14, lg: 20, xl: 20, '2xl': 28, '3xl': 32, full: 9999 };

/** Gölge yerine ince kenarlık kullanılır; gölgeler yalnızca yüzen öğelerde (sheet, FAB). */
const noShadow = {};
const floating = Platform.select({
  ios: { shadowColor: '#1E1B18', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24 },
  android: { elevation: 6 },
  default: {},
})!;
export const Shadows = {
  light: { sm: noShadow, base: noShadow, md: noShadow, lg: floating, xl: floating, glow: noShadow },
  dark: { sm: noShadow, base: noShadow, md: noShadow, lg: floating, xl: floating, glow: noShadow },
};

export const AnimationDurations = { fast: 150, normal: 250, slow: 400, verySlow: 700 };

// Koku aileleri: yalnızca çip ve grafiklerde kullanılan yumuşak tonlar
export const ScentTypeColors: Record<string, string> = {
  'Çiçeksi': '#C7929B',
  'Odunsu': '#8A6A55',
  'Ferah': '#7FA39A',
  'Amber': '#C68B4E',
  'Baharatlı': '#A9604F',
  'Meyvemsi': '#C98A7A',
  'Tatlı': '#C9A27E',
  'Yeşil': '#7E9A6E',
  'Oryantal': '#A88358',
  'Aquatik': '#7C98A6',
  'Deri': '#6E5A4C',
  'Pudralı': '#BCA7A9',
};

export const ScentTypeIcons: Record<string, string> = {
  'Çiçeksi': 'flower-outline',
  'Odunsu': 'leaf-outline',
  'Ferah': 'water-outline',
  'Amber': 'flame-outline',
  'Baharatlı': 'sparkles-outline',
  'Meyvemsi': 'nutrition-outline',
  'Tatlı': 'ice-cream-outline',
  'Yeşil': 'leaf-outline',
  'Oryantal': 'moon-outline',
  'Aquatik': 'boat-outline',
  'Deri': 'shield-outline',
  'Pudralı': 'ellipse-outline',
};
