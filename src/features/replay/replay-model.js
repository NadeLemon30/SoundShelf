/**
 * Pure Replay Stories recap rules (Phase 8, D-014).
 *
 * No imports, JSDoc types, plain JavaScript so `node --test tests/replay-model.test.mjs`
 * can verify deterministic recaps without a test dependency. Uses qualified-listening
 * summaries from D-013.
 *
 * Eligibility is explicit and never fabricated: if not eligible, the UI must show the
 * honest insufficient-history state and the shortfall — never a decorative or zero recap.
 */

export const REPLAY_PERIOD = 'year';
export const REPLAY_MIN_QUALIFIED_PLAYS = 20;
export const REPLAY_MIN_ACTIVE_DAYS = 7;
export const REPLAY_MIN_LISTENED_MS = 60 * 60 * 1000; // 1 hour

export const REPLAY_ELIGIBILITY_DESCRIPTION =
  `A yearly Replay needs at least ${REPLAY_MIN_QUALIFIED_PLAYS} qualified listens, on ${REPLAY_MIN_ACTIVE_DAYS} different days, with at least 1 hour of listening time.`;

/** @param {import('../analytics/listening-model').ListeningSummary} summary @param {number} year */
export function evaluateReplayEligibility(summary, year) {
  /** @type {string[]} */
  const reasons = [];
  if (summary.qualifiedPlays < REPLAY_MIN_QUALIFIED_PLAYS) {
    reasons.push(`${summary.qualifiedPlays} of ${REPLAY_MIN_QUALIFIED_PLAYS} qualified listens`);
  }
  if (summary.activeDays < REPLAY_MIN_ACTIVE_DAYS) {
    reasons.push(`${summary.activeDays} of ${REPLAY_MIN_ACTIVE_DAYS} active days`);
  }
  if (summary.totalListenedMs < REPLAY_MIN_LISTENED_MS) {
    reasons.push('less than 1 hour of listening time');
  }
  return {
    eligible: reasons.length === 0,
    year,
    qualifiedPlays: summary.qualifiedPlays,
    activeDays: summary.activeDays,
    totalListenedMs: summary.totalListenedMs,
    reasons,
  };
}

/** @param {import('../analytics/listening-model').ListeningSummary} summary @param {number} year */
export function buildReplayStory(summary, year) {
  const eligibility = evaluateReplayEligibility(summary, year);
  if (!eligibility.eligible) return null;
  const biggestDay = [...summary.daily]
    .sort((a, b) => b.listenedMs - a.listenedMs || a.date.localeCompare(b.date))[0] ?? null;
  return {
    eligible: true,
    year,
    label: `${year} Replay`,
    qualifiedPlays: summary.qualifiedPlays,
    playbackStarts: summary.playbackStarts,
    totalListenedMs: summary.totalListenedMs,
    uniqueTracks: summary.uniqueTracks,
    activeDays: summary.activeDays,
    biggestDay,
    topTrack: summary.topTracks[0] ?? null,
    topArtist: summary.topArtists[0] ?? null,
    topTracks: summary.topTracks.slice(0, 5),
    topArtists: summary.topArtists.slice(0, 5),
  };
}
