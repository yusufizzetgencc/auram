/**
 * Auram - AdMob Rewarded Ad Service
 * Reklam yükleme, gösterme ve event yönetimi
 * ATT izin durumunu trackingPermission store'dan okur.
 *
 * Not: react-native-google-mobile-ads native modül gerektirdiğinden,
 * Expo Go'da çalışmaz. Bu dosya bunu güvenli bir şekilde ele alır —
 * modül yoksa reklamlar devre dışı kalır ama uygulama çökmez.
 */

import { trackingPermission } from './trackingPermission';

// ============ NATIVE MODÜL — GÜVENLİ YÜKLEME ============
// Expo Go'da react-native-google-mobile-ads mevcut değildir.
// try-catch ile yükleme yapılır, yoksa null kalır.
let RNAds: any = null;
try {
  RNAds = require('react-native-google-mobile-ads');
} catch (e) {
  console.warn('[AdService] react-native-google-mobile-ads yüklenemedi (Expo Go ortamında normal).');
}

const RewardedAd = RNAds?.RewardedAd ?? null;
const RewardedAdEventType = RNAds?.RewardedAdEventType ?? { LOADED: 'loaded', EARNED_REWARD: 'earned_reward' };
const AdEventType = RNAds?.AdEventType ?? { ERROR: 'error', CLOSED: 'closed' };
const TestIds = RNAds?.TestIds ?? { REWARDED: 'test-rewarded-id' };

// Native modül kullanılabilir mi?
const isAdsAvailable = RNAds !== null;

// ============ REKLAM BİRİMİ ID'LERİ ============
const REAL_REWARDED_ID = 'ca-app-pub-1731461024871182/1891604076';
const AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : REAL_REWARDED_ID;

// ============ TİPLER ============
export interface AdResult {
  watched: boolean;   // Kullanıcı reklamı izledi mi?
  skipped: boolean;   // Atladı mı / erken kapattı mı?
  failed: boolean;    // Reklam yüklenemedi mi?
}

// ============ REKLAM SERVİSİ ============
class AdService {
  private rewardedAd: any = null;
  private isLoaded: boolean = false;
  private isLoading: boolean = false;

  /**
   * ATT izin süreci tamamlandı mı? (trackingPermission store'dan okur)
   */
  isTrackingPermissionHandled(): boolean {
    return trackingPermission.isHandled();
  }

  /**
   * Uygulamanın başında çağrılır — arka planda reklam yüklemeye başlar.
   * Not: ATT izni alındıktan sonra çağrılmalıdır.
   */
  preloadAd(): void {
    if (!isAdsAvailable) {
      console.warn('[AdService] Native modül yok, reklam yüklenemez.');
      return;
    }
    if (this.isLoading || this.isLoaded) return;

    try {
      this.isLoading = true;
      this.rewardedAd = RewardedAd.createForAdRequest(AD_UNIT_ID, {
        // ATT izni reddedildiyse kişiselleştirilmemiş reklam iste
        requestNonPersonalizedAdsOnly: !trackingPermission.isAuthorized(),
        keywords: ['perfume', 'luxury', 'beauty', 'fragrance', 'lifestyle'],
      });

      this.rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
        this.isLoaded = true;
        this.isLoading = false;
        console.log('[AdService] Rewarded ad yüklendi ✅');
      });

      this.rewardedAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.warn('[AdService] Reklam yükleme hatası:', error);
        this.isLoaded = false;
        this.isLoading = false;
        this.rewardedAd = null;
      });

      this.rewardedAd.load();
    } catch (error) {
      console.warn('[AdService] preloadAd hatası:', error);
      this.isLoading = false;
    }
  }

  /**
   * Reklam hazır mı?
   */
  isAdReady(): boolean {
    return this.isLoaded && this.rewardedAd !== null;
  }

  /**
   * Rewarded reklamı gösterir.
   * Promise döndürür: reklam bittikten / atlandıktan / hata olduğunda resolve eder.
   */
  showRewardedAd(): Promise<AdResult> {
    return new Promise((resolve) => {
      if (!isAdsAvailable || !this.rewardedAd || !this.isLoaded) {
        console.warn('[AdService] Reklam hazır değil, direkt geçiliyor.');
        resolve({ watched: false, skipped: false, failed: true });
        return;
      }

      let earnedReward = false;
      let resolved = false;

      const safeResolve = (result: AdResult) => {
        if (!resolved) {
          resolved = true;
          this.isLoaded = false;
          this.rewardedAd = null;
          resolve(result);
          // Arka planda bir sonraki reklamı yükle
          setTimeout(() => this.preloadAd(), 1500);
        }
      };

      // Ödül kazanıldı (kullanıcı reklamı tamamladı)
      this.rewardedAd.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {
          earnedReward = true;
          console.log('[AdService] Kullanıcı ödülü kazandı ✅');
        }
      );

      // Reklam kapandı
      this.rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
        safeResolve({
          watched: earnedReward,
          skipped: !earnedReward,
          failed: false,
        });
      });

      // Hata durumu
      this.rewardedAd.addAdEventListener(AdEventType.ERROR, () => {
        safeResolve({ watched: false, skipped: false, failed: true });
      });

      try {
        this.rewardedAd.show();
      } catch (error) {
        console.warn('[AdService] show() hatası:', error);
        safeResolve({ watched: false, skipped: false, failed: true });
      }
    });
  }

  /**
   * Servisi sıfırlar.
   */
  reset(): void {
    this.rewardedAd = null;
    this.isLoaded = false;
    this.isLoading = false;
  }
}

// Singleton instance
export const adService = new AdService();


