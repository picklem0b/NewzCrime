/**
 * Text-to-speech store (zustand).
 *
 * Speech is app-wide. It used to live in a hook inside every card that offers a
 * listen button, which meant two problems: two cards could each believe they
 * were speaking, and unmounting any card stopped playback — so the feed
 * recycling the row you were listening to cut the audio off mid-sentence.
 *
 * The completion callbacks check that their own utterance is still the current
 * one. `Speech.stop()` fires the previous utterance's `onStopped`
 * asynchronously, so without that check starting a new item would immediately
 * clear the state the new item had just set.
 */

import * as Speech from 'expo-speech';
import { create } from 'zustand';

import type { SpeechStore } from '@/types';

export const useSpeechStore = create<SpeechStore>((set, get) => ({
  speakingId: null,

  speak: (itemId, text) => {
    Speech.stop();
    set({ speakingId: itemId });

    const isStillCurrent = (): boolean => get().speakingId === itemId;
    const clearIfCurrent = (): void => {
      if (isStillCurrent()) set({ speakingId: null });
    };

    Speech.speak(text, {
      onDone: clearIfCurrent,
      onStopped: clearIfCurrent,
      onError: clearIfCurrent,
    });
  },

  stop: () => {
    Speech.stop();
    set({ speakingId: null });
  },
}));
