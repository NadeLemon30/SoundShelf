# SoundShelf

SoundShelf is an Android-first, offline-first music player built with Expo, React Native, and TypeScript. It is designed for music that is already stored on a device: no streaming, downloads, account, cloud sync, social layer, or AI features.

The project is in active development. Its current local-library work is an early implementation, not a finished music player.

## What works today

- A mobile app shell with Home, Library, and Search tabs, including light and dark themes.
- A deliberate **Scan device music** action that requests Android audio access only when selected.
- Local audio discovery through Android's media library, paged for larger collections.
- Filename-based song titles, resolved local URIs, duration and file timestamps where available.
- A library list and local, in-memory search by song title or filename.
- Clear empty, permission-denied, scan-error, and skipped-file states.

Library metadata is intentionally conservative: artist, album, embedded artwork, and genre are not shown unless device testing verifies that they are available reliably. A scan is not yet saved across app restarts.

## Planned scope

SoundShelf will remain focused on private, local music use:

- Browse local songs, artists, and albums without requiring genre metadata.
- Foreground and background playback for local files.
- Playlists, favourites, recently played tracks, and durable local storage.
- Private listening analytics and Replay Stories based only on verified listening data.
- Android reliability, accessibility, and release readiness.

See the ordered [roadmap](docs/ROADMAP.md) for completion criteria and the current [progress handoff](docs/PROGRESS.md) for verified implementation and device-test status.

## Requirements

- Node.js 22.13 or later (Expo SDK 57 dependencies require this minimum).
- npm; the repository uses `package-lock.json`.
- Android Studio / Android SDK and a physical Android device for device-library and playback testing.

Expo Go can be useful for basic UI checks, but it is not sufficient evidence for Android media-library or future background-playback behavior. Use a SoundShelf development build for those tests.

## Install and run

```bash
npm install
npx expo start
```

For the currently implemented device-library scan, connect an Android device with USB debugging enabled and create/run a local development build:

```bash
npx expo run:android --device
```

Expo uses Continuous Native Generation for this repository. The command generates the Android project as part of the build; do not add or manually edit a committed `android/` directory.

Once installed, open SoundShelf, select **Scan device music**, grant audio permission, then review the Library and Search tabs. Test both a device containing audio files and the no-audio / permission-denied cases.

## Quality checks

Run these before submitting changes:

```bash
npm run lint
npx tsc --noEmit
npx expo config --type public
git diff --check
```

In PowerShell environments that block `npm.ps1`, use `npm.cmd` and `npx.cmd` instead.

Use `npx expo install <package>` when adding an Expo or React Native package, so it stays compatible with Expo SDK 57. Native-module or configuration changes require a new development build.

## Android APK releases

Pushing a tag beginning with `v` (for example, `v1.0.0`) runs [Release Android APK](.github/workflows/release-apk.yml). The GitHub Actions workflow installs dependencies, generates the Android project, builds an APK, creates a GitHub Release, and uploads `SoundShelf-<tag>.apk`.

At present, the workflow uses the generated debug signing configuration. Its APK is for direct testing only and is not suitable for Play Store distribution. A protected release-signing setup is required before a public release.

## Project structure

```text
src/app/               Expo Router screens and navigation layouts
src/components/        reusable UI components
src/features/library/  local-media permission and scanning logic
src/hooks/             reusable React hooks
src/constants/         theme tokens and shared values
docs/                  roadmap, architecture, decisions, and handoff notes
.github/workflows/     APK release automation
```

Routes belong in `src/app/`; feature logic and reusable code belong outside it.

## Documentation

- [Project rules and contributor workflow](AGENTS.md)
- [Roadmap](docs/ROADMAP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Technical decisions](docs/DECISIONS.md)
- [Current progress and test evidence](docs/PROGRESS.md)

## Current limitations

- Playback controls, queues, and background playback are not implemented.
- Scanned tracks are held only in memory and are lost after restarting the app.
- Artist, album, artwork, and corrupt-file behavior require physical-device validation.
- The local-media flow requires a development-build test before it can be considered verified.
