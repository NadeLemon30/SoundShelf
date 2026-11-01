/**
 * Dependency-free tests for the pure listening-analytics rules.
 *
 * Run with: node --test tests/
 * Node strips the TypeScript types directly, so no test runner or install is required.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addDaysToDateKey,
  buildListenEvent,
  dayOfWeek,
  formatListeningDuration,
  localDateKey,
  markListenCompleted,
  observeListenSession,
  periodRange,
  periodRangeLabel,
  previousPeriodRange,
  qualifyListen,
  qualificationThresholdMs,
  startListenSession,
  summarizeListening,
  utcOffsetMinutesAt,
} from '../src/features/analytics/listening-model.js';

const MINUTE = 60_000;
const HOUR = 3_600_000;

/* -------------------------------------------------------------------------- */
/* Qualification                                                              */
/* -------------------------------------------------------------------------- */

test('a normal track qualifies at 30 seconds of audible time', () => {
  assert.equal(qualificationThresholdMs(4 * MINUTE), 30_000);
  assert.deepEqual(qualifyListen(30_000, 4 * MINUTE), { qualified: true, listenedMs: 30_000, thresholdMs: 30_000 });
  assert.equal(qualifyListen(29_999, 4 * MINUTE).qualified, false);
});

test('a short track qualifies at half of its duration', () => {
  assert.equal(qualificationThresholdMs(45_000), 22_500);
  assert.equal(qualifyListen(22_500, 45_000).qualified, true);
  assert.equal(qualifyListen(22_000, 45_000).qualified, false);
  // Exactly 60 seconds still uses the half-track rule (30 s either way).
  assert.equal(qualificationThresholdMs(60_000), 30_000);
  assert.equal(qualificationThresholdMs(60_001), 30_000);
});

test('a track shorter than 30 seconds can never qualify from an unknown duration', () => {
  assert.equal(qualificationThresholdMs(null), 30_000);
  assert.equal(qualifyListen(29_000, null).qualified, false);
  assert.equal(qualifyListen(30_000, null).qualified, true);
});

test('audible time is clamped to the real track duration', () => {
  const result = qualifyListen(5 * MINUTE, 60_000);
  assert.equal(result.listenedMs, 60_000);
  assert.equal(result.qualified, true);
});

test('zero audible time never qualifies', () => {
  assert.equal(qualifyListen(0, 5_000).qualified, false);
  assert.equal(qualifyListen(0, 5 * MINUTE).qualified, false);
  assert.equal(qualifyListen(Number.NaN, 5 * MINUTE).qualified, false);
});

/* -------------------------------------------------------------------------- */
/* Local calendar bucketing                                                   */
/* -------------------------------------------------------------------------- */

test('local dates follow the stored UTC offset, not UTC itself', () => {
  // 2026-11-01T23:30Z is 2026-11-02 07:30 in UTC+8.
  const lateEvening = Date.UTC(2026, 10, 1, 23, 30);
  assert.equal(localDateKey(lateEvening, 480), '2026-11-02');
  assert.equal(localDateKey(lateEvening, 0), '2026-11-01');
  // 2026-11-01T00:30Z is 2026-10-31 19:30 in UTC-5.
  const earlyMorning = Date.UTC(2026, 10, 1, 0, 30);
  assert.equal(localDateKey(earlyMorning, -300), '2026-10-31');
});

test('the local date flips exactly at local midnight', () => {
  const justBefore = Date.UTC(2026, 10, 1, 15, 59, 59);
  const justAfter = Date.UTC(2026, 10, 1, 16, 0, 0);
  assert.equal(localDateKey(justBefore, 480), '2026-11-01');
  assert.equal(localDateKey(justAfter, 480), '2026-11-02');
});

test('device offset helper is east-positive', () => {
  const offset = utcOffsetMinutesAt(Date.UTC(2026, 10, 1));
  assert.equal(offset, -new Date(Date.UTC(2026, 10, 1)).getTimezoneOffset());
});

test('date keys roll over months, years, and leap days', () => {
  assert.equal(addDaysToDateKey('2026-12-31', 1), '2027-01-01');
  assert.equal(addDaysToDateKey('2026-03-01', -1), '2026-02-28');
  assert.equal(addDaysToDateKey('2028-03-01', -1), '2028-02-29');
  assert.equal(dayOfWeek('2026-11-01'), 0); // Sunday
});

