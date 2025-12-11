/**
 * KOKU - Selection Card Component for Onboarding
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Colors, BorderRadius, FontSizes, FontWeights, Spacing, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SelectionCardProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  selected?: boolean;
  onPress: () => void;
  style?: object;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SelectionCard({
  title,
  subtitle,
  icon,
  iconColor,
  selected = false,
  onPress,
  style,
}: SelectionCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const shadows = Shadows[colorScheme ?? 'light'];
  
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        {
          backgroundColor: selected ? colors.tint + '15' : colors.card,
          borderColor: selected ? colors.tint : colors.cardBorder,
          ...shadows.sm,
        },
        animatedStyle,
        style,
      ]}
    >
      {icon && (
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: selected
                ? colors.tint + '20'
                : colors.backgroundTertiary,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={28}
            color={iconColor || (selected ? colors.tint : colors.icon)}
          />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            { color: selected ? colors.tint : colors.text },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <View
        style={[
          styles.checkContainer,
          {
            backgroundColor: selected ? colors.tint : 'transparent',
            borderColor: selected ? colors.tint : colors.border,
          },
        ]}
      >
        {selected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semiBold,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FontSizes.sm,
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

