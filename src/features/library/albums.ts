import type { LibraryAlbum, LibraryTrack } from './types';

/** Group id for tracks the device did not associate with any album. */
export const UNKNOWN_ALBUM_ID = '__unknown_album__';
/** Title used when the device exposes no album name for a group. */
export const UNKNOWN_ALBUM_TITLE = 'Unknown album';

/**
 * Groups scanned tracks into albums by their device album id.
 *
 * This is pure so it stays easy to verify: it never invents artist or embedded-tag
 * data. Tracks without an album id share one honest "Unknown album" entry, and an
 * album whose title could not be resolved keeps that same fallback instead of a
 * guessed name.
 */
export function groupTracksIntoAlbums(
  tracks: LibraryTrack[],
  albumTitles: Map<string, string>,
): LibraryAlbum[] {
  const albums = new Map<string, LibraryAlbum>();

  for (const track of tracks) {
    const id = track.albumId ?? UNKNOWN_ALBUM_ID;
    const existing = albums.get(id);

    if (existing) {
      existing.tracks.push(track);
      continue;
    }

    albums.set(id, {
      id,
      title: id === UNKNOWN_ALBUM_ID ? UNKNOWN_ALBUM_TITLE : albumTitles.get(id) ?? UNKNOWN_ALBUM_TITLE,
      tracks: [track],
    });
  }

  return [...albums.values()].sort((left, right) => left.title.localeCompare(right.title));
}