test('weeks run Monday through Sunday, including across year boundaries', () => {
  // Sunday 2026-11-01 belongs to the week starting Monday 2026-10-26.
  assert.deepEqual(periodRange('week', '2026-11-01'), { startDate: '2026-10-26', endDate: '2026-11-01' });
  // Friday 2027-01-01 belongs to the week starting Monday 2026-12-28.
  assert.deepEqual(periodRange('week', '2027-01-01'), { startDate: '2026-12-28', endDate: '2027-01-03' });
});

test('month ranges respect month length and leap years', () => {
  assert.deepEqual(periodRange('month', '2026-11-15'), { startDate: '2026-11-01', endDate: '2026-11-30' });
  assert.deepEqual(periodRange('month', '2026-02-10'), { startDate: '2026-02-01', endDate: '2026-02-28' });
  assert.deepEqual(periodRange('month', '2028-02-10'), { startDate: '2028-02-01', endDate: '2028-02-29' });
});

test('day and year ranges cover the whole period', () => {
  assert.deepEqual(periodRange('day', '2026-11-01'), { startDate: '2026-11-01', endDate: '2026-11-01' });
  assert.deepEqual(periodRange('year', '2026-07-04'), { startDate: '2026-01-01', endDate: '2026-12-31' });
});

test('previous periods are the immediately preceding equivalent range', () => {
  assert.deepEqual(previousPeriodRange('day', { startDate: '2026-01-01', endDate: '2026-01-01' }), { startDate: '2025-12-31', endDate: '2025-12-31' });
  assert.deepEqual(previousPeriodRange('week', periodRange('week', '2026-11-01')), { startDate: '2026-10-19', endDate: '2026-10-25' });
  assert.deepEqual(previousPeriodRange('month', periodRange('month', '2026-01-15')), { startDate: '2025-12-01', endDate: '2025-12-31' });
  assert.deepEqual(previousPeriodRange('year', periodRange('year', '2026-05-05')), { startDate: '2025-01-01', endDate: '2025-12-31' });
});

test('range labels are explicit and locale-independent', () => {
  assert.equal(periodRangeLabel('day', periodRange('day', '2026-11-01')), '1 Nov 2026');
  assert.equal(periodRangeLabel('week', periodRange('week', '2026-11-04')), '2–8 Nov 2026');
  assert.equal(periodRangeLabel('week', periodRange('week', '2026-11-01')), '26 Oct – 1 Nov 2026');
  assert.equal(periodRangeLabel('month', periodRange('month', '2026-11-15')), 'November 2026');
  assert.equal(periodRangeLabel('year', periodRange('year', '2026-11-15')), '2026');
});

/* -------------------------------------------------------------------------- */
/* Aggregation                                                                */
/* -------------------------------------------------------------------------- */

let nextId = 0;
function event(overrides = {}) {
  nextId += 1;
  return {
    trackId: `track-${overrides.trackIdSuffix ?? nextId}`,
    title: `Track ${nextId}`,
    artist: null,
    album: null,
    startedAt: Date.UTC(2026, 10, 1, 12, 0),
    endedAt: Date.UTC(2026, 10, 1, 12, 4),
    listenedMs: 4 * MINUTE,
    durationMs: 4 * MINUTE,
    completed: true,
    qualified: true,
    endedReason: 'completed',
    localDate: '2026-11-01',
    utcOffsetMinutes: 0,
    ...overrides,
  };
}

test('summaries ignore events outside the requested local-date range', () => {
  const events = [event({ localDate: '2026-10-31' }), event({ localDate: '2026-11-01' })];
  const summary = summarizeListening(events, { startDate: '2026-11-01', endDate: '2026-11-01' });
  assert.equal(summary.playbackStarts, 1);
  assert.equal(summary.qualifiedPlays, 1);
});

test('play counts and rankings use qualified listens only', () => {
  const events = [
    event({ trackId: 'a', title: 'Alpha', artist: 'One', qualified: true, listenedMs: 2 * MINUTE }),
    event({ trackId: 'a', title: 'Alpha', artist: 'One', qualified: true, listenedMs: 3 * MINUTE }),
    event({ trackId: 'b', title: 'Beta', artist: 'Two', qualified: true, listenedMs: 4 * MINUTE }),
    event({ trackId: 'c', title: 'Skipped', artist: 'One', qualified: false, listenedMs: 5_000, completed: false }),
  ];
  const summary = summarizeListening(events, { startDate: '2026-11-01', endDate: '2026-11-01' });
  assert.equal(summary.playbackStarts, 4);
  assert.equal(summary.qualifiedPlays, 3);
  assert.equal(summary.uniqueTracks, 2);
  assert.equal(summary.completedPlays, 3);
  assert.equal(summary.topTracks[0].trackId, 'a');
  assert.equal(summary.topTracks[0].plays, 2);
  assert.equal(summary.topTracks[0].listenedMs, 5 * MINUTE);
  assert.equal(summary.topTracks[1].trackId, 'b');
  assert.deepEqual(summary.topArtists.map((artist) => artist.artist), ['One', 'Two']);
  // Total time includes the partial attempt; qualified time does not.
  assert.equal(summary.totalListenedMs, 2 * MINUTE + 3 * MINUTE + 4 * MINUTE + 5_000);
  assert.equal(summary.qualifiedListenedMs, 2 * MINUTE + 3 * MINUTE + 4 * MINUTE);
});

