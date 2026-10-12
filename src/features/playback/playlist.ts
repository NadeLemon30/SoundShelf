/**
 * Pure play-order helpers.
 *
 * The playback queue keeps the original track list in `queue` and plays it through
 * `order`, an array of indices into `queue`. Shuffle only changes `order`, so turning
 * shuffle off can restore the natural list without losing the current track. Keeping
 * this logic pure (no native audio calls) lets it be reviewed and reasoned about in
 * isolation, the same way album grouping is kept in `features/library/albums.ts`.
 */

/** Natural play order: `[0, 1, 2, ...]` for a list of `length` tracks. */
export function naturalOrder(length: number): number[] {
  return Array.from({ length: Math.max(0, length) }, (_, index) => index);
}

/**
 * Builds a shuffled order that keeps `startIndex` as the first entry, so enabling
 * shuffle never interrupts the track that is already playing. `random` is injectable
 * so a deterministic sequence can be supplied in tests.
 */
export function shuffledOrder(length: number, startIndex: number, random: () => number = Math.random): number[] {
  const safeStart = startIndex >= 0 && startIndex < length ? startIndex : 0;
  const rest = naturalOrder(length).filter((index) => index !== safeStart);
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const swap = rest[i] as number;
    rest[i] = rest[j] as number;
    rest[j] = swap;
  }
  return length > 0 ? [safeStart, ...rest] : [];
}

/** Where `trackIndex` (a `queue` index) sits inside an existing `order`. */
export function positionInOrder(order: readonly number[], trackIndex: number): number {
  const position = order.indexOf(trackIndex);
  return position >= 0 ? position : 0;
}
