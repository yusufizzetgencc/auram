/**
 * KOKU - Themed Text Component
 */

import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { Colors, FontSizes, FontWeights } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type TextType = 'default' | 'title' | 'subtitle' | 'heading' | 'body' | 'caption' | 'label';

interface ThemedTextProps {
  children: React.ReactNode;
  type?: TextType;
  style?: TextStyle;
  color?: string;
  center?: boolean;
}

export function ThemedText({
  children,
  type = 'default',
  style,
  color,
  center = false,
}: ThemedTextProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getTypeStyle = (): TextStyle => {
    switch (type) {
      case 'title':
        return {
          fontSize: FontSizes['3xl'],
          fontWeight: FontWeights.bold,
          color: color || colors.text,
          letterSpacing: -0.5,
        };
      case 'subtitle':
        return {
          fontSize: FontSizes.xl,
          fontWeight: FontWeights.semiBold,
          color: color || colors.text,
        };
      case 'heading':
        return {
          fontSize: FontSizes.lg,
          fontWeight: FontWeights.semiBold,
          color: color || colors.text,
        };
      case 'body':
        return {
          fontSize: FontSizes.base,
          fontWeight: FontWeights.regular,
          color: color || colors.textSecondary,
          lineHeight: FontSizes.base * 1.5,
        };
      case 'caption':
        return {
          fontSize: FontSizes.sm,
          fontWeight: FontWeights.regular,
          color: color || colors.textMuted,
        };
      case 'label':
        return {
          fontSize: FontSizes.xs,
          fontWeight: FontWeights.medium,
          color: color || colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 1,
        };
      default:
        return {
          fontSize: FontSizes.base,
          fontWeight: FontWeights.regular,
          color: color || colors.text,
        };
    }
  };

  return (
    <Text style={[getTypeStyle(), center && styles.center, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
});
