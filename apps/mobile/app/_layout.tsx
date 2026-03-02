import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { useAuthStore } from '../src/store/authStore';
import { initLocalDB } from '../src/services/LocalDB';
import { startSyncListener } from '../src/sync/SyncEngine';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1E3A5F',
    secondary: '#2E86AB',
    surface: '#FFFFFF',
    background: '#F5F7FA',
  },
};

export default function RootLayout() {
  const { isLoading, isAuthenticated, loadStoredAuth } = useAuthStore();

  useEffect(() => {
    async function init() {
      await initLocalDB();
      await loadStoredAuth();
    }
    void init();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        startSyncListener();
        router.replace('/(tabs)');
      } else {
        router.replace('/auth/login');
      }
    }
  }, [isLoading, isAuthenticated]);

  return (
    <PaperProvider theme={theme}>
      <StatusBar style="light" backgroundColor="#1E3A5F" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </PaperProvider>
  );
}
