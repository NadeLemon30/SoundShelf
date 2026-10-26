# SoundShelf technical decisions

This log distinguishes decided direction from items that require device evidence. Add a dated entry when an implementation decision changes.

## D-001: Android-first, local-only product scope

**Status:** accepted (2026-10-11)

SoundShelf will read music already stored on the device and store app data locally. It excludes downloads, online streaming/video, AI, accounts, cloud sync, social features, dashboards, and required genre browsing. This narrows permissions, privacy risks, and architecture complexity while retaining a future extension boundary.

## D-002: Expo Router and Continuous Native Generation

**Status:** accepted (2026-10-11)

Use the existing Expo Router setup and keep native projects generated. Route files stay in `src/app/`; native configuration goes through `app.json` config plugins. This preserves the starter convention and allows Expo-compatible native modules without hand-editing generated Android files.

## D-003: Use Expo Audio for playback, pending a Phase 4 device spike

**Status:** implemented for foreground playback (2026-10-12); background behavior pending Phase 5

Use SDK 57 `expo-audio` as the playback engine. It covers player/playlist APIs, queue/loop behavior, global audio/interruption configuration, and Android lock-screen/notification background playback via its config plugin. Its Android audio-focus request and missing headphone-disconnect broadcast required local source patches (D-012). It avoids adding a third-party native dependency.

The competing `react-native-track-player` has strong music-player capabilities, but its current V5 is commercially licensed for commercial use and imposes New Architecture requirements. Do not add it unless a later phase documents a missing required capability and the project license is approved. If evaluated, it requires a custom development build/native integration and its exact supported Expo SDK/React Native combination must be verified then.

## D-004: Use `expo-media-library` first for Android audio discovery, pending Phase 3 proof

**Status:** recommended; unresolved (2026-10-11)

SDK 57 `expo-media-library` supports `MediaType.AUDIO` and granular Android media permission requests. Request audio access only at a user-initiated library scan, and use content URIs. Android 13+ requires the audio-specific `READ_MEDIA_AUDIO` permission for external audio created by other apps; no broad storage permission should be assumed.

Unresolved: confirm on representative physical Android devices whether Expo’s API returns sufficient song title/artist/album, stable identifiers, usable playback URIs, pagination/refresh signals, and embedded artwork. Artwork in particular may require a fallback or a small native metadata solution. A proof of concept is required before promising full library fidelity.

## D-005: One SQLite-backed local store

**Status:** accepted for planned implementation (2026-10-11)

Use `expo-sqlite` with schema migrations for playlists, favorites, recent tracks, history, checkpoints, settings, and statistics queries. SQLite models relationships and time-range aggregation naturally and persists across restarts. Keep raw audio and artwork outside the database. Use its key/value capability for small settings if needed rather than adding AsyncStorage.

## D-006: Development builds are required for native/release behavior verification

**Status:** accepted (2026-10-11)

Expo Go may be useful for basic UI iteration, but it is not sufficient evidence for background playback, config-plugin manifest changes, permission behavior, lock-screen controls, or a release build. When `expo-audio` background configuration or another native module is introduced, create an Android development build; repeat the final checks on a release-like APK/AAB.

## D-007: Analytics must be event-based and eligibility-gated

**Status:** accepted (2026-10-11)

Persist qualified listening events/duration, then derive all day/week/month/year reports and Replay Stories. Do not persist decorative totals as the source of truth or create recaps from too little data. Exact qualification threshold, time-zone handling, and recap eligibility threshold remain a Phase 7 design task.

## D-008: Phase 3 scan uses the SDK 57 MediaLibrary API as a bounded proof

**Status:** implemented; physical-device validation pending (2026-10-11)

`expo-media-library` 57.0.5 is installed through `npx expo install`. The app config plugin is constrained to `granularPermissions: ["audio"]`, and runtime permission requests likewise pass `['audio']`. The scan is triggered only by a user action and uses the compatibility `expo-media-library/legacy` entry point with cursor pagination in pages of 100; the new SDK 57 entry point requires `ExpoMediaLibraryNext`, which Expo Go does not include. Each asset URI is resolved before it reaches browse/search UI. An item that cannot supply info/URI is skipped rather than presented as playable.

