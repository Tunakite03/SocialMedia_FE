import { useNavigate } from 'react-router-dom';
import InstagramLayout from '@/components/layout/InstagramLayout';
import { NotificationList } from '@/components/features/NotificationList';
import { ConnectionStatus } from '@/components/providers/SocketNotificationProvider';
import { useSocketNotification } from '@/components/providers/SocketNotificationProvider';
import type { Notification } from '@/types';

const ActivityPage = () => {
   const navigate = useNavigate();
   const { isConnected, connectionStatus, onlineUsers } = useSocketNotification();

   const handleNotificationNavigate = (notification: Notification) => {
      // Navigate based on notification type and metadata
      switch (notification.type) {
         case 'LIKE':
         case 'COMMENT':
            if (notification.metadata?.postId) {
               navigate(`/posts/${notification.metadata.postId}`);
            }
            break;
         case 'FOLLOW':
            navigate(`/profile/${notification.sender.username}`);
            break;
         case 'MESSAGE':
            navigate(`/chat`);
            break;
         case 'CALL':
            // Handle call navigation if needed
            navigate('/chat');
            break;
         case 'MENTION':
            if (notification.metadata?.postId) {
               navigate(`/posts/${notification.metadata.postId}`);
            } else if (notification.metadata?.commentId) {
               navigate(`/posts/${notification.metadata.postId}#comment-${notification.metadata.commentId}`);
            }
            break;
         default:
            console.log('Unknown notification type:', notification.type);
      }
   };

   return (
      <InstagramLayout>
         <div className='p-4 anime-slide-in-bottom'>
            {/* Connection Status Header */}
            <div className='mb-4 p-3 card-liquid-glass-blue rounded-lg'>
               <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                     <h1 className='text-xl font-semibold font-anime text-foreground'>Activity</h1>
                     <ConnectionStatus />
                  </div>

                  <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                     <span>
                        {onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''} online
                     </span>
                     {isConnected && (
                        <div className='flex items-center gap-2'>
                           <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
                           <span className='text-green-600 font-medium'>Real-time</span>
                        </div>
                     )}
                  </div>
               </div>

               {connectionStatus !== 'connected' && (
                  <div className='mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md'>
                     <p className='text-sm text-yellow-700 dark:text-yellow-300'>
                        {connectionStatus === 'connecting'
                           ? 'Connecting to real-time notifications...'
                           : connectionStatus === 'error'
                           ? 'Failed to connect to real-time notifications. Some features may be limited.'
                           : 'Not connected to real-time notifications.'}
                     </p>
                  </div>
               )}
            </div>

            {/* Notifications */}
            <NotificationList
               onNavigate={handleNotificationNavigate}
               className='min-h-[600px]'
               maxHeight='max-h-[calc(90vh-200px)] lg:max-h-[calc(100vh-200px)]'
            />
         </div>
      </InstagramLayout>
   );
};

export default ActivityPage;
