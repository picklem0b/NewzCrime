/** Screen header: an optional back button, a title and optional actions. */

import { ArrowLeftIcon } from 'phosphor-react-native';
import type { ReactElement, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** Rendered on the trailing edge, e.g. a search or settings action. */
  actions?: ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  actions,
}: ScreenHeaderProps): ReactElement {
  const { colour, spacingX, spacingY, typography } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: spacingX.lg,
          paddingTop: spacingY.md,
          paddingBottom: spacingY.md,
        },
      ]}
    >
      <View style={styles.leading}>
        {onBack ? (
          <Pressable
            accessibilityRole='button'
            accessibilityLabel='Go back'
            onPress={onBack}
            hitSlop={12}
            style={styles.backButton}
          >
            <ArrowLeftIcon size={22} color={colour.text} />
          </Pressable>
        ) : null}

        <View style={styles.titles}>
          <Text
            numberOfLines={1}
            style={{
              color: colour.text,
              fontSize: typography.size.heading,
              fontWeight: typography.weight.bold,
              letterSpacing: -0.4,
            }}
          >
            {title}
          </Text>

          {subtitle ? (
            <Text
              numberOfLines={1}
              style={{
                color: colour.textMuted,
                fontSize: typography.size.small,
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  leading: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  backButton: { paddingVertical: 2, paddingRight: 2 },
  titles: { flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
});

export default ScreenHeader;
