import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

/**
 * Keep these in sync with the `expo-splash-screen` plugin in `app.json` so the native splash
 * screen and this overlay look identical and the hand-off between them is invisible.
 */
const BACKGROUND = '#185048';
const LOGO_SIZE = 160;

const FADE_OUT_MS = 450;

/** Hold, then fade the overlay away while the logo drifts slightly outward. */
const fadeOut = new Keyframe({
  0: { opacity: 1, transform: [{ scale: 1 }] },
  35: { opacity: 1, transform: [{ scale: 1 }] },
  100: { opacity: 0, transform: [{ scale: 1.06 }], easing: Easing.in(Easing.quad) },
});

/**
 * Simple launch animation: a full-screen overlay that matches the native splash screen, painted
 * on top of the app for the first frame and then faded out.
 */
export function StartupAnimation() {
  const [fading, setFading] = useState(false);
  const [mounted, setMounted] = useState(true);

  if (!mounted) return null;

  const logo = (
    <Image
      accessibilityIgnoresInvertColors
      contentFit="contain"
      source={require('@/assets/SoundShelf.png')}
      style={styles.logo}
    />
  );

  // First frame: identical to the native splash screen, so hiding it reveals this overlay seamlessly.
  if (!fading) {
    return (
      <View
        pointerEvents="none"
        style={styles.overlay}
        onLayout={() => {
          SplashScreen.hideAsync().finally(() => setFading(true));
        }}>
        {logo}
      </View>
    );
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={styles.overlay}
      entering={fadeOut.duration(FADE_OUT_MS).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setMounted, false);
        }
      })}>
      {logo}
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
