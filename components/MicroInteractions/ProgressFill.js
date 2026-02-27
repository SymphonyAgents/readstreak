/**
 * ProgressFill
 *
 * Micro-interaction #4 — 📊 Progress Fill
 *
 * Shows animated reading progress bar below the streak section.
 * Goal is 10 reads/week. Animates with a bouncy spring on mount/update.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const GOAL = 10;
const BAR_COLOR = '#e67e22';
const TRACK_COLOR = '#e0d8c3';

export function ProgressFill({ readCount }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const pct = Math.min(readCount / GOAL, 1);
    progress.value = withSpring(pct, {
      damping: 8,
      stiffness: 80,
    });
  }, [readCount]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const clampedCount = Math.min(readCount, GOAL);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {clampedCount} / {GOAL} reads this week
      </Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 12,
    color: '#7b5e3b',
    marginBottom: 6,
    textAlign: 'center',
  },
  track: {
    width: '100%',
    height: 8,
    backgroundColor: TRACK_COLOR,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: BAR_COLOR,
    borderRadius: 4,
  },
});
