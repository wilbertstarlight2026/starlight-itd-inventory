// https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// expo-router requires EXPO_ROUTER_APP_ROOT to be set before bundling.
// In EAS Build, the Gradle task invokes metro directly without expo CLI,
// so the env var is not automatically set.
if (!process.env.EXPO_ROUTER_APP_ROOT) {
  process.env.EXPO_ROUTER_APP_ROOT = path.join(__dirname, 'app');
}

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Monorepo: watch all packages from the workspace root
config.watchFolders = [monorepoRoot];

// Monorepo: resolve modules from project first, then workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Force 'react-native' to always resolve to the top-level package (0.74.5).
// expo@51.0.39 nests react-native@0.84.x which uses TypeScript 'as' syntax
// that is incompatible with the Flow/Babel transformer used in Expo SDK 51.
// Without this, metro picks up expo/node_modules/react-native and fails.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native') {
    return {
      filePath: path.resolve(projectRoot, 'node_modules/react-native/index.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
