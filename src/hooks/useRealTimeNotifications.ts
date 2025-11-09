import { useCallback, useEffect, useState } from 'react';
import { useNotifications } from './useNotifications';
import { useSocketNotification } from '@/components/providers/SocketNotificationProvider';
import { useAuthStore } from '@/store';
import type { Notification } from '@/types';

interface UseRealTimeNotificationsReturn {
   // From useNotifications
   notifications: Notification[];
   unreadCount: number;
   isLoading: boolean;
   isLoadingMore: boolean;
   error: string | null;
   loadMoreError: string | null;
   hasNextPage: boolean;
   loadNotifications: (params?: { limit?: number; offset?: number }) => Promise<void>;
   loadMoreNotifications: () => Promise<void>;
   markAsRead: (notificationId: string) => Promise<void>;
   markAllAsRead: () => Promise<void>;
   refresh: () => Promise<void>;

   // From useSocketNotification
   isConnected: boolean;
   connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
   onlineUsers: Array<{
      id: string;
      username: string;
      displayName: string;
      avatar: string | null;
      lastSeen: string;
   }>;
   sendNotification: (
      receiverId: string,
      type: string,
      message: string,
      entityId?: string,
      entityType?: string
   ) => void;

   // Enhanced features
   totalNotificationCount: number;
   isRealTimeActive: boolean;
   lastSyncTime: Date | null;

   // Real-time operations
   sendLikeNotification: (receiverId: string, postId: string, postTitle?: string) => void;
   sendCommentNotification: (receiverId: string, postId: string, commentContent: string) => void;
   sendFollowNotification: (receiverId: string) => void;
   sendMessageNotification: (receiverId: string, messagePreview: string) => void;
   sendMentionNotification: (receiverId: string, entityId: string, entityType: 'post' | 'comment') => void;
}

/**
 * Comprehensive hook that combines REST API notifications with real-time Socket.IO functionality.
 * Provides a single interface for all notification operations.
 */
export const useRealTimeNotifications = (): UseRealTimeNotificationsReturn => {
   const { user } = useAuthStore();
   const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

   // REST API notifications
   const {
      notifications,
      unreadCount,
      isLoading,
      isLoadingMore,
      error,
      loadMoreError,
      hasNextPage,
      loadNotifications,
      loadMoreNotifications,
      markAsRead,
      markAllAsRead,
      refresh,
   } = useNotifications();

   // Socket.IO real-time functionality
   const { isConnected, connectionStatus, onlineUsers, sendNotification } = useSocketNotification();

   // Calculate total notifications (including read ones)
   const totalNotificationCount = notifications.length;
   const isRealTimeActive = isConnected && connectionStatus === 'connected';

   // Update sync time when notifications are loaded
   useEffect(() => {
      if (!isLoading && notifications.length > 0) {
         setLastSyncTime(new Date());
      }
   }, [isLoading, notifications.length]);

   // Enhanced notification sending methods
   const sendLikeNotification = useCallback(
      (receiverId: string, postId: string, postTitle?: string) => {
         if (!user || receiverId === user.id) return; // Don't send to self

         const message = postTitle
            ? `liked your post "${postTitle.substring(0, 50)}${postTitle.length > 50 ? '...' : ''}"`
            : 'liked your post';

         sendNotification(receiverId, 'LIKE', message, postId, 'post');
      },
      [user, sendNotification]
   );

   const sendCommentNotification = useCallback(
      (receiverId: string, postId: string, commentContent: string) => {
         if (!user || receiverId === user.id) return; // Don't send to self

         const preview = commentContent.substring(0, 50) + (commentContent.length > 50 ? '...' : '');
         const message = `commented on your post: "${preview}"`;

         sendNotification(receiverId, 'COMMENT', message, postId, 'post');
      },
      [user, sendNotification]
   );

   const sendFollowNotification = useCallback(
      (receiverId: string) => {
         if (!user || receiverId === user.id) return; // Don't send to self

         const message = `started following you`;
         sendNotification(receiverId, 'FOLLOW', message, user.id, 'user');
      },
      [user, sendNotification]
   );

   const sendMessageNotification = useCallback(
      (receiverId: string, messagePreview: string) => {
         if (!user || receiverId === user.id) return; // Don't send to self

         const preview = messagePreview.substring(0, 50) + (messagePreview.length > 50 ? '...' : '');
         const message = `sent you a message: "${preview}"`;

         sendNotification(receiverId, 'MESSAGE', message);
      },
      [user, sendNotification]
   );

   const sendMentionNotification = useCallback(
      (receiverId: string, entityId: string, entityType: 'post' | 'comment') => {
         if (!user || receiverId === user.id) return; // Don't send to self

         const message = entityType === 'post' ? 'mentioned you in a post' : 'mentioned you in a comment';

         sendNotification(receiverId, 'MENTION', message, entityId, entityType);
      },
      [user, sendNotification]
   );

   // Auto-refresh notifications when connection is restored
   useEffect(() => {
      if (isRealTimeActive && lastSyncTime) {
         const timeSinceLastSync = Date.now() - lastSyncTime.getTime();

         // If it's been more than 5 minutes since last sync, refresh
         if (timeSinceLastSync > 5 * 60 * 1000) {
            console.log('🔄 Connection restored, refreshing notifications...');
            refresh();
         }
      }
   }, [isRealTimeActive, lastSyncTime, refresh]);

   return {
      // REST API data and methods
      notifications,
      unreadCount,
      isLoading,
      isLoadingMore,
      error,
      loadMoreError,
      hasNextPage,
      loadNotifications,
      loadMoreNotifications,
      markAsRead,
      markAllAsRead,
      refresh,

      // Socket.IO data and methods
      isConnected,
      connectionStatus,
      onlineUsers,
      sendNotification,

      // Enhanced features
      totalNotificationCount,
      isRealTimeActive,
      lastSyncTime,

      // Convenience methods
      sendLikeNotification,
      sendCommentNotification,
      sendFollowNotification,
      sendMessageNotification,
      sendMentionNotification,
   };
};
