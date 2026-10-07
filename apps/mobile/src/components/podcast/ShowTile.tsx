import type { Source } from '@newzcrime/shared';
import { MicrophoneIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';

import Text from '@/components/ui/Text';
import Thumb from '@/components/ui/Thumb';
import { useTheme } from '@/hooks/useTheme';

export const SHOW_TILE_SIZE = 116;

export interface ShowTileProps {
	show: Source;
	selected: boolean;
	onPress: () => void;
}

export function ShowTile({
	show,
	selected,
	onPress
}: ShowTileProps): ReactElement {
	const { colour, radius, spacing } = useTheme();

	return (
		<Pressable
			accessibilityRole='button'
			accessibilityLabel={show.name}
			accessibilityState={{ selected }}
			onPress={onPress}
			style={{ width: SHOW_TILE_SIZE, gap: spacing.sm }}
		>
			<View
				style={{
					padding: 3,
					borderRadius: radius.md + 3,
					borderWidth: 2,
					borderColor: selected ? colour.accent : 'transparent'
				}}
			>
				{show.logoUrl ? (
					<Thumb
						uri={show.logoUrl}
						label={show.name}
						width={SHOW_TILE_SIZE - 10}
						aspectRatio={1}
					/>
				) : (
					<View
						style={{
							width: SHOW_TILE_SIZE - 10,
							aspectRatio: 1,
							borderRadius: radius.md,
							backgroundColor: colour.surfaceRaised,
							alignItems: 'center',
							justifyContent: 'center'
						}}
					>
						<MicrophoneIcon size={32} color={colour.textFaint} />
					</View>
				)}
			</View>

			<Text
				variant='small'
				tone={selected ? 'accent' : 'default'}
				numberOfLines={2}
				style={{ fontWeight: '600' }}
			>
				{show.name}
			</Text>
		</Pressable>
	);
}

export default ShowTile;
