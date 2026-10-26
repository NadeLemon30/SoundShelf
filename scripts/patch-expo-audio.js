/**
 * Apply the expo-audio Android source patches after `npm install` / `npm ci`.
 *
 * The config plugin also runs them during prebuild, but prebuild only runs when
 * `android/` is generated. Without this postinstall step, reinstalling
 * node_modules and then rebuilding an existing native project would silently
 * compile the unpatched library (wrong audio-focus type, no headphone-disconnect
 * handling). Failure is intentional: a dependency update that moves the anchors
 * must be reviewed rather than shipped with the bugs still present.
 */

const path = require('path');

const { applyPatches } = require('../plugins/expo-audio-patch');

try {
  const result = applyPatches(path.join(__dirname, '..'));
  const state = result.changed || result.receiverWritten ? 'applied' : 'already present';
  console.log(`[postinstall] expo-audio Android patches ${state}.`);
} catch (error) {
  console.error(`[postinstall] ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
