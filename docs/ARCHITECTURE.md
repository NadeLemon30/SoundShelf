# SoundShelf architecture

## Status and guiding constraints

This is a proposed architecture for a fresh Expo SDK 57 / React Native 0.86 / TypeScript starter. It is intentionally not implemented yet. Android is the first target; the app operates on device-local media and stores all user data locally. Expo Router remains the only navigation layer and Continuous Native Generation remains enabled.

## Proposed structure

```text
src/
  app/                 routes and navigator layouts only
  components/          reusable presentational UI and player UI
  features/
    library/           screens, view models, search and normalization
    playback/          controls, queue UI and playback-state binding
    collection/        playlists, favorites, recent tracks
    analytics/         statistics and recap presentation
  services/
    media-library/     permission, scan/query and MediaStore adapters
    audio/             Expo Audio adapter and background configuration
    persistence/       SQLite connection, migrations and repositories
  state/               small app-level UI/playback coordination state
  hooks/               reusable UI/domain hooks
  constants/           design tokens and non-domain constants
  types/               shared domain contracts
  utils/               pure helpers (time, grouping, formatting)
```

Do not create these folders until their phase requires them. Keep route files thin: compose a feature screen and navigate; do not place database, media, or audio logic in `src/app/`.

## Core data flow

```text
Android MediaStore
  -> media-library adapter -> normalized in-memory library index -> browse/search UI
                                    |                                  |
                                    v                                  v
                            track reference / URI              playback controller
                                                                    |
                                                                    v
                                                          Expo Audio + OS media session
                                                                    |
                                                                    v
SQLite <--- repositories <--- listening events / favorites / playlists / settings
  -> aggregate queries -> statistics and Replay Story eligibility -> recap UI/share card
```

The device media library is authoritative for audio files and their availability. SQLite is authoritative only for SoundShelf-owned data: user collections, settings, playback checkpoint, listening events, aggregate-friendly indexes, and recap state. A scan must not duplicate data or make missing external files appear playable.

## Domain model (proposed)

- `Track`: stable platform asset identifier, content URI, title, artist, album, duration, artwork reference if available, modification marker, and availability state. Normalize missing fields to explicit display fallbacks; retain raw fields separately when useful.
- `Artist` and `Album`: derived groupings, not required native entities. Never rely on genres.
- `Queue`: ordered track IDs plus active index, shuffle order/seed, and repeat mode (`off`, `all`, `one`). Keep it separate from a user playlist.
- `PlaybackCheckpoint`: active track, position, queue snapshot policy, update timestamp, and whether playback was user-paused. Restore only after validating the track still exists and the position is sensible.
- `Playlist` and `PlaylistItem`: SoundShelf-owned title, creation/update timestamps, and ordered track references. Missing tracks remain visible but unavailable for repair/removal.
- `ListenEvent`: track ID, started/ended timestamps, accumulated audible seconds, completion state, and local-time bucket data needed for deterministic aggregation. Persist facts; calculate reports from them.

## Persistence

Use `expo-sqlite` as the planned single durable store, with versioned SQL migrations and parameterized queries. It suits related and query-heavy data (ordered playlists, history, time-range stats) better than scattered JSON. Enable foreign keys and WAL when the database is initialized, subject to the SDK 57 API verified during implementation. If a simple key/value setting is needed, use the SQLite-backed key/value API instead of adding a second persistence dependency.

Planned tables: `schema_migrations`, `settings`, `playback_checkpoint`, `playlists`, `playlist_items`, `favorite_tracks`, `recent_tracks`, and `listen_events`. Add materialized aggregates only after profiling proves event-query performance inadequate. Store references and compact metadata, not audio bytes or large artwork blobs.

## Media discovery and metadata

The first implementation must request audio access only, query Android audio assets incrementally, and use content URIs rather than filesystem paths. Permission denial is a first-class screen with a retry/settings route; an empty library is a separate state. Metadata and artwork are optional: display filename-derived or “Unknown” fallbacks and a generated placeholder.

Implemented album browsing groups tracks by the Android album id each asset reports (`BUCKET_ID` / `Asset.albumId`) and labels each group with `getAlbumsAsync()`'s folder name. This is a device-derived grouping, not parsed audio tags: artists, embedded titles, and artwork are still not read (see `DECISIONS.md` D-009).

`expo-media-library` is the planned first option because SDK 57 supports `MediaType.AUDIO` and Android granular permissions. Its real-device proof of concept must verify: enumerable audio files, usable URI handoff to `expo-audio`, title/artist/album/duration availability, artwork availability, pagination/refresh behavior, and behavior across Android versions. If it cannot provide required metadata/artwork, record findings in `DECISIONS.md` and evaluate a narrowly scoped native MediaStore/metadata module before implementation proceeds.

## Playback and operating-system integration

Plan to evaluate `expo-audio` first. SDK 57 exposes audio players and playlists, queue-oriented operations, loop modes, playback status, global audio modes, lock-screen metadata, and Android background-playback configuration. Background behavior needs the `expo-audio` config plugin, `shouldPlayInBackground`, `doNotMix` interruption mode, and active lock-screen controls. On Android, the controls are required for sustained background playback. This changes native configuration, so validate in an Android development build and later a release-like build, not only Expo Go.

The audio service owns player lifecycle and translates platform status/events into the app’s playback state. UI components never manipulate native player objects directly. Persist checkpoints at bounded intervals and lifecycle transitions—not every render—and record listened time only while playback is audibly active.

## Analytics and Replay integrity

Define qualification rules before code: a play count should require a minimum audible duration or completion percentage, and listening duration must exclude paused time. Store timestamps in UTC plus the local calendar/time-zone context needed for user-facing buckets. Calculate Replay data deterministically from stored listening events, including a clear eligibility threshold. If the data cannot support a claim, present an explanatory insufficient-history state instead of zeroes or invented rankings.

## Sources consulted (planning, 2026-10-11)

- [Expo SDK 57 Audio](https://docs.expo.dev/versions/v57.0.0/sdk/audio/)
- [Expo SDK 57 MediaLibrary](https://docs.expo.dev/versions/v57.0.0/sdk/media-library/)
- [Expo SDK 57 SQLite](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/)
- [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android 13 media-permission changes](https://developer.android.com/about/versions/13/behavior-changes-13)
