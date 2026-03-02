import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { refreshToken, updateAccessToken, clearAuth } = useAuthStore.getState();

      if (!refreshToken) {
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const res = await axios.post<{ data: { access_token: string } }>(
          `${BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );
        updateAccessToken(res.data.data.access_token);
        original.headers.Authorization = `Bearer ${res.data.data.access_token}`;
        return api(original);
      } catch {
        clearAuth();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
