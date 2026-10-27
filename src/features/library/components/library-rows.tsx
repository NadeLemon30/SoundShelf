import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ArtworkPlaceholder } from '@/components/ui/artwork-placeholder';
import { AppIcon } from '@/components/ui/app-icon';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { LibraryAlbum, LibraryTrack } from '../types';

type LibraryTrackRowProps = {
  track: LibraryTrack;
  onPress?: () => void;
  isCurrent?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
};

export function LibraryTrackRow({ track, onPress, isCurrent = false, isFavorite = false, onToggleFavorite }: LibraryTrackRowProps) {
  const theme = useTheme();

  const artworkArea = (
    <View style={styles.artworkWrap}>
      <ArtworkPlaceholder size={48} />
      {isCurrent && (
        <View style={[styles.playingOverlay, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
          <AppIcon name="play" size={16} color={theme.accent} />
        </View>
      )}
    </View>
  );

  const textArea = (
    <View style={styles.details}>
      <ThemedText numberOfLines={1} style={[styles.trackTitle, isCurrent && { color: theme.accent }]}>{track.title}</ThemedText>
      <ThemedText numberOfLines={1} themeColor="textMuted" style={styles.trackSub}>{track.filename}</ThemedText>
    </View>
  );

  const favoriteBtn = onToggleFavorite ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${isFavorite ? 'Remove' : 'Add'} ${track.title} ${isFavorite ? 'from' : 'to'} favorites`}
      onPress={onToggleFavorite}
      hitSlop={12}
      style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
      <AppIcon name={isFavorite ? 'favorite' : 'favoriteOutline'} size={20} color={isFavorite ? theme.accent : theme.textMuted} />
    </Pressable>
  ) : null;

  if (!onPress) {
    return (
      <View style={styles.row}>
        {artworkArea}{textArea}{favoriteBtn}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel={`Play ${track.title}`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
        {artworkArea}
        {textArea}
      </Pressable>
      {favoriteBtn}
      {/* Visual affordance reserved for a future context menu. */}
      <View accessible={false} style={styles.iconBtn}>
        <AppIcon name="more" size={22} color={theme.textMuted} />
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
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <ArtworkPlaceholder size={56} icon="album" />
      <View style={styles.details}>
        <ThemedText numberOfLines={1} style={styles.albumTitle}>{album.title}</ThemedText>
        <ThemedText numberOfLines={1} themeColor="textMuted" style={styles.trackSub}>
          Album · {count} song{count === 1 ? '' : 's'}
        </ThemedText>
      </View>
      <AppIcon name="chevronRight" size={22} color={theme.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: 4,
    minHeight: 64,
  },
  pressable: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  artworkWrap: { position: 'relative' },
  playingOverlay: { ...StyleSheet.absoluteFill, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1, gap: 3 },
  trackTitle: { fontSize: 15, fontWeight: '500', color: '#FFFFFF' },
  trackSub: { fontSize: 13, color: '#B3B3B3' },
  albumTitle: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  iconBtn: { padding: Spacing.one },
  pressed: { opacity: 0.65 },
});
