import { apiClient } from './client';

export interface Notification {
  id: number;
  userId: number;
  type: 'availability_reminder' | 'team_announcement' | 'admin_update' | 'match_update';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  availability_reminders: boolean;
  team_announcements: boolean;
  admin_updates: boolean;
  reminder_hours_before: number;
}

export const notificationsApi = {
  /**
   * Get user notifications
   */
  getNotifications: async (): Promise<Notification[]> => {
    const response = await apiClient.get<{ success: boolean; data: { notifications: Notification[] } }>('/notifications');
    return response.data.data.notifications || [];
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id: number): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },

  /**
   * Get notification preferences
   */
  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await apiClient.get<{ success: boolean; data: { preferences: NotificationPreferences } }>('/notifications/preferences');
    return response.data.data.preferences;
  },

  /**
   * Update notification preferences
   */
  updatePreferences: async (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const response = await apiClient.put<{ success: boolean; data: { preferences: NotificationPreferences } }>('/notifications/preferences', preferences);
    return response.data.data.preferences;
  },

  /**
   * Send test notification (for testing)
   */
  sendTestNotification: async (): Promise<void> => {
    await apiClient.post('/notifications/test');
  },
}; 