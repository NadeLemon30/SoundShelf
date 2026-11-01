import type { AudioPlayer } from 'expo-audio';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef } from 'react';

import type { LibraryTrack } from '@/features/library/types';

import {
  buildListenEvent,
  markListenCompleted,
  MIN_RECORDED_LISTEN_MS,
  observeListenSession,
  startListenSession,
  utcOffsetMinutesAt,
  type ListenEndReason,
  type ListenSession,
} from './listening-model';
import {
  clearOpenListenSession,
  insertListeningEvent,
  loadOpenListenSession,
  saveOpenListenSession,
} from './repository';

/** How often the in-flight session is written so a crash loses at most a few seconds. */
const OPEN_SESSION_SAVE_INTERVAL_MS = 5_000;

type ListenTrackerProps = {
  player: AudioPlayer;
  track: LibraryTrack | null;
};

/**
 * Records qualified listening from the real player without changing playback behavior.
 *
 * Lives inside PlaybackProvider so it sees the single shared player. It writes one row per
 * contiguous attempt, keeps a throttled snapshot of the attempt in progress (restart
 * recovery), and never throws into the player's status listener.
 */
export function ListenTracker({ player, track }: ListenTrackerProps) {
  const db = useSQLiteContext();
  const sessionRef = useRef<ListenSession | null>(null);
  const trackRef = useRef<LibraryTrack | null>(null);
  const lastPersistAtRef = useRef(0);
  const previousTrackIdRef = useRef<string | null>(null);

  const finish = useCallback(
    async (reason: ListenEndReason, endedAt: number) => {
      const session = sessionRef.current;
      sessionRef.current = null;
      if (!session) {
        return;
      }
      try {
        if (session.listenedMs < MIN_RECORDED_LISTEN_MS && !session.completed) {
          await clearOpenListenSession(db);
          return;
        }
        await insertListeningEvent(db, buildListenEvent(session, endedAt, reason));
        await clearOpenListenSession(db);
      } catch {
        // Analytics is best-effort: a storage failure must never interrupt playback.
      }
    },
    [db],
  );

  // The status listener needs the current track without re-subscribing on every change.
  useEffect(() => {
    trackRef.current = track;
  }, [track]);

  // Recover a listen interrupted by process death. Only the time that was already observed is
  // kept; time while the app was dead was not listening and is never invented.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const open = await loadOpenListenSession(db);
        if (cancelled || !open) {
          return;
        }
        if (open.listenedMs >= MIN_RECORDED_LISTEN_MS || open.completed) {
          await insertListeningEvent(db, buildListenEvent(open, open.lastObservedAt, 'recovered'));
        }
        await clearOpenListenSession(db);
      } catch {
        // A damaged open session is discarded below by the normal save/clear cycle.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db]);

  // Changing tracks closes the attempt for the previous one.
  useEffect(() => {
    const previousId = previousTrackIdRef.current;
    const nextId = track?.id ?? null;
    previousTrackIdRef.current = nextId;
    if (previousId !== null && previousId !== nextId) {
      void finish('track_change', Date.now());
    }
  }, [finish, track?.id]);

  // Fold every player status sample into the open session.
  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      const activeTrack = trackRef.current;
      if (!activeTrack) {
        return;
      }
      const now = Date.now();
      let session = sessionRef.current;
      // A native status sample can arrive before the track-change effect runs, so close the
      // previous track's attempt here rather than folding the new track's position into it.
      if (session && session.trackId !== activeTrack.id) {
        void finish('track_change', now);
        session = null;
      }
      if (!session) {
        // A finished sample must never open a new attempt; with repeat-one the player can emit
        // more than one finish update, and an empty "completed" play would inflate the stats.
        if (!status.playing || status.didJustFinish) {
          return;
        }
        session = startListenSession(activeTrack, now, utcOffsetMinutesAt(now));
        lastPersistAtRef.current = now;
      }

      session = observeListenSession(session, {
        positionMs: Math.max(0, status.currentTime * 1000),
        playing: status.playing,
        durationMs: status.duration > 0 ? status.duration * 1000 : activeTrack.durationMs,
        now,
      });
      if (status.didJustFinish) {
        session = markListenCompleted(session, now);
      }
      sessionRef.current = session;

      if (
        now - lastPersistAtRef.current >= OPEN_SESSION_SAVE_INTERVAL_MS &&
        session.listenedMs >= MIN_RECORDED_LISTEN_MS
      ) {
        lastPersistAtRef.current = now;
        void saveOpenListenSession(db, session).catch(() => {
          // Restart recovery is optional; keep playing regardless.
        });
      }
      if (status.didJustFinish) {
        void finish('completed', now);
      }
    });
    return () => subscription.remove();
  }, [db, finish, player]);

  // App teardown or provider unmount closes whatever is still open.
  useEffect(() => () => {
    void finish('stopped', Date.now());
  }, [finish]);

  return null;
}
