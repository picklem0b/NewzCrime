import { useRouter } from 'expo-router';
import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import Screen from '@/components/layout/Screen';
import Button from '@/components/ui/Button';
import Text from '@/components/ui/Text';
import { brand } from '@/constants/theme';
import { useLayout } from '@/hooks/useLayout';
import { useTheme } from '@/hooks/useTheme';

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
 * The slogan is read from `brand` rather than written out here, so the app has
 * exactly one place that spells it.
 */
export default function WelcomeScreen(): ReactElement {
	const { spacing } = useTheme();
	const { gutter } = useLayout();
	const router = useRouter();

	return (
		<Screen bottomInset>
			<View
				style={[
					styles.page,
					{
						paddingHorizontal: gutter + spacing.sm,
						paddingVertical: spacing.xxl
					}
				]}
			>
				{/* The hero image sits above the mark. */}

				<View style={{ gap: spacing.sm }}>
					<Text variant='display'>{brand.name}</Text>
					<Text variant='standfirst' tone='accent'>
						{brand.slogan}
					</Text>
				</View>

				<Button
					label='Get started'
					onPress={() => router.replace('/tabs/Home')}
				/>
			</View>
		</Screen>
	);
}

const styles = StyleSheet.create({
	page: { flex: 1, justifyContent: 'space-between' }
});
