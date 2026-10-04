import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TrackPlayer from 'react-native-track-player';

import { useTheme } from '@/hooks/useTheme';
import { playbackService } from '@/services/playbackService';
import { useSavedStore } from '@/stores/saved.store';
import { useSettingsStore } from '@/stores/settings.store';

/**
 * Root navigator.
 *
 * The player's background service is registered once, at module scope, because
 * it must be listening before the first track is loaded. Stored settings and
 * bookmarks are read on mount; screens render defaults until that finishes.
 */
TrackPlayer.registerPlaybackService(() => playbackService);

export default function RootLayout(): ReactElement {
  const { colour, scheme } = useTheme();
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const hydrateSaved = useSavedStore((state) => state.hydrate);

  useEffect(() => {
    void hydrateSettings();
    void hydrateSaved();
  }, [hydrateSettings, hydrateSaved]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colour.background },
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
