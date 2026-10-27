import { useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { AppGradient } from '@/components/ui/app-gradient';
import { EmptyState } from '@/components/ui/empty-state';
import { MiniPlayer } from '@/components/ui/mini-player';
import { Screen } from '@/components/ui/screen';
import { AccentText, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LibraryAlbumRow, LibraryTrackRow } from '@/features/library/components/library-rows';
import { useLibrary } from '@/features/library/library-provider';
import type { LibraryAlbum, LibraryTrack } from '@/features/library/types';
import { usePersonalLibrary } from '@/features/personal-library/personal-library-provider';
import { usePlayback } from '@/features/playback/playback-provider';

type LibraryView = 'songs' | 'albums' | 'favorites';
type LibraryListItem = LibraryTrack | LibraryAlbum;

export default function LibraryScreen() {
  const theme = useTheme();
  const { status, tracks, albums, skippedAssetCount, errorMessage, needsRescan, permissionBlocked, scan } = useLibrary();
  const { currentTrack, playTrack } = usePlayback();
  const { favorites, isFavorite, toggleFavorite } = usePersonalLibrary();
  const [view, setView] = useState<LibraryView>('songs');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const isBusy = status === 'scanning';
  const isDenied = status === 'denied';
  const isBlocked = isDenied && permissionBlocked;
  const isScannedEmpty = status === 'ready' && tracks.length === 0;
  const selectedAlbum = albums.find((album) => album.id === selectedAlbumId) ?? null;
  const currentTrackId = currentTrack?.id ?? null;
  const listTracks = selectedAlbum ? selectedAlbum.tracks : view === 'songs' ? tracks : view === 'favorites' ? favorites : [];
  const isAlbumOverview = !selectedAlbum && view === 'albums';
  const data: LibraryListItem[] = isAlbumOverview ? albums : listTracks;

  const rescan = () => {
    setSelectedAlbumId(null);
    void scan();
  };

  const selectView = (next: LibraryView) => {
    setView(next);
    setSelectedAlbumId(null);
  };

  if (status !== 'ready' || tracks.length === 0) {
    return <Screen>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Library</ThemedText>
        <ThemedText themeColor="textMuted">Songs on this device, plus albums grouped by the folders Android reports. Tap a song to play it. Artist and embedded-tag data are not read yet.</ThemedText>
      </View>
      <View style={styles.emptyWrap}>
        <EmptyState title={isDenied ? 'Audio access is needed' : status === 'error' ? 'Library scan unavailable' : isBusy ? 'Scanning your music' : isScannedEmpty ? 'No music found' : 'No music scanned yet'} description={isDenied ? (isBlocked ? 'Audio access is turned off for SoundShelf. Open the app settings and allow music and audio access, then scan again.' : 'Allow audio access to let SoundShelf list music already on this device.') : errorMessage ?? (isBusy ? 'Reading local audio files. This can take a moment for larger libraries.' : isScannedEmpty ? 'The scan finished but found no audio on this device. Add music, then scan again.' : 'Nothing is read until you choose to scan your device music.')} />
        <Pressable accessibilityRole="button" accessibilityLabel={isBlocked ? 'Open SoundShelf app settings' : 'Scan device music library'} disabled={isBusy} onPress={isBlocked ? () => { void Linking.openSettings(); } : scan} style={({ pressed }) => [styles.scanButton, { backgroundColor: theme.accent }, (pressed || isBusy) && styles.pressed]}><ThemedText style={styles.scanLabel}>{isBusy ? 'Scanning music…' : isBlocked ? 'Open app settings' : isDenied ? 'Try audio access again' : isScannedEmpty ? 'Scan again' : 'Scan device music'}</ThemedText></Pressable>
      </View>
      <MiniPlayer />
    </Screen>;
  }

  const listLabel = selectedAlbum ? selectedAlbum.title.toLocaleUpperCase() : view === 'songs' ? `${tracks.length} SONG${tracks.length === 1 ? '' : 'S'}` : view === 'albums' ? `${albums.length} ALBUM${albums.length === 1 ? '' : 'S'}` : `${favorites.length} FAVORITE${favorites.length === 1 ? '' : 'S'}`;

  return <AppGradient>
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatList
      data={data}
      keyExtractor={(item) => `${isAlbumOverview ? 'album' : 'track'}-${item.id}`}
      renderItem={({ item }) => isAlbumOverview ? <LibraryAlbumRow album={item as LibraryAlbum} onPress={() => setSelectedAlbumId((item as LibraryAlbum).id)} /> : <LibraryTrackRow track={item as LibraryTrack} isCurrent={item.id === currentTrackId} isFavorite={isFavorite(item.id)} onToggleFavorite={() => { void toggleFavorite(item as LibraryTrack); }} onPress={() => playTrack(item as LibraryTrack, listTracks)} />}
      ListHeaderComponent={<View style={styles.listHeaderContent}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Library</ThemedText>
          <ThemedText themeColor="textMuted">Songs on this device, plus albums grouped by the folders Android reports. Tap a song to play it. Artist and embedded-tag data are not read yet.</ThemedText>
        </View>
        <View style={[styles.segmented, { backgroundColor: theme.surfaceRaised }]}>
          {(['songs', 'albums', 'favorites'] as const).map((option) => <Pressable accessibilityRole="button" accessibilityState={{ selected: view === option }} key={option} onPress={() => selectView(option)} style={[styles.segment, view === option && { backgroundColor: theme.surface }]}><ThemedText themeColor={view === option ? 'text' : 'textMuted'} type="smallBold">{option === 'songs' ? 'Songs' : option === 'albums' ? 'Albums' : 'Favorites'}</ThemedText></Pressable>)}
        </View>
        {needsRescan ? <View accessibilityRole="alert" style={[styles.rescanNotice, { backgroundColor: theme.accentMuted }]}><ThemedText type="smallBold">Your device music changed</ThemedText><ThemedText themeColor="textMuted" type="small">Rescan to update this list.</ThemedText></View> : null}
        <View style={styles.listHeader}>
          <ThemedText numberOfLines={1} style={styles.listLabel} type="smallBold" themeColor="textMuted">{listLabel}</ThemedText>
          {selectedAlbum ? <Pressable accessibilityRole="button" onPress={() => setSelectedAlbumId(null)}><ThemedText type="smallBold" themeColor="accent">All albums</ThemedText></Pressable> : <Pressable accessibilityRole="button" onPress={rescan}><ThemedText type="smallBold" themeColor="accent">Rescan</ThemedText></Pressable>}
        </View>
      </View>}
      ListEmptyComponent={<EmptyState title={isAlbumOverview ? 'No albums found' : selectedAlbum ? 'This album is empty' : 'No favorites yet'} description={isAlbumOverview ? 'Android did not report any album folders for these songs.' : selectedAlbum ? 'Rescan your library if this album changed on your device.' : 'Use the heart beside any song to keep it here.'} />}
      ListFooterComponent={<View style={styles.footer}>{skippedAssetCount > 0 ? <ThemedText themeColor="textMuted" type="small">{skippedAssetCount} audio item{skippedAssetCount === 1 ? '' : 's'} could not be opened and {skippedAssetCount === 1 ? 'was' : 'were'} left out.</ThemedText> : null}<MiniPlayer /></View>}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={7}
        removeClippedSubviews
      />
    </SafeAreaView>
  </AppGradient>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  listContent: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.three, paddingBottom: BottomTabInset + Spacing.six },
  listHeaderContent: { gap: Spacing.two },
  header: { gap: Spacing.one, paddingTop: Spacing.two },
  title: { fontSize: 38, lineHeight: 44 },
  segmented: { flexDirection: 'row', borderRadius: 12, padding: Spacing.half, gap: Spacing.half },
  segment: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: 10 },
  emptyWrap: { alignItems: 'center' },
  scanButton: { borderRadius: 14, paddingHorizontal: Spacing.three, paddingVertical: 12 },
  scanLabel: { color: AccentText, fontWeight: '700' },
  pressed: { opacity: 0.78 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.two, paddingBottom: Spacing.one },
  listLabel: { flex: 1 },
  rescanNotice: { gap: 2, borderRadius: 12, padding: Spacing.two },
  footer: { gap: Spacing.two, paddingTop: Spacing.four },
});
