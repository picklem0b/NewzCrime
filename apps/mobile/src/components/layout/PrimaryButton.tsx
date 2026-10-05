/**
 * The app's primary action: a filled pill with `onPrimary` text.
 *
 * `primary` is a fill colour and this is the only thing that draws it for an
 * action, so every button in the app agrees on size, radius and tap target.
 * The height clears the 44pt minimum by a comfortable margin.
 */

import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  /** Fill the width of the container. On by default. */
  fullWidth?: boolean;
}

export function PrimaryButton({
  label,
  onPress,
  fullWidth = true,
}: PrimaryButtonProps): ReactElement {
  const { colour, radius, spacingX, spacingY, typography } = useTheme();

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: colour.primary,
          borderRadius: radius.pill,
          paddingVertical: spacingY.lg,
          paddingHorizontal: spacingX.xl,
          alignSelf: fullWidth ? 'stretch' : 'center',
        },
      ]}
    >
      <Text
        style={{
          color: colour.onPrimary,
          fontSize: typography.size.body,
          fontWeight: typography.weight.semibold,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 50, alignItems: 'center', justifyContent: 'center' },
});

export default PrimaryButton;
