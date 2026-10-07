import { useRouter } from 'expo-router';
import { CompassIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import EmptyState from '@/components/feedback/EmptyState';
import Screen from '@/components/layout/Screen';
import Button from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';

export default function NotFoundScreen(): ReactElement {
	const router = useRouter();
	const { colour } = useTheme();

	return (
		<Screen>
			<View style={styles.fill}>
				<EmptyState
					icon={
						<CompassIcon
							size={36}
							color={colour.textFaint}
							weight='duotone'
						/>
					}
					title='That page is not here'
					message='The link may be out of date. Everything current is on Today.'
					action={
						<Button
							label='Go to Today'
							fullWidth={false}
							onPress={() => router.replace('/tabs/Home')}
						/>
					}
				/>
			</View>
		</Screen>
	);
}

const styles = StyleSheet.create({
	fill: { flex: 1, justifyContent: 'center' }
});
