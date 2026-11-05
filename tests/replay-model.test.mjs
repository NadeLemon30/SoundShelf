import assert from 'node:assert/strict';
import test from 'node:test';

import { periodRange, summarizeListening } from '../src/features/analytics/listening-model.js';
import {
  REPLAY_MIN_ACTIVE_DAYS,
  REPLAY_MIN_LISTENED_MS,
  REPLAY_MIN_QUALIFIED_PLAYS,
  buildReplayStory,
  evaluateReplayEligibility,
} from '../src/features/replay/replay-model.js';

/** @param {number} i */
function event(i, overrides = {}) {
  return {
    trackId: overrides.trackId ?? `t${i % 5}`,
    title: overrides.title ?? `Track ${i % 5}`,
    artist: Object.hasOwn(overrides, 'artist') ? overrides.artist : (i % 3 === 0 ? 'Artist A' : 'Artist B'),
    album: null,
    startedAt: 0,
    endedAt: 0,
    listenedMs: overrides.listenedMs ?? 90_000,
    durationMs: 180_000,
    completed: false,
    qualified: overrides.qualified ?? true,
    endedReason: 'stopped',
    localDate: overrides.localDate ?? `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
    utcOffsetMinutes: 0,
    ...overrides,
  };
}

function eligibleEvents() {
  const days = Array.from({ length: REPLAY_MIN_ACTIVE_DAYS }, (_, d) => `2026-03-${String(d + 1).padStart(2, '0')}`);
  return Array.from({ length: REPLAY_MIN_QUALIFIED_PLAYS }, (_, i) =>
    event(i, { localDate: days[i % days.length], listenedMs: 180_000, qualified: true }),
  );
}

function yearSummary(events, year = 2026) {
  return summarizeListening(events, periodRange('year', `${year}-06-15`));
}

test('eligible recap is built deterministically from a yearly summary', () => {
  const summary = yearSummary(eligibleEvents());
  const story = buildReplayStory(summary, 2026);
  assert.ok(story);
  assert.equal(story.label, '2026 Replay');
  assert.equal(story.qualifiedPlays, REPLAY_MIN_QUALIFIED_PLAYS);
  assert.equal(story.activeDays, REPLAY_MIN_ACTIVE_DAYS);
  assert.ok(story.topTrack);
  assert.ok(story.topArtist);
});

test('insufficient plays are not eligible and report the shortfall', () => {
  const events = eligibleEvents().slice(0, 5);
  const eligibility = evaluateReplayEligibility(yearSummary(events), 2026);
  assert.equal(eligibility.eligible, false);
  assert.ok(eligibility.reasons.some((r) => r.includes('qualified listens')));
  assert.equal(buildReplayStory(yearSummary(events), 2026), null);
});

test('insufficient active days are not eligible', () => {
  const events = Array.from({ length: 25 }, (_, i) => event(i, { localDate: '2026-04-01', listenedMs: 180_000 }));
  const eligibility = evaluateReplayEligibility(yearSummary(events), 2026);
  assert.equal(eligibility.eligible, false);
  assert.ok(eligibility.reasons.some((r) => r.includes('active days')));
});

test('insufficient listening time is not eligible', () => {
  const days = Array.from({ length: 10 }, (_, d) => `2026-05-${String(d + 1).padStart(2, '0')}`);
  const events = Array.from({ length: 25 }, (_, i) => event(i, { localDate: days[i % days.length], listenedMs: 1_000 }));
  const eligibility = evaluateReplayEligibility(yearSummary(events), 2026);
  assert.equal(eligibility.eligible, false);
  assert.ok(eligibility.reasons.some((r) => r.includes('1 hour')));
});

test('qualified listens drive rankings; partial time still counts toward time listened', () => {
  const days = Array.from({ length: 8 }, (_, d) => `2026-06-${String(d + 1).padStart(2, '0')}`);
  const qualified = Array.from({ length: 20 }, (_, i) => event(i, { localDate: days[i % days.length], listenedMs: 200_000, qualified: true, trackId: 'hit', title: 'Hit' }));
  const partial = [event(99, { localDate: days[0], listenedMs: 10_000, qualified: false, trackId: 'skip', title: 'Skip' })];
  const summary = yearSummary([...qualified, ...partial]);
  assert.ok(summary.totalListenedMs >= REPLAY_MIN_LISTENED_MS);
  const story = buildReplayStory(summary, 2026);
  assert.ok(story, `expected eligible story: ${JSON.stringify(evaluateReplayEligibility(summary, 2026))}`);
  assert.equal(story.topTrack?.trackId, 'hit');
});

test('events outside the year do not make a recap', () => {
  const events = eligibleEvents().map((e) => ({ ...e, localDate: e.localDate.replace('2026', '2025') }));
  assert.equal(buildReplayStory(yearSummary(events, 2026), 2026), null);
});

test('biggest day is the day with the most audible time', () => {
  const events = eligibleEvents();
  events[0] = { ...events[0], localDate: '2026-03-01', listenedMs: 999_000 };
  const story = buildReplayStory(yearSummary(events), 2026);
  assert.ok(story);
  assert.equal(story.biggestDay?.date, '2026-03-01');
});

test('empty history is never eligible and never fabricates a recap', () => {
  assert.equal(buildReplayStory(yearSummary([]), 2026), null);
  assert.equal(evaluateReplayEligibility(yearSummary([]), 2026).eligible, false);
});
