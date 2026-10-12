import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { MiniPlayer } from '@/components/ui/mini-player';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LibraryAlbumRow, LibraryTrackRow } from '@/features/library/components/library-rows';
import { useLibrary } from '@/features/library/library-provider';
import { usePlayback } from '@/features/playback/playback-provider';

type LibraryView = 'songs' | 'albums';

export default function LibraryScreen() {
  const theme = useTheme();
  const { status, tracks, albums, skippedAssetCount, errorMessage, needsRescan, permissionBlocked, scan } = useLibrary();
  const { currentTrack, playTrack } = usePlayback();
  const [view, setView] = useState<LibraryView>('songs');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const isBusy = status === 'scanning';
  const isDenied = status === 'denied';
  const isBlocked = isDenied && permissionBlocked;
  const isScannedEmpty = status === 'ready' && tracks.length === 0;
  const selectedAlbum = albums.find((album) => album.id === selectedAlbumId) ?? null;
  const currentTrackId = currentTrack?.id ?? null;
  const listTracks = selectedAlbum ? selectedAlbum.tracks : view === 'songs' ? tracks : [];

  const rescan = () => {
    setSelectedAlbumId(null);
    void scan();
  };

  const selectView = (next: LibraryView) => {
    setView(next);
    setSelectedAlbumId(null);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Library</ThemedText>
        <ThemedText themeColor="textMuted">Songs on this device, plus albums grouped by the folders Android reports. Tap a song to play it. Artist and embedded-tag data are not read yet.</ThemedText>
      </View>
      {status === 'ready' && tracks.length > 0 ? <View style={styles.content}>
        <View style={[styles.segmented, { backgroundColor: theme.surfaceRaised }]}>
          {(['songs', 'albums'] as const).map((option) => <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: view === option }}
            key={option}
            onPress={() => selectView(option)}
            style={[styles.segment, view === option && { backgroundColor: theme.surface }]}>
            <ThemedText themeColor={view === option ? 'text' : 'textMuted'} type="smallBold">{option === 'songs' ? 'Songs' : 'Albums'}</ThemedText>
          </Pressable>)}
        </View>
        {needsRescan ? <View accessibilityRole="alert" style={[styles.rescanNotice, { backgroundColor: theme.accentMuted }]}><ThemedText type="smallBold">Your device music changed</ThemedText><ThemedText themeColor="textMuted" type="small">Rescan to update this list.</ThemedText></View> : null}
        <View style={styles.list}>
          <View style={styles.listHeader}>
            <ThemedText numberOfLines={1} style={styles.listLabel} type="smallBold" themeColor="textMuted">{selectedAlbum ? selectedAlbum.title.toLocaleUpperCase() : view === 'songs' ? `${tracks.length} SONG${tracks.length === 1 ? '' : 'S'}` : `${albums.length} ALBUM${albums.length === 1 ? '' : 'S'}`}</ThemedText>
            {selectedAlbum ? <Pressable accessibilityRole="button" onPress={() => setSelectedAlbumId(null)}><ThemedText type="smallBold" themeColor="accent">All albums</ThemedText></Pressable> : <Pressable accessibilityRole="button" onPress={rescan}><ThemedText type="smallBold" themeColor="accent">Rescan</ThemedText></Pressable>}
          </View>
          {listTracks.map((track) => <LibraryTrackRow key={track.id} track={track} isCurrent={track.id === currentTrackId} onPress={() => playTrack(track, listTracks)} />)}
          {!selectedAlbum && view === 'albums' ? albums.map((album) => <LibraryAlbumRow album={album} key={album.id} onPress={() => setSelectedAlbumId(album.id)} />) : null}
        </View>
        {skippedAssetCount > 0 ? <ThemedText themeColor="textMuted" type="small">{skippedAssetCount} audio item{skippedAssetCount === 1 ? '' : 's'} could not be opened and {skippedAssetCount === 1 ? 'was' : 'were'} left out.</ThemedText> : null}
      </View> : <View style={styles.emptyWrap}>
        <EmptyState title={isDenied ? 'Audio access is needed' : status === 'error' ? 'Library scan unavailable' : isBusy ? 'Scanning your music' : isScannedEmpty ? 'No music found' : 'No music scanned yet'} description={isDenied ? (isBlocked ? 'Audio access is turned off for SoundShelf. Open the app settings and allow music and audio access, then scan again.' : 'Allow audio access to let SoundShelf list music already on this device.') : errorMessage ?? (isBusy ? 'Reading local audio files. This can take a moment for larger libraries.' : isScannedEmpty ? 'The scan finished but found no audio on this device. Add music, then scan again.' : 'Nothing is read until you choose to scan your device music.')} />
        <Pressable accessibilityRole="button" accessibilityLabel={isBlocked ? 'Open SoundShelf app settings' : 'Scan device music library'} disabled={isBusy} onPress={isBlocked ? () => { void Linking.openSettings(); } : scan} style={({ pressed }) => [styles.scanButton, { backgroundColor: theme.accent }, (pressed || isBusy) && styles.pressed]}><ThemedText style={styles.scanLabel}>{isBusy ? 'Scanning music…' : isBlocked ? 'Open app settings' : isDenied ? 'Try audio access again' : isScannedEmpty ? 'Scan again' : 'Scan device music'}</ThemedText></Pressable>
      </View>}
      <MiniPlayer />
    </Screen>
  );
}

const styles = StyleSheet.create({ header: { gap: Spacing.one, paddingTop: Spacing.two }, title: { fontSize: 38, lineHeight: 44 }, content: { gap: Spacing.two }, segmented: { flexDirection: 'row', borderRadius: 12, padding: Spacing.half, gap: Spacing.half }, segment: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: 10 }, emptyWrap: { alignItems: 'center' }, scanButton: { borderRadius: 14, paddingHorizontal: Spacing.three, paddingVertical: 12 }, scanLabel: { color: '#FFFFFF', fontWeight: '700' }, pressed: { opacity: 0.78 }, list: { gap: Spacing.one }, listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two, paddingBottom: Spacing.one }, listLabel: { flex: 1 }, rescanNotice: { gap: 2, borderRadius: 12, padding: Spacing.two } });
