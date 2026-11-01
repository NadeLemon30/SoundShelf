/**
 * Pure listening-analytics rules.
 *
 * This module deliberately has **no imports** (no React Native, no SQLite, no Expo APIs) and
 * uses JSDoc types instead of TypeScript annotations, so the qualification, calendar-bucketing,
 * aggregation, and accumulator rules can be executed and tested by plain Node with no test
 * dependency: `node --test tests/listening-model.test.mjs`.
 *
 * Policy (owner-approved 2026-11-01, see D-013):
 * - A listen qualifies after 30 seconds of audible playback, or half of the track when the
 *   track is 60 seconds or shorter, whichever comes first. Only audible time counts.
 * - Each listen is bucketed by the device-local date on which it started, stored per event
 *   together with the UTC offset that was in effect at that moment.
 */

/** Audible milliseconds required for a qualified listen on a normal-length track. */
export const QUALIFIED_MIN_LISTEN_MS = 30000;
/** Tracks at or below this duration qualify at half their length instead of 30 seconds. */
export const SHORT_TRACK_THRESHOLD_MS = 60000;
/** Playback attempts shorter than this are not persisted at all. */
export const MIN_RECORDED_LISTEN_MS = 1000;

/** Human-readable statement of the rule used in the UI. */
export const LISTEN_RULE_DESCRIPTION =
  'A play counts as a listen after 30 seconds, or half of a track that is 60 seconds or shorter.';

/**
 * @typedef {'completed' | 'track_change' | 'stopped' | 'recovered'} ListenEndReason
 * @typedef {'day' | 'week' | 'month' | 'year'} ListeningPeriod
 * @typedef {{ startDate: string, endDate: string }} DateRange
 */

/**
 * @typedef {Object} ListeningEvent
 * @property {string} trackId
 * @property {string} title
 * @property {string | null} artist
 * @property {string | null} album
 * @property {number} startedAt Unix epoch milliseconds when audible playback began.
 * @property {number} endedAt Unix epoch milliseconds when the attempt was closed.
 * @property {number} listenedMs Audible milliseconds only; pauses and seeks are excluded.
 * @property {number | null} durationMs
 * @property {boolean} completed True when playback reached the end of the track.
 * @property {boolean} qualified True when this attempt met the qualification rule.
 * @property {ListenEndReason} endedReason
 * @property {string} localDate Device-local YYYY-MM-DD at `startedAt`.
 * @property {number} utcOffsetMinutes Local offset in minutes east of UTC at `startedAt`.
 */

/**
 * @typedef {Object} ListeningTrackInput
 * @property {string} id
 * @property {string} title
 * @property {string | null} artist
 * @property {string | null} album
 * @property {number | null} durationMs
 */

/**
 * @typedef {Object} ListeningQualification
 * @property {boolean} qualified
 * @property {number} listenedMs Audible time after clamping to the track duration.
 * @property {number} thresholdMs Audible time this attempt needed to qualify.
 */

/**
 * @param {number} value
 * @returns {string}
 */
