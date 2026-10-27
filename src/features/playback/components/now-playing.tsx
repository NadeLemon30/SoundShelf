import { useAudioPlayerStatus } from 'expo-audio';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { AppGradient } from '@/components/ui/app-gradient';
import { ArtworkPlaceholder } from '@/components/ui/artwork-placeholder';
import { AccentText, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { formatPlaybackTime, playbackPercent } from '../format';
import { usePlayback } from '../playback-provider';

type NowPlayingProps = { visible: boolean; onClose: () => void };

const REPEAT_LABEL: Record<string, string> = { off: 'Off', all: 'All', one: 'One' };

export function NowPlaying({ visible, onClose }: NowPlayingProps) {
  const theme = useTheme();
  const { player, currentTrack, queue, index, repeat, shuffle, errorMessage, togglePlayPause, next, previous, seekTo, cycleRepeat, toggleShuffle } = usePlayback();
  const status = useAudioPlayerStatus(player);
  const [barWidth, setBarWidth] = useState(0);

  const duration = status.duration;
  const canSeek = duration > 0;
  const percent = playbackPercent(status.currentTime, duration);

  const seekFromTap = (locationX: number) => {
    if (!canSeek || barWidth <= 0) {
      return;
    }
    const ratio = Math.min(1, Math.max(0, locationX / barWidth));
    seekTo(ratio * duration);
  };

  /** Screen-reader seek: Android exposes no drag gesture, so step forwards/backwards. */
  const seekBy = (deltaSeconds: number) => {
    if (!canSeek) {
      return;
    }
    seekTo(Math.min(duration, Math.max(0, status.currentTime + deltaSeconds)));
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <AppGradient>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable accessibilityLabel="Close now playing" accessibilityRole="button" hitSlop={10} onPress={onClose} style={({ pressed }) => pressed && styles.pressed}>
              <ThemedText style={styles.close} themeColor="textMuted">⌄</ThemedText>
            </Pressable>
            <ThemedText themeColor="textMuted" type="smallBold">NOW PLAYING</ThemedText>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.artworkWrap}>
            <ArtworkPlaceholder size={220} />
          </View>

          <View style={styles.details}>
            <ThemedText numberOfLines={2} style={styles.title} type="subtitle">{currentTrack?.title ?? 'Nothing playing'}</ThemedText>
            <ThemedText numberOfLines={1} themeColor="textMuted">{currentTrack?.filename ?? 'Choose a song from your library.'}</ThemedText>
          </View>

          <View style={styles.progressSection}>
            <Pressable
              accessibilityActions={[
                { name: 'increment', label: 'Forward 10 seconds' },
                { name: 'decrement', label: 'Back 10 seconds' },
              ]}
              accessibilityLabel={`Seek, ${formatPlaybackTime(status.currentTime)} of ${canSeek ? formatPlaybackTime(duration) : 'an unknown duration'}`}
              accessibilityRole="adjustable"
              accessibilityValue={{
                min: 0,
                max: canSeek ? Math.round(duration) : 0,
                now: Math.round(status.currentTime),
                text: `${formatPlaybackTime(status.currentTime)} of ${canSeek ? formatPlaybackTime(duration) : 'an unknown duration'}`,
              }}
              disabled={!canSeek}
              onAccessibilityAction={(event) => seekBy(event.nativeEvent.actionName === 'increment' ? 10 : -10)}
              onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
              onPress={(event) => seekFromTap(event.nativeEvent.locationX)}
              style={[styles.progressTrack, { backgroundColor: theme.surfaceRaised }]}>
              <View style={[styles.progressFill, { backgroundColor: theme.accent, width: `${percent}%` }]} />
            </Pressable>
            <View style={styles.timeRow}>
              <ThemedText themeColor="textMuted" type="small">{formatPlaybackTime(status.currentTime)}</ThemedText>
              <ThemedText themeColor="textMuted" type="small">{canSeek ? formatPlaybackTime(duration) : '--:--'}</ThemedText>
            </View>
          </View>

          {errorMessage ? <ThemedText style={{ color: theme.danger }} type="small">{`This track could not be played: ${errorMessage}`}</ThemedText> : null}

          <View style={styles.controls}>
            <Pressable accessibilityLabel="Previous track" accessibilityRole="button" onPress={previous} style={({ pressed }) => [styles.sideControl, pressed && styles.pressed]}>
              <ThemedText style={styles.sideGlyph} themeColor="text">⏮</ThemedText>
            </Pressable>
            <Pressable
              accessibilityLabel={status.playing ? 'Pause' : 'Play'}
              accessibilityRole="button"
              onPress={togglePlayPause}
              style={({ pressed }) => [styles.primaryControl, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
              <ThemedText style={styles.primaryGlyph}>{status.playing ? '❚❚' : '▶'}</ThemedText>
            </Pressable>
            <Pressable accessibilityLabel="Next track" accessibilityRole="button" onPress={next} style={({ pressed }) => [styles.sideControl, pressed && styles.pressed]}>
              <ThemedText style={styles.sideGlyph} themeColor="text">⏭</ThemedText>
            </Pressable>
          </View>

          <View style={styles.modes}>
            <Pressable
              accessibilityLabel={`Shuffle ${shuffle ? 'on' : 'off'}`}
              accessibilityRole="button"
              accessibilityState={{ selected: shuffle }}
              onPress={toggleShuffle}
              style={({ pressed }) => [styles.modeButton, { backgroundColor: shuffle ? theme.accentMuted : theme.surfaceRaised }, pressed && styles.pressed]}>
              <ThemedText type="smallBold" themeColor={shuffle ? 'accent' : 'textMuted'}>{shuffle ? 'Shuffle on' : 'Shuffle off'}</ThemedText>
            </Pressable>
            <Pressable
              accessibilityLabel={`Repeat ${REPEAT_LABEL[repeat] ?? repeat}`}
              accessibilityRole="button"
              onPress={cycleRepeat}
              style={({ pressed }) => [styles.modeButton, { backgroundColor: repeat === 'off' ? theme.surfaceRaised : theme.accentMuted }, pressed && styles.pressed]}>
              <ThemedText type="smallBold" themeColor={repeat === 'off' ? 'textMuted' : 'accent'}>{`Repeat: ${REPEAT_LABEL[repeat] ?? repeat}`}</ThemedText>
            </Pressable>
          </View>

          {queue.length > 0 ? <ThemedText themeColor="textMuted" style={styles.queueNote} type="small">{`Track ${Math.min(index + 1, queue.length)} of ${queue.length}`}</ThemedText> : null}
        </View>
      </SafeAreaView>
      </AppGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', padding: Spacing.four, gap: Spacing.four },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { fontSize: 30, lineHeight: 32, fontWeight: '700', width: 40 },
  headerSpacer: { width: 40 },
  artworkWrap: { alignItems: 'center', paddingVertical: Spacing.three },
  details: { alignItems: 'center', gap: Spacing.half },
  title: { textAlign: 'center', fontSize: 28, lineHeight: 34 },
  progressSection: { gap: Spacing.one },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.four },
  sideControl: { padding: Spacing.two },
  sideGlyph: { fontSize: 28, lineHeight: 32 },
  primaryControl: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  primaryGlyph: { color: AccentText, fontSize: 26, fontWeight: '700' },
  modes: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.two },
  modeButton: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, borderRadius: 12 },
  queueNote: { textAlign: 'center' },
  pressed: { opacity: 0.72 },
});
