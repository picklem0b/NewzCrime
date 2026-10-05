/**
 * Text to speech.
 *
 * Only one item is spoken at a time. The state lives in the speech store, so
 * every row that offers a listen button agrees on which item is being read.
 */

import { useEffect } from 'react';

import { useSpeechStore } from '@/stores/speech.store';
import type { SpeechStore } from '@/types';

/** The app-wide reading state. Safe to call from a recycled list row. */
export function useSpeech(): SpeechStore {
  return useSpeechStore();
}

/**
 * Stops speech when the screen that owns the listening surface goes away.
 *
 * Deliberately separate from `useSpeech`: a list row must never stop speech on
 * unmount, because scrolling a row out of view unmounts it.
 */
export function useStopSpeechOnUnmount(): void {
  const stop = useSpeechStore((state) => state.stop);

  useEffect(() => () => stop(), [stop]);
}
