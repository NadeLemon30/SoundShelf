import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MiniPlayer } from '@/components/ui/mini-player';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLibrary } from '@/features/library/library-provider';

export default function HomeScreen() {
  const theme = useTheme();
  const { scan, status } = useLibrary();
  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText themeColor="textMuted" type="smallBold">YOUR OFFLINE MUSIC SPACE</ThemedText>
        <ThemedText type="title" style={styles.title}>SoundShelf</ThemedText>
        <ThemedText themeColor="textMuted" style={styles.subtitle}>A calm home for the music already on your device.</ThemedText>
      </View>
      <View style={[styles.heroCard, { backgroundColor: theme.accentMuted }]}>
        <ThemedText type="subtitle" style={styles.heroTitle}>Your music stays on your device.</ThemedText>
        <ThemedText themeColor="textMuted">Scan the audio already saved on this device. SoundShelf requests audio access only when you choose to scan.</ThemedText>
        <Pressable accessibilityRole="button" accessibilityLabel="Scan device music library" disabled={status === 'scanning'} onPress={scan} style={({ pressed }) => [styles.primaryButton, { backgroundColor: theme.accent }, (pressed || status === 'scanning') && styles.pressed]}>
          <ThemedText style={styles.primaryButtonText}>{status === 'scanning' ? 'Scanning music…' : 'Scan device music'}</ThemedText>
        </Pressable>
        <Link href="/library" asChild>
          <Pressable accessibilityRole="button"><ThemedText themeColor="accent" type="smallBold">View library</ThemedText></Pressable>
        </Link>
      </View>
      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="textMuted">UP NEXT</ThemedText>
        <MiniPlayer />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.two, paddingTop: Spacing.two },
  title: { fontSize: 46, lineHeight: 52, letterSpacing: -1.4 },
  subtitle: { maxWidth: 420 },
  heroCard: { gap: Spacing.three, padding: Spacing.four, borderRadius: 24 },
  heroTitle: { fontSize: 27, lineHeight: 33 },
  primaryButton: { alignSelf: 'flex-start', paddingVertical: 12, paddingHorizontal: Spacing.three, borderRadius: 14 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  section: { gap: Spacing.two },
  pressed: { opacity: 0.78 },
});
