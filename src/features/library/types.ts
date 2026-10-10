export type LibraryTrack = {
  id: string;
  title: string;
  filename: string;
  uri: string;
  durationMs: number | null;
  creationTime: number | null;
  modificationTime: number | null;
};

export type LibraryScanResult = {
  tracks: LibraryTrack[];
  skippedAssetCount: number;
};
