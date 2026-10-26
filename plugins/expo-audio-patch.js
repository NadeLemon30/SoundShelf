/**
 * Source patches for two expo-audio 57.0.5 Android bugs.
 *
 * --- Bug 1: wrong audio-focus grant type ---
 * expo-audio requests AUDIOFOCUS_GAIN_TRANSIENT for the doNotMix interruption
 * mode. GAIN_TRANSIENT means "I need focus briefly, yield me when asked", so
 * the OS can hand focus back to another app without sending AUDIOFOCUS_LOSS to
 * SoundShelf. A music player that holds focus for a whole track needs
 * AUDIOFOCUS_GAIN.
 *
 * --- Bug 2: no ACTION_AUDIO_BECOMING_NOISY receiver ---
 * expo-audio registers a RingerModeReceiver but never handles the
 * AUDIO_BECOMING_NOISY broadcast (wired unplug / Bluetooth disconnect), so
 * audio continues through the phone speaker after the headphones go away.
 *
 * Both fixes target the Kotlin source in `node_modules/expo-audio/android`,
 * which is what Expo autolinking compiles. The generated `android/` project
 * does not contain a copy of `AudioModule.kt`, so patching there would be a
 * no-op. The patch is applied by the config plugin during prebuild and by the
 * `postinstall` script, so `npm ci` cannot silently drop it.
 *
 * Every anchor is checked before anything is written. If expo-audio changes
 * shape, this throws instead of shipping a build with the bugs still present.
 */

const fs = require('fs');
const path = require('path');

const NOISY_RECEIVER_FILENAME = 'NoisyAudioReceiver.kt';
const LOG_PREFIX = '[expo-audio-patch]';

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

/**
 * Locate `AudioModule.kt`.
 *
 * Primary: the expo-audio package source that Gradle compiles.
 * Fallback: a generated native tree, for local experiments that copy sources.
 */
function resolveAudioModulePath(projectRoot) {
  const fromNodeModules = findFileRecursive(
    path.join(projectRoot, 'node_modules', 'expo-audio', 'android'),
    'AudioModule.kt'
  );
  if (fromNodeModules) return fromNodeModules;

  return findFileRecursive(
    path.join(projectRoot, 'android', 'app', 'src', 'main', 'java'),
    'AudioModule.kt'
  );
}

// ---------------------------------------------------------------------------
// Bug 1: AUDIOFOCUS_GAIN_TRANSIENT -> AUDIOFOCUS_GAIN for DO_NOT_MIX
//
// Indentation verified against expo-audio 57.0.5. We match the surrounding
// block, not the bare constant, so AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK (the
// correct value for every other mode) is never touched.
// ---------------------------------------------------------------------------

const TRANSIENT_WRONG_API26 =
  `        if (it == InterruptionMode.DO_NOT_MIX) {\n` +
  `          AudioManager.AUDIOFOCUS_GAIN_TRANSIENT\n` +
  `        } else {\n` +
  `          AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK\n` +
  `        }\n` +
  `      } ?: AudioManager.AUDIOFOCUS_GAIN_TRANSIENT`;

const TRANSIENT_FIXED_API26 =
  `        if (it == InterruptionMode.DO_NOT_MIX) {\n` +
  `          AudioManager.AUDIOFOCUS_GAIN\n` +
  `        } else {\n` +
  `          AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK\n` +
  `        }\n` +
  `      } ?: AudioManager.AUDIOFOCUS_GAIN`;

const TRANSIENT_WRONG_LEGACY =
  `      val requestType = if (interruptionMode == InterruptionMode.DO_NOT_MIX) {\n` +
  `        AudioManager.AUDIOFOCUS_GAIN_TRANSIENT\n` +
  `      } else {\n` +
  `        AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK\n` +
  `      }`;

const TRANSIENT_FIXED_LEGACY =
  `      val requestType = if (interruptionMode == InterruptionMode.DO_NOT_MIX) {\n` +
  `        AudioManager.AUDIOFOCUS_GAIN\n` +
  `      } else {\n` +
  `        AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK\n` +
  `      }`;

/** A bare GAIN_TRANSIENT request; `_MAY_DUCK` is a different, correct constant. */
const UNPATCHED_FOCUS_REQUEST = /AUDIOFOCUS_GAIN_TRANSIENT(?!_)/;

function applyAudioFocusFix(source) {
  let patched = source;

  if (patched.includes(TRANSIENT_WRONG_API26)) {
    patched = patched.replace(TRANSIENT_WRONG_API26, TRANSIENT_FIXED_API26);
  }
  if (patched.includes(TRANSIENT_WRONG_LEGACY)) {
    patched = patched.replace(TRANSIENT_WRONG_LEGACY, TRANSIENT_FIXED_LEGACY);
  }

  // Either the upstream file was fixed, or our anchors no longer match and the
  // app would still request transient focus. Fail instead of shipping that.
  if (UNPATCHED_FOCUS_REQUEST.test(patched)) {
    throw new Error(
      `${LOG_PREFIX} Could not patch the audio-focus request in AudioModule.kt. ` +
        'expo-audio probably changed its source layout. Review ' +
        'plugins/expo-audio-patch.js and update the anchors before building.'
    );
  }

  return patched;
}

// ---------------------------------------------------------------------------
// Bug 2: inject the AUDIO_BECOMING_NOISY receiver
//
// Anchors verified against expo-audio 57.0.5:
//   field      private var playsInSilentMode = true
//   OnCreate   context.registerReceiver(ringerModeReceiver, IntentFilter(AudioManager.RINGER_MODE_CHANGED_ACTION))
//   OnDestroy  context.unregisterReceiver(ringerModeReceiver)
// ---------------------------------------------------------------------------

