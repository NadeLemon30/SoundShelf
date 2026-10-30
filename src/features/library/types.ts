export type LibraryTrack = {
  id: string;
  title: string;
  filename: string;
  uri: string;
  /** Embedded audio-tag values, or null when the file does not supply them. */
  artist: string | null;
  album: string | null;
  /**
   * Device album (MediaStore bucket) id the track belongs to, or `null` when the
   * device does not report one. Album grouping uses this id, never guessed tags.
   */
  albumId: string | null;
  durationMs: number | null;
  creationTime: number | null;
  modificationTime: number | null;
};

export type LibraryAlbum = {
  /** Embedded album tag, or the synthetic id used for tracks without one. */
  id: string;
  /** Device album title, or an honest fallback when the title is unavailable. */
  title: string;
  tracks: LibraryTrack[];
};

export type LibraryArtist = {
  /** Embedded artist tag, or the synthetic id used for tracks without one. */
  id: string;
  /** Embedded artist tag, or an honest fallback when the tag is unavailable. */
  name: string;
  tracks: LibraryTrack[];
};

export type LibraryScanResult = {
  tracks: LibraryTrack[];
  albums: LibraryAlbum[];
  artists: LibraryArtist[];
  skippedAssetCount: number;
};
