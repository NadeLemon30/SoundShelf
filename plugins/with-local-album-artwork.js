/**
 * Adds a deliberately small Android native module for local audio artwork.
 *
 * expo-media-library exposes audio URIs but not embedded ID3/MP4 pictures.
 * MediaMetadataRetriever can read those pictures without a network request or
 * an additional permission, so this module extracts a picture only when its
 * row is visible and saves it in the app cache for image rendering.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MODULE_SOURCE = `package com.nadelemon.SoundShelf

import android.media.MediaMetadataRetriever
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.security.MessageDigest

class LocalAlbumArtworkModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "LocalAlbumArtwork"

  @ReactMethod
  fun getArtworkUri(audioUri: String, promise: Promise) {
    try {
      val artworkDir = File(context.cacheDir, "album-artwork")
      if (!artworkDir.exists() && !artworkDir.mkdirs()) {
        promise.resolve(null)
        return
      }
      val file = File(artworkDir, sha256(audioUri) + ".img")
      if (file.exists() && file.length() > 0) {
        promise.resolve(Uri.fromFile(file).toString())
        return
      }

      val retriever = MediaMetadataRetriever()
      try {
        retriever.setDataSource(context, Uri.parse(audioUri))
        val picture = retriever.embeddedPicture
        if (picture == null || picture.isEmpty()) {
          promise.resolve(null)
          return
        }
        file.outputStream().use { it.write(picture) }
        promise.resolve(Uri.fromFile(file).toString())
      } finally {
        retriever.release()
      }
    } catch (_: Exception) {
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun getMetadata(audioUri: String, promise: Promise) {
    try {
      val retriever = MediaMetadataRetriever()
      try {
        retriever.setDataSource(context, Uri.parse(audioUri))
        val metadata = Arguments.createMap()
        putOptionalString(metadata, "title", retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE))
        putOptionalString(metadata, "artist", retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ARTIST))
        putOptionalString(metadata, "album", retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUM))
        promise.resolve(metadata)
      } finally {
        retriever.release()
      }
    } catch (_: Exception) {
      promise.resolve(null)
    }
  }

  private fun putOptionalString(map: com.facebook.react.bridge.WritableMap, key: String, value: String?) {
    val cleanValue = value?.trim()?.takeIf { it.isNotEmpty() }
    if (cleanValue == null) map.putNull(key) else map.putString(key, cleanValue)
  }

  private fun sha256(value: String): String = MessageDigest.getInstance("SHA-256")
    .digest(value.toByteArray(Charsets.UTF_8))
    .joinToString("") { "%02x".format(it) }
}
`;

const PACKAGE_SOURCE = `package com.nadelemon.SoundShelf

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class LocalAlbumArtworkPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(LocalAlbumArtworkModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
`;

function findMainApplication(javaRoot) {
  const stack = [javaRoot];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(fullPath);
      else if (entry.name === 'MainApplication.kt') return fullPath;
    }
  }
  return null;
}

module.exports = function withLocalAlbumArtwork(config) {
  return withDangerousMod(config, ['android', (configWithMod) => {
    const projectRoot = configWithMod.modRequest.projectRoot;
    const javaRoot = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java');
    const mainApplicationPath = fs.existsSync(javaRoot) ? findMainApplication(javaRoot) : null;
    if (!mainApplicationPath) {
      throw new Error('with-local-album-artwork: MainApplication.kt was not found after Android prebuild.');
    }

    const packageDirectory = path.dirname(mainApplicationPath);
    fs.writeFileSync(path.join(packageDirectory, 'LocalAlbumArtworkModule.kt'), MODULE_SOURCE, 'utf8');
    fs.writeFileSync(path.join(packageDirectory, 'LocalAlbumArtworkPackage.kt'), PACKAGE_SOURCE, 'utf8');

    let source = fs.readFileSync(mainApplicationPath, 'utf8');
    if (!source.includes('add(LocalAlbumArtworkPackage())')) {
      const anchor = '// add(MyReactNativePackage())';
      if (!source.includes(anchor)) {
        throw new Error('with-local-album-artwork: could not find the generated package-list insertion point.');
      }
      source = source.replace(anchor, `${anchor}\n          add(LocalAlbumArtworkPackage())`);
      fs.writeFileSync(mainApplicationPath, source, 'utf8');
    }
    return configWithMod;
  }]);
};
