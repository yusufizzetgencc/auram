/**
 * AROMIXEN - Premium Onboarding Screen
 * Kapsamlı Kişiselleştirme + pH Hesaplama
 * Elegant Mor/Fuşya Teması
 */

import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
    OnboardingStep,
    PHBilgiDurumu,
    UserPreferences
} from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// ============ KAPSAMLI ONBOARDING ADIMLARI ============
const onboardingSteps: OnboardingStep[] = [
  // ========== BÖLÜM 1: KİŞİSEL BİLGİLER ==========
  {
    id: 'yas_grubu',
    kategori: 'Kişisel Bilgiler',
    title: 'Yaş Grubunuz Nedir?',
    subtitle: 'Yaşınıza uygun koku profilleri önerilir',
    type: 'single',
    field: 'yasGrubu',
    options: [
      { id: '18-24', title: '18-24', subtitle: 'Genç ve dinamik', icon: 'sparkles-outline', color: '#FF6B9D', emoji: '✨' },
      { id: '25-34', title: '25-34', subtitle: 'Enerjik ve modern', icon: 'flash-outline', color: '#00D4AA', emoji: '⚡' },
      { id: '35-44', title: '35-44', subtitle: 'Olgun ve sofistike', icon: 'diamond-outline', color: '#9D4EDD', emoji: '💎' },
      { id: '45-54', title: '45-54', subtitle: 'Deneyimli ve zarif', icon: 'star-outline', color: '#FF8C42', emoji: '⭐' },
      { id: '55+', title: '55+', subtitle: 'Klasik ve zamansız', icon: 'ribbon-outline', color: '#C9A227', emoji: '👑' },
    ],
  },
  {
    id: 'kisilik_tipi',
    kategori: 'Kişisel Bilgiler',
    title: 'Kendinizi Nasıl Tanımlarsınız?',
    subtitle: 'Kişiliğinize uygun kokular önerilir',
    type: 'single',
    field: 'kisilikTipi',
    options: [
      { id: 'romantik', title: 'Romantik', subtitle: 'Duygusal ve hassas', icon: 'heart-outline', color: '#FF6B9D', emoji: '💕' },
      { id: 'dinamik', title: 'Dinamik', subtitle: 'Enerjik ve aktif', icon: 'flash-outline', color: '#00D4AA', emoji: '🚀' },
      { id: 'sofistike', title: 'Sofistike', subtitle: 'Zarif ve seçici', icon: 'diamond-outline', color: '#9D4EDD', emoji: '💎' },
      { id: 'dogal', title: 'Doğal', subtitle: 'Sade ve samimi', icon: 'leaf-outline', color: '#2ECC71', emoji: '🌿' },
      { id: 'cesur', title: 'Cesur', subtitle: 'Göze çarpan ve güçlü', icon: 'flame-outline', color: '#E63946', emoji: '🔥' },
      { id: 'mistik', title: 'Mistik', subtitle: 'Gizemli ve derin', icon: 'moon-outline', color: '#5A189A', emoji: '🌙' },
    ],
  },

  // ========== BÖLÜM 2: PARFÜM DENEYİMİ ==========
  {
    id: 'deneyim_seviyesi',
    kategori: 'Parfüm Deneyimi',
    title: 'Parfüm Deneyiminiz Ne Düzeyde?',
    subtitle: 'Size uygun karmaşıklıkta kokular önerilir',
    type: 'single',
    field: 'deneyimSeviyesi',
    options: [
      { id: 'yeni_baslayan', title: 'Yeni Başlayan', subtitle: 'Parfüm dünyasını keşfediyorum', icon: 'bulb-outline', color: '#00D4AA', emoji: '🌱' },
      { id: 'orta', title: 'Orta Seviye', subtitle: 'Birkaç parfüm denedim', icon: 'trending-up-outline', color: '#FF8C42', emoji: '📈' },
      { id: 'uzman', title: 'Uzman', subtitle: 'Notaları ayırt edebiliyorum', icon: 'eye-outline', color: '#9D4EDD', emoji: '👁️' },
      { id: 'koleksiyoner', title: 'Koleksiyoner', subtitle: 'Geniş bir koleksiyonum var', icon: 'library-outline', color: '#C9A227', emoji: '📚' },
    ],
  },
  {
    id: 'kullanim_sikligi',
    kategori: 'Parfüm Deneyimi',
    title: 'Ne Sıklıkla Parfüm Kullanırsınız?',
    subtitle: 'Kullanım alışkanlığınıza göre öneriler',
    type: 'single',
    field: 'kullanimSikligi',
    options: [
      { id: 'nadir', title: 'Nadir', subtitle: 'Sadece özel günlerde', icon: 'calendar-outline', color: '#8A7A9C', emoji: '📅' },
      { id: 'haftada_1_2', title: 'Haftada 1-2', subtitle: 'Belirli günlerde', icon: 'time-outline', color: '#00D4AA', emoji: '⏰' },
      { id: 'gunluk', title: 'Her Gün', subtitle: 'Günlük ritüelim', icon: 'sunny-outline', color: '#FF8C42', emoji: '☀️' },
      { id: 'gunde_birden_fazla', title: 'Günde Birden Fazla', subtitle: 'Farklı anlar için farklı kokular', icon: 'layers-outline', color: '#9D4EDD', emoji: '✨' },
    ],
  },

  // ========== BÖLÜM 3: BÜTÇE VE TERCİHLER ==========
  {
    id: 'butce',
    kategori: 'Bütçe & Tercihler',
    title: 'Parfüm Bütçeniz Nedir?',
    subtitle: 'Fiyat aralığınıza uygun öneriler',
    type: 'single',
    field: 'butce',
    options: [
      { id: 'ekonomik', title: 'Ekonomik', subtitle: '₺500 altı', icon: 'wallet-outline', color: '#2ECC71', emoji: '💰' },
      { id: 'orta', title: 'Orta Segment', subtitle: '₺500 - ₺1500', icon: 'cash-outline', color: '#00D4AA', emoji: '💵' },
      { id: 'premium', title: 'Premium', subtitle: '₺1500 - ₺4000', icon: 'diamond-outline', color: '#9D4EDD', emoji: '💎' },
      { id: 'luks', title: 'Lüks', subtitle: '₺4000 üzeri', icon: 'trophy-outline', color: '#C9A227', emoji: '👑' },
    ],
  },
  {
    id: 'marka_tercihi',
    kategori: 'Bütçe & Tercihler',
    title: 'Marka Tercihiniz Var mı?',
    subtitle: 'Niche vs Designer parfümler',
    type: 'single',
    field: 'markaTercihi',
    options: [
      { id: 'niche', title: 'Niche/Butik', subtitle: 'Özel, az bilinen markalar', icon: 'sparkles-outline', color: '#9D4EDD', emoji: '✨' },
      { id: 'designer', title: 'Designer', subtitle: 'Tanınmış moda markaları', icon: 'shirt-outline', color: '#FF6B9D', emoji: '👔' },
      { id: 'farketmez', title: 'Farketmez', subtitle: 'Koku önemli, marka değil', icon: 'infinite-outline', color: '#00D4AA', emoji: '♾️' },
    ],
  },
  {
    id: 'konsantrasyon',
    kategori: 'Bütçe & Tercihler',
    title: 'Parfüm Konsantrasyonu Tercihiniz?',
    subtitle: 'Kalıcılık ve yoğunluğu etkiler',
    type: 'single',
    field: 'konsantrasyonTercihi',
    helpText: 'Konsantrasyon arttıkça kalıcılık ve yoğunluk artar',
    options: [
      { id: 'eau_fraiche', title: 'Eau Fraîche', subtitle: '1-3% yağ, 1-2 saat', icon: 'water-outline', color: '#00B4D8', emoji: '💧' },
      { id: 'eau_de_cologne', title: 'Eau de Cologne', subtitle: '2-4% yağ, 2-3 saat', icon: 'rainy-outline', color: '#00D4AA', emoji: '🌊' },
      { id: 'eau_de_toilette', title: 'Eau de Toilette', subtitle: '5-15% yağ, 3-4 saat', icon: 'flower-outline', color: '#FF6B9D', emoji: '🌸' },
      { id: 'eau_de_parfum', title: 'Eau de Parfum', subtitle: '15-20% yağ, 5-8 saat', icon: 'sparkles-outline', color: '#9D4EDD', emoji: '✨' },
      { id: 'parfum', title: 'Extrait/Parfum', subtitle: '20-40% yağ, 8+ saat', icon: 'diamond-outline', color: '#C9A227', emoji: '💎' },
    ],
  },

  // ========== BÖLÜM 4: CİLT PH ==========
  {
    id: 'ph_bilgi',
    kategori: 'Cilt pH',
    title: 'Cilt pH Değerinizi Biliyor musunuz?',
    subtitle: 'pH değeri parfümün cildinizde nasıl kokacağını belirler',
    type: 'single',
    field: 'phInfo',
    options: [
      { id: 'biliyorum', title: 'Evet, Biliyorum', subtitle: 'pH değerimi gireceğim', icon: 'checkmark-circle-outline', color: '#2ECC71', emoji: '✅' },
      { id: 'bilmiyorum', title: 'Hayır, Bilmiyorum', subtitle: 'Benim için hesaplayın', icon: 'calculator-outline', color: '#9D4EDD', emoji: '🧮' },
    ],
  },
  {
    id: 'ph_deger',
    kategori: 'Cilt pH',
    title: 'pH Değerinizi Girin',
    subtitle: 'Normal cilt pH değeri 4.5 - 6.5 arasındadır',
    type: 'ph-input',
    field: 'phDeger',
  },

  // ========== BÖLÜM 5: FİZİKSEL ÖZELLİKLER ==========
  {
    id: 'cilt_tipi',
    kategori: 'Fiziksel Özellikler',
    title: 'Cilt Tipiniz Nedir?',
    subtitle: 'Cilt tipiniz parfümün kalıcılığını doğrudan etkiler',
    type: 'single',
    field: 'ciltTipi',
    options: [
      { id: 'normal', title: 'Normal', subtitle: 'Dengeli nem, koku iyi kalır', icon: 'hand-left-outline', color: '#2ECC71', emoji: '✋' },
      { id: 'kuru', title: 'Kuru', subtitle: 'Koku hızlı uçabilir, nemlendirici kullanın', icon: 'water-outline', color: '#FF8C42', emoji: '🏜️' },
      { id: 'yagli', title: 'Yağlı', subtitle: 'Koku çok uzun kalır', icon: 'water', color: '#00D4AA', emoji: '💧' },
      { id: 'karma', title: 'Karma', subtitle: 'Bölgesel farklılıklar var', icon: 'git-merge-outline', color: '#9D4EDD', emoji: '🔀' },
    ],
  },
  {
    id: 'terleme',
    kategori: 'Fiziksel Özellikler',
    title: 'Günlük Terleme Oranınız?',
    subtitle: 'Terleme, üst notaların uçma hızını etkiler',
    type: 'single',
    field: 'terlemeOrani',
    options: [
      { id: 'az', title: 'Az', subtitle: 'Nadiren terlerim', icon: 'sunny-outline', color: '#FFE66D', emoji: '☀️' },
      { id: 'normal', title: 'Normal', subtitle: 'Ortalama terleme', icon: 'partly-sunny-outline', color: '#FF8C42', emoji: '⛅' },
      { id: 'cok', title: 'Çok', subtitle: 'Sık terlerim', icon: 'rainy-outline', color: '#00B4D8', emoji: '💦' },
    ],
  },
  {
    id: 'hassasiyet',
    kategori: 'Fiziksel Özellikler',
    title: 'Cildiniz Hassas mı?',
    subtitle: 'Hassas cilt bazı notalarla uyumsuz olabilir',
    type: 'single',
    field: 'ciltHassasiyeti',
    options: [
      { id: 'hassas', title: 'Hassas', subtitle: 'Kolayca tahriş olur', icon: 'alert-circle-outline', color: '#E63946', emoji: '⚠️' },
      { id: 'normal', title: 'Normal', subtitle: 'Genelde sorun yok', icon: 'checkmark-circle-outline', color: '#2ECC71', emoji: '✅' },
      { id: 'dayanikli', title: 'Dayanıklı', subtitle: 'Hiçbir şey etkilemez', icon: 'shield-checkmark-outline', color: '#00D4AA', emoji: '🛡️' },
    ],
  },
  {
    id: 'koku_alma',
    kategori: 'Fiziksel Özellikler',
    title: 'Koku Alma Hassasiyetiniz?',
    subtitle: 'Çok hassas burunlar yoğun kokulardan rahatsız olabilir',
    type: 'single',
    field: 'kokuAlmaHassasiyeti',
    options: [
      { id: 'dusuk', title: 'Düşük', subtitle: 'Kokuları zor algılarım', icon: 'remove-circle-outline', color: '#8A7A9C', emoji: '👃' },
      { id: 'normal', title: 'Normal', subtitle: 'Standart koku algısı', icon: 'checkmark-circle-outline', color: '#2ECC71', emoji: '✅' },
      { id: 'yuksek', title: 'Yüksek', subtitle: 'İnce nüansları fark ederim', icon: 'eye-outline', color: '#9D4EDD', emoji: '👁️' },
      { id: 'cok_yuksek', title: 'Çok Yüksek', subtitle: 'Aşırı hassasım', icon: 'alert-outline', color: '#E63946', emoji: '🔴' },
    ],
  },
  {
    id: 'alerji',
    kategori: 'Fiziksel Özellikler',
    title: 'Bilinen Alerji veya Hassasiyetiniz Var mı?',
    subtitle: 'Birden fazla seçebilirsiniz',
    type: 'multi-select',
    field: 'alerjiDurumu',
    options: [
      { id: 'yok', title: 'Alerjim Yok', subtitle: 'Her türlü nota uygundur', icon: 'checkmark-circle-outline', color: '#2ECC71', emoji: '✅' },
      { id: 'alkol', title: 'Alkol', subtitle: 'Alkol bazlı parfümler', icon: 'wine-outline', color: '#E63946', emoji: '🍷' },
      { id: 'cicek', title: 'Çiçek', subtitle: 'Yoğun çiçek notaları', icon: 'flower-outline', color: '#FF6B9D', emoji: '🌸' },
      { id: 'baharat', title: 'Baharat', subtitle: 'Tarçın, karanfil vb.', icon: 'flame-outline', color: '#FF8C42', emoji: '🌶️' },
      { id: 'diger', title: 'Diğer', subtitle: 'Farklı bir hassasiyet', icon: 'help-circle-outline', color: '#8A7A9C', emoji: '❓' },
    ],
  },

  // ========== BÖLÜM 6: KOKU TERCİHLERİ ==========
  {
    id: 'koku_tipleri',
    kategori: 'Koku Tercihleri',
    title: 'Hangi Koku Tiplerini Seviyorsunuz?',
    subtitle: 'Birden fazla seçebilirsiniz (en az 1)',
    type: 'multiple',
    field: 'kokuTipleri',
    required: true,
    options: [
      { id: 'Çiçeksi', title: 'Çiçeksi', subtitle: 'Gül, yasemin, lavanta', icon: 'flower-outline', color: '#FF6B9D', emoji: '🌸' },
      { id: 'Odunsu', title: 'Odunsu', subtitle: 'Sandal, sedir, paçuli', icon: 'leaf-outline', color: '#8B5A2B', emoji: '🌲' },
      { id: 'Ferah', title: 'Ferah', subtitle: 'Narenciye, deniz, nane', icon: 'water-outline', color: '#00D4AA', emoji: '🌊' },
      { id: 'Amber', title: 'Amber', subtitle: 'Vanilya, amber, reçine', icon: 'flame-outline', color: '#FF8C42', emoji: '🔥' },
      { id: 'Baharatlı', title: 'Baharatlı', subtitle: 'Tarçın, karanfil, biber', icon: 'sparkles-outline', color: '#E63946', emoji: '🌶️' },
      { id: 'Meyvemsi', title: 'Meyvemsi', subtitle: 'Şeftali, elma, mango', icon: 'nutrition-outline', color: '#FF69B4', emoji: '🍑' },
      { id: 'Tatlı', title: 'Tatlı', subtitle: 'Karamel, çikolata', icon: 'ice-cream-outline', color: '#FFB4D1', emoji: '🍫' },
      { id: 'Yeşil', title: 'Yeşil', subtitle: 'Yeşil çay, bambu, ot', icon: 'leaf-outline', color: '#2ECC71', emoji: '🌿' },
      { id: 'Oryantal', title: 'Oryantal', subtitle: 'Oud, safran, baharat', icon: 'moon-outline', color: '#C9A227', emoji: '🌙' },
      { id: 'Aquatik', title: 'Aquatik', subtitle: 'Okyanus, yağmur', icon: 'boat-outline', color: '#00B4D8', emoji: '🌊' },
    ],
  },
  {
    id: 'yogunluk',
    kategori: 'Koku Tercihleri',
    title: 'Hangi Yoğunlukta Kokular Tercih Edersiniz?',
    subtitle: 'Parfümün güç seviyesi',
    type: 'single',
    field: 'yogunluk',
    options: [
      { id: 'hafif', title: 'Hafif', subtitle: 'Yakın mesafede hissedilir', icon: 'remove-outline', color: '#00D4AA', emoji: '🌬️' },
      { id: 'orta', title: 'Orta', subtitle: 'Dengeli yoğunluk', icon: 'reorder-two-outline', color: '#9D4EDD', emoji: '⚖️' },
      { id: 'yogun', title: 'Yoğun', subtitle: 'Uzaktan bile hissedilir', icon: 'reorder-four-outline', color: '#E63946', emoji: '💪' },
    ],
  },
  {
    id: 'izlenim',
    kategori: 'Koku Tercihleri',
    title: 'Nasıl Bir İzlenim Bırakmak İstersiniz?',
    subtitle: 'Kokunuzun yansıtmasını istediğiniz his',
    type: 'single',
    field: 'izlenimHedefi',
    options: [
      { id: 'cekici', title: 'Çekici', subtitle: 'Etkileyici ve baştan çıkarıcı', icon: 'heart-outline', color: '#E63946', emoji: '💋' },
      { id: 'profesyonel', title: 'Profesyonel', subtitle: 'Ciddi ve güvenilir', icon: 'briefcase-outline', color: '#5A189A', emoji: '💼' },
      { id: 'taze', title: 'Taze', subtitle: 'Temiz ve bakımlı', icon: 'sparkles-outline', color: '#00D4AA', emoji: '✨' },
      { id: 'gizemli', title: 'Gizemli', subtitle: 'Merak uyandıran', icon: 'moon-outline', color: '#240046', emoji: '🌙' },
      { id: 'sicak', title: 'Sıcak', subtitle: 'Samimi ve davetkar', icon: 'flame-outline', color: '#FF8C42', emoji: '🔥' },
      { id: 'enerjik', title: 'Enerjik', subtitle: 'Dinamik ve canlı', icon: 'flash-outline', color: '#FFE66D', emoji: '⚡' },
    ],
  },

  // ========== BÖLÜM 7: KULLANIM DETAYLARI ==========
  {
    id: 'cinsiyet',
    kategori: 'Kullanım Detayları',
    title: 'Parfüm Tercihiniz',
    subtitle: 'Size uygun parfüm yönlendirmesi',
    type: 'single',
    field: 'cinsiyet',
    options: [
      { id: 'erkek', title: 'Erkek', subtitle: 'Maskülen kokular', icon: 'man-outline', color: '#00B4D8', emoji: '👔' },
      { id: 'kadın', title: 'Kadın', subtitle: 'Feminen kokular', icon: 'woman-outline', color: '#FF6B9D', emoji: '👗' },
      { id: 'unisex', title: 'Unisex', subtitle: 'Cinsiyetsiz kokular', icon: 'people-outline', color: '#9D4EDD', emoji: '⚧️' },
    ],
  },
  {
    id: 'kullanim',
    kategori: 'Kullanım Detayları',
    title: 'Ne Amaçla Kullanacaksınız?',
    subtitle: 'Parfümü hangi ortamlarda kullanacaksınız',
    type: 'single',
    field: 'kullanimAmaci',
    options: [
      { id: 'gunluk', title: 'Günlük', subtitle: 'Her gün kullanım', icon: 'today-outline', color: '#00D4AA', emoji: '📅' },
      { id: 'is', title: 'İş', subtitle: 'Ofis ve profesyonel', icon: 'briefcase-outline', color: '#5A189A', emoji: '💼' },
      { id: 'aksam', title: 'Akşam/Gece', subtitle: 'Dışarı çıkma', icon: 'moon-outline', color: '#240046', emoji: '🌃' },
      { id: 'ozel', title: 'Özel Gün', subtitle: 'Kutlamalar', icon: 'star-outline', color: '#C9A227', emoji: '🎉' },
      { id: 'romantik', title: 'Romantik', subtitle: 'Sevgiliyle buluşma', icon: 'heart-outline', color: '#E63946', emoji: '❤️' },
      { id: 'spor', title: 'Spor Sonrası', subtitle: 'Aktif yaşam', icon: 'fitness-outline', color: '#2ECC71', emoji: '🏃' },
    ],
  },
  {
    id: 'gunun_saati',
    kategori: 'Kullanım Detayları',
    title: 'Günün Hangi Saatlerinde Kullanacaksınız?',
    subtitle: 'Zamana göre nota açılımları farklılık gösterir',
    type: 'single',
    field: 'gununSaati',
    options: [
      { id: 'sabah', title: 'Sabah', subtitle: '06:00 - 12:00', icon: 'sunny-outline', color: '#FFE66D', emoji: '🌅' },
      { id: 'oglen', title: 'Öğlen', subtitle: '12:00 - 17:00', icon: 'partly-sunny-outline', color: '#FF8C42', emoji: '☀️' },
      { id: 'aksam', title: 'Akşam', subtitle: '17:00 - 21:00', icon: 'moon-outline', color: '#9D4EDD', emoji: '🌆' },
      { id: 'gece', title: 'Gece', subtitle: '21:00 - 06:00', icon: 'moon', color: '#240046', emoji: '🌙' },
      { id: 'tum_gun', title: 'Tüm Gün', subtitle: 'Her saat', icon: 'time-outline', color: '#00D4AA', emoji: '⏰' },
    ],
  },

  // ========== BÖLÜM 8: ÇEVRE FAKTÖRLERİ ==========
  {
    id: 'mevsim',
    kategori: 'Çevre Faktörleri',
    title: 'Hangi Mevsimde Kullanacaksınız?',
    subtitle: 'Mevsime uygun notalar önerilir',
    type: 'single',
    field: 'mevsim',
    options: [
      { id: 'İlkbahar', title: 'İlkbahar', subtitle: 'Hafif, çiçeksi', icon: 'flower-outline', color: '#C8E6C9', emoji: '🌷' },
      { id: 'Yaz', title: 'Yaz', subtitle: 'Ferah, narenciye', icon: 'sunny-outline', color: '#FFE66D', emoji: '☀️' },
      { id: 'Sonbahar', title: 'Sonbahar', subtitle: 'Sıcak, baharatlı', icon: 'leaf-outline', color: '#FF8C42', emoji: '🍂' },
      { id: 'Kış', title: 'Kış', subtitle: 'Yoğun, odunsu', icon: 'snow-outline', color: '#B3E5FC', emoji: '❄️' },
      { id: 'Tüm Mevsimler', title: 'Tüm Mevsimler', subtitle: 'Her zaman', icon: 'infinite-outline', color: '#9D4EDD', emoji: '♾️' },
    ],
  },
  {
    id: 'iklim',
    kategori: 'Çevre Faktörleri',
    title: 'Bulunduğunuz İklim Nasıl?',
    subtitle: 'İklim koşullarına uygun koku',
    type: 'single',
    field: 'iklim',
    options: [
      { id: 'sicak', title: 'Sıcak', subtitle: '25°C üzeri', icon: 'sunny', color: '#E63946', emoji: '🔥' },
      { id: 'soguk', title: 'Soğuk', subtitle: '15°C altı', icon: 'snow', color: '#00B4D8', emoji: '❄️' },
      { id: 'nemli', title: 'Nemli', subtitle: 'Yüksek nem', icon: 'water', color: '#00D4AA', emoji: '💧' },
      { id: 'kuru', title: 'Kuru', subtitle: 'Düşük nem', icon: 'partly-sunny', color: '#FF8C42', emoji: '🏜️' },
      { id: 'iliman', title: 'Ilıman', subtitle: 'Orta sıcaklık', icon: 'cloudy-outline', color: '#9D4EDD', emoji: '🌤️' },
    ],
  },
  {
    id: 'ortam',
    kategori: 'Çevre Faktörleri',
    title: 'Genellikle Nerede Kullanırsınız?',
    subtitle: 'Kullanım alanınıza uygun parfüm',
    type: 'single',
    field: 'ortam',
    options: [
      { id: 'kapali', title: 'Kapalı Alan', subtitle: 'Ofis, ev, restoran', icon: 'home-outline', color: '#8B5A2B', emoji: '🏠' },
      { id: 'acik', title: 'Açık Alan', subtitle: 'Park, bahçe, dışarı', icon: 'leaf-outline', color: '#2ECC71', emoji: '🌳' },
      { id: 'her_ikisi', title: 'Her İkisi', subtitle: 'Hem kapalı hem açık', icon: 'globe-outline', color: '#00D4AA', emoji: '🌍' },
    ],
  },

  // ========== BÖLÜM 9: YAŞAM TARZI ==========
  {
    id: 'kiyafet',
    kategori: 'Yaşam Tarzı',
    title: 'Günlük Kıyafet Tarzınız?',
    subtitle: 'Tarzınıza uygun parfüm önerisi',
    type: 'single',
    field: 'kiyafetStili',
    options: [
      { id: 'casual', title: 'Casual', subtitle: 'Günlük rahat', icon: 'shirt-outline', color: '#00D4AA', emoji: '👕' },
      { id: 'formal', title: 'Formal', subtitle: 'Resmi ve şık', icon: 'briefcase-outline', color: '#5A189A', emoji: '👔' },
      { id: 'sportif', title: 'Sportif', subtitle: 'Aktif ve dinamik', icon: 'fitness-outline', color: '#2ECC71', emoji: '🏃' },
      { id: 'trendy', title: 'Trendy', subtitle: 'Moda takipçisi', icon: 'sparkles-outline', color: '#FF6B9D', emoji: '✨' },
      { id: 'gece', title: 'Gece/Özel', subtitle: 'Özel geceler için', icon: 'moon-outline', color: '#240046', emoji: '🌙' },
      { id: 'bohem', title: 'Bohem', subtitle: 'Özgür ve yaratıcı', icon: 'color-palette-outline', color: '#FF8C42', emoji: '🎨' },
      { id: 'minimalist', title: 'Minimalist', subtitle: 'Sade ve zarif', icon: 'remove-outline', color: '#8A7A9C', emoji: '⚪' },
    ],
  },
  {
    id: 'aktivite',
    kategori: 'Yaşam Tarzı',
    title: 'Günlük Aktivite Yoğunluğunuz?',
    subtitle: 'Rutininize uygun koku',
    type: 'single',
    field: 'aktivite',
    options: [
      { id: 'spor', title: 'Spor', subtitle: 'Aktif spor', icon: 'fitness-outline', color: '#2ECC71', emoji: '🏋️' },
      { id: 'ofis', title: 'Ofis', subtitle: 'Masa başı çalışma', icon: 'desktop-outline', color: '#5A189A', emoji: '💻' },
      { id: 'ev', title: 'Ev', subtitle: 'Ev aktiviteleri', icon: 'home-outline', color: '#8B5A2B', emoji: '🏠' },
      { id: 'sosyal', title: 'Sosyal', subtitle: 'Sosyal etkinlikler', icon: 'people-outline', color: '#FF6B9D', emoji: '👥' },
      { id: 'seyahat', title: 'Seyahat', subtitle: 'Sürekli hareket', icon: 'airplane-outline', color: '#00B4D8', emoji: '✈️' },
    ],
  },

  // ========== BÖLÜM 10: KALICILIK VE NOTALAR ==========
  {
    id: 'kalicilik',
    kategori: 'Koku Alışkanlıkları',
    title: 'Ne Kadar Kalıcılık İstersiniz?',
    subtitle: 'Parfümün cildinizde kalma süresi',
    type: 'single',
    field: 'kalicilikTercihi',
    options: [
      { id: 'kisa', title: 'Kısa (2-4 saat)', subtitle: 'Hafif ve uçucu', icon: 'time-outline', color: '#00D4AA', emoji: '⏱️' },
      { id: 'orta', title: 'Orta (4-6 saat)', subtitle: 'Dengeli', icon: 'hourglass-outline', color: '#9D4EDD', emoji: '⏳' },
      { id: 'uzun', title: 'Uzun (6+ saat)', subtitle: 'Güçlü kalıcılık', icon: 'infinite-outline', color: '#E63946', emoji: '♾️' },
    ],
  },
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
      'kakao', 'kahve', 'karamel', 'nane', 'deniz notası', 'oud',
      'deri', 'tütün', 'vetiver', 'iris', 'şakayık', 'mandalina',
      'hindistan cevizi', 'bal', 'bademn', 'elma', 'armut', 'şeftali'
    ],
  },
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
      'oud', 'deri', 'tütün', 'biber', 'karanfil', 'kümin',
      'hayvansal notalar', 'yosun', 'toprak'
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
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // pH bilgisine göre adımları filtrele
  const getVisibleSteps = () => {
    if (preferences.phInfo.biliyorMu === 'biliyorum') {
      return onboardingSteps;
    } else {
      return onboardingSteps.filter(step => step.id !== 'ph_deger');
    }
  };

  const visibleSteps = getVisibleSteps();
  const currentStepData = visibleSteps[currentStep];
  const progress = ((currentStep + 1) / visibleSteps.length) * 100;

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
      if (preferences.phInfo.biliyorMu === 'bilmiyorum') {
        hesaplaPH();
      }
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
    if (currentStepData.type === 'multi-select' && currentStepData.id === 'alerji') return true;
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
      case 'multi-select':
        return true;
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
  const renderOption = (option: OnboardingStep['options'][0], index: number) => {
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
        phColor = '#FF8C42';
      } else if (phValue > 6.0) {
        phCategory = 'Bazik - Alt notalar sizde baskın olur';
        phColor = '#9D4EDD';
      } else {
        phCategory = 'Normal - Dengeli koku performansı';
        phColor = '#2ECC71';
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
            <View style={[styles.phScaleSection, { backgroundColor: '#FF8C42', flex: 2 }]} />
            <View style={[styles.phScaleSection, { backgroundColor: '#2ECC71', flex: 1 }]} />
            <View style={[styles.phScaleSection, { backgroundColor: '#9D4EDD', flex: 2 }]} />
          </View>
          <Text style={[styles.phScaleLabel, { color: colors.textSecondary }]}>8.0</Text>
        </View>
        <View style={styles.phScaleLegend}>
          <Text style={[styles.phScaleLegendText, { color: '#FF8C42' }]}>Asidik</Text>
          <Text style={[styles.phScaleLegendText, { color: '#2ECC71' }]}>Normal</Text>
          <Text style={[styles.phScaleLegendText, { color: '#9D4EDD' }]}>Bazik</Text>
        </View>
      </View>
    );
  };

  // Kategori badge rengi
  const getCategoryColor = (kategori: string) => {
    const categoryColors: Record<string, string> = {
      'Kişisel Bilgiler': '#9D4EDD',
      'Parfüm Deneyimi': '#FF6B9D',
      'Bütçe & Tercihler': '#C9A227',
      'Cilt pH': '#00D4AA',
      'Fiziksel Özellikler': '#FF8C42',
      'Koku Tercihleri': '#E63946',
      'Kullanım Detayları': '#00B4D8',
      'Çevre Faktörleri': '#2ECC71',
      'Yaşam Tarzı': '#5A189A',
      'Koku Alışkanlıkları': '#FF69B4',
    };
    return categoryColors[kategori] || colors.tint;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Gradient Background */}
      <LinearGradient
        colors={colorScheme === 'dark' 
          ? ['#0D0A14', '#150F20', '#1E1628'] 
          : ['#FDFBFF', '#F8F4FC', '#F0EAF5']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        {currentStep > 0 && (
          <TouchableOpacity 
            onPress={handleBack} 
            style={[styles.backButton, { backgroundColor: colors.card }, shadows.sm]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.tint} />
          </TouchableOpacity>
        )}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <Animated.View 
              style={[
                styles.progressFill, 
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
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(currentStepData.kategori) + '20' }]}>
          <Text style={[styles.categoryText, { color: getCategoryColor(currentStepData.kategori) }]}>
            {currentStepData.kategori}
          </Text>
        </View>

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
        {canSkip() && (
          <TouchableOpacity onPress={handleNext} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Atla</Text>
          </TouchableOpacity>
        )}
        
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
            colors={canProceed() ? ['#9D4EDD', '#7B2CBF'] : [colors.border, colors.border]}
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
    fontWeight: '600',
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
