import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authApi } from '../api';
import { clearAuthStorage } from '../utils';

interface UserState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, nickname?: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (nickname?: string, avatarUrl?: string) => Promise<void>;
  clearError: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (phone, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authApi.login({ phone, password });
          const { token, user } = data.data;
          set({ user, token, isLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : '登录失败';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      register: async (phone, password, nickname) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authApi.register({ phone, password, nickname });
          const { token, user } = data.data;
          set({ user, token, isLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : '注册失败';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      logout: () => {
        clearAuthStorage();
        set({ user: null, token: null });
      },

      fetchProfile: async () => {
        if (!get().token) return;
        try {
          const { data } = await authApi.getProfile();
          set({ user: data.data });
        } catch {
          // If profile fetch fails, clear auth state
          get().logout();
        }
      },

      updateProfile: async (nickname, avatarUrl) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authApi.updateProfile({
            nickname,
            avatar_url: avatarUrl,
          });
          set({ user: data.data, isLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : '更新失败';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
