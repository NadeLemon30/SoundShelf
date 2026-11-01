import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'soundshelf.db';
const DATABASE_VERSION = 3;

/** Creates the durable, offline-only personal-library schema. */
export async function migrateDatabase(db: SQLiteDatabase) {
  const version = (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version ?? 0;
  if (version >= DATABASE_VERSION) return;

  if (version === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE playlists (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL COLLATE NOCASE UNIQUE,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE playlist_items (
        id INTEGER PRIMARY KEY NOT NULL,
        playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
        track_id TEXT NOT NULL,
        title TEXT NOT NULL,
        filename TEXT NOT NULL,
        uri TEXT NOT NULL,
        album_id TEXT,
        duration_ms INTEGER,
        creation_time INTEGER,
        modification_time INTEGER,
        position INTEGER NOT NULL,
        added_at INTEGER NOT NULL,
        UNIQUE(playlist_id, track_id)
      );
      CREATE INDEX playlist_items_playlist_position ON playlist_items(playlist_id, position);
      CREATE TABLE favorites (
        track_id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        filename TEXT NOT NULL,
        uri TEXT NOT NULL,
        album_id TEXT,
        duration_ms INTEGER,
        creation_time INTEGER,
        modification_time INTEGER,
        added_at INTEGER NOT NULL
      );
      CREATE TABLE recently_played (
        track_id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        filename TEXT NOT NULL,
        uri TEXT NOT NULL,
        album_id TEXT,
        duration_ms INTEGER,
        creation_time INTEGER,
        modification_time INTEGER,
        played_at INTEGER NOT NULL
      );
      CREATE INDEX recently_played_played_at ON recently_played(played_at DESC);
      CREATE TABLE playback_checkpoint (
        singleton INTEGER PRIMARY KEY NOT NULL CHECK (singleton = 1),
        track_id TEXT NOT NULL,
        title TEXT NOT NULL,
        filename TEXT NOT NULL,
        uri TEXT NOT NULL,
        album_id TEXT,
        duration_ms INTEGER,
        creation_time INTEGER,
        modification_time INTEGER,
        queue_json TEXT NOT NULL,
        queue_index INTEGER NOT NULL,
        repeat_mode TEXT NOT NULL,
        shuffle_enabled INTEGER NOT NULL,
        position_seconds REAL NOT NULL,
        saved_at INTEGER NOT NULL
      );
    `);
  }
  if (version < 2) {
    await db.execAsync(`
      ALTER TABLE playlist_items ADD COLUMN artist TEXT;
      ALTER TABLE playlist_items ADD COLUMN album TEXT;
      ALTER TABLE favorites ADD COLUMN artist TEXT;
      ALTER TABLE favorites ADD COLUMN album TEXT;
      ALTER TABLE recently_played ADD COLUMN artist TEXT;
      ALTER TABLE recently_played ADD COLUMN album TEXT;
      ALTER TABLE playback_checkpoint ADD COLUMN artist TEXT;
      ALTER TABLE playback_checkpoint ADD COLUMN album TEXT;
    `);
  }
  if (version < 3) {
    // Phase 7 listening analytics (D-013). One row per listening attempt; the singleton open
    // session lets an interrupted listen survive process death without double counting.
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS listening_events (
        id INTEGER PRIMARY KEY NOT NULL,
        track_id TEXT NOT NULL,
        title TEXT NOT NULL,
        artist TEXT,
        album TEXT,
        started_at INTEGER NOT NULL,
        ended_at INTEGER NOT NULL,
        listened_ms INTEGER NOT NULL,
        duration_ms INTEGER,
        completed INTEGER NOT NULL,
        qualified INTEGER NOT NULL,
        ended_reason TEXT NOT NULL,
        local_date TEXT NOT NULL,
        utc_offset_minutes INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS listening_events_local_date ON listening_events(local_date, started_at);
      CREATE INDEX IF NOT EXISTS listening_events_track ON listening_events(track_id);
      CREATE TABLE IF NOT EXISTS open_listen_session (
        singleton INTEGER PRIMARY KEY NOT NULL CHECK (singleton = 1),
        track_id TEXT NOT NULL,
        title TEXT NOT NULL,
        artist TEXT,
        album TEXT,
        started_at INTEGER NOT NULL,
        last_observed_at INTEGER NOT NULL,
        last_position_ms INTEGER NOT NULL,
        last_playing INTEGER NOT NULL,
        listened_ms INTEGER NOT NULL,
        max_position_ms INTEGER NOT NULL,
        duration_ms INTEGER,
        completed INTEGER NOT NULL,
        local_date TEXT NOT NULL,
        utc_offset_minutes INTEGER NOT NULL
      );
    `);
  }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
