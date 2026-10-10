import { TextInput, StyleSheet, View } from 'react-native';
import { useMemo, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { MiniPlayer } from '@/components/ui/mini-player';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLibrary } from '@/features/library/library-provider';

export default function SearchScreen() {
  const theme = useTheme();
  const { status, tracks } = useLibrary();
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return normalized ? tracks.filter((track) => `${track.title} ${track.filename}`.toLocaleLowerCase().includes(normalized)) : [];
  }, [query, tracks]);
  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Search</ThemedText>
        <ThemedText themeColor="textMuted">Find music in your on-device library.</ThemedText>
      </View>
      {status === 'ready' && tracks.length > 0 ? <View style={styles.results}>
        <TextInput accessibilityLabel="Search local songs" autoCapitalize="none" autoCorrect={false} onChangeText={setQuery} placeholder="Search songs" placeholderTextColor={theme.textMuted} style={[styles.input, { backgroundColor: theme.surfaceRaised, color: theme.text }]} value={query} />
        {query ? results.length ? results.map((track) => <View key={track.id} style={[styles.result, { borderColor: theme.outline }]}><ThemedText type="smallBold" numberOfLines={1}>{track.title}</ThemedText><ThemedText type="small" themeColor="textMuted" numberOfLines={1}>{track.filename}</ThemedText></View>) : <EmptyState title="No matching songs" description="Try a different song or filename." /> : <EmptyState title="Search your songs" description="Type a song name or filename to search your scanned library." />}
      </View> : <EmptyState title="Scan music to search it" description="Your local songs become searchable after you scan the device library from Home or Library." />}
      <MiniPlayer />
    </Screen>
  );
}

const styles = StyleSheet.create({ header: { gap: Spacing.one, paddingTop: Spacing.two }, title: { fontSize: 38, lineHeight: 44 }, results: { gap: Spacing.two }, input: { minHeight: 48, paddingHorizontal: Spacing.three, borderRadius: 14, fontSize: 16 }, result: { gap: 1, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth } });
