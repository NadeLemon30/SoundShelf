import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { BackgroundGradient } from '@/constants/theme';

type AppGradientProps = PropsWithChildren<{ style?: StyleProp<ViewStyle> }>;

export function AppGradient({ children, style }: AppGradientProps) {
  return (
    <LinearGradient
      colors={BackgroundGradient}
      style={[{ flex: 1 }, style]}>
      {children}
    </LinearGradient>
  );
}
