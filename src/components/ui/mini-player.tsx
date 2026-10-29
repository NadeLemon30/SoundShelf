import { useAudioPlayerStatus } from 'expo-audio';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { NowPlaying } from '@/features/playback/components/now-playing';
import { playbackPercent } from '@/features/playback/format';
import { usePlayback } from '@/features/playback/playback-provider';
import { TrackArtwork } from './track-artwork';
import { ThemedText } from '../themed-text';
import { AppIcon } from './app-icon';

export function MiniPlayer() {
  const theme = useTheme();
  const { player, currentTrack, hasTrack, errorMessage, togglePlayPause, next } = usePlayback();
  const status = useAudioPlayerStatus(player);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const percent = playbackPercent(status.currentTime, status.duration);

  if (!hasTrack || !currentTrack) {
    return null;
  }

  return (
    <View style={[styles.card, { backgroundColor: '#1E1E1E' }]}>
      <View style={styles.inner}>
        {/* Tap artwork/title area to open Now Playing */}
        <Pressable
          accessibilityLabel={`Open now playing for ${currentTrack.title}`}
          accessibilityRole="button"
          onPress={() => setNowPlayingOpen(true)}
          style={({ pressed }) => [styles.openArea, pressed && styles.pressed]}>
          <TrackArtwork size={44} style={styles.artwork} uri={currentTrack.uri} />
          <View style={styles.copy}>
            <ThemedText numberOfLines={1} style={styles.trackTitle}>{currentTrack.title}</ThemedText>
            {errorMessage ? (
              <ThemedText numberOfLines={1} style={[styles.trackSub, { color: theme.danger }]}>
                Could not play
              </ThemedText>
            ) : (
              <ThemedText numberOfLines={1} style={styles.trackSub}>{currentTrack.filename}</ThemedText>
            )}
          </View>
        </Pressable>

        {/* Controls */}
        <Pressable
          accessibilityLabel={status.playing ? 'Pause' : 'Play'}
          accessibilityRole="button"
          hitSlop={14}
          onPress={togglePlayPause}
          style={({ pressed }) => [styles.control, pressed && styles.pressed]}>
          <AppIcon name={status.playing ? 'pause' : 'play'} size={20} color="#FFFFFF" />
        </Pressable>
        <Pressable
          accessibilityLabel="Next track"
          accessibilityRole="button"
          hitSlop={14}
          onPress={next}
          style={({ pressed }) => [styles.control, pressed && styles.pressed]}>
          <AppIcon name="next" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Thin progress bar at the bottom of the card */}
      <View style={[styles.progressTrack, { backgroundColor: '#333333' }]}>
        <View style={[styles.progressFill, { backgroundColor: theme.accent, width: `${percent}%` }]} />
      </View>

      <NowPlaying onClose={() => setNowPlayingOpen(false)} visible={nowPlayingOpen} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: Spacing.two,
    // Subtle elevation on Android
    elevation: 8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  artwork: { borderRadius: 6 },
  openArea: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  copy: { flex: 1, gap: 2 },
  trackTitle: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  trackSub: { fontSize: 12, color: '#B3B3B3' },
  control: { padding: Spacing.one },
  progressTrack: { height: 2, width: '100%' },
  progressFill: { height: '100%' },
  pressed: { opacity: 0.65 },
});
