/**
 * Guarded access to `react-native-track-player`.
 *
 * Track Player builds its `Capability` enum by reading the native module while
 * its own module body is being evaluated. In a build that has no native player
 * — Expo Go, or any binary built without the module — that read throws
 * `Cannot read property 'CAPABILITY_PLAY' of null`.
 *
 * Because the throw happens during evaluation, a static import is fatal: it
 * takes down every route that transitively imports the player store or the
 * player bar, which is most of the app. Everything therefore goes through this
 * loader, which resolves the module on first use and reports absence as `null`
 * instead of throwing.
 */

type PlayerModule = typeof import('react-native-track-player');

/** Everything the app needs from the native player, resolved together. */
export interface PlayerHandle {
  player: PlayerModule['default'];
  Capability: PlayerModule['Capability'];
  Event: PlayerModule['Event'];
}

/** Shown when the running build has no native player to drive. */
export const PLAYER_UNAVAILABLE =
  'Audio playback needs the NewzCrime development build';

let handle: PlayerHandle | null = null;
let hasAttempted = false;

/**
 * Resolves the native player once, and only once.
 *
 * The outcome is cached, so a build without the native module pays for the
 * failed import a single time rather than on every play attempt.
 */
export async function loadPlayer(): Promise<PlayerHandle | null> {
  if (hasAttempted) return handle;
  hasAttempted = true;

  try {
    const module = await import('react-native-track-player');
    handle = {
      player: module.default,
      Capability: module.Capability,
      Event: module.Event,
    };
  } catch {
    handle = null;
  }

  return handle;
}

/** The active player, or null when this build has no native module. */
export async function activePlayer(): Promise<PlayerHandle['player'] | null> {
  const resolved = await loadPlayer();
  return resolved ? resolved.player : null;
}
