import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { AppGradient } from '@/components/ui/app-gradient';
import { MiniPlayer } from '@/components/ui/mini-player';
import { Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLibrary } from '@/features/library/library-provider';
import { usePlayback } from '@/features/playback/playback-provider';
import { LibraryTrackRow } from '@/features/library/components/library-rows';
import type { LibraryTrack } from '@/features/library/types';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

type QuickLink = { label: string; href: '/library' | '/search' | '/personal-library' };
const QUICK_LINKS: QuickLink[] = [
  { label: '📚  Library', href: '/library' },
  { label: '♥  My music', href: '/personal-library' },
  { label: '🔍  Search', href: '/search' },
];

export default function HomeScreen() {
  const theme = useTheme();
  const { scan, status, tracks } = useLibrary();
  const { currentTrack, playTrack } = usePlayback();
  const recentTracks = tracks.slice(0, 6);
  const hasLibrary = status === 'ready' && tracks.length > 0;

  type Item =
    | { type: 'greeting' }
    | { type: 'scanCard' }
    | { type: 'quickLinks' }
    | { type: 'sectionLabel' }
    | { type: 'track'; data: LibraryTrack }
    | { type: 'seeAll' }
    | { type: 'footer' };

  const listData: Item[] = [
    { type: 'greeting' },
    ...(hasLibrary ? [] : [{ type: 'scanCard' } as Item]),
    ...(hasLibrary ? [{ type: 'quickLinks' } as Item] : []),
    ...(recentTracks.length > 0 ? [{ type: 'sectionLabel' } as Item] : []),
    ...recentTracks.map((data): Item => ({ type: 'track', data })),
    ...(tracks.length > 6 ? [{ type: 'seeAll' } as Item] : []),
    { type: 'footer' },
  ];

  const renderItem = ({ item }: { item: Item }) => {
    switch (item.type) {
      case 'greeting':
        return <ThemedText style={styles.greeting}>{greeting()}</ThemedText>;

      case 'scanCard':
        return (
          <View style={[styles.scanCard, { backgroundColor: theme.surfaceRaised }]}>
            <ThemedText style={styles.scanIcon}>🎵</ThemedText>
            <ThemedText style={styles.scanTitle}>Find your music</ThemedText>
            <ThemedText style={styles.scanSub}>
              Scan the audio files already saved on your device.
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Scan device music library"
              disabled={status === 'scanning'}
              onPress={scan}
              style={({ pressed }) => [
                styles.greenBtn,
                { backgroundColor: theme.accent },
                (pressed || status === 'scanning') && styles.pressed,
              ]}>
              <ThemedText style={styles.greenBtnText}>
                {status === 'scanning' ? 'Scanning…' : 'Scan device music'}
              </ThemedText>
            </Pressable>
          </View>
        );

      case 'quickLinks':
        return (
          <View style={styles.quickRow}>
            {QUICK_LINKS.map((link) => (
              <Link key={link.href} href={link.href} asChild>
                <Pressable
                  style={({ pressed }) => [
                    styles.quickChip,
                    { backgroundColor: theme.surfaceRaised },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText style={styles.quickChipText}>{link.label}</ThemedText>
                </Pressable>
              </Link>
            ))}
          </View>
        );

      case 'sectionLabel':
        return <ThemedText style={styles.sectionLabel}>YOUR SONGS</ThemedText>;

      case 'track':
        return (
          <LibraryTrackRow
            track={item.data}
            isCurrent={item.data.id === currentTrack?.id}
            onPress={() => playTrack(item.data, tracks)}
          />
        );

      case 'seeAll':
        return (
          <Link href="/library" asChild>
            <Pressable style={({ pressed }) => pressed && styles.pressed}>
              <ThemedText style={styles.seeAll}>
                See all {tracks.length} songs →
              </ThemedText>
            </Pressable>
          </Link>
        );

      case 'footer':
        return (
          <View style={styles.footer}>
            <MiniPlayer />
          </View>
        );
    }
  };

  return (
    <AppGradient>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <FlatList
          data={listData}
          keyExtractor={(item, i) => `${item.type}-${i}`}
          renderItem={renderItem}
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
  listContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.six,
    gap: Spacing.three,
  },
  greeting: { fontSize: 30, fontWeight: '700', color: '#FFFFFF' },
  // Scan card
  scanCard: { borderRadius: 12, padding: Spacing.four, gap: Spacing.two },
  scanIcon: { fontSize: 32 },
  scanTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  scanSub: { fontSize: 14, color: '#B3B3B3', lineHeight: 20 },
  greenBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: Spacing.four,
    borderRadius: 24,
    marginTop: Spacing.one,
  },
  greenBtnText: { fontWeight: '700', fontSize: 14, color: '#000000' },
  // Quick links
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  quickChip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 24,
  },
  quickChipText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  // Section
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#B3B3B3',
    marginBottom: -Spacing.two,
  },
  seeAll: { fontSize: 13, color: '#B3B3B3', paddingVertical: Spacing.one },
  footer: { paddingTop: Spacing.two },
  pressed: { opacity: 0.7 },
});
