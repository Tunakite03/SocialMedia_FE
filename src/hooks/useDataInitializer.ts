import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useCommentStore } from '@/store/commentStore';
import { notificationService } from '@/services/notificationService';

/**
 * Hook để fetch fresh data khi user authenticated
 * Thay thế localStorage persistence bằng API calls
 */
export const useDataInitializer = () => {
   const { isAuthenticated, user } = useAuthStore();
   const { clearNotifications } = useNotificationStore();
   const { clearAllComments } = useCommentStore();

   //    // Fetch notifications from server
   //    const fetchNotifications = async () => {
   //       if (!isAuthenticated || !user) return;

   //       setLoading(true);
   //       setError(null);

   //       try {
   //          const response = await notificationService.getNotifications({
   //             limit: 50, // Get recent notifications
   //          });

   //          if (response.success && response.data) {
   //             const { notifications } = response.data;

   //             setNotifications(notifications);
   //          } else {
   //             throw new Error(response.error || 'Failed to fetch notifications');
   //          }
   //       } catch (error: any) {
   //          console.error('❌ Failed to fetch notifications:', error);
   //          setError(error.message || 'Failed to fetch notifications');

   //          // Clear stale data on error
   //          clearNotifications();
   //       } finally {
   //          setLoading(false);
   //       }
   //    };

   // Initialize data when user becomes authenticated
   useEffect(() => {
      if (!isAuthenticated || !user) {
         clearNotifications();
         clearAllComments();
      } else {
         // Clear data when user logs out
         //  clearNotifications();
         //  clearAllComments();
      }
   }, [isAuthenticated, user?.id]);
};
