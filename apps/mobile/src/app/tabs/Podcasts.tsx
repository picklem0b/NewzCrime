import type { ReactElement } from 'react';

import PodcastsScreen from '@/podcasts/PodcastsScreen';

/** Podcasts tab route. The screen itself lives in `src/podcasts`. */
export default function PodcastsRoute(): ReactElement {
	return <PodcastsScreen />;
}
