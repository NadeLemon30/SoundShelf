import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { LibraryProvider } from '@/features/library/library-provider';
import { PlaybackProvider } from '@/features/playback/playback-provider';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}><LibraryProvider><PlaybackProvider><AppTabs /></PlaybackProvider></LibraryProvider></ThemeProvider>;
}
