import { useSQLiteContext } from 'expo-sqlite';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useLibrary } from '@/features/library/library-provider';
import type { LibraryTrack } from '@/features/library/types';
import {
  addTrackToPlaylist,
  createPlaylist,
  deletePlaylist,
  listFavorites,
  listPlaylists,
  listRecentlyPlayed,
  loadCheckpoint,
  moveTrackInPlaylist,
  pruneStaleTracks,
  recordRecentlyPlayed,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
  saveCheckpoint,
  setFavorite,
  type PlaybackCheckpoint,
  type Playlist,
} from './repository';

type PersonalLibraryContextValue = {
  ready: boolean; favorites: LibraryTrack[]; recentlyPlayed: LibraryTrack[]; playlists: Playlist[];
  isFavorite: (trackId: string) => boolean; toggleFavorite: (track: LibraryTrack) => Promise<void>;
  createPlaylist: (name: string) => Promise<void>; deletePlaylist: (id: string) => Promise<void>;
  addToPlaylist: (playlistId: string, track: LibraryTrack) => Promise<void>; removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  moveTrackInPlaylist: (playlistId: string, trackId: string, direction: 'up' | 'down') => Promise<void>;
  reorderPlaylistTracks: (playlistId: string, trackIdsInOrder: string[]) => Promise<void>;
  pruneStaleTracks: (validTrackIds: string[]) => Promise<void>;
  recordPlay: (track: LibraryTrack) => Promise<void>; saveCheckpoint: (checkpoint: PlaybackCheckpoint) => Promise<void>; loadCheckpoint: () => Promise<PlaybackCheckpoint | null>;
};
const PersonalLibraryContext = createContext<PersonalLibraryContextValue | null>(null);

export function PersonalLibraryProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const { tracks: libraryTracks, status: libraryStatus } = useLibrary();
  const [ready, setReady] = useState(false);
  const [favorites, setFavorites] = useState<LibraryTrack[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<LibraryTrack[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const refresh = useCallback(async () => { const [nextFavorites, nextRecent, nextPlaylists] = await Promise.all([listFavorites(db), listRecentlyPlayed(db), listPlaylists(db)]); setFavorites(nextFavorites); setRecentlyPlayed(nextRecent); setPlaylists(nextPlaylists); }, [db]);
  const initialize = useCallback(async () => {
    try {
      await refresh();
    } finally {
      setReady(true);
    }
  }, [refresh]);
  useEffect(() => { void initialize(); }, [initialize]);

  // Prune stale tracks when library changes
  useEffect(() => {
    if (libraryStatus !== 'ready') return;
    const validIds = libraryTracks.map((t) => t.id);
    void pruneStaleTracks(db, validIds).then(() => refresh());
  }, [db, libraryStatus, libraryTracks, refresh]);
  const favoriteIds = useMemo(() => new Set(favorites.map((track) => track.id)), [favorites]);
  const toggleFavorite = useCallback(async (track: LibraryTrack) => { await setFavorite(db, track, !favoriteIds.has(track.id)); await refresh(); }, [db, favoriteIds, refresh]);
  const create = useCallback(async (name: string) => { await createPlaylist(db, name); await refresh(); }, [db, refresh]);
  const removePlaylist = useCallback(async (id: string) => { await deletePlaylist(db, id); await refresh(); }, [db, refresh]);
  const add = useCallback(async (id: string, track: LibraryTrack) => { await addTrackToPlaylist(db, id, track); await refresh(); }, [db, refresh]);
  const remove = useCallback(async (id: string, trackId: string) => { await removeTrackFromPlaylist(db, id, trackId); await refresh(); }, [db, refresh]);
  const move = useCallback(async (id: string, trackId: string, direction: 'up' | 'down') => { await moveTrackInPlaylist(db, id, trackId, direction); await refresh(); }, [db, refresh]);
  const reorder = useCallback(async (id: string, trackIdsInOrder: string[]) => { await reorderPlaylistTracks(db, id, trackIdsInOrder); await refresh(); }, [db, refresh]);
  const prune = useCallback(async (validTrackIds: string[]) => { await pruneStaleTracks(db, validTrackIds); await refresh(); }, [db, refresh]);
  const recordPlay = useCallback(async (track: LibraryTrack) => { await recordRecentlyPlayed(db, track); await refresh(); }, [db, refresh]);
  const value = useMemo(() => ({ ready, favorites, recentlyPlayed, playlists, isFavorite: (id: string) => favoriteIds.has(id), toggleFavorite, createPlaylist: create, deletePlaylist: removePlaylist, addToPlaylist: add, removeFromPlaylist: remove, moveTrackInPlaylist: move, reorderPlaylistTracks: reorder, pruneStaleTracks: prune, recordPlay, saveCheckpoint: (checkpoint: PlaybackCheckpoint) => saveCheckpoint(db, checkpoint), loadCheckpoint: () => loadCheckpoint(db) }), [add, create, db, favoriteIds, favorites, move, playlists, ready, recentlyPlayed, recordPlay, remove, removePlaylist, reorder, prune, toggleFavorite]);
  return <PersonalLibraryContext.Provider value={value}>{children}</PersonalLibraryContext.Provider>;
}
export function usePersonalLibrary() { const context = useContext(PersonalLibraryContext); if (!context) throw new Error('usePersonalLibrary must be used within PersonalLibraryProvider.'); return context; }
