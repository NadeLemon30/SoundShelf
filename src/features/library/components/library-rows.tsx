import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { TrackArtwork } from '@/components/ui/track-artwork';
import { AppIcon } from '@/components/ui/app-icon';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { LibraryAlbum, LibraryArtist, LibraryTrack } from '../types';

type LibraryTrackRowProps = {
  track: LibraryTrack;
  onPress?: () => void;
  isCurrent?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
};

export function LibraryTrackRow({ track, onPress, isCurrent = false, isFavorite = false, onToggleFavorite }: LibraryTrackRowProps) {
  const theme = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const toggleFavoriteFromMenu = () => {
    closeMenu();
    onToggleFavorite?.();
  };

  const artworkArea = (
    <View style={styles.artworkWrap}>
      <TrackArtwork decorative size={48} uri={track.uri} />
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
      <ThemedText numberOfLines={1} themeColor="textMuted" style={styles.trackSub}>
        {[track.artist, track.album].filter((value): value is string => Boolean(value)).join(' · ') || track.filename}
      </ThemedText>
    </View>
  );

  const menuButton = (
    <Pressable
      accessibilityHint="Opens actions for this song."
      accessibilityLabel={`More actions for ${track.title}`}
      accessibilityRole="button"
      hitSlop={12}
      onPress={() => setMenuOpen(true)}
      style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
      <AppIcon name="more" size={22} color={theme.textMuted} />
    </Pressable>
  );

  const menu = (
    <Modal
      animationType="fade"
      onRequestClose={closeMenu}
      transparent
      visible={menuOpen}>
      <Pressable
        accessibilityLabel="Close song actions"
        accessibilityRole="button"
        onPress={closeMenu}
        style={styles.menuBackdrop}>
        <View
          accessibilityViewIsModal
          importantForAccessibility="yes"
          style={[styles.menuCard, { backgroundColor: theme.surfaceRaised, borderColor: theme.outline }]}>
          <ThemedText numberOfLines={1} style={styles.menuTitle}>{track.title}</ThemedText>
          <ThemedText numberOfLines={1} themeColor="textMuted" style={styles.menuSubtitle}>
            {[track.artist, track.album].filter((value): value is string => Boolean(value)).join(' · ') || track.filename}
          </ThemedText>

          {onToggleFavorite ? (
            <Pressable
              accessibilityLabel={`${isFavorite ? 'Remove' : 'Add'} ${track.title} ${isFavorite ? 'from' : 'to'} favorites`}
              accessibilityRole="button"
              onPress={toggleFavoriteFromMenu}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}>
              <AppIcon name={isFavorite ? 'favorite' : 'favoriteOutline'} size={22} color={isFavorite ? theme.accent : theme.text} />
              <ThemedText style={styles.menuItemText}>
                {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              </ThemedText>
            </Pressable>
          ) : (
            <View style={styles.menuItem}>
              <AppIcon name="more" size={22} color={theme.textMuted} />
              <ThemedText themeColor="textMuted" style={styles.menuItemText}>No actions available</ThemedText>
            </View>
          )}

          <Pressable
            accessibilityLabel="Cancel"
            accessibilityRole="button"
            onPress={closeMenu}
            style={({ pressed }) => [styles.menuItem, styles.menuCancel, pressed && styles.menuItemPressed]}>
            <ThemedText style={[styles.menuItemText, { color: theme.accent }]}>Cancel</ThemedText>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );

  if (!onPress) {
    return (
      <View style={styles.row}>
        {artworkArea}
        {textArea}
        {menuButton}
        {menu}
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
      {menuButton}
      {menu}
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
      <TrackArtwork decorative size={56} icon="album" uri={album.tracks[0]?.uri} />
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

export function LibraryArtistRow({ artist, onPress }: { artist: LibraryArtist; onPress: () => void }) {
  const theme = useTheme();
  const count = artist.tracks.length;
  return (
    <Pressable
      accessibilityLabel={`Open artist ${artist.name}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <TrackArtwork decorative size={56} icon="music" uri={artist.tracks[0]?.uri} />
      <View style={styles.details}>
        <ThemedText numberOfLines={1} style={styles.albumTitle}>{artist.name}</ThemedText>
        <ThemedText numberOfLines={1} themeColor="textMuted" style={styles.trackSub}>
          Artist · {count} song{count === 1 ? '' : 's'}
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
  trackTitle: { fontSize: 15, fontWeight: '500' },
  trackSub: { fontSize: 13 },
  albumTitle: { fontSize: 15, fontWeight: '600' },
  iconBtn: { padding: Spacing.one },
  pressed: { opacity: 0.65 },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    padding: Spacing.three,
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  menuTitle: { fontSize: 17, fontWeight: '700' },
  menuSubtitle: { fontSize: 13, marginBottom: Spacing.one },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 48,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    borderRadius: 10,
  },
  menuItemPressed: { opacity: 0.7 },
  menuItemText: { fontSize: 15, fontWeight: '500' },
  menuCancel: { justifyContent: 'center', marginTop: Spacing.one },
});
