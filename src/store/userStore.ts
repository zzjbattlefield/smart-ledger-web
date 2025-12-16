import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: number;
  phone: string;
  nickname: string;
  avatar_url?: string;
}

interface UserState {
  token: string | null;
  userInfo: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: null,
      userInfo: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, userInfo: user, isAuthenticated: true }),
      logout: () => set({ token: null, userInfo: null, isAuthenticated: false }),
    }),
    {
      name: 'smart-ledger-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
