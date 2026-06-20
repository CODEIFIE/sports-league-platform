import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuth } from '@/store/auth';

// Resolution order: runtime config (public/config.js, editable on the host)
// → build-time VITE_API_URL → same-origin (dev proxy / reverse proxy).
export const API_BASE =
  (typeof window !== 'undefined' && window.__APP_CONFIG__?.apiUrl) ||
  import.meta.env.VITE_API_URL ||
  '';
export const api = axios.create({ baseURL: `${API_BASE}/api` });

api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setAccessToken, clear } = useAuth.getState();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, { refreshToken });
    const newToken = data.data.accessToken as string;
    useAuth.setState({ refreshToken: data.data.refreshToken });
    setAccessToken(newToken);
    return newToken;
  } catch {
    clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry && useAuth.getState().refreshToken) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const token = await refreshing;
      refreshing = null;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

/** Extracts a human message from an axios error. */
export function apiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { error?: string })?.error ?? err.message;
  }
  return 'Something went wrong';
}
