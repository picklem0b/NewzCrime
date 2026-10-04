/** Screen container: safe areas, background colour and optional scrolling. */

import type { ReactElement, ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

export interface ScreenLayoutProps {
  children: ReactNode;
  /** Wrap the content in a scroll view. Off for lists that scroll themselves. */
  scroll?: boolean;
}

export function Screen({
  children,
  scroll = false,
}: ScreenLayoutProps): ReactElement {
  const { colour } = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colour.background }]}
      edges={['top', 'left', 'right']}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps='handled'
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.fill}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  fill: { flex: 1 },
  scrollContent: { paddingBottom: 96 },
});

export default Screen;
