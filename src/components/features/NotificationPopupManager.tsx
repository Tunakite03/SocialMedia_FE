import { useState, useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { useSocketNotifications } from '@/hooks/useSocketNotifications';
import type { Notification } from '@/types';
import NotificationPopup from '@/components/features/NotificationPopup';

interface PopupState {
   notification: Notification | null;
   id: string | null;
}

const NotificationPopupManager = () => {
   const [popupQueue, setPopupQueue] = useState<Notification[]>([]);
   const [currentPopup, setCurrentPopup] = useState<PopupState>({ notification: null, id: null });
   const { markAsRead } = useNotificationStore();

   // Hook to listen for socket notifications only
   const { onSocketNotification } = useSocketNotifications();

   // Set up listener for socket notifications
   useEffect(() => {
      onSocketNotification((newNotification) => {
         // Add to queue if there's already a popup showing
         if (currentPopup.notification) {
            setPopupQueue((prev) => [newNotification, ...prev]);
         } else {
            // Show immediately if no popup is currently showing
            setCurrentPopup({ notification: newNotification, id: newNotification.id });
         }
      });
   }, [currentPopup.notification]);

   // Process queue when current popup closes
   useEffect(() => {
      if (!currentPopup.notification && popupQueue.length > 0) {
         const nextNotification = popupQueue[0];
         setCurrentPopup({ notification: nextNotification, id: nextNotification.id });
         setPopupQueue((prev) => prev.slice(1));
      }
   }, [currentPopup.notification, popupQueue]);

   const handleClosePopup = () => {
      setCurrentPopup({ notification: null, id: null });
   };

   const handleReadNotification = () => {
      if (currentPopup.notification) {
         markAsRead(currentPopup.notification.id);
      }
      handleClosePopup();
   };

   if (!currentPopup.notification) return null;

   return (
      <NotificationPopup
         notification={currentPopup.notification}
         onClose={handleClosePopup}
         onRead={handleReadNotification}
         duration={3000} // Show for 3 seconds
      />
   );
};

export default NotificationPopupManager;
