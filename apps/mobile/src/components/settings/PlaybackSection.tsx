import type { ReactElement } from 'react';

import { ChoiceRow, SettingGroup, ToggleRow } from '@/components/settings/SettingRow';
import {
	playbackSpeeds,
	skipIntervals
} from '@/constants/settings';
import { useApplySetting } from '@/hooks/useApplySetting';
import { useSettings } from '@/hooks/useSettings';

/**
 * Playback: how audio and video behave once started.
 *
 * The audio controls were split out of Reading because they apply to the
 * player, not to a page. The video switches are the three that materially
 * change a Watch session: what plays next, whether it starts muted, and
 * whether captions appear without opening the player menu.
 */
export function PlaybackSection(): ReactElement {
	const { draft } = useSettings();
	const apply = useApplySetting();

	return (
		<SettingGroup title='Playback'>
			<ChoiceRow
				label='Podcast speed'
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
				label='Resume podcasts'
				description='Returns to the last position in an episode'
				value={draft.resumePlayback}
				onChange={value => apply('resumePlayback', value)}
			/>
			<ToggleRow
				label='Autoplay next episode'
				description='Continues down the audio queue when one ends'
				value={draft.autoplayNext}
				onChange={value => apply('autoplayNext', value)}
			/>
			<ToggleRow
				label='Autoplay next video'
				description='Moves to the next video in the playlist when one ends'
				value={draft.videoAutoplayNext}
				onChange={value => apply('videoAutoplayNext', value)}
			/>
			<ToggleRow
				label='Start videos muted'
				description='Useful in public; unmute from the player controls'
				value={draft.videoStartMuted}
				onChange={value => apply('videoStartMuted', value)}
			/>
			<ToggleRow
				label='Captions on'
				description='Asks YouTube to show captions when available'
				value={draft.captionsOn}
				onChange={value => apply('captionsOn', value)}
				last
			/>
		</SettingGroup>
	);
}

export default PlaybackSection;
