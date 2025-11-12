import React from 'react';
import { Bell, BellOff, Wifi, WifiOff } from 'lucide-react';
import { useUnreadCount } from '@/store/notificationStore';
import { useSocketNotification } from '@/contexts/SocketNotificationProvider';

interface NotificationBadgeProps {
   className?: string;
   showIcon?: boolean;
   showConnectionStatus?: boolean;
   size?: 'sm' | 'md' | 'lg';
   onClick?: () => void;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
   className = '',
   showIcon = true,
   showConnectionStatus = false,
   size = 'md',
   onClick,
}) => {
   const unreadCount = useUnreadCount();
   const { isConnected, connectionStatus } = useSocketNotification();

   const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
   };

   const badgeSizeClasses = {
      sm: 'h-3 w-3 text-[9px]',
      md: 'h-4 w-4 text-[10px]',
      lg: 'h-5 w-5 text-xs',
   };

   const getIconColor = () => {
      if (!isConnected) return 'text-muted-foreground';
      if (unreadCount > 0) return 'text-primary';
      return 'text-foreground';
   };

   const getConnectionIcon = () => {
      if (connectionStatus === 'connected') return <Wifi className='h-3 w-3 text-green-500' />;
      if (connectionStatus === 'connecting') return <Wifi className='h-3 w-3 text-yellow-500 animate-pulse' />;
      return <WifiOff className='h-3 w-3 text-red-500' />;
   };

   return (
      <div
         className={`relative inline-flex items-center gap-2 cursor-pointer ${className}`}
         onClick={onClick}
         title={`${unreadCount} unread notifications${showConnectionStatus ? ` • ${connectionStatus}` : ''}`}
      >
         {showIcon && (
            <div className='relative'>
               {isConnected ? (
                  <Bell
                     className={`${
                        sizeClasses[size]
                     } ${getIconColor()} transition-all duration-200 hover:text-primary animate-bell-ring`}
                  />
               ) : (
                  <BellOff className={`${sizeClasses[size]} ${getIconColor()} transition-colors`} />
               )}

               {/* Unread count badge */}
               {unreadCount > 0 && (
                  <span
                     className={`
                        absolute -top-1 -right-1
                        ${badgeSizeClasses[size]}
                        bg-primary text-primary-foreground
                        rounded-full
                        flex items-center justify-center
                        font-bold leading-none
                        min-w-fit px-1
                        shadow-lg
                        ${unreadCount > 0 ? 'animate-bounce' : ''}
                        anime-pulse
                     `}
                  >
                     {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
               )}

               {/* Real-time indicator */}
               {isConnected && (
                  <span
                     className='absolute -bottom-1 -right-1 h-2 w-2 bg-green-400 rounded-full animate-pulse shadow-sm'
                     title='Real-time notifications active'
                  />
               )}
            </div>
         )}

         {/* Connection status indicator */}
         {showConnectionStatus && <div className='flex items-center'>{getConnectionIcon()}</div>}
      </div>
   );
};
