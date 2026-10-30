import { Image } from 'expo-image';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { View } from 'react-native';
import type { DimensionValue } from 'react-native';

import { useSetting } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { thumbnailUri } from '@/utils/images';

import Text from './Text';

export interface ThumbProps {
	uri: string;
	label?: string | undefined;
	width: DimensionValue;
	height?: number;
	aspectRatio?: number;
	rounded?: boolean;
}

export function Thumb({
	uri,
	label,
	width,
	height,
	aspectRatio,
	rounded = true
}: ThumbProps): ReactElement {
	const { colour, radius } = useTheme();
	const offlineImages = useSetting('offlineImages');
	const dataSaver = useSetting('dataSaver');
	const quality = useSetting('thumbnailQuality');
	const sourceUri = thumbnailUri(uri, quality);
	const [failedUri, setFailedUri] = useState<string | null>(null);
	const failed = failedUri === sourceUri;

	const box = {
		width,
		...(height !== undefined ? { height } : {}),
		...(aspectRatio !== undefined ? { aspectRatio } : {}),
		borderRadius: rounded ? radius.md : 0,
		backgroundColor: colour.surfaceRaised,
		overflow: 'hidden' as const
	};

	if (failed) {
		return (
			<View
				accessibilityElementsHidden
				importantForAccessibility='no-hide-descendants'
				style={[
					box,
					{ alignItems: 'center', justifyContent: 'center' }
				]}
			>
				<Text variant='h3' tone='faint'>
					{(label ?? 'N').trim().charAt(0).toUpperCase()}
				</Text>
			</View>
		);
	}

	return (
		<Image
			source={{ uri: sourceUri }}
			recyclingKey={sourceUri}
			accessible={false}
			style={box}
			contentFit='cover'
			cachePolicy={offlineImages ? 'memory-disk' : 'memory'}
			allowDownscaling={dataSaver}
			transition={dataSaver ? 0 : 120}
			onError={() => setFailedUri(sourceUri)}
		/>
	);
}

export default Thumb;
