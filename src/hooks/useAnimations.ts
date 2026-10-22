import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

const SPRING_CONFIG = { damping: 18, stiffness: 180, mass: 0.8 };
const SPRING_BOUNCY = { damping: 12, stiffness: 200, mass: 0.6 };
const EASE_OUT = Easing.out(Easing.cubic);

export function useStaggeredEntry(index: number, baseDelay = 40) {
  const progress = useSharedValue(0);

  const enter = useCallback(() => {
    progress.value = 0;
    progress.value = withDelay(
      index * baseDelay,
      withSpring(1, SPRING_CONFIG)
    );
  }, [index, baseDelay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.8, 1]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [24, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.97, 1]) },
    ],
  }));

  return { animatedStyle, enter, progress };
}

export function useFadeIn(delay = 0, duration = 400) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  const enter = useCallback(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration, easing: EASE_OUT }));
    translateY.value = withDelay(delay, withTiming(0, { duration, easing: EASE_OUT }));
  }, [delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return { animatedStyle, enter };
}

export function usePressAnimation() {
  const scale = useSharedValue(1);

  const onPressIn = useCallback(() => {
    scale.value = withSpring(0.96, SPRING_BOUNCY);
  }, []);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_BOUNCY);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, onPressIn, onPressOut };
}

export function useScaleIn(delay = 0) {
  const progress = useSharedValue(0);

  const enter = useCallback(() => {
    progress.value = 0;
    progress.value = withDelay(delay, withSpring(1, SPRING_BOUNCY));
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.6, 1]) },
    ],
  }));

  return { animatedStyle, enter };
}

export function useCountUp(targetValue: number, duration = 800) {
  const animatedValue = useSharedValue(0);

  const start = useCallback((target: number) => {
    animatedValue.value = 0;
    animatedValue.value = withTiming(target, { duration, easing: EASE_OUT });
  }, [duration]);

  return { animatedValue, start };
}

export { SPRING_CONFIG, SPRING_BOUNCY, EASE_OUT };
