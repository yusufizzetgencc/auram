/**
 * Auram - Ad Loading Screen
 * Onboarding tamamlandıktan sonra gösterilen ara ekran.
 * Reklam yüklenirken kullanıcıya güzel bir animasyon gösterilir,
 * reklam hazır olduğunda otomatik olarak başlatılır.
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { adService } from '@/services/adService';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Mesajlar — reklam yüklenirken döner
const LOADING_MESSAGES = [
  'Ten kimyanız analiz ediliyor...',
  'pH profiliniz hesaplanıyor...',
  'Parfüm veritabanı taranıyor...',
  'Kişisel eşleşmeleriniz bulunuyor...',
  'Sonuçlarınız hazırlanıyor...',
];

export default function AdLoadingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const [messageIndex, setMessageIndex] = useState(0);
  const [adReady, setAdReady] = useState(false);

  // Animasyonlar
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;
  const messageAnim = useRef(new Animated.Value(1)).current;
  const progressWidthAnim = useRef(new Animated.Value(1)).current;

  // Giriş animasyonu
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Nabız (pulse) animasyonu — logo için
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Yükleniyor noktaları animasyonu
  useEffect(() => {
    const animateDot = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );

    const d1 = animateDot(dotAnim1, 0);
    const d2 = animateDot(dotAnim2, 200);
    const d3 = animateDot(dotAnim3, 400);
    d1.start();
    d2.start();
    d3.start();
    return () => {
      d1.stop();
      d2.stop();
      d3.stop();
    };
  }, []);

  // Mesaj döngüsü
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.parallel([
        Animated.timing(messageAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(progressWidthAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        Animated.parallel([
          Animated.timing(messageAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(progressWidthAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start();
      });
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  // Reklam yükleme + gösterme mantığı
  useEffect(() => {
    let isMounted = true;

    const loadAndShow = async () => {
      // ATT izin süreci tamamlanana kadar bekle (max 5 saniye)
      // Bu, iOS'ta kullanıcının izin penceresine yanıt vermesini bekler
      const waitForTracking = new Promise<void>((resolve) => {
        let elapsed = 0;
        const check = setInterval(() => {
          elapsed += 200;
          if (adService.isTrackingPermissionHandled() || elapsed >= 5000) {
            clearInterval(check);
            resolve();
          }
        }, 200);
      });

      await waitForTracking;
      if (!isMounted) return;

      // Reklamı yükle (artık tracking izni biliniyor)
      adService.preloadAd();

      // Minimum 2 saniye animasyon göster (UX için)
      await new Promise((res) => setTimeout(res, 2000));

      if (!isMounted) return;

      // Reklam hazır olana kadar bekle (max 8 saniye)
      const waitForAd = new Promise<void>((resolve) => {
        let elapsed = 0;
        const check = setInterval(() => {
          elapsed += 300;
          if (adService.isAdReady() || elapsed >= 8000) {
            clearInterval(check);
            resolve();
          }
        }, 300);
      });

      await waitForAd;
      if (!isMounted) return;

      // Reklamı göster
      const result = await adService.showRewardedAd();
      console.log('[AdLoadingScreen] Reklam sonucu:', result);

      if (!isMounted) return;

      // Her durumda sonuçlara git
      router.replace('/results');
    };

    loadAndShow();

    return () => {
      isMounted = false;
    };
  }, []);

  // Renk şeması
  const isDark = colorScheme === 'dark';

  return (
    <LinearGradient
      colors={
        isDark
          ? ['#0D0D1A', '#1A0A2E', '#2D1B4E']
          : ['#1A0A2E', '#2D1B4E', '#4A1D8A']
      }
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Arka plan dekoratif daireler */}
      <View style={[styles.bgCircle, styles.bgCircle1]} />
      <View style={[styles.bgCircle, styles.bgCircle2]} />
      <View style={[styles.bgCircle, styles.bgCircle3]} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 40,
          },
        ]}
      >
        {/* Logo / İkon alanı */}
        <Animated.View
          style={[
            styles.logoContainer,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <LinearGradient
            colors={['#9D4EDD', '#C77DFF', '#E0AAFF']}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.logoEmoji}>🌸</Text>
          </LinearGradient>
          {/* Parıltı halkası */}
          <View style={styles.glowRing} />
        </Animated.View>

        {/* Başlık */}
        <Text style={styles.title}>Auram</Text>
        <Text style={styles.subtitle}>Parfüm Kişiselleştirme Motoru</Text>

        {/* Değişen mesaj */}
        <Animated.Text
          style={[styles.loadingMessage, { opacity: messageAnim }]}
        >
          {LOADING_MESSAGES[messageIndex]}
        </Animated.Text>

        {/* Yükleniyor noktaları */}
        <View style={styles.dotsContainer}>
          {[dotAnim1, dotAnim2, dotAnim3].map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  opacity: anim,
                  transform: [
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -8],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>

        {/* İlerleme çubuğu */}
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidthAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Alt bilgi notu */}
        <Text style={styles.footerNote}>
          Kişisel analiziniz tamamlanıyor
        </Text>
        <Text style={styles.footerSubNote}>
          Sonuçlarınız birkaç saniye içinde hazır olacak
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Arka plan dekoratif daireler
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.08,
  },
  bgCircle1: {
    width: 400,
    height: 400,
    backgroundColor: '#C77DFF',
    top: -100,
    right: -100,
  },
  bgCircle2: {
    width: 300,
    height: 300,
    backgroundColor: '#9D4EDD',
    bottom: -50,
    left: -80,
  },
  bgCircle3: {
    width: 200,
    height: 200,
    backgroundColor: '#E0AAFF',
    top: height * 0.4,
    right: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    width: '100%',
  },
  // Logo
  logoContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C77DFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  logoEmoji: {
    fontSize: 56,
  },
  glowRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: 'rgba(199, 125, 255, 0.3)',
  },
  // Başlık
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 8,
    textShadowColor: 'rgba(157, 78, 221, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 1.5,
    marginBottom: 48,
    textTransform: 'uppercase',
  },
  // Yükleniyor mesajı
  loadingMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
    minHeight: 22,
  },
  // Noktalar
  dotsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C77DFF',
  },
  // İlerleme çubuğu
  progressBar: {
    width: width * 0.6,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 48,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#C77DFF',
    borderRadius: 2,
  },
  // Alt not
  footerNote: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
    marginBottom: 6,
  },
  footerSubNote: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.25)',
    textAlign: 'center',
  },
});
