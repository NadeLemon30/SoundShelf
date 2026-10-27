import { StyleSheet, View } from 'react-native';
import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ArtworkPlaceholder } from './artwork-placeholder';

type EmptyStateProps = { title: string; description: string };

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View accessibilityRole="summary" style={styles.container}>
      <ArtworkPlaceholder size={80} />
      <ThemedText style={styles.title}>{title}</ThemedText>
      <ThemedText themeColor="textMuted" style={styles.description}>{description}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.six, paddingHorizontal: Spacing.four },
  title: { textAlign: 'center', fontSize: 20, fontWeight: '700', color: '#FFFFFF', lineHeight: 26 },
  description: { textAlign: 'center', maxWidth: 320, fontSize: 14, lineHeight: 20 },
});
