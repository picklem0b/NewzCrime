/**
 * Full-screen failure.
 *
 * `ErrorState` is the inline version used inside a list; this is the one that
 * owns the whole screen, which is what a route error boundary needs.
 */

import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import ErrorState from '@/components/feedback/ErrorState';
import Screen from '@/components/layout/Screen';

export interface ErrorScreenProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps): ReactElement {
  return (
    <Screen>
      <View style={styles.fill}>
        <ErrorState message={message} onRetry={onRetry} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'center' },
});

export default ErrorScreen;