test('top tracks break play-count ties by listening time', () => {
  const events = [
    event({ trackId: 'short', title: 'Short', listenedMs: MINUTE }),
    event({ trackId: 'long', title: 'Long', listenedMs: 5 * MINUTE }),
  ];
  const summary = summarizeListening(events, { startDate: '2026-11-01', endDate: '2026-11-01' });
  assert.equal(summary.topTracks[0].trackId, 'long');
});

test('daily series is ascending and counts qualified plays per local date', () => {
  const events = [
    event({ localDate: '2026-11-03' }),
    event({ localDate: '2026-11-01' }),
    event({ localDate: '2026-11-01', qualified: false }),
  ];
  const summary = summarizeListening(events, { startDate: '2026-11-01', endDate: '2026-11-07' });
  assert.deepEqual(summary.daily.map((day) => day.date), ['2026-11-01', '2026-11-03']);
  assert.equal(summary.daily[0].qualifiedPlays, 1);
  assert.equal(summary.activeDays, 2);
});

test('an empty range reports no qualified listening instead of zero habits', () => {
  const summary = summarizeListening([], { startDate: '2026-11-01', endDate: '2026-11-01' });
  assert.equal(summary.hasQualifiedListening, false);
  assert.equal(summary.qualifiedPlays, 0);
  assert.deepEqual(summary.topTracks, []);
  assert.deepEqual(summary.daily, []);
});

test('duration formatting stays honest at the edges', () => {
  assert.equal(formatListeningDuration(0), '0 min');
  assert.equal(formatListeningDuration(1_000), '<1 min');
  assert.equal(formatListeningDuration(59_000), '<1 min');
  assert.equal(formatListeningDuration(MINUTE), '1 min');
  assert.equal(formatListeningDuration(HOUR), '1 h');
  assert.equal(formatListeningDuration(2 * HOUR + 5 * MINUTE), '2 h 5 min');
});

/* -------------------------------------------------------------------------- */
/* Accumulator                                                                */
/* -------------------------------------------------------------------------- */

const track = { id: 't1', title: 'Song', artist: 'Artist', album: 'Album', durationMs: 3 * MINUTE };

function sessionAt(start = 1_000_000) {
  return startListenSession(track, start, 0);
}

test('audible samples accumulate position deltas', () => {
  let session = sessionAt(0);
  session = observeListenSession(session, { positionMs: 0, playing: true, durationMs: 3 * MINUTE, now: 0 });
  session = observeListenSession(session, { positionMs: 1_000, playing: true, durationMs: 3 * MINUTE, now: 1_000 });
  session = observeListenSession(session, { positionMs: 2_000, playing: true, durationMs: 3 * MINUTE, now: 2_000 });
  assert.equal(session.listenedMs, 2_000);
});

test('paused time is never credited', () => {
  let session = sessionAt(0);
  session = observeListenSession(session, { positionMs: 0, playing: true, durationMs: 3 * MINUTE, now: 0 });
  session = observeListenSession(session, { positionMs: 1_000, playing: true, durationMs: 3 * MINUTE, now: 1_000 });
  // Pause transition: no credit for this sample.
  session = observeListenSession(session, { positionMs: 1_000, playing: false, durationMs: 3 * MINUTE, now: 2_000 });
  // One minute paused, position unchanged.
  session = observeListenSession(session, { positionMs: 1_000, playing: false, durationMs: 3 * MINUTE, now: 62_000 });
  assert.equal(session.listenedMs, 1_000);
  // Resume transition: still no credit, then playback accumulates again.
  session = observeListenSession(session, { positionMs: 1_000, playing: true, durationMs: 3 * MINUTE, now: 63_000 });
  assert.equal(session.listenedMs, 1_000);
  session = observeListenSession(session, { positionMs: 2_000, playing: true, durationMs: 3 * MINUTE, now: 64_000 });
  assert.equal(session.listenedMs, 2_000);
});

