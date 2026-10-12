import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { LibraryAlbum, LibraryTrack } from '../types';

type LibraryTrackRowProps = {
  track: LibraryTrack;
  /** When provided the row becomes a play button. */
  onPress?: () => void;
  /** Highlights the row that the player is currently on. */
  isCurrent?: boolean;
};

export function LibraryTrackRow({ track, onPress, isCurrent = false }: LibraryTrackRowProps) {
  const theme = useTheme();
  const body = (
    <>
      <View style={[styles.mark, { backgroundColor: isCurrent ? theme.accent : theme.accentMuted }]}>
        <ThemedText style={[styles.markGlyph, { color: isCurrent ? theme.surface : theme.accent }]}>{isCurrent ? '▶' : '♫'}</ThemedText>
      </View>
      <View style={styles.details}>
        <ThemedText numberOfLines={1} type="smallBold">{track.title}</ThemedText>
        <ThemedText numberOfLines={1} themeColor="textMuted" type="small">{track.filename}</ThemedText>
      </View>
      {onPress ? <ThemedText themeColor="accent" type="smallBold">Play</ThemedText> : null}
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, { borderColor: theme.outline }]}>{body}</View>;
  }

  return (
    <Pressable
      accessibilityLabel={`Play ${track.title}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderColor: theme.outline }, pressed && styles.pressed]}>
      {body}
    </Pressable>
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
      <View style={[styles.mark, { backgroundColor: theme.accentMuted }]}>
        <ThemedText style={[styles.markGlyph, { color: theme.accent }]}>Alb</ThemedText>
      </View>
      <View style={styles.details}>
        <ThemedText numberOfLines={1} type="smallBold">{album.title}</ThemedText>
        <ThemedText numberOfLines={1} themeColor="textMuted" type="small">{count} SONG{count === 1 ? '' : 'S'}</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  mark: { borderRadius: 10, height: 40, width: 40, alignItems: 'center', justifyContent: 'center' },
  markGlyph: { fontSize: 15, fontWeight: '700' },
  details: { flex: 1, gap: 1 },
  pressed: { opacity: 0.78 },
});
