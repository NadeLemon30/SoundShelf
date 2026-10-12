# SoundShelf progress and handoff

## Current state

- **Current phase:** 3 — Local music library. Owner approval is recorded (2026-10-11). Phase 2's device check (navigation, light/dark themes, safe areas, mini-player placeholder) passed.
- **Repository baseline:** `d0f2289` (`Initial commit`); the latest committed work is `29a85fb` (`rescan update`). The 2026-10-12 album-browsing increment described below is uncommitted at the time of writing.
- **Framework:** Expo SDK 57 (`expo ~57.0.27`), React Native 0.86.3, React 19.2.3, TypeScript 6.0.3, Expo Router 57.
- **Package manager:** npm (`package-lock.json` exists; no Bun lockfile).
- **Native projects:** no `android/` or `ios/` directories; use CNG/config plugins when native configuration is needed.

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
- **2026-10-12:** A rebuilt GitHub release APK scanned successfully (see the rescan-fix update above).
- No device has been attached since; `adb devices` was empty during the album-browsing session.

## Unfinished work / known constraints

- Playback, persistence, analytics, and Replay Stories are not implemented.
- `expo-audio` and `expo-sqlite` remain recommendations only; neither is installed or configured. `expo-media-library` is installed and used.
- Local-media discovery and album grouping are implemented but not yet verified on a physical device with real files.
- Whether `expo-media-library` exposes enough real-device audio metadata and embedded artwork remains unverified. Album grouping uses the device album id and is not the same as parsed audio tags; artist and artwork are not available from this API and are not fabricated.
- The local environment uses Node 22.12.0, while several Expo SDK 57 / React Native transitive packages report a minimum Node 22.13.0. Lint and type-check pass, but upgrade Node before relying on local Metro or build behavior.
- Background playback must be validated in an Android development build after the Audio config plugin is introduced; Expo Go is insufficient release evidence.
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

## Exact next step

Build and install a GitHub release APK containing the rescan update and the album-browsing increment, add or remove a local audio file, and confirm that SoundShelf displays the rescan notice and refreshes the track list. On the same device check, open the Albums view and record: number of tracks returned, skipped items, album groups and their names (versus the folders on the device), any "Unknown album" grouping, URI/playback behavior, and metadata/artwork availability.

Do not mark Phase 3 complete or add artist/artwork support until that proof is recorded. If the device proof shows `expo-media-library` cannot supply artist or embedded-artwork data, record the finding in `DECISIONS.md` before evaluating a minimal native metadata module.
