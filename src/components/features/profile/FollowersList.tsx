import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { userService } from '@/services';
import { useAuthStore } from '@/store';
import type { User } from '@/types';

const FollowersList = () => {
   const navigate = useNavigate();
   const { user } = useAuthStore();
   const [followers, setFollowers] = useState<User[]>([]);
   const [loading, setLoading] = useState(true);
   const [scrollPosition, setScrollPosition] = useState(0);

   useEffect(() => {
      const fetchFollowers = async () => {
         if (!user?.id) return;

         try {
            const response = await userService.getUserFollowers(user.id);
            if (response.data) {
               setFollowers(response.data.followers || []);
            }
         } catch (error) {
            console.error('Failed to fetch followers:', error);
         } finally {
            setLoading(false);
         }
      };

      fetchFollowers();
   }, [user?.id]);

   const handleScroll = (direction: 'left' | 'right') => {
      const container = document.getElementById('followers-scroll');
      if (!container) return;

      const scrollAmount = 200;
      const newPosition =
         direction === 'left'
            ? Math.max(0, scrollPosition - scrollAmount)
            : Math.min(container.scrollWidth - container.clientWidth, scrollPosition + scrollAmount);

      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
   };

   const handleUserClick = (userId: string) => {
      navigate(`/profile/${userId}`);
   };

   if (loading) {
      return (
         <div className='bg-card rounded-lg shadow-sm p-4 border border-border mb-4'>
            <div className='flex items-center gap-2 mb-3'>
               <Users className='w-4 h-4 text-muted-foreground' />
               <h2 className='text-sm font-semibold text-card-foreground'>Followers</h2>
            </div>
            <div className='flex gap-2 overflow-hidden'>
               {[1, 2, 3, 4, 5].map((i) => (
                  <div
                     key={i}
                     className='flex-shrink-0 w-14'
                  >
                     <div className='w-14 h-14 bg-muted rounded-full animate-pulse' />
                  </div>
               ))}
            </div>
         </div>
      );
   }

   if (followers.length === 0) {
      return (
         <div className='bg-card rounded-lg shadow-sm p-4 border border-border mb-4'>
            <div className='flex items-center gap-2 mb-3'>
               <Users className='w-4 h-4 text-muted-foreground' />
               <h2 className='text-sm font-semibold text-card-foreground'>Followers</h2>
            </div>
            <p className='text-sm text-muted-foreground text-center py-2'>No followers yet</p>
         </div>
      );
   }

   const showNavigation = followers.length > 5;

   return (
      <div className='bg-card rounded-lg shadow-sm p-4 border border-border mb-4 anime-fade-in'>
         <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center gap-2'>
               <Users className='w-4 h-4 text-primary' />
               <h2 className='text-sm font-semibold text-card-foreground'>Followers</h2>
               <span className='text-xs text-muted-foreground'>({followers.length})</span>
            </div>

            {showNavigation && (
               <div className='flex gap-1'>
                  <button
                     onClick={() => handleScroll('left')}
                     className='p-1 rounded-full hover:bg-muted transition-colors disabled:opacity-30'
                     disabled={scrollPosition === 0}
                     aria-label='Scroll left'
                  >
                     <ChevronLeft className='w-4 h-4' />
                  </button>
                  <button
                     onClick={() => handleScroll('right')}
                     className='p-1 rounded-full hover:bg-muted transition-colors disabled:opacity-30'
                     aria-label='Scroll right'
                  >
                     <ChevronRight className='w-4 h-4' />
                  </button>
               </div>
            )}
         </div>

         <div
            id='followers-scroll'
            className='flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth'
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
         >
            {followers.map((follower, index) => (
               <div
                  key={follower.id}
                  onClick={() => handleUserClick(follower.id)}
                  className='flex-shrink-0 w-16 cursor-pointer group anime-fade-in'
                  style={{ animationDelay: `${index * 50}ms` }}
               >
                  <div className='relative mb-1'>
                     <div className='w-16 h-16 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-colors'>
                        {follower.avatar ? (
                           <img
                              src={follower.avatar}
                              alt={follower.username}
                              className='w-full h-full object-cover'
                           />
                        ) : (
                           <div className='w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-foreground font-semibold text-lg'>
                              {follower.username.charAt(0).toUpperCase()}
                           </div>
                        )}
                     </div>
                     {/* Online indicator - optional */}
                     {/* <div className='absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-card' /> */}
                  </div>
                  <p className='text-xs text-center text-card-foreground truncate group-hover:text-primary transition-colors'>
                     {follower.username}
                  </p>
               </div>
            ))}
         </div>

        
      </div>
   );
};

export default FollowersList;
