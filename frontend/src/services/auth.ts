import { api } from './api';
import { useAuth } from '@/store/auth';
import type { AuthResponse } from '@/types';

export async function login(email: string, password: string) {
  const { data } = await api.post<{ data: AuthResponse }>('/auth/login', { email, password });
  useAuth.getState().setAuth(data.data);
  return data.data.user;
}

export async function register(input: {
  fullName: string; email: string; password: string; role?: string;
}) {
  const { data } = await api.post<{ data: AuthResponse }>('/auth/register', input);
  useAuth.getState().setAuth(data.data);
  return data.data.user;
}

export async function logout() {
  const { refreshToken, clear } = useAuth.getState();
  try {
    await api.post('/auth/logout', { refreshToken });
  } finally {
    clear();
  }
}
