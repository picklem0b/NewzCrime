import { useRouter } from 'expo-router';
import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '@/components/layout/PrimaryButton';
import Screen from '@/components/layout/Screen';
import { useTheme } from '@/hooks/useTheme';

/**
 * The brand line, in one place so the app never spells it two ways. It is
 * worded exactly as the brand owner writes it, including the full stop.
 */
const SLOGAN = 'Keeping you updated.';

/**
 * Welcome screen: the mark, the slogan and one primary action.
 *
 * Deliberately not the entry point yet. `src/app/index.tsx` still sends the
 * reader straight to their start tab, because the screens this one leads to —
 * `auth/LoginSheet` and `auth/RegisterSheet` — are still stubs that render
 * nothing. Routing an action into a blank screen is worse than having no
 * action, so the primary action opens the app, and the destination moves to
 * `auth/LoginSheet` once accounts ship.
 *
 * `assets/welcomeHero.png` is reserved for the hero image above the mark; see
 * docs/DESIGN.md for its treatment. The screen reads correctly without it.
 */
export default function WelcomeScreen(): ReactElement {
  const { colour, spacingX, spacingY, typography } = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <View
        style={[
          styles.page,
          { paddingHorizontal: spacingX.xl, paddingVertical: spacingY.xxl },
        ]}
      >
        {/* The hero image sits above the mark. */}

        <View style={{ gap: spacingY.sm }}>
          <Text
            style={{
              color: colour.text,
              fontSize: typography.size.display,
              fontWeight: typography.weight.bold,
              letterSpacing: -1,
            }}
          >
            NewzCrime
          </Text>

          <Text
            style={{
              color: colour.accent,
              fontSize: typography.size.subtitle,
              fontWeight: typography.weight.medium,
            }}
          >
            {SLOGAN}
          </Text>
        </View>

        <PrimaryButton
          label='Get started'
          onPress={() => router.replace('/tabs/Home')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'space-between' },
});
