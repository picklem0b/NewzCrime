import type { ReactElement } from 'react';

import WatchScreen from '@/watch/WatchScreen';

/** Watch tab route. The screen itself lives in `src/watch`. */
export default function WatchRoute(): ReactElement {
  return <WatchScreen />;
}
