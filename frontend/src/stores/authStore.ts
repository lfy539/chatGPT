import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginRequest, RegisterRequest } from '../types';
import { authService } from '../services/auth';

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(data);
          set({ token: response.access_token });
          
          // 获取用户信息
          const user = await authService.getCurrentUser();
          set({ user, isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.detail || '登录失败';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          await authService.register(data);
          set({ isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.detail || '注册失败';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null });
      },

      fetchUser: async () => {
        const { token } = get();
        if (!token) return;
        
        set({ isLoading: true });
        try {
          const user = await authService.getCurrentUser();
          set({ user, isLoading: false });
        } catch (error) {
          set({ user: null, token: null, isLoading: false });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
