import type { ReactElement } from 'react';

import SettingsScreen from '@/settings/SettingsScreen';

/**
 * Settings tab route. The implementation lives in `src/settings`; every file
 * under `src/app` is a screen, so route files stay thin.
 */
export default function SettingsTab(): ReactElement {
  return <SettingsScreen />;
}
