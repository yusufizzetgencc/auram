/**
 * AROMIXEN - Lüks Parfüm Öneri Uygulaması
 * Premium Tema ve Renk Sistemi
 * Elegant Mor/Fuşya Gradient Teması
 */

import { Platform } from 'react-native';

// Lüks parfüm temalı renk paleti - Mor/Fuşya tonları
export const Colors = {
  // Ana renkler - Mor gradient paleti
  primary: {
    50: '#F8F0FF',
    100: '#EED9FF',
    200: '#DEB8FF',
    300: '#C98FFF',
    400: '#B366FF',
    500: '#9D4EDD', // Ana mor
    600: '#7B2CBF',
    700: '#5A189A',
    800: '#3C096C',
    900: '#240046',
  },
  
  // Aksan renkleri - Koku tipleri için
  accent: {
    floral: '#FF6B9D',      // Çiçeksi - Pembe/Fuşya
    woody: '#6B4423',       // Odunsu - Koyu Kahve
    fresh: '#00D4AA',       // Ferah - Turkuaz
    amber: '#FF8C42',       // Amber - Altın Turuncu
    spicy: '#E63946',       // Baharatlı - Kırmızı
    fruity: '#FF69B4',      // Meyvemsi - Pembe
    sweet: '#FFB4D1',       // Tatlı - Açık Pembe
    green: '#2ECC71',       // Yeşil - Canlı Yeşil
    oriental: '#C9A227',    // Oryantal - Altın
    aquatic: '#00B4D8',     // Aquatik - Okyanus Mavisi
  },

  // Mevsim renkleri
  seasons: {
    spring: '#C8E6C9',      // İlkbahar - Pastel Yeşil
    summer: '#FFECB3',      // Yaz - Pastel Sarı
    autumn: '#FFAB91',      // Sonbahar - Pastel Turuncu
    winter: '#B3E5FC',      // Kış - Pastel Mavi
  },

  // Gradient renkleri
  gradients: {
    primary: ['#9D4EDD', '#7B2CBF', '#5A189A'],
    secondary: ['#FF6B9D', '#C9184A', '#A4133C'],
    accent: ['#00D4AA', '#00B4D8', '#0077B6'],
    warm: ['#FF8C42', '#FF6B35', '#E63946'],
    dark: ['#240046', '#3C096C', '#5A189A'],
    light: ['#F8F0FF', '#EED9FF', '#DEB8FF'],
    gold: ['#FFD700', '#FFA500', '#FF8C00'],
  },

  // Light tema - Elegant ve clean
  light: {
    text: '#1A0A2E',
    textSecondary: '#4A3A5C',
    textMuted: '#8A7A9C',
    background: '#FDFBFF',
    backgroundSecondary: '#F8F4FC',
    backgroundTertiary: '#F0EAF5',
    card: '#FFFFFF',
    cardBorder: '#E8E0F0',
    tint: '#9D4EDD',
    tintSecondary: '#7B2CBF',
    icon: '#6B5B7B',
    tabIconDefault: '#9A8AAC',
    tabIconSelected: '#9D4EDD',
    border: '#E8E0F0',
    success: '#2ECC71',
    error: '#E63946',
    warning: '#FF8C42',
    info: '#00B4D8',
    overlay: 'rgba(26, 10, 46, 0.5)',
    gradient: ['#FDFBFF', '#F8F4FC'],
  },

  // Dark tema - Lüks ve derin
  dark: {
    text: '#F8F0FF',
    textSecondary: '#C8B8D8',
    textMuted: '#8A7A9C',
    background: '#0D0A14',
    backgroundSecondary: '#150F20',
    backgroundTertiary: '#1E1628',
    card: '#1A1226',
    cardBorder: '#2A1E3A',
    tint: '#B366FF',
    tintSecondary: '#9D4EDD',
    icon: '#9A8AAC',
    tabIconDefault: '#6A5A7C',
    tabIconSelected: '#B366FF',
    border: '#2A1E3A',
    success: '#2ECC71',
    error: '#FF6B6B',
    warning: '#FF8C42',
    info: '#00D4AA',
    overlay: 'rgba(0, 0, 0, 0.8)',
    gradient: ['#0D0A14', '#150F20'],
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
    display: 'System',
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

// Gölgeler - Platform uyumlu ve lüks görünüm
const createShadow = (offsetY: number, blur: number, opacity: number, elevation: number, color: string = '#9D4EDD') => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `0px ${offsetY}px ${blur}px rgba(157, 78, 221, ${opacity})`,
    };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blur / 2,
    elevation: elevation,
  };
};

export const Shadows = {
  light: {
    sm: createShadow(2, 4, 0.08, 2),
    base: createShadow(4, 8, 0.12, 4),
    md: createShadow(6, 16, 0.15, 6),
    lg: createShadow(8, 24, 0.18, 10),
    xl: createShadow(12, 32, 0.22, 16),
    glow: {
      shadowColor: '#9D4EDD',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
  },
  dark: {
    sm: createShadow(2, 4, 0.4, 2, '#B366FF'),
    base: createShadow(4, 8, 0.5, 4, '#B366FF'),
    md: createShadow(6, 16, 0.6, 6, '#B366FF'),
    lg: createShadow(8, 24, 0.7, 10, '#B366FF'),
    xl: createShadow(12, 32, 0.8, 16, '#B366FF'),
    glow: {
      shadowColor: '#B366FF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 12,
    },
  },
};

// Animasyon süreleri
export const AnimationDurations = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,
};

// Koku tipi renkleri - Daha canlı ve lüks
export const ScentTypeColors: Record<string, string> = {
  'Çiçeksi': '#FF6B9D',
  'Odunsu': '#8B5A2B',
  'Ferah': '#00D4AA',
  'Amber': '#FF8C42',
  'Baharatlı': '#E63946',
  'Meyvemsi': '#FF69B4',
  'Tatlı': '#FFB4D1',
  'Yeşil': '#2ECC71',
  'Oryantal': '#C9A227',
  'Aquatik': '#00B4D8',
  'Deri': '#654321',
  'Pudralı': '#F5E6E8',
};

// Koku tipi ikonları
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