test('a forward seek cannot manufacture listening time', () => {
  let session = sessionAt(0);
  session = observeListenSession(session, { positionMs: 0, playing: true, durationMs: 3 * MINUTE, now: 0 });
  session = observeListenSession(session, { positionMs: 500, playing: true, durationMs: 3 * MINUTE, now: 500 });
  // Jump 90 seconds ahead after only 500 ms of wall time.
  session = observeListenSession(session, { positionMs: 90_000, playing: true, durationMs: 3 * MINUTE, now: 1_000 });
  assert.ok(session.listenedMs <= 1_000 + 1_000, `expected at most 2000 ms, got ${session.listenedMs}`);
  assert.equal(session.lastPositionMs, 90_000);
});

test('a backward seek neither adds nor removes listening time', () => {
  let session = sessionAt(0);
  session = observeListenSession(session, { positionMs: 50_000, playing: true, durationMs: 3 * MINUTE, now: 0 });
  session = observeListenSession(session, { positionMs: 51_000, playing: true, durationMs: 3 * MINUTE, now: 1_000 });
  const before = session.listenedMs;
  session = observeListenSession(session, { positionMs: 10_000, playing: true, durationMs: 3 * MINUTE, now: 2_000 });
  assert.equal(session.listenedMs, before);
  assert.equal(session.lastPositionMs, 10_000);
});

test('listening time is clamped to the track duration', () => {
  let session = sessionAt(0);
  session = { ...session, durationMs: 1_000, listenedMs: 900 };
  session = observeListenSession(session, { positionMs: 0, playing: true, durationMs: 1_000, now: 0 });
  session = observeListenSession(session, { positionMs: 1_000, playing: true, durationMs: 1_000, now: 1_000 });
  assert.equal(session.listenedMs, 1_000);
});

test('reaching the end marks the session complete', () => {
  let session = sessionAt(0);
  session = observeListenSession(session, { positionMs: 0, playing: true, durationMs: 3 * MINUTE, now: 0 });
  session = observeListenSession(session, { positionMs: 2 * MINUTE + 59_500, playing: true, durationMs: 3 * MINUTE, now: 1_000 });
  assert.equal(session.completed, true);
  const marked = markListenCompleted(session, 5_000);
  assert.equal(marked.completed, true);
  assert.equal(marked.lastPlaying, false);
});

test('a baseline sample starts mid-track without crediting the skipped position', () => {
  let session = sessionAt(0);
  // Playback was already 90 seconds in when tracking began.
  session = observeListenSession(session, { positionMs: 90_000, playing: true, durationMs: 3 * MINUTE, now: 0 });
  assert.equal(session.listenedMs, 0);
  session = observeListenSession(session, { positionMs: 91_000, playing: true, durationMs: 3 * MINUTE, now: 1_000 });
  assert.equal(session.listenedMs, 1_000);
});

test('an interrupted session can be rebuilt into an honest event', () => {
  let session = sessionAt(0);
  session = observeListenSession(session, { positionMs: 0, playing: true, durationMs: 3 * MINUTE, now: 0 });
  session = observeListenSession(session, { positionMs: 31_000, playing: true, durationMs: 3 * MINUTE, now: 31_000 });
  const recovery = buildListenEvent(session, 40_000, 'recovered');
  assert.equal(recovery.qualified, true);
  assert.equal(recovery.endedReason, 'recovered');
  assert.equal(recovery.localDate, localDateKey(1_000_000, 0));
});

test('one listen keeps the local date on which it started', () => {
  // 23:59 local on 1 Nov 2026 (UTC+8): 2026-11-01T15:59Z.
  const startedAt = Date.UTC(2026, 10, 1, 15, 59);
  let session = startListenSession(track, startedAt, 480);
  assert.equal(session.localDate, '2026-11-01');
  // Listening continues past local midnight into 2 Nov.
  session = observeListenSession(session, { positionMs: 0, playing: true, durationMs: 3 * MINUTE, now: startedAt });
  session = observeListenSession(session, { positionMs: 2 * MINUTE, playing: true, durationMs: 3 * MINUTE, now: startedAt + 2 * MINUTE });
  const finished = buildListenEvent(session, startedAt + 2 * MINUTE, 'track_change');
  assert.equal(finished.localDate, '2026-11-01');
  assert.equal(localDateKey(finished.endedAt, 480), '2026-11-02');
});