The installed new API's TypeScript contract exposes no audio tag or embedded-artwork fields. Therefore the current UI derives a display title from the filename and does not fabricate artists, albums, or cover art. A physical Android proof must determine whether the API behavior is sufficient for playback and whether a minimal native MediaStore/tag reader needs to be evaluated before completing Phase 3.

## D-009: Album browsing groups by MediaStore bucket id, without embedded tags

**Status:** implemented; physical-device validation pending (2026-10-12)

The Library screen gained a Songs/Albums switch. Albums are built from the album id each audio asset reports (Android MediaStore `BUCKET_ID`, surfaced as the legacy `expo-media-library` `Asset.albumId`). Album names come from `getAlbumsAsync()` (`BUCKET_DISPLAY_NAME`, which on Android is the storage folder name). Grouping is a pure function in `src/features/library/albums.ts` so it can be reviewed without native calls.

This deliberately does not read embedded ID3/MP4 tags. The legacy audio API exposes no artist, title, genre, or embedded-artwork fields, so SoundShelf does not fabricate artist data and does not present folder names as verified album tags. Two folders with the same display name stay separate groups, and tracks without an album id share one "Unknown album" group. Artists and artwork remain blocked on the Phase 3 device proof and, if the API proves insufficient, a separately approved native metadata module (see D-004/D-008).

## D-010: Phase 4 foreground playback architecture

**Status:** implemented; physical-device validation pending (2026-10-12)

A single `expo-audio` player is created once at the app root (`useAudioPlayer(null)` in `src/features/playback/playback-provider.tsx`) and lives for the whole session. Playback state is split deliberately:

- The provider owns the queue, a separate play `order` (index permutation), the current index, repeat mode, and shuffle flag, and exposes actions. It subscribes to `playbackStatusUpdate` directly (`player.addListener`) rather than using `useAudioPlayerStatus`, so per-tick position updates do not re-render the whole tree.
- Position/progress is read only where it is displayed (mini-player, Now Playing) via `useAudioPlayerStatus(player)`, which the provider exposes through context.

Play order and formatting live in pure modules (`playlist.ts`, `format.ts`, `types.ts`) so shuffle correctness and time formatting can be verified without a device.

The config plugin was constrained to foreground-only for Phase 4: `recordAudioAndroid: false`, `enableBackgroundPlayback: false`, `enableBackgroundRecording: false`. This avoided requesting the microphone permission and avoided the Android foreground-service/permission set while playback was foreground-only. Audio mode used `interruptionMode: 'doNotMix'` (take audio focus), `playsInSilentMode: true`, and `shouldPlayInBackground: false`. Phase 5 supersedes the background values (see D-011); microphone recording stays disabled.

Now Playing is implemented as a React Native `Modal` overlay rather than a new Expo Router route. The app uses `NativeTabs`, and its trigger list is the verified navigation shell; adding a non-tab route or nesting a Stack inside the tabs at this point would restructure tested navigation for a purely presentational screen. A modal keeps the verified shell intact. If Phase 9 wants a routable Now Playing screen with back-stack behavior, revisit the tab/stack structure then.

Track-end behavior: `repeat: 'one'` repeats the current track; `'all'` wraps to the first track; `'off'` stops and remains paused on the final track. `didJustFinish` is guarded by a ref so one finish cannot skip multiple tracks. Track-end and manual next/previous operate on the shuffled `order`, so shuffled playback advances through the shuffled sequence.

## D-011: Phase 5 background playback configuration

**Status:** implemented; physical-device validation pending (2026-10-13)

