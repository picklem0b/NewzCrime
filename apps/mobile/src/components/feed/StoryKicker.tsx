import type { ContentItem } from '@newzcrime/shared';
import {
	MicrophoneIcon,
	PlayCircleIcon,
	ScalesIcon
} from 'phosphor-react-native';
import type { ReactElement } from 'react';

import Badge from '@/components/ui/Badge';
import Text from '@/components/ui/Text';
import { topicLabels } from '@/feed/constants';
import { useTheme } from '@/hooks/useTheme';

export interface StoryKickerProps {
	item: ContentItem;
}

export function StoryKicker({ item }: StoryKickerProps): ReactElement | null {
	const { colour } = useTheme();

	if (item.type === 'court_ruling') {
		return (
			<Badge
				label='Judgment'
				tone='accent'
				icon={
					<ScalesIcon size={14} color={colour.accent} weight='bold' />
				}
			/>
		);
	}

	if (item.type === 'video') {
		return (
			<Badge
				label='Video'
				tone='accent'
				icon={
					<PlayCircleIcon
						size={14}
						color={colour.accent}
						weight='fill'
					/>
				}
			/>
		);
	}

	if (item.type === 'podcast_episode') {
		return (
			<Badge
				label='Episode'
				icon={
					<MicrophoneIcon
						size={14}
						color={colour.textMuted}
						weight='bold'
					/>
				}
			/>
		);
	}

	if (item.topic) {
		return (
			<Text variant='label' tone='accent'>
				{topicLabels[item.topic]}
			</Text>
		);
	}

	return null;
}

export default StoryKicker;
