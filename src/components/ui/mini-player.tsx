import { useAudioPlayerStatus } from 'expo-audio';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { NowPlaying } from '@/features/playback/components/now-playing';
import { playbackPercent } from '@/features/playback/format';
import { usePlayback } from '@/features/playback/playback-provider';

import { ArtworkPlaceholder } from './artwork-placeholder';
import { ThemedText } from '../themed-text';

export function MiniPlayer() {
  const theme = useTheme();
  const { player, currentTrack, hasTrack, errorMessage, togglePlayPause, next } = usePlayback();
  const status = useAudioPlayerStatus(player);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);

  if (!hasTrack || !currentTrack) {
    return (
      <View accessible accessibilityLabel="Nothing playing. Start a song from your library." style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
        <ArtworkPlaceholder size={40} />
        <View style={styles.copy}>
          <ThemedText numberOfLines={1} type="smallBold">Nothing playing</ThemedText>
          <ThemedText numberOfLines={1} themeColor="textMuted" type="small">Tap a song to start playback</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
      <Pressable
        accessibilityLabel={`Open now playing for ${currentTrack.title}`}
        accessibilityRole="button"
        onPress={() => setNowPlayingOpen(true)}
        style={({ pressed }) => [styles.openArea, pressed && styles.pressed]}>
        <ArtworkPlaceholder size={40} />
        <View style={styles.copy}>
          <ThemedText numberOfLines={1} type="smallBold">{currentTrack.title}</ThemedText>
          {errorMessage ? (
            <ThemedText numberOfLines={1} style={{ color: theme.danger }} type="small">Could not play this track</ThemedText>
          ) : (
            <ThemedText numberOfLines={1} themeColor="textMuted" type="small">{currentTrack.filename}</ThemedText>
          )}
        </View>
      </Pressable>
      <Pressable
        accessibilityLabel={status.playing ? 'Pause' : 'Play'}
        accessibilityRole="button"
        hitSlop={8}
        onPress={togglePlayPause}
        style={({ pressed }) => [styles.control, pressed && styles.pressed]}>
        <ThemedText style={[styles.controlGlyph, { color: theme.accent }]}>{status.playing ? '❚❚' : '▶'}</ThemedText>
      </Pressable>
      <Pressable accessibilityLabel="Next track" accessibilityRole="button" hitSlop={8} onPress={next} style={({ pressed }) => [styles.control, pressed && styles.pressed]}>
        <ThemedText style={[styles.controlGlyph, { color: theme.accent }]}>▶▶</ThemedText>
      </Pressable>
      <View style={[styles.progressTrack, { backgroundColor: theme.outline }]}>
        <View style={[styles.progressFill, { backgroundColor: theme.accent, width: `${playbackPercent(status.currentTime, status.duration)}%` }]} />
      </View>
      <NowPlaying onClose={() => setNowPlayingOpen(false)} visible={nowPlayingOpen} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', padding: Spacing.two, borderRadius: 18, borderWidth: 1, gap: Spacing.two, overflow: 'hidden' },
  openArea: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  copy: { flex: 1, gap: 1 },
  control: { paddingHorizontal: Spacing.one },
  controlGlyph: { fontSize: 16, fontWeight: '700' },
  progressTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 2 },
  progressFill: { height: '100%' },
  pressed: { opacity: 0.72 },
});
