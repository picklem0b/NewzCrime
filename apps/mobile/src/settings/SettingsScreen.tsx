/**
 * Settings page.
 *
 * Edits go to the store's draft; the bar appears only when something differs
 * from what is saved, so a change is explicit rather than applied by accident.
 */

import type { ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import AppSection from '@/settings/sections/AppSection';
import AppearanceSection from '@/settings/sections/AppearanceSection';

export default function SettingsScreen(): ReactElement {
  const { colour, radius, spacingX, spacingY, typography } = useTheme();
  const { changed, save, discard } = useSettings();

  return (
    <View style={styles.fill}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacingX.lg,
          paddingBottom: spacingY.xxxl,
          gap: spacingY.xl,
        }}
      >
        <View style={{ gap: spacingY.sm }}>
          <Text
            style={{
              color: colour.textFaint,
              fontSize: typography.size.caption,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            Appearance
          </Text>
          <AppearanceSection />
        </View>

        <View style={{ gap: spacingY.sm }}>
          <Text
            style={{
              color: colour.textFaint,
              fontSize: typography.size.caption,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            App
          </Text>
          <AppSection />
        </View>
      </ScrollView>

      {changed.length > 0 ? (
        <View
          style={[
            styles.bar,
            {
              borderTopColor: colour.border,
              backgroundColor: colour.surfaceRaised,
              paddingHorizontal: spacingX.lg,
              paddingVertical: spacingY.md,
              gap: spacingX.md,
            },
          ]}
        >
          <Pressable
            accessibilityRole='button'
            onPress={discard}
            style={{
              paddingVertical: spacingY.sm,
              paddingHorizontal: spacingX.lg,
            }}
          >
            <Text
              style={{ color: colour.textMuted, fontSize: typography.size.small }}
            >
              Discard
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole='button'
            onPress={save}
            style={{
              backgroundColor: colour.accent,
              borderRadius: radius.pill,
              paddingVertical: spacingY.sm,
              paddingHorizontal: spacingX.xl,
            }}
          >
            <Text
              style={{
                color: colour.onAccent,
                fontSize: typography.size.small,
                fontWeight: typography.weight.semibold,
              }}
            >
              Save changes
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
