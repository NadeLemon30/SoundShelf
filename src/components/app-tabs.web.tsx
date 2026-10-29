import { type Href } from 'expo-router';
import { Tabs, TabList, TabSlot, TabTrigger, type TabListProps, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild><TabButton>Home</TabButton></TabTrigger>
          <TabTrigger name="library" href="/library" asChild><TabButton>Library</TabButton></TabTrigger>
          <TabTrigger name="search" href="/search" asChild><TabButton>Search</TabButton></TabTrigger>
          <TabTrigger name="personal-library" href="/personal-library" asChild><TabButton>My music</TabButton></TabTrigger>
          <TabTrigger name="settings" href={'/settings' as Href} asChild><TabButton>Settings</TabButton></TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="tab"
      {...props}
      style={({ pressed }) => [styles.tabButton, isFocused && { backgroundColor: theme.accentMuted }, pressed && styles.pressed]}>
      <ThemedText type="smallBold" style={{ color: isFocused ? theme.accent : theme.textMuted }}>{children}</ThemedText>
    </Pressable>
  );
}

function CustomTabList(props: TabListProps) {
  const theme = useTheme();
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="surface" style={[styles.innerContainer, { borderColor: theme.outline }]}>
        <ThemedText type="smallBold" style={styles.brandText}>SoundShelf</ThemedText>
        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { height: '100%' },
  tabListContainer: { position: 'absolute', width: '100%', padding: Spacing.three, justifyContent: 'center', alignItems: 'center' },
  innerContainer: { width: '100%', padding: Spacing.one, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: Spacing.half, maxWidth: MaxContentWidth, borderWidth: 1 },
  brandText: { marginRight: 'auto', marginLeft: Spacing.one },
  tabButton: { paddingVertical: 10, paddingHorizontal: Spacing.three, borderRadius: 12 },
  pressed: { opacity: 0.72 },
});
