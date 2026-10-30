import type { ReactElement, ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Text from '@/components/ui/Text';
import { useLayout } from '@/hooks/useLayout';
import { useTheme } from '@/hooks/useTheme';
import type {
	SearchDateRange,
	SearchSort,
	SearchTopic
} from '@/types';

const TOPICS: ReadonlyArray<{ id: SearchTopic; label: string }> = [
	{ id: undefined, label: 'All topics' },
	{ id: 'court', label: 'Courts' },
	{ id: 'crime', label: 'Crime' },
	{ id: 'politics', label: 'Politics' },
	{ id: 'world', label: 'World' }
];

const RANGES: ReadonlyArray<{ id: SearchDateRange; label: string }> = [
	{ id: 'any', label: 'Any time' },
	{ id: 'day', label: 'Today' },
	{ id: 'week', label: 'This week' },
	{ id: 'month', label: 'This month' },
	{ id: 'year', label: 'This year' }
];

const ORDERS: ReadonlyArray<{ id: SearchSort; label: string }> = [
	{ id: 'newest', label: 'Newest first' },
	{ id: 'oldest', label: 'Oldest first' }
];

export interface AdvancedSearchPanelProps {
	topic: SearchTopic;
	range: SearchDateRange;
	sort: SearchSort;
	followedOnly: boolean;
	followedCount: number;
	onTopic: (topic: SearchTopic) => void;
	onRange: (range: SearchDateRange) => void;
	onSort: (sort: SearchSort) => void;
	onFollowedOnly: (value: boolean) => void;
	onReset: () => void;
}

/**
 * The filters a long query needs but a search field cannot hold.
 *
 * Every option is a single tap and shows its selected state; there is no modal
 * and no Apply button, so narrowing a search never feels like filling a form.
 */
export function AdvancedSearchPanel({
	topic,
	range,
	sort,
	followedOnly,
	followedCount,
	onTopic,
	onRange,
	onSort,
	onFollowedOnly,
	onReset
}: AdvancedSearchPanelProps): ReactElement {
	const { colour, radius, spacing } = useTheme();
	const { gutter } = useLayout();

	return (
		<View
			style={{
				marginHorizontal: gutter,
				marginTop: spacing.sm,
				padding: spacing.lg,
				gap: spacing.lg,
				borderRadius: radius.lg,
				borderWidth: StyleSheet.hairlineWidth,
				borderColor: colour.border,
				backgroundColor: colour.surface
			}}
		>
			<FilterGroup title='Topic'>
				{TOPICS.map(entry => (
					<Chip
						key={entry.label}
						label={entry.label}
						selected={entry.id === topic}
						onPress={() => onTopic(entry.id)}
					/>
				))}
			</FilterGroup>

			<FilterGroup title='Published'>
				{RANGES.map(entry => (
					<Chip
						key={entry.id}
						label={entry.label}
						selected={entry.id === range}
						onPress={() => onRange(entry.id)}
					/>
				))}
			</FilterGroup>

			<FilterGroup title='Order'>
				{ORDERS.map(entry => (
					<Chip
						key={entry.id}
						label={entry.label}
						selected={entry.id === sort}
						onPress={() => onSort(entry.id)}
					/>
				))}
			</FilterGroup>

			<Pressable
				accessibilityRole='switch'
				accessibilityLabel='Only followed sources'
				onPress={() => {
					if (followedCount > 0) onFollowedOnly(!followedOnly);
				}}
				accessibilityState={{
					checked: followedOnly,
					disabled: followedCount === 0
				}}
				style={({ pressed }) => [
					styles.toggleRow,
					{
						paddingTop: spacing.sm,
						borderTopWidth: StyleSheet.hairlineWidth,
						borderTopColor: colour.border,
						backgroundColor: pressed ? colour.pressed : 'transparent'
					}
				]}
			>
				<View style={{ flex: 1 }}>
					<Text variant='body'>Only sources I follow</Text>
					<Text variant='meta' tone='faint'>
						{followedCount === 0
							? 'Follow a source from Discover first'
							: `${followedCount} followed ${
									followedCount === 1 ? 'source' : 'sources'
								}`}
					</Text>
				</View>
				<Switch
					accessibilityElementsHidden
					importantForAccessibility='no-hide-descendants'
					value={followedOnly}
					disabled={followedCount === 0}
					onValueChange={onFollowedOnly}
					trackColor={{ false: colour.borderStrong, true: colour.accent }}
					thumbColor={colour.surfaceRaised}
					ios_backgroundColor={colour.borderStrong}
				/>
			</Pressable>

			<Button
				label='Reset filters'
				variant='quiet'
				fullWidth={false}
				onPress={onReset}
			/>
		</View>
	);
}

function FilterGroup({
	title,
	children
}: {
	title: string;
	children: ReactNode;
}): ReactElement {
	const { spacing } = useTheme();

	return (
		<View style={{ gap: spacing.sm }}>
			<Text variant='label' tone='faint'>
				{title}
			</Text>
			<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
				{children}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }
});

export default AdvancedSearchPanel;
