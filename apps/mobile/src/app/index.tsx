import { Redirect } from 'expo-router';

import { useSettingsStore } from '@/stores/settings.store';

/**
 * Splash entry.
 *
 * Sends the reader to their chosen start tab, or Home by default. There is no
 * session to restore until accounts ship; the auth screens exist but nothing
 * routes to them yet.
 */
export default function SplashScreen() {
  const startTab = useSettingsStore((state) => state.saved.startTab);

  const target =
    startTab === 'discover'
      ? '/tabs/Discover'
      : startTab === 'saved'
        ? '/tabs/Saved'
        : '/tabs/Home';

  return <Redirect href={target} />;
}
