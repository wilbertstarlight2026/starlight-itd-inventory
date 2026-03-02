import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';

const BASE_URL = (Constants.expoConfig?.extra?.apiUrl as string | undefined) || 'http://192.168.1.100:3000/api/v1';

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, updateAccessToken, clearAuth } = useAuthStore.getState();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      await clearAuth();
      return null;
    }

    const data = await res.json() as { data: { access_token: string } };
    await updateAccessToken(data.data.access_token);
    return data.data.access_token;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' })) as { error?: string };
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string, device_id?: string) =>
    apiRequest<{ success: boolean; data: { access_token: string; refresh_token: string; user: import('@starlight/shared').User } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password, device_id }) }
    ),

  logout: (refresh_token: string) =>
    apiRequest('/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token }) }),

  me: () => apiRequest<{ data: import('@starlight/shared').User }>('/auth/me'),
};

// ─── Items ───────────────────────────────────────────────────

export const itemsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest<import('@starlight/shared').PaginatedResponse<import('@starlight/shared').Item>>(`/items${qs}`);
  },

  get: (id: string) =>
    apiRequest<{ data: import('@starlight/shared').Item }>(`/items/${id}`),

  scan: (code: string) =>
    apiRequest<{ data: import('@starlight/shared').Item }>(`/items/scan/${encodeURIComponent(code)}`),

  create: (data: import('@starlight/shared').CreateItemRequest) =>
    apiRequest<{ data: import('@starlight/shared').Item }>('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: import('@starlight/shared').UpdateItemRequest) =>
    apiRequest<{ data: import('@starlight/shared').Item }>(`/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest(`/items/${id}`, { method: 'DELETE' }),
};

// ─── Assignments ─────────────────────────────────────────────

export const assignmentsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest<{ data: import('@starlight/shared').Assignment[] }>(`/assignments${qs}`);
  },

  assign: (data: import('@starlight/shared').AssignItemRequest) =>
    apiRequest<{ data: import('@starlight/shared').Assignment }>('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  return: (id: string) =>
    apiRequest(`/assignments/${id}/return`, { method: 'POST' }),
};

// ─── Reports ─────────────────────────────────────────────────

export const reportsApi = {
  dashboard: () =>
    apiRequest<{ data: import('@starlight/shared').DashboardSummary }>('/reports/dashboard'),

  generate: (params: import('@starlight/shared').ReportRequest) =>
    fetch(
      `${BASE_URL}/reports/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: JSON.stringify(params),
      }
    ),
};

// ─── Sync ────────────────────────────────────────────────────

export const syncApi = {
  sync: (payload: import('@starlight/shared').SyncPayload) =>
    apiRequest<{ data: import('@starlight/shared').SyncResponse }>('/sync', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// ─── Reference Data ──────────────────────────────────────────

export const refApi = {
  categories: () => apiRequest<{ data: import('@starlight/shared').Category[] }>('/categories'),
  departments: () => apiRequest<{ data: import('@starlight/shared').Department[] }>('/departments'),
  locations: () => apiRequest<{ data: import('@starlight/shared').Location[] }>('/locations'),
};
