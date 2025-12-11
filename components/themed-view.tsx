/**
 * KOKU - Themed View Component
 */

import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ThemedViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'secondary' | 'tertiary';
}

export function ThemedView({
  children,
  style,
  variant = 'default',
}: ThemedViewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getBackgroundColor = () => {
    switch (variant) {
      case 'secondary':
        return colors.backgroundSecondary;
      case 'tertiary':
        return colors.backgroundTertiary;
      default:
        return colors.background;
    }
  };

  return (
    <View style={[{ backgroundColor: getBackgroundColor() }, style]}>
      {children}
    </View>
  );
}
