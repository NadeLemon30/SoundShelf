# SoundShelf

SoundShelf is an Android-first, offline-first music player built with Expo, React Native, and TypeScript. It will browse music already stored on a device, play it locally, preserve a personal library and listening history, and create private Replay Stories from real listening data.

The app deliberately does not download music, stream online media, require an account, synchronize to the cloud, offer social features, or use AI.

## Project status

The repository currently contains an Expo Router starter and planning documentation. No SoundShelf features or feature-specific dependencies have been implemented. See [docs/PROGRESS.md](docs/PROGRESS.md) for the verified handoff state and [docs/ROADMAP.md](docs/ROADMAP.md) for the approved-order plan.

## Requirements

- Node.js compatible with Expo SDK 57
- npm (this repository has `package-lock.json`; it does not use Bun)
- An Android device for local-media and background-playback testing
- An Expo development build once native configuration for library scanning or background playback is added

## Setup

```bash
npm install
npx expo start
```

The starter can be opened during early UI work with Expo Go. After native audio/media configuration is introduced, create and install a development build before testing those features.

## Common commands

```bash
npx expo start
npx expo start --android
npm run lint
npx tsc --noEmit
npx expo-doctor
```

Use `npx expo install <package>` for any future Expo or React Native dependency so its version matches Expo SDK 57. Use `npx eas-cli@latest <command>` for EAS operations because this is an npm project.

## Documentation

- [Agent workflow and project rules](AGENTS.md)
- [Roadmap](docs/ROADMAP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Technical decisions](docs/DECISIONS.md)
- [Current handoff state](docs/PROGRESS.md)

## Repository layout

```text
src/app/          Expo Router routes and navigator layouts
src/components/   reusable UI components
src/hooks/        reusable hooks
src/constants/    shared theme values
assets/           bundled starter assets
docs/             durable planning and handoff records
```

Future app modules must remain outside `src/app/`; see the proposed structure in the architecture document.
