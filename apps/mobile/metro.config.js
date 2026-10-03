const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Support pnpm workspaces: let Metro resolve packages from the monorepo root.
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
