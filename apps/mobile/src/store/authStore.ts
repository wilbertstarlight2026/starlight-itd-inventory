import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User } from '@starlight/shared';

const ACCESS_TOKEN_KEY = 'starlight_access_token';
const REFRESH_TOKEN_KEY = 'starlight_refresh_token';
const USER_KEY = 'starlight_user';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  updateAccessToken: (token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  loadStoredAuth: async () => {
    try {
      const [token, refresh, userJson] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      if (token && refresh && userJson) {
        const user = JSON.parse(userJson) as User;
        set({ user, accessToken: token, refreshToken: refresh, isAuthenticated: true });
      }
    } catch {
      // Storage read failure — start unauthenticated
    } finally {
      set({ isLoading: false });
    }
  },

  updateAccessToken: async (token) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    set({ accessToken: token });
  },
}));
