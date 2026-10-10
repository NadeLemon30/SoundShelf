import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { MiniPlayer } from '@/components/ui/mini-player';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLibrary } from '@/features/library/library-provider';

export default function LibraryScreen() {
  const theme = useTheme();
  const { status, tracks, skippedAssetCount, errorMessage, scan } = useLibrary();
  const isBusy = status === 'scanning';
  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Library</ThemedText>
        <ThemedText themeColor="textMuted">Songs found on this device. Artist and album metadata will be added only after device validation confirms it is available.</ThemedText>
      </View>
      {status === 'ready' && tracks.length > 0 ? <View style={styles.songList}>
        <View style={styles.listHeader}><ThemedText type="smallBold" themeColor="textMuted">{tracks.length} SONG{tracks.length === 1 ? '' : 'S'}</ThemedText><Pressable accessibilityRole="button" onPress={scan}><ThemedText type="smallBold" themeColor="accent">Rescan</ThemedText></Pressable></View>
        {tracks.map((track) => <View key={track.id} style={[styles.songRow, { borderColor: theme.outline }]}><View style={[styles.trackMark, { backgroundColor: theme.accentMuted }]} /><View style={styles.songDetails}><ThemedText numberOfLines={1} type="smallBold">{track.title}</ThemedText><ThemedText numberOfLines={1} themeColor="textMuted" type="small">{track.filename}</ThemedText></View></View>)}
        {skippedAssetCount > 0 ? <ThemedText themeColor="textMuted" type="small">{skippedAssetCount} audio item{skippedAssetCount === 1 ? '' : 's'} could not be opened and {skippedAssetCount === 1 ? 'was' : 'were'} left out.</ThemedText> : null}
      </View> : <View style={styles.emptyWrap}>
        <EmptyState title={status === 'denied' ? 'Audio access is needed' : status === 'error' ? 'Library scan unavailable' : isBusy ? 'Scanning your music' : 'No music scanned yet'} description={status === 'denied' ? 'Allow audio access to let SoundShelf list music already on this device.' : errorMessage ?? (isBusy ? 'Reading local audio files. This can take a moment for larger libraries.' : 'Nothing is read until you choose to scan your device music.')} />
        <Pressable accessibilityRole="button" accessibilityLabel="Scan device music library" disabled={isBusy} onPress={scan} style={({ pressed }) => [styles.scanButton, { backgroundColor: theme.accent }, (pressed || isBusy) && styles.pressed]}><ThemedText style={styles.scanLabel}>{isBusy ? 'Scanning music…' : status === 'denied' ? 'Try audio access again' : 'Scan device music'}</ThemedText></Pressable>
      </View>}
      <MiniPlayer />
    </Screen>
  );
}

const styles = StyleSheet.create({ header: { gap: Spacing.one, paddingTop: Spacing.two }, title: { fontSize: 38, lineHeight: 44 }, emptyWrap: { alignItems: 'center' }, scanButton: { borderRadius: 14, paddingHorizontal: Spacing.three, paddingVertical: 12 }, scanLabel: { color: '#FFFFFF', fontWeight: '700' }, pressed: { opacity: 0.78 }, songList: { gap: Spacing.one }, listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: Spacing.one }, songRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth }, trackMark: { width: 40, height: 40, borderRadius: 10 }, songDetails: { flex: 1, gap: 1 } });
