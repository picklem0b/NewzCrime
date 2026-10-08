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
 *
 * Speaking with no voice named leaves the choice to the platform, and the
 * platform does not choose well: the utterance comes out of a robotic fallback
 * rather than the engine's own English voice. `warmSpeechVoice` picks a real
 * voice once, before the first article is read.
 */

import * as Speech from 'expo-speech';
import { create } from 'zustand';

import type { SpeechStore } from '@/types';

/**
 * Where the reader is, best first.
 *
 * South African English first, because that is the accent the app's readers
 * hear; the others keep a real voice on a device that ships no `en-ZA` voice.
 */
const PREFERRED_LANGUAGES: readonly string[] = ['en-ZA', 'en-GB', 'en-US'];

/** Language asked of the engine when no named voice is available. */
const FALLBACK_LANGUAGE = 'en-ZA';

/** Slightly under the platform default; news copy read at `1.0` is rushed. */
const SPEECH_RATE = 0.95;

/** Android reports `en_ZA` where iOS reports `en-ZA`. */
const normaliseLanguage = (language: string): string =>
	language.replace('_', '-');

/**
 * How strongly a voice matches. Zero means "not a voice we want at all".
 *
 * Language outranks quality on purpose: an `en-GB` voice reading a South
 * African story is a bigger mismatch than a plain `en-ZA` voice is a downgrade.
 */
function voiceScore(voice: Speech.Voice): number {
	const language = normaliseLanguage(voice.language);
	const index = PREFERRED_LANGUAGES.indexOf(language);
	const rank =
		index !== -1
			? PREFERRED_LANGUAGES.length - index
			: language.startsWith('en')
				? 0.5
				: 0;

	return rank * 10 + (voice.quality === Speech.VoiceQuality.Enhanced ? 1 : 0);
}

/**
 * The best voice on the device, or `undefined` when it has no English voice.
 *
 * Exported so the choice is testable without a device.
 */
export function pickVoice(
	voices: readonly Speech.Voice[]
): Speech.Voice | undefined {
	let best: Speech.Voice | undefined;
	let bestScore = 0;

	for (const voice of voices) {
		const score = voiceScore(voice);
		if (score > bestScore) {
			best = voice;
			bestScore = score;
		}
	}

	return best;
}

let chosenVoiceId: string | undefined;
let voiceLookup: Promise<void> | null = null;

/**
 * Resolves the device voice, once, ahead of the first utterance.
 *
 * Selection cannot live inside `speak`: `Speech.speak` is synchronous, so it
 * would have to await the voice list first, and an utterance started a tick
 * late can be cancelled by a `stop()` that arrives in between. The app warms
 * this at startup instead, and `speak` uses the voice once it has landed.
 */
export function warmSpeechVoice(): Promise<void> {
	if (!voiceLookup) {
		voiceLookup = Speech.getAvailableVoicesAsync()
			.then((voices) => {
				chosenVoiceId = pickVoice(voices)?.identifier;
			})
			.catch(() => {
				// No voice list means no named voice; the engine still speaks.
				chosenVoiceId = undefined;
			});
	}

	return voiceLookup;
}

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
			// A named voice wins. Naming the language alongside it would be
			// ignored by Android and take precedence on iOS.
			voice: chosenVoiceId,
			language: chosenVoiceId ? undefined : FALLBACK_LANGUAGE,
			rate: SPEECH_RATE,
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
