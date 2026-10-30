/** Update helpers: file naming, channel choice and progress maths. */

import { describe, expect, it } from 'vitest';

import {
	apkFileName,
	isInstallSupported,
	progressPercent,
	releaseDownloadUrl
} from '../update';

describe('apkFileName', () => {
	it('names the build after its version', () => {
		expect(apkFileName('1.15.15')).toBe('newzcrime-1.15.15.apk');
	});

	it('strips characters that do not belong in a file name', () => {
		expect(apkFileName('1.15.15 beta/2')).toBe('newzcrime-1.15.15-beta-2.apk');
	});

	it('trims surrounding whitespace', () => {
		expect(apkFileName(' 1.15.15 ')).toBe('newzcrime-1.15.15.apk');
	});
});

describe('install support', () => {
	it('supports Android only', () => {
		expect(isInstallSupported('android')).toBe(true);
		expect(isInstallSupported('ios')).toBe(false);
		expect(isInstallSupported('web')).toBe(false);
	});
});

describe('releaseDownloadUrl', () => {
	const info = {
		downloadUrl: 'https://example.com/stable.apk',
		betaDownloadUrl: 'https://example.com/beta.apk'
	};

	it('uses the stable build on the stable channel', () => {
		expect(releaseDownloadUrl(info, 'stable')).toBe(info.downloadUrl);
	});

	it('uses the beta build on the beta channel', () => {
		expect(releaseDownloadUrl(info, 'beta')).toBe(info.betaDownloadUrl);
	});

	it('falls back to stable when a beta build is not published', () => {
		expect(
			releaseDownloadUrl({ downloadUrl: info.downloadUrl }, 'beta')
		).toBe(info.downloadUrl);
	});
});

describe('progressPercent', () => {
	it('rounds and clamps', () => {
		expect(progressPercent(1, 4)).toBe(25);
		expect(progressPercent(3, 3)).toBe(100);
		expect(progressPercent(5, 3)).toBe(100);
	});

	it('reports zero when the total is unknown', () => {
		expect(progressPercent(100, 0)).toBe(0);
		expect(progressPercent(100, Number.NaN)).toBe(0);
	});
});
