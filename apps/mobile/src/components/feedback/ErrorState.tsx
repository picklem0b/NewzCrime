/** Inline error with a retry. Errors are shown in place, never as a toast. */

import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps): ReactElement {
  const { colour, radius, spacingX, spacingY, typography } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: spacingX.xl,
          paddingVertical: spacingY.xxxl,
          gap: spacingY.md,
        },
      ]}
    >
      <Text
        style={{
          color: colour.danger,
          fontSize: typography.size.body,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>

      {onRetry ? (
        <Pressable
          accessibilityRole='button'
          onPress={onRetry}
          style={{
            borderColor: colour.borderStrong,
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius: radius.pill,
            paddingHorizontal: spacingX.xl,
            paddingVertical: spacingY.sm,
          }}
        >
          <Text
            style={{
              color: colour.text,
              fontSize: typography.size.small,
              fontWeight: typography.weight.medium,
            }}
          >
            Try again
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});

export default ErrorState;
