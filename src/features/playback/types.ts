/**
 * How playback should behave when the current track ends.
 * - `off`: stop after the last track in the order.
 * - `all`: wrap back to the first track.
 * - `one`: repeat the current track.
 */
export type RepeatMode = 'off' | 'all' | 'one';

/** The repeat modes in the order the cycle button rotates through them. */
export const RepeatModes: readonly RepeatMode[] = ['off', 'all', 'one'];

export function nextRepeatMode(current: RepeatMode): RepeatMode {
  const index = RepeatModes.indexOf(current);
  return RepeatModes[(index + 1) % RepeatModes.length] ?? 'off';
}
