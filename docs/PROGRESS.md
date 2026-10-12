# SoundShelf progress and handoff

## Current state

- **Current phase:** 4 — Core playback (foreground). The owner reported a Phase 3 device test on 2026-10-12 and approved moving to Phase 4.
- **Repository baseline:** `d0f2289` (`Initial commit`). Recent committed work includes the album-browsing, permission-denial, and empty-library increments on 2026-10-12; the Phase 4 foreground-playback increment is described below.
- **Framework:** Expo SDK 57 (`expo ~57.0.27`), React Native 0.86.3, React 19.2.3, TypeScript 6.0.3, Expo Router 57.
- **Package manager:** npm (`package-lock.json` exists; no Bun lockfile).
- **Native projects:** no `android/` or `ios/` directories; use CNG/config plugins when native configuration is needed.

## Update (2026-10-12) — Phase 4 foreground playback

- Installed SDK-compatible `expo-audio` `~57.0.5` with `npx expo install`. `expo install` added the `expo-audio` config plugin; it was then constrained explicitly to `recordAudioAndroid: false`, `enableBackgroundPlayback: false`, `enableBackgroundRecording: false` so Phase 4 does not request the microphone permission or add the Android background-service/permission set (that is Phase 5 scope).
- Added `src/features/playback/`:
  - `types.ts` — `RepeatMode` and the `off → all → one` cycle (pure).
  - `playlist.ts` — pure `naturalOrder`, `shuffledOrder` (Fisher-Yates with injectable RNG, keeps the current track first), and `positionInOrder`.
  - `format.ts` — pure `formatPlaybackTime` and `playbackPercent`.
  - `playback-provider.tsx` — one root `expo-audio` player plus queue, play `order`, index, repeat, shuffle, and actions; subscribes to `playbackStatusUpdate` directly to keep position ticks out of the app-wide render path.
  - `components/now-playing.tsx` — a `Modal`-based Now Playing view (seek, previous/play-pause/next, shuffle, repeat).
- Rewrote `src/components/ui/mini-player.tsx` into a working mini-player: shows the current track, play/pause, next, a thin progress bar, and opens Now Playing. Shows an idle state when nothing is playing.
- Wired playback into `src/app/library.tsx` (Songs and album detail) and `src/app/search.tsx` via new `LibraryTrackRow` press handling and a "current track" indicator; wrapped the app in `PlaybackProvider` in `src/app/_layout.tsx`.
- Playback is **foreground-only** and the configured audio mode is `interruptionMode: 'doNotMix'`, `playsInSilentMode: true`, `shouldPlayInBackground: false`.
- **Not device-verified:** queue semantics, seek, next/previous, shuffle/repeat, track-end advance, the Now Playing modal, and playing a real local file all require a rebuilt development build containing the new native module. `expo-audio` is native, so an older build cannot play audio.
- Files: `app.json`, `package.json`, `package-lock.json`, `src/app/_layout.tsx`, `src/app/library.tsx`, `src/app/search.tsx`, `src/components/ui/mini-player.tsx`, `src/features/library/components/library-rows.tsx`, and the new `src/features/playback/*`.

## Update (2026-10-12) — honest empty-library state

- A finished scan that returns zero tracks now shows "No music found" with a "Scan again" action instead of the pre-scan "No music scanned yet" copy, which wrongly implied the user had not scanned at all. The Search tab reflects the same distinction.
- **Not device-verified:** the empty-library flow needs a device with no audio (or with its audio removed).
- Files: `src/app/library.tsx`, `src/app/search.tsx`.

## Update (2026-10-12) — permission denial handling

- The Library screen now distinguishes a temporary denial from a permanent one. When `requestPermissionsAsync` reports `canAskAgain === false`, the denied state explains that access is turned off and offers an "Open app settings" button (`Linking.openSettings()`) instead of a retry that Android would silently ignore.
- While the library is denied, returning to the foreground re-checks `getPermissionsAsync`. If access was granted in system settings the scan runs automatically; otherwise the blocked flag is refreshed so the correct action stays visible.
- **Not device-verified:** permission flows require a physical Android device; this increment is verified by lint/type-check only.
- Files: `src/features/library/library-provider.tsx`, `src/app/library.tsx`.

