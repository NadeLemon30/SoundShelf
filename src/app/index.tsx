import { Link, useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { AppGradient } from '@/components/ui/app-gradient';
import { AppIcon } from '@/components/ui/app-icon';
import { TrackArtwork } from '@/components/ui/track-artwork';
import { BottomTabInset, MaxContentWidth, MiniPlayerInset, Spacing } from '@/constants/theme';
import { useLibrary } from '@/features/library/library-provider';
import { usePersonalLibrary } from '@/features/personal-library/personal-library-provider';
import { usePlayback } from '@/features/playback/playback-provider';
import { useTheme } from '@/hooks/use-theme';

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { tracks, artists } = useLibrary();
  const { playlists } = usePersonalLibrary();
  const { currentTrack, queue, playTrack } = usePlayback();

  const playlistGrid = playlists.slice(0, 4);
  const recentAddedSongs = [...tracks]
    .sort((a, b) => (b.creationTime ?? b.modificationTime ?? 0) - (a.creationTime ?? a.modificationTime ?? 0))
    .slice(0, 5);
  const artistGrid = artists.slice(0, 8);
  const queuePreview = queue.slice(0, 20);

  return (
    <AppGradient>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <ThemedText style={styles.greeting}>{greeting()}</ThemedText>
            <View style={styles.topActions}>
              <Link href={'/listening?from=home' as Href} asChild>
                <Pressable accessibilityRole="button" accessibilityLabel="Open listening stats" hitSlop={12} style={({ pressed }) => pressed && styles.pressed}>
                  <AppIcon name="chart" size={24} color={theme.text} />
                </Pressable>
              </Link>
              <Link href={'/settings' as Href} asChild>
                <Pressable accessibilityRole="button" accessibilityLabel="Open settings" hitSlop={12} style={({ pressed }) => pressed && styles.pressed}>
                  <AppIcon name="settings" size={24} color={theme.text} />
                </Pressable>
              </Link>
            </View>
          </View>

          <SectionHeader title="Playlists" actionLabel="My music" onAction={() => router.push('/personal-library')} />
          {playlistGrid.length > 0 ? (
            <View style={styles.twoByTwo}>
              {Array.from({ length: 4 }).map((_, idx) => {
                const playlist = playlistGrid[idx];
                if (!playlist) return <View key={`playlist-empty-${idx}`} style={styles.gridPlaceholder} />;
                return (
                  <Pressable
                    key={playlist.id}
                    accessibilityLabel={`Open playlist ${playlist.name}`}
                    accessibilityRole="button"
                    onPress={() => router.push('/personal-library')}
                    style={({ pressed }) => [styles.playlistCard, { backgroundColor: theme.surfaceRaised }, pressed && styles.pressed]}>
                    <TrackArtwork decorative icon="album" size={56} uri={playlist.tracks[0]?.uri} style={styles.playlistArt} />
                    <View style={styles.playlistCopy}>
                      <ThemedText numberOfLines={2} style={styles.playlistName}>{playlist.name}</ThemedText>
                      <ThemedText numberOfLines={1} themeColor="textMuted" style={styles.playlistMeta}>
                        {playlist.tracks.length} song{playlist.tracks.length === 1 ? '' : 's'}
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <EmptyCard text="No playlists yet. Create one in My music." onPress={() => router.push('/personal-library')} action="Open My music" />
          )}

          <SectionHeader title="Recently added" subtitle="Last 5 added songs" />
          {recentAddedSongs.length > 0 ? (
            <View style={styles.listSection}>
              {recentAddedSongs.map((track) => (
                <Pressable
                  key={track.id}
                  accessibilityLabel={`Play ${track.title}`}
                  accessibilityRole="button"
                  onPress={() => playTrack(track, recentAddedSongs)}
                  style={({ pressed }) => [styles.songRow, { backgroundColor: theme.surfaceRaised }, pressed && styles.pressed]}>
                  <TrackArtwork decorative icon="music" size={52} uri={track.uri} style={styles.rowArt} />
                  <View style={styles.songCopy}>
                    <ThemedText numberOfLines={1} style={[styles.songTitle, track.id === currentTrack?.id && { color: theme.accent }]}>{track.title}</ThemedText>
                    <ThemedText numberOfLines={1} themeColor="textMuted" style={styles.songMeta}>
                      {[track.artist, track.album].filter((v): v is string => Boolean(v)).join(' · ') || track.filename}
                    </ThemedText>
                  </View>
                  <AppIcon name={track.id === currentTrack?.id ? 'play' : 'chevronRight'} size={20} color={track.id === currentTrack?.id ? theme.accent : theme.textMuted} />
                </Pressable>
              ))}
            </View>
          ) : (
            <EmptyCard text="No songs in your library yet." onPress={() => router.push('/library')} action="Open Library" />
          )}

          <SectionHeader title="Artists" actionLabel="Library" onAction={() => router.push('/library')} />
          {artistGrid.length > 0 ? (
            <View style={styles.artistGrid}>
              {artistGrid.map((artist) => (
                <Pressable
                  key={artist.id}
                  accessibilityLabel={`Open artist ${artist.name}`}
                  accessibilityRole="button"
                  onPress={() => router.push('/library')}
                  style={({ pressed }) => [styles.artistCard, { backgroundColor: theme.surfaceRaised }, pressed && styles.pressed]}>
                  <TrackArtwork decorative icon="music" size={72} uri={artist.tracks[0]?.uri} style={styles.artistArt} />
                  <ThemedText numberOfLines={1} style={styles.artistName}>{artist.name}</ThemedText>
                  <ThemedText numberOfLines={1} themeColor="textMuted" style={styles.artistMeta}>
                    {artist.tracks.length} song{artist.tracks.length === 1 ? '' : 's'}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          ) : (
            <EmptyCard text="No artists found. Scan your library to see artists." onPress={() => router.push('/library')} action="Open Library" />
          )}

          <SectionHeader title="Last queue" subtitle={queue.length ? `${queue.length} song${queue.length === 1 ? '' : 's'}` : undefined} />
          {queuePreview.length > 0 ? (
            <View style={styles.listSection}>
              {queuePreview.map((track, idx) => (
                <Pressable
                  key={`${track.id}-${idx}`}
                  accessibilityLabel={`Play ${track.title} from queue`}
                  accessibilityRole="button"
                  onPress={() => playTrack(track, queue)}
                  style={({ pressed }) => [styles.songRow, { backgroundColor: theme.surfaceRaised }, pressed && styles.pressed]}>
                  <TrackArtwork decorative icon="music" size={52} uri={track.uri} style={styles.rowArt} />
                  <View style={styles.songCopy}>
                    <ThemedText numberOfLines={1} style={[styles.songTitle, track.id === currentTrack?.id && { color: theme.accent }]}>{track.title}</ThemedText>
                    <ThemedText numberOfLines={1} themeColor="textMuted" style={styles.songMeta}>
                      {[track.artist, track.album].filter((v): v is string => Boolean(v)).join(' · ') || track.filename}
                    </ThemedText>
                  </View>
                  {track.id === currentTrack?.id ? <AppIcon name="play" size={18} color={theme.accent} /> : null}
                </Pressable>
              ))}
            </View>
          ) : (
            <EmptyCard text="Your playback queue will appear here after you play music." onPress={() => router.push('/library')} action="Browse Library" />
          )}
        </ScrollView>
      </SafeAreaView>
    </AppGradient>
  );
}

function SectionHeader({ title, subtitle, actionLabel, onAction }: { title: string; subtitle?: string; actionLabel?: string; onAction?: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionCopy}>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        {subtitle ? <ThemedText themeColor="textMuted" style={styles.sectionSubtitle}>{subtitle}</ThemedText> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable accessibilityLabel={actionLabel} accessibilityRole="button" onPress={onAction} style={({ pressed }) => pressed && styles.pressed}>
          <ThemedText style={[styles.sectionAction, { color: theme.accent }]}>{actionLabel}</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

function EmptyCard({ text, action, onPress }: { text: string; action: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.emptyCard, { backgroundColor: theme.surfaceRaised, borderColor: theme.outline }]}>
      <ThemedText themeColor="textMuted" style={styles.emptyText}>{text}</ThemedText>
      <Pressable accessibilityLabel={action} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.emptyAction, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
        <ThemedText style={[styles.emptyActionText, { color: theme.onAccent }]}>{action}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + MiniPlayerInset + Spacing.four,
    gap: Spacing.three,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  greeting: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: Spacing.two, paddingTop: Spacing.one },
  sectionCopy: { flex: 1, gap: 2 },
  sectionTitle: { fontSize: 22, lineHeight: 28, fontWeight: '800', letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 13, lineHeight: 18 },
  sectionAction: { fontSize: 13, fontWeight: '700' },
  twoByTwo: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  playlistCard: {
    width: '48.5%',
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.one,
    paddingRight: Spacing.two,
    borderRadius: 10,
  },
  gridPlaceholder: { width: '48.5%', minHeight: 72 },
  playlistArt: { borderRadius: 6 },
  playlistCopy: { flex: 1, gap: 2 },
  playlistName: { fontSize: 14, fontWeight: '700', lineHeight: 18 },
  playlistMeta: { fontSize: 12 },
  listSection: { gap: Spacing.one },
  songRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.one, paddingRight: Spacing.two, borderRadius: 10 },
  rowArt: { borderRadius: 6 },
  songCopy: { flex: 1, gap: 2 },
  songTitle: { fontSize: 15, fontWeight: '600' },
  songMeta: { fontSize: 13 },
  artistGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  artistCard: { width: '48.5%', borderRadius: 12, padding: Spacing.two, gap: Spacing.one },
  artistArt: { borderRadius: 999, alignSelf: 'center', marginBottom: Spacing.one },
  artistName: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  artistMeta: { fontSize: 12, textAlign: 'center' },
  emptyCard: { borderRadius: 12, borderWidth: 1, padding: Spacing.three, gap: Spacing.two, alignItems: 'flex-start' },
  emptyText: { fontSize: 14, lineHeight: 20 },
  emptyAction: { borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: 10 },
  emptyActionText: { fontSize: 13, fontWeight: '800' },
  pressed: { opacity: 0.7 },
});
