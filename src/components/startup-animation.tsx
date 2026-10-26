import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

/**
 * Keep these in sync with the `expo-splash-screen` plugin in `app.json` so the native splash
 * screen and this overlay look identical and the hand-off between them is invisible.
 */
const BACKGROUND = '#185048';
const LOGO_SIZE = 160;
const ICON_HOLD_MS = 2_000;
const GRAPHIC_EXIT_DURATION_MS = 1_150;

/**
 * Module-level animation driver. `StartupAnimation` renders at most once per app lifetime
 * (it unmounts itself), so a stable module-level `Animated.Value` is safe and lets us keep
 * all the derived interpolations outside React's render path — which satisfies the
 * react-hooks/refs compiler rule without needing refs or useMemo inside the component.
 */
const _progress = new Animated.Value(0);
const overlayOpacity = _progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
const logoOpacity = _progress.interpolate({ inputRange: [0, 0.72, 1], outputRange: [1, 1, 0] });
const logoScale = _progress.interpolate({ inputRange: [0, 0.62, 1], outputRange: [1, 1.1, 1.3] });
const graphicsOpacity = _progress.interpolate({ inputRange: [0, 0.12, 0.72, 1], outputRange: [0, 1, 1, 0] });
const innerRingScale = _progress.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.45] });
const outerRingScale = _progress.interpolate({ inputRange: [0, 1], outputRange: [0.55, 2.05] });
const innerRingOpacity = _progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.5, 0.1, 0] });
const outerRingOpacity = _progress.interpolate({ inputRange: [0, 0.75, 1], outputRange: [0.32, 0.06, 0] });
const sweepTranslateY = _progress.interpolate({ inputRange: [0, 1], outputRange: [130, -180] });
const barOneScale = _progress.interpolate({ inputRange: [0, 0.3, 0.62, 1], outputRange: [0.28, 1, 0.5, 1.15] });
const barTwoScale = _progress.interpolate({ inputRange: [0, 0.24, 0.55, 1], outputRange: [0.72, 0.3, 1.2, 0.42] });
const barThreeScale = _progress.interpolate({ inputRange: [0, 0.38, 0.7, 1], outputRange: [0.42, 1.12, 0.32, 0.92] });

/**
 * A full-screen overlay that takes over as soon as React draws. It deliberately holds the same
 * icon-only splash for two seconds, then plays a brief music-inspired exit before revealing the app.
 */
export function StartupAnimation() {
  const [mounted, setMounted] = useState(true);
  const hasStarted = useRef(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The timer is only a launch-time hold; clear it if the overlay unmounts first
  // (fast refresh, or a future route change that removes it).
  useEffect(() => {
    return () => {
      if (exitTimer.current) {
        clearTimeout(exitTimer.current);
      }
    };
  }, []);

  if (!mounted) return null;

  const startExitAnimation = () => {
    if (hasStarted.current) return;

    hasStarted.current = true;
    Animated.timing(_progress, {
      toValue: 1,
      duration: GRAPHIC_EXIT_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  };

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, { opacity: overlayOpacity }]}
      onLayout={() => {
        // The overlay has painted, so hide the native layer. The matching React overlay stays still
        // for two seconds before starting its graphic exit.
        // `hide()` is the current SDK API; `hideAsync()` exists only for backwards compatibility.
        SplashScreen.hide();
        exitTimer.current = setTimeout(startExitAnimation, ICON_HOLD_MS);
      }}>
      <Animated.View pointerEvents="none" style={[styles.graphicLayer, { opacity: graphicsOpacity }]}>
        <Animated.View style={[styles.ring, styles.innerRing, { opacity: innerRingOpacity, transform: [{ scale: innerRingScale }] }]} />
        <Animated.View style={[styles.ring, styles.outerRing, { opacity: outerRingOpacity, transform: [{ scale: outerRingScale }] }]} />
        <Animated.View style={[styles.lightSweep, { transform: [{ translateY: sweepTranslateY }, { rotate: '-18deg' }] }]} />
      </Animated.View>
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
        <Image
          accessibilityIgnoresInvertColors
          contentFit="contain"
          source={require('@/assets/SoundShelf.png')}
          style={styles.logo}
        />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.equalizer, { opacity: graphicsOpacity }]}>
        <Animated.View style={[styles.equalizerBar, { transform: [{ scaleY: barOneScale }] }]} />
        <Animated.View style={[styles.equalizerBar, styles.equalizerBarMiddle, { transform: [{ scaleY: barTwoScale }] }]} />
        <Animated.View style={[styles.equalizerBar, { transform: [{ scaleY: barThreeScale }] }]} />
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
  graphicLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    borderColor: '#A7EEE0',
  },
  innerRing: {
    width: 185,
    height: 185,
    borderRadius: 92.5,
  },
  outerRing: {
    borderColor: '#6BCABA',
  },
  lightSweep: {
    position: 'absolute',
    width: '160%',
    height: 110,
    backgroundColor: '#6BCABA',
    opacity: 0.12,
  },
  equalizer: {
    position: 'absolute',
    bottom: '19%',
    flexDirection: 'row',
    alignItems: 'center',
    height: 26,
  },
  equalizerBar: {
    width: 4,
    height: 18,
    marginHorizontal: 3,
    borderRadius: 2,
    backgroundColor: '#A7EEE0',
  },
  equalizerBarMiddle: {
    height: 26,
    backgroundColor: '#6BCABA',
  },
});
