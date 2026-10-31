import type { SQLiteDatabase } from 'expo-sqlite';

import type { LibraryTrack } from '@/features/library/types';
import type { RepeatMode } from '@/features/playback/types';

export type Playlist = { id: string; name: string; createdAt: number; updatedAt: number; tracks: LibraryTrack[] };
export type PlaybackCheckpoint = { track: LibraryTrack; queue: LibraryTrack[]; index: number; repeat: RepeatMode; shuffle: boolean; positionSeconds: number };

type StoredTrack = {
  track_id: string; title: string; filename: string; uri: string; album_id: string | null;
  artist: string | null; album: string | null;
  duration_ms: number | null; creation_time: number | null; modification_time: number | null;
};

const trackValues = (track: LibraryTrack) => [track.id, track.title, track.filename, track.uri, track.artist, track.album, track.albumId, track.durationMs, track.creationTime, track.modificationTime] as const;
const fromStored = (row: StoredTrack): LibraryTrack => ({ id: row.track_id, title: row.title, filename: row.filename, uri: row.uri, artist: row.artist, album: row.album, albumId: row.album_id, durationMs: row.duration_ms, creationTime: row.creation_time, modificationTime: row.modification_time });
const makeId = () => `playlist-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export async function listFavorites(db: SQLiteDatabase) {
  return (await db.getAllAsync<StoredTrack>('SELECT * FROM favorites ORDER BY added_at DESC')).map(fromStored);
}
export async function isFavorite(db: SQLiteDatabase, trackId: string) {
  return Boolean(await db.getFirstAsync('SELECT 1 FROM favorites WHERE track_id = ? LIMIT 1', trackId));
}
export async function setFavorite(db: SQLiteDatabase, track: LibraryTrack, favorite: boolean) {
  if (!favorite) { await db.runAsync('DELETE FROM favorites WHERE track_id = ?', track.id); return; }
  await db.runAsync(`INSERT INTO favorites (track_id, title, filename, uri, artist, album, album_id, duration_ms, creation_time, modification_time, added_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(track_id) DO UPDATE SET title=excluded.title, filename=excluded.filename, uri=excluded.uri, artist=excluded.artist, album=excluded.album, album_id=excluded.album_id, duration_ms=excluded.duration_ms, creation_time=excluded.creation_time, modification_time=excluded.modification_time`, ...trackValues(track), Date.now());
}
export async function listRecentlyPlayed(db: SQLiteDatabase, limit = 30) {
  return (await db.getAllAsync<StoredTrack>('SELECT * FROM recently_played ORDER BY played_at DESC LIMIT ?', limit)).map(fromStored);
}
export async function recordRecentlyPlayed(db: SQLiteDatabase, track: LibraryTrack) {
  await db.runAsync(`INSERT INTO recently_played (track_id, title, filename, uri, artist, album, album_id, duration_ms, creation_time, modification_time, played_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(track_id) DO UPDATE SET title=excluded.title, filename=excluded.filename, uri=excluded.uri, artist=excluded.artist, album=excluded.album, album_id=excluded.album_id, duration_ms=excluded.duration_ms, creation_time=excluded.creation_time, modification_time=excluded.modification_time, played_at=excluded.played_at`, ...trackValues(track), Date.now());
}
export async function listPlaylists(db: SQLiteDatabase): Promise<Playlist[]> {
  const rows = await db.getAllAsync<{ id: string; name: string; created_at: number; updated_at: number }>('SELECT * FROM playlists ORDER BY updated_at DESC');
  return Promise.all(rows.map(async (playlist) => ({ id: playlist.id, name: playlist.name, createdAt: playlist.created_at, updatedAt: playlist.updated_at, tracks: (await db.getAllAsync<StoredTrack>('SELECT * FROM playlist_items WHERE playlist_id = ? ORDER BY position', playlist.id)).map(fromStored) })));
}
export async function createPlaylist(db: SQLiteDatabase, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Give the playlist a name.');
  const now = Date.now(); const id = makeId();
  await db.runAsync('INSERT INTO playlists (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)', id, trimmed, now, now);
  return id;
}
export async function deletePlaylist(db: SQLiteDatabase, id: string) { await db.runAsync('DELETE FROM playlists WHERE id = ?', id); }
export async function addTrackToPlaylist(db: SQLiteDatabase, playlistId: string, track: LibraryTrack) {
  const position = (await db.getFirstAsync<{ next_position: number }>('SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM playlist_items WHERE playlist_id = ?', playlistId))?.next_position ?? 0;
  await db.runAsync(`INSERT INTO playlist_items (playlist_id, track_id, title, filename, uri, artist, album, album_id, duration_ms, creation_time, modification_time, position, added_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(playlist_id, track_id) DO UPDATE SET title=excluded.title, filename=excluded.filename, uri=excluded.uri, artist=excluded.artist, album=excluded.album, album_id=excluded.album_id, duration_ms=excluded.duration_ms, creation_time=excluded.creation_time, modification_time=excluded.modification_time`, playlistId, ...trackValues(track), position, Date.now());
  await db.runAsync('UPDATE playlists SET updated_at = ? WHERE id = ?', Date.now(), playlistId);
}
export async function removeTrackFromPlaylist(db: SQLiteDatabase, playlistId: string, trackId: string) {
  await db.runAsync('DELETE FROM playlist_items WHERE playlist_id = ? AND track_id = ?', playlistId, trackId);
  // Reorder remaining items to avoid gaps
  const items = await db.getAllAsync<{ id: number }>('SELECT id FROM playlist_items WHERE playlist_id = ? ORDER BY position', playlistId);
  for (let i = 0; i < items.length; i += 1) {
    await db.runAsync('UPDATE playlist_items SET position = ? WHERE id = ?', i, items[i].id);
  }
  await db.runAsync('UPDATE playlists SET updated_at = ? WHERE id = ?', Date.now(), playlistId);
}

export async function reorderPlaylistTracks(db: SQLiteDatabase, playlistId: string, trackIdsInOrder: string[]) {
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < trackIdsInOrder.length; i += 1) {
      await db.runAsync('UPDATE playlist_items SET position = ? WHERE playlist_id = ? AND track_id = ?', i, playlistId, trackIdsInOrder[i]);
    }
    await db.runAsync('UPDATE playlists SET updated_at = ? WHERE id = ?', Date.now(), playlistId);
  });
}

export async function moveTrackInPlaylist(db: SQLiteDatabase, playlistId: string, trackId: string, direction: 'up' | 'down') {
  const items = await db.getAllAsync<{ id: number; track_id: string; position: number }>('SELECT id, track_id, position FROM playlist_items WHERE playlist_id = ? ORDER BY position', playlistId);
  const currentIndex = items.findIndex((item) => item.track_id === trackId);
  if (currentIndex === -1) return;
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= items.length) return;

  const current = items[currentIndex];
  const target = items[targetIndex];

  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE playlist_items SET position = ? WHERE id = ?', target.position, current.id);
    await db.runAsync('UPDATE playlist_items SET position = ? WHERE id = ?', current.position, target.id);
    await db.runAsync('UPDATE playlists SET updated_at = ? WHERE id = ?', Date.now(), playlistId);
  });
}
export async function saveCheckpoint(db: SQLiteDatabase, checkpoint: PlaybackCheckpoint) {
  const { track } = checkpoint;
  await db.runAsync(`INSERT INTO playback_checkpoint (singleton, track_id, title, filename, uri, artist, album, album_id, duration_ms, creation_time, modification_time, queue_json, queue_index, repeat_mode, shuffle_enabled, position_seconds, saved_at)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(singleton) DO UPDATE SET track_id=excluded.track_id, title=excluded.title, filename=excluded.filename, uri=excluded.uri, artist=excluded.artist, album=excluded.album, album_id=excluded.album_id, duration_ms=excluded.duration_ms, creation_time=excluded.creation_time, modification_time=excluded.modification_time, queue_json=excluded.queue_json, queue_index=excluded.queue_index, repeat_mode=excluded.repeat_mode, shuffle_enabled=excluded.shuffle_enabled, position_seconds=excluded.position_seconds, saved_at=excluded.saved_at`, ...trackValues(track), JSON.stringify(checkpoint.queue), checkpoint.index, checkpoint.repeat, checkpoint.shuffle ? 1 : 0, checkpoint.positionSeconds, Date.now());
}
export async function loadCheckpoint(db: SQLiteDatabase): Promise<PlaybackCheckpoint | null> {
  const row = await db.getFirstAsync<StoredTrack & { queue_json: string; queue_index: number; repeat_mode: RepeatMode; shuffle_enabled: number; position_seconds: number }>('SELECT * FROM playback_checkpoint WHERE singleton = 1');
  if (!row) return null;
  try { const queue = JSON.parse(row.queue_json) as LibraryTrack[]; return { track: fromStored(row), queue: queue.length ? queue : [fromStored(row)], index: Math.max(0, Math.min(row.queue_index, queue.length - 1)), repeat: row.repeat_mode, shuffle: Boolean(row.shuffle_enabled), positionSeconds: Math.max(0, row.position_seconds) }; } catch { return null; }
}

export async function pruneStaleTracks(db: SQLiteDatabase, validTrackIds: string[]) {
  if (validTrackIds.length === 0) {
    // If library is empty, clear personal library references to avoid broken state
    await db.runAsync('DELETE FROM playlist_items');
    await db.runAsync('DELETE FROM favorites');
    await db.runAsync('DELETE FROM recently_played');
    await db.runAsync('DELETE FROM playback_checkpoint');
    return;
  }
  const placeholders = validTrackIds.map(() => '?').join(',');
  // Remove favorites/recent that are no longer in library
  await db.runAsync(`DELETE FROM favorites WHERE track_id NOT IN (${placeholders})`, ...validTrackIds);
  await db.runAsync(`DELETE FROM recently_played WHERE track_id NOT IN (${placeholders})`, ...validTrackIds);
  // Remove playlist items not in library and reindex affected playlists
  const staleItems = await db.getAllAsync<{ playlist_id: string }>(`SELECT DISTINCT playlist_id FROM playlist_items WHERE track_id NOT IN (${placeholders})`, ...validTrackIds);
  await db.runAsync(`DELETE FROM playlist_items WHERE track_id NOT IN (${placeholders})`, ...validTrackIds);
  for (const { playlist_id } of staleItems) {
    const items = await db.getAllAsync<{ id: number }>('SELECT id FROM playlist_items WHERE playlist_id = ? ORDER BY position', playlist_id);
    for (let i = 0; i < items.length; i += 1) {
      await db.runAsync('UPDATE playlist_items SET position = ? WHERE id = ?', i, items[i].id);
    }
    await db.runAsync('UPDATE playlists SET updated_at = ? WHERE id = ?', Date.now(), playlist_id);
  }
  // Clear checkpoint if track no longer valid
  const checkpoint = await db.getFirstAsync<{ track_id: string }>('SELECT track_id FROM playback_checkpoint WHERE singleton = 1');
  if (checkpoint && !validTrackIds.includes(checkpoint.track_id)) {
    await db.runAsync('DELETE FROM playback_checkpoint WHERE singleton = 1');
  }
}
