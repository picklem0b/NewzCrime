import type { ReactElement } from 'react';
import { View } from 'react-native';

import Text from '@/components/ui/Text';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { ChoiceRow, SettingGroup } from '@/components/settings/SettingRow';
import { colourModes, textSizes } from '@/constants/settings';
import { useApplySetting } from '@/hooks/useApplySetting';

export function AppearanceSection(): ReactElement {
	const { colour, spacing } = useTheme();
	const { draft } = useSettings();
	const apply = useApplySetting();

	return (
		<SettingGroup title='Appearance'>
			<ChoiceRow
				label='Colour scheme'
				description='System follows your device setting'
				options={colourModes}
				value={draft.colourMode}
				onChange={value => apply('colourMode', value)}
			/>
			<ChoiceRow
				label='Text size'
				description='Applies to headlines and story text'
				options={textSizes}
				value={draft.textSize}
				onChange={value => apply('textSize', value)}
				last
			/>
			<View
				style={{
					padding: spacing.lg,
					gap: spacing.xs,
					borderTopWidth: 1,
					borderTopColor: colour.border
				}}
			>
				<Text variant='label' tone='accent'>
					Preview
				</Text>
				<Text variant='h3'>Headlines appear at this size</Text>
				<Text variant='body' tone='muted'>
					Story summaries use this size.
				</Text>
			</View>
		</SettingGroup>
	);
}

export default AppearanceSection;
