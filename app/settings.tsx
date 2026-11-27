/**
 * TENİNDE — Ayarlar
 * Profil sekmesi yalnızca "siz" (ten profili, zevk, tercihler) olsun diye ayarlar, veri ve yasal bağlantılar burada:
 * bildirimler · üyelik · yöntem · destek ve yasal · geliştirici (yalnızca __DEV__) · veri (analitik, yedek, geri yükleme, silme)
 */
import { Button, Card, Divider, Header, ListRow, Screen, Section, T, useTheme } from '@/components/kit';
import { PaywallScreen } from '@/components/paywall';
import { LEGAL } from '@/constants/legal';
import { Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { isAnalyticsEnabled, setAnalyticsEnabled } from '@/services/analytics';
import { getPermissionStatus } from '@/services/notifications';
import { exportBackup, importBackup, loadNotificationPreferences } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Modal, Platform, Share, Switch, TextInput, View } from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const c = useTheme();
  const { clearSearchHistoryList, resetAllData, reloadFromStorage } = useApp();
  const { isPremium, devPremium, setDevPremium } = useSubscription();
  const [paywall, setPaywall] = useState(false);
  const [bildirim, setBildirim] = useState<string>('Kapalı');
  const [analitik, setAnalitik] = useState(true);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreText, setRestoreText] = useState('');

  // Bildirim durumu ayar ekranından dönünce de güncel olsun
  useFocusEffect(useCallback(() => {
    (async () => {
      const p = await loadNotificationPreferences();
      const izin = await getPermissionStatus();
      setBildirim(p.enabled && izin === 'granted' ? `Açık · sabah ${p.reminderTime ?? '09:00'}` : izin === 'denied' ? 'İzin kapalı' : 'Kapalı');
    })();
  }, []));
  useEffect(() => { isAnalyticsEnabled().then(setAnalitik); }, []);

  const rate = async () => {
    if (await StoreReview.hasAction()) await StoreReview.requestReview();
    else Alert.alert('Teşekkürler', 'Değerlendirme şu an bu cihazda kullanılamıyor.');
  };
  const shareApp = () => Share.share({ message: 'Teninizi tanıyan parfüm asistanı: Teninde. Kendi koku kimliğinizi çıkarın.' });
  const manageSub = () => Linking.openURL(Platform.OS === 'ios' ? 'itms-apps://apps.apple.com/account/subscriptions' : 'https://play.google.com/store/account/subscriptions');

  const wipe = () => Alert.alert('Tüm verileri sil', 'Profiliniz, dolabınız, favorileriniz, koleksiyonlarınız, günlüğünüz ve öğrenilenler bu cihazdan kalıcı olarak silinecek. Bu işlem geri alınamaz.', [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Sil', style: 'destructive', onPress: async () => { await resetAllData(); router.replace('/'); } },
  ]);

  // Yedekleme: tüm kullanıcı verisi tek bir metin olarak paylaşılır (Notlar, e-posta, iCloud Drive…)
  const backup = async () => {
    const text = await exportBackup();
    await Share.share({ message: text, title: 'Teninde yedeği' });
  };
  const restore = async () => {
    try {
      const n = await importBackup(restoreText);
      await reloadFromStorage();
      setRestoreOpen(false);
      setRestoreText('');
      Alert.alert('Geri yüklendi', `${n} veri grubu geri yüklendi.`);
    } catch (e: any) {
      Alert.alert('Geri yüklenemedi', e?.message ?? 'Yedek metni geçersiz.');
    }
  };

  return (
    <Screen>
      <Header title="Ayarlar" />

      <Card style={{ marginTop: Spacing.lg, paddingVertical: Spacing.sm }}>
        <ListRow icon="notifications-outline" title="Bildirimler" subtitle={bildirim} onPress={() => router.push('/notifications')} />
        <Divider />
        {isPremium ? (
          <ListRow icon="sparkles-outline" title="Teninde Premium aktif" subtitle="Aboneliği App Store üzerinden yönetin" onPress={manageSub} />
        ) : (
          <ListRow icon="sparkles-outline" title="Premium'a geçin" subtitle="Tüm eşleşmeler, araçlar ve reklamsız deneyim" onPress={() => setPaywall(true)} />
        )}
      </Card>

      <Section title="Hakkında">
        <Card style={{ paddingVertical: Spacing.sm }}>
          <ListRow icon="flask-outline" title="Bilim ve yöntem" subtitle="pH tahmini nasıl yapılıyor?" onPress={() => router.push('/science')} />
          <Divider />
          <ListRow icon="star-outline" title="Uygulamayı değerlendir" onPress={rate} />
          <Divider />
          <ListRow icon="share-social-outline" title="Arkadaşına öner" onPress={shareApp} />
          <Divider />
          <ListRow icon="mail-outline" title="Destek" subtitle={LEGAL.supportEmail} onPress={() => Linking.openURL(`mailto:${LEGAL.supportEmail}`)} />
          <Divider />
          <ListRow icon="shield-checkmark-outline" title="Gizlilik politikası" onPress={() => Linking.openURL(LEGAL.privacy)} />
          <Divider />
          <ListRow icon="document-text-outline" title="Kullanım koşulları" onPress={() => Linking.openURL(LEGAL.terms)} />
        </Card>
      </Section>

      <Section title="Veri">
        <Card style={{ paddingVertical: Spacing.sm }}>
          <ListRow icon="stats-chart-outline" title="Anonim kullanım verisi" subtitle="Uygulamayı geliştirmemize yardım eder; kişisel veri içermez" right={<Switch value={analitik} onValueChange={async v => { setAnalitik(v); await setAnalyticsEnabled(v); }} trackColor={{ true: c.accent, false: c.border }} />} />
          <Divider />
          <ListRow icon="cloud-upload-outline" title="Verilerimi yedekle" subtitle="Profil, dolap, favoriler, günlük ve öğrenilenler" onPress={backup} />
          <Divider />
          <ListRow icon="cloud-download-outline" title="Yedekten geri yükle" subtitle="Yeni telefona geçtiğinizde" onPress={() => setRestoreOpen(true)} />
          <Divider />
          <ListRow icon="time-outline" title="Arama geçmişini temizle" onPress={() => { clearSearchHistoryList(); Alert.alert('Temizlendi', 'Arama geçmişiniz silindi.'); }} />
          <Divider />
          <ListRow icon="trash-outline" title="Tüm verileri sil" subtitle="Veriler yalnızca bu cihazda tutulur" danger onPress={wipe} />
        </Card>
      </Section>

      {__DEV__ ? (
        <Section title="Geliştirici">
          <Card style={{ paddingVertical: Spacing.sm }}>
            <ListRow icon="construct-outline" title="Premium'u test et" subtitle="Yalnızca geliştirme sürümünde görünür" right={<Switch value={devPremium} onValueChange={setDevPremium} trackColor={{ true: c.accent, false: c.border }} />} />
          </Card>
        </Section>
      ) : null}

      <T variant="small" color="subtle" align="center" style={{ marginTop: Spacing.xl }}>
        Teninde {Constants.expoConfig?.version ?? ''}
      </T>

      <PaywallScreen visible={paywall} onClose={() => setPaywall(false)} />

      <Modal visible={restoreOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setRestoreOpen(false)}>
        <View style={{ flex: 1, backgroundColor: c.bg, padding: Spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <T variant="h2">Yedekten geri yükle</T>
            <Ionicons name="close" size={24} color={c.ink} onPress={() => setRestoreOpen(false)} />
          </View>
          <T variant="body" color="muted" style={{ marginTop: Spacing.sm }}>“Verilerimi yedekle” ile kaydettiğiniz metni aşağıya yapıştırın. Bu cihazdaki aynı türden veriler yedektekiyle değiştirilir.</T>
          <TextInput
            value={restoreText}
            onChangeText={setRestoreText}
            multiline
            placeholder="Yedek metnini buraya yapıştırın"
            placeholderTextColor={c.inkSubtle}
            style={{ flex: 1, marginTop: Spacing.lg, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: Spacing.md, color: c.ink, backgroundColor: c.surface, textAlignVertical: 'top', fontFamily: 'Inter_400Regular', fontSize: 13 }}
          />
          <Button label="Geri yükle" onPress={restore} disabled={!restoreText.trim()} style={{ marginTop: Spacing.md }} />
        </View>
      </Modal>
    </Screen>
  );
}
