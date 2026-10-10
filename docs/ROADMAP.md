# SoundShelf roadmap

Phase advancement requires user approval. Completion criteria mean evidence exists in code, device testing, and `docs/PROGRESS.md`; they are not permission to begin the next phase automatically.

## 1. Planning and research — completed

**Objective:** establish a verified implementation path and durable cross-agent documentation.

**Tasks:** inspect the starter; research Expo SDK 57 local-media, audio, persistence, permissions, and development-build constraints; document architecture, decisions, risks, and the proposed phased plan; approve a device proof of concept for media discovery.

**Completion criteria:** documentation is internally consistent, audio/media assumptions are sourced, and the owner approves the next phase or targeted proof of concept.

## 2. Foundation and UI — current

**Objective:** replace starter UI with the app shell and reusable mobile-first interface foundation.

**Tasks:** define routes and tabs with Expo Router; establish light/dark tokens; build reusable screen, list-row, artwork-placeholder, empty-state, error-state, mini-player shell, and accessible controls; establish animation and responsive-layout conventions.

**Completion criteria:** Android device navigation works, themes are complete, and the app shell has no starter screens.

## 3. Local music library

**Objective:** discover and browse local Android audio without assuming metadata quality.

**Tasks:** request only audio-media access at an appropriate user action; query and page audio assets; normalize stable track identifiers and available metadata; validate playback URIs; implement Songs, Artists, Albums, and search; render artwork when available with a fallback; define a rescan/update strategy.

**Completion criteria:** tested on a physical Android device with real files, including permission denial, empty library, missing fields/artwork, and an unplayable file.

## 4. Core playback

**Objective:** play local tracks reliably in the foreground.

**Tasks:** introduce the approved audio module; implement player lifecycle, queue, seek, next/previous, shuffle, repeat modes, track-end behavior, and mini-player/Now Playing integration.

**Completion criteria:** queue semantics and all controls are device-tested with local media.

## 5. Background playback

**Objective:** preserve expected music-player behavior outside the foreground.

**Tasks:** add required config plugin/settings and development build; wire notification and lock-screen controls; configure interruptions/audio focus; verify headphone/Bluetooth disconnect behavior; persist and restore an appropriate playback checkpoint.

**Completion criteria:** physical-device tests confirm sustained screen-off playback, notification/lock-screen actions, interruption recovery, disconnect behavior, and resume policy.

## 6. Personal library

**Objective:** make personal organization durable and local.

**Tasks:** add database migrations and repositories for playlists, playlist items, favorites, and recently played tracks; support playlist ordering and deletion safely.

**Completion criteria:** state survives restart and library rescans, and stale tracks fail gracefully.

## 7. Listening analytics

**Objective:** record accurate private listening behavior.

**Tasks:** define qualified-listen and duration-accounting rules; persist listening sessions/events; calculate daily, weekly, monthly, and yearly aggregates; expose honest insufficient-data states.

**Completion criteria:** aggregation tests cover pauses, seeks, skips, repeats, midnight/time-zone boundaries, and restart recovery.

## 8. Replay Stories

**Objective:** turn verified annual listening data into clear, shareable recap cards.

**Tasks:** define eligibility thresholds; create deterministic recap queries and story screens; render cards to share; cover absent artwork and insufficient history.

**Completion criteria:** generated recaps match fixture data, share correctly on Android, and never fabricate a recap.

## 9. Polish and reliability

**Objective:** make everyday use dependable and polished.

**Tasks:** profile large libraries; improve list virtualization and image loading; audit accessibility; refine motion, themes, error states, migrations, and edge cases.

**Completion criteria:** performance/accessibility checks and a regression pass are documented.

## 10. Testing and release

**Objective:** prepare a distributable Android build and repeatable release process.

**Tasks:** complete device matrix and regression checklist; set Android identity/versioning; configure EAS profiles; build an APK/AAB; document installation, test evidence, and release notes.

**Completion criteria:** successful signed Android build, installation test, documented known limitations, and user release approval.
