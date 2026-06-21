import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { chrome } from './tokens';

interface PlanetProps {
  size: number;
  color: string;
  left: number;
  top: number;
  driftX: number;
  driftY: number;
  durationMs: number;
}

function Planet({ size, color, left, top, driftX, driftY, durationMs }: PlanetProps) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: durationMs, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [p, durationMs]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: p.value * driftX }, { translateY: p.value * driftY }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.planet,
        style,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left,
          top,
          backgroundColor: color,
          shadowColor: chrome.glow,
        },
      ]}
    />
  );
}

/**
 * Ambient animated background. Mounted ONLY on chrome-zone screens — its
 * absence on trial screens is the code-level two-zone boundary (master §4).
 */
export function SpaceBackground() {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={[styles.fill, { backgroundColor: chrome.bg }]}>
      <Planet size={width * 0.7} color={chrome.planetA} left={-width * 0.2} top={height * 0.08} driftX={24} driftY={16} durationMs={14000} />
      <Planet size={width * 0.5} color={chrome.planetB} left={width * 0.55} top={height * 0.32} driftX={-18} driftY={28} durationMs={18000} />
      <Planet size={width * 0.4} color={chrome.planetC} left={width * 0.1} top={height * 0.68} driftX={20} driftY={-22} durationMs={22000} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  planet: {
    position: 'absolute',
    opacity: 0.55,
    shadowOpacity: 0.6,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
  },
});
