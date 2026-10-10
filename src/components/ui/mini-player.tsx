import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ArtworkPlaceholder } from './artwork-placeholder';
import { ThemedText } from '../themed-text';

export function MiniPlayer() {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Mini player. Playback is not available yet." onPress={() => Alert.alert('Playback is coming next', 'Local playback will be added in Phase 4.')} style={({ pressed }) => [styles.container, { backgroundColor: theme.surface, borderColor: theme.outline }, pressed && styles.pressed]}>
      <ArtworkPlaceholder size={40} />
      <View style={styles.copy}>
        <ThemedText type="smallBold" numberOfLines={1}>Nothing playing</ThemedText>
        <ThemedText type="small" themeColor="textMuted" numberOfLines={1}>Your queue will live here</ThemedText>
      </View>
      <ThemedText style={[styles.control, { color: theme.accent }]}>▶</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({ container: { flexDirection: 'row', alignItems: 'center', padding: Spacing.two, borderRadius: 18, borderWidth: 1, gap: Spacing.two }, copy: { flex: 1, gap: 1 }, control: { fontSize: 20, paddingHorizontal: Spacing.one }, pressed: { opacity: 0.72 } });
