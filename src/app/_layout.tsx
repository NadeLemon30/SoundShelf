import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, View, useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { StartupAnimation } from '@/components/startup-animation';
import { LibraryProvider } from '@/features/library/library-provider';
import { PlaybackProvider } from '@/features/playback/playback-provider';

// Hold the native splash screen until <StartupAnimation> has painted its matching first frame.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <LibraryProvider>
        <PlaybackProvider>
          <View style={styles.root}>
            <AppTabs />
            <StartupAnimation />
          </View>
        </PlaybackProvider>
      </LibraryProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
