/**
 * KOKU - Animated Progress Bar Component
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors, BorderRadius, FontSizes, FontWeights, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  totalSteps?: number;
  currentStep?: number;
  showLabel?: boolean;
  height?: number;
}

export function ProgressBar({
  progress,
  totalSteps,
  currentStep,
  showLabel = true,
  height = 6,
}: ProgressBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withSpring(progress, {
      damping: 20,
      stiffness: 90,
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      {showLabel && totalSteps && currentStep !== undefined && (
        <View style={styles.labelContainer}>
          <Text style={[styles.stepText, { color: colors.textMuted }]}>
            Adım {currentStep + 1} / {totalSteps}
          </Text>
          <Text style={[styles.percentText, { color: colors.tint }]}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      )}
      <View
        style={[
          styles.track,
          {
            backgroundColor: colors.backgroundTertiary,
            height,
            borderRadius: height / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: colors.tint,
              height,
              borderRadius: height / 2,
            },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  stepText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  percentText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});

