import * as MediaLibrary from 'expo-media-library/legacy';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { scanDeviceAudio } from './media-library-service';
import type { LibraryAlbum, LibraryTrack } from './types';

type LibraryStatus = 'notRequested' | 'scanning' | 'ready' | 'denied' | 'error';

type LibraryContextValue = {
  status: LibraryStatus;
  tracks: LibraryTrack[];
  albums: LibraryAlbum[];
  skippedAssetCount: number;
  errorMessage: string | null;
  needsRescan: boolean;
  scan: () => Promise<void>;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<LibraryStatus>('notRequested');
  const [tracks, setTracks] = useState<LibraryTrack[]>([]);
  const [albums, setAlbums] = useState<LibraryAlbum[]>([]);
  const [skippedAssetCount, setSkippedAssetCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [needsRescan, setNeedsRescan] = useState(false);

  useEffect(() => {
    if (status !== 'ready') {
      return;
    }

    const subscription = MediaLibrary.addListener(() => {
      setNeedsRescan(true);
    });
    return () => subscription.remove();
  }, [status]);

  const scan = useCallback(async () => {
    setStatus('scanning');
    setErrorMessage(null);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync(false, ['audio']);
      if (permission.status !== 'granted') {
        setStatus('denied');
        return;
      }

      const result = await scanDeviceAudio();
      setTracks(result.tracks);
      setAlbums(result.albums);
      setSkippedAssetCount(result.skippedAssetCount);
      setNeedsRescan(false);
      setStatus('ready');
    } catch (error) {
      setStatus('error');
      const detail = error instanceof Error && error.message ? ` (${error.message})` : '';
      setErrorMessage(`SoundShelf could not read the device music library. On Android, install and open a SoundShelf development build instead of Expo Go, then try again.${detail}`);
    }
  }, []);

  const value = useMemo(() => ({ status, tracks, albums, skippedAssetCount, errorMessage, needsRescan, scan }), [albums, errorMessage, needsRescan, scan, skippedAssetCount, status, tracks]);
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within LibraryProvider.');
  }
  return context;
}
