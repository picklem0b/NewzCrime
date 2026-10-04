/**
 * The player as the UI needs it: store state plus the live position.
 *
 * The progress poll lives here rather than borrowing Track Player's
 * `useProgress`, because that hook is imported at module scope and would take
 * down every screen that renders the player bar in a build without the native
 * module. Polling only runs while an episode is actually loaded.
 */

import { useEffect, useState } from 'react';

import { activePlayer } from '@/services/playerService';
import { usePlayerStore } from '@/stores/player.store';
import type { PlayerStore } from '@/types';

/** How often the position is refreshed while audio is loaded, in ms. */
const PROGRESS_INTERVAL = 500;

interface PlaybackProgress {
  position: number;
  duration: number;
}

const IDLE_PROGRESS: PlaybackProgress = { position: 0, duration: 0 };

export interface PlayerView extends PlayerStore {
  positionSeconds: number;
  durationSeconds: number;
}

function usePlaybackProgress(active: boolean): PlaybackProgress {
  const [progress, setProgress] = useState<PlaybackProgress>(IDLE_PROGRESS);

  useEffect(() => {
    if (!active) {
      setProgress(IDLE_PROGRESS);
      return;
    }

    let cancelled = false;

    const read = async () => {
      const player = await activePlayer();
      if (!player || cancelled) return;

      try {
        const { position, duration } = await player.getProgress();
        if (!cancelled) setProgress({ position, duration });
      } catch {
        // getProgress throws until the player finishes setup; the next tick
        // retries, so the failure is not worth surfacing.
      }
    };

    void read();
    const timer = setInterval(() => {
      void read();
    }, PROGRESS_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [active]);

  return progress;
}

export function usePlayer(): PlayerView {
  const store = usePlayerStore();
  const progress = usePlaybackProgress(store.current !== null);

  return {
    ...store,
    positionSeconds: progress.position,
    durationSeconds: progress.duration,
  };
}
