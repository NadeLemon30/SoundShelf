import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type ArtworkPlaceholderProps = { size?: number; label?: string; style?: ViewStyle };

export function ArtworkPlaceholder({ size = 56, label = '♫', style }: ArtworkPlaceholderProps) {
  const theme = useTheme();
  return (
    <View accessible accessibilityLabel="Album artwork unavailable" accessibilityRole="image" style={[styles.artwork, { width: size, height: size, backgroundColor: theme.accentMuted }, style]}>
      <Text style={[styles.label, { fontSize: size * 0.38, color: theme.accent }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({ artwork: { borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, label: { fontWeight: '700' } });
