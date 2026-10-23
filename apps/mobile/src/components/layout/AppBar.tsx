import { useRouter } from 'expo-router';
import { GearSixIcon, MagnifyingGlassIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import IconButton from '@/components/ui/IconButton';
import Text from '@/components/ui/Text';
import { brand } from '@/constants/theme';
import { useLayout } from '@/hooks/useLayout';
import { useTheme } from '@/hooks/useTheme';

/**
 * The bar above every tab.
 *
 * Search and settings are chrome rather than destinations: they are reachable
 * from whichever tab is open, so they do not spend a seat in the tab bar and a
 * reader does not have to leave what they are reading to reach them. Both open
 * as pushed screens with their own back button.
 *
 * The brand sits on the left. It is the only place the app is named once a tab
 * is open, so without it this would be an unlabelled row of icons.
 */
export function AppBar(): ReactElement {
	const router = useRouter();
	const { colour, radius, spacing } = useTheme();
	const { gutter, isWide } = useLayout();

	return (
		<View
			style={[
				styles.bar,
				{
					paddingLeft: gutter,
					paddingRight: spacing.xs,
					borderBottomColor: colour.border
				}
			]}
		>
			<Text
				variant='masthead'
				numberOfLines={1}
				accessibilityRole='header'
				style={styles.brand}
			>
				{brand.name}
			</Text>

			{isWide ? (
				<Pressable
					accessibilityRole='button'
					accessibilityLabel='Search NewzCrime'
					onPress={() => router.push('/search/Search')}
					style={({ pressed }) => [
						styles.pill,
						{
							borderRadius: radius.pill,
							borderColor: colour.border,
							backgroundColor: pressed ? colour.pressed : colour.surface,
							paddingHorizontal: spacing.md,
							gap: spacing.sm
						}
					]}
				>
					<MagnifyingGlassIcon size={18} color={colour.textMuted} />
					<Text variant='small' tone='faint'>
						Search NewzCrime
					</Text>
				</Pressable>
			) : (
				<IconButton
					label='Search'
					onPress={() => router.push('/search/Search')}
					icon={
						<MagnifyingGlassIcon size={22} color={colour.text} />
					}
				/>
			)}
			<IconButton
				label='Settings'
				onPress={() => router.push('/settings/Settings')}
				icon={<GearSixIcon size={22} color={colour.text} />}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	bar: {
		flexDirection: 'row',
		alignItems: 'center',
		minHeight: 52,
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	brand: { flex: 1 },
	pill: {
		height: 36,
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: StyleSheet.hairlineWidth
	}
});

export default AppBar;
