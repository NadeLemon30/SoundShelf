/**
 * Config plugin: apply the expo-audio Android source patches during prebuild.
 *
 * The patches themselves live in `plugins/expo-audio-patch.js` and are shared
 * with the `postinstall` script (`scripts/patch-expo-audio.js`) so a clean
 * `npm ci` also patches the library. See that file for the two bugs being
 * fixed: the audio-focus grant type and the missing AUDIO_BECOMING_NOISY
 * receiver.
 */

const { withDangerousMod } = require('@expo/config-plugins');

const { applyPatches } = require('./expo-audio-patch');

module.exports = function withAudioFocusAndNoisyFix(config) {
  return withDangerousMod(config, [
    'android',
    (configWithMod) => {
      const result = applyPatches(configWithMod.modRequest.projectRoot);

      if (result.changed || result.receiverWritten) {
        console.log(
          `[with-audio-focus-and-noisy-fix] Patched ${result.audioModulePath}` +
            (result.changed ? ': audio-focus-gain-type + noisy-receiver' : ': noisy-receiver file updated')
        );
      } else {
        console.log('[with-audio-focus-and-noisy-fix] AudioModule.kt already patched; skipping.');
      }

      return configWithMod;
    },
  ]);
};
