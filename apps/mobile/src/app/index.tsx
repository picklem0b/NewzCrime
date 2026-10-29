import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';

import BootSplash from '@/onboarding/BootSplash';
import OnboardingScreen from '@/onboarding/OnboardingScreen';
import { feedCacheKey, primeFeedFromDisk } from '@/services/feedCache';
import { hasSeenOnboarding } from '@/services/onboarding';
import { useSettingsStore } from '@/stores/settings.store';
import { useSourcesStore } from '@/stores/sources.store';
import type { StartTab } from '@/types';

type BootPhase =
	| { phase: 'loading' }
	| { phase: 'onboarding' }
	| { phase: 'ready'; target: RouteTarget };

type RouteTarget = '/tabs/Home' | '/tabs/Saved' | '/search/Search';

const routeFor = (tab: StartTab): RouteTarget =>
	tab === 'search'
		? '/search/Search'
		: tab === 'saved'
			? '/tabs/Saved'
			: '/tabs/Home';

/**
 * Entry route.
 *
 * Three things have to be true before a tab may render, and all three are
 * cheap: settings are read from storage, the last feed page is moved from disk
 * into memory, and the first-run flag is checked. Doing them here rather than
 * inside Today is what stops a skeleton from flashing on a cold start — by the
 * time Home mounts, `useFeed` has a page to paint.
 *
 * On a first launch the introduction renders in place of a redirect, so the
 * back gesture cannot land back inside it after it has been completed.
 */
export default function StartRoute(): ReactElement {
	const [boot, setBoot] = useState<BootPhase>({ phase: 'loading' });

	useEffect(() => {
		let active = true;

		const prepare = async (): Promise<void> => {
			await useSettingsStore.getState().hydrate();

			const topic = useSettingsStore.getState().saved.defaultTopic;

			const [seen] = await Promise.all([
				hasSeenOnboarding(),
				primeFeedFromDisk(feedCacheKey(topic, false))
			]);

			if (!active) return;

			if (!seen) {
				setBoot({ phase: 'onboarding' });
				return;
			}

			// Labels on feed rows come from the directory; fetching it now means
			// the first list has outlet names rather than blank source chips.
			void useSourcesStore.getState().load();

			setBoot({
				phase: 'ready',
				target: routeFor(useSettingsStore.getState().saved.startTab)
			});
		};

		void prepare();

		return () => {
			active = false;
		};
	}, []);

	if (boot.phase === 'onboarding') return <OnboardingScreen />;
	if (boot.phase === 'ready') return <Redirect href={boot.target} />;

	return <BootSplash />;
}
