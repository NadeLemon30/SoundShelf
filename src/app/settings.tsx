import Constants from 'expo-constants';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { AppGradient } from '@/components/ui/app-gradient';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { BottomTabInset, MaxContentWidth, MiniPlayerInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLibrary } from '@/features/library/library-provider';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen() {
  const { status, tracks, albums, needsRescan, permissionBlocked, scan } = useLibrary();
  const isScanning = status === 'scanning';
  const hasPermission = status === 'ready' || isScanning;
  const librarySummary = hasPermission
    ? `${tracks.length} song${tracks.length === 1 ? '' : 's'} · ${albums.length} album${albums.length === 1 ? '' : 's'}`
    : status === 'denied'
      ? 'Audio access is not allowed'
      : 'Audio access has not been requested';

  const manageAudioAccess = () => {
    if (permissionBlocked) {
      void Linking.openSettings();
      return;
    }
    void scan();
  };

  return (
    <AppGradient>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.title}>Settings</ThemedText>

          <Section title="Library">
            <SettingRow icon="library" title="Device music" detail={librarySummary} />
            <ActionRow
              icon="refresh"
              title={isScanning ? 'Scanning music…' : needsRescan ? 'Library changed — rescan' : 'Rescan device music'}
              detail="Find newly added or removed local audio files."
              disabled={isScanning}
              onPress={() => { void scan(); }}
            />
            <ActionRow
              icon="settings"
              title={hasPermission ? 'Manage audio access' : permissionBlocked ? 'Open app settings' : 'Allow audio access'}
              detail={hasPermission ? 'Change SoundShelf permissions in Android settings.' : 'SoundShelf needs audio access to browse music stored on this device.'}
              onPress={manageAudioAccess}
            />
          </Section>

          <Section title="About">
            <SettingRow icon="music" title="SoundShelf" detail="Offline music player · Your music and library data stay on this device." />
            <SettingRow icon="settings" title="Version" detail={`Version ${APP_VERSION}`} />
            <SettingRow icon="music" title="Made by" detail="Nade Lemon · Built with Expo, React Native, and TypeScript." />
            <SettingRow icon="library" title="Privacy" detail="No accounts, cloud sync, streaming, or data collection." />
          </Section>
        </ScrollView>
      </SafeAreaView>
    </AppGradient>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title.toUpperCase()}</ThemedText>
      <View style={styles.rows}>{children}</View>
    </View>
  );
}

function SettingRow({ icon, title, detail }: { icon: AppIconName; title: string; detail: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: theme.surfaceRaised }]}>
      <View style={styles.rowIcon}><AppIcon name={icon} size={22} color={theme.textMuted} /></View>
      <View style={styles.rowText}>
        <ThemedText style={styles.rowTitle}>{title}</ThemedText>
        <ThemedText style={styles.rowDetail}>{detail}</ThemedText>
      </View>
    </View>
  );
}

function ActionRow({ icon, title, detail, disabled = false, onPress }: {
  icon: 'refresh' | 'settings'; title: string; detail: string; disabled?: boolean; onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={detail}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: theme.surfaceRaised }, (pressed || disabled) && styles.pressed]}>
      <View style={styles.rowIcon}><AppIcon name={icon} size={22} color={theme.textMuted} /></View>
      <View style={styles.rowText}>
        <ThemedText style={styles.rowTitle}>{title}</ThemedText>
        <ThemedText style={styles.rowDetail}>{detail}</ThemedText>
      </View>
      <AppIcon name="chevronRight" size={20} color={theme.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.three, paddingBottom: BottomTabInset + MiniPlayerInset + Spacing.four, gap: Spacing.four },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '700' },
  section: { gap: Spacing.two },
  sectionTitle: { color: '#B3B3B3', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  rows: { gap: 1, overflow: 'hidden', borderRadius: 12 },
  row: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three, gap: Spacing.two },
  rowIcon: { width: 24, alignItems: 'center' },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  rowDetail: { color: '#B3B3B3', fontSize: 12, lineHeight: 17 },
  pressed: { opacity: 0.68 },
});
