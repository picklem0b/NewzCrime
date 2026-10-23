import { DownloadSimpleIcon, XIcon } from 'phosphor-react-native';
import { useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Text from '@/components/ui/Text';
import { useAppMotion } from '@/hooks/useAppMotion';
import { useSetting } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { canInstallUpdates } from '@/services/updateInstaller';
import { useUpdateStore } from '@/stores/update.store';
import { openExternalUrl } from '@/utils/external';

/**
 * The update surface: a banner when a build is waiting, and a dialog that
 * downloads it, then asks before installing.
 *
 * Both live above the navigator so they follow the reader across screens. The
 * download starts only on a press — a free hosting tier is not the place to
 * fetch tens of megabytes unasked — and the install prompt appears after the
 * file is on the device, which is the point at which "now or later" is a real
 * choice.
 */
export function UpdateGate(): ReactElement | null {
	const insets = useSafeAreaInsets();
	const { colour, radius, spacing, elevation } = useTheme();
	const motion = useAppMotion();
	const autoCheckUpdates = useSetting('autoCheckUpdates');
	const showReleaseNotes = useSetting('showReleaseNotes');

	const {
		phase,
		bannerVisible,
		latestVersion,
		notes,
		progress,
		error,
		downloadUrl,
		check,
		dismiss,
		download,
		install,
		closeDialog
	} = useUpdateStore();

	const slide = useRef(new Animated.Value(0)).current;
	const canInstall = canInstallUpdates();

	useEffect(() => {
		if (!autoCheckUpdates) return;
		void check({ silent: true });
	}, [autoCheckUpdates, check]);

	useEffect(() => {
		Animated.timing(slide, {
			toValue: bannerVisible ? 1 : 0,
			duration: motion.duration.base,
			useNativeDriver: true
		}).start();
	}, [bannerVisible, slide, motion.duration.base]);

	const dialogVisible =
		phase === 'downloading' || phase === 'ready' || phase === 'error';

	const highlight = notes[0]?.highlights[0];
	const openPage = (): void => {
		if (downloadUrl) void openExternalUrl(downloadUrl);
	};

	return (
		<>
			{bannerVisible ? (
				<Animated.View
					accessibilityRole='alert'
					style={[
						styles.banner,
						elevation.floating,
						{
							top: insets.top + spacing.sm,
							left: spacing.md,
							right: spacing.md,
							borderRadius: radius.lg,
							borderColor: colour.borderStrong,
							backgroundColor: colour.surfaceRaised,
							padding: spacing.md,
							gap: spacing.sm,
							opacity: slide,
							transform: [
								{
									translateY: slide.interpolate({
										inputRange: [0, 1],
										outputRange: [-24, 0]
									})
								}
							]
						}
					]}
				>
					<View style={[styles.row, { gap: spacing.md }]}>
						<DownloadSimpleIcon size={22} color={colour.accent} />
						<View style={styles.flex}>
							<Text variant='body' style={{ fontWeight: '600' }}>
								Update available
							</Text>
							<Text variant='meta' tone='muted'>
								{latestVersion ? `Version ${latestVersion}` : 'A newer build is ready'}
							</Text>
						</View>
						<Pressable
							accessibilityRole='button'
							accessibilityLabel='Dismiss update'
							hitSlop={12}
							onPress={dismiss}
						>
							<XIcon size={18} color={colour.textMuted} />
						</Pressable>
					</View>

					{showReleaseNotes && highlight ? (
						<Text variant='small' tone='muted' numberOfLines={2}>
							{highlight}
						</Text>
					) : null}

					<View style={[styles.row, { gap: spacing.sm }]}>
						<View style={styles.flex}>
							<Button
								label={canInstall ? 'Download update' : 'Open download page'}
								onPress={() => {
									if (canInstall) {
										void download();
										return;
									}
									openPage();
								}}
							/>
						</View>
						<Button
							label='Later'
							variant='quiet'
							fullWidth={false}
							onPress={dismiss}
						/>
					</View>
				</Animated.View>
			) : null}

			<Modal
				transparent
				animationType='fade'
				visible={dialogVisible}
				onRequestClose={closeDialog}
			>
				<View
					style={[
						styles.backdrop,
						{ backgroundColor: colour.scrim, padding: spacing.xl }
					]}
				>
					<View
						style={{
							width: '100%',
							maxWidth: 380,
							borderRadius: radius.xl,
							backgroundColor: colour.surfaceRaised,
							borderWidth: StyleSheet.hairlineWidth,
							borderColor: colour.borderStrong,
							padding: spacing.xl,
							gap: spacing.lg
						}}
					>
						<Text variant='h3'>
							{phase === 'ready'
								? 'Install update?'
								: phase === 'error'
									? 'Update failed'
									: 'Downloading update'}
						</Text>

						{phase === 'downloading' ? (
							<>
								<View
									accessibilityRole='progressbar'
									accessibilityValue={{ min: 0, max: 100, now: progress }}
									style={{
										height: 6,
										borderRadius: 3,
										overflow: 'hidden',
										backgroundColor: colour.borderStrong
									}}
								>
									<View
										style={{
											width: `${progress}%`,
											height: '100%',
											backgroundColor: colour.accent
										}}
									/>
								</View>
								<Text variant='small' tone='muted'>
									{progress}% · keep the app open
								</Text>
							</>
						) : null}

						{phase === 'ready' ? (
							<>
								<Text variant='body' tone='muted'>
									The build is downloaded. Android will ask you to allow
									installing from NewzCrime if you have not already.
								</Text>
								<Button label='Install update' onPress={() => void install()} />
								<Button
									label='Later'
									variant='quiet'
									onPress={() => useUpdateStore.getState().dismiss()}
								/>
							</>
						) : null}

						{phase === 'error' ? (
							<>
								<Text variant='body' tone='muted'>
									{error ?? 'The update could not be downloaded.'}
								</Text>
								<Button
									label='Try again'
									onPress={() => {
										closeDialog();
										void download();
									}}
								/>
								<Button label='Close' variant='quiet' onPress={closeDialog} />
							</>
						) : null}
					</View>
				</View>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	banner: { position: 'absolute', zIndex: 50, borderWidth: StyleSheet.hairlineWidth },
	row: { flexDirection: 'row', alignItems: 'center' },
	flex: { flex: 1 },
	backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});

export default UpdateGate;