function pad2(value) {
  return value.toString().padStart(2, '0');
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/* -------------------------------------------------------------------------- */
/* Qualification                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Audible time required to qualify for the given track duration.
 * @param {number | null} durationMs
 * @returns {number}
 */
export function qualificationThresholdMs(durationMs) {
  if (durationMs === null || !Number.isFinite(durationMs) || durationMs <= 0) {
    return QUALIFIED_MIN_LISTEN_MS;
  }
  if (durationMs <= SHORT_TRACK_THRESHOLD_MS) {
    return Math.ceil(durationMs / 2);
  }
  return QUALIFIED_MIN_LISTEN_MS;
}

/**
 * Applies the qualification rule, clamping audible time to the real track length.
 * @param {number} listenedMs
 * @param {number | null} durationMs
 * @returns {ListeningQualification}
 */
export function qualifyListen(listenedMs, durationMs) {
  const safeListened = Number.isFinite(listenedMs) ? Math.max(0, listenedMs) : 0;
  const capped =
    durationMs !== null && Number.isFinite(durationMs) && durationMs > 0
      ? Math.min(safeListened, durationMs)
      : safeListened;
  const thresholdMs = qualificationThresholdMs(durationMs);
  return { qualified: capped >= thresholdMs, listenedMs: capped, thresholdMs };
}

/* -------------------------------------------------------------------------- */
/* Local calendar bucketing                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Device-local UTC offset in minutes east of UTC at `timestampMs`.
 * @param {number} timestampMs
 * @returns {number}
 */
export function utcOffsetMinutesAt(timestampMs) {
  return -new Date(timestampMs).getTimezoneOffset();
}

/**
 * Device-local calendar date (YYYY-MM-DD) for an instant and a known UTC offset.
 * @param {number} timestampMs
 * @param {number} utcOffsetMinutes
 * @returns {string}
 */
export function localDateKey(timestampMs, utcOffsetMinutes) {
  const shifted = new Date(timestampMs + utcOffsetMinutes * 60000);
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`;
}

/**
 * Today's device-local date.
 * @param {number} [now]
 * @returns {string}
 */
export function todayDateKey(now = Date.now()) {
  return localDateKey(now, utcOffsetMinutesAt(now));
}

/**
 * @param {string} dateKey
 * @returns {{ year: number, month: number, day: number }}
 */
function dateKeyParts(dateKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    throw new Error(`Invalid local date key: ${dateKey}`);
  }
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Invalid local date key: ${dateKey}`);
  }
  return { year: Number(match[1]), month, day };
}

/**
 * Normalizes overflow (for example day 0 or day 32) through `Date.UTC`.
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {string}
 */
function buildDateKey(year, month, day) {
  const normalized = new Date(Date.UTC(year, month - 1, day));
  return `${normalized.getUTCFullYear()}-${pad2(normalized.getUTCMonth() + 1)}-${pad2(normalized.getUTCDate())}`;
}

/**
 * @param {string} dateKey
 * @param {number} days
 * @returns {string}
 */
export function addDaysToDateKey(dateKey, days) {
  const { year, month, day } = dateKeyParts(dateKey);
  return buildDateKey(year, month, day + days);
}

/**
 * Day of week for a calendar date: 0 = Sunday … 6 = Saturday.
 * @param {string} dateKey
 * @returns {number}
 */
