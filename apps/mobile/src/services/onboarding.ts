/**
 * First-run flag.
 *
 * Kept out of the settings document on purpose: it is a fact about this
 * installation, not a preference, and clearing it should not require rewriting
 * 49 unrelated keys.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'newzcrime.onboarding.v1';
const SEEN = 'seen';

/**
 * Whether the introduction has already been completed or skipped.
 *
 * Storage failure is treated as "seen". Showing onboarding on every launch
 * because the device cannot read one key is worse than missing it once.
 */
export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) === SEEN;
  } catch {
    return true;
  }
}

/** Marks the introduction complete. Failure is recorded but not fatal. */
export async function markOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, SEEN);
  } catch {
    // The next launch may show the introduction again; nothing else breaks.
  }
}
