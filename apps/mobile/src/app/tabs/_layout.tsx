import { Tabs } from 'expo-router';
import type { ReactElement } from 'react';

/**
 * Tab navigation: Home, Discover, Saved and Settings.
 *
 * The leading underscore is required by expo-router.
 *
 * TODO: custom tab bar, active-state accent and icons.
 */
export default function TabsLayout(): ReactElement {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name='Home' options={{ title: 'Home' }} />
      <Tabs.Screen name='Discover' options={{ title: 'Discover' }} />
      <Tabs.Screen name='Saved' options={{ title: 'Saved' }} />
      <Tabs.Screen name='Settings' options={{ title: 'Settings' }} />
    </Tabs>
  );
}
