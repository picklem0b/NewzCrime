#!/usr/bin/env node
/**
 * Writes the release signing config into the generated Android project.
 *
 * Expo's prebuild generates `android/app/build.gradle` with the release build
 * signed by the debug key. That is fine for a local experiment and wrong for
 * this app: the in-app updater installs the APK over the running build, and
 * Android refuses an upgrade whose signing certificate changed. Every build has
 * to be signed by the same key, so CI supplies one from secrets.
 *
 * Run after `expo prebuild`, with:
 *   ANDROID_KEYSTORE_PATH, ANDROID_KEYSTORE_PASSWORD,
 *   ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD
 *
 * Fails loudly rather than silently producing an APK that cannot be installed
 * over the current one.
 */

const fs = require('node:fs');
const path = require('node:path');

const REQUIRED = [
	'ANDROID_KEYSTORE_PATH',
	'ANDROID_KEYSTORE_PASSWORD',
	'ANDROID_KEY_ALIAS',
	'ANDROID_KEY_PASSWORD'
];

const missing = REQUIRED.filter(name => !process.env[name]);
if (missing.length > 0) {
	console.error(
		`Missing signing environment: ${missing.join(', ')}. ` +
			'Refusing to build an APK that cannot replace the installed one.'
	);
	process.exit(1);
}

const gradlePath = path.join(
	__dirname,
	'..',
	'android',
	'app',
	'build.gradle'
);

if (!fs.existsSync(gradlePath)) {
	console.error(`No ${gradlePath}. Run "expo prebuild --platform android" first.`);
	process.exit(1);
}

const marker = '// newzcrime: release signing';
let source = fs.readFileSync(gradlePath, 'utf8');

if (source.includes(marker)) {
	console.log('Release signing already configured.');
	process.exit(0);
}

const signingBlock = `${marker}
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
`;

const withSigningConfigs = source.replace(
	/signingConfigs\s*\{/,
	match => `${match}\n        ${signingBlock}`
);

if (withSigningConfigs === source) {
	console.error('Could not find signingConfigs { } in app/build.gradle.');
	process.exit(1);
}

const releasePattern = /release\s*\{([\s\S]*?)signingConfig\s+signingConfigs\.debug/;

if (!releasePattern.test(withSigningConfigs)) {
	console.error(
		'Could not find the release build type signingConfig in app/build.gradle.'
	);
	process.exit(1);
}

source = withSigningConfigs.replace(
	releasePattern,
	(_match, body) => `release {${body}signingConfig signingConfigs.release`
);

fs.writeFileSync(gradlePath, source);
console.log('Release signing configured.');
