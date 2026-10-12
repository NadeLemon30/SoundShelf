/** Formats a number of seconds as `m:ss`, or `h:mm:ss` past an hour. */
export function formatPlaybackTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const paddedSecs = secs.toString().padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${paddedSecs}`;
  }
  return `${minutes}:${paddedSecs}`;
}

/** Playback progress as a 0–100 percentage, safe when the duration is still unknown. */
export function playbackPercent(positionSeconds: number, durationSeconds: number): number {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return 0;
  }
  const ratio = (positionSeconds / durationSeconds) * 100;
  return Math.min(100, Math.max(0, ratio));
}
