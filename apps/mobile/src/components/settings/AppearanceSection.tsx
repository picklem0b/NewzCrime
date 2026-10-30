import type { ReactElement } from 'react';
import { View } from 'react-native';

import { ChoiceRow, SettingGroup, ToggleRow } from '@/components/settings/SettingRow';
import Text from '@/components/ui/Text';
import {
	accentColours,
	colourModes,
	densities,
	fontStyles,
	textSizes
} from '@/constants/settings';
import { useApplySetting } from '@/hooks/useApplySetting';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';

/**
 * Appearance: how the app looks, from the palette down to row spacing.
 *
 * Every control writes through `useApplySetting`, so a change is applied and
 * persisted in one tap; the preview at the bottom is the reader's own text
 * size, headline face and accent, not a fixed sample.
 */
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
				label='Accent colour'
				description='Chips, links and the play button'
				options={accentColours}
				value={draft.accentColour}
				onChange={value => apply('accentColour', value)}
			/>
			<ChoiceRow
				label='Text size'
				description='Applies to headlines and story text'
				options={textSizes}
				value={draft.textSize}
				onChange={value => apply('textSize', value)}
			/>
			<ChoiceRow
				label='Headline font'
				description='Serif for editorials, sans for a plainer read'
				options={fontStyles}
				value={draft.fontStyle}
				onChange={value => apply('fontStyle', value)}
			/>
			<ChoiceRow
				label='Row density'
				description='How tightly stories are stacked'
				options={densities}
				value={draft.density}
				onChange={value => apply('density', value)}
			/>
			<ToggleRow
				label='Bold headlines'
				description='Heavier weight on section fronts and articles'
				value={draft.boldHeadlines}
				onChange={value => apply('boldHeadlines', value)}
			/>
			<ToggleRow
				label='Show thumbnails'
				description='Hides artwork in lists to save data and screen space'
				value={draft.showThumbnails}
				onChange={value => apply('showThumbnails', value)}
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
					Story summaries use this size, with your accent on the links.
				</Text>
			</View>
		</SettingGroup>
	);
}

export default AppearanceSection;
