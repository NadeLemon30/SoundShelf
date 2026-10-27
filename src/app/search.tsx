import { FlatList, TextInput, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { AppIcon } from '@/components/ui/app-icon';
import { AppGradient } from '@/components/ui/app-gradient';
import { EmptyState } from '@/components/ui/empty-state';
import { BottomTabInset, MaxContentWidth, MiniPlayerInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LibraryTrackRow } from '@/features/library/components/library-rows';
import { useLibrary } from '@/features/library/library-provider';
import { usePlayback } from '@/features/playback/playback-provider';
import type { LibraryTrack } from '@/features/library/types';

export default function SearchScreen() {
  const theme = useTheme();
  const { status, tracks } = useLibrary();
  const { currentTrack, playTrack } = usePlayback();
  const [query, setQuery] = useState('');
  const currentTrackId = currentTrack?.id ?? null;

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return normalized
      ? tracks.filter((t) => `${t.title} ${t.filename}`.toLocaleLowerCase().includes(normalized))
      : [];
  }, [query, tracks]);

  const hasLibrary = status === 'ready' && tracks.length > 0;

  type Item =
    | { type: 'header' }
    | { type: 'noLibrary' }
    | { type: 'emptyQuery' }
    | { type: 'noResults' }
    | { type: 'resultLabel' }
    | { type: 'track'; data: LibraryTrack };

  const listData: Item[] = [
    { type: 'header' },
    ...(!hasLibrary
      ? [{ type: 'noLibrary' } as Item]
      : !query
      ? [{ type: 'emptyQuery' } as Item]
      : results.length === 0
      ? [{ type: 'noResults' } as Item]
      : [
          { type: 'resultLabel' } as Item,
          ...results.map((data): Item => ({ type: 'track', data })),
        ]),
  ];

  const renderItem = ({ item }: { item: Item }) => {
    switch (item.type) {
      case 'header':
        return (
          <View style={styles.headerSection}>
            <ThemedText style={styles.screenTitle}>Search</ThemedText>
            {hasLibrary && (
              <View style={[styles.inputWrap, { backgroundColor: theme.surfaceRaised }]}>
                <AppIcon name="search" size={18} color={theme.textMuted} />
                <TextInput
                  accessibilityLabel="Search local songs"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setQuery}
                  placeholder="What do you want to listen to?"
                  placeholderTextColor={theme.textMuted}
                  returnKeyType="search"
                  style={[styles.input, { color: theme.text }]}
                  value={query}
                />
              </View>
            )}
          </View>
        );

      case 'noLibrary':
        return (
          <EmptyState
            title={status === 'ready' ? 'No music found' : 'Scan to search'}
            description={
              status === 'ready'
                ? 'Add music to your device then scan.'
                : 'Scan your library from the Home or Library tab.'
            }
          />
        );

      case 'emptyQuery':
        return <EmptyState title="Search your songs" description="Type a song name or filename." />;

      case 'noResults':
        return <EmptyState title="No results" description={`No songs match "${query}"`} />;

      case 'resultLabel':
        return (
          <ThemedText style={styles.resultLabel}>
            {results.length} RESULT{results.length === 1 ? '' : 'S'}
          </ThemedText>
        );

      case 'track':
        return (
          <LibraryTrackRow
            track={item.data}
            isCurrent={item.data.id === currentTrackId}
            onPress={() => playTrack(item.data, results)}
          />
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
    paddingBottom: BottomTabInset + MiniPlayerInset + Spacing.three,
    gap: Spacing.three,
  },
  headerSection: { gap: Spacing.three },
  screenTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  input: { flex: 1, minHeight: 48, fontSize: 15 },
  resultLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: '#B3B3B3' },
});
