import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabInset, MaxContentWidth, MiniPlayerInset, Spacing } from '@/constants/theme';
import { AppGradient } from './app-gradient';

type ScreenProps = PropsWithChildren<ScrollViewProps>;

export function Screen({ children, contentContainerStyle, ...props }: ScreenProps) {
  return (
    <AppGradient>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          {...props}
          contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + MiniPlayerInset + Spacing.three }, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </SafeAreaView>
    </AppGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.three, gap: Spacing.three },
});
