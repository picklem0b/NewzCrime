import type { ReactElement } from 'react';

import SettingsScreen from '@/settings/SettingsScreen';

/**
 * Settings, reachable from the tab group.
 *
 * Registered with `href: null` in `tabs/_layout.tsx`, so it is a valid route
 * without taking a seat in the tab bar — the Library tab links to it. It
 * renders the same screen as `app/settings/Settings`, and the screen supplies
 * its own container, so this route adds none of its own.
 */
export default function SettingsRoute(): ReactElement {
	return <SettingsScreen />;
}
