import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { AppIcon, type AppIconName } from './app-icon';

type ArtworkPlaceholderProps = { size?: number; icon?: AppIconName; style?: ViewStyle };

export function ArtworkPlaceholder({ size = 56, icon = 'music', style }: ArtworkPlaceholderProps) {
  const theme = useTheme();
  const radius = Math.round(size * 0.1);
  return (
    <View
      accessible
      accessibilityLabel="Album artwork unavailable"
      accessibilityRole="image"
      style={[styles.outer, { width: size, height: size, borderRadius: radius, backgroundColor: theme.surfaceRaised }, style]}>
      {/* Inner lighter layer gives a subtle depth effect */}
      <View style={[styles.inner, { borderRadius: radius - 2 }]} />
      <AppIcon name={icon} size={size * 0.36} color={theme.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  inner: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
});
