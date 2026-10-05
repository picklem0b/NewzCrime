import type { ReactElement } from 'react';

import TabScreen from '@/components/layout/TabScreen';
import SettingsScreen from '@/settings/SettingsScreen';

/**
 * Settings tab route. The implementation lives in `src/settings`; every file
 * under `src/app` is a screen, so route files stay thin.
 *
 * `TabScreen` is what supplies the safe-area insets and the player bar, and
 * every other tab goes through it. Without it the settings list ran under the
 * status bar on a device with a notch.
 */
export default function SettingsTab(): ReactElement {
  return (
    <TabScreen>
      <SettingsScreen />
    </TabScreen>
  );
}
