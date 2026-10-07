import type { ReactElement } from 'react';

import SearchScreen from '@/search/SearchScreen';

/** Search tab route. The screen itself lives in `src/search`. */
export default function SearchRoute(): ReactElement {
	return <SearchScreen />;
}
