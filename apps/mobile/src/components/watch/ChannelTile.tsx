import type { Source } from '@newzcrime/shared';
import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';

import FollowButton from '@/components/source/FollowButton';
import Text from '@/components/ui/Text';
import Thumb from '@/components/ui/Thumb';
import { useTheme } from '@/hooks/useTheme';

export const CHANNEL_TILE_WIDTH = 108;

export interface ChannelTileProps {
	channel: Source;
	artwork?: string | null | undefined;
	onPress: () => void;
	/** Directory tiles follow in place; compact rails can opt out. */
	showFollow?: boolean;
}

/** A compact channel tile: artwork, name, shelf and a follow control. */
export function ChannelTile({
	channel,
	artwork,
	onPress,
	showFollow = true
}: ChannelTileProps): ReactElement {
	const { colour, radius, spacing } = useTheme();

	return (
		<View style={{ width: CHANNEL_TILE_WIDTH, alignItems: 'center', gap: spacing.xs }}>
			<Pressable
				accessibilityRole='button'
				accessibilityLabel={`${channel.name} channel. ${channel.category ?? 'Video'}`}
				onPress={onPress}
				style={({ pressed }) => ({
					width: '100%',
					alignItems: 'center',
					gap: spacing.xs,
					opacity: pressed ? 0.8 : 1
				})}
			>
				<View
					style={{
						padding: 2,
						borderRadius: radius.pill,
						borderWidth: 1,
						borderColor: colour.border
					}}
				>
					{artwork ? (
						<Thumb
							uri={artwork}
							label={channel.name}
							width={64}
							aspectRatio={1}
							rounded
						/>
					) : (
						<View
							style={{
								width: 64,
								height: 64,
								borderRadius: radius.pill,
								alignItems: 'center',
								justifyContent: 'center',
								backgroundColor: colour.accentSoft
							}}
						>
							<Text variant='h3' tone='accent'>
								{channel.name.trim().charAt(0).toUpperCase()}
							</Text>
						</View>
					)}
				</View>

				<Text
					variant='meta'
					numberOfLines={2}
					style={{ fontWeight: '600', textAlign: 'center' }}
				>
					{channel.name}
				</Text>
				<Text variant='meta' tone='faint' numberOfLines={1}>
					{channel.category === 'true_crime'
						? 'True crime'
						: channel.category === 'courts'
							? 'Courts'
							: channel.category === 'local'
								? 'Local'
								: 'News'}
				</Text>
			</Pressable>

			{showFollow ? <FollowButton sourceId={channel.id} compact /> : null}
		</View>
	);
}

export default ChannelTile;
