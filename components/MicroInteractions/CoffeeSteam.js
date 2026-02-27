/**
 * CoffeeSteam
 *
 * Micro-interaction #7 — ☕ Coffee Steam (Ambient Cozy Vibes)
 *
 * 3 thin steam lines that float upward and fade, looping continuously.
 * Staggered delays so they don't all move in sync.
 * Lines: 2px wide, 16px tall, rounded ends, warm gray #b8a98c
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

const STEAM_COLOR = '#b8a98c';
const STEAM_CONFIGS = [
  { delay: 0,    left: 6 },
  { delay: 500,  left: 14 },
  { delay: 1000, left: 22 },
];

function SteamLine({ delay }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Appear + float up + fade out, loop infinitely
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),          // reset to base
          withTiming(-22, { duration: 1600 }),      // float up
        ),
        -1,
        false,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 200 }),       // fade in
          withTiming(0, { duration: 1400 }),        // fade out
        ),
        -1,
        false,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.steamLine, animStyle]} />;
}

export function CoffeeSteam() {
  return (
    <View style={styles.container} pointerEvents="none">
      {STEAM_CONFIGS.map((cfg, i) => (
        <View key={i} style={[styles.lineWrapper, { left: cfg.left }]}>
          <SteamLine delay={cfg.delay} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 34,
    height: 24,
    position: 'relative',
  },
  lineWrapper: {
    position: 'absolute',
    bottom: 0,
  },
  steamLine: {
    width: 2,
    height: 16,
    backgroundColor: STEAM_COLOR,
    borderRadius: 1,
  },
});
