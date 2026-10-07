import type { ReactElement } from 'react';

import HomeScreen from '@/home/HomeScreen';

/**
 * Today tab route.
 *
 * Every file under `src/app` is a route, so it stays thin; the screen itself
 * lives in `src/home`. The same split is used by every tab and by Settings.
 */
export default function HomeRoute(): ReactElement {
	return <HomeScreen />;
}
