import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { View } from 'react-native';

import Text from '@/components/ui/Text';
import { brand } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { SettingGroup, SettingRow } from '@/components/settings/SettingRow';
import {
	checkForUpdates,
	currentVersion,
	fetchReleaseNotes
} from '@/services/updateService';
import type { ReleaseNotes } from '@/services/updateService';
import type { UpdateCheckResult } from '@/types';

export function AboutSection(): ReactElement {
	const { colour, spacing } = useTheme();
	const [check, setCheck] = useState<UpdateCheckResult>({ status: 'idle' });
	const [notes, setNotes] = useState<ReleaseNotes[]>([]);
	const [showNotes, setShowNotes] = useState(false);

	useEffect(() => {
		let isActive = true;

		fetchReleaseNotes()
			.then(release => {
				if (isActive) setNotes(release.notes);
			})
			.catch(() => undefined);

		return () => {
			isActive = false;
		};
	}, []);

	const latest = notes[0];

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
			<SettingRow label='Version' value={`v${currentVersion()}`} />

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
