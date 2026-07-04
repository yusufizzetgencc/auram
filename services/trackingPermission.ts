/**
 * Tracking Permission Store
 * ATT izin durumunu tutan hafif bir modül.
 * Native modül bağımlılığı YOK — _layout.tsx gibi her yerden güvenle import edilebilir.
 */

class TrackingPermissionStore {
  private authorized: boolean = false;
  private handled: boolean = false;

  /**
   * ATT izin sonucunu kaydet.
   */
  setPermission(authorized: boolean): void {
    this.authorized = authorized;
    this.handled = true;
    console.log(`[TrackingStore] İzin durumu: ${authorized ? 'Verildi ✅' : 'Reddedildi ❌'}`);
  }

  /**
   * Kullanıcı takip iznini verdi mi?
   */
  isAuthorized(): boolean {
    return this.authorized;
  }

  /**
   * ATT izin süreci tamamlandı mı?
   */
  isHandled(): boolean {
    return this.handled;
  }
}

export const trackingPermission = new TrackingPermissionStore();
