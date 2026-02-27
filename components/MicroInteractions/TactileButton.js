/**
 * TactileButton
 *
 * Micro-interaction #5 — 👆 Tactile Button (Physical Press Feel)
 *
 * Wrapper for any button that adds:
 * - onPressIn  → scale 0.96, elevation 1 (pushed down)
 * - onPressOut → spring back to 1.0, full elevation (released)
 *
 * Props:
 *   wrapperStyle   — styles applied to the outer Pressable (layout: flex, margin, etc.)
 *   style          — styles applied to the animated view (visual: bg, radius, padding, etc.)
 *   onPress        — press handler
 *   children       — button content
 *   disabled       — disables interaction
 *
 * Usage:
 *   <TactileButton wrapperStyle={{ flex: 1 }} style={styles.myBtn} onPress={handler}>
 *     <Text>Press me</Text>
 *   </TactileButton>
 */

import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export function TactileButton({
  onPress,
  onPressIn: onPressInProp,
  onPressOut: onPressOutProp,
  wrapperStyle,
  style,
  children,
  disabled,
}) {
  const scale = useSharedValue(1);
  const elevation = useSharedValue(4);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 10, stiffness: 300 });
    elevation.value = withSpring(1, { damping: 10, stiffness: 300 });
    if (onPressInProp) onPressInProp();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1.0, { damping: 8, stiffness: 250 });
    elevation.value = withSpring(4, { damping: 8, stiffness: 250 });
    if (onPressOutProp) onPressOutProp();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    elevation: elevation.value,
    shadowRadius: elevation.value * 0.75,
    shadowOpacity: elevation.value * 0.04,
    shadowOffset: { width: 0, height: elevation.value * 0.4 },
  }));

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : handlePressIn}
      onPressOut={disabled ? undefined : handlePressOut}
      disabled={disabled}
      style={wrapperStyle}
    >
      <Animated.View style={[style, styles.base, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    shadowColor: '#2C1810',
  },
});
