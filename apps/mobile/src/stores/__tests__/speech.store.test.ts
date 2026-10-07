/**
 * Speech store tests.
 *
 * The reason this store exists is the recycled feed row: the native layer fires
 * the previous utterance's `onStopped` *after* a new utterance has started, so
 * the guard that ignores a stale callback is the behaviour under test.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { speak, stop } = vi.hoisted(() => ({
  speak: vi.fn(),
  stop: vi.fn(),
}));

vi.mock('expo-speech', () => ({ speak, stop }));

const { useSpeechStore } = await import('.././speech.store');

/** The `onDone`/`onStopped`/`onError` callbacks handed to the native layer. */
const callbacksFor = (call: number) =>
  speak.mock.calls[call]?.[1] as {
    onDone: () => void;
    onStopped: () => void;
    onError: () => void;
  };

beforeEach(() => {
  useSpeechStore.setState({ speakingId: null });
  speak.mockReset();
  stop.mockReset();
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
});
