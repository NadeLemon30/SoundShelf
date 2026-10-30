import type { LibraryArtist, LibraryTrack } from './types';

export const UNKNOWN_ARTIST_ID = '__unknown_artist__';
export const UNKNOWN_ARTIST_NAME = 'Unknown artist';

/** Groups scanned tracks by embedded artist tag without inventing a value for missing tags. */
export function groupTracksIntoArtists(tracks: LibraryTrack[]): LibraryArtist[] {
  const artists = new Map<string, LibraryArtist>();
  for (const track of tracks) {
    const artist = track.artist?.trim() || null;
    const id = artist ? `artist:${artist.toLocaleLowerCase()}` : UNKNOWN_ARTIST_ID;
    const existing = artists.get(id);
    if (existing) {
      existing.tracks.push(track);
    } else {
      artists.set(id, { id, name: artist ?? UNKNOWN_ARTIST_NAME, tracks: [track] });
    }
  }
  return [...artists.values()].sort((left, right) => left.name.localeCompare(right.name));
}
