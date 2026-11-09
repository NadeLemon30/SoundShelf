import { useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Modal, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { TrackArtwork } from '@/components/ui/track-artwork';
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
  const { player, currentTrack, queue, index, repeat, shuffle, errorMessage, togglePlayPause, next, previous, seekTo, cycleRepeat, toggleShuffle, playTrack } = usePlayback();
  const { isFavorite, toggleFavorite } = usePersonalLibrary();
  const status = useAudioPlayerStatus(player);
  const percent = playbackPercent(status.currentTime, status.duration);
  const [queueExpanded, setQueueExpanded] = useState(false);
  const [seekPreviewPercent, setSeekPreviewPercent] = useState<number | null>(null);
  const [progressWidth, setProgressWidth] = useState(1);
  const favorite = currentTrack ? isFavorite(currentTrack.id) : false;
  const displayPercent = seekPreviewPercent ?? percent;
  const displayTime = seekPreviewPercent !== null ? status.duration * (seekPreviewPercent / 100) : status.currentTime;

  const seekToPercent = useCallback((nextPercent: number) => {
    if (!status.duration) return;
    const clamped = Math.min(100, Math.max(0, nextPercent));
    seekTo(status.duration * (clamped / 100));
  }, [seekTo, status.duration]);

  const setQueueOpen = useCallback((open: boolean) => {
    setQueueExpanded(open);
  }, []);

  const seekPan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => Boolean(status.duration),
    onMoveShouldSetPanResponder: () => Boolean(status.duration),
    onPanResponderGrant: (event) => {
      if (!status.duration) return;
      setSeekPreviewPercent((event.nativeEvent.locationX / progressWidth) * 100);
    },
    onPanResponderMove: (event) => {
      if (!status.duration) return;
      setSeekPreviewPercent((event.nativeEvent.locationX / progressWidth) * 100);
    },
    onPanResponderRelease: (event) => {
      const nextPercent = (event.nativeEvent.locationX / progressWidth) * 100;
      setSeekPreviewPercent(null);
      seekToPercent(nextPercent);
    },
    onPanResponderTerminate: () => setSeekPreviewPercent(null),
  }), [progressWidth, seekToPercent, status.duration]);

  const closeQueue = () => setQueueOpen(false);
  const openQueue = () => setQueueOpen(true);

  const handleClose = () => {
    setQueueExpanded(false);
    onClose();
  };

  const queueList = (
    <FlatList
      data={queue}
      keyExtractor={(item, idx) => `${item.id}-${idx}`}
      showsVerticalScrollIndicator={false}
      initialNumToRender={16}
      contentContainerStyle={styles.queueListContent}
      renderItem={({ item, index: itemIndex }) => {
        const isCurrent = itemIndex === index;
        const subtitle = [item.artist, item.album].filter((v): v is string => Boolean(v)).join(' · ') || item.filename;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${isCurrent ? 'Now playing: ' : 'Play '}${item.title}`}
            accessibilityState={{ selected: isCurrent }}
            onPress={() => playTrack(item, queue)}
            style={[styles.queueRow, isCurrent && { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
            <TrackArtwork decorative icon="music" size={44} uri={item.uri} style={styles.queueArtwork} />
            <View style={styles.queueRowText}>
              <ThemedText numberOfLines={1} style={[styles.queueRowTitle, isCurrent && { color: theme.accent }]}>{item.title}</ThemedText>
              <ThemedText numberOfLines={1} themeColor="textMuted" style={styles.queueRowSub}>{subtitle}</ThemedText>
            </View>
            {isCurrent && <AppIcon name="play" size={16} color={theme.accent} />}
          </Pressable>
        );
      }}
    />
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={queueExpanded ? closeQueue : handleClose}>
      <View style={[styles.root, { backgroundColor: theme.surface }]}>
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
          {queueExpanded ? (
            <>
              <View style={[styles.miniPlayerBar, { backgroundColor: theme.surfaceRaised, borderColor: theme.outline }]}>
                <Pressable
                  accessibilityHint="Returns to the full Now Playing screen."
                  accessibilityLabel="Collapse queue"
                  accessibilityRole="button"
                  onPress={closeQueue}
                  style={styles.miniPlayerMain}>
                  <TrackArtwork decorative icon="music" size={48} uri={currentTrack?.uri} style={styles.miniArtwork} />
                  <View style={styles.miniPlayerText}>
                    <ThemedText numberOfLines={1} style={styles.miniPlayerTitle}>{currentTrack?.title ?? 'Nothing playing'}</ThemedText>
                    <ThemedText numberOfLines={1} themeColor="textMuted" style={styles.miniPlayerSubtitle}>
                      {[currentTrack?.artist, currentTrack?.album].filter((value): value is string => Boolean(value)).join(' · ') || 'Queue'}
                    </ThemedText>
                  </View>
                </Pressable>
                <Pressable
                  accessibilityLabel={status.playing ? 'Pause' : 'Play'}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={togglePlayPause}
                  style={styles.miniPlayerButton}>
                  <AppIcon name={status.playing ? 'pause' : 'play'} size={28} color={theme.text} />
                </Pressable>
                <Pressable
                  accessibilityLabel="Next track"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={next}
                  style={styles.miniPlayerButton}>
                  <AppIcon name="next" size={26} color={theme.text} />
                </Pressable>
                <Pressable
                  accessibilityLabel="Close Now Playing"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={handleClose}
                  style={styles.miniPlayerButton}>
                  <AppIcon name="chevronDown" size={24} color={theme.textMuted} />
                </Pressable>
              </View>

              <View style={styles.queueScreenHeader}>
                <ThemedText style={styles.queueScreenTitle}>Up Next</ThemedText>
                <ThemedText themeColor="textMuted" style={styles.queueCount}>{queue.length} song{queue.length === 1 ? '' : 's'}</ThemedText>
              </View>

              <View style={styles.queueScreenBody}>
                {queueList}
              </View>
            </>
          ) : (
            <>
              {/* Header */}
              <View style={styles.header}>
                <Pressable onPress={handleClose} hitSlop={12} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Close Now Playing">
                  <AppIcon name="chevronDown" size={28} color={theme.text} />
                </Pressable>
                <ThemedText themeColor="textMuted" style={styles.headerLabel}>NOW PLAYING</ThemedText>
                <View style={styles.headerBtn} />
              </View>

              <View style={styles.content}>
                {/* Artwork */}
                <TrackArtwork
                  icon="music"
                  size={320}
                  style={[styles.artwork, { backgroundColor: theme.surfaceRaised }]}
                  uri={currentTrack?.uri}
                />

                {/* Track info + favorite */}
                <View style={styles.trackRow}>
                  <View style={styles.trackText}>
                    <ThemedText numberOfLines={1} style={styles.title}>{currentTrack?.title ?? 'Nothing playing'}</ThemedText>
                    <ThemedText numberOfLines={1} themeColor="textMuted" style={styles.subtitle}>
                      {[currentTrack?.artist, currentTrack?.album].filter((value): value is string => Boolean(value)).join(' · ') || 'Start a song from your library'}
                    </ThemedText>
                  </View>
                  {currentTrack && (
                    <Pressable
                      onPress={() => void toggleFavorite(currentTrack)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'}
                      style={styles.favoriteBtn}>
                      <AppIcon name={favorite ? 'favorite' : 'favoriteOutline'} size={26} color={favorite ? theme.accent : theme.textMuted} />
                    </Pressable>
                  )}
                </View>

                {/* Progress */}
                <View style={styles.progressWrap}>
                  <View
                    {...seekPan.panHandlers}
                    accessibilityRole="adjustable"
                    accessibilityLabel="Playback position"
                    accessibilityValue={{ min: 0, max: 100, now: Math.round(displayPercent), text: `${formatPlaybackTime(displayTime)} of ${formatPlaybackTime(status.duration)}` }}
                    onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width || 1)}
                    style={styles.progressTouch}>
                    <View style={[styles.progressTrack, { backgroundColor: theme.outline }]}>
                      <View style={[styles.progressFill, { backgroundColor: theme.accent, width: `${displayPercent}%` }]} />
                      <View style={[styles.progressThumb, { backgroundColor: theme.accent, left: `${displayPercent}%` }]} />
                    </View>
                  </View>
                  <View style={styles.times}>
                    <ThemedText themeColor="textMuted" style={styles.time}>{formatPlaybackTime(displayTime)}</ThemedText>
                    <ThemedText themeColor="textMuted" style={styles.time}>{formatPlaybackTime(status.duration)}</ThemedText>
                  </View>
                </View>

                {errorMessage ? <ThemedText style={[styles.error, { color: theme.danger }]}>{errorMessage}</ThemedText> : null}

                {/* Controls */}
                <View style={styles.controls}>
                  <Pressable onPress={toggleShuffle} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Shuffle ${shuffle ? 'on' : 'off'}`} accessibilityState={{ selected: shuffle }} style={styles.smallBtn}>
                    <AppIcon name="shuffle" size={22} color={shuffle ? theme.accent : theme.textMuted} />
                  </Pressable>
                  <Pressable onPress={previous} hitSlop={8} accessibilityRole="button" accessibilityLabel="Previous track" style={styles.skipBtn}>
                    <AppIcon name="previous" size={34} color={theme.text} />
                  </Pressable>
                  <Pressable onPress={togglePlayPause} accessibilityRole="button" accessibilityLabel={status.playing ? 'Pause' : 'Play'} style={[styles.playBtn, { backgroundColor: theme.text }]}>
                    <AppIcon name={status.playing ? 'pause' : 'play'} size={30} color={theme.surface} />
                  </Pressable>
                  <Pressable onPress={next} hitSlop={8} accessibilityRole="button" accessibilityLabel="Next track" style={styles.skipBtn}>
                    <AppIcon name="next" size={34} color={theme.text} />
                  </Pressable>
                  <Pressable onPress={cycleRepeat} hitSlop={8} accessibilityRole="button" accessibilityLabel={REPEAT_LABEL[repeat]} accessibilityState={{ selected: repeat !== 'off' }} style={styles.smallBtn}>
                    <AppIcon name={repeat === 'one' ? 'repeatOne' : 'repeat'} size={22} color={repeat !== 'off' ? theme.accent : theme.textMuted} />
                  </Pressable>
                </View>
              </View>

              <Pressable
                accessibilityHint="Expands the queue to full screen and shows a minimized player at the top."
                accessibilityLabel={`Open queue, ${queue.length} songs`}
                accessibilityRole="button"
                onPress={openQueue}
                style={[styles.queueLauncher, { backgroundColor: theme.surfaceRaised, borderTopColor: theme.outline }]}>
                <View style={styles.queueHeaderLeft}>
                  <AppIcon name="library" size={18} color={theme.textMuted} />
                  <ThemedText style={styles.queueTitle}>Up Next</ThemedText>
                  <ThemedText themeColor="textMuted" style={styles.queueCount}>{queue.length} song{queue.length === 1 ? '' : 's'}</ThemedText>
                </View>
                <AppIcon name="chevronUp" size={22} color={theme.textMuted} />
              </Pressable>
            </>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.two },
  headerBtn: { width: 40, alignItems: 'center' },
  headerLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  content: { flex: 1, alignItems: 'center', paddingBottom: Spacing.two },
  artwork: { marginTop: Spacing.two, marginBottom: Spacing.four, borderRadius: 12, overflow: 'hidden' },
  queueArtwork: { borderRadius: 4, overflow: 'hidden' },
  miniArtwork: { borderRadius: 6, overflow: 'hidden' },
  trackRow: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: Spacing.two },
  trackText: { flex: 1, gap: 4 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 15 },
  favoriteBtn: { padding: Spacing.one },
  progressWrap: { width: '100%', marginTop: Spacing.four, gap: 6 },
  progressTouch: { paddingVertical: 14 },
  progressTrack: { height: 4, borderRadius: 2, justifyContent: 'center' },
  progressFill: { position: 'absolute', left: 0, height: 4, borderRadius: 2 },
  progressThumb: { position: 'absolute', width: 14, height: 14, borderRadius: 7, marginLeft: -7, top: -5 },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { fontSize: 12, fontVariant: ['tabular-nums'] },
  error: { fontSize: 13, marginTop: Spacing.two, alignSelf: 'flex-start' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: Spacing.three, paddingHorizontal: Spacing.one },
  smallBtn: { width: 40, alignItems: 'center', padding: Spacing.one },
  skipBtn: { padding: Spacing.one },
  playBtn: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  queueLauncher: { marginHorizontal: -Spacing.three, borderTopWidth: 1, borderTopLeftRadius: 16, borderTopRightRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, minHeight: 64 },
  queueHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  queueTitle: { fontSize: 15, fontWeight: '600' },
  queueCount: { fontSize: 13 },
  queueRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: 8, minHeight: 60 },
  queueRowText: { flex: 1, gap: 2 },
  queueRowTitle: { fontSize: 15, fontWeight: '500' },
  queueRowSub: { fontSize: 13 },
  queueListContent: { paddingBottom: Spacing.four },
  miniPlayerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginHorizontal: -Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    minHeight: 72,
  },
  miniPlayerMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minWidth: 0 },
  miniPlayerText: { flex: 1, gap: 2 },
  miniPlayerTitle: { fontSize: 15, fontWeight: '600' },
  miniPlayerSubtitle: { fontSize: 13 },
  miniPlayerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  queueScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  queueScreenTitle: { fontSize: 22, fontWeight: '700' },
  queueScreenBody: { flex: 1, marginHorizontal: -Spacing.three },
});
