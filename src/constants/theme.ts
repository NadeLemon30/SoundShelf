import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#FFFFFF',
    textMuted: '#B3B3B3',
    textSecondary: '#B3B3B3',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceRaised: '#282828',
    backgroundElement: '#282828',
    backgroundSelected: '#333333',
    accent: '#1DB954',
    accentMuted: '#1a3d2b',
    outline: '#282828',
    danger: '#FF4444',
  },
  dark: {
    text: '#FFFFFF',
    textMuted: '#B3B3B3',
    textSecondary: '#B3B3B3',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceRaised: '#282828',
    backgroundElement: '#282828',
    backgroundSelected: '#333333',
    accent: '#1DB954',
    accentMuted: '#1a3d2b',
    outline: '#282828',
    danger: '#FF4444',
  },
} as const;

export const BackgroundGradient = ['#121212', '#121212'] as const;
export const AccentText = '#000000';

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', serif: 'var(--font-serif)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
});

export const Spacing = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 48 } as const;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
// Space reserved above the tab bar for the persistent mini-player when a track is selected.
export const MiniPlayerInset = 72;
export const MaxContentWidth = 760;
