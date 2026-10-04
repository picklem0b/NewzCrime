/**
 * Audio player store (zustand), backed by react-native-track-player.
 *
 * Track Player owns playback and the lock-screen controls; this store mirrors
 * what the UI needs and keeps setup in one place. The native module is resolved
 * through `playerService`, so the store can be imported by any screen without
 * the app failing to boot where audio is unavailable. Setup happens lazily on
 * the first play, so a reader who never opens a podcast never pays for it.
 */

import type { ContentItem } from '@newzcrime/shared';
import type { Track } from 'react-native-track-player';
import { create } from 'zustand';

import {
  activePlayer,
  loadPlayer,
  PLAYER_UNAVAILABLE,
} from '@/services/playerService';
import type { PlayerHandle } from '@/services/playerService';
import type { PlayerStore } from '@/types';

let isPlayerReady = false;

/** Sets up the native player the first time audio is requested. */
async function ensurePlayer(): Promise<PlayerHandle['player']> {
  const handle = await loadPlayer();
  if (!handle) throw new Error(PLAYER_UNAVAILABLE);

  if (isPlayerReady) return handle.player;

  const { player, Capability } = handle;

  await player.setupPlayer();
  await player.updateOptions({
    // Drives the progress poll in `usePlayer`.
    progressUpdateEventInterval: 1,
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.Stop,
      Capability.SeekTo,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
    ],
    compactCapabilities: [Capability.Play, Capability.Pause],
    notificationCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.Stop,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
    ],
  });

  isPlayerReady = true;
  return player;
}

const toTrack = (episode: ContentItem): Track => ({
  id: episode.id,
  url: episode.audioUrl ?? '',
  title: episode.title,
  artist: episode.author ?? 'NewzCrime',
  artwork: episode.imageUrl ?? undefined,
  date: episode.publishedAt,
});

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Playback failed';

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  current: null,
  queue: [],
  status: 'idle',
  error: null,

  play: async (episode, queue) => {
    set({ status: 'loading', error: null });

    try {
      const player = await ensurePlayer();

      const requested = queue && queue.length > 0 ? queue : [episode];
      const playable = requested.filter((item) => item.audioUrl);
      if (playable.length === 0) {
        throw new Error('This episode has no audio source');
      }

      await player.reset();
      await player.add(playable.map(toTrack));

      const index = playable.findIndex((item) => item.id === episode.id);
      await player.skip(index >= 0 ? index : 0);
      await player.play();

      set({ current: episode, queue: playable, status: 'playing' });
    } catch (error) {
      set({ status: 'idle', error: errorMessage(error) });
    }
  },

  toggle: async () => {
    const { current, status } = get();
    if (!current) return;

    const player = await activePlayer();
    if (!player) {
      set({ error: PLAYER_UNAVAILABLE });
      return;
    }

    try {
      if (status === 'playing') {
        await player.pause();
        set({ status: 'paused' });
      } else {
        await player.play();
        set({ status: 'playing' });
      }
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  stop: async () => {
    const player = await activePlayer();

    try {
      await player?.stop();
    } catch (error) {
      set({ error: errorMessage(error) });
    } finally {
      set({ current: null, queue: [], status: 'idle' });
    }
  },

  seekTo: async (seconds) => {
    const player = await activePlayer();

    try {
      await player?.seekTo(seconds);
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  skipBy: async (seconds) => {
    const player = await activePlayer();

    try {
      await player?.seekBy(seconds);
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  next: async () => {
    const player = await activePlayer();

    try {
      await player?.skipToNext();
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  previous: async () => {
    const player = await activePlayer();

    try {
      await player?.skipToPrevious();
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },
}));
