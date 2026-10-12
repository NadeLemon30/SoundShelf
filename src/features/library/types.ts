export type LibraryTrack = {
  id: string;
  title: string;
  filename: string;
  uri: string;
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
  /** Device album id, or the synthetic id used for tracks without one. */
  id: string;
  /** Device album title, or an honest fallback when the title is unavailable. */
  title: string;
  tracks: LibraryTrack[];
};

export type LibraryScanResult = {
  tracks: LibraryTrack[];
  albums: LibraryAlbum[];
  skippedAssetCount: number;
};
