import { apiClient } from './client';
import type { LoginCredentials, SignupData, AuthTokens, User } from '../types';
import { mockAuth } from './mockServer';

interface AuthResponse extends AuthTokens {
  user: User;
}

// Use mock server in development
const USE_MOCK = import.meta.env.DEV;

export const authApi = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    if (USE_MOCK) {
      return mockAuth.login(credentials.email, credentials.password);
    }
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Sign up a new user
   */
  signup: async (data: SignupData): Promise<AuthResponse> => {
    if (USE_MOCK) {
      return mockAuth.signup(data.email, data.password, data.name, data.preferredPosition || 'any');
    }
    const response = await apiClient.post<AuthResponse>('/auth/signup', data);
    return response.data;
  },

  /**
   * Verify if an email is allowed to register
   */
  verifyEmail: async (email: string): Promise<{ allowed: boolean }> => {
    if (USE_MOCK) {
      return mockAuth.verifyEmail(email);
    }
    const response = await apiClient.get<{ allowed: boolean }>('/auth/verify-email', {
      params: { email },
    });
    return response.data;
  },

  /**
   * Logout the current user
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  /**
   * Refresh the access token
   */
  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    const response = await apiClient.post<AuthTokens>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },
}; 