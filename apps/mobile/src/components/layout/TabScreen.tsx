/**
 * Tab-level layout: the screen plus the player bar.
 *
 * The bar sits outside the scrolling area so it stays put whichever list is on
 * screen, and it renders nothing while no episode is loaded.
 */

import { useRouter } from 'expo-router';
import type { ReactElement, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import Screen from '@/components/layout/Screen';
import MiniPlayer from '@/components/player/MiniPlayer';

export interface TabScreenProps {
  children: ReactNode;
}

export function TabScreen({ children }: TabScreenProps): ReactElement {
  const router = useRouter();

  return (
    <View style={styles.fill}>
      <Screen>{children}</Screen>
      <MiniPlayer onOpen={() => router.push('/player/Player')} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

export default TabScreen;
