/**
 * Text to speech.
 *
 * Only one item is spoken at a time: starting a new one stops the previous, so
 * the UI can show which row is talking.
 */

import * as Speech from 'expo-speech';
import { useCallback, useEffect, useState } from 'react';

export interface UseSpeechResult {
  /** Id of the item currently being read, or `null`. */
  speakingId: string | null;
  speak: (itemId: string, text: string) => void;
  stop: () => void;
}

export function useSpeech(): UseSpeechResult {
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const stop = useCallback(() => {
    Speech.stop();
    setSpeakingId(null);
  }, []);

  const speak = useCallback((itemId: string, text: string) => {
    Speech.stop();
    setSpeakingId(itemId);

    Speech.speak(text, {
      onDone: () => setSpeakingId(null),
      onStopped: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  }, []);

  // Leaving the screen should not leave the device talking.
  useEffect(() => () => void Speech.stop(), []);

  return { speakingId, speak, stop };
}
