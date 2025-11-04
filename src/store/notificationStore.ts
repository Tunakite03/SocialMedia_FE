import { create } from 'zustand';
import type { Notification } from '@/types';

interface NotificationStore {
   notifications: Notification[];
   unreadCount: number;

   // Actions
   addNotification: (notification: Notification) => void;
   markAsRead: (notificationId: string) => void;
   markAllAsRead: () => void;
   removeNotification: (notificationId: string) => void;
   clearNotifications: () => void;
   setNotifications: (notifications: Notification[]) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
   notifications: [],
   unreadCount: 0,

   addNotification: (notification) =>
      set((state) => {
         const newNotifications = [notification, ...state.notifications];
         const unreadCount = newNotifications.filter((n) => !n.isRead).length;

         return {
            notifications: newNotifications,
            unreadCount,
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
         const filteredNotifications = state.notifications.filter((notification) => notification.id !== notificationId);
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
      }),

   setNotifications: (notifications) =>
      set(() => {
         const unreadCount = notifications.filter((n) => !n.isRead).length;

         return {
            notifications,
            unreadCount,
         };
      }),
}));
