import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { AppGradient } from '@/components/ui/app-gradient';
import { ArtworkPlaceholder } from '@/components/ui/artwork-placeholder';
import { EmptyState } from '@/components/ui/empty-state';
import { BottomTabInset, MaxContentWidth, MiniPlayerInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LibraryTrackRow } from '@/features/library/components/library-rows';
import { usePersonalLibrary } from '@/features/personal-library/personal-library-provider';
import { usePlayback } from '@/features/playback/playback-provider';
import type { LibraryTrack } from '@/features/library/types';

type Item =
  | { type: 'title' }
  | { type: 'createHeader' }
  | { type: 'createInput' }
  | { type: 'playlistsHeader' }
  | { type: 'noPlaylists' }
  | { type: 'playlist'; id: string; name: string; count: number }
  | { type: 'tracksHeader'; label: string; hasBack: boolean }
  | { type: 'track'; data: LibraryTrack; playlistId: string | null }
  | { type: 'noTracks'; isPlaylist: boolean }
  | { type: 'recentHeader' }
  | { type: 'recentTrack'; data: LibraryTrack }
  | { type: 'noRecent' };

export default function PersonalLibraryScreen() {
  const theme = useTheme();
  const { currentTrack, playTrack } = usePlayback();
  const { favorites, recentlyPlayed, playlists, createPlaylist, deletePlaylist, addToPlaylist, removeFromPlaylist } = usePersonalLibrary();
  const [name, setName] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) ?? null;
  const tracks = selectedPlaylist ? selectedPlaylist.tracks : favorites;

  const create = async () => {
    try {
      await createPlaylist(name);
      setName('');
    } catch (error) {
      Alert.alert('Could not create playlist', error instanceof Error ? error.message : 'Try a different name.');
    }
  };

  const listData: Item[] = [
    { type: 'title' },
    { type: 'createHeader' },
    { type: 'createInput' },
    { type: 'playlistsHeader' },
    ...(playlists.length === 0
      ? [{ type: 'noPlaylists' } as Item]
      : playlists.map((p): Item => ({ type: 'playlist', id: p.id, name: p.name, count: p.tracks.length }))),
    {
      type: 'tracksHeader',
      label: selectedPlaylist ? selectedPlaylist.name.toLocaleUpperCase() : 'FAVORITES',
      hasBack: !!selectedPlaylist,
    },
    ...(tracks.length === 0
      ? [{ type: 'noTracks', isPlaylist: !!selectedPlaylist } as Item]
      : tracks.map((data): Item => ({ type: 'track', data, playlistId: selectedPlaylistId }))),
    { type: 'recentHeader' },
    ...(recentlyPlayed.length === 0
      ? [{ type: 'noRecent' } as Item]
      : recentlyPlayed.slice(0, 5).map((data): Item => ({ type: 'recentTrack', data }))),
  ];

  const renderItem = ({ item }: { item: Item }) => {
    switch (item.type) {
      case 'title':
        return <ThemedText style={styles.screenTitle}>My music</ThemedText>;

      case 'createHeader':
        return <ThemedText style={styles.sectionLabel}>NEW PLAYLIST</ThemedText>;

      case 'createInput':
        return (
          <View style={[styles.createRow, { backgroundColor: theme.surfaceRaised }]}>
            <TextInput
              accessibilityLabel="New playlist name"
              value={name}
              onChangeText={setName}
              placeholder="Playlist name"
              placeholderTextColor={theme.textMuted}
              returnKeyType="done"
              onSubmitEditing={() => { void create(); }}
              style={[styles.input, { color: theme.text }]}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => { void create(); }}
              style={({ pressed }) => [styles.createBtn, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
              <ThemedText style={styles.createBtnText}>Create</ThemedText>
            </Pressable>
          </View>
        );

      case 'playlistsHeader':
        return <ThemedText style={styles.sectionLabel}>PLAYLISTS</ThemedText>;

      case 'noPlaylists':
        return (
          <ThemedText themeColor="textMuted" style={styles.emptyHint}>
            Create a playlist to organise your favourites.
          </ThemedText>
        );

      case 'playlist': {
        const playlist = item;
        return (
          <View style={[styles.playlistCard, { backgroundColor: theme.surfaceRaised }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open playlist ${playlist.name}`}
              onPress={() => setSelectedPlaylistId(playlist.id)}
              style={({ pressed }) => [styles.playlistOpenArea, pressed && styles.pressed]}>
              <ArtworkPlaceholder size={52} label="♫" style={styles.playlistArtwork} />
              <View style={styles.playlistInfo}>
                <ThemedText style={styles.playlistName}>{playlist.name}</ThemedText>
                <ThemedText style={styles.playlistCount} themeColor="textMuted">
                  {playlist.count} song{playlist.count === 1 ? '' : 's'}
                </ThemedText>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete playlist ${playlist.name}`}
              hitSlop={12}
              onPress={() =>
                Alert.alert('Delete playlist?', `Remove "${playlist.name}"?`, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      void deletePlaylist(playlist.id);
                      if (selectedPlaylistId === playlist.id) setSelectedPlaylistId(null);
                    },
                  },
                ])
              }>
              <ThemedText style={{ color: theme.danger, fontSize: 13 }}>Delete</ThemedText>
            </Pressable>
          </View>
        );
      }

      case 'tracksHeader':
        return (
          <View style={styles.listHeader}>
            <ThemedText style={styles.sectionLabel}>{item.label}</ThemedText>
            {item.hasBack && (
              <Pressable accessibilityRole="button" onPress={() => setSelectedPlaylistId(null)}>
                <ThemedText style={{ fontSize: 13, color: theme.accent }}>All favorites</ThemedText>
              </Pressable>
            )}
          </View>
        );

      case 'track': {
        const { data: trackData, playlistId } = item;
        return (
          <View>
            <LibraryTrackRow
              track={trackData}
              isCurrent={currentTrack?.id === trackData.id}
              onPress={() => playTrack(trackData, tracks)}
            />
            {playlistId ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => { void removeFromPlaylist(playlistId, trackData.id); }}>
                <ThemedText style={[styles.removeBtn, { color: theme.danger }]}>Remove from playlist</ThemedText>
              </Pressable>
            ) : playlists.length > 0 ? (
              <View style={styles.addRow}>
                {playlists.map((pl) => (
                  <Pressable
                    accessibilityRole="button"
                    key={pl.id}
                    onPress={() => { void addToPlaylist(pl.id, trackData); }}>
                    <ThemedText style={{ fontSize: 13, color: theme.accent }}>+ {pl.name}</ThemedText>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        );
      }

      case 'noTracks':
        return (
          <EmptyState
            title={item.isPlaylist ? 'This playlist is empty' : 'No favorites yet'}
            description={
              item.isPlaylist
                ? 'Choose a favorite below, then add it to this playlist.'
                : 'Tap hearts in your library to save songs here.'
            }
          />
        );

      case 'recentHeader':
        return <ThemedText style={styles.sectionLabel}>RECENTLY PLAYED</ThemedText>;

      case 'recentTrack':
        return (
          <LibraryTrackRow
            track={item.data}
            isCurrent={currentTrack?.id === item.data.id}
            onPress={() => playTrack(item.data, recentlyPlayed)}
          />
        );

      case 'noRecent':
        return (
          <ThemedText themeColor="textMuted" style={styles.emptyHint}>
            Songs you play will appear here.
          </ThemedText>
        );

    }
  };

  return (
    <AppGradient>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <FlatList
          data={listData}
          keyExtractor={(item, i) => `${item.type}-${i}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + MiniPlayerInset + Spacing.three,
    gap: Spacing.three,
  },
  screenTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#B3B3B3',
    marginBottom: -Spacing.one,
  },
  emptyHint: { fontSize: 14, lineHeight: 20 },
  // Create row
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: Spacing.two,
    gap: Spacing.two,
  },
  input: { flex: 1, minHeight: 48, fontSize: 15 },
  createBtn: { paddingVertical: 10, paddingHorizontal: Spacing.three, borderRadius: 24 },
  createBtnText: { fontWeight: '700', fontSize: 14, color: '#000000' },
  // Playlist card
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  playlistOpenArea: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  playlistArtwork: { borderRadius: 6 },
  playlistInfo: { flex: 1, gap: 3 },
  playlistName: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  playlistCount: { fontSize: 13 },
  // Track actions
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  removeBtn: { fontSize: 13, paddingLeft: 60, paddingBottom: Spacing.one },
  addRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, paddingLeft: 60, paddingBottom: Spacing.one },
  pressed: { opacity: 0.7 },
});
