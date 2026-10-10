import * as MediaLibrary from 'expo-media-library/legacy';

import type { LibraryScanResult, LibraryTrack } from './types';

const PAGE_SIZE = 100;
const URI_LOOKUP_CONCURRENCY = 8;

function titleFromFilename(filename: string) {
  return filename.replace(/\.[^/.]+$/, '').trim() || 'Untitled track';
}

async function toTrack(asset: MediaLibrary.Asset): Promise<LibraryTrack | null> {
  const info = await MediaLibrary.getAssetInfoAsync(asset);
  const uri = info.localUri ?? info.uri ?? asset.uri;

  if (!uri) {
    return null;
  }

  const filename = info.filename.trim() || 'Unknown audio file';
  return {
    id: info.id,
    title: titleFromFilename(filename),
    filename,
    uri,
    durationMs: Number.isFinite(info.duration) ? info.duration * 1_000 : null,
    creationTime: info.creationTime,
    modificationTime: info.modificationTime,
  };
}

async function inBatches<T, R>(items: T[], task: (item: T) => Promise<R>) {
  const results: R[] = [];
  for (let start = 0; start < items.length; start += URI_LOOKUP_CONCURRENCY) {
    const batch = items.slice(start, start + URI_LOOKUP_CONCURRENCY);
    results.push(...await Promise.all(batch.map(task)));
  }
  return results;
}

/** Reads only audio media and resolves a URI before exposing a track to the UI. */
export async function scanDeviceAudio(): Promise<LibraryScanResult> {
  const assets: MediaLibrary.Asset[] = [];
  let after: string | undefined;

  do {
    const page = await MediaLibrary.getAssetsAsync({
      first: PAGE_SIZE,
      after,
      mediaType: MediaLibrary.MediaType.audio,
      sortBy: [MediaLibrary.SortBy.creationTime, true],
    });

    assets.push(...page.assets);
    after = page.hasNextPage ? page.endCursor : undefined;
  } while (after);

  const resolved = await inBatches(assets, async (asset) => {
    try {
      return await toTrack(asset);
    } catch {
      return null;
    }
  });

  const tracks = resolved.filter((track): track is LibraryTrack => track !== null)
    .sort((left, right) => left.title.localeCompare(right.title));

  return { tracks, skippedAssetCount: assets.length - tracks.length };
}
