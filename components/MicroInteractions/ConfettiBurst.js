/**
 * ConfettiBurst
 *
 * Micro-interaction #10 — 🎉 Confetti Burst
 *
 * Renders 20 small colored rectangles that spray outward, rotate,
 * and fade out over 1.2s. Triggered when `triggerKey` increments.
 *
 * Props:
 *   triggerKey  — number, increment to fire the burst
 *
 * Usage (in parent):
 *   const confettiKey = useRef(0);
 *   // When milestone hit:
 *   confettiKey.current += 1;
 *   setConfettiTrigger(confettiKey.current);
 *   <ConfettiBurst triggerKey={confettiTrigger} />
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const COLORS = ['#2C1810', '#e67e22', '#C4A484', '#7b5e3b'];
const PIECE_COUNT = 20;

// Generate stable piece config once (angle, distance, size)
function generatePieces() {
  return Array.from({ length: PIECE_COUNT }, (_, i) => {
    // Spread pieces in all directions + some randomness
    const angle = (i / PIECE_COUNT) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
    const distance = 70 + Math.random() * 80;
    const size = 5 + Math.floor(Math.random() * 4); // 5–8px
    const color = COLORS[i % COLORS.length];
    return { angle, distance, size, color };
  });
}

// Each piece manages its own animation via hooks
function ConfettiPiece({ angle, distance, size, color, triggerKey }) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (triggerKey > 0) {
      // Reset to center
      cancelAnimation(tx); cancelAnimation(ty);
      cancelAnimation(rotate); cancelAnimation(opacity);
      tx.value = 0; ty.value = 0; rotate.value = 0; opacity.value = 1;

      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      tx.value = withTiming(targetX, { duration: 1200 });
      ty.value = withTiming(targetY, { duration: 1200 });
      rotate.value = withTiming(360 + Math.random() * 360, { duration: 1200 });
      opacity.value = withTiming(0, { duration: 1200 });
    }
  }, [triggerKey]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: size < 7 ? 1 : 2,
        },
        animStyle,
      ]}
    />
  );
}

export function ConfettiBurst({ triggerKey }) {
  // Generate piece configs once — stable across renders
  const pieces = useMemo(() => generatePieces(), []);

  return (
    <View
      style={styles.overlay}
      pointerEvents="none"
    >
      <View style={styles.origin}>
        {pieces.map((piece, i) => (
          <ConfettiPiece key={i} {...piece} triggerKey={triggerKey} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  origin: {
    position: 'absolute',
    // Center of screen — burst origin point
    top: SCREEN_H * 0.4,
    left: SCREEN_W * 0.5,
    width: 1,
    height: 1,
  },
  piece: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
