import { Stack } from 'expo-router';
import type { ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ErrorScreen from '@/components/feedback/ErrorScreen';
import { useTheme } from '@/hooks/useTheme';
import { playbackService } from '@/services/playbackService';
import { loadPlayer } from '@/services/playerService';
import { useSavedStore } from '@/stores/saved.store';
import { useRecentSearchesStore } from '@/stores/search.store';
import { useSettingsStore } from '@/stores/settings.store';
import { warmSpeechVoice } from '@/stores/speech.store';

/**
 * Root navigator.
 *
 * The player's background service is registered on the first effect, which
 * still runs before any screen can start a track, and only when this build
 * actually ships the native player. Stored settings and bookmarks are read on
 * mount; screens render defaults until that finishes. The speech voice is
 * resolved here as well, because choosing it means reading the device's voice
 * list and `Speech.speak` cannot wait for that.
 */
export default function RootLayout(): ReactElement {
	const { colour, scheme } = useTheme();
	const hydrateSettings = useSettingsStore(state => state.hydrate);
	const hydrateSaved = useSavedStore(state => state.hydrate);
	const hydrateRecents = useRecentSearchesStore(state => state.hydrate);

	useEffect(() => {
		void loadPlayer().then(handle => {
			handle?.player.registerPlaybackService(() => playbackService);
		});
	}, []);

	useEffect(() => {
		// Resolving a voice takes a tick, and `Speech.speak` cannot await it, so
		// it is done at startup rather than on the first tap of Listen.
		void warmSpeechVoice();
	}, []);

	useEffect(() => {
		void hydrateSettings();
		void hydrateSaved();
		void hydrateRecents();
	}, [hydrateSettings, hydrateSaved, hydrateRecents]);

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
				<Stack
					screenOptions={{
						headerShown: false,
						contentStyle: { backgroundColor: colour.background }
					}}
				/>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}

/**
 * Boundary for every route below the root.
 *
 * expo-router wraps a route in this when the module exports it, and errors
 * propagate up to the nearest boundary — so one here covers all screens. A
 * render failure becomes a readable screen with a retry instead of a blank
 * window that shows nothing until the app is restarted.
 */
export function ErrorBoundary({
	error,
	retry
}: ErrorBoundaryProps): ReactElement {
	return (
		<ErrorScreen
			message={error.message || 'Something went wrong'}
			onRetry={() => {
				void retry();
			}}
		/>
	);
}