export function dayOfWeek(dateKey) {
  const { year, month, day } = dateKeyParts(dateKey);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/**
 * Calendar range for a period containing `anchorDateKey`.
 * Weeks run Monday through Sunday; months and years follow the calendar.
 * @param {ListeningPeriod} period
 * @param {string} anchorDateKey
 * @returns {DateRange}
 */
export function periodRange(period, anchorDateKey) {
  const { year, month } = dateKeyParts(anchorDateKey);
  if (period === 'day') {
    return { startDate: anchorDateKey, endDate: anchorDateKey };
  }
  if (period === 'week') {
    const offsetFromMonday = (dayOfWeek(anchorDateKey) + 6) % 7;
    const startDate = addDaysToDateKey(anchorDateKey, -offsetFromMonday);
    return { startDate, endDate: addDaysToDateKey(startDate, 6) };
  }
  if (period === 'month') {
    const startDate = buildDateKey(year, month, 1);
    return { startDate, endDate: addDaysToDateKey(buildDateKey(year, month + 1, 1), -1) };
  }
  return { startDate: buildDateKey(year, 1, 1), endDate: buildDateKey(year, 12, 31) };
}

/**
 * The immediately preceding range of the same period.
 * @param {ListeningPeriod} period
 * @param {DateRange} range
 * @returns {DateRange}
 */
export function previousPeriodRange(period, range) {
  if (period === 'day') {
    const date = addDaysToDateKey(range.startDate, -1);
    return { startDate: date, endDate: date };
  }
  if (period === 'week') {
    return {
      startDate: addDaysToDateKey(range.startDate, -7),
      endDate: addDaysToDateKey(range.endDate, -7),
    };
  }
  if (period === 'month') {
    const { year, month } = dateKeyParts(range.startDate);
    return {
      startDate: buildDateKey(year, month - 1, 1),
      endDate: addDaysToDateKey(buildDateKey(year, month, 1), -1),
    };
  }
  const { year } = dateKeyParts(range.startDate);
  return { startDate: buildDateKey(year - 1, 1, 1), endDate: buildDateKey(year - 1, 12, 31) };
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Short weekday labels, index 0 = Sunday. */
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Example: `1 Nov 2026`. Locale-independent on purpose.
 * @param {string} dateKey
 * @returns {string}
 */
export function formatDateKeyLabel(dateKey) {
  const { year, month, day } = dateKeyParts(dateKey);
  return `${day} ${MONTH_SHORT[month - 1]} ${year}`;
}

/**
 * Example: `2–8 Nov 2026`, `30 Oct – 5 Nov 2026`, `November 2026`, `2026`.
 * @param {ListeningPeriod} period
 * @param {DateRange} range
 * @returns {string}
 */
export function periodRangeLabel(period, range) {
  if (period === 'day') {
    return formatDateKeyLabel(range.startDate);
  }
  if (period === 'week') {
    const start = dateKeyParts(range.startDate);
    const end = dateKeyParts(range.endDate);
    if (start.year === end.year && start.month === end.month) {
      return `${start.day}–${end.day} ${MONTH_SHORT[end.month - 1]} ${end.year}`;
    }
    if (start.year === end.year) {
      return `${start.day} ${MONTH_SHORT[start.month - 1]} – ${end.day} ${MONTH_SHORT[end.month - 1]} ${end.year}`;
    }
    return `${formatDateKeyLabel(range.startDate)} – ${formatDateKeyLabel(range.endDate)}`;
  }
  if (period === 'month') {
    const { year, month } = dateKeyParts(range.startDate);
    return `${MONTH_LONG[month - 1]} ${year}`;
  }
  return dateKeyParts(range.startDate).year.toString();
}

/* -------------------------------------------------------------------------- */
/* Aggregation                                                                */
/* -------------------------------------------------------------------------- */

/**
 * @typedef {Object} DailyListening
 * @property {string} date
 * @property {number} listenedMs
 * @property {number} qualifiedPlays
 */

/**
 * @typedef {Object} TrackListening
 * @property {string} trackId
 * @property {string} title
 * @property {string | null} artist
 * @property {number} plays
 * @property {number} listenedMs
 */

/**
 * @typedef {Object} ArtistListening
 * @property {string | null} artist
 * @property {number} plays
 */

/**
 * @typedef {Object} ListeningSummary
 * @property {DateRange} range
 * @property {number} playbackStarts Every persisted attempt in range, qualified or not.
 * @property {number} qualifiedPlays
 * @property {number} totalListenedMs Audible time across all attempts in range.
 * @property {number} qualifiedListenedMs Audible time that belongs to qualified listens.
 * @property {number} uniqueTracks
 * @property {number} completedPlays
 * @property {number} activeDays
 * @property {DailyListening[]} daily Ascending by date; only days with at least one attempt.
 * @property {TrackListening[]} topTracks
 * @property {ArtistListening[]} topArtists
 * @property {boolean} hasQualifiedListening False means the UI must not present rankings or totals as listening habits.
 */

/**
 * True when a date key falls inside an inclusive range.
 * @param {string} dateKey
 * @param {DateRange} range
 * @returns {boolean}
 */
export function isDateInRange(dateKey, range) {
  return dateKey >= range.startDate && dateKey <= range.endDate;
}

/**
 * Aggregates stored events for a range. Rankings and play counts use qualified listens only;
 * `totalListenedMs` also includes partial attempts, which is why it is reported separately.
 * @param {ReadonlyArray<ListeningEvent>} events
 * @param {DateRange} range
 * @param {number} [topLimit]
 * @returns {ListeningSummary}
 */
export function summarizeListening(events, range, topLimit = 5) {
  /** @type {Map<string, DailyListening>} */
  const dailyByDate = new Map();
  /** @type {Map<string, TrackListening>} */
  const tracksById = new Map();
  /** @type {Map<string, ArtistListening>} */
  const artistsByKey = new Map();
  /** @type {Set<string>} */
  const qualifiedTrackIds = new Set();
  let playbackStarts = 0;
  let qualifiedPlays = 0;
  let totalListenedMs = 0;
  let qualifiedListenedMs = 0;
  let completedPlays = 0;

  for (const event of events) {
    if (!isDateInRange(event.localDate, range)) {
      continue;
    }
    playbackStarts += 1;
    totalListenedMs += Math.max(0, event.listenedMs);

    const day = dailyByDate.get(event.localDate) ?? {
      date: event.localDate,
      listenedMs: 0,
      qualifiedPlays: 0,
    };
    day.listenedMs += Math.max(0, event.listenedMs);

    if (event.qualified) {
      qualifiedPlays += 1;
      qualifiedListenedMs += Math.max(0, event.listenedMs);
      completedPlays += event.completed ? 1 : 0;
      qualifiedTrackIds.add(event.trackId);
      day.qualifiedPlays += 1;

      const track = tracksById.get(event.trackId) ?? {
        trackId: event.trackId,
        title: event.title,
        artist: event.artist,
        plays: 0,
        listenedMs: 0,
      };
      track.plays += 1;
      track.listenedMs += Math.max(0, event.listenedMs);
      tracksById.set(event.trackId, track);

      const artistKey = event.artist ?? '';
      const artist = artistsByKey.get(artistKey) ?? { artist: event.artist, plays: 0 };
      artist.plays += 1;
      artistsByKey.set(artistKey, artist);
    }

    dailyByDate.set(event.localDate, day);
  }

  const daily = [...dailyByDate.values()].sort((left, right) => left.date.localeCompare(right.date));
  const topTracks = [...tracksById.values()]
    .sort(
      (left, right) =>
        right.plays - left.plays ||
        right.listenedMs - left.listenedMs ||
        left.title.localeCompare(right.title),
    )
    .slice(0, topLimit);
  const topArtists = [...artistsByKey.values()]
    .sort(
      (left, right) =>
        right.plays - left.plays || (left.artist ?? '').localeCompare(right.artist ?? ''),
    )
    .slice(0, topLimit);

  return {
    range,
    playbackStarts,
    qualifiedPlays,
    totalListenedMs,
    qualifiedListenedMs,
    uniqueTracks: qualifiedTrackIds.size,
    completedPlays,
    activeDays: daily.length,
    daily,
    topTracks,
    topArtists,
    hasQualifiedListening: qualifiedPlays > 0,
  };
}

/**
 * Compact, honest duration text such as `<1 min`, `42 min`, `2 h 5 min`.
 * @param {number} listenedMs
 * @returns {string}
 */
export function formatListeningDuration(listenedMs) {
  if (!Number.isFinite(listenedMs) || listenedMs <= 0) {
    return '0 min';
  }
  const totalSeconds = Math.floor(listenedMs / 1000);
  if (totalSeconds < 60) {
    return '<1 min';
  }
  const totalMinutes = Math.round(totalSeconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

/* -------------------------------------------------------------------------- */
/* Live listen accumulator                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Tracks one contiguous audible attempt at a single track.
 * @typedef {Object} ListenSession
 * @property {string} trackId
 * @property {string} title
 * @property {string | null} artist
 * @property {string | null} album
 * @property {number | null} durationMs
 * @property {number} startedAt
 * @property {number} lastObservedAt
 * @property {number} lastPositionMs
 * @property {boolean} lastPlaying
 * @property {number} listenedMs
 * @property {number} maxPositionMs
 * @property {boolean} completed
 * @property {string} localDate
 * @property {number} utcOffsetMinutes
 */

/**
 * @typedef {Object} ListenSample
 * @property {number} positionMs Player position in milliseconds.
 * @property {boolean} playing
 * @property {number | null} durationMs Player-reported duration when available.
 * @property {number} now Wall-clock time of the sample.
 */

/** Seeking forward may never credit more than the real elapsed time plus this tolerance. */
const SEEK_TOLERANCE_MS = 1000;

/**
 * @param {ListeningTrackInput} track
 * @param {number} now
 * @param {number} utcOffsetMinutes
 * @returns {ListenSession}
 */
export function startListenSession(track, now, utcOffsetMinutes) {
  return {
    trackId: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album,
    durationMs: track.durationMs !== null && track.durationMs > 0 ? track.durationMs : null,
    startedAt: now,
    lastObservedAt: now,
    lastPositionMs: 0,
    lastPlaying: false,
    listenedMs: 0,
    maxPositionMs: 0,
    completed: false,
    localDate: localDateKey(now, utcOffsetMinutes),
    utcOffsetMinutes,
  };
}

/**
 * Folds one playback status sample into the session.
 *
 * Audible time is credited only while playback was playing in both the previous and the current
 * sample, and never by more than the wall-clock time that actually passed. That makes pauses,
 * forward seeks, backward seeks, and background timers unable to inflate listening time.
 * @param {ListenSession} session
 * @param {ListenSample} sample
 * @returns {ListenSession}
 */
export function observeListenSession(session, sample) {
  if (sample.now < session.lastObservedAt) {
    return session;
  }
  const elapsedMs = sample.now - session.lastObservedAt;
  const positionDeltaMs = sample.positionMs - session.lastPositionMs;
  const perSampleCap = Math.max(0, elapsedMs) + SEEK_TOLERANCE_MS;

  let creditedMs = 0;
  // A zero-elapsed sample only establishes the baseline (its position may be far from zero when
  // playback starts mid-track), so it must never credit time.
  if (elapsedMs > 0 && session.lastPlaying && sample.playing) {
    creditedMs = clamp(positionDeltaMs, 0, perSampleCap);
  }

  const sampledDuration =
    sample.durationMs !== null && Number.isFinite(sample.durationMs) && sample.durationMs > 0
      ? sample.durationMs
      : null;
  const durationMs = sampledDuration ?? session.durationMs;
  const nextListenedMs =
    durationMs !== null
      ? Math.min(session.listenedMs + creditedMs, durationMs)
      : session.listenedMs + creditedMs;
  const reachedEnd =
    durationMs !== null && sample.playing && sample.positionMs >= durationMs - 1000;

  return {
    ...session,
    durationMs,
    lastObservedAt: sample.now,
    lastPositionMs: sample.positionMs,
    lastPlaying: sample.playing,
    listenedMs: nextListenedMs,
    maxPositionMs: Math.max(session.maxPositionMs, sample.positionMs),
    completed: session.completed || reachedEnd,
  };
}

/**
 * @param {ListenSession} session
 * @param {number} now
 * @returns {ListenSession}
 */
export function markListenCompleted(session, now) {
  return {
    ...session,
    completed: true,
    lastObservedAt: Math.max(session.lastObservedAt, now),
    lastPlaying: false,
  };
}

/**
 * Builds the persisted event for a finished session.
 * @param {ListenSession} session
 * @param {number} endedAt
 * @param {ListenEndReason} reason
 * @returns {ListeningEvent}
 */
export function buildListenEvent(session, endedAt, reason) {
  const qualification = qualifyListen(session.listenedMs, session.durationMs);
  return {
    trackId: session.trackId,
    title: session.title,
    artist: session.artist,
    album: session.album,
    startedAt: session.startedAt,
    endedAt: Math.max(endedAt, session.startedAt),
    listenedMs: qualification.listenedMs,
    durationMs: session.durationMs,
    completed: session.completed,
    qualified: qualification.qualified,
    endedReason: reason,
    localDate: session.localDate,
    utcOffsetMinutes: session.utcOffsetMinutes,
  };
}
