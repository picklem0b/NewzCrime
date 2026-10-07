import { useRouter } from 'expo-router';
import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';

import Screen from '@/components/layout/Screen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import Column from '@/components/ui/Column';
import { useLayout } from '@/hooks/useLayout';
import { useTheme } from '@/hooks/useTheme';
import AboutSection, { BrandFooter } from '@/components/settings/AboutSection';
import AppearanceSection from '@/components/settings/AppearanceSection';
import GeneralSection from '@/components/settings/GeneralSection';

export default function SettingsScreen(): ReactElement {
	const router = useRouter();
	const { spacing } = useTheme();
	const { gutter } = useLayout();

	const goBack = () => {
		if (router.canGoBack()) {
			router.back();
			return;
		}
		router.replace('/tabs/Home');
	};

	return (
		<Screen showPlayer>
			<ScreenHeader title='Settings' onBack={goBack} />
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingHorizontal: gutter,
					paddingTop: spacing.md,
					paddingBottom: spacing.xxxl,
					gap: spacing.xl
				}}
			>
				<Column max={640}>
					<AppearanceSection />
				</Column>
				<Column max={640}>
					<GeneralSection />
				</Column>
				<Column max={640}>
					<AboutSection />
				</Column>
				<BrandFooter />
			</ScrollView>
		</Screen>
	);
}