## Update (2026-10-12) — album browsing

- Added a Songs/Albums switch to the Library screen. Albums are grouped from each track's Android album id (`MediaStore` `BUCKET_ID`, exposed as legacy `expo-media-library` `Asset.albumId`). Album names come from `getAlbumsAsync()` (`BUCKET_DISPLAY_NAME`, the Android storage folder name).
- Tracks with no album id, or with a name that cannot be resolved, fall back to an honest "Unknown album" group. Artist, genre, embedded title, and embedded artwork are still neither read nor fabricated.
- New/changed files: `src/features/library/albums.ts` (new pure grouping helper), `src/features/library/components/library-rows.tsx` (new track/album rows), `src/features/library/types.ts`, `src/features/library/media-library-service.ts`, `src/features/library/library-provider.tsx`, `src/app/library.tsx`, plus `README.md`, `docs/DECISIONS.md` (D-009), and `docs/ARCHITECTURE.md`.
- **Not device-verified:** no Android device was connected during this session (`adb devices` was empty), so album grouping and album names still require the physical-device proof.

## Update (2026-10-12) — rescan fix

- Audio permission was requested, but the first release-APK scan failed before returning any tracks. The displayed error identified the cause: the legacy MediaLibrary call received `true` as a sort key.
- Fixed the malformed legacy `sortBy` value in `src/features/library/media-library-service.ts` by nesting the `[key, ascending]` tuple inside the `sortBy` list.
- A rebuilt GitHub APK now scans successfully. The provider also subscribes to media-library changes after a successful scan and marks the library for a user-triggered rescan. This behavior still needs device verification.
- Removed the stale explicit Android permission list from `app.json`; the installed Expo MediaLibrary plugin remains responsible for its generated, version-compatible audio permission declarations.

## Update (2026-10-11) — Phase 3 scan increment

- **Phase status:** owner approved Phase 3. The first device-library scan increment is implemented; a physical Android proof is required before this phase can be completed or expanded to full metadata browsing.
- Installed SDK-compatible `expo-media-library` 57.0.5 with `npx expo install` and configured its plugin for audio-only Android granular permission.
- Added an explicit user-triggered scan flow: it asks for the runtime `audio` permission, queries audio through the Expo Go-compatible cursor API in pages of 100, resolves a URI before a track is exposed, omits assets that fail URI/info resolution, and handles denial/error/empty states.
- Corrected the initial scanner implementation after runtime testing: the SDK 57 "next" MediaLibrary API requires `ExpoMediaLibraryNext`, which is not included in Expo Go. The app now imports `expo-media-library/legacy`, which targets Expo Go's existing native module. Expo Go still warns that full Android media-library testing requires a development build.
- Installed `expo-dev-client` to prepare an app-specific Android development build. The Android development build later installed and launched successfully.
- Added scanned-song browsing and local search by filename-derived title or filename. Artist and artwork data are not fabricated.

## Update (2026-10-11) — Phase 1 and Phase 2 foundation

- Rewrote `README.md` as current app documentation: implemented local scanning/search behavior, privacy boundaries, installation and Android development-build guidance, validation commands, APK-release workflow, project layout, and known limitations.
- Inspected root instructions, source tree, package/app configuration, starter routes, Git status, and existing documentation; confirmed the project began as a fresh Expo starter.
- Expanded root `AGENTS.md` with scope, cross-agent continuity, Expo SDK verification, phase-gate, and verification rules.
- Added roadmap, proposed architecture, decision log, and this durable progress handoff.
- Researched Expo SDK 57 Audio, MediaLibrary, SQLite, development builds, and Android media permissions. Sources are listed in `ARCHITECTURE.md` and `DECISIONS.md`.
- Received owner approval to begin Phase 2.
- Replaced Expo starter screens with the SoundShelf Home, Library, and Search route shell.
- Added reusable `Screen`, `ArtworkPlaceholder`, `EmptyState`, and non-playing `MiniPlayer` foundation components.
- Reworked light/dark theme tokens while keeping compatibility aliases for unused starter components, and simplified the web color-scheme hook to satisfy React Compiler linting.
- Configured Expo's standard ESLint flat configuration and its compatible development dependencies, then resolved the resulting lint finding.

