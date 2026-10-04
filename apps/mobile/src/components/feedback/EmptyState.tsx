/** Composed empty state. A blank screen is never an acceptable outcome. */

import { BookmarkSimpleIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export interface EmptyStateProps {
  title: string;
  message: string;
  /** Optional action, e.g. a button that switches tab. */
  action?: ReactElement;
}

export function EmptyState({
  title,
  message,
  action,
}: EmptyStateProps): ReactElement {
  const { colour, spacingX, spacingY, typography } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal: spacingX.xl, paddingVertical: spacingY.xxxl },
      ]}
    >
      <BookmarkSimpleIcon size={36} color={colour.textFaint} weight='duotone' />

      <Text
        style={{
          color: colour.text,
          fontSize: typography.size.subtitle,
          fontWeight: typography.weight.semibold,
          marginTop: spacingY.lg,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          color: colour.textMuted,
          fontSize: typography.size.body,
          lineHeight: typography.size.body * typography.leading.relaxed,
          marginTop: spacingY.sm,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>

      {action ? <View style={{ marginTop: spacingY.xl }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});

export default EmptyState;
