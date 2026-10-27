import { useAudioPlayerStatus } from 'expo-audio';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ArtworkPlaceholder } from '@/components/ui/artwork-placeholder';
import { AppIcon } from '@/components/ui/app-icon';
import { Spacing } from '@/constants/theme';
import { usePersonalLibrary } from '@/features/personal-library/personal-library-provider';
import { useTheme } from '@/hooks/use-theme';
import { formatPlaybackTime, playbackPercent } from '../format';
import { usePlayback } from '../playback-provider';

type NowPlayingProps = { visible: boolean; onClose: () => void };

const REPEAT_LABEL: Record<string, string> = { off: 'Repeat', all: 'Repeat all', one: 'Repeat one' };

export function NowPlaying({ visible, onClose }: NowPlayingProps) {
  const theme = useTheme();
  const { player, currentTrack, queue, index, repeat, shuffle, errorMessage, togglePlayPause, next, previous, seekTo, cycleRepeat, toggleShuffle } = usePlayback();
  const { isFavorite, toggleFavorite } = usePersonalLibrary();
  const status = useAudioPlayerStatus(player);
  const [barWidth, setBarWidth] = useState(0);

  const duration = status.duration;
  const canSeek = duration > 0;
  const percent = playbackPercent(status.currentTime, duration);

  const seekFromTap = (locationX: number) => {
    if (!canSeek || barWidth <= 0) return;
    seekTo(Math.min(1, Math.max(0, locationX / barWidth)) * duration);
  };

  const seekBy = (deltaSeconds: number) => {
    if (!canSeek) return;
    seekTo(Math.min(duration, Math.max(0, status.currentTime + deltaSeconds)));
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={[styles.fullScreen, { backgroundColor: '#121212' }]}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <View style={styles.content}>

            {/* Drag handle */}
            <View style={styles.handleWrap}>
              <View style={[styles.handle, { backgroundColor: '#535353' }]} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Pressable
                accessibilityLabel="Close now playing"
                accessibilityRole="button"
                hitSlop={14}
                onPress={onClose}
                style={({ pressed }) => pressed && styles.pressed}>
                <AppIcon name="chevronDown" size={28} color={theme.textMuted} />
              </Pressable>
              <View style={styles.headerCenter}>
                <ThemedText style={styles.headerContext} themeColor="textMuted">PLAYING FROM LIBRARY</ThemedText>
                {queue.length > 0 && (
                  <ThemedText style={styles.headerQueue} themeColor="textMuted">
                    {Math.min(index + 1, queue.length)} / {queue.length}
                  </ThemedText>
                )}
              </View>
              {/* Visual affordance reserved for a future context menu. */}
              <View accessible={false} style={styles.headerSideBtn}>
                <AppIcon name="more" size={22} color="#B3B3B3" />
              </View>
            </View>

            {/* Artwork — large */}
            <View style={styles.artworkWrap}>
              <ArtworkPlaceholder size={300} style={styles.artworkRadius} />
            </View>

            {/* Track info + heart */}
            <View style={styles.trackRow}>
              <View style={styles.trackInfo}>
                <ThemedText numberOfLines={1} style={styles.trackTitle}>
                  {currentTrack?.title ?? 'Nothing playing'}
                </ThemedText>
                <ThemedText numberOfLines={1} style={styles.trackSub}>
                  {currentTrack?.filename ?? 'Choose a song from your library'}
                </ThemedText>
              </View>
              {/* Favorite the active track. */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={currentTrack && isFavorite(currentTrack.id) ? 'Remove from favorites' : 'Add to favorites'}
                accessibilityState={{ selected: !!currentTrack && isFavorite(currentTrack.id) }}
                hitSlop={12}
                disabled={!currentTrack}
                onPress={() => {
                  if (currentTrack) void toggleFavorite(currentTrack);
                }}
                style={({ pressed }) => pressed && styles.pressed}>
                <AppIcon
                  name={currentTrack && isFavorite(currentTrack.id) ? 'favorite' : 'favoriteOutline'}
                  size={26}
                  color={currentTrack && isFavorite(currentTrack.id) ? theme.accent : theme.textMuted}
                />
              </Pressable>
            </View>

            {/* Error */}
            {errorMessage ? (
              <ThemedText style={{ color: theme.danger, textAlign: 'center' }} type="small">
                {`Could not play: ${errorMessage}`}
              </ThemedText>
            ) : null}

            {/* Seek bar */}
            <View style={styles.seekSection}>
              <Pressable
                accessibilityActions={[
                  { name: 'increment', label: 'Forward 10 seconds' },
                  { name: 'decrement', label: 'Back 10 seconds' },
                ]}
                accessibilityLabel={`Seek, ${formatPlaybackTime(status.currentTime)} of ${canSeek ? formatPlaybackTime(duration) : 'unknown'}`}
                accessibilityRole="adjustable"
                accessibilityValue={{
                  min: 0,
                  max: canSeek ? Math.round(duration) : 0,
                  now: Math.round(status.currentTime),
                  text: `${formatPlaybackTime(status.currentTime)} of ${canSeek ? formatPlaybackTime(duration) : 'unknown'}`,
                }}
                disabled={!canSeek}
                onAccessibilityAction={(e) => seekBy(e.nativeEvent.actionName === 'increment' ? 10 : -10)}
                onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
                onPress={(e) => seekFromTap(e.nativeEvent.locationX)}
                style={[styles.seekTrack, { backgroundColor: '#404040' }]}>
                <View style={[styles.seekFill, { backgroundColor: theme.accent, width: `${percent}%` }]} />
                {/* Thumb */}
                <View style={[styles.seekThumb, { backgroundColor: '#FFFFFF', left: `${percent}%` }]} />
              </Pressable>
              <View style={styles.timeRow}>
                <ThemedText themeColor="textMuted" type="small">{formatPlaybackTime(status.currentTime)}</ThemedText>
                <ThemedText themeColor="textMuted" type="small">{canSeek ? formatPlaybackTime(duration) : '--:--'}</ThemedText>
              </View>
            </View>

            {/* Transport controls */}
            <View style={styles.controls}>
              {/* Shuffle */}
              <Pressable
                accessibilityLabel={`Shuffle ${shuffle ? 'on' : 'off'}`}
                accessibilityRole="button"
                onPress={toggleShuffle}
                style={({ pressed }) => [styles.sideBtn, pressed && styles.pressed]}>
                <AppIcon name="shuffle" size={26} color={shuffle ? theme.accent : theme.textMuted} />
                {shuffle && <View style={[styles.activeDot, { backgroundColor: theme.accent }]} />}
              </Pressable>

              {/* Previous */}
              <Pressable
                accessibilityLabel="Previous track"
                accessibilityRole="button"
                onPress={previous}
                style={({ pressed }) => [styles.sideBtn, pressed && styles.pressed]}>
                <AppIcon name="previous" size={26} color="#FFFFFF" />
              </Pressable>

              {/* Play/Pause — large circular button */}
              <Pressable
                accessibilityLabel={status.playing ? 'Pause' : 'Play'}
                accessibilityRole="button"
                onPress={togglePlayPause}
                style={({ pressed }) => [styles.playBtn, { backgroundColor: '#FFFFFF' }, pressed && styles.pressed]}>
                <AppIcon name={status.playing ? 'pause' : 'play'} size={26} color="#000000" />
              </Pressable>

              {/* Next */}
              <Pressable
                accessibilityLabel="Next track"
                accessibilityRole="button"
                onPress={next}
                style={({ pressed }) => [styles.sideBtn, pressed && styles.pressed]}>
                <AppIcon name="next" size={26} color="#FFFFFF" />
              </Pressable>

              {/* Repeat */}
              <Pressable
                accessibilityLabel={`Repeat: ${REPEAT_LABEL[repeat] ?? repeat}`}
                accessibilityRole="button"
                onPress={cycleRepeat}
                style={({ pressed }) => [styles.sideBtn, pressed && styles.pressed]}>
                <AppIcon name={repeat === 'one' ? 'repeatOne' : 'repeat'} size={26} color={repeat === 'off' ? theme.textMuted : theme.accent} />
                {repeat !== 'off' && <View style={[styles.activeDot, { backgroundColor: theme.accent }]} />}
              </Pressable>
            </View>

          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1, paddingHorizontal: Spacing.four, gap: Spacing.three },
  // Handle bar at top
  handleWrap: { alignItems: 'center', paddingTop: Spacing.one },
  handle: { width: 36, height: 4, borderRadius: 2 },
  // Header row
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chevronDown: { width: 40 },
  headerCenter: { flex: 1, alignItems: 'center', gap: 2 },
  headerContext: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  headerQueue: { fontSize: 11 },
  headerSideBtn: { width: 40, alignItems: 'flex-end' },
  // Artwork
  artworkWrap: { alignItems: 'center' },
  artworkRadius: { borderRadius: 8 },
  // Track info row (title + heart)
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  trackInfo: { flex: 1, gap: 4 },
  trackTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  trackSub: { fontSize: 14, color: '#B3B3B3' },
  // Seek bar
  seekSection: { gap: 8, marginTop: -25 },
  seekTrack: { height: 4, borderRadius: 2, overflow: 'visible', justifyContent: 'center' },
  seekFill: { height: '100%', borderRadius: 2 },
  seekThumb: { position: 'absolute', width: 14, height: 14, borderRadius: 7, marginLeft: -7, top: -5 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  // Transport controls
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sideBtn: { width: 48, alignItems: 'center', gap: 4 },
  activeDot: { width: 4, height: 4, borderRadius: 2 },
  playBtn: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.65 },
});
