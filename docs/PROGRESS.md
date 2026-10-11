# SoundShelf progress and handoff

## Verified state

## Latest verified update (2026-10-12)

- **Current phase:** 3 — Local music library. Owner approval is recorded.
- The Android development build installed and launched. Navigation, light/dark themes, safe areas, and the mini-player placeholder passed the device check.
- Audio permission was requested, but the first release-APK scan failed before returning any tracks. The displayed error identified the cause: the legacy MediaLibrary call received `true` as a sort key.
- Fixed the malformed legacy `sortBy` value in `src/features/library/media-library-service.ts` by nesting the `[key, ascending]` tuple inside the `sortBy` list. Artist, album, artwork, URI/playback, and corrupt-file behavior remain unverified until a rebuilt APK is tested.
- A rebuilt GitHub APK now scans successfully. The provider also subscribes to media-library changes after a successful scan and marks the library for a user-triggered rescan. This behavior still needs device verification.
- Removed the stale explicit Android permission list from `app.json`; the installed Expo MediaLibrary plugin remains responsible for its generated, version-compatible audio permission declarations.

## Current next step

Build and install a GitHub release APK containing the rescan update, add or remove a local audio file, and confirm that SoundShelf displays the rescan notice and refreshes the track list. Record the number of tracks returned, skipped items, URI/playback behavior, and metadata/artwork availability. Do not add artist, album, or artwork support until the available device metadata is documented.

- **Current phase:** 2 — Foundation and UI.
- **Phase status:** implementation is complete in the workspace; Android device navigation testing remains before Phase 2 can be marked complete. Do not begin Phase 3 without explicit owner approval.
- **Repository baseline:** initial commit `d0f2289` (`Initial commit`), now followed by uncommitted Phase 1 documentation and Phase 2 foundation work.
- **Framework:** Expo SDK 57 (`expo ~57.0.27`), React Native 0.86.3, React 19.2.3, TypeScript 6.0.3, Expo Router 57.
- **Package manager:** npm (`package-lock.json` exists; no Bun lockfile).
- **Native projects:** no `android/` or `ios/` directories; use CNG/config plugins when native configuration is needed.

## GitHub APK release automation (2026-10-11)

- Added `.github/workflows/release-apk.yml`. Pushing a Git tag whose name starts with `v` (for example, `v1.0.0`) now starts a GitHub Actions workflow that installs dependencies, runs Expo prebuild in the ephemeral runner, builds Android `assembleRelease`, and uploads `SoundShelf-<tag>.apk` to the generated GitHub Release.
- The workflow intentionally retains Continuous Native Generation: it does not commit or manually maintain `android/`.
- The generated release APK currently uses Expo/React Native's debug signing configuration, as this repository has no distribution keystore. It is installable for testing, but it is not a Play Store-signed artifact. Add a protected signing-key workflow later before public distribution.

## Phase 3 update (2026-10-11)

- **Current phase:** 3 — Local music library.
- **Phase status:** owner approved Phase 3. The first device-library scan increment is implemented; a physical Android proof is required before this phase can be completed or expanded to full metadata browsing.
- Installed SDK-compatible `expo-media-library` 57.0.5 with `npx expo install` and configured its plugin for audio-only Android granular permission.
- Added an explicit user-triggered scan flow: it asks for the runtime `audio` permission, queries audio through the Expo Go-compatible cursor API in pages of 100, resolves a URI before a track is exposed, omits assets that fail URI/info resolution, and handles denial/error/empty states.
- Corrected the initial scanner implementation after runtime testing: the SDK 57 “next” MediaLibrary API requires `ExpoMediaLibraryNext`, which is not included in Expo Go. The app now imports `expo-media-library/legacy`, which targets Expo Go's existing native module. Expo Go still warns that full Android media-library testing requires a development build.
- Installed `expo-dev-client` 57.0.14 to prepare an app-specific Android development build. A build has not been started because it needs the owner's choice of local Android tooling or EAS/cloud build and, for EAS, account authentication.
- Added scanned-song browsing and local search by filename-derived title or filename. Artist, album, and artwork data are not fabricated.

