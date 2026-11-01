import type { SQLiteDatabase } from 'expo-sqlite';

import type { DateRange, ListenSession, ListeningEvent } from './listening-model';

/** Persistence for Phase 7 listening analytics (schema version 3, see D-013). */

type EventRow = {
  track_id: string;
  title: string;
  artist: string | null;
  album: string | null;
  started_at: number;
  ended_at: number;
  listened_ms: number;
  duration_ms: number | null;
  completed: number;
  qualified: number;
  ended_reason: string;
  local_date: string;
  utc_offset_minutes: number;
};

type SessionRow = {
  track_id: string;
  title: string;
  artist: string | null;
  album: string | null;
  started_at: number;
  last_observed_at: number;
  last_position_ms: number;
  last_playing: number;
  listened_ms: number;
  max_position_ms: number;
  duration_ms: number | null;
  completed: number;
  local_date: string;
  utc_offset_minutes: number;
};

const eventFromRow = (row: EventRow): ListeningEvent => ({
  trackId: row.track_id,
  title: row.title,
  artist: row.artist,
  album: row.album,
  startedAt: row.started_at,
  endedAt: row.ended_at,
  listenedMs: row.listened_ms,
  durationMs: row.duration_ms,
  completed: Boolean(row.completed),
  qualified: Boolean(row.qualified),
  endedReason: row.ended_reason as ListeningEvent['endedReason'],
  localDate: row.local_date,
  utcOffsetMinutes: row.utc_offset_minutes,
});

export async function insertListeningEvent(db: SQLiteDatabase, event: ListeningEvent) {
  await db.runAsync(
    `INSERT INTO listening_events
      (track_id, title, artist, album, started_at, ended_at, listened_ms, duration_ms,
       completed, qualified, ended_reason, local_date, utc_offset_minutes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    event.trackId,
    event.title,
    event.artist,
    event.album,
    event.startedAt,
    event.endedAt,
    event.listenedMs,
    event.durationMs,
    event.completed ? 1 : 0,
    event.qualified ? 1 : 0,
    event.endedReason,
    event.localDate,
    event.utcOffsetMinutes,
  );
}

/** Events whose stored local date falls inside `range`, oldest first. */
export async function listListeningEvents(db: SQLiteDatabase, range: DateRange) {
  const rows = await db.getAllAsync<EventRow>(
    `SELECT * FROM listening_events
     WHERE local_date >= ? AND local_date <= ?
     ORDER BY started_at ASC`,
    range.startDate,
    range.endDate,
  );
  return rows.map(eventFromRow);
}

/** Total persisted attempts, used to distinguish "never played" from "nothing qualified". */
export async function countListeningEvents(db: SQLiteDatabase) {
  return (await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM listening_events'))?.total ?? 0;
}

/** Earliest stored local date, so the UI can explain how much history exists. */
export async function earliestListeningDate(db: SQLiteDatabase) {
  return (await db.getFirstAsync<{ local_date: string | null }>('SELECT MIN(local_date) AS local_date FROM listening_events'))?.local_date ?? null;
}

/** Upserts the single in-flight session used for restart recovery. */
export async function saveOpenListenSession(db: SQLiteDatabase, session: ListenSession) {
  await db.runAsync(
    `INSERT INTO open_listen_session
      (singleton, track_id, title, artist, album, started_at, last_observed_at, last_position_ms,
       last_playing, listened_ms, max_position_ms, duration_ms, completed, local_date, utc_offset_minutes)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(singleton) DO UPDATE SET
       track_id = excluded.track_id,
       title = excluded.title,
       artist = excluded.artist,
       album = excluded.album,
       started_at = excluded.started_at,
       last_observed_at = excluded.last_observed_at,
       last_position_ms = excluded.last_position_ms,
       last_playing = excluded.last_playing,
       listened_ms = excluded.listened_ms,
       max_position_ms = excluded.max_position_ms,
       duration_ms = excluded.duration_ms,
       completed = excluded.completed,
       local_date = excluded.local_date,
       utc_offset_minutes = excluded.utc_offset_minutes`,
    session.trackId,
    session.title,
    session.artist,
    session.album,
    session.startedAt,
    session.lastObservedAt,
    session.lastPositionMs,
    session.lastPlaying ? 1 : 0,
    session.listenedMs,
    session.maxPositionMs,
    session.durationMs,
    session.completed ? 1 : 0,
    session.localDate,
    session.utcOffsetMinutes,
  );
}

export async function loadOpenListenSession(db: SQLiteDatabase): Promise<ListenSession | null> {
  const row = await db.getFirstAsync<SessionRow>('SELECT * FROM open_listen_session WHERE singleton = 1');
  if (!row) {
    return null;
  }
  return {
    trackId: row.track_id,
    title: row.title,
    artist: row.artist,
    album: row.album,
    durationMs: row.duration_ms,
    startedAt: row.started_at,
    lastObservedAt: row.last_observed_at,
    lastPositionMs: row.last_position_ms,
    lastPlaying: Boolean(row.last_playing),
    listenedMs: row.listened_ms,
    maxPositionMs: row.max_position_ms,
    completed: Boolean(row.completed),
    localDate: row.local_date,
    utcOffsetMinutes: row.utc_offset_minutes,
  };
}

export async function clearOpenListenSession(db: SQLiteDatabase) {
  await db.runAsync('DELETE FROM open_listen_session WHERE singleton = 1');
}

/** Deletes every stored listen. Used by the explicit Settings privacy action. */
export async function clearListeningHistory(db: SQLiteDatabase) {
  await db.execAsync('DELETE FROM listening_events; DELETE FROM open_listen_session;');
}
