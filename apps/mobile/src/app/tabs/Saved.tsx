import type { ReactElement } from 'react';

import SavedScreen from '@/saved/SavedScreen';

/** Library tab route. The screen itself lives in `src/saved`. */
export default function SavedRoute(): ReactElement {
	return <SavedScreen />;
}