## GitHub APK release automation (2026-10-11)

- Added `.github/workflows/release-apk.yml`. Pushing a Git tag whose name starts with `v` (for example, `v1.0.0`) starts a GitHub Actions workflow that installs dependencies, runs Expo prebuild in the ephemeral runner, builds Android `assembleRelease`, and uploads `SoundShelf-<tag>.apk` to the generated GitHub Release.
- The workflow intentionally retains Continuous Native Generation: it does not commit or manually maintain `android/`.
- The generated release APK currently uses Expo/React Native's debug signing configuration, as this repository has no distribution keystore. It is installable for testing, but it is not a Play Store-signed artifact. Add a protected signing-key workflow later before public distribution.

## Device-test history

- **2026-10-11:** Owner selected a local ADB build. Android SDK found at `C:\Users\Nade\AppData\Local\Android\Sdk`. An authorized USB device `25078RA3EA` (Android 15 / API 35) was connected and `npx.cmd expo run:android --device 25078RA3EA` generated the CNG `android/` project and built the app. The Android development build installed and launched; navigation, themes, safe areas, and the mini-player placeholder passed the check.
- **2026-10-12:** A rebuilt GitHub release APK scanned successfully (see the rescan-fix update above). The owner subsequently reported device testing completed and approved moving to Phase 4; detailed figures were not captured in this session.
- **2026-10-12 (Phase 4):** No device was attached during the foreground-playback implementation (`adb devices` not checked into this session). Playback requires a rebuilt development build that includes `expo-audio`.

## Unfinished work / known constraints

- Playback is **foreground-only**; persistence, background playback, analytics, and Replay Stories are not implemented.
- `expo-audio` is now installed and used for foreground playback. `expo-sqlite` is still a recommendation only; `expo-media-library` is installed and used.
- Phase 4 foreground playback is implemented but not yet device-verified. `expo-audio` is a native module, so it requires a freshly generated development build; an older build cannot play audio.
- Local-media discovery and album grouping are implemented; the owner reported a device test, but detailed figures were not recorded in this session.
- Whether `expo-media-library` exposes enough real-device audio metadata and embedded artwork remains unverified. Album grouping uses the device album id and is not the same as parsed audio tags; artist and artwork are not available from this API and are not fabricated.
- The local environment uses Node 22.12.0, while several Expo SDK 57 / React Native transitive packages report a minimum Node 22.13.0. Lint and type-check pass, but upgrade Node before relying on local Metro or build behavior.
- Background playback must be validated in an Android development build after the audio config plugin is enabled for it (`enableBackgroundPlayback`) and lock-screen controls are wired; Expo Go is insufficient release evidence.
- Play-count qualification, local time-zone bucket policy, Replay eligibility, Android support floor, and folder-browsing expectations are still open.

## Files changed in recent increments

Album browsing (2026-10-12):

