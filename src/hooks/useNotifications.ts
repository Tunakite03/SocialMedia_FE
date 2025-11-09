import { useCallback, useEffect, useState } from 'react';
import { notificationService } from '@/services';
import { useNotificationStore } from '@/store';
import type { Notification, Pagination } from '@/types';

interface UseNotificationsReturn {
   notifications: Notification[];
   unreadCount: number;
   isLoading: boolean;
   isLoadingMore: boolean;
   error: string | null;
   loadMoreError: string | null;
   pagination: Pagination | null;
   hasNextPage: boolean;

   // Actions
   loadNotifications: (params?: { limit?: number; offset?: number }) => Promise<void>;
   loadMoreNotifications: () => Promise<void>;
   markAsRead: (notificationId: string) => Promise<void>;
   markAllAsRead: () => Promise<void>;
   refresh: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
   const {
      notifications,
      unreadCount,
      isLoading,
      error,
      pagination,
      setNotifications,
      setUnreadCount,
      setPagination,
      setLoading,
      setError,
      addNotifications,
      optimisticMarkAsRead,
      optimisticMarkAllAsRead,
   } = useNotificationStore();

   const [isLoadingMore, setIsLoadingMore] = useState(false);
   const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

   const loadNotifications = useCallback(
      async (params?: { limit?: number; offset?: number }) => {
         try {
            setLoading(true);
            setError(null);

            const response = await notificationService.getNotifications({
               limit: params?.limit || 20,
               offset: params?.offset || 0,
            });

            if (response.success && response.data) {
               const { notifications: rawNotifications, unreadCount: newUnreadCount } = response.data;
               const { pagination: newPagination } = response;

               // Filter out any malformed notifications
               const validNotifications = rawNotifications.filter((notification: any) => {
                  return (
                     notification && notification.id && notification.type && notification.title && notification.message
                  );
               });

               if (params?.offset === 0 || !params?.offset) {
                  // Initial load or refresh - replace all notifications
                  setNotifications(validNotifications);
               } else {
                  // Load more - append notifications
                  addNotifications(validNotifications);
               }
               if (newPagination) {
                  setPagination(newPagination);
               }
               setUnreadCount(newUnreadCount);
            } else {
               console.error('Initial load failed:', response.error);
               setError(response.error || 'Failed to load notifications');
            }
         } catch (error) {
            console.error('Error loading notifications:', error);
            setError('Failed to load notifications');
         } finally {
            setLoading(false);
         }
      },
      [setNotifications, addNotifications, setPagination, setUnreadCount, setLoading, setError]
   );

   const loadMoreNotifications = useCallback(async () => {
      // Get current state to avoid stale closure
      const currentState = useNotificationStore.getState();
      const currentNotifications = currentState.notifications;
      const currentPagination = currentState.pagination;

      if (!currentPagination || isLoadingMore || !currentPagination.hasMore) {
         return;
      }

      try {
         setIsLoadingMore(true);
         setLoadMoreError(null);
         setError(null);

         // Calculate correct offset: current number of notifications loaded
         const nextOffset = currentNotifications.length;

         const response = await notificationService.getNotifications({
            limit: currentPagination.limit,
            offset: nextOffset,
         });

         if (response.success && response.data) {
            const { notifications: rawNotifications } = response.data;
            const { pagination: newPagination } = response;

            // Filter out any malformed notifications
            const validNotifications = rawNotifications.filter((notification: any) => {
               return (
                  notification && notification.id && notification.type && notification.title && notification.message
               );
            });

            addNotifications(validNotifications);
            if (newPagination) {
               setPagination(newPagination);
            }
         } else {
            const errorMessage = response.error || 'Failed to load more notifications';
            console.error(' Load more failed:', errorMessage);
            setLoadMoreError(errorMessage);
         }
      } catch (error) {
         console.error('Error loading more notifications:', error);
         setLoadMoreError('Failed to load more notifications');
      } finally {
         setIsLoadingMore(false);
      }
   }, [isLoadingMore, addNotifications, setPagination, setError, setLoadMoreError]);

   const markAsRead = useCallback(
      async (notificationId: string) => {
         try {
            // Optimistic update
            optimisticMarkAsRead(notificationId);

            const response = await notificationService.markAsRead(notificationId);

            if (!response.success) {
               // Revert optimistic update on failure
               await loadNotifications({ limit: 20, offset: 0 });
               setError(response.error || 'Failed to mark notification as read');
            }
         } catch (error) {
            console.error('Error marking notification as read:', error);
            // Revert optimistic update
            await loadNotifications({ limit: 20, offset: 0 });
            setError('Failed to mark notification as read');
         }
      },
      [optimisticMarkAsRead, loadNotifications, setError]
   );

   const markAllAsRead = useCallback(async () => {
      try {
         // Optimistic update
         optimisticMarkAllAsRead();

         const response = await notificationService.markAllAsRead();

         if (!response.success) {
            // Revert optimistic update on failure
            await loadNotifications({ limit: 20, offset: 0 });
            setError(response.error || 'Failed to mark all notifications as read');
         }
      } catch (error) {
         console.error('Error marking all notifications as read:', error);
         // Revert optimistic update
         await loadNotifications({ limit: 20, offset: 0 });
         setError('Failed to mark all notifications as read');
      }
   }, [optimisticMarkAllAsRead, loadNotifications, setError]);

   const refresh = useCallback(async () => {
      await loadNotifications({ limit: 20, offset: 0 });
   }, [loadNotifications]);

   // Initial load
   useEffect(() => {
      loadNotifications({ limit: 20, offset: 0 });
   }, []);

   return {
      notifications,
      unreadCount,
      isLoading,
      isLoadingMore,
      error,
      loadMoreError,
      pagination,
      hasNextPage: pagination?.hasMore || false,

      loadNotifications,
      loadMoreNotifications,
      markAsRead,
      markAllAsRead,
      refresh,
   };
};

// Hook for unread notifications only
export const useUnreadNotifications = () => {
   const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

   const unreadNotifications = notifications.filter((notification) => !notification.isRead);

   return {
      unreadNotifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
   };
};

// Hook for specific notification type
export const useNotificationsByType = (type: Notification['type']) => {
   const { notifications, isLoading, error } = useNotifications();

   const filteredNotifications = notifications.filter((notification) => notification.type === type);

   return {
      notifications: filteredNotifications,
      isLoading,
      error,
   };
};
