import { Tabs } from 'expo-router';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { Colors } from '@/constants/theme';

const TAB_ICONS: Record<string, AppIconName> = {
  index: 'home',
  library: 'library',
  search: 'search',
  'personal-library': 'favoriteOutline',
  settings: 'settings',
};

export default function AppTabs() {
  const colors = Colors.dark;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: { backgroundColor: '#000000', borderTopColor: colors.surfaceRaised },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color }) => <AppIcon name={TAB_ICONS[route.name] ?? 'music'} size={24} color={color as string} />,
      })}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="personal-library" options={{ title: 'My music' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
