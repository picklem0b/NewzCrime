/**
 * Download and install a build, without leaving for a downloads page.
 *
 * Android will not open a `file://` path handed to another app, so the
 * downloaded APK is converted to the FileProvider `content://` URI that
 * `expo-file-system` exposes and the package installer is started with an
 * explicit VIEW intent. On any other platform there is nothing to install and
 * the caller falls back to the release page.
 */

import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';

import { apkFileName, isInstallSupported } from '@/utils/update';

/** Where builds are kept between launches. */
const UPDATE_DIRECTORY = `${FileSystem.documentDirectory ?? ''}updates/`;

export class InstallUnsupportedError extends Error {
	constructor() {
		super('Installing an update is only supported on Android');
		this.name = 'InstallUnsupportedError';
	}
}

/** True when this build can download and install an APK. */
export function canInstallUpdates(): boolean {
	return isInstallSupported(Platform.OS) && Boolean(FileSystem.documentDirectory);
}

/**
 * Downloads the APK, replacing any earlier copy of the same version.
 *
 * Returns the local `file://` URI. Progress is a 0–1 fraction; a server that
 * sends no content length reports 0 rather than dividing by zero.
 */
export async function downloadUpdate(
	url: string,
	version: string,
	onProgress?: (fraction: number) => void
): Promise<string> {
	if (!canInstallUpdates()) throw new InstallUnsupportedError();

	await FileSystem.makeDirectoryAsync(UPDATE_DIRECTORY, {
		intermediates: true
	});

	const target = `${UPDATE_DIRECTORY}${apkFileName(version)}`;
	const existing = await FileSystem.getInfoAsync(target);
	if (existing.exists) {
		await FileSystem.deleteAsync(target, { idempotent: true });
	}

	const download = FileSystem.createDownloadResumable(url, target, {}, event => {
		const total = event.totalBytesExpectedToWrite;
		onProgress?.(total > 0 ? event.totalBytesWritten / total : 0);
	});

	const result = await download.downloadAsync();
	if (!result?.uri) throw new Error('The update did not download');

	return result.uri;
}

/** Opens the system installer for a downloaded APK. */
export async function installDownloadedUpdate(fileUri: string): Promise<void> {
	const contentUri = await FileSystem.getContentUriAsync(fileUri);

	await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
		data: contentUri,
		type: 'application/vnd.android.package-archive',
		flags: 1
	});
}

/** Deletes a build once it has been installed. */
export async function discardDownload(fileUri: string): Promise<void> {
	try {
		await FileSystem.deleteAsync(fileUri, { idempotent: true });
	} catch {
		// The installer owns the file now; failing to clean up is harmless.
	}
}
