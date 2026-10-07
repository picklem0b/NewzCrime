import type { ReactElement, ReactNode } from 'react';
import { View } from 'react-native';

import { layout } from '@/constants/theme';

export interface ColumnProps {
	children: ReactNode;
	max?: number;
}

export function Column({
	children,
	max = layout.contentMax
}: ColumnProps): ReactElement {
	return (
		<View style={{ width: '100%', maxWidth: max, alignSelf: 'center' }}>
			{children}
		</View>
	);
}

export default Column;
