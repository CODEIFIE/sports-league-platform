import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (data: { user: User; accessToken: string; refreshToken: string }) => void;
  setAccessToken: (token: string) => void;
  clear: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (data) =>
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken }),
      setAccessToken: (token) => set({ accessToken: token }),
      clear: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'sl-auth' },
  ),
);

export const isAdmin = (role?: string) =>
  role === 'SUPER_ADMIN' || role === 'TOURNAMENT_ADMIN';
export const canScore = (role?: string) =>
  role === 'SUPER_ADMIN' || role === 'TOURNAMENT_ADMIN' || role === 'MATCH_OFFICIAL';
