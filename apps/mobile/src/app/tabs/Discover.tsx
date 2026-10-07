import type { ReactElement } from 'react';

import DiscoverScreen from '@/discover/DiscoverScreen';

/**
 * Discover route.
 *
 * Registered in `tabs/_layout.tsx`, so it is a reachable route rather than a
 * file that expo-router would otherwise turn into a stray tab.
 */
export default function DiscoverRoute(): ReactElement {
	return <DiscoverScreen />;
}
