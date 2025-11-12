import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import type { Notification } from '@/types';

interface UseNewNotificationsReturn {
   onNewNotification: (callback: (notification: Notification) => void) => void;
}

/**
 * Hook that only emits when a truly NEW notification is added to the store
 * (not when existing notifications are loaded from persistence or updated)
 */
export const useNewNotifications = (): UseNewNotificationsReturn => {
   const { notifications } = useNotificationStore();
   const prevNotificationsRef = useRef<Notification[]>([]);
   const callbackRef = useRef<((notification: Notification) => void) | null>(null);
   const isInitialized = useRef(false);

   useEffect(() => {
      // On first mount, just store current notifications without triggering callbacks
      if (!isInitialized.current) {
         prevNotificationsRef.current = [...notifications];
         isInitialized.current = true;
         return;
      }

      // Find truly NEW notifications (not in previous array)
      const prevIds = new Set(prevNotificationsRef.current.map((n) => n.id));
      const newNotifications = notifications.filter((n) => !prevIds.has(n.id));

      // Trigger callback for each new notification
      if (newNotifications.length > 0 && callbackRef.current) {
         // Process newest first (they're at the beginning of the array)
         newNotifications.forEach((notification) => {
            if (callbackRef.current) {
               callbackRef.current(notification);
            }
         });
      }

      // Update previous notifications reference
      prevNotificationsRef.current = [...notifications];
   }, [notifications]);

   const onNewNotification = (callback: (notification: Notification) => void) => {
      callbackRef.current = callback;
   };

   return { onNewNotification };
};
