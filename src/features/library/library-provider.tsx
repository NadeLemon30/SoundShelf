import * as MediaLibrary from 'expo-media-library/legacy';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

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
  /** True when audio access was denied and Android will no longer show a permission prompt. */
  permissionBlocked: boolean;
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
  const [permissionBlocked, setPermissionBlocked] = useState(false);

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
        setPermissionBlocked(permission.canAskAgain === false);
        setStatus('denied');
        return;
      }

      setPermissionBlocked(false);
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

  /**
   * When access is denied, re-check on return from the system settings screen. If the
   * user granted access there, continue straight into a scan; otherwise refresh whether
   * Android will still prompt so the UI can offer the correct action.
   */
  useEffect(() => {
    if (status !== 'denied') {
      return;
    }

    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') {
        return;
      }
      MediaLibrary.getPermissionsAsync(false, ['audio'])
        .then((permission) => {
          if (permission.status === 'granted') {
            void scan();
          } else {
            setPermissionBlocked(permission.canAskAgain === false);
          }
        })
        .catch(() => {
          // Leave the current denied state if the permission query fails.
        });
    });
    return () => subscription.remove();
  }, [scan, status]);

  const value = useMemo(() => ({ status, tracks, albums, skippedAssetCount, errorMessage, needsRescan, permissionBlocked, scan }), [albums, errorMessage, needsRescan, permissionBlocked, scan, skippedAssetCount, status, tracks]);
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within LibraryProvider.');
  }
  return context;
}
