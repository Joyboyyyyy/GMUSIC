import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, AccessibilityInfo, Text } from 'react-native';
import { COMPONENT_SIZES, SPACING, TYPOGRAPHY } from '../theme/designSystem';
import { useThemeStore, getTheme } from '../store/themeStore';

interface LoadingAnimationProps {
  type?: 'spinner' | 'dots' | 'pulse';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  color?: string;
  style?: ViewStyle;
  testID?: string;
  message?: string;
  showMessage?: boolean;
  fullScreen?: boolean;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  type = 'spinner',
  size = 'md',
  color,
  style,
  testID = 'loading-animation',
  message = 'Loading Music.',
  showMessage = false,
  fullScreen = false,
}) => {
  const isDark = useThemeStore((state) => state.isDark);
  const colors = getTheme(isDark);
  const animationColor = color || colors.primary;
  
  // Get size in pixels
  const sizeValue = typeof size === 'number' ? size : COMPONENT_SIZES.icon[size];

  const content = (
    <>
      {type === 'spinner' && <SpinnerAnimation size={sizeValue} color={animationColor} testID={testID} />}
      {type === 'dots' && <DotsAnimation size={sizeValue} color={animationColor} testID={testID} />}
      {type === 'pulse' && <PulseAnimation size={sizeValue} color={animationColor} testID={testID} />}
      {showMessage && (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      )}
    </>
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreenContainer, { backgroundColor: colors.background }, style]}>
        {content}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {content}
    </View>
  );
};

// Spinner Animation Component
const SpinnerAnimation: React.FC<{
  size: number;
  color: string;
  testID: string;
}> = ({ size, color, testID }) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    animation.start();

    // Announce to screen readers
    AccessibilityInfo.announceForAccessibility('Loading');

    return () => animation.stop();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const strokeWidth = Math.max(2, size / 12);

  return (
    <View style={styles.animationContainer} testID={testID} accessible accessibilityLabel="Loading" accessibilityRole="progressbar">
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: 'transparent',
            borderTopColor: color,
            transform: [{ rotate: spin }],
          },
        ]}
      />
    </View>
  );
};

// Dots Animation Component
const DotsAnimation: React.FC<{
  size: number;
  color: string;
  testID: string;
}> = ({ size, color, testID }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createBounce = (value: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation1 = createBounce(dot1, 0);
    const animation2 = createBounce(dot2, 150);
    const animation3 = createBounce(dot3, 300);

    animation1.start();
    animation2.start();
    animation3.start();

    AccessibilityInfo.announceForAccessibility('Loading');

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, [dot1, dot2, dot3]);

  const dotSize = size / 4;
  const spacing = size / 8;

  const createDotStyle = (animValue: Animated.Value) => ({
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
    backgroundColor: color,
    marginHorizontal: spacing,
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -dotSize],
        }),
      },
    ],
  });

  return (
    <View style={[styles.animationContainer, styles.dotsContainer]} testID={testID} accessible accessibilityLabel="Loading" accessibilityRole="progressbar">
      <Animated.View style={createDotStyle(dot1)} />
      <Animated.View style={createDotStyle(dot2)} />
      <Animated.View style={createDotStyle(dot3)} />
    </View>
  );
};

// Pulse Animation Component
const PulseAnimation: React.FC<{
  size: number;
  color: string;
  testID: string;
}> = ({ size, color, testID }) => {
  const pulseValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    AccessibilityInfo.announceForAccessibility('Loading');

    return () => animation.stop();
  }, [pulseValue]);

  const scale = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2],
  });

  const opacity = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  return (
    <View style={styles.animationContainer} testID={testID} accessible accessibilityLabel="Loading" accessibilityRole="progressbar">
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
  },
  message: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textAlign: 'center',
  },
});
