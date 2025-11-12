import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Notification, Pagination } from '@/types';

interface NotificationStore {
   notifications: Notification[];
   unreadCount: number;
   unreadCommentNotifications: number; // For comment/post related notifications
   unreadMessageNotifications: number; // For message notifications
   isLoading: boolean;
   error: string | null;
   pagination: Pagination | null;

   // Track notifications from socket for popup display
   newSocketNotifications: Notification[];

   // Actions
   addNotification: (notification: Notification) => void;
   addNotificationFromSocket: (notification: Notification) => void;
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

   // Helper methods for specific notification types
   getUnreadCommentNotifications: () => Notification[];
   getUnreadMessageNotifications: () => Notification[];
   updateUnreadCounts: () => void;

   // Socket notifications for popup
   consumeSocketNotification: () => Notification | null;
   clearSocketNotifications: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
   devtools(
      (set, get) => ({
         notifications: [],
         unreadCount: 0,
         unreadCommentNotifications: 0,
         unreadMessageNotifications: 0,
         isLoading: false,
         error: null,
         pagination: null,
         newSocketNotifications: [],

         // Helper methods for specific notification types
         getUnreadCommentNotifications: () => {
            const { notifications } = get();
            return notifications.filter((n) => !n.isRead && ['LIKE', 'COMMENT', 'MENTION'].includes(n.type));
         },

         getUnreadMessageNotifications: () => {
            const { notifications } = get();
            return notifications.filter((n) => !n.isRead && n.type === 'MESSAGE');
         },

         updateUnreadCounts: () => {
            const { notifications } = get();
            const commentNotifications = notifications.filter(
               (n) => !n.isRead && ['LIKE', 'COMMENT', 'MENTION'].includes(n.type)
            ).length;
            const messageNotifications = notifications.filter((n) => !n.isRead && n.type === 'MESSAGE').length;

            set({
               unreadCommentNotifications: commentNotifications,
               unreadMessageNotifications: messageNotifications,
            });
         },

         addNotification: (notification) =>
            set((state) => {
               // Check if notification already exists
               const exists = state.notifications.some((n) => n.id === notification.id);
               if (exists) return state;

               // Add to beginning of array (newest first)
               const newNotifications = [notification, ...state.notifications];
               const newUnreadCount = notification.isRead ? state.unreadCount : state.unreadCount + 1;

               // Update specific notification type counts
               const commentNotifications = newNotifications.filter(
                  (n) => !n.isRead && ['LIKE', 'COMMENT', 'MENTION'].includes(n.type)
               ).length;
               const messageNotifications = newNotifications.filter((n) => !n.isRead && n.type === 'MESSAGE').length;

               return {
                  notifications: newNotifications,
                  unreadCount: newUnreadCount,
                  unreadCommentNotifications: commentNotifications,
                  unreadMessageNotifications: messageNotifications,
               };
            }),

         addNotificationFromSocket: (notification) =>
            set((state) => {
               // Check if notification already exists
               const exists = state.notifications.some((n) => n.id === notification.id);
               if (exists) return state;

               // Add to notifications and socket queue
               const newNotifications = [notification, ...state.notifications];
               const newUnreadCount = notification.isRead ? state.unreadCount : state.unreadCount + 1;

               // Update specific notification type counts
               const commentNotifications = newNotifications.filter(
                  (n) => !n.isRead && ['LIKE', 'COMMENT', 'MENTION'].includes(n.type)
               ).length;

               const messageNotifications = newNotifications.filter((n) => !n.isRead && n.type === 'MESSAGE').length;

               return {
                  notifications: newNotifications,
                  unreadCount: newUnreadCount,
                  unreadCommentNotifications: commentNotifications,
                  unreadMessageNotifications: messageNotifications,
                  newSocketNotifications: [notification, ...state.newSocketNotifications],
               };
            }),

         addNotifications: (notifications) =>
            set((state) => {
               // Filter out duplicates
               const existingIds = new Set(state.notifications.map((n) => n.id));
               const newNotifications = notifications.filter((n) => !existingIds.has(n.id));

               // Combine all notifications (existing + new)
               const allNotifications = [...state.notifications, ...newNotifications];

               // Recalculate all counts
               const unreadCount = allNotifications.filter((n) => !n.isRead).length;
               const commentNotifications = allNotifications.filter(
                  (n) => !n.isRead && ['LIKE', 'COMMENT', 'MENTION'].includes(n.type)
               ).length;
               const messageNotifications = allNotifications.filter((n) => !n.isRead && n.type === 'MESSAGE').length;

               return {
                  notifications: allNotifications,
                  unreadCount,
                  unreadCommentNotifications: commentNotifications,
                  unreadMessageNotifications: messageNotifications,
               };
            }),

         markAsRead: (notificationId) =>
            set((state) => {
               const updatedNotifications = state.notifications.map((notification) =>
                  notification.id === notificationId ? { ...notification, isRead: true } : notification
               );

               const unreadCount = updatedNotifications.filter((n) => !n.isRead).length;

               // Update specific notification type counts
               const commentNotifications = updatedNotifications.filter(
                  (n) => !n.isRead && ['LIKE', 'COMMENT', 'MENTION'].includes(n.type)
               ).length;
               const messageNotifications = updatedNotifications.filter(
                  (n) => !n.isRead && n.type === 'MESSAGE'
               ).length;

               return {
                  notifications: updatedNotifications,
                  unreadCount,
                  unreadCommentNotifications: commentNotifications,
                  unreadMessageNotifications: messageNotifications,
               };
            }),

         markAllAsRead: () =>
            set((state) => ({
               notifications: state.notifications.map((notification) => ({
                  ...notification,
                  isRead: true,
               })),
               unreadCount: 0,
               unreadCommentNotifications: 0,
               unreadMessageNotifications: 0,
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
               newSocketNotifications: [],
            }),

         setNotifications: (notifications) =>
            set(() => {
               const unreadCount = notifications.filter((n) => !n.isRead).length;

               // Update specific notification type counts
               const commentNotifications = notifications.filter(
                  (n) => !n.isRead && ['LIKE', 'COMMENT', 'MENTION'].includes(n.type)
               ).length;
               const messageNotifications = notifications.filter((n) => !n.isRead && n.type === 'MESSAGE').length;

               return {
                  notifications,
                  unreadCount,
                  unreadCommentNotifications: commentNotifications,
                  unreadMessageNotifications: messageNotifications,
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

         // Socket notifications for popup
         consumeSocketNotification: () => {
            const { newSocketNotifications } = get();
            if (newSocketNotifications.length === 0) return null;

            const notification = newSocketNotifications[0];
            set((state) => ({
               newSocketNotifications: state.newSocketNotifications.slice(1),
            }));
            return notification;
         },

         clearSocketNotifications: () => {
            set({ newSocketNotifications: [] });
         },
      }),
      {
         name: 'notification-store',
      }
   )
);

// Helper selectors
export const useUnreadNotifications = () =>
   useNotificationStore((state) => state.notifications.filter((n) => !n.isRead));

export const useUnreadCount = () => useNotificationStore((state) => state.unreadCount);

export const useUnreadCommentCount = () => useNotificationStore((state) => state.unreadCommentNotifications);

export const useUnreadMessageCount = () => useNotificationStore((state) => state.unreadMessageNotifications);

export const useNotificationsByType = (type: Notification['type']) =>
   useNotificationStore((state) => state.notifications.filter((n) => n.type === type));
