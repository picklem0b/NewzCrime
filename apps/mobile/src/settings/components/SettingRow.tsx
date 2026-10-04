/**
 * Settings row primitives.
 *
 * `SettingRow` is a labelled row with a value or switch on the trailing edge;
 * `ChoiceRow` renders mutually exclusive options inline, which avoids a modal
 * for a list of three.
 */

import { CaretRightIcon } from 'phosphor-react-native';
import type { ReactElement, ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import type { Option } from '@/types';
import { useTheme } from '@/hooks/useTheme';

export interface SettingRowProps {
  label: string;
  value?: string;
  description?: string;
  /** Renders a switch instead of a value. */
  toggle?: { value: boolean; onChange: (next: boolean) => void };
  onPress?: () => void;
}

export function SettingRow({
  label,
  value,
  description,
  toggle,
  onPress,
}: SettingRowProps): ReactElement {
  const { colour, radius, spacingX, spacingY, typography } = useTheme();

  const content = (
    <View
      style={[
        styles.row,
        {
          borderColor: colour.border,
          borderRadius: radius.input,
          backgroundColor: colour.surface,
          paddingHorizontal: spacingX.lg,
          paddingVertical: spacingY.md,
          gap: spacingX.md,
        },
      ]}
    >
      <View style={styles.textColumn}>
        <Text
          style={{
            color: colour.text,
            fontSize: typography.size.body,
          }}
        >
          {label}
        </Text>

        {description ? (
          <Text
            style={{
              color: colour.textFaint,
              fontSize: typography.size.caption,
              marginTop: 2,
            }}
          >
            {description}
          </Text>
        ) : null}
      </View>

      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onChange}
          trackColor={{ false: colour.border, true: colour.accent }}
          thumbColor={colour.background}
        />
      ) : (
        <View style={[styles.valueColumn, { gap: spacingX.xs }]}>
          {value ? (
            <Text style={{ color: colour.textMuted, fontSize: typography.size.small }}>
              {value}
            </Text>
          ) : null}
          {onPress ? <CaretRightIcon size={16} color={colour.textFaint} /> : null}
        </View>
      )}
    </View>
  );

  if (!onPress || toggle) return content;

  return (
    <Pressable accessibilityRole='button' onPress={onPress}>
      {content}
    </Pressable>
  );
}

export interface ChoiceRowProps<TId extends string> {
  label: string;
  description?: string;
  options: ReadonlyArray<Option<TId>>;
  value: TId;
  onChange: (next: TId) => void;
}

export function ChoiceRow<TId extends string>({
  label,
  description,
  options,
  value,
  onChange,
}: ChoiceRowProps<TId>): ReactElement {
  const { colour, radius, spacingX, spacingY, typography } = useTheme();

  return (
    <View
      style={[
        styles.row,
        {
          borderColor: colour.border,
          borderRadius: radius.input,
          backgroundColor: colour.surface,
          paddingHorizontal: spacingX.lg,
          paddingVertical: spacingY.md,
          gap: spacingX.md,
        },
      ]}
    >
      <View style={styles.textColumn}>
        <Text style={{ color: colour.text, fontSize: typography.size.body }}>
          {label}
        </Text>
        {description ? (
          <Text
            style={{
              color: colour.textFaint,
              fontSize: typography.size.caption,
              marginTop: 2,
            }}
          >
            {description}
          </Text>
        ) : null}
      </View>

      <View
        style={[
          styles.segmented,
          { borderColor: colour.border, borderRadius: radius.pill },
        ]}
      >
        {options.map((option) => {
          const isActive = option.id === value;

          return (
            <Pressable
              key={option.id}
              accessibilityRole='button'
              accessibilityState={{ selected: isActive }}
              onPress={() => onChange(option.id)}
              style={{
                paddingHorizontal: spacingX.md,
                paddingVertical: spacingY.xs,
                borderRadius: radius.pill,
                backgroundColor: isActive ? colour.accent : 'transparent',
              }}
            >
              <Text
                style={{
                  color: isActive ? colour.onAccent : colour.textMuted,
                  fontSize: typography.size.caption,
                  fontWeight: isActive
                    ? typography.weight.semibold
                    : typography.weight.medium,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
  },
  textColumn: { flex: 1 },
  valueColumn: { flexDirection: 'row', alignItems: 'center' },
  segmented: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    padding: 2,
  },
});
