/**
 * Auram - RevenueCat Abonelik Servisi
 * StoreKit (iOS) / Google Play Billing (Android) üzerinden abonelik yönetimi.
 *
 * Not: react-native-purchases native modül gerektirdiğinden Expo Go'da
 * çalışmaz. adService.ts'teki gibi try-catch ile güvenli yüklenir —
 * modül yoksa abonelik özellikleri devre dışı kalır ama uygulama çökmez.
 */

import { Platform } from "react-native";

// ============ NATIVE MODÜL — GÜVENLİ YÜKLEME ============
let RNPurchases: any = null;
try {
  RNPurchases = require("react-native-purchases").default;
} catch (e) {
  console.warn(
    "[SubscriptionService] react-native-purchases yüklenemedi (Expo Go ortamında normal).",
  );
}

const isPurchasesAvailable = RNPurchases !== null;

// ============ API KEY'LERİ ============
// RevenueCat Dashboard > Project Settings > API Keys içinden alınıp .env dosyasına yazılır.
// Expo, EXPO_PUBLIC_ önekli değişkenleri build zamanında otomatik inline eder.
const REVENUECAT_API_KEYS = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "",
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "",
};

const PREMIUM_ENTITLEMENT_ID = "premium";

// ============ TİPLER ============
export interface PurchaseResult {
  success: boolean;
  cancelled: boolean;
  error?: string;
}

// ============ ABONELİK SERVİSİ ============
class SubscriptionService {
  private configured: boolean = false;

  /**
   * Uygulama başlangıcında bir kez çağrılır.
   */
  configure(): void {
    if (!isPurchasesAvailable || this.configured) return;

    try {
      const apiKey =
        Platform.OS === "ios"
          ? REVENUECAT_API_KEYS.ios
          : REVENUECAT_API_KEYS.android;

      if (!apiKey || apiKey.includes("YOUR_")) {
        console.warn(
          `[SubscriptionService] RevenueCat API key ayarlanmamış (${Platform.OS}) — abonelik özellikleri devre dışı kalacak. ` +
            ".env dosyasındaki EXPO_PUBLIC_REVENUECAT_IOS_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_KEY değerlerini kontrol edin.",
        );
        return;
      }

      RNPurchases.configure({ apiKey });
      this.configured = true;
      console.log("[SubscriptionService] RevenueCat yapılandırıldı ✅");
    } catch (error) {
      console.warn("[SubscriptionService] configure() hatası:", error);
    }
  }

  /**
   * Satış sunumlarını (offerings/packages) getirir.
   */
  async getOfferings(): Promise<any | null> {
    if (!isPurchasesAvailable) return null;

    try {
      const offerings = await RNPurchases.getOfferings();
      return offerings.current ?? null;
    } catch (error) {
      console.warn("[SubscriptionService] getOfferings() hatası:", error);
      return null;
    }
  }

  /**
   * Verilen paketi satın alır.
   */
  async purchasePackage(pkg: any): Promise<PurchaseResult> {
    if (!isPurchasesAvailable) {
      return {
        success: false,
        cancelled: false,
        error: "Satın alma modülü kullanılamıyor.",
      };
    }

    try {
      const { customerInfo } = await RNPurchases.purchasePackage(pkg);
      const success = this.isPremium(customerInfo);
      return { success, cancelled: false };
    } catch (error: any) {
      if (error?.userCancelled) {
        return { success: false, cancelled: true };
      }
      console.warn("[SubscriptionService] purchasePackage() hatası:", error);
      return {
        success: false,
        cancelled: false,
        error: error?.message ?? "Satın alma başarısız oldu.",
      };
    }
  }

  /**
   * Önceki satın alımları geri yükler (Apple/Google zorunlu kılıyor).
   */
  async restorePurchases(): Promise<{ success: boolean; isPremium: boolean }> {
    if (!isPurchasesAvailable) {
      return { success: false, isPremium: false };
    }

    try {
      const customerInfo = await RNPurchases.restorePurchases();
      return { success: true, isPremium: this.isPremium(customerInfo) };
    } catch (error) {
      console.warn("[SubscriptionService] restorePurchases() hatası:", error);
      return { success: false, isPremium: false };
    }
  }

  /**
   * Güncel müşteri bilgisini getirir.
   */
  async getCustomerInfo(): Promise<any | null> {
    if (!isPurchasesAvailable) return null;

    try {
      return await RNPurchases.getCustomerInfo();
    } catch (error) {
      console.warn("[SubscriptionService] getCustomerInfo() hatası:", error);
      return null;
    }
  }

  /**
   * customerInfo içinde "premium" entitlement'ı aktif mi?
   */
  isPremium(customerInfo: any | null): boolean {
    if (!customerInfo) return false;
    return (
      customerInfo.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID] !== undefined
    );
  }

  /**
   * Abonelik durumu değişikliklerini dinler (satın alma, iptal, yenileme).
   * Unsubscribe fonksiyonu döner.
   */
  addCustomerInfoListener(callback: (customerInfo: any) => void): () => void {
    if (!isPurchasesAvailable) {
      return () => {};
    }

    try {
      RNPurchases.addCustomerInfoUpdateListener(callback);
      return () => {
        try {
          RNPurchases.removeCustomerInfoUpdateListener(callback);
        } catch {
          // no-op
        }
      };
    } catch (error) {
      console.warn(
        "[SubscriptionService] addCustomerInfoListener() hatası:",
        error,
      );
      return () => {};
    }
  }
}

// Singleton instance
export const subscriptionService = new SubscriptionService();
