const { withAppBuildGradle, withGradleProperties } = require('@expo/config-plugins');

/**
 * The ABIs React Native ships prebuilt native libraries for.
 *
 * @see https://reactnative.dev/docs/build-speed
 */
const ANDROID_ABIS = ['armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'];

/** The Gradle property the React Native Gradle plugin reads to set `abiFilters`. */
const REACT_NATIVE_ARCHITECTURES = 'reactNativeArchitectures';

/** Marks the block this plugin appends, so a second run does not add a second one. */
const APPENDED_MARKER = 'withAndroidBuildArchs';

/**
 * Restricts the Android build to a chosen set of ABIs.
 *
 * React Native ships prebuilt native libraries for four ABIs, so by default
 * every APK carries four copies of each `.so` file — most of them for CPUs no
 * phone in the target market has. Narrowing the list to `arm64-v8a` removes the
 * other three copies, which is the single largest reduction available in APK
 * size without giving anything up.
 *
 * Two things have to be written, not one, because there are two code paths that
 * decide what gets packaged:
 *
 * 1. `reactNativeArchitectures` in `android/gradle.properties`. The React
 *    Native Gradle plugin reads it through `PropertyUtils` and applies
 *    `ndk { abiFilters }` from `NdkConfiguratorUtils` — **but only when the New
 *    Architecture is enabled**, because that method returns early otherwise.
 * 2. An explicit `abiFilters` block appended to `app/build.gradle`. `app.json`
 *    sets `newArchEnabled: false` — `react-native-track-player` needs the old
 *    architecture — which puts the property in (1) out of reach. Without this
 *    second write the filter would be silently ignored and the package would
 *    carry all four ABIs again.
 *
 * `abiFilters` is a set on the Android DSL, so `.addAll` adds to whatever else
 * configured rather than replacing it. If the New Architecture is ever turned
 * back on, both writes ask for the same list and the result is unchanged.
 *
 * Written as a config plugin rather than a dependency on `expo-build-properties`
 * because the SDK 52 release of that plugin (0.13.3) does not expose an
 * architecture option at all; its `buildArchs` property arrived with a later SDK.
 *
 * @param {import('@expo/config-types').ExpoConfig} config
 * @param {{ archs?: string[] }} [props]
 * @returns {import('@expo/config-types').ExpoConfig}
 */
const withAndroidBuildArchs = (config, props = {}) => {
  const archs = props.archs ?? ['arm64-v8a'];

  if (archs.length === 0) {
    throw new Error(
      'withAndroidBuildArchs: `archs` is empty. Name at least one ABI, or remove the plugin.'
    );
  }

  const unknown = archs.filter((abi) => !ANDROID_ABIS.includes(abi));

  if (unknown.length > 0) {
    throw new Error(
      `withAndroidBuildArchs: unknown ABI ${unknown.join(', ')}. ` +
        `Supported ABIs are ${ANDROID_ABIS.join(', ')}.`
    );
  }

  const withGradleProperty = withGradleProperties(config, (config) => {
    // Prebuild supplies the template's own `reactNativeArchitectures` entry, so
    // replacing it rather than adding a second one is what makes the setting
    // take effect.
    config.modResults = config.modResults.filter(
      (entry) => !(entry.type === 'property' && entry.key === REACT_NATIVE_ARCHITECTURES)
    );

    config.modResults.push({
      type: 'property',
      key: REACT_NATIVE_ARCHITECTURES,
      value: archs.join(','),
    });

    return config;
  });

  return withAppBuildGradle(withGradleProperty, (config) => {
    if (config.modResults.language !== 'groovy') {
      throw new Error(
        'withAndroidBuildArchs: app/build.gradle is not Groovy, so the ABI filter ' +
          'could not be applied. Narrowing the ABIs by hand is the alternative.'
      );
    }

    if (config.modResults.contents.includes(APPENDED_MARKER)) {
      return config;
    }

    const abiList = archs.map((abi) => `"${abi}"`).join(', ');

    config.modResults.contents += `
// ${APPENDED_MARKER}: pins the packaged native libraries to ${archs.join(', ')}.
// The React Native Gradle plugin only applies \`reactNativeArchitectures\` when
// the New Architecture is enabled, and this app runs the old architecture, so
// the filter is applied here as well.
android {
    defaultConfig {
        ndk {
            abiFilters.addAll([${abiList}])
        }
    }
}
`;

    return config;
  });
};

module.exports = withAndroidBuildArchs;
