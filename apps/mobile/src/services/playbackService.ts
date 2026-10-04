/**
 * Track Player background service.
 *
 * Registered once from the root layout. It owns the lock-screen and headset
 * controls; without it those buttons do nothing while the app is backgrounded.
 * The native module is resolved lazily here so that importing this file never
 * fails a build that has no native player.
 */

import { loadPlayer } from '@/services/playerService';

export async function playbackService(): Promise<void> {
  const handle = await loadPlayer();
  if (!handle) return;

  const { player, Event } = handle;

  player.addEventListener(Event.RemotePlay, () => player.play());
  player.addEventListener(Event.RemotePause, () => player.pause());
  player.addEventListener(Event.RemoteStop, () => player.stop());
  player.addEventListener(Event.RemoteNext, () => player.skipToNext());
  player.addEventListener(Event.RemotePrevious, () => player.skipToPrevious());
  player.addEventListener(Event.RemoteSeek, (event) =>
    player.seekTo(event.position)
  );
}
