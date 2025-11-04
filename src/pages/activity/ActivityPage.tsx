import InstagramLayout from '@/components/layout/InstagramLayout';
import { Heart, MessageCircle, UserPlus } from 'lucide-react';

const ActivityPage = () => {
   const activities = [
      {
         id: '1',
         type: 'like',
         user: 'john_doe',
         avatar: '/api/placeholder/40/40',
         action: 'liked your photo',
         timestamp: '2m',
         postImage: '/api/placeholder/40/40',
      },
      {
         id: '2',
         type: 'comment',
         user: 'jane_smith',
         avatar: '/api/placeholder/40/40',
         action: 'commented: "Amazing shot! 📸"',
         timestamp: '5m',
         postImage: '/api/placeholder/40/40',
      },
      {
         id: '3',
         type: 'follow',
         user: 'travel_lover',
         avatar: '/api/placeholder/40/40',
         action: 'started following you',
         timestamp: '1h',
         postImage: null,
      },
      {
         id: '4',
         type: 'like',
         user: 'photographer_pro',
         avatar: '/api/placeholder/40/40',
         action: 'liked your photo',
         timestamp: '2h',
         postImage: '/api/placeholder/40/40',
      },
   ];

   const getActivityIcon = (type: string) => {
      switch (type) {
         case 'like':
            return (
               <Heart
                  size={16}
                  className='text-red-500 fill-red-500'
               />
            );
         case 'comment':
            return (
               <MessageCircle
                  size={16}
                  className='text-blue-500'
               />
            );
         case 'follow':
            return (
               <UserPlus
                  size={16}
                  className='text-green-500'
               />
            );
         default:
            return null;
      }
   };

   return (
      <InstagramLayout>
         <div className='p-4'>
            <h1 className='text-xl font-bold mb-6'>Activity</h1>

            <div className='space-y-4'>
               {activities.map((activity) => (
                  <div
                     key={activity.id}
                     className='flex items-center space-x-3 py-2'
                  >
                     <div className='relative'>
                        <div className='w-10 h-10 rounded-full bg-gray-200 overflow-hidden'>
                           <img
                              src={activity.avatar}
                              alt={activity.user}
                              className='w-full h-full object-cover'
                              onError={(e) => {
                                 const target = e.target as HTMLImageElement;
                                 target.style.display = 'none';
                                 target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm">${activity.user
                                    .charAt(0)
                                    .toUpperCase()}</div>`;
                              }}
                           />
                        </div>
                        <div className='absolute -bottom-1 -right-1 bg-white rounded-full p-1'>
                           {getActivityIcon(activity.type)}
                        </div>
                     </div>

                     <div className='flex-1'>
                        <p className='text-sm'>
                           <span className='font-semibold'>{activity.user}</span> {activity.action}
                        </p>
                        <p className='text-xs text-gray-500'>{activity.timestamp}</p>
                     </div>

                     {activity.postImage && (
                        <div className='w-10 h-10 rounded bg-gray-200 overflow-hidden'>
                           <img
                              src={activity.postImage}
                              alt='Post'
                              className='w-full h-full object-cover'
                              onError={(e) => {
                                 const target = e.target as HTMLImageElement;
                                 target.style.display = 'none';
                                 target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-300"></div>`;
                              }}
                           />
                        </div>
                     )}

                     {activity.type === 'follow' && (
                        <button className='bg-blue-500 text-white px-4 py-1 rounded text-sm font-semibold hover:bg-blue-600 transition-colors'>
                           Follow Back
                        </button>
                     )}
                  </div>
               ))}
            </div>
         </div>
      </InstagramLayout>
   );
};

export default ActivityPage;
