/**
 * KOKU - Parfüm Öneri Uygulaması
 * Tema ve Renk Sistemi
 */

import { Platform } from 'react-native';

// Parfüm temalı renk paleti
export const Colors = {
  // Ana renkler
  primary: {
    50: '#FFF8E7',
    100: '#FFEFC2',
    200: '#FFE49A',
    300: '#FFD872',
    400: '#FFCC4D',
    500: '#D4A574', // Ana altın/amber tonu
    600: '#B8956A',
    700: '#9C8460',
    800: '#806F56',
    900: '#655A4C',
  },
  
  // Vurgu renkleri - Koku tipleri için
  accent: {
    floral: '#E8A4C9',      // Çiçeksi - Pembe
    woody: '#8B7355',       // Odunsu - Kahve
    fresh: '#7EC8E3',       // Ferah - Mavi
    amber: '#D4A574',       // Amber - Altın
    spicy: '#C75B39',       // Baharatlı - Turuncu/Kırmızı
  },

  // Mevsim renkleri
  seasons: {
    spring: '#A8E6CF',      // İlkbahar - Yeşil
    summer: '#FFE66D',      // Yaz - Sarı
    autumn: '#FF8C42',      // Sonbahar - Turuncu
    winter: '#95C8F4',      // Kış - Açık Mavi
  },

  // Light tema
  light: {
    text: '#1A1A2E',
    textSecondary: '#4A4A5C',
    textMuted: '#8A8A9C',
    background: '#FEFEFE',
    backgroundSecondary: '#F8F4F0',
    backgroundTertiary: '#F0EBE5',
    card: '#FFFFFF',
    cardBorder: '#E8E4E0',
    tint: '#D4A574',
    icon: '#6B6B7B',
    tabIconDefault: '#8A8A9C',
    tabIconSelected: '#D4A574',
    border: '#E8E4E0',
    success: '#4CAF50',
    error: '#EF5350',
    warning: '#FFB74D',
    overlay: 'rgba(26, 26, 46, 0.5)',
  },

  // Dark tema
  dark: {
    text: '#F5F5F7',
    textSecondary: '#B8B8C8',
    textMuted: '#787890',
    background: '#0D0D14',
    backgroundSecondary: '#16161F',
    backgroundTertiary: '#1E1E2A',
    card: '#1A1A26',
    cardBorder: '#2A2A3A',
    tint: '#E8B886',
    icon: '#9494A4',
    tabIconDefault: '#787890',
    tabIconSelected: '#E8B886',
    border: '#2A2A3A',
    success: '#66BB6A',
    error: '#EF5350',
    warning: '#FFB74D',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

// Modern ve zarif yazı tipleri
export const Fonts = Platform.select({
  ios: {
    thin: 'System',
    light: 'System',
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
    display: 'System', // Başlıklar için
  },
  android: {
    thin: 'sans-serif-thin',
    light: 'sans-serif-light',
    regular: 'sans-serif',
    medium: 'sans-serif-medium',
    semiBold: 'sans-serif-medium',
    bold: 'sans-serif-bold',
    display: 'sans-serif',
  },
  default: {
    thin: 'System',
    light: 'System',
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
    display: 'System',
  },
});

// Font boyutları
export const FontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 36,
  '4xl': 48,
  '5xl': 60,
};

// Font ağırlıkları
export const FontWeights = {
  thin: '100' as const,
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

// Boşluklar
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// Border radius
export const BorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// Gölgeler - Platform uyumlu
const createShadow = (offsetY: number, blur: number, opacity: number, elevation: number) => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `0px ${offsetY}px ${blur}px rgba(0, 0, 0, ${opacity})`,
    };
  }
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blur / 2,
    elevation: elevation,
  };
};

export const Shadows = {
  light: {
    sm: createShadow(1, 4, 0.05, 1),
    base: createShadow(2, 8, 0.08, 2),
    md: createShadow(4, 16, 0.1, 4),
    lg: createShadow(8, 32, 0.12, 8),
  },
  dark: {
    sm: createShadow(1, 4, 0.3, 1),
    base: createShadow(2, 8, 0.4, 2),
    md: createShadow(4, 16, 0.5, 4),
    lg: createShadow(8, 32, 0.6, 8),
  },
};
