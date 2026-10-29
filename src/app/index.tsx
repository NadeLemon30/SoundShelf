import { Link, type Href } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { AppGradient } from '@/components/ui/app-gradient';
import { TrackArtwork } from '@/components/ui/track-artwork';
import { BottomTabInset, MaxContentWidth, MiniPlayerInset, Spacing } from '@/constants/theme';
import { LibraryTrackRow } from '@/features/library/components/library-rows';
import { useLibrary } from '@/features/library/library-provider';
import { usePersonalLibrary } from '@/features/personal-library/personal-library-provider';
import { usePlayback } from '@/features/playback/playback-provider';
import { useTheme } from '@/hooks/use-theme';

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

type HomeLink = { label: string; detail: string; href: '/library' | '/search' | '/personal-library' | '/settings'; icon: AppIconName };

function HomeLinkCard({ link }: { link: HomeLink }) {
  const theme = useTheme();
  return (
    <Link href={link.href as Href} asChild>
      <Pressable accessibilityRole="button" accessibilityLabel={link.label} style={({ pressed }) => [styles.linkCard, { backgroundColor: theme.surfaceRaised }, pressed && styles.pressed]}>
        <View style={[styles.linkIcon, { backgroundColor: theme.surface }]}><AppIcon name={link.icon} size={22} color={theme.accent} /></View>
        <View style={styles.linkCopy}>
          <ThemedText numberOfLines={1} style={styles.linkLabel}>{link.label}</ThemedText>
          <ThemedText numberOfLines={1} style={styles.linkDetail}>{link.detail}</ThemedText>
        </View>
      </Pressable>
    </Link>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const { scan, status, tracks } = useLibrary();
  const { recentlyPlayed } = usePersonalLibrary();
  const { currentTrack, playTrack } = usePlayback();
  const hasLibrary = status === 'ready' && tracks.length > 0;
  const activeTrackIds = new Set(tracks.map((track) => track.id));
  const recentTracks = recentlyPlayed.filter((track) => activeTrackIds.has(track.id)).slice(0, 8);
  const displayTracks = recentTracks.length ? recentTracks : tracks.slice(0, 8);
  const links: HomeLink[] = [
    { label: 'Your Library', detail: hasLibrary ? `${tracks.length} songs` : 'Browse your music', href: '/library', icon: 'library' },
    { label: 'Liked Songs', detail: 'Your favourites', href: '/personal-library', icon: 'favorite' },
    { label: 'Search', detail: 'Find a local track', href: '/search', icon: 'search' },
    { label: 'Settings', detail: 'Playback and library', href: '/settings', icon: 'settings' },
  ];

  return (
    <AppGradient>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <FlatList
          data={displayTracks}
          keyExtractor={(track) => track.id}
          renderItem={({ item }) => <LibraryTrackRow track={item} isCurrent={item.id === currentTrack?.id} onPress={() => playTrack(item, tracks)} />}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.topBar}>
                <ThemedText style={styles.greeting}>{greeting()}</ThemedText>
                <Link href={'/settings' as Href} asChild><Pressable accessibilityRole="button" accessibilityLabel="Open settings" hitSlop={12} style={({ pressed }) => pressed && styles.pressed}><AppIcon name="settings" size={24} color="#FFFFFF" /></Pressable></Link>
              </View>

              {currentTrack ? (
                <Pressable accessibilityRole="button" accessibilityLabel={`Play ${currentTrack.title}`} onPress={() => playTrack(currentTrack, tracks)} style={({ pressed }) => [styles.resumeCard, { backgroundColor: theme.surfaceRaised }, pressed && styles.pressed]}>
                  <TrackArtwork uri={currentTrack.uri} size={68} style={styles.resumeArtwork} />
                  <View style={styles.resumeCopy}>
                    <ThemedText style={styles.resumeEyebrow}>NOW PLAYING</ThemedText>
                    <ThemedText numberOfLines={1} style={styles.resumeTitle}>{currentTrack.title}</ThemedText>
                    <ThemedText numberOfLines={1} style={styles.resumeSub}>{currentTrack.filename}</ThemedText>
                  </View>
                  <View style={[styles.playCircle, { backgroundColor: theme.accent }]}><AppIcon name="play" size={20} color="#000000" /></View>
                </Pressable>
              ) : (
                <View style={[styles.welcomeCard, { backgroundColor: theme.surfaceRaised }]}>
                  <View style={[styles.welcomeIcon, { backgroundColor: theme.accent }]}><AppIcon name="music" size={26} color="#000000" /></View>
                  <View style={styles.welcomeCopy}>
                    <ThemedText style={styles.welcomeTitle}>{hasLibrary ? 'Your music is ready' : 'Your music, on this device'}</ThemedText>
                    <ThemedText style={styles.welcomeSub}>{hasLibrary ? 'Pick a song and keep listening offline.' : 'Scan files stored on your device to start listening.'}</ThemedText>
                  </View>
                  {!hasLibrary && <Pressable accessibilityRole="button" accessibilityLabel="Scan device music library" disabled={status === 'scanning'} onPress={scan} style={({ pressed }) => [styles.scanButton, { backgroundColor: theme.accent }, (pressed || status === 'scanning') && styles.pressed]}><ThemedText style={styles.scanButtonText}>{status === 'scanning' ? 'Scanning…' : 'Scan'}</ThemedText></Pressable>}
                </View>
              )}

              <View style={styles.linkGrid}>{links.map((link) => <HomeLinkCard key={link.href} link={link} />)}</View>
              {displayTracks.length > 0 && (
                <View style={styles.sectionHeader}>
                  <View><ThemedText style={styles.sectionTitle}>{recentTracks.length ? 'Jump back in' : 'Recently added'}</ThemedText><ThemedText style={styles.sectionSubtitle}>{recentTracks.length ? 'Continue where you left off' : 'From your local library'}</ThemedText></View>
                  <Link href="/library" asChild><Pressable accessibilityRole="button" accessibilityLabel="Open your library" style={({ pressed }) => pressed && styles.pressed}><ThemedText style={[styles.showAll, { color: theme.textMuted }]}>Show all</ThemedText></Pressable></Link>
                </View>
              )}
            </View>
          }
          ListEmptyComponent={hasLibrary ? null : <ThemedText style={styles.emptyCopy} themeColor="textMuted">Your recently played music will appear here.</ThemedText>}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </AppGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  listContent: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: BottomTabInset + MiniPlayerInset + Spacing.three },
  header: { gap: Spacing.three, paddingBottom: Spacing.one }, topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6, color: '#FFFFFF' },
  resumeCard: { minHeight: 92, borderRadius: 10, padding: Spacing.two, flexDirection: 'row', alignItems: 'center', gap: Spacing.two }, resumeArtwork: { borderRadius: 6 }, resumeCopy: { flex: 1, gap: 2 },
  resumeEyebrow: { fontSize: 10, lineHeight: 14, fontWeight: '800', letterSpacing: 1.1, color: '#1DB954' }, resumeTitle: { fontSize: 16, lineHeight: 21, fontWeight: '700', color: '#FFFFFF' }, resumeSub: { fontSize: 12, lineHeight: 17, color: '#B3B3B3' }, playCircle: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  welcomeCard: { borderRadius: 10, padding: Spacing.three, gap: Spacing.two }, welcomeIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }, welcomeCopy: { gap: Spacing.one }, welcomeTitle: { fontSize: 19, lineHeight: 25, fontWeight: '800', color: '#FFFFFF' }, welcomeSub: { fontSize: 13, lineHeight: 19, color: '#B3B3B3' },
  scanButton: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: Spacing.three, paddingVertical: 9, marginTop: Spacing.one }, scanButtonText: { color: '#000000', fontSize: 13, lineHeight: 17, fontWeight: '800' },
  linkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }, linkCard: { width: '48.7%', minHeight: 68, padding: Spacing.two, borderRadius: 7, flexDirection: 'row', alignItems: 'center', gap: Spacing.two }, linkIcon: { width: 38, height: 38, borderRadius: 4, justifyContent: 'center', alignItems: 'center' }, linkCopy: { flex: 1, gap: 2 }, linkLabel: { fontSize: 13, lineHeight: 17, fontWeight: '700', color: '#FFFFFF' }, linkDetail: { fontSize: 11, lineHeight: 15, color: '#B3B3B3' },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: Spacing.one }, sectionTitle: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 }, sectionSubtitle: { fontSize: 12, lineHeight: 17, color: '#B3B3B3' }, showAll: { fontSize: 12, lineHeight: 17, fontWeight: '700' },
  emptyCopy: { paddingTop: Spacing.three, fontSize: 13, textAlign: 'center' }, pressed: { opacity: 0.68 },
});
