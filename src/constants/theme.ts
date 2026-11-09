import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#3D4A5C',
    textMuted: '#66788C',
    textSecondary: '#66788C',
    background: '#FDF6EC',
    surface: '#E8D5A3',
    surfaceRaised: '#F2E4BE',
    backgroundElement: '#E8D5A3',
    backgroundSelected: '#DDC98F',
    accent: '#3D4A5C',
    accentMuted: '#D6DFE8',
    onAccent: '#FDF6EC',
    outline: '#C8B47A',
    danger: '#B44B4B',
  },
  dark: {
    text: '#FDF6EC',
    textMuted: '#CFC6B3',
    textSecondary: '#CFC6B3',
    background: '#3D4A5C',
    surface: '#46566A',
    surfaceRaised: '#52657C',
    backgroundElement: '#52657C',
    backgroundSelected: '#5E738D',
    accent: '#7B9E87',
    accentMuted: '#4D6657',
    onAccent: '#FDF6EC',
    outline: '#6A8099',
    danger: '#E08A8A',
  },
} as const;

export const BackgroundGradient = ['#FDF6EC', '#FDF6EC'] as const;
export const AccentText = '#FDF6EC';

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
