/**
 * Type contract for `listening-model.js`.
 *
 * The implementation is plain JSDoc-typed JavaScript so the rules can run under plain Node in
 * `tests/listening-model.test.mjs` (this project has no test runner dependency). TypeScript
 * resolves imports of `./listening-model` to this declaration file, so app code still gets
 * checked types; Metro bundles the sibling `.js` implementation at runtime.
 */

export const QUALIFIED_MIN_LISTEN_MS: number;
export const SHORT_TRACK_THRESHOLD_MS: number;
export const MIN_RECORDED_LISTEN_MS: number;
export const LISTEN_RULE_DESCRIPTION: string;
export const WEEKDAY_SHORT: readonly string[];

export type ListenEndReason = 'completed' | 'track_change' | 'stopped' | 'recovered';
export type ListeningPeriod = 'day' | 'week' | 'month' | 'year';
export type DateRange = { startDate: string; endDate: string };

export type ListeningEvent = {
  trackId: string;
  title: string;
  artist: string | null;
  album: string | null;
  startedAt: number;
  endedAt: number;
  listenedMs: number;
  durationMs: number | null;
  completed: boolean;
  qualified: boolean;
  endedReason: ListenEndReason;
  localDate: string;
  utcOffsetMinutes: number;
};

export type ListeningTrackInput = {
  id: string;
  title: string;
  artist: string | null;
  album: string | null;
  durationMs: number | null;
};

export type ListeningQualification = {
  qualified: boolean;
  listenedMs: number;
  thresholdMs: number;
};

export type DailyListening = { date: string; listenedMs: number; qualifiedPlays: number };

export type TrackListening = {
  trackId: string;
  title: string;
  artist: string | null;
  plays: number;
  listenedMs: number;
};

export type ArtistListening = { artist: string | null; plays: number };

export type ListeningSummary = {
  range: DateRange;
  playbackStarts: number;
  qualifiedPlays: number;
  totalListenedMs: number;
  qualifiedListenedMs: number;
  uniqueTracks: number;
  completedPlays: number;
  activeDays: number;
  daily: DailyListening[];
  topTracks: TrackListening[];
  topArtists: ArtistListening[];
  hasQualifiedListening: boolean;
};

export type ListenSession = {
  trackId: string;
  title: string;
  artist: string | null;
  album: string | null;
  durationMs: number | null;
  startedAt: number;
  lastObservedAt: number;
  lastPositionMs: number;
  lastPlaying: boolean;
  listenedMs: number;
  maxPositionMs: number;
  completed: boolean;
  localDate: string;
  utcOffsetMinutes: number;
};

export type ListenSample = {
  positionMs: number;
  playing: boolean;
  durationMs: number | null;
  now: number;
};

export function qualificationThresholdMs(durationMs: number | null): number;
export function qualifyListen(listenedMs: number, durationMs: number | null): ListeningQualification;
export function utcOffsetMinutesAt(timestampMs: number): number;
export function localDateKey(timestampMs: number, utcOffsetMinutes: number): string;
export function todayDateKey(now?: number): string;
export function addDaysToDateKey(dateKey: string, days: number): string;
export function dayOfWeek(dateKey: string): number;
export function periodRange(period: ListeningPeriod, anchorDateKey: string): DateRange;
export function previousPeriodRange(period: ListeningPeriod, range: DateRange): DateRange;
export function formatDateKeyLabel(dateKey: string): string;
export function periodRangeLabel(period: ListeningPeriod, range: DateRange): string;
export function isDateInRange(dateKey: string, range: DateRange): boolean;
export function summarizeListening(
  events: readonly ListeningEvent[],
  range: DateRange,
  topLimit?: number,
): ListeningSummary;
export function formatListeningDuration(listenedMs: number): string;
export function startListenSession(
  track: ListeningTrackInput,
  now: number,
  utcOffsetMinutes: number,
): ListenSession;
export function observeListenSession(session: ListenSession, sample: ListenSample): ListenSession;
export function markListenCompleted(session: ListenSession, now: number): ListenSession;
export function buildListenEvent(
  session: ListenSession,
  endedAt: number,
  reason: ListenEndReason,
): ListeningEvent;