## Completed in this session (2026-10-11)

- Rewrote `README.md` as current app documentation: implemented local scanning/search behavior, privacy boundaries, installation and Android development-build guidance, validation commands, APK-release workflow, project layout, and known limitations.
- Inspected root instructions, source tree, package/app configuration, starter routes, Git status, and existing documentation.
- Confirmed the project is a new starter rather than an existing SoundShelf implementation. Existing routes and components are Expo starter UI and are intentionally untouched.
- Replaced the generic starter README with SoundShelf setup and workflow information.
- Expanded root `AGENTS.md` with scope, cross-agent continuity, Expo SDK verification, phase-gate, and verification rules.
- Added roadmap, proposed architecture, decision log, and this durable progress handoff.
- Researched Expo SDK 57 Audio, MediaLibrary, SQLite, development builds, and Android media permissions. Sources are listed in `ARCHITECTURE.md` and `DECISIONS.md`.
- Received owner approval to begin Phase 2.
- Replaced Expo starter screens with the SoundShelf Home, Library, and Search route shell. Library and Search intentionally show truthful pre-scan states; no device media permission or feature logic was added.
- Added reusable `Screen`, `ArtworkPlaceholder`, `EmptyState`, and non-playing `MiniPlayer` foundation components.
- Reworked light/dark theme tokens while keeping compatibility aliases for unused starter components, and simplified the web color-scheme hook to satisfy React Compiler linting.
- Configured Expo's standard ESLint flat configuration and its compatible development dependencies, then resolved the resulting lint finding.

## Unfinished work / known constraints

- Local-media discovery, playback, persistence, analytics, and Replay Stories are not implemented.
- `expo-audio`, `expo-media-library`, and `expo-sqlite` remain recommendations only; none are installed or configured.
- Android device navigation, light/dark theme appearance, safe-area behavior, and mini-player layout have not yet been manually tested.
- The local environment uses Node 22.12.0, while several Expo SDK 57 / React Native transitive packages report a minimum Node 22.13.0. Lint and type-check pass, but upgrade Node before relying on local Metro or build behavior.
- Whether `expo-media-library` exposes enough real-device audio metadata and embedded artwork remains unverified. Do not represent it as resolved.
- Background playback must be validated in an Android development build after the Audio config plugin is introduced; Expo Go is insufficient release evidence.
- Play-count qualification, local time-zone bucket policy, Replay eligibility, Android support floor, and folder-browsing expectations are still open.

## Files changed in this session

- `AGENTS.md`
- `README.md`
- `docs/ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/PROGRESS.md`
- `package.json`
- `package-lock.json`
- `eslint.config.js`
- `src/app/_layout.tsx`
- `src/app/index.tsx`
- `src/app/library.tsx`
- `src/app/search.tsx`
- `src/components/app-tabs.tsx`
- `src/components/app-tabs.web.tsx`
- `src/components/ui/artwork-placeholder.tsx`
- `src/components/ui/empty-state.tsx`
- `src/components/ui/mini-player.tsx`
- `src/components/ui/screen.tsx`
- `src/constants/theme.ts`
- `src/global.d.ts`
- `src/hooks/use-color-scheme.web.ts`
- `app.json`
- `src/features/library/types.ts`
- `src/features/library/media-library-service.ts`
- `src/features/library/library-provider.tsx`

## Verification record

