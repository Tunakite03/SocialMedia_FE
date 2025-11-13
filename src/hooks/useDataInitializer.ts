import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useCommentStore } from '@/store/commentStore';

export const useDataInitializer = () => {
   const { isAuthenticated, user } = useAuthStore();
   const { clearNotifications } = useNotificationStore();
   const { clearAllComments } = useCommentStore();

   // Initialize data when user becomes authenticated
   useEffect(() => {
      if (!isAuthenticated || !user) {
         clearNotifications();
         clearAllComments();
      }
   }, [isAuthenticated, user?.id]);
};
