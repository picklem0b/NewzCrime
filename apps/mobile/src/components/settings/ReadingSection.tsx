import type { ReactElement } from 'react';

import { ChoiceRow, SettingGroup, ToggleRow } from '@/components/settings/SettingRow';
import {
	articleWidths,
	lineHeights,
	textAligns
} from '@/constants/settings';
import { useApplySetting } from '@/hooks/useApplySetting';
import { useSettings } from '@/hooks/useSettings';

/**
 * Reading: the measure, leading and surface of a long story.
 *
 * These controls only affect article screens, so the preview sits with them
 * rather than in Appearance, where a change to text size would imply it
 * changed the whole app.
 */
export function ReadingSection(): ReactElement {
	const { draft } = useSettings();
	const apply = useApplySetting();

	return (
		<SettingGroup title='Reading'>
			<ChoiceRow
				label='Article width'
				description='A narrower measure is easier to track on a tablet'
				options={articleWidths}
				value={draft.articleWidth}
				onChange={value => apply('articleWidth', value)}
			/>
			<ChoiceRow
				label='Line spacing'
				description='Leading for summaries and full article text'
				options={lineHeights}
				value={draft.lineHeight}
				onChange={value => apply('lineHeight', value)}
			/>
			<ChoiceRow
				label='Text alignment'
				description='Justified copy squares off both edges'
				options={textAligns}
				value={draft.textAlign}
				onChange={value => apply('textAlign', value)}
			/>
			<ToggleRow
				label='Sepia reading surface'
				description='A warm paper background, easier on the eyes at night'
				value={draft.sepiaReading}
				onChange={value => apply('sepiaReading', value)}
			/>
			<ToggleRow
				label='Reading progress'
				description='A thin bar at the top of an article'
				value={draft.readingProgress}
				onChange={value => apply('readingProgress', value)}
			/>
			<ToggleRow
				label='Keep the screen awake'
				description='Stops the display sleeping while you read'
				value={draft.keepAwake}
				onChange={value => apply('keepAwake', value)}
				last
			/>
		</SettingGroup>
	);
}

export default ReadingSection;
