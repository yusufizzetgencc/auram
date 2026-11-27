/**
 * TENİNDE — Tüm araçlar
 * Bugün ekranı yalnızca bağlama uygun 4 aracı gösterir; hepsi burada gruplu liste olarak durur (constants/tools.ts).
 */
import { Card, Divider, Header, ListRow, Screen, Section, useTheme } from '@/components/kit';
import { PaywallScreen } from '@/components/paywall';
import { ARAC_GRUPLARI, TOOLS } from '@/constants/tools';
import { Spacing } from '@/constants/theme';
import { usePremiumGate } from '@/hooks/use-premium-gate';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function ToolsScreen() {
  const router = useRouter();
  const c = useTheme();
  const { isPremium, requirePremium, paywallVisible, setPaywallVisible } = usePremiumGate();

  return (
    <Screen>
      <Header title="Araçlar" />
      {ARAC_GRUPLARI.map(g => {
        const liste = TOOLS.filter(t => t.grup === g.id);
        return (
          <Section key={g.id} title={g.baslik}>
            <Card style={{ paddingVertical: Spacing.sm }}>
              {liste.map((t, i) => (
                <View key={t.id}>
                  {i ? <Divider /> : null}
                  <ListRow
                    icon={t.icon}
                    title={t.title}
                    subtitle={t.desc}
                    right={t.premium && !isPremium ? <Ionicons name="lock-closed" size={14} color={c.inkSubtle} /> : undefined}
                    onPress={() => (t.premium ? requirePremium(() => router.push(t.route as any)) : router.push(t.route as any))}
                  />
                </View>
              ))}
            </Card>
          </Section>
        );
      })}
      <PaywallScreen visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </Screen>
  );
}
