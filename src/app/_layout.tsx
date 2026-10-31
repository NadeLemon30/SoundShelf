import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StyleSheet, View, useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { StartupAnimation } from '@/components/startup-animation';
import { MiniPlayer } from '@/components/ui/mini-player';
import { BottomTabInset } from '@/constants/theme';
import { LibraryProvider } from '@/features/library/library-provider';
import { migrateDatabase, DATABASE_NAME } from '@/features/personal-library/database';
import { PersonalLibraryProvider } from '@/features/personal-library/personal-library-provider';
import { PlaybackProvider } from '@/features/playback/playback-provider';

// Hold the native splash screen until <StartupAnimation> has painted its matching first frame.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDatabase}>
        <LibraryProvider>
          <PersonalLibraryProvider>
            <PlaybackProvider>
              <View style={styles.root}>
                <AppTabs />
                <View pointerEvents="box-none" style={styles.miniPlayerOverlay}>
                  <MiniPlayer />
                </View>
                <StartupAnimation />
              </View>
            </PlaybackProvider>
          </PersonalLibraryProvider>
        </LibraryProvider>
      </SQLiteProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  miniPlayerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    // Sit just above the native tab bar.
    bottom: BottomTabInset,
    zIndex: 10,
    elevation: 10,
  },
});
