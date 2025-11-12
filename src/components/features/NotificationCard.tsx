import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, UserPlus, Mail, Phone, AtSign, Check, Dot } from 'lucide-react';
import type { Notification } from '@/types';

interface NotificationCardProps {
   notification: Notification;
   onMarkAsRead?: (notificationId: string) => void;
   onNavigate?: (notification: Notification) => void;
}

const getNotificationIcon = (type: Notification['type']) => {
   const iconMap = {
      REACT: Heart,
      COMMENT: MessageCircle,
      FOLLOW: UserPlus,
      MESSAGE: Mail,
      CALL: Phone,
      MENTION: AtSign,
   };

   return iconMap[type] || MessageCircle;
};

const getNotificationColor = (type: Notification['type']) => {
   const colorMap = {
      REACT: 'text-red-500',
      COMMENT: 'text-blue-500',
      FOLLOW: 'text-green-500',
      MESSAGE: 'text-purple-500',
      CALL: 'text-orange-500',
      MENTION: 'text-yellow-500',
   };

   return colorMap[type] || 'text-gray-500';
};

const getNotificationGradient = (type: Notification['type']) => {
   const gradientMap = {
      REACT: 'from-red-500/20 to-pink-500/20',
      COMMENT: 'from-blue-500/20 to-cyan-500/20',
      FOLLOW: 'from-green-500/20 to-emerald-500/20',
      MESSAGE: 'from-purple-500/20 to-violet-500/20',
      CALL: 'from-orange-500/20 to-yellow-500/20',
      MENTION: 'from-yellow-500/20 to-amber-500/20',
   };

   return gradientMap[type] || 'from-gray-500/20 to-slate-500/20';
};

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onMarkAsRead, onNavigate }) => {
   const Icon = getNotificationIcon(notification.type);
   const iconColor = getNotificationColor(notification.type);
   const gradient = getNotificationGradient(notification.type);

   const handleClick = () => {
      if (!notification.isRead && onMarkAsRead) {
         onMarkAsRead(notification.id);
      }

      if (onNavigate) {
         onNavigate(notification);
      }
   };

   const handleMarkAsRead = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!notification.isRead && onMarkAsRead) {
         onMarkAsRead(notification.id);
      }
   };

   return (
      <div
         className={`
            relative overflow-hidden rounded-xl p-3 cursor-pointer
            transition-all duration-300 ease-out
            liquid-glass anime-hover-scale
            ${
               !notification.isRead
                  ? `bg-linear-to-r ${gradient} border-2 border-primary/30 shadow-anime-glow`
                  : 'border border-border/50'
            }
            hover:shadow-anime-card
            group
         `}
         onClick={handleClick}
      >
         {/* Unread indicator */}
         {!notification.isRead && (
            <div className='absolute top-2 right-2'>
               <Dot className='h-6 w-6 text-green-500 anime-pulse' />
            </div>
         )}

         <div className='flex items-start gap-3'>
            {/* Icon */}
            <div
               className={`
               shrink-0 flex items-center justify-center
               w-12 h-12 rounded-full
               bg-linear-to-br ${gradient}
               border border-white/20
               shadow-lg
               group-hover:scale-110 transition-transform duration-300
            `}
            >
               <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>

            {/* Content */}
            <div className='flex-1 min-w-0'>
               {/* Header */}
               <div className='flex items-center gap-2 mb-1'>
                  <img
                     src={notification.sender?.avatar || '/images/default-avatar.png'}
                     alt={notification.sender?.displayName || 'User'}
                     className='w-6 h-6 rounded-full border border-white/30'
                  />
                  <span className='font-semibold text-sm text-foreground font-anime'>
                     {notification.sender?.displayName || 'Unknown User'}
                  </span>
                  <span className='text-xs text-muted-foreground'>@{notification.sender?.username || 'unknown'}</span>
               </div>

               {/* Title and Message */}
               <p className='text-sm text-muted-foreground line-clamp-2 leading-relaxed'>{notification.message}</p>

               {/* Timestamp */}
               <div className='flex items-center justify-between mt-2'>
                  <span className='text-xs text-muted-foreground'>
                     {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>

                  {/* Mark as read button */}
                  {!notification.isRead && (
                     <button
                        onClick={handleMarkAsRead}
                        className='
                           inline-flex items-center gap-1 px-2 py-1 rounded-full
                           text-xs font-medium
                           bg-primary/10 text-primary
                           hover:bg-primary hover:text-primary-foreground
                           transition-all duration-200
                           anime-button-press
                        '
                     >
                        <Check className='h-3 w-3' />
                        Mark read
                     </button>
                  )}
               </div>
            </div>
         </div>

         {/* Hover effect overlay */}
         <div
            className='
            absolute inset-0 
            bg-linear-to-r from-primary/5 to-accent/5
            opacity-0 group-hover:opacity-100
            transition-opacity duration-300
            pointer-events-none
            rounded-xl
         '
         />
      </div>
   );
};
