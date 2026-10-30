import { useRouter } from 'expo-router';
import { useRef } from 'react';
import type { ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import Screen from '@/components/layout/Screen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import AboutSection, { BrandFooter } from '@/components/settings/AboutSection';
import AccessibilitySection from '@/components/settings/AccessibilitySection';
import AppearanceSection from '@/components/settings/AppearanceSection';
import GeneralSection from '@/components/settings/GeneralSection';
import LocalSection from '@/components/settings/LocalSection';
import NotificationsSection from '@/components/settings/NotificationsSection';
import PlaybackSection from '@/components/settings/PlaybackSection';
import PrivacySection from '@/components/settings/PrivacySection';
import ReadingSection from '@/components/settings/ReadingSection';
import StorageSection from '@/components/settings/StorageSection';
import WatchSection from '@/components/settings/WatchSection';
import Column from '@/components/ui/Column';
import Text from '@/components/ui/Text';
import { useAppMotion } from '@/hooks/useAppMotion';
import { useLayout } from '@/hooks/useLayout';
import { useSetting } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { currentVersion } from '@/services/updateService';
import { tapFeedback } from '@/utils/haptics';

const SECTIONS = [
	{ key: 'appearance', label: 'Appearance' },
	{ key: 'general', label: 'General' },
	{ key: 'reading', label: 'Reading' },
	{ key: 'playback', label: 'Playback' },
	{ key: 'watch', label: 'Watch' },
	{ key: 'local', label: 'Local' },
	{ key: 'accessibility', label: 'Accessibility' },
	{ key: 'notifications', label: 'Alerts' },
	{ key: 'privacy', label: 'Privacy' },
	{ key: 'storage', label: 'Storage' },
	{ key: 'about', label: 'About' }
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

/**
 * Settings.
 *
 * Eleven groups, an index at the top and a single scroll: jumping is cheaper
 * than hunting, and the index stays under the header while the groups move
 * beneath it. Offsets are measured rather than estimated, so a change in group
 * height cannot leave a jump pointing at the wrong place.
 */
export default function SettingsScreen(): ReactElement {
	const router = useRouter();
	const { colour, radius, spacing } = useTheme();
	const { gutter } = useLayout();
	const motion = useAppMotion();
	const showVersionBadge = useSetting('showVersionBadge');

	const scrollRef = useRef<ScrollView>(null);
	const offsets = useRef<Partial<Record<SectionKey, number>>>({});

	const goBack = () => {
		if (router.canGoBack()) {
			router.back();
			return;
		}
		router.replace('/tabs/Home');
	};

	const jumpTo = (key: SectionKey) => {
		const y = offsets.current[key];
		if (y === undefined) return;

		tapFeedback();
		scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: !motion.reduced });
	};

	const measure = (key: SectionKey, y: number) => {
		offsets.current[key] = y;
	};

	const groups: readonly {
		key: SectionKey;
		render: () => ReactElement;
	}[] = [
		{ key: 'appearance', render: () => <AppearanceSection /> },
		{ key: 'general', render: () => <GeneralSection /> },
		{ key: 'reading', render: () => <ReadingSection /> },
		{ key: 'playback', render: () => <PlaybackSection /> },
		{ key: 'watch', render: () => <WatchSection /> },
		{ key: 'local', render: () => <LocalSection /> },
		{ key: 'accessibility', render: () => <AccessibilitySection /> },
		{ key: 'notifications', render: () => <NotificationsSection /> },
		{ key: 'privacy', render: () => <PrivacySection /> },
		{ key: 'storage', render: () => <StorageSection /> },
		{ key: 'about', render: () => <AboutSection /> }
	];

	return (
		<Screen showPlayer>
			<ScreenHeader
				title='Settings'
				subtitle={showVersionBadge ? `v${currentVersion()}` : undefined}
				onBack={goBack}
			/>

			<ScrollView
				ref={scrollRef}
				stickyHeaderIndices={[0]}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingHorizontal: gutter,
					paddingTop: spacing.sm,
					paddingBottom: spacing.xxxl,
					gap: spacing.xl
				}}
			>
				<View
					style={{
						paddingVertical: spacing.sm,
						backgroundColor: colour.background
					}}
				>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{ gap: spacing.sm, paddingRight: gutter }}
					>
						{SECTIONS.map(section => (
							<Pressable
								key={section.key}
								accessibilityRole='button'
								accessibilityLabel={`Jump to ${section.label}`}
								onPress={() => jumpTo(section.key)}
								style={({ pressed }) => [
									styles.jump,
									{
										borderRadius: radius.pill,
										borderColor: colour.borderStrong,
										backgroundColor: pressed
											? colour.pressed
											: colour.surface,
										paddingHorizontal: spacing.md
									}
								]}
							>
								<Text variant='small' tone='muted'>
									{section.label}
								</Text>
							</Pressable>
						))}
					</ScrollView>
				</View>

				{groups.map(group => (
					<View
						key={group.key}
						onLayout={event => measure(group.key, event.nativeEvent.layout.y)}
					>
						<Column max={640}>{group.render()}</Column>
					</View>
				))}

				<BrandFooter />
			</ScrollView>
		</Screen>
	);
}

const styles = StyleSheet.create({
	jump: {
		height: 34,
		justifyContent: 'center',
		borderWidth: StyleSheet.hairlineWidth
	}
});
