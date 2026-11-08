import { Image } from 'expo-image';
import { memo, useEffect, useMemo, useState } from 'react';
import type { ImageStyle, StyleProp } from 'react-native';

import { getLocalAlbumArtwork } from '@/features/library/local-album-artwork';
import { ArtworkPlaceholder } from './artwork-placeholder';

type TrackArtworkProps = {
  uri?: string | null;
  size?: number;
  icon?: 'music' | 'album';
  style?: StyleProp<ImageStyle>;
  /** When true, the image is decorative because a parent control already names the action/content. */
  decorative?: boolean;
};

/** Renders cached embedded artwork when available, otherwise the standard fallback. */
export const TrackArtwork = memo(function TrackArtwork({
  uri,
  size = 56,
  icon = 'music',
  style,
  decorative = false,
}: TrackArtworkProps) {
  const [artworkUri, setArtworkUri] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setArtworkUri(null);
    if (!uri) return () => { active = false; };

    void getLocalAlbumArtwork(uri).then((nextArtworkUri) => {
      if (active) setArtworkUri(nextArtworkUri);
    });
    return () => { active = false; };
  }, [uri]);

  const imageStyle = useMemo(() => [{ width: size, height: size }, style], [size, style]);

  if (!artworkUri) return <ArtworkPlaceholder size={size} icon={icon} style={style} />;
  return (
    <Image
      accessible={!decorative}
      accessibilityElementsHidden={decorative}
      accessibilityLabel={decorative ? undefined : 'Album artwork'}
      cachePolicy="memory-disk"
      contentFit="cover"
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      recyclingKey={artworkUri}
      source={{ uri: artworkUri }}
      style={imageStyle}
      transition={120}
    />
  );
});
