import { NativeModules, Platform } from 'react-native';

export type LocalAudioMetadata = {
  title: string | null;
  artist: string | null;
  album: string | null;
};

type LocalAudioMetadataModule = {
  getMetadata: (audioUri: string) => Promise<LocalAudioMetadata | null>;
};

const nativeModule = NativeModules.LocalAlbumArtwork as LocalAudioMetadataModule | undefined;
const emptyMetadata: LocalAudioMetadata = { title: null, artist: null, album: null };

/** Reads embedded local audio tags on Android; unsupported builds retain file-name fallbacks. */
export async function getLocalAudioMetadata(audioUri: string): Promise<LocalAudioMetadata> {
  if (Platform.OS !== 'android' || !nativeModule) return emptyMetadata;
  try {
    const metadata = await nativeModule.getMetadata(audioUri);
    return {
      title: metadata?.title?.trim() || null,
      artist: metadata?.artist?.trim() || null,
      album: metadata?.album?.trim() || null,
    };
  } catch {
    return emptyMetadata;
  }
}
