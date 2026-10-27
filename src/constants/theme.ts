import { Platform } from 'react-native';

export const Colors = {
  light: { text: '#F5FFFC', textMuted: '#C7E9E0', textSecondary: '#C7E9E0', background: '#005F73', surface: '#075061', surfaceRaised: '#0B6670', backgroundElement: '#0B6670', backgroundSelected: '#087C76', accent: '#00E68A', accentMuted: '#087C76', outline: '#2D8990', danger: '#FFD0CC' },
  dark: { text: '#F5FFFC', textMuted: '#C7E9E0', textSecondary: '#C7E9E0', background: '#003F4D', surface: '#064653', surfaceRaised: '#075A63', backgroundElement: '#075A63', backgroundSelected: '#08736F', accent: '#00E68A', accentMuted: '#08736F', outline: '#27777C', danger: '#FFD0CC' },
} as const;

export const BackgroundGradient = ['#005F73', '#00E68A'] as const;
export const AccentText = '#003F4D';

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', serif: 'var(--font-serif)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
});

export const Spacing = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 48 } as const;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 760;
