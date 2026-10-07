import type { ReactElement } from 'react';

import SearchScreen from '@/search/SearchScreen';

/**
 * Search as a pushed route.
 *
 * This route used to carry its own search screen, which had drifted from the
 * Search tab and queried a hook shape that no longer exists. It now renders the
 * one implementation in `src/search`, so both entry points behave identically.
 */
export default function SearchRoute(): ReactElement {
	return <SearchScreen />;
}
