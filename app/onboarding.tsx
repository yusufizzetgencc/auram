/**
 * AROMIXEN - Onboarding Screen
 * pH Hesaplama + Kişiselleştirilmiş Sorular
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { 
  OnboardingStep, 
  KokuTipi, 
  PHBilgiDurumu,
  UserPreferences,
} from '@/types';

const { width } = Dimensions.get('window');

// Onboarding Adımları
const onboardingSteps: OnboardingStep[] = [
  // 0️⃣ pH DURUMU
  {
    id: 'ph_bilgi',
    kategori: 'Cilt pH',
    title: 'Cilt pH Değerinizi Biliyor musunuz?',
    subtitle: 'pH değeri parfümün cildinizde nasıl kokacağını belirler',
    type: 'single',
    field: 'phInfo',
    options: [
      { id: 'biliyorum', title: 'Evet, Biliyorum', subtitle: 'pH değerimi gireceğim', icon: 'checkmark-circle-outline', color: '#4CAF50' },
      { id: 'bilmiyorum', title: 'Hayır, Bilmiyorum', subtitle: 'Benim için hesaplayın', icon: 'calculator-outline', color: '#2196F3' },
    ],
  },
  // 1️⃣ pH DEĞERİ GİRİŞİ (Sadece biliyorsa gösterilir)
  {
    id: 'ph_deger',
    kategori: 'Cilt pH',
    title: 'pH Değerinizi Girin',
    subtitle: 'Normal cilt pH değeri 4.5 - 6.5 arasındadır',
    type: 'ph-input',
    field: 'phDeger',
  },
  // 2️⃣ CİLT TİPİ
  {
    id: 'cilt_tipi',
    kategori: 'Fiziksel Özellikler',
    title: 'Cilt Tipiniz Nedir?',
    subtitle: 'Cilt tipiniz parfümün kalıcılığını etkiler',
    type: 'single',
    field: 'ciltTipi',
    options: [
      { id: 'normal', title: 'Normal', subtitle: 'Dengeli nem, koku iyi kalır', icon: 'hand-left-outline', color: '#A8D5BA' },
      { id: 'kuru', title: 'Kuru', subtitle: 'Koku hızlı uçabilir', icon: 'water-outline', color: '#FFD6A5' },
      { id: 'yagli', title: 'Yağlı', subtitle: 'Koku çok uzun kalır', icon: 'water', color: '#BDE0FE' },
    ],
  },
  // 3️⃣ TERLEME ORANI
  {
    id: 'terleme',
    kategori: 'Fiziksel Özellikler',
    title: 'Günlük Terleme Oranınız?',
    subtitle: 'Terleme, üst notaların uçma hızını etkiler',
    type: 'single',
    field: 'terlemeOrani',
    options: [
      { id: 'az', title: 'Az', subtitle: 'Nadiren terlerim', icon: 'sunny-outline', color: '#FFFACD' },
      { id: 'normal', title: 'Normal', subtitle: 'Ortalama terleme', icon: 'partly-sunny-outline', color: '#FFECD2' },
      { id: 'cok', title: 'Çok', subtitle: 'Sık terlerim', icon: 'rainy-outline', color: '#C9E4DE' },
    ],
  },
  // 4️⃣ CİLT HASSASİYETİ
  {
    id: 'hassasiyet',
    kategori: 'Fiziksel Özellikler',
    title: 'Cildiniz Hassas mı?',
    subtitle: 'Hassas cilt bazı notalarla uyumsuz olabilir',
    type: 'single',
    field: 'ciltHassasiyeti',
    options: [
      { id: 'hassas', title: 'Hassas', subtitle: 'Kolayca tahriş olur', icon: 'alert-circle-outline', color: '#FFADAD' },
      { id: 'normal', title: 'Normal', subtitle: 'Genelde sorun yok', icon: 'checkmark-circle-outline', color: '#A8E6CF' },
      { id: 'dayanikli', title: 'Dayanıklı', subtitle: 'Hiçbir şey etkilemez', icon: 'shield-checkmark-outline', color: '#D0E8F2' },
    ],
  },
  // 5️⃣ KOKU TİPLERİ
  {
    id: 'koku_tipleri',
    kategori: 'Kişisel Tercihler',
    title: 'Hangi Koku Tiplerini Seviyorsunuz?',
    subtitle: 'Birden fazla seçebilirsiniz',
    type: 'multiple',
    field: 'kokuTipleri',
    options: [
      { id: 'Çiçeksi', title: 'Çiçeksi', subtitle: 'Gül, yasemin, lavanta', icon: 'flower-outline', color: '#E8A4C9' },
      { id: 'Odunsu', title: 'Odunsu', subtitle: 'Sandal, sedir, paçuli', icon: 'leaf-outline', color: '#8B7355' },
      { id: 'Ferah', title: 'Ferah', subtitle: 'Narenciye, deniz, nane', icon: 'water-outline', color: '#7EC8E3' },
      { id: 'Amber', title: 'Amber', subtitle: 'Vanilya, amber, reçine', icon: 'flame-outline', color: '#D4A574' },
      { id: 'Baharatlı', title: 'Baharatlı', subtitle: 'Tarçın, karanfil, biber', icon: 'sparkles-outline', color: '#C75B39' },
      { id: 'Meyvemsi', title: 'Meyvemsi', subtitle: 'Şeftali, elma, mango', icon: 'nutrition-outline', color: '#FF6B6B' },
      { id: 'Tatlı', title: 'Tatlı', subtitle: 'Karamel, çikolata, vanilya', icon: 'ice-cream-outline', color: '#FFB6C1' },
      { id: 'Yeşil', title: 'Yeşil', subtitle: 'Yeşil çay, bambu, ot', icon: 'leaf-outline', color: '#90EE90' },
    ],
  },
  // 6️⃣ CİNSİYET
  {
    id: 'cinsiyet',
    kategori: 'Kişisel Tercihler',
    title: 'Parfüm Tercihiniz',
    subtitle: 'Size uygun parfüm yönlendirmesi',
    type: 'single',
    field: 'cinsiyet',
    options: [
      { id: 'erkek', title: 'Erkek', subtitle: 'Maskülen kokular', icon: 'man-outline', color: '#6495ED' },
      { id: 'kadın', title: 'Kadın', subtitle: 'Feminen kokular', icon: 'woman-outline', color: '#FF69B4' },
      { id: 'unisex', title: 'Unisex', subtitle: 'Cinsiyetsiz kokular', icon: 'people-outline', color: '#9370DB' },
    ],
  },
  // 7️⃣ YOĞUNLUK
  {
    id: 'yogunluk',
    kategori: 'Kişisel Tercihler',
    title: 'Hangi Yoğunlukta Kokular?',
    subtitle: 'Parfümün güç seviyesi',
    type: 'single',
    field: 'yogunluk',
    options: [
      { id: 'hafif', title: 'Hafif', subtitle: 'Yakın mesafede hissedilir', icon: 'remove-outline', color: '#E0E0E0' },
      { id: 'orta', title: 'Orta', subtitle: 'Dengeli yoğunluk', icon: 'reorder-two-outline', color: '#BDBDBD' },
      { id: 'yogun', title: 'Yoğun', subtitle: 'Uzaktan bile hissedilir', icon: 'reorder-four-outline', color: '#9E9E9E' },
    ],
  },
  // 8️⃣ KULLANIM AMACI
  {
    id: 'kullanim',
    kategori: 'Kişisel Tercihler',
    title: 'Ne Amaçla Kullanacaksınız?',
    subtitle: 'Parfümü hangi ortamlarda kullanacaksınız',
    type: 'single',
    field: 'kullanimAmaci',
    options: [
      { id: 'gunluk', title: 'Günlük', subtitle: 'Her gün kullanım', icon: 'today-outline', color: '#81D4FA' },
      { id: 'is', title: 'İş', subtitle: 'Ofis ve profesyonel', icon: 'briefcase-outline', color: '#90A4AE' },
      { id: 'aksam', title: 'Akşam/Gece', subtitle: 'Dışarı çıkma', icon: 'moon-outline', color: '#7986CB' },
      { id: 'ozel', title: 'Özel Gün', subtitle: 'Özel anlar', icon: 'star-outline', color: '#FFD54F' },
    ],
  },
  // 9️⃣ MEVSİM
  {
    id: 'mevsim',
    kategori: 'Hava ve Mekan',
    title: 'Hangi Mevsimde Kullanacaksınız?',
    subtitle: 'Mevsime uygun notalar önerilir',
    type: 'single',
    field: 'mevsim',
    options: [
      { id: 'İlkbahar', title: 'İlkbahar', subtitle: 'Hafif, çiçeksi', icon: 'flower-outline', color: '#A8E6CF' },
      { id: 'Yaz', title: 'Yaz', subtitle: 'Ferah, narenciye', icon: 'sunny-outline', color: '#FFE66D' },
      { id: 'Sonbahar', title: 'Sonbahar', subtitle: 'Sıcak, baharatlı', icon: 'leaf-outline', color: '#FF8C42' },
      { id: 'Kış', title: 'Kış', subtitle: 'Yoğun, odunsu', icon: 'snow-outline', color: '#95C8F4' },
      { id: 'Tüm Mevsimler', title: 'Tüm Mevsimler', subtitle: 'Her zaman', icon: 'infinite-outline', color: '#B8B8C8' },
    ],
  },
  // 🔟 İKLİM
  {
    id: 'iklim',
    kategori: 'Hava ve Mekan',
    title: 'Bulunduğunuz İklim Nasıl?',
    subtitle: 'İklim koşullarına uygun koku',
    type: 'single',
    field: 'iklim',
    options: [
      { id: 'sicak', title: 'Sıcak', subtitle: '25°C üzeri', icon: 'sunny', color: '#FF7043' },
      { id: 'soguk', title: 'Soğuk', subtitle: '15°C altı', icon: 'snow', color: '#4FC3F7' },
      { id: 'nemli', title: 'Nemli', subtitle: 'Yüksek nem', icon: 'water', color: '#4DD0E1' },
      { id: 'kuru', title: 'Kuru', subtitle: 'Düşük nem', icon: 'partly-sunny', color: '#FFB74D' },
    ],
  },
  // 1️⃣1️⃣ ORTAM
  {
    id: 'ortam',
    kategori: 'Hava ve Mekan',
    title: 'Genellikle Nerede Kullanırsınız?',
    subtitle: 'Kullanım alanınıza uygun parfüm',
    type: 'single',
    field: 'ortam',
    options: [
      { id: 'kapali', title: 'Kapalı Alan', subtitle: 'Ofis, ev, restoran', icon: 'home-outline', color: '#A1887F' },
      { id: 'acik', title: 'Açık Alan', subtitle: 'Park, bahçe, dışarı', icon: 'leaf-outline', color: '#81C784' },
      { id: 'her_ikisi', title: 'Her İkisi', subtitle: 'Hem kapalı hem açık', icon: 'globe-outline', color: '#64B5F6' },
    ],
  },
  // 1️⃣2️⃣ KIYAFET STİLİ
  {
    id: 'kiyafet',
    kategori: 'Yaşam Tarzı',
    title: 'Günlük Kıyafet Tarzınız?',
    subtitle: 'Tarzınıza uygun parfüm önerisi',
    type: 'single',
    field: 'kiyafetStili',
    options: [
      { id: 'casual', title: 'Casual', subtitle: 'Günlük rahat', icon: 'shirt-outline', color: '#90CAF9' },
      { id: 'formal', title: 'Formal', subtitle: 'Resmi ve şık', icon: 'briefcase-outline', color: '#78909C' },
      { id: 'sportif', title: 'Sportif', subtitle: 'Aktif ve dinamik', icon: 'fitness-outline', color: '#66BB6A' },
      { id: 'trendy', title: 'Trendy', subtitle: 'Moda takipçisi', icon: 'sparkles-outline', color: '#CE93D8' },
      { id: 'gece', title: 'Gece/Özel', subtitle: 'Özel geceler için', icon: 'moon-outline', color: '#5C6BC0' },
    ],
  },
  // 1️⃣3️⃣ AKTİVİTE
  {
    id: 'aktivite',
    kategori: 'Yaşam Tarzı',
    title: 'Aktivite Yoğunluğunuz?',
    subtitle: 'Günlük rutininize uygun koku',
    type: 'single',
    field: 'aktivite',
    options: [
      { id: 'spor', title: 'Spor', subtitle: 'Aktif spor', icon: 'fitness-outline', color: '#4CAF50' },
      { id: 'ofis', title: 'Ofis', subtitle: 'Masa başı çalışma', icon: 'desktop-outline', color: '#607D8B' },
      { id: 'ev', title: 'Ev', subtitle: 'Ev aktiviteleri', icon: 'home-outline', color: '#8D6E63' },
      { id: 'sosyal', title: 'Sosyal', subtitle: 'Sosyal etkinlikler', icon: 'people-outline', color: '#AB47BC' },
    ],
  },
  // 1️⃣4️⃣ KALICILIK TERCİHİ
  {
    id: 'kalicilik',
    kategori: 'Koku Alışkanlıkları',
    title: 'Ne Kadar Kalıcılık İstersiniz?',
    subtitle: 'Parfümün cildinizde kalma süresi',
    type: 'single',
    field: 'kalicilikTercihi',
    options: [
      { id: 'kisa', title: 'Kısa (2-4 saat)', subtitle: 'Hafif ve uçucu', icon: 'time-outline', color: '#B2EBF2' },
      { id: 'orta', title: 'Orta (4-6 saat)', subtitle: 'Dengeli', icon: 'hourglass-outline', color: '#80DEEA' },
      { id: 'uzun', title: 'Uzun (6+ saat)', subtitle: 'Güçlü kalıcılık', icon: 'infinite-outline', color: '#4DD0E1' },
    ],
  },
  // 1️⃣5️⃣ SEVİLEN NOTALAR
  {
    id: 'sevilen',
    kategori: 'Koku Alışkanlıkları',
    title: 'Sevdiğiniz Notalar',
    subtitle: 'Size hitap eden koku notalarını seçin',
    type: 'multi-select-notes',
    field: 'sevilenNotalar',
    noteOptions: [
      'gül', 'yasemin', 'lavanta', 'vanilya', 'amber', 'sandal ağacı',
      'bergamot', 'limon', 'portakal', 'misk', 'paçuli', 'tarçın',
      'kakao', 'kahve', 'karamel', 'nane', 'deniz notası'
    ],
  },
  // 1️⃣6️⃣ SEVİLMEYEN NOTALAR
  {
    id: 'sevilmeyen',
    kategori: 'Koku Alışkanlıkları',
    title: 'Sevmediğiniz Notalar',
    subtitle: 'Kaçınmak istediğiniz notalar (opsiyonel)',
    type: 'multi-select-notes',
    field: 'sevilmeyenNotalar',
    noteOptions: [
      'gül', 'yasemin', 'lavanta', 'vanilya', 'amber', 'sandal ağacı',
      'bergamot', 'limon', 'portakal', 'misk', 'paçuli', 'tarçın',
      'oud', 'deri', 'tütün', 'biber', 'karanfil'
    ],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const shadows = Shadows[colorScheme ?? 'light'];
  
  const { 
    preferences, 
    setPreference, 
    toggleArrayPreference,
    setPHBilgiDurumu,
    setKullaniciPH,
    hesaplaPH,
    currentStep, 
    setCurrentStep,
    setIsOnboardingComplete,
    getRecommendations,
  } = useApp();

  const [phInput, setPHInput] = useState('');
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));

  // pH bilgisine göre adımları filtrele
  const getVisibleSteps = () => {
    if (preferences.phInfo.biliyorMu === 'biliyorum') {
      return onboardingSteps; // pH giriş adımı dahil
    } else {
      // pH giriş adımını atla
      return onboardingSteps.filter(step => step.id !== 'ph_deger');
    }
  };

  const visibleSteps = getVisibleSteps();
  const currentStepData = visibleSteps[currentStep];
  const progress = ((currentStep + 1) / visibleSteps.length) * 100;

  // Animasyon efekti
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  const animateTransition = (direction: number, callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction * 50,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(-direction * 50);
    });
  };

  // Seçim işleyicileri
  const handleSingleSelect = (value: string) => {
    if (currentStepData.id === 'ph_bilgi') {
      setPHBilgiDurumu(value as PHBilgiDurumu);
    } else {
      setPreference(currentStepData.field as keyof UserPreferences, value as any);
    }
  };

  const handleMultiSelect = (value: string) => {
    toggleArrayPreference(currentStepData.field as keyof UserPreferences, value);
  };

  const handlePHInput = (text: string) => {
    // Sadece sayı ve nokta kabul et
    const cleanText = text.replace(/[^0-9.]/g, '');
    setPHInput(cleanText);
    
    const phValue = parseFloat(cleanText);
    if (!isNaN(phValue) && phValue >= 3.0 && phValue <= 8.0) {
      setKullaniciPH(phValue);
    }
  };

  // İleri git
  const handleNext = () => {
    if (currentStep < visibleSteps.length - 1) {
      animateTransition(1, () => setCurrentStep(currentStep + 1));
    } else {
      // Onboarding tamamlandı
      // pH bilmiyorsa hesapla
      if (preferences.phInfo.biliyorMu === 'bilmiyorum') {
        hesaplaPH();
      }
      
      // Önerileri getir
      getRecommendations();
      setIsOnboardingComplete(true);
      router.replace('/results');
    }
  };

  // Geri git
  const handleBack = () => {
    if (currentStep > 0) {
      animateTransition(-1, () => setCurrentStep(currentStep - 1));
    }
  };

  // Atlama kontrolü
  const canSkip = () => {
    if (currentStepData.type === 'multi-select-notes') return true;
    return false;
  };

  // İlerleme kontrolü
  const canProceed = () => {
    switch (currentStepData.type) {
      case 'single':
        if (currentStepData.id === 'ph_bilgi') {
          return preferences.phInfo.biliyorMu !== null;
        }
        return preferences[currentStepData.field as keyof UserPreferences] !== null;
      case 'multiple':
        const arr = preferences[currentStepData.field as keyof UserPreferences] as string[];
        return arr && arr.length > 0;
      case 'ph-input':
        const ph = parseFloat(phInput);
        return !isNaN(ph) && ph >= 3.0 && ph <= 8.0;
      case 'multi-select-notes':
        return true; // Opsiyonel
      default:
        return true;
    }
  };

  // Seçili mi kontrolü
  const isSelected = (optionId: string) => {
    if (currentStepData.id === 'ph_bilgi') {
      return preferences.phInfo.biliyorMu === optionId;
    }
    
    const value = preferences[currentStepData.field as keyof UserPreferences];
    if (Array.isArray(value)) {
      return value.includes(optionId);
    }
    return value === optionId;
  };

  // Seçenek kartı renderı
  const renderOption = (option: OnboardingStep['options'][0]) => {
    const selected = isSelected(option.id);
    const isMultiple = currentStepData.type === 'multiple';

    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.optionCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          shadows.sm,
          selected && { borderColor: option.color, borderWidth: 2, backgroundColor: `${option.color}15` },
        ]}
        onPress={() => isMultiple ? handleMultiSelect(option.id) : handleSingleSelect(option.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
          <Ionicons 
            name={option.icon as any} 
            size={24} 
            color="#FFF" 
          />
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
          {option.subtitle && (
            <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>{option.subtitle}</Text>
          )}
        </View>
        {selected && (
          <Ionicons name="checkmark-circle" size={24} color={option.color} />
        )}
      </TouchableOpacity>
    );
  };

  // Nota seçim kartı renderı
  const renderNoteOption = (nota: string) => {
    const field = currentStepData.field as keyof UserPreferences;
    const selected = (preferences[field] as string[]).includes(nota);

    return (
      <TouchableOpacity
        key={nota}
        style={[
          styles.noteChip,
          { backgroundColor: colors.card, borderColor: colors.border },
          selected && { backgroundColor: colors.tint, borderColor: colors.tint },
        ]}
        onPress={() => handleMultiSelect(nota)}
        activeOpacity={0.7}
      >
        <Text style={[styles.noteChipText, { color: colors.textSecondary }, selected && styles.noteChipTextSelected]}>
          {nota}
        </Text>
      </TouchableOpacity>
    );
  };

  // pH Input renderı
  const renderPHInput = () => {
    const phValue = parseFloat(phInput);
    const isValid = !isNaN(phValue) && phValue >= 3.0 && phValue <= 8.0;
    
    let phCategory = '';
    let phColor = colors.textMuted;
    
    if (isValid) {
      if (phValue < 5.0) {
        phCategory = 'Asidik - Narenciye notaları sizde parlak açılır';
        phColor = '#FF9800';
      } else if (phValue > 6.0) {
        phCategory = 'Bazik - Alt notalar sizde baskın olur';
        phColor = '#9C27B0';
      } else {
        phCategory = 'Normal - Dengeli koku performansı';
        phColor = '#4CAF50';
      }
    }

    return (
      <View style={styles.phInputContainer}>
        <View style={styles.phInputWrapper}>
          <TextInput
            style={[styles.phInput, { backgroundColor: colors.card, borderColor: colors.tint, color: colors.text }]}
            value={phInput}
            onChangeText={handlePHInput}
            placeholder="5.5"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            maxLength={4}
          />
          <Text style={[styles.phUnit, { color: colors.textSecondary }]}>pH</Text>
        </View>
        
        {phInput.length > 0 && (
          <View style={styles.phFeedback}>
            {isValid ? (
              <>
                <View style={[styles.phIndicator, { backgroundColor: phColor }]} />
                <Text style={[styles.phCategory, { color: phColor }]}>{phCategory}</Text>
              </>
            ) : (
              <Text style={[styles.phError, { color: colors.error }]}>pH değeri 3.0 - 8.0 arasında olmalıdır</Text>
            )}
          </View>
        )}

        <View style={styles.phScale}>
          <Text style={[styles.phScaleLabel, { color: colors.textSecondary }]}>3.0</Text>
          <View style={styles.phScaleBar}>
            <View style={[styles.phScaleSection, { backgroundColor: '#FF9800', flex: 2 }]} />
            <View style={[styles.phScaleSection, { backgroundColor: '#4CAF50', flex: 1 }]} />
            <View style={[styles.phScaleSection, { backgroundColor: '#9C27B0', flex: 2 }]} />
          </View>
          <Text style={[styles.phScaleLabel, { color: colors.textSecondary }]}>8.0</Text>
        </View>
        <View style={styles.phScaleLegend}>
          <Text style={[styles.phScaleLegendText, { color: '#FF9800' }]}>Asidik</Text>
          <Text style={[styles.phScaleLegendText, { color: '#4CAF50' }]}>Normal</Text>
          <Text style={[styles.phScaleLegendText, { color: '#9C27B0' }]}>Bazik</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        {currentStep > 0 && (
          <TouchableOpacity onPress={handleBack} style={[styles.backButton, { backgroundColor: colors.card }, shadows.sm]}>
            <Ionicons name="chevron-back" size={28} color={colors.tint} />
          </TouchableOpacity>
        )}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.tint }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {currentStep + 1} / {visibleSteps.length}
          </Text>
        </View>
      </View>

      {/* Content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          }
        ]}
      >
        {/* Kategori Badge */}
        <View style={[styles.categoryBadge, { backgroundColor: colors.tint + '20' }]}>
          <Text style={[styles.categoryText, { color: colors.tint }]}>{currentStepData.kategori}</Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>{currentStepData.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{currentStepData.subtitle}</Text>

        {/* Options */}
        <ScrollView 
          style={styles.optionsContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.optionsContent}
        >
          {currentStepData.type === 'ph-input' ? (
            renderPHInput()
          ) : currentStepData.type === 'multi-select-notes' ? (
            <View style={styles.notesContainer}>
              {currentStepData.noteOptions?.map(renderNoteOption)}
            </View>
          ) : (
            currentStepData.options?.map(renderOption)
          )}
        </ScrollView>
      </Animated.View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, borderTopColor: colors.border, backgroundColor: colors.card }]}>
        {canSkip() && (
          <TouchableOpacity onPress={handleNext} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Atla</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: colors.tint },
            shadows.md,
            !canProceed() && { backgroundColor: colors.border },
          ]}
          onPress={handleNext}
          disabled={!canProceed()}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === visibleSteps.length - 1 ? 'Önerileri Gör' : 'Devam'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  progressBar: {
    height: 6,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  optionsContainer: {
    flex: 1,
  },
  optionsContent: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
  },
  notesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  noteChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  noteChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noteChipTextSelected: {
    color: '#FFF',
  },
  phInputContainer: {
    alignItems: 'center',
    gap: Spacing.xl,
  },
  phInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  phInput: {
    width: 120,
    height: 80,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
  },
  phUnit: {
    fontSize: 24,
    fontWeight: '700',
  },
  phFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  phIndicator: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
  },
  phCategory: {
    fontSize: 14,
    fontWeight: '500',
  },
  phError: {
    fontSize: 14,
    fontWeight: '500',
  },
  phScale: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: Spacing.sm,
  },
  phScaleLabel: {
    fontSize: 12,
    fontWeight: '500',
    width: 30,
    textAlign: 'center',
  },
  phScaleBar: {
    flex: 1,
    height: 8,
    flexDirection: 'row',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  phScaleSection: {
    height: '100%',
  },
  phScaleLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  phScaleLegendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
  },
  skipButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
