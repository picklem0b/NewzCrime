/**
 * Audio player store (zustand), backed by react-native-track-player.
 *
 * Track Player owns playback and the lock-screen controls; this store mirrors
 * what the UI needs and keeps setup in one place. Setup happens lazily on the
 * first play, so a reader who never opens a podcast never pays for it.
 */

import type { ContentItem } from '@newzcrime/shared';
import TrackPlayer, { Capability } from 'react-native-track-player';
import type { Track } from 'react-native-track-player';
import { create } from 'zustand';

import type { PlayerStore } from '@/types';

let isPlayerReady = false;

async function ensurePlayer(): Promise<void> {
  if (isPlayerReady) return;

  await TrackPlayer.setupPlayer();
  await TrackPlayer.updateOptions({
    // Drives `useProgress`, which the player screen reads.
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
      await ensurePlayer();

      const requested = queue && queue.length > 0 ? queue : [episode];
      const playable = requested.filter((item) => item.audioUrl);
      if (playable.length === 0) {
        throw new Error('This episode has no audio source');
      }

      await TrackPlayer.reset();
      await TrackPlayer.add(playable.map(toTrack));

      const index = playable.findIndex((item) => item.id === episode.id);
      await TrackPlayer.skip(index >= 0 ? index : 0);
      await TrackPlayer.play();

      set({ current: episode, queue: playable, status: 'playing' });
    } catch (error) {
      set({ status: 'idle', error: errorMessage(error) });
    }
  },

  toggle: async () => {
    const { current, status } = get();
    if (!current) return;

    try {
      if (status === 'playing') {
        await TrackPlayer.pause();
        set({ status: 'paused' });
      } else {
        await TrackPlayer.play();
        set({ status: 'playing' });
      }
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  stop: async () => {
    try {
      await TrackPlayer.stop();
    } catch (error) {
      set({ error: errorMessage(error) });
    } finally {
      set({ current: null, queue: [], status: 'idle' });
    }
  },

  seekTo: async (seconds) => {
    try {
      await TrackPlayer.seekTo(seconds);
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  skipBy: async (seconds) => {
    try {
      await TrackPlayer.seekBy(seconds);
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  next: async () => {
    try {
      await TrackPlayer.skipToNext();
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  previous: async () => {
    try {
      await TrackPlayer.skipToPrevious();
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },
}));
