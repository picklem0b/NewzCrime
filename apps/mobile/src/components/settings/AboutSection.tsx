import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { View } from 'react-native';

import { SettingGroup, SettingRow } from '@/components/settings/SettingRow';
import Button from '@/components/ui/Button';
import Text from '@/components/ui/Text';
import { brand } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import {
	checkForUpdates,
	currentVersion,
	fetchReleaseNotes,
	isUpdateAvailable,
	latestRelease
} from '@/services/updateService';
import type { ReleaseInfo } from '@/services/updateService';
import type { UpdateCheckResult } from '@/types';
import { openExternalUrl } from '@/utils/external';

/**
 * About: version, the update check, and what changed in this release.
 *
 * Release metadata comes from `GET /v1/app/version`. Only the newest release is
 * shown — the panel renders one release and `CHANGELOG.md` holds the history —
 * and when the server reports a newer version the reader gets a button that
 * opens the build rather than a version number to act on themselves.
 *
 * Installing still happens outside the app: this is an internal-distribution
 * build, so there is no store to hand the request to.
 */
export function AboutSection(): ReactElement {
	const { colour, spacing } = useTheme();
	const [check, setCheck] = useState<UpdateCheckResult>({ status: 'idle' });
	const [release, setRelease] = useState<ReleaseInfo | null>(null);
	const [showNotes, setShowNotes] = useState(false);

	useEffect(() => {
		let isActive = true;

		fetchReleaseNotes()
			.then(info => {
				if (isActive) setRelease(info);
			})
			.catch(() => undefined);

		return () => {
			isActive = false;
		};
	}, []);

	const version = currentVersion();
	const latest = latestRelease(release?.notes ?? []);
	const canUpdate = release ? isUpdateAvailable(version, release) : false;

	const updateValue =
		check.status === 'checking'
			? 'Checking…'
			: check.status === 'up_to_date'
				? 'Up to date'
				: check.status === 'update_available'
					? `Update to ${check.latestVersion}`
					: check.status === 'error'
						? 'Could not check'
						: '';

	return (
		<SettingGroup title='About'>
			<SettingRow label='Version' value={`v${version}`} />

			<SettingRow
				label='Check for updates'
				value={updateValue}
				onPress={() => {
					setCheck({ status: 'checking' });
					void checkForUpdates().then(setCheck);
				}}
				last={!latest}
			/>

			{latest ? (
				<SettingRow
					label="What's new"
					description={`Version ${latest.version}`}
					value={showNotes ? 'Hide' : 'View'}
					onPress={() => setShowNotes(previous => !previous)}
					last={!showNotes}
				/>
			) : null}

			{showNotes && latest ? (
				<View
					style={{
						padding: spacing.lg,
						gap: spacing.xs,
						borderTopWidth: 1,
						borderTopColor: colour.border
					}}
				>
					{latest.highlights.map(highlight => (
						<Text key={highlight} variant='small' tone='muted'>
							{`• ${highlight}`}
						</Text>
					))}
				</View>
			) : null}

			{canUpdate && release ? (
				<View
					style={{
						padding: spacing.lg,
						gap: spacing.md,
						borderTopWidth: 1,
						borderTopColor: colour.border
					}}
				>
					<Text variant='body'>
						{`Version ${release.latestVersion} is available.`}
					</Text>
					<Button
						label='Get the update'
						onPress={() => {
							void openExternalUrl(release.downloadUrl);
						}}
					/>
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
