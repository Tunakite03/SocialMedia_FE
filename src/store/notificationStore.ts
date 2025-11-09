import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Notification, Pagination } from '@/types';

interface NotificationStore {
   notifications: Notification[];
   unreadCount: number;
   isLoading: boolean;
   error: string | null;
   pagination: Pagination | null;

   // Actions
   addNotification: (notification: Notification) => void;
   addNotifications: (notifications: Notification[]) => void;
   markAsRead: (notificationId: string) => void;
   markAllAsRead: () => void;
   removeNotification: (notificationId: string) => void;
   clearNotifications: () => void;
   setNotifications: (notifications: Notification[]) => void;
   setUnreadCount: (count: number) => void;
   setPagination: (pagination: Pagination) => void;
   setLoading: (loading: boolean) => void;
   setError: (error: string | null) => void;

   // Optimistic updates
   optimisticMarkAsRead: (notificationId: string) => void;
   optimisticMarkAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
   devtools(
      persist(
         (set, get) => ({
            notifications: [],
            unreadCount: 0,
            isLoading: false,
            error: null,
            pagination: null,

            addNotification: (notification) =>
               set((state) => {
                  // Check if notification already exists
                  const exists = state.notifications.some((n) => n.id === notification.id);
                  if (exists) return state;

                  // Add to beginning of array (newest first)
                  const newNotifications = [notification, ...state.notifications];
                  const newUnreadCount = notification.isRead ? state.unreadCount : state.unreadCount + 1;

                  return {
                     notifications: newNotifications,
                     unreadCount: newUnreadCount,
                  };
               }),

            addNotifications: (notifications) =>
               set((state) => {
                  // Filter out duplicates
                  const existingIds = new Set(state.notifications.map((n) => n.id));
                  const newNotifications = notifications.filter((n) => !existingIds.has(n.id));

                  return {
                     notifications: [...state.notifications, ...newNotifications],
                  };
               }),

            markAsRead: (notificationId) =>
               set((state) => {
                  const updatedNotifications = state.notifications.map((notification) =>
                     notification.id === notificationId ? { ...notification, isRead: true } : notification
                  );

                  const unreadCount = updatedNotifications.filter((n) => !n.isRead).length;

                  return {
                     notifications: updatedNotifications,
                     unreadCount,
                  };
               }),

            markAllAsRead: () =>
               set((state) => ({
                  notifications: state.notifications.map((notification) => ({
                     ...notification,
                     isRead: true,
                  })),
                  unreadCount: 0,
               })),

            removeNotification: (notificationId) =>
               set((state) => {
                  const filteredNotifications = state.notifications.filter(
                     (notification) => notification.id !== notificationId
                  );
                  const unreadCount = filteredNotifications.filter((n) => !n.isRead).length;

                  return {
                     notifications: filteredNotifications,
                     unreadCount,
                  };
               }),

            clearNotifications: () =>
               set({
                  notifications: [],
                  unreadCount: 0,
                  pagination: null,
                  error: null,
               }),

            setNotifications: (notifications) =>
               set(() => {
                  const unreadCount = notifications.filter((n) => !n.isRead).length;

                  return {
                     notifications,
                     unreadCount,
                  };
               }),

            setUnreadCount: (count) => set({ unreadCount: count }),

            setPagination: (pagination) => set({ pagination }),

            setLoading: (loading) => set({ isLoading: loading }),

            setError: (error) => set({ error }),

            // Optimistic updates
            optimisticMarkAsRead: (notificationId) => {
               const { markAsRead } = get();
               markAsRead(notificationId);
            },

            optimisticMarkAllAsRead: () => {
               const { markAllAsRead } = get();
               markAllAsRead();
            },
         }),
         {
            name: 'notification-store',
            partialize: (state) => ({
               // Only persist notifications and unread count
               notifications: state.notifications,
               unreadCount: state.unreadCount,
            }),
         }
      ),
      {
         name: 'notification-store',
      }
   )
);

// Helper selectors
export const useUnreadNotifications = () =>
   useNotificationStore((state) => state.notifications.filter((n) => !n.isRead));

export const useUnreadCount = () => useNotificationStore((state) => state.unreadCount);

export const useNotificationsByType = (type: Notification['type']) =>
   useNotificationStore((state) => state.notifications.filter((n) => n.type === type));
