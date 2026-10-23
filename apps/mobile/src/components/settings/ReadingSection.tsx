import type { ReactElement } from 'react';

import { ChoiceRow, SettingGroup, ToggleRow } from '@/components/settings/SettingRow';
import {
	lineHeights,
	playbackSpeeds,
	skipIntervals,
	textAligns
} from '@/constants/settings';
import { useApplySetting } from '@/hooks/useApplySetting';
import { useSettings } from '@/hooks/useSettings';

/** Reading: article typography and podcast playback, the two long-form paths. */
export function ReadingSection(): ReactElement {
	const { draft } = useSettings();
	const apply = useApplySetting();

	return (
		<SettingGroup title='Reading & audio'>
			<ChoiceRow
				label='Line spacing'
				description='Leading for standfirsts and summaries'
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
				label='Reading progress'
				description='A thin bar at the top of an article'
				value={draft.readingProgress}
				onChange={value => apply('readingProgress', value)}
			/>
			<ToggleRow
				label='Keep the screen awake'
				description='Stops the display sleeping in the player'
				value={draft.keepAwake}
				onChange={value => apply('keepAwake', value)}
			/>
			<ChoiceRow
				label='Playback speed'
				description='Applies to the episode that starts next'
				options={playbackSpeeds}
				value={draft.playbackSpeed}
				onChange={value => apply('playbackSpeed', value)}
			/>
			<ChoiceRow
				label='Skip buttons'
				description='How far back and forward the player moves'
				options={skipIntervals}
				value={draft.skipInterval}
				onChange={value => apply('skipInterval', value)}
			/>
			<ToggleRow
				label='Resume where you left off'
				description='Returns to the last position in an episode'
				value={draft.resumePlayback}
				onChange={value => apply('resumePlayback', value)}
			/>
			<ToggleRow
				label='Autoplay next episode'
				description='Continues down the queue when one ends'
				value={draft.autoplayNext}
				onChange={value => apply('autoplayNext', value)}
				last
			/>
		</SettingGroup>
	);
}

export default ReadingSection;
