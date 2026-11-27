/**
 * Teninde - Abonelik (Premium) Context
 * RevenueCat entitlement durumunu uygulama genelinde yönetir.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { subscriptionService } from '@/services/subscriptionService';
import { loadSubscriptionCache, saveSubscriptionCache } from '@/services/storage';

interface PurchaseOutcome {
  success: boolean;
  cancelled: boolean;
  error?: string;
}

interface SubscriptionContextType {
  isPremium: boolean;
  isLoading: boolean;
  offerings: any | null;
  purchase: (pkg: any) => Promise<PurchaseOutcome>;
  restore: () => Promise<boolean>;
  refreshOfferings: () => Promise<void>;
  /** Paket yükleme durumu: ödeme ekranı buna göre mesaj gösterir */
  offeringsStatus: 'loading' | 'ready' | 'empty' | 'error' | 'network' | 'unavailable';
  /** Yalnızca geliştirme sürümünde: gerçek satın alma olmadan Premium özellikleri denemek için */
  devPremium: boolean;
  setDevPremium: (on: boolean) => void;
}

// Geliştirici test anahtarı. __DEV__ dışında (App Store / TestFlight sürümü) hiçbir etkisi yoktur.
const DEV_PREMIUM_KEY = '@teninde_dev_premium';

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<any | null>(null);
  const [offeringsStatus, setOfferingsStatus] = useState<SubscriptionContextType['offeringsStatus']>('loading');
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const [devPremium, setDevPremiumState] = useState(false);

  useEffect(() => {
    if (!__DEV__) return;
    AsyncStorage.getItem(DEV_PREMIUM_KEY).then(v => setDevPremiumState(v === '1')).catch(() => {});
  }, []);

  const setDevPremium = useCallback((on: boolean) => {
    if (!__DEV__) return;
    setDevPremiumState(on);
    AsyncStorage.setItem(DEV_PREMIUM_KEY, on ? '1' : '0').catch(() => {});
  }, []);

  const refreshOfferings = useCallback(async () => {
    try {
      if (!subscriptionService.isConfigured()) {
        setOfferings(null);
        setOfferingsStatus('unavailable');
        return;
      }
      setOfferingsStatus(prev => (prev === 'ready' ? prev : 'loading'));
      const current = await subscriptionService.getOfferings();
      setOfferings(current);
      setOfferingsStatus(current?.availablePackages?.length ? 'ready' : subscriptionService.lastOfferingsError === 'network' ? 'network' : subscriptionService.lastOfferingsError === 'store' ? 'error' : 'empty');
    } catch (error) {
      console.warn('[SubscriptionContext] refreshOfferings hatası:', error);
      setOfferings(null);
      setOfferingsStatus('error');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // 1) Cache'den anında oku (offline / hızlı UI)
        const cache = await loadSubscriptionCache();
        if (mounted) setIsPremium(cache.isPremium);

        // 2) RevenueCat'i yapılandır ve gerçek durumu doğrula
        subscriptionService.configure();
        const customerInfo = await subscriptionService.getCustomerInfo();
        if (customerInfo) {
          const premium = subscriptionService.isPremium(customerInfo);
          if (mounted) setIsPremium(premium);
          await saveSubscriptionCache(premium);
        }

        await refreshOfferings();
      } catch (error) {
        // Abonelik durumu doğrulanamasa bile uygulama ücretsiz mod ile çalışmaya devam eder.
        console.warn('[SubscriptionContext] init hatası, ücretsiz mod ile devam ediliyor:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();

    unsubscribeRef.current = subscriptionService.addCustomerInfoListener((customerInfo) => {
      const premium = subscriptionService.isPremium(customerInfo);
      setIsPremium(premium);
      saveSubscriptionCache(premium);
    });

    return () => {
      mounted = false;
      unsubscribeRef.current?.();
    };
  }, [refreshOfferings]);

  const purchase = useCallback(async (pkg: any): Promise<PurchaseOutcome> => {
    const result = await subscriptionService.purchasePackage(pkg);
    if (result.success) {
      setIsPremium(true);
      await saveSubscriptionCache(true);
    }
    return result;
  }, []);

  const restore = useCallback(async (): Promise<boolean> => {
    const result = await subscriptionService.restorePurchases();
    if (result.isPremium) {
      setIsPremium(true);
      await saveSubscriptionCache(true);
    }
    return result.isPremium;
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{ isPremium: isPremium || (__DEV__ && devPremium), isLoading, offerings, purchase, restore, refreshOfferings, offeringsStatus, devPremium, setDevPremium }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription, SubscriptionProvider içinde kullanılmalı');
  }
  return context;
}
