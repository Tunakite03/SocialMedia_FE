import { useNavigate } from 'react-router-dom';
import InstagramLayout from '@/components/layout/InstagramLayout';
import { NotificationList } from '@/components/features/NotificationList';
import type { Notification } from '@/types';

const ActivityPage = () => {
   const navigate = useNavigate();

   const handleNotificationNavigate = (notification: Notification) => {
      // Navigate based on notification type and metadata
      switch (notification.type) {
         case 'REACT':
         case 'COMMENT':
            if (notification.metadata?.postId) {
               navigate(`/posts/${notification.metadata.postId}`);
            }
            break;
         case 'FOLLOW':
            navigate(`/profile/${notification.sender?.id || ''}`);
            break;
         case 'MESSAGE':
            navigate(`/chat/${notification.metadata?.conversationId || ''}`);
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
         <div className='md:p-4 anime-slide-in-bottom'>
            {/* Notifications */}
            <NotificationList
               onNavigate={handleNotificationNavigate}
               className='min-h-[600px]'
               maxHeight='max-h-[calc(90vh-150px)] lg:max-h-[calc(100vh-200px)]'
            />
         </div>
      </InstagramLayout>
   );
};

export default ActivityPage;
