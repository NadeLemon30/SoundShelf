# SoundShelf progress and handoff

## Progress updates

## Update (2026-10-30) — swipeable Now Playing queue

- Added a Queue drawer directly beneath Now Playing transport controls. Its handle can be swiped upward to expand the current queue, or downward to collapse it; tapping the header provides the equivalent accessible action.
- The expanded list identifies the active track, shows embedded artist metadata where available, and lets the listener select any queued track. Selection reuses the existing queue playback action, so it does not create a separate or fabricated queue.
- Static verification passed: `npx.cmd tsc --noEmit`, `npm.cmd run lint`, and `git diff --check` (Git only reported the repository's existing LF-to-CRLF notices). Device verification: confirm the drawer opens/collapses reliably, scrolls long queues, selects the expected track, and remains usable at smaller Android screen heights.
- Affected files: `src/features/playback/components/now-playing.tsx`, `docs/PROGRESS.md`.

## Update (2026-10-30) — Now Playing artist subtitle

- Now Playing now shows the embedded artist name beneath the active song title. Files with no artist metadata retain the filename fallback, so no artist is invented.
- Static verification passed: `npx.cmd tsc --noEmit`, `npm.cmd run lint`, and `git diff --check` (Git only reported the repository's existing LF-to-CRLF notices).
- Affected files: `src/features/playback/components/now-playing.tsx`, `docs/PROGRESS.md`.

## Update (2026-10-30) — metadata-backed Artist and Album library filters

- Added Artists alongside Songs, Albums, and Favorites on the Library screen. Artist and Album views list only groups derived from embedded audio metadata; opening a group shows its tracks and plays against that group’s real queue.
- `expo-media-library` SDK 57 still provides no audio-tag fields. The existing local Android `MediaMetadataRetriever` module now exposes embedded title, artist, and album values during scanning. Missing or unreadable tags stay `null`, titles retain the filename fallback, and Artist/Album grouping uses explicit “Unknown” fallback groups rather than folder names or invented values.
- Updated the personal-library SQLite migration to version 2 so metadata remains attached to saved favorites, playlists, recents, and playback checkpoints. Existing databases add nullable `artist` and `album` columns safely.
- Native configuration was regenerated with `npx.cmd expo prebuild --clean --platform android`; generated Kotlin contains `getMetadata`, artist/album retrieval, and package registration. Static verification passed: `npx.cmd tsc --noEmit`, `npm.cmd run lint`, and `git diff --check` (Git only reported the existing LF-to-CRLF notices).
- Next step: install a fresh development build with `npx.cmd expo run:android --device`, rescan, then verify tagged MP3/M4A files appear under their real Artist and Album values. Verify missing tags appear only in the Unknown groups, saved library entries retain tag subtitles after restart, and every group plays the expected queue.
- Affected files: `plugins/with-local-album-artwork.js`, `src/features/library/local-audio-metadata.ts`, `src/features/library/media-library-service.ts`, `src/features/library/artists.ts`, `src/features/library/albums.ts`, `src/features/library/types.ts`, `src/features/library/library-provider.tsx`, `src/features/library/components/library-rows.tsx`, `src/app/library.tsx`, `src/features/personal-library/database.ts`, `src/features/personal-library/repository.ts`, and `docs/PROGRESS.md`.

## Update (2026-10-30) — Settings playback controls removed

- Removed the Settings → Playback section, including the Shuffle queue switch and Repeat-cycle control. Queue settings remain available in Now Playing, where they are relevant to the active queue.
- Static verification: `npx.cmd tsc --noEmit`, `npm.cmd run lint`, and `git diff --check` passed (Git only reported the repository's existing LF-to-CRLF notices). Device verification: confirm the Settings screen goes directly from Library to About and the Now Playing queue controls remain available.
- Affected files: `src/app/settings.tsx`, `docs/PROGRESS.md`.

## Update (2026-10-30) — Spotify-inspired Home tab

- Reworked `src/app/index.tsx` into a denser, local-first music home screen: time-based greeting and Settings control, a current-track resume card, an offline library/scan state, and four compact navigation cards for Library, Liked Songs, Search, and Settings.
- The listening section now uses persisted recently played tracks when available (`Jump back in`); otherwise it presents recently added local tracks. It continues to use the real library queue for playback and removes stale saved tracks from the home list rather than presenting an unplayable item.
- No network services, streaming, accounts, or new dependencies were added. The Spotify reference informs the dark, high-contrast layout and hierarchy only.
- Static verification: `npx.cmd tsc --noEmit`, `npm.cmd run lint`, and `git diff --check` completed without errors or warnings (Git reported only the repository's existing LF-to-CRLF notices). Device verification remains pending: assess Home at narrow Android widths, both no-library and populated-library states, shortcut navigation, scan behavior, current-track resume, and the mini-player clearance.
- Affected files: `src/app/index.tsx`, `docs/PROGRESS.md`.

## Fix (2026-10-30) — embedded local album artwork

- Reported behavior: album artwork did not appear anywhere in the library or player. Root cause: every consumer rendered `ArtworkPlaceholder`; SDK 57 `expo-media-library` exposes audio URIs but no embedded-picture field (D-009), so no cover URI had ever reached the UI.
- Added `plugins/with-local-album-artwork.js`, a narrowly scoped Android config plugin. During prebuild it writes and registers a small `MediaMetadataRetriever` React Native module. On demand, it reads an audio file's embedded ID3/MP4 picture and writes it to the app cache; it uses no network, adds no permission, and resolves `null` for missing, corrupt, or unreadable artwork.
- New `TrackArtwork` uses that optional module with an in-memory request/cache deduplication layer. Rows, album rows, the mini-player, and Now Playing now display the extracted image; unsupported platforms, stale development builds, and tracks without an embedded cover retain the existing honest placeholder.
- `npx expo prebuild --clean --platform android` regenerated `android/` and verified that both `LocalAlbumArtworkModule.kt` and its `MainApplication` registration are emitted. `npx tsc --noEmit` and `npm.cmd run lint` passed after the change; `git diff --check` passed, with only the existing LF-to-CRLF notices. A direct Gradle Kotlin compile was started but did not return a final result in this session (the Gradle JVM remained running); do not treat native compilation as verified from that invocation.
- Next step: let/redo `cd android; .\\gradlew.bat :app:compileDebugKotlin --no-daemon --console=plain`, then install the regenerated development build with `npx expo run:android --device`. Confirm covers appear for MP3/M4A files with embedded art in Songs, Albums, mini-player, and Now Playing; confirm tracks without art still show the placeholder and that a rescan remains responsive.
- Affected files: `app.json`, `plugins/with-local-album-artwork.js`, `src/features/library/local-album-artwork.ts`, `src/components/ui/track-artwork.tsx`, `src/features/library/components/library-rows.tsx`, `src/components/ui/mini-player.tsx`, `src/features/playback/components/now-playing.tsx`, and `docs/PROGRESS.md`.

## Current state

- **Current phase (2026-10-27 correction):** 6 — Personal library. The owner confirmed Phase 5 was done and authorized Phase 6. The individual final Phase 5 device-test observations were not captured in this handoff. Phase 6 now has its SQLite foundation, favorites, playlists, recently played tracks, and the deferred playback checkpoint; a native/device verification pass is still required.

## Fix (2026-10-30) — active native-tab icons

- Reported behavior: Android tab icons disappeared after their tab became active.
- The per-icon tint attempt did not fix the owner-reported Android behavior: `unstable-native-tabs` continued to hide every selected icon and show only its green indicator. Replaced the experimental native-tab host with Expo Router's standard `Tabs` navigator, which renders each icon directly and applies explicit green/gray active and inactive colors.
- Static verification passed: `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `git diff --check` completed without diagnostics (Git only reported the repository's existing LF-to-CRLF notices). Device verification: switch through every tab and confirm its active icon remains visible in Spotify green, with no green selection oblong.
- Affected files: `src/components/app-tabs.tsx`, `src/components/ui/app-icon.tsx`.

## Update (2026-10-30) — Settings tab

- Added a Settings tab for the current local-only app: device-library status and rescan, Android audio-permission management, queue shuffle, repeat mode, and a local-data/privacy note.
- The controls reuse the existing library scanner, Android app-settings link, and playback provider; no accounts, network features, or new storage were introduced. Settings is available in both the native and web tab layouts.
- Static verification passed: `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `git diff --check` completed without diagnostics (Git only reported the repository's existing LF-to-CRLF notices). Device verification remains pending. On Android, verify that the tab icon remains visible when selected; rescan, permission-management, shuffle, and repeat controls respond correctly; and the persistent mini-player remains clear of the five-item tab bar.
- Affected files: `src/app/settings.tsx`, `src/components/app-tabs.tsx`, `src/components/app-tabs.web.tsx`, `src/components/ui/app-icon.tsx`.

### About-section follow-up

- Added the configured Expo app version, project credit (Nade Lemon), technology summary, and explicit local-only privacy statement to Settings → About. The version reads `Constants.expoConfig.version`, with `1.0.0` only as a safe fallback if configuration is unavailable.
- Static verification passed: `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `git diff --check` completed without diagnostics (Git only reported the repository's existing LF-to-CRLF notices). On device, confirm the About rows are readable and the installed app version matches the build.

- **Current phase:** 5 — Background playback. The owner reported a Phase 4 device test on 2026-10-13 and approved moving to Phase 5. **Background playback is now device-verified and working** (2026-10-13): the true root cause of "audio stops on Home/lock" was a backgrounding crash, fixed by the config plugin below. Remaining Phase 5 item: playback-checkpoint persistence (still deferred to combine with the Phase 6 database foundation).
- **Repository baseline:** `d0f2289` (`Initial commit`); latest checkpoint `d6d81c5` (Phase 5 background-crash fix + auto-scan). Release `v0.3.5` (`be26715`, 2026-10-26) includes the launcher/splash work, the bug-fix/hygiene pass, and the expo-audio source-build fix recorded below. Recent committed work: album browsing, permission denial, empty-library, and Phase 4 foreground playback increments on 2026-10-12; the Phase 5 background-playback increments are described below.
- **Framework:** Expo SDK 57 (`expo ~57.0.27`), React Native 0.86.3, React 19.2.3, TypeScript 6.0.3, Expo Router 57.
- **Package manager:** npm (`package-lock.json` exists; no Bun lockfile).
- **Native projects:** `android/` is generated locally by `expo run:android` and is git-ignored. Regenerate it with `npx expo prebuild --clean --platform android` after any `app.json`/config-plugin change — a plain `expo run:android` reuses a stale `android/` and silently ignores the new config. `ios/` is not generated locally.
- **Latest increment (2026-10-13, refined through 2026-10-20):** app icon now sourced from `assets/SoundShelf.png` (Android adaptive icon + iOS icon regenerated from it), Expo-blue splash replaced with the SoundShelf logo, and a launch animation added (`src/components/startup-animation.tsx`). The owner confirmed on 2026-10-26 that the splash animation works. Launcher-icon and themed-icon verification remain unrecorded.

## Update (2026-10-13) — app icon and launch animation

## Update (2026-10-18) - make the startup animation visibly perceptible

Owner report: the launch showed the SoundShelf icon but no perceptible motion. The original custom overlay used a 450 ms dissolve with a stationary hold and only a 6% logo scale change, which was too subtle to read as animation during a real device launch.

- Reworked `src/components/startup-animation.tsx` to retain one React Native `Animated.View` overlay throughout the native-splash handoff instead of replacing a static `View` with a Reanimated entering view.
- After the matching React overlay is laid out, `SplashScreen.hide()` hides the native splash immediately and the next displayed frame starts the custom exit. The SoundShelf logo visibly scales from 1x to 1.28x and fades, while the overlay begins dissolving after 360 ms and completes at 800 ms. The UI thread drives opacity and transform with `useNativeDriver: true`; the overlay remains `pointerEvents="none"`.
- The existing icon/splash device verification is still required. This behavioral adjustment is static-check verified only; it is not yet verified on hardware.

Files: `src/components/startup-animation.tsx`, `docs/PROGRESS.md`.

## Update (2026-10-20) - extended launch hold and graphic exit

- The native/React handoff retains the matching SoundShelf icon splash for an intentional **two seconds** after React's overlay has drawn. Only then does the graphic exit begin, so the branded icon is visible long enough to register before the app appears.
- The exit is now music-inspired rather than a logo-only dissolve: two expanding teal sound rings, a soft diagonal light sweep, and a three-bar equalizer animate around the logo while it grows and fades. All properties use React Native's native animation driver; the overlay remains non-interactive and unmounts when finished.
- This is a JavaScript-only visual change, so no native rebuild is required to compile it. It remains device-unverified and should be assessed alongside the existing launcher/splash verification on a release APK.
- Static verification: `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `git diff --check` passed (the only Git output was the repository's existing LF-to-CRLF warning).

Files: `src/components/startup-animation.tsx`, `docs/PROGRESS.md`.

Owner request: use the `assets/SoundShelf.png` asset as the app icon and add a simple startup animation.

- **Icon source of truth.** `assets/SoundShelf.png` is a 496x496 RGBA illustration (dark teal; opaque edge colour sampled at `#185048`; only the rounded corners are transparent). It is **byte-identical** to the previously committed `assets/images/icon.png` (same SHA-256), so the visible icon was already this artwork for the `icon` field. What was still Expo-branded was everything else: the Android adaptive icon (Expo's white/blue starter foreground+background), the iOS icon (`assets/expo.icon`, an Expo-symbol icon-composer bundle), and the splash (Expo logo on `#208AEF`).
- **Android.** `expo.android.adaptiveIcon.foregroundImage` is now a generated `assets/images/android-icon-foreground.png` (512x512, transparent background, artwork scaled to 66% = 338px and centred, so it sits inside Android's adaptive safe zone) and `adaptiveIcon.backgroundColor` is `#185048` — the artwork's own edge colour, so the safe-zone padding blends with the illustration instead of showing a hard ring. `backgroundImage` and `monochromeImage` were removed: both were Expo-starter assets, and a monochrome (themed-icon) silhouette cannot be derived honestly from a full-bleed illustration, so Android 13+ themed icons fall back to the normal icon.
- **iOS.** `expo.ios.icon` now points at a generated `assets/images/icon-ios.png` (1024x1024, fully opaque — iOS icons must not carry alpha) instead of the Expo icon-composer bundle.
- **Base icon.** `expo.icon` now points directly at `./assets/SoundShelf.png` (this is also the legacy `ic_launcher` source). The older, identical `assets/images/icon.png` was left in place rather than deleted.
- **Splash.** The `expo-splash-screen` plugin now uses `./assets/SoundShelf.png` at `imageWidth: 160` on `#185048` (previously the Expo logo at 76pt on Expo blue `#208AEF`).
- **Launch animation.** New `src/components/startup-animation.tsx` (plus a `.web.tsx` variant that returns `null`, since web has no native splash). It renders a full-screen overlay that is pixel-identical to the native splash (same `#185048` field, same 160pt logo), calls `SplashScreen.hideAsync()` on its first `onLayout` so the two hand off invisibly, then fades the overlay out over 450 ms with a small `1 → 1.06` scale drift before unmounting via `scheduleOnRN`. It is `pointerEvents="none"`, so it never blocks input, and it uses the same Reanimated `Keyframe` + `react-native-worklets` pattern as the SDK 57 starter. `src/app/_layout.tsx` now calls `SplashScreen.preventAutoHideAsync()` at module scope and renders `<StartupAnimation />` above `<AppTabs />` inside a `flex: 1` `View`.
- **How the assets were produced.** A one-off Node script using `jimp-compact` (already present as a transitive dependency of `@expo/image-utils`) resized/composited `assets/SoundShelf.png` into the two generated PNGs. The script was deliberately **not** committed (it would add an undeclared dependency on a transitive package); the committed PNGs are the artifacts. Regenerate values: Android foreground = 512x512, artwork 338px centred at (87,87); iOS icon = 1024x1024, opaque `#185048`, artwork 676px centred at (174,174).
- **Device verification.** The owner confirmed on 2026-10-26 that the splash animation works. Launcher-icon and Android 13+ themed-icon behavior remain unrecorded. Because `app.json` changed, native verification requires `npx expo prebuild --clean --platform android` before `npx expo run:android --device`; a plain `run:android` would silently reuse a stale `android/` project. The [SDK 57 `expo-splash-screen` docs](https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/) warn that since SDK 52 a development build does not reflect every config-plugin splash property, so the splash itself should be judged on a release APK (Expo Go shows the app icon instead of the splash at all). No `dark` splash variant was configured; an app-level splash background is the only appearance.
- Files: `app.json`, `assets/SoundShelf.png` (now referenced), `assets/images/android-icon-foreground.png` (regenerated), `assets/images/icon-ios.png` (new), `src/components/startup-animation.tsx` (new), `src/components/startup-animation.web.tsx` (new), `src/app/_layout.tsx`, `docs/PROGRESS.md`.

## Update (2026-10-13) — background playback FIXED on device: a backgrounding crash was the real root cause

Two owner-reported symptoms turned out to have one root cause plus one architecture constraint:

### 1) "Audio stops instantly on Home/lock" — fixed
- Device diagnosis (Xiaomi 25078RA3EA, Android 15/API 35) via the crash buffer and logcat: every time the app was backgrounded it died from an **unhandled `android.os.TransactionTooLargeException` in `activityStopped()`** — the Activity's saved-state parcel exceeded the ~1 MB Binder limit because react-native-screens on the new architecture serializes its `ScreenFragment`s into `onSaveInstanceState` (`androidx.lifecycle.BundlableSavedStateRegistry.key → android:support:fragments → fragment… viewState ≈ 914 KB`). The process died, taking the audio foreground service with it — the instant audio stop. Matches upstream [software-mansion/react-native-screens#4487](https://github.com/software-mansion/react-native-screens/issues/4487) (open, not yet fixed in 4.26/SDK 57).
- Fix: new local config plugin `plugins/with-strip-activity-fragment-state.js` overrides `MainActivity.onSaveInstanceState` to strip `android:support:fragments` from the saved-state bundle (RNS never consumes this state; it rebuilds screens from JS). Registered in `app.json`. Applied by `npx expo prebuild --clean --platform android`; override verified in the generated `MainActivity.kt` and its string constants verified in the compiled APK dex.
- Built a local release APK (`android/app/build/outputs/apk/release/app-release.apk`, debug-signed like the GitHub workflow) and installed it on the device.
- Device verification (owner-confirmed 2026-10-13): play → Home → screen lock → ~60 s locked → **audio kept playing, the media session stayed active, the notification stayed in the shade, zero crashes** (crash buffer clean all session; process survived until MIUI later cleaned it as a cached app). Unlock/reopen → owner paused playback manually; the media session was released correctly at that point.
- Secondary factor documented, not the cause: MIUI `SwipeUpClean` / "excessive cpu" kills of *cached* processes (the app was killed at adj 955 long after playback ended). Whitelisting SoundShelf in MIUI battery settings helps the idle process survive but was not the primary fix.

### 2) "Have to re-scan on every launch" — interim fix implemented and verified (auto-scan on launch)
- The library is **in-memory only** (`library-provider.tsx` `useState`; no database; `expo-sqlite` not installed; persistence is Phase 6). Any process death — MIUI cleaning the cached process, memory pressure, swiping the app away — wipes the library and forces a rescan.
- Owner approved the interim UX fix: `library-provider.tsx` now auto-scans on launch when the audio permission is **already granted** (`getPermissionsAsync` check on mount; no prompt — the manual "Scan device music" flow is untouched for fresh installs/denied states). A killed process is now transparent: reopening the app restores the library automatically.
- Device verification (2026-10-13, owner-confirmed on the rebuilt APK): (1) launch fills the library by itself with no scan tap; (2) swiping the app away in Recents and reopening restores the library automatically.
- Durable fix remains the Phase 6 database foundation (ROADMAP).

## Update (2026-10-13) — background playback did not work: stale native project

The owner reported that background playback did not work and that playback stopped when the app was backgrounded/closed. Root cause: the local `android/` directory (generated by an earlier `expo run:android`, git-ignored) was **stale**. `expo run:android` reuses an existing `android/` directory rather than regenerating it, so the Phase 5 `app.json` config-plugin changes never reached the installed build. The generated `android/app/src/main/AndroidManifest.xml` had no `AudioControlsService`, no `FOREGROUND_SERVICE`/`FOREGROUND_SERVICE_MEDIA_PLAYBACK`, no `POST_NOTIFICATIONS`, and no `MODIFY_AUDIO_SETTINGS`. Android therefore had no media-playback foreground service and killed playback as soon as the app left the foreground. Notably, `npx expo config --type introspect` *did* report the correct permissions/service, which is why the earlier configuration check passed while the device app lacked them — `introspect` reflects `app.json`, not the stale generated project.

Fix: regenerated the native project from the updated config with `npx expo prebuild --clean --platform android --no-install`. The regenerated `android/app/src/main/AndroidManifest.xml` now declares `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `MODIFY_AUDIO_SETTINGS`, `POST_NOTIFICATIONS`, and `expo.modules.audio.service.AudioControlsService` with `foregroundServiceType="mediaPlayback"` plus the `androidx.media3.session.MediaSessionService` intent filter.

- **Workflow rule:** after any `app.json`/config-plugin change, run `npx expo prebuild --clean --platform android` (or delete `android/`) before `npx expo run:android --device`. A plain `expo run:android` with an existing `android/` will not apply the change.
- **Still to do:** rebuild and install (`npx expo run:android --device`) and re-run the background-playback device checks. No device was attached during this session, so the fix remains device-unverified.
- Files: `android/` (regenerated, git-ignored), `AGENTS.md`, `README.md`, `docs/PROGRESS.md`.

## Update (2026-10-13) — Phase 5 background playback configuration

- Enabled background playback through the `expo-audio` config plugin: `enableBackgroundPlayback: true`. The resolved native config now declares `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, and the `AudioControlsService` mediaPlayback foreground service; `recordAudioAndroid: false` and `enableBackgroundRecording: false` keep microphone permissions out (verified via `expo config --type introspect`).
- The audio session now sets `shouldPlayInBackground: true` (keeping `doNotMix` audio focus and `playsInSilentMode: true`).
- The provider activates lock-screen controls on every track change via `player.setActiveForLockScreen(true, { title }, { showSeekBackward, showSeekForward })`, which on Android is also what keeps the foreground service alive for sustained background playback. Only honest metadata is shown: the track title (no fabricated artist/album/artwork).
- Android 13+ notifications need `POST_NOTIFICATIONS`: the plugin only adds it for recording, so `app.json` now declares it under `android.permissions`, and the provider requests it once per session at the first user-initiated play via `requestNotificationPermissionsAsync()` (Android-only, non-blocking; denial does not stop playback).
- **Not device-verified:** sustained screen-off playback, the notification/lock-screen actions, interruption recovery, and disconnect behavior all require a rebuilt development build containing the audio config change and a physical-device session.
- **Deferred within Phase 5:** persisting/restoring a playback checkpoint — planned for the next increment using `expo-sqlite`'s key/value API (D-005/D-011), combined with the Phase 6 database foundation so both native modules arrive in one development build.
- Files: `app.json`, `src/features/playback/playback-provider.tsx`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` (D-011), `docs/ROADMAP.md`, `docs/PROGRESS.md`.

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
- **2026-10-13:** The owner reported Phase 4 foreground playback testing completed and approved moving to Phase 5; detailed results were not captured in this session. Phase 5 will require a rebuilt development build that includes the background-playback native configuration.

## Unfinished work / known constraints

- Background playback is **device-verified and working** (2026-10-13) after fixing the backgrounding crash (see update above). Still to verify within Phase 5: audio-focus interruption behavior (starting other audio while playing, doNotMix), headphone/Bluetooth disconnect, and the notification/lock-screen action round-trip on a fresh build. The playback checkpoint is still to be implemented (planned with `expo-sqlite`'s key/value API, combined with the Phase 6 database foundation).
- `expo-audio` is installed and used. `expo-sqlite` is still a recommendation only; `expo-media-library` is installed and used.
- Phase 4 foreground playback is implemented; the owner reported a device test on 2026-10-13, but detailed results were not captured in this session.
- Local-media discovery and album grouping are implemented; the owner reported a device test, but detailed figures were not recorded in this session.
- Whether `expo-media-library` exposes enough real-device audio metadata and embedded artwork remains unverified. Album grouping uses the device album id and is not the same as parsed audio tags; artist and artwork are not available from this API and are not fabricated.
- The local environment uses Node 22.12.0, while several Expo SDK 57 / React Native transitive packages report a minimum Node 22.13.0. Lint and type-check pass, but upgrade Node before relying on local Metro or build behavior.
- Background playback must be validated in an Android development build with the enabled audio config and lock-screen controls; Expo Go is insufficient release evidence. On Android 13+, the notification shade controls require the user to grant notification permission (requested once, non-blocking, at first play).
- The library is in-memory only; the interim auto-scan-on-launch-when-granted fix is implemented (owner-approved) and pending device verification in the rebuilt APK; the durable fix remains the Phase 6 database foundation.
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

Phase 5 background playback (2026-10-13):

- `app.json` (`enableBackgroundPlayback: true`, added `android.permissions.POST_NOTIFICATIONS`)
- `src/features/playback/playback-provider.tsx` (audio mode `shouldPlayInBackground: true`, lock-screen controls on track change, one-time notification-permission request)
- `plugins/with-strip-activity-fragment-state.js` (new config plugin fixing the backgrounding crash — see update above)
- `app.json` (registered the config plugin)
- `src/features/library/library-provider.tsx` (auto-scan on launch when audio permission already granted)
- `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` (D-011), `docs/ROADMAP.md`, `docs/PROGRESS.md`

App icon and launch animation (2026-10-13):

- `app.json` (top-level `icon`, `ios.icon`, `android.adaptiveIcon`, `expo-splash-screen` plugin)
- `assets/SoundShelf.png` (now referenced as the icon/splash source; previously unreferenced)
- `assets/images/android-icon-foreground.png` (regenerated from `SoundShelf.png`)
- `assets/images/icon-ios.png` (new)
- `src/components/startup-animation.tsx` (new)
- `src/components/startup-animation.web.tsx` (new)
- `src/app/_layout.tsx`
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
| `npx.cmd expo install expo-audio` | Passed; installed `expo-audio` 57.0.5 and added the plugin to `app.json` (same Node-engine warnings). |
| `npm.cmd run lint` after the Phase 4 playback increment | Passed. |
| `npx.cmd tsc --noEmit` after the Phase 4 playback increment | Passed. |
| `npx.cmd expo config --type public` after the Phase 4 plugin configuration | Passed; resolved `expo-audio` with `recordAudioAndroid: false` and `enableBackgroundPlayback: false`. |
| Pure-helper execution checks (`node --experimental-strip-types`) | Passed: `naturalOrder`, `shuffledOrder` (keeps current track first, valid permutation), `positionInOrder`, `formatPlaybackTime`, `playbackPercent`, and the repeat-mode cycle `off → all → one → off`. |
| SDK 57 background-playback documentation review | Passed: consulted the SDK 57 `expo-audio` docs and the installed type definitions; `setActiveForLockScreen(active, metadata?, options?)`, `AudioLockScreenOptions` (`showSeekForward`/`showSeekBackward`/`isLiveStream`), `requestNotificationPermissionsAsync()` (Android-only, required for the notification shade), and `doNotMix`-required lock-screen binding were confirmed against installed types; headphone/Bluetooth disconnect stops audio automatically (OS-level behavior, device-verify only). |
| `npx.cmd expo config --type introspect` after the Phase 5 configuration | Passed: resolved manifest declares `POST_NOTIFICATIONS`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `MODIFY_AUDIO_SETTINGS`, and `expo.modules.audio.service.AudioControlsService` with `foregroundServiceType: mediaPlayback`; no `RECORD_AUDIO`. |
| `npm.cmd run lint` after the Phase 5 background-playback increment | Passed. |
| `npx.cmd tsc --noEmit` after the Phase 5 background-playback increment | Passed. |
| `npx.cmd expo export --platform android` bundle check after the Phase 5 increment | Passed; single Android `.hbc` bundle built; temporary `.temp-export` output removed. |
| Physical-device playback check (Phase 4) | Owner-reported 2026-10-13; detailed results were not captured in this session. |
| Stale-native-project diagnosis (Phase 5) | Confirmed: the pre-existing generated `android/app/src/main/AndroidManifest.xml` lacked `AudioControlsService` and all background/notification permissions, although `expo config --type introspect` reported them. The installed build had no foreground service, so Android killed playback in the background. |
| `npx.cmd expo prebuild --clean --platform android --no-install` | Passed; native project regenerated. Re-read `android/app/src/main/AndroidManifest.xml` confirms `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `MODIFY_AUDIO_SETTINGS`, `POST_NOTIFICATIONS`, and `AudioControlsService` with `foregroundServiceType="mediaPlayback"` and the `MediaSessionService` intent filter. |
| Physical-device background-playback check (Phase 5) | Confirmed with the fixed local build (2026-10-13): audio kept playing through a ~60 s screen lock with the notification visible and the media session active; no crashes. The earlier "pending: requires rebuilt/installed project" note referred to the stale build without the foreground service (diagnosis above); the root cause and fix are recorded in the crash-fix update. |
| `npx expo prebuild --clean --platform android` with the new config plugin | Passed; regenerated `android/app/src/main/java/com/nadelemon/SoundShelf/MainActivity.kt` contains the `onSaveInstanceState` fragment-state-strip override. |
| `.\gradlew.bat --no-daemon :app:assembleRelease` (local release build) | Passed; `android/app/build/outputs/apk/release/app-release.apk` built (JDK 17 via `JAVA_HOME`; cold full build ~51 min with `--no-daemon`). |
| APK content checks (`aapt2 dump badging`, dex string scan) | Passed: package `com.nadelemon.SoundShelf` versionCode 1 / name 1.0.0; the `android:support:fragments` strip constants from the plugin override are present in `classes.dex` (files 2 and 4). |
| `adb install -r app-release.apk` on the device | Passed; `dumpsys package … lastUpdateTime` updated. |
| Background-playback device re-test with the fixed build (2026-10-13) | Passed, owner-confirmed: play → Home → lock → ~60 s locked → audio kept playing, notification stayed, media session stayed active; crash buffer clean all session (no `TransactionTooLargeException`, no FATAL EXCEPTION). Owner paused playback manually after reopening; the media session released correctly at that point. |
| `npm run lint` after the config-plugin change | Passed. |
| `npx tsc --noEmit` after the config-plugin change | Passed. |
| Auto-scan-on-launch change (`library-provider.tsx`) — lint and types | Passed (`npm run lint`, `npx tsc --noEmit`). |
| Second local release build (`.\gradlew.bat :app:assembleRelease` with daemon) | Passed; incremental build reused caches (5m 8s vs ~51m cold). |
| Auto-scan device verification (2026-10-13, rebuilt APK) | Passed, owner-confirmed: (1) launch fills the library automatically with no scan tap; (2) after swiping the app away in Recents and reopening, the library restores itself automatically. |
| `assets/SoundShelf.png` vs committed `assets/images/icon.png` | Identical (SHA-256 `b592f013f2e6f5159443e10e59a7c69eef6a9757abc7039c166b1e6ebc060714`); the base app icon was therefore already this artwork. |
| Generated-asset inspection (`android-icon-foreground.png`, `icon-ios.png`) | Passed: Android foreground is 512x512 with a fully transparent background and opaque artwork bounds exactly 338x338 centred at (87,87) — i.e. inside the 66% safe zone; iOS icon is 1024x1024 with alpha 254-255 (no transparency) and `#185048` corners. |
| `npm run lint` after the app-icon + launch-animation increment | Passed. |
| `npx tsc --noEmit` after the app-icon + launch-animation increment | Passed, after switching `StyleSheet.absoluteFillObject` to `StyleSheet.absoluteFill` (RN 0.86 exposes `absoluteFill` as the plain `AbsoluteFillStyle` object; `absoluteFillObject` no longer exists in the installed types). |
| `npx expo config --type introspect` after the app-icon change | Passed: `icon` resolves to `./assets/SoundShelf.png`, splash image `./assets/SoundShelf.png` with `imageWidth` 160 and resize mode `contain`, `colors.xml` `iconBackground` and `splashscreen_background` both resolve to `#185048`, and `android:icon`/`android:roundIcon` still point at `@mipmap/ic_launcher`/`@mipmap/ic_launcher_round`. |
| `npx expo export --platform android` bundle check after the app-icon + launch-animation increment | Passed: single Android bundle built, so `require('@/assets/SoundShelf.png')` resolves through Metro. |
| Device check of the splash and launch animation | Passed, owner-confirmed 2026-10-26: the splash animation works. Launcher-icon and Android 13+ themed-icon behavior remain unrecorded. |
| Phase 5 device-test availability (2026-10-26) | Not available: Android SDK platform-tools was found at `C:\\Users\\Nade\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe`, but `adb devices` reported no attached device or emulator. |

## Update (2026-10-26) — lint fix + audio-focus/noisy-fix plugin committed

- **Lint fix (`startup-animation.tsx`):** The React Compiler `react-hooks/refs` rule flagged all 12 `Animated.Value.interpolate()` calls (24 errors total) because they were derived from a `useRef().current` value inside the render function body. Fix: `_progress` (`Animated.Value`) and all its derived interpolations are now module-level constants. `StartupAnimation` renders at most once per app lifetime (it unmounts itself), so a module-level value is safe and permanently removes the calls from React's render path. `npm run lint` and `npx tsc --noEmit` both pass clean.
- **`with-audio-focus-and-noisy-fix.js` plugin committed:** This previously-untracked config plugin addresses two expo-audio Android bugs:
  - **Bug 1 (audio-focus type):** expo-audio requests `AUDIOFOCUS_GAIN_TRANSIENT` for `doNotMix` mode; the correct type for a long-running music player is `AUDIOFOCUS_GAIN`. The plugin patches `AudioModule.kt` post-prebuild to replace it.
  - **Bug 2 (headphone disconnect):** expo-audio has no `ACTION_AUDIO_BECOMING_NOISY` receiver, so audio continues through the speaker after headphone unplug or Bluetooth disconnect. The plugin injects a `NoisyAudioReceiver.kt` and wires it into `AudioModule.kt`'s `onCreate`/`onDestroy`.
  - Both patches are applied via `withDangerousMod`, are idempotent, and require `npx expo prebuild --clean --platform android` before they reach a device build.
- Files: `src/components/startup-animation.tsx`, `plugins/with-audio-focus-and-noisy-fix.js`, `app.json`, `docs/PROGRESS.md`.
- Static verification: `npm run lint` ✅, `npx tsc --noEmit` ✅.

## Update (2026-10-26) — bug-fix and hygiene pass

### Build-critical: the audio patch never ran on a clean prebuild

The committed `with-audio-focus-and-noisy-fix` plugin searched `android/app/src/main/java/**/AudioModule.kt`. That file is never there. The initial assumption that Expo autolinking compiles `node_modules/expo-audio/android` in place was also wrong: SDK 57 links the package's prebuilt AAR by default (see below). A clean `expo prebuild` (and therefore the GitHub release workflow) would have thrown "Could not find AudioModule.kt" — or, with an older tolerant path, silently built without either fix.

- Extracted the patch logic into `plugins/expo-audio-patch.js`; `with-audio-focus-and-noisy-fix.js` is now a thin `withDangerousMod` wrapper around it.
- Added `scripts/patch-expo-audio.js` and a `postinstall` script so `npm install`/`npm ci` patches the installed library even when prebuild is not re-run. The patch is idempotent.
- Anchor handling is now fail-fast: a bare `AUDIOFOCUS_GAIN_TRANSIENT` (excluding `_MAY_DUCK`) or any missing receiver anchor throws with an explanatory error instead of warning and shipping unpatched audio.
- Verified idempotency by running `node scripts/patch-expo-audio.js` twice: first run applied the updated receiver file, second reported "already present".

### Prebuilt-AAR discovery (same pass)

The first clean release build **succeeded but did not contain the receiver**: `classes4.dex` had `AudioModule`/`expo.modules.audio` but no `NoisyAudioReceiver`, and the Gradle log had no `:expo-audio:` tasks at all. Root cause: SDK 57 ships expo-audio as a prebuilt AAR under `node_modules/expo-audio/local-maven-repo`, and autolinking links that artifact by default — so the patched Kotlin source was never compiled. Reading the source file is not evidence that the patch is in the app.

- Fixed by adding `expo.autolinking.android.buildFromSource: ["expo-audio"]` to `package.json`, the supported autolinking switch (`buildFromSourceRegex` in the Expo Gradle settings plugin then forces the source project).
- **Verified by a second release build (3m 31s):** the Gradle log contains `:expo-audio:compileReleaseKotlin`, `:expo-audio:compileReleaseJavaWithJavac` and `:expo-audio:bundleLibCompileToJarRelease`, and `classes4.dex` in `app-release.apk` contains both `expo.modules.audio` and `NoisyAudioReceiver`. This is the evidence that the patched source is actually in the packaged APK.
- `AGENTS.md` now warns that SDK 57 may link Expo modules as AARs and that patch presence must be checked in the Gradle log/dex, not the source tree.
- The tag-driven release workflow now extracts `classes*.dex` from the built APK and fails if `NoisyAudioReceiver` is missing, so a green release cannot silently ship the unpatched AAR again.
- **Released as `v0.3.5`:** GitHub Actions run [#40330494212](https://github.com/NadeLemon30/SoundShelf/actions/runs/40330494212) completed successfully, the new dex guard passed, and `SoundShelf-v0.3.5.apk` (102.6 MB) was published at <https://github.com/NadeLemon30/SoundShelf/releases/tag/v0.3.5>.

### UI / accessibility fixes

- `src/components/ui/screen.tsx`: added `keyboardShouldPersistTaps="handled"`. With the RN default, the first tap on a search result only dismissed the keyboard, so playing a song took two taps.
- `src/components/app-tabs.web.tsx`: the tab bar border used `Colors.light.outline` unconditionally, which showed a pale border in dark mode. It now uses the active theme's outline.
- `src/components/ui/mini-player.tsx`: a playback error was only visible inside Now Playing. The mini-player now shows "Could not play this track" in the danger colour and is accessible in its idle state.
- `src/features/playback/components/now-playing.tsx`: the seek bar is `adjustable` but exposed no actions; screen-reader users can now step forward/back 10 seconds, with an `accessibilityValue` describing the position.
- `src/components/ui/artwork-placeholder.tsx`: the label sat on a non-accessible `View`, so it was ignored; the placeholder is now exposed as an image.
- `src/components/startup-animation.tsx`: the 2-second hold `setTimeout` is stored in a ref and cleared on unmount.

### Repository hygiene

- Removed the tracked `.expo-export-check/` web export (8 files, ~1.3 MB, including a 1.16 MB bundle) and added it to `.gitignore`.
- Deleted unused starter components (`hint-row`, `web-badge`, `external-link`, `animated-icon*`, `ui/collapsible`) and unused starter assets (`assets/expo.icon/`, Expo/React logos, badges, glow, tutorial, splash-icon, adaptive background/monochrome, duplicate `icon.png`). All were verified unreferenced.

### Documentation corrections

- `docs/ROADMAP.md`: removed the accidental duplicate Phase 5 section and recorded that sustained screen-off playback is verified while the remaining Phase 5 tests are open.
- `README.md`: background playback is no longer described as unverified; the duplicated/misleading limitation bullets were replaced; added the postinstall/prebuild patch explanation and the `plugins/`/`scripts/` layout.
- `docs/ARCHITECTURE.md` and `docs/DECISIONS.md` D-003/D-011 no longer claim expo-audio handles headphone disconnect itself.
- Added `docs/DECISIONS.md` D-012 for the source-patch strategy and its trade-offs.

### Verification

- `npm run lint` ✅
- `npx tsc --noEmit` ✅
- `node scripts/patch-expo-audio.js` twice ✅ (applied, then already present)
- Patch-unit check ✅: `patchSource` on the installed file is idempotent, and a synthetic bare `AUDIOFOCUS_GAIN_TRANSIENT` throws instead of passing through
- `npx expo export --platform android --output-dir dist` ✅ (1 Android bundle, 1301 modules; confirms the deleted starter assets are unreferenced)
- `npx expo prebuild --clean --platform android --no-install` ✅ (regenerated `android/`; the plugin re-ran and reported the patch already present)
- First local release build (default prebuilt AAR) ✅ 44m 36s; `android/app/build/outputs/apk/release/app-release.apk` 102.6 MB — dex check found `AudioModule` but **not** `NoisyAudioReceiver`
- Second local release build after `buildFromSource` ✅ 3m 31s; `:expo-audio:compileReleaseKotlin` executed, and `classes4.dex` now contains `NoisyAudioReceiver`
- GitHub release workflow for `v0.3.5` ✅ ([run 40330494212](https://github.com/NadeLemon30/SoundShelf/actions/runs/40330494212)); install, prebuild, Gradle, dex verification, and release upload all succeeded; asset `SoundShelf-v0.3.5.apk` (102.6 MB)
- `git push origin main` ✅ (5 commits pushed, `e92fd56..fd42d51`)
- `git diff --check` ✅ (only the repository's pre-existing LF→CRLF warnings)

### Deliberately not changed

- Large lists still use `ScrollView` instead of a virtualized list, and the mini-player still scrolls with content. Both need a layout refactor and are better judged on a device; planned for Phase 9.
- Album-id ↔ `getAlbumsAsync` title matching and the two audio patches remain device-unverified.
- No test runner exists yet; the pure helpers are the intended first target.


## Update (2026-10-27) â€” audio focus is lost across Expo Audio transitions

- Owner report: SoundShelf continued playing when another media app began playback. This is a Phase 5 audio-focus interruption failure.
- Likely root cause: SDK 57 `expo-audio` can release its audio-focus request while buffering or transitioning between tracks, then resume playback without reacquiring it. Android consequently has no live focus listener to receive `AUDIOFOCUS_LOSS` when the other app takes focus.
- Extended the existing uncommitted `plugins/expo-audio-patch.js` source patch to retain permanent `AUDIOFOCUS_GAIN` for active/buffering music, reacquire focus before play/resume/replace operations, honour delayed focus, and refuse playback after a denied request. The existing permanent and transient focus-loss pause behavior is retained.
- Verification: `patchSource` is idempotent against the installed `AudioModule.kt`; `npx tsc --noEmit` passed; a clean `npx expo prebuild --clean --platform android --no-install` succeeded; and `:expo-audio:compileDebugKotlin` succeeded (21m 19s). Kotlin daemon startup was denied access to its local marker files but Gradle fell back to in-process compilation and completed successfully.
- **Still required:** a new native build and physical-device test. `v0.3.5` predates this change and cannot validate it. Test while SoundShelf plays, start playback in another full media app, and repeat across a track change/buffering transition. SoundShelf must pause promptly, then resume only after Android returns audio focus.

## Exact next step

## Update (2026-10-27) — Phase 6 SQLite foundation and personal-library UI

- Installed SDK 57-compatible `expo-sqlite` (`~57.0.4`) through `npx expo install`; Expo added its config plugin to `app.json`. The native project was regenerated with `npx expo prebuild --clean --platform android --no-install` after that config change.
- `src/features/personal-library/database.ts` creates schema version 1 with WAL and foreign keys. It has playlists and ordered playlist items (with cascade deletion), favorites, recently played, and a singleton playback checkpoint. Each saved track keeps a metadata/URI snapshot so a missing or rescanned library entry fails locally rather than corrupting personal data.
- `repository.ts` uses bound parameters for all values and supplies durable operations for playlist creation/deletion/add/remove, favorites, recents, and checkpoints. The provider exposes those operations and refreshes state after writes.
- `personal-library-provider.tsx` is inside `SQLiteProvider` and outside the player. `playback-provider.tsx` records selected tracks as recently played, saves a checkpoint on app background/unmount, and restores a saved track/queue/position **paused** after the library scan supplies fresh MediaStore URIs. It never autoplays at launch.
- `library.tsx` now has a Favorites view and accessible heart controls. New `personal-library.tsx`, linked from Home as **My music**, creates/deletes playlists, adds favorites to playlists, removes playlist entries, shows recents, and plays stored entries. The UI keeps all state local to the device.
- Static verification passed: `npm.cmd run lint`, `npx.cmd tsc --noEmit`, `npx.cmd expo export --platform android --output-dir .expo-export-check`, `npx.cmd expo config --type introspect`, `npx.cmd expo prebuild --clean --platform android --no-install`, and `git diff --check`. No physical device was attached, so database persistence, checkpoint restore, and playlist controls remain device-unverified.

### Phase 6 next step (current)

Build a fresh Android development build, because `expo-sqlite` is a native module and `app.json` changed: `npx expo run:android --device` using the regenerated `android/` project. On device, scan music; favorite a song; create a playlist and add/remove it; force-close/reopen; then confirm favorites/playlists/recent entries persist. Play a song, seek, background/kill/reopen, and confirm the player restores the correct song and position **paused**. Record results here. After this verification, complete remaining Phase 6 UX/reliability work (playlist ordering and stale-track handling) before requesting approval for Phase 7.

## Update (2026-10-27) — Phase 6 checkpoint verification preparation

- Re-ran the required static checks against the committed Phase 6 implementation. `npm.cmd run lint` initially failed because `personal-library-provider.tsx` imported its repository twice, retained an unused import, and initialized its async state directly from an effect. The provider now uses one repository import and an `initialize` callback; the effect only starts that asynchronous initialization. This preserves the same readiness behavior while satisfying the React lint rule.
- Expo Router's ignored local typed-route cache was stale and initially omitted the existing `/personal-library` route, so `npx.cmd tsc --noEmit` reported only that false route-type error. Regenerating the cache from the SDK 57 Router scanner added the route; the final verification is `npm.cmd run lint` passed with no diagnostics, `npx.cmd tsc --noEmit` passed, and `git diff --check` passed (aside from the repository's existing LF-to-CRLF warning).
- The local Android SDK is installed, but `adb devices` returned no connected devices. No Android build or device interaction was attempted, so SQLite persistence, playlist controls, recent-play tracking, and paused checkpoint restoration remain **device-unverified**.
- Affected file: `src/features/personal-library/personal-library-provider.tsx`.
- Exact next step remains the device test above. Connect and authorize an Android device, then run `npx expo run:android --device` from this regenerated native project. Test favorites, playlist add/remove, recent entries, and checkpoint restore across a force-close/reopen. Also check missing/rescanned tracks display a local failure rather than crashing.

## Update (2026-10-27) — library scrolling performance

- Owner explicitly requested a library-scroll optimization. Although list virtualization is normally Phase 9 polish, this focused change is authorized without advancing the current Phase 6 work.
- Replaced the ready-library screen's eager `ScrollView` rendering with React Native's `FlatList`. Songs, albums, and favorites now render only a small window of rows (12 initially and per batch, with a seven-viewport window); off-screen rows are clipped on native platforms. The title, segmented selector, rescan notice/action, album navigation, empty states, favorites, and mini-player remain part of the same single virtualized scroll surface.
- Static verification: `npm.cmd run lint` passed with no diagnostics; `npx.cmd tsc --noEmit` passed; `git diff --check` passed (only existing LF-to-CRLF warnings). No device is attached, so large-library fling responsiveness and behavior after switching views remain device-unverified.
- Affected file: `src/app/library.tsx`. Exact next step: on a device with a large local library, rapidly scroll Songs, Favorites, and Albums; change views while scrolled; open/close an album; and verify no blank/stale rows, touch failures, or mini-player overlap. Retain the Phase 6 database/checkpoint device tests as the primary completion gate.

## Update (2026-10-27) — teal gradient theme and navigation icons

- Owner explicitly requested a gradient visual refresh using `#005F73` (deep teal) and `#00E68A` (mint). Added SDK 57-compatible `expo-linear-gradient` (`~57.0.2`) with `npx expo install` and introduced one shared `AppGradient` backdrop for standard screens, the virtualized library, and Now Playing. Content surfaces remain opaque teal for readable text; controls on the bright mint accent use deep-teal text.
- Updated the shared light/dark tokens and native tab bar to the new palette. The Android-first native tabs now use platform symbols instead of the duplicated raster home/explore assets: Home, music library, Search, and Favorites. iOS receives matching SF Symbols.
- Static verification: `npm.cmd run lint` passed with no diagnostics; `npx.cmd tsc --noEmit` passed; `git diff --check` passed (only existing LF-to-CRLF warnings). The Android Metro export bundled successfully (1,337 modules); the CLI wrapper did not return its final summary, so this is bundle evidence rather than a full command-result assertion.
- Affected files: `package.json`, `package-lock.json`, `src/constants/theme.ts`, `src/components/ui/app-gradient.tsx`, `src/components/ui/screen.tsx`, `src/components/app-tabs.tsx`, `src/app/index.tsx`, `src/app/library.tsx`, `src/app/personal-library.tsx`, and `src/features/playback/components/now-playing.tsx`.
- The new gradient dependency is native: build a fresh Android development build (`npx expo run:android --device`) before device testing. Confirm the gradient is smooth/readable, all text and mint buttons retain contrast, and every tab icon is visible and correctly selected on Android. This does not replace the outstanding Phase 6 device tests.

> The older Phase 5 instructions below are superseded and retained only as historical context.

**First:** build a new development or release APK with this uncommitted focus patch (`npx expo prebuild --clean --platform android`, then `npx expo run:android --device` or a release build). Do not use `v0.3.5` for the audio-focus test.

0. App icon + launch animation (owner-confirmed 2026-10-26): the splash animation works. At the next device session, confirm the Android launcher icon is the SoundShelf artwork (not the Expo starter icon). On Android 13+, confirm themed icons fall back gracefully. Already committed.

1. **Install the release APK**: download `SoundShelf-v0.3.5.apk` from <https://github.com/NadeLemon30/SoundShelf/releases/tag/v0.3.5> and install it on the device (or use `adb install -r SoundShelf-v0.3.5.apk`). This build includes the icon/splash changes and the verified expo-audio source patch; the release workflow's dex guard passed. If you rebuild locally instead, run `npx expo prebuild --clean --platform android` then `npx expo run:android --device`, and confirm the Gradle log contains `:expo-audio:compileReleaseKotlin` and the installed APK's dex contains `NoisyAudioReceiver`.

2. **Finish Phase 5 device verification** and record results in `docs/PROGRESS.md`:
   - **Test B:** Notification/lock-screen play/pause/next/previous round-trip → mini-player and Now Playing update.
   - **Test C:** Audio-focus interruption: another app starts audio → SoundShelf pauses (`doNotMix`), resumes after.
   - **Test D:** Headphone/Bluetooth disconnect → audio stops (not blasted through speaker). Requires the noisy-fix plugin in the build.
   - **Test E:** Notification-permission prompt appears once at first play on a fresh install.
   - **Test G:** Launcher icon shows SoundShelf artwork (not Expo icon).
   - **Test H:** Android 13+ themed icon falls back gracefully.

3. **Release note:** `v0.3.5` was published on 2026-10-26 from commit `be26715`; it is debug-signed and not Play Store ready. Use this APK for the tests above, then reserve the next tag for the build that also includes the Phase 6 database foundation.

4. After all device tests are recorded, get **owner approval** before starting Phase 6 (personal library / `expo-sqlite` database foundation + playback checkpoint). The remaining Phase 5 implementation item — persisting/restoring a playback checkpoint — is planned with `expo-sqlite`'s key/value API (D-005/D-011), combined with the Phase 6 database foundation so both native modules arrive in one build.

## Update (2026-10-27) — Full Spotify-style UI revamp (second pass)

Owner requested a comprehensive UI overhaul to look like Spotify. All screens and shared components were revised in a single pass.

### Changes

- **`src/components/ui/artwork-placeholder.tsx`**: Slightly rounder corners (`10%` of size), subtle inner highlight layer via `rgba(255,255,255,0.04)`.
- **`src/components/ui/empty-state.tsx`**: Larger 80px placeholder, bolder 20px title, cleaner layout.
- **`src/features/library/components/library-rows.tsx`**: Track rows min-height 64px; 48px artwork; title 15px/500-weight; filename subtitle 13px muted; heart favorite button; **three-dot `⋮` button** (placeholder for future context menu); album rows use `Album · N songs` subtitle and 56px artwork.
- **`src/components/ui/mini-player.tsx`**: `borderRadius: 12` floating card with `elevation: 8`; green 2px progress bar at the **bottom** of the card; artwork on left; title + subtitle in center; play/pause + next controls on right; `NowPlaying` modal launched from artwork/title area.
- **`src/features/playback/components/now-playing.tsx`**: Full redesign — drag handle pill at top; `PLAYING FROM LIBRARY` / queue count header; three-dot placeholder; 300px artwork with `borderRadius: 8`; track info row with heart button; 4px seek bar + 14px thumb; transport row with shuffle/previous/play/next/repeat with active dot indicators; `68px` circular white play button.
- **`src/app/index.tsx`**: Converted to `FlatList` for consistent virtualization. `fontSize: 30` bold greeting; quick-access pill chips with emoji (📚 Library, ♥ My music, 🔍 Search) in rounded `borderRadius: 24` pills; `YOUR SONGS` section.
- **`src/app/library.tsx`**: Title row with `⟳` rescan icon button. Spotify-style **filter pills** (horizontally scrollable `ScrollView`) — active pill in Spotify green with black text, inactive in `#282828`. Count label below pills. Empty state uses centered layout with full `flex: 1` container.
- **`src/app/search.tsx`**: Converted to `FlatList`. Search bar in `#282828` rounded rect. Results shown with `N RESULTS` all-caps label.
- **`src/app/personal-library.tsx`**: Converted to `FlatList` with typed item discriminated union. Playlist cards now feature 52px square artwork + name + count in a rounded `#282828` surface. Create-playlist row with `borderRadius: 10`. `returnKeyType="done"` on text inputs.

### Static verification

- `npm run lint` ✅
- `npx tsc --noEmit` ✅ (fixed `StyleSheet.absoluteFill` usage in `artwork-placeholder.tsx`)

### Device verification status

Not yet device-verified. No new native modules were added, so the existing dev build or a metro reload may be sufficient for JS-only changes.

## Verification update (2026-10-27) — current UI worktree

- Reviewed the combined staged and unstaged UI worktree. Corrected three interaction defects found during review: the Now Playing heart now toggles the real local favorite, visual-only three-dot affordances are not exposed as inert accessibility buttons, and playlist open/delete actions are sibling controls rather than nested press targets.
- Static verification on the final source: `npm.cmd run lint` passed with no diagnostics; `npx.cmd tsc --noEmit` passed with no errors; `git diff --check` passed (only the repository's existing LF-to-CRLF notices appeared); and `npx.cmd expo config --type public` resolved the Expo configuration successfully.
- `app.json` and the new `assets/SoundShelf icon 3.png` change the base icon and splash source. A fresh Android native regeneration is required before evaluating those changes: run `npx expo prebuild --clean --platform android`, then `npx expo run:android --device`. Verify the launcher icon, splash image, all revised screens, the Now Playing favorite toggle, playlist open/delete controls, and list scrolling. No Android device was available for this session.
- Affected verification/fix files: `src/app/personal-library.tsx`, `src/features/library/components/library-rows.tsx`, `src/features/playback/components/now-playing.tsx`, and `docs/PROGRESS.md`.

## Update (2026-10-27) — persistent mini-player across tabs

- Moved the single `MiniPlayer` instance from individual screen footers to the root layout, where it overlays the tab content directly above the native tab bar. It now persists while switching Home, Library, Search, and My music, and is absent until a track has been selected.
- Added `MiniPlayerInset` to the shared layout constants and applied it to standard screens and every current tab list so the last content remains reachable above the overlay. Removed the duplicate screen-level mini-player instances to prevent competing Now Playing modals and duplicate controls.
- Static verification: `npm.cmd run lint` and `npx.cmd tsc --noEmit` passed with no diagnostics; `git diff --check` passed with only the repository's existing LF-to-CRLF notices. No device was attached, so verify that the player sits above—not on top of—the tab bar, remains visible across tab switches, and opens Now Playing correctly.
- Affected files: `src/app/_layout.tsx`, `src/components/ui/mini-player.tsx`, `src/constants/theme.ts`, `src/components/ui/screen.tsx`, `src/app/index.tsx`, `src/app/library.tsx`, `src/app/search.tsx`, `src/app/personal-library.tsx`, and `docs/PROGRESS.md`.

## Fix (2026-10-27) — mini-player/tab-bar overlap

- Raised the root-level mini-player overlay by `Spacing.three` (16 dp) above `BottomTabInset`. This accounts for the extra visible height of Android's native tab treatment and keeps the mini-player clear of the navigation controls.
- Static verification: `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `git diff --check` passed; only the repository's existing LF-to-CRLF notice appeared. On device, confirm the added gap clears the tab bar while leaving the player comfortably reachable.
- Affected files: `src/app/_layout.tsx`, `docs/PROGRESS.md`.

### Follow-up adjustment (2026-10-28)

- Device feedback showed the first 16 dp lift still touched the native tab treatment. Raised the overlay another 8 dp, to `BottomTabInset + Spacing.four` (24 dp above the original inset). Verify the mini-player now has a small clear gap above the tab bar while remaining reachable.

## Update (2026-10-28) — longer startup animation

- Refined the JavaScript launch overlay in `src/components/startup-animation.tsx` while preserving its pixel-matched handoff from the Expo native splash. The still branded-icon stage now lasts 2.45 seconds (was 2.0 seconds), followed by a 1.4-second exit (was 1.15 seconds): about 3.85 seconds total after React draws.
- The exit now has a gentler logo lift before its final expansion, delayed sound-ring pulses, a longer diagonal sweep, and an extra equalizer beat. All animated properties remain native-driver opacity/transforms; the overlay remains non-interactive and self-unmounts when complete.
- This is a JavaScript-only change. `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `git diff --check` passed (the latter reported only the repository's existing LF-to-CRLF notices). On a release APK, assess whether the slightly longer brand moment still feels responsive; Expo Go and development builds do not faithfully show the native-splash portion.

## Update (2026-10-28) — mini-player position and current splash asset

- Reverted the temporary 25 dp seek-section offset in the Now Playing screen. The persistent mini-player bar is instead raised by 25 dp above its previous position in the root layout, keeping the full-screen Now Playing layout unchanged.
- The React splash overlay now uses React Native's static `Image` loader with a direct `../../assets/icon.png` module reference, rather than `expo-image`. The native `expo-splash-screen` configuration already points to the same `./assets/icon.png` file. This removes a separate runtime image-cache path and makes the intended asset explicit in both startup layers.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `git diff --check` passed (the last command reported only the repository's existing LF-to-CRLF notices). Native splash assets are compiled into the Android app, so confirm this on a regenerated, reinstalled release/preview APK.

## Update (2026-10-27) — native icons replace UI emoji and glyphs

- Added the shared `AppIcon` component backed by SDK 57's installed `expo-symbols` package. It maps SF Symbols on iOS to Material Symbols on Android and web, so UI controls use native iconography rather than emoji or text glyphs.
- Replaced the music, search, library, favorite, transport, shuffle/repeat, refresh, back, chevron, and more-option glyphs across the active screens and shared player components. Text descriptions now refer to the favorite icon rather than embedding a heart character. Existing button accessibility labels remain the accessible names for their icon controls.
- Static verification: `npm.cmd run lint` and `npx.cmd tsc --noEmit` passed with no diagnostics. A source scan found no remaining UI emoji/glyphs in `src/`; the sole matched arrow is a code comment in `media-library-service.ts`.
- Affected files: `src/components/ui/app-icon.tsx`, `src/components/ui/artwork-placeholder.tsx`, `src/components/ui/empty-state.tsx`, `src/components/ui/mini-player.tsx`, `src/features/library/components/library-rows.tsx`, `src/features/playback/components/now-playing.tsx`, `src/app/index.tsx`, `src/app/library.tsx`, `src/app/search.tsx`, `src/app/personal-library.tsx`, and `docs/PROGRESS.md`.

## Update (2026-10-28) — new launcher icon artwork

- Adopted the owner-supplied `assets/icon.png` green music-note artwork as the source for the app's launcher and splash branding. The original source is 511×537 with transparent corners, so square native derivatives were generated without changing the source: `assets/images/icon.png` and `assets/images/icon-ios.png` are 1024×1024 opaque icons, and `assets/images/android-icon-foreground.png` is a 512×512 transparent adaptive-icon foreground.
- Updated `app.json` to use the new square base icon, the regenerated adaptive foreground and iOS icon, and the supplied source image for the splash. Updated `src/components/startup-animation.tsx` to use `assets/icon.png`, replacing the now-removed SoundShelf image reference.
- Static verification: `npx.cmd expo config --type public` resolves all icon and splash paths; `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `git diff --check` passed (only existing LF-to-CRLF notices appeared). Because app configuration and native icon assets changed, run `npx expo prebuild --clean --platform android` before `npx expo run:android --device`, then confirm the launcher icon after uninstalling/reinstalling the app. Splash appearance should be judged using a preview or production APK, not Expo Go or a development build.
- Affected files: `assets/icon.png`, `assets/images/icon.png`, `assets/images/icon-ios.png`, `assets/images/android-icon-foreground.png`, `app.json`, `src/components/startup-animation.tsx`, and `docs/PROGRESS.md`.

---

## Update (2026-10-27) — Spotify-style UI revamp

Replaced the teal gradient design language with a Spotify-inspired dark design across all UI files.

### Changes

- **`src/constants/theme.ts`**: Both `light` and `dark` palettes replaced with Spotify colors (`#121212` bg, `#1E1E1E` surface, `#282828` surfaceRaised, `#1DB954` accent, `#FFFFFF` text, `#B3B3B3` muted). `BackgroundGradient` set to flat `['#121212', '#121212']`; `AccentText` set to `#000000`.
- **`src/components/ui/app-gradient.tsx`**: Now uses `BackgroundGradient` (flat black — no visual gradient). Signature and imports unchanged.
- **`src/components/ui/artwork-placeholder.tsx`**: Square `borderRadius: 4` (Spotify sharp-ish corners), dark gray `surfaceRaised` background, muted music note.
- **`src/components/ui/empty-state.tsx`**: Uses updated `ArtworkPlaceholder`; smaller title/description sizes matching Spotify style.
- **`src/components/ui/screen.tsx`**: No changes to structure; inherits the flat-black gradient.
- **`src/components/app-tabs.tsx`**: Tab bar is `#000000`; active icon/label color is Spotify green (`#1DB954`); removed `useColorScheme` — always dark like Spotify.
- **`src/features/library/components/library-rows.tsx`**: Track rows 56px-ish tall, square 48px artwork, no border lines, heart icon favorite toggle, playing track shown in green.
- **`src/components/ui/mini-player.tsx`**: Dark `#282828` bar, thin green progress line at top, square artwork, play/pause + next controls, no border ring.
- **`src/features/playback/components/now-playing.tsx`**: Full black screen, large 280px square artwork, green seek bar with white thumb dot, white circular play button, flat glyph prev/next/shuffle/repeat. Removed unused `AccentText` import.
- **`src/app/index.tsx`**: Spotify-style greeting (`Good morning/afternoon/evening`), dark scan card, quick-link chips, all-caps muted "YOUR SONGS" section header, recent tracks.
- **`src/app/library.tsx`**: Dark pill segmented control (Songs / Albums / Favorites), all-caps muted section meta, Rescan/back links in green, flat row list.
- **`src/app/search.tsx`**: Dark `#282828` pill search input, magnifier prefix, all-caps muted result count header.
- **`src/app/personal-library.tsx`**: Dark create-playlist row, all-caps section labels, green "Create" pill button, playlist/track rows on dark surfaces.

### Static verification

- `npx tsc --noEmit` ✅ (0 errors; fixed `StyleSheet.absoluteFillObject` → `StyleSheet.absoluteFill` during the check)
- `npm run lint` ✅ (0 errors, 0 warnings; removed unused `AccentText` import from `now-playing.tsx`)

### Device verification status

Not yet verified on hardware. Requires a new development build because themes/assets changed (though no new native modules were added). To test:
- All screens are pure dark `#121212` with no gradient tinting.
- Tab bar is pure black with green active icons/labels.
- Track rows have no separator lines — only spacing.
- Mini player shows green progress bar at top.
- Now Playing shows large centered artwork, green seek bar, white circular play button.
