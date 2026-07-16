/**
 * Auram - Premium Gating Hook
 * Kilitli bir özelliğe erişim kontrolü ve paywall görünürlüğünü yönetir.
 */

import { useCallback, useState } from 'react';

import { useSubscription } from '@/context/SubscriptionContext';

export function usePremiumGate() {
  const { isPremium } = useSubscription();
  const [paywallVisible, setPaywallVisible] = useState(false);

  /**
   * Premium ise onGranted'ı çalıştırır ve true döner.
   * Değilse paywall'ı açar ve false döner.
   */
  const requirePremium = useCallback(
    (onGranted?: () => void): boolean => {
      if (isPremium) {
        onGranted?.();
        return true;
      }
      setPaywallVisible(true);
      return false;
    },
    [isPremium]
  );

  return { isPremium, paywallVisible, setPaywallVisible, requirePremium };
}
