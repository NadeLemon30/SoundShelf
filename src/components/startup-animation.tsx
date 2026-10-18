import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

/**
 * Keep these in sync with the `expo-splash-screen` plugin in `app.json` so the native splash
 * screen and this overlay look identical and the hand-off between them is invisible.
 */
const BACKGROUND = '#185048';
const LOGO_SIZE = 160;

const EXIT_DURATION_MS = 800;

/**
 * A full-screen overlay that matches the native splash screen. Once the native screen is hidden,
 * the logo visibly expands while the overlay dissolves to reveal the app underneath.
 */
export function StartupAnimation() {
  const [mounted, setMounted] = useState(true);
  const hasStarted = useRef(false);
  const progress = useRef(new Animated.Value(0)).current;

  if (!mounted) return null;

  const startExitAnimation = () => {
    if (hasStarted.current) return;

    hasStarted.current = true;
    Animated.timing(progress, {
      toValue: 1,
      duration: EXIT_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  };

  const overlayOpacity = progress.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [1, 1, 0],
  });
  const logoOpacity = progress.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [1, 1, 0],
  });
  const logoScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.28],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, { opacity: overlayOpacity }]}
      onLayout={() => {
        // The matching React overlay has painted, so hiding native splash cannot expose a blank frame.
        void SplashScreen.hideAsync().finally(startExitAnimation);
      }}>
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
        <Image
          accessibilityIgnoresInvertColors
          contentFit="contain"
          source={require('@/assets/SoundShelf.png')}
          style={styles.logo}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BACKGROUND,
    zIndex: 100,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});
