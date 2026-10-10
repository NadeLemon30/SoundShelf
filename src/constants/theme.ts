import { Platform } from 'react-native';

export const Colors = {
  light: { text: '#17221C', textMuted: '#607065', textSecondary: '#607065', background: '#F6F8F4', surface: '#FFFFFF', surfaceRaised: '#EDF2EA', backgroundElement: '#EDF2EA', backgroundSelected: '#D8EBDD', accent: '#176B4D', accentMuted: '#D8EBDD', outline: '#D7DED6', danger: '#B42318' },
  dark: { text: '#F3F7F1', textMuted: '#B2C0B6', textSecondary: '#B2C0B6', background: '#111814', surface: '#1A241E', surfaceRaised: '#253128', backgroundElement: '#253128', backgroundSelected: '#254B38', accent: '#75D4A3', accentMuted: '#254B38', outline: '#34443A', danger: '#FDA29B' },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', serif: 'var(--font-serif)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
});

export const Spacing = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 48 } as const;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 760;
