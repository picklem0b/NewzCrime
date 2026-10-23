import Constants from 'expo-constants';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { Alert, Platform, View } from 'react-native';

import {
	ChoiceRow,
	SettingGroup,
	SettingRow,
	ToggleRow
} from '@/components/settings/SettingRow';
import Button from '@/components/ui/Button';
import Text from '@/components/ui/Text';
import { brand } from '@/constants/theme';
import { updateChannels } from '@/constants/settings';
import { useApplySetting } from '@/hooks/useApplySetting';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { canInstallUpdates } from '@/services/updateInstaller';
import { useUpdateStore } from '@/stores/update.store';
import { openExternalUrl } from '@/utils/external';

/**
 * About: version, the update flow, and the preferences that govern it.
 *
 * The update button downloads the build and then prompts before installing it,
 * so "get the update" is one press rather than a trip to a downloads page. The
 * seven settings here are the ones that change how that flow behaves.
 */
export function AboutSection(): ReactElement {
	const { colour, spacing } = useTheme();
	const { draft } = useSettings();
	const apply = useApplySetting();
	const [showNotes, setShowNotes] = useState(false);

	const {
		phase,
		currentVersion: running,
		latestVersion,
		notes,
		progress,
		error,
		downloadUrl,
		check,
		download,
		install
	} = useUpdateStore();

	const version = Constants.expoConfig?.version ?? running;
	const buildNumber = Constants.expoConfig?.android?.versionCode;
	const highlight = notes[0]?.highlights ?? [];

	const updateValue =
		phase === 'checking'
			? 'Checking…'
			: phase === 'up_to_date'
				? 'Up to date'
				: phase === 'available' && latestVersion
					? `Update to ${latestVersion}`
					: phase === 'downloading'
						? `${progress}%`
						: phase === 'ready'
							? 'Ready to install'
							: phase === 'error'
								? 'Could not check'
								: '';

	const startUpdate = (): void => {
		if (!canInstallUpdates()) {
			if (downloadUrl) void openExternalUrl(downloadUrl);
			return;
		}

		if (draft.confirmBeforeInstall) {
			Alert.alert(
				'Download update?',
				'NewzCrime will download the build now and ask before installing it.',
				[
					{ text: 'Cancel', style: 'cancel' },
					{ text: 'Download', onPress: () => void download() }
				]
			);
			return;
		}

		void download();
	};

	return (
		<SettingGroup title='About'>
			<SettingRow label='Version' value={`v${version}`} />

			<ToggleRow
				label='Check for updates automatically'
				description='Runs a check when the app opens'
				value={draft.autoCheckUpdates}
				onChange={value => apply('autoCheckUpdates', value)}
			/>
			<ChoiceRow
				label='Update channel'
				description='Beta builds arrive first but change more often'
				options={updateChannels}
				value={draft.updateChannel}
				onChange={value => apply('updateChannel', value)}
			/>
			<ToggleRow
				label='Show the version badge'
				description='Prints the version under the Settings title'
				value={draft.showVersionBadge}
				onChange={value => apply('showVersionBadge', value)}
			/>
			<ToggleRow
				label='Release notes in the banner'
				description='Shows the top highlight when an update is found'
				value={draft.showReleaseNotes}
				onChange={value => apply('showReleaseNotes', value)}
			/>
			<ToggleRow
				label='Ask before downloading'
				description='Confirms before fetching the update package'
				value={draft.confirmBeforeInstall}
				onChange={value => apply('confirmBeforeInstall', value)}
			/>
			<ToggleRow
				label='Include diagnostics'
				description='Shows device and build details on this screen'
				value={draft.includeDiagnostics}
				onChange={value => apply('includeDiagnostics', value)}
			/>
			<ToggleRow
				label='Show build information'
				description='Prints the build number beside the version'
				value={draft.showBuildInfo}
				onChange={value => apply('showBuildInfo', value)}
			/>

			<SettingRow
				label='Check for updates'
				value={updateValue}
				onPress={() => {
					void check({ silent: false });
				}}
			/>

			<SettingRow
				label="What's new"
				description={
					latestVersion ? `Version ${latestVersion}` : 'The newest release'
				}
				value={showNotes ? 'Hide' : 'View'}
				onPress={() => setShowNotes(previous => !previous)}
				last={!showNotes}
			/>

			{showNotes ? (
				<View
					style={{
						padding: spacing.lg,
						gap: spacing.xs,
						borderTopWidth: 1,
						borderTopColor: colour.border
					}}
				>
					{highlight.length > 0 ? (
						highlight.map(line => (
							<Text key={line} variant='small' tone='muted'>
								{`• ${line}`}
							</Text>
						))
					) : (
						<Text variant='small' tone='muted'>
							Check for updates to load the latest notes.
						</Text>
					)}
				</View>
			) : null}

			{phase === 'downloading' ? (
				<View
					style={{
						padding: spacing.lg,
						gap: spacing.sm,
						borderTopWidth: 1,
						borderTopColor: colour.border
					}}
				>
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
					<Text variant='meta' tone='muted'>
						{`Downloading ${latestVersion ?? 'the update'} · ${progress}%`}
					</Text>
				</View>
			) : null}

			{phase === 'error' ? (
				<View
					style={{
						padding: spacing.lg,
						gap: spacing.sm,
						borderTopWidth: 1,
						borderTopColor: colour.border
					}}
				>
					<Text variant='small' tone='danger'>
						{error ?? 'The update could not be completed.'}
					</Text>
					<Button
						label='Try again'
						variant='secondary'
						onPress={() => {
							void download();
						}}
					/>
				</View>
			) : null}

			{latestVersion && (phase === 'available' || phase === 'ready') ? (
				<View
					style={{
						padding: spacing.lg,
						gap: spacing.md,
						borderTopWidth: 1,
						borderTopColor: colour.border
					}}
				>
					<Text variant='body'>{`Version ${latestVersion} is available.`}</Text>
					<Button
						label={
							phase === 'ready'
								? 'Install update'
								: canInstallUpdates()
									? 'Download update'
									: 'Open download page'
						}
						onPress={() => {
							if (phase === 'ready') {
								void install();
								return;
							}
							startUpdate();
						}}
					/>
				</View>
			) : null}

			{draft.showBuildInfo ? (
				<View
					style={{
						padding: spacing.lg,
						borderTopWidth: 1,
						borderTopColor: colour.border
					}}
				>
					<Text variant='meta' tone='faint'>
						{`Build ${buildNumber ?? '—'} · ${draft.updateChannel} channel`}
					</Text>
				</View>
			) : null}

			{draft.includeDiagnostics ? (
				<View
					style={{
						padding: spacing.lg,
						gap: 2,
						borderTopWidth: 1,
						borderTopColor: colour.border
					}}
				>
					<Text variant='label' tone='faint'>
						Diagnostics
					</Text>
					<Text variant='meta' tone='muted'>
						{`${Platform.OS} ${Platform.Version} · v${version} · ${draft.updateChannel}`}
					</Text>
					<Text variant='meta' tone='muted'>
						{`Updates: ${canInstallUpdates() ? 'in-app install' : 'download page'}`}
					</Text>
				</View>
			) : null}
		</SettingGroup>
	);
}

export function BrandFooter(): ReactElement {
	return (
		<View style={{ alignItems: 'center', gap: 2 }}>
			<Text variant='h4'>{brand.name}</Text>
			<Text variant='meta' tone='faint'>
				{brand.slogan}
			</Text>
		</View>
	);
}

export default AboutSection;
