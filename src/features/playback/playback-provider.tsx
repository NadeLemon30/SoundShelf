import { type AudioPlayer, requestNotificationPermissionsAsync, setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import type { LibraryTrack } from '@/features/library/types';

import { naturalOrder, positionInOrder, shuffledOrder } from './playlist';
import { nextRepeatMode, type RepeatMode } from './types';

type PlaybackContextValue = {
  /** The shared native player. Status lives in components so position ticks stay local. */
  player: AudioPlayer;
  currentTrack: LibraryTrack | null;
  queue: LibraryTrack[];
  /** Position within `queue` of the current track. */
  index: number;
  repeat: RepeatMode;
  shuffle: boolean;
  /** True once at least one track has been chosen for playback. */
  hasTrack: boolean;
  errorMessage: string | null;
  /** Starts `track`, using `list` as the queue for next/previous. */
  playTrack: (track: LibraryTrack, list: LibraryTrack[]) => void;
  togglePlayPause: () => void;
  next: () => void;
  previous: () => void;
  seekTo: (seconds: number) => void;
  cycleRepeat: () => void;
  toggleShuffle: () => void;
};

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

/** Seconds of play before Previous returns to the start of the current track instead of the prior one. */
const PREVIOUS_RESTART_THRESHOLD = 3;
/** Treat playback within this many seconds of the end as "at the end". */
const END_OF_TRACK_TOLERANCE = 0.25;

export function PlaybackProvider({ children }: PropsWithChildren) {
  const player = useAudioPlayer(null);
  const [queue, setQueue] = useState<LibraryTrack[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [shuffle, setShuffle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /** Guards against acting on `didJustFinish` more than once for the same track end. */
  const finishHandledRef = useRef(false);
  /** Set while a freshly loaded source should start playing as soon as it is ready. */
  const pendingPlayRef = useRef(false);
  /** Android's notification permission is requested once per session, at the first user play. */
  const notificationRequestedRef = useRef(false);

  const currentTrack = order.length > 0 && index >= 0 && index < order.length ? queue[order[index]] ?? null : null;

  // Music playback: take audio focus (other apps pause), keep playing in silent mode,
  // and continue in the background so playback survives app backgrounding and screen lock.
  useEffect(() => {
    setAudioModeAsync({ interruptionMode: 'doNotMix', playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {
      // Non-fatal: playback still works with the platform defaults.
    });
  }, []);

  // Loading a new current track: swap the source, then play once it reports ready.
  useEffect(() => {
    if (!currentTrack) {
      return;
    }
    finishHandledRef.current = false;
    pendingPlayRef.current = true;
    player.replace({ uri: currentTrack.uri });
    // Activate media controls (notification drawer / lock screen) for the current track.
    // On Android this also keeps the foreground service alive for sustained background playback.
    player.setActiveForLockScreen(
      true,
      { title: currentTrack.title },
      { showSeekBackward: true, showSeekForward: true },
    );
  }, [currentTrack, player]);

  const advanceForFinish = useCallback(() => {
    if (index < order.length - 1) {
      setIndex(index + 1);
      return;
    }
    if (repeat === 'all' && order.length > 0) {
      if (index === 0) {
        // Single-track queue: wrapping would select the same track, so restart in place.
        finishHandledRef.current = false;
        player.seekTo(0);
        player.play();
        return;
      }
      setIndex(0);
      return;
    }
    // End of the queue with repeat off: stay on the final track, paused at its end.
    player.pause();
  }, [index, order.length, player, repeat]);

  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.error) {
        setErrorMessage(status.error);
      } else {
        // Clear a previous error once a source loads/plays cleanly (no-op when already null).
        setErrorMessage((current) => (current === null ? current : null));
      }
      if (pendingPlayRef.current && status.isLoaded) {
        pendingPlayRef.current = false;
        player.play();
      }
      if (status.didJustFinish) {
        if (repeat === 'one') {
          player.seekTo(0);
          player.play();
        } else if (!finishHandledRef.current) {
          finishHandledRef.current = true;
          advanceForFinish();
        }
      }
    });
    return () => subscription.remove();
  }, [advanceForFinish, player, repeat]);

  const playTrack = useCallback(
    (track: LibraryTrack, list: LibraryTrack[]) => {
      if (list.length === 0) {
        return;
      }
      // Android 13+ needs notification permission to show media controls in the shade.
      // Ask once per session, at the first user-initiated play, without blocking playback.
      if (Platform.OS === 'android' && !notificationRequestedRef.current) {
        notificationRequestedRef.current = true;
        requestNotificationPermissionsAsync().catch(() => {
          // Playback continues; the lock-screen notification may simply be unavailable.
        });
      }
      const startIndex = list.findIndex((item) => item.id === track.id);
      const safeStart = startIndex >= 0 ? startIndex : 0;
      const isSameTrack = currentTrack?.id === track.id;
      const nextOrder = shuffle ? shuffledOrder(list.length, safeStart) : naturalOrder(list.length);

      finishHandledRef.current = false;
      pendingPlayRef.current = true;
      setErrorMessage(null);
      setQueue(list);
      setOrder(nextOrder);
      setIndex(shuffle ? 0 : safeStart);

      // Re-selecting the current track is not a state change, so restart it directly.
      if (isSameTrack) {
        pendingPlayRef.current = false;
        player.seekTo(0);
        player.play();
      }
    },
    [currentTrack?.id, player, shuffle],
  );

  const togglePlayPause = useCallback(() => {
    if (!currentTrack) {
      return;
    }
    if (player.playing) {
      player.pause();
      return;
    }
    const { duration, currentTime } = player;
    if (duration > 0 && currentTime >= duration - END_OF_TRACK_TOLERANCE) {
      finishHandledRef.current = false;
      player.seekTo(0);
    }
    player.play();
  }, [currentTrack, player]);

  const next = useCallback(() => {
    if (order.length === 0) {
      return;
    }
    if (index < order.length - 1) {
      setIndex(index + 1);
      return;
    }
    if (repeat === 'all') {
      if (index === 0) {
        finishHandledRef.current = false;
        player.seekTo(0);
        player.play();
      } else {
        setIndex(0);
      }
    }
  }, [index, order.length, player, repeat]);

  const previous = useCallback(() => {
    if (order.length === 0) {
      return;
    }
    if (player.currentTime > PREVIOUS_RESTART_THRESHOLD) {
      player.seekTo(0);
      return;
    }
    if (index > 0) {
      setIndex(index - 1);
      return;
    }
    if (repeat === 'all' && order.length > 1) {
      setIndex(order.length - 1);
      return;
    }
    player.seekTo(0);
  }, [index, order.length, player, repeat]);

  const seekTo = useCallback(
    (seconds: number) => {
      if (!currentTrack) {
        return;
      }
      finishHandledRef.current = false;
      player.seekTo(Math.max(0, seconds));
    },
    [currentTrack, player],
  );

  const cycleRepeat = useCallback(() => {
    setRepeat((current) => nextRepeatMode(current));
  }, []);

  const toggleShuffle = useCallback(() => {
    const enabled = !shuffle;
    setShuffle(enabled);
    if (queue.length === 0 || order.length === 0) {
      return;
    }
    const currentQueueIndex = order[Math.min(index, order.length - 1)] ?? 0;
    const nextOrder = enabled ? shuffledOrder(queue.length, currentQueueIndex) : naturalOrder(queue.length);
    setOrder(nextOrder);
    setIndex(enabled ? 0 : positionInOrder(nextOrder, currentQueueIndex));
  }, [index, order, queue.length, shuffle]);

  const value = useMemo(
    () => ({
      player,
      currentTrack,
      queue,
      index,
      repeat,
      shuffle,
      hasTrack: currentTrack !== null,
      errorMessage,
      playTrack,
      togglePlayPause,
      next,
      previous,
      seekTo,
      cycleRepeat,
      toggleShuffle,
    }),
    [currentTrack, cycleRepeat, errorMessage, index, next, playTrack, player, previous, queue, repeat, seekTo, shuffle, togglePlayPause, toggleShuffle],
  );

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}

export function usePlayback() {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error('usePlayback must be used within PlaybackProvider.');
  }
  return context;
}
