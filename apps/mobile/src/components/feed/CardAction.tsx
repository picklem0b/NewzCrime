/** Icon-and-label action used on story and episode cards. */

import type { ReactElement, ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export interface CardActionProps {
  icon: ReactNode;
  label: string;
  /** Highlights the action, e.g. when an item is bookmarked or being read. */
  active?: boolean;
  onPress: () => void;
}

export function CardAction({
  icon,
  label,
  active = false,
  onPress,
}: CardActionProps): ReactElement {
  const { colour, spacingX, spacingY, typography } = useTheme();

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      hitSlop={8}
      style={[styles.button, { gap: spacingX.xs, paddingVertical: spacingY.xs }]}
    >
      {icon}
      <Text
        style={{
          color: active ? colour.accent : colour.textMuted,
          fontSize: typography.size.caption,
          fontWeight: typography.weight.medium,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center' },
});

export default CardAction;
