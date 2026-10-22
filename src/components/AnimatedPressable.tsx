import React, { useCallback } from 'react';
import { Pressable, type PressableProps, type ViewStyle, type StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPress = Animated.createAnimatedComponent(Pressable);

const SPRING = { damping: 12, stiffness: 200, mass: 0.6 };

interface Props extends PressableProps {
  style?: StyleProp<ViewStyle>;
  scaleValue?: number;
}

export function AnimatedPressable({ style, scaleValue = 0.97, children, onPressIn, onPressOut, ...rest }: Props) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback((e: any) => {
    scale.value = withSpring(scaleValue, SPRING);
    onPressIn?.(e);
  }, [scaleValue, onPressIn]);

  const handlePressOut = useCallback((e: any) => {
    scale.value = withSpring(1, SPRING);
    onPressOut?.(e);
  }, [onPressOut]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPress
      style={[animatedStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...rest}
    >
      {children}
    </AnimatedPress>
  );
}
