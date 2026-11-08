# SoundShelf release checklist (Phase 10)

This checklist supports Phase 10 (testing and release). It is **not** a claim that all items are complete. Record results in `docs/PROGRESS.md` and link device/build evidence.

## Pre-release gates

- [ ] **Owner-approved phase status:** Phases 1–8 implemented/verified as recorded; Phase 9 evidence gaps (if any) are explicitly accepted or closed.
- [ ] **Static checks pass:** `npm run lint`, `npx tsc --noEmit`, `node --test tests/listening-model.test.mjs`, `node --test tests/replay-model.test.mjs`, `npx expo config --type public`, `git diff --check`.
- [ ] **Native/config changes applied:** if `app.json`, plugins, or native deps changed, run `npx expo prebuild --clean --platform android` before device builds.
- [ ] **expo-audio patch verified in release builds:** GitHub workflow checks for `NoisyAudioReceiver` in the APK; local release builds must also confirm patched source was compiled (see `AGENTS.md`).

## Android identity and versioning

- [ ] `app.json` has correct `expo.name`, `slug`, `version`, `android.package`, and icons/splash.
- [ ] Tag-based workflow (`.github/workflows/release-apk.yml`) derives `vMAJOR.MINOR.PATCH` → app version + Android `versionCode`. Use strict tags only.
- [ ] **Signing:** current workflow APK is debug-signed (testing only). Play Store/public distribution requires a protected release keystore/signing setup and AAB (`eas build -p android --profile production` or equivalent).

## Device regression matrix (minimum)

Test on at least one physical Android device (record model, Android version, build type). Record results in `docs/PROGRESS.md` (or link evidence) using the template below.

- [ ] Install/launch, permissions (grant/deny/blocked/settings path), scan with audio and empty library.
- [ ] Library browse/search, missing metadata/artwork placeholders, album/artist grouping sanity.
- [ ] Playback: play/pause, next/prev, seek, shuffle, repeat, queue, track-end behavior, unplayable/corrupt file handling.
- [ ] Background: screen off/lock, notification controls, audio focus interruption, headphone/Bluetooth disconnect (as applicable), resume policy/checkpoint.
- [ ] Personal library: favorites, playlists (create/add/remove/order/delete), recents, checkpoint restore (paused), stale-track behavior after rescan.
- [ ] Analytics: qualification thresholds, pause/seek/skip accounting, local midnight boundary, restart recovery, clear history scope.
- [ ] Replay: eligible recap, insufficient-history shortfall (never fabricated), Android share-card flow.
- [ ] UI/reliability: TalkBack labels/focus, large-library scrolling, mini-player/tab overlap, settings/about, theme/readability.

## Regression results template

| Area | Device / Android / build | Result | Evidence / notes | Date |
| --- | --- | --- | --- | --- |
| Static checks (lint/typecheck/tests/config) | Dev machine / Node 22 / local | Pass/Fail | Command output summary | YYYY-MM-DD |
| Install/launch/permissions/scan |  | Pass/Fail/Blocked |  |  |
| Library/search/metadata/artwork |  | Pass/Fail/Blocked |  |  |
| Playback/queue/controls/corrupt files |  | Pass/Fail/Blocked |  |  |
| Background/notification/focus/disconnect/checkpoint |  | Pass/Fail/Blocked |  |  |
| Personal library/favorites/playlists/recents |  | Pass/Fail/Blocked |  |  |
| Analytics thresholds/midnight/restart/clear |  | Pass/Fail/Blocked |  |  |
| Replay eligible/insufficient/share |  | Pass/Fail/Blocked |  |  |
| TalkBack/large-library/UI reliability |  | Pass/Fail/Blocked |  |  |

## Known release risks (carry forward if unresolved)

- Phase 9 device profiling, full TalkBack regression, and complete regression evidence were not finished before owner-directed Phase 10 start (2026-11-08).
- Scanned device tracks are in-memory (rescanned on launch when permission granted); SQLite stores SoundShelf-owned personal/analytics data only.
- Some historical Phase 5/6/7/8 device evidence is owner-reported without full per-check detail in `PROGRESS.md`.

## Build outputs

- [ ] **Internal testing APK:** GitHub tag workflow (`v*`) or `npx eas-cli@latest build -p android --profile preview`.
- [ ] **Store-ready artifact:** signed AAB via EAS production profile + configured credentials; not available with current debug-signing workflow.
- [ ] **Release notes:** summarize user-visible changes, known limitations, and test evidence.

## Final approval

- [ ] Owner reviews test evidence, known limitations, and install instructions.
- [ ] Owner gives explicit release approval.
