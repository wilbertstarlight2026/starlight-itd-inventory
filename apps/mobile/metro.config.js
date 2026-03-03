// https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// expo-router requires EXPO_ROUTER_APP_ROOT to be set before bundling.
// In EAS Build, the Gradle task invokes metro directly without expo CLI,
// so the env var is not automatically set. We set it explicitly here.
if (!process.env.EXPO_ROUTER_APP_ROOT) {
  process.env.EXPO_ROUTER_APP_ROOT = path.join(__dirname, 'app');
}

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = config;