| Command / check | Result |
| --- | --- |
| Repository and Git inspection | Passed: one initial commit; no pre-existing working-tree changes before documentation edits. |
| Read root and nested `AGENTS.md` files | Passed: only root `AGENTS.md` exists. |
| Read package/app/TypeScript config and starter routes | Passed: findings recorded above. |
| Expo/Android documentation research | Passed: SDK 57 and Android primary sources recorded in decision/architecture docs. |
| `npx.cmd expo lint` | Passed after Expo configured ESLint; the initial run found and Phase 2 resolved the web color-scheme hook issue. |
| `npm.cmd run lint` | Passed. `npm.cmd` is required in this PowerShell environment because `npm.ps1` is blocked by execution policy. |
| `npx.cmd tsc --noEmit` | Passed after Phase 2 added the CSS module declaration and retained backwards-compatible theme tokens. |
| `npx.cmd expo config --type public` | Passed; resolved SDK version is 57.0.0 and the public app configuration is valid. |
| `npm.cmd install --save-dev eslint eslint-config-expo` | Completed to move the Expo-configured lint packages into `devDependencies`; npm emitted Node-engine warnings because local Node is 22.12.0 and several packages require 22.13.0 or later. |
| `npx.cmd expo install expo-media-library` | Passed; installed `expo-media-library` 57.0.5. npm emitted the same Node 22.12.0 engine warnings. |
| `npm.cmd run lint` after Phase 3 increment | Passed. |
| `npx.cmd tsc --noEmit` after Phase 3 increment | Passed. |
| `npx.cmd expo config --type public` after Phase 3 increment | Passed; plugin resolves with Android `READ_MEDIA_AUDIO` plus module-provided compatibility declarations. |
| `git diff --check` after Phase 3 increment | Passed. |
| GitHub APK workflow static review | Passed: tag trigger, release write permission, CNG prebuild, Java 17, Node 22.13.1, Gradle APK path, and release asset upload are configured. GitHub-hosted execution remains unverified until a `v*` tag is pushed. |
| `npm.cmd run lint`, `npx.cmd tsc --noEmit`, `npx.cmd expo config --type public`, and `git diff --check` after GitHub workflow addition | Passed. |
| README documentation review | Passed: the README matches the implemented in-memory audio scan/search flow and labels unverified or unimplemented functionality as limitations. |
| `npm.cmd run lint`, `npx.cmd tsc --noEmit`, `npx.cmd expo config --type public`, and `git diff --check` after the sort fix | Passed. |
| `npm.cmd run lint`, `npx.cmd tsc --noEmit`, `npx.cmd expo config --type public`, and `git diff --check` after the rescan update and permission-config cleanup | Passed. Expo config resolves the MediaLibrary module's Android compatibility declarations, including `READ_MEDIA_AUDIO`. |

## Exact next step

**Run the Phase 2 shell on a physical Android device and verify Home, Library, and Search navigation; light/dark themes; safe areas; and the mini-player placeholder. Then record results here. Wait for owner approval before beginning Phase 3 local-media discovery.**

**Current next step:** Install/run the app on a physical Android device with local audio and select “Scan device music.” Record Android version, permission behavior, scan results, URI/playback viability, missing/corrupt-file behavior, and metadata/artwork availability. Also complete the outstanding Phase 2 navigation/theme/safe-area/mini-player check. Do not mark Phase 3 complete or add a metadata-native module until that proof is recorded.

**ADB development-build status (2026-10-11):** Owner selected a local ADB build. Android SDK was found at `C:\Users\Nade\AppData\Local\Android\Sdk`; `platform-tools\adb.exe` starts successfully, but `adb devices` currently shows no connected/authorized device. After the device is connected with USB debugging enabled and its RSA prompt accepted, run `npx.cmd expo run:android --device` with the SDK's `platform-tools` directory added to `PATH` for that command. Do not manually create or edit `android/`; Expo CLI will generate its temporary CNG project for the build.

**Android device-test attempt (2026-10-11):** An authorized USB device is now connected: `25078RA3EA` (Android 15 / API 35). `adb devices -l` reported it as `device`. `npx.cmd expo run:android --device DE75AAFUUSAU5LLN` did not accept the ADB serial; retrying with the detected device name (`25078RA3EA`) began the Expo/Gradle build and generated the CNG `android/` project. The build has not yet produced an APK or installed `com.nadelemon.soundshelf`, so no UI, permission, scan, or playback behavior has been verified. At the last check, Gradle 9.3.1 reported two busy daemons (PIDs 16836 and 11020). Do not call this a completed device test; obtain the build's terminal outcome before retrying or interacting with the app.

**Latest local verification (2026-10-11):** `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `git diff --check` completed successfully before the Android build attempt.
