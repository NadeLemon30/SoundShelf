/**
 * Config plugin: strip react-native-screens fragment state from the Activity's
 * saved instance state.
 *
 * Why: on the New Architecture (Fabric), react-native-screens mounts one native
 * Fragment per screen and lets those fragments be serialized into the host
 * Activity's onSaveInstanceState parcel when the app is backgrounded. With real
 * screens the parcel can exceed the Binder transaction budget (about 1 MB),
 * causing a fatal, unhandled android.os.TransactionTooLargeException in
 * activityStopped() — the process dies, taking any background audio with it.
 * This matches https://github.com/software-mansion/react-native-screens/issues/4487
 * (open, not yet fixed upstream; reproduced with react-native-screens 4.26 / SDK 57).
 *
 * react-native-screens never consumes this saved fragment state — it rebuilds
 * every screen from JS after a process restart (its fragments are declared
 * non-restorable on purpose) — so removing it is safe.
 *
 * Implementation note: on androidx.fragment 1.8.x the FragmentManager state is
 * saved through the SavedStateRegistry, so it is *nested* inside
 * "androidx.lifecycle.BundlableSavedStateRegistry.key". The classic top-level
 * outState.remove("android:support:fragments") alone is a no-op, so we strip it
 * from the nested bundle too (both are removed; the top-level removal is a
 * harmless no-op on 1.8.x and covers older androidx.fragment layouts).
 */

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const OVERRIDE_SNIPPET = `  /**
   * Strip react-native-screens fragment state before the OS saves it.
   * Workaround for software-mansion/react-native-screens#4487: RNS fragments
   * accumulate in the Activity saved-state parcel and can throw
   * android.os.TransactionTooLargeException in activityStopped() when the app
   * is backgrounded, killing the process (and any background audio). RNS never
   * consumes this state (it rebuilds screens from JS), so it is safe to drop.
   */
  override fun onSaveInstanceState(outState: Bundle) {
    super.onSaveInstanceState(outState)
    outState
      .getBundle("androidx.lifecycle.BundlableSavedStateRegistry.key")
      ?.remove("android:support:fragments")
    outState.remove("android:support:fragments")
  }
`;

function findMainActivityPath(projectRoot) {
  const javaRoot = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java');
  if (!fs.existsSync(javaRoot)) {
    return null;
  }
  const stack = [javaRoot];
  while (stack.length > 0) {
    const dir = stack.pop();
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.name === 'MainActivity.kt' || entry.name === 'MainActivity.java') {
        return full;
      }
    }
  }
  return null;
}

module.exports = function withStripActivityFragmentState(config) {
  return withDangerousMod(config, [
    'android',
    (configWithMod) => {
      const projectRoot = configWithMod.modRequest.projectRoot;
      const mainActivityPath = findMainActivityPath(projectRoot);
      if (!mainActivityPath) {
        throw new Error(
          'with-strip-activity-fragment-state: could not find android/app/src/main/java/**/MainActivity.[kt|java]. ' +
            'The Android project may not exist yet; run "npx expo prebuild --platform android" first.'
        );
      }

      let source = fs.readFileSync(mainActivityPath, 'utf8');

      // Idempotent: skip if the override is already present.
      if (source.includes('override fun onSaveInstanceState(outState: Bundle)')) {
        return configWithMod;
      }

      const className = /(class\s+MainActivity\s*:\s*ReactActivity\(\)\s*\{)/.exec(source);
      if (!className) {
        throw new Error(
          'with-strip-activity-fragment-state: expected "class MainActivity : ReactActivity() {" in ' +
            mainActivityPath
        );
      }

      const insertionIndex = className.index + className[1].length;
      source = source.slice(0, insertionIndex) + '\n' + OVERRIDE_SNIPPET + source.slice(insertionIndex);
      fs.writeFileSync(mainActivityPath, source, 'utf8');

      return configWithMod;
    },
  ]);
};