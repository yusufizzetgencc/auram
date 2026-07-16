/**
 * Auram - Abonelik (Premium) Context
 * RevenueCat entitlement durumunu uygulama genelinde yönetir.
 */

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
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<any | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const refreshOfferings = useCallback(async () => {
    try {
      const current = await subscriptionService.getOfferings();
      setOfferings(current);
    } catch (error) {
      console.warn('[SubscriptionContext] refreshOfferings hatası:', error);
      setOfferings(null);
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
      value={{ isPremium, isLoading, offerings, purchase, restore, refreshOfferings }}
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
