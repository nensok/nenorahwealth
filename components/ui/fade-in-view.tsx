import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import type { StyleProp, ViewStyle } from 'react-native';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  fromY?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Wraps children in a fade + slide-up entrance animation.
 * Use `delay` (ms) to stagger multiple elements.
 */
export function FadeInView({ children, delay = 0, fromY = 22, style }: FadeInViewProps) {
  const opacity = useSharedValue(0);
  const ty = useSharedValue(fromY);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 480 }));
    ty.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 120, mass: 0.8 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}
