import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { BackgroundGradient } from '@/constants/theme';

type AppGradientProps = PropsWithChildren<{ style?: StyleProp<ViewStyle> }>;

/** Shared full-screen SoundShelf backdrop. Content surfaces remain opaque for readable text. */
export function AppGradient({ children, style }: AppGradientProps) {
  return <LinearGradient colors={BackgroundGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[{ flex: 1 }, style]}>{children}</LinearGradient>;
}
