import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { type ImageStyle } from 'react-native';

import { getLocalAlbumArtwork } from '@/features/library/local-album-artwork';
import { ArtworkPlaceholder } from './artwork-placeholder';

type TrackArtworkProps = {
  uri?: string | null;
  size?: number;
  icon?: 'music' | 'album';
  style?: ImageStyle;
};

/** Renders cached embedded artwork when available, otherwise the standard fallback. */
export function TrackArtwork({ uri, size = 56, icon = 'music', style }: TrackArtworkProps) {
  const [artwork, setArtwork] = useState<{ sourceUri: string; artworkUri: string | null } | null>(null);

  useEffect(() => {
    let active = true;
    if (uri) {
      void getLocalAlbumArtwork(uri).then((nextArtworkUri) => {
        if (active) setArtwork({ sourceUri: uri, artworkUri: nextArtworkUri });
      });
    }
    return () => { active = false; };
  }, [uri]);

  const artworkUri = artwork && artwork.sourceUri === uri ? artwork.artworkUri : null;
  if (!artworkUri) return <ArtworkPlaceholder size={size} icon={icon} style={style} />;
  return <Image accessibilityLabel="Album artwork" contentFit="cover" source={{ uri: artworkUri }} style={[{ width: size, height: size }, style]} />;
}
