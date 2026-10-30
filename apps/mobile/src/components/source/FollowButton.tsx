import { CheckIcon, PlusIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import Text from '@/components/ui/Text';
import { useFollowingStore } from '@/stores/following.store';
import { useTheme } from '@/hooks/useTheme';
import { tapFeedback } from '@/utils/haptics';

export interface FollowButtonProps {
	sourceId: string;
	/** Smaller pill for dense search and list rows. */
	compact?: boolean;
}

/**
 * Follow a source without leaving the row.
 *
 * The button owns its state so a list only passes an id. It is a sibling of the
 * row's main press target, not nested inside it, because nested pressables
 * swallow taps differently on Android and iOS.
 */
export function FollowButton({
	sourceId,
	compact = false
}: FollowButtonProps): ReactElement {
	const { colour, radius, spacing } = useTheme();
	const followed = useFollowingStore(state =>
		state.sourceIds.includes(sourceId)
	);
	const toggle = useFollowingStore(state => state.toggle);

	return (
		<Pressable
			accessibilityRole='button'
			accessibilityLabel={followed ? 'Unfollow source' : 'Follow source'}
			accessibilityState={{ selected: followed }}
			onPress={() => {
				tapFeedback();
				toggle(sourceId);
			}}
			hitSlop={6}
			style={({ pressed }) => [
				styles.pill,
				{
					minHeight: compact ? 30 : 36,
					borderRadius: radius.pill,
					paddingHorizontal: compact ? spacing.md : spacing.lg,
					gap: spacing.xs,
					borderColor: followed ? colour.accent : colour.borderStrong,
					backgroundColor: followed
						? colour.accentSoft
						: pressed
							? colour.pressed
							: 'transparent'
				}
			]}
		>
			{followed ? (
				<CheckIcon size={compact ? 12 : 14} color={colour.accent} weight='bold' />
			) : (
				<PlusIcon size={compact ? 12 : 14} color={colour.textMuted} weight='bold' />
			)}
			<Text
				variant={compact ? 'meta' : 'small'}
				tone={followed ? 'accent' : 'muted'}
				style={{ fontWeight: '700' }}
			>
				{followed ? 'Following' : 'Follow'}
			</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	pill: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: StyleSheet.hairlineWidth
	}
});

export default FollowButton;
