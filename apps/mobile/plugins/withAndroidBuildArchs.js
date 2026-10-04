const { withGradleProperties } = require('@expo/config-plugins');

/**
 * The ABIs React Native ships prebuilt native libraries for.
 *
 * @see https://reactnative.dev/docs/build-speed
 */
const ANDROID_ABIS = ['armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'];

/** The Gradle property the React Native Gradle plugin reads to set `abiFilters`. */
const REACT_NATIVE_ARCHITECTURES = 'reactNativeArchitectures';

/**
 * Restricts the Android build to a chosen set of ABIs.
 *
 * React Native ships prebuilt native libraries for four ABIs, so by default
 * every APK carries four copies of each `.so` file — most of them for CPUs no
 * phone in the target market has. Narrowing the list to `arm64-v8a` removes the
 * other three copies, which is the single largest reduction available in APK
 * size without giving anything up.
 *
 * This writes `reactNativeArchitectures` into `android/gradle.properties`. The
 * React Native Gradle plugin reads that property through
 * `PropertyUtils.REACT_NATIVE_ARCHITECTURES` and narrows the app's `ndk {
 * abiFilters }`, so the excluded libraries are never packaged.
 *
 * Written as a config plugin rather than a dependency on
 * `expo-build-properties` because the SDK 52 release of that plugin does not
 * expose an architecture option; its `buildArchs` property arrived later.
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

  return withGradleProperties(config, (config) => {
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
};

module.exports = withAndroidBuildArchs;
