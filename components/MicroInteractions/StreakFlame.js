/**
 * StreakFlame
 *
 * Micro-interaction #3 — 🔥 Streak Flame (Flicker + Burst)
 *
 * - Continuous flicker: subtle scale + opacity oscillation via withRepeat
 * - On tap: burst scale 1.0 → 1.4 then spring back, flicker resumes
 */

import React, { useEffect, useCallback } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';

// Kick off the flicker loop
function startFlicker(scale, opacity) {
  scale.value = withRepeat(
    withSequence(
      withTiming(1.06, { duration: 380 }),
      withTiming(0.94, { duration: 280 }),
      withTiming(1.03, { duration: 340 }),
      withTiming(0.97, { duration: 260 }),
    ),
    -1,   // infinite
    true, // reverse
  );
  opacity.value = withRepeat(
    withSequence(
      withTiming(0.78, { duration: 500 }),
      withTiming(1.0, { duration: 420 }),
    ),
    -1,
    true,
  );
}

export function StreakFlame({ onPress }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const burst = useSharedValue(1);

  // Start flicker on mount
  useEffect(() => {
    startFlicker(scale, opacity);
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, []);

  // Tap → burst, then flicker resumes
  const handlePress = useCallback(() => {
    // Burst scale on a separate shared value so flicker + burst compound
    burst.value = withSpring(1.4, { damping: 3, stiffness: 180 }, () => {
      burst.value = withSpring(1.0, { damping: 6, stiffness: 200 });
    });
    if (onPress) onPress();
  }, [onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * burst.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Pressable onPress={handlePress} hitSlop={10}>
      <Animated.View style={animatedStyle}>
        <Text style={styles.flame}>🔥</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flame: {
    fontSize: 22,
    marginRight: 6,
  },
});
