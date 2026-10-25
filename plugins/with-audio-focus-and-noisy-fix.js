/**
 * Config plugin: fix two expo-audio Android bugs affecting audio-focus and
 * headphone-disconnect (becoming-noisy) behaviour.
 *
 * --- Bug 1: wrong audio-focus grant type (Test C) ---
 * expo-audio requests AUDIOFOCUS_GAIN_TRANSIENT for the doNotMix interruption
 * mode. GAIN_TRANSIENT means "I need focus briefly, yield me when asked" — the
 * OS can silently hand focus back to another app (e.g. YouTube) without sending
 * AUDIOFOCUS_LOSS to SoundShelf. The correct request type for a music player
 * holding permanent focus is AUDIOFOCUS_GAIN.
 *
 * Fix: after expo prebuild generates AudioModule.kt in android/, replace both
 * AUDIOFOCUS_GAIN_TRANSIENT occurrences inside requestAudioFocus() with
 * AUDIOFOCUS_GAIN when the interruptionMode is DO_NOT_MIX.
 *
 * --- Bug 2: no ACTION_AUDIO_BECOMING_NOISY receiver (Test D) ---
 * expo-audio registers a RingerModeReceiver but never registers a receiver for
 * android.media.AUDIO_BECOMING_NOISY — the Android broadcast that fires when
 * wired headphones are unplugged or a Bluetooth device disconnects. Without
 * this, audio continues through the speaker after disconnect.
 *
 * Fix: inject a NoisyAudioReceiver (BroadcastReceiver) into AudioModule.kt's
 * onCreate/onDestroy, and insert the companion Kotlin file into the same
 * package directory.
 *
 * Both patches are applied post-prebuild via withDangerousMod and are idempotent.
 */

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findFileRecursive(dir, filename) {
  if (!fs.existsSync(dir)) return null;
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.name === filename) {
        return full;
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Bug 1 fix: AUDIOFOCUS_GAIN_TRANSIENT → AUDIOFOCUS_GAIN for DO_NOT_MIX
//
// The generated AudioModule.kt has two code paths inside requestAudioFocus():
//
//   if (it == InterruptionMode.DO_NOT_MIX) {
//     AudioManager.AUDIOFOCUS_GAIN_TRANSIENT       ← wrong
//   } ...
//
// We replace only those two occurrences (the ones inside the DO_NOT_MIX branch).
// We match the minimal unique literal that surrounds them so the patch is safe
// if expo-audio reformats the file.
// ---------------------------------------------------------------------------

const TRANSIENT_WRONG_API26 = `if (it == InterruptionMode.DO_NOT_MIX) {
          AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
        } else {
          AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
        }`;

const TRANSIENT_FIXED_API26 = `if (it == InterruptionMode.DO_NOT_MIX) {
          AudioManager.AUDIOFOCUS_GAIN
        } else {
          AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
        }`;

const TRANSIENT_WRONG_LEGACY = `val requestType = if (interruptionMode == InterruptionMode.DO_NOT_MIX) {
        AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
      } else {
        AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
      }`;

const TRANSIENT_FIXED_LEGACY = `val requestType = if (interruptionMode == InterruptionMode.DO_NOT_MIX) {
        AudioManager.AUDIOFOCUS_GAIN
      } else {
        AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
      }`;

function applyAudioFocusFix(source) {
  let patched = source;

  // API 26+ branch (AudioFocusRequest.Builder path)
  if (patched.includes(TRANSIENT_WRONG_API26)) {
    patched = patched.replace(TRANSIENT_WRONG_API26, TRANSIENT_FIXED_API26);
  }

  // Legacy branch (deprecated requestAudioFocus path, API < 26)
  if (patched.includes(TRANSIENT_WRONG_LEGACY)) {
    patched = patched.replace(TRANSIENT_WRONG_LEGACY, TRANSIENT_FIXED_LEGACY);
  }

  return patched;
}

// ---------------------------------------------------------------------------
// Bug 2 fix: inject AUDIO_BECOMING_NOISY handling into AudioModule.kt
//
// Strategy:
//  a) Write a NoisyAudioReceiver.kt file next to AudioModule.kt.
//  b) Patch AudioModule.kt to:
//     - import the receiver class
//     - declare a noisyReceiver field
//     - register it in OnCreate
//     - unregister it in OnDestroy
// ---------------------------------------------------------------------------

const NOISY_RECEIVER_FILENAME = 'NoisyAudioReceiver.kt';

function buildNoisyReceiverSource(packageName) {
  return `package ${packageName}

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioManager

/**
 * Pauses all expo-audio players when wired headphones are unplugged or a
 * Bluetooth audio device disconnects. Android fires the AUDIO_BECOMING_NOISY
 * broadcast in both situations; without handling it audio would abruptly
 * continue through the phone speaker.
 *
 * Injected by the with-audio-focus-and-noisy-fix config plugin because
 * expo-audio's AudioModule does not register this receiver.
 */
internal class NoisyAudioReceiver(
  private val onNoisy: () -> Unit
) : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == AudioManager.ACTION_AUDIO_BECOMING_NOISY) {
      onNoisy()
    }
  }
}
`;
}

// Markers we inject into AudioModule.kt — idempotency check looks for these.
const NOISY_IMPORT = 'import android.media.AudioManager';          // already present
const NOISY_FIELD_MARKER = 'private val noisyAudioReceiver';
const NOISY_REGISTER_MARKER = 'ACTION_AUDIO_BECOMING_NOISY';

function applyNoisyReceiverPatch(source) {
  // Idempotent guard
  if (source.includes(NOISY_FIELD_MARKER)) {
    return source;
  }

  // 1. Add field declaration after playsInSilentMode field.
  //    The original line is: private var playsInSilentMode = true
  const FIELD_ANCHOR = 'private var playsInSilentMode = true';
  const NOISY_FIELD = `  private val noisyAudioReceiver = NoisyAudioReceiver {
    appContext.mainQueue.launch {
      allPlayables.forEach { playable ->
        if (playable.isPlaying) {
          playable.isPaused = true
          playable.pause()
        }
      }
    }
  }`;

  if (!source.includes(FIELD_ANCHOR)) {
    console.warn('[with-audio-focus-and-noisy-fix] Could not find field anchor in AudioModule.kt; noisy-receiver field not injected.');
  } else {
    source = source.replace(
      FIELD_ANCHOR,
      FIELD_ANCHOR + '\n\n' + NOISY_FIELD
    );
  }

  // 2. Register in OnCreate — register after the ringerModeReceiver registration.
  //    Original: context.registerReceiver(ringerModeReceiver, IntentFilter(AudioManager.RINGER_MODE_CHANGED_ACTION))
  const ONCREATE_ANCHOR = 'context.registerReceiver(ringerModeReceiver, IntentFilter(AudioManager.RINGER_MODE_CHANGED_ACTION))';
  const NOISY_REGISTER = `      context.registerReceiver(noisyAudioReceiver, IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY))`;

  if (!source.includes(ONCREATE_ANCHOR)) {
    console.warn('[with-audio-focus-and-noisy-fix] Could not find OnCreate anchor in AudioModule.kt; noisy-receiver registration not injected.');
  } else {
    source = source.replace(
      ONCREATE_ANCHOR,
      ONCREATE_ANCHOR + '\n' + NOISY_REGISTER
    );
  }

  // 3. Unregister in OnDestroy — unregister alongside ringerModeReceiver.
  //    Original: context.unregisterReceiver(ringerModeReceiver)
  const ONDESTROY_ANCHOR = 'context.unregisterReceiver(ringerModeReceiver)';
  const NOISY_UNREGISTER = `      context.unregisterReceiver(noisyAudioReceiver)`;

  if (!source.includes(ONDESTROY_ANCHOR)) {
    console.warn('[with-audio-focus-and-noisy-fix] Could not find OnDestroy anchor in AudioModule.kt; noisy-receiver unregistration not injected.');
  } else {
    source = source.replace(
      ONDESTROY_ANCHOR,
      ONDESTROY_ANCHOR + '\n' + NOISY_UNREGISTER
    );
  }

  return source;
}

// ---------------------------------------------------------------------------
// Plugin entry point
// ---------------------------------------------------------------------------

module.exports = function withAudioFocusAndNoisyFix(config) {
  return withDangerousMod(config, [
    'android',
    (configWithMod) => {
      const projectRoot = configWithMod.modRequest.projectRoot;
      const javaRoot = path.join(projectRoot, 'android', 'app', 'src', 'main');

      // Locate AudioModule.kt in the generated android source tree.
      // expo-audio copies its sources under app/src/main/java during prebuild.
      const audioModulePath = findFileRecursive(
        path.join(javaRoot, 'java'),
        'AudioModule.kt'
      );

      if (!audioModulePath) {
        throw new Error(
          '[with-audio-focus-and-noisy-fix] Could not find AudioModule.kt in android/app/src/main/java. ' +
            'Run "npx expo prebuild --clean --platform android" first.'
        );
      }

      let source = fs.readFileSync(audioModulePath, 'utf8');

      // Derive the Kotlin package from the source file.
      const pkgMatch = /^package\s+([\w.]+)/m.exec(source);
      const packageName = pkgMatch ? pkgMatch[1] : 'expo.modules.audio';

      // --- Apply Bug 1 fix ---
      const afterFocusFix = applyAudioFocusFix(source);
      const focusPatched = afterFocusFix !== source;

      // --- Apply Bug 2 fix ---
      const afterNoisyFix = applyNoisyReceiverPatch(afterFocusFix);
      const noisyPatched = afterNoisyFix !== afterFocusFix;

      if (focusPatched || noisyPatched) {
        fs.writeFileSync(audioModulePath, afterNoisyFix, 'utf8');
        console.log(
          '[with-audio-focus-and-noisy-fix] Patched AudioModule.kt:' +
            (focusPatched ? ' audio-focus-gain-type' : '') +
            (noisyPatched ? ' noisy-receiver' : '')
        );
      } else {
        console.log('[with-audio-focus-and-noisy-fix] AudioModule.kt already patched; skipping.');
      }

      // --- Write NoisyAudioReceiver.kt next to AudioModule.kt (idempotent) ---
      const receiverPath = path.join(path.dirname(audioModulePath), NOISY_RECEIVER_FILENAME);
      const receiverSource = buildNoisyReceiverSource(packageName);
      fs.writeFileSync(receiverPath, receiverSource, 'utf8');

      return configWithMod;
    },
  ]);
};
