import { create } from 'zustand';
import type { Notification } from '../types';

interface UIState {
  isLoading: boolean;
  notifications: Notification[];
  
  // Actions
  setLoading: (loading: boolean) => void;
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoading: false,
  notifications: [],

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  showNotification: (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-remove notification after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, newNotification.duration);
    }
  },

  clearNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAllNotifications: () => set({ notifications: [] }),
})); 