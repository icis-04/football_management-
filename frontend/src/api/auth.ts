import { apiClient } from './client';
import type { LoginCredentials, SignupData, AuthTokens, User, Position } from '../types';

interface AuthResponse extends AuthTokens {
  user: User;
}

// Backend user response type (snake_case)
interface BackendUser {
  id: number;
  email: string;
  name: string;
  preferred_position?: string;
  profile_pic_url?: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BackendAuthResponse {
  success: boolean;
  data: {
    user: BackendUser;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
  message?: string;
}

// Transform snake_case user from backend to camelCase
const transformUser = (user: BackendUser): User => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    preferredPosition: user.preferred_position as Position | undefined,
    profilePicUrl: user.profile_pic_url,
    isAdmin: user.is_admin,
    isActive: user.is_active,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
};

export const authApi = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<BackendAuthResponse>('/auth/login', credentials);
    const { data } = response.data;
    return {
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
      user: transformUser(data.user),
    };
  },

  /**
   * Sign up a new user
   */
  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await apiClient.post<BackendAuthResponse>('/auth/signup', data);
    const { data: responseData } = response.data;
    return {
      accessToken: responseData.tokens.accessToken,
      refreshToken: responseData.tokens.refreshToken,
      user: transformUser(responseData.user),
    };
  },

  /**
   * Verify if an email is allowed to register
   */
  verifyEmail: async (email: string): Promise<{ allowed: boolean }> => {
    const response = await apiClient.get<{ allowed: boolean }>('/auth/verify-email', {
      params: { email },
    });
    return response.data;
  },

  /**
   * Get current user profile
   */
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<{ success: boolean; data: { user: BackendUser } }>('/auth/me');
    return transformUser(response.data.data.user);
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<{ success: boolean; data: { user: BackendUser } }>('/auth/me', data);
    return transformUser(response.data.data.user);
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