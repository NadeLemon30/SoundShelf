import { Tabs } from 'expo-router';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { useTheme } from '@/hooks/use-theme';

const TAB_ICONS: Record<string, AppIconName> = {
  index: 'home',
  library: 'library',
  search: 'search',
  'personal-library': 'favoriteOutline',
  settings: 'settings',
};

export default function AppTabs() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.outline },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color }) => <AppIcon name={TAB_ICONS[route.name] ?? 'music'} size={24} color={color as string} />,
      })}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="personal-library" options={{ title: 'My music' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      {/* Reached from Home/Settings; hidden from the tab bar. */}
      <Tabs.Screen name="listening" options={{ href: null }} />
      <Tabs.Screen name="replay" options={{ href: null }} />
    </Tabs>
  );
}
