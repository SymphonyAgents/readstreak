/**
 * AnimatedArticleRow
 *
 * Combines 4 micro-interactions for article rows:
 *   1. 📖 Reading Lamp  — warm amber glow on press
 *   2. 📄 Page Flip     — 3D rotateY flip before opening
 *   6. ✓ Checkmark Draw — SVG checkmark draws itself after read
 *   9. 🃏 Card Wobble   — scale + tilt on press-in
 */

import React from 'react';
import { Text, View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withTiming,
  withSequence,
  interpolateColor,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

// Create animated SVG Path component
const AnimatedPath = Animated.createAnimatedComponent(Path);

// Approximate length of path "M5,13 L10,18 L19,7" in a 24×24 viewBox
// Segment 1: (5,13)→(10,18) = √50 ≈ 7.07
// Segment 2: (10,18)→(19,7) = √202 ≈ 14.21
// Total ≈ 21.28 — we use 25 for a safe margin
const CHECKMARK_LENGTH = 25;

export function AnimatedArticleRow({ article, onPress }) {
  // --- Shared values ---
  const pressProgress = useSharedValue(0);  // 0→1 on press
  const scale = useSharedValue(1);
  const tilt = useSharedValue(0);
  const flip = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const checkDashOffset = useSharedValue(CHECKMARK_LENGTH);

  // --- Press handlers ---
  const handlePressIn = () => {
    // ReadingLamp glow
    pressProgress.value = withSpring(1, { damping: 15, stiffness: 200 });
    // CardWobble: lift + tilt
    scale.value = withSpring(1.02, { damping: 12, stiffness: 300 });
    tilt.value = withSpring(1.5, { damping: 8, stiffness: 180 });
  };

  const handlePressOut = () => {
    pressProgress.value = withSpring(0, { damping: 15, stiffness: 200 });
    scale.value = withSpring(1.0, { damping: 10, stiffness: 200 });
    tilt.value = withSpring(0, { damping: 10, stiffness: 200 });
  };

  const handlePress = () => {
    // PageFlip: 0° → 90° → 0° over 400ms
    flip.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 200 }),
    );

    // Open URL at the halfway point (card is edge-on → invisible)
    setTimeout(() => {
      if (onPress) onPress(article.url);

      // Show checkmark draw-in
      checkOpacity.value = withTiming(1, { duration: 80 });
      checkDashOffset.value = withTiming(0, { duration: 300 });

      // Fade out checkmark after 1.5s, then reset
      setTimeout(() => {
        checkOpacity.value = withTiming(0, { duration: 300 });
        setTimeout(() => {
          checkDashOffset.value = CHECKMARK_LENGTH; // silent reset
        }, 350);
      }, 1500);
    }, 200);
  };

  // --- Animated styles ---
  const rowStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      pressProgress.value,
      [0, 1],
      ['transparent', '#FFF4E6'],
    ),
    transform: [
      { perspective: 1000 },
      { rotateY: `${flip.value * 90}deg` },
      { scale: scale.value },
      { rotate: `${tilt.value}deg` },
    ],
    shadowRadius: 2 + pressProgress.value * 6,
    elevation: pressProgress.value * 5,
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: pressProgress.value * 3 },
    shadowOpacity: pressProgress.value * 0.15,
  }));

  const checkContainerStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -12,
  }));

  // Animated SVG props (animates strokeDashoffset)
  const animatedCheckProps = useAnimatedProps(() => ({
    strokeDashoffset: checkDashOffset.value,
  }));

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View style={[styles.articleRow, rowStyle]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.blurb}>{article.blurb}</Text>
        </View>

        {/* Arrow (hidden when checkmark shows) */}
        <Text style={styles.arrow}>›</Text>

        {/* Checkmark overlay */}
        <Animated.View style={checkContainerStyle} pointerEvents="none">
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <AnimatedPath
              d="M5,13 L10,18 L19,7"
              stroke="#e67e22"
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${CHECKMARK_LENGTH},${CHECKMARK_LENGTH}`}
              animatedProps={animatedCheckProps}
            />
          </Svg>
        </Animated.View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  articleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    overflow: 'visible',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3e2c13',
    marginBottom: 4,
  },
  blurb: {
    fontSize: 14,
    color: '#5a4630',
    fontStyle: 'italic',
  },
  arrow: {
    fontSize: 22,
    color: '#7b5e3b',
    marginLeft: 10,
    marginRight: 4,
  },
});
