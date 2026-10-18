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
 * A full-screen overlay that takes over as soon as React draws. It starts its visible exit on the
 * very next frame after the native splash is hidden, so it never becomes a second static splash.
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
        // The overlay has painted, so hide synchronously and start motion on the next displayed frame.
        // `hide()` is the current SDK API; `hideAsync()` exists only for backwards compatibility.
        SplashScreen.hide();
        requestAnimationFrame(startExitAnimation);
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
