import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

export interface ConfettiRef {
  fire: () => void;
}

interface ConfettiProps {
  count?: number;
  origin?: { x: number; y: number };
  fadeOut?: boolean;
}

export const Confetti = forwardRef<ConfettiRef, ConfettiProps>(
  ({ count = 100, origin = { x: -10, y: 0 }, fadeOut = true }, ref) => {
    const cannonRef = useRef<ConfettiCannon>(null);

    useImperativeHandle(ref, () => ({
      fire: () => {
        cannonRef.current?.start();
      },
    }));

    return (
      <View style={styles.container} pointerEvents="none">
        <ConfettiCannon
          ref={cannonRef}
          count={count}
          origin={origin}
          autoStart={false}
          fadeOut={fadeOut}
          colors={['#9D4EDD', '#00B4D8', '#FF6B9D', '#00D4AA', '#FFD166']}
          explosionSpeed={350}
          fallSpeed={3000}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});