- `src/features/library/types.ts`
- `src/features/library/albums.ts` (new)
- `src/features/library/components/library-rows.tsx` (new)
- `src/features/library/media-library-service.ts`
- `src/features/library/library-provider.tsx`
- `src/app/library.tsx`
- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/PROGRESS.md`

Permission denial handling (2026-10-12):

- `src/features/library/library-provider.tsx`
- `src/app/library.tsx`
- `docs/PROGRESS.md`

Empty-library state (2026-10-12):

- `src/app/library.tsx`
- `src/app/search.tsx`
- `docs/PROGRESS.md`

Phase 4 foreground playback (2026-10-12):

- `src/features/playback/types.ts` (new)
- `src/features/playback/playlist.ts` (new)
- `src/features/playback/format.ts` (new)
- `src/features/playback/playback-provider.tsx` (new)
- `src/features/playback/components/now-playing.tsx` (new)
- `src/components/ui/mini-player.tsx`
- `src/features/library/components/library-rows.tsx`
- `src/app/_layout.tsx`
- `src/app/library.tsx`
- `src/app/search.tsx`
- `app.json` (expo-audio plugin, foreground-only options)
- `package.json`, `package-lock.json` (added `expo-audio ~57.0.5`)
- `README.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/PROGRESS.md`

## Verification record

| Command / check | Result |
| --- | --- |
| Repository and Git inspection | Passed: working tree clean at session start; latest commit `29a85fb`. |
| Read root and nested `AGENTS.md` files | Passed: only root `AGENTS.md` exists. |
| Expo/Android documentation research | Passed: SDK 57 and Android primary sources recorded in decision/architecture docs. |
| `npm.cmd run lint` | Passed. `npm.cmd` is required in this PowerShell environment because `npm.ps1` is blocked by execution policy. |
| `npx.cmd tsc --noEmit` | Passed. |
| `npx.cmd expo config --type public` | Passed; resolved SDK version is 57.0.0 and the public app configuration is valid. |
| `npm.cmd install --save-dev eslint eslint-config-expo` | Completed; npm emitted Node-engine warnings (local Node 22.12.0 vs. required 22.13.0). |
| `npx.cmd expo install expo-media-library` | Passed; installed `expo-media-library` 57.0.5 (same Node-engine warnings). |
| `github workflow` static review | Passed: tag trigger, release write permission, CNG prebuild, Java 17, Node 22.13.1, Gradle APK path, and release asset upload configured. GitHub-hosted execution remains unverified until a `v*` tag is pushed. |
| `npm.cmd run lint` after the sort fix | Passed. |
| `npm.cmd run lint`, `npx.cmd tsc --noEmit`, `npx.cmd expo config --type public`, and `git diff --check` after the rescan update and permission-config cleanup | Passed. Expo config resolves the MediaLibrary module's Android compatibility declarations, including `READ_MEDIA_AUDIO`. |
| `npm.cmd run lint` after the album-browsing increment | Passed. |
| `npx.cmd tsc --noEmit` after the album-browsing increment | Passed. |
| `git diff --check` after the album-browsing increment | Passed (only pre-existing LF→CRLF warnings). |
| `adb devices` during the album-browsing session | No device attached; album grouping/titles remain device-unverified. |
| `npm.cmd run lint` after the permission-denial increment | Passed. |
| `npx.cmd tsc --noEmit` after the permission-denial increment | Passed. |
| `npm.cmd run lint` after the empty-library increment | Passed. |
| `npx.cmd tsc --noEmit` after the empty-library increment | Passed. |
| `npx.cmd expo install expo-audio` | Passed; installed `expo-audio` 57.0.5 and added the plugin to `app.json` (same Node-engine warnings). |
| `npm.cmd run lint` after the Phase 4 playback increment | Passed. |
| `npx.cmd tsc --noEmit` after the Phase 4 playback increment | Passed. |
| `npx.cmd expo config --type public` after the Phase 4 plugin configuration | Passed; resolved `expo-audio` with `recordAudioAndroid: false` and `enableBackgroundPlayback: false`. |
| Pure-helper execution checks (`node --experimental-strip-types`) | Passed: `naturalOrder`, `shuffledOrder` (keeps current track first, valid permutation), `positionInOrder`, `formatPlaybackTime`, `playbackPercent`, and the repeat-mode cycle `off → all → one → off`. |
| Physical-device playback check | Pending: requires a rebuilt development build that contains the new `expo-audio` native module. |

## Exact next step

1. Rebuild and install a development build that contains the new `expo-audio` native module (`npx expo run:android --device` or a fresh release-APK tag), since playback cannot work on an older build.
2. On the physical device: scan music, then on the device verify each foreground-playback item and record results in `docs/PROGRESS.md`: tapping a song starts audio; the mini-player shows the track and works across Home/Library/Search; play/pause, next/previous (including the >3-second restart rule), seek by tapping the Now Playing bar, shuffle (order only changes), repeat off/all/one, track-end advance/wrap/stop, the "current track" indicator following playback in Songs/album/Search lists, and how an unplayable/corrupt file surfaces via the Now Playing error text.
3. Confirm the foreground-only boundary: audio stops when the app is backgrounded (expected until Phase 5), and no microphone permission is requested (the `expo-audio` plugin only adds `MODIFY_AUDIO_SETTINGS` on Android).

Do not mark Phase 4 complete until those device results are recorded. Phase 5 (background playback) must not start without explicit owner approval, and it will flip the audio config to `enableBackgroundPlayback: true` and add lock-screen/notification controls.
