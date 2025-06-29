import { apiClient } from './client';
import type { User, Position } from '../types';

export interface AllowedEmail {
  id: number;
  email: string;
  added_by_admin_id: number;
  used: boolean;
  created_at: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalMatches: number;
  averageAttendance: number;
}

export interface UserWithStats extends User {
  matchesPlayed: number;
  lastActive?: string;
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
  matches_played?: number;
  last_active?: string;
}

// Transform snake_case user from backend to camelCase
const transformUser = (user: BackendUser): UserWithStats => {
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
    matchesPlayed: user.matches_played || 0,
    lastActive: user.last_active
  };
};

export const adminApi = {
  /**
   * Get list of all users (admin only)
   */
  getUsers: async (): Promise<UserWithStats[]> => {
    const response = await apiClient.get<{ success: boolean; data: BackendUser[] }>('/admin/users');
    return response.data.data.map(transformUser);
  },

  /**
   * Update user status (admin only)
   */
  updateUserStatus: async (userId: number, isActive: boolean): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}/status`, { isActive });
  },

  /**
   * Get allowed emails list (admin only)
   */
  getAllowedEmails: async (): Promise<AllowedEmail[]> => {
    const response = await apiClient.get<{ success: boolean; data: AllowedEmail[] }>('/admin/allowed-emails');
    return response.data.data || [];
  },

  /**
   * Add allowed email (admin only)
   */
  addAllowedEmail: async (email: string): Promise<AllowedEmail> => {
    const response = await apiClient.post<{ success: boolean; data: AllowedEmail }>('/admin/allowed-emails', { email });
    return response.data.data;
  },

  /**
   * Remove allowed email (admin only)
   */
  removeAllowedEmail: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/allowed-emails/${id}`);
  },

  /**
   * Get admin dashboard stats
   */
  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get<{ success: boolean; data: AdminStats }>('/admin/stats');
    return response.data.data;
  },
}; 