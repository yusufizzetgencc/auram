/**
 * Teninde ana ekran / kilit ekranı widget'ı (iOS WidgetKit).
 * Veriyi uygulama App Group'a yazar (services/widget.ts); widget yalnızca okur.
 * Bu dosya veya app.json değişirse: npx expo prebuild --clean (ios/ klasörü yeniden üretilir).
 */
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'TenindeWidget',
  displayName: 'Teninde',
  bundleIdentifier: '.widget',
  deploymentTarget: '16.0',
  frameworks: ['SwiftUI', 'WidgetKit'],
  entitlements: {
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
