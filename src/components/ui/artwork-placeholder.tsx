import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

type ArtworkPlaceholderProps = { size?: number; label?: string; style?: ViewStyle };

export function ArtworkPlaceholder({ size = 56, label = '♪', style }: ArtworkPlaceholderProps) {
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
      <Text style={[styles.label, { fontSize: size * 0.36, color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  inner: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  label: { fontWeight: '700' },
});
