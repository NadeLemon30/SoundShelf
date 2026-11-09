import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type AppGradientProps = PropsWithChildren<{ style?: StyleProp<ViewStyle> }>;

export function AppGradient({ children, style }: AppGradientProps) {
  const theme = useTheme();
  return (
    <LinearGradient
      colors={[theme.background, theme.background]}
      style={[{ flex: 1 }, style]}>
      {children}
    </LinearGradient>
  );
}
