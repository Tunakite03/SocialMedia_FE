import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import type { Notification } from '@/types';

interface UseSocketNotificationsReturn {
   onSocketNotification: (callback: (notification: Notification) => void) => void;
}

/**
 * Hook that only triggers for notifications received from socket
 * (not for API-loaded notifications)
 */
export const useSocketNotifications = (): UseSocketNotificationsReturn => {
   const { consumeSocketNotification } = useNotificationStore();
   const callbackRef = useRef<((notification: Notification) => void) | null>(null);
   const intervalRef = useRef<number | null>(null);

   useEffect(() => {
      // Poll for new socket notifications
      const pollForNotifications = () => {
         if (!callbackRef.current) return;

         const notification = consumeSocketNotification();
         if (notification) {
            callbackRef.current(notification);
         }
      };

      // Start polling when callback is set
      if (callbackRef.current && !intervalRef.current) {
         intervalRef.current = setInterval(pollForNotifications, 100) as any as number; // Check every 100ms
      }

      // Cleanup interval when component unmounts
      return () => {
         if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
         }
      };
   }, [consumeSocketNotification]);

   const onSocketNotification = (callback: (notification: Notification) => void) => {
      callbackRef.current = callback;

      // Start polling immediately if not already started
      if (!intervalRef.current) {
         intervalRef.current = setInterval(() => {
            if (!callbackRef.current) return;

            const notification = consumeSocketNotification();
            if (notification) {
               callbackRef.current(notification);
            }
         }, 100) as any as number;
      }
   };

   return { onSocketNotification };
};
