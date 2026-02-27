/**
 * BookmarkSlide
 *
 * Micro-interaction #8 — 🔖 Bookmark Slide
 *
 * Slides in from the right when triggerKey increments,
 * holds for 800ms, then slides back out.
 *
 * Props:
 *   triggerKey  — increment this number to fire the animation
 */

import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

export function BookmarkSlide({ triggerKey }) {
  const translateX = useSharedValue(120);

  useEffect(() => {
    if (triggerKey > 0) {
      // Spring in from right → hold → spring out
      translateX.value = withSequence(
        withSpring(0, { damping: 14, stiffness: 180 }),    // slide in
        withDelay(800, withSpring(120, { damping: 14, stiffness: 180 })), // slide out
      );
    }
  }, [triggerKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.bookmark, animatedStyle]} pointerEvents="none">
      <Text style={styles.emoji}>🔖</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bookmark: {
    position: 'absolute',
    top: 56,          // below status bar / header area
    right: 16,
    zIndex: 999,
    backgroundColor: 'rgba(249,246,241,0.92)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    shadowColor: '#2C1810',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  emoji: {
    fontSize: 26,
  },
});
