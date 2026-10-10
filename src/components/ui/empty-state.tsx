import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

import { ArtworkPlaceholder } from './artwork-placeholder';

type EmptyStateProps = { title: string; description: string };

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View accessibilityRole="summary" style={styles.container}>
      <ArtworkPlaceholder size={72} />
      <ThemedText type="subtitle" style={styles.title}>{title}</ThemedText>
      <ThemedText themeColor="textMuted" style={styles.description}>{description}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({ container: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.six, paddingHorizontal: Spacing.four }, title: { textAlign: 'center', fontSize: 26, lineHeight: 32 }, description: { textAlign: 'center', maxWidth: 320 } });
