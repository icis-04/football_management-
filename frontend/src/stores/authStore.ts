import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginCredentials, SignupData } from '../types';
import { setTokens, clearTokens } from '../api/client';
import { authApi } from '../api/auth';
import { apiClient } from '../api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const { accessToken, refreshToken, user } = await authApi.login(credentials);
          
          setTokens(accessToken, refreshToken);
          
          set({
            user,
            isAuthenticated: true,
            isAdmin: user.isAdmin,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      signup: async (data: SignupData) => {
        set({ isLoading: true, error: null });
        try {
          const { accessToken, refreshToken, user } = await authApi.signup(data);
          
          setTokens(accessToken, refreshToken);
          
          set({
            user,
            isAuthenticated: true,
            isAdmin: user.isAdmin,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Signup failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Continue with logout even if API call fails
        }
        clearTokens();
        set({
          user: null,
          isAuthenticated: false,
          isAdmin: false,
          error: null,
        });
      },

      refreshUser: async () => {
        try {
          // For mock development, just check if we have tokens
          if (import.meta.env.DEV) {
            const token = localStorage.getItem('access_token');
            if (!token) {
              get().logout();
              return;
            }
            // Keep existing user data in development
            return;
          }
          
          const response = await apiClient.get<User>('/users/me');
          const user = response.data;
          
          set({
            user,
            isAuthenticated: true,
            isAdmin: user.isAdmin,
          });
        } catch {
          get().logout();
        }
      },

      updateUser: (user: User) => {
        set({ user });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    }
  )
); 