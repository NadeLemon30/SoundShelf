import { NativeModules, Platform } from 'react-native';

type LocalAlbumArtworkModule = {
  getArtworkUri: (audioUri: string) => Promise<string | null>;
};

const nativeModule = NativeModules.LocalAlbumArtwork as LocalAlbumArtworkModule | undefined;
const cache = new Map<string, string | null>();
const pending = new Map<string, Promise<string | null>>();

/**
 * Gets an embedded album image from a local Android audio file.
 *
 * The native module is deliberately optional: web and an out-of-date development
 * build keep the honest artwork placeholder rather than failing library browsing.
 */
export function getLocalAlbumArtwork(audioUri: string): Promise<string | null> {
  const cached = cache.get(audioUri);
  if (cached !== undefined) return Promise.resolve(cached);
  const existing = pending.get(audioUri);
  if (existing) return existing;
  if (Platform.OS !== 'android' || !nativeModule) {
    cache.set(audioUri, null);
    return Promise.resolve(null);
  }

  const request = nativeModule.getArtworkUri(audioUri)
    .catch(() => null)
    .then((artworkUri) => {
      cache.set(audioUri, artworkUri);
      pending.delete(audioUri);
      return artworkUri;
    });
  pending.set(audioUri, request);
  return request;
}
