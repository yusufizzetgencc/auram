/**
 * AROMIXEN - Favorites Tab
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>Favoriler</ThemedText>
          <ThemedText type="body" style={{ marginTop: Spacing.xs, opacity: 0.8 }}>
            Beğendiğiniz kokular burada
          </ThemedText>
        </View>

        {/* Empty State */}
        <Animated.View 
          entering={FadeInDown.delay(200).duration(500)}
          style={styles.emptyContainer}
        >
          <View style={[styles.emptyIcon, { backgroundColor: colors.tint + '15' }]}>
            <Ionicons name="heart-outline" size={56} color={colors.tint} />
          </View>
          <ThemedText type="subtitle" center style={{ marginTop: Spacing.xl }}>
            Henüz favori yok
          </ThemedText>
          <ThemedText type="body" center style={styles.emptyText}>
            Beğendiğiniz kokuları favorilere ekleyin ve kolayca erişin
          </ThemedText>
          
          <View style={[styles.comingSoonBadge, { backgroundColor: colors.tint + '15' }]}>
            <Ionicons name="construct-outline" size={16} color={colors.tint} />
            <ThemedText style={[styles.comingSoonText, { color: colors.tint }]}>
              Bu özellik yakında aktif olacak
            </ThemedText>
          </View>

          {/* Feature Preview */}
          <View style={styles.featurePreview}>
            <ThemedText type="label" style={{ marginBottom: Spacing.md }}>
              YAKINDA
            </ThemedText>
            
            <View style={styles.featureList}>
              <FeatureItem 
                icon="heart" 
                text="Favori parfümleri kaydet" 
                colors={colors} 
              />
              <FeatureItem 
                icon="notifications-outline" 
                text="Fiyat değişikliği bildirimi" 
                colors={colors} 
              />
              <FeatureItem 
                icon="share-social-outline" 
                text="Favorileri paylaş" 
                colors={colors} 
              />
              <FeatureItem 
                icon="analytics-outline" 
                text="Koku profili analizi" 
                colors={colors} 
              />
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </ThemedView>
  );
}

function FeatureItem({ icon, text, colors }: { 
  icon: keyof typeof Ionicons.glyphMap; 
  text: string; 
  colors: typeof Colors.light;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: colors.backgroundTertiary }]}>
        <Ionicons name={icon} size={18} color={colors.tint} />
      </View>
      <ThemedText type="body" style={{ flex: 1 }}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSizes['2xl'],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['2xl'],
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius['3xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    opacity: 0.7,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  comingSoonText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  featurePreview: {
    width: '100%',
    marginTop: Spacing['3xl'],
    paddingTop: Spacing['2xl'],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  featureList: {
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
