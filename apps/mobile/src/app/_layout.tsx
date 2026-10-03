import { Stack } from 'expo-router';
import type { ReactElement } from 'react';

/**
 * Root navigator.
 *
 * The leading underscore is required by expo-router for layout files. Settings
 * are a zustand store and need no provider here.
 *
 * TODO: providers for safe area, gestures, theme and the audio player.
 */
export default function RootLayout(): ReactElement {
  return <Stack screenOptions={{ headerShown: false }} />;
}
