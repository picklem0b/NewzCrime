/**
 * Speech store tests.
 *
 * The reason this store exists is the recycled feed row: the native layer fires
 * the previous utterance's `onStopped` *after* a new utterance has started, so
 * the guard that ignores a stale callback is the behaviour under test.
 *
 * The other half is the voice: `pickVoice` decides which device voice reads
 * the article, so its ordering rules are tested directly rather than through a
 * device.
 */

import { VoiceQuality } from 'expo-speech';
import type { Voice } from 'expo-speech';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { speak, stop, getAvailableVoicesAsync } = vi.hoisted(() => ({
  speak: vi.fn(),
  stop: vi.fn(),
  getAvailableVoicesAsync: vi.fn(),
}));

vi.mock('expo-speech', () => ({
  speak,
  stop,
  getAvailableVoicesAsync,
  VoiceQuality: { Default: 'Default', Enhanced: 'Enhanced' },
}));

const { pickVoice, useSpeechStore, warmSpeechVoice } = await import(
  '.././speech.store'
);

/** The `onDone`/`onStopped`/`onError` callbacks handed to the native layer. */
const callbacksFor = (call: number) =>
  speak.mock.calls[call]?.[1] as {
    onDone: () => void;
    onStopped: () => void;
    onError: () => void;
  };

const voice = (
  identifier: string,
  language: string,
  quality: VoiceQuality = VoiceQuality.Default
): Voice => ({ identifier, language, name: identifier, quality });

beforeEach(() => {
  useSpeechStore.setState({ speakingId: null });
  speak.mockReset();
  stop.mockReset();
  getAvailableVoicesAsync.mockReset();
  getAvailableVoicesAsync.mockResolvedValue([]);
});

describe('pickVoice', () => {
  it('prefers South African English over other English voices', () => {
    const chosen = pickVoice([
      voice('gb', 'en-GB'),
      voice('za', 'en-ZA'),
      voice('us', 'en-US'),
    ]);

    expect(chosen?.identifier).toBe('za');
  });

  it('prefers the enhanced voice within a language', () => {
    const chosen = pickVoice([
      voice('za-default', 'en-ZA'),
      voice('za-enhanced', 'en-ZA', VoiceQuality.Enhanced),
    ]);

    expect(chosen?.identifier).toBe('za-enhanced');
  });

  it('takes a plainer preferred language over an enhanced fallback', () => {
    const chosen = pickVoice([
      voice('us-enhanced', 'en-US', VoiceQuality.Enhanced),
      voice('za', 'en-ZA'),
    ]);

    expect(chosen?.identifier).toBe('za');
  });

  it('accepts a voice tagged with an underscore locale', () => {
    const chosen = pickVoice([voice('gb', 'en-GB'), voice('za', 'en_ZA')]);

    expect(chosen?.identifier).toBe('za');
  });

  it('falls back to any English voice on a device without en-ZA', () => {
    const chosen = pickVoice([
      voice('af', 'af-ZA'),
      voice('en', 'en-IN'),
    ]);

    expect(chosen?.identifier).toBe('en');
  });

  it('returns undefined when the device has no English voice', () => {
    expect(pickVoice([voice('af', 'af-ZA'), voice('zu', 'zu-ZA')])).toBe(
      undefined
    );
  });
});

describe('speech store', () => {
  it('marks an item as speaking and hands the text to the native layer', () => {
    useSpeechStore.getState().speak('a', 'Read this out');

    expect(useSpeechStore.getState().speakingId).toBe('a');
    expect(speak).toHaveBeenCalledWith('Read this out', expect.any(Object));
  });

  it('stops the previous utterance before starting a new one', () => {
    useSpeechStore.getState().speak('a', 'first');
    useSpeechStore.getState().speak('b', 'second');

    expect(stop).toHaveBeenCalled();
    expect(useSpeechStore.getState().speakingId).toBe('b');
  });

  it('ignores a stale callback from the utterance it replaced', () => {
    useSpeechStore.getState().speak('a', 'first');
    useSpeechStore.getState().speak('b', 'second');

    // The native stop for "a" arrives late; "b" must keep speaking.
    callbacksFor(0).onStopped();

    expect(useSpeechStore.getState().speakingId).toBe('b');
  });

  it('clears speaking when the current utterance finishes', () => {
    useSpeechStore.getState().speak('a', 'first');
    callbacksFor(0).onDone();

    expect(useSpeechStore.getState().speakingId).toBeNull();
  });

  it('clears speaking when the current utterance errors', () => {
    useSpeechStore.getState().speak('a', 'first');
    callbacksFor(0).onError();

    expect(useSpeechStore.getState().speakingId).toBeNull();
  });

  it('stops playback and clears the speaking id', () => {
    useSpeechStore.getState().speak('a', 'first');
    useSpeechStore.getState().stop();

    expect(stop).toHaveBeenCalled();
    expect(useSpeechStore.getState().speakingId).toBeNull();
  });

  it('ignores a callback that arrives after an explicit stop', () => {
    useSpeechStore.getState().speak('a', 'first');
    useSpeechStore.getState().stop();

    // The utterance was cut off; a late onStopped must not re-clear anything.
    callbacksFor(0).onStopped();

    expect(useSpeechStore.getState().speakingId).toBeNull();
  });

  it('hands the resolved device voice to the native layer', async () => {
    getAvailableVoicesAsync.mockResolvedValue([
      voice('gb', 'en-GB'),
      voice('za', 'en-ZA', VoiceQuality.Enhanced),
    ]);

    await warmSpeechVoice();
    useSpeechStore.getState().speak('c', 'Read this out');

    expect(speak).toHaveBeenCalledWith(
      'Read this out',
      expect.objectContaining({ voice: 'za' })
    );
  });
});
