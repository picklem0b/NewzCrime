import type { ReactElement } from 'react';
import { View } from 'react-native';

import Skeleton from '@/components/ui/Skeleton';
import { useLayout } from '@/hooks/useLayout';
import { useTheme } from '@/hooks/useTheme';

export interface ListSkeletonProps {
	rows?: number;
	lead?: boolean;
}

export function ListSkeleton({
	rows = 5,
	lead = false
}: ListSkeletonProps): ReactElement {
	const { colour, layout, spacing } = useTheme();
	const { gutter } = useLayout();

	return (
		<View
			accessible
			accessibilityLabel='Loading'
			accessibilityRole='progressbar'
			style={{ paddingHorizontal: gutter, gap: spacing.lg }}
		>
			{lead ? (
				<View style={{ gap: spacing.md, paddingBottom: spacing.sm }}>
					<Skeleton width='100%' height={200} rounded='md' />
					<Skeleton width='35%' height={12} />
					<Skeleton width='95%' height={22} />
					<Skeleton width='70%' height={22} />
				</View>
			) : null}

			{Array.from({ length: rows }, (_unused, index) => (
				<View
					key={index}
					style={{
						flexDirection: 'row',
						gap: spacing.md,
						paddingBottom: spacing.lg,
						borderBottomWidth: 1,
						borderBottomColor: colour.border
					}}
				>
					<View
						style={{
							flex: 1,
							gap: spacing.sm,
							justifyContent: 'center'
						}}
					>
						<Skeleton width='40%' height={10} />
						<Skeleton width='95%' height={16} />
						<Skeleton width='70%' height={16} />
					</View>
					<Skeleton
						width={layout.rowThumb.width}
						height={layout.rowThumb.height}
						rounded='md'
					/>
				</View>
			))}
		</View>
	);
}

export default ListSkeleton;
