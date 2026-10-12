import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { LibraryAlbum, LibraryTrack } from '../types';

export function LibraryTrackRow({ track }: { track: LibraryTrack }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderColor: theme.outline }]}>
      <View style={[styles.mark, { backgroundColor: theme.accentMuted }]} />
      <View style={styles.details}>
        <ThemedText numberOfLines={1} type="smallBold">{track.title}</ThemedText>
        <ThemedText numberOfLines={1} themeColor="textMuted" type="small">{track.filename}</ThemedText>
      </View>
    </View>
  );
}

export function LibraryAlbumRow({ album, onPress }: { album: LibraryAlbum; onPress: () => void }) {
  const theme = useTheme();
  const count = album.tracks.length;
  return (
    <Pressable
      accessibilityLabel={`Open album ${album.title}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderColor: theme.outline }, pressed && styles.pressed]}>
      <View style={[styles.mark, { backgroundColor: theme.accentMuted }]} />
      <View style={styles.details}>
        <ThemedText numberOfLines={1} type="smallBold">{album.title}</ThemedText>
        <ThemedText numberOfLines={1} themeColor="textMuted" type="small">{count} SONG{count === 1 ? '' : 'S'}</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({ row: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth }, mark: { borderRadius: 10, height: 40, width: 40 }, details: { flex: 1, gap: 1 }, pressed: { opacity: 0.78 } });
