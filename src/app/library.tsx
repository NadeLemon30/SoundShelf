import { useState } from 'react';
import { FlatList, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { AppGradient } from '@/components/ui/app-gradient';
import { EmptyState } from '@/components/ui/empty-state';
import { MiniPlayer } from '@/components/ui/mini-player';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LibraryAlbumRow, LibraryTrackRow } from '@/features/library/components/library-rows';
import { useLibrary } from '@/features/library/library-provider';
import type { LibraryAlbum, LibraryTrack } from '@/features/library/types';
import { usePersonalLibrary } from '@/features/personal-library/personal-library-provider';
import { usePlayback } from '@/features/playback/playback-provider';

type LibraryView = 'songs' | 'albums' | 'favorites';
type LibraryListItem = LibraryTrack | LibraryAlbum;

const FILTERS: { key: LibraryView; label: string }[] = [
  { key: 'songs', label: 'Songs' },
  { key: 'albums', label: 'Albums' },
  { key: 'favorites', label: 'Favorites' },
];

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
  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId) ?? null;
  const currentTrackId = currentTrack?.id ?? null;
  const listTracks = selectedAlbum ? selectedAlbum.tracks : view === 'songs' ? tracks : view === 'favorites' ? favorites : [];
  const isAlbumOverview = !selectedAlbum && view === 'albums';
  const data: LibraryListItem[] = isAlbumOverview ? albums : listTracks;

  const rescan = () => { setSelectedAlbumId(null); void scan(); };
  const selectView = (next: LibraryView) => { setView(next); setSelectedAlbumId(null); };

  if (status !== 'ready' || tracks.length === 0) {
    return (
      <AppGradient>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <View style={styles.emptyPage}>
            <ThemedText style={styles.screenTitle}>Your Library</ThemedText>
            <View style={styles.emptyContent}>
              <EmptyState
                title={
                  isDenied ? 'Audio access needed'
                  : status === 'error' ? 'Scan unavailable'
                  : isBusy ? 'Scanning…'
                  : isScannedEmpty ? 'No music found'
                  : 'Library empty'
                }
                description={
                  isDenied
                    ? (isBlocked ? 'Allow audio access in app settings.' : 'Allow audio access to find music on this device.')
                    : errorMessage ?? (
                        isBusy ? 'Reading local audio files…'
                        : isScannedEmpty ? 'No audio found. Add music and scan again.'
                        : 'Scan your device to find music.'
                      )
                }
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isBlocked ? 'Open SoundShelf app settings' : 'Scan device music library'}
                disabled={isBusy}
                onPress={isBlocked ? () => { void Linking.openSettings(); } : scan}
                style={({ pressed }) => [styles.greenBtn, { backgroundColor: theme.accent }, (pressed || isBusy) && styles.pressed]}>
                <ThemedText style={styles.greenBtnText}>
                  {isBusy ? 'Scanning…' : isBlocked ? 'Open settings' : isDenied ? 'Allow audio access' : isScannedEmpty ? 'Scan again' : 'Scan music'}
                </ThemedText>
              </Pressable>
            </View>
            <View style={styles.emptyFooter}><MiniPlayer /></View>
          </View>
        </SafeAreaView>
      </AppGradient>
    );
  }

  const listLabel = selectedAlbum
    ? selectedAlbum.title
    : view === 'songs'
    ? `${tracks.length} song${tracks.length === 1 ? '' : 's'}`
    : view === 'albums'
    ? `${albums.length} album${albums.length === 1 ? '' : 's'}`
    : `${favorites.length} favorite${favorites.length === 1 ? '' : 's'}`;

  const ListHeader = (
    <View style={styles.listHeaderContent}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <ThemedText style={styles.screenTitle}>Your Library</ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Rescan music library"
          onPress={rescan}
          hitSlop={12}
          style={({ pressed }) => pressed && styles.pressed}>
          <ThemedText style={[styles.rescanIcon, { color: theme.textMuted }]}>⟳</ThemedText>
        </Pressable>
      </View>

      {/* Filter pills (horizontal scroll) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        keyboardShouldPersistTaps="handled">
        {selectedAlbum ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setSelectedAlbumId(null)}
            style={[styles.filterPill, { backgroundColor: '#FFFFFF' }]}>
            <ThemedText style={[styles.filterPillText, { color: '#000000' }]}>← {selectedAlbum.title}</ThemedText>
          </Pressable>
        ) : (
          FILTERS.map(({ key, label }) => {
            const isActive = view === key;
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                onPress={() => selectView(key)}
                style={({ pressed }) => [
                  styles.filterPill,
                  isActive
                    ? { backgroundColor: theme.accent }
                    : { backgroundColor: theme.surfaceRaised },
                  pressed && styles.pressed,
                ]}>
                <ThemedText style={[styles.filterPillText, { color: isActive ? '#000000' : '#FFFFFF' }]}>
                  {label}
                </ThemedText>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Rescan banner */}
      {needsRescan ? (
        <View accessibilityRole="alert" style={[styles.rescanBanner, { backgroundColor: theme.surfaceRaised }]}>
          <ThemedText style={styles.rescanBannerText}>Library changed</ThemedText>
          <Pressable onPress={rescan}>
            <ThemedText style={{ fontSize: 13, color: theme.accent }}>Rescan</ThemedText>
          </Pressable>
        </View>
      ) : null}

      {/* Count label */}
      <ThemedText style={styles.listMetaText}>{listLabel.toUpperCase()}</ThemedText>
    </View>
  );

  return (
    <AppGradient>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <FlatList
          data={data}
          keyExtractor={(item) => `${isAlbumOverview ? 'album' : 'track'}-${item.id}`}
          renderItem={({ item }) =>
            isAlbumOverview ? (
              <LibraryAlbumRow album={item as LibraryAlbum} onPress={() => setSelectedAlbumId((item as LibraryAlbum).id)} />
            ) : (
              <LibraryTrackRow
                track={item as LibraryTrack}
                isCurrent={item.id === currentTrackId}
                isFavorite={isFavorite(item.id)}
                onToggleFavorite={() => { void toggleFavorite(item as LibraryTrack); }}
                onPress={() => playTrack(item as LibraryTrack, listTracks)}
              />
            )
          }
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <EmptyState
              title={isAlbumOverview ? 'No albums' : selectedAlbum ? 'Album empty' : 'No favorites yet'}
              description={isAlbumOverview ? 'No album folders found.' : selectedAlbum ? 'Rescan if tracks changed.' : 'Tap ♡ beside a song to save it here.'}
            />
          }
          ListFooterComponent={
            <View style={styles.footer}>
              {skippedAssetCount > 0 ? (
                <ThemedText themeColor="textMuted" type="small">
                  {skippedAssetCount} file{skippedAssetCount === 1 ? '' : 's'} could not be opened and {skippedAssetCount === 1 ? 'was' : 'were'} skipped.
                </ThemedText>
              ) : null}
              <MiniPlayer />
            </View>
          }
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={7}
          removeClippedSubviews
        />
      </SafeAreaView>
    </AppGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  listContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.six,
  },
  listHeaderContent: { gap: Spacing.two, paddingBottom: Spacing.two },
  // Title row
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  screenTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  rescanIcon: { fontSize: 22 },
  // Filter pills
  filterRow: { flexDirection: 'row', gap: Spacing.two, paddingRight: Spacing.three },
  filterPill: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20 },
  filterPillText: { fontSize: 13, fontWeight: '600' },
  // Count
  listMetaText: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: '#B3B3B3', marginTop: Spacing.one },
  // Rescan banner
  rescanBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.two, borderRadius: 8 },
  rescanBannerText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  // Empty page layout
  emptyPage: { flex: 1, padding: Spacing.three, gap: Spacing.three },
  emptyContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  emptyFooter: { paddingBottom: Spacing.two },
  greenBtn: { paddingVertical: 12, paddingHorizontal: Spacing.four, borderRadius: 24 },
  greenBtnText: { fontWeight: '700', fontSize: 14, color: '#000000' },
  footer: { gap: Spacing.two, paddingTop: Spacing.four },
  pressed: { opacity: 0.7 },
});