Background playback uses the `expo-audio` config plugin: `enableBackgroundPlayback: true` (which declares `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, and the `AudioControlsService` mediaPlayback foreground service on Android), while `recordAudioAndroid: false` and `enableBackgroundRecording: false` keep the microphone out of the app.

Notifications on Android 13+ need `POST_NOTIFICATIONS` declared and granted at runtime. The `expo-audio` plugin only adds that permission for background *recording*, so the app adds it through `app.json` `android.permissions`. The provider requests it once per session at the first user-initiated play via `requestNotificationPermissionsAsync()` (Android only, non-blocking); if denied, playback continues and only the notification/lock-screen surface is affected.

The audio session is set to `shouldPlayInBackground: true` (plus the existing `doNotMix` focus and `playsInSilentMode: true`). The provider activates lock-screen controls on every track change with `setActiveForLockScreen(true, { title })` and seek-forward/backward actions; `doNotMix` is required for the controls to associate with the player. Only honest metadata is shown: the track title, since `expo-media-library` exposes no artist/album/artwork (D-009). Headphone/Bluetooth disconnect handling is not provided by expo-audio 57.0.5; it is injected by the local source patch documented in D-012 and still needs device verification.

The remaining Phase 5 task — persisting and restoring a playback checkpoint — is deferred to the next increment: it will use `expo-sqlite`'s key/value API (per D-005) with a snapshot policy and a validate-before-restore step, and adding that native module should be combined with the Phase 6 database work so both arrive in one development build.

## D-012: Patch expo-audio Android source through shared prebuild + postinstall logic

**Status:** implemented; device validation pending (2026-10-26)

Two expo-audio 57.0.5 Android defects cannot be configured from JS: `requestAudioFocus()` uses `AUDIOFOCUS_GAIN_TRANSIENT` for `doNotMix` (a music player holding focus needs `AUDIOFOCUS_GAIN`), and `AudioModule` never registers an `ACTION_AUDIO_BECOMING_NOISY` receiver (so unplugging headphones routes audio to the speaker). Both are patched in the library source by `plugins/expo-audio-patch.js`: the focus constants are replaced and a `NoisyAudioReceiver` is declared, registered in `OnCreate`, and unregistered in `OnDestroy`.

The patch target is `node_modules/expo-audio/android`, because Expo autolinking compiles that directory directly and the generated `android/` project contains no copy of `AudioModule.kt`. The same module is invoked from two places — the `with-audio-focus-and-noisy-fix` config plugin during prebuild and `scripts/patch-expo-audio.js` from the `postinstall` script — so both a clean install and a regenerated native project run patched code. Every anchor is verified before writing; if an expo-audio update changes the source shape the install/prebuild fails with an explanatory error rather than silently shipping the unfixed behavior.

Trade-offs accepted: this mutates `node_modules`, so it must re-apply after dependency changes (the postinstall hook does that automatically); the patches are local rather than an upstream fork, and should be removed once expo-audio fixes the bugs. Do not replace this with hand-editing `android/`, which Continuous Native Generation deletes.

## Open questions requiring owner input or device evidence

1. Which Android OS versions and physical devices are the initial support/test floor?
2. Is Android-only acceptable through Phase 10, or should iOS/web have defined degraded behavior earlier?
3. Should SoundShelf treat user-created folders as a browse/filter concept, or only derive Songs, Artists, Albums, and search from MediaStore?
4. What threshold should qualify a play and make an annual Replay eligible? Until decided, do not display hard-coded recap numbers.
5. Does the Phase 3 device proof show that `expo-media-library` supplies enough metadata and artwork? If not, select and test a minimal native alternative before feature implementation.
6. Phase 4 foreground playback (queue semantics, seek, track-end, shuffle/repeat, and an unplayable file) is implemented but still needs a physical-device check; record the results before treating Phase 4 as complete.
7. Phase 5 needs physical-device evidence for sustained screen-off playback, notification/lock-screen actions, interruption recovery, and disconnect behavior, plus a playback-checkpoint persistence decision (snapshot policy and restore validation).

## Research references

- [Expo Audio SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/audio/)
- [Expo MediaLibrary SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/media-library/)
- [Expo SQLite SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/)
- [Expo permissions guide](https://docs.expo.dev/guides/permissions/)
- [Android 13 behavior changes](https://developer.android.com/about/versions/13/behavior-changes-13)
- [react-native-track-player repository and licensing note](https://github.com/doublesymmetry/react-native-track-player)
