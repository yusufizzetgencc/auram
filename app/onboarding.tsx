/**
 * Auram - Premium Onboarding Screen
 * Kapsamlı Kişiselleştirme + pH Hesaplama
 * Elegant Mor/Fuşya Teması
 */

import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { hesaplaPHPure } from '@/engine';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
    OnboardingStep,
    PHBilgiDurumu,
    UserPreferences
} from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Pressable,
} from 'react-native';
import { hapticLight, hapticMedium } from '@/utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// ============ KAPSAMLI ONBOARDING ADIMLARI ============
const onboardingSteps: OnboardingStep[] = [
  // ========== BÖLÜM 1: BİYOLOJİK İMZA VE pH ANALİZİ ==========
  {
    id: 'cilt_tipi',
    kategori: 'Biyolojik İmza',
    title: 'Cilt Yapınız Genellikle Nasıldır?',
    subtitle: 'Parfümün kalıcılığını belirler (Kalıcılık Çarpanı)',
    type: 'single',
    field: 'ciltTipi',
    options: [
      { id: 'kuru', title: 'Kuru', subtitle: 'Parfümü hızlı emer, çabuk uçar', icon: 'water-outline', color: '#FF8C42', emoji: '🏜️' },
      { id: 'karma', title: 'Karma / Normal', subtitle: 'Dengeli tutuş sağlar', icon: 'git-merge-outline', color: '#2ECC71', emoji: '✋' },
      { id: 'yagli', title: 'Yağlı', subtitle: 'Kokuyu uzun süre hapseder', icon: 'water', color: '#00D4AA', emoji: '💧' },
    ],
  },
  {
    id: 'gumus_oksitlenme',
    kategori: 'Biyolojik İmza',
    title: 'Gümüş Takı Kullandığınızda Kararma Olur mu?',
    subtitle: 'Gizli pH Testi: Ten kimyanızı anlamamızı sağlar',
    type: 'single',
    field: 'gumusOksitlenme',
    options: [
      { id: 'asidik', title: 'Evet, çabuk kararır', subtitle: 'Asidik eğilim (Tatlılar ekşiyebilir)', icon: 'alert-circle-outline', color: '#E63946', emoji: '🔗' },
      { id: 'notr_alkali', title: 'Hayır, parlak kalır', subtitle: 'Dengeli / Alkali eğilim', icon: 'sparkles-outline', color: '#9D4EDD', emoji: '✨' },
      { id: 'emin_degil', title: 'Emin değilim / Kullanmam', subtitle: 'Diğer faktörlere bakarız', icon: 'help-circle-outline', color: '#8A7A9C', emoji: '❓' },
    ],
  },
  {
    id: 'su_tuketimi',
    kategori: 'Biyolojik İmza',
    title: 'Günlük Su Tüketiminiz Ne Seviyede?',
    subtitle: 'Su, ten pH dengesini nötrler',
    type: 'single',
    field: 'suTuketimi',
    options: [
      { id: 'az', title: 'Az', subtitle: 'Günde 1 litreden az', icon: 'water-outline', color: '#FF8C42', emoji: '💧' },
      { id: 'normal', title: 'Normal', subtitle: '1.5 - 2 litre', icon: 'water', color: '#00B4D8', emoji: '🚰' },
      { id: 'cok', title: 'Çok', subtitle: '2.5 litre ve üzeri', icon: 'pint-outline', color: '#00D4AA', emoji: '🌊' },
    ],
  },
  {
    id: 'beslenme',
    kategori: 'Biyolojik İmza',
    title: 'Beslenme Alışkanlığınızın Temeli Nedir?',
    subtitle: 'Baharat ve protein ten kokusunu değiştirir',
    type: 'single',
    field: 'beslenmeAliskanligi',
    options: [
      { id: 'asidik', title: 'Baharatlı / Kırmızı Et', subtitle: 'Asidik eğilim', icon: 'flame-outline', color: '#E63946', emoji: '🥩' },
      { id: 'notr', title: 'Karbonhidrat / Hafif', subtitle: 'Nötr eğilim', icon: 'pizza-outline', color: '#F4A261', emoji: '🥖' },
      { id: 'alkali', title: 'Sebze / Meyve', subtitle: 'Alkali eğilim', icon: 'leaf-outline', color: '#2ECC71', emoji: '🥗' },
    ],
  },
  {
    id: 'terleme',
    kategori: 'Biyolojik İmza',
    title: 'Aktivite ve Terleme Dengeniz Nasıldır?',
    subtitle: 'Ter, parfümün yapısını bozar',
    type: 'single',
    field: 'terlemeOrani',
    options: [
      { id: 'cok', title: 'Hızlı ve sık terleyen', subtitle: 'Parfüm yapısı bozulabilir', icon: 'rainy-outline', color: '#00B4D8', emoji: '💦' },
      { id: 'normal', title: 'Ortalama', subtitle: 'Fiziksel eforla terlerim', icon: 'partly-sunny-outline', color: '#FF8C42', emoji: '⛅' },
      { id: 'az', title: 'Çok nadir / Kuru', subtitle: 'Serin bir tenim var', icon: 'sunny-outline', color: '#FFE66D', emoji: '☀️' },
    ],
  },
  {
    id: 'vucut_isisi',
    kategori: 'Biyolojik İmza',
    title: 'Vücut Isınız Genellikle Nasıldır?',
    subtitle: 'Yayılım (sillage) gücünü belirler',
    type: 'single',
    field: 'vucutIsisi',
    options: [
      { id: 'sicak', title: 'Sıcak', subtitle: 'Koku hızla yayılır', icon: 'flame', color: '#E63946', emoji: '🔥' },
      { id: 'serin', title: 'Serin / Üşüyen', subtitle: 'Koku yavaş ve sakin açılır', icon: 'snow-outline', color: '#00B4D8', emoji: '❄️' },
      { id: 'dengeli', title: 'Dengeli / Değişken', subtitle: 'Ortalama yayılım', icon: 'thermometer-outline', color: '#9D4EDD', emoji: '🌡️' },
    ],
  },

  // ========== BÖLÜM 2: KOKU REAKSİYONU VE UYGULAMA ==========
  {
    id: 'parfum_reaksiyonu',
    kategori: 'Koku Reaksiyonu',
    title: 'Parfümler Günün Sonunda Teninizde Ne Olur?',
    subtitle: 'pH Doğrulama Sorusu',
    type: 'single',
    field: 'parfumReaksiyonu',
    options: [
      { id: 'tatli_pudrali', title: 'Tatlı ve pudralı olur', subtitle: 'Bazik/Alkali eğilim', icon: 'flower-outline', color: '#FFB4D1', emoji: '🌸' },
      { id: 'eksi_uzaklasir', title: 'Ekşir / Başka kokuya dönüşür', subtitle: 'Asidik eğilim', icon: 'alert-outline', color: '#E63946', emoji: '🍋' },
      { id: 'ayni_kalir', title: 'Aynı kalır, sadece hafifler', subtitle: 'Nötr eğilim', icon: 'checkmark-circle-outline', color: '#2ECC71', emoji: '⚖️' },
    ],
  },
  {
    id: 'uygulama_yeri',
    kategori: 'Koku Reaksiyonu',
    title: 'Parfümü En Çok Nereye Sıkarsınız?',
    subtitle: 'Sadece kıyafete sıkmak pH kurallarını esnetir',
    type: 'single',
    field: 'uygulamaYeri',
    options: [
      { id: 'sadece_ten', title: 'Sadece Tenime', subtitle: 'Nabız noktaları, boyun', icon: 'hand-left-outline', color: '#FF8C42', emoji: '🧴' },
      { id: 'ten_kiyafet', title: 'Tenime ve Kıyafetime', subtitle: 'Dengeli kullanım', icon: 'shirt-outline', color: '#9D4EDD', emoji: '👔' },
      { id: 'sadece_kiyafet', title: 'Sadece Kıyafetime', subtitle: 'Koku tenden bağımsızlaşır', icon: 'briefcase-outline', color: '#00D4AA', emoji: '🧥' },
    ],
  },
  {
    id: 'koku_hassasiyeti',
    kategori: 'Koku Reaksiyonu',
    title: 'Koku Hassasiyetiniz Ne Durumda?',
    subtitle: 'Yoğun kokuların sizi rahatsız edip etmeyeceği',
    type: 'single',
    field: 'kokuAlmaHassasiyeti',
    options: [
      { id: 'cok_yuksek', title: 'Çok Hassasım', subtitle: 'Ağır kokular baş ağrıtır', icon: 'alert-circle-outline', color: '#E63946', emoji: '🔴' },
      { id: 'normal', title: 'Normal', subtitle: 'Dengeli bir algım var', icon: 'checkmark-circle-outline', color: '#2ECC71', emoji: '✅' },
      { id: 'dusuk', title: 'Düşük', subtitle: 'Kendi kokumu hemen alamam', icon: 'remove-circle-outline', color: '#8A7A9C', emoji: '👃' },
    ],
  },
  {
    id: 'konsantrasyon_tercihi',
    kategori: 'Koku Reaksiyonu',
    title: 'Ne Kadar Kalıcı ve Yoğun Bir Koku İstersiniz?',
    subtitle: 'Konsantrasyon, kalıcılık ve yoğunluğu belirler',
    type: 'single',
    field: 'konsantrasyonTercihi',
    options: [
      { id: 'eau_de_toilette', title: 'Hafif ve Günlük (EDT)', subtitle: 'Ferah, 3-5 saat kalıcı', icon: 'sunny-outline', color: '#4CAF50', emoji: '🌤️' },
      { id: 'eau_de_parfum', title: 'Dengeli ve Belirgin (EDP)', subtitle: 'Orta-uzun kalıcılık, 6-8 saat', icon: 'water-outline', color: '#2196F3', emoji: '💧' },
      { id: 'parfum', title: 'Yoğun ve Çok Kalıcı (Parfum)', subtitle: 'En uzun kalıcılık, 8+ saat', icon: 'flame-outline', color: '#FF5722', emoji: '🔥' },
      { id: 'fark_etmez', title: 'Fark Etmez', subtitle: 'Konsantrasyon filtrelemesi olmasın', icon: 'infinite-outline', color: '#9E9E9E', emoji: '🔄' },
    ],
  },

  // ========== BÖLÜM 3: AURA & KARAKTER ==========
  {
    id: 'aura',
    kategori: 'Aura ve Karakter',
    title: 'Arkanızda Nasıl Bir "İz" Bırakmak İstersiniz?',
    subtitle: 'Kokunuzun yaratacağı hissiyat',
    type: 'single',
    field: 'aura',
    options: [
      { id: 'temiz', title: 'Temiz & Zarif', subtitle: 'Yeni duş almış, sabunsu', icon: 'water-outline', color: '#00B4D8', emoji: '🛁' },
      { id: 'gizemli', title: 'Gizemli & Derin', subtitle: 'Karanlık, merak uyandıran', icon: 'moon-outline', color: '#240046', emoji: '🌑' },
      { id: 'cekici', title: 'Çekici & Baştan Çıkarıcı', subtitle: 'Sıcak, tatlı, sarmalayıcı', icon: 'heart-outline', color: '#E63946', emoji: '💋' },
      { id: 'dinamik', title: 'Dinamik & Enerjik', subtitle: 'Ferah, hareketli', icon: 'flash-outline', color: '#FFE66D', emoji: '⚡' },
      { id: 'otoriter', title: 'Otoriter & Saygın', subtitle: 'Odunsu, ağırbaşlı', icon: 'briefcase-outline', color: '#8B5A2B', emoji: '🏛️' },
    ],
  },
  {
    id: 'koku_aileleri',
    kategori: 'Aura ve Karakter',
    title: 'Hangi Koku Aileleri Sizi Mutlu Eder?',
    subtitle: 'Birden fazla seçebilirsiniz (En az 1)',
    type: 'multiple',
    field: 'kokuTipleri',
    required: true,
    options: [
      { id: 'Ferah', title: 'Taze Narenciyeler', subtitle: 'Limon, Bergamot', icon: 'sunny-outline', color: '#FFE66D', emoji: '🍋' },
      { id: 'Çiçeksi', title: 'Zarif Çiçekler', subtitle: 'Yasemin, Gül', icon: 'flower-outline', color: '#FF6B9D', emoji: '🌸' },
      { id: 'Tatlı', title: 'Tatlı ve Gurme', subtitle: 'Vanilya, Karamel', icon: 'ice-cream-outline', color: '#FFB4D1', emoji: '🍰' },
      { id: 'Odunsu', title: 'Odunsu ve Reçineli', subtitle: 'Sandal, Sedir', icon: 'leaf-outline', color: '#8B5A2B', emoji: '🪵' },
      { id: 'Aquatik', title: 'Ferah ve Su', subtitle: 'Okyanus, Yağmur', icon: 'boat-outline', color: '#00B4D8', emoji: '🌊' },
      { id: 'Baharatlı', title: 'Baharatlı ve Oryantal', subtitle: 'Tarçın, Biber', icon: 'flame-outline', color: '#E63946', emoji: '🌶️' },
    ],
  },
  {
    id: 'kacinilacak_notalar',
    kategori: 'Aura ve Karakter',
    title: '"Kesinlikle Olmasın" Dediğiniz Notalar?',
    subtitle: 'Sizi rahatsız eden özellikler (Opsiyonel)',
    type: 'multiple',
    field: 'kacinilacakNotalar',
    options: [
      { id: 'Aşırı şekerli', title: 'Aşırı Şekerli', subtitle: 'Bayıcı tatlılık', icon: 'close-circle-outline', color: '#FFB4D1', emoji: '🍬' },
      { id: 'Baskın çiçek', title: 'Baskın Çiçek', subtitle: 'Yoğun çiçeksi kokular', icon: 'close-circle-outline', color: '#FF6B9D', emoji: '💐' },
      { id: 'Deri veya tütün', title: 'Deri, Tütün veya İs', subtitle: 'Karanlık/Ağır notalar', icon: 'close-circle-outline', color: '#5A189A', emoji: '🚬' },
      { id: 'Ağır hayvansi misk', title: 'Ağır/Hayvansi Misk', subtitle: 'Yoğun, deri gibi hissettiren misk notaları', icon: 'close-circle-outline', color: '#8B4513', emoji: '🦫' },
      { id: 'Yoğun baharat', title: 'Yoğun Baharat', subtitle: 'Keskin tarçın, karanfil, biber ağırlıklı notalar', icon: 'close-circle-outline', color: '#D2691E', emoji: '🌶️' },
      { id: 'Odunsu dumanlı', title: 'Odunsu/Dumanlı', subtitle: 'Toz gibi, kuru, dumanlı ağaç notaları', icon: 'close-circle-outline', color: '#696969', emoji: '🪵' },
    ],
  },
  {
    id: 'cinsiyet_algisi',
    kategori: 'Aura ve Karakter',
    title: 'Parfümünüzün Cinsiyet Algısı Önemli mi?',
    subtitle: 'Parfümün duruşu',
    type: 'single',
    field: 'cinsiyetAlgisi',
    options: [
      { id: 'feminen', title: 'Feminen', subtitle: 'Kadınsı bir karakter', icon: 'woman-outline', color: '#FF6B9D', emoji: '💃' },
      { id: 'maskulen', title: 'Maskülen', subtitle: 'Erkeksi bir duruş', icon: 'man-outline', color: '#00B4D8', emoji: '🕴️' },
      { id: 'unisex', title: 'Cinsiyetsiz (Unisex)', subtitle: 'Karaktere odaklı', icon: 'people-outline', color: '#9D4EDD', emoji: '👥' },
    ],
  },

  // ========== BÖLÜM 4: YAŞAM DİNAMİKLERİ ==========
  {
    id: 'yasam_ortami',
    kategori: 'Yaşam Dinamikleri',
    title: 'Yaşamınızın Büyük Kısmı Nerede Geçiyor?',
    subtitle: 'Ortama uygun yoğunluk ve form',
    type: 'single',
    field: 'ortam',
    options: [
      { id: 'kapali', title: 'Kapalı / Ofis / Ev', subtitle: 'Nazik, boğmayan kokular', icon: 'home-outline', color: '#8B5A2B', emoji: '🏢' },
      { id: 'acik', title: 'Açık / Saha', subtitle: 'Güçlü, uçup gitmeyen kokular', icon: 'leaf-outline', color: '#2ECC71', emoji: '🏞️' },
      { id: 'her_ikisi', title: 'Yarı Açık, Dengeli', subtitle: 'Değişken ortamlar', icon: 'globe-outline', color: '#00D4AA', emoji: '🌤️' },
    ],
  },
  {
    id: 'giyim_tarzi',
    kategori: 'Yaşam Dinamikleri',
    title: 'Giyim Tarzınızı En İyi Hangisi Özetler?',
    subtitle: 'Tarzınıza uygun tamamlayıcı koku',
    type: 'single',
    field: 'kiyafetStili',
    options: [
      { id: 'minimalist', title: 'Minimalist / Rahat', subtitle: 'Basic parçalar, jean', icon: 'shirt-outline', color: '#8A7A9C', emoji: '👕' },
      { id: 'formal', title: 'Şık / Resmi', subtitle: 'Takım elbise, ofis şıklığı', icon: 'briefcase-outline', color: '#5A189A', emoji: '👔' },
      { id: 'trendy', title: 'Trendy / İddialı', subtitle: 'Modayı takip eden', icon: 'sparkles-outline', color: '#FF6B9D', emoji: '✨' },
      { id: 'sportif', title: 'Sportif / Aktif', subtitle: 'Eşofman, rahat giyim', icon: 'fitness-outline', color: '#2ECC71', emoji: '👟' },
    ],
  },
  {
    id: 'mevsim_tercihi',
    kategori: 'Yaşam Dinamikleri',
    title: 'Bu Öneriyi Hangi Mevsim İçin İstiyorsunuz?',
    subtitle: 'Parfümün mevsimsel uyumunu belirler',
    type: 'single',
    field: 'mevsim',
    options: [
      { id: 'İlkbahar', title: 'İlkbahar', subtitle: 'Ilıman, çiçek açan günler', icon: 'flower-outline', color: '#FFB6C1', emoji: '🌷' },
      { id: 'Yaz', title: 'Yaz', subtitle: 'Sıcak ve açık hava günleri', icon: 'sunny-outline', color: '#FFD700', emoji: '☀️' },
      { id: 'Sonbahar', title: 'Sonbahar', subtitle: 'Serinleyen, yumuşak günler', icon: 'leaf-outline', color: '#D2691E', emoji: '🍂' },
      { id: 'Kış', title: 'Kış', subtitle: 'Soğuk ve kapalı mekan günleri', icon: 'snow-outline', color: '#87CEFA', emoji: '❄️' },
      { id: 'Tüm Mevsimler', title: 'Fark Etmez / Tüm Yıl', subtitle: 'Mevsim filtrelemesi olmasın', icon: 'infinite-outline', color: '#9370DB', emoji: '🔄' },
    ],
  },
  {
    id: 'kullanim_amaci',
    kategori: 'Yaşam Dinamikleri',
    title: 'Bu Parfümü En Çok Ne İçin Kullanacaksınız?',
    subtitle: 'Birden fazla seçebilirsiniz',
    type: 'multiple',
    field: 'kullanimAmaci',
    options: [
      { id: 'gunluk', title: 'Günlük Kullanım', subtitle: 'Her gün rahatça', icon: 'sunny-outline', color: '#4CAF50', emoji: '☀️' },
      { id: 'is', title: 'İş / Ofis', subtitle: 'Profesyonel ortamlar', icon: 'briefcase-outline', color: '#607D8B', emoji: '💼' },
      { id: 'aksam', title: 'Akşam Kullanımı', subtitle: 'Akşam etkinlikleri', icon: 'moon-outline', color: '#3F51B5', emoji: '🌙' },
      { id: 'ozel', title: 'Özel Günler', subtitle: 'Davetler, kutlamalar', icon: 'sparkles-outline', color: '#FFC107', emoji: '✨' },
      { id: 'romantik', title: 'Romantik Anlar', subtitle: 'Özel buluşmalar', icon: 'heart-outline', color: '#E91E63', emoji: '💕' },
      { id: 'spor', title: 'Spor / Aktif Yaşam', subtitle: 'Hareketli günler', icon: 'fitness-outline', color: '#FF9800', emoji: '🏃' },
    ],
  }
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
  const [showPHTooltip, setShowPHTooltip] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const getVisibleSteps = () => {
    return onboardingSteps;
  };

  const visibleSteps = getVisibleSteps();
  const currentStepData = visibleSteps[currentStep];
  const progress = ((currentStep + 1) / visibleSteps.length) * 100;
  
  // Canlı pH hesaplama (Preferences değiştikçe güncellenir)
  const livePHData = useMemo(() => hesaplaPHPure(preferences), [preferences]);

  // Progress bar animasyonu
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Adım değişim animasyonu
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
    hapticLight();
    if (currentStepData.id === 'ph_bilgi') {
      setPHBilgiDurumu(value as PHBilgiDurumu);
    } else {
      setPreference(currentStepData.field as keyof UserPreferences, value as any);
    }
  };

  const handleMultiSelect = (value: string) => {
    hapticLight();
    toggleArrayPreference(currentStepData.field as keyof UserPreferences, value);
  };

  const handlePHInput = (text: string) => {
    const cleanText = text.replace(/[^0-9.]/g, '');
    setPHInput(cleanText);
    
    const phValue = parseFloat(cleanText);
    if (!isNaN(phValue) && phValue >= 3.0 && phValue <= 8.0) {
      setKullaniciPH(phValue);
    }
  };

  // İleri git
  const handleNext = () => {
    hapticMedium();
    if (currentStep < visibleSteps.length - 1) {
      animateTransition(1, () => setCurrentStep(currentStep + 1));
    } else {
      hesaplaPH();
      getRecommendations();
      setIsOnboardingComplete(true);
      router.replace('/ad-loading');
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
    // Opsiyonel çoklu seçim adımlarında her zaman "Şimdilik atla" butonu görünsün
    if (currentStepData.type === 'multiple' && currentStepData.required !== true) return true;
    return false;
  };

  // İlerleme kontrolü
  const canProceed = () => {
    switch (currentStepData.type) {
      case 'single':
        return preferences[currentStepData.field as keyof UserPreferences] !== null && preferences[currentStepData.field as keyof UserPreferences] !== undefined;
      case 'multiple':
        if (currentStepData.required === true) {
          const arr = preferences[currentStepData.field as keyof UserPreferences] as string[];
          return arr && arr.length > 0;
        }
        return true;
      case 'ph-input':
        const ph = parseFloat(phInput);
        return !isNaN(ph) && ph >= 3.0 && ph <= 8.0;
      default:
        return true;
    }
  };

  // Seçili mi kontrolü
  const isSelected = (optionId: string) => {
    const value = preferences[currentStepData.field as keyof UserPreferences];
    if (Array.isArray(value)) {
      return (value as string[]).includes(optionId);
    }
    return value === optionId;
  };

  // Seçenek kartı renderı
  const renderOption = (option: NonNullable<OnboardingStep['options']>[0], index: number) => {
    const selected = isSelected(option.id);
    const isMultiple = currentStepData.type === 'multiple' || currentStepData.type === 'multi-select';

    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.optionCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          shadows.sm,
          selected && { 
            borderColor: option.color, 
            borderWidth: 2, 
            backgroundColor: `${option.color}15` 
          },
        ]}
        onPress={() => isMultiple ? handleMultiSelect(option.id) : handleSingleSelect(option.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
          {option.emoji ? (
            <Text style={styles.optionEmoji}>{option.emoji}</Text>
          ) : (
            <Ionicons name={option.icon as any} size={24} color="#FFF" />
          )}
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
          {option.subtitle && (
            <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>{option.subtitle}</Text>
          )}
        </View>
        {selected && (
          <View style={[styles.checkmark, { backgroundColor: option.color }]}>
            <Ionicons name="checkmark" size={16} color="#FFF" />
          </View>
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
        <Text style={[
          styles.noteChipText, 
          { color: colors.textSecondary }, 
          selected && styles.noteChipTextSelected
        ]}>
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
        phColor = colors.warning;
      } else if (phValue > 6.0) {
        phCategory = 'Bazik - Alt notalar sizde baskın olur';
        phColor = colors.primary;
      } else {
        phCategory = 'Normal - Dengeli koku performansı';
        phColor = colors.success;
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
            <View style={[styles.phScaleSection, { backgroundColor: colors.warning, flex: 2 }]} />
            <View style={[styles.phScaleSection, { backgroundColor: colors.success, flex: 1 }]} />
            <View style={[styles.phScaleSection, { backgroundColor: colors.primary, flex: 2 }]} />
          </View>
          <Text style={[styles.phScaleLabel, { color: colors.textSecondary }]}>8.0</Text>
        </View>
        <View style={styles.phScaleLegend}>
          <Text style={[styles.phScaleLegendText, { color: colors.warning }]}>Asidik</Text>
          <Text style={[styles.phScaleLegendText, { color: colors.success }]}>Normal</Text>
          <Text style={[styles.phScaleLegendText, { color: colors.primary }]}>Bazik</Text>
        </View>
      </View>
    );
  };

  // Kategori badge rengi
  const getCategoryColor = (kategori: string) => {
    const categoryColors: Record<string, string> = {
      'Biyolojik İmza': colors.success,
      'Koku Reaksiyonu': colors.accent,
      'Aura ve Karakter': colors.primary,
      'Yaşam Dinamikleri': colors.warning,
    };
    return categoryColors[kategori] || colors.tint;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Gradient Background */}
      <LinearGradient
        colors={colors.gradient}
        style={StyleSheet.absoluteFill}
      />

      {/* Header Container */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + Spacing.sm }]}>
        
        {/* Top Row: Back Button, Step Indicator, pH Badge */}
        <View style={styles.headerTopRow}>
          {/* Back Button Placeholder or Button */}
          {currentStep > 0 ? (
            <TouchableOpacity 
              onPress={handleBack} 
              style={[styles.backButton, { backgroundColor: colors.card }, shadows.sm]}
            >
              <Ionicons name="chevron-back" size={20} color={colors.tint} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40, height: 40 }} />
          )}

          {/* Center Indicator */}
          <View style={styles.centerIndicator}>
            <Text style={[styles.centerIndicatorText, { color: getCategoryColor(currentStepData.kategori) }]}>
              {currentStepData.kategori} <Text style={{ color: colors.textSecondary }}>· {currentStep + 1}/{visibleSteps.length}</Text>
            </Text>
          </View>

          {/* Minimal pH Badge */}
          <View style={{ position: 'relative', zIndex: 10 }}>
            <Pressable 
              onPress={() => setShowPHTooltip(!showPHTooltip)}
              style={[styles.minimalPHBadge, { 
                backgroundColor: colors.card, 
                borderColor: livePHData.tahminiPH < 5 ? colors.error : livePHData.tahminiPH > 6 ? colors.primary : colors.success 
              }]}
            >
              <Text style={[styles.minimalPHLabel, { color: colors.textSecondary }]}>pH</Text>
              <Text style={[styles.minimalPHValue, { color: livePHData.tahminiPH < 5 ? colors.error : livePHData.tahminiPH > 6 ? colors.primary : colors.success }]}>
                {livePHData.tahminiPH.toFixed(1)} <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textSecondary }}>(%{Math.max(0, Math.min(100, livePHData.guvenilirlik))})</Text>
              </Text>
            </Pressable>

            {/* Tooltip Overlay */}
            {showPHTooltip && (
              <View style={[styles.phTooltip, { backgroundColor: colors.card, borderColor: colors.border }, shadows.md]}>
                <View style={[styles.phTooltipArrow, { borderBottomColor: colors.card }]} />
                <Text style={[styles.phTooltipTitle, { color: colors.text }]}>pH Güvenilirliği: %{Math.max(0, Math.min(100, livePHData.guvenilirlik))}</Text>
                <Text style={[styles.phTooltipDesc, { color: colors.textSecondary }]}>
                  {livePHData.aciklama || 'Seçimlerinize göre tahmini cilt pH değeriniz.'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Row: Progress Bar */}
        <View style={[styles.progressBarFull, { backgroundColor: colors.border }]}>
          <Animated.View 
            style={[
              styles.progressFillFull, 
              { 
                backgroundColor: colors.tint,
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              }
            ]} 
          />
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
        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>{currentStepData.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{currentStepData.subtitle}</Text>

        {/* Help Text */}
        {currentStepData.helpText && (
          <View style={[styles.helpBox, { backgroundColor: colors.tint + '10' }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.tint} />
            <Text style={[styles.helpText, { color: colors.tint }]}>{currentStepData.helpText}</Text>
          </View>
        )}

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
            currentStepData.options?.map((option, index) => renderOption(option, index))
          )}
        </ScrollView>
      </Animated.View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {canSkip() ? (
          <TouchableOpacity 
            onPress={handleNext} 
            style={[styles.skipButton, { borderColor: colors.border, borderWidth: 1, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginRight: 'auto' }]}
          >
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Şimdilik atla</Text>
            <Ionicons name="play-skip-forward-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            shadows.md,
            !canProceed() && { opacity: 0.5 },
          ]}
          onPress={handleNext}
          disabled={!canProceed()}
        >
          <LinearGradient
            colors={canProceed() ? [colors.primary, colors.accent] : [colors.border, colors.border]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === visibleSteps.length - 1 ? 'Önerileri Gör' : 'Devam'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerIndicator: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIndicatorText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  minimalPHBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  minimalPHLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  minimalPHValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  phTooltip: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 12,
    width: 220,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  phTooltipArrow: {
    position: 'absolute',
    top: -8,
    right: 18,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  phTooltipTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  phTooltipDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  progressBarFull: {
    height: 4,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    width: '100%',
  },
  progressFillFull: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  livePHLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  livePHValue: {
    fontSize: 14,
    fontWeight: '800',
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
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
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
  optionEmoji: {
    fontSize: 24,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '600',
  },
  nextButton: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
