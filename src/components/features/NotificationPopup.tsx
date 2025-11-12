import { useEffect, useState } from 'react';
import { X, MessageCircle, Heart, MessageSquare, UserPlus, Phone, PhoneCall } from 'lucide-react';
import type { Notification } from '@/types';
import { cn } from '@/lib/utils';

interface NotificationPopupProps {
   notification: Notification;
   onClose: () => void;
   onRead: () => void;
   duration?: number; // Auto-close duration in ms
}

const NotificationPopup = ({ notification, onClose, onRead, duration = 3000 }: NotificationPopupProps) => {
   const [isVisible, setIsVisible] = useState(false);
   const [isLeaving, setIsLeaving] = useState(false);

   useEffect(() => {
      // Animate in
      const showTimer = setTimeout(() => setIsVisible(true), 100);

      // Auto-close after duration
      const hideTimer = setTimeout(() => {
         handleClose();
      }, duration);

      return () => {
         clearTimeout(showTimer);
         clearTimeout(hideTimer);
      };
   }, [duration]);

   const handleClose = () => {
      setIsLeaving(true);
      setTimeout(() => {
         onClose();
      }, 300);
   };

   const handleClick = () => {
      onRead();
      handleClose();
   };

   const getNotificationIcon = () => {
      switch (notification.type) {
         case 'REACT':
            return (
               <Heart
                  className='w-5 h-5 text-red-500'
                  fill='currentColor'
               />
            );
         case 'COMMENT':
            return <MessageSquare className='w-5 h-5 text-blue-500' />;
         case 'FOLLOW':
            return <UserPlus className='w-5 h-5 text-green-500' />;
         case 'MESSAGE':
            return <MessageCircle className='w-5 h-5 text-purple-500' />;
         case 'CALL':
            const callType = notification.metadata?.callType;
            return callType === 'VIDEO' ? (
               <PhoneCall className='w-5 h-5 text-orange-500' />
            ) : (
               <Phone className='w-5 h-5 text-blue-600' />
            );
         case 'MENTION':
            return <MessageSquare className='w-5 h-5 text-yellow-500' />;
         default:
            return <MessageCircle className='w-5 h-5 text-gray-500' />;
      }
   };

   const getNotificationColor = () => {
      switch (notification.type) {
         case 'REACT':
            return 'border-red-200 ';
         case 'COMMENT':
         case 'MENTION':
            return 'border-blue-200 ';
         case 'FOLLOW':
            return 'border-green-200 ';
         case 'MESSAGE':
            return 'border-purple-200 ';
         case 'CALL':
            return 'border-orange-200';
         default:
            return 'border-gray-200 ';
      }
   };

   return (
      <div
         className={cn(
            'fixed top-10  right-4 max-w-sm w-full z-9999 transition-all duration-300 ease-out',
            isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
         )}
      >
         <div
            className={cn(
               'card-liquid-glass-animate liquid-glass rounded-2xl backdrop-blur-3xl shadow-2xl border-l-4 cursor-pointer hover:shadow-xl transition-all duration-200',
               getNotificationColor()
            )}
            onClick={handleClick}
         >
            <div className='p-4 text-foreground'>
               {/* Content */}
               <div className='flex-1 min-w-0'>
                  <div className='flex items-start justify-between'>
                     <div className='flex items-center space-x-2'>
                        {getNotificationIcon()}
                        <p className='text-sm font-medium truncate'>{notification.title}</p>
                     </div>

                     <button
                        onClick={(e) => {
                           e.stopPropagation();
                           handleClose();
                        }}
                        className='ml-2 p-1 hover:bg-gray-100 hover:text-black rounded-full transition-colors shrink-0'
                     >
                        <X className='w-4 h-4 ' />
                     </button>
                  </div>
                  <div className='flex flex-wrap justify-between'>
                     <p className='text-sm  mt-1'>{notification.message}</p>

                     {/* Time */}
                     <p className='text-xs  mt-2'>
                        {new Date(notification?.createdAt || '').toLocaleTimeString([], {
                           hour: '2-digit',
                           minute: '2-digit',
                        })}
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default NotificationPopup;
