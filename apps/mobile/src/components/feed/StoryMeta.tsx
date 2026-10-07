import type { ContentItem } from '@newzcrime/shared';
import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import Text from '@/components/ui/Text';
import { formatRelativeTime, isFresh } from '@/utils/time';

import SaveButton from './SaveButton';

export interface StoryMetaProps {
	item: ContentItem;
	sourceName?: string | undefined;
}

export function StoryMeta({ item, sourceName }: StoryMetaProps): ReactElement {
	const time = formatRelativeTime(item.publishedAt);
	const fresh = isFresh(item.publishedAt);

	return (
		<View style={styles.row}>
			<View style={styles.text}>
				<Text variant='meta' tone='faint' numberOfLines={1}>
					{sourceName ? `${sourceName}${time ? ' · ' : ''}` : ''}
					{time ? (
						<Text variant='meta' tone={fresh ? 'accent' : 'faint'}>
							{time}
						</Text>
					) : null}
				</Text>
			</View>
			<SaveButton item={item} />
		</View>
	);
}

export function describeStory(item: ContentItem, sourceName?: string): string {
	const time = formatRelativeTime(item.publishedAt);
	const parts = [item.title, sourceName, time].filter(
		(part): part is string => Boolean(part)
	);
	return parts.join('. ');
}

const styles = StyleSheet.create({
	row: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
	text: { flex: 1 }
});

export default StoryMeta;
