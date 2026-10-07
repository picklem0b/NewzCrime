import { ArrowLeftIcon } from 'phosphor-react-native';
import type { ReactElement, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import IconButton from '@/components/ui/IconButton';
import Text from '@/components/ui/Text';
import { useLayout } from '@/hooks/useLayout';
import { useTheme } from '@/hooks/useTheme';

export interface ScreenHeaderProps {
	title: string;
	subtitle?: string | undefined;
	onBack?: () => void;
	actions?: ReactNode;
	large?: boolean;
}

export function ScreenHeader({
	title,
	subtitle,
	onBack,
	actions,
	large = false
}: ScreenHeaderProps): ReactElement {
	const { colour, layout, spacing } = useTheme();
	const { gutter } = useLayout();

	return (
		<View
			style={[
				styles.container,
				{
					minHeight: layout.touch + spacing.sm,
					paddingLeft: onBack ? spacing.xs : gutter,
					paddingRight: actions ? spacing.xs : gutter,
					paddingTop: large ? spacing.md : 0,
					paddingBottom: large ? spacing.sm : 0
				}
			]}
		>
			{onBack ? (
				<IconButton
					label='Go back'
					onPress={onBack}
					icon={<ArrowLeftIcon size={22} color={colour.text} />}
				/>
			) : null}

			<View
				style={[
					styles.titles,
					{ paddingLeft: onBack ? spacing.xs : 0 }
				]}
			>
				<Text
					variant={large ? 'h1' : 'h3'}
					numberOfLines={1}
					accessibilityRole='header'
				>
					{title}
				</Text>
				{subtitle ? (
					<Text variant='small' tone='muted' numberOfLines={1}>
						{subtitle}
					</Text>
				) : null}
			</View>

			{actions ? <View style={styles.actions}>{actions}</View> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flexDirection: 'row', alignItems: 'center' },
	titles: { flex: 1 },
	actions: { flexDirection: 'row', alignItems: 'center' }
});

export default ScreenHeader;