const NOISY_FIELD_ANCHOR = '  private var playsInSilentMode = true';
const NOISY_ONCREATE_ANCHOR =
  '      context.registerReceiver(ringerModeReceiver, IntentFilter(AudioManager.RINGER_MODE_CHANGED_ACTION))';
const NOISY_ONDESTROY_ANCHOR = '      context.unregisterReceiver(ringerModeReceiver)';
/** Sentinel: skip when this file has already been patched. */
const NOISY_FIELD_MARKER = 'noisyAudioReceiver';

function buildNoisyReceiverSource(packageName) {
  return (
    `package ${packageName}\n` +
    `\n` +
    `import android.content.BroadcastReceiver\n` +
    `import android.content.Context\n` +
    `import android.content.Intent\n` +
    `import android.media.AudioManager\n` +
    `\n` +
    `/**\n` +
    ` * Pauses all expo-audio players when wired headphones are unplugged or a\n` +
    ` * Bluetooth audio device disconnects. Android fires the AUDIO_BECOMING_NOISY\n` +
    ` * broadcast in both situations; without handling it audio would abruptly\n` +
    ` * continue through the phone speaker.\n` +
    ` *\n` +
    ` * Injected by plugins/expo-audio-patch.js because expo-audio's AudioModule\n` +
    ` * does not register this receiver.\n` +
    ` */\n` +
    `internal class NoisyAudioReceiver(\n` +
    `  private val onNoisy: () -> Unit\n` +
    `) : BroadcastReceiver() {\n` +
    `  override fun onReceive(context: Context, intent: Intent) {\n` +
    `    if (intent.action == AudioManager.ACTION_AUDIO_BECOMING_NOISY) {\n` +
    `      onNoisy()\n` +
    `    }\n` +
    `  }\n` +
    `}\n`
  );
}

function applyNoisyReceiverPatch(source) {
  if (source.includes(NOISY_FIELD_MARKER)) {
    return source; // already patched
  }

  // All three edits are required together. Check every anchor before writing so
  // the file can never end up with a receiver that is declared but never
  // registered (or registered but never unregistered).
  const missing = [
    ['playsInSilentMode field', NOISY_FIELD_ANCHOR],
    ['OnCreate registration', NOISY_ONCREATE_ANCHOR],
    ['OnDestroy unregistration', NOISY_ONDESTROY_ANCHOR],
  ].filter(([, anchor]) => !source.includes(anchor));

  if (missing.length > 0) {
    throw new Error(
      `${LOG_PREFIX} Could not inject the AUDIO_BECOMING_NOISY receiver; ` +
        `missing anchor(s): ${missing.map(([label]) => label).join(', ')}. ` +
        'expo-audio probably changed its source layout. Review ' +
        'plugins/expo-audio-patch.js and update the anchors before building.'
    );
  }

  const noisyField =
    `\n` +
    `  private val noisyAudioReceiver = NoisyAudioReceiver {\n` +
    `    appContext.mainQueue.launch {\n` +
    `      allPlayables.forEach { playable ->\n` +
    `        if (playable.isPlaying) {\n` +
    `          playable.isPaused = true\n` +
    `          playable.pause()\n` +
    `        }\n` +
    `      }\n` +
    `    }\n` +
    `  }`;

  return source
    .replace(NOISY_FIELD_ANCHOR, NOISY_FIELD_ANCHOR + noisyField)
    .replace(
      NOISY_ONCREATE_ANCHOR,
      NOISY_ONCREATE_ANCHOR +
        '\n      context.registerReceiver(noisyAudioReceiver, IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY))'
    )
    .replace(
      NOISY_ONDESTROY_ANCHOR,
      NOISY_ONDESTROY_ANCHOR + '\n      context.unregisterReceiver(noisyAudioReceiver)'
    );
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function patchSource(source) {
  return applyNoisyReceiverPatch(applyAudioFocusFix(source));
}

/**
 * Patch the installed expo-audio Android source. Idempotent.
 *
 * @returns {{ audioModulePath: string, changed: boolean, receiverWritten: boolean }}
 */
function applyPatches(projectRoot) {
  const audioModulePath = resolveAudioModulePath(projectRoot);
  if (!audioModulePath) {
    throw new Error(
      `${LOG_PREFIX} Could not find AudioModule.kt in node_modules/expo-audio/android. ` +
        'Install expo-audio with "npx expo install expo-audio" first.'
    );
  }

  const before = fs.readFileSync(audioModulePath, 'utf8');
  const after = patchSource(before);
  const changed = after !== before;

  if (changed) {
    fs.writeFileSync(audioModulePath, after, 'utf8');
  }

  const pkgMatch = /^package\s+([\w.]+)/m.exec(after);
  const packageName = pkgMatch ? pkgMatch[1] : 'expo.modules.audio';
  const receiverPath = path.join(path.dirname(audioModulePath), NOISY_RECEIVER_FILENAME);
  const receiverSource = buildNoisyReceiverSource(packageName);
  const receiverWritten = !fs.existsSync(receiverPath) || fs.readFileSync(receiverPath, 'utf8') !== receiverSource;

  if (receiverWritten) {
    fs.writeFileSync(receiverPath, receiverSource, 'utf8');
  }

  return { audioModulePath, changed, receiverWritten };
}

module.exports = {
  applyAudioFocusFix,
  applyNoisyReceiverPatch,
  applyPatches,
  resolveAudioModulePath,
  patchSource,
};
