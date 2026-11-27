/**
 * Koku Kimliği kartını görüntüye çevirip paylaşan modal (sonuç ve profil ekranlarında ortak).
 */
import { Button, Segmented, T } from '@/components/kit';
import { track } from '@/services/analytics';
import { Spacing } from '@/constants/theme';
import { PHHesapSonucu, RecommendationResult } from '@/types';
import { hapticMedium } from '@/utils/haptics';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { ScentIdentityCard } from './ScentIdentityCard';


export function ShareIdentityModal({ visible, onClose, auraBaslik, ph, olculmus, enIyi, isim }: {
  visible: boolean; onClose: () => void; auraBaslik: string; ph: PHHesapSonucu; olculmus: boolean; enIyi?: RecommendationResult; isim?: string | null;
}) {
  const ref = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [format, setFormat] = useState<'post' | 'story'>('post');
  // Hikâye (9:16) ekrana sığsın: üst/alt kontroller için ~230 pt pay bırak
  const maxByHeight = (height - insets.top - insets.bottom - 230) / (format === 'story' ? 16 / 9 : 1.25);
  const cardWidth = Math.min(width - Spacing.xl * 2, 360, maxByHeight);

  const share = async () => {
    if (!ref.current) return;
    hapticMedium();
    setBusy(true);
    try {
      const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Koku kimliğimi paylaş' });
        track('identity_shared', { format });
      } else {
        Alert.alert('Paylaşım kullanılamıyor', 'Bu cihazda paylaşım desteklenmiyor.');
      }
    } catch {
      Alert.alert('Bir sorun oluştu', 'Kart oluşturulamadı, lütfen tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={{ width: cardWidth }}>
          <Segmented<'post' | 'story'> value={format} onChange={setFormat} options={[{ value: 'post', label: 'Gönderi 4:5' }, { value: 'story', label: 'Hikâye 9:16' }]} />
        </View>
        <ScentIdentityCard ref={ref} width={cardWidth} auraBaslik={auraBaslik} ph={ph} olculmus={olculmus} enIyi={enIyi} isim={isim} format={format} />
        <T variant="small" align="center" style={{ color: 'rgba(242,236,228,0.7)', maxWidth: cardWidth }}>
          Hikâyenizde paylaşın, arkadaşlarınız da kendi koku kimliğini çıkarsın.
        </T>
        <View style={[styles.actions, { width: cardWidth }]}>
          <Button label="Kapat" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
          <Button label="Paylaş" icon="share-outline" variant="accent" onPress={share} loading={busy} style={{ flex: 2 }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(12,10,9,0.94)', alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  actions: { flexDirection: 'row', gap: Spacing.md },
});
