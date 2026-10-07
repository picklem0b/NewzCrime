import { useCallback } from 'react';

import { useSettingsStore } from '@/stores/settings.store';
import type { SettingsKey, SettingsState } from '@/types';

export function useApplySetting() {
	const set = useSettingsStore(state => state.set);
	const save = useSettingsStore(state => state.save);

	return useCallback(
		<TKey extends SettingsKey>(key: TKey, value: SettingsState[TKey]) => {
			set(key, value);
			save();
		},
		[set, save]
	);
}
