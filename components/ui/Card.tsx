/**
 * KOKU - Modern Card Component
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  selected?: boolean;
  variant?: 'default' | 'elevated' | 'outlined';
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  onPress,
  selected = false,
  variant = 'default',
  style,
  padding = 'md',
}: CardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const shadows = Shadows[colorScheme ?? 'light'];

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return Spacing.sm;
      case 'lg':
        return Spacing.xl;
      default:
        return Spacing.base;
    }
  };

  const cardStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: BorderRadius.xl,
    padding: getPadding(),
    borderWidth: variant === 'outlined' || selected ? 2 : 0,
    borderColor: selected ? colors.tint : colors.cardBorder,
    ...(variant === 'elevated' ? shadows.md : variant === 'default' ? shadows.sm : {}),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}

