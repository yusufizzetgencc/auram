/**
 * İçeriği bulanıklaştırıp üzerine kilit çağrısı koyan sarmalayıcı.
 */
import { Button, T, useTheme } from '@/components/kit';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface LockedFeatureOverlayProps {
  children: React.ReactNode;
  onUnlock: () => void;
  title?: string;
  subtitle?: string;
  blurIntensity?: number;
  compact?: boolean;
}

export function LockedFeatureOverlay({ children, onUnlock, title = 'Premium özellik', subtitle, blurIntensity = 30, compact }: LockedFeatureOverlayProps) {
  const scheme = useColorScheme();
  const c = useTheme();
  return (
    <View style={{ overflow: 'hidden' }}>
      <View pointerEvents="none">{children}</View>
      <BlurView intensity={blurIntensity} tint={scheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: c.bg + '66' }]}>
        {!compact ? <T variant="h3" align="center">{title}</T> : null}
        {!compact && subtitle ? <T variant="small" color="muted" align="center" style={{ marginTop: 4 }}>{subtitle}</T> : null}
        <Button label="Kilidi aç" icon="lock-open-outline" size="sm" variant="accent" onPress={onUnlock} style={{ marginTop: compact ? 0 : Spacing.md }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
});
