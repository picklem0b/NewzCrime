import type { ReactElement } from 'react';

/**
 * Player — podcast and audio playback.
 *
 * Playback uses `react-native-track-player`, which provides lock-screen
 * controls. It is a native module, so the app runs in a development build and
 * not in Expo Go.
 *
 * TODO: playback service, queue, progress persistence, skip controls and sleep
 * timer.
 */
export default function PlayerScreen(): ReactElement | null {
  return null;
}
