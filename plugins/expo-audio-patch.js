/**
 * Source patches for three expo-audio 57.0.5 Android bugs.
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
 * --- Bug 3: focus dropped during buffering/transitions, and playback without focus ---
 * expo-audio releases focus on every `onIsPlayingChanged(false)`, which also
 * fires while buffering and between tracks. Nothing re-requests focus when
 * playback resumes on its own, so another app can take focus while SoundShelf
 * is still playing and SoundShelf never receives AUDIOFOCUS_LOSS. Playback also
 * starts even when the focus request was delayed or failed, leaving it with no
 * focus listener at all. The patch holds permanent focus across non-idle
 * playback, re-requests it when playback starts, waits for delayed focus, and
 * refuses to start playback when focus is denied.
 *
 * All fixes target the Kotlin source in `node_modules/expo-audio/android`.
 * SDK 57 ships this module as a prebuilt AAR and autolinking uses the AAR by
 * default, so `package.json` must list `expo-audio` under
 * `expo.autolinking.android.buildFromSource`; otherwise the patched source is
 * never compiled into the app. With that setting the generated project includes
 * `:expo-audio` as a source project, and our edits take effect.
 *
 * The patch is applied by the config plugin during prebuild and by the
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
 * Primary: the expo-audio package source, compiled when the package is listed
 * in `expo.autolinking.android.buildFromSource` (see package.json).
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
// Bug 3: hold focus while playback is ongoing; don't play without focus
//
// Anchors verified against expo-audio 57.0.5 (after Bug 1 is applied).
// ---------------------------------------------------------------------------

const FOCUS_HOLD_MARKER = 'private enum class AudioFocusResult';

const FOCUS_REQUEST_FUNCTION = `  private enum class AudioFocusResult { GRANTED, DELAYED, FAILED, NOT_REQUESTED }

  private fun requestAudioFocus(): AudioFocusResult {
    if (focusAcquired) {
      return AudioFocusResult.GRANTED
    }
    if (!audioEnabled) {
      return AudioFocusResult.FAILED
    }
    if (interruptionMode == InterruptionMode.MIX_WITH_OTHERS) {
      return AudioFocusResult.NOT_REQUESTED
    }

    val result = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val requestType = interruptionMode?.let {
        if (it == InterruptionMode.DO_NOT_MIX) {
          AudioManager.AUDIOFOCUS_GAIN
        } else {
          AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
        }
      } ?: AudioManager.AUDIOFOCUS_GAIN
      focusGainRequested = requestType
      audioFocusRequest = AudioFocusRequest.Builder(requestType).run {
        setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
            .build()
        )
        setAcceptsDelayedFocusGain(true)
        setOnAudioFocusChangeListener(audioFocusChangeListener)
        build()
      }
      audioFocusRequest?.let {
        audioManager.requestAudioFocus(it)
      } ?: AudioManager.AUDIOFOCUS_REQUEST_FAILED
    } else {
      @Suppress("DEPRECATION")
      val requestType = if (interruptionMode == InterruptionMode.DO_NOT_MIX) {
        AudioManager.AUDIOFOCUS_GAIN
      } else {
        AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
      }
      focusGainRequested = requestType
      @Suppress("DEPRECATION")
      audioManager.requestAudioFocus(audioFocusChangeListener, AudioManager.STREAM_MUSIC, requestType)
    }

    Log.d(TAG, "Audio focus result=$result, requested=$focusGainRequested")
    return when (result) {
      AudioManager.AUDIOFOCUS_REQUEST_GRANTED -> {
        focusAcquired = true
        AudioFocusResult.GRANTED
      }
      AudioManager.AUDIOFOCUS_REQUEST_DELAYED -> {
        focusAcquired = false
        AudioFocusResult.DELAYED
      }
      else -> {
        Log.e(TAG, "Audio focus request failed with: $result")
        focusAcquired = false
        AudioFocusResult.FAILED
      }
    }
  }`;

const RELEASE_FOCUS_FUNCTION = `  private fun releaseAudioFocus() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      audioFocusRequest?.let {
        audioManager.abandonAudioFocusRequest(it)
      }
      audioFocusRequest = null
    } else {
      @Suppress("DEPRECATION")
      audioManager.abandonAudioFocus(audioFocusChangeListener)
    }
    Log.d(TAG, "Audio focus released")
    focusAcquired = false
  }`;

const FOCUS_HELPERS = `

  private fun Playable.hasActivePlaybackIntent(): Boolean {
    return player.playWhenReady &&
      player.playerError == null &&
      (player.playbackState == Player.STATE_BUFFERING || player.playbackState == Player.STATE_READY)
  }

  private fun releaseAudioFocusIfUnused() {
    if (!focusAcquired) {
      return
    }

    val focusIsStillNeeded = allPlayables.any { playable ->
      playable.isPlaying ||
        (focusGainRequested == AudioManager.AUDIOFOCUS_GAIN && playable.hasActivePlaybackIntent())
    }
    if (!focusIsStillNeeded) {
      releaseAudioFocus()
    }
  }

  private fun releaseFocusIfNoPlayables() {
    if (allPlayables.none()) {
      releaseAudioFocus()
    }
  }`;

function replaceOnce(source, from, to, label) {
  const count = source.split(from).length - 1;
  if (count !== 1) {
    throw new Error(
      `${LOG_PREFIX} Could not patch ${label}: expected 1 anchor, found ${count}. ` +
        'expo-audio probably changed its source layout. Review ' +
        'plugins/expo-audio-patch.js and update the anchors before building.'
    );
  }
  return source.replace(from, to);
}

function applyAudioFocusHoldPatch(source) {
  if (source.includes(FOCUS_HOLD_MARKER)) {
    return source;
  }

  const requestPattern = /  private fun requestAudioFocus\(\) \{[\s\S]*?\n  \}\n/;
  const releasePattern = /  private fun releaseAudioFocus\(\) \{[\s\S]*?\n  \}\n/;
  if (!requestPattern.test(source) || !releasePattern.test(source)) {
    throw new Error(
      `${LOG_PREFIX} Could not patch audio-focus lifetime: requestAudioFocus() or ` +
        'releaseAudioFocus() no longer matches. Review plugins/expo-audio-patch.js.'
    );
  }

  let patched = source.replace(requestPattern, `${FOCUS_REQUEST_FUNCTION}\n`);
  patched = patched.replace(releasePattern, `${RELEASE_FOCUS_FUNCTION}\n`);

  patched = replaceOnce(
    patched,
    '  private var focusAcquired = false',
    '  private var focusAcquired = false\n  private var focusGainRequested = AudioManager.AUDIOFOCUS_GAIN',
    'the focusGainRequested field'
  );

  patched = replaceOnce(
    patched,
    '  private val audioFocusChangeListener = AudioManager.OnAudioFocusChangeListener { focusChange ->\n' +
      '    appContext.mainQueue.launch {\n' +
      '      when (focusChange) {',
    '  private val audioFocusChangeListener = AudioManager.OnAudioFocusChangeListener { focusChange ->\n' +
      '    appContext.mainQueue.launch {\n' +
      '      Log.d(TAG, "Audio focus changed: $focusChange")\n' +
      '      when (focusChange) {',
    'the focus-change log'
  );

  patched = replaceOnce(
    patched,
    '        AudioManager.AUDIOFOCUS_LOSS -> {\n' +
      '          focusAcquired = false\n' +
      '          allPlayables.forEach { it.pause() }\n' +
      '        }',
    '        AudioManager.AUDIOFOCUS_LOSS -> {\n' +
      '          releaseAudioFocus()\n' +
      '          allPlayables.forEach { it.pause() }\n' +
      '        }',
    'the permanent focus-loss branch'
  );

  patched = replaceOnce(
    patched,
    '  private fun shouldReleaseFocus(): Boolean {\n' +
      '    return allPlayables.none { it.isPlaying }\n' +
      '  }',
    '  private fun shouldReleaseFocus(): Boolean {\n' +
      '    return allPlayables.none { it.isPlaying }\n' +
      '  }' +
      FOCUS_HELPERS,
    'the focus helper functions'
  );

  for (const playable of ['player', 'playlist']) {
    patched = replaceOnce(
      patched,
      `          ${playable}.onPlaybackStateChange = { isPlaying ->\n` +
        '            if (!isPlaying && shouldReleaseFocus()) {\n' +
        '              releaseAudioFocus()\n' +
        '            }\n' +
        '          }',
      `          ${playable}.onPlaybackStateChange = { isPlaying ->\n` +
        '            if (isPlaying) {\n' +
        '              if (!focusAcquired) {\n' +
        '                when (requestAudioFocus()) {\n' +
        '                  AudioFocusResult.DELAYED -> {\n' +
        `                    ${playable}.isPaused = true\n` +
        `                    ${playable}.ref.pause()\n` +
        '                  }\n' +
        `                  AudioFocusResult.FAILED -> ${playable}.ref.pause()\n` +
        '                  else -> Unit\n' +
        '                }\n' +
        '              }\n' +
        '            } else {\n' +
        '              releaseAudioFocusIfUnused()\n' +
        '            }\n' +
        '          }',
      `the ${playable} playback-state focus handler`
    );

    patched = replaceOnce(
      patched,
      '        runOnMain {\n' +
        '          if (!focusAcquired) {\n' +
        '            requestAudioFocus()\n' +
        '          }\n' +
        `          ${playable}.ref.play()\n` +
        '        }',
      '        runOnMain {\n' +
        '          when (requestAudioFocus()) {\n' +
        `            AudioFocusResult.DELAYED -> ${playable}.isPaused = true\n` +
        '            AudioFocusResult.FAILED -> Unit\n' +
        `            else -> ${playable}.ref.play()\n` +
        '          }\n' +
        '        }',
      `the ${playable} play() focus gate`
    );
  }

  patched = replaceOnce(
    patched,
    '                if (!focusAcquired) {\n' +
      '                  requestAudioFocus()\n' +
      '                }\n' +
      '                player.ref.play()',
    '                when (requestAudioFocus()) {\n' +
      '                  AudioFocusResult.DELAYED -> player.isPaused = true\n' +
      '                  AudioFocusResult.FAILED -> Unit\n' +
      '                  else -> player.ref.play()\n' +
      '                }',
    'the replace() focus gate'
  );

  patched = replaceOnce(
    patched,
    '        if (allPlayables.any { it.isPaused }) {\n' +
      '          requestAudioFocus()\n' +
      '        }\n' +
      '\n' +
      '        allPlayables.forEach { playable ->\n' +
      '          if (playable.isPaused) {\n' +
      '            playable.isPaused = false\n' +
      '            playable.play()\n' +
      '          }\n' +
      '        }',
    '        if (allPlayables.any { it.isPaused }) {\n' +
      '          when (requestAudioFocus()) {\n' +
      '            AudioFocusResult.DELAYED, AudioFocusResult.FAILED -> Unit\n' +
      '            else -> allPlayables.forEach { playable ->\n' +
      '              if (playable.isPaused) {\n' +
      '                playable.isPaused = false\n' +
      '                playable.play()\n' +
      '              }\n' +
      '            }\n' +
      '          }\n' +
      '        }',
    'the foreground resume focus gate'
  );

  patched = replaceOnce(
    patched,
    '        players.remove(player.id)',
    '        players.remove(player.id)\n        releaseFocusIfNoPlayables()',
    'the player remove() focus cleanup'
  );

  patched = replaceOnce(
    patched,
    '        playlists.remove(playlist.id)',
    '        playlists.remove(playlist.id)\n        releaseFocusIfNoPlayables()',
    'the playlist destroy() focus cleanup'
  );

  return patched;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function patchSource(source) {
  return applyAudioFocusHoldPatch(applyNoisyReceiverPatch(applyAudioFocusFix(source)));
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
  applyAudioFocusHoldPatch,
  applyNoisyReceiverPatch,
  applyPatches,
  resolveAudioModulePath,
  patchSource,
};
