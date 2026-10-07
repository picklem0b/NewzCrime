import { Redirect } from 'expo-router';

import { useSettingsStore } from '@/stores/settings.store';

export default function SplashScreen() {
	const startTab = useSettingsStore(state => state.saved.startTab);

	const target =
		startTab === 'search'
			? '/tabs/Search'
			: startTab === 'saved'
				? '/tabs/Saved'
				: '/tabs/Home';

	return <Redirect href={target} />;
}
