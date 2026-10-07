import type { Topic } from '@newzcrime/shared';
import type { ReactElement } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import Chip from '@/components/ui/Chip';
import Column from '@/components/ui/Column';
import { feedTopics } from '@/feed/constants';
import { useLayout } from '@/hooks/useLayout';
import { useTheme } from '@/hooks/useTheme';

export interface TopicBarProps {
	value: Topic;
	onChange: (topic: Topic) => void;
}

export function TopicBar({ value, onChange }: TopicBarProps): ReactElement {
	const { colour, spacing } = useTheme();
	const { gutter } = useLayout();

	return (
		<View
			style={{
				backgroundColor: colour.background,
				borderBottomWidth: StyleSheet.hairlineWidth,
				borderBottomColor: colour.border
			}}
		>
			<Column>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{
						paddingHorizontal: gutter,
						paddingVertical: spacing.sm,
						gap: spacing.sm
					}}
				>
					{feedTopics.map(topic => (
						<Chip
							key={topic.id}
							label={topic.label}
							selected={topic.id === value}
							onPress={() => onChange(topic.id)}
						/>
					))}
				</ScrollView>
			</Column>
		</View>
	);
}

export default TopicBar;
