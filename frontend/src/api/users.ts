import { apiClient } from './client';
import type { User, Position } from '../types';

export interface PlayerInfo {
  id: number;
  name: string;
  preferredPosition: string;
  profilePicUrl?: string | null;
}

// Backend user response type (snake_case)
interface BackendUser {
  id: number;
  email: string;
  name: string;
  preferred_position?: string;
  profile_pic_url?: string;
  is_admin: boolean;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
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
    isActive: user.is_active ?? true,
    createdAt: user.created_at,
    updatedAt: user.updated_at || user.created_at,
  };
};

export interface UpdateProfileData {
  name?: string;
  preferredPosition?: string;
}

export const usersApi = {
  /**
   * Get current user profile
   */
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<{ success: boolean; data: { user: BackendUser } }>('/users/me');
    return transformUser(response.data.data.user);
  },

  /**
   * Update current user profile
   */
  updateMe: async (data: UpdateProfileData): Promise<User> => {
    const response = await apiClient.put<{ success: boolean; data: { user: BackendUser } }>('/users/me', data);
    return transformUser(response.data.data.user);
  },

  /**
   * Upload profile picture
   */
  uploadAvatar: async (file: File): Promise<{ profilePicUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await apiClient.post<{ success: boolean; data: { profilePicUrl: string } }>(
      '/users/me/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  /**
   * Remove profile picture
   */
  removeAvatar: async (): Promise<void> => {
    await apiClient.delete('/users/me/avatar');
  },

  /**
   * Get list of all active players
   */
  getPlayers: async (): Promise<PlayerInfo[]> => {
    const response = await apiClient.get<{ success: boolean; data: { players: Array<{
      id: number;
      name: string;
      preferred_position: string;
      profile_pic_url?: string | null;
    }> } }>('/users/players');
    // Transform snake_case to camelCase
    return response.data.data.players.map(player => ({
      id: player.id,
      name: player.name,
      preferredPosition: player.preferred_position,
      profilePicUrl: player.profile_pic_url
    }));
  },
}; 