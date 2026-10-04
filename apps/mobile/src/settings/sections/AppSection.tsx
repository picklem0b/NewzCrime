/**
 * App: what's new, the update check, alerts and playback behaviour.
 *
 * The update check compares the installed version against the release the API
 * reports. Installing still happens through the store or the development build.
 */

import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { SettingRow } from '@/settings/components/SettingRow';
import {
  checkForUpdates,
  currentVersion,
  fetchReleaseNotes,
} from '@/services/updateService';
import type { ReleaseNotes } from '@/services/updateService';
import type { UpdateCheckResult } from '@/types';

export function AppSection(): ReactElement {
  const { colour, spacingY, typography } = useTheme();
  const { draft, set } = useSettings();

  const [check, setCheck] = useState<UpdateCheckResult>({ status: 'idle' });
  const [notes, setNotes] = useState<ReleaseNotes[]>([]);

  useEffect(() => {
    let isActive = true;

    fetchReleaseNotes()
      .then((release) => {
        if (isActive) setNotes(release.notes);
      })
      .catch(() => {
        // Release notes are informational; a failure is not worth surfacing.
      });

    return () => {
      isActive = false;
    };
  }, []);

  const latest = notes[0];
  const latestVersion = latest?.version ?? currentVersion();

  const updateValue =
    check.status === 'checking'
      ? 'Checking…'
      : check.status === 'up_to_date'
        ? 'Up to date'
        : check.status === 'update_available'
          ? `Update to ${check.latestVersion}`
          : check.status === 'error'
            ? 'Could not check'
            : `v${currentVersion()}`;

  return (
    <View style={{ gap: spacingY.sm }}>
      <SettingRow
        label="What's new"
        description={latest ? `Version ${latest.version}` : 'Release notes'}
        value='View'
        onPress={() => undefined}
      />

      {latest ? (
        <View style={{ paddingHorizontal: 4, gap: 4 }}>
          {latest.highlights.map((highlight) => (
            <Text
              key={highlight}
              style={{
                color: colour.textMuted,
                fontSize: typography.size.small,
                lineHeight: typography.size.small * typography.leading.relaxed,
              }}
            >
              · {highlight}
            </Text>
          ))}
        </View>
      ) : null}

      <SettingRow
        label='Check for updates'
        description={`Installed v${currentVersion()} · latest v${latestVersion}`}
        value={updateValue}
        onPress={() => {
          setCheck({ status: 'checking' });
          void checkForUpdates().then(setCheck);
        }}
      />

      <SettingRow
        label='Breaking news alerts'
        toggle={{
          value: draft.breakingNews,
          onChange: (value) => set('breakingNews', value),
        }}
      />

      <SettingRow
        label='New episode alerts'
        toggle={{
          value: draft.podcastNotifications,
          onChange: (value) => set('podcastNotifications', value),
        }}
      />

      <SettingRow
        label='Download over Wi-Fi only'
        toggle={{
          value: draft.downloadOnWifi,
          onChange: (value) => set('downloadOnWifi', value),
        }}
      />

      <SettingRow
        label='Autoplay next episode'
        toggle={{
          value: draft.autoplayNext,
          onChange: (value) => set('autoplayNext', value),
        }}
      />
    </View>
  );
}

export default AppSection;
