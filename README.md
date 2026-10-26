# SoundShelf

SoundShelf is an Android-first, offline-first music player built with Expo, React Native, and TypeScript. It is designed for music that is already stored on a device: no streaming, downloads, account, cloud sync, social layer, or AI features.

The project is in active development. Its current local-library work is an early implementation, not a finished music player.

## What works today

- A mobile app shell with Home, Library, and Search tabs, including light and dark themes.
- A deliberate **Scan device music** action that requests Android audio access only when selected.
- Local audio discovery through Android's media library, paged for larger collections.
- Filename-based song titles, resolved local URIs, duration and file timestamps where available.
- A Songs/Albums library view and local, in-memory search by song title or filename. Albums use Android's per-file album id (the storage folder); tracks with no album id appear under "Unknown album".
- Clear empty, permission-denied (with an app-settings path when Android stops prompting), scan-error, and skipped-file states.
- **Foreground playback** with a queue, play/pause, next/previous, seek, shuffle, repeat (off/all/one), and automatic track-end advance. A mini-player sits on every tab and opens a full-screen Now Playing view.
- **Background playback**: the audio session keeps playing when the app is backgrounded, and the current track is surfaced through lock-screen and notification media controls. Sustained playback through screen lock and an active media session was verified on a physical device on 2026-10-13; the notification transport controls, audio-focus interruption, and headphone/Bluetooth disconnect still need device confirmation.

Library metadata is intentionally conservative: artist, genre, and embedded artwork are not shown yet. Album names reflect Android's reported folder names rather than parsed audio tags. Nothing is stored in a database yet: a killed process rescans automatically when audio permission is already granted, but the playback position is not restored after a restart.

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

Expo Go can be useful for basic UI checks, but it is not sufficient evidence for Android media-library or background-playback behavior. Use a SoundShelf development build for those tests.

## Install and run

```bash
npm install
npx expo start
```

For the currently implemented device-library scan and playback, connect an Android device with USB debugging enabled and create/run a local development build:

```bash
npx expo prebuild --clean --platform android
npx expo run:android --device
```

`expo-audio` is a native module, so playback requires a fresh development build (rebuilt after this change); an older build without it cannot play audio. Background playback and the lock-screen/notification controls also require a rebuilt development build, because they change native configuration through the `expo-audio` config plugin. On Android 13+, grant the notification permission when prompted at first play to see the media notification in the shade.

`npm install` also runs `scripts/patch-expo-audio.js`. It applies two local fixes to the installed `expo-audio` Android source (audio-focus type and headphone-disconnect handling); the same module runs again from the config plugin during prebuild. If an expo-audio update changes the source shape, install/prebuild fails with an explanatory error instead of building with the bugs — see [D-012](docs/DECISIONS.md).

Expo uses Continuous Native Generation for this repository. The `android/` directory is generated and git-ignored; do not commit or manually edit it. After any `app.json` or config-plugin change you must run `npx expo prebuild --clean --platform android` (or delete `android/`) before `npx expo run:android` — otherwise the existing `android/` folder is reused and the new native config never reaches the installed app. This is the usual reason a config change appears correct (e.g., in `npx expo config --type introspect`) yet has no effect on the device.

Once installed, open SoundShelf, select **Scan device music**, grant audio permission, then review the Library and Search tabs. Tap a song to play it; the mini-player opens the Now Playing screen, where you can seek, skip, shuffle, and change repeat. Test both a device containing audio files and the no-audio / permission-denied cases.

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
src/features/library/  local-media permission, scanning, and album grouping logic
src/features/playback/ queue, shuffle/repeat helpers, player provider, and Now Playing UI
src/hooks/             reusable React hooks
src/constants/         theme tokens and shared values
docs/                  roadmap, architecture, decisions, and handoff notes
plugins/               local config plugins and the expo-audio source patches
scripts/               install-time patch hook and project tooling
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

- Phase 5 is not finished: the notification/lock-screen transport controls, audio-focus interruption, and headphone/Bluetooth disconnect behavior still need physical-device verification, and no playback checkpoint is persisted yet.
- Scanned tracks live only in memory. A launch with audio permission already granted rescans automatically, but there is no database-backed library, playlist, history, or playback state yet.
- Artist, embedded artwork, and corrupt-file behavior require physical-device validation.
- Album grouping and names come from Android's media store but are not yet recorded as device-verified.
- Large libraries are rendered in `ScrollView` lists rather than virtualized lists, so very large collections may stutter (planned for the polish phase).
