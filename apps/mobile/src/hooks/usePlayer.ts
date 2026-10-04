/**
 * The player as the UI needs it: store state plus the live position.
 *
 * `useProgress` polls the native player, so it is only used on screens that
 * actually show a progress bar.
 */

import { useProgress } from 'react-native-track-player';

import { usePlayerStore } from '@/stores/player.store';
import type { PlayerStore } from '@/types';

export interface PlayerView extends PlayerStore {
  positionSeconds: number;
  durationSeconds: number;
}

export function usePlayer(): PlayerView {
  const store = usePlayerStore();
  const progress = useProgress(500);

  return {
    ...store,
    positionSeconds: progress.position,
    durationSeconds: progress.duration,
  };
}
