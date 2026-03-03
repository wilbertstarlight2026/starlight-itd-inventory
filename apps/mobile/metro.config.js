// https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

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

// expo-router v3 reads routerRoot from customTransformOptions (NOT process.env).
// @expo/metro-config's babel-transformer.js reads:
//   options.customTransformOptions?.routerRoot
// Setting it here ensures EAS Build (which invokes Gradle/Metro directly
// without the Expo CLI that normally injects this option) finds the app/ dir.
config.transformer.customTransformOptions = {
  ...config.transformer.customTransformOptions,
  routerRoot: 'app',
};

module.exports = config;
