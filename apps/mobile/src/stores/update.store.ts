/**
 * Update check and install flow.
 *
 * One store owns the whole journey so the banner, the About section and the
 * dialog cannot disagree: checking produces `available`, the update button
 * produces `downloading` then `ready`, and the installer is started from
 * `ready`. "Later" snoozes that version for a day rather than hiding updates
 * until the next launch.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import {
	clearUpdateNotification,
	notifyUpdateAvailable
} from '@/services/notifications';
import {
	downloadUpdate,
	installDownloadedUpdate
} from '@/services/updateInstaller';
import {
	currentVersion,
	fetchReleaseNotes,
	isUpdateAvailable
} from '@/services/updateService';
import type { ReleaseNotes } from '@/services/updateService';
import { readSettings } from '@/stores/settings.store';
import { releaseDownloadUrl, SNOOZE_MS } from '@/utils/update';

export type UpdatePhase =
	| 'idle'
	| 'checking'
	| 'up_to_date'
	| 'available'
	| 'downloading'
	| 'ready'
	| 'error';

export interface UpdateStore {
	phase: UpdatePhase;
	currentVersion: string;
	latestVersion: string | null;
	notes: readonly ReleaseNotes[];
	downloadUrl: string | null;
	/** 0–100 while downloading. */
	progress: number;
	error: string | null;
	/** True from the moment a newer build is found until it is dismissed. */
	bannerVisible: boolean;
	fileUri: string | null;

	hydrate: () => Promise<void>;
	check: (options?: { silent?: boolean }) => Promise<void>;
	/** Chooses "Later": hides the banner and snoozes this version for a day. */
	dismiss: () => void;
	/** Closes the install dialog without dismissing the available update. */
	closeDialog: () => void;
	/** Downloads the APK for the selected channel. */
	download: () => Promise<void>;
	/** Opens the system installer for the downloaded APK. */
	install: () => Promise<void>;
}

const SNOOZE_KEY = 'newzcrime.update.snooze.v1';

interface Snooze {
	version: string;
	until: number;
}

async function readSnooze(): Promise<Snooze | null> {
	try {
		const raw = await AsyncStorage.getItem(SNOOZE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<Snooze>;
		if (typeof parsed.version !== 'string' || typeof parsed.until !== 'number') {
			return null;
		}
		return { version: parsed.version, until: parsed.until };
	} catch {
		return null;
	}
}

async function writeSnooze(snooze: Snooze): Promise<void> {
	try {
		await AsyncStorage.setItem(SNOOZE_KEY, JSON.stringify(snooze));
	} catch {
		// A snooze that cannot be persisted only means one extra prompt.
	}
}

const messageOf = (error: unknown): string =>
	error instanceof Error ? error.message : 'The update could not be completed';

export const useUpdateStore = create<UpdateStore>((set, get) => ({
	phase: 'idle',
	currentVersion: currentVersion(),
	latestVersion: null,
	notes: [],
	downloadUrl: null,
	progress: 0,
	error: null,
	bannerVisible: false,
	fileUri: null,

	hydrate: async () => {
		set({ currentVersion: currentVersion() });
	},

	check: async ({ silent = false } = {}) => {
		const { phase } = get();
		if (phase === 'checking' || phase === 'downloading') return;

		set({ phase: 'checking', error: null });

		try {
			const info = await fetchReleaseNotes();
			const running = currentVersion();

			if (!isUpdateAvailable(running, info)) {
				set({
					phase: 'up_to_date',
					currentVersion: running,
					bannerVisible: false
				});
				return;
			}

			const snooze = await readSnooze();
			const snoozed =
				snooze !== null &&
				snooze.version === info.latestVersion &&
				snooze.until > Date.now();

			if (snoozed) {
				set({ phase: 'idle', bannerVisible: false });
				return;
			}

			const channel = readSettings().updateChannel;
			set({
				phase: 'available',
				currentVersion: running,
				latestVersion: info.latestVersion,
				notes: info.notes,
				downloadUrl: releaseDownloadUrl(info, channel),
				bannerVisible: true,
				error: null
			});

			await notifyUpdateAvailable(info.latestVersion);
		} catch (error) {
			set({
				phase: silent ? 'idle' : 'error',
				error: messageOf(error)
			});
		}
	},

	dismiss: () => {
		const { latestVersion } = get();
		set({ bannerVisible: false, phase: 'idle' });

		if (latestVersion) {
			void writeSnooze({
				version: latestVersion,
				until: Date.now() + SNOOZE_MS
			});
		}
	},

	closeDialog: () => {
		const { phase } = get();
		if (phase === 'ready' || phase === 'error') {
			set({ phase: 'available' });
		}
	},

	download: async () => {
		const { downloadUrl, latestVersion, phase } = get();
		if (!downloadUrl || !latestVersion) return;
		if (phase === 'downloading' || phase === 'ready') return;

		set({ phase: 'downloading', progress: 0, error: null });

		try {
			const fileUri = await downloadUpdate(
				downloadUrl,
				latestVersion,
				fraction => set({ progress: Math.round(fraction * 100) })
			);
			set({ phase: 'ready', progress: 100, fileUri });
		} catch (error) {
			set({ phase: 'error', error: messageOf(error) });
		}
	},

	install: async () => {
		const { fileUri } = get();
		if (!fileUri) return;

		try {
			await installDownloadedUpdate(fileUri);
			await clearUpdateNotification();
			set({ phase: 'idle', bannerVisible: false, fileUri: null });
		} catch (error) {
			set({ phase: 'error', error: messageOf(error) });
		}
	}
}));
