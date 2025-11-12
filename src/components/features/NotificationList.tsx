import React, { useEffect, useRef, useCallback } from 'react';
import { Bell, BellOff, CheckCheck, Loader2, RefreshCw } from 'lucide-react';
import { NotificationCard } from './NotificationCard';
import { useNotifications } from '@/hooks';
import type { Notification } from '@/types';

interface NotificationListProps {
   className?: string;
   onNavigate?: (notification: Notification) => void;
   showHeader?: boolean;
   maxHeight?: string;
}

export const NotificationList: React.FC<NotificationListProps> = ({
   className = '',
   onNavigate,
   showHeader = true,
   maxHeight = 'max-h-[600px]',
}) => {
   const {
      notifications,
      unreadCount,
      isLoading,
      isLoadingMore,
      error,
      loadMoreError,
      hasNextPage,
      loadMoreNotifications,
      markAsRead,
      markAllAsRead,
      refresh,
   } = useNotifications();

   const observerRef = useRef<HTMLDivElement>(null);

   // Infinite scroll implementation
   const handleObserver = useCallback(
      (entries: IntersectionObserverEntry[]) => {
         const [target] = entries;

         if (target.isIntersecting && hasNextPage && !isLoading && !isLoadingMore) {
            loadMoreNotifications();
         }
      },
      [hasNextPage, isLoadingMore, loadMoreNotifications]
   );

   useEffect(() => {
      const element = observerRef.current;
      if (!element) return;

      const observer = new IntersectionObserver(handleObserver, {
         threshold: 0.1,
         rootMargin: '20px', // Trigger a bit before the element is fully visible
      });

      observer.observe(element);

      return () => {
         observer.unobserve(element);
         observer.disconnect();
      };
   }, [handleObserver]);

   const handleMarkAllAsRead = async () => {
      try {
         await markAllAsRead();
      } catch (error) {
         console.error('Failed to mark all as read:', error);
      }
   };

   const handleRefresh = async () => {
      try {
         await refresh();
      } catch (error) {
         console.error('Failed to refresh notifications:', error);
      }
   };

   if (error) {
      return (
         <div className={`card-liquid-glass text-center ${className}`}>
            <BellOff className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
            <h3 className='font-semibold text-foreground mb-2 font-anime'>Failed to load notifications</h3>
            <p className='text-sm text-muted-foreground mb-4'>{error}</p>
            <button
               onClick={handleRefresh}
               className='btn-anime-primary inline-flex items-center gap-2'
               disabled={isLoading}
            >
               <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
               Try again
            </button>
         </div>
      );
   }

   return (
      <div className={`liquid-glass p-2 md:p-4 ${className}`}>
         {/* Header */}
         {showHeader && (
            <div className='flex items-center justify-between p-4 border-b border-border/50'>
               <div className='flex items-center gap-3'>
                  <Bell className='h-5 w-5 text-primary' />
                  <h2 className='text-lg font-semibold text-foreground font-anime'>Notifications</h2>
                  {unreadCount > 0 && (
                     <span className='inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary rounded-full anime-pulse'>
                        {unreadCount}
                     </span>
                  )}
               </div>

               <div className='flex items-center gap-2'>
                  <button
                     onClick={handleRefresh}
                     disabled={isLoading}
                     className='p-2 rounded-lg hover:bg-muted transition-colors anime-button-press'
                     title='Refresh notifications'
                  >
                     <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>

                  {unreadCount > 0 && (
                     <button
                        onClick={handleMarkAllAsRead}
                        className='inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground rounded-lg transition-all duration-200 anime-button-press'
                        title='Mark all as read'
                     >
                        <CheckCheck className='h-3 w-3' />
                        Mark all read
                     </button>
                  )}
               </div>
            </div>
         )}

         {/* Notifications List */}
         <div className={`${maxHeight} overflow-y-auto custom-scrollbar`}>
            {notifications.length === 0 && !isLoading ? (
               <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
                  <Bell className='h-16 w-16 text-muted-foreground mb-4 opacity-50' />
                  <h3 className='text-lg font-semibold text-foreground mb-2 font-anime'>No notifications yet</h3>
                  <p className='text-sm text-muted-foreground max-w-sm'>
                     When someone likes your posts, follows you, or sends you a message, you'll see their notifications
                     here.
                  </p>
               </div>
            ) : (
               <div className='p-4 space-y-2'>
                  {notifications.map((notification) => (
                     <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onNavigate={onNavigate}
                     />
                  ))}

                  {/* Infinite scroll trigger */}
                  <div
                     ref={observerRef}
                     className='h-4'
                  ></div>

                  {/* Loading more indicator */}
                  {isLoadingMore && (
                     <div className='flex items-center justify-center py-4'>
                        <Loader2 className='h-5 w-5 animate-spin text-primary' />
                        <span className='ml-2 text-sm text-muted-foreground'>Loading more notifications...</span>
                     </div>
                  )}

                  {/* Load more error */}
                  {loadMoreError && (
                     <div className='flex items-center justify-center py-4'>
                        <div className='text-center'>
                           <p className='text-sm text-red-500 mb-2'>{loadMoreError}</p>
                           <button
                              onClick={loadMoreNotifications}
                              className='btn-anime-secondary text-xs'
                           >
                              Try Again
                           </button>
                        </div>
                     </div>
                  )}

                  {/* Initial loading indicator */}
                  {isLoading && notifications.length === 0 && (
                     <div className='flex items-center justify-center py-8'>
                        <Loader2 className='h-6 w-6 animate-spin text-primary' />
                        <span className='ml-2 text-sm text-muted-foreground'>Loading notifications...</span>
                     </div>
                  )}

                  {/* Load more button fallback */}
                  {hasNextPage && !isLoadingMore && !loadMoreError && (
                     <div className='text-center py-4'>
                        <button
                           onClick={loadMoreNotifications}
                           disabled={isLoadingMore}
                           className='btn-anime-secondary inline-flex items-center gap-2'
                        >
                           <Loader2 className={`h-4 w-4 ${isLoadingMore ? 'animate-spin' : 'hidden'}`} />
                           Load More Notifications
                        </button>
                     </div>
                  )}

                  {/* End of list indicator */}
                  {!hasNextPage && notifications.length > 0 && !isLoadingMore && (
                     <div className='text-center py-6'>
                        <p className='text-sm text-muted-foreground'>You've reached the end of your notifications</p>
                     </div>
                  )}
               </div>
            )}
         </div>
      </div>
   );
};
