import { useRouter } from 'expo-router';
import type { ReactElement, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MiniPlayer from '@/components/player/MiniPlayer';
import { useTheme } from '@/hooks/useTheme';

export interface ScreenProps {
	children: ReactNode;
	showPlayer?: boolean;
	bottomInset?: boolean;
}

export function Screen({
	children,
	showPlayer = false,
	bottomInset = false
}: ScreenProps): ReactElement {
	const { colour } = useTheme();
	const router = useRouter();

	return (
		<SafeAreaView
			style={[styles.fill, { backgroundColor: colour.background }]}
			edges={
				bottomInset
					? ['top', 'left', 'right', 'bottom']
					: ['top', 'left', 'right']
			}
		>
			<View style={styles.fill}>{children}</View>
			{showPlayer ? (
				<MiniPlayer onOpen={() => router.push('/player/Player')} />
			) : null}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	fill: { flex: 1 }
});

export default Screen;
